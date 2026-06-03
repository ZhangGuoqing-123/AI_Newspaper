"""预览宽屏黑板布局（不需要音频，只看画面）。"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from talking_head import _board_frame, MOUTH_CX, MOUTH_CY, COVER_W, COVER_H, _frame
from PIL import Image

SAMPLE_BULLETS = [
    "GLM-5.1 开源，编程超越 Claude Code",
    "OpenAI 内部备忘录：转向建护城河",
    "Anthropic 新增诺华前 CEO 进董事会",
    "HF 低成本 OCR 两万七千篇论文",
    "AI 儿童玩具安全隐患，美国会拟禁",
    "SATO 3D 生成技术被 SIGGRAPH 录用",
]

HEIGHT = 720
robot_w = int(HEIGHT * 0.75)
board_w = int(HEIGHT * (16/9 - 0.75))
total_w = robot_w + board_w

# 机器人帧（闭嘴）
base_full = Image.open("avatar.png").convert("RGB")
scale = HEIGHT / base_full.height
rw_scaled = int(base_full.width * scale)
base_full_s = base_full.resize((rw_scaled, HEIGHT))
left = max(0, (rw_scaled - robot_w) // 2)
base_robot = base_full_s.crop((left, 0, left + robot_w, HEIGHT))

s_full = HEIGHT / base_full.height
cx_s   = int(MOUTH_CX * s_full) - left
cy_s   = int(MOUTH_CY * s_full)
cw_s   = int(COVER_W  * s_full)
ch_s   = int(COVER_H  * s_full)
mouth_box  = (cx_s - cw_s, cy_s - ch_s)
mouth_orig = base_robot.crop((cx_s - cw_s, cy_s - ch_s, cx_s + cw_s, cy_s + ch_s))
robot_frame = Image.frombytes("RGB", (robot_w, HEIGHT),
                               _frame(base_robot, mouth_orig, mouth_box, 0.6, s_full))

# 黑板帧（全部要点显示）
board_frame = _board_frame(board_w, HEIGHT, "2026-06-03", SAMPLE_BULLETS, 1.0)

# 合并
wide = Image.new("RGB", (total_w, HEIGHT))
wide.paste(robot_frame, (0, 0))
wide.paste(board_frame, (robot_w, 0))
wide.save("scripts/preview_board.png")
print(f"Saved preview_board.png  ({total_w}x{HEIGHT})")
