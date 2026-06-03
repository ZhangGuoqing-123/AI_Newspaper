"""把生成结果写进 Supabase（pipeline 用 service key，绕过 RLS）。

走 PostgREST 上行接口做 upsert，不用额外依赖（requests 已在 requirements）。
写入：daily_summaries（日报正文）+ daily_broadcasts（口播稿/音视频 URL）。
音视频文件需先传到 Supabase Storage 拿到公开 URL（见 upload_media，待你确认 bucket 后接）。
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
import requests

sys.path.insert(0, str(Path(__file__).parent))
load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


def _headers() -> dict:
    if not SUPABASE_URL or not SERVICE_KEY:
        raise RuntimeError("缺少 SUPABASE_URL / SUPABASE_SERVICE_KEY（pipeline/.env）")
    return {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",  # upsert
    }


def _upsert(table: str, row: dict) -> None:
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    r = requests.post(url, json=row, headers=_headers(), timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"写入 {table} 失败 [{r.status_code}]：{r.text}")
    print(f"  ✓ 写入 {table}（date={row.get('date')}）")


def publish(date: str, digest: str, script: str,
            title: str = "",
            audio_url: str | None = None,
            video_url: str | None = None,
            cover_url: str | None = None,
            article_count: int = 0,
            channel_count: int = 0) -> None:
    title = title or f"硅谷速递 · {date}"
    _upsert("daily_summaries", {
        "date": date, "title": title, "content": digest,
        "article_count": article_count, "channel_count": channel_count,
    })
    _upsert("daily_broadcasts", {
        "date": date, "title": title,
        "description": digest[:300],   # 文稿摘要（前300字）
        "script": script,
        "audio_url":    audio_url,
        "video_url":    video_url,
        "cover_url":    cover_url,
        "poster_image": "/xiaogui.png",  # 小硅静态封面，固定
    })
    print(f"[Supabase] {date} 已写入 daily_summaries + daily_broadcasts")


if __name__ == "__main__":
    # 自检：确认能连上 Supabase
    print("SUPABASE_URL:", SUPABASE_URL or "(未配置)")
    print("SERVICE_KEY:", "已配置" if SERVICE_KEY else "(未配置)")
    if SUPABASE_URL and SERVICE_KEY:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/daily_summaries?select=date&limit=1", headers=_headers())
        print("连通测试:", r.status_code, r.text[:200])
