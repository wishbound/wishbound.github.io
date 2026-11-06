/* Wishbound — main app. Made by @pookieleb. All rights reserved. */
"use strict";

/* ================= helpers ================= */
const KEY = "wishbound-v2";
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
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
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtMonth = m => { const [y, mo] = m.split("-"); return `${MONTHS[+mo - 1]} ${y}`; };
const fmtDate = d => { if (!d) return ""; const [y, m, dd] = d.split("-"); return `${+dd} ${MONTHS[+m - 1]} ${y}`; };
const addMonth = (m, k) => { let [y, mo] = m.split("-").map(Number); mo += k; while (mo > 12) { mo -= 12; y++; } while (mo < 1) { mo += 12; y--; } return `${y}-${pad(mo)}`; };
const fmtW = n => { n = r2(n); const s = Math.abs(n % 1) < 0.005 ? n.toFixed(0) : (Math.round(n * 10) / 10).toString(); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
const sym = () => (CURRENCIES.find(c => c[0] === S.profile.currency) || ["", ""])[1];
const fmtM = n => { const big = ["IDR","VND","KRW","JPY"].includes(S.profile.currency); return sym() + " " + (+n || 0).toLocaleString("en", {minimumFractionDigits: big ? 0 : 2, maximumFractionDigits: big ? 0 : 2}); };
const liOf = k => LIS.find(l => l.k === k);
const typeOf = k => BANNER_TYPES.find(t => t.k === k) || BANNER_TYPES[0];
const D2W = d => r2(d / CONFIG.diamondsPerWish);

/* ================= state ================= */
function freshState() {
  return {
    v: 2, setupDone: false, updatedAt: 0,
    profile: {currency: "MYR", lis: [], trackStandard: false},
    settings: {theme: "auto", budget: 0, autoIncome: true, extraIncome: 0},
    income: {lastRun: null, amounts: {}, off: {}},
    passes: {},
    pools: {limited: {pity: 0, guar: false, ts: 0}, rerun: {pity: 0, guar: false, ts: 0}, special: {pity: 0, guar: false, ts: 0}, standard: {pity: 0, guar: false, ts: 0}},
    entries: [], banners: [], plans: [], cards: [],
    packs: DEFAULT_PACKS.map(p => ({...p, price: p.myr})),
    images: {header: null, li: {}}
  };
}
let S, storageOK = true;
function normalise(s) {
  const f = freshState();
  s = Object.assign(f, s);
  s.profile = Object.assign(freshState().profile, s.profile);
  s.settings = Object.assign(freshState().settings, s.settings);
  s.income = Object.assign(freshState().income, s.income);
  s.pools = Object.assign(freshState().pools, s.pools);
  s.images = Object.assign({header: null, li: {}}, s.images);
  ["entries", "banners", "plans", "cards"].forEach(k => s[k] = Array.isArray(s[k]) ? s[k] : []);
  if (!Array.isArray(s.packs) || !s.packs.length) s.packs = DEFAULT_PACKS.map(p => ({...p, price: s.profile.currency === "MYR" ? p.myr : null}));
  return s;
}
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { storageOK = false; }
  try { S = raw ? normalise(JSON.parse(raw)) : freshState(); } catch (e) { S = freshState(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); storageOK = true; }
  catch (e) { storageOK = false; }
}
let undoSnap = null;
function act(msg, fn, undoable = true) {
  const before = JSON.stringify(S);
  fn();
  S.updatedAt = Date.now();
  save(); render();
  undoSnap = undoable ? before : null;
  if (msg) toast(msg, undoable);
}
function undo() {
  if (!undoSnap) return;
  S = normalise(JSON.parse(undoSnap)); undoSnap = null; save(); render(); toast("Undone", false);
}

/* ================= derived numbers ================= */
const ordered = () => S.entries.slice().sort((a, b) => a.date.localeCompare(b.date) || (a.ts || 0) - (b.ts || 0));
const newestFirst = () => ordered().reverse();
function delta(e) {
  if (e.kind === "pull") return {ds: e.cur === "emp" ? 0 : -e.pulls, emp: e.cur === "emp" ? -e.pulls : 0};
  return {ds: num(e.wishes), emp: num(e.emp)};
}
function balances() {
  let ds = 0, emp = 0;
  for (const e of S.entries) { const d = delta(e); ds += d.ds; emp += d.emp; }
  return {ds: r2(ds), emp: r2(emp)};
}
function totals() {
  let got = 0, used = 0, spent = 0, bought = 0, est = 0;
  for (const e of S.entries) {
    if (e.kind === "pull") used += e.pulls;
    else if (e.kind !== "adjust" && num(e.wishes) > 0) got += num(e.wishes) + num(e.emp);
    if (e.kind === "purchase") { spent += num(e.amount); bought += num(e.total ?? e.wishes) + num(e.emp); if (e.estimate) est += num(e.amount); }
  }
  return {got: r2(got), used: r2(used), spent: r2(spent), bought: r2(bought), est: r2(est)};
}
const spentIn = m => r2(S.entries.filter(e => e.kind === "purchase" && e.date.startsWith(m) && !e.estimate).reduce((s, e) => s + num(e.amount), 0));
const plannedIn = m => S.plans.filter(p => p.month === m);

/* Pity per pool = the last manual setting, then every pull logged after it, replayed in date order. */
function sessionMath(before, guarBefore, pulls, results) {
  let pity = before, guar = guarBefore, used = 0, warn = "";
  for (const r of results) {
    const d = Math.max(1, num(r.pity));
    const step = d - pity;
    if (step < 1) warn = "A 5★ pity is lower than your pity before it. Check the numbers.";
    used += Math.max(1, step);
    pity = 0;
    if (r.outcome === "lost") guar = true; else if (r.outcome === "win" || r.outcome === "guar") guar = false;
  }
  const left = pulls - used;
  if (left < 0) { warn = "These 5★ pity numbers need more pulls than you entered."; }
  pity = results.length ? Math.max(0, left) : before + pulls;
  if (pity > CONFIG.hardPity) warn = warn || `Pity can't go past ${CONFIG.hardPity}. Check the numbers.`;
  return {pity: Math.min(pity, CONFIG.hardPity), guar, warn};
}
function poolState(pool) {
  const base = S.pools[pool] || {pity: 0, guar: false, ts: 0};
  let pity = num(base.pity), guar = !!base.guar;
  for (const e of ordered()) {
    if (e.kind !== "pull" || e.pool !== pool || (e.ts || 0) <= (base.ts || 0)) continue;
    const r = sessionMath(pity, guar, e.pulls, e.results || []);
    pity = r.pity; guar = r.guar;
  }
  return {pity, guar};
}

/* ================= banners ================= */
function bannerStatus(b) {
  const t = today();
  if (b.end && b.end < t) return "past";
  if (b.start && b.start > t) return "upcoming";
  if (!b.end && b.start && b.start.slice(0, 7) < thisMonth()) return "past";
  return "current";
}
const bannersBy = st => S.banners.filter(b => bannerStatus(b) === st).sort((a, b) => (a.start || "").localeCompare(b.start || ""));
function bannerStats(b) {
  const pulls = S.entries.filter(e => e.kind === "pull" && e.bannerId === b.id);
  const buys = S.entries.filter(e => e.kind === "purchase" && e.bannerId === b.id);
  const res = pulls.flatMap(e => e.results || []);
  return {
    pulls: pulls.reduce((s, e) => s + e.pulls, 0),
    cardPulls: pulls.filter(e => e.purpose === "card").reduce((s, e) => s + e.pulls, 0),
    extraPulls: pulls.filter(e => e.purpose !== "card").reduce((s, e) => s + e.pulls, 0),
    results: res, spent: r2(buys.reduce((s, e) => s + num(e.amount), 0)), bought: r2(buys.reduce((s, e) => s + num(e.wishes), 0))
  };
}
function bannerLabel(b) { return `${typeOf(b.type).n.split(" (")[0]}${b.rerun ? " rerun" : ""}`; }

/* ================= auto income ================= */
const incomeAmt = s => S.income.amounts[s.k] ?? s.d;
const incomeOn = s => !S.income.off[s.k];
const passActive = (k, day) => S.passes[k] && day <= S.passes[k];
function incomeFor(day) {
  const d = parseD(day), lines = {};
  for (const s of INCOME_SOURCES) {
    if (!incomeOn(s)) continue;
    if (s.need && !passActive(s.need, day)) continue;
    if (s.when === "weekly" && d.getDay() !== 1) continue;
    if (s.when === "monthly" && d.getDate() !== 1) continue;
    lines[s.n] = (lines[s.n] || 0) + incomeAmt(s);
  }
  return lines;
}
function monthlyIncomeEstimate() {
  let dia = 0; const t = today();
  for (const s of INCOME_SOURCES) {
    if (!incomeOn(s) || (s.need && !passActive(s.need, t))) continue;
    dia += incomeAmt(s) * (s.when === "daily" ? 30 : s.when === "weekly" ? 4.3 : 1);
  }
  return {auto: S.settings.autoIncome ? D2W(dia) : 0, extra: num(S.settings.extraIncome)};
}
function runAutoIncome(force) {
  if (!S.setupDone) return;
  const t = today();
  if (!S.income.lastRun || !S.settings.autoIncome) { if (S.income.lastRun !== t) { S.income.lastRun = t; save(); } return; }
  if (S.income.lastRun >= t) return;
  const gap = daysBetween(S.income.lastRun, t);
  const lines = {};
  for (let i = 1; i <= gap; i++) for (const [k, v] of Object.entries(incomeFor(addDays(S.income.lastRun, i)))) lines[k] = (lines[k] || 0) + v;
  const dia = Object.values(lines).reduce((a, b) => a + b, 0);
  const from = addDays(S.income.lastRun, 1);
  const apply = () => act(dia ? `Added ${fmtW(D2W(dia))} wishes of daily income` : "", () => {
    if (dia) S.entries.push({id: uid(), ts: Date.now(), kind: "gain", date: t, label: "Auto daily income", source: "Auto daily income", wishes: D2W(dia), diamonds: dia,
      note: `${gap > 1 ? fmtDate(from) + " – " : ""}${fmtDate(t)}: ` + Object.entries(lines).map(([k, v]) => `${k} ${v}`).join(", ")});
    S.income.lastRun = t;
  }, !!dia);
  if (gap > 7 && !force) {
    modal(`<h3>Welcome back</h3><div class="desc">It's been ${gap} days since you last opened ${CONFIG.appName}. Did you log in to the game every day? If yes, ${fmtW(D2W(dia))} wishes (${dia.toLocaleString()} diamonds) of daily income will be added.</div>
      <div class="acts"><button class="btn" data-skip>No, skip it</button><button class="btn primary" data-ok>Yes, add it</button></div>`, el => {
      el.querySelector("[data-skip]").onclick = () => { closeModal(); act("Skipped", () => { S.income.lastRun = t; }, false); };
      el.querySelector("[data-ok]").onclick = () => { closeModal(); apply(); };
    });
  } else apply();
}

/* ================= UI plumbing ================= */
let tab = "home", shopView = "packs", histFilter = "all", histQuery = "", packGroup = "All", colLi = "all", colFilter = "all";
function toast(t, withUndo) {
  document.querySelectorAll(".toast").forEach(x => x.remove());
  const d = document.createElement("div"); d.className = "toast";
  d.innerHTML = `<span>${esc(t)}</span>${withUndo ? `<button>Undo</button>` : ""}`;
  if (withUndo) d.querySelector("button").onclick = () => { d.remove(); undo(); };
  document.body.appendChild(d); setTimeout(() => d.remove(), withUndo ? 5000 : 2400);
}
function modal(html, onMount, wide, reuse) {
  const ex = $("#scrim");
  if (reuse && ex) { const sh = ex.firstChild; sh.className = `sheet ${wide ? "wide" : ""}`; sh.innerHTML = html; sh.scrollTop = 0; onMount && onMount(sh, ex); return; }
  closeModal();
  const s = document.createElement("div"); s.className = "scrim"; s.id = "scrim";
  s.innerHTML = `<div class="sheet ${wide ? "wide" : ""}" role="dialog" aria-modal="true">${html}</div>`;
  s.addEventListener("click", e => { if (e.target === s && !s.dataset.lock) closeModal(); });
  document.body.appendChild(s);
  onMount && onMount(s.firstChild, s);
}
function closeModal() { const s = $("#scrim"); if (s) s.remove(); }
document.addEventListener("keydown", e => { if (e.key === "Escape" && !($("#scrim") || {}).dataset?.lock) closeModal(); });
function confirmBox(title, text, okLabel, fn) {
  modal(`<h3>${esc(title)}</h3><div class="desc">${esc(text)}</div><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn danger" data-ok>${esc(okLabel)}</button></div>`, el => {
    el.querySelector("[data-x]").onclick = closeModal;
    el.querySelector("[data-ok]").onclick = () => { closeModal(); fn(); };
  });
}
function applyTheme() {
  const t = S.settings.theme;
  const dark = t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const mc = document.querySelector('meta[name=theme-color]'); if (mc) mc.content = dark ? "#0e0b18" : "#f6f3fa";
}
if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);
const val = (el, sel) => el.querySelector(sel).value;
const LOGO = `<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d1a48"/><stop offset="1" stop-color="#8a3a6e"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#lg)"/><path d="M32 10l5.5 15.5L53 32l-15.5 5.5L32 54l-5.5-16.5L11 32l15.5-6.5z" fill="#ffe6f2"/><circle cx="48" cy="16" r="2.5" fill="#ffd98a"/></svg>`;
function avatar(k, lg) {
  const l = liOf(k); if (!l) return "";
  const img = S.images.li[k];
  return `<span class="av ${lg ? "lg" : ""}" style="--c:${l.c};${img ? `background-image:url(${img})` : ""}" title="${esc(l.n)}">${img ? "" : l.n[0]}</span>`;
}
const avatars = ks => `<span class="avs">${(ks || []).map(k => avatar(k)).join("")}</span>`;
const liOptions = (sel, allowNone) => (allowNone ? `<option value="">—</option>` : "") + LIS.map(l => `<option value="${l.k}" ${sel === l.k ? "selected" : ""}>${l.n}</option>`).join("");
const myLis = () => S.profile.lis.length ? S.profile.lis : LIS.map(l => l.k);

