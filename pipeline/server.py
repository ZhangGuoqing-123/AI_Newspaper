"""HTTP 服务层：把 chat_agent 的工具调用循环包装成 SSE 流，供前端实时展示。

agent 在工作线程里跑，通过 _tool_event_hook 把"正在调哪个工具/返回了什么"
逐条推到 SSE 流上，前端据此渲染工具调用轨迹，最后再推 final_answer。

跑法：
    uvicorn server:app --reload --port 8787
"""
from __future__ import annotations

import json
import queue
import threading
import uuid

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from fastapi import HTTPException

from chat_agent import run_chat, _tool_event_hook
from auto_crawl import start_scheduler, _supabase
from supabase_vector import count_tweets, rpc_search_tweets

app = FastAPI(title="硅谷速递 Agent API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _on_startup():
    """服务起来后台跑定时巡检——每天 0 点自动去 TikHub 爬一遍 sources 表里的活跃信源（爬当天的），
    写入 Supabase 并计算 embedding 并入检索索引，让情报库保持每日更新。"""
    start_scheduler()


class ChatTurn(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    history: list[ChatTurn] | None = None  # 本次对话之前的轮次，支持多轮上下文


class AddSourceRequest(BaseModel):
    screen_name: str


@app.get("/health")
def health():
    return {"status": "ok", "tweets_in_db": count_tweets()}


# ── 趋势/榜单 ──────────────────────────────────────────────────────────────────

@app.get("/trends")
def trends(limit: int = 30, days: int = 7):
    """榜单页数据：热门推文榜 + 账号声量榜，限定在「最近 days 天」的时间窗内。

    关键设计——只看最近 N 天，而非全库历史总热度：
    库里数据每天 0 点自动爬新（auto_crawl），但若按全量历史互动量排，几个月前的爆款
    （如某条百万赞旧推）会永远霸榜，榜单失去"当下在聊什么"的新闻感。所以按数据里的
    最新日期往回数 days 天圈定窗口，让榜单始终反映近期热度。

    成本：零。窗口数据全是已落库的每日爬取结果，不触发任何 TikHub 实时调用；
    用 PostgREST 的 date>=cutoff + engagement 生成列降序直接查，无需新增 SQL。
    """
    from datetime import date as _date, timedelta

    # 以库里最新一天为基准往回数（而非服务器当天），即便某天爬取滞后窗口也不会落空。
    _, end_date = get_date_range()
    try:
        anchor = _date.fromisoformat(end_date) if end_date else _date.today()
    except ValueError:
        anchor = _date.today()
    cutoff = (anchor - timedelta(days=max(days, 1) - 1)).isoformat()

    # 取窗口内热度前 1000 做候选池：@elonmusk 这类账号互动量是其他人的数百倍，
    # 池子要够深，per-account 限流后其他账号的高热推文才进得来。
    cols = "account,kind,time,likes,retweets,replies,views,text,date,engagement"
    try:
        resp = (
            _supabase().table("tweets").select(cols)
            .gte("date", cutoff)
            .order("engagement", desc=True)
            .limit(1000).execute()
        )
        pool = resp.data or []
    except Exception as e:
        print(f"[trends] 窗口查询失败，回退全量 RPC: {e}")
        pool = rpc_search_tweets(limit=1000)

    if not pool:
        return {"top_tweets": [], "top_accounts": [], "window": {"since": cutoff, "until": anchor.isoformat(), "days": days}}

    # 同一账号在热门榜最多占 PER_ACCOUNT_CAP 条，避免单个高声量账号霸屏，
    # 让榜单体现"圈子里多少人在讨论"而非"谁嗓门最大"。
    from collections import defaultdict
    PER_ACCOUNT_CAP = 2
    per_acc = defaultdict(int)
    top_tweets = []
    for r in pool:
        if per_acc[r["account"]] >= PER_ACCOUNT_CAP:
            continue
        per_acc[r["account"]] += 1
        top_tweets.append(r)
        if len(top_tweets) >= limit:
            break
    agg: dict = defaultdict(lambda: {"engagement": 0, "count": 0})
    for r in pool:
        a = agg[r["account"]]
        a["engagement"] += r.get("engagement", 0)
        a["count"] += 1
    top_accounts = sorted(
        ({"account": k, "engagement": v["engagement"], "count": v["count"]} for k, v in agg.items()),
        key=lambda x: x["engagement"], reverse=True,
    )[:10]

    return {
        "top_tweets": top_tweets,
        "top_accounts": top_accounts,
        "window": {"since": cutoff, "until": anchor.isoformat(), "days": days},
    }


# ── 热门话题榜（知乎热榜式）────────────────────────────────────────────────────

@app.get("/topics")
def topics():
    """读 topic_cluster.py 定时聚类好的话题快照（单行，id=1）。

    成本与访问量无关：前端每次打开只读这一行缓存，话题是后台每 6 小时重算一次的。
    表未建好（trending_topics.sql 还没跑）或暂无快照时返回空，前端显示空态。
    """
    try:
        resp = _supabase().table("trending_topics").select("*").eq("id", 1).limit(1).execute()
        rows = resp.data or []
    except Exception as e:
        print(f"[topics] 读取失败（trending_topics 表可能未建）: {e}")
        return {"topics": [], "window": {}, "computed_at": None}
    if not rows:
        return {"topics": [], "window": {}, "computed_at": None}
    r = rows[0]
    return {
        "topics": r.get("topics") or [],
        "window": {"since": r.get("window_since"), "until": r.get("window_until")},
        "computed_at": r.get("computed_at"),
    }


# ── 信源管理 ──────────────────────────────────────────────────────────────────

@app.get("/sources")
def list_sources():
    resp = _supabase().table("sources").select("*").order("added_at").execute()
    return resp.data


@app.post("/sources", status_code=201)
def add_source(req: AddSourceRequest):
    name = req.screen_name.lstrip("@").strip()
    if not name:
        raise HTTPException(status_code=400, detail="screen_name 不能为空")
    try:
        _supabase().table("sources").insert({"screen_name": name}).execute()
    except Exception as e:
        raise HTTPException(status_code=409, detail=f"添加失败（可能已存在）: {e}")
    return {"screen_name": name, "active": True}


@app.patch("/sources/{screen_name}")
def toggle_source(screen_name: str, active: bool):
    _supabase().table("sources").update({"active": active}).eq("screen_name", screen_name).execute()
    return {"screen_name": screen_name, "active": active}


@app.delete("/sources/{screen_name}", status_code=204)
def delete_source(screen_name: str):
    _supabase().table("sources").delete().eq("screen_name", screen_name).execute()


@app.post("/chat/stream")
def chat_stream(req: ChatRequest, x_user_id: str | None = Header(default=None)):
    session_id = uuid.uuid4().hex
    event_q: "queue.Queue[dict]" = queue.Queue()

    def emit(event: dict):
        event_q.put(event)

    def worker():
        token_e = _tool_event_hook.set(emit)
        try:
            event_q.put({"type": "session_start", "session_id": session_id})
            hist = [{"role": t.role, "content": t.content} for t in (req.history or [])]
            answer = run_chat(req.question, user_id=x_user_id, history=hist)
            event_q.put({"type": "final_answer", "content": answer})
        except Exception as e:
            event_q.put({"type": "error", "message": str(e)})
        finally:
            _tool_event_hook.reset(token_e)
            event_q.put({"type": "done"})

    threading.Thread(target=worker, daemon=True).start()

    def gen():
        while True:
            event = event_q.get()
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            if event.get("type") == "done":
                break

    return StreamingResponse(gen(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8787, reload=False)
