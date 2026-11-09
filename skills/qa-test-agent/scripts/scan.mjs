// qa-test-agent: cache source tree. Usage: node .qa-agent/bin/scan.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT = '.qa-agent';
const CACHE = `${ROOT}/cache/source-tree.json`;
const SUMS = `${ROOT}/cache/summaries`;
const SRC = /\.(m?[jt]sx?|cjs|vue|svelte|py|go|java|kt|rb|php|cs)$/;
const IGNORE = /(^|\/)(node_modules|dist|build|out|coverage|vendor|\.next|\.nuxt|\.svelte-kit|\.qa-agent|playwright-report|test-results)(\/|$)/;

function listFiles() {
  try {
    return execSync('git ls-files -co --exclude-standard', { encoding: 'utf8', maxBuffer: 1 << 28 })
      .split('\n').filter(Boolean);
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
const next = { version: 1, scannedAt: new Date().toISOString(), lastRunCommit: prev.lastRunCommit ?? null, files: {} };
const diff = { added: [], changed: [], removed: [], staleSummary: [], unchanged: 0 };

for (const p of listFiles()) {
  if (!SRC.test(p) || IGNORE.test(p) || !fs.existsSync(p)) continue;
  const hash = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
  const isTest = /\.(test|spec)\.|(^|\/)(__tests__|tests?|e2e)\//.test(p);
  const old = prev.files[p];
  if (!old) diff.added.push(p); else if (old.hash !== hash) diff.changed.push(p); else diff.unchanged++;
  next.files[p] = { hash, isTest };
  const sf = `${SUMS}/${p.replace(/\//g, '__')}.json`;
  let fresh = false;
  if (fs.existsSync(sf)) { try { fresh = JSON.parse(fs.readFileSync(sf, 'utf8')).hash === hash; } catch {} }
  if (!fresh && !isTest) diff.staleSummary.push(p);
}
for (const p of Object.keys(prev.files)) if (!next.files[p]) diff.removed.push(p);

fs.mkdirSync(SUMS, { recursive: true });
fs.writeFileSync(CACHE, JSON.stringify(next, null, 1));
console.log(JSON.stringify({ total: Object.keys(next.files).length, ...diff }, null, 1));
