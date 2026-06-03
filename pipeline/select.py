"""选题（碰撞①：高信噪比 × 洪流没法低成本可靠选题）。

两段式：
  1) prefilter —— 便宜的本地预过滤：丢低信号转发、近似去重、按热度取候选集
                  （把上千条砍到几十条，省得全塞给 LLM）
  2) select_stories —— 贵的 LLM 判断：DeepSeek 在候选集上选题、去重话题、排序

用法（只跑预过滤，不花 key）：
    python select.py "路径/2026-04-14.txt"
"""
from __future__ import annotations

import re
import sys
import json
from pathlib import Path
from difflib import SequenceMatcher

sys.path.insert(0, str(Path(__file__).parent))
from parse_tweets import Tweet, parse_file  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def _norm(s: str) -> str:
    s = re.sub(r"https?://\S+", "", s)      # 去链接
    s = re.sub(r"^RT @\S+:?", "", s)        # 去 RT 前缀
    return re.sub(r"\s+", " ", s).strip().lower()


def prefilter(tweets: list[Tweet], max_candidates: int = 50, min_likes_for_rt: int = 20) -> list[Tweet]:
    """本地预过滤：不调任何 API。"""
    kept: list[Tweet] = []
    for t in tweets:
        # 转发的「转发数」是原帖的、虚高；本号真实信号看赞。低赞转发直接丢
        if t.kind == "转发" and t.likes < min_likes_for_rt:
            continue
        if len(_norm(t.text)) < 10:
            continue
        kept.append(t)

    # 近似去重：同一事件被多人发/转，只留热度最高的那条
    deduped: list[Tweet] = []
    seen: list[str] = []
    for t in sorted(kept, key=lambda x: x.engagement, reverse=True):
        key = _norm(t.text)[:200]
        if any(SequenceMatcher(None, key, s).ratio() > 0.8 for s in seen):
            continue
        seen.append(key)
        deduped.append(t)

    return deduped[:max_candidates]


def select_stories(candidates: list[Tweet], n: int = 8) -> dict:
    """DeepSeek 选题：从候选集挑最重要的 n 条，去重话题并排序。需要 DEEPSEEK key。"""
    from llm import deepseek, chat_json
    payload = [
        {"i": i, "account": t.account, "likes": t.likes, "views": t.views, "text": t.text[:500]}
        for i, t in enumerate(candidates)
    ]
    system = "你是资深科技日报主编，擅长从嘈杂的推特里挑出真正重要的 AI 行业大事，剔除重复话题与营销水贴。"
    user = (
        f"从下面 {len(payload)} 条候选推文里，挑出最值得报道的 {n} 条 AI 新闻，按重要性从高到低排序，"
        f"合并讲同一件事的条目。\n"
        f'输出 JSON：{{"stories":[{{"rank":1,"title":"中文标题","reason":"为什么重要","tweet_index":候选里的 i}}]}}\n\n'
        f"候选推文：\n{json.dumps(payload, ensure_ascii=False)}"
    )
    return chat_json(deepseek(), system, user, max_tokens=2500)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)
    tweets = parse_file(sys.argv[1])
    candidates = prefilter(tweets)
    print(f"原始 {len(tweets)} 条 → 预过滤后候选 {len(candidates)} 条\n")
    print("候选热度 Top 10（这批才会喂给 DeepSeek 选题）：")
    for t in candidates[:10]:
        print(f"  [{t.engagement:>6}] {t.account:<18} {t.text.replace(chr(10), ' ')[:70]}")
