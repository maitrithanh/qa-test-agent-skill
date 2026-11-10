#!/usr/bin/env node
// qa-test-agent: UI check on Chromium. Opens URLs, records what a real browser sees.
// Usage: node .qa-agent/bin/ui-check.mjs <url...> [--viewports desktop,mobile] [--out DIR]
//        [--storage state.json] [--timeout 15000] [--allow-remote] [--strict]
// Needs Playwright already installed in the project (this script never installs anything).
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i < 0 ? d : args[i + 1]; };
const flag = (n) => args.includes(`--${n}`);
const urls = args.filter((a) => /^https?:\/\//.test(a));
if (!urls.length) { console.error('usage: ui-check.mjs <url...> [--viewports desktop,mobile] [--out DIR] [--storage FILE] [--timeout MS] [--allow-remote] [--strict]'); process.exit(2); }

const VIEWPORTS = { desktop: { width: 1280, height: 800 }, tablet: { width: 768, height: 1024 }, mobile: { width: 375, height: 667 } };
const vps = opt('viewports', 'desktop').split(',').map((v) => v.trim());
for (const v of vps) if (!VIEWPORTS[v]) { console.error(`unknown viewport "${v}" (desktop|tablet|mobile)`); process.exit(2); }
const out = opt('out', '.qa-agent/logs/ui-check');
const timeout = Number(opt('timeout', 15000));

// Safety: dynamic checks only against local targets unless the user opts in.
const LOCAL = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0)$/;
for (const u of urls) {
  let host; try { host = new URL(u).hostname; } catch { console.error(`invalid URL: ${u}`); process.exit(2); }
  if (!LOCAL.test(host) && !flag('allow-remote')) { console.error(`refusing non-local host "${host}" (pass --allow-remote only for targets the user named)`); process.exit(2); }
}

let chromium;
for (const pkg of ['@playwright/test', 'playwright', 'playwright-core']) {
  try { ({ chromium } = await import(pkg)); break; } catch {}
}
if (!chromium) { console.error('Playwright not found. Ask the user before installing: <pm> add -D @playwright/test && npx playwright install chromium'); process.exit(3); }

fs.mkdirSync(out, { recursive: true });
let browser, firstErr;
// Bundled Chromium first; fall back to an installed Chrome/Edge ("or similar") without downloading anything.
for (const opts of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
  try { browser = await chromium.launch(opts); break; } catch (e) { firstErr ??= e; }
}
if (!browser) { console.error(`cannot launch a browser: ${firstErr.message.split('\n')[0]}\nTry: npx playwright install chromium (ask the user first)`); process.exit(3); }

const slug = (s) => s.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 80);
const results = [];
let findingsTotal = 0;

for (const url of urls) for (const vp of vps) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[vp], ...(opt('storage') ? { storageState: opt('storage') } : {}) });
  const page = await ctx.newPage();
  const r = { url, viewport: vp, status: null, title: null, console: [], pageErrors: [], failedRequests: [], findings: [] };
  page.on('console', (m) => { if (m.type() === 'error') r.console.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => r.pageErrors.push(String(e.message).slice(0, 300)));
  page.on('response', (res) => { if (res.status() >= 400) r.failedRequests.push(`${res.status()} ${res.request().method()} ${res.url().slice(0, 200)}`); });
  page.on('requestfailed', (req) => r.failedRequests.push(`FAILED ${req.method()} ${req.url().slice(0, 200)} (${req.failure()?.errorText})`));
  const base = path.join(out, `${slug(url)}.${vp}`);
  try {
    const res = await page.goto(url, { timeout, waitUntil: 'load' });
    r.status = res?.status() ?? null;
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {}); // best effort; SPAs with polling never go idle
    r.title = await page.title();
    // Same data the skill needs for locators: the accessibility tree as the browser exposes it.
    fs.writeFileSync(`${base}.aria.txt`, await page.locator('body').ariaSnapshot());
    await page.screenshot({ path: `${base}.png`, fullPage: true });
    const dom = await page.evaluate(() => ({
      imgNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
      unlabeled: [...document.querySelectorAll('input:not([type=hidden]),select,textarea')]
        .filter((e) => !e.labels?.length && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.title).length,
      noName: [...document.querySelectorAll('button,a[href]')]
        .filter((e) => !(e.textContent || '').trim() && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.title && !e.querySelector('img[alt]:not([alt=""])')).length,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      h1: document.querySelectorAll('h1').length,
    }));
    if (r.status >= 400) r.findings.push(`HTTP ${r.status}`);
    if (r.pageErrors.length) r.findings.push(`${r.pageErrors.length} uncaught page error(s)`);
    if (r.console.length) r.findings.push(`${r.console.length} console error(s)`);
    if (r.failedRequests.length) r.findings.push(`${r.failedRequests.length} failed request(s)`);
    if (dom.imgNoAlt) r.findings.push(`${dom.imgNoAlt} <img> without alt`);
    if (dom.unlabeled) r.findings.push(`${dom.unlabeled} form control(s) without a label`);
    if (dom.noName) r.findings.push(`${dom.noName} button/link(s) without an accessible name`);
    if (dom.overflowX > 1) r.findings.push(`horizontal overflow ${dom.overflowX}px at ${vp}`);
    if (dom.h1 !== 1) r.findings.push(`${dom.h1} <h1> (expected 1)`);
    r.files = { aria: `${base}.aria.txt`, screenshot: `${base}.png` };
  } catch (e) {
    r.findings.push(`navigation failed: ${e.message.split('\n')[0]}`);
  }
  findingsTotal += r.findings.length;
  results.push(r);
  await ctx.close();
}
await browser.close();

fs.writeFileSync(path.join(out, 'ui-check.json'), JSON.stringify(results, null, 1));
console.log(JSON.stringify({ pages: results.length, findings: findingsTotal, report: path.join(out, 'ui-check.json'), results }, null, 1));
// Findings are leads, not verdicts: exit 0 unless --strict, so a lead never reads as a failed test run.
process.exit(flag('strict') && findingsTotal ? 1 : 0);
