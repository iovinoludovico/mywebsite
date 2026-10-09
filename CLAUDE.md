# ludovicoiovino.it

Static personal academic site built with Astro and deployed to GitHub Pages on push to `main` (`.github/workflows/deploy.yml`). There is no CMS: content is plain YAML and Markdown.

## Where content lives
- `src/data/profile.yaml`: hero tagline, bio, research areas, contact details, profile links, memberships.
- `src/data/metrics.json`: Scholar and Scopus h-index and citations. The `scholar` block is generated; the `scopus` block is edited by hand (see Metrics below).
- `src/data/cv.yaml`: experience, education, awards.
- `src/data/teaching.yaml`: courses, PhD supervision, available theses.
- `src/data/service.yaml`: editorial and guest-editor roles, journals reviewed for.
- `src/data/selected-publications.yaml`: the few papers shown on the home page.
- `src/content/projects/*.md`: one file per funded project (frontmatter schema in `src/content.config.ts`). A new file becomes `/projects/<filename>/` automatically.
- Images go in `public/images/`, documents in `public/docs/`.

## Publications
`/publications` embeds BibBase, which reads `publications.bib` from the GitHub repo `iovinoludovico/publications` at view time. Add papers there; this site needs no rebuild. The embed uses `document.write`, so `src/components/BibBase.astro` must keep a classic in-place `<script is:inline>`. Its look is set in `src/styles/bibbase.css`.

## Metrics
- **Google Scholar (automatic):** `.github/workflows/update-metrics.yml` runs every Monday, or on demand from Actions › Update metrics › Run workflow. It runs `scripts/update-metrics.mjs`, which scrapes the public Scholar profile and updates the `scholar` block of `src/data/metrics.json`. If the values changed, it commits the file and starts `deploy.yml`. If Scholar fails, the previous values are kept. A drop larger than 10% is rejected as a likely parsing error. If Google blocks GitHub's servers, run `node scripts/update-metrics.mjs` locally and push.
- **Scopus (manual):** edit `hIndex` and `citations` in the `scopus` block of `src/data/metrics.json`, set `updated` to today's date (`YYYY-MM-DD`), commit and push. Values come from https://www.scopus.com/authid/detail.uri?authorId=36961136600. There is no API access: Elsevier requires an institutional token to call it from outside the GSSI network.

## Design
Direction "C · Modern Lab", chosen on the Claude Design canvas (https://claude.ai/artifact/XgVDJJ1tTQ1jbLLUx4Mzc2). All colors, radii and type sizes are tokens in `src/styles/tokens.css`, with light and dark values. Change the look there, not in components.

## Commands
- `npm run dev`: local server
- `npm run build`: static build to `dist/`
- `npm run check`: type check

## Legacy URLs
`astro.config.mjs` `redirects` maps the old WordPress `/portfolio-archive/*` URLs to `/projects/*`. Keep it in sync with `legacySlug` in the project files.
