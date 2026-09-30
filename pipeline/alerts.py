"""Alert tiers from climatological percentiles, plus GeoJSON / JSON export."""
import json

import numpy as np
import pandas as pd

# Every tier = z-score AND an absolute wind gate from the IMD categories, because
# near a cyclone almost every cell is "unusual for this place" (high z) without
# being dangerous. Set after observing results; not validated against impacts.
#   low:      z >= 1.5 and wind >= 8.7 m/s (17 kt, Depression)
#   moderate: z >= 2   and wind >= 17 m/s  (34 kt, Cyclonic Storm)
#   severe:   z >= 3   and wind >= 25 m/s  (48 kt, Severe Cyclonic Storm)
TIERS = {"low_z": 1.5, "low_ws": 8.7, "moderate_z": 2.0, "moderate_ws": 17.0, "severe_z": 3.0, "severe_ws": 25.0}
TIER_NAMES = ["none", "low", "moderate", "severe"]
BOX_PAD_DEG = 1.0  # alerts only inside tracked-object boxes extended by this much


def box_mask(objects: pd.DataFrame, lat, lon, pad=BOX_PAD_DEG):
    """(lat, lon) bool mask: True inside any object's bounding box extended by pad degrees."""
    m = np.zeros((len(lat), len(lon)), dtype=bool)
    if objects.empty:
        return m
    for _, o in objects.iterrows():
        m |= (((lat >= o.lat_min - pad) & (lat <= o.lat_max + pad))[:, None]
              & ((lon >= o.lon_min - pad) & (lon <= o.lon_max + pad))[None, :])
    return m


def tier_grid(pct, z_extreme, ws, tiers=TIERS, mask=None):
    """0 = none, 1 = low, 2 = moderate, 3 = severe.

    z_extreme is the z-score oriented so that larger = more extreme
    (z_ws for wind, -z_msl for low pressure); ws is 10 m wind speed (m/s).
    mask (broadcastable bool) limits alerts to tracked-object areas; see box_mask.
    pct is kept for the export record only.
    """
    out = np.zeros(pct.shape, dtype="int8")
    out[(z_extreme >= tiers["low_z"]) & (ws >= tiers["low_ws"])] = 1
    out[(z_extreme >= tiers["moderate_z"]) & (ws >= tiers["moderate_ws"])] = 2
    out[(z_extreme >= tiers["severe_z"]) & (ws >= tiers["severe_ws"])] = 3
    if mask is not None:
        out[~np.broadcast_to(mask, out.shape)] = 0
    return out


def alerts_geojson(pct, z_extreme, ws, values, lat, lon, times, variable, tiers=TIERS, mask=None):
    """One polygon per alerted cell. pct/z_extreme/ws/values are (time, lat, lon)."""
    dlat, dlon = abs(lat[1] - lat[0]) / 2, abs(lon[1] - lon[0]) / 2
    feats = []
    tg = tier_grid(pct, z_extreme, ws, tiers, mask)
    for t, i, j in zip(*np.nonzero(tg)):
        la, lo = float(lat[i]), float(lon[j])
        feats.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [[
                [lo - dlon, la - dlat], [lo + dlon, la - dlat], [lo + dlon, la + dlat],
                [lo - dlon, la + dlat], [lo - dlon, la - dlat]]]},
            "properties": {
                "time": pd.Timestamp(times[t]).isoformat(), "variable": variable,
                "tier": TIER_NAMES[tg[t, i, j]], "percentile": round(float(pct[t, i, j]), 1),
                "z": round(float(z_extreme[t, i, j]), 2), "wind_ms": round(float(ws[t, i, j]), 2),
                "value": round(float(values[t, i, j]), 2), "lat": la, "lon": lo},
        })
    return {"type": "FeatureCollection", "features": feats,
            "properties": {"thresholds": tiers,
                           "note": ("Tiers: z-score AND wind >= 8.7/17/25 m/s (IMD D/CS/SCS), only inside tracked-object "
                                    "boxes + 1 deg. Adjusted after observing results; not validated against impacts. "
                                    "Per-hour ERA5 reanalysis climatology; single member, not an ensemble EFI.")}}


def tracks_json(tracks: pd.DataFrame):
    recs = []
    if tracks.empty:
        return recs
    for tid, g in tracks.sort_values("time").groupby("track_id"):
        recs.append({"track_id": int(tid), "points": [
            {k: (v.isoformat() if isinstance(v, pd.Timestamp) else (round(v, 4) if isinstance(v, float) else v))
             for k, v in r.items() if k != "track_id"}
            for r in g.drop(columns=["t_index"], errors="ignore").to_dict("records")]})
    return recs


def dumps(obj):
    return json.dumps(obj, default=lambda o: o.item() if hasattr(o, "item") else str(o))
