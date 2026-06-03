"""只看屏幕中心列，找嘴的真实坐标，并保存标注图。"""
from PIL import Image, ImageDraw
import numpy as np

img = Image.open("avatar.png").convert("RGB")
arr = np.array(img)
h, w = arr.shape[:2]
print(f"size: {w}x{h}")

# 只看中心条（x: 900-1200），排除机器人身体边缘
cx_strip = arr[500:1200, 900:1200]
sr, sg, sb = cx_strip[:,:,0].astype(int), cx_strip[:,:,1].astype(int), cx_strip[:,:,2].astype(int)

# 屏幕背景：非常暗的区域（sum < 100）
dark = (sr + sg + sb) < 80
print(f"dark pixels in center strip: {dark.sum()}")

# 逐行看中心列亮色（y=800..1150）
print("\nCenter strip scan (x=900-1200, relative y from 500):")
for y in range(300, 701, 10):  # relative to y_offset=500
    row = cx_strip[y]
    brightness = row.sum(axis=1)
    peak_x = brightness.argmax()
    peak_b = int(brightness[peak_x])
    peak_c = tuple(row[peak_x])
    # 标出暗区（屏幕内）vs 亮区
    dark_count = (brightness < 80).sum()
    label = "<< mouth?" if (peak_b > 200 and dark_count > 50) else ""
    print(f"  abs_y={y+500}: peak x={peak_x+900}, b={peak_b}, c={peak_c}, dark_cols={dark_count} {label}")

# 保存标注图（1/4 缩放）
mark = img.copy().resize((512, 512))
s = 512/2048
d = ImageDraw.Draw(mark)
# 标出当前代码的嘴位置
cx_old, cy_old = int(1061*s), int(868*s)
d.rectangle([cx_old-40, cy_old-20, cx_old+40, cy_old+20], outline=(255, 0, 0), width=3)
d.text((cx_old+5, cy_old-30), "OLD", fill=(255, 0, 0))
mark.save("scripts/avatar_debug.png")
print("\nSaved scripts/avatar_debug.png (red box = current mouth coords)")
