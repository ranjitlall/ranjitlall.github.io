// Reads the .bib files in _bibliography/ at build time and hands Eleventy a
// plain array. Nothing here needs editing to add a publication — paste a BibTeX
// entry into the relevant .bib file and it appears on the site.
//
// Supported fields beyond standard BibTeX:
//   abbr         the coloured venue badge (e.g. APSR)
//   abstract     shown behind the "Abstract" toggle
//   bibtex_show  set to true to show the "BibTeX" toggle
//   html         link to the publisher's page
//   pdf          filename inside assets/pdf/, or a full URL
//   selected     set to true to feature it on the home page

import fs from "node:fs";
import path from "node:path";

const BIB_DIR = path.join(process.cwd(), "_bibliography");

/** Split a .bib file into entries, tracking brace depth so nested {} survive. */
function parseBib(text) {
  const entries = [];
  const re = /@(\w+)\s*\{\s*([^,]+),/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const type = m[1].toLowerCase();
    const key = m[2].trim();
    let i = re.lastIndex;
    let depth = 1;
    while (i < text.length && depth > 0) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") depth--;
      i++;
    }
    entries.push({
      type,
      key,
      fields: parseFields(text.slice(re.lastIndex, i - 1)),
      raw: text.slice(m.index, i).trim(),
    });
    re.lastIndex = i;
  }
  return entries;
}

function parseFields(body) {
  const fields = {};
  let i = 0;
  while (i < body.length) {
    const eq = body.indexOf("=", i);
    if (eq === -1) break;
    const name = body.slice(i, eq).replace(/^[\s,]+|[\s,]+$/g, "").toLowerCase();
    let j = eq + 1;
    while (j < body.length && /\s/.test(body[j])) j++;
    let value = "";
    if (body[j] === "{") {
      let depth = 1;
      j++;
      const start = j;
      while (j < body.length && depth > 0) {
        if (body[j] === "{") depth++;
        else if (body[j] === "}") depth--;
        j++;
      }
      value = body.slice(start, j - 1);
    } else {
      const start = j;
      while (j < body.length && body[j] !== ",") j++;
      value = body.slice(start, j).trim();
    }
    if (name) {
      fields[name] = value.replace(/\s+/g, " ").trim().replace(/\\&/g, "&");
    }
    while (j < body.length && body[j] !== ",") j++;
    i = j + 1;
  }
  return fields;
}

/** "Lall, Ranjit and Thomas Robinson" -> ["Ranjit Lall", "Thomas Robinson"] */
function splitAuthors(raw) {
  if (!raw) return [];
  return raw.split(/\s+and\s+/).map((p) => {
    const part = p.trim();
    if (part.includes(",")) {
      const [last, first] = part.split(",", 2).map((x) => x.trim());
      return `${first} ${last}`.trim();
    }
    return part;
  });
}

/** Journal / book / publisher line, formatted for display. */
function venue(type, f) {
  if (type === "article") {
    let out = f.journal || "";
    const bits = [];
    if (f.volume) bits.push(f.volume);
    if (f.number) bits.push(`(${f.number})`);
    if (f.pages) bits.push(`, ${f.pages.replace(/--/g, "\u2013")}`);
    return { italic: out, rest: bits.join("") };
  }
  if (type === "incollection") {
    return {
      italic: f.booktitle || "",
      rest: f.publisher ? `, ${f.publisher}` : "",
      prefix: "In ",
    };
  }
  return { italic: "", rest: f.publisher || "" };
}

function load(file) {
  const full = path.join(BIB_DIR, file);
  if (!fs.existsSync(full)) return [];
  return parseBib(fs.readFileSync(full, "utf8")).map((e) => {
    const f = e.fields;
    return {
      key: e.key,
      type: e.type,
      abbr: f.abbr || "",
      title: f.title || "",
      authors: splitAuthors(f.author),
      year: parseInt(f.year, 10) || 0,
      venue: venue(e.type, f),
      note: f.note || "",
      abstract: f.abstract || "",
      html: f.html || "",
      doi: f.doi || "",
      pdf: f.pdf ? (f.pdf.includes("://") ? f.pdf : `/assets/pdf/${f.pdf}`) : "",
      url: f.url || "",
      selected: f.selected === "true",
      showBibtex: f.bibtex_show === "true",
      bibtex: e.raw,
    };
  });
}

const books = load("books.bib");
const papers = load("papers.bib");
const reports = load("policy_reports.bib");
const working = load("working_papers.bib");

export default {
  books,
  papers,
  reports,
  working,
  all: [...books, ...papers, ...reports, ...working],
  selected: [...papers, ...books].filter((p) => p.selected),
  counts: {
    books: books.length,
    papers: papers.length,
    reports: reports.length,
    working: working.length,
  },
};
