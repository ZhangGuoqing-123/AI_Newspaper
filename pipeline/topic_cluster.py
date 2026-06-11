"""把最近爬到的推文聚成「热门讨论话题」，知乎热榜式呈现。

为什么这样设计（成本是关键）：
- **聚类不用 LLM**：直接用已存的 bge-m3 向量算余弦相似度做贪心聚类，纯计算、零 API 成本。
- **LLM 只给话题起名**：每个簇一次 DeepSeek 调用产出「标题+一句话」，一轮重算也就十几个调用。
- **结果定时算好、整体缓存**：写入 trending_topics 单行快照，前端只读缓存。
  所以 LLM 成本只跟「多久重算一次」有关，跟访问量、跟爬取频率都无关。

由 auto_crawl 在每轮爬完后调用 run_topic_clustering_once()，也可命令行单独跑：
    python topic_cluster.py            # 默认窗口近 3 天
    python topic_cluster.py --days 2
"""
from __future__ import annotations

import json
import os
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
os.environ.setdefault("NO_PROXY", "*")
os.environ.setdefault("no_proxy", "*")

from llm import chat_json, deepseek, qwen

# —— 调参 ——
WINDOW_DAYS = 3        # 话题窗口：聚最近几天的推文
POOL_LIMIT = 700       # 窗口内按热度取前 N 条进聚类，够覆盖热点又不让弱噪音灌进来
SIM_THRESHOLD = 0.58   # 余弦相似度 ≥ 此值视为同一话题（bge-m3 经验值）
MIN_TEXT_LEN = 15      # 过滤「True」「Yes」这类无话题信息的超短高赞噪音
MIN_TWEETS = 2         # 一个簇至少几条才算「话题」
TOP_TOPICS = 12        # 榜单展示的话题数上限
SAMPLES_PER_TOPIC = 8  # 每个话题展开后带几条代表推文

# 政治/个人生活等明显非 AI 的硬过滤词：命中 text 或 quoted 即在聚类前直接剔除，
# 作为 LLM relevant 判定之外的「确定性兜底」——LLM 偶尔会放行马斯克的政治引用推，
# 这层拦在前面更稳。只放几乎不可能出现在正经 AI 话题里的词，避免误伤：
# 故意不放 policy/regulation/congress/senate（AI 监管/立法是用户要看的合法话题）。
_DENYLIST = [
    # 选举 / 政治
    "election", "voter", "voting", "ballot", "immigration", "immigrant", "deport",
    "nhs", "homeless", "skid row", "welfare", "fertility", "birth rate", "birthrate",
    "gaza", "israel", "palestin", "maga", "save america",
    # 个人生活 / 无关消费
    "wedding", "marriage", "luggage", "rimowa",
    # 中文
    "选举", "投票", "移民", "生育率", "无家可归", "巴以", "加沙", "婚礼", "行李箱",
]


def _hits_denylist(text: str) -> bool:
    low = (text or "").lower()
    return any(kw in low for kw in _DENYLIST)


