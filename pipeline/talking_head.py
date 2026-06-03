"""屏幕脸数字人：把小硅(机器人)屏幕上的嘴按音频波形开合，合成口播视频。

两种模式：
  render()            — 正方形视频，纯机器人
  render_with_board() — 宽屏视频：左侧机器人口播 + 右侧小黑板显示今日要点

为什么这么做（讲法）：小硅是机器人，脸是一块屏幕——所以"说话"不需要 SadTalker 那种
对真人脸做生成式对口型，直接用**音频振幅驱动屏幕上的嘴开合**即可：
本地、免费、无需 GPU/API key、对口型 100% 准，还完全契合"它是机器人"的设定。
呼应讲法稿《项目深挖讲法》3.3「能可控就别用生成式」。
"""
from __future__ import annotations

import sys
import math
import subprocess
import textwrap
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# 小硅 avatar.png(2048²)的屏幕配色与嘴位置（由 avatar 校准，换形象图需重标）
# 屏幕暗区：y=455..701，嘴在屏幕下沿 y≈667，x≈1060
# 校准方法：python pipeline/scripts/find_mouth.py
SCREEN_BG = (5, 13, 46)      # 屏幕底色（深navy，均值自实测）
CYAN = (73, 190, 241)        # 发光青
MOUTH_CX, MOUTH_CY = 1060, 667   # 旧值 (1061,868) 在屏幕下方身体上，已校准
BASE_REF = 2048              # 上述坐标对应的基准边长
COVER_W, COVER_H = 155, 52  # 遮盖矩形半宽/半高（2048 坐标系，需覆盖原静态嘴）


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


def _frame(base: Image.Image, mouth_orig: Image.Image,
           mouth_box: tuple, amp: float, s: float) -> bytes:
    """在缩放后的底图上画当前帧的嘴，返回 rgb24 字节。

    mouth_orig: 预裁剪的原始嘴区像素（用于精确恢复背景，避免背景色不匹配）
    mouth_box:  (x0, y0) 贴回坐标（720px 坐标系）
    s:          2048→720 的缩放系数
    """
    im = base.copy()
    # 先恢复原始嘴区像素（比用纯色 fill 更准确，无背景色不匹配问题）
    im.paste(mouth_orig, mouth_box)
    d = ImageDraw.Draw(im)
    cx, cy = MOUTH_CX * s, MOUTH_CY * s
    if amp < 0.12:
        # 闭嘴：一条微笑弧（与原始静态笑脸重叠，几乎看不出差异）
        d.arc((cx - 68 * s, cy - 28 * s, cx + 68 * s, cy + 38 * s),
              start=15, end=165, fill=CYAN, width=max(5, int(13 * s)))
    else:
        # 张嘴：高度随振幅，椭圆盖住原静态嘴
        h = (16 + amp * 50) * s
        w = (62 + amp * 22) * s
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

    # 预裁剪嘴区（720px 坐标系），用于每帧恢复原始背景像素
    cx_s  = int(MOUTH_CX * s)
    cy_s  = int(MOUTH_CY * s)
    cw_s  = int(COVER_W * s)
    ch_s  = int(COVER_H * s)
    mouth_box  = (cx_s - cw_s, cy_s - ch_s)
    mouth_orig = base_s.crop((cx_s - cw_s, cy_s - ch_s,
                               cx_s + cw_s, cy_s + ch_s))

    env, dur = _audio_envelope(audio_path, fps)

    enc = [FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{size}x{size}", "-r", str(fps), "-i", "-",
           "-i", str(audio_path),
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
           "-shortest", "-v", "error", str(out_path)]
    p = subprocess.Popen(enc, stdin=subprocess.PIPE)
    for amp in env:
        p.stdin.write(_frame(base_s, mouth_orig, mouth_box, float(amp), s))
    p.stdin.close()
    if p.wait() != 0:
        raise RuntimeError("ffmpeg 合成视频失败")
    return out_path


# ── 小黑板渲染 ─────────────────────────────────────────────────────────────

# 黑板配色
BOARD_BG      = (28,  55,  35)   # 深绿黑板底色
BOARD_LINE    = (60, 100,  65)   # 黑板线条（横格线）
CHALK_WHITE   = (245, 242, 228)  # 粉笔白
CHALK_YELLOW  = (255, 235, 120)  # 粉笔黄（标题/高亮）
CHALK_CYAN    = (130, 235, 240)  # 粉笔青（要点符号）

# Windows 中文字体优先列表
_FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyh.ttc",       # Microsoft YaHei
    r"C:\Windows\Fonts\simhei.ttf",     # SimHei
    r"C:\Windows\Fonts\simsun.ttc",     # SimSun
    r"C:\Windows\Fonts\arial.ttf",      # Arial（无中文，兜底）
]


