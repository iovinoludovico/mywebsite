# ludovicoiovino.it

Static personal academic site built with Astro and deployed to GitHub Pages on push to `main`, on publication updates and nightly (`.github/workflows/deploy.yml`). There is no CMS: content is plain YAML and Markdown.

## Where content lives
- `src/data/profile.yaml`: hero tagline, bio, research areas, contact details, profile links, memberships.
- `src/data/metrics.json`: Scholar and Scopus h-index and citations. The `scholar` block is generated; the `scopus` block is edited by hand (see Metrics below).
- `src/data/cv.yaml`: experience, education, awards.
- `src/data/teaching.yaml`: courses, PhD supervision, available theses.
- `src/data/service.yaml`: editorial and guest-editor roles, journals reviewed for.
- `src/content/projects/*.md`: one file per funded project (frontmatter schema in `src/content.config.ts`). A new file becomes `/projects/<filename>/` automatically.
- Images go in `public/images/`, documents in `public/docs/`.

## Publications
`/publications` and the home page's "Recent publications" are generated at build time from `publications.bib` in the GitHub repo `iovinoludovico/publications` (`src/lib/publications.ts`). There are no third-party scripts. To add a paper, edit the `.bib` there; this site needs no change.
The site rebuilds automatically:
- **on every push to the publications repo:** its `.github/workflows/notify-site.yml` sends a `repository_dispatch` (`publications-updated`, with the commit SHA as `BIB_REF`) to this repo's `deploy.yml`. This needs the secret `SITE_DISPATCH_TOKEN` in the publications repo: a fine-grained token with access to this repo only and the permission Contents: Read and write.
- **every night at 04:00 UTC**, as a safety net.

If the `.bib` cannot be fetched or parsed, the build fails and the live site is left unchanged. Entries without a title produce a build warning.

## Metrics
- **Google Scholar (automatic):** `.github/workflows/update-metrics.yml` runs every Monday, or on demand from Actions › Update metrics › Run workflow. It runs `scripts/update-metrics.mjs`, which scrapes the public Scholar profile and updates the `scholar` block of `src/data/metrics.json`. If the values changed, it commits the file and starts `deploy.yml`. If Scholar fails, the previous values are kept. A drop larger than 10% is rejected as a likely parsing error. If Google blocks GitHub's servers, run `node scripts/update-metrics.mjs` locally and push.
- **Scopus (manual):** edit `hIndex` and `citations` in the `scopus` block of `src/data/metrics.json`, set `updated` to today's date (`YYYY-MM-DD`), commit and push. Values come from https://www.scopus.com/authid/detail.uri?authorId=36961136600. There is no API access: Elsevier requires an institutional token to call it from outside the GSSI network.

## Design
Direction "C · Modern Lab", chosen on a Claude Design canvas. All colors, radii and type sizes are tokens in `src/styles/tokens.css`, with light and dark values. Change the look there, not in components.

## Commands
- `npm run dev`: local server
- `npm run build`: static build to `dist/`
- `npm run check`: type check

## Legacy URLs
`astro.config.mjs` `redirects` maps the old WordPress `/portfolio-archive/*` URLs to `/projects/*`. Keep it in sync with `legacySlug` in the project files.
