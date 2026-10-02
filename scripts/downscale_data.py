"""Training / test data for the Stage 2 downscaler experiment (design in DEV_LOG.md, 2026-10-02).

For every IMD day available in data/raw/imd_rain/rain/<year>.grd(.tmp):
  * input  x: ERA5 hourly precipitation on the WeatherBench2 1.5 deg grid, summed over the IMD day
              (the 24 h ending 03 UTC on the IMD date), interpolated bilinearly to the IMD 0.25 deg grid;
  * target y: IMD 0.25 deg gridded gauge rainfall (NaN outside India);
  * static  : ERA5 surface geopotential (terrain, m) and land-sea mask on the IMD grid.
Writes data/raw/downscale/<year>.nc (gitignored) and data/raw/downscale/static.nc.

    python scripts/downscale_data.py              # every year with IMD data
    python scripts/downscale_data.py 2013 2014    # some years
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from rainfall_vs_imd import imd_year, IMD_LAT, IMD_LON  # noqa: E402

OUT = ROOT / "data" / "raw" / "downscale"
COARSE = "gs://weatherbench2/datasets/era5/1959-2023_01_10-1h-240x121_equiangular_with_poles_conservative.zarr"
FINE6H = "gs://weatherbench2/datasets/era5/1959-2023_01_10-wb13-6h-1440x721_with_derived_variables.zarr"
BOX = dict(latitude=slice(3.0, 42.0), longitude=slice(63.0, 103.5))  # 1.5 deg cells around the IMD grid
TIMEOUT_S, RETRIES = 900, 4


def coarse_year_child(year):
    """Child process: hourly 1.5 deg tp for the IMD days of one year -> daily sums on the coarse grid."""
    import dask
    dask.config.set(scheduler="threads", num_workers=32)
    ds = xr.open_zarr(COARSE, storage_options={"token": "anon"})["total_precipitation"].sel(**BOX)
    start, end = pd.Timestamp(f"{year - 1}-12-31 04:00"), pd.Timestamp(f"{year}-12-31 03:00")
    hourly = ds.sel(time=slice(start, end)).load() * 1000.0  # m -> mm
    # hour h belongs to the IMD day ending at the next 03 UTC: shift by -4 h then floor to the day, +1 day
    day = (pd.DatetimeIndex(hourly.time.values) - pd.Timedelta(hours=4)).floor("D") + pd.Timedelta(days=1)
    daily = hourly.assign_coords(imd_date=("time", day)).groupby("imd_date").sum("time")
    # the 1.5 deg store is (time, longitude, latitude); keep (time, latitude, longitude) everywhere downstream
    daily = daily.rename({"imd_date": "time"}).sortby("latitude").transpose("time", "latitude", "longitude")
    OUT.mkdir(parents=True, exist_ok=True)
    daily.to_netcdf(OUT / f"coarse_{year}.nc")


def coarse_year(year):
    path = OUT / f"coarse_{year}.nc"
    if path.exists():
        return xr.open_dataarray(path).load()
    for attempt in range(1, RETRIES + 1):
        try:
            subprocess.run([sys.executable, __file__, "--coarse", str(year)], check=True, timeout=TIMEOUT_S)
            return xr.open_dataarray(path).load()
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
            print(f"   coarse {year} attempt {attempt} failed ({type(e).__name__})", flush=True)
    sys.exit(f"coarse ERA5 for {year} failed")


def static_fields():
    path = OUT / "static.nc"
    if path.exists():
        return xr.open_dataset(path).load()
    ds = xr.open_zarr(FINE6H, storage_options={"token": "anon"})
    z = ds["geopotential_at_surface"].sortby("latitude").interp(latitude=IMD_LAT, longitude=IMD_LON).load() / 9.80665
    lsm = ds["land_sea_mask"].sortby("latitude").interp(latitude=IMD_LAT, longitude=IMD_LON).load()
    out = xr.Dataset({"terrain_m": (("lat", "lon"), z.values.astype("float32")),
                      "land_sea_mask": (("lat", "lon"), lsm.values.astype("float32"))},
                     coords={"lat": IMD_LAT, "lon": IMD_LON})
    OUT.mkdir(parents=True, exist_ok=True)
    out.to_netcdf(path)
    return out


def build_year(year):
    imd = imd_year(year)
    if imd is None:
        print(f"{year}: no IMD file", flush=True)
        return
    coarse = coarse_year(year)
    days = sorted(set(pd.DatetimeIndex(imd.time.values)) & set(pd.DatetimeIndex(coarse.time.values)))
    coarse = coarse.transpose("time", "latitude", "longitude")
    x = coarse.sel(time=days).interp(latitude=IMD_LAT, longitude=IMD_LON, method="linear").transpose("time", "latitude", "longitude")
    y = imd.sel(time=days)
    ds = xr.Dataset({"x_coarse_mm": (("time", "lat", "lon"), np.clip(x.values, 0, None).astype("float32")),
                     "y_imd_mm": (("time", "lat", "lon"), y.values.astype("float32"))},
                    coords={"time": days, "lat": IMD_LAT, "lon": IMD_LON})
    ds["coarse_mm"] = (("time", "clat", "clon"), coarse.sel(time=days).values.astype("float32"))
    ds = ds.assign_coords(clat=coarse.latitude.values, clon=coarse.longitude.values)
    ds.to_netcdf(OUT / f"{year}.nc")
    print(f"{year}: {len(days)} days, IMD land max {float(np.nanmax(y.values)):.0f} mm, "
          f"coarse max {float(x.max()):.0f} mm", flush=True)


def main():
    if sys.argv[1:2] == ["--coarse"]:
        coarse_year_child(int(sys.argv[2]))
        return
    if sys.argv[1:2] == ["--coarse-only"]:  # GitHub Actions: just the coarse daily ERA5 files (no IMD needed)
        for year in [int(v) for v in sys.argv[2:]]:
            coarse_year(year)
            print(f"coarse {year} done", flush=True)
        return
    static_fields()
    have = sorted(int(p.name[:4]) for p in (ROOT / "data" / "raw" / "imd_rain" / "rain").glob("*.grd*"))
    for year in [int(v) for v in sys.argv[1:]] or have:
        build_year(year)


if __name__ == "__main__":
    main()
