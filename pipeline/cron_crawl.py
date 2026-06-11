"""单次爬取 + 重算话题的入口脚本（跑一轮就退出）。

给「外部定时器」用——不依赖后端服务常驻：
- GitHub Actions 定时工作流（免费、云端、不用开电脑，推荐）
- Windows 计划任务（本地，只在电脑开机时跑）
- 任何 cron / 云函数

和 server.py 启动时挂的 APScheduler 是两条独立的路径：APScheduler 只在后端进程
常驻时才会每 6 小时触发；本脚本则是「跑一次就走」，让定时这件事交给外部更可靠的调度器。

跑法：
    python cron_crawl.py                 # 爬最近 7 小时（默认，配合每 6 小时一轮）
    python cron_crawl.py --hours 50      # 补爬最近 50 小时（填补长时间没跑的缺口）
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--hours", type=int, default=7,
                    help="回看小时数；默认 7（每 6 小时一轮、留 1h 重叠）。长时间没跑时调大以补缺口。")
    ap.add_argument("--no-cluster", action="store_true", help="只爬取，不重算话题")
    args = ap.parse_args()

    from auto_crawl import run_auto_crawl_once
    print(f"[{datetime.now():%Y-%m-%d %H:%M}] 开始爬取（回看 {args.hours}h）", flush=True)
    try:
        run_auto_crawl_once(lookback_hours=args.hours)
    except Exception as e:
        print(f"[cron] 爬取出错: {e}", flush=True)
        return 1

    if not args.no_cluster:
        print(f"[{datetime.now():%Y-%m-%d %H:%M}] 重算热门话题", flush=True)
        try:
            from topic_cluster import run_topic_clustering_once
            run_topic_clustering_once()
        except Exception as e:
            print(f"[cron] 话题聚类出错: {e}", flush=True)
            return 1

    print(f"[{datetime.now():%Y-%m-%d %H:%M}] 完成", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
