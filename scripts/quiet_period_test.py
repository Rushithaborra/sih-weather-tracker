"""Quiet-period test: what does the frozen detector find when there is no cyclone?

Six 10-day windows in 2020-2022, declared in DEV_LOG.md before running. A window is quiet if
IBTrACS has no point (any intensity) in 5-30N, 75-100E within the window +/- 2 days; if a
declared window is not quiet it is swapped by the rule recorded there (start moved forward a
day at a time in the same month, then the same month of the next year). ERA5 from
WeatherBench2, anomalies against data/clim/era5_monthly_stats.nc, frozen tracker DEFAULTS.

Every detected object in a quiet window is, by construction, not an IBTrACS system. Objects in
July/August are listed separately: they may be monsoon lows, which IBTrACS does not carry.

    python scripts/quiet_period_test.py
Output: data/processed/quiet_periods.json, dashboard-ui/src/data/quietPeriods.js
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import step1_get_data as s1  # noqa: E402
from pipeline import anomaly, preprocess, tracker  # noqa: E402

RAW = ROOT / "data" / "raw"
CLIM = ROOT / "data" / "clim" / "era5_monthly_stats.nc"
IBTRACS = RAW / "ibtracs.NI.list.v04r01.csv"
OUT_JSON = ROOT / "data" / "processed" / "quiet_periods.json"
OUT_JS = ROOT / "dashboard-ui" / "src" / "data" / "quietPeriods.js"
WINDOWS = [  # declared in DEV_LOG.md (2026-10-01) before running
    ("Q1", "2021-01-10"), ("Q2", "2022-03-15"), ("Q3", "2020-07-01"),
    ("Q4", "2021-08-01"), ("Q5", "2022-10-01"), ("Q6", "2020-12-15"),
]
DAYS, PAD_DAYS = 10, 2
TIMEOUT_S, RETRIES = 300, 5


def load_ibtracs():
    df = pd.read_csv(IBTRACS, skiprows=[1], low_memory=False, keep_default_na=False, usecols=["SID", "NAME", "ISO_TIME", "LAT", "LON"])
    df["time"] = pd.to_datetime(df.ISO_TIME)
    df["LAT"], df["LON"] = pd.to_numeric(df.LAT, errors="coerce"), pd.to_numeric(df.LON, errors="coerce")
    return df[df.LAT.between(*s1.LAT) & df.LON.between(*s1.LON)]


def systems_near(bt, start):
    lo, hi = start - pd.Timedelta(days=PAD_DAYS), start + pd.Timedelta(days=DAYS + PAD_DAYS)
    hit = bt[bt.time.between(lo, hi)]
    return sorted({f"{r.NAME.strip()} ({r.SID})" for r in hit.itertuples()})


def find_quiet(bt, declared):
    """Apply the declared swap rule; return (start, swaps)."""
    d = pd.Timestamp(declared)
    swaps = []
    for year in [d.year] + [y for y in (2020, 2021, 2022) if y > d.year]:
        s = d.replace(year=year) if year != d.year else d
        if year != d.year:
            s = s.replace(day=1)
        while (s + pd.Timedelta(days=DAYS - 1)).month == d.month:
            near = systems_near(bt, s)
            if not near:
                return s, swaps
            swaps.append({"start": f"{s:%Y-%m-%d}", "notQuietBecause": near})
            s += pd.Timedelta(days=1)
    return None, swaps


def raw_path(start):
    return RAW / f"quiet_{start:%Y%m%d}.nc"


def fetch_child(start_str):
    import dask
    dask.config.set(scheduler="threads", num_workers=32)
    start = pd.Timestamp(start_str)
    ds = s1.cut(xr.open_zarr(s1.ERA5, storage_options={"token": "anon"}), s1.CLIM_VARS)
    ds = ds.sel(time=slice(start, start + pd.Timedelta(days=DAYS) - pd.Timedelta(hours=6)))
    tmp = raw_path(start).with_suffix(".tmp")
    ds.load().to_netcdf(tmp)
    tmp.replace(raw_path(start))


def fetch(start):
    if raw_path(start).exists():
        return raw_path(start)
    for attempt in range(1, RETRIES + 1):
        try:
            subprocess.run([sys.executable, __file__, "--fetch", f"{start:%Y-%m-%d}"], check=True, timeout=TIMEOUT_S)
            return raw_path(start)
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
            print(f"   fetch attempt {attempt} failed ({type(e).__name__})", flush=True)
    sys.exit(f"ERA5 fetch for {start:%Y-%m-%d} failed")


def land_test():
    """Natural Earth 50 m land polygons -> f(lat, lon) is over land."""
    import cartopy.io.shapereader as shpreader
    from shapely.geometry import Point
    from shapely.ops import unary_union
    from shapely.prepared import prep
    geoms = list(shpreader.Reader(shpreader.natural_earth("50m", "physical", "land")).geometries())
    land = prep(unary_union(geoms))
    return lambda lat, lon: land.contains(Point(lon, lat))


def main():
    if sys.argv[1:2] == ["--fetch"]:
        fetch_child(sys.argv[2])
        return
    bt = load_ibtracs()
    stats = xr.open_dataset(CLIM).load()
    on_land = land_test()
    windows = []
    for wid, declared in WINDOWS:
        start, swaps = find_quiet(bt, declared)
        if start is None:
            windows.append({"id": wid, "declared": declared, "start": None, "swaps": swaps, "status": "no quiet window found"})
            print(f"{wid}: no quiet window found", flush=True)
            continue
        print(f"{wid}: {start:%Y-%m-%d} (declared {declared}, {len(swaps)} swap(s))", flush=True)
        ds = anomaly.compute_anomalies_from_stats(preprocess.load_case(fetch(start)), stats)
        tr = tracker.run(ds, **tracker.DEFAULTS)
        # Diagnostic only (frozen DEFAULTS unchanged): the same rule without the 17 m/s wind gate,
        # to show how much of the result the gate alone explains.
        tr_ng = tracker.run(ds, **{**tracker.DEFAULTS, "ws_min": 0.0})
        objs = [{"time": f"{pd.Timestamp(r.time):%Y-%m-%dT%H:%M}Z", "trackId": int(r.track_id),
                 "lat": round(float(r.pmin_lat), 2), "lon": round(float(r.pmin_lon), 2),
                 "nCells": int(r.n_cells), "maxWs": round(float(r.max_ws), 1), "minMsl": round(float(r.min_msl), 1),
                 "land": bool(on_land(r.pmin_lat, r.pmin_lon))} for r in tr.itertuples()] if len(tr) else []
        windows.append({
            "id": wid, "declared": declared, "start": f"{start:%Y-%m-%d}",
            "end": f"{start + pd.Timedelta(days=DAYS - 1):%Y-%m-%d}", "month": f"{start:%b}", "swaps": swaps,
            "steps": int(ds.sizes["time"]), "objects": len(objs),
            "tracks": len({o["trackId"] for o in objs}), "landObjects": sum(o["land"] for o in objs),
            "monsoonSeason": start.month in (7, 8), "objectList": objs,
            "domainMaxWs": round(float(ds.ws.max()), 1), "domainMinMsl": round(float(ds.msl.min()), 1),
            "noWindGate": {"objects": int(len(tr_ng)), "tracks": int(tr_ng.track_id.nunique()) if len(tr_ng) else 0,
                           "landObjects": int(sum(on_land(r.pmin_lat, r.pmin_lon) for r in tr_ng.itertuples())) if len(tr_ng) else 0,
                           "maxWsOfObjects": round(float(tr_ng.max_ws.max()), 1) if len(tr_ng) else None},
        })
        print(f"   {len(objs)} objects in {windows[-1]['tracks']} tracks; domain max wind {windows[-1]['domainMaxWs']} m/s", flush=True)

    done = [w for w in windows if w.get("start")]
    nonmonsoon = [w for w in done if not w["monsoonSeason"]]
    summary = {
        "windowsRun": len(done), "daysRun": DAYS * len(done),
        "objects": sum(w["objects"] for w in done), "tracks": sum(w["tracks"] for w in done),
        "objectsPer10Days": round(sum(w["objects"] for w in done) / len(done), 2) if done else None,
        "tracksPer10Days": round(sum(w["tracks"] for w in done) / len(done), 2) if done else None,
        "excludingJulAug": {"windows": len(nonmonsoon), "objects": sum(w["objects"] for w in nonmonsoon),
                            "tracks": sum(w["tracks"] for w in nonmonsoon)},
        "julAugObjects": sum(w["objects"] for w in done if w["monsoonSeason"]),
        "landObjects": sum(w["landObjects"] for w in done),
        "noWindGateDiagnostic": {"objects": sum(w["noWindGate"]["objects"] for w in done),
                                 "tracks": sum(w["noWindGate"]["tracks"] for w in done),
                                 "landObjects": sum(w["noWindGate"]["landObjects"] for w in done)},
    }
    out = {"definition": "quiet = no IBTrACS point in 5-30N, 75-100E within the window +/- 2 days; ERA5 6-hourly; "
                         "anomalies vs era5_monthly_stats.nc (2010-2019); frozen tracker DEFAULTS",
           "windows": windows, "summary": summary}
    OUT_JSON.write_text(json.dumps(out, indent=1))
    OUT_JS.write_text("// Quiet-period false-alarm test, generated by scripts/quiet_period_test.py.\n"
                      f"export const QUIET_PERIODS = {json.dumps(out, indent=1)}\n")
    print(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
