# Progress log (next-features)

Branch `next-features`. Nothing here is merged into `main`; published numbers on `main` are unchanged.

## Forecast skill (GEFS, 7 held-out storms) — done

- Script `scripts/gefs_forecast_skill.py` (commit 304e901); results committed by the
  `GEFS forecast skill` workflow (6a0925f): `data/processed/gefs_skill/` — one JSON and one
  strike-probability map per start (28 starts), plus `summary.json`.
- Run on GitHub Actions (32 min, ~19 GB of GEFS fields) instead of locally: locally the same
  download measured 5–15 h at ~0.35–1 MB/s and stops when the Mac sleeps. Only processed results
  are committed; no raw data.
- Data: GEFS v12 operational (Nivar, Yaas; 31 members) and GEFSv12 reforecast (Phailin, Hudhud,
  Titli, Fani, Bulbul; 5 members, 11 on Wednesdays), pooled separately. Amphan excluded (only
  GEFS v11, 1°). Starts 00 UTC, 7/5/3/1 days before landfall; frozen DEFAULTS; anomalies vs
  era5_monthly_stats.nc (ERA5 2010–2019) — model bias enters the z-scores, not an EFI.
- Matching: as decided (object within 300 km at the first step, or first track within 300 km for
  genesis); unmatched members are misses.

| Storm | −7 d | −5 d | −3 d | −1 d | First time ≥ 50% of members detect |
|---|---|---|---|---|---|
| Nivar (op.) | 16/31 | 23/31 | 8/31 | 31/31 | only from the −1 d start: 24 h before landfall |
| Yaas (op.) | 18/31 | 27/31 | 4/31 | 31/31 | −1 d start: 30 h |
| Phailin (ref.) | 4/5 | 5/5 | 5/11 | 5/5 | −7 d and −5 d starts: 108 h; −1 d: 36 h |
| Hudhud (ref.) | 3/5 | 0/5 | 5/5 | 5/5 | −3 d: 75 h; −1 d: 27 h |
| Titli (ref.) | 2/5 | 2/5 | 0/5 | 5/11 | never |
| Fani (ref.) | 4/5 | 5/5 | 5/5 | 5/5 | −5 d: 120 h; −3 d: 72 h; −1 d: 24 h |
| Bulbul (ref.) | 0/5 | 0/5 | 0/11 | 5/5 | −1 d: 39 h |

Track error of matched members, pooled by lead day (median, km):

| Lead (days) | 0–1 | 1–2 | 2–3 | 3–4 | 4–5 | 5–6 | 6–7 | 7–8 |
|---|---|---|---|---|---|---|---|---|
| Operational (Nivar, Yaas; 158/248 members matched) | 59 | 94 | 230 | 217 | 217 | 254 | 310 | 399 |
| Reforecast (5 storms; 65/118 matched) | 50 | 85 | 129 | 193 | 315 | 370 | 492 | 584 |

**Matching-rule effect (not a code error):** every "at start" start with few or no matches began
with the storm at ≤ 30 kt (≤ 15 m/s) — below the detector's 17 m/s gate, so it cannot be detected at
the first step and the whole member counts as a miss even if it detects the storm later. This is
why −3 d starts match fewer members than −5 d genesis starts (Yaas 4/31 vs 27/31). The one clear
GEFS miss is Titli −1 d (storm at 70 kt, 5/11 members). Open decision below.

Cosmetic: the strike maps' colour bar top label reads "100.1" (the top contour level); not fixed,
as regenerating the maps needs another 30-min run.

## Feature 1: Quiet-period test — done (c47df42, ~1 h)

- `scripts/quiet_period_test.py`; windows declared in DEV_LOG before running; results in
  `data/processed/quiet_periods.json`; README section + Verification card.
- 5 of 6 windows run (50 days): Jan 2021, Jul 2020, Aug 2021, Oct 2022, Dec 2021 (Dec swapped 16×
  from 2020-12-15 by the declared rule). March: no quiet window under the rule (two IBTrACS
  depressions in March 2022).
- **0 objects, 0 tracks** with the frozen detector. Strongest regional wind 11.5–15.9 m/s, below the
  17 m/s gate in every window.
- Diagnostic (added after seeing the result, frozen DEFAULTS unchanged): without the wind gate,
  80 objects / 32 tracks (6.4 per 10 days), 19 over land; Jul/Aug 12 objects, mostly over land
  (possible monsoon lows, not in IBTrACS, so unverified).
- Didn't work: IMD monsoon-depression list is not available offline; Jul/Aug objects are reported
  separately instead of being checked against it.

## Feature 3: City panel on the Live page — done (~40 min)

- New `dashboard-ui/src/components/CityWeatherPanel.jsx` + `src/lib/openMeteo.js`; client-side,
  no key. 12 cities: current conditions (forecast API) and, per selected city, the ECMWF IFS
  ensemble (0.25°, 51 members) for each complete IMD rainfall day (03–03 UTC): share of members
  with max wind ≥ 17 and ≥ 25 m/s, median member 24 h rain and its IMD category.
- Shows model, run time (from Open-Meteo's model metadata; 30 Sep 18Z at test time) and the
  Open-Meteo attribution; label "Live, unvalidated point forecast; not the tracking pipeline.
  Official warnings: IMD". Error state verified with the API blocked (test only).
- At test time (1 Oct): 9 complete IMD days returned for Kolkata, all 0% of members at gale.
- Sushanth's file `LiveForecast.jsx` edited (import + one line to place the panel) — necessary.
- Committed before Feature 2 because Feature 2 is waiting on the IMD server (~4 KB/s).

## Feature 4: Track merging as an option — done (~35 min)

- Rule written in DEV_LOG before coding (post-results change). `tracker.run(..., merge_tracks=False)`
  + `tracker.merge_track_fragments`; default off; DEFAULTS unchanged; 2 new tests.
- `scripts/evaluate_track_merging.py` → `data/processed/track_merging.json`. No-merge run reproduces
  the published tracks for all 8 storms.

| Storm | Tracks no-merge → merge | Pmin median (km) | Links | False links |
|---|---|---|---|---|
| Amphan, Yaas, Phailin, Hudhud, Titli, Fani, Nivar | unchanged (1/3/2/2/2/1/1) | unchanged | 0 | 0 |
| Bulbul | 3 → 2 | 23.7 → 23.7 | 1 (12 h, 241 km; ends 75/115 km from best track) | 0 |

- POD unchanged by construction (merging relabels tracks; no objects added or removed).
- Quiet windows: frozen detector 0 tracks → 0 links. No-gate diagnostic: 32 → 27 tracks via 5 links,
  all false (no storm present).
- Why it barely helps: the fragmentation counted earlier is mostly concurrent objects (two at the
  same time), which a sequential-gap rule cannot join; it fixes 1 of 5 fragmented storms and does
  not change any main-track error. Recommendation: keep the default off.
