"""Turn data/processed/<case>/ into the dashboard's case records.

Amphan and Yaas were copied into dashboard-ui/src/data/cases.js by hand; this
script produces the same record shape for the extra held-out storms
(scripts/build_extra_cases.py) and writes them to casesExtra.js, which cases.js
merges in. It also copies each case's alert sample GeoJSON to dashboard-ui/public/.

    python scripts/export_cases_for_dashboard.py              # every case in STORMS
    python scripts/export_cases_for_dashboard.py --check amphan yaas
        # print the records for the hand-copied cases to compare with cases.js
"""
import json
import shutil
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from build_extra_cases import STORMS  # noqa: E402

PROC = ROOT / "data" / "processed"
OUT = ROOT / "dashboard-ui" / "src" / "data" / "casesExtra.js"
PUBLIC = ROOT / "dashboard-ui" / "public"
TIERS = ("severe", "moderate", "low")
REGION_LAT, REGION_LON = (5, 30), (75, 100)  # step1_get_data.LAT / LON


def iso(t):
    return pd.Timestamp(t).strftime("%Y-%m-%dT%H:%M:%SZ")


def record(key, label):
    d = PROC / key
    val = json.loads((d / "validation.json").read_text())
    tracks = json.loads((d / "tracks.json").read_text())
    err = pd.read_csv(d / "validation.csv", parse_dates=["time"]).set_index("time")
    main = next(tr for tr in tracks if tr["track_id"] == val["track_id"])["points"]
    t0 = pd.Timestamp(main[0]["time"])
    hours = lambda t: int(round((pd.Timestamp(t) - t0).total_seconds() / 3600))  # noqa: E731

    track = []
    for p in main:
        t = pd.Timestamp(p["time"])
        e = err.loc[t] if t in err.index else None
        track.append({
            "t": hours(t), "time": iso(t), "lat": round(p["lat"], 4), "lon": round(p["lon"], 4),
            "pminLat": p["pmin_lat"], "pminLon": p["pmin_lon"],
            "box": [p["lat_min"], p["lat_max"], p["lon_min"], p["lon_max"]],
            "nCells": p["n_cells"], "maxWs": round(p["max_ws"], 2), "minMsl": round(p["min_msl"], 2),
            "maxZ": round(p["max_z"], 2), "areaKm2": round(p["area_km2"]),
            "bt": None if e is None else [round(e.bt_lat, 1), round(e.bt_lon, 1)],
            "pminErrKm": None if e is None else round(e.pmin_error_km, 1),
            "centroidErrKm": None if e is None else round(e.centroid_error_km, 1),
        })

    def at_extreme(key_, fn):
        p = fn(track, key=lambda q: q[key_])
        return p[key_], p["t"]

    min_msl, min_msl_at = at_extreme("minMsl", min)
    max_ws, max_ws_at = at_extreme("maxWs", max)
    max_z, max_z_at = at_extreme("maxZ", max)

    feats = [f["properties"] for f in json.loads((d / "alerts_ws_sample.geojson").read_text())["features"]]
    snap_time = feats[0]["time"] if feats else json.loads((d / "meta.json").read_text()).get("sample_time")
    examples = {}
    for tier in TIERS:
        cells = [f for f in feats if f["tier"] == tier]
        top = max(cells, key=lambda f: f["z"]) if cells else None
        examples[tier] = None if top is None else {"lat": top["lat"], "lon": top["lon"], "z": top["z"], "windMs": top["wind_ms"]}

    extra = [
        {"time": iso(p["time"]), "box": [p["lat_min"], p["lat_max"], p["lon_min"], p["lon_max"]],
         "maxWs": round(p["max_ws"], 2), "minMsl": round(p["min_msl"], 2)}
        for tr in tracks if tr["track_id"] != val["track_id"] for p in tr["points"]
    ]
    # Best-track onset (first >= 34 kt) counted inside the analysis region only, so a
    # storm that formed elsewhere (Bulbul began as Pacific TS Matmo) is compared with
    # its arrival, not its genesis. Same as validation.json for storms born in-region.
    bt = pd.read_csv(d / "ibtracs.csv", parse_dates=["time"])
    bt = bt[bt.lat.between(*REGION_LAT) & bt.lon.between(*REGION_LON)]
    first34 = lambda col: bt[bt[col] >= 34].time.min() if col in bt else pd.NaT  # noqa: E731
    onset = {"first_detection": val["onset"]["first_detection"],
             "first_wmo_wind_ge_34kt": None if pd.isna(first34("WMO_WIND")) else first34("WMO_WIND"),
             "first_usa_wind_ge_34kt": None if pd.isna(first34("USA_WIND")) else first34("USA_WIND")}
    rec = {
        "id": key, "label": label, "role": "held out",
        "roleNote": "Added after the rules were frozen on Amphan; run with the same parameters, nothing adjusted.",
        "center": [round(sum(p["lat"] for p in track) / len(track), 1), round(sum(p["lon"] for p in track) / len(track), 1)],
        "track": track,
        "validation": {
            "trackId": val["track_id"], "nTracks": val["n_tracks"], "matchedSteps": val["pmin"]["n"],
            "pmin": {"medianKm": val["pmin"]["median_km"], "meanKm": val["pmin"]["mean_km"],
                     "minKm": val["pmin"]["min_km"], "maxKm": val["pmin"]["max_km"]},
            "centroid": {"medianKm": val["centroid"]["median_km"], "meanKm": val["centroid"]["mean_km"],
                         "minKm": val["centroid"]["min_km"], "maxKm": val["centroid"]["max_km"]},
            "onset": {"detection": onset["first_detection"] and iso(onset["first_detection"]),
                      "imdWmo": onset["first_wmo_wind_ge_34kt"] and iso(onset["first_wmo_wind_ge_34kt"]),
                      "jtwcUsa": onset["first_usa_wind_ge_34kt"] and iso(onset["first_usa_wind_ge_34kt"])},
        },
        "peak": {"minMsl": min_msl, "minMslAt": min_msl_at, "maxWs": max_ws, "maxWsAt": max_ws_at,
                 "maxZ": max_z, "maxZAt": max_z_at},
        "alertSnapshot": {
            "time": iso(snap_time), "t": hours(snap_time), "domainCells": 10201,
            "counts": {tier: sum(f["tier"] == tier for f in feats) for tier in ("low", "moderate", "severe")},
            "examples": examples,
        },
    }
    if extra:
        rec["extraObjects"] = extra
    return rec


