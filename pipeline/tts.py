"""语音合成（edge-tts，免费免 key）+ 故事级缓存（碰撞②的解法）。

按文本内容哈希缓存：同一段文案只合成一次。
在真实产品里，这个缓存键就下沉到「故事」粒度——同一条故事出现在多个用户的简报里，
TTS 只生成一次、跨用户复用，让成本与用户数解耦。这里先在「整段口播稿」粒度演示同一机制。
"""
from __future__ import annotations

import sys
import asyncio
import hashlib
from pathlib import Path

CACHE_DIR = Path(__file__).parent / "output" / "audio"


def _cache_key(text: str, voice: str) -> str:
    return hashlib.md5(f"{voice}|{text}".encode("utf-8")).hexdigest()[:16]


async def _synth(text: str, voice: str, path: Path) -> None:
    import edge_tts
    await edge_tts.Communicate(text, voice).save(str(path))


def synth(text: str, voice: str = "zh-CN-XiaoxiaoNeural") -> tuple[Path, bool]:
    """返回 (音频路径, 是否命中缓存)。"""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = CACHE_DIR / f"{_cache_key(text, voice)}.mp3"
    if path.exists():
        return path, True  # 故事级缓存命中，零成本复用
    asyncio.run(_synth(text, voice, path))
    return path, False
