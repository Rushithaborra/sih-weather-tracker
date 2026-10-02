# Development log

Internal notes. Not for the presentation.

## 2026-09-29: first full run (superseded)

- Climatology: 230 samples, **00 UTC only**, 7–29 May 2010–2019.
- Detection: `z_ws >= 2`, min 6 cells, 400 km / 6 h gate. Std floor 0.1.
- Result: 495 objects in 235 tracks. Validated track picked as "longest" = a post-landfall
  fragment (track 176, 5 matched steps from 20 May 12 UTC). Mean error 292 km, median 213 km.
- Diagnosis: comparing 06/12/18 UTC case steps with a 00 UTC-only climatology turned the
  normal daytime wind over land into z-scores of 15+ (e.g. 14 May 06 UTC, 25.25N 99.75E:
  4.2 m/s vs climatology 0.74 ± 0.23 m/s). Cells with z_ws >= 2 jumped from 66 (00 UTC) to
  947 (06 UTC). These false objects fragmented Amphan's track.
- **This error measured the detection bug, not the method. Do not quote it.**

## Fixes applied

1. Per-hour-of-day climatology, 2015–2019 for all four UTC hours (115 samples each).
   06/12/18 UTC fetched with `scripts/fetch_clim_resumable.py`; 00 UTC 2010–2014 samples dropped.
2. Std floors: 1 m/s (wind), 1 hPa (MSLP).
3. Default detection: `z_ws >= thr AND z_msl <= -thr AND ws >= 17 m/s`.
4. Validated track = lowest minimum MSLP (never selected by distance to IBTrACS).
5. Severe alert tier on z-score (percentiles saturate with 115 samples).

## 2026-09-29: rerun with fixes

- Per-hour climatology: 115 samples per UTC hour (00/06/12/18), 2015–2019.
- 17 objects in 1 track (16 May 18 UTC to 20 May 18 UTC), no false objects.
- Validation (track 0, 17 matched steps): mean 58.1 km, median 38.7 km, min 14.0 km, max 240.6 km.
  Error stays under ~80 km until 20 May 00 UTC, then grows through landfall (108, 149, 241 km).

## 2026-09-29: validation block (parameters frozen)

Parameters: z >= 2 AND z_msl <= -2 AND ws >= 17 m/s, min 6 cells, 400 km / 6 h,
std floors 1 m/s / 1 hPa, per-hour climatology 2015–2019 (115/hour).
These were set while looking at Amphan, so **Amphan is in-sample**. **Yaas (May 2021) is held out**:
downloaded afterwards with `fetch_clim_resumable.py --case yaas` and run with nothing changed.

