"""Track merging (option, off by default): what would it change? Read-only evaluation.

For the 8 case studies (data/processed/<case>/fields.nc) and the quiet windows
(data/raw/quiet_*.nc), runs the frozen tracker with and without
tracker.merge_track_fragments (rule in DEV_LOG.md, 2026-10-01). Reports tracks per case, the
main-track error against IBTrACS, POD (unchanged by construction: merging only relabels
tracks, it adds or removes no objects) and false links -- a join where either joined object is
more than 300 km from the best track (any join in a quiet window is false by definition).
The published results are the no-merge column and must reproduce tracks.csv exactly.

    python scripts/evaluate_track_merging.py
Output: data/processed/track_merging.json
"""
import json
import sys
from pathlib import Path

import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from pipeline import anomaly, preprocess, tracker, validate  # noqa: E402

PROC = ROOT / "data" / "processed"
CASES = ["amphan", "yaas", "phailin", "hudhud", "titli", "fani", "bulbul", "nivar"]
MATCH_KM = 300.0


def case_eval(key):
    ds = xr.open_dataset(PROC / key / "fields.nc").load()
    bt = pd.read_csv(PROC / key / "ibtracs.csv", parse_dates=["time"])
    base = tracker.run(ds, **tracker.DEFAULTS)
    published = pd.read_csv(PROC / key / "tracks.csv", parse_dates=["time"])
    same = len(base) == len(published) and base.track_id.nunique() == published.track_id.nunique()
    merged, links = tracker.merge_track_fragments(base)
    out = {"case": key, "reproducesPublished": bool(same)}
    for lab, tr in (("noMerge", base), ("merge", merged)):
        tid, err = validate.position_errors(tr, bt)
        out[lab] = {"tracks": int(tr.track_id.nunique()), "mainTrackSteps": int((tr.track_id == tid).sum()),
                    "matchedSteps": int(len(err)),
                    "pminMedianKm": round(float(err.pmin_error_km.median()), 1) if len(err) else None,
                    "pminMeanKm": round(float(err.pmin_error_km.mean()), 1) if len(err) else None}
    false_links = []
    for L in links:
        ends = base[base.track_id == L["from"]].sort_values("time").tail(1)
        starts = base[base.track_id == L["to"]].sort_values("time").head(1)
        pair = pd.concat([ends, starts])
        ref = validate.best_track_at(bt, pair.time.drop_duplicates().sort_values()).set_index("time")
        d = [float(tracker.haversine_km(r.pmin_lat, r.pmin_lon, ref.loc[r.time].lat, ref.loc[r.time].lon))
             if pd.notna(ref.loc[r.time].lat) else float("inf") for r in pair.itertuples()]
        L["kmToBestTrack"] = [None if x == float("inf") else round(x) for x in d]
        if max(d) > MATCH_KM:
            false_links.append(L)
    out.update({"links": links, "falseLinks": len(false_links)})
    return out


def quiet_eval(stats):
    rows = []
    for p in sorted((ROOT / "data" / "raw").glob("quiet_*.nc")):
        ds = anomaly.compute_anomalies_from_stats(preprocess.load_case(p), stats)
        for lab, kw in (("frozen", tracker.DEFAULTS), ("noWindGateDiagnostic", {**tracker.DEFAULTS, "ws_min": 0.0})):
            tr = tracker.run(ds, **kw)
            merged, links = tracker.merge_track_fragments(tr)
            rows.append({"window": p.stem.replace("quiet_", ""), "detector": lab,
                         "tracksNoMerge": int(tr.track_id.nunique()) if len(tr) else 0,
                         "tracksMerge": int(merged.track_id.nunique()) if len(merged) else 0,
                         "links (all false: no storm present)": len(links)})
    return rows


def main():
    cases = [case_eval(c) for c in CASES]
    quiet = quiet_eval(xr.open_dataset(ROOT / "data" / "clim" / "era5_monthly_stats.nc").load())
    out = {"rule": "merge if 6-12 h gap, <= 300 km between centroids, |dMSLP| <= 10 hPa (DEV_LOG 2026-10-01); option, off by default",
           "podNote": "POD is identical with and without merging: merging relabels tracks, it adds or removes no objects",
           "cases": cases, "quietWindows": quiet}
    (PROC / "track_merging.json").write_text(json.dumps(out, indent=1))
    print(f"{'case':8} {'repro':5} {'tracks':>11} {'main steps':>11} {'matched':>9} {'pmin median':>15} {'pmin mean':>15} links false")
    for c in cases:
        a, b = c["noMerge"], c["merge"]
        print(f"{c['case']:8} {str(c['reproducesPublished']):5} {a['tracks']:>4} -> {b['tracks']:<4} {a['mainTrackSteps']:>4} -> {b['mainTrackSteps']:<4} "
              f"{a['matchedSteps']:>3} -> {b['matchedSteps']:<3} {str(a['pminMedianKm']):>6} -> {str(b['pminMedianKm']):<6} "
              f"{str(a['pminMeanKm']):>6} -> {str(b['pminMeanKm']):<6} {len(c['links']):>3} {c['falseLinks']:>3}  {c['links']}")
    print("\nquiet windows:")
    for r in quiet:
        print("  ", r)


if __name__ == "__main__":
    main()
