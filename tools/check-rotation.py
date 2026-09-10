#!/usr/bin/env python3
"""
Checks the rotating triangle for clipped vertices by baking the transform into
static copies and rendering them. A static renderer cannot run CSS animations,
so the rotation and the six dot positions are computed here and written in
directly — the same maths the browser performs, made visible.

  python3 tools/check-rotation.py       (needs: pip install cairosvg pillow)
"""
import math, re, cairosvg
from PIL import Image, ImageDraw

SRC = "src/_includes/partials/hero-dispersion.svg"
CX, CY = 280.0, 259.2
V = [(280.0, 9.2), (496.5, 384.2), (63.5, 384.2)]
FILLS = ["#F5B72E", "#F2853C", "#E8523C", "#D14E86", "#7B5EA7", "#1E9C8A"]

svg = open(SRC).read()
vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', svg).group(1).split()]
print(f"viewBox {vb}")


def point_at(frac):
    edges = [(V[0], V[1]), (V[1], V[2]), (V[2], V[0])]
    lens = [math.dist(a, b) for a, b in edges]
    target = (frac % 1.0) * sum(lens)
    for (a, b), L in zip(edges, lens):
        if target <= L:
            t = target / L
            return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
        target -= L
    return V[0]


def rot(p, deg):
    r = math.radians(deg)
    x, y = p[0] - CX, p[1] - CY
    return (CX + x * math.cos(r) - y * math.sin(r),
            CY + x * math.sin(r) + y * math.cos(r))


W = 460
H = int(W * vb[3] / vb[2])
sheet = Image.new("RGB", (W * 3 + 40, H * 2 + 30), "#001730")
worst = None
for i, deg in enumerate([0, 60, 120, 180, 240, 300]):
    s = svg.replace('<polygon class="tri"',
                    f'<polygon class="tri" transform="rotate({deg} {CX} {CY})"', 1)
    s = re.sub(r"\.n \{[^}]*\}", ".n { opacity: 1; }", s)
    s = re.sub(r"\.e \{[^}]*\}", ".e { opacity: 0.45; }", s)
    s = re.sub(r"\.tri \{[^}]*\}", ".tri { opacity: 0.45; }", s)
    dots = "".join(
        f'<circle cx="{rot(point_at(k/6), deg)[0]:.1f}" cy="{rot(point_at(k/6), deg)[1]:.1f}" '
        f'r="5.4" fill="{FILLS[k]}"/>' for k in range(6))
    s = s.replace('<g class="orbs">', '<g class="orbs">' + dots, 1)
    cairosvg.svg2png(bytestring=s.encode(), write_to="/tmp/f.png",
                     output_width=W, output_height=H, background_color="#00203f")
    im = Image.open("/tmp/f.png").convert("RGB")
    ImageDraw.Draw(im).text((8, 8), f"{deg}deg", fill="#9db4cc")
    sheet.paste(im, ((i % 3) * (W + 20) + 10, (i // 3) * (H + 20) + 10))
    verts = [rot(v, deg) for v in V]
    for vx, vy in verts:
        m = min(vx - vb[0], vb[0] + vb[2] - vx, vy - vb[1], vb[1] + vb[3] - vy)
        if worst is None or m < worst[0]:
            worst = (m, deg, (round(vx, 1), round(vy, 1)))
    print(f"  {deg:3d}deg  " + "  ".join(f"({x:6.1f},{y:6.1f})" for x, y in verts))

sheet.save("/tmp/rotation_frames.png")
print(f"\nTightest vertex margin: {worst[0]:.1f} units at {worst[1]}deg, vertex {worst[2]}")
print("CLIPPED" if worst[0] < 0 else "No vertex leaves the viewBox at any angle.")
print("Frames written to /tmp/rotation_frames.png")
