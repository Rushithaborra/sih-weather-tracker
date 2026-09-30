"""Run the existing detector/tracker on every GEFS member fetched by fetch_gefs.py,
then aggregate across members into real ensemble statistics: members agreeing,
an exceedance-fraction EFI-like score, and per-member + ensemble-mean track error
against IBTrACS at real forecast lead time (valid_time - init_time).

This is the genuine version of the KPIs the concept mock-up hardcodes (23 members,
peak EFI, members agreeing, lead time to landfall) -- computed from an actual
NOAA GEFS ensemble forecast run, not invented numbers. Detection, tracking and
the climatology are untouched (pipeline/anomaly.py, pipeline/tracker.py).

Usage:
    python scripts/run_gefs_ensemble.py --case yaas_gefs --init 2021-05-21T00:00 \
        --storm YAAS --bt data/processed/yaas/ibtracs.csv
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from pipeline import anomaly, preprocess, tracker, validate  # noqa: E402

RAW = ROOT / "data" / "raw"
PROC = ROOT / "data" / "processed"
DEFAULTS = {"threshold": 2.0, "min_size": 6, "max_disp_km": 400.0, "rule": "ws_and_msl",
            "ws_min": tracker.GALE_MS}
SEVERE_WS = 25.0  # IMD Severe Cyclonic Storm, m/s -- same gate as pipeline/alerts.py
AGREE_RADIUS_KM = 100.0


def load_climatology():
    combined = RAW / "clim_sample_combined.nc"
    if combined.exists():
        return preprocess.load_clim(combined)
    c00 = preprocess.load_clim(RAW / "clim_sample.nc")
    c00 = c00.sel(time=c00.time.dt.year.isin(range(2015, 2020)))
    c_rest = preprocess.load_clim(RAW / "clim_sample_061218.nc")
    return xr.concat([c00, c_rest], dim="time").sortby("time")


def load_best_track(path):
    bt = pd.read_csv(path, parse_dates=["time"])
    return bt


def run_member(member_path, clim, init):
    case = preprocess.load_case(member_path)
    ds = anomaly.compute_anomalies(case, clim)
    tracks = tracker.run(ds, **DEFAULTS)
    if len(tracks):
        tracks = tracks.copy()
        tracks["lead_h"] = (pd.to_datetime(tracks.time) - pd.Timestamp(init)).dt.total_seconds() / 3600.0
    return ds, tracks


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--case", required=True, help="folder under data/raw/ with member_*.nc files")
    ap.add_argument("--init", required=True)
    ap.add_argument("--storm", required=True, help="for labelling only")
    ap.add_argument("--bt", required=True, help="path to a CSV with time,lat,lon,WMO_WIND,USA_WIND columns")
    args = ap.parse_args()

    member_dir = RAW / args.case
    files = sorted(member_dir.glob("member_*.nc"))
    if not files:
        sys.exit(f"no member_*.nc files in {member_dir} -- run scripts/fetch_gefs.py first")

    print(f"Loading climatology...")
    clim = load_climatology()
    bt = load_best_track(args.bt)

    all_tracks = []
    all_stage1 = []
    per_member_val = []
    print(f"Running detection + tracking on {len(files)} members...")
    for f in files:
        label = f.stem.replace("member_", "")
        ds, tracks = run_member(f, clim, args.init)
        s = anomaly.summary(ds)
        s["member"] = label
        all_stage1.append(s)
        if len(tracks):
            tracks["member"] = label
            all_tracks.append(tracks)
            tid, err = validate.position_errors(tracks, bt)
            if tid is not None and len(err):
                err["lead_h"] = (pd.to_datetime(err.time) - pd.Timestamp(args.init)).dt.total_seconds() / 3600.0
                stats = validate.error_stats(err, "pmin")
                per_member_val.append({"member": label, "track_id": tid, **stats,
                                        "lead_h_range": [float(err.lead_h.min()), float(err.lead_h.max())]})
                print(f"  [{label}] {len(tracks)} objects, track {tid}: "
                      f"pmin median {stats.get('median_km', 'n/a')} km over {stats.get('n', 0)} steps")
            else:
                print(f"  [{label}] {len(tracks)} objects, no overlap with best-track period")
        else:
            print(f"  [{label}] no objects detected")

    if not all_tracks:
        sys.exit("no member produced any tracked object -- nothing to aggregate")

    tracks_all = pd.concat(all_tracks, ignore_index=True)
    stage1_all = pd.concat(all_stage1, ignore_index=True)
    n_members = len(files)

    out_dir = PROC / f"{args.case}_ensemble"
    out_dir.mkdir(parents=True, exist_ok=True)
    tracks_all.to_csv(out_dir / "member_tracks.csv", index=False)
    pd.DataFrame(per_member_val).to_csv(out_dir / "validation_by_member.csv", index=False)

    # Real "members agreeing": at each lead time all members share, what fraction
    # have a tracked object within AGREE_RADIUS_KM of the best-track position?
    common_times = sorted(set(tracks_all.time))
    bt_by_time = validate.best_track_at(bt, common_times).set_index("time")
    agree_rows = []
    for t in common_times:
        ref = bt_by_time.loc[t] if t in bt_by_time.index else None
        if ref is None or pd.isna(ref.lat):
            continue
        step = tracks_all[tracks_all.time == t]
        members_here = step.member.unique()
        hits = 0
        for m in members_here:
            mo = step[step.member == m]
            d = tracker.haversine_km(mo.pmin_lat.values, mo.pmin_lon.values, ref.lat, ref.lon)
            if (d <= AGREE_RADIUS_KM).any():
                hits += 1
        lead_h = (pd.Timestamp(t) - pd.Timestamp(args.init)).total_seconds() / 3600.0
        agree_rows.append({"time": str(t), "lead_h": lead_h, "members_present": len(members_here),
                            "members_agreeing": hits, "n_members": n_members})
    agree_df = pd.DataFrame(agree_rows).sort_values("lead_h")
    agree_df.to_csv(out_dir / "members_agreeing_by_time.csv", index=False)

    # Real exceedance-fraction "EFI-like" score: fraction of members with an
    # object whose max wind reaches the IMD Severe gate, at each lead time.
    efi_rows = []
    for t in common_times:
        step = tracks_all[tracks_all.time == t]
        members_here = step.member.unique()
        severe = step.groupby("member").max_ws.max()
        frac = float((severe >= SEVERE_WS).sum()) / n_members
        lead_h = (pd.Timestamp(t) - pd.Timestamp(args.init)).total_seconds() / 3600.0
        efi_rows.append({"time": str(t), "lead_h": lead_h, "frac_members_severe": frac,
                          "n_members_with_object": len(members_here)})
    efi_df = pd.DataFrame(efi_rows).sort_values("lead_h")
    efi_df.to_csv(out_dir / "severe_fraction_by_time.csv", index=False)

    peak_agree = agree_df.loc[agree_df.members_agreeing.idxmax()] if len(agree_df) else None
    peak_efi = efi_df.loc[efi_df.frac_members_severe.idxmax()] if len(efi_df) else None
    val_df = pd.DataFrame(per_member_val)

    summary = {
        "case": args.case, "storm": args.storm, "init": args.init, "n_members": n_members,
        "n_members_with_tracks": tracks_all.member.nunique(),
        "peak_members_agreeing": None if peak_agree is None else {
            "members": int(peak_agree.members_agreeing), "of": n_members,
            "lead_h": float(peak_agree.lead_h), "time": str(peak_agree.time),
        },
        "peak_severe_fraction": None if peak_efi is None else {
            "fraction": round(float(peak_efi.frac_members_severe), 3),
            "lead_h": float(peak_efi.lead_h), "time": str(peak_efi.time),
        },
        "track_error_by_lead_time": {
            "median_km_all_members": None if val_df.empty else round(float(val_df.median_km.median()), 1),
            "n_members_validated": int(len(val_df)),
        },
    }
    (out_dir / "ensemble_summary.json").write_text(json.dumps(summary, indent=2))
    print("\n" + json.dumps(summary, indent=2))
    print(f"\nWrote {out_dir}")


if __name__ == "__main__":
    main()
