# Anomaly Tracker — concept dashboard (SIH 2026 · PS 26078)

A front-end-only React/Vite/Tailwind UI concept for the pitch deck. **No backend, no live ML.**
Every number on screen is read from `src/data/cases.js`, which is copied — not invented — from the
real pipeline's output in `../data/processed/{amphan,yaas}/` (tracks, validation, alert-tier counts).
See `../README.md` and `../DEV_LOG.md` for how that pipeline produced them, and `../app.py` for the
actual working Streamlit dashboard this concept UI is styled after.

Two real, validated cases are wired in and switchable from the top bar: Amphan 2020 (in-sample) and
Yaas 2021 (held out). Nothing here is a live forecast — both are tracking of observed events on ERA5
reanalysis, replayed.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deploy to Vercel

1. Push this repo to GitHub (see root README / repo for the remote).
2. In Vercel: **New Project** → import `sih-weather-tracker` → set **Root Directory** to
   `dashboard-ui` (this folder — the repo root is the Python/Streamlit app, not this UI).
3. Framework preset: **Vite**. Build command `npm run build`, output directory `dist` (Vercel
   detects both automatically once the root directory is set).
4. Deploy. No environment variables are needed — everything is static/client-side.

Or via CLI from this folder:

```bash
npm i -g vercel
vercel --prod
```
