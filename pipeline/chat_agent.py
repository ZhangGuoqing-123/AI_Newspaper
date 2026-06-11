"""对话式情报助手 —— DeepSeek Function Calling + while 循环 + 工具体系。

向量检索已迁移至 Supabase pgvector（原 Chroma 已移除），
search_by_topic 直接查 Supabase，架构与推文存储统一。

跑法：
    python chat_agent.py
"""
from __future__ import annotations

import sys
import os
import json
import re as _re
from pathlib import Path
from contextvars import ContextVar
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

CST = timezone(timedelta(hours=8))

# server.py 在工作线程里设置这个钩子，把"工具调用过程"接到 SSE 推送 / 前端弹卡上；
# 命令行模式下钩子为空，行为和原来完全一样。
_tool_event_hook: ContextVar = ContextVar("tool_event_hook", default=None)

sys.path.insert(0, str(Path(__file__).parent))
from parse_tweets import Tweet  # noqa: E402  （Tweet 仍被 _tw_to_tweet / auto_crawl 复用）
from llm import deepseek  # noqa: E402
from user_memory import load_profile, profile_to_str, update_profile  # noqa: E402
from supabase_vector import (  # noqa: E402
    search_pgvector,
    count_indexed,
    rpc_search_tweets,
    rpc_tweet_stats,
    get_date_range,
)

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# 推文数据已全部在 Supabase（tweets + tweet_embeddings）。检索/统计直接查云端，
# 不再开机从本机硬盘读 29 天 txt——那条本地路径在部署环境里不存在，是对外上线的硬伤。
#
# ALL_TWEETS 保留为进程级内存缓存：起始为空，auto_crawl 每日巡检时把当天新抓的推文
# extend 进来（仅作 server /health 计数与巡检内去重之用，真正的去重由 tweets 表的
# on_conflict 唯一约束兜底）。检索不再依赖它。
ALL_TWEETS: list[Tweet] = []

DATA_START, DATA_END = get_date_range()


def _ensure_pgvector_index() -> None:
    count = count_indexed()
    if count < 0:
        print("[pgvector] ⚠️  tweet_embeddings 表不存在，search_by_topic 暂时不可用")
        print("[pgvector]    → 请在 Supabase SQL 编辑器运行 pgvector_schema.sql，再跑 embed_to_supabase.py")
    elif count == 0:
        print("[pgvector] 向量索引为空——请运行 embed_to_supabase.py 迁移 embedding")
    else:
        print(f"[pgvector] 向量索引已就绪（{count} 条）")


_ensure_pgvector_index()


def search_by_topic(topic: str, top_k: int = 15) -> list[dict]:
    """跨全量推文的语义话题检索：用 BAAI/bge-m3 向量相似度，找出和某个话题相关的推文，
    能覆盖措辞不同但讲同一件事的内容（适合"最近 XX 这块讨论得怎么样"这类跨天趋势类问题）。"""
    return search_pgvector(topic, top_k=top_k)


def get_stats(keyword: str = "", account: str = "", date: str = "", top_n: int = 5) -> dict:
    """互动数据统计：在符合条件的推文里，按点赞/转发/回复/浏览汇总，并给出最火的几条。
    用于从一堆讨论里挑出真正重要、而不是随手一提的内容（过滤"虚高转发"等噪声）。
    汇总与排序在 Supabase 侧用 tweet_stats RPC 完成，覆盖全量 30k+ 推文。"""
    return rpc_tweet_stats(keyword=keyword, account=account, date=date, top_n=top_n)


def search_local(keyword: str = "", account: str = "", date: str = "", limit: int = 10) -> list[dict]:
    """关键词/账号/日期检索：在 Supabase 全量推文里做匹配（正文 ilike、账号 ilike、日期精确），
    按热度（点赞×3+转发×2+回复+浏览/1000）降序返回。"""
    rows = rpc_search_tweets(keyword=keyword, account=account, date=date, limit=limit)
    return [
        {"account": r["account"], "date": r["date"], "time": r["time"], "kind": r["kind"],
         "likes": r["likes"], "retweets": r["retweets"], "text": (r.get("text") or "")[:300]}
        for r in rows
    ]


def _to_int(v) -> int:
    """TikHub 接口里 views 等字段时不时是字符串，统一转 int 避免 engagement 算分时类型报错。"""
    try:
        return int(v)
    except (TypeError, ValueError):
        return 0


