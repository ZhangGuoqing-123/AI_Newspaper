"""按「关注的账号」从 TikHub 爬当天推文，输出与 parse_tweets 一致的 txt。

复用你 crawler.py 的 TikHub 调用逻辑，但：
  - key 从 pipeline/.env 读（不再硬编码）
  - 账号列表来自 accounts.json（= 某用户关注的信源，每人一份）
  - 默认只爬最近 1 天（日报用），可 --days 调

用法：
    python crawl.py                          # 爬 accounts.json，最近1天 → data/<日期>.txt
    python crawl.py --days 2
    python crawl.py --accounts sama,OpenAI,karpathy
"""
from __future__ import annotations

import os
import sys
import time
import json
import argparse
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from collections import defaultdict
from pathlib import Path

from dotenv import load_dotenv
import requests

sys.path.insert(0, str(Path(__file__).parent))
load_dotenv(Path(__file__).parent / ".env")
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE_URL = os.getenv("TIKHUB_BASE_URL", "https://api.tikhub.dev")
DATA_DIR = Path(__file__).parent / "data"
CST = timezone(timedelta(hours=8))
REQUEST_INTERVAL = 0.15


def _headers() -> dict:
    key = os.getenv("TIKHUB_API_KEY")
    if not key:
        raise RuntimeError("缺少 TIKHUB_API_KEY，请在 pipeline/.env 配置")
    return {"Authorization": f"Bearer {key}"}


def _safe_text(obj, key: str = "text") -> str:
    return (obj.get(key) or "").strip() if obj else ""


def _parse_date(created_at: str) -> datetime:
    return parsedate_to_datetime(created_at).astimezone(CST)


def _api_get(endpoint: str, params: dict, retries: int = 3):
    url = f"{BASE_URL}{endpoint}"
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=_headers(), params=params, timeout=45)
            if resp.status_code == 429:
                time.sleep(15 * (attempt + 1))
                continue
            if resp.status_code != 200:
                return None
            data = resp.json()
            if data.get("code") != 200:
                return None
            return data
        except Exception as e:
            print(f"    请求出错(第{attempt+1}次): {e}")
            time.sleep(3)
    return None


def _fetch_detail(tweet_id: str, cache: dict):
    if tweet_id in cache:
        return cache[tweet_id]
    time.sleep(REQUEST_INTERVAL)
    data = _api_get("/api/v1/twitter/web/fetch_tweet_detail", {"tweet_id": tweet_id})
    cache[tweet_id] = data.get("data") if data else None
    return cache[tweet_id]


def _fetch_all(endpoint: str, screen_name: str, cutoff: datetime) -> list:
    results, cursor = [], None
    while True:
        params = {"screen_name": screen_name}
        if cursor:
            params["cursor"] = cursor
        time.sleep(REQUEST_INTERVAL)
        data = _api_get(endpoint, params)
        if not data:
            break
        timeline = data.get("data", {}).get("timeline", [])
        if not timeline:
            break
        reached = False
        for tw in timeline:
            try:
                if _parse_date(tw["created_at"]) < cutoff:
                    reached = True
                    break
                results.append(tw)
            except Exception:
                pass
        nxt = data.get("data", {}).get("next_cursor")
        if reached or not nxt or nxt == cursor:
            break
        cursor = nxt
    return results


def _classify(tw: dict) -> str:
    if tw.get("retweeted_tweet"):
        return "转发"
    if tw.get("quoted"):
        return "引用推文"
    if tw.get("in_reply_to_status_id_str"):
        return "回复（自己帖下）"
    return "原创推文"


def _fmt_author(a: dict) -> str:
    if not a:
        return "未知"
    name, screen = a.get("name") or "", a.get("screen_name") or ""
    return f"{name} (@{screen})" if name else f"@{screen}"


