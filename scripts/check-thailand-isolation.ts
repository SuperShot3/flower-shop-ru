/**
 * CI / pre-build guard: fail if Thailand production hosts appear outside scripts/archive.
 */
import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN = [
  'lannabloom.shop',
  'kwbffyojrdjlehdhpptf',
  'supabase.co',
  'googletagmanager.com',
];

const ALLOWED_PREFIXES = [
  'scripts/',
  'scripts\\',
  'docs/',
  'ai_context/',
  '.cursor/',
  'README',
  'data/',
];

const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.mdx']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function isAllowed(rel: string): boolean {
  return ALLOWED_PREFIXES.some((p) => rel.startsWith(p));
}

const root = process.cwd();
const hits: string[] = [];

for (const file of walk(root)) {
  const ext = path.extname(file);
  if (!EXT.has(ext)) continue;
  const rel = path.relative(root, file).replace(/\\/g, '/');
  if (isAllowed(rel)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of FORBIDDEN) {
    if (text.includes(needle)) {
      hits.push(`${rel} (${needle})`);
      break;
    }
  }
}

if (hits.length) {
  console.error('[check-thailand-isolation] Forbidden Thailand references found:');
  for (const h of hits) console.error(' -', h);
  process.exit(1);
}

console.log('[check-thailand-isolation] OK');
