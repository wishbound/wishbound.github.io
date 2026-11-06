/* Wishbound. Made by @pookieleb. All rights reserved. */
"use strict";

/* ---------- helpers ---------- */
const KEY = "wishbound-v2";
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const r2 = n => Math.round((+n || 0) * 100) / 100;
const num = v => (v === "" || v == null || isNaN(+v)) ? 0 : +v;
const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const thisMonth = () => today().slice(0, 7);
const parseD = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d || 1); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtMonth = m => { const [y, mo] = m.split("-"); return `${MONTHS[+mo - 1]} ${y}`; };
const fmtDate = (d, noYear) => { if (!d) return ""; const [y, m, dd] = d.split("-"); return `${+dd} ${MONTHS[+m - 1]}${noYear && y === today().slice(0, 4) ? "" : " " + y}`; };
const fmtRange = (a, b) => a ? (b ? `${fmtDate(a, true)} to ${fmtDate(b, true)}` : `from ${fmtDate(a, true)}`) : "";
const addMonth = (m, k) => { let [y, mo] = m.split("-").map(Number); mo += k; while (mo > 12) { mo -= 12; y++; } while (mo < 1) { mo += 12; y--; } return `${y}-${pad(mo)}`; };
const fmtW = n => { n = r2(n); const s = Math.abs(n % 1) < 0.005 ? n.toFixed(0) : (Math.round(n * 10) / 10).toString(); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
const fmtWB = n => Math.floor(r2(n) + 1e-9).toLocaleString("en");
const sym = () => (CURRENCIES.find(c => c[0] === S.profile.currency) || ["", ""])[1];
const fmtM = n => { const big = ["IDR", "VND", "KRW", "JPY"].includes(S.profile.currency); return sym() + " " + (+n || 0).toLocaleString("en", {minimumFractionDigits: big ? 0 : 2, maximumFractionDigits: big ? 0 : 2}); };
const liOf = k => LIS.find(l => l.k === k);
const typeName = k => (BANNER_TYPES.find(t => t.k === k) || {n: k === "standard" ? "Xspace Echo" : "Wish pool"}).n;
const D2W = d => r2(d / CONFIG.diamondsPerWish);
const val = (el, sel) => el.querySelector(sel).value;
const plural = (n, w) => `${fmtW(n)} ${w}${Math.abs(n) === 1 ? "" : "s"}`;

const IC = {
  home: '<path d="M12 3l2.4 6.1L21 12l-6.6 2.9L12 21l-2.4-6.1L3 12l6.6-2.9z"/>',
  pools: '<circle cx="12" cy="12" r="8"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/>',
  shop: '<path d="M5 8h14l-1.2 11H6.2z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
  cards: '<rect x="4" y="5" width="11" height="15" rx="2"/><path d="M9 3h9a2 2 0 012 2v12"/>',
  hist: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  gear: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',
  pull: '<path d="M12 3l2 5.5L20 10l-5 3.5 1.5 6L12 16l-4.5 3.5 1.5-6L4 10l6-1.5z"/>',
  bag: '<path d="M5 8h14l-1.2 11H6.2z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M12 9v11M4 13h16M12 9c-2-4-6-3-5 0M12 9c2-4 6-3 5 0"/>',
  sync: '<path d="M4 12a8 8 0 0113.7-5.7L20 8M20 12a8 8 0 01-13.7 5.7L4 16"/><path d="M20 4v4h-4M4 20v-4h4"/>',
  minus: '<path d="M5 12h14"/>', plus: '<path d="M12 5v14M5 12h14"/>', eq: '<path d="M5 9h14M5 15h14"/>'
};
const icon = (k, attrs = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${attrs}>${IC[k]}</svg>`;
const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a2152"/><stop offset="1" stop-color="#5a2f66"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#lg)"/><circle cx="32" cy="32" r="17" fill="none" stroke="#e8cb8f" stroke-width="2.4" stroke-dasharray="80 120" stroke-linecap="round" transform="rotate(-90 32 32)"/><path d="M32 19l3.2 9.8L45 32l-9.8 3.2L32 45l-3.2-9.8L19 32l9.8-3.2z" fill="#fff4dc"/></svg>`;

/* ---------- catalog ---------- */
const MEM = Object.fromEntries(MEMORIES.map(m => [m.id, m]));
const memsOfPool = name => MEMORIES.filter(m => m.src === name);
const yearOf = b => (b.start || "").slice(0, 4);

/* ---------- state ---------- */
function freshState() {
  return {
    v: 3, setupDone: false, updatedAt: 0,
    profile: {currency: "MYR", lis: [], trackStandard: false},
    settings: {theme: "auto", budget: 0, autoIncome: true, extraIncome: 0},
    income: {lastRun: null, amounts: {}, off: {}},
    passes: {},
    pools: {limited: {pity: 0, guar: false, ts: 0}, rerun: {pity: 0, guar: false, ts: 0}, special: {pity: 0, guar: false, ts: 0}, standard: {pity: 0, guar: false, ts: 0}},
    entries: [], banners: [], bplans: {}, plans: [], owned: {}, cards: [],
    packs: DEFAULT_PACKS.map(p => ({...p, price: p.myr})),
    images: {header: null, li: {}}, sync: {code: "", last: 0}
  };
}
let S, storageOK = true;
function normalise(s) {
  const f = freshState();
  s = Object.assign(f, s);
  ["profile", "settings", "income", "pools", "images", "sync"].forEach(k => s[k] = Object.assign(freshState()[k], s[k] || {}));
  ["entries", "banners", "plans", "cards"].forEach(k => s[k] = Array.isArray(s[k]) ? s[k] : []);
  s.owned = s.owned || {}; s.bplans = s.bplans || {};
  // packs: keep user prices, refresh pack definitions
  const old = Object.fromEntries((s.packs || []).map(p => [p.id, p]));
  s.packs = DEFAULT_PACKS.map(p => ({...p, price: old[p.id] && old[p.id].price != null ? old[p.id].price : (s.profile.currency === "MYR" ? p.myr : null)}))
    .concat((s.packs || []).filter(p => !DEFAULT_PACKS.some(d => d.id === p.id) && p.custom !== false && !/^(ydiam|ywish|ygrow|aurum|secret|vow|waurum)$/.test(p.id)).map(p => ({...p, custom: true})));
  // older versions kept typed-in cards; match them to the catalog
  if (s.cards.length && s.v < 3) {
    s.cards = s.cards.filter(c => {
      const m = MEMORIES.find(x => x.li === c.li && x.name.toLowerCase() === String(c.name).replace(/^.*?:\s*/, "").toLowerCase());
      if (!m) return true;
      s.owned[m.id] = {have: !!c.owned, rank: num(c.rank), want: !!c.wanted}; return false;
    });
  }
  if (s.v < 3) { ["ydiamond", "ywish", "ygrowth", "ybonus"].forEach(k => { if (s.passes[k]) s.passes[k] = YEARLY.end; }); }
  s.v = 3;
  return s;
}
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { storageOK = false; }
  try { S = raw ? normalise(JSON.parse(raw)) : freshState(); } catch (e) { S = freshState(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); storageOK = true; } catch (e) { storageOK = false; } }
let undoSnap = null;
function act(msg, fn, undoable = true) {
  const before = JSON.stringify(S);
  fn();
  S.updatedAt = Date.now();
  save(); render(); queuePush();
  undoSnap = undoable ? before : null;
  if (msg) toast(msg, undoable);
}
function undo() { if (!undoSnap) return; S = normalise(JSON.parse(undoSnap)); undoSnap = null; S.updatedAt = Date.now(); save(); render(); queuePush(); toast("Undone"); }

/* ---------- numbers ---------- */
const ordered = () => S.entries.slice().sort((a, b) => a.date.localeCompare(b.date) || (a.ts || 0) - (b.ts || 0));
function delta(e) {
  if (e.kind === "pull") return e.cur === "emp" ? {ds: 0, emp: -e.pulls} : {ds: -e.pulls, emp: 0};
  return {ds: num(e.wishes), emp: num(e.emp)};
}
function balances() { let ds = 0, emp = 0; for (const e of S.entries) { const d = delta(e); ds += d.ds; emp += d.emp; } return {ds: r2(ds), emp: r2(emp)}; }
function totals() {
  let spent = 0, bought = 0, est = 0, used = 0, got = 0;
  for (const e of S.entries) {
    if (e.kind === "pull") used += e.pulls;
    else if (e.kind !== "adjust") got += num(e.wishes) + num(e.emp);
    if (e.kind === "purchase") { spent += num(e.amount); bought += num(e.total ?? e.wishes) + num(e.emp); if (e.estimate) est += num(e.amount); }
  }
  return {spent: r2(spent), bought: r2(bought), est: r2(est), used, got: r2(got)};
}
const spentIn = m => r2(S.entries.filter(e => e.kind === "purchase" && !e.estimate && e.date.startsWith(m)).reduce((s, e) => s + num(e.amount), 0));
const plannedIn = m => S.plans.filter(p => p.month === m);
const extraOf = e => e.extra != null ? e.extra : (e.purpose && e.purpose !== "card" ? e.pulls : 0);

/* Pity = last value set by the player, then every logged session after it, in date order. */
function sessionMath(before, guarBefore, pulls, results) {
  let pity = before, guar = guarBefore, used = 0, warn = "";
  for (const r of results) {
    const step = num(r.pity) - pity;
    if (step < 1) warn = "A 5★ is set to drop at a pity lower than the one before it.";
    used += Math.max(1, step); pity = 0;
    if (r.outcome === "lost") guar = true; else if (r.outcome === "win" || r.outcome === "guar") guar = false;
  }
  if (pulls - used < 0) warn = "The 5★ wish numbers add up to more wishes than you entered.";
  pity = results.length ? Math.max(0, pulls - used) : before + pulls;
  if (pity > CONFIG.hardPity) warn = warn || `Pity can't go past ${CONFIG.hardPity}. One of the numbers looks off.`;
  return {pity: Math.min(pity, CONFIG.hardPity), guar, warn};
}
function poolState(pool, uptoId) {
  const base = S.pools[pool] || {pity: 0, guar: false, ts: 0};
  let pity = num(base.pity), guar = !!base.guar;
  for (const e of ordered()) {
    if (uptoId && e.id === uptoId) break;
    if (e.kind !== "pull" || e.pool !== pool || (e.ts || 0) <= (base.ts || 0)) continue;
    const r = sessionMath(pity, guar, e.pulls, e.results || []); pity = r.pity; guar = r.guar;
  }
  return {pity, guar};
}

/* ---------- wish pools ---------- */
function allBanners() { return BANNERS.map(b => ({...b, catalog: true})).concat(S.banners.map(b => ({...b, custom: true}))); }
const bannerById = id => allBanners().find(b => b.id === id);
function bannerStatus(b) {
  const t = today();
  if (b.end && b.end < t) return "past";
  if (b.start && b.start > t) return "upcoming";
  if (!b.end && b.start && b.start.slice(0, 7) < thisMonth()) return "past";
  return "current";
}
const bannersBy = st => allBanners().filter(b => bannerStatus(b) === st).sort((a, b) => (a.start || "").localeCompare(b.start || ""));
function bannerStats(b) {
  const pulls = S.entries.filter(e => e.kind === "pull" && e.bannerId === b.id);
  const buys = S.entries.filter(e => e.kind === "purchase" && e.bannerId === b.id);
  const res = pulls.flatMap(e => e.results || []);
  return {pulls: pulls.reduce((s, e) => s + e.pulls, 0), extra: pulls.reduce((s, e) => s + extraOf(e), 0), results: res,
    gotFeatured: res.some(r => r.outcome === "win" || r.outcome === "guar"),
    spent: r2(buys.reduce((s, e) => s + num(e.amount), 0)), bought: r2(buys.reduce((s, e) => s + num(e.wishes), 0))};
}
const bannerKind = b => `${typeName(b.type)}${b.rerun ? " rerun" : ""}`;
const planFor = b => S.bplans[b.id] || {pulls: b.custom ? num(b.pulls) : 0, free: b.custom ? num(b.free) : 0};

/* ---------- passes and daily income ---------- */
const incomeAmt = s => S.income.amounts[s.k] ?? s.d;
const incomeOn = s => !S.income.off[s.k];
const passActive = (k, day) => !!S.passes[k] && day <= S.passes[k] && (!/^y/.test(k) || day >= YEARLY.start);
function incomeFor(day) {
  const d = parseD(day), lines = {};
  for (const s of INCOME_SOURCES) {
    if (!incomeOn(s) || (s.need && !passActive(s.need, day))) continue;
    if (s.when === "weekly" && d.getDay() !== 1) continue;
    if (s.when === "monthly" && d.getDate() !== s.day) continue;
    lines[s.n] = (lines[s.n] || 0) + incomeAmt(s);
  }
  return lines;
}
function monthlyIncome() {
  let dia = 0; const t = today();
  for (const s of INCOME_SOURCES) { if (!incomeOn(s) || (s.need && !passActive(s.need, t))) continue; dia += incomeAmt(s) * (s.when === "daily" ? 30 : s.when === "weekly" ? 4.3 : 1); }
  return {auto: S.settings.autoIncome ? D2W(dia) : 0, extra: num(S.settings.extraIncome)};
}
function runAutoIncome() {
  if (!S.setupDone) return;
  const t = today();
  if (!S.income.lastRun || !S.settings.autoIncome) { if (S.income.lastRun !== t) { S.income.lastRun = t; save(); } return; }
  if (S.income.lastRun >= t) return;
  const gap = daysBetween(S.income.lastRun, t), lines = {};
  for (let i = 1; i <= gap; i++) for (const [k, v] of Object.entries(incomeFor(addDays(S.income.lastRun, i)))) lines[k] = (lines[k] || 0) + v;
  const dia = Object.values(lines).reduce((a, b) => a + b, 0), from = addDays(S.income.lastRun, 1);
  const apply = () => act(dia ? `Added ${plural(D2W(dia), "wish")} from logging in` : "", () => {
    if (dia) S.entries.push({id: uid(), ts: Date.now(), kind: "gain", auto: true, date: t, source: "Daily login income", label: "Daily login income", wishes: D2W(dia), diamonds: dia,
      note: `${gap > 1 ? fmtDate(from, true) + " to " : ""}${fmtDate(t, true)}. ` + Object.entries(lines).map(([k, v]) => `${k} ${v}`).join(", ")});
    S.income.lastRun = t;
  }, !!dia);
  if (gap > 7) {
    modal(`<h3>Welcome back</h3><div class="desc">You last opened ${CONFIG.appName} ${gap} days ago. If you logged in to the game every day since then, ${plural(D2W(dia), "wish")} (${dia.toLocaleString()} Diamonds) will be added.</div>
      <div class="acts"><button class="btn" data-skip>I missed some days</button><button class="btn primary" data-ok>Add them</button></div>`, el => {
      el.querySelector("[data-skip]").onclick = () => { closeModal(); act("Skipped. Use “Match game” to fix your total.", () => { S.income.lastRun = t; }, false); };
      el.querySelector("[data-ok]").onclick = () => { closeModal(); apply(); };
    });
  } else apply();
}
function startPass(key, date) {
  const d = date || today();
  if (key === "aurum") { const cur = S.passes.aurum && S.passes.aurum >= d ? S.passes.aurum : d; S.passes.aurum = addDays(cur, 30); }
  else S.passes[key] = YEARLY.end;
  const y = ["ydiamond", "ywish", "ygrowth"];
  if (y.every(k => S.passes[k])) S.passes.ybonus = YEARLY.end;
}
function promiseBought() { return S.entries.find(e => e.kind === "purchase" && /^(secret|vow)$/.test(e.packId) && daysBetween(e.date, today()) < PROMISE_DAYS); }

/* ---------- sync (Supabase) ---------- */
const syncOn = () => !!(CONFIG.syncUrl && CONFIG.syncKey);
async function rpc(fn, body) {
  const r = await fetch(`${CONFIG.syncUrl}/rest/v1/rpc/${fn}`, {method: "POST", headers: {"Content-Type": "application/json", apikey: CONFIG.syncKey, Authorization: `Bearer ${CONFIG.syncKey}`}, body: JSON.stringify(body)});
  if (!r.ok) throw new Error(await r.text());
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
const syncPayload = () => { const c = JSON.parse(JSON.stringify(S)); c.images = {header: null, li: {}}; c.sync = {code: ""}; return c; };
let pushTimer = null;
function queuePush() { if (!syncOn() || !S.sync.code) return; clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 1500); }
async function pushNow() {
  try { await rpc("wb_put", {p_code: S.sync.code, p_data: syncPayload(), p_updated: S.updatedAt}); S.sync.last = Date.now(); save(); }
  catch (e) { /* offline: the next change or visit tries again */ }
}
async function pullNow(quiet) {
  if (!syncOn() || !S.sync.code) return;
  try {
    const r = await rpc("wb_get", {p_code: S.sync.code});
    if (r && r.data && +r.updated_at > S.updatedAt) {
      const keep = {images: S.images, sync: S.sync};
      S = normalise(r.data); S.images = keep.images; S.sync = keep.sync; S.updatedAt = +r.updated_at; save(); render();
      if (!quiet) toast("Updated from your other device");
    } else if (!r || !r.data || S.updatedAt > +r.updated_at) pushNow();
  } catch (e) { /* offline */ }
}
function newCode() { const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; const g = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), x => a[x % a.length]).join(""); return `LADS-${g()}-${g()}`; }