/* ================= views ================= */
function feedItem(e) {
  const d = delta(e), w = d.ds || d.emp, blue = !d.ds && d.emp;
  let title = e.label || "", sub = [fmtDate(e.date)];
  if (e.kind === "pull") {
    title = e.bannerName || "Pulls";
    const res = (e.results || []).map(r => `5★ ${r.card || liOf(r.li)?.n || ""} @${r.pity}${r.outcome === "lost" ? " (lost)" : ""}`);
    sub.push(PURPOSES.find(p => p.k === e.purpose)?.n.replace("Extra: ", "Extra – ") || "", ...res);
  } else if (e.kind === "gain") sub.push(e.source || "");
  else if (e.kind === "purchase") sub.push(e.estimate ? "Estimate" : e.group || "");
  if (e.note) sub.push(e.note);
  return `<li data-edit="${e.id}" style="cursor:pointer"><div class="dot ${e.kind}">${{purchase: "✦", pull: "✧", gain: "+", adjust: "≈"}[e.kind]}</div>
    <div class="main"><div class="t">${esc(title)}</div><div class="s">${sub.filter(Boolean).map(esc).join(" · ")}</div></div>
    <div class="r">${w ? `<div class="w ${w > 0 ? "plus" : "minus"} ${blue ? "blue" : ""}">${w > 0 ? "+" : "−"}${fmtW(Math.abs(w))}${blue ? " 🔹" : ""}</div>` : `<div class="w muted">—</div>`}
    ${e.kind === "purchase" ? `<div class="m">${fmtM(e.amount)}</div>` : ""}</div></li>`;
}
function pityCards() {
  const pools = ["limited", "rerun"].concat(S.profile.trackStandard ? ["standard"] : []);
  if (S.entries.some(e => e.pool === "special") || S.pools.special.pity) pools.push("special");
  return `<div class="pity">${pools.map(p => { const st = poolState(p), pct = st.pity / CONFIG.hardPity * 100;
    return `<button class="pc" data-pity="${p}"><div class="n">${POOLS[p].n} pity</div><div class="v">${st.pity}<small> / ${CONFIG.hardPity}</small></div>
      <div class="bar"><i class="${st.pity >= CONFIG.softPity ? "soft" : ""}" style="width:${pct}%"></i></div>
      ${POOLS[p].guar ? (st.guar ? `<span class="badge g">Guaranteed next 5★</span>` : `<span class="badge">50/50 next 5★</span>`) : `<span class="badge bl">Blue wishes</span>`}</button>`; }).join("")}</div>`;
}
function luck() {
  const res = S.entries.filter(e => e.kind === "pull").flatMap(e => (e.results || []).map(r => ({...r, pool: e.pool})));
  const lim = res.filter(r => r.pool !== "standard");
  const wins = lim.filter(r => r.outcome === "win").length, lost = lim.filter(r => r.outcome === "lost").length, guar = lim.filter(r => r.outcome === "guar").length;
  const avg = res.length ? res.reduce((s, r) => s + num(r.pity), 0) / res.length : 0;
  const pulls = S.entries.filter(e => e.kind === "pull");
  const extra = pulls.filter(e => e.purpose !== "card").reduce((s, e) => s + e.pulls, 0);
  return {n: res.length, avg, wins, lost, guar, featured: wins + guar, extra, cardPulls: pulls.filter(e => e.purpose === "card").reduce((s, e) => s + e.pulls, 0)};
}
function viewHome() {
  const B = balances(), T = totals(), L = luck(), m = thisMonth(), sm = spentIn(m), bud = num(S.settings.budget);
  const cur = bannersBy("current");
  const img = S.images.header;
  return `
  <div class="card hero ${img ? "img" : ""}" style="${img ? `background-image:url(${img})` : ""}">
    <div class="lbl">Wishes you have</div>
    <div class="big">${fmtW(B.ds)}<small>✦</small></div>
    <div class="sub">${fmtW(B.ds * CONFIG.diamondsPerWish)} diamonds equivalent${T.spent ? ` · ${fmtM(T.spent)} spent` : ""}</div>
    ${S.profile.trackStandard ? `<div class="emp">🔹 ${fmtW(B.emp)} Empyrean wishes</div>` : ""}
    <div class="actions">
      <button class="primary" data-act="pull">Log pulls</button>
      <button data-go="shop">Buy pack</button>
      <button data-act="gain">Free wishes</button>
      <button data-act="match" title="Match the number in your game">Match game</button>
    </div>
  </div>
  <div class="gap"></div>
  <div class="card"><h2>Pity<span class="sp"></span><span class="small muted" style="font-weight:500">Tap to correct</span></h2>${pityCards()}</div>
  <div class="gap"></div>
  <div class="stats">
    <div class="stat"><div class="k">Spent this month</div><div class="v">${fmtM(sm)}</div><div class="h">${bud ? `${fmtM(Math.max(0, bud - sm))} left of ${fmtM(bud)}` : `<a href="#" data-act="budget">Set a monthly budget</a>`}</div>
      ${bud ? `<div class="bar" style="margin-top:8px"><i class="${sm > bud ? "over" : ""}" style="width:${Math.min(100, sm / bud * 100)}%"></i></div>` : ""}</div>
    <div class="stat"><div class="k">Total spent</div><div class="v">${fmtM(T.spent)}</div><div class="h">${T.est ? `incl. ${fmtM(T.est)} estimated` : "&nbsp;"}</div></div>
    <div class="stat"><div class="k">Avg pity for a 5★</div><div class="v">${L.n ? L.avg.toFixed(1) : "–"}</div><div class="h">${L.n} five-stars logged</div></div>
    <div class="stat"><div class="k">50/50 record</div><div class="v">${L.wins + L.lost ? `${L.wins}W · ${L.lost}L` : "–"}</div><div class="h">${L.extra ? `${fmtW(L.extra)} extra pulls (outfits etc.)` : "&nbsp;"}</div></div>
  </div>
  <div class="gap"></div>
  <div class="grid two">
    <div class="card"><h2>Recent activity<span class="sp"></span><button class="btn sm" data-go="history">See all</button></h2>
      ${S.entries.length ? `<ul class="feed">${newestFirst().slice(0, 7).map(feedItem).join("")}</ul>` : `<div class="empty">Nothing logged yet.</div>`}</div>
    <div class="grid" style="align-content:start">
      <div class="card"><h2>Current banners<span class="sp"></span><button class="btn sm" data-go="banners">All banners</button></h2>
        ${cur.length ? `<div class="list">${cur.map(bannerRow).join("")}</div>` : `<div class="empty">No current banner. <a href="#" data-act="newbanner">Add one</a></div>`}</div>
      ${nextBannerCard()}
    </div>
  </div>`;
}
function bannerRow(b) {
  const st = bannerStats(b), got = st.results.some(r => r.outcome !== "lost");
  return `<div class="it" data-banner="${b.id}" style="cursor:pointer">${avatars(b.lis)}
    <div class="main"><div class="t">${esc(b.name)}</div><div class="small muted">${bannerLabel(b)}${b.start ? ` · ${fmtDate(b.start)}${b.end ? " – " + fmtDate(b.end) : ""}` : ""}</div></div>
    <div style="text-align:right"><b>${st.pulls}${b.pulls ? `<span class="muted small"> / ${b.pulls}</span>` : ""}</b><div class="small muted">pulls${got ? " · ✓ got it" : ""}</div></div></div>`;
}
function nextBannerCard() {
  const P = projection(), next = P.rows.find(r => r.banners.length);
  if (!next) return "";
  const bn = next.banners[0];
  return `<div class="card"><h2>Wishes after next banner</h2>
    <div class="row"><div><div style="font-weight:650">${esc(bn.name)}</div><div class="muted small">${fmtMonth(next.m)} · plan ${fmtW(next.need)} pulls</div></div>
    <div style="font-weight:750;font-size:22px" class="${next.end < 0 ? "minus" : "plus"}">${fmtW(next.end)}</div></div>
    ${next.end < 0 ? `<div class="warn" style="margin:10px 0 0">Short by ${fmtW(-next.end)} pulls with what's planned.</div>` : ""}</div>`;
}
function chart(series, h) {
  const W = 600, H = h, pb = 22, pt = 14, b = num(S.settings.budget);
  const max = Math.max(b, ...series.map(s => s.v + Math.max(0, s.p)), 1) * 1.12;
  const bw = W / series.length, y = v => H - pb - (v / max) * (H - pb - pt);
  let g = "";
  series.forEach((s, i) => {
    const x = i * bw + bw * .18, w = bw * .64, cur = s.m === thisMonth(), plan = s.m >= thisMonth() ? s.p : 0;
    if (s.v > 0) g += `<rect x="${x}" y="${y(s.v)}" width="${w}" height="${H - pb - y(s.v)}" rx="5" fill="${b && s.v > b ? "var(--bad)" : "var(--accent)"}"><title>${fmtMonth(s.m)}: ${fmtM(s.v)}</title></rect>`;
    if (plan > 0) g += `<rect x="${x}" y="${y(s.v + plan)}" width="${w}" height="${y(s.v) - y(s.v + plan)}" rx="5" fill="var(--gold)" opacity=".45"><title>Planned: ${fmtM(plan)}</title></rect>`;
    if (s.v > 0) g += `<text x="${x + w / 2}" y="${y(s.v + plan) - 4}" text-anchor="middle">${Math.round(s.v)}</text>`;
    g += `<text x="${x + w / 2}" y="${H - 6}" text-anchor="middle" style="${cur ? "fill:var(--text);font-weight:700" : ""}">${MONTHS[+s.m.slice(5) - 1]}</text>`;
  });
  if (b) g += `<line x1="0" x2="${W}" y1="${y(b)}" y2="${y(b)}" stroke="var(--text)" stroke-dasharray="4 4" opacity=".5"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Monthly spending">${g}</svg>
    <div class="legend"><span style="--c:var(--accent)">Spent</span><span style="--c:var(--gold)">Planned</span>${b ? `<span style="--c:var(--text)">Budget</span>` : ""}</div>`;
}
const series = n => Array.from({length: n}, (_, i) => { const m = addMonth(thisMonth(), i - n + 1); return {m, v: spentIn(m), p: r2(plannedIn(m).reduce((s, p) => s + num(p.price), 0))}; });

function projection() {
  const m0 = thisMonth(), inc = monthlyIncomeEstimate();
  const live = S.banners.filter(b => bannerStatus(b) !== "past" && (b.start || m0).slice(0, 7) >= m0 || bannerStatus(b) === "current");
  const months = [...live.map(b => (b.start || today()).slice(0, 7)), ...S.plans.map(p => p.month)].filter(m => m >= m0).sort();
  const last = months.length ? months[months.length - 1] : m0;
  const rows = []; let bal = balances().ds;
  const dim = new Date(+m0.slice(0, 4), +m0.slice(5), 0).getDate(), left = (dim - new Date().getDate()) / dim;
  const gainedNow = S.entries.filter(e => e.kind === "gain" && e.source !== "Auto daily income" && e.date.startsWith(m0)).reduce((s, e) => s + num(e.wishes), 0);
  for (let m = m0; m <= last && rows.length < 36; m = addMonth(m, 1)) {
    const income = m === m0 ? inc.auto * left + Math.max(0, inc.extra - gainedNow) : inc.auto + inc.extra;
    const pl = plannedIn(m), bn = live.filter(b => (b.start || today()).slice(0, 7) === (m === m0 && bannerStatus(b) === "current" ? (b.start || today()).slice(0, 7) : m));
    const packs = pl.reduce((s, p) => s + num(p.wishes), 0), free = bn.reduce((s, b) => s + num(b.free), 0);
    const need = bn.reduce((s, b) => s + Math.max(0, num(b.pulls) - bannerStats(b).pulls), 0);
    const end = r2(bal + income + packs + free - need);
    rows.push({m, start: r2(bal), inc: r2(income), packs, free, need, end, cost: r2(pl.reduce((s, p) => s + num(p.price), 0)), banners: bn});
    bal = end;
  }
  return {rows, inc};
}