def _tw_to_tweet(tw: dict, screen_name: str) -> Tweet:
    from crawl import _classify, _safe_text, _parse_date
    try:
        dt = _parse_date(tw["created_at"])
        date_str, time_str = dt.strftime("%Y-%m-%d"), dt.strftime("%Y-%m-%d %H:%M")
    except Exception:
        date_str, time_str = "", ""
    quoted = ""
    for field in ("retweeted_tweet", "quoted"):
        obj = tw.get(field)
        if isinstance(obj, dict):
            quoted = _safe_text(obj)
            if quoted:
                break
    return Tweet(
        account=f"@{screen_name}", kind=_classify(tw), time=time_str,
        likes=_to_int(tw.get("favorites")), retweets=_to_int(tw.get("retweets")),
        replies=_to_int(tw.get("replies")), views=_to_int(tw.get("views")),
        text=_safe_text(tw), quoted=quoted, date=date_str,
        tweet_id=str(tw.get("tweet_id") or ""),
    )


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_local",
            "description": (
                "在本地已爬取的 Twitter 数据里按关键词/账号/日期做检索，"
                "返回按热度（赞×3+转发×2+回复+浏览/1000）排序的命中推文。"
                "适合查找包含某关键词、来自某账号、或某天发布的内容。"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {"type": "string", "description": "搜索关键词，在推文正文里做包含匹配（不区分大小写）"},
                    "account": {"type": "string", "description": "账号 handle，如 @sama 或 sama"},
                    "date": {"type": "string", "description": "日期，格式 YYYY-MM-DD，对应数据文件名"},
                    "limit": {"type": "integer", "description": "最多返回几条，默认 10"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_by_topic",
            "description": (
                "跨全量推文的话题/趋势语义检索：按相似度而非精确关键词匹配，"
                "能找到措辞不同但讨论同一话题的推文（比如查 'AI 编程工具' 时也能找到提 "
                "Claude Code / Codex / Cursor 的内容）。适合'最近 XX 这块讨论得怎么样'"
                "这类需要综合多天多账号信息才能回答的趋势类问题，search_local 做不到这点。"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "要查询的话题/趋势描述，可以是短语或一句话"},
                    "top_k": {"type": "integer", "description": "返回最相关的几条，默认 15"},
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_stats",
            "description": (
                "对符合条件的推文做互动数据统计（总赞/转/评/览 + 最火的几条），"
                "用于从大量讨论里筛出真正重要、引发广泛关注的内容，而不是随手一提的噪声。"
                "适合'哪条最火'、'这个话题影响力大不大'这类需要用数据support判断的问题。"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {"type": "string", "description": "按关键词过滤（可选）"},
                    "account": {"type": "string", "description": "按账号过滤（可选）"},
                    "date": {"type": "string", "description": "按日期过滤，格式 YYYY-MM-DD（可选）"},
                    "top_n": {"type": "integer", "description": "返回最火的几条，默认 5"},
                },
            },
        },
    },
]

TOOL_FUNCS = {
    "search_local": search_local,
    "search_by_topic": search_by_topic,
    "get_stats": get_stats,
}


def _build_system_prompt(user_id: str | None = None) -> str:
    today = datetime.now(CST).strftime("%Y-%m-%d")
    profile_str = profile_to_str(load_profile(user_id))
    profile_section = f"\n用户偏好记忆（根据历史对话积累）：\n{profile_str}\n" if profile_str else ""
    return (
        f"你是「硅谷速递」的 AI 情报助手，掌握 168 个 AI/科技圈 Twitter 账号的推文数据。\n"
        f"今天的日期是 {today}。"
        f"{profile_section}"
        "你有三个工具，但不是每个问题都要用工具：\n"
        "- search_local：按关键词/账号/日期精确检索\n"
        "- search_by_topic：语义检索，适合查趋势/话题\n"
        "- get_stats：统计互动数据，挑出高影响力内容\n\n"
        "【什么时候不需要用工具】\n"
        "如果用户问的是通用知识（比如'X 是什么'、'X 怎么用'、'X 和 Y 的区别'），"
        "这类问题用你自己的知识直接回答即可，不要去查推文库。\n"
        "【什么时候要用工具】\n"
        "用户问的是圈子里的动态、某人最近说了什么、某个话题的讨论热度、某天发生了什么——"
        "这类需要真实推文数据支撑的问题才用工具。\n"
        "回答如果用到了推文数据，必须基于查到的真实内容，不要编造。"
    )


