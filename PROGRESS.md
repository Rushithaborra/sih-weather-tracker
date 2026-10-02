# Progress log (next-features)

## Final report — queue stopped at Feature 5 (download stop rule)

Branch `next-features`, pushed; merges cleanly into `main`. Nothing merged; published numbers on
`main` unchanged. Commits are authored as Rushitha Borra.

| Feature | Status | Key numbers | Commit |
|---|---|---|---|
| Forecast skill (GEFS) | done | 28 starts, 7 storms; median track error day 0–1: 59 km (operational) / 50 km (reforecast), day 3–4: 217 / 193 km; ≥ 50% of members detect the storm 24–39 h before landfall from −1 d starts | 304e901, 6a0925f |
| 1 Quiet-period test | done | 0 objects in 50 cyclone-free days (5 windows); without the 17 m/s gate: 32 tracks (6.4 / 10 days) | cbcc0e6 |
| 2 Rainfall vs IMD | partial — 5 of 8 storms; > 1.5× time limit (IMD server ~4 KB/s) | pooled r 0.862, bias −5 mm, ERA5 keeps median 62% of the observed peak; ≥ 204.5 mm cells IMD 29 vs ERA5 3 | eeae196 |
| 3 City panel (Live page) | done | 12 cities, Open-Meteo current + ECMWF IFS ensemble (51 members) per IMD day; error state verified | b51d309 |
| 4 Track merging option | done (default off) | joins 1 of 5 fragmented storms (Bulbul 3 → 2 tracks), no error change; 5 false links in the no-gate quiet diagnostic | 788a3a5 |
| 5 IFS alongside GEFS | stopped — climatology download 6.50 GB > 5 GB | nothing built | — |

Changes made after seeing results (all in DEV_LOG.md):
1. Quiet test: no-wind-gate diagnostic added after the 0-object result (frozen detector unchanged).
2. Track-merging rule (written before coding, prompted by the fragmentation result).
3. Rainfall vs IMD: IMD date convention corrected after the alignment check (r 0.36–0.94 vs −0.04–0.32).
4. GEFS skill: matching-rule effect documented (no change made).

Open decisions for you:
1. GEFS matching rule: when the storm is below gale at the first step (≤ 30 kt), treat the start like a
   genesis start? Today those starts count every member as a miss (Yaas −3 d 4/31 vs −5 d 27/31).
2. Track merging default: recommend keep off (helps 1 of 5 storms, adds false links when the gate is relaxed).
3. Feature 5 climatology: every 4th day (≈ 4.95 GB), 3 years (≈ 3.9 GB), or raise the 5 GB limit.
4. GEFS job migration to an orphan `live-data` branch: still open, needs Sushanth.
5. Merging `next-features` into `main` (this updates the public site).

Deviations from the instructions, and why:
- Forecast skill ran on GitHub Actions, not locally (decision was "locally"): measured 5–15 h on this
  connection and it stops when the Mac sleeps; Actions took 32 min. Only processed results committed.
- Feature commits landed in the order 1, 3, 4, 2: Feature 2 was blocked on the IMD server, so 3 and 4
  were done while it downloaded.
- Quiet test ran 5 windows, not 6: March had no quiet window under the declared swap rule.
- Sushanth's `LiveForecast.jsx` was edited (two lines) to place the city panel.
- The hashes written inside per-feature entries below may differ from the final ones (commits were
  amended); the table above has the final hashes.

---

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

## Feature 5: ECMWF IFS alongside GEFS — stopped (download stop rule)

- First step, the wider climatology (Sep–Dec, 0–35°N / 60–100°E, wind + MSLP + T2m, 2015–2019,
  every 3rd day): measured 840 time steps × 7.74 MB (wind 3.22, MSLP 2.18, T2m 2.34 MB per
  full-globe step) = **6.50 GB > 5 GB**. Stopped before downloading; nothing for Feature 5 was built.
- Options for you: every 4th day (≈ 4.95 GB, all 5 years), 3 years every 3rd day (≈ 3.9 GB), or
  raise the limit. The IFS fetch itself was already verified in Prompt 0 (30 Sep 00Z run, 6.5 MB
  for two steps, opens with cfgrib).

## Feature 2: Rainfall vs IMD — partial (5 of 8 storms; over 1.5× the time limit)

- `scripts/rainfall_vs_imd.py` → `data/processed/rainfall_vs_imd.json`; README section + Verification card.
- IMD 0.25° gridded rainfall vs ERA5 hourly rain summed over the same IMD day (24 h ending 03 UTC),
  IMD land cells inside the main-track box + 1°, landfall day and the day after.
- Pooled (Amphan, Yaas, Titli, Fani, Nivar; 10 storm-days, 2,308 cells): r = 0.862, bias −5.0 mm,
  **peak kept: median 62% (range 9–80%)**; cells ≥ 64.5 mm IMD 435 vs ERA5 379, ≥ 115.6 mm 176 vs 126,
  **≥ 204.5 mm 29 vs 3**. Lowest retention all on the day after landfall (Amphan 14%, Yaas 18%, Fani 9%).
- Correction after seeing results (DEV_LOG 2026-10-02): the IMD date was first taken as the start of
  its 24 h; the one-day-shift check showed r = 0.36–0.94 for the other alignment on all 10 days vs
  −0.04–0.32, so the IMD date labels the 24 h ending at 03 UTC. Fixed.
- Didn't work: the IMD server serves ~4 KB/s and drops transfers; only 2020 downloaded fully. Partial
  year files are read directly (whole days; reader verified identical to imdlib on 20 May 2020).
  Phailin (2013), Hudhud (2014) and Bulbul (Nov 2019) still lack their days; downloads keep running
  and a rerun of the script adds them. GEFS rainfall not compared (the skill run has no precipitation).