/* ---------- UI plumbing ---------- */
let tab = "home", shopView = "passes", histFilter = "all", histQuery = "", packGroup = "", colLi = "all", colView = "li", colFilter = "all", colQuery = "";
function toast(t, withUndo) {
  document.querySelectorAll(".toast").forEach(x => x.remove());
  const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status");
  d.innerHTML = `<span>${esc(t)}</span>${withUndo ? `<button>Undo</button>` : ""}`;
  if (withUndo) d.querySelector("button").onclick = () => { d.remove(); undo(); };
  document.body.appendChild(d); setTimeout(() => d.remove(), withUndo ? 5000 : 2600);
}
function modal(html, onMount, reuse) {
  const ex = $("#scrim");
  if (reuse && ex) { const sh = ex.firstChild; sh.innerHTML = html; sh.scrollTop = 0; onMount && onMount(sh, ex); return; }
  closeModal();
  const s = document.createElement("div"); s.className = "scrim"; s.id = "scrim";
  s.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  s.addEventListener("click", e => { if (e.target === s && !s.dataset.lock) closeModal(); });
  document.body.appendChild(s);
  onMount && onMount(s.firstChild, s);
}
function closeModal() { const s = $("#scrim"); if (s) s.remove(); }
document.addEventListener("keydown", e => { const s = $("#scrim"); if (e.key === "Escape" && s && !s.dataset.lock) closeModal(); });
const bind = (el, sel, fn) => { const x = el.querySelector(sel); if (x) x.onclick = fn; };
function confirmBox(title, text, okLabel, fn) {
  modal(`<h3>${esc(title)}</h3><div class="desc">${esc(text)}</div><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn danger" data-ok>${esc(okLabel)}</button></div>`, el => {
    bind(el, "[data-x]", closeModal); bind(el, "[data-ok]", () => { closeModal(); fn(); });
  });
}
function applyTheme() {
  const t = S.settings.theme, dark = t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const mc = document.querySelector('meta[name=theme-color]'); if (mc) mc.content = dark ? "#0b0f26" : "#f3f4fb";
}
if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);

/* pictures: the player's own uploads first, then any shared pictures put in the site's assets folder */
const ASSET = {header: null, li: {}};
function probeAssets() {
  const tryImg = (src, cb) => { const i = new Image(); i.onload = () => { cb(src); render(); }; i.src = src; };
  tryImg("assets/header.jpg", s => ASSET.header = s);
  LIS.forEach(l => tryImg(`assets/li/${l.k}.png`, s => ASSET.li[l.k] = s));
}
const liImg = k => S.images.li[k] || ASSET.li[k];
function avatar(k, lg) {
  const l = liOf(k); if (!l) return "";
  const img = liImg(k);
  return `<span class="av ${lg ? "lg" : ""}" style="--c:${l.c};${img ? `background-image:url('${img}')` : ""}" title="${esc(l.n)}">${img ? "" : l.n[0]}</span>`;
}
const avatars = ks => `<span class="avs">${(ks || []).map(k => avatar(k)).join("")}</span>`;
const liOptions = (sel, none) => (none ? `<option value="">Not sure</option>` : "") + LIS.map(l => `<option value="${l.k}" ${sel === l.k ? "selected" : ""}>${l.n}</option>`).join("");
const myLis = () => S.profile.lis.length ? S.profile.lis : LIS.map(l => l.k);
const dateField = (v, id = "f_d") => `<div class="field" data-datewrap><button type="button" class="linkbtn" data-showdate ${v && v !== today() ? "hidden" : ""}>Not today? Change the date</button><div ${v && v !== today() ? "" : "hidden"} data-date><label for="${id}" class="lbl">Date</label><input class="inp" id="${id}" type="date" value="${v || today()}" style="margin-top:6px"></div></div>`;
function wireDate(el) { const b = el.querySelector("[data-showdate]"); if (b) b.onclick = () => { b.hidden = true; el.querySelector("[data-date]").hidden = false; }; }

/* ---------- home ---------- */
function ringSVG(p, soft) {
  const R = 74, C = 2 * Math.PI * R, f = Math.min(1, p / CONFIG.hardPity), sm = CONFIG.softPity / CONFIG.hardPity;
  const tick = a => { const x = 86 + Math.cos(a * 2 * Math.PI) * R, y = 86 + Math.sin(a * 2 * Math.PI) * R; return `<circle cx="${x}" cy="${y}" r="3" fill="${soft ? "#ffd99a" : "rgba(255,255,255,.55)"}"/>`; };
  return `<svg viewBox="0 0 172 172"><circle cx="86" cy="86" r="${R}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="7"/>
    <circle cx="86" cy="86" r="${R}" fill="none" stroke="url(#rg)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C * f} ${C}"/>
    <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e2b5"/><stop offset="1" stop-color="#f2a7c3"/></linearGradient></defs>${tick(sm)}</svg>`;
}
function viewHome() {
  const B = balances(), lim = poolState("limited"), rr = poolState("rerun"), T = totals(), m = thisMonth(), sm = spentIn(m), bud = num(S.settings.budget);
  const img = S.images.header || ASSET.header, cur = bannersBy("current");
  return `<section class="hero ${img ? "photo" : ""}" style="${img ? `background-image:url('${img}')` : ""}">
    <div class="ringwrap">
      <button class="ring" data-pity="limited" aria-label="Limited pity ${lim.pity} of ${CONFIG.hardPity}. Tap to correct.">${ringSVG(lim.pity, lim.pity >= CONFIG.softPity)}
        <span class="in"><span class="num">${fmtWB(B.ds)}</span><span class="lab">wishes</span></span></button>
      <div class="herofacts">
        <div class="fact"><b>${lim.pity} <span style="font-size:14px;opacity:.7">pulled, ${CONFIG.hardPity - lim.pity} to go</span></b>limited pity, ${lim.guar ? "next 5★ guaranteed" : "next 5★ is 50/50"}</div>
        <div class="fact"><b>${rr.pity} <span style="font-size:14px;opacity:.7">pulled, ${CONFIG.hardPity - rr.pity} to go</span></b>rerun pity${rr.guar ? ", guaranteed" : ""}</div>
        ${S.profile.trackStandard ? `<div class="fact"><b>${fmtWB(B.emp)}</b>Empyrean Wishes</div>` : `<div class="fact"><b class="g">${fmtM(sm)}</b>spent this month</div>`}
      </div></div>
    <div class="heroacts">
      <button class="main" data-act="pull">${icon("pull")}Log wishes</button>
      <button data-go="shop">${icon("bag")}Buy</button>
      <button data-act="gain">${icon("gift")}Free wishes</button>
      <button data-act="match">${icon("eq")}Match game</button>
    </div></section>
  <h2 class="sec">In the wish pool now<span class="sp"></span><button class="act" data-go="banners">All pools</button></h2>
  ${cur.length ? `<div class="panel"><ul class="rows">${cur.map(bannerRow).join("")}</ul></div>` : `<div class="panel pad muted">No wish pool is running right now.</div>`}
  <h2 class="sec">This month</h2>
  <div class="tiles">
    <div class="tile"><div class="k">Spent in ${MONTHS[+m.slice(5) - 1]}</div><div class="v">${fmtM(sm)}</div>${bud ? `<div class="bar" style="margin-top:8px"><i class="${sm > bud ? "over" : ""}" style="width:${Math.min(100, sm / bud * 100)}%"></i></div><div class="h" style="margin-top:4px">${sm > bud ? `${fmtM(sm - bud)} over budget` : `${fmtM(bud - sm)} left of ${fmtM(bud)}`}</div>` : `<button class="linkbtn small" data-act="budget">Set a monthly budget</button>`}</div>
    <div class="tile"><div class="k">Spent in total</div><div class="v">${fmtM(T.spent)}</div><div class="h">${T.est ? `includes ${fmtM(T.est)} estimated` : "since you started tracking"}</div></div>
  </div>
  <h2 class="sec">Recent<span class="sp"></span><button class="act" data-go="history">History</button></h2>
  <div class="panel">${S.entries.length ? `<ul class="rows">${ordered().reverse().slice(0, 6).map(feedItem).join("")}</ul>` : `<div class="empty">Nothing logged yet. Start with “Log wishes” after your next pulls.</div>`}</div>`;
}
function bannerRow(b) {
  const st = bannerStats(b), pl = planFor(b), feat = memsOfPool(b.name);
  const sub = [bannerKind(b), b.approx ? "dates to confirm" : fmtRange(b.start, b.end)].filter(Boolean).join(", ");
  return `<li data-banner="${b.id}">${avatars(b.lis)}<div class="main"><div class="t">${esc(b.name)}</div><div class="s">${esc(sub)}${b.expected ? ` <span class="badge">Expected</span>` : ""}</div></div>
    <div class="r">${st.pulls || pl.pulls ? `<div><b>${st.pulls}</b>${pl.pulls ? `<span class="muted small"> of ${pl.pulls}</span>` : ""}</div><div class="m">wishes used</div>` : feat.length ? `<div class="m">${feat.filter(m => S.owned[m.id]?.have).length} of ${feat.length} owned</div>` : ""}</div></li>`;
}
function feedItem(e) {
  const d = delta(e), w = d.ds || d.emp, blue = !d.ds && d.emp;
  let title = e.label || "", sub = [];
  if (e.kind === "pull") {
    title = e.bannerName || "Wishes";
    (e.results || []).forEach(r => sub.push(`5★ ${liOf(r.li)?.n || ""}${r.card ? " " + r.card : ""} at pity ${r.pity}${r.outcome === "lost" ? (r.src === "std" ? ", standard card" : ", not your pick") : r.outcome === "std" ? "" : ", limited"}`));
    if (extraOf(e)) sub.push(`${extraOf(e)} extra`);
  } else if (e.kind === "gain") sub.push(e.source || "");
  else if (e.kind === "purchase") sub.push(e.estimate ? "Estimate" : e.bannerName || e.group || "");
  sub.push(fmtDate(e.date, true));
  const mk = {purchase: "bag", pull: "pull", gain: "gift", adjust: "eq"}[e.kind];
  return `<li data-edit="${e.id}"><div class="mark ${e.kind}">${icon(mk)}</div><div class="main"><div class="t">${esc(title)}</div><div class="s">${sub.filter(Boolean).map(esc).join(", ")}</div></div>
    <div class="r">${e.kind === "gain" && e.diamonds ? `<div class="plus" style="font-weight:700">+${num(e.diamonds).toLocaleString()} Diamonds</div>` : w ? `<div class="${w > 0 ? "plus" : "minus"} ${blue ? "blue" : ""}" style="font-weight:700">${w > 0 ? "+" : "−"}${fmtW(Math.abs(w))}</div>` : ""}${e.kind === "purchase" ? `<div class="m">${fmtM(e.amount)}</div>` : ""}</div></li>`;
}

