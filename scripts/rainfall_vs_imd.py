"""Rainfall vs IMD observations: how much of the observed peak does ERA5 (0.25 deg) keep?

For each case-study storm, the IMD rainfall day containing landfall and the day after are
compared with ERA5 hourly precipitation summed over exactly the same 24 h (03-03 UTC):
  * IMD 0.25 deg daily gridded rainfall (Pai et al. 2014): the value dated E is the 24 h ending at
    03 UTC (08:30 IST) on E, i.e. 03 UTC on E-1 to 03 UTC on E. (First assumed the opposite;
    corrected after the alignment check -- see DEV_LOG 2026-10-02.)
  * ERA5 hourly total_precipitation (WeatherBench2, 0.25 deg), hours ending D 04 UTC ... D+1 03 UTC.
Compared on IMD land cells inside the storm footprint (main-track box + 1 deg):
peak retention (ERA5 max / IMD max; only where IMD's max reaches heavy, 64.5 mm), area at IMD heavy / very heavy / extremely heavy
(64.5 / 115.6 / 204.5 mm), mean bias (ERA5 - IMD) and Pearson correlation.
A one-day-shift correlation is kept as an alignment check.
IMD files are read directly (same layout as imdlib), including partial downloads (whole days only).

    python scripts/rainfall_vs_imd.py
Output: data/processed/rainfall_vs_imd.json, dashboard-ui/src/data/rainfallVsImd.js
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
from pipeline import tracker  # noqa: E402

PROC = ROOT / "data" / "processed"
RAW = ROOT / "data" / "raw"
IMD_DIR = RAW / "imd_rain"
ERA5_1H = "gs://weatherbench2/datasets/era5/1959-2023_01_10-full_37-1h-0p25deg-chunk-1.zarr"
IBTRACS = RAW / "ibtracs.NI.list.v04r01.csv"
OUT_JSON = PROC / "rainfall_vs_imd.json"
OUT_JS = ROOT / "dashboard-ui" / "src" / "data" / "rainfallVsImd.js"
STORMS = {"amphan": ("AMPHAN", 2020), "yaas": ("YAAS", 2021), "phailin": ("PHAILIN", 2013),
          "hudhud": ("HUDHUD", 2014), "titli": ("TITLI", 2018), "fani": ("FANI", 2019),
          "bulbul": ("BULBUL:MATMO", 2019), "nivar": ("NIVAR", 2020)}
IMD_CATS = {"heavy": 64.5, "veryHeavy": 115.6, "extremelyHeavy": 204.5}  # mm / 24 h
PAD_DEG = 1.0
TIMEOUT_S, RETRIES = 300, 5


def landfall(name, season):
    df = pd.read_csv(IBTRACS, skiprows=[1], low_memory=False, keep_default_na=False)
    df = df[(df.NAME.str.strip() == name) & (pd.to_numeric(df.SEASON, errors="coerce") == season)].copy()
    df["time"] = pd.to_datetime(df.ISO_TIME)
    for c in ("LAT", "LON", "DIST2LAND"):
        df[c] = pd.to_numeric(df[c], errors="coerce")
    land = df[(df.DIST2LAND <= 0) & (df.LON < 92) & df.LAT.between(5, 30)].sort_values("time")
    return land.time.iloc[0]


def imd_days(lf):
    d = (lf - pd.Timedelta(hours=3)).floor("D")  # IMD day containing landfall
    return [d, d + pd.Timedelta(days=1)]


def footprint(key):
    t = pd.read_csv(PROC / key / "tracks.csv")
    main = json.loads((PROC / key / "validation.json").read_text())["track_id"]
    t = t[t.track_id == main]
    return (t.lat_min.min() - PAD_DEG, t.lat_max.max() + PAD_DEG, t.lon_min.min() - PAD_DEG, t.lon_max.max() + PAD_DEG)


IMD_LAT = np.linspace(6.5, 38.5, 129)
IMD_LON = np.linspace(66.5, 100.0, 135)
DAY_BYTES = 129 * 135 * 4


def imd_year(year):
    """IMD 0.25 deg yearly rain file (float32, day-major, (lat, lon) per day, -999 outside India),
    read the same way as imdlib but also from a partial download: whole days only. The server
    drops long transfers, so data/raw/imd_rain/rain/<year>.grd(.tmp) may hold only the first days."""
    d = IMD_DIR / "rain"
    path = d / f"{year}.grd" if (d / f"{year}.grd").exists() else d / f"{year}.grd.tmp"
    if not path.exists():
        return None
    n_days = path.stat().st_size // DAY_BYTES
    raw = np.fromfile(path, dtype="<f4", count=n_days * 129 * 135).reshape(n_days, 129, 135)
    times = pd.date_range(f"{year}-01-01", periods=n_days, freq="D")
    da = xr.DataArray(raw, dims=("time", "lat", "lon"), coords={"time": times, "lat": IMD_LAT, "lon": IMD_LON})
    return da.where(da > -900)


def era5_path(key, day):
    return RAW / f"era5tp1h_{key}_{day:%Y%m%d}.nc"


def era5_child(key, day_str):
    import dask
    dask.config.set(scheduler="threads", num_workers=32)
    day = pd.Timestamp(day_str)
    la0, la1, lo0, lo1 = footprint(key)
    ds = xr.open_zarr(ERA5_1H, storage_options={"token": "anon"})["total_precipitation"]
    hours = pd.date_range(day + pd.Timedelta(hours=4), day + pd.Timedelta(hours=27), freq="h")
    sub = ds.sel(time=hours, latitude=slice(la1 + 0.5, la0 - 0.5), longitude=slice(lo0 - 0.5, lo1 + 0.5)).load()
    (sub.sum("time") * 1000.0).rename("tp24").to_netcdf(era5_path(key, day))  # m -> mm


def era5_day(key, day):
    if not era5_path(key, day).exists():
        for attempt in range(1, RETRIES + 1):
            try:
                subprocess.run([sys.executable, __file__, "--era5", key, f"{day:%Y-%m-%d}"], check=True, timeout=TIMEOUT_S)
                break
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
                print(f"   ERA5 {key} {day:%Y-%m-%d} attempt {attempt} failed ({type(e).__name__})", flush=True)
        else:
            sys.exit(f"ERA5 fetch failed for {key} {day:%Y-%m-%d}")
    return xr.open_dataarray(era5_path(key, day)).load()


def compare(imd2d, era2d):
    """Both (lat, lon) on the same 0.25 deg points; only cells where IMD has data."""
    i, e = imd2d.values.ravel(), era2d.values.ravel()
    ok = ~np.isnan(i) & ~np.isnan(e)
    i, e = i[ok], e[ok]
    lat = np.broadcast_to(imd2d.lat.values[:, None], imd2d.shape).ravel()[ok]
    area = tracker.cell_area_km2(lat, 0.25, 0.25).ravel()
    if i.size < 10:
        return None
    return {
        "cells": int(i.size), "imdMaxMm": round(float(i.max()), 1), "era5MaxMm": round(float(e.max()), 1),
        # only where IMD observed heavy rain: a ratio against a near-dry maximum is meaningless
        "peakRetention": round(float(e.max() / i.max()), 3) if i.max() >= IMD_CATS["heavy"] else None,
        "imdMeanMm": round(float(i.mean()), 1), "era5MeanMm": round(float(e.mean()), 1),
        "biasMm": round(float((e - i).mean()), 1), "r": round(float(np.corrcoef(i, e)[0, 1]), 3),
        "areaKm2": {k: {"imd": int(area[i >= v].sum()), "era5": int(area[e >= v].sum())} for k, v in IMD_CATS.items()},
        "contingency": {k: {"hits": int(((e >= v) & (i >= v)).sum()), "misses": int(((e < v) & (i >= v)).sum()),
                            "falseAlarms": int(((e >= v) & (i < v)).sum())} for k, v in IMD_CATS.items()},
        "_i": i, "_e": e,
    }


def main():
    if sys.argv[1:2] == ["--era5"]:
        era5_child(sys.argv[2], sys.argv[3])
        return
    years, rows, pool_i, pool_e = {}, [], [], []
    for key, (name, season) in STORMS.items():
        lf = landfall(name, season)
        la0, la1, lo0, lo1 = footprint(key)
        for day in imd_days(lf):
            if day.year not in years or (day + pd.Timedelta(days=1)).year not in years:
                print(f"IMD {day.year} ...", flush=True)
                for yy in {day.year, (day + pd.Timedelta(days=1)).year}:
                    years.setdefault(yy, imd_year(yy))
            imd = years[day.year]
            imd_date = day + pd.Timedelta(days=1)  # IMD labels the 24 h by the day it ends (08:30 IST)
            if imd is None or imd_date not in imd.time.values:
                rows.append({"storm": key, "imdDay": f"{day:%Y-%m-%d}", "landfall": f"{lf:%Y-%m-%dT%H:%M}Z",
                             "note": "IMD day not available (download incomplete)"})
                print(f"  {key} {day:%Y-%m-%d}: IMD day not available", flush=True)
                continue
            box = dict(lat=slice(la0, la1), lon=slice(lo0, lo1))
            i_day = imd.sel(time=imd_date).sel(**box)
            e_day = era5_day(key, day).rename({"latitude": "lat", "longitude": "lon"}).sortby("lat")
            e_on_i = e_day.sel(lat=i_day.lat, lon=i_day.lon, method="nearest", tolerance=0.01)
            r = compare(i_day, e_on_i)
            # alignment check only: same ERA5 window against the previous / next IMD date
            shift = {}
            for lab, k in (("imdDayMinus1", -1), ("imdDayPlus1", 1)):
                d2 = imd_date + pd.Timedelta(days=k)
                if years.get(d2.year) is not None and d2 in years[d2.year].time.values:
                    c = compare(years[d2.year].sel(time=d2).sel(**box), e_on_i)
                    shift[lab] = None if c is None else c["r"]
            row = {"storm": key, "imdDay": f"{imd_date:%Y-%m-%d}", "window": f"{day:%Y-%m-%d} 03 UTC to {day + pd.Timedelta(days=1):%Y-%m-%d} 03 UTC",
                   "landfall": f"{lf:%Y-%m-%dT%H:%M}Z", "footprint": [round(v, 2) for v in (la0, la1, lo0, lo1)],
                   "alignmentCheckR": shift}
            if r is None:
                row["note"] = "fewer than 10 IMD land cells in the footprint"
            else:
                pool_i.append(r.pop("_i")); pool_e.append(r.pop("_e"))
                row.update(r)
            rows.append(row)
            print(f"  {key} {day:%Y-%m-%d}: " + (row.get("note") or f"IMD max {row['imdMaxMm']} mm, ERA5 max {row['era5MaxMm']} mm, "
                  f"retention {row['peakRetention']}, r {row['r']}, bias {row['biasMm']} mm"), flush=True)

    i, e = np.concatenate(pool_i), np.concatenate(pool_e)
    ok = [r for r in rows if r.get("peakRetention") is not None]
    compared = [r for r in rows if "r" in r]
    pooled = {"storms": len({r["storm"] for r in compared}), "stormDays": len(compared), "cells": int(i.size),
              "peakRetentionDays": len(ok),
              "peakRetentionMedian": round(float(np.median([r["peakRetention"] for r in ok])), 3),
              "peakRetentionRange": [min(r["peakRetention"] for r in ok), max(r["peakRetention"] for r in ok)],
              "r": round(float(np.corrcoef(i, e)[0, 1]), 3), "biasMm": round(float((e - i).mean()), 1),
              "cellsAtOrAbove": {k: {"imd": int((i >= v).sum()), "era5": int((e >= v).sum())} for k, v in IMD_CATS.items()},
              "categorical": {}}
    for k, v in IMD_CATS.items():  # POD / FAR / CSI over all storm-day land cells, IMD as truth
        hit, miss, fa = int(((e >= v) & (i >= v)).sum()), int(((e < v) & (i >= v)).sum()), int(((e >= v) & (i < v)).sum())
        pooled["categorical"][k] = {"thresholdMm": v, "hits": hit, "misses": miss, "falseAlarms": fa,
                                    "pod": round(hit / (hit + miss), 3) if hit + miss else None,
                                    "far": round(fa / (hit + fa), 3) if hit + fa else None,
                                    "csi": round(hit / (hit + miss + fa), 3) if hit + miss + fa else None}
    out = {"definition": "IMD 0.25 deg gridded daily rainfall (date E = 03 UTC E-1 to 03 UTC E) vs ERA5 hourly precipitation "
                         "summed over the same window; IMD land cells inside the main-track box + 1 deg",
           "gefs": "not compared: the GEFS forecast-skill run fetched wind and pressure only, no precipitation",
           "rows": rows, "pooled": pooled}
    OUT_JSON.write_text(json.dumps(out, indent=1))
    OUT_JS.write_text("// Rainfall vs IMD gridded observations, generated by scripts/rainfall_vs_imd.py.\n"
                      f"export const RAINFALL_VS_IMD = {json.dumps(out, indent=1)}\n")
    print(json.dumps(pooled, indent=1))


if __name__ == "__main__":
    main()
