"""Agent 测评 + badcase 采集脚本。

跑一组覆盖各类问法的测试题，批量过 run_chat，把答案落到 markdown 供人审，
并按我们定下的「回答规则」做启发式自动标记，把可疑 badcase 顶到报告最前面。

规则来源（见 chat_agent._write_final_answer 的 system prompt）：
- 简短（≤ ~400 字，3 个要点内）
- 配 emoji 图标
- 绝不出现 @handle / 推特用户名
- 不出现互动数字（赞/转发/浏览量）
- 不提数据库/检索/数据截止等技术元信息
- 不编造、空答

跑法：
    python eval_agent.py            # 跑全量（较慢、烧 API，约每题 30-60s）
    python eval_agent.py --quick    # 只跑每类第一题，快速冒烟
    python eval_agent.py --only 动态 # 只跑某一类
"""
from __future__ import annotations

import argparse
import re
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from chat_agent import run_chat  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


# —— 测试题集 ——
# multi: 可选的前置对话历史（[{role, content}, ...]），用来测多轮追问。
# 故意覆盖：定义类(不该查库)、动态类、趋势类、人物类、刁钻/诱导编造、多轮追问。
QUESTIONS: list[dict] = [
    # 定义类——应直接用知识回答，不查库
    {"id": "def-1", "cat": "定义", "q": "什么是 MCP（Model Context Protocol）？"},
    {"id": "def-2", "cat": "定义", "q": "RAG 和微调有什么区别？"},
    {"id": "def-3", "cat": "定义", "q": "Claude Code 是什么，怎么用？"},
    # 动态类——应查库，给近期真实动态
    {"id": "dyn-1", "cat": "动态", "q": "最近 OpenAI 有什么新动态？"},
    {"id": "dyn-2", "cat": "动态", "q": "Claude Code 最近有什么新进展？"},
    {"id": "dyn-3", "cat": "动态", "q": "Anthropic 最近在忙什么？"},
    # 趋势/热度类——需综合多账号多天
    {"id": "trend-1", "cat": "趋势", "q": "最近 AI 编程工具这块大家讨论得怎么样？"},
    {"id": "trend-2", "cat": "趋势", "q": "AI agent 框架最近有什么值得关注的？"},
    # 人物动态——注意输出不该暴露 @handle
    {"id": "ppl-1", "cat": "人物", "q": "马斯克最近说了什么跟 AI 有关的？"},
    {"id": "ppl-2", "cat": "人物", "q": "Sam Altman 最近有什么动作？"},
    # 刁钻 / 容易诱导编造
    {"id": "edge-1", "cat": "刁钻", "q": "谷歌昨天发布的那个新模型参数量是多少？"},  # 可能无据，应不编造
    {"id": "edge-2", "cat": "刁钻", "q": "最近有什么我大概率没听过但值得关注的小众 AI 项目？"},
    # 多轮追问——验证上下文
    {
        "id": "multi-1", "cat": "多轮",
        "multi": [
            {"role": "user", "content": "Claude Code 最近有什么新进展？"},
            {"role": "assistant", "content": "🚀 Claude Code 最近主推 Dynamic Workflows，能自动拆解复杂任务、编排多个子代理并行执行与交叉审查。"},
        ],
        "q": "第一个能再具体讲讲吗？它解决了什么问题？",
    },
]


# —— 启发式 badcase 标记 ——
_AT_RE = re.compile(r"@[A-Za-z0-9_]{2,}")            # @handle
# 只匹配「互动数字」（赞/转发/浏览这类指标），不误伤正文里的金额/GDP 等「X万美元」。
# v2：去掉了裸的「万/w」——它们会把 200万美元、500万亿 GDP 这类正文数字也标成 badcase。
_NUM_RE = re.compile(r"\d[\d,\.]*\s*万?\s*(赞|转发|转推|点赞|浏览|阅读|likes?|retweets?|views?)", re.I)
# 只匹配「泄露我们自己 pipeline」的措辞，不误伤解释 MCP 时正常提到的「数据库」等通用词。
# v2：去掉了裸的「数据库/检索/向量」——它们在解释外部概念时是合法用词。
_META_RE = re.compile(r"(推文库|本地数据|数据截止|爬取|我.{0,3}检索|从.{0,4}库里|向量检索)")


def flag_answer(q: dict, answer: str) -> list[str]:
    flags: list[str] = []
    a = answer or ""
    if not a.strip():
        flags.append("空答")
        return flags
    if a.startswith("出错") or "（轮数用尽" in a:
        flags.append("报错/未完成")
    if _AT_RE.search(a):
        flags.append("出现@handle")
    if _NUM_RE.search(a):
        flags.append("出现互动数字")
    if _META_RE.search(a):
        flags.append("提到技术元信息")
    if len(a) > 450:
        flags.append(f"偏长({len(a)}字)")
    # 动态/趋势/人物类期望带 emoji 图标
    if q["cat"] in ("动态", "趋势", "人物", "多轮"):
        if not re.search(r"[\U0001F000-\U0001FAFF☀-➿]", a):
            flags.append("缺图标")
    return flags


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true", help="每类只跑第一题")
    ap.add_argument("--only", default="", help="只跑某一类（定义/动态/趋势/人物/刁钻/多轮）")
    args = ap.parse_args()

    qs = QUESTIONS
    if args.only:
        qs = [q for q in qs if q["cat"] == args.only]
    if args.quick:
        seen, picked = set(), []
        for q in qs:
            if q["cat"] not in seen:
                seen.add(q["cat"])
                picked.append(q)
        qs = picked

    print(f"开始测评，共 {len(qs)} 题…\n")
    results = []
    for i, q in enumerate(qs, 1):
        print(f"[{i}/{len(qs)}] ({q['cat']}) {q['q']}")
        t0 = time.time()
        try:
            ans = run_chat(q["q"], history=q.get("multi"))
        except Exception as e:
            ans = f"出错：{e}"
        dt = round(time.time() - t0, 1)
        flags = flag_answer(q, ans)
        results.append({**q, "answer": ans, "secs": dt, "flags": flags})
        tag = "⚠️ " + "/".join(flags) if flags else "✅ ok"
        print(f"    {dt}s  {tag}\n")

    # —— 写报告：badcase 顶在前面 ——
    flagged = [r for r in results if r["flags"]]
    clean = [r for r in results if not r["flags"]]
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    out = Path(__file__).parent / f"eval_report_{ts}.md"
    lines = [
        f"# Agent 测评报告 {ts}",
        f"\n共 {len(results)} 题，⚠️ 疑似 badcase **{len(flagged)}** 题，✅ ok {len(clean)} 题。\n",
        "> 标记是启发式自动判的，仅供快速定位，最终好坏人工审。\n",
    ]
    for title, group in (("⚠️ 疑似 badcase", flagged), ("✅ 通过", clean)):
        if not group:
            continue
        lines.append(f"\n## {title}\n")
        for r in group:
            flagstr = ("  `" + " · ".join(r["flags"]) + "`") if r["flags"] else ""
            lines.append(f"### [{r['cat']}] {r['q']}{flagstr}")
            if r.get("multi"):
                lines.append(f"_（多轮，前置：{r['multi'][-2]['content'][:40]}…）_")
            lines.append(f"\n{r['answer']}\n\n_({r['secs']}s)_\n")

    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n报告已写入：{out.name}")
    print(f"疑似 badcase {len(flagged)}/{len(results)}：")
    for r in flagged:
        print(f"  - [{r['cat']}] {r['q'][:30]} → {'/'.join(r['flags'])}")


if __name__ == "__main__":
    main()