function viewBanners() {
  const sec = (st, title) => { const l = bannersBy(st); return `<div class="card"><h2>${title}<span class="sp"></span>${st !== "past" ? `<button class="btn sm" data-act="newbanner">+ Add</button>` : ""}</h2>
    ${l.length ? `<div class="list">${(st === "past" ? l.reverse() : l).map(bannerRow).join("")}</div>` : `<div class="empty">None yet.</div>`}</div>`; };
  const P = projection();
  return `${sec("current", "Current")}<div class="gap"></div>${sec("upcoming", "Upcoming")}<div class="gap"></div>
  <div class="card"><h2>Wish projection<span class="sp"></span><button class="btn sm" data-act="income">Income settings</button></h2>
    <div class="small muted" style="margin-bottom:6px">Free income ≈ ${fmtW(P.inc.auto + P.inc.extra)} wishes a month (${fmtW(P.inc.auto)} daily income + ${fmtW(P.inc.extra)} farming/events).</div>
    <div class="tablewrap"><table class="t proj"><thead><tr><th>Month</th><th>Start</th><th>Free</th><th>Packs</th><th>Event</th><th>Pulls</th><th>End</th><th>Cost</th></tr></thead><tbody>
    ${P.rows.map(r => `<tr><td>${fmtMonth(r.m)}${r.banners.length ? `<div class="small muted">${r.banners.map(b => esc(b.name)).join(", ")}</div>` : ""}</td><td>${fmtW(r.start)}</td><td class="plus">+${fmtW(r.inc)}</td><td>${r.packs ? "+" + fmtW(r.packs) : "–"}</td><td>${r.free ? "+" + fmtW(r.free) : "–"}</td><td>${r.need ? "−" + fmtW(r.need) : "–"}</td><td class="${r.end < 0 ? "neg" : "pos"}">${fmtW(r.end)}</td><td>${r.cost ? fmtM(r.cost) : "–"}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="small muted" style="margin-top:6px">"Pulls" is what you plan to use on each banner minus what you've already logged. Rough guide (average luck): Myth R0 ≈ 150, Solo R0 ≈ 96, Multi R0 ≈ 104.</div></div>
  <div class="gap"></div>${sec("past", "Past")}`;
}

function viewShop() {
  return `<div class="toolbar"><div class="seg">${[["packs", "Packs"], ["budget", "Budget & plans"], ["breakdown", "Spending breakdown"]].map(([k, l]) => `<button class="${shopView === k ? "on" : ""}" data-shop="${k}">${l}</button>`).join("")}</div></div>
    ${shopView === "packs" ? viewPacks() : shopView === "budget" ? viewBudget() : viewBreakdown()}`;
}
function viewPacks() {
  const groups = [...new Set(S.packs.map(p => p.group))];
  const shown = packGroup === "All" ? groups : groups.filter(g => g === packGroup);
  return `<div class="chips" style="margin-bottom:10px">${["All", ...groups].map(g => `<button class="chip ${g === packGroup ? "on" : ""}" data-pg="${esc(g)}">${esc(g)}</button>`).join("")}</div>
  <p class="muted small" style="margin:0 0 12px">Tap a pack to buy it (adds the wishes and the cost) or plan it for later.${S.profile.currency !== "MYR" ? " Prices start empty for your currency; enter the price the first time you buy." : ""}</p>
  ${passStatus()}
  ${shown.map(g => `<div class="packgroup"><h3>${esc(g)}</h3><div class="packs">
    ${S.packs.filter(p => p.group === g).map(p => `<button class="pack" data-pack="${p.id}"><span class="n">${esc(p.name)}</span>
      <span class="w">+${fmtW(p.total ?? p.wishes)} ✦${p.emp ? ` <span class="blue">+${p.emp} 🔹</span>` : ""}</span><span class="p">${p.price != null ? fmtM(p.price) : `<span class="muted">Set price</span>`}</span>
      <span class="e">${p.price && (p.total ?? p.wishes) ? fmtM(p.price / (p.total ?? p.wishes)) + " / wish" : ""}${p.limit ? ` · limit ${esc(p.limit)}` : ""}</span></button>`).join("")}
    </div></div>`).join("")}
  <div class="packs"><button class="pack add" data-act="newpack">+ Add custom pack</button></div>`;
}
function passStatus() {
  const t = today(), act = Object.entries(S.passes).filter(([k, v]) => v && v >= t && PASSES[k]);
  if (!act.length) return "";
  return `<div class="note" style="margin-bottom:14px"><b>Active passes:</b> ${act.map(([k, v]) => `${PASSES[k].n} (${daysBetween(t, v)} days left)`).join(" · ")}</div>`;
}
function viewBudget() {
  const m = thisMonth(), b = num(S.settings.budget), sm = spentIn(m), plCost = r2(plannedIn(m).reduce((s, p) => s + num(p.price), 0)), after = r2(sm + plCost);
  const up = S.plans.slice().sort((a, b) => a.month.localeCompare(b.month)), yr = m.slice(0, 4);
  const spentYr = r2(S.entries.filter(e => e.kind === "purchase" && !e.estimate && e.date.startsWith(yr)).reduce((s, e) => s + num(e.amount), 0));
  const pct = v => Math.min(100, b ? v / b * 100 : 0);
  return `<div class="grid two">
    <div class="card"><h2>Budget · ${fmtMonth(m)}<span class="sp"></span><button class="btn sm" data-act="budget">${b ? "Edit" : "Set budget"}</button></h2>
      ${b ? `<div class="row"><span class="muted">Spent</span><b>${fmtM(sm)}</b></div><div class="row"><span class="muted">Still planned</span><b>${fmtM(plCost)}</b></div>
        <div class="bar" style="margin:10px 0 6px;height:12px"><i class="${sm > b ? "over" : ""}" style="width:${pct(sm)}%"></i>${plCost ? `<i class="plan" style="left:${pct(sm)}%;width:${Math.max(0, pct(after) - pct(sm))}%"></i>` : ""}</div>
        <div class="row small"><span class="muted">Budget ${fmtM(b)}</span><b class="${after > b ? "minus" : "plus"}">${after > b ? `Over by ${fmtM(after - b)} if you buy everything planned` : `${fmtM(b - after)} left after planned buys`}</b></div>`
      : `<div class="cta"><div class="main"><b>No monthly budget yet.</b><div class="small muted">Set one to see what's left each month and whether planned packs fit.</div></div><button class="btn primary sm" data-act="budget">Set budget</button></div>`}
      <div class="row" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line)"><span class="muted">Spent in ${yr}</span><b>${fmtM(spentYr)}</b></div>
      <div class="row"><span class="muted">All planned purchases ahead</span><b>${fmtM(up.filter(p => p.month >= m).reduce((s, p) => s + num(p.price), 0))}</b></div></div>
    <div class="card"><h2>Monthly spending</h2>${chart(series(12), 200)}</div>
  </div><div class="gap"></div>
  <div class="card"><h2>Planned purchases<span class="sp"></span><button class="btn sm" data-act="newplan">+ Add</button></h2>
    ${up.length ? `<div class="list">${up.map(p => `<div class="it"><div class="main"><div class="t">${esc(p.name)}${p.repeat ? ` <span class="badge">monthly</span>` : ""}</div>
      <div class="small muted">${fmtMonth(p.month)}${p.wishes ? ` · +${fmtW(p.wishes)} wishes` : ""}${p.month < m ? ` · <span class="minus">overdue</span>` : ""}</div></div>
      <b>${fmtM(p.price)}</b><button class="btn sm primary" data-buyplan="${p.id}">Bought</button><button class="btn sm" data-editplan="${p.id}">Edit</button></div>`).join("")}</div>`
    : `<div class="empty">Nothing planned. Tap a pack and choose "Plan for later", or add one here.</div>`}</div>`;
}
function viewBreakdown() {
  const P = S.entries.filter(e => e.kind === "purchase");
  const tot = P.reduce((s, e) => s + num(e.amount), 0) || 1;
  const by = key => { const o = {}; P.forEach(e => { const k = key(e) || "Other"; o[k] = o[k] || {rm: 0, w: 0, n: 0}; o[k].rm += num(e.amount); o[k].w += num(e.total ?? e.wishes); o[k].n++; }); return Object.entries(o).sort((a, b) => b[1].rm - a[1].rm); };
  const tbl = rows => `<div class="tablewrap"><table class="t"><thead><tr><th>Type</th><th>Buys</th><th>Wishes</th><th>Spent</th><th>Share</th></tr></thead><tbody>
    ${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v.n}</td><td>${fmtW(v.w)}</td><td>${fmtM(v.rm)}</td><td style="min-width:80px"><div class="bar" style="height:8px"><i style="width:${v.rm / tot * 100}%"></i></div></td></tr>`).join("")}</tbody></table></div>`;
  const L = luck(), T = totals();
  return `<div class="stats" style="margin-bottom:12px">
    <div class="stat"><div class="k">Total spent</div><div class="v">${fmtM(T.spent)}</div><div class="h">${T.est ? `${fmtM(T.est)} is estimated` : "&nbsp;"}</div></div>
    <div class="stat"><div class="k">Wishes bought</div><div class="v">${fmtW(T.bought)}</div><div class="h">${T.bought ? fmtM((T.spent - T.est) / T.bought) + " per wish" : "&nbsp;"}</div></div>
    <div class="stat"><div class="k">Featured 5★ won</div><div class="v">${L.featured}</div><div class="h">${L.featured ? fmtM(T.spent / L.featured) + " each" : "&nbsp;"}</div></div>
    <div class="stat"><div class="k">Extra pulls</div><div class="v">${fmtW(L.extra)}</div><div class="h">outfits, poses, ranks</div></div></div>
  <div class="grid two"><div class="card"><h2>By pack type</h2>${P.length ? tbl(by(e => e.group)) : `<div class="empty">No purchases yet.</div>`}</div>
    <div class="card"><h2>By pack</h2>${P.length ? tbl(by(e => (e.group && e.group.includes("banner") ? e.group + " · " : "") + (e.label || "").replace(/^\d+× /, ""))) : `<div class="empty">No purchases yet.</div>`}</div></div>`;
}

function viewCollection() {
  const lis = myLis();
  let cards = S.cards.filter(c => (colLi === "all" || c.li === colLi) && (colFilter === "all" || (colFilter === "owned" ? c.owned : colFilter === "wanted" ? c.wanted : true)));
  cards.sort((a, b) => (b.rarity - a.rarity) || a.li.localeCompare(b.li) || a.name.localeCompare(b.name));
  return `<div class="card"><h2>My love interests<span class="sp"></span><button class="btn sm" data-act="lis">Edit</button></h2>
    <div class="lirow">${lis.map(k => { const own = S.cards.filter(c => c.li === k && c.owned && c.rarity === 5).length;
      return `<button class="lichip ${colLi === k ? "on" : ""}" style="--c:${liOf(k).c}" data-colli="${k}">${avatar(k, true)}<span>${liOf(k).n}</span><span class="small muted">${own} × 5★</span></button>`; }).join("")}
      <button class="lichip ${colLi === "all" ? "on" : ""}" style="--c:var(--accent)" data-colli="all"><span class="av lg" style="--c:var(--accent)">✦</span><span>All</span><span class="small muted">${S.cards.filter(c => c.owned && c.rarity === 5).length} × 5★</span></button></div></div>
  <div class="gap"></div>
  <div class="toolbar"><div class="seg">${[["all", "All"], ["owned", "Owned"], ["wanted", "Wishlist"]].map(([k, l]) => `<button class="${colFilter === k ? "on" : ""}" data-colf="${k}">${l}</button>`).join("")}</div><span class="sp"></span><button class="btn sm primary" data-act="newcard">+ Add card</button></div>
  ${cards.length ? `<div class="cards">${cards.map(c => `<button class="cardit ${c.owned ? "" : "notowned"}" style="--c:${liOf(c.li)?.c}" data-card="${c.id}">
    <div class="small muted">${liOf(c.li)?.n || ""} · ${c.rarity}★</div><div class="t">${esc(c.name)}</div>
    <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">${c.owned ? `<span class="badge g">Owned R${c.rank || 0}</span>` : `<span class="badge">Not owned</span>`}${c.wanted ? `<span class="badge y">Wishlist</span>` : ""}</div>
    ${c.banner ? `<div class="small muted" style="margin-top:4px">${esc(c.banner)}</div>` : ""}</button>`).join("")}</div>`
  : `<div class="card"><div class="empty">No cards here yet. 5★ cards you log from pulls are added automatically, and you can add cards you own or want (for reruns) with "+ Add card".</div></div>`}
  <p class="small muted">A full list of every card in the game is coming in a later update.</p>`;
}

function viewHistory() {
  const q = histQuery.trim().toLowerCase();
  const list = newestFirst().filter(e => (histFilter === "all" || e.kind === histFilter) && (!q || `${e.label} ${e.note} ${e.group} ${e.source} ${e.bannerName} ${(e.results || []).map(r => r.card).join(" ")}`.toLowerCase().includes(q)));
  const byM = {}; list.forEach(e => (byM[e.date.slice(0, 7)] = byM[e.date.slice(0, 7)] || []).push(e));
  return `<div class="toolbar"><div class="seg">${[["all", "All"], ["pull", "Pulls"], ["purchase", "Purchases"], ["gain", "Free"], ["adjust", "Adjust"]].map(([k, l]) => `<button class="${histFilter === k ? "on" : ""}" data-hf="${k}">${l}</button>`).join("")}</div>
    <input class="search" id="hq" placeholder="Search, e.g. Caleb" value="${esc(histQuery)}"><button class="btn sm" data-act="csv">Export CSV</button></div>
  ${Object.keys(byM).length ? Object.entries(byM).map(([m, es]) => { const used = es.filter(e => e.kind === "pull").reduce((s, e) => s + e.pulls, 0), rm = es.reduce((s, e) => s + (e.kind === "purchase" ? num(e.amount) : 0), 0);
    return `<div class="card" style="margin-bottom:12px"><h2>${fmtMonth(m)}<span class="sp"></span><span class="small muted" style="font-weight:500">${used ? `${fmtW(used)} pulls` : ""}${used && rm ? " · " : ""}${rm ? fmtM(rm) : ""}</span></h2><ul class="feed">${es.map(feedItem).join("")}</ul></div>`; }).join("")
  : `<div class="card"><div class="empty">No entries match.</div></div>`}
  <p class="small muted">Tap any entry to edit or delete it.</p>`;
}

