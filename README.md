# Cyclone anomaly tracker (SIH 2026 · PS 26078)

Prototype for *AI-Driven Spatio-Temporal Tracking of Extreme Weather Anomalies in Medium-Range Forecasts*
(Ministry of Earth Sciences / NCMRWF).

It finds and tracks extreme wind and low-pressure anomalies in **ERA5 reanalysis (0.25°, ~28 km)**
and checks the tracks against the **IBTrACS** observed best track, for eight Bay of Bengal / east-coast
cyclones: **Amphan (2020), Yaas (2021), Phailin (2013), Hudhud (2014), Titli (2018), Fani (2019),
Bulbul (2019)** and **Nivar (2020)**.

A second, separate pipeline tracks a real **NOAA GEFS v12 ensemble forecast** (control + 30 members,
0.25°) instead of reanalysis — see [Live GEFS forecast](#live-gefs-forecast-daily) below. That one
is an actual forecast; the reanalysis tracking above is not, and the two are not mixed.

**Live dashboard:** https://dashboard-ui-indol-nu.vercel.app (source in `dashboard-ui/`)

> The reanalysis pipeline tracks observed events after the fact, so nothing from it measures forecast
> skill. The GNN and diffusion stages are **designed, not implemented**; the live GEFS pipeline uses the
> same classical detector/tracker as the reanalysis cases, not a GNN.

## What it does

1. **Preprocess**: 10 m wind speed `sqrt(u² + v²)` (m/s), MSLP (hPa), 6-hour precipitation (mm).
2. **Anomalies**: for each grid point and **each UTC hour (00/06/12/18)**, mean and std from a climatology
   sample; z-score `(x − mean) / max(std, floor)` and percentile rank. Each case step is compared with the
   samples from its own hour, so the normal daily cycle is not flagged. MSLP uses the negative anomaly.
3. **Detection**: `z_wind ≥ 2` AND `z_MSLP ≤ −2` AND `wind ≥ 17 m/s` (gale force), 8-connected objects of
   at least 6 cells (`scipy.ndimage.label`). Per object: two positions (minimum MSLP in the bounding box, and
   the intensity-weighted anomaly centroid), bounding box, area in km² (cos-latitude), max wind, min MSLP, max z.
4. **Tracking**: Hungarian assignment (`scipy.optimize.linear_sum_assignment`) on great-circle distance,
   gated at 400 km per 6 h. Unmatched objects start new tracks. Each track also gets a 4D box
   (union of boxes, start and end time).
5. **Validation**: the most intense track (lowest minimum MSLP; never chosen by distance to the best track)
   is compared step by step with IBTrACS, for both position methods.
6. **Alerts**: per cell, *low* z ≥ 1.5 AND wind ≥ 8.7 m/s (17 kt, IMD Depression); *moderate* z ≥ 2 AND
   wind ≥ 17 m/s (34 kt, Cyclonic Storm); *severe* z ≥ 3 AND wind ≥ 25 m/s (48 kt, Severe Cyclonic Storm).
   Alerts are only issued inside tracked-object bounding boxes extended by 1°. A z-score only says
   "unusual for this place"; the wind gate says "dangerous". GeoJSON export per time step.
   **Alert tiers are anchored to IMD wind categories and were adjusted after observing results; they are not validated against observed impacts. Tracking validation is independent of the alert layer.**
7. **5 km view**: bilinear interpolation from 0.25° to 0.05° inside a track box.
   **An interpolation placeholder that adds no new information.**
8. **Dashboard**: Streamlit app with case selector, adjustable detection settings, map, tables,
   validation plot, alert map and downloads.

## Validation result

Computed by `scripts/build_processed.py` (Amphan, Yaas) and `scripts/build_extra_cases.py` (the other
six) with the same frozen settings throughout (also in `data/processed/<case>/validation.json`).

The detection settings were chosen while looking at Amphan, so **Amphan is in-sample**. All seven other
storms were added afterwards and run with every parameter frozen — nothing was tuned per storm.

| Case | Role | Objects | Tracks | Matched steps | Min-MSLP position: mean / median / min / max |
|---|---|---|---|---|---|
| Amphan 2020 | in-sample | 17 | 1 | 17 | 31.5 / 24.8 / 5.6 / 152.0 km |
| Yaas 2021 | held out | 15 | 3 | 13 | 73.0 / 58.2 / 5.2 / 185.3 km |
| Phailin 2013 | held out | 13 | 2 | 12 | 34.0 / 30.2 / 15.4 / 67.6 km |
| Hudhud 2014 | held out | 18 | 2 | 17 | 35.3 / 27.3 / 12.0 / 106.9 km |
| Titli 2018 | held out | 5 | 2 | 4 | 24.4 / 19.6 / 11.9 / 46.4 km |
| Fani 2019 | held out | 18 | 1 | 18 | 34.1 / 24.8 / 5.6 / 143.0 km |
| Bulbul 2019 | held out | 11 | 3 | 8 | 25.0 / 23.7 / 10.4 / 40.3 km |
| Nivar 2020 | held out | 8 | 1 | 8 | 43.4 / 28.7 / 15.6 / 101.3 km |

- **Median position error clusters 19.6–30.2 km across seven of the eight cases; Yaas (58.2 km) is the
  outlier**, degraded by the wind-anomaly centroid drifting over the sea after landfall (same failure mode
  documented for Amphan below). The pressure-minimum position was chosen on Amphan alone and never
  re-tuned, so this spread reflects the method holding up out of sample, not curve-fitting to each storm.
- Amphan's last three steps (20 May 06/12/18 UTC, around and after landfall): min-MSLP 30.9 / 19.0 / 152.0 km.
  Anomaly-centroid errors (shown alongside pmin in the app, not tabulated above) grow the same way at
  landfall for every case where the storm makes landfall inside the analysis window.
- Bulbul began life as Pacific tropical storm Matmo and only entered the Bay of Bengal analysis region
  partway through its life, so its first-detection time is not comparable to its IBTrACS genesis time —
  see `data/processed/bulbul/` and the region-filtered onset logic in `scripts/export_cases_for_dashboard.py`.
- Detection onset vs first best-track wind ≥ 34 kt, for the original two cases:

  | Case | First detection | IMD (WMO) ≥ 34 kt | JTWC (USA) ≥ 34 kt |
  |---|---|---|---|
  | Amphan | 16 May 18 UTC | 16 May 12 UTC | 16 May 00 UTC |
  | Yaas | 23 May 12 UTC | 24 May 00 UTC | 23 May 18 UTC |

  Onset for the other six cases is in each `data/processed/<case>/validation.json`.
- Eight cases is still a small sample. Development history, including a superseded first run and the
  four post-hoc alert-tier changes, is in `DEV_LOG.md`.

## Run locally

```bash
conda create -n sih-weather python=3.11 -y
conda activate sih-weather
pip install -r requirements.txt
streamlit run app.py
```

The app reads only `data/processed/` and never downloads data.

### Rebuild from raw data (optional)

Needs `gcsfs` and `zarr` in addition (not in `requirements.txt`) and about 5 GB of transfer:

```bash
pip install gcsfs zarr pytest
cd data/raw
python ../../step1_get_data.py                                  # Amphan case -> amphan_case.nc
python ../../step1_get_data.py --clim                           # 00 UTC 2010-2019 -> clim_sample.nc
python ../../scripts/fetch_clim_resumable.py --hours 6,12,18 --years 2015-2019 --out clim_sample_061218.nc
python ../../scripts/fetch_clim_resumable.py --case yaas        # held-out case -> yaas_case.nc
curl -LO https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.NI.list.v04r01.csv
cd ../..
python scripts/build_processed.py
pytest -q
```

`fetch_clim_resumable.py` imports its settings from `step1_get_data.py` and fetches year by year with
timeouts and retries, because long reads from the public bucket sometimes hung. If `step1_get_data.py --clim`
hangs, run `python ../../scripts/fetch_clim_resumable.py` instead; it writes the same `clim_sample.nc`.

The other six cases (Phailin, Hudhud, Titli, Fani, Bulbul, Nivar) are downloaded and run the same way by
`scripts/build_extra_cases.py`, which reuses `step1_get_data.py`'s ERA5 slice logic for each storm's dates.
`scripts/export_cases_for_dashboard.py` then turns every case's `data/processed/<case>/` into the record
shape `dashboard-ui/src/data/casesExtra.js` needs — nothing there is hand-edited.

## Live GEFS forecast (daily)

The dashboard's **Live forecast** page shows the latest NOAA GEFS v12 ensemble (control + 30 members,
0.25°, T+0 to 144 h) over the same 5–30°N, 75–100°E region, run through the same detector and tracker.
The GitHub Action `.github/workflows/gefs-live.yml` does this every day at 06:30 UTC and commits
`dashboard-ui/public/live/gefs_latest.json` and `gefs_history.json`; the page reads them straight from
GitHub, so a new run appears without a redeploy.

