# ranjitlall.github.io

Personal academic site. Built with [Eleventy](https://www.11ty.dev/), matching the
visual language of the [Centre for Technology and Society](https://ranjitlall.github.io/cts-website/) site.

## Everyday tasks

### Adding a publication

Paste a BibTeX entry into the right file in `_bibliography/` and push. Nothing
else needs editing — the site reads these files at build time.

| File | Appears as |
|---|---|
| `books.bib` | Book |
| `papers.bib` | Articles and book chapters, grouped by year |
| `policy_reports.bib` | Policy reports |
| `forthcoming.bib` | Accepted or conditionally accepted, no issue yet — shown as "Forthcoming" above the year groups |
| `working_papers.bib` | Preprints and unpublished work — its own section |
| `policy_reports.bib` | Policy reports |

Published work is grouped by year automatically. Forthcoming and working papers
appear **in the order they sit in the file**, so put the newest at the top.

The split between `forthcoming.bib` and `working_papers.bib` follows the CV: a
conditionally accepted paper sits with the journal articles, while a preprint
with no journal behind it gets its own section.

Journals give you the BibTeX ready-made — look for "Cite" or "Export citation".
Then add these extra fields, which publishers don't supply:

```bibtex
@article{lall2027xyz,
  abbr={APSR},                 % the coloured badge
  bibtex_show={true},          % show the BibTeX toggle
  title={...},
  author={Lall, Ranjit and Jane Smith},
  journal={American Political Science Review},
  volume={121}, number={1}, pages={1--20},
  year={2027},
  doi={10.1017/...},
  html={https://...},          % publisher's page
  pdf={Lall 2027 APSR.pdf},    % filename inside assets/pdf/
  abstract={...},
  selected={true}              % optional: feature on the home page
}
```

If you use a new `abbr`, give it a colour in `assets/css/style.css` — search for
`.badge--`. Without one it falls back to navy, which still works.

### Editing text

- Home page: `src/index.njk`
- Research page: `src/research.njk` (the lists are generated; only the headings are here)
- Data and software: `src/data-software.njk`
- Book page: `src/book.njk`
- Name, address, email, links: `src/_data/site.json`
- Shared header and footer: `src/_includes/layouts/base.njk`

### Previewing locally

```
npm install      # once
npm run serve    # then open http://localhost:8080
```

### Checking your work

```
npm run build
node tools/verify.mjs
```

`verify.mjs` checks that every URL the old site published still exists, that no
internal link or image is broken, and that the bibliography actually rendered.
Run it before pushing anything structural.

## Important: this is a user site, not a project site

The site is served from the domain root, `https://ranjitlall.github.io`.

- `eleventy.config.js` sets `pathPrefix: "/"`. Leave it.
- `.github/workflows/deploy.yml` runs `npx @11ty/eleventy` with **no**
  `--pathprefix` flag.
- `src/_data/site.json` has `"url": "https://ranjitlall.github.io"` with no subpath.

The CTS site is a *project* site at `/cts-website/`, so it does the opposite on
all three counts. Copying its settings here would break every link and image.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes via GitHub Pages.

**Settings → Pages → Source must be set to "GitHub Actions"**, not "Deploy from
a branch". The previous Jekyll setup pushed to a `gh-pages` branch; this one uses
the Pages artifact mechanism. If the source is left on the old setting the deploy
will show a green tick and the live site will not change.

## Two CSS rules worth remembering

Both of these caused visible bugs during the build:

1. A flex or grid child stretches to fill its cross axis unless told not to.
   Images need explicit dimensions and `align-self`; badges need
   `justify-self: start`. Otherwise a small logo becomes a wide smear.
2. A modifier for a dark background must undo *every* property the light base
   set, `background` included — not just `color`. Otherwise you get white text
   on a white button.
