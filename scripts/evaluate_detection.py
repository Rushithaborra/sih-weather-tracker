"""Detection skill per case: probability of detection, false alarms, pooled track error.

Read-only evaluation of the existing pipeline output in data/processed/<case>/
(tracks.csv, validation.csv, ibtracs.csv, stage1_summary.csv) -- nothing is re-run
or re-tuned.

Definitions:
  * Best-track steps: IBTrACS positions at the ERA5 synoptic hours (00/06/12/18 UTC)
    inside the case's ERA5 time window and inside the analysis region
    (5-30N, 75-100E), with wind >= 34 kt. Primary: WMO_WIND (IMD, 3-min
    sustained); USA_WIND (JTWC, 1-min) is reported alongside.
  * Hit: at least one detected object at that time whose pressure minimum lies
    within 300 km of the best-track position.
  * False-alarm object: a detected object whose pressure minimum is more than
    300 km from the storm's best-track position at that time, or at a time outside
    the best-track period. (A second real system in the region counts here too.)
  * Pooled error: every matched step of the main track (validation.csv) across the
    held-out cases, not a median of per-storm medians.

    python scripts/evaluate_detection.py
"""
import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from pipeline import validate  # noqa: E402
from pipeline.tracker import haversine_km  # noqa: E402

PROC = ROOT / "data" / "processed"
OUT_JSON = PROC / "detection_skill.json"
OUT_JS = ROOT / "dashboard-ui" / "src" / "data" / "detectionSkill.js"
CASES = ["amphan", "yaas", "phailin", "hudhud", "titli", "fani", "bulbul", "nivar"]
IN_SAMPLE = {"amphan"}
LAT, LON = (5, 30), (75, 100)
MATCH_KM = 300.0
GALE_KT = 34


def evaluate(case):
    d = PROC / case
    objs = pd.read_csv(d / "tracks.csv", parse_dates=["time"])
    err = pd.read_csv(d / "validation.csv", parse_dates=["time"])
    bt = pd.read_csv(d / "ibtracs.csv", parse_dates=["time"])
    steps = pd.to_datetime(pd.read_csv(d / "stage1_summary.csv").time)
    meta = json.loads((d / "meta.json").read_text())
    y0, y1 = (int(v) for v in meta["clim_years"].split("-"))
    season = int(bt.time.dt.year.iloc[0])

    syn = bt[bt.time.dt.hour.isin([0, 6, 12, 18]) & (bt.time.dt.minute == 0)
             & bt.time.between(steps.min(), steps.max())
             & bt.lat.between(*LAT) & bt.lon.between(*LON)]

    def pod(col):
        s = syn[syn[col] >= GALE_KT]
        hit_t, miss_t = [], []
        for _, r in s.iterrows():
            o = objs[objs.time == r.time]
            ok = len(o) and (haversine_km(o.pmin_lat.values, o.pmin_lon.values, r.lat, r.lon) <= MATCH_KM).any()
            (hit_t if ok else miss_t).append(r.time)
        # where the misses fall: before the first hit (early, weak stage), after the last (decay/landfall), or between
        stage = {"before": 0, "during": 0, "after": 0}
        for t in miss_t:
            stage["before" if not hit_t or t < min(hit_t) else "after" if t > max(hit_t) else "during"] += 1
        return {"hits": len(hit_t), "steps": int(len(s)), "pod": round(len(hit_t) / len(s), 3) if len(s) else None,
                "missesByStage": stage}

    ref = validate.best_track_at(bt, objs.time.drop_duplicates().sort_values()).set_index("time")
    dist = [haversine_km(o.pmin_lat, o.pmin_lon, ref.loc[o.time].lat, ref.loc[o.time].lon)
            if pd.notna(ref.loc[o.time].lat) else float("inf") for o in objs.itertuples()]
    false_alarms = int(sum(x > MATCH_KM for x in dist))
    false_alarms_200 = int(sum(x > 200.0 for x in dist))
    # objects on a track other than the main one but still within MATCH_KM of the storm: the same
    # storm split into more than one track, not a second system
    main_id = json.loads((d / "validation.json").read_text())["track_id"]
    fragments = sorted(round(x) for x, tid in zip(dist, objs.track_id) if tid != main_id and x <= MATCH_KM)

    return {
        "case": case, "season": season, "role": "in-sample" if case in IN_SAMPLE else "held out",
        "climYears": meta["clim_years"], "inClimatology": y0 <= season <= y1,
        "podWmo": pod("WMO_WIND"), "podUsa": pod("USA_WIND"),
        "objects": int(len(objs)), "falseAlarms": false_alarms, "falseAlarms200km": false_alarms_200, "fragmentKm": fragments,
        "matchedSteps": int(len(err)),
        "pminMedianKm": round(float(err.pmin_error_km.median()), 1),
        "centroidMedianKm": round(float(err.centroid_error_km.median()), 1),
    }, err.assign(case=case)