/* ---------- wish pools tab ---------- */
function projection() {
  const m0 = thisMonth(), inc = monthlyIncome();
  const live = allBanners().filter(b => bannerStatus(b) !== "past");
  const monthOf = b => bannerStatus(b) === "current" ? m0 : (b.start || today()).slice(0, 7);
  const months = [...live.filter(b => planFor(b).pulls).map(monthOf), ...S.plans.map(p => p.month)].filter(m => m >= m0).sort();
  const last = months.length ? months[months.length - 1] : m0;
  const rows = []; let bal = balances().ds;
  const dim = new Date(+m0.slice(0, 4), +m0.slice(5), 0).getDate(), left = (dim - new Date().getDate()) / dim;
  const gained = S.entries.filter(e => e.kind === "gain" && !e.auto && e.date.startsWith(m0)).reduce((s, e) => s + num(e.wishes), 0);
  for (let m = m0; m <= last && rows.length < 24; m = addMonth(m, 1)) {
    const income = m === m0 ? inc.auto * left + Math.max(0, inc.extra - gained) : inc.auto + inc.extra;
    const pl = plannedIn(m), bn = live.filter(b => monthOf(b) === m && planFor(b).pulls);
    const packs = pl.reduce((s, p) => s + num(p.wishes), 0), free = bn.reduce((s, b) => s + num(planFor(b).free), 0);
    const need = bn.reduce((s, b) => s + Math.max(0, planFor(b).pulls - bannerStats(b).pulls), 0);
    const end = r2(bal + income + packs + free - need);
    rows.push({m, start: r2(bal), inc: r2(income), packs, free, need, end, cost: r2(pl.reduce((s, p) => s + num(p.price), 0)), banners: bn}); bal = end;
  }
  return {rows, inc};
}
function viewBanners() {
  const P = projection(), past = bannersBy("past").reverse(), years = [...new Set(past.map(yearOf))];
  return `<h2 class="sec" style="margin-top:6px">Now<span class="sp"></span><button class="act" data-act="newbanner">Add a pool</button></h2>
  <div class="panel"><ul class="rows">${bannersBy("current").map(bannerRow).join("") || `<li class="muted">Nothing running right now.</li>`}</ul></div>
  <h2 class="sec">Coming up</h2>
  <div class="panel"><ul class="rows">${bannersBy("upcoming").map(bannerRow).join("") || `<li class="muted">No pools announced yet.</li>`}</ul></div>
  <p class="small muted" style="margin:8px 2px 0">“Expected” pools are guesses from past years. Wish pools are updated in ${CONFIG.appName} as they're announced.</p>
  <h2 class="sec">Will I have enough?<span class="sp"></span><button class="act" data-act="income">Income settings</button></h2>
  <div class="panel pad">
    ${P.rows.some(r => r.need) ? `<div class="tablewrap"><table class="t"><thead><tr><th>Month</th><th>Start</th><th>Free</th><th>Packs</th><th>Event</th><th>Planned</th><th>Left</th></tr></thead><tbody>
    ${P.rows.map(r => `<tr><td>${fmtMonth(r.m)}${r.banners.length ? `<div class="small muted">${r.banners.map(b => esc(b.name)).join(", ")}</div>` : ""}</td><td>${fmtWB(r.start)}</td><td class="plus">+${fmtWB(r.inc)}</td><td>${r.packs ? "+" + fmtW(r.packs) : ""}</td><td>${r.free ? "+" + fmtW(r.free) : ""}</td><td>${r.need ? "−" + fmtW(r.need) : ""}</td><td class="${r.end < 0 ? "minus" : "plus"}" style="font-weight:700">${fmtWB(r.end)}</td></tr>`).join("")}
    </tbody></table></div>` : `<div class="muted">Open a wish pool and set how many wishes you plan to use. This table then shows whether your wishes will last.</div>`}
    <div class="small muted" style="margin-top:8px">Free income is about ${plural(P.inc.auto + P.inc.extra, "wish")} a month from logging in${P.inc.extra ? " and events" : ""}. Rough guide for average luck: Myth 150, Solo 96, Multi 104 wishes.</div></div>
  <h2 class="sec">Past pools</h2>
  <div class="panel">${years.map((y, i) => `<details ${i === 0 ? "open" : ""}><summary>${y} <span class="muted small">(${past.filter(b => yearOf(b) === y).length})</span></summary><ul class="rows">${past.filter(b => yearOf(b) === y).map(bannerRow).join("")}</ul></details>`).join("")}</div>`;
}
function bannerDetail(b) {
  const st = bannerStats(b), pl = planFor(b), pool = poolFor(b.type, b.rerun), feat = memsOfPool(b.name), stat = bannerStatus(b);
  modal(`<div style="display:flex;gap:12px;align-items:center;margin-bottom:4px">${avatars(b.lis)}<div><h3>${esc(b.name)}</h3><div class="small muted">${esc(bannerKind(b))}, ${esc(fmtRange(b.start, b.end) || "dates not set")}</div></div></div>
    ${b.note ? `<div class="note" style="margin:10px 0">${esc(b.note)}</div>` : ""}
    ${feat.length ? `<div class="lbl" style="margin:12px 0 8px">5★ Memories</div><div class="mgrid">${feat.map(memRow).join("")}</div>` : ""}
    ${stat !== "past" ? `<div class="lbl" style="margin:14px 0 8px">Your plan</div><div class="fields2"><div class="field"><label for="b_p">Wishes I plan to use</label><input id="b_p" type="number" inputmode="numeric" value="${pl.pulls || ""}" placeholder="e.g. 150"></div>
      <div class="field"><label for="b_f">Free wishes from the event</label><input id="b_f" type="number" inputmode="numeric" value="${pl.free || ""}" placeholder="e.g. 20"></div></div>` : ""}
    ${st.pulls || st.spent ? `<div class="summary"><div class="row"><span>Wishes used</span><b>${st.pulls}</b></div>${st.extra ? `<div class="row"><span>Of those, extra (outfits, ranks)</span><span>${st.extra}</span></div>` : ""}
      <div class="row"><span>Packs bought for it</span><b>${fmtM(st.spent)}</b></div>${st.results.map(r => `<div class="row"><span>5★ ${esc(r.card || "")} at pity ${r.pity}</span><span class="badge ${r.outcome === "lost" ? "b" : "g"}">${{win: "Won", lost: "Lost 50/50", guar: "Guaranteed", std: "5★"}[r.outcome] || ""}</span></div>`).join("")}</div>` : ""}
    <div class="small muted" style="margin-bottom:8px">Uses ${POOLS[pool].n.toLowerCase()} pity.</div>
    <div class="acts"><button class="btn primary" data-pull>Log wishes</button><button class="btn" data-buy>Buy packs</button></div>
    <div class="acts">${b.custom ? `<button class="btn sm" data-edit>Edit pool</button>` : ""}<button class="btn sm" data-x>Done</button></div>`, el => {
    const savePlan = () => { const p = el.querySelector("#b_p"); if (!p) return; const v = {pulls: num(p.value), free: num(val(el, "#b_f"))}; if (v.pulls !== pl.pulls || v.free !== pl.free) act("", () => { S.bplans[b.id] = v; }, false); };
    wireMemToggles(el, () => bannerDetail(b));
    bind(el, "[data-x]", () => { savePlan(); closeModal(); });
    bind(el, "[data-edit]", () => { savePlan(); bannerForm(S.banners.find(x => x.id === b.id)); });
    bind(el, "[data-pull]", () => { savePlan(); pullForm(null, b.id); });
    bind(el, "[data-buy]", () => { savePlan(); closeModal(); tab = "shop"; shopView = "packs"; packGroup = b.rerun ? "Rerun pool packs" : ({myth: "Myth pool packs", multi: "Multi pool packs"}[b.type] || "Solo pool packs"); render(); scrollTo(0, 0); });
  });
}
function bannerForm(b) {
  const isNew = !b; b = b || {name: "", type: "solo", rerun: false, lis: S.profile.lis.length === 1 ? [...S.profile.lis] : [], start: today(), end: "", pulls: "", free: ""};
  let lis = [...(b.lis || [])];
  modal(`<h3>${isNew ? "Add a wish pool" : "Edit wish pool"}</h3><div class="desc">For a pool that isn't in the list yet.</div>
    <div class="field"><label for="f_name">Name</label><input id="f_name" value="${esc(b.name)}"></div>
    <div class="fields2"><div class="field"><label for="f_t">Type</label><select id="f_t">${BANNER_TYPES.map(t => `<option value="${t.k}" ${b.type === t.k ? "selected" : ""}>${t.n}</option>`).join("")}</select></div>
    <div class="field"><label for="f_rr">New or rerun</label><select id="f_rr"><option value="0">New</option><option value="1" ${b.rerun ? "selected" : ""}>Rerun</option></select></div></div>
    <div class="lbl" style="margin-bottom:8px">Love interests</div><div class="chips" id="lis" style="margin-bottom:14px"></div>
    <div class="fields2"><div class="field"><label for="f_s">Starts</label><input id="f_s" type="date" value="${b.start || ""}"></div><div class="field"><label for="f_e">Ends</label><input id="f_e" type="date" value="${b.end || ""}"></div></div>
    <div class="acts">${isNew ? `<button class="btn" data-x>Cancel</button>` : `<button class="btn danger" data-del>Delete</button>`}<button class="btn primary" data-ok>Save</button></div>`, el => {
    const draw = () => { el.querySelector("#lis").innerHTML = LIS.map(l => `<button type="button" class="chip ${lis.includes(l.k) ? "on" : ""}" data-l="${l.k}">${l.n}</button>`).join("");
      el.querySelectorAll("[data-l]").forEach(c => c.onclick = () => { const k = c.dataset.l; lis = lis.includes(k) ? lis.filter(x => x !== k) : [...lis, k]; draw(); }); };
    draw();
    bind(el, "[data-x]", closeModal);
    bind(el, "[data-del]", () => confirmBox("Delete this wish pool?", "Wishes and purchases you logged for it stay in your history.", "Delete", () => act("Wish pool deleted", () => { S.banners = S.banners.filter(x => x.id !== b.id); })));
    bind(el, "[data-ok]", () => {
      const v = {name: val(el, "#f_name").trim(), type: val(el, "#f_t"), rerun: val(el, "#f_rr") === "1", lis, start: val(el, "#f_s"), end: val(el, "#f_e")};
      if (!v.name) return toast("Give the wish pool a name");
      closeModal(); act("Wish pool saved", () => { if (isNew) S.banners.push({id: "u-" + uid(), ...v}); else Object.assign(S.banners.find(x => x.id === b.id), v); });
    });
  });
}