Because a live run can fall in any month, anomalies use per-(calendar month, UTC hour) ERA5 mean and std
(`data/clim/era5_monthly_stats.nc`, from `scripts/build_live_climatology.py`, 2010–2019, every 3rd day)
instead of the May sample the case studies use. There is no best track for a live forecast, so nothing on
that page is validated.

```bash
pip install -r requirements-live.txt
python scripts/build_live_climatology.py     # once; ~20 GB read from WeatherBench2
python scripts/run_gefs_live.py              # latest complete 00/12 UTC run
python scripts/run_gefs_live.py --init 2026-09-30T00:00 --members 2 --fxx-end 24   # quick test
```

## Changes from the original plan

- **Climatology years**: the first download was 00 UTC only, 2010–2019 (230 samples). Comparing 06–18 UTC
  data with it flagged the normal daytime winds over land as extreme (z > 15). The climatology is now **per UTC
  hour**, 2015–2019, for all four hours (115 samples each). The 2010–2014 00 UTC samples are not used, so every
  hour has the same years and sample size.
- **Std floors**: 1 m/s (wind) and 1 hPa (MSLP), so calm, steady places do not produce huge z-scores.
- **Detection rule**: wind and pressure anomaly together, plus an absolute 17 m/s gale threshold.
- **Validated track**: lowest minimum MSLP (earlier: longest track, which picked a post-landfall fragment).
- **Track position**: minimum MSLP in the box as the default; the anomaly centroid is shown alongside.
- **Alert tiers** (four changes, all made **after** observing results; details in `DEV_LOG.md`):
  1. `|z| ≥ 3` alone marked 1,067 cells as severe for Yaas at 26 May 00 UTC, so moderate and severe were
     gated on IMD wind thresholds (17 and 25 m/s).
  2. The percentile-only low tier then covered ~53% of the map, so low was gated on 8.7 m/s (IMD Depression).
  3. Low still covered 21–31% of the map, so alerts are now only issued inside tracked-object boxes + 1°.

  Final counts (wind basis): Yaas 26 May 00 UTC 347 low / 167 moderate / 0 severe (5.0% of the map);
  Amphan 19 May 06 UTC 445 / 315 / 71 (8.1%). Yaas has no severe cells there because ERA5's strongest wind
  at that step is 23.5 m/s. Alerts are a separate layer, so detection and validation are unaffected.
