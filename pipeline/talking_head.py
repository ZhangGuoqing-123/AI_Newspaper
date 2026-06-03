"""屏幕脸数字人：把小硅(机器人)屏幕上的嘴按音频波形开合，合成口播视频。

为什么这么做（讲法）：小硅是机器人，脸是一块屏幕——所以"说话"不需要 SadTalker 那种
对真人脸做生成式对口型，直接用**音频振幅驱动屏幕上的嘴开合**即可：
本地、免费、无需 GPU/API key、对口型 100% 准，还完全契合"它是机器人"的设定。
呼应讲法稿《项目深挖讲法》3.3「能可控就别用生成式」。

实现：ffmpeg(用 imageio-ffmpeg 自带二进制) 解码音频取每帧 RMS 振幅 →
      PIL 在屏幕嘴区域逐帧重绘(闭嘴微笑弧 / 张嘴椭圆) → 帧流 + 音频 mux 成 MP4。
"""
from __future__ import annotations

import sys
import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# 小硅 avatar.png(2048²)的屏幕配色与嘴位置（由 avatar 校准，换形象图需重标）
SCREEN_BG = (6, 11, 41)      # 屏幕底色（深navy）
CYAN = (73, 190, 241)        # 发光青
MOUTH_CX, MOUTH_CY = 1061, 868
BASE_REF = 2048              # 上述坐标对应的基准边长


def _audio_envelope(audio_path: str | Path, fps: int, sr: int = 16000) -> tuple[np.ndarray, float]:
    """用 ffmpeg 把音频解码成单声道 PCM，算出每个视频帧的 RMS 振幅(归一化 0..1)。"""
    cmd = [FFMPEG, "-i", str(audio_path), "-ac", "1", "-ar", str(sr),
           "-f", "s16le", "-v", "quiet", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    pcm = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if pcm.size == 0:
        raise RuntimeError(f"音频解码失败：{audio_path}")
    dur = pcm.size / sr
    n = max(1, int(math.ceil(dur * fps)))
    hop = pcm.size / n
    env = np.array([
        np.sqrt(np.mean(pcm[int(i * hop):int((i + 1) * hop)] ** 2) + 1e-9)
        for i in range(n)
    ])
    if env.max() > 0:
        env = env / env.max()
    env = np.power(env, 0.6)                       # 提一下小音量的响应
    env = np.convolve(env, np.ones(3) / 3, "same")  # 轻微平滑去抖
    return env, dur


def _frame(base: Image.Image, amp: float, s: float) -> bytes:
    """在缩放后的底图上画当前帧的嘴，返回 rgb24 字节。s=相对 2048 的缩放系数。"""
    im = base.copy()
    d = ImageDraw.Draw(im)
    cx, cy = MOUTH_CX * s, MOUTH_CY * s
    # 盖掉原始笑嘴
    d.rounded_rectangle((cx - 150 * s, cy - 80 * s, cx + 150 * s, cy + 80 * s),
                        radius=int(45 * s), fill=SCREEN_BG)
    if amp < 0.12:
        # 闭嘴：一条微笑弧
        d.arc((cx - 70 * s, cy - 35 * s, cx + 70 * s, cy + 45 * s),
              start=20, end=160, fill=CYAN, width=max(6, int(14 * s)))
    else:
        # 张嘴：高度随振幅
        h = (18 + amp * 60) * s
        w = (70 + amp * 25) * s
        d.ellipse((cx - w, cy - h, cx + w, cy + h), fill=CYAN)
    return im.tobytes()


def render(avatar_path: str | Path, audio_path: str | Path, out_path: str | Path,
           fps: int = 25, size: int = 720) -> Path:
    """生成口播 MP4：小硅静态图 + 音频波形驱动的嘴。返回输出路径。"""
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    base = Image.open(avatar_path).convert("RGB")
    s = size / base.width
    base_s = base.resize((size, size))
    env, dur = _audio_envelope(audio_path, fps)

    enc = [FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{size}x{size}", "-r", str(fps), "-i", "-",
           "-i", str(audio_path),
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
           "-shortest", "-v", "error", str(out_path)]
    p = subprocess.Popen(enc, stdin=subprocess.PIPE)
    for amp in env:
        p.stdin.write(_frame(base_s, float(amp), s))
    p.stdin.close()
    if p.wait() != 0:
        raise RuntimeError("ffmpeg 合成视频失败")
    return out_path


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: python talking_head.py <avatar.png> <audio.mp3> [out.mp4]")
        sys.exit(1)
    avatar, audio = sys.argv[1], sys.argv[2]
    out = sys.argv[3] if len(sys.argv) > 3 else "output/video/小硅_demo.mp4"
    print("渲染中 ...")
    path = render(avatar, audio, out)
    print(f"完成：{path}")
