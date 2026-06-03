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
    python run.py "路径/xxx.txt" --media         # 额外出小硅口播视频（屏幕脸+声波驱动，本地免费）
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
from summarize import make_digest, to_script  # noqa: E402
from tts import synth                 # noqa: E402

OUT = Path(__file__).parent / "output"


def run(txt_path: str, voice: str = "zh-CN-XiaoxiaoNeural", use_prefilter: bool = True,
        media: bool = False, avatar: str | None = None) -> dict:
    date = Path(txt_path).stem
    total = 5 if media else 4

    tweets = parse_file(txt_path)
    feed = prefilter(tweets, max_candidates=80) if use_prefilter else tweets
    print(f"[1/{total}] 解析 {len(tweets)} 条" + (f" → 预过滤后 {len(feed)} 条喂给 Kimi" if use_prefilter else ""))

    print(f"[2/{total}] Kimi-k2.5 生成分类日报 ...")
    digest = make_digest(feed)

    print(f"[3/{total}] Kimi 改写口播稿 ...")
    script = to_script(digest)

    print(f"[4/{total}] edge-tts 生成音频 ...")
    audio, cached = synth(script, voice=voice)
    print(f"      音频：{audio.name} {'（缓存命中）' if cached else '（新生成）'}")

    OUT.mkdir(exist_ok=True)
    (OUT / f"{date}_digest.txt").write_text(digest, encoding="utf-8")
    (OUT / f"{date}_script.txt").write_text(script, encoding="utf-8")
    result = {"date": date, "digest": digest, "script": script, "audio": str(audio),
              "cover": None, "video": None,
              "stats": {"raw": len(tweets), "fed": len(feed)}}

    if media:
        from talking_head import render as render_talking
        avatar_path = Path(avatar) if avatar else Path(__file__).parent / "avatar.png"
        if not avatar_path.exists():
            print(f"[5/{total}] 数字人：跳过——找不到形象图 {avatar_path}（见 docs/小硅-形象设定.md）")
        else:
            print(f"[5/{total}] 数字人：小硅屏幕脸 + 声波驱动，合成口播视频 ...")
            video_path = OUT / "video" / f"{date}_小硅.mp4"
            try:
                render_talking(avatar_path, audio, video_path)
                result["video"] = str(video_path)
                print(f"      视频：{video_path.name}")
            except Exception as e:  # noqa: BLE001
                print(f"      ⚠️ 视频生成失败：{e}")

    (OUT / f"{date}.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    produced = f"output/{date}_digest.txt（日报）、{date}_script.txt（口播稿）、{audio.name}（音频）"
    if result.get("video"):
        produced += "、小硅口播视频"
    print(f"[完成] {produced}")
    if not media:
        print("       想出小硅口播视频：加 --media（用 pipeline/avatar.png 屏幕脸 + 声波驱动，本地免费）")
    return result


def _publish(result: dict) -> None:
    from publish import publish
    publish(result["date"], result["digest"], result["script"], title=f"硅谷速递 · {result['date']}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("txt", nargs="?", help="某一天的推文 txt 路径（不传则配合 --crawl 现爬）")
    ap.add_argument("--crawl", action="store_true", help="先按 accounts.json 现爬最近1天再生成")
    ap.add_argument("--voice", default="zh-CN-XiaoxiaoNeural", help="edge-tts 音色")
    ap.add_argument("--no-prefilter", action="store_true", help="不做预过滤，原样喂给 Kimi")
    ap.add_argument("--media", action="store_true", help="额外生成小硅口播视频（屏幕脸 + 声波驱动，本地免费）")
    ap.add_argument("--avatar", default=None, help="形象图路径（默认 pipeline/avatar.png）")
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
    result = run(txt, voice=args.voice, use_prefilter=not args.no_prefilter,
                 media=args.media, avatar=args.avatar)
    if args.publish:
        _publish(result)
