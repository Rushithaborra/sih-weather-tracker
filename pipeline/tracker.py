"""Object detection on anomaly fields and Hungarian tracking across time steps."""
import numpy as np
import pandas as pd
from scipy import ndimage
from scipy.optimize import linear_sum_assignment

R_EARTH_KM = 6371.0
STRUCT_8 = np.ones((3, 3), dtype=bool)  # 8-connectivity


def haversine_km(lat1, lon1, lat2, lon2):
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dp, dl = p2 - p1, np.radians(np.asarray(lon2) - np.asarray(lon1))
    a = np.sin(dp / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2
    return 2 * R_EARTH_KM * np.arcsin(np.sqrt(a))


def cell_area_km2(lat, dlat, dlon):
    """Area of each grid cell (lat rows) on a sphere, returned as (nlat, 1)."""
    h = R_EARTH_KM * np.radians(dlat)
    w = R_EARTH_KM * np.radians(dlon) * np.cos(np.radians(lat))
    return (h * w)[:, None]


GALE_MS = 17.0  # gale force, the usual cutoff for a named tropical storm


def detection_mask(z_ws, z_msl, threshold, rule="ws_and_msl", ws=None, ws_min=0.0):
    """rule: 'ws' -> z_ws >= thr; 'ws_and_msl' -> also z_msl <= -thr; 'msl' -> z_msl <= -thr.

    If ws_min > 0 the wind speed must also be >= ws_min: the z-score says
    "unusual for this place", the absolute threshold says "actually dangerous".
    """
    if rule == "ws":
        m = z_ws >= threshold
    elif rule == "ws_and_msl":
        m = (z_ws >= threshold) & (z_msl <= -threshold)
    elif rule == "msl":
        m = z_msl <= -threshold
    else:
        raise ValueError(f"unknown rule {rule!r}")
    if ws_min > 0:
        m &= ws >= ws_min
    return m


def detect(z_ws, z_msl, ws, msl, lat, lon, times, threshold=2.0, min_size=6, rule="ws_and_msl",
           ws_min=GALE_MS):
    """Label connected anomaly objects per time step.

    Inputs are (time, lat, lon) arrays with lat/lon ascending. The centroid is
    weighted by the anomaly magnitude of the field the rule is based on.
    Returns a DataFrame with one row per object.
    """
    dlat, dlon = abs(lat[1] - lat[0]), abs(lon[1] - lon[0])
    area = cell_area_km2(lat, dlat, dlon)
    LAT, LON = np.meshgrid(lat, lon, indexing="ij")
    rows = []
    for t in range(z_ws.shape[0]):
        mask = detection_mask(z_ws[t], z_msl[t], threshold, rule, ws[t], ws_min)
        labels, n = ndimage.label(mask, structure=STRUCT_8)
        weight = np.abs(z_msl[t]) if rule == "msl" else np.clip(z_ws[t], 0, None)
        for k in range(1, n + 1):
            m = labels == k
            if m.sum() < min_size:
                continue
            w = weight[m]
            w = w if w.sum() > 0 else np.ones_like(w)
            ii, jj = np.nonzero(m)
            # Baseline position: minimum MSLP inside the object's bounding box.
            box = msl[t][ii.min():ii.max() + 1, jj.min():jj.max() + 1]
            bi, bj = np.unravel_index(int(np.argmin(box)), box.shape)
            rows.append({
                "time": pd.Timestamp(times[t]), "t_index": t,
                "lat": float(np.average(LAT[m], weights=w)),
                "lon": float(np.average(LON[m], weights=w)),
                "pmin_lat": float(lat[ii.min() + bi]), "pmin_lon": float(lon[jj.min() + bj]),
                "lat_min": float(lat[ii.min()] - dlat / 2), "lat_max": float(lat[ii.max()] + dlat / 2),
                "lon_min": float(lon[jj.min()] - dlon / 2), "lon_max": float(lon[jj.max()] + dlon / 2),
                "n_cells": int(m.sum()),
                "area_km2": float(np.broadcast_to(area, m.shape)[m].sum()),
                "max_ws": float(ws[t][m].max()), "min_msl": float(msl[t][m].min()),
                "max_z": float(z_ws[t][m].max()), "min_z_msl": float(z_msl[t][m].min()),
            })
    return pd.DataFrame(rows)


def track(objects: pd.DataFrame, max_disp_km=400.0) -> pd.DataFrame:
    """Link objects between consecutive time steps (Hungarian on great-circle
    distance, gated at max_disp_km). Unmatched objects start new tracks; a track
    that misses a step ends."""
    if objects.empty:
        return objects.assign(track_id=pd.Series(dtype=int))
    objs = objects.sort_values(["t_index", "lat", "lon"]).reset_index(drop=True)
    objs["track_id"] = -1
    next_id = 0
    prev = None
    for t in sorted(objs.t_index.unique()):
        cur = objs.index[objs.t_index == t]
        if prev is not None and len(prev) and objs.loc[prev[0], "t_index"] == t - 1:
            d = haversine_km(objs.loc[prev, "lat"].values[:, None], objs.loc[prev, "lon"].values[:, None],
                             objs.loc[cur, "lat"].values[None, :], objs.loc[cur, "lon"].values[None, :])
            cost = np.where(d <= max_disp_km, d, 1e9)
            r, c = linear_sum_assignment(cost)
            for i, j in zip(r, c):
                if d[i, j] <= max_disp_km:
                    objs.loc[cur[j], "track_id"] = objs.loc[prev[i], "track_id"]
        for j in cur:
            if objs.loc[j, "track_id"] < 0:
                objs.loc[j, "track_id"] = next_id
                next_id += 1
        prev = cur
    objs["track_id"] = objs.track_id.astype(int)
    return objs


def tracks_4d(tracks: pd.DataFrame) -> pd.DataFrame:
    """Per track: union of boxes over time plus start/end time (a 4D box)."""
    if tracks.empty:
        return pd.DataFrame()
    g = tracks.groupby("track_id")
    return pd.DataFrame({
        "start": g.time.min(), "end": g.time.max(), "n_steps": g.size(),
        "lat_min": g.lat_min.min(), "lat_max": g.lat_max.max(),
        "lon_min": g.lon_min.min(), "lon_max": g.lon_max.max(),
        "max_ws": g.max_ws.max(), "min_msl": g.min_msl.min(), "max_z": g.max_z.max(),
        "max_area_km2": g.area_km2.max(),
    }).reset_index()


def run(ds, threshold=2.0, min_size=6, max_disp_km=400.0, rule="ws_and_msl", ws_min=GALE_MS):
    objs = detect(ds.z_ws.values, ds.z_msl.values, ds.ws.values, ds.msl.values,
                  ds.lat.values, ds.lon.values, ds.time.values, threshold, min_size, rule, ws_min)
    return track(objs, max_disp_km)