function viewSettings() {
  const inc = monthlyIncomeEstimate();
  return `<div class="grid two">
  <div class="card"><h2>Profile</h2>
    <div class="row"><span class="muted">Currency</span><b>${S.profile.currency} (${sym()})</b></div>
    <div class="row"><span class="muted">Love interests</span>${avatars(myLis())}</div>
    <div class="row"><span class="muted">Track standard banner (blue wishes)</span><b>${S.profile.trackStandard ? "On" : "Off"}</b></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" data-act="profile">Edit profile</button><button class="btn sm" data-act="lis">Love interests & pictures</button></div></div>
  <div class="card"><h2>Free income</h2>
    <div class="row"><span class="muted">Auto daily income</span><b>${S.settings.autoIncome ? "On" : "Off"}</b></div>
    <div class="row"><span class="muted">≈ per month</span><b>${fmtW(inc.auto + inc.extra)} wishes</b></div>
    <div style="margin-top:10px"><button class="btn sm" data-act="income">Edit income & passes</button></div></div>
  <div class="card"><h2>Look</h2>
    <div class="seg">${["auto", "light", "dark"].map(t => `<button class="${S.settings.theme === t ? "on" : ""}" data-theme="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn sm" data-act="headerimg">${S.images.header ? "Change" : "Add"} header picture</button>${S.images.header ? `<button class="btn sm" data-act="rmheader">Remove</button>` : ""}</div>
    <div class="small muted" style="margin-top:6px">Pictures stay on this device only.</div></div>
  <div class="card"><h2>Spending</h2>
    <div class="row"><span class="muted">Monthly budget</span><b>${S.settings.budget ? fmtM(S.settings.budget) : "Not set"}</b></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" data-act="budget">Edit budget</button><button class="btn sm" data-act="estimate">Estimate past spending</button></div></div>
  <div class="card"><h2>Backup & devices</h2>
    <p class="small muted" style="margin-top:0">Your data is saved in this browser. To move it to another device, download a backup here and restore it there. A sync code is coming in a later update.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="backup">Download backup</button><button class="btn sm" data-act="restore">Restore backup</button><button class="btn sm" data-act="csv">Export CSV</button></div></div>
  <div class="card"><h2>Fix things</h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="match">Match wishes to game</button><button class="btn sm" data-pity="limited">Correct pity</button><button class="btn sm" data-act="setup">Run setup again</button><button class="btn sm danger" data-act="wipe">Delete all data</button></div></div>
  </div>`;
}
function footer() {
  return `<footer class="credit"><b>${CONFIG.appName}</b> · ${CONFIG.tagline}<br>Made by <a href="${CONFIG.authorUrl}" target="_blank" rel="noopener">${CONFIG.author}</a> · <a href="${CONFIG.githubUrl}" target="_blank" rel="noopener">GitHub</a> · v${CONFIG.version}<br>
    Unofficial fan-made tool. Not affiliated with or endorsed by Infold Games or Papergames. Love and Deepspace and related names belong to their owners.<br>© ${new Date().getFullYear()} ${CONFIG.author}. All rights reserved.
    ${CONFIG.kofiUrl ? `<br><a class="btn sm kofi" href="${CONFIG.kofiUrl}" target="_blank" rel="noopener">☕ Support ${CONFIG.appName}</a>` : ""}</footer>`;
}

const TABS = [["home", "⌂", "Home"], ["banners", "✧", "Banners"], ["shop", "✦", "Shop"], ["collection", "❖", "Cards"], ["history", "☰", "History"]];
function render() {
  applyTheme();
  const views = {home: viewHome, banners: viewBanners, shop: viewShop, collection: viewCollection, history: viewHistory, settings: viewSettings};
  const titles = {banners: "Banners", shop: "Shop & budget", collection: "Cards", history: "History", settings: "Settings"};
  const B = balances();
  $("#app").innerHTML = `<header class="top"><h1>${LOGO}<span>${titles[tab] || CONFIG.appName}</span>${tab === "home" ? `<small>${CONFIG.tagline}</small>` : ""}</h1>
      ${tab !== "home" ? `<button class="iconbtn" data-go="home"><b>${fmtW(B.ds)}</b> ✦</button>` : ""}
      <button class="iconbtn" data-act="theme" aria-label="Dark mode">${document.documentElement.dataset.theme === "dark" ? "☀" : "☾"}</button>
      <button class="iconbtn" data-go="settings" aria-label="Settings">⚙</button></header>
    ${storageOK ? "" : `<div class="warn">This browser is blocking storage, so changes won't be kept. Download a backup from Settings to keep a copy.</div>`}
    ${views[tab]()}${footer()}`;
  $("#tabs").innerHTML = TABS.map(([k, ic, l]) => `<button class="${tab === k ? "on" : ""}" data-go="${k}"><span class="ic">${ic}</span>${l}</button>`).join("");
  const hq = $("#hq"); if (hq) hq.oninput = e => { histQuery = e.target.value; const p = e.target.selectionStart; render(); const n = $("#hq"); n.focus(); n.setSelectionRange(p, p); };
}

/* ================= forms ================= */
function pullForm(e, presetBanner) {
  const edit = !!e;
  const live = S.banners.filter(b => bannerStatus(b) === "current").concat(bannersBy("upcoming"), bannersBy("past").reverse());
  let bId = e ? e.bannerId || "" : (presetBanner || bannersBy("current")[0]?.id || "");
  let results = e ? JSON.parse(JSON.stringify(e.results || [])) : [];
  modal(`<h3>${edit ? "Edit pulls" : "Log pulls"}</h3><div class="desc">Pulls come off your wishes and your pity moves on. Pity carries over to the next banner in the same pool.</div>
    <div class="field"><label>Banner</label><select id="f_b">${live.map(b => `<option value="${b.id}" ${b.id === bId ? "selected" : ""}>${esc(b.name)} (${bannerLabel(b)})</option>`).join("")}
      ${S.profile.trackStandard ? `<option value="std" ${bId === "std" ? "selected" : ""}>Standard (Xspace Echo)</option>` : ""}<option value="" ${!bId ? "selected" : ""}>Other banner…</option></select></div>
    <div id="otherb" class="fields2"><div class="field"><label>Banner type</label><select id="f_t">${BANNER_TYPES.map(t => `<option value="${t.k}" ${e?.bannerType === t.k ? "selected" : ""}>${t.n}</option>`).join("")}</select></div>
      <div class="field"><label>Name (optional)</label><input id="f_bn" value="${esc(e && !e.bannerId ? e.bannerName : "")}"></div>
      <label class="check" style="grid-column:1/-1;border:none;padding:0 0 10px"><input type="checkbox" id="f_rr" ${e?.rerun ? "checked" : ""}><span class="main">This is a rerun</span></label></div>
    <div class="fields2"><div class="field"><label>Pulls used</label><input id="f_p" type="number" inputmode="numeric" min="1" value="${e ? e.pulls : ""}" placeholder="e.g. 10"></div>
      <div class="field"><label>Date</label><input id="f_d" type="date" value="${e ? e.date : today()}"></div></div>
    <div class="chips" style="margin:-4px 0 12px">${[1, 10, 20, 50, 70].map(n => `<button class="chip" data-q="${n}">${n}</button>`).join("")}</div>
    <div class="field"><label>Why these pulls?</label><select id="f_pu">${PURPOSES.map(p => `<option value="${p.k}" ${e?.purpose === p.k ? "selected" : ""}>${p.n}</option>`).join("")}</select></div>
    <div class="lbl2" style="margin-bottom:6px">5★ cards from these pulls</div><div id="res"></div>
    <button class="btn sm" data-addres style="margin-bottom:12px">+ Got a 5★</button>
    <div class="summary" id="sum"></div>
    <div class="field"><label>Note (optional)</label><input id="f_n" value="${esc(e?.note || "")}"></div>
    <div class="acts">${edit ? `<button class="btn danger" data-del>Delete</button>` : `<button class="btn" data-x>Cancel</button>`}<button class="btn primary" data-ok>Save</button></div>`, el => {
    const sel = el.querySelector("#f_b"), other = el.querySelector("#otherb");
    const ctx = () => {
      const v = sel.value;
      if (v === "std") return {type: "standard", rerun: false, lis: [], name: "Standard (Xspace Echo)"};
      const b = S.banners.find(x => x.id === v);
      if (b) return {type: b.type, rerun: !!b.rerun, lis: b.lis || [], name: b.name, id: b.id};
      return {type: val(el, "#f_t"), rerun: el.querySelector("#f_rr").checked, lis: [], name: val(el, "#f_bn").trim() || typeOf(val(el, "#f_t")).n.split(" (")[0] + " banner"};
    };
    const before = () => {
      const c = ctx(), pool = poolFor(c.type, c.rerun);
      if (!edit) return {pool, ...poolState(pool)};
      // when editing, pity before = replay up to this entry
      const base = S.pools[pool]; let pity = num(base.pity), guar = !!base.guar;
      for (const x of ordered()) { if (x.id === e.id) break; if (x.kind === "pull" && x.pool === pool && (x.ts || 0) > (base.ts || 0)) { const r = sessionMath(pity, guar, x.pulls, x.results || []); pity = r.pity; guar = r.guar; } }
      return {pool, pity, guar};
    };
    const drawRes = () => {
      const c = ctx(), multi = c.type === "multi", std = c.type === "standard";
      el.querySelector("#res").innerHTML = results.map((r, i) => `<div class="result" data-i="${i}">
        <div class="fields2"><div class="field"><label>Love interest</label><select data-k="li">${liOptions(r.li, true)}</select></div>
        <div class="field"><label>Pity it dropped at</label><input data-k="pity" type="number" inputmode="numeric" min="1" max="${CONFIG.hardPity}" value="${r.pity ?? ""}"></div></div>
        <div class="field"><label>Card name</label><input data-k="card" value="${esc(r.card || "")}" list="dl_cards" placeholder="e.g. Loneroad Together"></div>
        ${std ? "" : `<div class="field"><label>Result</label><select data-k="outcome">
          <option value="win" ${r.outcome === "win" ? "selected" : ""}>${multi ? "Won – one of my picked cards" : "Won the 50/50 – featured card"}</option>
          <option value="lost" ${r.outcome === "lost" ? "selected" : ""}>${multi ? "Lost – got a standard card" : "Lost the 50/50 – off-banner card"}</option>
          <option value="guar" ${r.outcome === "guar" ? "selected" : ""}>Guaranteed – featured card</option></select></div>`}
        <button class="btn sm" data-rm="${i}">Remove</button></div>`).join("") + `<datalist id="dl_cards">${S.cards.map(cd => `<option value="${esc(cd.name)}">`).join("")}</datalist>`;
      el.querySelectorAll(".result [data-k]").forEach(inp => inp.oninput = inp.onchange = () => { const i = +inp.closest(".result").dataset.i; results[i][inp.dataset.k] = inp.dataset.k === "pity" ? num(inp.value) : inp.value; sum(); });
      el.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { results.splice(+b.dataset.rm, 1); drawRes(); sum(); });
    };
    const sum = () => {
      const c = ctx(), b = before(), p = num(val(el, "#f_p")), r = sessionMath(b.pity, b.guar, p, results), cur = c.type === "standard" && S.profile.trackStandard ? "emp" : "ds";
      other.style.display = sel.value ? "none" : "";
      el.querySelector("#sum").innerHTML = `<div class="row"><span>${POOLS[b.pool].n} pity</span><b>${b.pity} → ${r.pity}</b></div>
        ${POOLS[b.pool].guar ? `<div class="row"><span>Next 5★</span><b>${b.guar ? "Guaranteed" : "50/50"} → ${r.guar ? "<span class='plus'>Guaranteed</span>" : "50/50"}</b></div>` : ""}
        <div class="row"><span>${cur === "emp" ? "Blue wishes" : "Wishes"} left</span><b>${fmtW((cur === "emp" ? balances().emp : balances().ds) + (edit ? e.pulls : 0) - p)}</b></div>
        ${r.warn ? `<div class="warn" style="margin:8px 0 0">${esc(r.warn)}</div>` : ""}`;
    };
    el.querySelector("[data-addres]").onclick = () => {
      const c = ctx(), b = before(), prev = sessionMath(b.pity, b.guar, num(val(el, "#f_p")), results);
      const guarNow = results.length ? results[results.length - 1].outcome === "lost" : b.guar;
      results.push({li: c.lis[0] || (S.profile.lis.length === 1 ? S.profile.lis[0] : ""), pity: Math.min(CONFIG.hardPity, results.length ? Math.max(1, prev.pity) : b.pity + num(val(el, "#f_p"))), card: "", outcome: c.type === "standard" ? "std" : guarNow ? "guar" : "win"});
      drawRes(); sum();
    };
    el.querySelectorAll("[data-q]").forEach(c => c.onclick = () => { el.querySelector("#f_p").value = c.dataset.q; sum(); });
    ["#f_p", "#f_t", "#f_rr", "#f_bn"].forEach(s => { const i = el.querySelector(s); i.oninput = i.onchange = sum; });
    sel.onchange = () => { drawRes(); sum(); };
    drawRes(); sum();
    el.querySelector("[data-x]") && (el.querySelector("[data-x]").onclick = closeModal);
    el.querySelector("[data-del]") && (el.querySelector("[data-del]").onclick = () => { closeModal(); act("Pulls deleted", () => { S.entries = S.entries.filter(x => x.id !== e.id); }); });
    el.querySelector("[data-ok]").onclick = () => {
      const c = ctx(), p = num(val(el, "#f_p"));
      if (!(p > 0)) return toast("Enter how many pulls you used");
      if (results.some(r => !(num(r.pity) > 0))) return toast("Enter the pity each 5★ dropped at");
      const entry = {kind: "pull", date: val(el, "#f_d") || today(), bannerId: c.id || "", bannerName: c.name, bannerType: c.type, rerun: c.rerun, pool: poolFor(c.type, c.rerun),
        pulls: p, purpose: val(el, "#f_pu"), results: results.map(r => ({...r, pity: num(r.pity)})), cur: c.type === "standard" && S.profile.trackStandard ? "emp" : "ds", note: val(el, "#f_n").trim()};
      closeModal();
      act(edit ? "Pulls updated" : `Logged ${p} pulls${results.length ? ` · ${results.length} × 5★` : ""}`, () => {
        if (edit) Object.assign(S.entries.find(x => x.id === e.id), entry);
        else S.entries.push({id: uid(), ts: Date.now(), ...entry});
        if (!edit) for (const r of entry.results) addCardFromPull(r, c);
      });
    };
  });
}
function addCardFromPull(r, c) {
  if (!r.card || !r.li) return;
  const ex = S.cards.find(x => x.li === r.li && x.name.toLowerCase() === r.card.trim().toLowerCase());
  if (ex) { if (ex.owned) ex.rank = Math.min(3, num(ex.rank) + 1); else { ex.owned = true; ex.rank = 0; ex.wanted = false; } }
  else S.cards.push({id: uid(), li: r.li, name: r.card.trim(), rarity: 5, banner: c.name, owned: true, rank: 0, wanted: false});
}
function gainForm(e) {
  const edit = !!e;
  modal(`<h3>${edit ? "Edit free wishes" : "Add free wishes"}</h3><div class="desc">Wishes from playing, events or rewards. No money spent.</div>
    <div class="field"><label>Where from</label><select id="f_s">${FREE_SOURCES.concat(edit && !FREE_SOURCES.includes(e.source) ? [e.source] : []).map(s => `<option ${e?.source === s ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></div>
    <div class="fields2"><div class="field"><label>Wishes</label><input id="f_w" type="number" inputmode="decimal" step="any" value="${e ? (e.wishes || "") : ""}" placeholder="e.g. 10"></div>
    <div class="field"><label>or Diamonds</label><input id="f_dm" type="number" inputmode="numeric" placeholder="150 = 1 wish"></div></div>
    ${S.profile.trackStandard ? `<div class="field"><label>Blue (Empyrean) wishes</label><input id="f_emp" type="number" inputmode="decimal" value="${e?.emp || ""}" placeholder="0"></div>` : ""}
    <div class="fields2"><div class="field"><label>Note (optional)</label><input id="f_n" value="${esc(e?.note || "")}"></div><div class="field"><label>Date</label><input id="f_d" type="date" value="${e ? e.date : today()}"></div></div>
    <div class="acts">${edit ? `<button class="btn danger" data-del>Delete</button>` : `<button class="btn" data-x>Cancel</button>`}<button class="btn primary" data-ok>Save</button></div>`, el => {
    const w = el.querySelector("#f_w"), dm = el.querySelector("#f_dm");
    dm.oninput = () => { w.value = dm.value ? D2W(dm.value) : ""; };
    el.querySelector("[data-x]") && (el.querySelector("[data-x]").onclick = closeModal);
    el.querySelector("[data-del]") && (el.querySelector("[data-del]").onclick = () => { closeModal(); act("Deleted", () => { S.entries = S.entries.filter(x => x.id !== e.id); }); });
    el.querySelector("[data-ok]").onclick = () => {
      const v = r2(w.value), emp = el.querySelector("#f_emp") ? r2(val(el, "#f_emp")) : 0;
      if (!(v > 0) && !(emp > 0)) return toast("Enter wishes or diamonds");
      const src = val(el, "#f_s"), en = {kind: "gain", date: val(el, "#f_d") || today(), source: src, label: src, wishes: v, emp, note: val(el, "#f_n").trim()};
      closeModal();
      act(edit ? "Saved" : `Added ${fmtW(v)} wishes`, () => { if (edit) Object.assign(S.entries.find(x => x.id === e.id), en); else S.entries.push({id: uid(), ts: Date.now(), ...en}); });
    };
  });
}
function buyForm(p, presetBanner) {
  let q = 1;
  const linkable = S.banners.filter(b => bannerStatus(b) !== "past");
  const isBannerPack = /banner/i.test(p.group);
  const guess = presetBanner || (isBannerPack ? (linkable.find(b => bannerStatus(b) === "current" && (p.group.toLowerCase().startsWith(b.rerun ? "rerun" : typeOf(b.type).n.toLowerCase()))) || linkable.find(b => bannerStatus(b) === "current"))?.id : "");
  modal(`<h3>${esc(p.group)} · ${esc(p.name)}</h3><div class="desc">${fmtW(p.total ?? p.wishes)} wishes${p.emp ? ` + ${p.emp} blue` : ""}${p.limit ? ` · limit ${esc(p.limit)}` : ""}${p.note ? ` · ${esc(p.note)}` : ""}</div>
    <div class="fields2"><div class="field"><label>Quantity</label><div class="stepper"><button data-m>−</button><span class="q" id="qv">1</span><button data-p>+</button></div></div>
    <div class="field"><label>Price each (${sym()})</label><input id="f_pr" type="number" inputmode="decimal" step="0.01" value="${p.price ?? ""}" placeholder="Enter price"></div></div>
    ${linkable.length ? `<div class="field"><label>For banner (optional)</label><select id="f_bn"><option value="">—</option>${linkable.map(b => `<option value="${b.id}" ${b.id === guess ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select></div>` : ""}
    <div class="summary" id="sum"></div>
    <div class="fields2"><div class="field"><label>Note (optional)</label><input id="f_n"></div><div class="field"><label>Date</label><input id="f_d" type="date" value="${today()}"></div></div>
    <div class="acts"><button class="btn" data-plan>Plan for later</button><button class="btn primary" data-ok>Buy now</button></div>
    <div style="display:flex;justify-content:space-between;margin-top:12px"><button class="btn sm" data-editpack>Edit pack</button><button class="btn sm" data-x>Cancel</button></div>`, el => {
    const pr = () => r2(val(el, "#f_pr"));
    const upd = () => {
      el.querySelector("#qv").textContent = q;
      const b = num(S.settings.budget), sm = spentIn(thisMonth()), cost = r2(pr() * q), now = r2(p.wishes * q), tot = r2((p.total ?? p.wishes) * q);
      el.querySelector("#sum").innerHTML = `<div class="row"><span>Wishes now</span><b class="plus">+${fmtW(p.pass && !S.settings.autoIncome ? tot : now)}</b></div>
        ${p.pass && S.settings.autoIncome && tot > now ? `<div class="row small"><span class="muted">Rest arrives through daily income</span><span>+${fmtW(tot - now)}</span></div>` : ""}
        <div class="row"><span>Cost</span><b>${fmtM(cost)}</b></div>
        ${b ? `<div class="row small"><span class="muted">This month after buying</span><b class="${sm + cost > b ? "minus" : "plus"}">${fmtM(sm + cost)} of ${fmtM(b)}</b></div>` : ""}`;
    };
    upd();
    el.querySelector("#f_pr").oninput = upd;
    el.querySelector("[data-m]").onclick = () => { q = Math.max(1, q - 1); upd(); };
    el.querySelector("[data-p]").onclick = () => { q++; upd(); };
    el.querySelector("[data-x]").onclick = closeModal;
    el.querySelector("[data-editpack]").onclick = () => packForm(p);
    el.querySelector("[data-plan]").onclick = () => planForm({name: (q > 1 ? q + "× " : "") + (isBannerPack ? `${p.group} ${p.name}` : p.name), group: p.group, price: r2(pr() * q), wishes: r2((p.total ?? p.wishes) * q), month: thisMonth(), repeat: p.id === "aurum"});
    el.querySelector("[data-ok]").onclick = () => {
      if (!(pr() >= 0) || val(el, "#f_pr") === "") return toast("Enter the price you paid");
      const bannerId = el.querySelector("#f_bn") ? val(el, "#f_bn") : "";
      closeModal();
      act(`Bought ${p.name}`, () => {
        if (p.price == null || p.price !== pr()) { const pk = S.packs.find(x => x.id === p.id); if (pk && pk.price == null) pk.price = pr(); }
        const credit = p.pass && !S.settings.autoIncome ? (p.total ?? p.wishes) : p.wishes;
        S.entries.push({id: uid(), ts: Date.now(), kind: "purchase", date: val(el, "#f_d") || today(), label: (q > 1 ? q + "× " : "") + p.name, packId: p.id, group: p.group,
          wishes: r2(credit * q), total: r2((p.total ?? p.wishes) * q), emp: r2(num(p.emp) * q), amount: r2(pr() * q), bannerId, bannerName: S.banners.find(b => b.id === bannerId)?.name || "", note: val(el, "#f_n").trim()});
        if (p.pass) startPass(p.pass, q);
      });
    };
  });
}
function startPass(key, times = 1) {
  const t = today(), cur = S.passes[key] && S.passes[key] >= t ? S.passes[key] : t;
  S.passes[key] = addDays(cur, PASSES[key].days * times);
  const y = ["ydiamond", "ywish", "ygrowth"];
  if (y.includes(key) && y.every(k => S.passes[k] && S.passes[k] >= t)) S.passes.ybonus = y.map(k => S.passes[k]).sort()[0];
}
function packForm(p) {
  const isNew = !p; p = p || {group: "Custom", name: "", price: "", wishes: "", limit: "", note: ""};
  modal(`<h3>${isNew ? "Add custom pack" : "Edit pack"}</h3>
    <div class="field"><label>Name</label><input id="f_name" value="${esc(p.name)}" placeholder="e.g. Anniversary pack"></div>
    <div class="field"><label>Pack type</label><input id="f_group" value="${esc(p.group)}" list="dl_g"><datalist id="dl_g">${[...new Set(S.packs.map(x => x.group))].map(g => `<option value="${esc(g)}">`).join("")}</datalist></div>
    <div class="fields2"><div class="field"><label>Price (${sym()})</label><input id="f_price" type="number" inputmode="decimal" step="0.01" value="${p.price ?? ""}"></div>
    <div class="field"><label>Wishes given</label><input id="f_w" type="number" inputmode="decimal" step="any" value="${p.total ?? p.wishes}"></div></div>
    <div class="fields2"><div class="field"><label>Limit (optional)</label><input id="f_lim" value="${esc(p.limit || "")}"></div><div class="field"><label>Note (optional)</label><input id="f_note" value="${esc(p.note || "")}"></div></div>
    ${p.pass ? `<div class="note" style="margin-bottom:12px">This pass gives ${fmtW(p.wishes)} wishes straight away; the rest comes through daily income.</div>` : ""}
    <div class="acts">${isNew ? `<button class="btn" data-x>Cancel</button>` : `<button class="btn danger" data-del>Delete</button>`}<button class="btn primary" data-ok>Save</button></div>`, el => {
    el.querySelector("[data-x]") && (el.querySelector("[data-x]").onclick = closeModal);
    el.querySelector("[data-del]") && (el.querySelector("[data-del]").onclick = () => { closeModal(); act("Pack deleted", () => { S.packs = S.packs.filter(x => x.id !== p.id); }); });
    el.querySelector("[data-ok]").onclick = () => {
      const w = r2(val(el, "#f_w")), price = val(el, "#f_price") === "" ? null : r2(val(el, "#f_price"));
      const v = {name: val(el, "#f_name").trim(), group: val(el, "#f_group").trim() || "Custom", price, limit: val(el, "#f_lim").trim(), note: val(el, "#f_note").trim()};
      if (!v.name) return toast("Give the pack a name");
      closeModal();
      act(isNew ? "Pack added" : "Pack saved", () => {
        if (isNew) S.packs.push({id: uid(), wishes: w, ...v});
        else { const pk = S.packs.find(x => x.id === p.id); Object.assign(pk, v); if (pk.pass) pk.total = w; else pk.wishes = w; }
      });
    };
  });
}
function entryForm(e) {
  if (e.kind === "pull") return pullForm(e);
  if (e.kind === "gain") return gainForm(e);
  modal(`<h3>Edit ${e.kind === "purchase" ? "purchase" : "adjustment"}</h3>
    <div class="field"><label>Title</label><input id="f_l" value="${esc(e.label)}"></div>
    <div class="fields2"><div class="field"><label>Wishes${e.kind === "adjust" ? " (+ or −)" : ""}</label><input id="f_w" type="number" inputmode="decimal" step="any" value="${e.wishes}"></div>
    ${e.kind === "purchase" ? `<div class="field"><label>Amount (${sym()})</label><input id="f_a" type="number" inputmode="decimal" step="0.01" value="${e.amount}"></div>` : `<div></div>`}</div>
    ${e.kind === "purchase" ? `<div class="field"><label>Pack type</label><input id="f_g" value="${esc(e.group || "")}"></div>` : ""}
    <div class="fields2"><div class="field"><label>Note</label><input id="f_n" value="${esc(e.note || "")}"></div><div class="field"><label>Date</label><input id="f_d" type="date" value="${e.date}"></div></div>
    <div class="acts"><button class="btn danger" data-del>Delete</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    el.querySelector("[data-del]").onclick = () => { closeModal(); act("Deleted", () => { S.entries = S.entries.filter(x => x.id !== e.id); }); };
    el.querySelector("[data-ok]").onclick = () => {
      const v = {label: val(el, "#f_l").trim(), wishes: r2(val(el, "#f_w")), note: val(el, "#f_n").trim(), date: val(el, "#f_d") || e.date};
      if (e.kind === "purchase") { v.amount = r2(val(el, "#f_a")); v.group = val(el, "#f_g").trim(); if (e.total != null && !e.estimate) v.total = Math.max(v.wishes, num(e.total)); }
      closeModal(); act("Saved", () => Object.assign(S.entries.find(x => x.id === e.id), v));
    };
  });
}
function planForm(p) {
  const isNew = !p || !p.id; p = Object.assign({name: "", group: "", price: "", wishes: "", month: thisMonth(), repeat: false}, p || {});
  modal(`<h3>${isNew ? "Plan a purchase" : "Edit planned purchase"}</h3><div class="desc">Planned buys count toward that month's budget and your wish projection, not your real totals, until you tap "Bought".</div>
    <div class="field"><label>What</label><input id="f_name" value="${esc(p.name)}" placeholder="e.g. Myth banner packs"></div>
    <div class="fields2"><div class="field"><label>Price (${sym()})</label><input id="f_price" type="number" inputmode="decimal" step="0.01" value="${p.price}"></div>
    <div class="field"><label>Wishes</label><input id="f_w" type="number" inputmode="decimal" step="any" value="${p.wishes}"></div></div>
    <div class="fields2"><div class="field"><label>Month</label><input id="f_m" type="month" value="${p.month}"></div><div class="field"><label>Pack type</label><input id="f_g" value="${esc(p.group)}"></div></div>
    <label class="check" style="border:none"><input type="checkbox" id="f_rep" ${p.repeat ? "checked" : ""}><span class="main">Repeat every month<div class="small muted">e.g. Aurum Pass. When you mark it bought, next month's is planned.</div></span></label>
    <div class="acts">${isNew ? `<button class="btn" data-x>Cancel</button>` : `<button class="btn danger" data-del>Remove</button>`}<button class="btn primary" data-ok>Save plan</button></div>`, el => {
    el.querySelector("[data-x]") && (el.querySelector("[data-x]").onclick = closeModal);
    el.querySelector("[data-del]") && (el.querySelector("[data-del]").onclick = () => { closeModal(); act("Plan removed", () => { S.plans = S.plans.filter(x => x.id !== p.id); }); });
    el.querySelector("[data-ok]").onclick = () => {
      const v = {name: val(el, "#f_name").trim(), price: r2(val(el, "#f_price")), wishes: r2(val(el, "#f_w")), month: val(el, "#f_m") || thisMonth(), group: val(el, "#f_g").trim(), repeat: el.querySelector("#f_rep").checked};
      if (!v.name) return toast("Say what you plan to buy");
      closeModal(); tab = "shop"; shopView = "budget";
      act("Planned for " + fmtMonth(v.month), () => { if (isNew) S.plans.push({id: uid(), ...v}); else Object.assign(S.plans.find(x => x.id === p.id), v); });
    };
  });
}
function bannerForm(b) {
  const isNew = !b; b = b || {name: "", type: "solo", rerun: false, lis: S.profile.lis.length === 1 ? [...S.profile.lis] : [], start: today(), end: "", pulls: "", free: 0, target: ""};
  let lis = [...(b.lis || [])];
  modal(`<h3>${isNew ? "Add banner" : "Edit banner"}</h3>
    <div class="field"><label>Banner name</label><input id="f_name" value="${esc(b.name)}" placeholder="e.g. Caleb Solo, Myth #4"></div>
    <div class="fields2"><div class="field"><label>Type</label><select id="f_t">${BANNER_TYPES.map(t => `<option value="${t.k}" ${b.type === t.k ? "selected" : ""}>${t.n}</option>`).join("")}</select></div>
    <div class="field"><label>&nbsp;</label><label class="check" style="border:none;padding:8px 0"><input type="checkbox" id="f_rr" ${b.rerun ? "checked" : ""}><span class="main">Rerun</span></label></div></div>
    <div class="lbl2" style="margin-bottom:6px">Love interest(s)</div><div class="chips" id="lis" style="margin-bottom:12px"></div>
    <div class="fields2"><div class="field"><label>Starts</label><input id="f_s" type="date" value="${b.start || ""}"></div><div class="field"><label>Ends</label><input id="f_e" type="date" value="${b.end || ""}"></div></div>
    <div class="fields2"><div class="field"><label>Pulls you plan to use</label><input id="f_p" type="number" inputmode="numeric" value="${b.pulls || ""}"></div>
    <div class="field"><label>Free pulls from the event</label><input id="f_f" type="number" inputmode="numeric" value="${b.free || 0}"></div></div>
    <div class="chips" style="margin:-4px 0 12px"><button class="chip" data-g="150">Myth R0 · 150</button><button class="chip" data-g="96">Solo R0 · 96</button><button class="chip" data-g="104">Multi R0 · 104</button><button class="chip" data-g="300">Myth R1 · 300</button></div>
    <div class="field"><label>Card(s) you want (optional)</label><input id="f_tg" value="${esc(b.target || "")}"></div>
    <div class="acts">${isNew ? `<button class="btn" data-x>Cancel</button>` : `<button class="btn danger" data-del>Delete</button>`}<button class="btn primary" data-ok>Save</button></div>`, el => {
    const draw = () => { el.querySelector("#lis").innerHTML = LIS.map(l => `<button class="chip ${lis.includes(l.k) ? "on" : ""}" data-l="${l.k}">${avatar(l.k)} ${l.n}</button>`).join("");
      el.querySelectorAll("[data-l]").forEach(c => c.onclick = () => { const k = c.dataset.l; lis = lis.includes(k) ? lis.filter(x => x !== k) : [...lis, k]; draw(); }); };
    draw();
    el.querySelectorAll("[data-g]").forEach(c => c.onclick = () => el.querySelector("#f_p").value = c.dataset.g);
    el.querySelector("[data-x]") && (el.querySelector("[data-x]").onclick = closeModal);
    el.querySelector("[data-del]") && (el.querySelector("[data-del]").onclick = () => confirmBox("Delete this banner?", "Pulls and purchases logged for it stay in your history.", "Delete", () => act("Banner deleted", () => { S.banners = S.banners.filter(x => x.id !== b.id); })));
    el.querySelector("[data-ok]").onclick = () => {
      const v = {name: val(el, "#f_name").trim(), type: val(el, "#f_t"), rerun: el.querySelector("#f_rr").checked && typeOf(val(el, "#f_t")).canRerun, lis, start: val(el, "#f_s"), end: val(el, "#f_e"), pulls: num(val(el, "#f_p")), free: num(val(el, "#f_f")), target: val(el, "#f_tg").trim()};
      if (!v.name) return toast("Give the banner a name");
      closeModal(); act("Banner saved", () => { if (isNew) S.banners.push({id: uid(), ...v}); else Object.assign(S.banners.find(x => x.id === b.id), v); });
    };
  });
}
function bannerDetail(b) {
  const st = bannerStats(b), pool = poolFor(b.type, b.rerun);
  modal(`<div style="display:flex;gap:10px;align-items:center;margin-bottom:6px">${avatars(b.lis)}<div><h3>${esc(b.name)}</h3><div class="small muted">${bannerLabel(b)} · ${POOLS[pool].n} pity pool${b.start ? ` · ${fmtDate(b.start)}${b.end ? " – " + fmtDate(b.end) : ""}` : ""}</div></div></div>
    ${b.target ? `<div class="note" style="margin:8px 0">Want: ${esc(b.target)}</div>` : ""}
    <div class="summary">
      <div class="row"><span>Pulls used</span><b>${st.pulls}${b.pulls ? ` of ${b.pulls} planned` : ""}</b></div>
      <div class="row"><span>· going for the card</span><span>${st.cardPulls}</span></div>
      <div class="row"><span>· extras (outfit, pose, ranks)</span><span>${st.extraPulls}</span></div>
      <div class="row"><span>Packs bought for it</span><b>${fmtM(st.spent)}${st.bought ? ` · ${fmtW(st.bought)} wishes` : ""}</b></div>
      ${b.free ? `<div class="row"><span>Free event pulls</span><span>${b.free}</span></div>` : ""}
    </div>
    ${st.results.length ? `<div class="lbl2" style="margin-bottom:6px">5★ results</div><div class="list" style="margin-bottom:10px">${st.results.map(r => `<div class="it">${avatar(r.li)}<div class="main"><div class="t">${esc(r.card || "5★ card")}</div><div class="small muted">at pity ${r.pity}</div></div>
      <span class="badge ${r.outcome === "lost" ? "b" : r.outcome === "std" ? "bl" : "g"}">${{win: "Won", lost: "Lost 50/50", guar: "Guaranteed", std: "Standard"}[r.outcome] || ""}</span></div>`).join("")}</div>` : ""}
    <div class="acts"><button class="btn primary" data-pull>Log pulls</button><button class="btn" data-buy>Buy pack</button></div>
    <div style="display:flex;justify-content:space-between;margin-top:12px"><button class="btn sm" data-edit>Edit banner</button><button class="btn sm" data-x>Close</button></div>`, el => {
    el.querySelector("[data-x]").onclick = closeModal;
    el.querySelector("[data-edit]").onclick = () => bannerForm(b);
    el.querySelector("[data-pull]").onclick = () => pullForm(null, b.id);
    el.querySelector("[data-buy]").onclick = () => { closeModal(); tab = "shop"; shopView = "packs"; const g = b.rerun ? "Rerun banner" : ({myth: "Myth banner", multi: "Multi banner", solo: "Solo banner", bday: "Solo banner"}[b.type]); if (g) packGroup = g; render(); window.scrollTo(0, 0); };
  });
}
function cardForm(c) {
  const isNew = !c; c = c || {li: colLi !== "all" ? colLi : (S.profile.lis[0] || "xavier"), name: "", rarity: 5, banner: "", owned: false, rank: 0, wanted: true, note: ""};
  modal(`<h3>${isNew ? "Add card" : "Edit card"}</h3>
    <div class="fields2"><div class="field"><label>Love interest</label><select id="f_li">${liOptions(c.li)}</select></div>
    <div class="field"><label>Rarity</label><select id="f_r">${[5, 4, 3].map(r => `<option value="${r}" ${+c.rarity === r ? "selected" : ""}>${r}★</option>`).join("")}</select></div></div>
    <div class="field"><label>Card name</label><input id="f_n" value="${esc(c.name)}"></div>
    <div class="field"><label>Banner (optional)</label><input id="f_b" value="${esc(c.banner || "")}" placeholder="e.g. Myth, birthday 2025"></div>
    <label class="check"><input type="checkbox" id="f_o" ${c.owned ? "checked" : ""}><span class="main">I own this card</span><span class="amt"><select id="f_rk" style="width:100%;border:1px solid var(--line);background:var(--surface2);border-radius:10px;padding:6px">${[0, 1, 2, 3].map(r => `<option value="${r}" ${num(c.rank) === r ? "selected" : ""}>R${r}</option>`).join("")}</select></span></label>
    <label class="check"><input type="checkbox" id="f_w" ${c.wanted ? "checked" : ""}><span class="main">On my wishlist<div class="small muted">For reruns or ranking up later</div></span></label>
    <div class="acts">${isNew ? `<button class="btn" data-x>Cancel</button>` : `<button class="btn danger" data-del>Delete</button>`}<button class="btn primary" data-ok>Save</button></div>`, el => {
    el.querySelector("[data-x]") && (el.querySelector("[data-x]").onclick = closeModal);
    el.querySelector("[data-del]") && (el.querySelector("[data-del]").onclick = () => { closeModal(); act("Card deleted", () => { S.cards = S.cards.filter(x => x.id !== c.id); }); });
    el.querySelector("[data-ok]").onclick = () => {
      const v = {li: val(el, "#f_li"), rarity: +val(el, "#f_r"), name: val(el, "#f_n").trim(), banner: val(el, "#f_b").trim(), owned: el.querySelector("#f_o").checked, rank: +val(el, "#f_rk"), wanted: el.querySelector("#f_w").checked};
      if (!v.name) return toast("Enter the card name");
      closeModal(); act("Card saved", () => { if (isNew) S.cards.push({id: uid(), ...v}); else Object.assign(S.cards.find(x => x.id === c.id), v); });
    };
  });
}
function pityForm(pool) {
  const pools = ["limited", "rerun", "special"].concat(S.profile.trackStandard ? ["standard"] : []);
  modal(`<h3>Correct pity</h3><div class="desc">Type what the game shows. In the game, your wish history shows how many pulls since your last 5★.</div>
    ${pools.map(p => { const st = poolState(p); return `<div class="result"><div class="row" style="margin-bottom:8px"><b>${POOLS[p].n}</b><span class="small muted">${POOLS[p].sub}</span></div>
      <div class="fields2"><div class="field"><label>Pity now</label><input data-p="${p}" type="number" inputmode="numeric" min="0" max="${CONFIG.hardPity}" value="${st.pity}"></div>
      ${POOLS[p].guar ? `<div class="field"><label>Next 5★</label><select data-g="${p}"><option value="0" ${!st.guar ? "selected" : ""}>50/50</option><option value="1" ${st.guar ? "selected" : ""}>Guaranteed</option></select></div>` : "<div></div>"}</div></div>`; }).join("")}
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    el.querySelector("[data-x]").onclick = closeModal;
    const f = el.querySelector(`[data-p="${pool}"]`); if (f) f.focus();
    el.querySelector("[data-ok]").onclick = () => {
      closeModal();
      act("Pity updated", () => { pools.forEach(p => { const st = poolState(p), np = Math.min(CONFIG.hardPity, num(el.querySelector(`[data-p="${p}"]`).value)), g = el.querySelector(`[data-g="${p}"]`), ng = g ? g.value === "1" : false;
        if (np !== st.pity || ng !== st.guar) S.pools[p] = {pity: np, guar: ng, ts: Date.now()}; }); });
    };
  });
}
function matchForm() {
  const B = balances();
  modal(`<h3>Match the game</h3><div class="desc">Enter what the game shows now. The difference is logged as an adjustment.</div>
    <div class="fields2"><div class="field"><label>Diamonds</label><input id="f_dm" type="number" inputmode="numeric" placeholder="e.g. 81216"></div>
    <div class="field"><label>Deepspace wish tickets</label><input id="f_tk" type="number" inputmode="numeric" placeholder="incl. limited"></div></div>
    <div class="field"><label>= Total wishes</label><input id="f_w" type="number" inputmode="decimal" step="any" value="${B.ds}"></div>
    ${S.profile.trackStandard ? `<div class="field"><label>Empyrean (blue) wishes</label><input id="f_emp" type="number" inputmode="numeric" value="${B.emp}"></div>` : ""}
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    const w = el.querySelector("#f_w"), calc = () => { if (val(el, "#f_dm") || val(el, "#f_tk")) w.value = r2(D2W(num(val(el, "#f_dm"))) + num(val(el, "#f_tk"))); };
    el.querySelector("#f_dm").oninput = calc; el.querySelector("#f_tk").oninput = calc;
    el.querySelector("[data-x]").onclick = closeModal;
    el.querySelector("[data-ok]").onclick = () => {
      const d = r2(num(w.value) - B.ds), de = el.querySelector("#f_emp") ? r2(num(val(el, "#f_emp")) - B.emp) : 0;
      closeModal();
      if (!d && !de) return toast("Already matches");
      act(`Adjusted by ${d > 0 ? "+" : ""}${fmtW(d)}`, () => S.entries.push({id: uid(), ts: Date.now(), kind: "adjust", date: today(), label: "Matched to game", wishes: d, emp: de, note: val(el, "#f_dm") ? `${num(val(el, "#f_dm")).toLocaleString()} diamonds + ${num(val(el, "#f_tk"))} tickets` : ""}));
    };
  });
}
function numberForm(title, desc, label, v, fn) {
  modal(`<h3>${title}</h3><div class="desc">${desc}</div><div class="field"><label>${label}</label><input id="f_v" type="number" inputmode="decimal" step="any" value="${v || ""}"></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    el.querySelector("[data-x]").onclick = closeModal;
    el.querySelector("[data-ok]").onclick = () => { const n = r2(val(el, "#f_v")); closeModal(); act("Saved", () => fn(n), false); };
  });
}
function incomeForm() {
  const t = today();
  modal(`<h3>Free income & passes</h3><div class="desc">Diamonds you get from playing. With auto income on, these are added for you each day you open ${CONFIG.appName}.</div>
    <label class="check" style="border:none"><input type="checkbox" id="f_auto" ${S.settings.autoIncome ? "checked" : ""}><span class="main"><b>Auto daily income</b><div class="small muted">Turn off if you don't log in every day; add free wishes yourself instead.</div></span></label>
    <div class="lbl2" style="margin:6px 0">Sources (diamonds each time)</div>
    ${INCOME_SOURCES.map(s => `<label class="check"><input type="checkbox" data-on="${s.k}" ${incomeOn(s) ? "checked" : ""}><span class="main">${s.n}<div class="small muted">${{daily: "every day", weekly: "every Monday", monthly: "1st of the month"}[s.when]}${s.need ? ` · while ${PASSES[s.need].n} is active` : ""}</div></span><span class="amt"><input data-amt="${s.k}" type="number" inputmode="numeric" value="${incomeAmt(s)}"></span></label>`).join("")}
    <div class="lbl2" style="margin:14px 0 6px">Pass end dates</div>
    ${["aurum", "ydiamond", "ywish", "ygrowth", "ybonus"].map(k => `<div class="fields2" style="align-items:center"><span>${PASSES[k].n}${S.passes[k] && S.passes[k] >= t ? ` <span class="badge g">${daysBetween(t, S.passes[k])}d left</span>` : ""}</span><div class="field" style="margin:4px 0"><input type="date" data-pass="${k}" value="${S.passes[k] || ""}"></div></div>`).join("")}
    <div class="small muted" style="margin:4px 0 12px">Buying a pass in the Shop sets these for you.</div>
    <div class="field"><label>Other free wishes per month (farming, Senior Hunter Contest, events) — for planning only</label><input id="f_ex" type="number" inputmode="decimal" value="${S.settings.extraIncome || ""}" placeholder="e.g. 30"></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    el.querySelector("[data-x]").onclick = closeModal;
    el.querySelector("[data-ok]").onclick = () => {
      closeModal();
      act("Income settings saved", () => {
        const was = S.settings.autoIncome; S.settings.autoIncome = el.querySelector("#f_auto").checked;
        if (!was && S.settings.autoIncome) S.income.lastRun = today();
        el.querySelectorAll("[data-on]").forEach(c => S.income.off[c.dataset.on] = !c.checked);
        el.querySelectorAll("[data-amt]").forEach(i => S.income.amounts[i.dataset.amt] = num(i.value));
        el.querySelectorAll("[data-pass]").forEach(i => { if (i.value) S.passes[i.dataset.pass] = i.value; else delete S.passes[i.dataset.pass]; });
        S.settings.extraIncome = num(val(el, "#f_ex"));
      }, false);
    };
  }, true);
}
function profileForm() {
  modal(`<h3>Profile</h3>
    <div class="field"><label>Currency</label><select id="f_c">${CURRENCIES.map(([c, s]) => `<option value="${c}" ${S.profile.currency === c ? "selected" : ""}>${c} (${s})</option>`).join("")}</select></div>
    <label class="check"><input type="checkbox" id="f_std" ${S.profile.trackStandard ? "checked" : ""}><span class="main">Track the standard banner<div class="small muted">Blue (Empyrean) wishes and standard pity. Handy for newer players.</div></span></label>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    el.querySelector("[data-x]").onclick = closeModal;
    el.querySelector("[data-ok]").onclick = () => {
      const c = val(el, "#f_c"), changed = c !== S.profile.currency;
      closeModal();
      act("Profile saved", () => {
        S.profile.trackStandard = el.querySelector("#f_std").checked;
        if (changed) { S.profile.currency = c; S.packs.forEach(p => { if (DEFAULT_PACKS.some(d => d.id === p.id)) p.price = c === "MYR" ? p.myr : null; }); }
      }, false);
      if (changed) toast("Pack prices reset for the new currency");
    };
  });
}
function lisForm() {
  let lis = [...S.profile.lis];
  modal(`<h3>Love interests</h3><div class="desc">Pick your main love interest, or up to all five. Tap the picture button to add your own picture for each (stays on this device).</div>
    <div class="lirow" id="lis" style="margin-bottom:14px"></div><div id="pics"></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, el => {
    const draw = () => {
      el.querySelector("#lis").innerHTML = LIS.map(l => `<button class="lichip ${lis.includes(l.k) ? "on" : ""}" style="--c:${l.c}" data-l="${l.k}">${avatar(l.k, true)}<span>${l.n}</span>${lis[0] === l.k ? `<span class="badge y">Main</span>` : ""}</button>`).join("");
      el.querySelector("#pics").innerHTML = lis.map(k => `<div class="row" style="align-items:center;margin-bottom:8px"><span class="li">${avatar(k)} ${liOf(k).n}</span><span><button class="btn sm" data-pic="${k}">Picture</button>${S.images.li[k] ? ` <button class="btn sm" data-rmpic="${k}">Remove</button>` : ""}</span></div>`).join("");
      el.querySelectorAll("[data-l]").forEach(c => c.onclick = () => { const k = c.dataset.l; lis = lis.includes(k) ? lis.filter(x => x !== k) : [...lis, k]; draw(); });
      el.querySelectorAll("[data-pic]").forEach(b => b.onclick = () => pickImage(220, url => { S.images.li[b.dataset.pic] = url; save(); draw(); }));
      el.querySelectorAll("[data-rmpic]").forEach(b => b.onclick = () => { delete S.images.li[b.dataset.rmpic]; save(); draw(); });
    };
    draw();
    el.querySelector("[data-x]").onclick = () => { closeModal(); render(); };
    el.querySelector("[data-ok]").onclick = () => { closeModal(); act("Saved", () => { S.profile.lis = lis; }, false); };
  });
}
function pickImage(maxW, cb) {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const img = new Image(), url = URL.createObjectURL(f);
    img.onload = () => {
      const sc = Math.min(1, maxW / img.width), cv = document.createElement("canvas");
      cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
      try { cb(cv.toDataURL("image/jpeg", .82)); } catch (e) { toast("Couldn't use that picture"); }
    };
    img.onerror = () => toast("Couldn't read that picture");
    img.src = url;
  };
  inp.click();
}
function estimateForm() {
  const price = id => S.packs.find(p => p.id === id)?.price ?? "";
  modal(`<h3>Estimate past spending</h3><div class="desc">For money spent before you started tracking. This adds one "estimated" entry so your total is closer to real. It doesn't change your wishes.</div>
    <div class="fields2"><div class="field"><label>Months of Aurum Pass</label><input id="e_am" type="number" inputmode="numeric"></div><div class="field"><label>Price each</label><input id="e_ap" type="number" step="0.01" value="${price("aurum")}"></div></div>
    <div class="fields2"><div class="field"><label>Promise seasons bought</label><input id="e_pm" type="number" inputmode="numeric"></div><div class="field"><label>Price each</label><input id="e_pp" type="number" step="0.01" value="${price("secret")}"></div></div>
    <div class="fields2"><div class="field"><label>Yearly passes bought</label><input id="e_ym" type="number" inputmode="numeric"></div><div class="field"><label>Avg price each</label><input id="e_yp" type="number" step="0.01" value="${price("ydiam") ? r2((num(price("ydiam")) + num(price("ywish")) + num(price("ygrow"))) / 3) : ""}"></div></div>
    <div class="fields2"><div class="field"><label>Months buying banner packs</label><input id="e_bm" type="number" inputmode="numeric"></div><div class="field"><label>Avg per month</label><input id="e_bp" type="number" step="0.01"></div></div>
    <div class="field"><label>Anything else (lump sum)</label><input id="e_o" type="number" step="0.01"></div>
    <div class="fields2"><div class="field"><label>Record it on</label><input id="e_d" type="date" value="${today()}"></div><div></div></div>
    <div class="summary" id="sum"></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Add estimate</button></div>`, el => {
    const tot = () => r2(num(val(el, "#e_am")) * num(val(el, "#e_ap")) + num(val(el, "#e_pm")) * num(val(el, "#e_pp")) + num(val(el, "#e_ym")) * num(val(el, "#e_yp")) + num(val(el, "#e_bm")) * num(val(el, "#e_bp")) + num(val(el, "#e_o")));
    const upd = () => el.querySelector("#sum").innerHTML = `<div class="row"><span>Estimated total</span><b>${fmtM(tot())}</b></div>`;
    el.querySelectorAll("input").forEach(i => i.oninput = upd); upd();
    el.querySelector("[data-x]").onclick = closeModal;
    el.querySelector("[data-ok]").onclick = () => {
      const t = tot(); if (!(t > 0)) return toast("Fill in at least one line");
      const parts = [["Aurum", "#e_am"], ["Promise", "#e_pm"], ["Yearly", "#e_ym"], ["Banner pack months", "#e_bm"]].filter(([, s]) => num(val(el, s))).map(([n, s]) => `${n} ×${num(val(el, s))}`);
      closeModal(); act(`Added ${fmtM(t)} estimate`, () => S.entries.push({id: uid(), ts: Date.now(), kind: "purchase", estimate: true, date: val(el, "#e_d") || today(), label: "Estimated past spending", group: "Estimated (before tracking)", wishes: 0, amount: t, note: parts.join(", ") + (num(val(el, "#e_o")) ? `, other ${num(val(el, "#e_o"))}` : "")}));
    };
  });
}

