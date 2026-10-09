// Refreshes the Google Scholar figures in src/data/metrics.json.
// Run weekly by .github/workflows/update-metrics.yml. Scopus figures are edited by hand in the same file.
// If Scholar fails (network, CAPTCHA, unexpected markup) the previous values are kept.
// Always exits 0 so a flaky source never breaks the workflow.
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../src/data/metrics.json', import.meta.url);
const SCHOLAR_URL = process.env.SCHOLAR_URL ?? 'https://scholar.google.com/citations?user=9LQwMlMAAAAJ&hl=en';
const MAX_DROP = 0.1; // a drop larger than this is treated as a parsing error, not a real change

const today = new Date().toISOString().slice(0, 10);
const warn = (msg) => console.warn(`::warning::${msg}`);

async function fetchScholar() {
  const res = await fetch(SCHOLAR_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
      'Accept-Language': 'en',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  // Stats table cells, in order: citations (all, since), h-index (all, since), i10 (all, since).
  const cells = [...html.matchAll(/class="gsc_rsb_std">(\d+)</g)].map((m) => Number(m[1]));
  if (cells.length < 6) throw new Error('stats table not found (CAPTCHA or markup change?)');
  return { citations: cells[0], hIndex: cells[2], i10: cells[4] };
}

function validate(next, prev) {
  for (const [k, v] of Object.entries(next)) {
    if (!Number.isFinite(v) || v < 0) throw new Error(`invalid ${k}: ${v}`);
    const old = prev[k];
    if (typeof old === 'number' && old > 0 && v < old * (1 - MAX_DROP)) {
      throw new Error(`${k} dropped from ${old} to ${v}; refusing (likely a parsing error)`);
    }
  }
  return next;
}

const metrics = JSON.parse(await readFile(FILE, 'utf8'));
const before = JSON.stringify(metrics);

for (const [name, fetcher] of [['scholar', fetchScholar]]) {
  try {
    const prev = metrics[name];
    const values = validate(await fetcher(), prev);
    const changed = Object.entries(values).some(([k, v]) => prev[k] !== v);
    // `updated` is the date the values last changed, so unchanged weeks produce no commit.
    if (changed) metrics[name] = { ...prev, ...values, updated: today };
    console.log(`${name}: ${JSON.stringify(values)}${changed ? '' : ' (unchanged)'}`);
  } catch (err) {
    warn(`${name}: kept previous values (${err.message})`);
  }
}

// Only rewrite the file (and so only commit and redeploy) when a number changed.
if (JSON.stringify(metrics) !== before) {
  await writeFile(FILE, JSON.stringify(metrics, null, 2) + '\n');
  console.log('metrics.json updated');
} else {
  console.log('no changes');
}
