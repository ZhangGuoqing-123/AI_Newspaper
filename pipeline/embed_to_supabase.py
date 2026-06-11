"""embed_to_supabase.py — 一次性迁移脚本

全部 Supabase 操作走 requests（绕过 Clash TUN 对 httpx/supabase-py 的 SSL 干扰）。
Chroma 损坏时直接用 SiliconFlow API 重建，幂等可重跑。

跑法：
    cd pipeline && python embed_to_supabase.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

# 必须在所有 import 之前设置，避免 httpx 读到系统代理
os.environ.setdefault("NO_PROXY", "*")
os.environ.setdefault("no_proxy", "*")

import hashlib

from supabase_vector import (
    build_index_from_siliconflow,
    count_indexed,
    _sb_get_count,
    _sb_get_ids,
    _sb_get_rows,
    _upsert_with_retry,
)

CHROMA_DIR = Path(__file__).parent / "chroma_db"
BATCH = 200  # 单次写入 tweet_embeddings 的行数


def main() -> None:
    # ── 1. 尝试从本地 Chroma 读 embedding（损坏则跳过，走 SiliconFlow 重建）──
    chroma_map: dict[str, list[float]] = {}
    if CHROMA_DIR.exists():
        print("正在从本地 Chroma 读取 embedding...")
        try:
            import chromadb
            chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
            col = chroma_client.get_collection("tweets")
            chroma_total = col.count()
            print(f"Chroma 里共 {chroma_total} 条 embedding")

            all_ids: list[str] = []
            all_embeddings: list[list[float]] = []
            FETCH_BATCH = 2000
            offset = 0
            while True:
                result = col.get(include=["embeddings"], limit=FETCH_BATCH, offset=offset)
                if not result["ids"]:
                    break
                all_ids.extend(result["ids"])
                all_embeddings.extend(result["embeddings"])
                print(f"  已读取 {len(all_ids)}/{chroma_total}")
                if len(result["ids"]) < FETCH_BATCH:
                    break
                offset += FETCH_BATCH

            chroma_map = dict(zip(all_ids, all_embeddings))
            print(f"共读出 {len(chroma_map)} 条 embedding")
        except Exception as e:
            print(f"Chroma 索引损坏，跳过（将用 SiliconFlow API 建库）: {e}")
            chroma_map = {}
    else:
        print("chroma_db/ 不存在，直接用 SiliconFlow API 建库")

    # ── 2. 若 Chroma 有数据，做哈希匹配并写入 Supabase（全用 requests）──
    if chroma_map:
        print("\n正在从 Supabase 拉取推文列表，计算匹配 key...")
        all_tweets = _sb_get_rows("tweets", "id,account,time,text")
        hash_to_supabase_id: dict[str, int] = {}
        for r in all_tweets:
            h = hashlib.md5(f"{r['account']}|{r['time']}|{r['text']}".encode()).hexdigest()
            hash_to_supabase_id[h] = r["id"]
        print(f"Supabase tweets 表共 {len(hash_to_supabase_id)} 条")

        print("\n检查 tweet_embeddings 表现有内容...")
        existing_ids = _sb_get_ids("tweet_embeddings")
        print(f"已有 {len(existing_ids)} 条（跳过）")

        records: list[dict] = []
        unmatched = 0
        for chroma_hash, emb in chroma_map.items():
            supabase_id = hash_to_supabase_id.get(chroma_hash)
            if supabase_id is None:
                unmatched += 1
                continue
            if supabase_id in existing_ids:
                continue
            records.append({"id": supabase_id, "embedding": emb})

        print(
            f"\n匹配成功 {len(records)} 条  |  "
            f"已存在跳过 {len(existing_ids)} 条  |  "
            f"未匹配 {unmatched} 条"
        )

        if records:
            print(f"\n开始写入 {len(records)} 条 embedding 到 Supabase...")
            for i in range(0, len(records), BATCH):
                batch = records[i:i + BATCH]
                _upsert_with_retry(batch)
                print(f"  已写入 {min(i + BATCH, len(records))}/{len(records)}")
            print("写入完成")

    # ── 3. 用 SiliconFlow API 补所有还没有 embedding 的行 ──
    final_count = count_indexed()
    tweet_total = _sb_get_count("tweets")
    print(f"\ntweet_embeddings 表现在共 {final_count} 条，tweets 表共 {tweet_total} 条")

    if final_count < tweet_total:
        missing = tweet_total - final_count
        print(f"还有 {missing} 条需要用 SiliconFlow API 建 embedding（每批 32 条）...")
        build_index_from_siliconflow()
    else:
        print("所有推文已有 embedding，迁移完成！")


if __name__ == "__main__":
    main()
