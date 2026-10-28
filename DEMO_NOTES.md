# Softvery Demo Admin — notes (Jira ATT-7)

Offline, white-label demo of the operator panel for the ICEV Berlin exhibition. It is the admin side of the
**Softvery Demo** app (ATT-6) and uses the same seed: 6 countries, 8 cities, 10 providers (15 locations),
25 programmes, 15 stays, 6 packages, extras, 7 experiences, promo code **BERLIN10**, 30 community posts and the
course-plan curricula. There is no backend: every request is answered in the browser, and changes are saved in that
browser until **Reset demo**.

## Run it on the booth laptop (macOS)

1. Needs **Node.js 18+** once (`node -v`). No internet is needed after that.
2. Double-click **`start-demo.command`** in Finder. The first time macOS may block it: right-click → **Open** → Open.
3. A Terminal window starts the local server and the browser opens **http://localhost:4317/**. Keep the Terminal
   window open during the demo; close it (or Ctrl+C) to stop.

Same thing from a terminal: `npm run serve:demo -- --open` (or `node scripts/serve-demo.js --port 4317 --open`).
The server (`scripts/serve-demo.js`) has no dependencies: it serves `dist/` with an SPA fallback on 127.0.0.1 only.
Use the same port every time — demo data is stored per browser and per origin (`localhost:4317`).

## Hosted copy (GitHub Pages)

https://softverysolutions.github.io/softverysolutions-icev-demo-admin/ — same build under a sub-path. Each visitor's
changes stay in their own browser. To update it:

```bash
npm run build:pages     # PUBLIC_URL=/softverysolutions-icev-demo-admin → build-pages/ (+ 404.html SPA fallback, .nojekyll)
```

then publish `build-pages/` as the root of the `gh-pages` branch. Deep links are served through `404.html`, so the
browser logs a 404 for the page itself on a direct load or reload; the app then renders normally.

## Booth cheat sheet

| What to show | How |
| --- | --- |
| Sign in | Pre-filled. Pick **Super admin**, **Admin** or **Consultant** → **Sign in**. Any password works. |
| Switch role | User menu (top right) → **Switch role**. Admin has no *Team and roles*; Consultant sees a read-only catalogue, orders and moderation only. |
| A1 Dashboard | *Dashboard → Analytics*, period switch 7 days / 30 days / 12 months. |
| A2 Add a programme | *Catalogue → Providers* → CodeForge Academy → CodeForge Berlin → **Add programme** → Basics (Tech/Sport type, skill level, hours per week, equipment, certificate, start dates) → Pricing (price list) → Extras → Finish. |
| A3 Build a package | *Packages → Packages* → **Create package**: provider, location, programme and start date, stay, extras and experiences, gallery, discount. |
| A4 Handle an order | *Sales → Orders*: filter by status/payment → open an order → **Edit order** (change stay or extras: the price is recalculated, the change is written to the audit log) → **Cancel order** with refund status. |
| Promo codes | *Sales → Promo codes* → **Create promo code**. BERLIN10 (10%) is the code the app accepts. |
| Reviews | *Community → Reviews* → Pending → open → **Approve**. Ratings: Instructors, Curriculum, Facilities, Equipment, Organisation. |
| Community moderation | *Community → Community moderation* → Flagged → **Hide** / **Keep**; *Hidden* → **Restore**. |
| Course plans | *Learning → Course plans* → pick a programme type → edit a week or a lesson topic (goal, homework), add or reorder lessons. |
| Team and roles | *Team → Team and roles* (Super admin): invite, change role, deactivate. |
| **Reset demo** | User menu → **Reset demo** → confirm. All changes and uploads made in this browser are discarded and the seed comes back; you stay signed in. |

Admin and app are demonstrated separately: they share the catalogue but admin edits do not reach the phone.

## Build

```bash
nvm use 18                       # Node 18 (as the source project)
npm ci --legacy-peer-deps
npm run lint                     # eslint src
npm test -- --watchAll=false     # jest (react-scripts)
npm run build:demo               # production build → dist/ (committed, so the laptop needs no build)
```

`npm start` runs the dev server; the mock API works there too.

## How it works

- **Mock API** — `src/demo/mocks`. [MSW](https://mswjs.io) (`public/mockServiceWorker.js`) intercepts the raw
  `fetch` calls the services already make to `${origin}/demo-api/...`; service code is mostly unchanged.
  - `domains/*.js` — one module per area (catalogue, stays, extras, packages, destinations, promotions, orders,
    people, analytics, reviews, community, learning): `seed(ctx)` builds API-shaped records from
    `src/demo/seed/*.json` (copied from the app), `handlers` answers the endpoints.
  - `db.js` — the whole demo database in `localStorage` (`softvery-demo-admin:db:v1`), built from the seed on first
    load. Unknown endpoints answer 404 and log `[demo api] no mock for …`.
  - `media.js` — uploads (presigned-URL flow) are stored in IndexedDB and served back from `/demo-media/<key>`, so
    they survive a reload. Photos for the seed are bundled in `public/demo-images` (Unsplash, see `CREDITS.md`).
  - `src/demo/reset.js` — **Reset demo** clears the database and uploads and reloads.
- **Auth** — `src/demo/session.js` replaces the hosted auth SDK (same `getAuth().currentUser.getIdToken()` shape).
  The session and the chosen role live in `localStorage`. Unknown roles fall back to the most restricted role
  (Consultant), see `src/permissions/role.js`; the old default of Admin is gone.
- **Dates** are relative to today (cohorts every 6 weeks from the first Monday a month out, weekly starts any Monday).
- **Currency**: EUR only.

## Decisions

- **Copy source**: the working tree of the client's admin repository, copied without `.git`, CI workflows, Docker /
  deployment files, nginx config, env files and local agent settings. History starts from a clean commit.
- **Removed**: consultant chat, checkout builder and quotes, Trip Club, Trip Store, visa process, checklists,
  documents (catalogue and order documents), timeline & tasks, non-purchaser journey, insurance provider integration,
  payment settings / instalments, location video shorts, city videos, article picker, Sign Up, the hosted auth SDK,
  socket client, and all unrouted template pages (dashboards, ecommerce, pages, applications, other auth variants)
  plus their assets and unused dependencies.
- **Adapted for Tech & Sport**: provider types tech/sport; programme editor with the app's programme types, skill
  level, hours per week, equipment and certificate; accommodation categories incl. shared apartment, campus
  residence and surf house; extras such as equipment and laptop rental, certification exam, airport transfer;
  orders without visa/insurance/refund-provider copy and without Export; review categories Instructors, Curriculum,
  Facilities, Equipment, Organisation; destinations with tech scene and surf/sport season instead of consulate and
  study & work rules; Course plans built on the Learning Journey editor; new Community moderation screen.
- **Brand**: "Softvery Demo Admin", violet `#6D4AFF` / deep violet `#241A5C` / mint `#3EE6B0` (same palette as the
  app) replacing the template magenta/cyan, Manrope (bundled via `@fontsource/manrope`), Material Icons bundled via
  `material-icons` (no Google Fonts), logo and favicon generated from the app logo, "Demo by Softvery Solutions"
  footer. Template chrome (configurator, fake notifications, template footers and links, GitHub buttons script) removed.
- **Template licence**: the UI is built on Creative Tim's *Soft UI Dashboard PRO React*. The file headers and the
  licence notice are kept on purpose. Check that the licence held covers this demo.