def _headers() -> dict:
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def _fetch_window(days: int) -> tuple[list[dict], str, str]:
    """取最近 days 天、带 embedding 的推文（按热度降序，上限 POOL_LIMIT）。

    以库里最新日期为锚往回数，避免某天爬取滞后导致窗口落空。
    """
    base = os.environ["SUPABASE_URL"] + "/rest/v1/tweets"
    h = _headers()

    r = requests.get(base + "?select=date&order=date.desc&limit=1", headers=h, timeout=20)
    r.raise_for_status()
    rows = r.json()
    until = rows[0]["date"] if rows else date.today().isoformat()
    try:
        anchor = date.fromisoformat(until)
    except ValueError:
        anchor = date.today()
    since = (anchor - timedelta(days=max(days, 1) - 1)).isoformat()

    # quoted：引用推文/回复时，真正的内容在被引用的那条里（text 只是表层短评论）。
    # 带上它，让起名/过滤/前端都能看到真正在聊什么，不被「Worthwhile exercise」这类空壳误导。
    base_cols = "id,account,text,quoted,date,likes,retweets,replies,views,engagement,tweet_embeddings(embedding)"

    def _query(cols: str):
        params = f"?select={cols}&date=gte.{since}&order=engagement.desc&limit={POOL_LIMIT}"
        return requests.get(base + params, headers=h, timeout=60)

    # 优先带 tweet_id（深链原文用）；若该列还没建（add_tweet_id.sql 未跑），回退不带它
    r = _query(base_cols.replace("tweet_embeddings", "tweet_id,tweet_embeddings"))
    if r.status_code >= 400:
        r = _query(base_cols)
    r.raise_for_status()
    data = r.json()

    # 只留有 embedding 的（新爬的偶尔 embedding 还没补上，跳过即可）
    out = []
    denied = 0
    for row in data:
        # 跳过无话题信息的超短推文（"True"/"Yes" 之类高赞噪音）
        if len((row.get("text") or "").strip()) < MIN_TEXT_LEN:
            continue
        # 政治/个人生活硬过滤：text + quoted 任一命中 denylist 就剔除，不让它进聚类
        if _hits_denylist((row.get("text") or "") + " " + (row.get("quoted") or "")):
            denied += 1
            continue
        emb = row.get("tweet_embeddings")
        if isinstance(emb, dict):
            emb = emb.get("embedding")
        if not emb:
            continue
        try:
            vec = np.asarray(json.loads(emb), dtype=np.float32)
        except (TypeError, ValueError):
            continue
        row["_vec"] = vec
        out.append(row)
    if denied:
        print(f"[topic] denylist 硬过滤掉 {denied} 条政治/个人内容推文")
    return out, since, until


