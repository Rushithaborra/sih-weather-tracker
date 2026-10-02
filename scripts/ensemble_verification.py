"""Probabilistic verification of the GEFS forecast-skill runs: CRPS, rank histograms, spread-skill.

Read-only on data/processed/gefs_skill/*.json (the 28 starts of scripts/gefs_forecast_skill.py) and
IBTrACS. At every valid time where the best track has a value and at least 3 members are matched:
  * CRPS of the members' minimum MSLP against IBTrACS WMO_PRES (hPa), and of their maximum 10 m
    wind against WMO_WIND (IMD 3-min sustained, kt -> m/s);
  * the rank of the observation among the members, as a normalised rank (0-1, 5 bins) so 5-, 11- and
    31-member ensembles can be pooled within a data source;
  * spread-skill for position: mean member distance from the ensemble-mean position vs the
    ensemble-mean position error.
Only matched members count (see the matching rule), so n per time is reported. Operational and
reforecast are never pooled together. GEFS 0.25 deg winds are expected to sit below best-track
winds; that bias shows up in the rank histogram rather than being corrected.

    python scripts/ensemble_verification.py
Output: data/processed/ensemble_verification.json, dashboard-ui/src/data/ensembleVerification.js
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))
from gefs_forecast_skill import STORMS, best_track  # noqa: E402
from pipeline.tracker import haversine_km  # noqa: E402

SKILL = ROOT / "data" / "processed" / "gefs_skill"
OUT_JSON = ROOT / "data" / "processed" / "ensemble_verification.json"
OUT_JS = ROOT / "dashboard-ui" / "src" / "data" / "ensembleVerification.js"
KT = 0.514444
MIN_MEMBERS = 3
BINS = 5


def crps(members, obs):
    """Empirical CRPS: E|X - y| - 0.5 E|X - X'|."""
    x = np.asarray(members, float)
    return float(np.abs(x - obs).mean() - 0.5 * np.abs(x[:, None] - x[None, :]).mean())


def norm_rank(members, obs, rng):
    x = np.sort(np.asarray(members, float))
    below, ties = int((x < obs).sum()), int((x == obs).sum())
    r = below + rng.integers(0, ties + 1)  # random tie-breaking
    return (r + rng.random()) / (len(x) + 1)


def main():
    rng = np.random.default_rng(0)
    rows = []
    for f in sorted(SKILL.glob("*_20*.json")):
        res = json.loads(f.read_text())
        name, season = STORMS[res["storm"]]
        bt = best_track(name, season)
        bt["WMO_PRES"] = pd.to_numeric(bt.WMO_PRES, errors="coerce")
        bt = bt.set_index("time")
        by_time = {}
        for m in res["members"]:
            for p in m["points"]:
                by_time.setdefault(p["time"], []).append(p)
        for t, pts in by_time.items():
            ts = pd.Timestamp(t[:-1])
            if ts not in bt.index or len(pts) < MIN_MEMBERS:
                continue
            b = bt.loc[ts]
            lead = pts[0]["leadH"]
            row = {"storm": res["storm"], "source": res["source"], "init": res["init"], "leadH": lead, "n": len(pts),
                   "nMembers": res["nMembers"]}
            if pd.notna(b.get("WMO_PRES")):
                v = [p["minMsl"] for p in pts]
                row.update(crpsMsl=crps(v, b.WMO_PRES), rankMsl=norm_rank(v, b.WMO_PRES, rng), maeMsl=float(abs(np.mean(v) - b.WMO_PRES)))
            if pd.notna(b.get("WMO_WIND")):
                v = [p["maxWs"] for p in pts]
                o = b.WMO_WIND * KT
                row.update(crpsWs=crps(v, o), rankWs=norm_rank(v, o, rng), maeWs=float(abs(np.mean(v) - o)))
            lat, lon = np.mean([p["lat"] for p in pts]), np.mean([p["lon"] for p in pts])
            row["spreadKm"] = float(np.mean([haversine_km(p["lat"], p["lon"], lat, lon) for p in pts]))
            row["meanErrKm"] = float(haversine_km(lat, lon, b.lat, b.lon))
            rows.append(row)
    df = pd.DataFrame(rows)

    out = {"definitions": {"crps": "empirical CRPS of matched members vs IBTrACS (WMO_PRES hPa, WMO_WIND kt->m/s)",
                           "rankHistogram": f"normalised rank of the observation among matched members, {BINS} bins; flat = calibrated, "
                                            "piled at one end = biased, U-shape = under-dispersive",
                           "spreadSkill": "mean member distance from the ensemble-mean position vs ensemble-mean position error"},
           "sources": {}}
    for src, g in df.groupby("source"):
        g = g.assign(day=(g.leadH // 24).astype(int))
        by_day = []
        for d, h in g.groupby("day"):
            by_day.append({"leadDays": f"{d}-{d + 1}", "n": int(len(h)),
                           "crpsMslHpa": round(float(h.crpsMsl.mean()), 2) if "crpsMsl" in h else None,
                           "crpsWsMs": round(float(h.crpsWs.mean()), 2) if "crpsWs" in h else None,
                           "spreadKm": round(float(h.spreadKm.mean()), 1), "meanErrKm": round(float(h.meanErrKm.mean()), 1)})
        hist = {}
        for k in ("rankMsl", "rankWs"):
            r = g[k].dropna().values
            counts = np.histogram(r, bins=BINS, range=(0, 1))[0]
            hist[k] = {"counts": counts.tolist(), "n": int(len(r))}
        out["sources"][src] = {
            "storms": sorted(g.storm.unique()), "times": int(len(g)), "membersPerTimeMedian": float(g.n.median()),
            "crpsMslHpa": round(float(g.crpsMsl.mean()), 2), "crpsWsMs": round(float(g.crpsWs.mean()), 2),
            "maeMslHpa": round(float(g.maeMsl.mean()), 2), "maeWsMs": round(float(g.maeWs.mean()), 2),
            "spreadKm": round(float(g.spreadKm.mean()), 1), "meanErrKm": round(float(g.meanErrKm.mean()), 1),
            "spreadSkillRatio": round(float(g.spreadKm.mean() / g.meanErrKm.mean()), 2),
            "rankHistogram": hist, "byLeadDay": by_day,
        }
    OUT_JSON.write_text(json.dumps(out, indent=1))
    OUT_JS.write_text("// Probabilistic verification of GEFS starts, generated by scripts/ensemble_verification.py.\n"
                      f"export const ENSEMBLE_VERIFICATION = {json.dumps(out, indent=1)}\n")
    for src, s in out["sources"].items():
        print(f"== {src}: {s['times']} times, {s['membersPerTimeMedian']} members/time | CRPS MSLP {s['crpsMslHpa']} hPa, wind {s['crpsWsMs']} m/s "
              f"| spread {s['spreadKm']} km vs error {s['meanErrKm']} km (ratio {s['spreadSkillRatio']})")
        print("   rank hist MSLP", s["rankHistogram"]["rankMsl"], "| wind", s["rankHistogram"]["rankWs"])


if __name__ == "__main__":
    main()
