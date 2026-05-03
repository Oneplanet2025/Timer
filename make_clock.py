import math
from PIL import Image, ImageDraw

W, H = 400, 400
img = Image.new("RGB", (W, H), (0, 0, 0, ))
d = ImageDraw.Draw(img)

cx, cy = W // 2, H // 2

# ---- Background gradient-ish (radial simulation with concentric circles) ----
for r in range(180, 0, -1):
    t = r / 180
    rc = int(30 + t * 10)
    gc = int(20 + t * 10)
    bc = int(60 + t * 80)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(rc, gc, bc))

# ---- Outer glow ring ----
for i in range(8, 0, -1):
    alpha = int(180 * (i / 8) ** 2)
    d.ellipse([cx - 170 - i, cy - 170 - i, cx + 170 + i, cy + 170 + i],
              outline=(120, 160, 255, alpha), width=2)

# ---- Clock face ----
face_r = 160
d.ellipse([cx - face_r, cy - face_r, cx + face_r, cy + face_r],
          fill=(240, 235, 255))

# ---- Subtle face gradient (lighten center) ----
for r in range(face_r - 1, 0, -2):
    t = 1 - r / face_r
    v = int(240 + t * 15)
    d.ellipse([cx - r, cy - r, cx + r, cy + r],
              fill=(v, v - 5, min(255, v + 10)))

# ---- Hour tick marks ----
for h in range(12):
    angle = math.radians(h * 30 - 90)
    if h % 3 == 0:
        r1, r2, w, col = 130, 152, 5, (80, 70, 120)
    else:
        r1, r2, w, col = 138, 152, 3, (140, 130, 180)
    x1 = cx + r1 * math.cos(angle)
    y1 = cy + r1 * math.sin(angle)
    x2 = cx + r2 * math.cos(angle)
    y2 = cy + r2 * math.sin(angle)
    d.line([x1, y1, x2, y2], fill=col, width=w)

# ---- Minute tick marks ----
for m in range(60):
    if m % 5 == 0:
        continue
    angle = math.radians(m * 6 - 90)
    r1, r2 = 145, 152
    x1 = cx + r1 * math.cos(angle)
    y1 = cy + r1 * math.sin(angle)
    x2 = cx + r2 * math.cos(angle)
    y2 = cy + r2 * math.sin(angle)
    d.line([x1, y1, x2, y2], fill=(180, 170, 210), width=1)

# ---- Numbers 12, 3, 6, 9 ----
try:
    from PIL import ImageFont
    font_num = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
    font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
except Exception:
    font_num = ImageFont.load_default()
    font_small = font_num

nums = {12: (0,  -110), 3: (110, 0), 6: (0, 110), 9: (-110, 0)}
for n, (ox, oy) in nums.items():
    txt = str(n)
    bbox = d.textbbox((0, 0), txt, font=font_num)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    d.text((cx + ox - tw // 2, cy + oy - th // 2), txt,
           fill=(70, 60, 110), font=font_num)

# ---- Clock hands (10:10:30 pose) ----
hour_angle  = math.radians(10 * 30 + 10 * 0.5 - 90)   # 10 h 10 m
minute_angle = math.radians(10 * 6 - 90)                # 10 m
second_angle = math.radians(30 * 6 - 90)                # 30 s

def draw_hand(angle, length, width, color, shadow=True):
    if shadow:
        sx = cx + 3 + length * math.cos(angle)
        sy = cy + 3 + length * math.sin(angle)
        d.line([cx + 3, cy + 3, sx, sy], fill=(0, 0, 0, 60), width=width + 2)
    ex = cx + length * math.cos(angle)
    ey = cy + length * math.sin(angle)
    d.line([cx, cy, ex, ey], fill=color, width=width)

# Hour hand
draw_hand(hour_angle, 85, 10, (60, 50, 100))
# Minute hand
draw_hand(minute_angle, 118, 7, (80, 70, 130))
# Second hand (red/pink accent)
draw_hand(second_angle, 128, 3, (255, 80, 120), shadow=False)
# Tail of second hand
tail_angle = second_angle + math.pi
tx = cx + 25 * math.cos(tail_angle)
ty = cy + 25 * math.sin(tail_angle)
d.line([cx, cy, tx, ty], fill=(255, 80, 120), width=3)

# ---- Center cap ----
cap_r = 8
d.ellipse([cx - cap_r, cy - cap_r, cx + cap_r, cy + cap_r], fill=(255, 80, 120))
d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=(255, 200, 220))

# ---- Cute stars / sparkles around the clock ----
stars = [(55, 55), (345, 60), (50, 345), (350, 340),
         (200, 25), (25, 200), (375, 200), (200, 375)]
for sx, sy in stars:
    for arm in range(4):
        a = math.radians(arm * 90 + 45)
        r = 10 if arm % 2 == 0 else 6
        ex2 = sx + r * math.cos(a)
        ey2 = sy + r * math.sin(a)
        d.line([sx, sy, ex2, ey2], fill=(200, 180, 255), width=2)
    d.ellipse([sx - 2, sy - 2, sx + 2, sy + 2], fill=(255, 240, 255))

# ---- Small heart decoration ----
def draw_heart(draw, hx, hy, size, color):
    pts = []
    for t_deg in range(0, 361, 5):
        t = math.radians(t_deg)
        x = size * (16 * math.sin(t) ** 3)
        y = -size * (13 * math.cos(t) - 5 * math.cos(2*t) - 2 * math.cos(3*t) - math.cos(4*t))
        pts.append((hx + x, hy + y))
    draw.polygon(pts, fill=color)

draw_heart(d, 320, 80, 1.5, (255, 150, 180))
draw_heart(d, 75, 310, 1.2, (255, 170, 200))

# ---- Save ----
out = "/Users/Motoyama/projects/Timer/clock.jpg"
img.save(out, "JPEG", quality=92)
print(f"Saved: {out}")