- **Alert GeoJSON**: exported per time step (app download) plus one sample time per case in
  `data/processed/`; a file covering all steps would be about 70 MB.

## Limitations

- ERA5 is **reanalysis at 0.25° (~28 km)**, not a forecast and not 12 km. ERA5's minimum MSLP for Amphan
  (946.5 hPa) is much shallower than the observed intensity, as expected at this resolution.
- **Not an EFI.** A proper Extreme Forecast Index compares an ensemble forecast with the model's own reforecast
  climate. These percentiles rank one reanalysis value against a 115-sample reanalysis climatology.
- Storms are only detected once winds reach gale force (17 m/s); weaker depression stages are missed.
- The min-MSLP position is limited to the 0.25° grid; the anomaly centroid is not a cyclone centre.
- Validation covers eight cases, one in-sample and seven held out — still a small sample, and all from
  the same Bay of Bengal / east-coast basin and May–November season window.
- Precipitation is display only (no precipitation climatology) and is not used in detection or alerts.
- The 5 km layer is interpolation and adds no information.
- Alert tiers are not validated against observed impacts, and their thresholds were set after seeing results.
  Because they are tied to tracked objects, a storm the tracker misses gets no alerts.
- The live GEFS forecast (below) has no best track to check against yet, since it runs on whatever is
  currently forecast — nothing on that page is validated the way the eight reanalysis cases are.