/* ---------- log wishes ---------- */
function pullForm(e, presetBanner) {
  const edit = !!e;
  let kind = e ? (e.pool === "standard" ? "standard" : e.rerun ? "rerun" : "limited") : (presetBanner ? (bannerById(presetBanner)?.rerun ? "rerun" : "limited") : "limited");
  let bId = e ? (e.bannerId || "") : (presetBanner || ""), bType = e ? e.bannerType : "";
  let events = e ? [...(e.results || []).map(r => ({t: "5", at: r.at ?? "", li: r.li || "", src: r.src || (r.outcome === "std" || (r.outcome === "lost" && !r.memId) ? "std" : "lim"), precise: r.precise ?? (r.outcome !== "lost"), memId: r.memId || ""})),
    ...(e.milestones || []).map(m => ({...m, t: "m"}))].sort((a, b) => num(a.at) - num(b.at)) : [];
  const listFor = k => k === "standard" ? [] : allBanners().filter(b => (k === "rerun" ? b.rerun : !b.rerun) && bannerStatus(b) !== "upcoming" && !b.expected)
    .sort((a, b) => (bannerStatus(b) === "current") - (bannerStatus(a) === "current") || (b.start || "").localeCompare(a.start || ""));
  const ctx = el => {
    if (kind === "standard") return {type: "standard", rerun: false, name: "Xspace Echo", id: ""};
    const b = bId && bannerById(bId), t = el.querySelector("#f_t") ? val(el, "#f_t") : (b ? b.type : "solo");
    if (b) return {type: t, rerun: !!b.rerun, name: b.name, id: b.id};
    return {type: t, rerun: kind === "rerun", name: val(el, "#f_bn").trim() || typeName(t) + " pool", id: ""};
  };
  const isMulti = t => t === "multi" || t === "special";
  const draw = () => {
    const list = listFor(kind);
    if (kind !== "standard" && bId && !list.some(b => b.id === bId)) bId = "";
    if (kind !== "standard" && !bId && list.length && !e) bId = list[0].id;
    const cur = bId && bannerById(bId); if (cur && !bType) bType = cur.type;
    modal(`<h3>${edit ? "Edit wishes" : "Log wishes"}</h3>
      <div class="seg full" style="margin:6px 0 14px">${[["limited", "Limited"], ["rerun", "Rerun"], ["standard", "Standard"]].map(([k, n]) => `<button type="button" data-kind="${k}" class="${kind === k ? "on" : ""}">${n}</button>`).join("")}</div>
      ${kind !== "standard" ? `<div class="field"><label for="f_b">Banner</label><select id="f_b">${list.map(b => `<option value="${b.id}" ${b.id === bId ? "selected" : ""}>${esc(b.name)}${bannerStatus(b) === "current" ? " (current)" : ""}</option>`).join("")}<option value="" ${!bId ? "selected" : ""}>Another banner…</option></select></div>
      <div class="field" id="otherName" ${bId ? "hidden" : ""}><label for="f_bn">Banner name</label><input id="f_bn" value="${esc(e && !e.bannerId ? e.bannerName : "")}"></div>
      <div class="field"><label for="f_t">Type</label><select id="f_t">${BANNER_TYPES.map(t => `<option value="${t.k}" ${(bType || "solo") === t.k ? "selected" : ""}>${t.n}</option>`).join("")}</select></div>`
      : `<p class="small muted" style="margin-top:0">Xspace Echo, the standard pool. Uses Empyrean Wishes and its own pity.</p>`}
      <div class="field"><label for="f_p">How many wishes did you use?</label><input id="f_p" type="number" inputmode="numeric" min="1" value="${e ? e.pulls : ""}" placeholder="e.g. 80"></div>
      <div class="chips" style="margin:-6px 0 16px">${[1, 10, 20, 50].map(n => `<button type="button" class="chip" data-q="${n}">+${n}</button>`).join("")}</div>
      <div class="lbl" style="margin-bottom:8px">What did you get?</div><div id="ev"></div>
      <div class="chips" style="margin-bottom:14px"><button type="button" class="chip" data-add5>+ 5★</button><button type="button" class="chip" data-addm>+ Outfit or reward</button></div>
      <div class="summary" id="sum"></div>
      ${dateField(e ? e.date : today())}
      <div class="field"><label for="f_n">Note</label><input id="f_n" value="${esc(e?.note || "")}" placeholder="Optional"></div>
      <div class="acts">${edit ? `<button class="btn danger" data-del>Delete</button>` : `<button class="btn" data-x>Cancel</button>`}<button class="btn primary" data-ok>Save</button></div>`, el => mount(el), true);
  };
  const outcomeOf = (x, c, guar) => {
    if (c.type === "standard") return "std";
    if (x.src === "std") return "lost";
    if (isMulti(c.type) && !x.precise) return "lost";
    return guar ? "guar" : "win";
  };
  const compute = el => {
    const c = ctx(el), pool = poolFor(c.type, c.rerun), b = {pool, ...poolState(pool, edit ? e.id : null)}, n = num(val(el, "#f_p"));
    const five = events.filter(x => x.t === "5").sort((a, z) => num(a.at) - num(z.at));
    let prev = 0, guar = b.guar, warn = "";
    const results = five.map((x, i) => {
      const at = num(x.at);
      if (at < 1 || (n && at > n)) warn = `Each 5★ needs a wish number from 1 to ${n || "your total"}.`;
      else if (i && at <= prev) warn = "Two 5★ can't be on the same wish.";
      const pity = i === 0 ? b.pity + at : at - prev; prev = at;
      const outcome = outcomeOf(x, c, guar); if (outcome === "lost") guar = true; else if (outcome !== "std") guar = false;
      const pair = c.type !== "standard" && x.src === "lim" ? memsOfPool(c.name).filter(m => m.li === x.li) : [];
      const memId = x.memId && pair.some(m => m.id === x.memId) ? x.memId : (pair[0] ? pair[0].id : "");
      return {li: x.li, src: x.src, precise: x.precise, memId, card: memId ? MEM[memId].name : "", at, pity, outcome};
    });
    const r = sessionMath(b.pity, b.guar, n, results);
    const got = results.filter(x => x.outcome === "win" || x.outcome === "guar");
    const already = c.id && S.entries.some(x => x.kind === "pull" && x.bannerId === c.id && x.id !== e?.id && (x.ts || 0) < (e?.ts || Date.now()) && (x.results || []).some(q => q.outcome === "win" || q.outcome === "guar"));
    const extra = already ? n : got.length ? n - got[got.length - 1].at : 0;
    return {c, b, n, results, r, extra: Math.max(0, extra), warn: warn || r.warn};
  };
  const drawEvents = el => {
    const c = ctx(el), std = c.type === "standard";
    el.querySelector("#ev").innerHTML = events.map((x, i) => {
      if (x.t === "m") return `<div class="event" data-i="${i}"><div class="head">Reward<span class="sp"></span><button type="button" class="x" data-rm="${i}">Remove</button></div>
        <div class="inline"><select class="inp" data-k="what" style="width:auto;flex:1">${["Outfit", "Pose", "Memory crate", "Other reward"].map(w => `<option ${x.what === w ? "selected" : ""}>${w}</option>`).join("")}</select><label for="at${i}">on wish</label><input class="inp" id="at${i}" data-k="at" type="number" inputmode="numeric" value="${x.at ?? ""}"></div></div>`;
      const pair = !std && x.src === "lim" ? memsOfPool(c.name).filter(m => m.li === x.li) : [];
      return `<div class="event" data-i="${i}"><div class="head">5★<span class="sp"></span><button type="button" class="x" data-rm="${i}">Remove</button></div>
        <div class="inline" style="margin-bottom:10px"><label for="at${i}">On wish no.</label><input class="inp" id="at${i}" data-k="at" type="number" inputmode="numeric" value="${x.at ?? ""}"></div>
        <div class="fields2"><select class="inp" data-k="li" aria-label="Love interest">${liOptions(x.li)}</select>
        ${std ? `<span></span>` : `<select class="inp" data-k="src" aria-label="Card type"><option value="lim" ${x.src === "lim" ? "selected" : ""}>Limited card</option><option value="std" ${x.src === "std" ? "selected" : ""}>Standard card</option></select>`}</div>
        ${!std && x.src === "lim" && isMulti(c.type) ? `<div class="seg full" style="margin-top:10px"><button type="button" data-prec="1" class="${x.precise ? "on" : ""}">My Precise Wish</button><button type="button" data-prec="0" class="${x.precise ? "" : "on"}">Not my pick</button></div>` : ""}
        ${pair.length > 1 ? `<select class="inp" data-k="memId" style="margin-top:10px" aria-label="Which card">${pair.map(m => `<option value="${m.id}" ${x.memId === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select>` : ""}</div>`;
    }).join("");
    el.querySelectorAll(".event [data-k]").forEach(inp => inp.oninput = inp.onchange = () => { const x = events[+inp.closest(".event").dataset.i]; x[inp.dataset.k] = inp.value; if (inp.dataset.k === "li" || inp.dataset.k === "src") { x.memId = ""; drawEvents(el); } sum(el); });
    el.querySelectorAll("[data-prec]").forEach(b => b.onclick = () => { events[+b.closest(".event").dataset.i].precise = b.dataset.prec === "1"; drawEvents(el); sum(el); });
    el.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { events.splice(+b.dataset.rm, 1); drawEvents(el); sum(el); });
  };
  const sum = el => {
    const k = compute(el), pool = POOLS[k.b.pool], bal = kind === "standard" && S.profile.trackStandard ? balances().emp : balances().ds;
    const got = k.results.filter(x => x.outcome === "win" || x.outcome === "guar");
    el.querySelector("#sum").innerHTML = `<div class="row"><span>${pool.n} pity</span><b>${k.b.pity} → ${k.r.pity} <span class="muted small">(${CONFIG.hardPity - k.r.pity} to go)</span></b></div>
      ${pool.guar ? `<div class="row"><span>Next 5★</span><b>${k.r.guar ? "Guaranteed" : "50/50"}</b></div>` : ""}
      ${got.length ? `<div class="row"><span>Got your card</span><b>at pity ${got[0].pity}</b></div>` : ""}
      ${k.extra ? `<div class="row"><span>Extra wishes after that</span><b>${k.extra}</b></div>` : ""}
      <div class="row"><span>Wishes left</span><b>${fmtWB(bal + (edit ? e.pulls : 0) - k.n)}</b></div>
      ${k.warn ? `<div class="warn" style="margin-top:8px">${esc(k.warn)}</div>` : ""}`;
  };
  const mount = el => {
    wireDate(el);
    el.querySelectorAll("[data-kind]").forEach(b => b.onclick = () => { kind = b.dataset.kind; bId = ""; bType = ""; events = events.filter(x => x.t === "m"); draw(); });
    const sel = el.querySelector("#f_b");
    if (sel) sel.onchange = () => { bId = sel.value; const b = bId && bannerById(bId); bType = b ? b.type : val(el, "#f_t"); draw(); };
    ["#f_p", "#f_t", "#f_bn", "#f_d"].forEach(s => { const i = el.querySelector(s); if (i) i.oninput = i.onchange = () => { if (s === "#f_t") { bType = i.value; drawEvents(el); } sum(el); }; });
    el.querySelectorAll("[data-q]").forEach(c => c.onclick = () => { const p = el.querySelector("#f_p"); p.value = num(p.value) + num(c.dataset.q); sum(el); });
    bind(el, "[data-add5]", () => {
      const c = ctx(el), b = bId && bannerById(bId), k = compute(el), lastAt = Math.max(0, ...events.filter(x => x.t === "5").map(x => num(x.at)));
      const li = (b && b.lis && b.lis.length === 1) ? b.lis[0] : (S.profile.lis[0] || "xavier"), n = num(val(el, "#f_p"));
      const guess = n ? Math.min(n, lastAt ? Math.min(n, lastAt + CONFIG.hardPity) : Math.max(1, Math.min(n, CONFIG.hardPity - k.b.pity))) : "";
      events.push({t: "5", at: guess, li, src: c.type === "standard" ? "std" : "lim", precise: true, memId: ""}); drawEvents(el); sum(el);
    });
    bind(el, "[data-addm]", () => { events.push({t: "m", what: "Outfit", at: num(val(el, "#f_p")) || ""}); drawEvents(el); sum(el); });
    drawEvents(el); sum(el);
    bind(el, "[data-x]", closeModal);
    bind(el, "[data-del]", () => { closeModal(); act("Deleted", () => { S.entries = S.entries.filter(x => x.id !== e.id); }); });
    bind(el, "[data-ok]", () => {
      const k = compute(el);
      if (!(k.n > 0)) return toast("Enter how many wishes you used");
      if (k.warn) return toast("Check the wish numbers first");
      const entry = {kind: "pull", date: val(el, "#f_d") || today(), bannerId: k.c.id, bannerName: k.c.name, bannerType: k.c.type, rerun: k.c.rerun, pool: k.b.pool,
        pulls: k.n, results: k.results, milestones: events.filter(x => x.t === "m").map(x => ({what: x.what, at: num(x.at)})), extra: k.extra,
        cur: k.c.type === "standard" && S.profile.trackStandard ? "emp" : "ds", note: val(el, "#f_n").trim()};
      closeModal();
      act(edit ? "Saved" : `Logged ${k.n} wishes${k.results.length ? `, ${k.results.length} × 5★` : ""}`, () => {
        if (edit) Object.assign(S.entries.find(x => x.id === e.id), entry); else S.entries.push({id: uid(), ts: Date.now(), ...entry});
        if (!edit) k.results.forEach(r => { if (r.memId) { const o = S.owned[r.memId] || {}; S.owned[r.memId] = {...o, have: true, rank: o.have ? Math.min(3, num(o.rank) + 1) : 0, want: false}; } });
      });
    });
  };
  draw();
}

/* ---------- free wishes, match game ---------- */
function gainForm(e) {
  const edit = !!e;
  modal(`<h3>${edit ? "Edit free wishes" : "Free wishes"}</h3><div class="desc">Wishes or Diamonds you got without paying.</div>
    <div class="field"><label for="f_s">From</label><select id="f_s">${FREE_SOURCES.concat(edit && !FREE_SOURCES.includes(e.source) ? [e.source] : []).map(s => `<option ${e?.source === s ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></div>
    <div class="fields2"><div class="field"><label for="f_dm">Diamonds</label><input id="f_dm" type="number" inputmode="numeric" placeholder="e.g. 300"></div>
    <div class="field"><label for="f_w">or Deepspace Wishes</label><input id="f_w" type="number" inputmode="decimal" step="any" value="${e ? (e.wishes || "") : ""}"></div></div>
    ${S.profile.trackStandard ? `<div class="field"><label for="f_emp">Empyrean Wishes</label><input id="f_emp" type="number" inputmode="numeric" value="${e?.emp || ""}"></div>` : ""}
    ${dateField(e ? e.date : today())}
    <div class="field"><label for="f_n">Note</label><input id="f_n" value="${esc(e?.note || "")}" placeholder="Optional"></div>
    <div class="acts">${edit ? `<button class="btn danger" data-del>Delete</button>` : `<button class="btn" data-x>Cancel</button>`}<button class="btn primary" data-ok>Add</button></div>`, el => {
    wireDate(el);
    const w = el.querySelector("#f_w"), dm = el.querySelector("#f_dm");
    dm.oninput = () => { w.value = dm.value ? D2W(dm.value) : ""; };
    bind(el, "[data-x]", closeModal);
    bind(el, "[data-del]", () => { closeModal(); act("Deleted", () => { S.entries = S.entries.filter(x => x.id !== e.id); }); });
    bind(el, "[data-ok]", () => {
      const v = r2(w.value), emp = el.querySelector("#f_emp") ? r2(val(el, "#f_emp")) : 0;
      if (!(v > 0) && !(emp > 0)) return toast("Enter Diamonds or wishes");
      const src = val(el, "#f_s"), en = {kind: "gain", date: val(el, "#f_d") || today(), source: src, label: src, wishes: v, emp, note: val(el, "#f_n").trim()};
      closeModal(); act(edit ? "Saved" : `Added ${plural(v || emp, "wish")}`, () => { if (edit) Object.assign(S.entries.find(x => x.id === e.id), en); else S.entries.push({id: uid(), ts: Date.now(), ...en}); });
    });
  });
}
function matchForm() {
  const B = balances();
  modal(`<h3>Match the game</h3><div class="desc">Type what the game shows now. ${CONFIG.appName} fixes the difference.</div>
    <div class="fields2"><div class="field"><label for="f_dm">Diamonds</label><input id="f_dm" type="number" inputmode="numeric"></div><div class="field"><label for="f_tk">Deepspace Wishes</label><input id="f_tk" type="number" inputmode="numeric"></div></div>
    <div class="field"><label for="f_w">Total in wishes</label><input id="f_w" type="number" inputmode="decimal" step="any" value="${Math.floor(B.ds)}"></div>
    ${S.profile.trackStandard ? `<div class="field"><label for="f_emp">Empyrean Wishes</label><input id="f_emp" type="number" inputmode="numeric" value="${B.emp}"></div>` : ""}
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    const w = el.querySelector("#f_w"), calc = () => { if (val(el, "#f_dm") || val(el, "#f_tk")) w.value = r2(D2W(num(val(el, "#f_dm"))) + num(val(el, "#f_tk"))); };
    el.querySelector("#f_dm").oninput = calc; el.querySelector("#f_tk").oninput = calc;
    bind(el, "[data-x]", closeModal);
    bind(el, "[data-ok]", () => {
      const d = r2(num(w.value) - B.ds), de = el.querySelector("#f_emp") ? r2(num(val(el, "#f_emp")) - B.emp) : 0;
      closeModal(); if (!d && !de) return toast("Already matches");
      act("Matched to the game", () => S.entries.push({id: uid(), ts: Date.now(), kind: "adjust", date: today(), label: "Matched to game", wishes: d, emp: de, note: val(el, "#f_dm") ? `${num(val(el, "#f_dm")).toLocaleString()} Diamonds, ${num(val(el, "#f_tk"))} wishes` : ""}));
    });
  });
}
function pityForm(pool) {
  const pools = ["limited", "rerun", "special"].concat(S.profile.trackStandard ? ["standard"] : []);
  let left = !!S.settings.pityLeft;
  const draw = () => modal(`<h3>Correct pity</h3><div class="desc">Copy what the game shows. A 5★ is certain by wish ${CONFIG.hardPity}.</div>
    <div class="seg full" style="margin-bottom:14px"><button type="button" data-m="0" class="${left ? "" : "on"}">Wishes since last 5★</button><button type="button" data-m="1" class="${left ? "on" : ""}">Wishes left</button></div>
    ${pools.map(p => { const st = poolState(p); return `<div class="event"><div class="head">${POOLS[p].n}<span class="sp"></span><span class="small muted" style="font-weight:500">${POOLS[p].sub}</span></div>
      <div class="fields2"><div class="field" style="margin:0"><label for="p_${p}">${left ? "Wishes left" : "Wishes since last 5★"}</label><input id="p_${p}" data-p="${p}" type="number" inputmode="numeric" min="0" max="${CONFIG.hardPity}" value="${left ? CONFIG.hardPity - st.pity : st.pity}"></div>
      ${POOLS[p].guar ? `<div class="field" style="margin:0"><label for="g_${p}">Next 5★</label><select id="g_${p}" data-g="${p}"><option value="0">50/50</option><option value="1" ${st.guar ? "selected" : ""}>Guaranteed</option></select></div>` : "<div></div>"}</div>
      <div class="small muted" style="margin-top:6px" data-echo="${p}"></div></div>`; }).join("")}
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    const echo = () => pools.forEach(p => { const v = Math.min(CONFIG.hardPity, num(el.querySelector(`[data-p="${p}"]`).value)); el.querySelector(`[data-echo="${p}"]`).textContent = left ? `That's ${CONFIG.hardPity - v} since your last 5★.` : `That's ${CONFIG.hardPity - v} left until a sure 5★.`; });
    el.querySelectorAll("[data-p]").forEach(i => i.oninput = echo); echo();
    el.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { left = b.dataset.m === "1"; S.settings.pityLeft = left; save(); draw(); });
    bind(el, "[data-x]", closeModal);
    bind(el, "[data-ok]", () => { closeModal(); act("Pity saved", () => pools.forEach(p => { const st = poolState(p), v = Math.min(CONFIG.hardPity, num(el.querySelector(`[data-p="${p}"]`).value)), np = left ? CONFIG.hardPity - v : v, g = el.querySelector(`[data-g="${p}"]`), ng = g ? g.value === "1" : false; if (np !== st.pity || ng !== st.guar) S.pools[p] = {pity: np, guar: ng, ts: Date.now()}; })); });
  }, !!$("#scrim"));
  draw();
}

/* ---------- shop ---------- */
function viewShop() {
  return `<div class="toolbar" style="margin-top:4px"><div class="seg">${[["passes", "Passes"], ["packs", "Packs"], ["budget", "Budget"], ["spend", "Spending"]].map(([k, l]) => `<button class="${shopView === k ? "on" : ""}" data-shop="${k}">${l}</button>`).join("")}</div></div>
  ${{passes: viewPasses, packs: viewPacks, budget: viewBudget, spend: viewSpending}[shopView]()}`;
}
function passStatus(p) {
  const t = today();
  if (p.pass === "aurum") return S.passes.aurum && S.passes.aurum >= t ? `<span class="badge g">${daysBetween(t, S.passes.aurum)} days left</span>` : "";
  if (p.yearly) return S.passes[p.pass] ? `<span class="badge g">Owned until ${fmtDate(YEARLY.end, true)}</span>` : (t > YEARLY.onSale[1] ? `<span class="badge">Sale ended for ${YEARLY.label}</span>` : "");
  if (p.promise) { const b = promiseBought(); return b && b.packId === p.id ? `<span class="badge g">Bought this season</span>` : ""; }
  return "";
}
function viewPasses() {
  const passes = S.packs.filter(p => p.group === "Passes");
  return `<div class="panel"><ul class="rows">${passes.map(p => `<li><div class="main"><div class="t">${esc(p.name)} ${passStatus(p)}</div><div class="s wrap">${esc(p.gives || "")}${p.check ? ". Check the price in game" : ""}</div></div>
    <div class="r"><div style="font-weight:700">${p.price != null ? fmtM(p.price) : "Set price"}</div><button class="btn sm" style="margin-top:4px" data-pack="${p.id}">${p.yearly && today() > YEARLY.onSale[1] ? "Record" : "Buy"}</button></div></li>`).join("")}</ul></div>
  <p class="small muted" style="margin:10px 2px">Wishes from passes are added each day through your login income, so they aren't counted twice. Purple Crystals aren't counted as wishes.</p>`;
}
function viewPacks() {
  const groups = [...new Set(S.packs.filter(p => p.group !== "Passes").map(p => p.group))];
  if (!groups.includes(packGroup)) packGroup = groups[0];
  return `<div class="chips" style="margin-bottom:12px">${groups.map(g => `<button class="chip ${g === packGroup ? "on" : ""}" data-pg="${esc(g)}">${esc(g.replace(" packs", ""))}</button>`).join("")}</div>
  <div class="panel"><ul class="rows">${S.packs.filter(p => p.group === packGroup).map(p => `<li><div class="main"><div class="t">${esc(p.name)}</div><div class="s">${plural(p.wishes, "wish")}${p.limit ? `, limit ${p.limit}` : ""}${p.price && p.wishes ? `, ${fmtM(p.price / p.wishes)} each` : ""}</div></div>
    <div class="r"><div style="font-weight:700">${p.price != null ? fmtM(p.price) : "Set price"}</div><button class="btn sm" style="margin-top:4px" data-pack="${p.id}">Buy</button></div></li>`).join("")}</ul></div>
  <div class="toolbar" style="margin-top:12px"><button class="btn sm" data-act="newpack">Add a pack that isn't listed</button></div>`;
}
function buyForm(p, presetBanner) {
  let q = 1;
  const isPool = /pool packs/.test(p.group), oneOnly = p.group === "Passes" || num(p.limit) === 1;
  const live = allBanners().filter(b => bannerStatus(b) !== "past" || (b.end && daysBetween(b.end, today()) < 30));
  const guess = presetBanner || (isPool ? (bannersBy("current").find(b => p.group.toLowerCase().startsWith(b.rerun ? "rerun" : typeName(b.type).toLowerCase())) || bannersBy("current")[0] || {}).id : "");
  const warnPromise = p.promise && promiseBought(), yearlyClosed = p.yearly && today() > YEARLY.onSale[1];
  modal(`<h3>${esc(p.name)}</h3><div class="desc">${esc(p.gives || `${plural(p.wishes, "Deepspace Wish")}${p.limit ? `, limit ${p.limit} per pool` : ""}`)}</div>
    ${warnPromise ? `<div class="note" style="margin-bottom:12px">You already logged a Promise pass this season. Only one can be bought per season, so use this to record a past season's purchase.</div>` : ""}
    ${yearlyClosed ? `<div class="note" style="margin-bottom:12px">Yearly passes are only sold at the start of the year. Use this to record one you bought.</div>` : ""}
    <div class="fields2">${oneOnly ? "" : `<div class="field"><label>How many</label><div class="stepper"><button type="button" data-m aria-label="Fewer">−</button><span class="q" id="qv">1</span><button type="button" data-p aria-label="More">+</button></div></div>`}
    <div class="field"><label for="f_pr">Price (${sym()})</label><input id="f_pr" type="number" inputmode="decimal" step="0.01" value="${p.price ?? ""}" placeholder="Price in game"></div></div>
    <div class="summary" id="sum"></div>
    ${dateField(today())}
    <button class="btn primary" style="width:100%" data-ok>Buy now</button>
    <button class="btn" style="width:100%;margin-top:8px" data-plan>Add to my budget plan instead</button>
    <p class="small muted" style="margin:8px 2px 0">A plan counts toward that month's budget without being recorded as spent. Mark it as bought later.</p>
    <div class="acts"><button class="btn sm ghost" data-editpack>Change this pack</button><span style="flex:1"></span><button class="btn sm" data-x>Cancel</button></div>`, el => {
    wireDate(el);
    const pr = () => r2(val(el, "#f_pr"));
    const upd = () => {
      if (el.querySelector("#qv")) el.querySelector("#qv").textContent = q;
      const b = num(S.settings.budget), sm = spentIn(thisMonth()), cost = r2(pr() * q), auto = S.settings.autoIncome;
      el.querySelector("#sum").innerHTML = `${p.wishes || p.emp ? `<div class="row"><span>Wishes now</span><b class="plus">+${fmtW(p.wishes * q)}${p.emp ? ` and ${p.emp * q} Empyrean` : ""}</b></div>` : ""}
        ${p.pass && p.total ? `<div class="row"><span>${auto ? "Added daily through login income" : "Wishes (all at once, since daily income is off)"}</span><span>${plural(p.total, "wish")}</span></div>` : ""}
        <div class="row"><span>Cost</span><b>${fmtM(cost)}</b></div>${b ? `<div class="row small"><span class="muted">Spent this month after this</span><b class="${sm + cost > b ? "minus" : "plus"}">${fmtM(sm + cost)} of ${fmtM(b)}</b></div>` : ""}`;
    };
    upd(); el.querySelector("#f_pr").oninput = upd;
    bind(el, "[data-m]", () => { q = Math.max(1, q - 1); upd(); });
    bind(el, "[data-p]", () => { q++; upd(); });
    bind(el, "[data-x]", closeModal);
    bind(el, "[data-editpack]", () => packForm(p));
    bind(el, "[data-plan]", () => planForm({name: (q > 1 ? q + " × " : "") + (isPool ? `${p.group.replace(" packs", "")} ${p.name}` : p.name), group: p.group, price: r2(pr() * q), wishes: r2((p.total || p.wishes) * q), month: thisMonth(), repeat: p.id === "aurum"}));
    bind(el, "[data-ok]", () => {
      if (val(el, "#f_pr") === "") return toast("Enter the price you paid");
      const bannerId = el.querySelector("#f_bn") ? val(el, "#f_bn") : "", date = val(el, "#f_d") || today();
      closeModal();
      act(`Bought ${p.name}`, () => {
        const pk = S.packs.find(x => x.id === p.id); if (pk && pk.price == null) pk.price = pr();
        const credit = p.pass && !S.settings.autoIncome ? num(p.total) : num(p.wishes);
        S.entries.push({id: uid(), ts: Date.now(), kind: "purchase", date, label: (q > 1 ? q + " × " : "") + (isPool ? `${p.group.replace(" packs", "")} ${p.name}` : p.name), packId: p.id, group: p.group,
          wishes: r2(credit * q), total: r2((p.total || p.wishes) * q), emp: r2(num(p.emp) * q), amount: r2(pr() * q), bannerId, bannerName: bannerById(bannerId)?.name || "", note: ""});
        if (p.pass) startPass(p.pass, date);
      });
    });
  });
}
function packForm(p) {
  const isNew = !p; p = p || {group: "Other packs", name: "", price: "", wishes: "", limit: ""};
  modal(`<h3>${isNew ? "Add a pack" : "Change pack"}</h3>
    <div class="field"><label for="f_name">Name</label><input id="f_name" value="${esc(p.name)}" ${p.custom || isNew ? "" : "disabled"}></div>
    <div class="fields2"><div class="field"><label for="f_price">Price (${sym()})</label><input id="f_price" type="number" inputmode="decimal" step="0.01" value="${p.price ?? ""}"></div>
    <div class="field"><label for="f_w">Deepspace Wishes</label><input id="f_w" type="number" inputmode="decimal" step="any" value="${p.wishes}" ${p.pass ? "disabled" : ""}></div></div>
    <div class="acts">${isNew || !p.custom ? `<button class="btn" data-x>Cancel</button>` : `<button class="btn danger" data-del>Delete</button>`}<button class="btn primary" data-ok>Save</button></div>`, el => {
    bind(el, "[data-x]", closeModal);
    bind(el, "[data-del]", () => { closeModal(); act("Pack deleted", () => { S.packs = S.packs.filter(x => x.id !== p.id); }); });
    bind(el, "[data-ok]", () => {
      const price = val(el, "#f_price") === "" ? null : r2(val(el, "#f_price")), name = val(el, "#f_name").trim();
      if (!name) return toast("Give the pack a name");
      closeModal(); act("Pack saved", () => { if (isNew) S.packs.push({id: "c-" + uid(), custom: true, group: "Other packs", name, price, wishes: r2(val(el, "#f_w"))}); else Object.assign(S.packs.find(x => x.id === p.id), {price, ...(p.custom ? {name} : {}), ...(p.pass ? {} : {wishes: r2(val(el, "#f_w"))})}); });
    });
  });
}
function chart(series, h) {
  const W = 600, H = h, pb = 22, pt = 14, b = num(S.settings.budget), max = Math.max(b, ...series.map(s => s.v + s.p), 1) * 1.12;
  const bw = W / series.length, y = v => H - pb - (v / max) * (H - pb - pt); let g = "";
  series.forEach((s, i) => {
    const x = i * bw + bw * .2, w = bw * .6, plan = s.m >= thisMonth() ? s.p : 0;
    if (s.v > 0) g += `<rect x="${x}" y="${y(s.v)}" width="${w}" height="${H - pb - y(s.v)}" rx="4" fill="${b && s.v > b ? "var(--bad)" : "var(--gold)"}"><title>${fmtMonth(s.m)}: ${fmtM(s.v)}</title></rect>`;
    if (plan > 0) g += `<rect x="${x}" y="${y(s.v + plan)}" width="${w}" height="${y(s.v) - y(s.v + plan)}" rx="4" fill="var(--rose)" opacity=".45"><title>Planned ${fmtM(plan)}</title></rect>`;
    if (s.v > 0) g += `<text x="${x + w / 2}" y="${y(s.v + plan) - 4}" text-anchor="middle">${Math.round(s.v)}</text>`;
    g += `<text x="${x + w / 2}" y="${H - 6}" text-anchor="middle" style="${s.m === thisMonth() ? "fill:var(--text);font-weight:700" : ""}">${MONTHS[+s.m.slice(5) - 1]}</text>`;
  });
  if (b) g += `<line x1="0" x2="${W}" y1="${y(b)}" y2="${y(b)}" stroke="var(--text)" stroke-dasharray="4 4" opacity=".45"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Spending per month">${g}</svg><div class="legend"><span style="--c:var(--gold)">Spent</span><span style="--c:var(--rose)">Planned</span>${b ? `<span style="--c:var(--text)">Budget</span>` : ""}</div>`;
}
const series = n => Array.from({length: n}, (_, i) => { const m = addMonth(thisMonth(), i - n + 1); return {m, v: spentIn(m), p: r2(plannedIn(m).reduce((s, p) => s + num(p.price), 0))}; });
function viewBudget() {
  const m = thisMonth(), b = num(S.settings.budget), sm = spentIn(m), plC = r2(plannedIn(m).reduce((s, p) => s + num(p.price), 0)), after = r2(sm + plC), pct = v => Math.min(100, b ? v / b * 100 : 0);
  const up = S.plans.slice().sort((a, z) => a.month.localeCompare(z.month));
  return `<div class="panel pad">
    <div class="row"><span class="muted">Budget for ${fmtMonth(m)}</span><button class="linkbtn" data-act="budget">${b ? fmtM(b) + ", change" : "Set a budget"}</button></div>
    ${b ? `<div class="bar" style="margin:12px 0 8px;height:10px"><i class="${sm > b ? "over" : ""}" style="width:${pct(sm)}%"></i>${plC ? `<i class="plan" style="left:${pct(sm)}%;width:${Math.max(0, pct(after) - pct(sm))}%"></i>` : ""}</div>
      <div class="row"><span>Spent</span><b>${fmtM(sm)}</b></div><div class="row"><span>Planned</span><b>${fmtM(plC)}</b></div>
      <div class="row"><span>${after > b ? "Over budget if you buy everything planned" : "Left after planned buys"}</span><b class="${after > b ? "minus" : "plus"}">${fmtM(Math.abs(b - after))}</b></div>` : `<p class="muted small" style="margin:8px 0 0">Set a budget to see what's left each month and whether your plans fit.</p>`}
  </div>
  <h2 class="sec">Planned buys<span class="sp"></span><button class="act" data-act="newplan">Add</button></h2>
  <div class="panel">${up.length ? `<ul class="rows">${up.map(p => `<li><div class="main"><div class="t">${esc(p.name)}</div><div class="s">${fmtMonth(p.month)}${p.repeat ? ", every month" : ""}${p.month < m ? ", overdue" : ""}</div></div><div class="r"><div style="font-weight:700">${fmtM(p.price)}</div>
    <div style="display:flex;gap:6px;margin-top:4px"><button class="btn sm" data-editplan="${p.id}">Edit</button><button class="btn sm primary" data-buyplan="${p.id}">Bought</button></div></div></li>`).join("")}</ul>` : `<div class="empty">Nothing planned. When buying a pack, choose “Add to my budget plan instead”.</div>`}</div>
  <h2 class="sec">Last 12 months</h2><div class="panel pad">${chart(series(12), 190)}</div>`;
}
function viewSpending() {
  const P = S.entries.filter(e => e.kind === "purchase"), tot = P.reduce((s, e) => s + num(e.amount), 0) || 1, T = totals(), L = luck();
  const by = key => { const o = {}; P.forEach(e => { const k = key(e) || "Other"; o[k] = o[k] || {rm: 0, n: 0}; o[k].rm += num(e.amount); o[k].n++; }); return Object.entries(o).sort((a, z) => z[1].rm - a[1].rm); };
  return `<div class="tiles">
    <div class="tile"><div class="k">Spent in total</div><div class="v">${fmtM(T.spent)}</div><div class="h">${T.est ? `${fmtM(T.est)} estimated` : "&nbsp;"}</div></div>
    <div class="tile"><div class="k">Wishes bought</div><div class="v">${fmtW(T.bought)}</div><div class="h">${T.bought ? `${fmtM((T.spent - T.est) / T.bought)} each` : "&nbsp;"}</div></div>
    <div class="tile"><div class="k">Featured 5★ won</div><div class="v">${L.featured}</div><div class="h">${L.featured ? `${fmtM(T.spent / L.featured)} each` : "&nbsp;"}</div></div>
    <div class="tile"><div class="k">Extra wishes</div><div class="v">${fmtW(L.extra)}</div><div class="h">after getting the Memory</div></div></div>
  <h2 class="sec">Where it went<span class="sp"></span><button class="act" data-act="estimate">Add past spending</button></h2>
  <div class="panel pad">${P.length ? `<div class="tablewrap"><table class="t"><thead><tr><th>Type</th><th>Buys</th><th>Spent</th><th></th></tr></thead><tbody>${by(e => e.estimate ? "Estimated" : e.group).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v.n}</td><td>${fmtM(v.rm)}</td><td style="width:30%"><div class="bar"><i style="width:${v.rm / tot * 100}%"></i></div></td></tr>`).join("")}</tbody></table></div>` : `<div class="muted">No purchases yet.</div>`}</div>`;
}
function planForm(p) {
  const isNew = !p || !p.id; p = Object.assign({name: "", group: "", price: "", wishes: "", month: thisMonth(), repeat: false}, p || {});
  modal(`<h3>${isNew ? "Add to budget plan" : "Planned buy"}</h3><div class="desc">Counts toward that month's budget. Nothing is recorded as spent until you tap “Bought”.</div>
    <div class="field"><label for="f_name">What</label><input id="f_name" value="${esc(p.name)}"></div>
    <div class="fields2"><div class="field"><label for="f_price">Price (${sym()})</label><input id="f_price" type="number" inputmode="decimal" step="0.01" value="${p.price}"></div><div class="field"><label for="f_w">Wishes</label><input id="f_w" type="number" inputmode="decimal" step="any" value="${p.wishes}"></div></div>
    <div class="field"><label for="f_m">Month</label><input id="f_m" type="month" value="${p.month}"></div>
    <label class="check" style="border:none"><input type="checkbox" id="f_rep" ${p.repeat ? "checked" : ""}><span class="main">Every month<div class="small muted">When you mark it bought, next month's is planned for you.</div></span></label>
    <div class="acts">${isNew ? `<button class="btn" data-x>Cancel</button>` : `<button class="btn danger" data-del>Remove</button>`}<button class="btn primary" data-ok>Save</button></div>`, el => {
    bind(el, "[data-x]", closeModal);
    bind(el, "[data-del]", () => { closeModal(); act("Removed", () => { S.plans = S.plans.filter(x => x.id !== p.id); }); });
    bind(el, "[data-ok]", () => {
      const v = {name: val(el, "#f_name").trim(), price: r2(val(el, "#f_price")), wishes: r2(val(el, "#f_w")), month: val(el, "#f_m") || thisMonth(), group: p.group, repeat: el.querySelector("#f_rep").checked};
      if (!v.name) return toast("Say what you plan to buy");
      closeModal(); tab = "shop"; shopView = "budget";
      act("Added to " + fmtMonth(v.month), () => { if (isNew) S.plans.push({id: uid(), ...v}); else Object.assign(S.plans.find(x => x.id === p.id), v); });
    });
  });
}

/* ---------- cards ---------- */
const MEMTYPE = {myth: ["Myth", "y"], solo: ["Solo", "r"], multi: ["Multi", "bl"], bday: ["Birthday", "g"], special: ["Special", "bl"], permanent: ["Xspace Echo", ""], event: ["Event", ""]};
function memType(m) { if (m.kind === "permanent") return "permanent"; const b = BANNERS.find(x => x.name === m.src && !x.rerun); return b ? b.type : "event"; }
function memRow(m) {
  const o = S.owned[m.id] || {}, l = liOf(m.li), b = BANNERS.find(x => x.name === m.src && !x.rerun), t = MEMTYPE[memType(m)];
  return `<div class="mtile ${o.have ? "have" : ""}" style="--c:${l.c}"><div class="mtop"><span class="badge ${t[1]}">${t[0]}</span>${o.have ? `<button class="rankc" data-rankc="${m.id}" aria-label="Rank, tap to change">R${num(o.rank)}</button>` : ""}</div>
    <div class="mname">${esc(m.name)}</div><div class="msrc">${l.n}${m.kind === "permanent" ? "" : `, ${esc(m.src)}${b ? ` ${yearOf(b)}` : ""}`}</div>
    <div class="mbtns"><button class="tog ${o.have ? "have" : ""}" data-have="${m.id}" aria-pressed="${!!o.have}">${o.have ? "Have" : "Have?"}</button>${o.have ? "" : `<button class="tog ${o.want ? "want" : ""}" data-want="${m.id}" aria-pressed="${!!o.want}">Want</button>`}</div></div>`;
}
function wireMemToggles(el, redraw) {
  const done = () => { S.updatedAt = Date.now(); save(); queuePush(); redraw ? redraw() : render(); };
  el.querySelectorAll("[data-have]").forEach(b => b.onclick = () => { const id = b.dataset.have, o = S.owned[id] || {}; S.owned[id] = {...o, have: !o.have, want: o.have ? o.want : false}; done(); });
  el.querySelectorAll("[data-want]").forEach(b => b.onclick = () => { const id = b.dataset.want, o = S.owned[id] || {}; S.owned[id] = {...o, want: !o.want}; done(); });
  el.querySelectorAll("[data-rankc]").forEach(b => b.onclick = () => { const id = b.dataset.rankc, o = S.owned[id] || {}; S.owned[id] = {...o, rank: (num(o.rank) + 1) % 4}; done(); });
}
function viewCards() {
  const q = colQuery.trim().toLowerCase();
  const pass = m => (colLi === "all" || m.li === colLi) && (colFilter === "all" || (colFilter === "have" ? S.owned[m.id]?.have : colFilter === "want" ? S.owned[m.id]?.want : !S.owned[m.id]?.have)) && (!q || `${m.name} ${m.src}`.toLowerCase().includes(q));
  const list = MEMORIES.filter(pass), lisShown = myLis();
  const own = MEMORIES.filter(m => S.owned[m.id]?.have && (colLi === "all" || m.li === colLi)).length, total = MEMORIES.filter(m => colLi === "all" || m.li === colLi).length;
  let body;
  if (colView === "pool") {
    const pools = BANNERS.filter(b => !b.rerun && memsOfPool(b.name).some(pass)).sort((a, z) => z.start.localeCompare(a.start));
    const extraSrc = [...new Set(list.filter(m => !BANNERS.some(b => b.name === m.src)).map(m => m.src))];
    body = pools.map(b => `<div class="panel" style="margin-bottom:10px"><div style="display:flex;align-items:center;gap:10px;padding:12px 0 4px">${avatars(b.lis)}<div><div style="font-weight:700">${esc(b.name)}</div><div class="small muted">${typeName(b.type)}, ${fmtDate(b.start)}</div></div></div><div class="mgrid" style="padding:8px 0 14px">${memsOfPool(b.name).filter(pass).map(memRow).join("")}</div></div>`).join("")
      + extraSrc.map(s => `<div class="panel" style="margin-bottom:10px"><div style="font-weight:700;padding:12px 0 4px">${esc(s)}</div><div class="mgrid" style="padding:8px 0 14px">${list.filter(m => m.src === s).map(memRow).join("")}</div></div>`).join("");
  } else body = `<div class="mgrid">${list.map(memRow).join("")}</div>`;
  return `<div class="lirow" style="margin:4px 0 14px">${lisShown.map(k => `<button class="lichip ${colLi === k ? "on" : ""}" style="--c:${liOf(k).c}" data-colli="${k}">${avatar(k, true)}<span>${liOf(k).n}</span></button>`).join("")}
      <button class="lichip ${colLi === "all" ? "on" : ""}" style="--c:var(--gold)" data-colli="all"><span class="av lg" style="--c:#2b2a63">✦</span><span>Everyone</span></button></div>
    <p style="margin:0 2px 12px;font:400 18px var(--display)">You have ${own} of ${total} 5★ Memories${colLi !== "all" ? ` for ${liOf(colLi).n}` : ""}</p>
    <div class="chips" style="margin:-6px 2px 12px;gap:4px">${["myth", "solo", "multi", "bday", "permanent", "event"].map(k => `<span class="badge ${MEMTYPE[k][1]}">${MEMTYPE[k][0]}</span>`).join(" ")}</div>
    <div class="toolbar"><div class="seg">${[["li", "All cards"], ["pool", "By banner"]].map(([k, l]) => `<button class="${colView === k ? "on" : ""}" data-colv="${k}">${l}</button>`).join("")}</div>
      <div class="seg">${[["all", "All"], ["have", "Have"], ["want", "Want"], ["missing", "Missing"]].map(([k, l]) => `<button class="${colFilter === k ? "on" : ""}" data-colf="${k}">${l}</button>`).join("")}</div>
      <input class="search" id="cq" placeholder="Search Memories" value="${esc(colQuery)}"></div>
    ${list.length ? body : `<div class="panel pad muted">Nothing here.</div>`}
    <p class="small muted" style="margin:10px 2px">Tap “Have” for Memories you own and “Want” for ones you hope to get in a rerun. 5★ Memories you log from wishes are marked for you.</p>`;
}

/* ---------- history ---------- */
function luck() {
  const res = S.entries.filter(e => e.kind === "pull").flatMap(e => (e.results || []).map(r => ({...r, pool: e.pool})));
  const lim = res.filter(r => r.pool !== "standard"), pulls = S.entries.filter(e => e.kind === "pull");
  return {n: res.length, avg: res.length ? res.reduce((s, r) => s + num(r.pity), 0) / res.length : 0, wins: lim.filter(r => r.outcome === "win").length, lost: lim.filter(r => r.outcome === "lost").length,
    featured: lim.filter(r => r.outcome === "win" || r.outcome === "guar").length, extra: pulls.reduce((s, e) => s + extraOf(e), 0)};
}
function viewHistory() {
  const L = luck(), q = histQuery.trim().toLowerCase();
  const list = ordered().reverse().filter(e => (histFilter === "all" || e.kind === histFilter) && (!q || JSON.stringify([e.label, e.note, e.group, e.source, e.bannerName, (e.results || []).map(r => r.card)]).toLowerCase().includes(q)));
  const byM = {}; list.forEach(e => (byM[e.date.slice(0, 7)] = byM[e.date.slice(0, 7)] || []).push(e));
  return `<div class="tiles" style="margin-top:4px">
    <div class="tile"><div class="k">Average pity for a 5★</div><div class="v">${L.n ? L.avg.toFixed(1) : "–"}</div><div class="h">${plural(L.n, "5★")} logged</div></div>
    <div class="tile"><div class="k">50/50 record</div><div class="v">${L.wins + L.lost ? `${L.wins} won, ${L.lost} lost` : "–"}</div><div class="h">guaranteed pulls not counted</div></div>
    <div class="tile"><div class="k">Wishes used</div><div class="v">${fmtW(totals().used)}</div><div class="h">${fmtW(L.extra)} were extras</div></div>
    <div class="tile"><div class="k">Free wishes</div><div class="v">${fmtW(S.entries.filter(e => e.kind === "gain").reduce((s, e) => s + num(e.wishes), 0))}</div><div class="h">from playing</div></div></div>
  <div class="toolbar" style="margin-top:16px"><div class="seg">${[["all", "All"], ["pull", "Wishes"], ["purchase", "Bought"], ["gain", "Free"]].map(([k, l]) => `<button class="${histFilter === k ? "on" : ""}" data-hf="${k}">${l}</button>`).join("")}</div>
    <input class="search" id="hq" placeholder="Search, e.g. Caleb" value="${esc(histQuery)}"></div>
  ${Object.keys(byM).length ? Object.entries(byM).map(([m, es]) => `<h2 class="sec">${fmtMonth(m)}</h2><div class="panel"><ul class="rows">${es.map(feedItem).join("")}</ul></div>`).join("") : `<div class="panel pad muted">Nothing matches.</div>`}
  <p class="small muted" style="margin:10px 2px">Tap anything to change or delete it.</p>`;
}
function entryForm(e) {
  if (e.kind === "pull") return pullForm(e);
  if (e.kind === "gain") return gainForm(e);
  modal(`<h3>${e.kind === "purchase" ? "Purchase" : "Correction"}</h3>
    <div class="field"><label for="f_l">Name</label><input id="f_l" value="${esc(e.label)}"></div>
    <div class="fields2"><div class="field"><label for="f_w">Wishes${e.kind === "adjust" ? " (+ or −)" : ""}</label><input id="f_w" type="number" inputmode="decimal" step="any" value="${e.wishes}"></div>
    ${e.kind === "purchase" ? `<div class="field"><label for="f_a">Paid (${sym()})</label><input id="f_a" type="number" inputmode="decimal" step="0.01" value="${e.amount}"></div>` : "<div></div>"}</div>
    <div class="field"><label for="f_d">Date</label><input id="f_d" type="date" value="${e.date}"></div>
    <div class="field"><label for="f_n">Note</label><input id="f_n" value="${esc(e.note || "")}"></div>
    <div class="acts"><button class="btn danger" data-del>Delete</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    bind(el, "[data-del]", () => { closeModal(); act("Deleted", () => { S.entries = S.entries.filter(x => x.id !== e.id); }); });
    bind(el, "[data-ok]", () => { const v = {label: val(el, "#f_l").trim(), wishes: r2(val(el, "#f_w")), note: val(el, "#f_n").trim(), date: val(el, "#f_d") || e.date}; if (e.kind === "purchase") v.amount = r2(val(el, "#f_a")); closeModal(); act("Saved", () => Object.assign(S.entries.find(x => x.id === e.id), v)); });
  });
}

/* ---------- settings ---------- */
function viewSettings() {
  const inc = monthlyIncome();
  return `<h2 class="sec" style="margin-top:6px">You</h2>
  <div class="panel"><ul class="rows">
    <li><div class="main"><div class="t">Love interests</div><div class="s">${myLis().map(k => liOf(k).n).join(", ")}</div></div><button class="btn sm" data-act="lis">Change</button></li>
    <li><div class="main"><div class="t">Currency</div><div class="s">${S.profile.currency} (${sym()})</div></div><button class="btn sm" data-act="profile">Change</button></li>
    <li><div class="main"><div class="t">Track Xspace Echo</div><div class="s">Empyrean Wishes and standard pity</div></div><button class="btn sm" data-act="profile">${S.profile.trackStandard ? "On" : "Off"}</button></li>
  </ul></div>
  <h2 class="sec">Free income and passes</h2>
  <div class="panel"><ul class="rows">
    <li><div class="main"><div class="t">Daily login income</div><div class="s">${S.settings.autoIncome ? `On, about ${plural(inc.auto, "wish")} a month` : "Off, you add free wishes yourself"}</div></div><button class="btn sm" data-act="income">Edit</button></li>
  </ul></div>
  <h2 class="sec">Sync between devices</h2>
  <div class="panel pad">${syncBlock()}</div>
  <h2 class="sec">Spending</h2>
  <div class="panel"><ul class="rows">
    <li><div class="main"><div class="t">Monthly budget</div><div class="s">${S.settings.budget ? fmtM(S.settings.budget) : "Not set"}</div></div><button class="btn sm" data-act="budget">Change</button></li>
    <li><div class="main"><div class="t">Spending from before you started</div><div class="s">Add an estimate so your total is closer to real</div></div><button class="btn sm" data-act="estimate">Add</button></li>
  </ul></div>
  <h2 class="sec">Look</h2>
  <div class="panel pad"><div class="seg">${["auto", "light", "dark"].map(t => `<button class="${S.settings.theme === t ? "on" : ""}" data-theme="${t}">${{auto: "Match my phone", light: "Light", dark: "Dark"}[t]}</button>`).join("")}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn sm" data-act="headerimg">${S.images.header ? "Change" : "Add"} header picture</button>${S.images.header ? `<button class="btn sm" data-act="rmheader">Remove</button>` : ""}</div>
    <p class="small muted" style="margin:8px 0 0">Your pictures stay on this device.</p></div>
  <h2 class="sec">Your data</h2>
  <div class="panel"><ul class="rows">
    <li><div class="main"><div class="t">Backup file</div><div class="s">Save everything to a file, or load one</div></div><div style="display:flex;gap:6px"><button class="btn sm" data-act="backup">Save</button><button class="btn sm" data-act="restore">Load</button></div></li>
    <li><div class="main"><div class="t">Spreadsheet</div><div class="s">Your history as a CSV file</div></div><button class="btn sm" data-act="csv">Export</button></li>
    <li><div class="main"><div class="t">Pity</div><div class="s">Fix it to match the game</div></div><button class="btn sm" data-pity="limited">Correct</button></li>
    <li><div class="main"><div class="t">Setup</div><div class="s">Go through the first-time questions again</div></div><button class="btn sm" data-act="setup">Start</button></li>
    <li><div class="main"><div class="t">Delete everything</div><div class="s">Removes all data on this device</div></div><button class="btn sm danger" data-act="wipe">Delete</button></li>
  </ul></div>`;
}
function syncBlock() {
  if (!syncOn()) return `<p class="muted" style="margin:0">Coming soon. Until then, use “Backup file” below to move your data to another device.</p>`;
  if (S.sync.code) return `<p style="margin:0 0 4px">Your sync code</p><div class="code">${S.sync.code}</div><p class="small muted" style="margin:0 0 12px">Enter this code on your other devices. Anyone with the code can see and change your data, so keep it to yourself.${S.sync.last ? ` Last synced ${new Date(S.sync.last).toLocaleString()}.` : ""}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="copycode">Copy code</button><button class="btn sm" data-act="syncnow">${icon("sync", 'width="16" height="16"')}Sync now</button><button class="btn sm" data-act="unsync">Stop syncing here</button></div>`;
  return `<p class="muted" style="margin:0 0 12px">Get a code like LADS-7KQ2-M9XD. Type it on your phone, iPad or laptop and the same data shows up there. No account needed.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm primary" data-act="makecode">Get my sync code</button><button class="btn sm" data-act="entercode">I have a code</button></div>`;
}
function enterCode(fromSetup) {
  modal(`<h3>Enter your sync code</h3><div class="desc">The code from your other device, like LADS-7KQ2-M9XD. Your data there will replace what's on this device.</div>
    <div class="field"><label for="f_c">Sync code</label><input id="f_c" autocapitalize="characters" autocomplete="off" placeholder="LADS-XXXX-XXXX"></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Load my data</button></div>`, el => {
    bind(el, "[data-x]", () => { closeModal(); if (fromSetup) wizard(); });
    bind(el, "[data-ok]", async () => {
      const c = val(el, "#f_c").trim().toUpperCase().replace(/\s/g, "");
      if (!/^LADS-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c)) return toast("That doesn't look like a sync code");
      try {
        const r = await rpc("wb_get", {p_code: c});
        if (!r || !r.data) return toast("No data found for that code");
        const keep = S.images; S = normalise(r.data); S.images = keep; S.sync = {code: c, last: Date.now()}; S.updatedAt = +r.updated_at; save(); closeModal(); render(); toast("Your data is here");
        if (!S.setupDone) wizard(true);
      } catch (e) { toast("Couldn't reach the sync server. Check your connection."); }
    });
  });
}
function incomeForm() {
  const t = today();
  modal(`<h3>Free income and passes</h3><div class="desc">Diamonds you get from logging in. With this on, ${CONFIG.appName} adds them for each day that passes.</div>
    <label class="check" style="border:none"><input type="checkbox" id="f_auto" ${S.settings.autoIncome ? "checked" : ""}><span class="main"><b>I log in most days</b><div class="small muted">Turn off if you don't, and add free wishes yourself.</div></span></label>
    <div class="lbl" style="margin:10px 0 2px">Diamonds from each</div>
    ${INCOME_SOURCES.map(s => `<label class="check"><input type="checkbox" data-on="${s.k}" ${incomeOn(s) ? "checked" : ""}><span class="main">${s.n}<div class="small muted">${{daily: "Every day", weekly: "Every Monday", monthly: `On the ${s.day === 1 ? "1st" : s.day + "th"} of each month`}[s.when]}${s.need ? `, while you have it` : ""}</div></span><span class="amt"><input data-amt="${s.k}" type="number" inputmode="numeric" value="${incomeAmt(s)}" aria-label="${esc(s.n)} Diamonds"></span></label>`).join("")}
    <div class="lbl" style="margin:16px 0 8px">Passes you have</div>
    <div class="field"><label for="f_aur">Days left on Aurum Pass</label><input id="f_aur" type="number" inputmode="numeric" value="${S.passes.aurum && S.passes.aurum >= t ? daysBetween(t, S.passes.aurum) : ""}" placeholder="0 if you don't have it"></div>
    <div class="lbl" style="margin-bottom:2px">Yearly passes for ${YEARLY.label} (until ${fmtDate(YEARLY.end)})</div>
    ${[["ydiamond", "Yearly Diamond Pass"], ["ywish", "Yearly Wish Pass"], ["ygrowth", "Yearly Growth Pass"]].map(([k, n]) => `<label class="check"><input type="checkbox" data-y="${k}" ${S.passes[k] ? "checked" : ""}><span class="main">${n}</span></label>`).join("")}
    <div class="field" style="margin-top:14px"><label for="f_ex">Other free wishes in a usual month (Orbit, Senior Hunter Contest, events)</label><input id="f_ex" type="number" inputmode="decimal" value="${S.settings.extraIncome || ""}" placeholder="Used for planning only"></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    bind(el, "[data-x]", closeModal);
    bind(el, "[data-ok]", () => { closeModal(); act("Saved", () => {
      const was = S.settings.autoIncome; S.settings.autoIncome = el.querySelector("#f_auto").checked; if (!was && S.settings.autoIncome) S.income.lastRun = today();
      el.querySelectorAll("[data-on]").forEach(c => S.income.off[c.dataset.on] = !c.checked);
      el.querySelectorAll("[data-amt]").forEach(i => S.income.amounts[i.dataset.amt] = num(i.value));
      const d = num(val(el, "#f_aur")); if (d > 0) S.passes.aurum = addDays(t, d); else delete S.passes.aurum;
      el.querySelectorAll("[data-y]").forEach(c => { if (c.checked) S.passes[c.dataset.y] = YEARLY.end; else delete S.passes[c.dataset.y]; });
      if (["ydiamond", "ywish", "ygrowth"].every(k => S.passes[k])) S.passes.ybonus = YEARLY.end; else delete S.passes.ybonus;
      S.settings.extraIncome = num(val(el, "#f_ex"));
    }, false); });
  });
}
function profileForm() {
  modal(`<h3>Settings</h3>
    <div class="field"><label for="f_c">Currency you pay in</label><select id="f_c">${CURRENCIES.map(([c, s]) => `<option value="${c}" ${S.profile.currency === c ? "selected" : ""}>${c} (${s})</option>`).join("")}</select></div>
    <label class="check"><input type="checkbox" id="f_std" ${S.profile.trackStandard ? "checked" : ""}><span class="main">Track Xspace Echo<div class="small muted">Empyrean Wishes and standard pity. Useful for newer players.</div></span></label>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    bind(el, "[data-x]", closeModal);
    bind(el, "[data-ok]", () => { const c = val(el, "#f_c"), ch = c !== S.profile.currency; closeModal();
      act(ch ? "Saved. Pack prices were reset for the new currency." : "Saved", () => { S.profile.trackStandard = el.querySelector("#f_std").checked; if (ch) { S.profile.currency = c; S.packs.forEach(p => { if (!p.custom) p.price = c === "MYR" ? p.myr : null; }); } }, false); });
  });
}
function lisForm() {
  let lis = [...S.profile.lis];
  modal(`<h3>Your love interests</h3><div class="desc">Pick one or all five. The first one you pick is your main.</div><div class="lirow" id="lis" style="margin-bottom:16px"></div><div id="pics"></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    const draw = () => {
      el.querySelector("#lis").innerHTML = LIS.map(l => `<button type="button" class="lichip ${lis.includes(l.k) ? "on" : ""}" style="--c:${l.c}" data-l="${l.k}">${avatar(l.k, true)}<span>${l.n}</span>${lis[0] === l.k ? `<span class="badge y">Main</span>` : ""}</button>`).join("");
      el.querySelector("#pics").innerHTML = lis.length ? `<div class="lbl" style="margin-bottom:6px">Pictures (optional, stay on this device)</div>` + lis.map(k => `<div class="row" style="align-items:center;margin-bottom:8px"><span style="display:flex;gap:8px;align-items:center">${avatar(k)} ${liOf(k).n}</span><span><button type="button" class="btn sm" data-pic="${k}">Choose</button>${S.images.li[k] ? ` <button type="button" class="btn sm" data-rmpic="${k}">Remove</button>` : ""}</span></div>`).join("") : "";
      el.querySelectorAll("[data-l]").forEach(c => c.onclick = () => { const k = c.dataset.l; lis = lis.includes(k) ? lis.filter(x => x !== k) : [...lis, k]; draw(); });
      el.querySelectorAll("[data-pic]").forEach(b => b.onclick = () => pickImage(240, url => { S.images.li[b.dataset.pic] = url; save(); draw(); }));
      el.querySelectorAll("[data-rmpic]").forEach(b => b.onclick = () => { delete S.images.li[b.dataset.rmpic]; save(); draw(); });
    };
    draw();
    bind(el, "[data-x]", () => { closeModal(); render(); });
    bind(el, "[data-ok]", () => { closeModal(); act("Saved", () => { S.profile.lis = lis; }, false); });
  });
}
function pickImage(maxW, cb) {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; const img = new Image(), url = URL.createObjectURL(f);
    img.onload = () => { const sc = Math.min(1, maxW / img.width), cv = document.createElement("canvas"); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc); cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); try { cb(cv.toDataURL("image/jpeg", .82)); } catch (e) { toast("Couldn't use that picture"); } };
    img.onerror = () => toast("Couldn't open that picture"); img.src = url; };
  inp.click();
}
function estimateForm() {
  const pr = id => S.packs.find(p => p.id === id)?.price ?? "";
  modal(`<h3>Spending from before</h3><div class="desc">A rough total for money you spent before you started tracking. It's added as one estimate and doesn't change your wishes.</div>
    <div class="fields2"><div class="field"><label for="e_am">Months of Aurum Pass</label><input id="e_am" type="number" inputmode="numeric"></div><div class="field"><label for="e_ap">Price each</label><input id="e_ap" type="number" step="0.01" value="${pr("aurum")}"></div></div>
    <div class="fields2"><div class="field"><label for="e_pm">Promise seasons bought</label><input id="e_pm" type="number" inputmode="numeric"></div><div class="field"><label for="e_pp">Price each</label><input id="e_pp" type="number" step="0.01" value="${pr("secret")}"></div></div>
    <div class="fields2"><div class="field"><label for="e_ym">Yearly passes bought</label><input id="e_ym" type="number" inputmode="numeric"></div><div class="field"><label for="e_yp">Average price</label><input id="e_yp" type="number" step="0.01" value="${pr("ydiam") ? r2((num(pr("ydiam")) + num(pr("ywish")) + num(pr("ygrow"))) / 3) : ""}"></div></div>
    <div class="fields2"><div class="field"><label for="e_bm">Months buying pool packs</label><input id="e_bm" type="number" inputmode="numeric"></div><div class="field"><label for="e_bp">Average a month</label><input id="e_bp" type="number" step="0.01"></div></div>
    <div class="field"><label for="e_o">Anything else</label><input id="e_o" type="number" step="0.01"></div>
    <div class="summary" id="sum"></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Add estimate</button></div>`, el => {
    const tot = () => r2(num(val(el, "#e_am")) * num(val(el, "#e_ap")) + num(val(el, "#e_pm")) * num(val(el, "#e_pp")) + num(val(el, "#e_ym")) * num(val(el, "#e_yp")) + num(val(el, "#e_bm")) * num(val(el, "#e_bp")) + num(val(el, "#e_o")));
    const upd = () => el.querySelector("#sum").innerHTML = `<div class="row"><span>Estimated total</span><b>${fmtM(tot())}</b></div>`;
    el.querySelectorAll("input").forEach(i => i.oninput = upd); upd();
    bind(el, "[data-x]", closeModal);
    bind(el, "[data-ok]", () => { const t = tot(); if (!(t > 0)) return toast("Fill in at least one line"); closeModal();
      act(`Added ${fmtM(t)} estimate`, () => S.entries.push({id: uid(), ts: Date.now(), kind: "purchase", estimate: true, date: today(), label: "Spending before tracking (estimate)", group: "Estimated", wishes: 0, amount: t, note: ""})); });
  });
}

/* ---------- first-time setup ---------- */
function wizard(skipWelcome) {
  const d = {currency: S.profile.currency, lis: [...S.profile.lis], std: S.profile.trackStandard, dia: "", tk: "", wishes: S.entries.length ? Math.floor(balances().ds) : "", emp: S.entries.length ? balances().emp : "",
    pools: Object.fromEntries(Object.keys(POOLS).map(p => [p, {...poolState(p), left: false}])), auto: S.settings.autoIncome, aurum: S.passes.aurum && S.passes.aurum >= today() ? daysBetween(today(), S.passes.aurum) : "",
    y: {ydiamond: !!S.passes.ydiamond, ywish: !!S.passes.ywish, ygrowth: !!S.passes.ygrowth}, budget: S.settings.budget || ""};
  let step = skipWelcome ? 1 : 0; const N = 5;
  const body = () => {
    if (step === 0) return `<div style="text-align:center;padding:10px 0 4px"><div style="width:64px;margin:0 auto 12px">${LOGO}</div><h3 style="font-size:28px">${CONFIG.appName}</h3>
      <p class="muted" style="margin:6px 0 18px">Track your Love and Deepspace wishes, pity, spending and Memories in one place.</p></div>
      <button class="btn primary" style="width:100%" data-next>Set up</button>
      <div class="acts">${syncOn() ? `<button class="btn" data-code>I have a sync code</button>` : ""}<button class="btn" data-restore>Load a backup file</button></div>`;
    if (step === 1) return `<h3>Who do you play for?</h3><div class="desc">Pick one or all five. The first one is your main.</div>
      <div class="lirow" style="margin-bottom:16px">${LIS.map(l => `<button type="button" class="lichip ${d.lis.includes(l.k) ? "on" : ""}" style="--c:${l.c}" data-l="${l.k}">${avatar(l.k, true)}<span>${l.n}</span>${d.lis[0] === l.k ? `<span class="badge y">Main</span>` : ""}</button>`).join("")}</div>
      <div class="field"><label for="w_c">Currency you pay in</label><select id="w_c">${CURRENCIES.map(([c, s]) => `<option value="${c}" ${d.currency === c ? "selected" : ""}>${c} (${s})</option>`).join("")}</select></div>
      <label class="check" style="border:none"><input type="checkbox" id="w_std" ${d.std ? "checked" : ""}><span class="main">Also track Xspace Echo<div class="small muted">Empyrean Wishes and standard pity. Optional.</div></span></label>`;
    if (step === 2) return `<h3>What you have now</h3><div class="desc">Open the game and copy the numbers.</div>
      <div class="fields2"><div class="field"><label for="w_dm">Diamonds</label><input id="w_dm" type="number" inputmode="numeric" value="${d.dia}"></div><div class="field"><label for="w_tk">Deepspace Wishes</label><input id="w_tk" type="number" inputmode="numeric" value="${d.tk}"></div></div>
      <div class="field"><label for="w_w">Total in wishes</label><input id="w_w" type="number" inputmode="decimal" step="any" value="${d.wishes}"><span class="small muted">150 Diamonds count as one wish.</span></div>
      ${d.std ? `<div class="field"><label for="w_emp">Empyrean Wishes</label><input id="w_emp" type="number" inputmode="numeric" value="${d.emp}"></div>` : ""}`;
    if (step === 3) return `<h3>Your pity</h3><div class="desc">Pity is how many wishes you've made since your last 5★. A 5★ is certain by wish ${CONFIG.hardPity}. Your wish history in the game shows it.</div>
      ${["limited", "rerun"].concat(d.std ? ["standard"] : []).map(p => `<div class="event"><div class="head">${POOLS[p].n} pools<span class="sp"></span></div><div class="small muted" style="margin:-6px 0 10px">${POOLS[p].sub}</div>
        <div class="field" style="margin-bottom:8px"><label for="w_${p}">${d.pools[p].left ? "Wishes left until a sure 5★" : "Wishes since your last 5★"}</label><input id="w_${p}" data-p="${p}" type="number" inputmode="numeric" min="0" max="70" value="${d.pools[p].left ? CONFIG.hardPity - d.pools[p].pity : d.pools[p].pity}"></div>
        <button type="button" class="linkbtn small" data-flip="${p}">${d.pools[p].left ? "I'll count wishes since my last 5★ instead" : "My game shows wishes left instead"}</button>
        ${POOLS[p].guar ? `<label class="check" style="border:none;padding-bottom:0"><input type="checkbox" data-g="${p}" ${d.pools[p].guar ? "checked" : ""}><span class="main">My last 5★ was off-banner<div class="small muted">So the next 5★ is guaranteed to be featured.</div></span></label>` : ""}</div>`).join("")}`;
    return `<h3>Daily diamonds</h3><div class="desc">${CONFIG.appName} can add the Diamonds you get from logging in.</div>
      <label class="check" style="border:none"><input type="checkbox" id="w_auto" ${d.auto ? "checked" : ""}><span class="main"><b>I log in most days</b><div class="small muted">Adds daily tasks, weekly tasks, login rewards and your passes automatically.</div></span></label>
      <div class="field"><label for="w_aur">Days left on Aurum Pass</label><input id="w_aur" type="number" inputmode="numeric" value="${d.aurum}" placeholder="Leave empty if you don't have it"></div>
      <div class="lbl" style="margin-bottom:2px">Yearly passes you bought for ${YEARLY.label}</div>
      ${[["ydiamond", "Yearly Diamond Pass"], ["ywish", "Yearly Wish Pass"], ["ygrowth", "Yearly Growth Pass"]].map(([k, n]) => `<label class="check"><input type="checkbox" data-y="${k}" ${d.y[k] ? "checked" : ""}><span class="main">${n}</span></label>`).join("")}
      <div class="field" style="margin-top:14px"><label for="w_bud">Monthly budget (${sym()}, optional)</label><input id="w_bud" type="number" inputmode="decimal" value="${d.budget}"></div>`;
  };
  const collect = el => {
    if (step === 1) { d.currency = val(el, "#w_c"); d.std = el.querySelector("#w_std").checked; }
    if (step === 2) { d.dia = val(el, "#w_dm"); d.tk = val(el, "#w_tk"); d.wishes = val(el, "#w_w"); if (el.querySelector("#w_emp")) d.emp = val(el, "#w_emp"); }
    if (step === 3) el.querySelectorAll("[data-p]").forEach(i => { const p = i.dataset.p, g = el.querySelector(`[data-g="${p}"]`), v = Math.min(70, num(i.value)); d.pools[p].pity = d.pools[p].left ? CONFIG.hardPity - v : v; d.pools[p].guar = g ? g.checked : false; });
    if (step === 4) { d.auto = el.querySelector("#w_auto").checked; d.aurum = val(el, "#w_aur"); el.querySelectorAll("[data-y]").forEach(c => d.y[c.dataset.y] = c.checked); d.budget = val(el, "#w_bud"); }
  };
  const finish = () => act(`You're all set`, () => {
    const cur = balances(), ts = Date.now();
    if (d.currency !== S.profile.currency) S.packs.forEach(p => { if (!p.custom) p.price = d.currency === "MYR" ? p.myr : null; });
    S.profile.currency = d.currency; S.profile.lis = d.lis; S.profile.trackStandard = d.std;
    const dw = r2(num(d.wishes) - cur.ds), de = d.std ? r2(num(d.emp) - cur.emp) : 0;
    if (dw || de) S.entries.push({id: uid(), ts, kind: "adjust", date: today(), label: S.entries.length ? "Matched in setup" : "Starting wishes", wishes: dw, emp: de, note: d.dia ? `${num(d.dia).toLocaleString()} Diamonds, ${num(d.tk)} wishes` : ""});
    Object.keys(d.pools).forEach(p => S.pools[p] = {pity: d.pools[p].pity, guar: d.pools[p].guar, ts: ts + 1});
    S.settings.autoIncome = d.auto; S.settings.budget = num(d.budget);
    if (num(d.aurum) > 0) S.passes.aurum = addDays(today(), num(d.aurum)); else delete S.passes.aurum;
    Object.entries(d.y).forEach(([k, on]) => { if (on) S.passes[k] = YEARLY.end; else delete S.passes[k]; });
    if (Object.values(d.y).every(Boolean)) S.passes.ybonus = YEARLY.end; else delete S.passes.ybonus;
    S.income.lastRun = today(); S.setupDone = true; if (d.lis.length === 1) colLi = d.lis[0];
  }, false);
  const draw = () => modal(`${step ? `<div class="steps">${Array.from({length: N - 1}, (_, i) => `<i class="${i < step ? "on" : ""}"></i>`).join("")}</div>` : ""}${body()}
      ${step ? `<div class="acts" style="margin-top:16px"><button class="btn" data-back>Back</button><button class="btn primary" data-next>${step === N - 1 ? "Done" : "Next"}</button></div>` : ""}`, (el, scrim) => {
    scrim.dataset.lock = "1";
    el.querySelectorAll("[data-l]").forEach(c => c.onclick = () => { collect(el); const k = c.dataset.l; d.lis = d.lis.includes(k) ? d.lis.filter(x => x !== k) : [...d.lis, k]; draw(); });
    el.querySelectorAll("[data-flip]").forEach(c => c.onclick = () => { collect(el); d.pools[c.dataset.flip].left = !d.pools[c.dataset.flip].left; draw(); });
    const dm = el.querySelector("#w_dm"), tk = el.querySelector("#w_tk"), w = el.querySelector("#w_w");
    if (dm) dm.oninput = tk.oninput = () => { w.value = r2(D2W(num(dm.value)) + num(tk.value)); };
    bind(el, "[data-restore]", () => restoreBackup());
    bind(el, "[data-code]", () => enterCode(true));
    bind(el, "[data-back]", () => { collect(el); step--; draw(); });
    bind(el, "[data-next]", () => { collect(el); if (step === 1 && !d.lis.length) return toast("Pick at least one love interest"); if (step === N - 1) { closeModal(); return finish(); } step++; draw(); });
  }, true);
  draw();
}

/* ---------- backup ---------- */
function download(name, text, type) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], {type})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
function exportCSV() {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["Date", "Type", "Name", "Source or pack", "Wish pool", "Pity pool", "Wishes", "Empyrean", `Paid (${S.profile.currency})`, "5★", "Extra wishes", "Note"].join(",")];
  ordered().forEach(e => { const d = delta(e); rows.push([e.date, e.kind, q(e.kind === "pull" ? e.bannerName : e.label), q(e.source || e.group || ""), q(e.bannerName || ""), e.pool || "", d.ds, d.emp, e.kind === "purchase" ? num(e.amount).toFixed(2) : "", q((e.results || []).map(r => `${r.card || ""} at pity ${r.pity} (${r.outcome})`).join("; ")), e.kind === "pull" ? extraOf(e) : "", q(e.note)].join(",")); });
  download(`wishbound-${today()}.csv`, "﻿" + rows.join("\n"), "text/csv"); toast("Saved the CSV file");
}
function restoreBackup() {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json,application/json";
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { let d; try { d = JSON.parse(rd.result); } catch (e) { return toast("That file isn't a Wishbound backup"); }
      if (!Array.isArray(d.entries)) return toast("That file isn't a Wishbound backup");
      const go = () => { closeModal(); act("Backup loaded", () => { const sync = S.sync; S = normalise(d); S.sync = sync; }); if (!S.setupDone) setTimeout(() => wizard(true), 250); };
      if (S.entries.length) confirmBox("Load this backup?", `It has ${d.entries.length} entries and replaces everything on this device.`, "Load it", go); else go(); };
    rd.readAsText(f); };
  inp.click();
}