def _load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for p in _FONT_CANDIDATES:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def _board_frame(board_w: int, board_h: int,
                 date: str, bullet_points: list[str],
                 progress: float) -> Image.Image:
    """生成一帧小黑板图像。progress 0→1 控制要点逐行"写出"动画。"""
    im = Image.new("RGB", (board_w, board_h), BOARD_BG)
    d  = ImageDraw.Draw(im)

    # 横格线（装饰）
    for y in range(40, board_h, 40):
        d.line([(20, y), (board_w - 20, y)], fill=BOARD_LINE, width=1)

    # 标题区
    f_title  = _load_font(max(18, board_w // 22))
    f_body   = _load_font(max(14, board_w // 30))
    f_bullet = _load_font(max(18, board_w // 22))

    title = "📡 硅谷速递"
    d.text((board_w // 2, 28), title, font=f_title, fill=CHALK_YELLOW, anchor="mm")

    sub = f"今日要点  {date}"
    d.text((board_w // 2, 58), sub, font=f_body, fill=CHALK_WHITE, anchor="mm")

    # 分隔线（粉笔风格：虚线）
    dash_y = 74
    for x in range(20, board_w - 20, 12):
        d.line([(x, dash_y), (x + 7, dash_y)], fill=CHALK_WHITE, width=2)

    # 要点列表（逐行显示，由 progress 控制显示多少条）
    n_visible = max(1, int(progress * len(bullet_points) + 0.5))
    line_h   = (board_h - 95) // max(len(bullet_points), 1)
    max_chars = max(10, board_w // f_body.size - 2)

    for i, point in enumerate(bullet_points[:n_visible]):
        y0 = 90 + i * line_h
        # 要点符号
        d.text((22, y0 + line_h // 2), "◆", font=f_bullet,
               fill=CHALK_CYAN, anchor="lm")
        # 正文（自动换行）
        wrapped = textwrap.fill(point, width=max_chars)
        d.text((48, y0 + line_h // 2), wrapped, font=f_body,
               fill=CHALK_WHITE, anchor="lm")

    # 底部小标注
    d.text((board_w - 10, board_h - 10), "AI 生成", font=f_body,
           fill=(*CHALK_WHITE[:3], 100), anchor="rb")  # type: ignore
    return im


def render_with_board(
    avatar_path: str | Path,
    audio_path: str | Path,
    out_path: str | Path,
    bullet_points: list[str],
    date: str = "",
    fps: int = 25,
    height: int = 720,
) -> Path:
    """生成宽屏口播视频：左侧小硅口播 + 右侧小黑板显示今日要点。

    布局：左 45%（机器人）+ 右 55%（黑板），总宽 ≈ height * 16/9
    bullet_points 由 summarize.to_bullet_points(digest) 生成。
    """
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    robot_w = int(height * 0.75)          # 机器人区（正方形截取后等高）
    board_w = int(height * (16/9 - 0.75)) # 黑板区
    total_w = robot_w + board_w

    # 机器人底图（裁成 robot_w × height，机器人居中）
    base_full = Image.open(avatar_path).convert("RGB")
    scale     = height / base_full.height
    rw_scaled = int(base_full.width * scale)
    base_full_s = base_full.resize((rw_scaled, height))
    # 横向居中裁 robot_w 宽
    left = max(0, (rw_scaled - robot_w) // 2)
    base_robot = base_full_s.crop((left, 0, left + robot_w, height))

    # 嘴坐标换算（原始 2048 → height，再减去左侧偏移 left）
    s_full = height / base_full.height
    cx_s   = int(MOUTH_CX * s_full) - left
    cy_s   = int(MOUTH_CY * s_full)
    cw_s   = int(COVER_W  * s_full)
    ch_s   = int(COVER_H  * s_full)
    mouth_box  = (cx_s - cw_s, cy_s - ch_s)
    mouth_orig = base_robot.crop((cx_s - cw_s, cy_s - ch_s,
                                   cx_s + cw_s, cy_s + ch_s))

    env, dur = _audio_envelope(audio_path, fps)
    n_frames  = len(env)

    # 预渲染所有黑板帧（要点逐步显示：前 1/3 时间写完全部要点）
    board_frames = []
    for fi in range(n_frames):
        progress = min(1.0, fi / max(1, n_frames * 0.35))
        board_frames.append(_board_frame(board_w, height, date, bullet_points, progress))

    enc = [FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{total_w}x{height}", "-r", str(fps), "-i", "-",
           "-i", str(audio_path),
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
           "-shortest", "-v", "error", str(out_path)]
    p = subprocess.Popen(enc, stdin=subprocess.PIPE)

    for fi, amp in enumerate(env):
        # 左侧：机器人帧
        robot_frame = Image.frombytes(
            "RGB", (robot_w, height),
            _frame(base_robot, mouth_orig, mouth_box, float(amp), s_full)
        )
        # 合并左右
        wide = Image.new("RGB", (total_w, height))
        wide.paste(robot_frame, (0, 0))
        wide.paste(board_frames[fi], (robot_w, 0))
        p.stdin.write(wide.tobytes())

    p.stdin.close()
    if p.wait() != 0:
        raise RuntimeError("ffmpeg 合成宽屏视频失败")
    return out_path


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: python talking_head.py <avatar.png> <audio.mp3> [out.mp4] [--board '要点1|要点2|...']")
        sys.exit(1)
    avatar, audio = sys.argv[1], sys.argv[2]
    out = sys.argv[3] if len(sys.argv) > 3 else "output/video/小硅_demo.mp4"

    # 检测是否有 --board 参数
    if "--board" in sys.argv:
        idx = sys.argv.index("--board")
        points_raw = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else ""
        points = [p.strip() for p in points_raw.split("|") if p.strip()]
        if not points:
            points = ["今日 AI 日报已生成", "请查看详细内容"]
        print(f"渲染宽屏黑板版（{len(points)} 条要点）...")
        path = render_with_board(avatar, audio, out, points)
    else:
        print("渲染中 ...")
        path = render(avatar, audio, out)
    print(f"完成：{path}")
