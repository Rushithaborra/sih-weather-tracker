# Cyclone anomaly tracker (SIH 2026 · PS 26078)

Prototype for *AI-Driven Spatio-Temporal Tracking of Extreme Weather Anomalies in Medium-Range Forecasts*
(Ministry of Earth Sciences / NCMRWF).

It finds and tracks extreme wind and low-pressure anomalies in **ERA5 reanalysis (0.25°, ~28 km)**
and checks the tracks against the **IBTrACS** observed best track, for two Bay of Bengal cyclones:
**Amphan (May 2020)** and **Yaas (May 2021)**.

> This is tracking of observed events on reanalysis. There is no forecast in this pipeline, so
> nothing here measures forecast skill. The GNN and diffusion stages are **designed, not implemented**.

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

Computed by `scripts/build_processed.py` with the default settings above
(also in `data/processed/<case>/validation.json`).

The detection settings were chosen while looking at Amphan, so **Amphan is in-sample**.
**Yaas is held out**: it was downloaded afterwards and run with every parameter frozen.

| Case | Objects | Tracks | Matched steps | Min-MSLP position: mean / median / min / max | Anomaly centroid: mean / median / min / max |
|---|---|---|---|---|---|
| Amphan 2020 (in-sample) | 17 | 1 | 17 | 31.5 / 24.8 / 5.6 / 152.0 km | 58.1 / 38.7 / 14.0 / 240.6 km |
| Yaas 2021 (held out) | 15 | 3 | 13 | 73.0 / 58.2 / 5.2 / 185.3 km | 125.1 / 121.9 / 40.9 / 219.7 km |

- **Track method (pressure minimum) chosen on Amphan, confirmed on Yaas (held out). Two storms; tracking on
  reanalysis, not forecast skill.** The pressure minimum already had the lower error on Amphan alone
  (median 24.8 vs 38.7 km), so it is the default track position. One ERA5 grid cell is about 28 km.
- Amphan's last three steps (20 May 06/12/18 UTC, around and after landfall): min-MSLP 30.9 / 19.0 / 152.0 km,
  centroid 108.1 / 149.2 / 240.6 km. The wind-anomaly centroid drifts over the sea after landfall.
- Yaas: one unbroken 13-step main track (23 May 12 UTC to 26 May 12 UTC) plus two single-step extra objects
  (24 May 00 UTC and 26 May 00 UTC), each roughly 300 km from the best-track centre.
  The first three Yaas steps have the largest errors (min-MSLP 136–185 km).
- Detection onset vs first best-track wind ≥ 34 kt:

  | Case | First detection | IMD (WMO) ≥ 34 kt | JTWC (USA) ≥ 34 kt |
  |---|---|---|---|
  | Amphan | 16 May 18 UTC | 16 May 12 UTC | 16 May 00 UTC |
  | Yaas | 23 May 12 UTC | 24 May 00 UTC | 23 May 18 UTC |

- Two cases are a small sample. Development history, including a superseded first run, is in `DEV_LOG.md`.

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
- Validation covers two cases, one in-sample and one held out.
- Precipitation is display only (no precipitation climatology) and is not used in detection or alerts.
- The 5 km layer is interpolation and adds no information.
- Alert tiers are not validated against observed impacts, and their thresholds were set after seeing results.
  Because they are tied to tracked objects, a storm the tracker misses gets no alerts.
- The GNN tracker and diffusion downscaler below are **designed, not implemented**.

## Roadmap (designed, not implemented)

1. **NEPS-G ingestion**: read NCMRWF ensemble members instead of reanalysis.
2. **Ensemble EFI** against NEPS-G reforecasts (the model's own climate).
3. **GNN tracker** on an icosahedral mesh over each member, giving probabilistic 4D tracked boxes.
4. **Conditional diffusion downscaler** with a physics-informed loss, giving probabilistic ~5 km exceedance maps
   and an alert API.
5. **5 km truth data**: training the downscaler needs high-resolution observations or regional reanalysis for
   India, which are scarce. This is the main open risk.

## Repository layout

```
app.py                         Streamlit UI
pipeline/                      preprocess, anomaly, tracker, validate, downscale, alerts
scripts/build_processed.py     runs the pipeline for all cases, writes data/processed/
scripts/fetch_clim_resumable.py  resumable climatology and extra-case downloads
step1_get_data.py              original ERA5 download script
tests/test_tracker.py          synthetic-blob tracker tests
data/raw/                      amphan_case.nc, yaas_case.nc, ibtracs_amphan.csv (large raw files gitignored)
data/processed/<case>/         fields.nc, tracks, validation, alerts sample, meta
DEV_LOG.md                     development log
```

## Data sources and credits

- **ERA5** (Hersbach et al., 2020, QJRMS), Copernicus Climate Change Service / ECMWF, accessed through the
  public **WeatherBench 2** copy on Google Cloud (`gs://weatherbench2/datasets/era5/`, Rasp et al., 2024).
  Contains modified Copernicus Climate Change Service information; neither the European Commission nor ECMWF
  is responsible for any use of it.
- **IBTrACS v04r01** (Knapp et al., 2010, BAMS), NOAA National Centers for Environmental Information,
  North Indian basin CSV. Public domain (NOAA).
