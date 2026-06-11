"""一次性迁移脚本：把本地 29 天的推文 .txt 数据导入 Supabase 的 tweets 表。

跑法：
    python migrate_to_supabase.py

幂等：用 upsert + (account, time, text_hash) 唯一约束，重复跑不会产生重复行。
"""
from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client
from chat_agent import ALL_TWEETS

BATCH_SIZE = 500


def main() -> None:
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    rows = [
        {
            "account": t.account,
            "kind": t.kind,
            "time": t.time,
            "likes": t.likes,
            "retweets": t.retweets,
            "replies": t.replies,
            "views": t.views,
            "text": t.text,
            "quoted": t.quoted,
            "date": t.date,
        }
        for t in ALL_TWEETS
    ]

    print(f"准备导入 {len(rows)} 条推文，分批写入（每批 {BATCH_SIZE} 条）…")
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        sb.table("tweets").upsert(batch, on_conflict="account,time,text_hash").execute()
        print(f"  已写入 {min(i + BATCH_SIZE, len(rows))}/{len(rows)}")

    count = sb.table("tweets").select("id", count="exact").execute()
    print(f"完成。tweets 表当前共有 {count.count} 条记录。")


if __name__ == "__main__":
    main()
