// Reads the .bib files in _bibliography/ at build time and hands Eleventy a
// plain array. Nothing here needs editing to add a publication — paste a BibTeX
// entry into the relevant .bib file and it appears on the site.
//
// Supported fields beyond standard BibTeX:
//   abbr         the coloured venue badge (e.g. APSR)
//   abstract     shown behind the "Abstract" toggle
//   bibtex_show  set to true to show the "BibTeX" toggle
//   html         link to the publisher's page
//   html_label   label for that link (default "Publisher")
//   link2..link4 extra links, each with a matching link2_label etc.
//                e.g. link2={https://...}  link2_label={CTS Working Paper}
//   award1..3    prizes the paper has won. The award's name is the field itself;
//                add award1_url to link to an announcement.
//                e.g. award1={David Brian Robertson Best Paper Award, APSA}
//                     award1_url={https://...}
//   coverage1..3 writing ABOUT the paper — blog posts, summaries, press. These
//                render on their own line beneath the entry rather than as
//                buttons, because they are commentary, not ways to get the
//                paper. Each needs a matching coverage1_label etc.
//                e.g. coverage1={https://...}
//                     coverage1_label={Political Science Now, by Deborah Saki}
//   pdf          filename inside assets/pdf/, or a full URL
//   selected     set to true to feature it on the home page
//
// Fields used only by the CV page (/cv/):
//   cv_note1..3  extra lines under the entry on the CV, e.g. the book's
//                cv_note1={Reviewed in <em>Governance</em>, ...}
//   pagetotal    a book's page count, e.g. pagetotal={412}
//   cv_section   set to {articles} on a working paper to list it at the top of
//                the CV's journal articles (used for conditional acceptances)
//
// Which file an entry belongs in:
//   books.bib           the book
//   papers.bib          published articles and chapters, grouped by year
//   forthcoming.bib     accepted or conditionally accepted, no issue yet;
//                       shown as "Forthcoming" above the year groups
//   working_papers.bib  preprints and unpublished work; its own section
//   policy_reports.bib  policy reports and briefs

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
    if (f.volume) bits.push(` ${f.volume}`); // leading space: "Journal 120(3)"
    if (f.number) bits.push(`(${f.number})`);
    if (f.pages) bits.push(`, ${f.pages.replace(/--/g, "\u2013")}`);
    return { italic: out, rest: bits.join("") };
  }
  if (type === "inproceedings") {
    return {
      italic: f.booktitle || "",
      rest: f.pages ? `, ${f.pages.replace(/--/g, "\u2013")}` : "",
      prefix: "In ",
    };
  }
  if (type === "incollection") {
    return {
      italic: f.booktitle || "",
      rest: f.publisher ? `, ${f.publisher}` : "",
      prefix: "In ",
    };
  }
  // @misc entries (policy reports, preprints) carry the outlet in archivePrefix,
  // the convention al-folio used. Fall back through the plausible fields.
  return { italic: "", rest: f.archiveprefix || f.publisher || f.journal || "" };
}

// ---- CV formatting -------------------------------------------------------
// The CV lists each item in the house style of the old LaTeX CV:
//   "Title." 2023. Journal 67 (4): 1096–1116. With Dan Honig and Bradley C. Parks.

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const dash = (s) => String(s).replace(/--/g, "–").replace(/(\d)-(\d)/g, "$1–$2");
const endStop = (s) => (/[.?!]$/.test(s.replace(/<[^>]+>/g, "")) ? s : s + ".");

/** ["A"] -> "A"; ["A","B"] -> "A and B"; ["A","B","C"] -> "A, B, and C" */
function nameList(names) {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return names.join(" and ");
  return names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
}

