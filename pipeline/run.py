"""硅谷速递 · 多模态 demo 主流程（忠于用户真实流程）。

  [可选] 按关注账号从 TikHub 爬当天 → 解析推文
       → 轻量预过滤(去低信号转发/近似去重，省 token)
       → Kimi-k2.5 出分类日报（用户真实 prompt）
       → Kimi 改写口播稿
       → edge-tts 出音频（故事级缓存）
       → 落盘；数字人视频用免费方案单独出（见 README）

用法：
    python run.py --crawl                       # 现爬 accounts.json 的账号(最近1天)→日报→口播→音频
    python run.py "路径/2026-04-14.txt"          # 用已有的某天 txt 跑（不爬）
    python run.py "路径/xxx.txt" --voice zh-CN-YunxiNeural --no-prefilter
    python run.py "路径/xxx.txt" --media         # 额外出小硅口播视频（正方形，屏幕脸+声波驱动）
    python run.py "路径/xxx.txt" --board         # 宽屏视频：左侧机器人口播 + 右侧小黑板要点
    python run.py "路径/xxx.txt" --images        # 额外用 SiliconFlow 生成日报封面图
    python run.py "路径/xxx.txt" --board --images  # 全套：宽屏黑板视频 + 封面图
"""
from __future__ import annotations

import sys
import json
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from parse_tweets import parse_file   # noqa: E402
from select import prefilter          # noqa: E402
from summarize import make_digest, to_script, to_bullet_points  # noqa: E402
from tts import synth                 # noqa: E402

OUT = Path(__file__).parent / "output"


def _self_check(feed, digest: str, max_redo: int) -> dict:
    """LLM-as-judge 自检-重生成闭环：质检不达标就带着问题反馈重做，最多 max_redo 次。

    这是本项目「够得上 agent 而非 workflow」的关键决策点之一。
    DeepSeek 未配置时优雅跳过，不阻断主流程。
    """
    try:
        from judge import judge
        verdict = judge(digest, feed)
    except Exception as e:  # noqa: BLE001 —— 多为缺 DEEPSEEK_API_KEY
        print(f"      质检跳过（{e.__class__.__name__}），直接采用初版")
        return {"_digest": digest, "skipped": True}

    redo = 0
    while not verdict.get("ok") and redo < max_redo:
        redo += 1
        print(f"      质检未过 score={verdict.get('score')}：{verdict.get('issues')}；第 {redo} 次重做")
        digest = make_digest(feed, feedback=verdict.get("issues"))
        verdict = judge(digest, feed)
    print(f"      质检 score={verdict.get('score')}、ok={verdict.get('ok')}、重做 {redo} 次")
    return {"_digest": digest, "skipped": False, "ok": verdict.get("ok"),
            "score": verdict.get("score"), "redo": redo, "issues": verdict.get("issues")}


def _story_select(candidates: list, n: int = 8) -> list:
    """DeepSeek 选题 agent：从候选集里挑最重要的 n 条，无 key 时优雅跳过。

    这是「碰撞①」的 LLM 决策层——prefilter 先按信噪比裁量，
    select_stories 再按新闻价值精选，两层互补。
    """
    try:
        from select import select_stories
        result = select_stories(candidates, n=n)
        stories = result.get("stories", [])
        if not stories:
            print("      选题：DeepSeek 未返回有效故事列表，保留全部候选")
            return candidates
        valid_idx = {s["tweet_index"] for s in stories if isinstance(s.get("tweet_index"), int)}
        selected = [t for i, t in enumerate(candidates) if i in valid_idx]
        return selected if selected else candidates
    except Exception as e:  # noqa: BLE001
        print(f"      选题跳过（{e.__class__.__name__}），保留全部候选")
        return candidates


