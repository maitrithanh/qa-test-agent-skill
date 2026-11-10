const { EN, FRAG, META } = window.PAGE;
let lang = 'vi';
// Tabs
const tabs = [...document.querySelectorAll('[role=tab]')];
function pick(t) {
  tabs.forEach(b => {
    const on = b === t;
    b.setAttribute('aria-selected', on);
    b.tabIndex = on ? 0 : -1;
    const p = document.getElementById(b.getAttribute('aria-controls'));
    p.hidden = !on; p.classList.toggle('is-on', on);
  });
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => pick(t));
  t.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    const n = tabs[(i + d + tabs.length) % tabs.length]; pick(n); n.focus();
  });
});
// Copy
document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.previousElementSibling.innerText); b.textContent = META[lang][3]; }
  catch { b.textContent = '!'; }
  setTimeout(() => (b.textContent = META[lang][2]), 1500);
}));

// ───────── i18n: tiếng Việt là bản gốc trong HTML, EN nằm ở đây ─────────
const vi = new Map(); // el -> {html, ariaLabel}
const els = [...document.querySelectorAll('body *')].filter(e => e.children.length || e.textContent.trim());
els.forEach(e => { const k = e.innerHTML.trim(); if (EN[k] !== undefined || e.tagName === 'PRE') vi.set(e, e.innerHTML); });
function setLang(l) {
  lang = l;
  vi.forEach((orig, e) => {
    if (!e.isConnected) return;
    if (l === 'vi') { e.innerHTML = orig; return; }
    const k = orig.trim();
    if (e.tagName === 'TH' && k === 'Chế độ') { e.innerHTML = 'Mode'; return; }
    if (EN[k] !== undefined) { e.innerHTML = EN[k]; return; }
    let h = orig; for (const [a, b] of Object.entries(FRAG)) h = h.split(a).join(b);
    e.innerHTML = h;
  });
  document.documentElement.lang = l;
  document.title = META[l][0];
  document.querySelector('meta[name=description]').content = META[l][1];
  document.querySelectorAll('[data-copy]').forEach(b => (b.textContent = META[l][2]));
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === l));
  try { localStorage.setItem('lang', l); } catch {}
  document.dispatchEvent(new Event('langchange'));
}
document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
let saved; try { saved = localStorage.getItem('lang'); } catch {}
setLang(saved || ((navigator.language || '').startsWith('vi') ? 'vi' : 'en'));

// Số sao GitHub: lấy trực tiếp, cache 1 giờ trong sessionStorage; lỗi thì ẩn
(async () => {
  const K = 'stars';
  let n;
  try { const c = JSON.parse(sessionStorage.getItem(K)); if (c && Date.now() - c.t < 36e5) n = c.n; } catch {}
  if (n == null) {
    try {
      const r = await fetch('https://api.github.com/repos/maitrithanh/qa-test-agent-skill');
      if (!r.ok) return;
      n = (await r.json()).stargazers_count;
      try { sessionStorage.setItem(K, JSON.stringify({ n, t: Date.now() })); } catch {}
    } catch { return; }
  }
  document.querySelectorAll('[data-stars]').forEach(e => { e.textContent = n.toLocaleString(); e.parentElement.hidden = false; });
})();
