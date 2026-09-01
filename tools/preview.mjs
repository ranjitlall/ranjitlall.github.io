// Builds self-contained preview files from _site — one HTML per page with the
// stylesheet and every image inlined, so each can be downloaded and opened by
// double-clicking, with no folder around it.
//
//   npm run preview
//
// Output goes to preview/. Internal links are rewritten to point at the sibling
// preview files, so keep them in one folder and keep their names. Links to PDFs
// and to external sites point at the live URLs.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SITE = path.join(ROOT, "_site");
const OUT = path.join(ROOT, "preview");
const LIVE = "https://ranjitlall.github.io";

const PAGES = [
  { src: "index.html", out: "preview-home.html", label: "Home" },
  { src: "research/index.html", out: "preview-research.html", label: "Research" },
  { src: "data_software/index.html", out: "preview-data.html", label: "Data & software" },
  { src: "book/index.html", out: "preview-book.html", label: "Book" },
];

const ROUTES = {
  "/": "preview-home.html",
  "/research/": "preview-research.html",
  "/data_software/": "preview-data.html",
  "/book/": "preview-book.html",
};

const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".gif": "image/gif",
};

function dataUri(assetPath) {
  const file = path.join(SITE, assetPath.replace(/^\//, ""));
  if (!fs.existsSync(file)) return null;
  const mime = MIME[path.extname(file).toLowerCase()];
  if (!mime) return null;
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

if (!fs.existsSync(SITE)) {
  console.error("No _site directory. Run `npm run build` first.");
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

let css = fs.readFileSync(path.join(SITE, "assets/css/style.css"), "utf8");

// Inline url() references from inside the stylesheet too, or graphics that are
// only referenced from CSS (the torchlight lattice) would be missing from a
// standalone preview file.
let cssInlined = 0;
css = css.replace(/url\((["']?)([^"')]+)\1\)/g, (m, q, ref) => {
  if (ref.startsWith("data:") || /^https?:/.test(ref)) return m;
  const rel = ref.replace(/^\.\.\//, "assets/").replace(/^\//, "");
  const uri = dataUri("/" + rel);
  if (!uri) { missingCss.push(ref); return m; }
  cssInlined++;
  return `url("${uri}")`;
});
let inlined = 0, missing = [], missingCss = [];

for (const page of PAGES) {
  const srcPath = path.join(SITE, page.src);
  if (!fs.existsSync(srcPath)) { missing.push(page.src); continue; }
  let html = fs.readFileSync(srcPath, "utf8");

  // stylesheet -> inline
  html = html.replace(
    /<link rel="stylesheet" href="[^"]*style\.css[^"]*">/,
    `<style>\n${css}\n</style>`
  );
  html = html.replace(/<link rel="icon"[^>]*>/, "");

  // images -> base64
  html = html.replace(/(src|href)="(\/assets\/img\/[^"]+)"/g, (m, attr, p) => {
    const uri = dataUri(p);
    if (!uri) { missing.push(p); return m; }
    inlined++;
    return `${attr}="${uri}"`;
  });

  // internal page links -> sibling preview files; everything else -> live site
  html = html.replace(/href="(\/[^"]*)"/g, (m, href) => {
    const [pathPart, hash] = href.split("#");
    if (ROUTES[pathPart]) return `href="${ROUTES[pathPart]}${hash ? "#" + hash : ""}"`;
    if (pathPart === "" && hash) return m;              // in-page anchor
    return `href="${LIVE}${href}"`;                      // PDFs, /cv/, etc.
  });

  const banner = `<div style="position:fixed;left:0;right:0;bottom:0;z-index:9999;
background:#fffbe9;border-top:1px solid #f0e2b6;padding:.55rem 1rem;
font:500 12px/1.4 ui-monospace,monospace;color:#6b5310;text-align:center;letter-spacing:.04em">
LOCAL PREVIEW &mdash; ${page.label}. This is not the live site. Keep all preview files in one folder so the links work.
</div>`;
  html = html.replace(/<\/body>/, `${banner}\n</body>`);

  fs.writeFileSync(path.join(OUT, page.out), html);
  console.log(`  ${page.out.padEnd(24)} ${(html.length / 1024).toFixed(0)} KB`);
}

console.log(`\n${inlined} images inlined from markup, ${cssInlined} from the stylesheet.`);
if (missingCss.length) console.log("CSS url() NOT FOUND:\n  " + [...new Set(missingCss)].join("\n  "));
if (missing.length) console.log("NOT FOUND:\n  " + [...new Set(missing)].join("\n  "));