/* ---------- render ---------- */
const TABS = [["home", "home", "Home"], ["banners", "pools", "Wish pools"], ["shop", "shop", "Shop"], ["cards", "cards", "Memories"], ["history", "hist", "History"]];
function footer() {
  return `<footer class="credit"><div class="name">${CONFIG.appName}</div>by <a href="${CONFIG.authorUrl}" target="_blank" rel="noopener">${CONFIG.author}</a>, <a href="${CONFIG.githubUrl}" target="_blank" rel="noopener">GitHub</a><br>
    A fan-made tool for Love and Deepspace. Not affiliated with Infold Games.${CONFIG.kofiUrl ? `<br><a class="btn sm" style="margin-top:8px" href="${CONFIG.kofiUrl}" target="_blank" rel="noopener">Support ${CONFIG.appName}</a>` : ""}</footer>`;
}
function render() {
  applyTheme();
  const views = {home: viewHome, banners: viewBanners, shop: viewShop, cards: viewCards, history: viewHistory, settings: viewSettings};
  const titles = {home: CONFIG.appName, banners: "Wish pools", shop: "Shop", cards: "Memories", history: "History", settings: "Settings"};
  const dark = document.documentElement.dataset.theme === "dark";
  $("#app").innerHTML = `<header class="top"><div class="brand">${LOGO}<h1>${titles[tab]}</h1></div>
      ${tab !== "home" ? `<button class="iconbtn" data-go="home" aria-label="Wishes">${fmtWB(balances().ds)} ✦</button>` : ""}
      <button class="iconbtn" data-act="theme" aria-label="Switch light or dark">${icon(dark ? "sun" : "moon")}</button>
      <button class="iconbtn" data-go="settings" aria-label="Settings">${icon("gear")}</button></header>
    ${storageOK ? "" : `<div class="warn">This browser isn't saving your data. Save a backup file from Settings to keep a copy.</div>`}
    ${views[tab]()}${footer()}`;
  $("#tabs").innerHTML = TABS.map(([k, ic, l]) => `<button class="${tab === k ? "on" : ""}" data-go="${k}" aria-current="${tab === k ? "page" : "false"}">${icon(ic)}${l}</button>`).join("");
  const hq = $("#hq"); if (hq) hq.oninput = e => { histQuery = e.target.value; const p = e.target.selectionStart; render(); const n = $("#hq"); n.focus(); n.setSelectionRange(p, p); };
  const cq = $("#cq"); if (cq) cq.oninput = e => { colQuery = e.target.value; const p = e.target.selectionStart; render(); const n = $("#cq"); n.focus(); n.setSelectionRange(p, p); };
  if (tab === "cards") wireMemToggles($("#app"));
}

/* ---------- events ---------- */
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-go],[data-act],[data-pack],[data-edit],[data-pg],[data-hf],[data-theme],[data-buyplan],[data-editplan],[data-banner],[data-pity],[data-shop],[data-colli],[data-colf],[data-colv]");
  if (!t || (t.closest(".sheet") && !t.closest("[data-go]"))) return;
  const d = t.dataset;
  if (t.tagName === "A") ev.preventDefault();
  if (d.go) { tab = d.go; closeModal(); render(); scrollTo(0, 0); return; }
  if (d.pack) return buyForm(S.packs.find(p => p.id === d.pack));
  if (d.edit) return entryForm(S.entries.find(e => e.id === d.edit));
  if (d.pg) { packGroup = d.pg; return render(); }
  if (d.hf) { histFilter = d.hf; return render(); }
  if (d.shop) { shopView = d.shop; return render(); }
  if (d.colli) { colLi = d.colli; return render(); }
  if (d.colf) { colFilter = d.colf; return render(); }
  if (d.colv) { colView = d.colv; return render(); }
  if (d.theme) return act("", () => { S.settings.theme = d.theme; }, false);
  if (d.banner) return bannerDetail(bannerById(d.banner));
  if (d.pity) return pityForm(d.pity);
  if (d.editplan) return planForm(S.plans.find(p => p.id === d.editplan));
  if (d.buyplan) { const p = S.plans.find(x => x.id === d.buyplan);
    return act(`Bought ${p.name}`, () => { S.entries.push({id: uid(), ts: Date.now(), kind: "purchase", date: today(), label: p.name, group: p.group || "Planned", wishes: /aurum/i.test(p.name) ? 0 : num(p.wishes), amount: num(p.price), note: ""});
      S.plans = S.plans.filter(x => x.id !== p.id); if (p.repeat) S.plans.push({...p, id: uid(), month: addMonth(p.month, 1)}); if (/aurum/i.test(p.name)) startPass("aurum"); }); }
  switch (d.act) {
    case "pull": return pullForm();
    case "gain": return gainForm();
    case "match": return matchForm();
    case "newpack": return packForm();
    case "newplan": return planForm();
    case "newbanner": return bannerForm();
    case "lis": return lisForm();
    case "profile": return profileForm();
    case "income": return incomeForm();
    case "estimate": return estimateForm();
    case "setup": return wizard(true);
    case "theme": return act("", () => { S.settings.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; }, false);
    case "budget": return modal(`<h3>Monthly budget</h3><div class="desc">How much you're happy to spend on the game each month. Leave empty for no budget.</div><div class="field"><label for="f_v">Budget (${sym()})</label><input id="f_v" type="number" inputmode="decimal" value="${S.settings.budget || ""}"></div><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => { bind(el, "[data-x]", closeModal); bind(el, "[data-ok]", () => { const v = num(val(el, "#f_v")); closeModal(); act("Saved", () => { S.settings.budget = v; }, false); }); });
    case "headerimg": return pickImage(1200, url => act("Header picture set", () => { S.images.header = url; }, false));
    case "rmheader": return act("Removed", () => { S.images.header = null; }, false);
    case "csv": return exportCSV();
    case "backup": download(`wishbound-backup-${today()}.json`, JSON.stringify(S), "application/json"); return toast("Saved the backup file");
    case "restore": return restoreBackup();
    case "makecode": S.sync.code = newCode(); S.updatedAt = S.updatedAt || Date.now(); save(); pushNow().then(render); return render();
    case "entercode": return enterCode();
    case "copycode": navigator.clipboard?.writeText(S.sync.code).then(() => toast("Copied"), () => toast(S.sync.code)); return;
    case "syncnow": pullNow().then(() => { toast("Synced"); render(); }); return;
    case "unsync": return confirmBox("Stop syncing on this device?", "Your data stays here. Other devices keep the code.", "Stop", () => { S.sync = {code: "", last: 0}; save(); render(); });
    case "wipe": return confirmBox("Delete everything?", "All your data on this device will be removed. Save a backup file first if you might want it back.", "Delete everything", () => { S = freshState(); save(); tab = "home"; render(); wizard(); });
  }
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S) { runAutoIncome(); pullNow(true); } });

/* ---------- start ---------- */
load(); if (S.profile.lis.length === 1) colLi = S.profile.lis[0]; render(); probeAssets();
if (!S.setupDone) wizard(); else { runAutoIncome(); pullNow(true); }
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
