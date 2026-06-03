"""生图：用硅基流动(SiliconFlow) OpenAI 兼容接口为日报生成封面图。

封面图按 prompt MD5 前缀命名，同 prompt 命中缓存直接返回（不重复调 API）。
数字人口播视频已由 talking_head.py 本地零成本生成，这里只负责封面图。

用法（单独测试）：
    python generate_media.py "OpenAI 发布 GPT-5，推理能力提升 50%"
    python generate_media.py  # 不传 prompt 则用内置示例

环境变量（pipeline/.env）：
    SILICONFLOW_API_KEY   必填，硅基流动 API key
    SILICONFLOW_BASE_URL  选填，默认 https://api.siliconflow.cn/v1
    SILICONFLOW_MODEL     选填，默认 black-forest-labs/FLUX.1-schnell（免费）
"""
from __future__ import annotations

import base64
import hashlib
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
load_dotenv(Path(__file__).parent / ".env")

import requests  # noqa: E402

SF_KEY   = os.getenv("SILICONFLOW_API_KEY")
SF_BASE  = os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
SF_MODEL = os.getenv("SILICONFLOW_MODEL", "black-forest-labs/FLUX.1-schnell")

IMG_DIR = Path(__file__).parent / "output" / "images"

_STYLE_PREFIX = (
    "digital illustration, tech news cover, silicon valley style, "
    "clean modern design, blue purple gradient background, "
)


def available() -> bool:
    """SILICONFLOW_API_KEY 已配置则可用。"""
    return bool(SF_KEY)


def generate_cover(prompt: str, size: str = "1024x576") -> Path:
    """生一张封面图，返回本地路径。同 prompt 命中本地缓存直接返回，不重复请求。

    Args:
        prompt: 中文摘要（如日报标题或第一行）
        size:   图片尺寸，SiliconFlow 支持 1024x576 / 1024x1024 等

    Returns:
        图片本地路径 (output/images/<hash>.png)
    """
    if not SF_KEY:
        raise RuntimeError("缺少 SILICONFLOW_API_KEY，请在 pipeline/.env 配置")

    key  = hashlib.md5(prompt.encode()).hexdigest()[:16]
    dest = IMG_DIR / f"{key}.png"
    if dest.exists():
        return dest

    full_prompt = _STYLE_PREFIX + prompt

    resp = requests.post(
        f"{SF_BASE}/images/generations",
        json={
            "model":                SF_MODEL,
            "prompt":               full_prompt,
            "image_size":           size,
            "num_inference_steps":  4,   # FLUX.1-schnell 推荐 4 步，够快够免费
            "n":                    1,
        },
        headers={
            "Authorization": f"Bearer {SF_KEY}",
            "Content-Type":  "application/json",
        },
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()

    # SiliconFlow 返回格式兼容 OpenAI: {"data": [{"url": "..."} ...]}
    # 部分模型直接返回 {"images": [{"url": "..."}]}
    images = data.get("data") or data.get("images") or []
    if not images:
        raise RuntimeError(f"SiliconFlow 未返回图片数据: {data}")

    img = images[0]
    img_url = img.get("url")
    b64_raw = img.get("b64_json")

    dest.parent.mkdir(parents=True, exist_ok=True)
    if b64_raw:
        dest.write_bytes(base64.b64decode(b64_raw))
    elif img_url:
        img_resp = requests.get(img_url, timeout=60)
        img_resp.raise_for_status()
        dest.write_bytes(img_resp.content)
    else:
        raise RuntimeError(f"SiliconFlow 响应里找不到图片 URL 或 b64_json: {img}")

    return dest


def generate_for_run(cover_prompt: str, **_kwargs) -> dict:
    """run.py 的一站式入口：生封面图。

    失败记入 errors 字段，不中断主流程（日报 / 音频 / 视频照常保留）。
    """
    out: dict = {"cover": None, "errors": []}
    try:
        out["cover"] = str(generate_cover(cover_prompt))
    except Exception as e:  # noqa: BLE001
        out["errors"].append(f"封面图失败：{e}")
    return out


if __name__ == "__main__":
    _prompt = sys.argv[1] if len(sys.argv) > 1 else "OpenAI 发布 GPT-5，推理能力提升 50%"
    print(f"SILICONFLOW_API_KEY 已配置：{bool(SF_KEY)}")
    print(f"模型：{SF_MODEL}")
    print(f"生图 prompt: {_prompt}")
    _result = generate_for_run(_prompt)
    if _result["cover"]:
        print(f"✓ 封面图已保存：{_result['cover']}")
    for _e in _result["errors"]:
        print(f"✗ {_e}")