/* ================= first-time setup ================= */
function wizard(restoreFirst) {
  const B = balances();
  const d = {currency: S.profile.currency, lis: [...S.profile.lis], std: S.profile.trackStandard, dia: "", tk: "", wishes: S.entries.length ? B.ds : "", emp: S.entries.length ? B.emp : "",
    pools: Object.fromEntries(Object.keys(POOLS).map(p => [p, poolState(p)])), auto: S.settings.autoIncome, passes: {...S.passes}, budget: S.settings.budget || ""};
  let step = 0; const N = 5;
  const body = () => {
    if (step === 0) return `<h3>Welcome to ${CONFIG.appName}</h3><div class="desc">${CONFIG.tagline}. Track your wishes, pity, spending and cards in one place. Everything stays on your device.</div>
      <div class="note" style="margin-bottom:14px">Setup takes about two minutes. You can change all of it later in Settings.</div>
      <div class="acts"><button class="btn" data-restore>Restore a backup</button><button class="btn primary" data-next>Start</button></div>`;
    if (step === 1) return `<h3>About you</h3><div class="desc">Pick your love interest(s). The first one you pick is your main.</div>
      <div class="lirow" id="wl" style="margin-bottom:14px">${LIS.map(l => `<button class="lichip ${d.lis.includes(l.k) ? "on" : ""}" style="--c:${l.c}" data-l="${l.k}">${avatar(l.k, true)}<span>${l.n}</span>${d.lis[0] === l.k ? `<span class="badge y">Main</span>` : ""}</button>`).join("")}</div>
      <div class="field"><label>Currency you pay in</label><select id="w_c">${CURRENCIES.map(([c, s]) => `<option value="${c}" ${d.currency === c ? "selected" : ""}>${c} (${s})</option>`).join("")}</select></div>
      <label class="check" style="border:none"><input type="checkbox" id="w_std" ${d.std ? "checked" : ""}><span class="main">Also track the standard banner<div class="small muted">Blue (Empyrean) wishes and standard pity. Optional.</div></span></label>`;
    if (step === 2) return `<h3>What you have now</h3><div class="desc">Check your diamonds and wish tickets in the game.</div>
      <div class="fields2"><div class="field"><label>Diamonds</label><input id="w_dm" type="number" inputmode="numeric" value="${d.dia}" placeholder="e.g. 12000"></div>
      <div class="field"><label>Deepspace wish tickets</label><input id="w_tk" type="number" inputmode="numeric" value="${d.tk}" placeholder="incl. limited"></div></div>
      <div class="field"><label>= Total wishes</label><input id="w_w" type="number" inputmode="decimal" step="any" value="${d.wishes}"></div>
      ${d.std ? `<div class="field"><label>Empyrean (blue) wishes</label><input id="w_emp" type="number" inputmode="numeric" value="${d.emp}"></div>` : ""}`;
    if (step === 3) return `<h3>Your pity</h3><div class="desc">How many pulls since your last 5★ in each pool, and whether your next 5★ is guaranteed (you lost the last 50/50). Check your wish history in the game. Leave 0 if you're not sure.</div>
      ${["limited", "rerun"].concat(d.std ? ["standard"] : []).map(p => `<div class="result"><div class="row" style="margin-bottom:8px"><b>${POOLS[p].n}</b><span class="small muted">${POOLS[p].sub}</span></div>
        <div class="fields2"><div class="field"><label>Pity</label><input data-p="${p}" type="number" inputmode="numeric" min="0" max="70" value="${d.pools[p].pity}"></div>
        ${POOLS[p].guar ? `<div class="field"><label>Next 5★</label><select data-g="${p}"><option value="0">50/50</option><option value="1" ${d.pools[p].guar ? "selected" : ""}>Guaranteed</option></select></div>` : "<div></div>"}</div></div>`).join("")}`;
    return `<h3>Passes & daily income</h3><div class="desc">So ${CONFIG.appName} can add your daily diamonds for you.</div>
      <label class="check" style="border:none"><input type="checkbox" id="w_auto" ${d.auto ? "checked" : ""}><span class="main"><b>I log in and do my dailies most days</b><div class="small muted">Adds daily, weekly and login diamonds automatically. Turn off to add free wishes yourself.</div></span></label>
      <div class="lbl2" style="margin:8px 0">Passes you have now (end date)</div>
      ${["aurum", "ydiamond", "ywish", "ygrowth"].map(k => `<div class="fields2" style="align-items:center"><span>${PASSES[k].n}</span><div class="field" style="margin:4px 0"><input type="date" data-pass="${k}" value="${d.passes[k] || ""}"></div></div>`).join("")}
      <div class="small muted" style="margin:4px 0 12px">Leave empty if you don't have it. Not sure of the date? Aurum: today + days left.</div>
      <div class="field"><label>Monthly spending budget (optional)</label><input id="w_bud" type="number" inputmode="decimal" value="${d.budget}" placeholder="e.g. 100"></div>`;
  };
  const collect = el => {
    if (step === 1) { d.currency = val(el, "#w_c"); d.std = el.querySelector("#w_std").checked; }
    if (step === 2) { d.dia = val(el, "#w_dm"); d.tk = val(el, "#w_tk"); d.wishes = val(el, "#w_w"); if (el.querySelector("#w_emp")) d.emp = val(el, "#w_emp"); }
    if (step === 3) { el.querySelectorAll("[data-p]").forEach(i => { const p = i.dataset.p, g = el.querySelector(`[data-g="${p}"]`); d.pools[p] = {pity: Math.min(70, num(i.value)), guar: g ? g.value === "1" : false}; }); }
    if (step === 4) { d.auto = el.querySelector("#w_auto").checked; el.querySelectorAll("[data-pass]").forEach(i => { if (i.value) d.passes[i.dataset.pass] = i.value; else delete d.passes[i.dataset.pass]; }); d.budget = val(el, "#w_bud"); }
  };
  const finish = () => {
    act(`Welcome to ${CONFIG.appName}!`, () => {
      const cur = balances(), ts = Date.now();
      if (d.currency !== S.profile.currency) S.packs.forEach(p => { if (DEFAULT_PACKS.some(x => x.id === p.id)) p.price = d.currency === "MYR" ? p.myr : null; });
      S.profile.currency = d.currency; S.profile.lis = d.lis; S.profile.trackStandard = d.std;
      const dw = r2(num(d.wishes) - cur.ds), de = d.std ? r2(num(d.emp) - cur.emp) : 0;
      if (dw || de) S.entries.push({id: uid(), ts, kind: "adjust", date: today(), label: S.entries.length ? "Balance matched in setup" : "Starting balance", wishes: dw, emp: de, note: d.dia ? `${num(d.dia).toLocaleString()} diamonds + ${num(d.tk)} tickets` : ""});
      Object.keys(d.pools).forEach(p => S.pools[p] = {pity: d.pools[p].pity, guar: d.pools[p].guar, ts: ts + 1});
      S.settings.autoIncome = d.auto; S.passes = d.passes; S.settings.budget = num(d.budget);
      const y = ["ydiamond", "ywish", "ygrowth"], t = today(); if (y.every(k => S.passes[k] && S.passes[k] >= t)) S.passes.ybonus = S.passes.ybonus || y.map(k => S.passes[k]).sort()[0];
      S.income.lastRun = today(); S.setupDone = true;
    }, false);
  };
  const draw = () => {
    modal(`${step ? `<div class="steps">${Array.from({length: N - 1}, (_, i) => `<i class="${i < step ? "on" : ""}"></i>`).join("")}</div>` : ""}${body()}
      ${step ? `<div class="acts" style="margin-top:14px"><button class="btn" data-back>Back</button><button class="btn primary" data-next>${step === N - 1 ? "Finish" : "Next"}</button></div>` : ""}`, (el, scrim) => {
      scrim.dataset.lock = "1";
      el.querySelectorAll("[data-l]").forEach(c => c.onclick = () => { const k = c.dataset.l; d.lis = d.lis.includes(k) ? d.lis.filter(x => x !== k) : [...d.lis, k]; collect(el); draw(); });
      const dm = el.querySelector("#w_dm"), tk = el.querySelector("#w_tk"), w = el.querySelector("#w_w");
      if (dm) dm.oninput = tk.oninput = () => { w.value = r2(D2W(num(dm.value)) + num(tk.value)); };
      el.querySelector("[data-restore]") && (el.querySelector("[data-restore]").onclick = () => restoreBackup());
      el.querySelector("[data-back]") && (el.querySelector("[data-back]").onclick = () => { collect(el); step--; draw(); });
      el.querySelector("[data-next]").onclick = () => {
        collect(el);
        if (step === 1 && !d.lis.length) return toast("Pick at least one love interest");
        if (step === N - 1) { closeModal(); return finish(); }
        step++; draw();
      };
    }, true, true);
  };
  if (restoreFirst) step = 1;
  draw();
}

