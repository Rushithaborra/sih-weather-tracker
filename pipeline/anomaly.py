"""Climatological anomalies: per-gridpoint, per-hour-of-day z-scores and percentiles.

Each case time step is compared only with climatology samples from the same
UTC hour, so the normal daily cycle (e.g. afternoon winds over land, the
semi-diurnal pressure tide) is not mistaken for an anomaly.

Note on EFI: ECMWF's Extreme Forecast Index compares an ensemble forecast CDF with
the model's own climate built from reforecasts. This prototype has neither an
ensemble nor reforecasts. It ranks a single reanalysis value against a sample of
reanalysis values from the same calendar window and hour in other years, which is
only the single-member analogue of that idea.
"""
import numpy as np
import pandas as pd
import xarray as xr

# Physical floors on the std, so calm, steady places don't turn small changes
# into huge z-scores.
STD_FLOOR = {"ws": 1.0, "msl": 1.0, "t2m": 0.5}  # m/s, hPa, K


def zscore(x: np.ndarray, mean: np.ndarray, std: np.ndarray, floor: float) -> np.ndarray:
    return (x - mean) / np.maximum(std, floor)


def percentile_rank(x2d: np.ndarray, sample: np.ndarray) -> np.ndarray:
    """Percentile (0-100) of x2d[i, j] within sample[:, i, j].

    Mid-rank for ties: (count below + 0.5 * count equal) / n. With n samples the
    resolution is 100/n, and any value outside the sample range saturates at
    exactly 0 or 100.
    """
    below = (sample < x2d[None]).sum(axis=0)
    equal = (sample == x2d[None]).sum(axis=0)
    return (100.0 * (below + 0.5 * equal) / sample.shape[0]).astype("float32")


def compute_anomalies(case: xr.Dataset, clim: xr.Dataset) -> xr.Dataset:
    """Add z_ws, z_msl, pct_ws and pct_msl_low to the case dataset.

    MSLP: low pressure is the anomaly of interest, so z_msl is signed as usual
    (strongly negative = anomalously low) and pct_msl_low is the percentile of
    the *negative* pressure, i.e. the share of climatology samples with higher
    pressure than the case value.
    """
    out = case.copy()
    dims = ("time", "lat", "lon")
    shape = case.ws.shape
    case_hours = case.time.dt.hour.values
    clim_hours = clim.time.dt.hour.values
    missing = sorted(set(case_hours) - set(clim_hours))
    if missing:
        raise ValueError(f"climatology has no samples for UTC hours {missing}")

    res = {k: np.empty(shape, "float32") for k in ("z_ws", "z_msl", "pct_ws", "pct_msl_low")}
    stats = {f"clim_{s}_{v}": np.empty((4,) + shape[1:], "float32")
             for s in ("mean", "std") for v in ("ws", "msl")}
    n_per_hour = {}
    for hi, h in enumerate(sorted(set(case_hours))):
        cs = clim.isel(time=clim_hours == h)
        n_per_hour[int(h)] = int(cs.sizes["time"])
        steps = np.nonzero(case_hours == h)[0]
        for var in ("ws", "msl"):
            sample = cs[var].values.astype("float64")
            mean, std = sample.mean(axis=0), sample.std(axis=0, ddof=1)
            stats[f"clim_mean_{var}"][hi], stats[f"clim_std_{var}"][hi] = mean, std
            for t in steps:
                res[f"z_{var}"][t] = zscore(case[var].values[t], mean, std, STD_FLOOR[var])
        for t in steps:
            res["pct_ws"][t] = percentile_rank(case.ws.values[t], cs.ws.values)
            res["pct_msl_low"][t] = percentile_rank(-case.msl.values[t], -cs.msl.values)

    for k, v in res.items():
        out[k] = (dims, v)
    out = out.assign_coords(hour=sorted(set(case_hours)))
    for k, v in stats.items():
        out[k] = (("hour", "lat", "lon"), v[: len(out.hour)])
    counts = set(n_per_hour.values())
    out.attrs["clim_n_samples"] = counts.pop() if len(counts) == 1 else str(n_per_hour)
    out.attrs["clim_n_per_hour"] = str(n_per_hour)
    out.attrs["clim_years"] = f"{int(clim.time.dt.year.min())}-{int(clim.time.dt.year.max())}"
    return out


def compute_anomalies_from_stats(case: xr.Dataset, stats: xr.Dataset) -> xr.Dataset:
    """z_ws and z_msl against precomputed per-(month, UTC hour) mean/std.

    For live forecasts at any time of year, where carrying the raw climatology
    sample for every month is impractical. `stats` has mean_ws, std_ws, mean_msl,
    std_msl on (month, hour, lat, lon) -- see scripts/build_live_climatology.py.
    Each step uses the stats for its own valid month and hour. Percentiles need
    the raw sample, so they are not produced; the tracker only uses z-scores.
    """
    out = case.copy()
    st = stats.sel(lat=case.lat, lon=case.lon, method="nearest")
    if not (np.allclose(st.lat, case.lat) and np.allclose(st.lon, case.lon)):
        raise ValueError("climatology stats grid does not match the case grid")
    months, hours = case.time.dt.month.values, case.time.dt.hour.values
    for var in ("ws", "msl"):
        z = np.empty(case[var].shape, "float32")
        for t, (m, h) in enumerate(zip(months, hours)):
            s = st.sel(month=m, hour=h)
            z[t] = zscore(case[var].values[t], s[f"mean_{var}"].values, s[f"std_{var}"].values, STD_FLOOR[var])
        out[f"z_{var}"] = (("time", "lat", "lon"), z)
    out.attrs["clim_source"] = stats.attrs.get("source", "per-month stats")
    return out


def summary(ds: xr.Dataset) -> pd.DataFrame:
    """Per-timestep table: max ws, min msl, max z_ws, min z_msl."""
    return pd.DataFrame({
        "time": pd.to_datetime(ds.time.values),
        "max_ws": ds.ws.max(("lat", "lon")).values.round(2),
        "min_msl": ds.msl.min(("lat", "lon")).values.round(2),
        "max_z_ws": ds.z_ws.max(("lat", "lon")).values.round(2),
        "min_z_msl": ds.z_msl.min(("lat", "lon")).values.round(2),
    })
