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
AVATAR_IMAGE = os.getenv("AVATAR_IMAGE")  # 数字人形象图路径（自有/已授权，勿用名人脸）
IMG_DIR = Path(__file__).parent / "output" / "images"
VID_DIR = Path(__file__).parent / "output" / "video"

_PLACEHOLDER_HOSTS = ("dreamapi.example",)


def available() -> bool:
    """key 与真实域名都就绪才算可用——供 run.py 判断是否跑多模态。"""
    return bool(DREAM_KEY) and not any(h in DREAM_BASE for h in _PLACEHOLDER_HOSTS)


def _ensure_ready() -> None:
    if not DREAM_KEY:
        raise RuntimeError("缺少 DREAM_API_KEY，请在 pipeline/.env 配置")
    if any(h in DREAM_BASE for h in _PLACEHOLDER_HOSTS):
        raise RuntimeError(
            "DREAM_BASE_URL 还是占位域名。请把 pipeline/.env 里的 DREAM_BASE_URL 换成 "
            "DreamAPI 真实 API 域名，并对照其文档核对 generate_media.py 里标了 TODO 的 endpoint/字段。"
        )


def _headers() -> dict:
    _ensure_ready()
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


def generate_lipsync(audio_path: str | Path, avatar_image: str | Path | None = None) -> Path:
    """LipSync：音频 + 形象图 → 对口型视频。avatar 不传则用 .env 的 AVATAR_IMAGE。"""
    avatar_image = avatar_image or AVATAR_IMAGE
    if not avatar_image:
        raise RuntimeError("缺少数字人形象图：传 avatar_image 或在 pipeline/.env 配 AVATAR_IMAGE（须自有/已授权）")
    audio_path, avatar_image = Path(audio_path), Path(avatar_image)
    if not avatar_image.exists():
        raise FileNotFoundError(f"形象图不存在：{avatar_image}")
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


def generate_for_run(cover_prompt: str, audio_path: str | Path,
                     avatar_image: str | Path | None = None) -> dict:
    """run.py 的一站式入口：出封面图 +（有形象图时）数字人视频。

    单步失败不拖垮整条流水线——记进返回 dict 的 error 字段，已落盘的日报/音频照常保留。
    """
    out: dict = {"cover": None, "video": None, "errors": []}
    try:
        out["cover"] = str(generate_cover(cover_prompt))
    except Exception as e:  # noqa: BLE001
        out["errors"].append(f"封面图失败：{e}")
    avatar = avatar_image or AVATAR_IMAGE
    if not avatar:
        out["errors"].append("跳过数字人视频：未配置 AVATAR_IMAGE 形象图")
    else:
        try:
            out["video"] = str(generate_lipsync(audio_path, avatar))
        except Exception as e:  # noqa: BLE001
            out["errors"].append(f"数字人视频失败：{e}")
    return out


if __name__ == "__main__":
    print(__doc__)
    print("DREAM_API_KEY 已配置：", bool(DREAM_KEY))
    print("DREAM_BASE：", DREAM_BASE)
    print("AVATAR_IMAGE：", AVATAR_IMAGE or "(未配置)")
    print("多模态可用(available)：", available(), "" if available() else "← 需配真实 key + 真实域名")
