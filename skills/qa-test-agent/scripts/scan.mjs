// qa-test-agent: cache source tree. Usage: node .qa-agent/bin/scan.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT = '.qa-agent';
const CACHE = `${ROOT}/cache/source-tree.json`;
const SUMS = `${ROOT}/cache/summaries`;
const LOCK = `${ROOT}/cache/scan.lock`;
const SRC = /\.(m?[jt]sx?|cjs|vue|svelte|py|go|java|kt|rb|php|cs)$/;
const JS = /\.(m?[jt]sx?|cjs|vue|svelte)$/;
const EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte'];
const IGNORE = /(^|\/)(node_modules|dist|build|out|coverage|vendor|\.next|\.nuxt|\.svelte-kit|\.qa-agent|playwright-report|test-results)(\/|$)/;
// Secrets are never listed, hashed or read.
const SECRET = /(^|\/)(\.env(\.(?!example$|sample$)[^/]*)?|id_rsa[^/]*|[^/]*\.(pem|key|p12|keystore))$/i;
const TEST = /\.(test|spec)\.|(^|\/)(__tests__|tests?|e2e)\//;
const IMPORT = /(?:import|export)\s[^'";]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g;

// Lock: one scan at a time. A lock older than 5 min is treated as a crashed run.
fs.mkdirSync(SUMS, { recursive: true });
try {
  if (fs.existsSync(LOCK) && Date.now() - fs.statSync(LOCK).mtimeMs > 300000) fs.rmSync(LOCK);
  fs.closeSync(fs.openSync(LOCK, 'wx'));
} catch { console.error('Another scan is running (delete ' + LOCK + ' if stale).'); process.exit(1); }
process.on('exit', () => { try { fs.rmSync(LOCK); } catch {} });

function listFiles() {
  try {
    // -z: raw NUL-separated paths, so non-ASCII names (e.g. Vietnamese) are not quoted/escaped.
    return execSync('git ls-files -co --exclude-standard -z', { encoding: 'utf8', maxBuffer: 1 << 28 })
      .split('\0').filter(Boolean);
  } catch {
    const out = [];
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.posix.join(d === '.' ? '' : d, e.name);
        if (IGNORE.test(p)) continue;
        e.isDirectory() ? walk(p) : out.push(p);
      }
    })('.');
    return out;
  }
}

const prev = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : { files: {} };
const next = { version: 2, scannedAt: new Date().toISOString(), lastRunCommit: prev.lastRunCommit ?? null, files: {} };
const diff = { added: [], changed: [], removed: [], staleSummary: [], unchanged: 0 };
const specs = {}; // path -> raw import specifiers

for (const p of listFiles()) {
  if (!SRC.test(p) || IGNORE.test(p) || SECRET.test(p) || !fs.existsSync(p)) continue;
  const buf = fs.readFileSync(p);
  const hash = crypto.createHash('sha1').update(buf).digest('hex');
  const isTest = TEST.test(p);
  const old = prev.files[p];
  if (!old) diff.added.push(p); else if (old.hash !== hash) diff.changed.push(p); else diff.unchanged++;
  next.files[p] = { hash, isTest };
  if (JS.test(p)) specs[p] = [...buf.toString('utf8').matchAll(IMPORT)].map(m => m[1] || m[2] || m[3] || m[4]);
  const sf = `${SUMS}/${p.replace(/\//g, '__')}.json`;
  let fresh = false;
  if (fs.existsSync(sf)) { try { fresh = JSON.parse(fs.readFileSync(sf, 'utf8')).hash === hash; } catch {} }
  if (!fresh && !isTest) diff.staleSummary.push(p);
}
for (const p of Object.keys(prev.files)) if (!next.files[p]) diff.removed.push(p);

// Drop summaries whose source file no longer exists.
const live = new Set(Object.keys(next.files).map(p => `${p.replace(/\//g, '__')}.json`));
for (const f of fs.readdirSync(SUMS)) if (!live.has(f)) fs.rmSync(`${SUMS}/${f}`);

// Import graph. Resolves relative imports and aliases like "@/x" by trying "x" and "src/x".
// ponytail: regex + path guess, not tsconfig paths / Python / Go; add a resolver per language if needed.
function resolve(from, spec) {
  const bases = spec.startsWith('.') ? [path.posix.join(path.posix.dirname(from), spec)]
    : /^[@~#]\//.test(spec) ? [spec.slice(2), 'src/' + spec.slice(2)] : [];
  for (const b of bases) {
    const stem = b.replace(/\.(m?js|cjs)$/, '');
    for (const c of [b, ...EXTS.map(e => stem + e), ...EXTS.map(e => `${b}/index${e}`)]) if (next.files[c]) return c;
  }
}
const rev = {}; // file -> files that import it
for (const [f, ss] of Object.entries(specs)) {
  const deps = [...new Set(ss.map(s => resolve(f, s)).filter(Boolean))];
  next.files[f].deps = deps;
  for (const d of deps) (rev[d] ??= []).push(f);
}
// Transitive dependents of added/changed files: summaries/tests of these may be affected.
const seen = new Set([...diff.added, ...diff.changed]);
const queue = [...seen];
while (queue.length) for (const d of rev[queue.shift()] ?? []) if (!seen.has(d)) { seen.add(d); queue.push(d); }
const dependents = [...seen].filter(p => !diff.added.includes(p) && !diff.changed.includes(p));
diff.impacted = dependents.filter(p => !next.files[p].isTest);
diff.impactedTests = dependents.filter(p => next.files[p].isTest);

// Atomic write: a crash never leaves a half-written cache.
fs.writeFileSync(CACHE + '.tmp', JSON.stringify(next, null, 1));
fs.renameSync(CACHE + '.tmp', CACHE);
console.log(JSON.stringify({ total: Object.keys(next.files).length, ...diff }, null, 1));
