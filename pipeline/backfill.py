"""全量补爬：对所有活跃信源，爬取 CUTOFF 日期到今天的全部推文（4种类型）并写入 Supabase。

四种内容：① 原创主帖 ② 转发帖 ③ 转发帖的原帖内容 ④ 作者自己在自己帖子下的回复
（复用 crawl._crawl_account，它本来就处理这四种）

跑法：
    cd pipeline
    python backfill.py          # 爬所有活跃账号
    python backfill.py sama     # 只爬某一个账号（调试用）

日志写到 backfill.log
"""
from __future__ import annotations

import os
import sys
import logging
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from supabase import create_client
from crawl import _crawl_account, CST
from chat_agent import _tw_to_tweet

# ── 配置 ──────────────────────────────────────────────────────────────────────
CUTOFF = datetime(2026, 4, 14, tzinfo=CST)   # 从这一天 00:00 开始爬
LOG_FILE = Path(__file__).parent / "backfill.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)


def _sb():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def _active_sources(only: str | None = None) -> list[str]:
    sb = _sb()
    if only:
        return [only]
    resp = sb.table("sources").select("screen_name").eq("active", True).execute()
    return [r["screen_name"] for r in resp.data]


def _to_row(t) -> dict:
    return {
        "account": t.account, "kind": t.kind, "time": t.time,
        "likes": t.likes, "retweets": t.retweets, "replies": t.replies, "views": t.views,
        "text": t.text, "quoted": t.quoted, "date": t.date,
    }


def crawl_one(screen_name: str, sb, cache: dict) -> int:
    """爬单个账号，返回写入条数。"""
    rows = []
    try:
        for _, sn, tw in _crawl_account(screen_name, CUTOFF, cache):
            t = _tw_to_tweet(tw, sn)
            if t.date and t.date >= "2026-04-14":
                rows.append(_to_row(t))
    except Exception as e:
        log.warning(f"  @{screen_name} 爬取出错: {e}")
        return 0

    if not rows:
        return 0

    try:
        sb.table("tweets").upsert(rows, on_conflict="account,time,text_hash").execute()
        return len(rows)
    except Exception as e:
        log.warning(f"  @{screen_name} 写库出错: {e}")
        return 0


def run():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    sb = _sb()
    sources = _active_sources(only)
    log.info(f"开始补爬：共 {len(sources)} 个账号，起始日期 {CUTOFF.date()}，日志 → {LOG_FILE}")

    total = 0
    cache: dict = {}

    for i, screen_name in enumerate(sources, 1):
        log.info(f"[{i}/{len(sources)}] @{screen_name} 开始...")
        n = crawl_one(screen_name, sb, cache)
        log.info(f"[{i}/{len(sources)}] @{screen_name} 完成，写入 {n} 条")
        total += n

    log.info(f"\n全部完成，共写入 {total} 条新推文到 Supabase")
    log.info("重启 server 后新数据自动加载进向量索引")


if __name__ == "__main__":
    run()
