"""质检（LLM-as-judge，DeepSeek）——让 agent 够得上「自检-重生成闭环」。

对照原始推文审查生成的日报：是否忠于原文、有没有拼出原文没有的事实、
重点是否突出、可读性如何。给分并判定是否需要重做。
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from parse_tweets import Tweet      # noqa: E402
from llm import deepseek, chat_json  # noqa: E402

PASS_SCORE = 8


def _format(tweets: list[Tweet], limit: int = 60) -> str:
    lines = [f"【{t.account}】{t.text}" for t in tweets[:limit]]
    return "\n".join(lines)


def judge(digest: str, tweets: list[Tweet]) -> dict:
    """对照原始推文质检日报文本，返回 {ok, score, issues}。"""
    system = ("你是严格的内容质检员，检查 AI 日报是否忠于原始推文、"
              "有无编造/曲解原文没有的事实、重点是否突出、可读性是否达标。")
    user = (
        "对照【原始推文】审查【生成日报】，按 0-10 打分（忠实度+可读性综合），并指出具体问题。\n"
        f'输出 JSON：{{"ok": true/false, "score": 0-10, "issues": ["问题1","问题2"]}}'
        f"（score>={PASS_SCORE} 记为 ok=true，没问题时 issues 给空数组）\n\n"
        f"【原始推文】\n{_format(tweets)}\n\n"
        f"【生成日报】\n{digest}"
    )
    out = chat_json(deepseek(), system, user, max_tokens=1200)
    # 兜底字段
    out.setdefault("ok", out.get("score", 0) >= PASS_SCORE)
    out.setdefault("score", 0)
    out.setdefault("issues", [])
    return out
