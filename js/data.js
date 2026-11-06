/* Wishbound — game data and app config.
   Edit this file to update packs, income amounts, love interests or credits. */
"use strict";

const CONFIG = {
  appName: "Wishbound",
  tagline: "LADS wish & spending tracker",
  author: "@pookieleb",
  authorUrl: "https://x.com/pookieleb",
  githubUrl: "https://github.com/Myouipingu/wishbound",
  kofiUrl: "",            // put a Ko-fi / Buy Me a Coffee link here to show the support button
  hardPity: 70,
  softPity: 60,
  diamondsPerWish: 150,
  version: "2.0.0"
};

/* Love interests. Colours are Wishbound's own, not official. */
const LIS = [
  {k: "xavier",  n: "Xavier",  c: "#5b84e6"},
  {k: "zayne",   n: "Zayne",   c: "#3fa7b8"},
  {k: "rafayel", n: "Rafayel", c: "#a76bdd"},
  {k: "sylus",   n: "Sylus",   c: "#d14a4a"},
  {k: "caleb",   n: "Caleb",   c: "#d99a3e"}
];

const CURRENCIES = [
  ["MYR", "RM"], ["SGD", "S$"], ["USD", "US$"], ["PHP", "₱"], ["IDR", "Rp"], ["THB", "฿"], ["VND", "₫"],
  ["EUR", "€"], ["GBP", "£"], ["AUD", "A$"], ["CAD", "C$"], ["NZD", "NZ$"], ["JPY", "¥"], ["KRW", "₩"],
  ["TWD", "NT$"], ["HKD", "HK$"], ["INR", "₹"], ["BRL", "R$"], ["MXN", "MX$"]
];

/* Banner types. pool = which pity counter the banner uses.
   First-run limited banners share one pity; reruns share another;
   the standard banner and special banners each have their own. */
const BANNER_TYPES = [
  {k: "myth",     n: "Myth",               canRerun: true,  rate: "50/50"},
  {k: "solo",     n: "Solo",               canRerun: true,  rate: "50/50"},
  {k: "multi",    n: "Multi",              canRerun: true,  rate: "75/25"},
  {k: "bday",     n: "Birthday",           canRerun: true,  rate: "50/50"},
  {k: "special",  n: "Special (Pulse Hunter / Sky's Embrace type)", canRerun: false, rate: "50/50"},
  {k: "standard", n: "Standard (Xspace Echo)", canRerun: false, rate: "none"}
];
const POOLS = {
  limited:  {n: "Limited",  sub: "Myth, solo, multi & birthday (first run)", guar: true},
  rerun:    {n: "Rerun",    sub: "All rerun banners", guar: true},
  special:  {n: "Special",  sub: "Pulse Hunter / Sky's Embrace type", guar: true},
  standard: {n: "Standard", sub: "Xspace Echo (blue wishes)", guar: false}
};
function poolFor(type, rerun) {
  if (type === "standard") return "standard";
  if (type === "special") return "special";
  return rerun ? "rerun" : "limited";
}

/* Free wish sources for the "Add free wishes" dropdown */
const FREE_SOURCES = [
  "Orbit / farming",
  "Senior Hunter Contest",
  "Event free pulls (e.g. birthday 20)",
  "Wish milestone rewards",
  "Event check-in",
  "Open Promise rewards",
  "Codes / compensation",
  "Daily / weekly tasks",
  "Other"
];

/* Pull purposes, so card pulls and extra pulls can be told apart */
const PURPOSES = [
  {k: "card",  n: "Going for the card"},
  {k: "extra", n: "Extra: outfit / pose / milestone"},
  {k: "rank",  n: "Extra: ranking up the card"}
];

/* Automatic free income (diamonds). Users can change amounts or switch each off.
   when: daily | weekly (Mondays) | monthly (1st). need: only while that pass is active. */
const INCOME_SOURCES = [
  {k: "daily",    n: "Daily tasks",              d: 50,  when: "daily"},
  {k: "weekly",   n: "Weekly tasks",             d: 150, when: "weekly"},
  {k: "wpack",    n: "Free weekly pack",         d: 20,  when: "weekly"},
  {k: "login",    n: "Monthly login rewards",    d: 190, when: "monthly"},
  {k: "aurum",    n: "Aurum Pass daily claim",   d: 100, when: "daily",  need: "aurum"},
  {k: "ydiamond", n: "Yearly Diamond pass",      d: 120, when: "weekly", need: "ydiamond"},
  {k: "ywish",    n: "Yearly Wish pass",         d: 150, when: "weekly", need: "ywish"},
  {k: "ybonus",   n: "All-3 yearly passes bonus", d: 50, when: "weekly", need: "ybonus"}
];

