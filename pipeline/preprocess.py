"""Load the ERA5 slices and convert them to the units the pipeline works in.

ERA5 is reanalysis (a best estimate of the past atmosphere), not a forecast.
The WeatherBench2 copy used here is on a 0.25 degree grid (~28 km at the equator).
"""
import numpy as np
import xarray as xr

U10 = "10m_u_component_of_wind"
V10 = "10m_v_component_of_wind"
MSL = "mean_sea_level_pressure"
TP6 = "total_precipitation_6hr"


def _standardise(ds: xr.Dataset) -> xr.Dataset:
    ds = ds.sortby("latitude").sortby("longitude")
    out = xr.Dataset(coords={"time": ds.time, "lat": ds.latitude.values, "lon": ds.longitude.values})
    dims = ("time", "lat", "lon")
    ws = np.sqrt(ds[U10].values.astype("float64") ** 2 + ds[V10].values.astype("float64") ** 2)
    out["ws"] = (dims, ws.astype("float32"), {"units": "m s-1", "long_name": "10 m wind speed"})
    out["msl"] = (dims, (ds[MSL].values / 100.0).astype("float32"),
                  {"units": "hPa", "long_name": "mean sea level pressure"})
    if TP6 in ds:
        # ERA5 accumulations are metres of water; 1 m = 1000 mm. Tiny negatives are packing noise.
        tp = np.clip(ds[TP6].values * 1000.0, 0, None)
        out["tp"] = (dims, tp.astype("float32"), {"units": "mm (6 h)-1", "long_name": "6-hour precipitation"})
    return out


def load_case(path) -> xr.Dataset:
    with xr.open_dataset(path) as ds:
        return _standardise(ds.load())


def load_clim(path) -> xr.Dataset:
    with xr.open_dataset(path) as ds:
        return _standardise(ds.load())
