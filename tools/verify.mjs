// Build verification. Run: node tools/verify.mjs
// Checks that every URL the old site published still resolves, that no internal
// link or image 404s, and that the generated HTML contains what it should.
import fs from "node:fs";
import path from "node:path";

const SITE = path.join(process.cwd(), "_site");
let fails = 0;
const fail = (m) => { console.log("  FAIL  " + m); fails++; };
const pass = (m) => console.log("  ok    " + m);

const exists = (p) => fs.existsSync(path.join(SITE, p));

// ---- 1. URL preservation -------------------------------------------------
console.log("\n1. URLs published by the old site");
const mustExist = [
  "index.html",
  "research/index.html",
  "data_software/index.html",
  "cv/index.html",
  "404.html",
];
for (const p of mustExist) exists(p) ? pass("/" + p) : fail("/" + p + " MISSING");

// ---- 2. Internal links and images ---------------------------------------
console.log("\n2. Internal links and images resolve");
const pages = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) walk(full);
    else if (f.name.endsWith(".html")) pages.push(full);
  }
})(SITE);

const broken = new Set();
const checked = new Set();
for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|#|data:)/.test(ref)) continue;
    const clean = ref.split("#")[0].split("?")[0];
    if (!clean) continue;
    checked.add(clean);
    let target = path.join(SITE, clean);
    if (clean.endsWith("/")) target = path.join(target, "index.html");
    // PDFs live in the author's existing assets/pdf, absent from this checkout
    if (clean.startsWith("/assets/pdf/")) continue;
    if (!fs.existsSync(target)) broken.add(`${clean}  (in ${path.relative(SITE, file)})`);
  }
}
if (broken.size === 0) pass(`${checked.size} distinct internal refs, none broken`);
else [...broken].forEach(fail);

// ---- 3. No leftover pathPrefix ------------------------------------------
console.log("\n3. No /cts-website/ subpath leaked in");
let leaked = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  // links TO the CTS site are fine; a subpath on our OWN asset paths is not
  if (/(?:href|src)="\/cts-website\//.test(html)) leaked++;
}
leaked === 0 ? pass("no subpath on internal paths") : fail(`${leaked} page(s) carry a subpath`);

// ---- 4. Publications actually rendered ----------------------------------
console.log("\n4. Bibliography rendered into the research page");
const research = fs.readFileSync(path.join(SITE, "research/index.html"), "utf8");
const entries = (research.match(/<li class="pub">/g) || []).length;
const abstracts = (research.match(/<details class="abs">/g) || []).length;
const bibtex = (research.match(/<details class="bib">/g) || []).length;
entries === 24 ? pass(`${entries} publication entries`) : fail(`expected 24 entries, got ${entries}`);
abstracts >= 21 ? pass(`${abstracts} abstracts`) : fail(`only ${abstracts} abstracts`);
bibtex >= 23 ? pass(`${bibtex} BibTeX blocks`) : fail(`only ${bibtex} BibTeX blocks`);

for (const needle of [
  "Consequences of the Black Sea Slave Trade",
  "The MIDAS Touch",
  "Making International Institutions Work",
  "The Political Economy of Artificial Intelligence",
]) {
  research.includes(needle) ? pass(`contains "${needle.slice(0, 38)}"`) : fail(`missing "${needle}"`);
}
// the Morse author fix
research.includes("Julia Morse") ? pass("Julia Morse parsed as one author") : fail("Morse author field still wrong");

// ---- 5. Home page content ------------------------------------------------
console.log("\n5. Home page");
const home = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
for (const [label, needle] of [
  ["four research strands", "Strand III"],
  ["CTS band", "Understanding how technology is remaking society"],
  ["hero motif", "hero__motif"],
  ["affiliations band", 'class="affil"'],
  ["highlight: political power", ">political power<"],
  ["book cover", "book-cover.jpg"],
]) home.includes(needle) ? pass(label) : fail(`${label} missing`);

// ---- 6. Book page --------------------------------------------------------
console.log("\n6. Book page");
const book = fs.readFileSync(path.join(SITE, "book/index.html"), "utf8");
const quotes = (book.match(/<figure class="quote">/g) || []).length;
const reviews = (book.match(/<li class="review">/g) || []).length;
quotes === 4 ? pass("4 endorsements") : fail(`expected 4 endorsements, got ${quotes}`);
reviews === 7 ? pass("7 reviews") : fail(`expected 7 reviews, got ${reviews}`);
book.includes("Jan Klabbers") ? pass("Klabbers attributed") : fail("Klabbers missing");
book.includes("aiddata.org/blog") ? pass("AidData link") : fail("AidData link missing");

// ---- 7. No unstyled leftovers -------------------------------------------
console.log("\n7. No leftover mobile-menu button");
const withToggle = pages.filter((f) => fs.readFileSync(f, "utf8").includes("nav-toggle"));
withToggle.length === 0
  ? pass("no nav-toggle button in any page")
  : fail(`nav-toggle present in ${withToggle.length} page(s)`);

// ---- 8. CV redirect ------------------------------------------------------
console.log("\n8. CV redirect");
const cv = fs.readFileSync(path.join(SITE, "cv/index.html"), "utf8");
cv.includes("/assets/pdf/CV_Website_Aug2026.pdf")
  ? pass("redirects to the CV PDF")
  : fail("CV redirect target wrong");

console.log(fails === 0 ? "\nALL CHECKS PASSED\n" : `\n${fails} CHECK(S) FAILED\n`);
process.exit(fails === 0 ? 0 : 1);
