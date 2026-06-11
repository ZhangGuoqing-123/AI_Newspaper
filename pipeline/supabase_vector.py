"""Supabase pgvector 封装：embedding 检索 + 增量写入。

替代原来的 Chroma：向量存储在 Supabase 同一个库里，
架构统一、部署干净，不依赖本地 chroma_db/ 目录。

前置条件：已在 Supabase SQL 编辑器里跑过 pgvector_schema.sql。
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

# Clash/Meta TUN 模式会把系统代理注入 httpx，导致 SSL 握手异常
# 显式设置 NO_PROXY=* 让 httpx 对所有域名走直连（REST API 走 HTTPS/443，不需要代理）
import os as _os
_os.environ.setdefault("NO_PROXY", "*")
_os.environ.setdefault("no_proxy", "*")

from openai import OpenAI
from supabase import create_client

EMBED_DIM = 1024    # BAAI/bge-m3 输出维度
EMBED_BATCH = 32    # SiliconFlow 单次请求最大文本数
INSERT_BATCH = 20   # 单次写入 tweet_embeddings 的行数上限（过大会触发 Supabase 500）

_sb = None
_sf = None


def _supabase():
    global _sb
    if _sb is None:
        _sb = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _sb


def _siliconflow():
    global _sf
    if _sf is None:
        _sf = OpenAI(
            api_key=os.environ["SILICONFLOW_API_KEY"],
            base_url="https://api.siliconflow.cn/v1",
        )
    return _sf


def get_embeddings(texts: list[str]) -> list[list[float]]:
    """批量调 SiliconFlow BAAI/bge-m3 计算 embedding。

    用 requests 直连 SiliconFlow REST API，绕过 openai SDK 内的 httpx
    在 Clash TUN 模式下的 SSL 断连问题。
    """
    import requests as _req, json as _json, time as _time

    api_key = os.environ["SILICONFLOW_API_KEY"]
    url = "https://api.siliconflow.cn/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    results: list[list[float]] = []
    for i in range(0, len(texts), EMBED_BATCH):
        batch = texts[i:i + EMBED_BATCH]
        for attempt in range(5):
            try:
                resp = _req.post(
                    url,
                    headers=headers,
                    data=_json.dumps({"model": "BAAI/bge-m3", "input": batch}),
                    timeout=60,
                )
                resp.raise_for_status()
                data = resp.json()["data"]
                results.extend([e["embedding"] for e in sorted(data, key=lambda x: x["index"])])
                break
            except Exception as e:
                if attempt == 4:
                    raise
                wait = 2 ** attempt
                print(f"[embed] SiliconFlow 调用失败（{e}），{wait}s 后重试...")
                _time.sleep(wait)
    return results


def _upsert_with_retry(records: list[dict], max_retry: int = 5) -> None:
    """把一批 {id, embedding} 写入 tweet_embeddings。

    用 requests 直接调 Supabase REST API，绕过 httpx 在 Clash TUN 模式下的 SSL 断连问题。
    失败时指数退避重试。
    """
    import time
    import requests as _req
    import json as _json

    url = os.environ["SUPABASE_URL"] + "/rest/v1/tweet_embeddings"
    key = os.environ["SUPABASE_SERVICE_KEY"]
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    # PostgREST 需要 vector 列传字符串格式 "[0.1,0.2,...]"，不能传 JSON 数组
    records_to_send = []
    for r in records:
        emb = r["embedding"]
        emb_str = "[" + ",".join(repr(float(x)) for x in emb) + "]"
        records_to_send.append({"id": r["id"], "embedding": emb_str})

    for attempt in range(max_retry):
        try:
            resp = _req.post(url, headers=headers,
                             data=_json.dumps(records_to_send), timeout=60)
            if resp.status_code >= 400:
                print(f"[pgvector] HTTP {resp.status_code} 响应体: {resp.text[:300]}")
            resp.raise_for_status()
            return
        except Exception as e:
            if attempt == max_retry - 1:
                raise
            wait = 2 ** attempt
            print(f"[pgvector] 写入失败（{e}），{wait}s 后重试（{attempt+1}/{max_retry}）...")
            time.sleep(wait)


def upsert_embeddings_for_rows(rows: list[dict]) -> None:
    """给一批已在 tweets 表里的行（含 id 和 text 字段）计算 embedding 并写入 tweet_embeddings。

    用于 auto_crawl 等场景新增推文后的增量更新。
    rows: list of {"id": int, "text": str, ...}
    """
    if not rows:
        return
    texts = [r["text"][:500] for r in rows]
    embeddings = get_embeddings(texts)
    records = [{"id": r["id"], "embedding": emb} for r, emb in zip(rows, embeddings)]
    for i in range(0, len(records), INSERT_BATCH):
        _upsert_with_retry(records[i:i + INSERT_BATCH])


def save_tweets_to_supabase(rows: list[dict]) -> list[dict]:
    """将推文 rows 写入 Supabase tweets 表，返回写入后的行（含 id 字段）。

    通用写入工具：在写入推文的同时拿回 id，以便紧接着写 embedding。
    """
    if not rows:
        return []
    result = _supabase().table("tweets").upsert(
        rows, on_conflict="account,time,text_hash"
    ).execute()
    return result.data or []


def search_pgvector(query: str, top_k: int = 15) -> list[dict]:
    """语义相似度检索，结果格式与原 search_by_topic 完全一致。

    混合排序：cosine 相似度 × 0.5 + 点赞归一化 × 0.5，高互动内容自然排前。
    表不存在时返回空列表（不崩溃）。
    """
    if not _check_schema_ready():
        return []
    q_emb = get_embeddings([query])[0]
    try:
        import requests as _req, json as _json
        url = os.environ["SUPABASE_URL"] + "/rest/v1/rpc/match_tweet_embeddings"
        key = os.environ["SUPABASE_SERVICE_KEY"]
        resp = _req.post(url,
            headers={"apikey": key, "Authorization": f"Bearer {key}",
                     "Content-Type": "application/json"},
            data=_json.dumps({"query_embedding": q_emb, "match_count": top_k}),
            timeout=30)
        resp.raise_for_status()
        rows = resp.json()
    except Exception as e:
        print(f"[pgvector] search_pgvector 调用失败: {e}")
        return []
    if not rows:
        return []
    max_likes = max((r["likes"] for r in rows), default=1) or 1
    out = [
        {
            "account": r["account"],
            "date": r["date"],
            "time": r["time"],
            "likes": r["likes"],
            "retweets": r["retweets"],
            "similarity": round(float(r["similarity"]), 3),
            "text": r["text"][:300],
        }
        for r in rows
    ]
    out.sort(
        key=lambda r: 0.5 * r["similarity"] + 0.5 * r["likes"] / max_likes,
        reverse=True,
    )
    return out


_SCHEMA_NOT_READY = False  # 全局标志：pgvector 表尚未建好，避免重复报同一个错


def count_indexed() -> int:
    """返回 tweet_embeddings 表里已有的 embedding 数量。表不存在时返回 -1。"""
    import requests as _req
    global _SCHEMA_NOT_READY
    url = os.environ["SUPABASE_URL"] + "/rest/v1/tweet_embeddings?select=id"
    key = os.environ["SUPABASE_SERVICE_KEY"]
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Prefer": "count=exact",
        "Range": "0-0",
    }
    try:
        resp = _req.get(url, headers=headers, timeout=15)
        if resp.status_code == 404:
            _SCHEMA_NOT_READY = True
            return -1
        resp.raise_for_status()
        cr = resp.headers.get("content-range", "0-0/0")
        _SCHEMA_NOT_READY = False
        return int(cr.split("/")[-1])
    except Exception:
        _SCHEMA_NOT_READY = True
        return -1


def _check_schema_ready() -> bool:
    """检查 pgvector schema 是否已建好，未建好时打印引导信息。"""
    if count_indexed() < 0:
        print(
            "[pgvector] ⚠️  tweet_embeddings 表不存在，请先在 Supabase SQL 编辑器里运行：\n"
            "   pipeline/pgvector_schema.sql\n"
            "   运行后执行 python embed_to_supabase.py 完成 embedding 迁移。"
        )
        return False
    return True


def _sb_get_count(table: str) -> int:
    """获取 Supabase 表行数，带重试。"""
    import requests as _req, time as _time
    svc = os.environ["SUPABASE_SERVICE_KEY"]
    url = os.environ["SUPABASE_URL"] + f"/rest/v1/{table}?select=id"
    h = {"apikey": svc, "Authorization": f"Bearer {svc}",
         "Prefer": "count=exact", "Range": "0-0"}
    for attempt in range(8):
        try:
            r = _req.get(url, headers=h, timeout=20)
            r.raise_for_status()
            return int(r.headers.get("content-range", "0-0/0").split("/")[-1])
        except Exception as e:
            if attempt == 7:
                raise
            wait = min(2 ** attempt, 60)
            print(f"[pgvector] count {table} 失败（{e}），{wait}s 后重试...")
            _time.sleep(wait)
    return 0


def _sb_get(url: str, headers: dict, timeout: int = 30, max_retry: int = 8) -> list:
    """带指数退避重试的 requests.get，处理 Clash TUN 偶发连接重置。"""
    import requests as _req, time as _time
    for attempt in range(max_retry):
        try:
            r = _req.get(url, headers=headers, timeout=timeout)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if attempt == max_retry - 1:
                raise
            wait = min(2 ** attempt, 60)
            print(f"[pgvector] GET 失败（{e}），{wait}s 后重试（{attempt+1}/{max_retry}）...")
            _time.sleep(wait)
    return []


def _sb_get_ids(table: str) -> set[int]:
    """分页拉取 Supabase 表的全部 id，每页带重试。"""
    svc = os.environ["SUPABASE_SERVICE_KEY"]
    base = os.environ["SUPABASE_URL"] + f"/rest/v1/{table}?select=id"
    ids: set[int] = set()
    offset = 0
    while True:
        h = {"apikey": svc, "Authorization": f"Bearer {svc}",
             "Range": f"{offset}-{offset + 999}"}
        data = _sb_get(base, h, timeout=30)
        if not data:
            break
        ids.update(row["id"] for row in data)
        if len(data) < 1000:
            break
        offset += 1000
    return ids


def _sb_get_rows(table: str, cols: str) -> list[dict]:
    """分页拉取 Supabase 表的指定列，每页带重试。"""
    svc = os.environ["SUPABASE_SERVICE_KEY"]
    base = os.environ["SUPABASE_URL"] + f"/rest/v1/{table}?select={cols}"
    rows: list[dict] = []
    offset = 0
    while True:
        h = {"apikey": svc, "Authorization": f"Bearer {svc}",
             "Range": f"{offset}-{offset + 999}"}
        data = _sb_get(base, h, timeout=60)
        if not data:
            break
        rows.extend(data)
        if len(data) < 1000:
            break
        offset += 1000
    return rows


def build_index_from_siliconflow() -> None:
    """用 SiliconFlow API 对 tweets 表里还没有 embedding 的行批量建索引（增量）。

    全部 Supabase 操作用 requests 直连，绕过 Clash TUN 对 httpx 的干扰。
    """
    emb_count = count_indexed()
    tweet_count = _sb_get_count("tweets")

    if emb_count >= tweet_count:
        print(f"[pgvector] 向量索引已就绪（{emb_count} 条），跳过")
        return

    print(f"[pgvector] 已有 {emb_count} 条，tweets 共 {tweet_count} 条，拉取差集中...")
    existing_ids = _sb_get_ids("tweet_embeddings")
    print(f"[pgvector] tweet_embeddings 实际 {len(existing_ids)} 条，拉取待 embed 推文...")

    all_tweets = _sb_get_rows("tweets", "id,text")
    pending = [r for r in all_tweets if r["id"] not in existing_ids]

    if not pending:
        print("[pgvector] 所有推文已有 embedding")
        return

    print(f"[pgvector] 需要 embed {len(pending)} 条推文（调 SiliconFlow API）...")
    BATCH = 100
    for i in range(0, len(pending), BATCH):
        batch = pending[i:i + BATCH]
        upsert_embeddings_for_rows(batch)
        print(f"[pgvector] 已处理 {min(i + BATCH, len(pending))}/{len(pending)}")
    print("[pgvector] 向量索引就绪")


# ── 关键词检索 / 互动统计：走 Supabase RPC（见 search_stats_rpc.sql） ──────────────
#    排序与聚合都在数据库侧完成，不再把 3 万条推文拉回内存遍历。

_SEARCH_RPC_MISSING = False  # search_stats_rpc.sql 还没在 Supabase 跑过时置位，避免反复报同一个错


def _is_missing_function(text: str) -> bool:
    """PostgREST 在 RPC 函数不存在时返回 404 + PGRST202 / 'Could not find the function'。"""
    t = (text or "").lower()
    return "pgrst202" in t or "could not find the function" in t or "does not exist" in t


def _rpc(fn: str, payload: dict, timeout: int = 30, max_retry: int = 4):
    """调用 Supabase /rest/v1/rpc/<fn>，requests 直连 + 指数退避，绕过 Clash TUN 对 httpx 的干扰。

    函数不存在（schema 未迁移）时抛 RuntimeError("__rpc_missing__")，由调用方降级处理。
    """
    import time as _time
    import requests as _req
    import json as _json

    global _SEARCH_RPC_MISSING
    url = os.environ["SUPABASE_URL"] + f"/rest/v1/rpc/{fn}"
    key = os.environ["SUPABASE_SERVICE_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    for attempt in range(max_retry):
        try:
            resp = _req.post(url, headers=headers, data=_json.dumps(payload), timeout=timeout)
            if resp.status_code == 404 and _is_missing_function(resp.text):
                _SEARCH_RPC_MISSING = True
                raise RuntimeError("__rpc_missing__")
            resp.raise_for_status()
            return resp.json()
        except RuntimeError:
            raise
        except Exception as e:
            if attempt == max_retry - 1:
                raise
            wait = 2 ** attempt
            print(f"[rpc] {fn} 调用失败（{e}），{wait}s 后重试（{attempt+1}/{max_retry}）...")
            _time.sleep(wait)


def _warn_search_rpc_missing() -> None:
    # 不用 emoji：Windows GBK 控制台直接 print emoji 会抛 UnicodeEncodeError
    print(
        "[rpc] 缺少 search_tweets / tweet_stats 函数，关键词检索与互动统计暂不可用。\n"
        "      请在 Supabase SQL 编辑器里运行 pipeline/search_stats_rpc.sql。"
    )


def rpc_search_tweets(keyword: str = "", account: str = "", date: str = "", limit: int = 10) -> list[dict]:
    """关键词/账号/日期检索，按热度降序。表/函数未就绪时返回空列表（不崩溃）。"""
    acc = account.lstrip("@").strip()
    try:
        rows = _rpc("search_tweets", {
            "kw": keyword or "", "acc": acc or "", "dt": date or "", "lim": limit,
        })
    except RuntimeError:
        _warn_search_rpc_missing()
        return []
    except Exception as e:
        print(f"[rpc] search_tweets 调用失败: {e}")
        return []
    return rows or []


def rpc_tweet_stats(keyword: str = "", account: str = "", date: str = "", top_n: int = 5) -> dict:
    """对过滤后的集合做互动汇总 + 热度 top_n。未就绪时返回 {"count": 0}。"""
    acc = account.lstrip("@").strip()
    try:
        data = _rpc("tweet_stats", {
            "kw": keyword or "", "acc": acc or "", "dt": date or "", "top_n": top_n,
        })
    except RuntimeError:
        _warn_search_rpc_missing()
        return {"count": 0}
    except Exception as e:
        print(f"[rpc] tweet_stats 调用失败: {e}")
        return {"count": 0}
    return data or {"count": 0}


def get_date_range() -> tuple[str, str]:
    """tweets 表里数据覆盖的最早/最晚日期。取不到时返回 ("", "")。"""
    try:
        rows = _rpc("tweets_date_range", {})
    except Exception:
        return ("", "")
    if rows:
        r = rows[0]
        return (r.get("start_date") or "", r.get("end_date") or "")
    return ("", "")


def count_tweets() -> int:
    """tweets 表行数（best-effort，单次请求不长重试），失败返回 -1。供 /health 用。"""
    import requests as _req
    url = os.environ["SUPABASE_URL"] + "/rest/v1/tweets?select=id"
    key = os.environ["SUPABASE_SERVICE_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}",
               "Prefer": "count=exact", "Range": "0-0"}
    try:
        resp = _req.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        return int(resp.headers.get("content-range", "0-0/0").split("/")[-1])
    except Exception:
        return -1
