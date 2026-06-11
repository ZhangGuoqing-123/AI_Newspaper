"""每天 0 点自动巡检 sources 表里的活跃信源，爬"当天"（刚结束的那一整天）的推文，
写入 Supabase、计算 embedding 存入 tweet_embeddings，并并入本地内存库。

复用 crawl.py 的 _crawl_account——它和当年生成本地 29 天数据用的是同一条管线：
先按 fetch_user_post_tweet 抓主帖（覆盖"原创/转发/引用推文"，_classify 负责分类），
再按 fetch_user_tweet_replies 抓回复、过滤出"自己在自己帖子下回复自己"的那部分一并并入。
跟用户原话「这4种都要爬，主帖，转发帖，转发帖的原帖，自己在自己帖子下回复自己」口径一致。

跑法：由 server.py 在启动时调用一次 start_scheduler()，之后每天 0 点自动跑一轮，
不需要单独手动执行本文件。
"""
from __future__ import annotations

import os
import re
from datetime import datetime, timedelta

from dotenv import load_dotenv

load_dotenv()

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from supabase import create_client

from crawl import _crawl_account, CST
from chat_agent import ALL_TWEETS, _tw_to_tweet
from supabase_vector import upsert_embeddings_for_rows

_sb = None


def _supabase():
    global _sb
    if _sb is None:
        _sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
    return _sb


def _active_sources() -> list[str]:
    resp = _supabase().table("sources").select("screen_name").eq("active", True).execute()
    return [row["screen_name"] for row in resp.data]


def _row(t) -> dict:
    return {
        "account": t.account, "kind": t.kind, "time": t.time,
        "likes": t.likes, "retweets": t.retweets, "replies": t.replies, "views": t.views,
        "text": t.text, "quoted": t.quoted, "date": t.date,
        "tweet_id": t.tweet_id,  # 深链原文用；老数据为空字符串
    }


def _upsert_tweets(rows: list[dict]):
    """写入 tweets 表，对「列不存在」容错。

    背景：_row() 会带上 tweet_id（深链原文用），但该列要等 add_tweet_id.sql 在 Supabase
    跑过才有。列不存在时 PostgREST 会报 PGRST204 "Could not find the 'X' column"，
    整批写入失败——这正是之前每轮爬取都「绿勾但零入库」、数据停在几天前的真凶。
    这里捕获该错误、把缺失的列从所有行里剔掉再重试，让爬取在列没建好时也能正常写库
    （代价仅是 tweet_id 暂时为空，前端深链自动回退到搜索兜底，不影响数据更新）。
    """
    sb = _supabase()
    rows = [dict(r) for r in rows]
    for _ in range(5):  # 最多剥 5 个缺失列，避免极端情况下死循环
        try:
            return sb.table("tweets").upsert(rows, on_conflict="account,time,text_hash").execute()
        except Exception as e:
            m = re.search(r"Could not find the '(\w+)' column", str(e))
            if not m:
                raise
            col = m.group(1)
            print(f"[auto_crawl] tweets 表缺少 '{col}' 列，自动去掉该字段重试"
                  f"（如需该字段请在 Supabase 跑对应迁移 SQL）")
            for r in rows:
                r.pop(col, None)
    # 兜底：剥了 5 轮还不行，最后再试一次让真实异常抛出
    return sb.table("tweets").upsert(rows, on_conflict="account,time,text_hash").execute()


def run_auto_crawl_once(lookback_hours: int = 7) -> None:
    """巡检一轮：对每个活跃信源抓最近 lookback_hours 小时的新内容，写库 + 算 embedding + 并入内存索引。

    调度为每 6 小时一轮，cutoff 取 now-7h（比间隔多 1h 重叠，避免边界漏抓；
    重复内容由 seen 去重 + upsert on_conflict 兜底）。
    """
    now = datetime.now(CST)
    cutoff = now - timedelta(hours=lookback_hours)
    cache: dict = {}
    seen = {(t.account, t.time, t.text) for t in ALL_TWEETS}
    fresh_rows, fresh_tweets = [], []

    for screen_name in _active_sources():
        try:
            for _, sn, tw in _crawl_account(screen_name, cutoff, cache):
                t = _tw_to_tweet(tw, sn)
                key = (t.account, t.time, t.text)
                if key in seen:
                    continue
                seen.add(key)
                fresh_tweets.append(t)
                fresh_rows.append(_row(t))
        except Exception as e:
            print(f"[auto_crawl] @{screen_name} 抓取出错: {e}")

    if not fresh_rows:
        print("[auto_crawl] 本轮巡检完成，没有新内容")
        return

    try:
        result = _upsert_tweets(fresh_rows)
        rows_with_ids = result.data or []
    except Exception as e:
        print(f"[auto_crawl] 写入 Supabase 出错（本轮抓到的内容暂未入库，下一轮会重试）: {e}")
        return

    if rows_with_ids:
        try:
            upsert_embeddings_for_rows(rows_with_ids)
        except Exception as e:
            print(f"[auto_crawl] embedding 写入失败（不影响查询，下次会补）: {e}")

    ALL_TWEETS.extend(fresh_tweets)
    print(f"[auto_crawl] 本轮抓到 {len(fresh_rows)} 条新内容，已写入 Supabase + pgvector 并并入本地检索索引")


def _crawl_then_cluster() -> None:
    """一轮完整作业：先爬最近内容，再重算热门话题快照。

    话题聚类无论本轮是否爬到新内容都跑——它聚的是最近几天的窗口，
    且重算成本极低（向量聚类零 API + 每话题一次 LLM 起名）。
    """
    try:
        run_auto_crawl_once()
    except Exception as e:
        print(f"[auto_crawl] 爬取轮出错（继续做话题聚类）: {e}")
    try:
        from topic_cluster import run_topic_clustering_once
        run_topic_clustering_once()
    except Exception as e:
        print(f"[auto_crawl] 话题聚类出错: {e}")


def start_scheduler() -> BackgroundScheduler:
    """供 server.py 在启动时调用一次：每 6 小时爬一轮 + 重算热门话题；启动时立即先跑一次。"""
    scheduler = BackgroundScheduler(timezone=CST)
    scheduler.add_job(
        _crawl_then_cluster,
        CronTrigger(hour="0,6,12,18", minute=0),
        id="auto_crawl",
        max_instances=1,
        coalesce=True,
    )
    # 启动时只「重算话题」不爬取——聚类用库里已有数据，零 TikHub 调用，
    # 避免每次重启服务都触发付费爬取；真正的爬取交给 6 小时定时轮。
    def _cluster_only():
        try:
            from topic_cluster import run_topic_clustering_once
            run_topic_clustering_once()
        except Exception as e:
            print(f"[auto_crawl] 启动首轮话题聚类出错: {e}")

    scheduler.add_job(_cluster_only, id="topic_boot")
    scheduler.start()
    print("[auto_crawl] 定时作业已启动：每 6 小时（0/6/12/18 点）爬一轮 + 重算话题；启动已先重算一次话题（不爬取）")
    return scheduler
