# Softvery Demo Admin

Offline, white-label demo of the admin panel behind the **Softvery Demo** app (ICEV Berlin, Jira ATT-7).
React + MUI (Soft UI Dashboard PRO React by Creative Tim), with an in-browser mock API (MSW) and demo data
stored in the browser.

- **Run on a Mac**: double-click `start-demo.command` (Node 18+ required, no internet) → http://localhost:4317/
- **Booth cheat sheet, build and architecture**: [DEMO_NOTES.md](DEMO_NOTES.md)
- **Screenshots**: [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md)

```bash
npm ci --legacy-peer-deps
npm start            # dev server
npm run build:demo   # production build → dist/
npm run serve:demo   # serve dist/ on localhost:4317
```

Licence: the UI template is © Creative Tim, used under its licence (https://www.creative-tim.com/license).