def _cluster(rows: list[dict]) -> list[list[dict]]:
    """贪心余弦聚类：按热度降序，高热推文先成簇心（让话题热度天然反映互动量）。

    每条与各簇心比相似度，够近就并入并增量更新簇心向量，否则自立门户。
    O(n·簇数)，n≤POOL_LIMIT，毫秒级，无外部调用。
    """
    if not rows:
        return []
    mats = np.stack([r["_vec"] for r in rows])
    norms = np.linalg.norm(mats, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    mats = mats / norms  # 单位化，点积即余弦

    centroids: list[np.ndarray] = []  # 各簇归一化质心
    members: list[list[int]] = []
    for i in range(len(rows)):
        v = mats[i]
        if centroids:
            sims = np.array([float(np.dot(v, c)) for c in centroids])
            best = int(sims.argmax())
            if sims[best] >= SIM_THRESHOLD:
                members[best].append(i)
                m = mats[members[best]].mean(axis=0)
                n = np.linalg.norm(m) or 1.0
                centroids[best] = m / n
                continue
        centroids.append(v.copy())
        members.append([i])

    clusters = [[rows[idx] for idx in idxs] for idxs in members]
    return [c for c in clusters if len(c) >= MIN_TWEETS]


def _topic_namer():
    """话题起名用的模型：优先千问（中文新闻标题更利落），无 QWEN_API_KEY 回退 DeepSeek。"""
    if os.getenv("QWEN_API_KEY"):
        try:
            return qwen()
        except Exception:
            pass
    return deepseek()


def _name_topic(tweets: list[dict]) -> dict:
    """一次 LLM 调用：给一簇推文起中文标题 + 一句话总结，并判断是否「狭义 AI」话题。

    relevant 字段让我们在同一次调用里顺手筛掉偏题话题。口径是**狭义 AI**（大模型 / agent /
    AI 产品与公司 / AI 研究与应用），不是广义科技——否则首屏会变成「马斯克私人电台」：
    火箭航天、电动车制造、马斯克的政治/人生感悟全被算成科技刷屏。这些一律 relevant=false。
    """
    lines = []
    for t in tweets[:6]:
        txt = (t.get("text") or "").replace("\n", " ")[:160]
        # 引用推文/回复：真正内容在 quoted 里，带上才能判准话题与相关性
        q = (t.get("quoted") or "").replace("\n", " ").strip()[:200]
        line = f"- @{t['account']}: {txt}"
        if q:
            line += f"（其引用/回复的原文：{q}）"
        lines.append(line)
    corpus = "\n".join(lines)
    system = (
        "你是科技媒体的资深新闻编辑，专给 AI 科技热榜写标题。"
        "下面是一组在讨论同一件事的推文，请像写一条新闻头条那样提炼成一个中文话题。只输出 JSON。\n"
        "标题硬性要求：\n"
        "1. 具体点出『谁 + 做了什么 / 抛出什么观点』，让人不点开也大致知道发生了啥；\n"
        "2. 只抓这组推文里最核心的那一件事，抓不准就抓讨论量最大的那条；\n"
        "3. 绝对禁止用『与 / 和 / 及』把两件不相关的事生硬拼成一个标题——宁可只说一件；\n"
        "4. 不超过18字，不带#号、不带书名号、不要标点堆砌，干脆利落。\n"
        "好标题示例：『OpenAI 发布 GPT-5.5，主打 Agent 编排』『马斯克称 xAI 年底开源 Grok-3』『Anthropic 估值传将破 3000 亿美元』。\n"
        "坏标题示例：『特斯拉AI招聘与游戏』（两件不相关硬拼）、『关于人工智能的一些讨论』（空泛没信息）、"
        "『大佬们聊了聊大模型』（含糊不点名）。"
    )
    user = (
        f"推文：\n{corpus}\n\n"
        "输出 JSON：{"
        "\"title\": \"按上面要求写的新闻标题，不超过18字\", "
        "\"summary\": \"一句话点出这个话题在聊什么、有什么信息增量，不超过40字\", "
        "\"relevant\": true/false  // 严格判断：这个话题是否真的在讲【狭义 AI】——"
        "即大模型/LLM、AI agent、AI 产品与功能、AI 公司动态(OpenAI/Anthropic/Google DeepMind/xAI 等)、"
        "AI 研究突破、AI 创业与融资、AI 应用落地、AI 行业观点。是→true。\n"
        "    以下一律 false（哪怕发推的是科技大佬）：火箭/航天/SpaceX、电动车/自动驾驶硬件制造、"
        "政治/选举/移民/战争、个人生活/人生感悟/物理或哲学思辨、明星八卦、与 AI 无关的商业八卦。\n"
        "    边界判定：内容必须把 AI 作为主角。『马斯克谈 Grok 新版本』=true（讲 AI 产品）；"
        "『马斯克喊人来特斯拉但只是招聘口号、没具体 AI 内容』=false；『SpaceX 火箭复用』=false；"
        "『马斯克称人类正在消失』=false（人生感悟，不是 AI）。"
        "}"
    )
    try:
        data = chat_json(_topic_namer(), system, user, max_tokens=220)
        title = str(data.get("title") or "").strip()[:24]
        summary = str(data.get("summary") or "").strip()[:60]
        relevant = bool(data.get("relevant", True))
        if title:
            return {"title": title, "summary": summary, "relevant": relevant}
    except Exception as e:
        print(f"[topic] 起名失败，退回默认标题: {e}")
    # 兜底：用最高热推文的账号 + 截断正文（兜底一律保留，不误杀）
    top = tweets[0]
    return {
        "title": (top.get("text") or "")[:18] or f"@{top['account']} 的讨论",
        "summary": "",
        "relevant": True,
    }


def _to_sample(t: dict) -> dict:
    return {
        "account": t["account"],
        "date": t.get("date", ""),
        "text": (t.get("text") or "")[:280],
        # 引用推文/回复时被引用的原文，前端展示成嵌套引用块，避免「只有一句短评论」的空壳观感
        "quoted": (t.get("quoted") or "")[:400],
        "likes": t.get("likes", 0),
        "retweets": t.get("retweets", 0),
        "engagement": t.get("engagement", 0),
        "tweet_id": t.get("tweet_id") or "",  # 深链原文；存量数据为空，前端回退作者主页
    }


def build_topics(days: int = WINDOW_DAYS) -> dict:
    """完整流程：取窗口 → 聚类 → 选 top → 起名 → 组装快照（不落库，供测试/复用）。"""
    rows, since, until = _fetch_window(days)
    print(f"[topic] 窗口 {since}~{until}，带向量推文 {len(rows)} 条")
    clusters = _cluster(rows)
    print(f"[topic] 聚出 {len(clusters)} 个 ≥{MIN_TWEETS} 条的簇")

    # 簇按「总热度」排序——多人高互动讨论的话题更靠前
    def heat(c):
        return sum(t.get("engagement", 0) for t in c)

    clusters.sort(key=heat, reverse=True)

    # 多起几个名（取热度前 TOP_TOPICS*2 的簇），过滤掉非 AI/科技话题后，留前 TOP_TOPICS 个，
    # 这样相关性过滤剔掉政治/八卦后，榜单仍能凑够数量。
    topics = []
    skipped = 0
    for c in clusters[: TOP_TOPICS * 2]:
        if len(topics) >= TOP_TOPICS:
            break
        c.sort(key=lambda t: t.get("engagement", 0), reverse=True)
        named = _name_topic(c)
        if not named.get("relevant", True):
            skipped += 1
            print(f"[topic] 跳过非科技话题：{named['title']}")
            continue
        topics.append({
            "rank": len(topics) + 1,
            "title": named["title"],
            "summary": named["summary"],
            "heat": int(heat(c)),
            "tweet_count": len(c),
            "accounts": sorted({t["account"] for t in c}),
            "tweets": [_to_sample(t) for t in c[:SAMPLES_PER_TOPIC]],
        })
        print(f"[topic] #{len(topics)} {named['title']}（{len(c)} 条 / 热度 {heat(c)}）")

    print(f"[topic] 命中 {len(topics)} 个科技话题，过滤掉 {skipped} 个偏题话题")
    return {"topics": topics, "window_since": since, "window_until": until}


def _save_snapshot(snapshot: dict) -> None:
    """整体覆盖写入 trending_topics 单行快照（id=1）。"""
    url = os.environ["SUPABASE_URL"] + "/rest/v1/trending_topics"
    h = _headers()
    h["Prefer"] = "resolution=merge-duplicates,return=minimal"
    body = {
        "id": 1,
        "topics": snapshot["topics"],
        "window_since": snapshot["window_since"],
        "window_until": snapshot["window_until"],
        "computed_at": "now()",
    }
    # computed_at 用数据库默认值，别传字符串
    body.pop("computed_at", None)
    resp = requests.post(url, headers=h, data=json.dumps(body), timeout=30)
    if resp.status_code >= 400:
        print(f"[topic] 写入 trending_topics 失败 HTTP {resp.status_code}: {resp.text[:300]}")
        resp.raise_for_status()


def run_topic_clustering_once(days: int = WINDOW_DAYS) -> int:
    """聚类一轮并落库，返回话题数。供调度器在每轮爬完后调用。"""
    try:
        snapshot = build_topics(days)
    except Exception as e:
        print(f"[topic] 聚类失败（跳过本轮）: {e}")
        return 0
    if not snapshot["topics"]:
        print("[topic] 本轮没有聚出话题，跳过写入")
        return 0
    try:
        _save_snapshot(snapshot)
        print(f"[topic] 已写入 {len(snapshot['topics'])} 个话题到 trending_topics")
    except Exception as e:
        print(f"[topic] 落库失败: {e}")
    return len(snapshot["topics"])


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=WINDOW_DAYS)
    ap.add_argument("--dry", action="store_true", help="只聚类打印，不落库")
    args = ap.parse_args()
    if args.dry:
        snap = build_topics(args.days)
        # Windows GBK 控制台直接 print 含 emoji 的 JSON 会崩，按 utf-8 写 stdout buffer
        import sys
        out = json.dumps(snap, ensure_ascii=False, indent=2)[:3000]
        sys.stdout.buffer.write(out.encode("utf-8", errors="replace"))
        sys.stdout.buffer.write(b"\n")
    else:
        run_topic_clustering_once(args.days)