Two positions per object: `centroid` (intensity-weighted anomaly centroid) and
`pmin` (grid cell of minimum MSLP inside the object's bounding box, baseline).

| Case | Objects | Tracks | Matched | Centroid mean / median / min / max (km) | Pmin mean / median / min / max (km) |
|---|---|---|---|---|---|
| Amphan (in-sample) | 17 | 1 | 17 | 58.1 / 38.7 / 14.0 / 240.6 | 31.5 / 24.8 / 5.6 / 152.0 |
| Yaas (held out) | 15 | 3 | 13 | 125.1 / 121.9 / 40.9 / 219.7 | 73.0 / 58.2 / 5.2 / 185.3 |

- Amphan, last three steps (20 May 06/12/18 UTC): centroid 108.1 / 149.2 / 240.6 km; pmin 30.9 / 19.0 / 152.0 km.
- Yaas: main track 0 runs 23 May 12 UTC to 26 May 12 UTC (13 steps, unbroken). Two extra
  single-step objects: 24 May 00 UTC (box 14.6–15.6N, 86.1–87.9E) and 26 May 00 UTC
  (box 20.9–21.9N, 89.9–90.9E), each roughly 300 km from the best-track centre.
  Yaas's first three steps (23 May 12 UTC to 24 May 00 UTC) have the largest errors (pmin 136–185 km).
- Onset (first IBTrACS wind >= 34 kt vs first detection):
  - Amphan: WMO (IMD) 16 May 12 UTC, USA 16 May 00 UTC, detection 16 May 18 UTC.
  - Yaas: WMO (IMD) 24 May 00 UTC, USA 23 May 18 UTC, detection 23 May 12 UTC.
- Decision: pmin has the lower median error on both cases, so it becomes the default track
  position in the app; centroid is shown alongside.

## 2026-09-30: alert tiers gated on IMD wind thresholds (post-hoc)

**Changed after observing Yaas's severe-cell count** (1,067 cells at 26 May 00 UTC under `|z| >= 3`,
most of the storm's wind field). Detection, tracking and validation are unchanged (rerun: same numbers).

- low: percentile >= 90 (unchanged)
- moderate: z >= 2 AND wind >= 17 m/s (34 kt, IMD Cyclonic Storm)
- severe: z >= 3 AND wind >= 25 m/s (48 kt, IMD Severe Cyclonic Storm)

| Case / time | Old severe (z only) | New low / moderate / severe |
|---|---|---|
| Yaas 26 May 00 UTC, wind basis | 1,067 | 5,388 / 167 / 0 |
| Amphan 19 May 06 UTC (min MSLP), wind basis | 950 | 4,773 / 315 / 71 |

- Yaas severe = 0 at 26 May 00 UTC because ERA5's max wind there is 23.5 m/s (ERA5 peak for Yaas: 28.2 m/s, 25 May 06 UTC).
- Side effect: cells that were moderate by percentile now fall to low, so low covers ~53% of the
  101x101 domain for Yaas at that time. Open question, not yet changed.

## 2026-09-30: low tier gated on wind (third post-hoc alert change)

Third alert change made after seeing results. The percentile-only low tier covered ~53% of the map
for Yaas at 26 May 00 UTC once moderate was wind-gated.

- low: z >= 1.5 AND wind >= 8.7 m/s (17 kt, IMD Depression)

Share of the 101x101 map (10,201 cells) in the low tier:

| Case / time | Wind basis | Low-MSLP basis |
|---|---|---|
| Yaas 26 May 00 UTC | 31.2% (3,178 cells) | 20.9% (2,130) |
| Amphan 19 May 06 UTC | 25.6% (2,611) | 31.3% (3,195) |

Still above 15% in both cases, so the fourth change below was applied.

## 2026-09-30: alerts only inside tracked-object boxes + 1 deg (fourth post-hoc alert change)

Alert cells are kept only inside a tracked object's bounding box extended by 1 degree
(`alerts.box_mask`, `BOX_PAD_DEG = 1.0`).

| Case / time (wind basis) | Low | Moderate | Severe | Any tier (share of map) |
|---|---|---|---|---|
| Yaas 26 May 00 UTC | 347 (3.4%) | 167 | 0 | 5.0% |
| Amphan 19 May 06 UTC | 445 (4.4%) | 315 | 71 | 8.1% |

Low-MSLP basis: Yaas 349 / 167 / 0 (5.1%), Amphan 482 / 315 / 71 (8.5%).
Tracking validation rerun: unchanged (medians 24.8 / 58.2 km pressure minimum, 38.7 / 121.9 km centroid).
Alert tiers are not validated against observed impacts.

## 2026-10-01: quiet-period test, windows declared before running

Declared before looking at IBTrACS or ERA5 for these dates. Six 10-day windows, 2020-2022
(outside the 2015-2019 case-study climatology), one per requested month:

| # | Month | Window (UTC, inclusive) |
|---|---|---|
| Q1 | Jan | 2021-01-10 00:00 to 2021-01-19 18:00 |
| Q2 | Mar | 2022-03-15 00:00 to 2022-03-24 18:00 |
| Q3 | Jul | 2020-07-01 00:00 to 2020-07-10 18:00 |
| Q4 | Aug | 2021-08-01 00:00 to 2021-08-10 18:00 |
| Q5 | Oct | 2022-10-01 00:00 to 2022-10-10 18:00 |
| Q6 | Dec | 2020-12-15 00:00 to 2020-12-24 18:00 |

Quiet = no IBTrACS point (any intensity, any agency) inside 5-30N, 75-100E within the window
+/- 2 days. Swap rule, fixed in advance: if a window is not quiet, move its start forward one
day at a time within the same month and year until a quiet 10-day window is found; if none,
try the same month in the next year of 2020-2022. Every swap is recorded below.
Data: ERA5 (WeatherBench2), same region and variables as the case studies; anomalies against
data/clim/era5_monthly_stats.nc; tracker with the frozen pipeline.tracker.DEFAULTS.

## 2026-10-01: GEFS forecast skill — matching rule observed in results (no change made)

With the agreed rule (storm present at the start -> object within 300 km at the first step), starts
where the storm was still below gale strength (<= 30 kt at the first step: Bulbul -7/-5/-3 d,
Hudhud -5 d, Titli -3 d, Nivar -3 d, Yaas -3 d, Phailin -3 d) match few or no members, because the
frozen detector requires >= 17 m/s. Recorded after seeing results; the rule is unchanged pending a
decision (option: treat a start with the storm below 34 kt like a genesis start).

### Quiet-period test: run record

- Q1 Jan 2021-01-10, Q3 Jul 2020-07-01, Q4 Aug 2021-08-01, Q5 Oct 2022-10-01: quiet as declared.
- Q2 Mar: no quiet window under the declared rule (March 2022 had IBTrACS systems on 3-6 and
  20-23 March; 2022 is the last allowed year). Not replaced, to keep the declared rule.
- Q6 Dec: 2020-12-15 not quiet; swapped 16 times by the declared rule to 2021-12-09.
- Result: 0 objects in 50 days. **Added after seeing the result:** a diagnostic rerun without the
  17 m/s wind gate (ws_min = 0) gives 80 objects / 32 tracks, so the gate explains the zero. The
  frozen DEFAULTS are unchanged; the diagnostic is reported alongside.
- Raw ERA5 for the windows: data/raw/quiet_*.nc (gitignored).

## 2026-10-01: track merging as an option — rule written before implementing (post-results change)

**Change made after seeing results** (5 of 7 held-out storms have fragmented tracks). Written down
before any code; implemented only as `tracker.run(..., merge_tracks=False)`, default off, so
the frozen DEFAULTS and every published number are unchanged.

Rule: track B is appended to track A if
1. A's last object and B's first object are 6–12 h apart (B starts after A ends; no overlap),
2. the distance between those two objects' centroids is <= 300 km,
3. their minimum MSLP differs by <= 10 hPa.
Candidates are joined greedily, closest first, until no pair qualifies; each track joins at most
one predecessor and one successor. Concurrent fragments (two objects at the same time) are not
merged by this rule.
Evaluation: all 8 storms and the quiet windows, with and without merging — tracks per storm,
error, POD, and "false links" (a join where either joined object is > 300 km from the best track).

## 2026-10-02: rainfall vs IMD — date convention corrected after the alignment check

First assumption: IMD gridded value dated D = 24 h from 03 UTC on D. The built-in alignment check
showed the opposite on all 10 storm-days available: the ERA5 window 03 UTC D -> 03 UTC D+1
correlates with IMD date D+1 at r = 0.36-0.94 (Amphan 0.84/0.94, Yaas 0.68/0.51, Titli 0.73/0.70,
Fani 0.89/0.36, Nivar 0.78/0.87) against r = -0.04 to 0.32 for date D. So the IMD date labels the
24 h ending at 03 UTC (the 08:30 IST gauge reading). Corrected in scripts/rainfall_vs_imd.py
(changed after seeing results; it fixes a data-convention error, not a model parameter).

## 2026-10-02: rainfall vs IMD — peak retention only where IMD observed heavy rain (post-hoc)

With all 8 storms, Bulbul's day after landfall has an IMD maximum of 0.2 mm inside the footprint (the
storm was over Bangladesh, outside the IMD grid), giving a meaningless "peak kept" of 9,663 %. Set after
seeing that result: peak retention is computed only when the IMD maximum reaches IMD "heavy" (64.5 mm);
otherwise it is reported as n/a. Correlation, bias and area counts still use every storm-day.

## 2026-10-02: Feature 5 (IFS) completed after the stop

The user asked to complete the stopped items, which lifts the 5 GB rule for the climatology.
- The wide climatology covers all 12 months, not only Sep-Dec: the IFS job runs year-round and
  would fail from 1 January otherwise. Built on GitHub Actions (about 2 min; locally the first
  month timed out after 10 min on this connection). 0-35N, 60-100E, wind + MSLP + T2m, ERA5
  2015-2019, every 3rd day, >= 50 samples per (month, hour), 5.9 MB.
- First run (IFS 2026-10-01 12Z): status no_system, 0 wind-alert cells, max 100.2 mm per IMD
  day. T2m |z| >= 2 flagged up to 6,993 cells (31 %): the tropical ocean reads about +1.4 K
  against 2015-2019 where the ERA5 spread sits at the 0.5 K floor. Threshold unchanged (as
  specified); a caveat was added after seeing this result.
