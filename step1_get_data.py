"""
Step 1 - pull a small, public ERA5 slice for the Cyclone Amphan demo case.
Source: WeatherBench2 public bucket (no login needed).

Run:
    python step1_get_data.py            # downloads the case (small)
    python step1_get_data.py --clim     # then the climatology sample (bigger)
"""
import sys
import xarray as xr

ERA5 = ("gs://weatherbench2/datasets/era5/"
        "1959-2023_01_10-wb13-6h-1440x721_with_derived_variables.zarr")

CASE_VARS = ["10m_u_component_of_wind", "10m_v_component_of_wind",
             "mean_sea_level_pressure", "total_precipitation_6hr"]
CLIM_VARS = ["10m_u_component_of_wind", "10m_v_component_of_wind",
             "mean_sea_level_pressure"]

LAT = (5, 30)      # Bay of Bengal + east India
LON = (75, 100)
CASE_TIME = ("2020-05-14", "2020-05-22")   # Amphan: formation -> landfall -> decay
CLIM_YEARS = range(2010, 2020)             # 10 years; cut this if download is slow
CLIM_WINDOW = ("05-07", "05-29")           # +/- ~1 week around the case dates


def open_era5():
    ds = xr.open_zarr(ERA5, storage_options={"token": "anon"})
    missing = [v for v in CASE_VARS if v not in ds.data_vars]
    if missing:
        print("Variables not found:", missing)
        print("Available (first 60):", list(ds.data_vars)[:60])
        sys.exit(1)
    return ds


def cut(ds, vars_):
    ds = ds[vars_].sortby("latitude")
    return ds.sel(latitude=slice(*LAT), longitude=slice(*LON))


def get_case():
    ds = cut(open_era5(), CASE_VARS).sel(time=slice(*CASE_TIME))
    print(ds)
    ds.load().to_netcdf("amphan_case.nc")
    print("Saved amphan_case.nc")


def get_clim():
    ds = cut(open_era5(), CLIM_VARS)
    parts = []
    for y in CLIM_YEARS:
        part = ds.sel(time=slice(f"{y}-{CLIM_WINDOW[0]}", f"{y}-{CLIM_WINDOW[1]}"))
        part = part.sel(time=part.time.dt.hour == 0)   # one step/day keeps it small
        print(f"  {y}: {part.sizes['time']} steps")
        parts.append(part.load())
    clim = xr.concat(parts, dim="time")
    clim.to_netcdf("clim_sample.nc")
    print("Saved clim_sample.nc")


if __name__ == "__main__":
    get_clim() if "--clim" in sys.argv else get_case()
