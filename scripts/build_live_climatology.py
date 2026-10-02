"""Build the year-round climatology the live GEFS run compares against.

The case studies carry a raw ERA5 sample for one ~3-week window in May. A daily
live forecast can fall in any month, so this stores per-(calendar month, UTC hour)
mean and std of 10 m wind speed and MSLP instead, on the same 0.25 deg grid and
region as step1_get_data.py. pipeline.anomaly.compute_anomalies_from_stats reads it.

Samples: every --day-step'th day of each month, all four synoptic hours, over
--years. The default (2010-2019, every 3rd day) gives ~100 samples per
(month, hour) -- close to the 115 used for the case studies.

Stored as scaled int16 (0.01 m/s, 0.01 hPa) to keep the committed file small.
Run once (the "Build live climatology" GitHub Action does this):
    python scripts/build_live_climatology.py
"""
import argparse
import subprocess
import sys
import time
from pathlib import Path

import dask
import numpy as np
import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import step1_get_data as s1  # noqa: E402

OUT = ROOT / "data" / "clim" / "era5_monthly_stats.nc"
HOURS = [0, 6, 12, 18]


def open_region(lat=s1.LAT, lon=s1.LON, t2m=False):
    # WeatherBench2 chunks are one full-globe field per time step (~2 MB), so every
    # sample reads a whole chunk (the region size doesn't change the download):
    # 10m_wind_speed (derived from u/v in the store) avoids fetching u and v separately.
    ds = xr.open_zarr(s1.ERA5, storage_options={"token": "anon"})
    ds = ds[["10m_wind_speed", "mean_sea_level_pressure"] + (["2m_temperature"] if t2m else [])]
    return ds.sel(latitude=slice(*lat), longitude=slice(*lon)) if ds.latitude[0] < ds.latitude[-1] \
        else ds.sel(latitude=slice(max(lat), min(lat)), longitude=slice(*lon))


def sample_times(years, month, day_step):
    times = []
    for y in years:
        days = pd.date_range(f"{y}-{month:02d}-01", periods=pd.Period(f"{y}-{month:02d}").days_in_month, freq="D")
        for d in days[::day_step]:
            times += [d + pd.Timedelta(hours=h) for h in HOURS]
    return pd.DatetimeIndex(times)


PARTS = OUT.parent / "parts"
TIMEOUT_S = 600  # public-bucket reads sometimes hang silently; a month normally takes ~1 min
RETRIES = 5
STATS = ("mean_ws", "std_ws", "mean_msl", "std_msl")
STATS_T2M = ("mean_t2m", "std_t2m")


def stats_names(a):
    return STATS + (STATS_T2M if a.t2m else ())


def part_path(month, a):
    tag = "" if (a.lat == list(s1.LAT) and a.lon == list(s1.LON) and not a.t2m) else \
        f"_lat{a.lat[0]:g}-{a.lat[1]:g}_lon{a.lon[0]:g}-{a.lon[1]:g}{'_t2m' if a.t2m else ''}"
    return PARTS / f"m{month:02d}_{a.years}_d{a.day_step}{tag}.nc"


