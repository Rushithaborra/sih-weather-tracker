"""Compare a tracked anomaly object with the IBTrACS best track.

Two positions are scored per object:
- centroid: intensity-weighted centroid of the anomaly object. Not a cyclone
  centre: the strongest winds sit in an asymmetric ring around the eye.
- pmin: location of minimum MSLP inside the object's bounding box (baseline).
"""
import numpy as np
import pandas as pd

from .tracker import haversine_km

KEEP = ["ISO_TIME", "LAT", "LON", "WMO_WIND", "WMO_PRES", "USA_WIND", "USA_PRES", "NAME", "SID"]
POSITIONS = {"centroid": ("lat", "lon"), "pmin": ("pmin_lat", "pmin_lon")}


def load_ibtracs(ni_csv_path, season, name) -> pd.DataFrame:
    """Read the IBTrACS NI basin CSV (2nd row = units) and keep one storm."""
    df = pd.read_csv(ni_csv_path, skiprows=[1], low_memory=False, keep_default_na=False)
    df = df[(df.NAME.str.strip() == name) & (pd.to_numeric(df.SEASON, errors="coerce") == season)]
    if df.empty:
        raise ValueError(f"{name} {season} not found in {ni_csv_path}")
    df = df[[c for c in KEEP if c in df.columns]].copy()
    for c in df.columns:
        if c not in ("ISO_TIME", "NAME", "SID"):
            df[c] = pd.to_numeric(df[c].replace(" ", np.nan), errors="coerce")
    df = df.rename(columns={"ISO_TIME": "time", "LAT": "lat", "LON": "lon"})
    df["time"] = pd.to_datetime(df.time)
    return df.sort_values("time").reset_index(drop=True)


def best_track_at(bt: pd.DataFrame, times) -> pd.DataFrame:
    """Best-track position at the given times: exact match where available,
    otherwise linear interpolation inside the best-track period (never extrapolated)."""
    bt = bt.set_index("time")[["lat", "lon"]]
    times = pd.DatetimeIndex(times)
    idx = bt.index.union(times)
    interp = bt.reindex(idx).interpolate(method="time", limit_area="inside")
    out = interp.reindex(times)
    out.index.name = "time"
    return out.reset_index()


def main_track_id(tracks: pd.DataFrame) -> int:
    """Most intense track: lowest minimum MSLP (ties: most steps).

    Chosen from the tracked fields only. Selecting by distance to the best
    track would be circular (picking the answer that agrees with the reference).
    """
    g = tracks.groupby("track_id").agg(p=("min_msl", "min"), n=("time", "size"))
    return int(g.sort_values(["p", "n"], ascending=[True, False]).index[0])


def position_errors(tracks: pd.DataFrame, bt: pd.DataFrame, track_id=None):
    """Per-timestep distance (km) to the best track for both position methods."""
    if tracks.empty:
        return None, pd.DataFrame()
    tid = main_track_id(tracks) if track_id is None else track_id
    tr = tracks[tracks.track_id == tid].sort_values("time")
    ref = best_track_at(bt, tr.time)
    err = pd.DataFrame({"time": tr.time.values, "bt_lat": ref.lat.values, "bt_lon": ref.lon.values})
    for m, (la, lo) in POSITIONS.items():
        err[f"{m}_lat"], err[f"{m}_lon"] = tr[la].values, tr[lo].values
        err[f"{m}_error_km"] = haversine_km(err[f"{m}_lat"], err[f"{m}_lon"], err.bt_lat, err.bt_lon)
    return tid, err.dropna(subset=["bt_lat"]).reset_index(drop=True)


def error_stats(err: pd.DataFrame, method: str) -> dict:
    e = err[f"{method}_error_km"]
    if e.empty:
        return {"n": 0}
    return {"n": int(e.size), "mean_km": round(float(e.mean()), 1), "median_km": round(float(e.median()), 1),
            "min_km": round(float(e.min()), 1), "max_km": round(float(e.max()), 1)}


def onset(bt: pd.DataFrame, tracks: pd.DataFrame, kt=34) -> dict:
    """First best-track time with wind >= kt (WMO = IMD 3-min, and USA/JTWC 1-min)
    next to the first detection of any object."""
    out = {}
    for col in ("WMO_WIND", "USA_WIND"):
        if col in bt:
            hit = bt[bt[col] >= kt]
            out[f"first_{col.lower()}_ge_{kt}kt"] = hit.time.min().isoformat() if len(hit) else None
    out["first_detection"] = tracks.time.min().isoformat() if len(tracks) else None
    return out
