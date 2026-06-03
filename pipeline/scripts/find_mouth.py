"""
精确找嘴：在屏幕内部（dark region）里找最亮的集中区域 = 静态微笑。
同时生成三张测试帧（嘴开30%/60%/100%），帮助视觉对齐。
"""
from PIL import Image, ImageDraw
import numpy as np

img = Image.open("avatar.png").convert("RGB")
arr = np.array(img)
W, H = img.size   # 2048x2048

# ── 1. 找屏幕内部边界（连续的暗区） ────────────────────────────
DARK_THRESH = 90
# 竖向扫描：中心列 x=1024，找屏幕顶部和底部
col = arr[:, 1024]  # (H, 3)
col_bright = col.sum(axis=1)
screen_pixels = col_bright < DARK_THRESH
# 找连续暗区
runs = []
in_run = False
for i, v in enumerate(screen_pixels):
    if v and not in_run:
        start = i; in_run = True
    elif not v and in_run:
        runs.append((start, i-1)); in_run = False
if in_run:
    runs.append((start, H-1))
print("Dark runs on center column (x=1024):")
for s, e in runs:
    print(f"  y={s}..{e} ({e-s+1}px), sample color={tuple(arr[s+(e-s)//2, 1024])}")

# 选最大暗区（屏幕）
if runs:
    screen_top, screen_bot = max(runs, key=lambda r: r[1]-r[0])
    screen_mid = (screen_top + screen_bot) // 2
    print(f"\nScreen (dark) region: y={screen_top}..{screen_bot}, mid={screen_mid}")
else:
    screen_top, screen_bot = 600, 1100
    print("No dark runs found, using fallback")

# ── 2. 在屏幕下半部分找静态嘴（最亮集中区域） ───────────────────
mouth_search_top = screen_top + (screen_bot - screen_top) * 2 // 3   # 下1/3
mouth_region = arr[mouth_search_top:screen_bot, 800:1300]
mr = mouth_region.sum(axis=2)   # brightness per pixel
# 找最亮行
row_b = mr.mean(axis=1)
best_row = int(row_b.argmax())
mouth_cy = best_row + mouth_search_top
# 找最亮列
col_b = mr[best_row]
best_col = int(col_b.argmax()) + 800
mouth_cx = best_col
peak_color = tuple(arr[mouth_cy, mouth_cx])
print(f"\nStatic mouth candidate: ({mouth_cx}, {mouth_cy}), color={peak_color}, brightness={int(row_b[best_row]):.0f}")

# 估算嘴的宽高（连续亮区）
row_pixels = mr[best_row]
threshold = row_pixels.max() * 0.3
bright_cols = np.where(row_pixels > threshold)[0]
if len(bright_cols):
    mouth_w = (bright_cols[-1] - bright_cols[0]) // 2
    mouth_cx_refined = int(bright_cols.mean()) + 800
    print(f"Mouth width estimate: ±{mouth_w}px, refined cx={mouth_cx_refined}")
    mouth_cx = mouth_cx_refined

# 找嘴高度
bright_rows = np.where(row_b > row_b.max() * 0.3)[0]
if len(bright_rows):
    mouth_h = (bright_rows[-1] - bright_rows[0]) // 2
    mouth_cy_refined = int(bright_rows.mean()) + mouth_search_top
    print(f"Mouth height estimate: ±{mouth_h}px, refined cy={mouth_cy_refined}")
    mouth_cy = mouth_cy_refined
else:
    mouth_h = 40

# ── 3. 查 SCREEN_BG 颜色（嘴旁边的暗像素） ───────────────────────
bg_samples = []
for dx in [-200, -150, 200, 250]:
    x = mouth_cx + dx
    if 0 < x < W:
        bg_samples.append(tuple(arr[mouth_cy, x]))
bg_mean = tuple(int(np.mean([s[i] for s in bg_samples])) for i in range(3))
print(f"\nScreen BG near mouth (samples): {bg_samples}")
print(f"Screen BG mean: RGB{bg_mean}")

# ── 4. 输出修复参数 ────────────────────────────────────────────
print(f"\n{'='*50}")
print(f"MOUTH_CX, MOUTH_CY = {mouth_cx}, {mouth_cy}")
print(f"SCREEN_BG = {bg_mean}")
print(f"Cover rect: ±{max(mouth_w+30, 160)}, ±{max(mouth_h+20, 60)}")
print(f"{'='*50}")

# ── 5. 生成测试帧（缩到720px），存PNG ─────────────────────────
SIZE = 720
s = SIZE / W
base_s = img.resize((SIZE, SIZE))
SCREEN_BG_c = bg_mean
CYAN_c = (73, 190, 241)
cx_s = mouth_cx * s
cy_s = mouth_cy * s
cw = max(mouth_w + 30, 160) * s
ch = max(mouth_h + 20, 60) * s

for amp_label, amp in [("closed", 0.0), ("half", 0.5), ("open", 1.0)]:
    im = base_s.copy()
    d = ImageDraw.Draw(im)
    # 盖嘴
    d.rounded_rectangle([cx_s-cw, cy_s-ch, cx_s+cw, cy_s+ch],
                        radius=int(40*s), fill=SCREEN_BG_c)
    if amp < 0.12:
        d.arc([cx_s-70*s, cy_s-30*s, cx_s+70*s, cy_s+35*s],
              start=20, end=160, fill=CYAN_c, width=max(6, int(12*s)))
    else:
        h = (20 + amp * 55) * s
        w = (75 + amp * 20) * s
        d.ellipse([cx_s-w, cy_s-h, cx_s+w, cy_s+h], fill=CYAN_c)
    im.save(f"scripts/test_mouth_{amp_label}.png")
    print(f"Saved test_mouth_{amp_label}.png")

# 也画一张对比原始位置
im_old = base_s.copy()
d = ImageDraw.Draw(im_old)
old_cx, old_cy = 1061*s, 868*s
d.rectangle([old_cx-10, old_cy-10, old_cx+10, old_cy+10], fill=(255,0,0))
d.text((old_cx+12, old_cy-8), "OLD (1061,868)", fill=(255,0,0))
d.rectangle([cx_s-10, cy_s-10, cx_s+10, cy_s+10], fill=(0,255,0))
d.text((cx_s+12, cy_s-8), f"NEW ({mouth_cx},{mouth_cy})", fill=(0,255,0))
im_old.save("scripts/mouth_positions.png")
print("Saved mouth_positions.png (red=old coords, green=new coords)")