/* ================= backup / export ================= */
function download(name, text, type) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], {type})); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function exportCSV() {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["Date", "Type", "Title", "Source / pack type", "Banner", "Pity pool", "Wishes (+/-)", "Blue wishes", `Amount (${S.profile.currency})`, "5★ results", "Note"].join(",")];
  ordered().forEach(e => { const d = delta(e);
    rows.push([e.date, e.kind, q(e.kind === "pull" ? e.bannerName : e.label), q(e.source || e.group || (e.kind === "pull" ? PURPOSES.find(p => p.k === e.purpose)?.n : "")), q(e.bannerName || ""), e.pool || "", d.ds, d.emp, e.kind === "purchase" ? num(e.amount).toFixed(2) : "",
      q((e.results || []).map(r => `${liOf(r.li)?.n || ""} ${r.card || ""} @${r.pity} ${r.outcome}`).join("; ")), q(e.note)].join(",")); });
  download(`wishbound-history-${today()}.csv`, "﻿" + rows.join("\n"), "text/csv");
  toast("CSV exported");
}
function fromV1(d) {
  const s = freshState(); s.settings.budget = num(d.settings?.budget);
  const guessType = n => /myth/i.test(n) ? "myth" : /multi/i.test(n) ? "multi" : /bday|birthday/i.test(n) ? "bday" : /standard/i.test(n) ? "standard" : "solo";
  s.entries = (d.entries || []).flatMap(e => {
    const b = {id: e.id || uid(), ts: e.ts || 0, date: e.date, note: e.note || ""};
    if (e.kind === "use") {
      const t = guessType(e.label || ""), rr = /rerun/i.test(e.label || ""), base = {...b, kind: "pull", bannerName: e.label, bannerType: t, rerun: rr, pool: poolFor(t, rr), results: [], cur: "ds"};
      const m = (e.note || "").match(/incl\. ([\d.]+) for outfit/), extra = m ? Math.min(num(m[1]), num(e.wishes)) : 0, note = (e.note || "").replace(/\s*\(incl\.[^)]*\)/, "").trim();
      const out = [];
      if (num(e.wishes) - extra > 0) out.push({...base, note, pulls: r2(num(e.wishes) - extra), purpose: "card"});
      if (extra) out.push({...base, id: uid(), note: "Outfit / pose / pity", pulls: extra, purpose: "extra"});
      return out;
    }
    if (e.kind === "gain") return {...b, kind: "gain", source: e.label || "Other", label: e.label, wishes: num(e.wishes)};
    if (e.kind === "purchase") return {...b, kind: "purchase", label: e.label, group: e.group, wishes: num(e.wishes), amount: num(e.amount)};
    return {...b, kind: "adjust", label: e.label, wishes: num(e.wishes)};
  });
  s.plans = (d.plans || []).map(p => ({...p, id: p.id || uid()}));
  s.banners = (d.banners || []).map(b => ({id: b.id || uid(), name: b.name, type: guessType(b.name + " " + (b.type || "")), rerun: /rerun/i.test(b.type || "") || /rerun/i.test(b.name), lis: [], start: (b.month || thisMonth()) + "-01", end: "", pulls: num(b.pulls), free: num(b.free)}));
  return s;
}
function restoreBackup() {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json,application/json";
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let d; try { d = JSON.parse(rd.result); } catch (e) { return toast("That file isn't a backup"); }
      if (!Array.isArray(d.entries)) return toast("That file isn't a backup");
      const n = d.v === 2 ? normalise(d) : fromV1(d);
      const go = () => { closeModal(); act("Backup restored", () => { S = n; }); if (!S.setupDone) setTimeout(() => wizard(true), 300); };
      if (S.entries.length) confirmBox("Restore this backup?", `It has ${n.entries.length} entries and replaces everything on this device.`, "Restore", go); else go();
    };
    rd.readAsText(f);
  };
  inp.click();
}

