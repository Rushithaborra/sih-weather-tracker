"""Alert tiers from climatological percentiles, plus GeoJSON / JSON export."""
import json

import numpy as np
import pandas as pd

# low / moderate: climatological percentile. severe: z-score magnitude, because
# with ~115 samples per hour the percentile saturates at 100 for Amphan and can
# no longer rank how extreme a cell is.
TIERS = {"low": 90.0, "moderate": 95.0, "severe_z": 3.0}
TIER_NAMES = ["none", "low", "moderate", "severe"]


def tier_grid(pct, z_extreme, tiers=TIERS):
    """0 = none, 1 = low, 2 = moderate, 3 = severe.

    z_extreme is the z-score oriented so that larger = more extreme
    (z_ws for wind, -z_msl for low pressure).
    """
    out = np.zeros(pct.shape, dtype="int8")
    out[pct >= tiers["low"]] = 1
    out[pct >= tiers["moderate"]] = 2
    out[z_extreme >= tiers["severe_z"]] = 3
    return out


def alerts_geojson(pct, z_extreme, values, lat, lon, times, variable, tiers=TIERS):
    """One polygon per alerted cell. pct/z_extreme/values are (time, lat, lon)."""
    dlat, dlon = abs(lat[1] - lat[0]) / 2, abs(lon[1] - lon[0]) / 2
    feats = []
    tg = tier_grid(pct, z_extreme, tiers)
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
                "z": round(float(z_extreme[t, i, j]), 2),
                "value": round(float(values[t, i, j]), 2), "lat": la, "lon": lo},
        })
    return {"type": "FeatureCollection", "features": feats,
            "properties": {"thresholds": tiers,
                           "note": ("low/moderate: percentile, severe: z-score, both vs a per-hour ERA5 "
                                    "reanalysis sample climatology; single member, not an ensemble EFI.")}}


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
