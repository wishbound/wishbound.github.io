# Wishbound: notes for Claude

Wishbound is a free fan web app for Love and Deepspace (LADS) players: wishes, Diamonds, pity, spending, budget, every wish pool and 5★ Memory (Have/Want). It's meant as an easier-to-read version of the game's Item History and Purchase History, with spending tracked like a budget app (past, current, future, total). Live at https://wishbound.github.io (GitHub Pages, served from `main`). In testing; public release planned later.

## Style
- Design: simple, pretty, close to the game's look. Wording plain, not "AI slop".
- Works well on iPad and phone.

## How it's built
- No framework, no build step. `index.html`, `css/style.css`, `js/data.js` (prices, daily income, pass dates, version, changelog, sync settings), `js/catalog.js` (wish pools in `BANNERS`, Memories in `MEMORIES`), `js/app.js` (the app), `sw.js` (offline cache), `assets/`, `icons/`.
- New banner: `js/catalog.js` is generated, don't edit it by hand. Add the banner (and any new 5★ Memories) to the lists in `tools/catalog.py`, then run `python3 tools/catalog.py`. Mark unconfirmed dates with `approx`. Game data comes from the LADS Wiki (loveanddeepspace.wiki.gg).
- Testing: serve the repo (`python3 -m http.server 8765`) and run `python3 tools/smoke_test.py`. It clicks through every screen and pop-up and reports errors.
- Only outside resource: Google Fonts (Figtree, Marcellus).

## User data: be careful
- Each user's data lives only on their own device: `localStorage` keys `wishbound-v2` and `wishbound-meta`. Every user starts from 0.
- Never rename the keys or change the data shape without code that upgrades existing data. Old backup files must keep restoring correctly. Test: make data, back up, wipe, restore, compare.
- Sync (Supabase, `supabase/setup.sql`, `syncUrl`/`syncKey` in `js/data.js`) is NOT switched on and is postponed until everything else is done. Before turning it on, do a full security review first: only the public anon key may ever go in the code (never the service_role key), and check the sync codes can't be guessed.

## Releasing an update
1. Bump `version` in `js/data.js` (1.x.0 new features, 1.x.y fixes; 1.0.0 was the first version in use, not the public release) and add an entry at the top of `CHANGELOG` in `js/data.js`.
2. Bump `VERSION` in `sw.js` to match (`wishbound-1.x.y`). If you add a new app file, add it to `FILES` in `sw.js`.
3. Check on a tablet- and phone-sized screen, then commit and push to `main`. Use a branch for risky experiments.

## Credit: important
- Public credit is only `@pookieleb` (X) and the GitHub organization `wishbound`. Never add any real name, other social handles, or links to other projects in this repo, the app, or commit messages.
- This repo is public. No personal details, keys or passwords.
- Keep the fan-made disclaimer (not affiliated with Infold Games / Papergames) and the copyright note in the README.

## Security checklist (static site)
- Escape anything the user types before it goes into the page. Never put user text straight into `innerHTML`.
- Restoring a backup or importing a CSV must check the file and never run anything from it.
