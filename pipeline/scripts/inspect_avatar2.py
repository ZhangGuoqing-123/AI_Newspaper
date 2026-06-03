"""精确定位小硅 avatar.png 的嘴巴区域（排除眼睛）。"""
from PIL import Image
import numpy as np

img = Image.open("avatar.png").convert("RGB")
arr = np.array(img)
h, w = arr.shape[:2]
print(f"size: {w}x{h}")

# 屏幕背景色 - 取大面积暗区均值
region = arr[400:1400, 600:1500]
flat = region.reshape(-1, 3).astype(int)
dark_mask = flat.sum(axis=1) < 80
print(f"screen_bg mean: RGB{tuple(flat[dark_mask].mean(axis=0).astype(int))}")

# 把屏幕分成上半（眼睛）和下半（嘴）
# 从图片看，下半脸约 y > 950
print("\n--- 眼睛区域 (y=550..900) ---")
eye_r = arr[550:900, 700:1400]
er, eg, eb = eye_r[:,:,0].astype(int), eye_r[:,:,1].astype(int), eye_r[:,:,2].astype(int)
eye_cyan = (eb > 150) & (eg > 100) & (er < 150)
if eye_cyan.any():
    ys, xs = np.where(eye_cyan)
    print(f"  cyan center: ({xs.mean()+700:.0f}, {ys.mean()+550:.0f})")
    print(f"  y range: {ys.min()+550} - {ys.max()+550}")
    print(f"  x range: {xs.min()+700} - {xs.max()+700}")

print("\n--- 嘴巴区域 (y=920..1150) ---")
mouth_r = arr[920:1150, 700:1400]
mr, mg, mb = mouth_r[:,:,0].astype(int), mouth_r[:,:,1].astype(int), mouth_r[:,:,2].astype(int)
# 嘴：亮色（青/白/蓝），比背景亮很多
bright_mask = (mr + mg + mb) > 150
if bright_mask.any():
    ys, xs = np.where(bright_mask)
    cx = int(xs.mean()) + 700
    cy = int(ys.mean()) + 920
    xmin, xmax = xs.min()+700, xs.max()+700
    ymin, ymax = ys.min()+920, ys.max()+920
    print(f"  bright center: ({cx}, {cy})")
    print(f"  x range: {xmin} - {xmax} (width={xmax-xmin})")
    print(f"  y range: {ymin} - {ymax} (height={ymax-ymin})")
    # 取最亮的颜色
    brightness = bright_mask.astype(int) * (mr + mg + mb)
    peak_y, peak_x = np.unravel_index(brightness.argmax(), brightness.shape)
    print(f"  brightest pixel: ({peak_x+700}, {peak_y+920}) = {tuple(arr[peak_y+920, peak_x+700])}")
else:
    print("  no bright pixels found")

# 逐行精扫 y=920..1150
print("\n  Row scan:")
for y in range(920, 1155, 15):
    row = arr[y, 750:1350]
    b = row.sum(axis=1)
    idx = b.argmax()
    print(f"    y={y}: x={idx+750}, color={tuple(row[idx])}, brightness={int(b[idx])}")

# 采样背景色（嘴左侧深色区域）
print("\n  Screen BG samples near mouth:")
for (y, x) in [(980, 800), (1000, 800), (1050, 850), (1050, 1250)]:
    print(f"    ({x},{y}): {tuple(arr[y, x])}")