/* ================= events ================= */
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-go],[data-act],[data-pack],[data-edit],[data-pg],[data-hf],[data-theme],[data-buyplan],[data-editplan],[data-banner],[data-pity],[data-shop],[data-colli],[data-colf],[data-card]");
  if (!t || (t.closest(".sheet") && !t.closest("[data-go]"))) return;
  const d = t.dataset;
  if (t.tagName === "A") ev.preventDefault();
  if (d.go) { tab = d.go; closeModal(); render(); window.scrollTo(0, 0); return; }
  if (d.pack) return buyForm(S.packs.find(p => p.id === d.pack));
  if (d.edit) return entryForm(S.entries.find(e => e.id === d.edit));
  if (d.pg) { packGroup = d.pg; return render(); }
  if (d.hf) { histFilter = d.hf; return render(); }
  if (d.shop) { shopView = d.shop; return render(); }
  if (d.colli) { colLi = d.colli; return render(); }
  if (d.colf) { colFilter = d.colf; return render(); }
  if (d.card) return cardForm(S.cards.find(c => c.id === d.card));
  if (d.theme) return act("", () => { S.settings.theme = d.theme; }, false);
  if (d.banner) return bannerDetail(S.banners.find(b => b.id === d.banner));
  if (d.pity) return pityForm(d.pity);
  if (d.editplan) return planForm(S.plans.find(p => p.id === d.editplan));
  if (d.buyplan) {
    const p = S.plans.find(x => x.id === d.buyplan);
    return act(`Logged ${p.name}`, () => {
      S.entries.push({id: uid(), ts: Date.now(), kind: "purchase", date: today(), label: p.name, group: p.group || "Planned", wishes: num(p.wishes), amount: num(p.price), note: "From plan"});
      S.plans = S.plans.filter(x => x.id !== p.id);
      if (p.repeat) S.plans.push({...p, id: uid(), month: addMonth(p.month, 1)});
      if (/aurum/i.test(p.name)) startPass("aurum");
    });
  }
  switch (d.act) {
    case "pull": return pullForm();
    case "gain": return gainForm();
    case "match": return matchForm();
    case "newpack": return packForm();
    case "newplan": return planForm();
    case "newbanner": return bannerForm();
    case "newcard": return cardForm();
    case "lis": return lisForm();
    case "profile": return profileForm();
    case "income": return incomeForm();
    case "estimate": return estimateForm();
    case "setup": return wizard(true);
    case "theme": return act("", () => { S.settings.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; }, false);
    case "budget": return numberForm("Monthly budget", "How much you're OK spending on the game each month. Leave empty to turn it off.", `Budget (${sym()})`, S.settings.budget, v => S.settings.budget = v);
    case "headerimg": return pickImage(1200, url => act("Header picture set", () => { S.images.header = url; }, false));
    case "rmheader": return act("Removed", () => { S.images.header = null; }, false);
    case "csv": return exportCSV();
    case "backup": download(`wishbound-backup-${today()}.json`, JSON.stringify(S), "application/json"); return toast("Backup downloaded");
    case "restore": return restoreBackup();
    case "wipe": return confirmBox("Delete all data?", "Everything on this device will be removed. Download a backup first if you might want it back.", "Delete everything", () => { S = freshState(); save(); tab = "home"; render(); wizard(); });
  }
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S) runAutoIncome(); });

/* ================= start ================= */
load();
render();
if (!S.setupDone) wizard(); else runAutoIncome();
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