def _cover_prompt_from_digest(digest: str) -> str:
    """用 Kimi 把日报提炼成英文封面图 prompt（调用 summarize.to_cover_prompt）。
    Kimi 不可用时回退到简单文本提取。
    """
    try:
        from summarize import to_cover_prompt
        return to_cover_prompt(digest)
    except Exception:  # noqa: BLE001
        # 兜底：取首行有意义文字
        for line in digest.splitlines():
            stripped = line.strip().lstrip()
            while stripped and ord(stripped[0]) > 0x2500:
                stripped = stripped[1:].lstrip()
            if len(stripped) > 10:
                return stripped[:80]
        return "硅谷 AI 日报封面，科技感蓝紫渐变"


def run(txt_path: str, voice: str = "zh-CN-XiaoxiaoNeural", use_prefilter: bool = True,
        use_select: bool = True, select_n: int = 10,
        media: bool = False, board: bool = False, images: bool = False,
        avatar: str | None = None, max_redo: int = 2) -> dict:
    date = Path(txt_path).stem
    total = 4 + (1 if (media or board) else 0) + (1 if images else 0)

    tweets = parse_file(txt_path)
    candidates = prefilter(tweets, max_candidates=80) if use_prefilter else tweets
    print(f"[1/{total}] 解析 {len(tweets)} 条" + (f" → 预过滤后候选 {len(candidates)} 条" if use_prefilter else ""))

    # DeepSeek 选题 agent：从候选集挑最重要的 select_n 条（有 key 时生效，无 key 跳过）
    if use_select:
        print(f"         DeepSeek 选题 agent：从 {len(candidates)} 候选里精选 {select_n} 条重要新闻 ...")
        feed = _story_select(candidates, n=select_n)
        if len(feed) < len(candidates):
            print(f"         → 精选后 {len(feed)} 条喂给 Kimi")
    else:
        feed = candidates

    print(f"[2/{total}] Kimi-k2.5 生成日报 + DeepSeek 质检自检（最多重做 {max_redo} 次）...")
    digest = make_digest(feed)
    quality = _self_check(feed, digest, max_redo)
    digest = quality.pop("_digest")

    print(f"[3/{total}] Kimi 改写口播稿 ...")
    script = to_script(digest)

    print(f"[4/{total}] edge-tts 生成音频 ...")
    audio, cached = synth(script, voice=voice)
    print(f"      音频：{audio.name} {'（缓存命中）' if cached else '（新生成）'}")

    OUT.mkdir(exist_ok=True)
    (OUT / f"{date}_digest.txt").write_text(digest, encoding="utf-8")
    (OUT / f"{date}_script.txt").write_text(script, encoding="utf-8")
    result = {"date": date, "digest": digest, "script": script, "audio": str(audio),
              "cover": None, "video": None, "quality": quality,
              "stats": {"raw": len(tweets), "candidates": len(candidates), "fed": len(feed)}}

    step = 5
    if media or board:
        from talking_head import render as render_talking, render_with_board
        avatar_path = Path(avatar) if avatar else Path(__file__).parent / "avatar.png"
        if not avatar_path.exists():
            print(f"[{step}/{total}] 数字人：跳过——找不到形象图 {avatar_path}")
        else:
            video_path = OUT / "video" / f"{date}_小硅.mp4"
            try:
                if board:
                    print(f"[{step}/{total}] 宽屏黑板视频：Kimi 提炼要点 + 合成小黑板口播 ...")
                    bullets = to_bullet_points(digest)
                    print(f"      要点：{' | '.join(bullets)}")
                    render_with_board(avatar_path, audio, video_path, bullets, date=date)
                else:
                    print(f"[{step}/{total}] 数字人：小硅屏幕脸 + 声波驱动，合成口播视频 ...")
                    render_talking(avatar_path, audio, video_path)
                result["video"] = str(video_path)
                print(f"      视频：{video_path.name}")
            except Exception as e:  # noqa: BLE001
                print(f"      ⚠️ 视频生成失败：{e}")
        step += 1

    if images:
        from generate_media import generate_for_run as gen_cover, available as sf_available
        if not sf_available():
            print(f"[{step}/{total}] 封面图：跳过——缺 SILICONFLOW_API_KEY（在 pipeline/.env 配置）")
        else:
            cover_prompt = _cover_prompt_from_digest(digest)
            print(f"[{step}/{total}] SiliconFlow 生成封面图：{cover_prompt[:50]}…")
            media_result = gen_cover(cover_prompt)
            if media_result["cover"]:
                result["cover"] = media_result["cover"]
                print(f"      封面图：{Path(media_result['cover']).name}")
            for err in media_result["errors"]:
                print(f"      ⚠️ {err}")

    (OUT / f"{date}.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    produced = f"output/{date}_digest.txt（日报）、{date}_script.txt（口播稿）、{audio.name}（音频）"
    if result.get("video"):
        produced += "、小硅口播视频"
    if result.get("cover"):
        produced += f"、封面图({Path(result['cover']).name})"
    if not quality.get("skipped"):
        produced += f"（质检 {quality.get('score')} 分，重做 {quality.get('redo')} 次）"
    stats = result["stats"]
    print(f"[完成] {produced}")
    print(f"       漏斗：原始 {stats['raw']} → 预过滤 {stats['candidates']} → 选题 {stats['fed']} 条")
    hints = []
    if not media:
        hints.append("--media（小硅口播视频，本地免费）")
    if not images:
        hints.append("--images（SiliconFlow 封面图，需配 key）")
    if hints:
        print(f"       可选：{'、'.join(hints)}")
    return result


def _publish(result: dict) -> None:
    from publish import publish
    stats = result.get("stats", {})
    publish(
        result["date"], result["digest"], result["script"],
        title=f"硅谷速递 · {result['date']}",
        audio_url=result.get("audio"),
        video_url=result.get("video"),
        cover_url=result.get("cover"),
        article_count=stats.get("raw", 0),
        channel_count=0,   # pipeline 目前按 accounts 抓，暂无频道分组计数
    )


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("txt", nargs="?", help="某一天的推文 txt 路径（不传则配合 --crawl 现爬）")
    ap.add_argument("--crawl", action="store_true", help="先按 accounts.json 现爬最近1天再生成")
    ap.add_argument("--voice", default="zh-CN-XiaoxiaoNeural", help="edge-tts 音色")
    ap.add_argument("--no-prefilter", action="store_true", help="不做预过滤，原样喂给 Kimi")
    ap.add_argument("--no-select", action="store_true", help="跳过 DeepSeek 选题 agent，把全部候选直接喂给 Kimi")
    ap.add_argument("--select-n", type=int, default=10, help="DeepSeek 选题 agent 精选条数（默认 10）")
    ap.add_argument("--media", action="store_true", help="正方形口播视频（屏幕脸 + 声波驱动，本地免费）")
    ap.add_argument("--board", action="store_true", help="宽屏黑板视频：左侧机器人口播 + 右侧小黑板要点（需 Kimi key）")
    ap.add_argument("--images", action="store_true", help="额外用 SiliconFlow 生成日报封面图（需配 SILICONFLOW_API_KEY）")
    ap.add_argument("--avatar", default=None, help="形象图路径（默认 pipeline/avatar.png）")
    ap.add_argument("--max-redo", type=int, default=2, help="质检不达标的最大重做次数（自检闭环）")
    ap.add_argument("--publish", action="store_true", help="生成后写入 Supabase（需配 SUPABASE_*）")
    args = ap.parse_args()

    txt = args.txt
    if args.crawl:
        from crawl import crawl_accounts, load_accounts
        files = crawl_accounts(load_accounts(), days=1)
        if not files:
            print("没爬到内容，退出")
            sys.exit(1)
        txt = str(files[-1])  # 用最新一天
    if not txt:
        ap.error("要么传 txt 路径，要么加 --crawl")
    result = run(txt, voice=args.voice,
                 use_prefilter=not args.no_prefilter,
                 use_select=not args.no_select, select_n=args.select_n,
                 media=args.media, board=args.board, images=args.images,
                 avatar=args.avatar, max_redo=args.max_redo)
    if args.publish:
        _publish(result)