def main():
    if sys.argv[1:2] == ["--check"]:
        for key in sys.argv[2:]:
            print(json.dumps(record(key, key), indent=1))
        return
    keys = sys.argv[1:] or [k for k in STORMS if (PROC / k / "validation.json").exists()]
    recs = {}
    for key in keys:
        rec = record(key, STORMS[key][2])
        if rec["validation"]["matchedSteps"] == 0:
            print(f"  {key}: no track overlaps the best track -- skipped")
            continue
        recs[key] = rec
        shutil.copyfile(PROC / key / "alerts_ws_sample.geojson", PUBLIC / f"{key}_alerts_sample.geojson")
        print(f"  {key}: {len(rec['track'])} steps, pmin median {rec['validation']['pmin']['medianKm']} km")
    OUT.write_text(
        "// Extra held-out cyclones, generated from data/processed/<case>/ by\n"
        "// scripts/export_cases_for_dashboard.py (after scripts/build_extra_cases.py).\n"
        "// Same pipeline and frozen parameters as Amphan/Yaas; nothing here is hand-edited.\n\n"
        f"export const EXTRA_CASES = {json.dumps(recs, indent=2)}\n"
    )
    print(f"wrote {OUT} ({len(recs)} cases)")


if __name__ == "__main__":
    main()