function cvCitation(type, f, authors, link) {
  const others = authors.filter((a) => a !== "Ranjit Lall");
  const withLine = others.length ? ` With ${esc(nameList(others))}.` : "";
  const t = esc(f.title || "");
  const titleText = /[.?!]$/.test(t) ? t : t + ".";
  const quoted = link
    ? `<a href="${esc(link)}">“${titleText}”</a>`
    : `“${titleText}”`;
  const year = f.year || "";

  if (type === "book") {
    const where = f.location || f.address || "";
    const title = link ? `<a href="${esc(link)}"><em>${t}</em></a>` : `<em>${t}</em>`;
    return `${title}. ${year}. ${where ? esc(where) + ": " : ""}${esc(f.publisher || "")}.` +
      (f.pagetotal ? ` ${esc(f.pagetotal)} pages.` : "");
  }
  // accepted / forthcoming work carries its status in note, which may hold <em>
  if (f.note) return `${quoted} ${endStop(f.note)}${withLine}`;

  if (type === "article") {
    let vol = "";
    if (f.volume) {
      vol = ` ${esc(f.volume)}`;
      if (f.number) vol += ` (${esc(f.number)})`;
      if (f.pages) vol += `: ${dash(esc(f.pages))}`;
    }
    return `${quoted} ${year}. <em>${esc(f.journal || "")}</em>${vol}.${withLine}`;
  }
  if (type === "inproceedings") {
    return `${quoted} ${year}. In <em>${esc(f.booktitle || "")}</em>` +
      (f.pages ? `, ${dash(esc(f.pages))}` : "") + `.${withLine}`;
  }
  if (type === "incollection") {
    const eds = splitAuthors(f.editor);
    const edLine = eds.length ? `${esc(nameList(eds))} (${eds.length > 1 ? "eds." : "ed."}), ` : "";
    const where = f.address || f.location || "";
    return `${quoted} ${year}. In ${edLine}<em>${esc(f.booktitle || "")}</em>. ` +
      `${where ? esc(where) + ": " : ""}${esc(f.publisher || "")}.${withLine}`;
  }
  // @misc: policy reports and preprints; the outlet sits in archivePrefix
  let outlet = f.archiveprefix || f.publisher || f.journal || "";
  const arxiv = (f.doi || "").match(/arXiv\.(\d{4}\.\d{4,5})/i);
  if (outlet === "arXiv" && arxiv) outlet = `arXiv preprint ${arxiv[1]}`;
  return `${quoted} ${year}.${outlet ? " " + endStop(esc(outlet)) : ""}${withLine}`;
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
      htmlLabel: f.html_label || "Publisher",
      // link2, link3, link4 — optional extra links, each with its own label
      extraLinks: [2, 3, 4]
        .filter((n) => f[`link${n}`])
        .map((n) => ({ url: f[`link${n}`], label: f[`link${n}_label`] || "Link" })),
      // prizes, shown on their own line above any coverage
      awards: [1, 2, 3]
        .filter((n) => f[`award${n}`])
        .map((n) => ({ name: f[`award${n}`], url: f[`award${n}_url`] || "" })),
      // writing about the paper, shown as a separate line
      coverage: [1, 2, 3]
        .filter((n) => f[`coverage${n}`])
        .map((n) => ({ url: f[`coverage${n}`], label: f[`coverage${n}_label`] || "Read" })),
      doi: f.doi || "",
      pdf: f.pdf ? (f.pdf.includes("://") ? f.pdf : `/assets/pdf/${f.pdf}`) : "",
      url: f.url || "",
      selected: f.selected === "true",
      showBibtex: f.bibtex_show === "true",
      bibtex: e.raw,
      // the CV page's version of the entry, and the lines listed beneath it
      cv: cvCitation(e.type, f, splitAuthors(f.author), ""),
      cvNotes: [
        ...[1, 2, 3].filter((n) => f[`award${n}`]).map((n) => f[`award${n}`]),
        ...[1, 2, 3].filter((n) => f[`cv_note${n}`]).map((n) => f[`cv_note${n}`]),
      ].map(endStop),
      cvSection: f.cv_section || "",
    };
  });
}

const books = load("books.bib");
const papers = load("papers.bib");
const reports = load("policy_reports.bib");
const working = load("working_papers.bib");
const forthcoming = load("forthcoming.bib");

// Newest year first; within a year, file order (higher in the file = higher on
// the page), exactly as the research page does it.
const newestFirst = (list) =>
  list.map((p, i) => [p, i]).sort((a, b) => b[0].year - a[0].year || a[1] - b[1]).map((x) => x[0]);
const ofType = (list, ...types) => list.filter((p) => types.includes(p.type));

const cv = {
  books,
  articles: [
    ...working.filter((p) => p.cvSection === "articles"),
    ...ofType(forthcoming, "article", "misc"),
    ...newestFirst(ofType(papers, "article")),
  ],
  conference: [...ofType(forthcoming, "inproceedings"), ...newestFirst(ofType(papers, "inproceedings"))],
  chapters: [...ofType(forthcoming, "incollection"), ...newestFirst(ofType(papers, "incollection"))],
  reports,
  working: working.filter((p) => p.cvSection !== "articles"),
};

export default {
  cv,
  books,
  papers,
  reports,
  working,
  forthcoming,
  all: [...books, ...papers, ...reports, ...working, ...forthcoming],
  selected: [...papers, ...books].filter((p) => p.selected),
  counts: {
    books: books.length,
    papers: papers.length,
    reports: reports.length,
    working: working.length,
    forthcoming: forthcoming.length,
  },
};
