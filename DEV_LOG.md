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