def build_month(month, a):
    """Child process: stats for one calendar month -> a float32 part file."""
    y0, y1 = (int(v) for v in a.years.split("-"))
    dask.config.set(scheduler="threads", num_workers=32)  # I/O bound: many concurrent chunk reads
    part = open_region(a.lat, a.lon, a.t2m).sel(time=sample_times(range(y0, y1 + 1), month, a.day_step)).load()
    part = part.sortby("latitude").sortby("longitude")
    ws = part["10m_wind_speed"].values.astype("float64")
    msl = part["mean_sea_level_pressure"].values.astype("float64") / 100.0
    t2 = part["2m_temperature"].values.astype("float64") if a.t2m else None
    hrs = part.time.dt.hour.values
    out = {k: np.empty((len(HOURS),) + ws.shape[1:], "float32") for k in stats_names(a)}
    n = np.zeros(len(HOURS), "int32")
    for hi, h in enumerate(HOURS):
        sel = hrs == h
        n[hi] = int(sel.sum())
        out["mean_ws"][hi], out["std_ws"][hi] = ws[sel].mean(0), ws[sel].std(0, ddof=1)
        out["mean_msl"][hi], out["std_msl"][hi] = msl[sel].mean(0), msl[sel].std(0, ddof=1)
        if a.t2m:
            out["mean_t2m"][hi], out["std_t2m"][hi] = t2[sel].mean(0), t2[sel].std(0, ddof=1)
    ds = xr.Dataset({k: (("hour", "lat", "lon"), v) for k, v in out.items()},
                    coords={"hour": HOURS, "lat": part.latitude.values, "lon": part.longitude.values})
    ds["n_samples"] = ("hour", n)
    PARTS.mkdir(parents=True, exist_ok=True)
    tmp = part_path(month, a).with_suffix(".tmp")
    ds.to_netcdf(tmp, engine="netcdf4")
    tmp.replace(part_path(month, a))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", default="2010-2019")
    ap.add_argument("--day-step", type=int, default=3)
    ap.add_argument("--months", default="1-12", help="e.g. 1-12 or 10 (a subset is only for testing)")
    ap.add_argument("--out", default=str(OUT))
    ap.add_argument("--lat", type=float, nargs=2, default=list(s1.LAT))
    ap.add_argument("--lon", type=float, nargs=2, default=list(s1.LON))
    ap.add_argument("--t2m", action="store_true", help="also 2 m temperature (K)")
    ap.add_argument("--month-child", type=int, help="internal: build one month")
    a = ap.parse_args()
    if a.month_child:
        build_month(a.month_child, a)
        return
    y0, y1 = (int(v) for v in a.years.split("-"))
    m = [int(v) for v in a.months.split("-")]
    months = list(range(m[0], m[-1] + 1))

    t0 = time.time()
    for month in months:
        if part_path(month, a).exists():
            print(f"  month {month:2d}: cached", flush=True)
            continue
        for attempt in range(1, RETRIES + 1):
            try:
                subprocess.run([sys.executable, __file__, "--month-child", str(month), "--years", a.years,
                                "--day-step", str(a.day_step), "--lat", *map(str, a.lat), "--lon", *map(str, a.lon)]
                               + (["--t2m"] if a.t2m else []), check=True, timeout=TIMEOUT_S)
                break
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
                print(f"  month {month:2d}: attempt {attempt} failed ({type(e).__name__}), retrying", flush=True)
        else:
            sys.exit(f"month {month} failed after {RETRIES} attempts")
        print(f"  month {month:2d}: done ({time.time() - t0:.0f}s)", flush=True)

    parts = [xr.open_dataset(part_path(mo, a)).load() for mo in months]
    out = xr.concat(parts, dim=pd.Index(months, name="month"))
    out.attrs = {"source": f"ERA5 (WeatherBench2) {y0}-{y1}, every {a.day_step} days, per calendar month and UTC hour, "
                           f"{a.lat[0]:g}-{a.lat[1]:g}N {a.lon[0]:g}-{a.lon[1]:g}E",
                 "n_samples_min": int(out.n_samples.min())}
    offset = {"mean_msl": 1000.0, "mean_t2m": 273.15}
    enc = {k: {"dtype": "int16", "scale_factor": 0.01, "add_offset": offset.get(k, 0.0),
               "_FillValue": -32768, "zlib": True, "complevel": 9} for k in stats_names(a)}
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    out.to_netcdf(a.out, encoding=enc, engine="netcdf4")
    print(f"wrote {a.out} ({Path(a.out).stat().st_size / 1e6:.1f} MB), "
          f"min {int(out.n_samples.min())} samples per (month, hour)")


if __name__ == "__main__":
    main()
