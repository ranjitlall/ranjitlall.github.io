// Static equivalent of a getComputedStyle audit: resolve every background
// declaration in the stylesheet (including CSS variables and gradient stops),
// compute WCAG relative luminance, and report anything dark, with a count of
// how many elements on the built site actually carry that selector.
//
//   node tools/audit-dark.mjs
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync("assets/css/style.css", "utf8");

// --- resolve :root custom properties -------------------------------------
const vars = {};
const rootBlock = css.match(/:root\{([^}]*)\}/s);
if (rootBlock) {
  for (const m of rootBlock[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[m[1]] = m[2].trim();
  }
}
function resolve(value, depth = 0) {
  if (depth > 5) return value;
  return value.replace(/var\((--[\w-]+)[^)]*\)/g, (m, name) =>
    vars[name] ? resolve(vars[name], depth + 1) : m
  );
}

// --- colour parsing -------------------------------------------------------
function toRgb(c) {
  c = c.trim();
  let m = c.match(/^#([0-9a-f]{3})$/i);
  if (m) return [...m[1]].map((h) => parseInt(h + h, 16));
  m = c.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = c.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (m) return [1, 2, 3].map((i) => parseFloat(m[i]));
  return null;
}
function luminance([r, g, b]) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
// every colour mentioned, so gradients are covered too
function coloursIn(value) {
  return (value.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]*\)/g) || [])
    .map(toRgb)
    .filter(Boolean);
}

// --- walk the stylesheet --------------------------------------------------
const findings = [];
for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
  const selector = m[1].trim().replace(/\s+/g, " ");
  if (selector.startsWith("@") || selector.startsWith(":root")) continue;
  const body = m[2];
  const decl = body.match(/(?:^|;)\s*background(?:-color|-image)?\s*:\s*([^;]+)/);
  if (!decl) continue;
  const value = resolve(decl[1].trim());
  const cols = coloursIn(value);
  if (!cols.length) continue;
  const lums = cols.map(luminance);
  const darkest = Math.min(...lums);
  if (darkest < 0.18) {
    findings.push({
      selector,
      value: value.length > 62 ? value.slice(0, 59) + "..." : value,
      luminance: darkest,
      gradient: /gradient/.test(value),
    });
  }
}

// --- how many elements actually carry each selector -----------------------
const pages = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith(".html")) pages.push(p);
  }
})("_site");
const html = Object.fromEntries(pages.map((p) => [p, fs.readFileSync(p, "utf8")]));

function classesOf(sel) {
  return (sel.match(/\.[\w-]+/g) || []).map((c) => c.slice(1));
}
function countUses(sel) {
  const cls = classesOf(sel);
  if (!cls.length) return { total: 0, where: [] };
  const last = cls[cls.length - 1];
  const re = new RegExp(`class="[^"]*\\b${last}\\b`, "g");
  const where = [];
  let total = 0;
  for (const [p, h] of Object.entries(html)) {
    const n = (h.match(re) || []).length;
    if (n) { total += n; where.push(`${path.relative("_site", p)}×${n}`); }
  }
  return { total, where };
}

findings.sort((a, b) => a.luminance - b.luminance);
console.log("\nDARK BACKGROUNDS (relative luminance < 0.18)\n");
console.log("lum    grad  uses  selector");
console.log("-".repeat(78));
for (const f of findings) {
  const u = countUses(f.selector);
  if (!u.total) continue;
  console.log(
    `${f.luminance.toFixed(3)}  ${f.gradient ? " Y " : " . "}  ${String(u.total).padStart(4)}  ${f.selector}`
  );
  console.log(`${" ".repeat(20)}${f.value}`);
  console.log(`${" ".repeat(20)}${u.where.join("  ")}`);
}
console.log("\nDeclared but unused on any built page:");
for (const f of findings) {
  if (!countUses(f.selector).total) console.log("  " + f.selector);
}
