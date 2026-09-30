"""Turn data/processed/yaas_gefs_ensemble/ (real GEFS ensemble output) into a static
JS data module for the dashboard, the same way the rest of dashboard-ui/src/data/ embeds
real pipeline numbers directly rather than fetching at runtime.

Usage: python scripts/export_gefs_for_dashboard.py
"""
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
ENS = ROOT / "data" / "processed" / "yaas_gefs_ensemble"
OUT = ROOT / "dashboard-ui" / "src" / "data" / "gefsEnsemble.js"

summary = json.loads((ENS / "ensemble_summary.json").read_text())
tracks = pd.read_csv(ENS / "member_tracks.csv", parse_dates=["time"])
val = pd.read_csv(ENS / "validation_by_member.csv")
agree = pd.read_csv(ENS / "members_agreeing_by_time.csv", parse_dates=["time"])
severe = pd.read_csv(ENS / "severe_fraction_by_time.csv", parse_dates=["time"])
bt = pd.read_csv(ROOT / "data" / "processed" / "yaas" / "ibtracs.csv", parse_dates=["time"])

members = []
for _, row in val.sort_values("member").iterrows():
    m = row["member"]
    tid = int(row["track_id"])
    pts = tracks[(tracks.member == m) & (tracks.track_id == tid)].sort_values("t_index")
    members.append({
        "id": m,
        "trackId": tid,
        "validation": {
            "n": int(row["n"]), "meanKm": round(float(row["mean_km"]), 1),
            "medianKm": round(float(row["median_km"]), 1),
            "minKm": round(float(row["min_km"]), 1), "maxKm": round(float(row["max_km"]), 1),
        },
        "points": [
            {
                "leadH": float(p["lead_h"]), "time": p["time"].isoformat(),
                "lat": round(float(p["lat"]), 4), "lon": round(float(p["lon"]), 4),
                "pminLat": round(float(p["pmin_lat"]), 4), "pminLon": round(float(p["pmin_lon"]), 4),
                "maxWs": round(float(p["max_ws"]), 2), "minMsl": round(float(p["min_msl"]), 2),
                "maxZ": round(float(p["max_z"]), 2),
            }
            for _, p in pts.iterrows()
        ],
    })

agreement = [
    {
        "leadH": float(r["lead_h"]), "time": r["time"].isoformat(),
        "membersPresent": int(r["members_present"]), "membersAgreeing": int(r["members_agreeing"]),
        "nMembers": int(r["n_members"]),
    }
    for _, r in agree.iterrows()
]
severeFraction = [
    {
        "leadH": float(r["lead_h"]), "time": r["time"].isoformat(),
        "fraction": round(float(r["frac_members_severe"]), 3), "nWithObject": int(r["n_members_with_object"]),
    }
    for _, r in severe.iterrows()
]
bestTrack = [
    {"time": r["time"].isoformat(), "lat": round(float(r["lat"]), 3), "lon": round(float(r["lon"]), 3)}
    for _, r in bt.iterrows()
]

js = f"""// Real NOAA GEFS (v12, 0.25 deg, 30 perturbed members + control) forecast run for
// Yaas, exported from data/processed/yaas_gefs_ensemble/ by scripts/export_gefs_for_dashboard.py.
// Every number here is real: run through the same detector/tracker as the ERA5 cases
// (pipeline/anomaly.py, pipeline/tracker.py), not the deck's mock-up numbers.
// Regenerate with: scripts/fetch_gefs.py -> scripts/run_gefs_ensemble.py -> this script.

export const GEFS_META = {{
  storm: {summary['storm']!r},
  label: 'Yaas, May 2021 — GEFS v12 ensemble forecast',
  init: {summary['init']!r},
  nMembers: {summary['n_members']},
  nMembersWithTracks: {summary['n_members_with_tracks']},
  center: [18, 88.5],
}}

export const GEFS_SUMMARY = {json.dumps(summary, indent=2)}

export const GEFS_MEMBERS = {json.dumps(members, indent=2)}

export const GEFS_AGREEMENT = {json.dumps(agreement, indent=2)}

export const GEFS_SEVERE_FRACTION = {json.dumps(severeFraction, indent=2)}

export const GEFS_BEST_TRACK = {json.dumps(bestTrack, indent=2)}
"""

OUT.write_text(js)
print(f"Wrote {OUT} ({len(members)} members, {sum(len(m['points']) for m in members)} points total)")
