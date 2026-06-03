"""生成修复后的对比图（旧 vs 新坐标，3个振幅），方便视觉验证。"""
from PIL import Image, ImageDraw
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from talking_head import (MOUTH_CX, MOUTH_CY, COVER_W, COVER_H, CYAN, SCREEN_BG,
                           _frame)

SIZE = 720
img = Image.open("avatar.png").convert("RGB")
s = SIZE / img.width
base_s = img.resize((SIZE, SIZE))

cx_s = int(MOUTH_CX * s)
cy_s = int(MOUTH_CY * s)
cw_s = int(COVER_W * s)
ch_s = int(COVER_H * s)
mouth_box  = (cx_s - cw_s, cy_s - ch_s)
mouth_orig = base_s.crop((cx_s - cw_s, cy_s - ch_s, cx_s + cw_s, cy_s + ch_s))

# 生成3帧
for label, amp in [("closed", 0.0), ("half", 0.5), ("open", 1.0)]:
    frame_bytes = _frame(base_s, mouth_orig, mouth_box, amp, s)
    frame = Image.frombytes("RGB", (SIZE, SIZE), frame_bytes)
    # 裁剪脸部放大（约占图片上半中间部分）
    face = frame.crop((200, 50, 520, 370))
    face = face.resize((640, 640))
    face.save(f"scripts/preview_{label}.png")
    print(f"Saved preview_{label}.png (face crop x200-520, y50-370)")
