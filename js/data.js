/* Wishbound settings and game rules. Edit this file to change prices, income amounts or credits. */
"use strict";

const CONFIG = {
  appName: "Wishbound",
  tagline: "Every wish, accounted for",
  author: "@pookieleb",
  authorUrl: "https://x.com/pookieleb",
  githubUrl: "https://github.com/Myouipingu/wishbound",
  kofiUrl: "",              // add a Ko-fi / Buy Me a Coffee link to show a support button
  hardPity: 70,
  softPity: 60,
  diamondsPerWish: 150,
  version: "3.0.0",
  // Sync between devices (Supabase). Leave empty until the database is set up.
  syncUrl: "",
  syncKey: ""
};

/* Love interests. Colours are the ones fans usually link to each of them. */
const LIS = [
  {k: "xavier",  n: "Xavier",  c: "#7f9cf0"},
  {k: "zayne",   n: "Zayne",   c: "#5bb8cc"},
  {k: "rafayel", n: "Rafayel", c: "#b98ae6"},
  {k: "sylus",   n: "Sylus",   c: "#d4505c"},
  {k: "caleb",   n: "Caleb",   c: "#e0a957"}
];

const CURRENCIES = [
  ["MYR", "RM"], ["SGD", "S$"], ["USD", "US$"], ["PHP", "₱"], ["IDR", "Rp"], ["THB", "฿"], ["VND", "₫"],
  ["EUR", "€"], ["GBP", "£"], ["AUD", "A$"], ["CAD", "C$"], ["NZD", "NZ$"], ["JPY", "¥"], ["KRW", "₩"],
  ["TWD", "NT$"], ["HKD", "HK$"], ["INR", "₹"], ["BRL", "R$"], ["MXN", "MX$"]
];

const BANNER_TYPES = [
  {k: "myth",    n: "Myth"},
  {k: "solo",    n: "Solo"},
  {k: "multi",   n: "Multi"},
  {k: "bday",    n: "Birthday"},
  {k: "special", n: "Special"}
];
/* Pity pools: first-run limited pools share one pity, reruns share another,
   special pools (Pulse Hunter, Sky's Embrace type) and Xspace Echo each have their own. */
const POOLS = {
  limited:  {n: "Limited",  sub: "New myth, solo, multi and birthday pools", guar: true},
  rerun:    {n: "Rerun",    sub: "All rerun pools", guar: true},
  special:  {n: "Special",  sub: "Pulse Hunter, Sky's Embrace type pools", guar: true},
  standard: {n: "Xspace Echo", sub: "Standard pool, uses Empyrean Wishes", guar: false}
};
function poolFor(type, rerun) {
  if (type === "standard") return "standard";
  if (type === "special") return "special";
  return rerun ? "rerun" : "limited";
}

const FREE_SOURCES = [
  "Orbit",
  "Senior Hunter Contest",
  "Event free wishes (e.g. birthday 20)",
  "Wish reward milestones",
  "Promise rewards",
  "Codes and compensation",
  "Dailies and weeklies",
  "Other"
];

/* Free diamonds from logging in. Users can change the amounts or switch each one off.
   when: daily, weekly (Mondays), monthly (on the day given). need: only while that pass is active. */
const INCOME_SOURCES = [
  {k: "daily",  n: "Daily tasks",              d: 50,  when: "daily"},
  {k: "weekly", n: "Weekly tasks",             d: 150, when: "weekly"},
  {k: "wpack",  n: "Free weekly pack",         d: 20,  when: "weekly"},
  {k: "login",  n: "Weekly login rewards",     d: 90,  when: "monthly", day: 1},
  {k: "day15",  n: "15th-day login reward",    d: 100, when: "monthly", day: 15},
  {k: "aurum",  n: "Aurum Pass",               d: 100, when: "daily",  need: "aurum"},
  {k: "ydia",   n: "Yearly Diamond Pass",      d: 120, when: "weekly", need: "ydiamond"},
  {k: "ywish",  n: "Yearly Wish Pass (1 ticket)", d: 150, when: "weekly", need: "ywish"},
  {k: "ybonus", n: "Deluxe bonus (all 3 yearly passes)", d: 50, when: "weekly", need: "ybonus"}
];

/* The yearly passes run on the same dates for everyone (50 weeks from the anniversary).
   Update these when the new year's passes open. */
const YEARLY = {label: "2026", start: "2025-12-31", end: "2026-12-15", onSale: ["2025-12-31", "2026-01-21"]};
const PROMISE_DAYS = 60;

/* Packs. myr = price in MYR (in-game price list). Other currencies enter their price on first buy.
   wishes = Deepspace Wishes you get at once, emp = Empyrean Wishes.
   Purple Crystals are not counted, since most players keep them for outfits. */