- The GNN tracker and diffusion downscaler below are **designed, not implemented**.

## Roadmap (designed, not implemented)

1. ~~**Ensemble ingestion**: read an ensemble instead of single-member reanalysis.~~ **Done, with GEFS
   instead of NEPS-G** — the live forecast pipeline reads the real NOAA GEFS v12 ensemble (no NCMRWF
   credentials needed); swapping in NEPS-G itself is still open if access becomes available.
2. **Ensemble EFI** against the model's own reforecast climate (the live pipeline currently ranks each
   member's wind speed against the same ERA5 climatology the reanalysis cases use, not a GEFS reforecast).
3. **GNN tracker** on an icosahedral mesh over each member, giving probabilistic 4D tracked boxes.
4. **Conditional diffusion downscaler** with a physics-informed loss, giving probabilistic ~5 km exceedance maps
   and an alert API.
5. **5 km truth data**: training the downscaler needs high-resolution observations or regional reanalysis for
   India, which are scarce. This is the main open risk.

## Repository layout

```
app.py                              Streamlit UI (the eight reanalysis cases; no live/forecast content)
pipeline/                           preprocess, anomaly, tracker, validate, downscale, alerts
scripts/build_processed.py          runs the pipeline for Amphan + Yaas, writes data/processed/
scripts/build_extra_cases.py        same pipeline for the other six held-out storms
scripts/export_cases_for_dashboard.py  data/processed/<case>/ -> dashboard-ui/src/data/casesExtra.js
scripts/export_zoom_fields.py       real bilinear-interpolated field per track step -> zoomFields.js
scripts/fetch_clim_resumable.py     resumable climatology download (case-study climatology)
scripts/build_live_climatology.py   per-(month, UTC hour) ERA5 climatology for the live pipeline
scripts/run_gefs_live.py            fetches the latest GEFS run, tracks it, writes dashboard-ui/public/live/
scripts/fetch_gefs.py               one-off GEFS ensemble fetch used to build the Yaas GEFS case study
scripts/run_gefs_ensemble.py        runs detection/tracking on a fetched GEFS ensemble, aggregates stats
step1_get_data.py                   original ERA5 download script (Amphan case + climatology)
tests/test_tracker.py               synthetic-blob tracker tests
data/raw/                           <case>_case.nc, ibtracs CSVs (large raw files gitignored)
data/processed/<case>/              fields.nc, tracks, validation, alerts sample, meta
data/clim/                          live pipeline's per-(month, hour) climatology (gitignored, ~GB scale)
dashboard-ui/                       React/Vite dashboard (Validated results, GEFS forecast, Live forecast)
.github/workflows/                  gefs-live.yml (daily forecast run), build-climatology.yml
DEV_LOG.md                          development log
```

## Data sources and credits

- **ERA5** (Hersbach et al., 2020, QJRMS), Copernicus Climate Change Service / ECMWF, accessed through the
  public **WeatherBench 2** copy on Google Cloud (`gs://weatherbench2/datasets/era5/`, Rasp et al., 2024).
  Contains modified Copernicus Climate Change Service information; neither the European Commission nor ECMWF
  is responsible for any use of it.
- **IBTrACS v04r01** (Knapp et al., 2010, BAMS), NOAA National Centers for Environmental Information,
  North Indian basin CSV. Public domain (NOAA).
- **NOAA GEFS v12** (30-member ensemble + control, 0.25°), via the public **AWS Open Data** copy
  (`s3://noaa-gefs-pds`, `noaa-gefs-pds.s3.amazonaws.com`), fetched with
  [Herbie](https://github.com/blaylockbk/Herbie). Used for both the Yaas GEFS case study and the daily
  live forecast. Public domain (NOAA / US Government work).