def _fmt_tweet(tw: dict, screen_name: str, cache: dict) -> str:
    lines = ["=" * 52, f"【账号】@{screen_name}  【类型】{_classify(tw)}"]
    try:
        lines.append(f"【时间】{_parse_date(tw['created_at']).strftime('%Y-%m-%d %H:%M')}")
    except Exception:
        pass
    lines.append(f"【点赞】{tw.get('favorites', 0)}  【转发】{tw.get('retweets', 0)}  "
                 f"【回复】{tw.get('replies', 0)}  【浏览】{tw.get('views', 0)}")
    lines.append(f"【正文】\n{_safe_text(tw)}")

    for field, label in (("quoted", "引用的帖子"), ("retweeted_tweet", "转发的原帖")):
        obj = tw.get(field)
        if isinstance(obj, dict):
            t = ""
            try:
                t = _parse_date(obj["created_at"]).strftime("%Y-%m-%d %H:%M")
            except Exception:
                pass
            lines += [f"\n【{label}】", f"  作者: {_fmt_author(obj.get('author') or {})}",
                      f"  时间: {t}", f"  内容: {_safe_text(obj)}"]

    reply_id = tw.get("in_reply_to_status_id_str")
    if reply_id:
        parent = _fetch_detail(reply_id, cache)
        if isinstance(parent, dict):
            t = ""
            try:
                t = _parse_date(parent["created_at"]).strftime("%Y-%m-%d %H:%M")
            except Exception:
                pass
            lines += ["\n【回复的帖子】", f"  作者: {_fmt_author(parent.get('author') or {})}",
                      f"  时间: {t}", f"  内容: {_safe_text(parent)}"]

    lines.append("=" * 52)
    return "\n".join(lines)


def _crawl_account(screen_name: str, cutoff: datetime, cache: dict) -> list:
    posts = _fetch_all("/api/v1/twitter/web/fetch_user_post_tweet", screen_name, cutoff)
    own_ids = {t.get("tweet_id") for t in posts} | {t.get("conversation_id") for t in posts}
    replies = _fetch_all("/api/v1/twitter/web/fetch_user_tweet_replies", screen_name, cutoff)
    own_replies = [t for t in replies
                   if t.get("in_reply_to_status_id_str") and t.get("conversation_id", "") in own_ids]
    tweet_map = {t.get("tweet_id"): t for t in posts + own_replies if t.get("tweet_id")}
    entries = []
    for tw in tweet_map.values():
        try:
            entries.append((_parse_date(tw["created_at"]), screen_name, tw))
        except Exception:
            pass
    return entries


def crawl_accounts(accounts: list[str], days: int = 1) -> list[Path]:
    """爬 accounts 最近 days 天的推文，按天写 data/<日期>.txt，返回写出的文件路径。"""
    today = datetime.now(CST).replace(hour=0, minute=0, second=0, microsecond=0)
    cutoff = today - timedelta(days=days)
    bucket: dict[str, list] = defaultdict(list)
    cache: dict = {}

    for i, acc in enumerate(accounts, 1):
        print(f"[{i}/{len(accounts)}] 抓取 @{acc} ...")
        try:
            for dt, sn, tw in _crawl_account(acc, cutoff, cache):
                bucket[dt.strftime("%Y-%m-%d")].append((dt, sn, tw))
        except Exception as e:
            print(f"    @{acc} 出错: {e}")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    written = []
    for day_key, entries in sorted(bucket.items()):
        entries.sort(key=lambda x: x[0])
        fpath = DATA_DIR / f"{day_key}.txt"
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(f"日期: {day_key}  共 {len(entries)} 条\n\n")
            for dt, sn, tw in entries:
                f.write(_fmt_tweet(tw, sn, cache) + "\n\n")
        written.append(fpath)
        print(f"  写入 {fpath.name}（{len(entries)} 条）")
    return written


def load_accounts() -> list[str]:
    """读 accounts.json（= 该用户关注的账号）。"""
    f = Path(__file__).parent / "accounts.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))["accounts"]
    raise FileNotFoundError("缺少 accounts.json")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=1, help="爬最近几天")
    ap.add_argument("--accounts", default="", help="逗号分隔账号，覆盖 accounts.json")
    args = ap.parse_args()
    accts = [a.strip() for a in args.accounts.split(",") if a.strip()] or load_accounts()
    print(f"将抓取 {len(accts)} 个账号，最近 {args.days} 天\n")
    crawl_accounts(accts, days=args.days)