# 明确是"问定义/解释"的关键词 → 不查库
_DEFINITION_RE = _re.compile(
    r'(是什么|是啥|啥是|什么是|是个啥|到底是|啥意思|什么意思|怎么用|如何使用|介绍.{0,4}(一下)?|解释.{0,4}(一下)?|有什么用|是干嘛的)',
    _re.IGNORECASE,
)
# 明确是"问社区动态/最新消息"的关键词 → 必须查库
_COMMUNITY_RE = _re.compile(
    r'(最近|这周|这几天|今天|昨天|说了什么|有什么新|新动态|新消息|大家怎么(看|评|说)|怎么评价|讨论.{0,4}热|热不热|关注度|日报|简报)',
    _re.IGNORECASE,
)


def _needs_retrieval(question: str) -> bool:
    """前置意图分类：判断问题是否需要查推文数据库。
    先用正则快速判断明确情况；模糊情况才调 LLM。
    """
    has_definition = bool(_DEFINITION_RE.search(question))
    has_community = bool(_COMMUNITY_RE.search(question))

    if has_definition and not has_community:
        return False
    if has_community:
        return True

    client, model = deepseek()
    resp = client.chat.completions.create(
        model=model,
        temperature=0,
        max_tokens=5,
        messages=[
            {
                "role": "system",
                "content": (
                    "你是意图分类器。数据库里存的是近两个月 AI 圈 Twitter 的真实讨论。\n"
                    "判断：用户是在问'某个概念/产品的定义或用法'（NO），"
                    "还是在问'AI 圈里的人最近对某事的看法/动态/讨论'（YES）？\n"
                    "只回答 YES 或 NO。"
                ),
            },
            {"role": "user", "content": question},
        ],
    )
    answer = (resp.choices[0].message.content or "").strip().upper()
    return answer.startswith("Y")


def _write_final_answer(user_question: str, messages: list, deepseek_draft: str,
                        history: list | None = None) -> str:
    """DeepSeek 跑完工具循环后，把收集到的证据交给 Kimi K2.5 写最终回答。
    DeepSeek 负责判断查哪里、查几次；Kimi 负责把原始推文数据综合成简短的中文分析。
    history 是本次对话之前的轮次（用于追问理解上文）。
    """
    tool_results = []
    for m in messages:
        if m.get("role") == "tool":
            try:
                data = json.loads(m["content"])
                tool_results.append(json.dumps(data, ensure_ascii=False, indent=2))
            except Exception:
                tool_results.append(str(m["content"]))

    if tool_results:
        evidence = "从推文库检索到的原始数据：\n" + "\n---\n".join(tool_results)
    elif deepseek_draft:
        evidence = f"参考内容：{deepseek_draft}"
    else:
        evidence = ""

    from llm import kimi
    system = (
        "你是「硅谷速递」里专注 AI/科技圈的情报助手，像一个消息灵通的圈内朋友在跟人快速分享最新动态。\n\n"
        "【篇幅 — 最重要】保持简短！直奔重点，一般 3 个要点以内、总共 200 字左右。"
        "宁可短也不要凑字数。用户要的是几秒钟看懂，不是长篇报告。\n\n"
        "【格式 — 配图标】用要点式，每个要点开头配一个贴切的 emoji，让人一眼扫到重点。"
        "比如 🚀 新发布 / 🔧 工具更新 / 📈 趋势走向 / 💡 观点 / ⚠️ 争议 / 🔥 热议。"
        "要点之间空一行；开头可以有一句话总览，但别啰嗦。\n\n"
        "【怎么称呼消息来源 — 关键】绝对不要出现 @用户名、推特 handle、或普通用户大概率不认识的个人名字。"
        "直接把『消息本身』讲给用户听，就像这件事是你自己知道的圈内动态。\n"
        "- 来自知名公司/产品（OpenAI、Anthropic、Google、Claude、特斯拉等）→ 直接点名公司或产品；\n"
        "- 来自知名公众人物（奥特曼、马斯克等）→ 可以点名；\n"
        "- 来自不知名的个人开发者/网友 → 用『有开发者』『有用户』『社区里有人』『业内有人』等泛指，不要暴露 handle。\n"
        "判断标准：如果一个普通用户看到这个名字会一脸懵，就别用它，换成消息内容本身。\n\n"
        "【准确与分寸 — 别为流畅牺牲真实】\n"
        "- 证据本身是传言/猜测/疑问语气（如『X 会不会…』『据说 X』『X = 更多开源？』）→ 用『有传言/据传/有人猜测』，"
        "绝不要写成『X 宣布/已确认』这种既成事实。\n"
        "- 用户问某个具体时间（昨天/今天/这周）但你找到的内容不是那个时间发生的 → 别默认接受这个前提硬套，"
        "老实说『没找到 X 时间的，不过近期有…』，必要时点出实际时间。\n"
        "- 确实没查到可靠依据 → 就如实说没查到，不要硬凑一个自信的答案。\n\n"
        "【其他】不出现任何互动数字（赞/转发/浏览量）；不提数据库、检索、数据来源、数据截止日期等技术细节；"
        "除非用户问到时间、或需要点出'近期/具体哪天'来澄清前提，否则不出现具体日期；不编造没有依据的内容。"
    )
    convo = ""
    if history:
        # 带上最近几轮，支持「展开说说」「那它和 X 比呢」这类追问理解上文
        recent = history[-4:]
        lines = [f"{'用户' if m.get('role') == 'user' else '你'}：{(m.get('content') or '')[:300]}" for m in recent]
        convo = "【之前的对话】\n" + "\n".join(lines) + "\n\n"
    if evidence:
        user_msg = f"{convo}用户最新问题：{user_question}\n\n{evidence}\n\n请基于以上数据，简短地回答用户的最新问题。"
    else:
        user_msg = f"{convo}用户最新问题：{user_question}\n\n请用你自己的知识简短回答，语气自然，像圈内朋友聊天。"

    # Web 场景（server.py 设了事件钩子）：流式逐字推送给前端实时渲染；
    # 命令行场景（无钩子）：一次性返回完整文本，行为同原来。
    hook = _tool_event_hook.get()
    if hook:
        from llm import chat_stream
        parts: list[str] = []
        # kimi-k2.5 是推理模型，reasoning(思维链)与正文共用 max_tokens 额度——
        # 思维链常吃掉一两千 token，额度给小了正文会被腰斩。给足 6000 让答案完整。
        for kind, delta in chat_stream(kimi(), system, user_msg, max_tokens=6000):
            if kind == "content":
                parts.append(delta)
                hook({"type": "answer_token", "content": delta})
            else:  # reasoning：思维链，前端做成可见的"思考中"实时反馈，不计入最终答案
                hook({"type": "reasoning_token", "content": delta})
        return "".join(parts)

    from llm import chat
    return chat(kimi(), system, user_msg, max_tokens=6000)