/* Passes: days they run for, instant diamonds, and the income source they switch on */
const PASSES = {
  aurum:    {n: "Aurum Pass",      days: 30,  instant: 300},
  ydiamond: {n: "Yearly Diamond",  days: 350, instant: 680},
  ywish:    {n: "Yearly Wish",     days: 350, instant: 680},
  ygrowth:  {n: "Yearly Growth",   days: 350, instant: 680},
  ybonus:   {n: "All-3 yearly bonus", days: 350, instant: 0}
};

/* Default packs. price is in MYR; for other currencies the price is asked on first buy.
   wishes = Deepspace wishes given straight away; emp = Empyrean (blue) wishes.
   pass = which pass it starts. total = wishes you get over the whole pass. */
const DEFAULT_PACKS = [
  {id: "aurum",   group: "Passes", name: "Aurum Pass",      myr: 22.9, wishes: 2,     pass: "aurum",    total: 22,    note: "300 now + 100 diamonds daily for 30 days"},
  {id: "secret",  group: "Passes", name: "Secret Promise",  myr: 49.9, wishes: 12,    note: "Promise season (about 60 days)"},
  {id: "vow",     group: "Passes", name: "Heartfelt Vow",   myr: null, wishes: 12,    emp: 10, note: "Secret Promise rewards + 10 Empyrean"},
  {id: "ydiam",   group: "Passes", name: "Yearly Diamond",  myr: 69.9, wishes: 4.53,  pass: "ydiamond", total: 44.53, note: "680 now + 120 weekly for 50 weeks"},
  {id: "ywish",   group: "Passes", name: "Yearly Wish",     myr: 49.9, wishes: 4.53,  pass: "ywish",    total: 54.53, note: "680 now + 150 weekly for 50 weeks"},
  {id: "ygrow",   group: "Passes", name: "Yearly Growth",   myr: 49.9, wishes: 4.53,  pass: "ygrowth",  total: 4.53,  note: "680 now"},
  {id: "waurum",  group: "Passes", name: "Weekly Aurum",    myr: 34.9, wishes: 7,     note: "150 daily for 7 days"},
  {id: "s1", group: "Solo banner",  name: "Pack I",   myr: 1.9,  wishes: 1, limit: "3"},
  {id: "s2", group: "Solo banner",  name: "Pack II",  myr: 4.9,  wishes: 2, limit: "3"},
  {id: "s3", group: "Solo banner",  name: "Pack III", myr: 22.9, wishes: 6, limit: "3"},
  {id: "m1", group: "Multi banner", name: "Pack I",   myr: 1.9,  wishes: 1, limit: "5"},
  {id: "m2", group: "Multi banner", name: "Pack II",  myr: 4.9,  wishes: 2, limit: "3"},
  {id: "m3", group: "Multi banner", name: "Pack III", myr: 22.9, wishes: 6, limit: "5"},
  {id: "y1", group: "Myth banner",  name: "Pack I",   myr: 1.9,  wishes: 1, limit: "5"},
  {id: "y2", group: "Myth banner",  name: "Pack II",  myr: 4.9,  wishes: 2, limit: "5"},
  {id: "y3", group: "Myth banner",  name: "Pack III", myr: 22.9, wishes: 6, limit: "5"},
  {id: "r1", group: "Rerun banner", name: "Pack I",   myr: 4.9,  wishes: 2, limit: "1"},
  {id: "r2", group: "Rerun banner", name: "Pack II",  myr: 22.9, wishes: 6, limit: "3"},
  {id: "r3", group: "Rerun banner", name: "Pack III", myr: 39.9, wishes: 8, limit: "3"},
  {id: "a10", group: "Association", name: "Level 10", myr: 4.9,   wishes: 2},
  {id: "a15", group: "Association", name: "Level 15", myr: 24.7,  wishes: 6},
  {id: "a20", group: "Association", name: "Level 20", myr: 34.6,  wishes: 8},
  {id: "a25", group: "Association", name: "Level 25", myr: 49.45, wishes: 12},
  {id: "a30", group: "Association", name: "Level 30", myr: 74.19, wishes: 15},
  {id: "a35", group: "Association", name: "Level 35", myr: 98.94, wishes: 20},
  {id: "a40", group: "Association", name: "Level 40", myr: 148.44, wishes: 30},
  {id: "a50", group: "Association", name: "Level 50", myr: 247.42, wishes: 50},
  {id: "a60", group: "Association", name: "Level 60", myr: 296.92, wishes: 60},
  {id: "a65", group: "Association", name: "Level 65", myr: 494.9,  wishes: 100}
];
