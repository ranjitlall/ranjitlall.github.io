#!/usr/bin/env python3
"""
Generates the two halves of the torchlight lattice.

One grid, deterministically split: cells marked "observed" are drawn in
fx-lattice-observed.svg, the gaps are drawn in fx-lattice-imputed.svg. Because
both files share the same geometry and viewBox, the imputed points land exactly
in the holes of the observed layer when the two are stacked.

Observed points are solid; imputed points are hollow rings with a faint halo, so
that what the torch reveals reads as estimated rather than measured.
"""
import random

W, H = 1200, 500
COLS, ROWS = 30, 13
MARGIN_X, MARGIN_Y = 40, 40
MISSING_RATE = 0.26
SEED = 20260901

random.seed(SEED)

dx = (W - 2 * MARGIN_X) / (COLS - 1)
dy = (H - 2 * MARGIN_Y) / (ROWS - 1)

cells = []
for r in range(ROWS):
    for c in range(COLS):
        x = MARGIN_X + c * dx
        y = MARGIN_Y + r * dy
        # jitter keeps it from reading as graph paper
        x += random.uniform(-2.2, 2.2)
        y += random.uniform(-2.2, 2.2)
        cells.append((x, y, random.random() < MISSING_RATE))

observed = [(x, y) for x, y, miss in cells if not miss]
imputed = [(x, y) for x, y, miss in cells if miss]

HEAD = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'width="{W}" height="{H}" aria-hidden="true">\n')

# --- observed: solid points, plus faint connectors along complete rows -------
obs = [HEAD, '  <g fill="#ffffff" fill-opacity=".5">\n']
for x, y in observed:
    obs.append(f'    <circle cx="{x:.1f}" cy="{y:.1f}" r="2.6"/>\n')
obs.append('  </g>\n')
obs.append('  <g stroke="#ffffff" stroke-opacity=".13" stroke-width=".8">\n')
for r in range(ROWS):
    row = [cells[r * COLS + c] for c in range(COLS)]
    run = []
    for x, y, miss in row:
        if miss:
            if len(run) > 2:
                obs.append(f'    <path d="M{run[0][0]:.1f} {run[0][1]:.1f} '
                           + " ".join(f"L{px:.1f} {py:.1f}" for px, py in run[1:]) + '" fill="none"/>\n')
            run = []
        else:
            run.append((x, y))
    if len(run) > 2:
        obs.append(f'    <path d="M{run[0][0]:.1f} {run[0][1]:.1f} '
                   + " ".join(f"L{px:.1f} {py:.1f}" for px, py in run[1:]) + '" fill="none"/>\n')
obs.append('  </g>\n</svg>\n')

# --- imputed: hollow rings with a halo, sitting exactly in the gaps ---------
imp = [HEAD,
       '  <defs>\n'
       '    <radialGradient id="halo" cx="50%" cy="50%" r="50%">\n'
       '      <stop offset="0%" stop-color="#f0b429" stop-opacity=".55"/>\n'
       '      <stop offset="100%" stop-color="#f0b429" stop-opacity="0"/>\n'
       '    </radialGradient>\n'
       '  </defs>\n']
imp.append('  <g>\n')
for x, y in imputed:
    imp.append(f'    <circle cx="{x:.1f}" cy="{y:.1f}" r="9" fill="url(#halo)"/>\n')
imp.append('  </g>\n')
imp.append('  <g fill="none" stroke="#f7c65a" stroke-opacity=".9" stroke-width="1.1">\n')
for x, y in imputed:
    imp.append(f'    <circle cx="{x:.1f}" cy="{y:.1f}" r="3.4"/>\n')
imp.append('  </g>\n</svg>\n')

open("assets/img/fx-lattice-observed.svg", "w").write("".join(obs))
open("assets/img/fx-lattice-imputed.svg", "w").write("".join(imp))

total = COLS * ROWS
print(f"grid {COLS}x{ROWS} = {total} cells")
print(f"  observed {len(observed)} ({len(observed)/total:.0%})")
print(f"  imputed  {len(imputed)} ({len(imputed)/total:.0%})")
