// Reads publications.bib from the iovinoludovico/publications repo at build time.
// The site is rebuilt when that repo is pushed (repository_dispatch) and every night, see deploy.yml.
// If the file cannot be fetched or parsed the build fails, so the live site is never replaced by an empty list.
import { parse } from '@retorquere/bibtex-parser';

const REPO = 'iovinoludovico/publications';
const OWNER = { lastName: 'Iovino', firstName: 'Ludovico' };

export type PubType = 'Journal' | 'Conference' | 'Chapter' | 'Book' | 'Other';

export interface Publication {
  id: string;
  type: PubType;
  year: number;
  month: number;
  title: string;
  authors: { name: string; isOwner: boolean }[];
  venue: string;
  details: string;
  doi?: string;
  url?: string;
  bibtex: string;
}

export const TYPE_ORDER: PubType[] = ['Journal', 'Conference', 'Chapter', 'Book', 'Other'];

const TYPE_MAP: Record<string, PubType> = {
  article: 'Journal',
  inproceedings: 'Conference',
  conference: 'Conference',
  inbook: 'Chapter',
  incollection: 'Chapter',
  book: 'Book',
  proceedings: 'Book',
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function monthNumber(raw: unknown): number {
  const s = String(raw ?? '').trim().toLowerCase();
  if (/^\d+$/.test(s)) return Number(s);
  const i = MONTHS.indexOf(s.slice(0, 3));
  return i >= 0 ? i + 1 : 0;
}

type Creator = { lastName?: string; firstName?: string; name?: string };

function initials(first = ''): string {
  return first
    .split(/[\s]+/)
    .filter(Boolean)
    .map((part) => part.split('-').map((p) => `${p[0]}.`).join('-'))
    .join(' ');
}

function str(v: unknown): string {
  return Array.isArray(v) ? v.join(', ') : v == null ? '' : String(v);
}

export const bibUrl = (ref = 'main') => `https://raw.githubusercontent.com/${REPO}/${ref}/publications.bib`;

let cache: Promise<Publication[]> | undefined;

export function getPublications(): Promise<Publication[]> {
  cache ??= load();
  return cache;
}

async function load(): Promise<Publication[]> {
  const ref = process.env.BIB_REF || 'main';
  const res = await fetch(bibUrl(ref));
  if (!res.ok) throw new Error(`Could not fetch publications.bib (${ref}): HTTP ${res.status}`);
  // "Sept" is not a standard BibTeX month macro; normalise it before parsing.
  const text = (await res.text()).replace(/(month\s*=\s*)Sept\b/gi, '$1sep');

  const lib = parse(text, { english: false, sentenceCase: false, caseProtection: false });
  if (lib.entries.length === 0) throw new Error('publications.bib contains no entries');
  for (const err of lib.errors) console.warn(`[publications] ${err.error}`);

  const pubs = lib.entries.map((e): Publication => {
    const f = e.fields as Record<string, unknown>;
    const doi = str(f.doi) || str(f.url).match(/doi\.org\/(10\..+)$/)?.[1] || undefined;
    const creators = (f.author ?? f.editor ?? []) as Creator[];
    const venue = str(f.journal) || str(f.booktitle) || str(f.publisher);
    const details = [
      f.volume && `vol. ${str(f.volume)}`,
      f.number && `no. ${str(f.number)}`,
      f.pages && `pp. ${str(f.pages)}`,
      (f.journal || f.booktitle) && f.publisher && str(f.publisher),
    ]
      .filter(Boolean)
      .join(', ');
    let title = str(f.title);
    if (!title) {
      console.warn(`[publications] entry ${e.key} has no title`);
      title = venue || e.key;
    }
    return {
      id: e.key,
      type: TYPE_MAP[e.type.toLowerCase()] ?? 'Other',
      year: Number(str(f.year)) || 0,
      month: monthNumber(f.month),
      title,
      authors: creators.map((c) => ({
        name: c.name ?? [c.lastName, initials(c.firstName)].filter(Boolean).join(', '),
        isOwner: c.lastName === OWNER.lastName && Boolean(c.firstName?.startsWith(OWNER.firstName[0])),
      })),
      venue,
      details,
      doi,
      url: doi ? `https://doi.org/${doi}` : str(f.url) || undefined,
      bibtex: e.input.trim(),
    };
  });

  return pubs.sort((a, b) => b.year - a.year || b.month - a.month || a.title.localeCompare(b.title));
}
