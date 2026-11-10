#!/usr/bin/env node
// Objective scorer for qa-test-agent. A bug counts as CAUGHT when some test fails on the buggy app
// and passes once ONLY that bug is fixed. Tests failing on the fully fixed app are false positives.
// Usage: node evals/score.mjs <dir with node:test files that import ../src/*.js>
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const testsDir = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !fs.existsSync(testsDir)) { console.error('usage: score.mjs <tests-dir>'); process.exit(2); }
const key = JSON.parse(fs.readFileSync(path.join(here, 'answer-key.json'), 'utf8'));

function variant(fixIds) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-eval-'));
  fs.cpSync(path.join(here, 'buggy-app'), d, { recursive: true });
  fs.cpSync(testsDir, path.join(d, 'tests'), { recursive: true });
  for (const b of key.filter((k) => fixIds.includes(k.id))) {
    const f = path.join(d, b.file); const s = fs.readFileSync(f, 'utf8');
    if (s.split(b.buggy).length !== 2) throw new Error(`answer key broken for ${b.id}`);
    fs.writeFileSync(f, s.replace(b.buggy, () => b.fixed));
  }
  return d;
}
function run(d) { // returns Map(testName -> pass)
  const r = spawnSync('node', ['--test', '--test-reporter=tap', 'tests/'], { cwd: d, encoding: 'utf8' });
  const res = new Map();
  for (const l of r.stdout.split('\n')) { const m = l.match(/^\s*(not )?ok \d+ - (.*?)(?: # .*)?$/); if (m) res.set(m[2], !m[1]); }
  return res;
}
const all = key.map((k) => k.id);
const base = run(variant([]));
const fixed = run(variant(all));
const falsePositives = [...fixed].filter(([, ok]) => !ok).map(([n]) => n);
const caught = {}, missed = [];
for (const b of key) {
  const r = run(variant([b.id]));
  const flips = [...base].filter(([n, ok]) => !ok && r.get(n) === true).map(([n]) => n);
  flips.length ? (caught[b.id] = flips) : missed.push(`${b.id}: ${b.what}`);
}
console.log(JSON.stringify({ tests: base.size, caughtCount: Object.keys(caught).length, bugs: key.length, score: `${Object.keys(caught).length}/${key.length}`, falsePositives, missed, caught }, null, 1));