def run_chat(user_question: str, max_turns: int = 6, user_id: str | None = None,
             history: list | None = None) -> str:
    # history：本次对话的前几轮 [{role, content}, ...]，让 agent 能接着上文聊。
    # 截最近 6 条（约 3 轮问答），控制 token 成本，只保留干净的 user/assistant 文本。
    history = [
        {"role": m["role"], "content": m["content"]}
        for m in (history or [])
        if m.get("role") in ("user", "assistant") and m.get("content")
    ][-6:]

    if not _needs_retrieval(user_question):
        final = _write_final_answer(user_question, [], "", history)
        update_profile([{"role": "user", "content": user_question}], user_id)
        return final

    client, model = deepseek()
    messages = [
        {"role": "system", "content": _build_system_prompt(user_id)},
        *history,
        {"role": "user", "content": user_question},
    ]
    hook = _tool_event_hook.get()

    for _ in range(max_turns):
        resp = client.chat.completions.create(
            model=model, messages=messages, tools=TOOLS, temperature=0.3,
        )
        msg = resp.choices[0].message
        messages.append(msg.model_dump(exclude_none=True))

        if not msg.tool_calls:
            final = _write_final_answer(user_question, messages, msg.content or "", history)
            update_profile(messages, user_id)
            return final

        for call in msg.tool_calls:
            func = TOOL_FUNCS[call.function.name]
            args = json.loads(call.function.arguments or "{}")
            print(f"  [调用工具] {call.function.name}({args})")
            if hook:
                hook({"type": "tool_call_start", "name": call.function.name, "args": args})
            result = func(**args)
            if hook:
                hook({"type": "tool_call_result", "name": call.function.name, "args": args, "result": result})
            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": json.dumps(result, ensure_ascii=False),
            })

    return "（轮数用尽，未能给出最终回答）"


if __name__ == "__main__":
    _range = f"{DATA_START} ~ {DATA_END}" if DATA_START else "未知（请检查 Supabase 连接）"
    print(f"推文数据已就绪（云端，覆盖 {_range}），输入问题开始对话（Ctrl+C 退出）\n")
    while True:
        try:
            q = input("你: ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if not q:
            continue
        ans = run_chat(q)
        print(f"\nAgent: {ans}\n")
