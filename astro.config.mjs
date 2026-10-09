// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ludovicoiovino.it',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  // Old WordPress URLs. GitHub Pages has no server redirects, so Astro emits meta-refresh pages.
  // Keep in sync with `legacySlug` in src/content/projects/*.md.
  redirects: {
    '/portfolio-archive/cobol-community-based-organized-littering': '/projects/cobol',
    '/portfolio-archive/rasta-realta-aumentata-e-story-telling-automatizzato-per-la-valorizzazione-di-beni-culturali-ed-itinerari': '/projects/rasta',
    '/portfolio-archive/smart-secure-and-inclusive-communities': '/projects/smart-secure-inclusive-communities',
  },
});
