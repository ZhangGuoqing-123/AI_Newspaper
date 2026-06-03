"""保存嘴区放大图 + 确认精确坐标。"""
from PIL import Image, ImageDraw
import numpy as np

img = Image.open("avatar.png").convert("RGB")
arr = np.array(img)

# 保存嘴区放大图 (y=850..1080, x=850..1250)
crop = img.crop((850, 850, 1250, 1080))
crop_big = crop.resize((800, 460))
crop_big.save("scripts/mouth_crop.png")
print("Saved mouth_crop.png — y=850..1080, x=850..1250")

# 在该区域找嘴：颜色比 screen_bg 亮，不是黑色
mc = arr[850:1080, 850:1250]
brightness = mc.sum(axis=2)

# 找亮度突出的行（比中位数亮很多）
row_brightness = brightness.mean(axis=1)
median_b = np.median(row_brightness)
print(f"\nMedian row brightness in crop: {median_b:.1f}")
print("Bright rows (> 1.5x median):")
for i, b in enumerate(row_brightness):
    if b > median_b * 1.5:
        abs_y = i + 850
        # 找该行的亮列
        row = mc[i]
        row_b = row.sum(axis=1)
        bright_cols = np.where(row_b > row_b.mean() * 2)[0]
        if len(bright_cols):
            cx = bright_cols.mean() + 850
            print(f"  y={abs_y}: mean_b={b:.1f}, bright_col_center_x={cx:.0f}, "
                  f"col_range={bright_cols.min()+850}-{bright_cols.max()+850}")

# 找最集中的亮区（嘴形应该是椭圆）
# 只看中心列（避开边缘）
inner = mc[:, 50:350]  # x=900..1200
inner_b = inner.sum(axis=2)
row_inner = inner_b.mean(axis=1)
print("\nInner (x=900..1200) row brightness by y:")
for i in range(0, inner.shape[0], 10):
    print(f"  y={i+850}: {row_inner[i]:.1f}")

# 尝试找两个候选嘴中心（按行亮度峰值）
from scipy.signal import find_peaks
peaks, _ = find_peaks(row_inner, height=row_inner.mean()*1.5, distance=20)
print(f"\nPeak rows at y: {[p+850 for p in peaks]}")
for p in peaks:
    row = inner[p]
    row_b = row.sum(axis=1)
    cx = np.average(np.arange(len(row_b)), weights=np.clip(row_b, 0, None)) + 900
    print(f"  y={p+850}: weighted cx={cx:.0f}, peak brightness={row_b.max()}")