const DEFAULT_PACKS = [
  {id: "aurum",  group: "Passes", name: "Aurum Pass",      myr: 22.9, wishes: 0, pass: "aurum", total: 20, gives: "100 Diamonds a day for 30 days (20 wishes)"},
  {id: "secret", group: "Passes", name: "Secret Promise",  myr: 49.9, wishes: 12, promise: true, gives: "12 Deepspace Wishes for this Promise season"},
  {id: "vow",    group: "Passes", name: "Heartfelt Vow",   myr: 74.9, wishes: 12, emp: 10, promise: true, gives: "Secret Promise rewards plus 10 Empyrean Wishes", check: true},
  {id: "ydiam",  group: "Passes", name: "Yearly Diamond Pass", myr: 69.9, wishes: 0, pass: "ydiamond", yearly: true, total: 40, gives: "120 Diamonds a week for 50 weeks"},
  {id: "ywish",  group: "Passes", name: "Yearly Wish Pass",    myr: 49.9, wishes: 0, pass: "ywish", yearly: true, total: 50, gives: "1 Deepspace Wish a week for 50 weeks"},
  {id: "ygrow",  group: "Passes", name: "Yearly Growth Pass",  myr: 49.9, wishes: 0, pass: "ygrowth", yearly: true, total: 0, gives: "Growth materials. Buy all 3 yearly passes for the deluxe bonus"},
  {id: "waurum", group: "Passes", name: "Weekly Aurum",    myr: 34.9, wishes: 7, gives: "150 Diamonds a day for 7 days"},
  {id: "s1", group: "Solo pool packs",  name: "Pack I",   myr: 1.9,  wishes: 1, limit: 3},
  {id: "s2", group: "Solo pool packs",  name: "Pack II",  myr: 4.9,  wishes: 2, limit: 3},
  {id: "s3", group: "Solo pool packs",  name: "Pack III", myr: 22.9, wishes: 6, limit: 3},
  {id: "m1", group: "Multi pool packs", name: "Pack I",   myr: 1.9,  wishes: 1, limit: 5},
  {id: "m2", group: "Multi pool packs", name: "Pack II",  myr: 4.9,  wishes: 2, limit: 3},
  {id: "m3", group: "Multi pool packs", name: "Pack III", myr: 22.9, wishes: 6, limit: 5},
  {id: "y1", group: "Myth pool packs",  name: "Pack I",   myr: 1.9,  wishes: 1, limit: 5},
  {id: "y2", group: "Myth pool packs",  name: "Pack II",  myr: 4.9,  wishes: 2, limit: 5},
  {id: "y3", group: "Myth pool packs",  name: "Pack III", myr: 22.9, wishes: 6, limit: 5},
  {id: "r1", group: "Rerun pool packs", name: "Pack I",   myr: 4.9,  wishes: 2, limit: 1},
  {id: "r2", group: "Rerun pool packs", name: "Pack II",  myr: 22.9, wishes: 6, limit: 3},
  {id: "r3", group: "Rerun pool packs", name: "Pack III", myr: 39.9, wishes: 8, limit: 3},
  {id: "a10", group: "Association packs", name: "Level 10", myr: 4.9,   wishes: 2,   limit: 1},
  {id: "a15", group: "Association packs", name: "Level 15", myr: 24.7,  wishes: 6,   limit: 1},
  {id: "a20", group: "Association packs", name: "Level 20", myr: 34.6,  wishes: 8,   limit: 1},
  {id: "a25", group: "Association packs", name: "Level 25", myr: 49.45, wishes: 12,  limit: 1},
  {id: "a30", group: "Association packs", name: "Level 30", myr: 74.19, wishes: 15,  limit: 1},
  {id: "a35", group: "Association packs", name: "Level 35", myr: 98.94, wishes: 20,  limit: 1},
  {id: "a40", group: "Association packs", name: "Level 40", myr: 148.44, wishes: 30, limit: 1},
  {id: "a50", group: "Association packs", name: "Level 50", myr: 247.42, wishes: 50, limit: 1},
  {id: "a60", group: "Association packs", name: "Level 60", myr: 296.92, wishes: 60, limit: 1},
  {id: "a65", group: "Association packs", name: "Level 65", myr: 494.9,  wishes: 100, limit: 1}
];
const PASSES = {
  aurum:    {n: "Aurum Pass"},
  ydiamond: {n: "Yearly Diamond Pass"},
  ywish:    {n: "Yearly Wish Pass"},
  ygrowth:  {n: "Yearly Growth Pass"},
  ybonus:   {n: "Deluxe bonus"}
};
