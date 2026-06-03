"""质检（LLM-as-judge，DeepSeek）——让 agent 够得上「自检-重生成闭环」。

检查摘要是否忠于原文、口播稿是否通顺，给分并判定是否需要重做。
"""
from __future__ import annotations

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from llm import deepseek, chat_json  # noqa: E402


def judge(digest: dict, stories: list[dict]) -> dict:
    system = "你是严格的内容质检员，检查 AI 日报是否忠于原始素材、有无拼接出原文没有的事实、口播稿是否通顺自然。"
    user = (
        "对照【原始素材】审查【生成日报】，按 0-10 打分（忠实度+通顺度），并指出问题。\n"
        '输出 JSON：{"ok":true/false,"score":0-10,"issues":["问题1","问题2"]}（score>=8 视为 ok）\n\n'
        f"【原始素材】\n{json.dumps(stories, ensure_ascii=False)}\n\n"
        f"【生成日报】\n{json.dumps(digest, ensure_ascii=False)}"
    )
    return chat_json(deepseek(), system, user, max_tokens=1500)
