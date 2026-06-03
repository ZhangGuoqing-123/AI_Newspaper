"""找小硅 avatar.png 里嘴巴的实际位置和屏幕背景色。"""
from PIL import Image
import numpy as np

img = Image.open("avatar.png").convert("RGB")
w, h = img.size
print(f"size: {w} x {h}")

arr = np.array(img)

# 屏幕区域大约在 x: 700-1400, y: 400-1200
region = arr[400:1200, 700:1400]
flat = region.reshape(-1, 3)
# 最暗色 = 屏幕背景
darkest = flat[np.argmin(flat.sum(axis=1))]
print(f"screen_bg darkest: RGB{tuple(darkest)}")
# 众数（最常见的暗色）
dark_mask = flat.sum(axis=1) < 60
if dark_mask.any():
    dark_pixels = flat[dark_mask]
    mean_dark = dark_pixels.mean(axis=0).astype(int)
    print(f"screen_bg mean of dark pixels: RGB{tuple(mean_dark)}")

# 扫描嘴区域（下半张脸）：找青色/白色集中区域（嘴是青色椭圆）
# 嘴大概在 y: 800-1050, x: 850-1250
mouth_region = arr[800:1050, 850:1250]

# 找青色像素（R低、G中高、B高）
mr = mouth_region[:, :, 0].astype(int)
mg = mouth_region[:, :, 1].astype(int)
mb = mouth_region[:, :, 2].astype(int)
cyan_mask = (mb > 150) & (mg > 100) & (mr < 120)
if cyan_mask.any():
    ys, xs = np.where(cyan_mask)
    cx = int(xs.mean()) + 850
    cy = int(ys.mean()) + 800
    print(f"mouth cyan center (approx): ({cx}, {cy})")
    print(f"mouth cyan x range: {xs.min()+850} - {xs.max()+850}")
    print(f"mouth cyan y range: {ys.min()+800} - {ys.max()+800}")
else:
    print("no cyan pixels found in mouth region, trying broader search")
    # 找最亮区域
    bright = mouth_region.sum(axis=2)
    ys, xs = np.where(bright > bright.max() * 0.7)
    if len(ys):
        cx = int(xs.mean()) + 850
        cy = int(ys.mean()) + 800
        print(f"mouth bright center: ({cx}, {cy})")

# 逐行扫描找亮色
print("\nRow scan (y=750..1050, x center column):")
for y in range(750, 1051, 25):
    row_colors = [tuple(arr[y, x]) for x in [950, 1000, 1061, 1100, 1150]]
    brightest = max(row_colors, key=sum)
    print(f"  y={y}: brightest={brightest} at x={[950,1000,1061,1100,1150][row_colors.index(brightest)]}")
