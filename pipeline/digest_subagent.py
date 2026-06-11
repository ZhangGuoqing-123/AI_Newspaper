"""日报生成子 agent —— 把 run.py 的"选题→摘要→自检重做→口播稿→音频"全链路
封装成一个可被对话式主 agent 委派的独立子任务。

为什么是 subagent 而不是普通工具函数：质检这一步本身就是 LLM 在自主判断
"这版日报够不够好、要不要重来"，这是一个会自己反复折腾的决策循环，不是
写死的处理步骤。把它独立成子 agent，一来名副其实，二来能把"生成-自检-
重做"这一堆吵闹的中间过程隔离在它自己的运行里，主 agent 只在最后拿到一个
干净的成品——不会被子 agent 内部"为什么重做了两次"这种细节弄乱自己的上下文。

跑法（独立测试，不经过对话 agent）：
    python digest_subagent.py 2026-04-14
"""
from __future__ import annotations

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

DATA_DIR = Path(
    r"C:\Users\zhangguoqing\Desktop\AI产品经理准备\Silicon_Valley_Express\model-select\tweets_output\tweets_original"
)


def generate_digest(date: str) -> dict:
    """委派给子 agent：对某一天的推文跑完整的「选题→摘要→自检重做→口播稿→音频」链路，
    跑完后把干净的成品（日报正文、口播稿、音频路径、质检结果）交还给主 agent。"""
    txt_path = DATA_DIR / f"{date}.txt"
    if not txt_path.exists():
        return {"status": "not_found",
                "message": f"本地没有 {date} 这天的推文数据（数据范围是 2026-04-14 ~ 2026-05-12），无法生成简报"}

    from run import run as run_pipeline
    try:
        result = run_pipeline(str(txt_path), media=False, images=False)
    except Exception as e:
        return {"status": "error", "message": f"生成失败：{e}"}

    quality = result.get("quality", {})
    return {
        "status": "ok",
        "date": result["date"],
        "digest": result["digest"],
        "script": result["script"],
        "audio": result.get("audio"),
        "quality_score": quality.get("score"),
        "redo_times": quality.get("redo", 0),
        "stats": result.get("stats"),
        "message": (
            f"已为 {date} 生成完整日报"
            + (f"（质检 {quality.get('score')} 分，经 {quality.get('redo', 0)} 次自检重做后定稿）"
               if not quality.get("skipped") else "（质检环节因缺 key 跳过，直接采用初版）")
        ),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)
    out = generate_digest(sys.argv[1])
    print(json.dumps(out, ensure_ascii=False, indent=2)[:3000])
