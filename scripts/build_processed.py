"""Run the full pipeline once per case and write the small files the app loads.

    python scripts/build_processed.py            # all cases
    python scripts/build_processed.py amphan     # one case

Parameters (DEFAULTS, climatology, floors, alert tiers) are identical for every
case. They were set while looking at Amphan (in-sample); Yaas is held out and
was run with them frozen.
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from pipeline import alerts, anomaly, preprocess, tracker, validate  # noqa: E402

RAW = ROOT / "data" / "raw"
PROC = ROOT / "data" / "processed"
DEFAULTS = {"threshold": 2.0, "min_size": 6, "max_disp_km": 400.0, "rule": "ws_and_msl",
            "ws_min": tracker.GALE_MS}
CLIM_YEARS = (2015, 2019)  # same years for every UTC hour

CASES = {
    "amphan": {"file": "amphan_case.nc", "storm": "AMPHAN", "season": 2020,
               "label": "Amphan, May 2020", "role": "in-sample (parameters set while looking at this case)",
               "sample_time": "2020-05-20 06:00"},
    "yaas": {"file": "yaas_case.nc", "storm": "YAAS", "season": 2021,
             "label": "Yaas, May 2021", "role": "held out (parameters frozen, nothing adjusted)",
             "sample_time": "2021-05-26 00:00"},
}

FIELDS = ["ws", "msl", "tp", "z_ws", "z_msl", "pct_ws", "pct_msl_low"]
STATIC = ["clim_mean_ws", "clim_std_ws", "clim_mean_msl", "clim_std_msl"]


def load_climatology():
    # 00 UTC from clim_sample.nc (2015-2019 only, so every hour has the same years
    # and sample size) + 06/12/18 UTC from clim_sample_061218.nc.
    c00 = preprocess.load_clim(RAW / "clim_sample.nc")
    c00 = c00.sel(time=c00.time.dt.year.isin(range(CLIM_YEARS[0], CLIM_YEARS[1] + 1)))
    c_rest = preprocess.load_clim(RAW / "clim_sample_061218.nc")
    return xr.concat([c00, c_rest], dim="time").sortby("time")


def build_case(name, cfg, clim):
    out = PROC / name
    out.mkdir(parents=True, exist_ok=True)
    print(f"\n===== {cfg['label']} [{cfg['role']}] =====")

    # Stage 1
    ds = anomaly.compute_anomalies(preprocess.load_case(RAW / cfg["file"]), clim)
    summ = anomaly.summary(ds)
    print(f"Climatology per UTC hour: {ds.attrs['clim_n_per_hour']}, years {ds.attrs['clim_years']}")
    print(summ.to_string(index=False))
    summ.to_csv(out / "stage1_summary.csv", index=False)
    keep = [v for v in FIELDS + STATIC if v in ds]
    ds[keep].to_netcdf(out / "fields.nc",
                       encoding={v: {"zlib": True, "complevel": 5, "dtype": "float32"} for v in keep})

    # Stage 2
    tracks = tracker.run(ds, **DEFAULTS)
    boxes = tracker.tracks_4d(tracks)
    tracks.to_csv(out / "tracks.csv", index=False)
    boxes.to_csv(out / "tracks_4d.csv", index=False)
    n_tr = tracks.track_id.nunique() if len(tracks) else 0
    print(f"\n{len(tracks)} objects in {n_tr} tracks")
    if len(boxes):
        print(boxes.sort_values("n_steps", ascending=False).to_string(index=False))
    per_step = tracks.groupby("time").size().reindex(pd.to_datetime(ds.time.values), fill_value=0)
    print("Objects per time step:", per_step.tolist())

    # Stage 3
    bt = validate.load_ibtracs(RAW / "ibtracs.NI.list.v04r01.csv", cfg["season"], cfg["storm"])
    bt.to_csv(out / "ibtracs.csv", index=False)
    tid, err = validate.position_errors(tracks, bt)
    err.to_csv(out / "validation.csv", index=False)
    val = {"case": name, "role": cfg["role"], "n_objects": int(len(tracks)), "n_tracks": int(n_tr),
           "track_id": tid, "params": DEFAULTS,
           "centroid": validate.error_stats(err, "centroid") if len(err) else {"n": 0},
           "pmin": validate.error_stats(err, "pmin") if len(err) else {"n": 0},
           "onset": validate.onset(bt, tracks)}
    (out / "validation.json").write_text(json.dumps(val, indent=2))
    print("\nValidation:", json.dumps(val, indent=2))
    if len(err):
        print(err.round(2).to_string(index=False))

    # Stage 4: one sample-time GeoJSON per variable (full period would be ~70 MB).
    t = ds.time.values
    i = int(np.argmin(np.abs(pd.to_datetime(t) - pd.Timestamp(cfg["sample_time"]))))
    for var, pct, zx in (("ws", "pct_ws", ds.z_ws.values), ("msl", "pct_msl_low", -ds.z_msl.values)):
        gj = alerts.alerts_geojson(ds[pct].values[i:i + 1], zx[i:i + 1], ds[var].values[i:i + 1],
                                   ds.lat.values, ds.lon.values, t[i:i + 1], var)
        (out / f"alerts_{var}_sample.geojson").write_text(alerts.dumps(gj))
    (out / "tracks.json").write_text(alerts.dumps(alerts.tracks_json(tracks)))

    meta = {"case": name, "label": cfg["label"], "role": cfg["role"],
            "clim_n_samples": ds.attrs["clim_n_samples"], "clim_n_per_hour": ds.attrs["clim_n_per_hour"],
            "clim_years": ds.attrs["clim_years"], "std_floor": anomaly.STD_FLOOR,
            "alert_tiers": alerts.TIERS, "has_tp": "tp" in ds, "defaults": DEFAULTS}
    (out / "meta.json").write_text(json.dumps(meta, indent=2))
    return val


def main():
    names = sys.argv[1:] or list(CASES)
    clim = load_climatology()
    for n in names:
        build_case(n, CASES[n], clim)
    (PROC / "cases.json").write_text(json.dumps(
        {n: {k: CASES[n][k] for k in ("label", "role")} for n in CASES if (PROC / n).exists()}, indent=2))
    total = sum(p.stat().st_size for p in PROC.rglob("*") if p.is_file())
    print("\nTotal processed MB: %.2f" % (total / 1e6))


if __name__ == "__main__":
    main()