def main():
    rows, errs = [], []
    for c in CASES:
        r, e = evaluate(c)
        rows.append(r)
        errs.append(e)
    held = [r for r in rows if r["role"] == "held out"]
    e = pd.concat([x for x, r in zip(errs, rows) if r["role"] == "held out"])
    pooled = {
        "storms": len(held), "matchedSteps": int(len(e)),
        "pminMeanKm": round(float(e.pmin_error_km.mean()), 1), "pminMedianKm": round(float(e.pmin_error_km.median()), 1),
        "centroidMeanKm": round(float(e.centroid_error_km.mean()), 1),
        "centroidMedianKm": round(float(e.centroid_error_km.median()), 1),
        "podWmo": {"hits": sum(r["podWmo"]["hits"] for r in held), "steps": sum(r["podWmo"]["steps"] for r in held)},
        "podUsa": {"hits": sum(r["podUsa"]["hits"] for r in held), "steps": sum(r["podUsa"]["steps"] for r in held)},
        "falseAlarms": sum(r["falseAlarms"] for r in held), "falseAlarms200km": sum(r["falseAlarms200km"] for r in held),
        "objects": sum(r["objects"] for r in held),
        "fragmentedStorms": [r["case"] for r in held if r["fragmentKm"]],
        "missesByStageWmo": {k: sum(r["podWmo"]["missesByStage"][k] for r in held) for k in ("before", "during", "after")},
        "inClimatology": [r["case"] for r in held if r["inClimatology"]],
    }
    for k in ("podWmo", "podUsa"):
        pooled[k]["pod"] = round(pooled[k]["hits"] / pooled[k]["steps"], 3)
    out = {"definitions": {"bestTrackSteps": "IBTrACS at 00/06/12/18 UTC, inside the case window and 5-30N 75-100E, wind >= 34 kt",
                           "hit": f"a detected object's pressure minimum within {MATCH_KM:.0f} km",
                           "falseAlarm": f"object pressure minimum > {MATCH_KM:.0f} km from the best track, or outside the best-track period",
                           "wind": "WMO = IMD 3-min sustained (primary); USA = JTWC 1-min"},
           "cases": rows, "pooledHeldOut": pooled}
    OUT_JSON.write_text(json.dumps(out, indent=2))
    OUT_JS.write_text("// Detection skill per case, generated by scripts/evaluate_detection.py from data/processed/.\n"
                      f"export const DETECTION_SKILL = {json.dumps(out, indent=2)}\n")

    print(f"{'case':8} {'role':9} {'clim':9} {'in?':4} {'POD(WMO)':>12} {'POD(USA)':>12} {'objs':>4} {'FA':>3} {'steps':>5} {'pmin med':>8} {'cent med':>8}")
    for r in rows:
        w, u = r["podWmo"], r["podUsa"]
        print(f"{r['case']:8} {r['role']:9} {r['climYears']:9} {'yes' if r['inClimatology'] else 'no':4} "
              f"{w['hits']:>3}/{w['steps']:<3} {w['pod'] or 0:>4.0%}  {u['hits']:>3}/{u['steps']:<3} {u['pod'] or 0:>4.0%} "
              f"{r['objects']:>4} {r['falseAlarms']:>3} {r['matchedSteps']:>5} {r['pminMedianKm']:>8} {r['centroidMedianKm']:>8}")
    print("\npooled (7 held out):", json.dumps(pooled, indent=1))


if __name__ == "__main__":
    main()
