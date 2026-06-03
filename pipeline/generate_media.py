"""多模态生成：封面图（Nano Banana）+ 数字人口播视频（LipSync），走 DreamAPI。

⚠️ 重要：DreamAPI 的确切 endpoint 路径与请求字段，需对照它的「API 文档」确认。
   这里按这类聚合平台**通用的异步模式**搭好骨架（建任务 → 轮询 → 取结果 URL → 下载），
   带 TODO 标出要核对的地方。把 DreamAPI 文档发我，我把 TODO 处补准即可。

- 生图：文本 prompt → 封面图（故事级，可缓存复用）
- 口播视频：音频(edge-tts 产出) + 数字人形象图 → 对口型视频
  注意：形象图要用你有权使用的（平台授权形象 / 自有），别用真人名人脸（肖像权/合规）。
"""
from __future__ import annotations

import os
import sys
import time
import hashlib
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
load_dotenv(Path(__file__).parent / ".env")

import requests  # noqa: E402

DREAM_KEY = os.getenv("DREAM_API_KEY")
DREAM_BASE = os.getenv("DREAM_BASE_URL", "https://api.dreamapi.example")  # TODO: 改成 DreamAPI 真实域名
IMG_DIR = Path(__file__).parent / "output" / "images"
VID_DIR = Path(__file__).parent / "output" / "video"


def _headers() -> dict:
    if not DREAM_KEY:
        raise RuntimeError("缺少 DREAM_API_KEY，请在 pipeline/.env 配置")
    return {"Authorization": f"Bearer {DREAM_KEY}", "Content-Type": "application/json"}


def _create_task(path: str, payload: dict) -> str:
    """POST 建任务，返回 task_id。TODO: 路径/字段名对照 DreamAPI 文档。"""
    r = requests.post(f"{DREAM_BASE}{path}", json=payload, headers=_headers(), timeout=60)
    r.raise_for_status()
    data = r.json()
    return data.get("task_id") or data.get("id") or data["data"]["task_id"]  # TODO: 按文档取


def _poll(path: str, task_id: str, interval: int = 5, timeout: int = 600) -> str:
    """轮询任务直到完成，返回结果文件 URL。TODO: 状态字段/结果字段对照文档。"""
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = requests.get(f"{DREAM_BASE}{path}/{task_id}", headers=_headers(), timeout=30)
        r.raise_for_status()
        data = r.json()
        status = data.get("status")
        if status in ("succeeded", "success", "completed"):
            return data.get("output") or data.get("result_url") or data["data"]["url"]  # TODO
        if status in ("failed", "error"):
            raise RuntimeError(f"DreamAPI 任务失败：{data}")
        time.sleep(interval)
    raise TimeoutError("DreamAPI 任务超时")


def _download(url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    dest.write_bytes(r.content)
    return dest


def generate_cover(prompt: str) -> Path:
    """Nano Banana 生封面图。故事级缓存：同样 prompt 不重复生成。"""
    key = hashlib.md5(prompt.encode("utf-8")).hexdigest()[:16]
    dest = IMG_DIR / f"{key}.png"
    if dest.exists():
        return dest
    # TODO: 路径与字段对照 DreamAPI 文档（模型名、prompt 字段等）
    task = _create_task("/v1/images/generations", {"model": "nano-banana", "prompt": prompt})
    url = _poll("/v1/images/tasks", task)
    return _download(url, dest)


def generate_lipsync(audio_path: str | Path, avatar_image: str | Path) -> Path:
    """LipSync：音频 + 形象图 → 对口型视频。"""
    audio_path, avatar_image = Path(audio_path), Path(avatar_image)
    key = hashlib.md5(f"{audio_path.name}|{avatar_image.name}".encode()).hexdigest()[:16]
    dest = VID_DIR / f"{key}.mp4"
    if dest.exists():
        return dest
    # TODO: LipSync 通常要先把 audio/image 上传拿到 URL，再传给任务接口——对照 DreamAPI 文档
    task = _create_task("/v1/lipsync", {
        "audio_url": "<上传 audio 后的 URL>",   # TODO
        "image_url": "<上传 avatar 后的 URL>",  # TODO
    })
    url = _poll("/v1/lipsync/tasks", task)
    return _download(url, dest)


if __name__ == "__main__":
    print(__doc__)
    print("DREAM_API_KEY 已配置：", bool(DREAM_KEY))
    print("DREAM_BASE：", DREAM_BASE, "（记得对照文档改成真实域名/路径）")
