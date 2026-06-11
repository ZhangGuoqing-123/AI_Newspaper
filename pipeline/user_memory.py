"""用户偏好记忆：跨会话的长期记忆层（多用户隔离版）。

每次对话结束后，用 LLM 从对话里提炼用户关注的账号和话题，
按 user_id 合并进 Supabase 的 user_profiles 表。下次对话开始时按同一 user_id
加载注入系统 prompt，让 agent 记住"这个用户平时关心什么"。

user_id 来源：前端每个浏览器一个匿名客户端 id（见 multiuser_profile.sql）。
未带 user_id 时退化为单一访客 "anon"，行为安全（只是共用一份匿名画像）。
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from supabase import create_client

_sb = None
_cached_profiles: dict[str, dict] = {}  # user_id -> profile，update 后刷新

DEFAULT_USER = "anon"  # 没带 user_id 时的回退身份


def _supabase():
    global _sb
    if _sb is None:
        _sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
    return _sb


def _norm(user_id: str | None) -> str:
    uid = (user_id or "").strip()
    return uid or DEFAULT_USER


def load_profile(user_id: str | None = None) -> dict:
    uid = _norm(user_id)
    if uid in _cached_profiles:
        return _cached_profiles[uid]
    try:
        resp = _supabase().table("user_profiles").select("*").eq("user_id", uid).single().execute()
        _cached_profiles[uid] = resp.data or {}
    except Exception:
        # 该用户还没有任何画像（首次访问）或表未建好——都按空画像处理，不崩
        _cached_profiles[uid] = {}
    return _cached_profiles[uid]


def profile_to_str(profile: dict) -> str:
    """把 profile 格式化成可以插入系统 prompt 的自然语言片段。"""
    accounts = profile.get("accounts") or []
    topics = profile.get("topics") or []
    parts = []
    if accounts:
        parts.append(f"用户过去常查询的账号：{', '.join('@' + a for a in accounts)}")
    if topics:
        parts.append(f"用户感兴趣的话题方向：{', '.join(topics)}")
    return "\n".join(parts)


def update_profile(messages: list, user_id: str | None = None) -> None:
    """从本次对话的消息列表里提炼兴趣，按 user_id 合并进已有 profile 并存库。
    只看用户消息（过滤掉工具调用结果），避免 context 过长。
    """
    uid = _norm(user_id)

    user_texts = [
        m["content"] for m in messages
        if m.get("role") == "user" and isinstance(m.get("content"), str)
    ]
    if not user_texts:
        return

    old = load_profile(uid)
    old_accounts = list(old.get("accounts") or [])
    old_topics = list(old.get("topics") or [])

    from llm import deepseek
    client, model = deepseek()

    prompt = f"""从用户的提问中提炼：
1. 被查询或提及的 Twitter 账号 handle（不带 @，小写）
2. 用户关注的话题方向（简短词组，中英文均可）

已有记录 — 账号：{old_accounts}，话题：{old_topics}

本次用户提问：
{chr(10).join(user_texts)}

只返回 JSON，格式：{{"accounts": ["sama", "karpathy"], "topics": ["AI agent", "多模态"]}}"""

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        raw = resp.choices[0].message.content.strip()
        # 容错：模型有时会在 JSON 外面加 markdown fence
        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json").strip()
        extracted = json.loads(raw)

        merged_accounts = list(dict.fromkeys(old_accounts + extracted.get("accounts", [])))[:20]
        merged_topics   = list(dict.fromkeys(old_topics   + extracted.get("topics",   [])))[:10]

        _supabase().table("user_profiles").upsert({
            "user_id": uid,
            "accounts": merged_accounts,
            "topics": merged_topics,
        }).execute()

        _cached_profiles[uid] = {"accounts": merged_accounts, "topics": merged_topics}
        print(f"[memory] 用户 {uid} 画像已更新：账号 {merged_accounts}，话题 {merged_topics}")

    except Exception as e:
        print(f"[memory] 更新 profile 失败（不影响主流程）: {e}")
