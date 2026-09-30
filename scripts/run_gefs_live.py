"""Daily live run: fetch the latest NOAA GEFS ensemble forecast, run the same
detector and tracker as the case studies on every member, and write a small JSON
file the dashboard's Live forecast page reads.

Differences from run_gefs_ensemble.py (the Yaas case study):
  * the init time is the latest available run, not a historical date;
  * there is no best track yet, so nothing is validated -- the output is the
    forecast itself (member tracks, members with a system, severe-wind fraction);
  * anomalies use per-(month, hour) climatology stats (build_live_climatology.py),
    so it works in any month, not only May.

Usage:
    python scripts/run_gefs_live.py                       # latest 00/12 UTC run
    python scripts/run_gefs_live.py --init 2026-09-30T00:00 --members 4 --fxx-end 24   # quick test
"""
import argparse
import json
import shutil
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

import fetch_gefs  # noqa: E402
from pipeline import anomaly, preprocess, tracker  # noqa: E402

CLIM = ROOT / "data" / "clim" / "era5_monthly_stats.nc"
RAW = ROOT / "data" / "raw" / "gefs_live"
OUT_DIR = ROOT / "dashboard-ui" / "public" / "live"
LAT, LON = (5, 30), (75, 100)
DEFAULTS = {"threshold": 2.0, "min_size": 6, "max_disp_km": 400.0, "rule": "ws_and_msl",
            "ws_min": tracker.GALE_MS}
SEVERE_WS = 25.0  # IMD Severe Cyclonic Storm gate, same as pipeline/alerts.py
MIN_TRACK_STEPS = 2  # single-step blobs are not shown as systems
HISTORY_LEN = 60


def latest_init(fxx_end, n_members):
    """Most recent 00/12 UTC run whose last member and lead time are published."""
    from herbie import Herbie

    now = pd.Timestamp.now(tz="UTC").tz_localize(None).floor("12h")
    for back in range(6):
        init = now - pd.Timedelta(hours=12 * back)
        H = Herbie(init, model="gefs", product="atmos.25", member=n_members, fxx=fxx_end, verbose=False)
        if H.grib is not None:
            return init
        print(f"  {init:%Y-%m-%d %HZ} not complete yet")
    sys.exit("no complete GEFS run found in the last 3 days")


def fetch_members(init, members, fxx_list, workers):
    RAW.mkdir(parents=True, exist_ok=True)
    tasks = [(m, f) for m in members for f in fxx_list]
    results = {m: {} for m in members}
    failed, t0 = [], time.time()
    with ProcessPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(fetch_gefs.fetch_one_step, str(init), m, f, LAT, LON): (m, f) for m, f in tasks}
        for i, fut in enumerate(as_completed(futs), 1):
            m, f = futs[fut]
            try:
                results[m][f] = fut.result()[2]
            except Exception as e:  # noqa: BLE001
                failed.append(f"{fetch_gefs.member_label(m)} f{f:03d}: {e}")
            if i % 50 == 0 or i == len(tasks):
                print(f"  {i}/{len(tasks)} fetched ({time.time() - t0:.0f}s)", flush=True)
    paths = {}
    for m in members:
        if len(results[m]) != len(fxx_list):
            print(f"  [{fetch_gefs.member_label(m)}] incomplete, skipped", file=sys.stderr)
            continue
        p = RAW / f"member_{fetch_gefs.member_label(m)}.nc"
        fetch_gefs.assemble_member(results[m], fxx_list).to_netcdf(p)
        paths[fetch_gefs.member_label(m)] = p
    return paths, failed


def lead_h(t, init):
    return float((pd.Timestamp(t) - init).total_seconds() / 3600.0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--init", help="e.g. 2026-09-30T00:00; default: latest complete 00/12 UTC run")
    ap.add_argument("--members", type=int, default=30, help="perturbed members (control is added)")
    ap.add_argument("--fxx-end", type=int, default=144)
    ap.add_argument("--fxx-step", type=int, default=6)
    ap.add_argument("--workers", type=int, default=12)
    ap.add_argument("--keep-raw", action="store_true")
    ap.add_argument("--clim", default=str(CLIM))
    ap.add_argument("--out-dir", default=str(OUT_DIR))
    a = ap.parse_args()
    out_dir = Path(a.out_dir)

    if not Path(a.clim).exists():
        sys.exit(f"{a.clim} missing -- run scripts/build_live_climatology.py (or the 'Build live climatology' workflow) first")
    t_start = time.time()
    stats = xr.open_dataset(a.clim).load()
    init = pd.Timestamp(a.init) if a.init else latest_init(a.fxx_end, a.members)
    fxx_list = list(range(0, a.fxx_end + 1, a.fxx_step))
    print(f"GEFS init {init:%Y-%m-%d %HZ}, {a.members + 1} members, T+0..{a.fxx_end} h")

    paths, failed = fetch_members(init, fetch_gefs.member_ids(a.members), fxx_list, a.workers)
    if not paths:
        sys.exit("no member downloaded completely")

    members, domain, per_step = [], [], []
    for label, p in sorted(paths.items()):
        ds = anomaly.compute_anomalies_from_stats(preprocess.load_case(p), stats)
        s = anomaly.summary(ds)
        s["member"] = label
        domain.append(s)
        tr = tracker.run(ds, **DEFAULTS)
        tracks = []
        if len(tr):
            for tid, g in tr.groupby("track_id"):
                if len(g) < MIN_TRACK_STEPS:
                    continue
                g = g.sort_values("time")
                tracks.append({"points": [{
                    "leadH": lead_h(r.time, init), "time": pd.Timestamp(r.time).isoformat() + "Z",
                    "lat": round(float(r.lat), 3), "lon": round(float(r.lon), 3),
                    "pminLat": round(float(r.pmin_lat), 3), "pminLon": round(float(r.pmin_lon), 3),
                    "maxWs": round(float(r.max_ws), 1), "minMsl": round(float(r.min_msl), 1),
                    "maxZ": round(float(r.max_z), 2), "areaKm2": round(float(r.area_km2)),
                } for r in g.itertuples()]})
                for r in g.itertuples():
                    per_step.append({"member": label, "leadH": lead_h(r.time, init), "maxWs": float(r.max_ws)})
        members.append({"id": label, "tracks": tracks})
        print(f"  [{label}] {len(tracks)} tracked system(s)")

    n = len(members)
    dom = pd.concat(domain, ignore_index=True)
    steps = pd.DataFrame(per_step, columns=["member", "leadH", "maxWs"])
    leads = []
    for t, g in dom.groupby("time"):
        lh = lead_h(t, init)
        here = steps[steps.leadH == lh]
        strongest = here.groupby("member").maxWs.max() if len(here) else pd.Series(dtype=float)
        leads.append({
            "leadH": lh, "time": pd.Timestamp(t).isoformat() + "Z",
            "membersWithSystem": int(strongest.size),
            "severeFraction": round(float((strongest >= SEVERE_WS).sum()) / n, 3),
            "domainMaxWsMedian": round(float(g.max_ws.median()), 1),
            "domainMaxWsMax": round(float(g.max_ws.max()), 1),
            "domainMinMslMin": round(float(g.min_msl.min()), 1),
        })
    leads.sort(key=lambda r: r["leadH"])

    with_sys = [m for m in members if m["tracks"]]
    peak = max(leads, key=lambda r: (r["severeFraction"], r["membersWithSystem"]))
    all_pts = [(m["id"], p) for m in members for tr in m["tracks"] for p in tr["points"]]
    top = max(all_pts, key=lambda x: x[1]["maxWs"]) if all_pts else None
    first = next((r["leadH"] for r in leads if r["membersWithSystem"] > 0), None)

    summary = {
        "membersWithSystem": len(with_sys),
        "peakSevere": {"fraction": peak["severeFraction"], "leadH": peak["leadH"]} if peak["severeFraction"] > 0 else None,
        "strongest": None if top is None else {"member": top[0], **{k: top[1][k] for k in ("leadH", "time", "maxWs", "minMsl", "pminLat", "pminLon")}},
        "firstDetectionLeadH": first,
    }
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "init": init.isoformat() + "Z", "model": "NOAA GEFS v12, 0.25 deg (AWS Open Data)",
        "nMembers": n, "fxxEnd": a.fxx_end, "fxxStep": a.fxx_step,
        "region": {"lat": list(LAT), "lon": list(LON)},
        "climatology": stats.attrs.get("source", ""),
        "detection": "z(wind) >= 2 and z(MSLP) <= -2 and wind >= 17 m/s, >= 6 cells; tracks of >= 2 steps",
        "runSeconds": round(time.time() - t_start),
        "failedFetches": len(failed),
        "summary": summary, "leads": leads, "members": members,
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "gefs_latest.json").write_text(json.dumps(out, separators=(",", ":")))
    hist_path = out_dir / "gefs_history.json"
    hist = json.loads(hist_path.read_text()) if hist_path.exists() else []
    hist = [h for h in hist if h["init"] != out["init"]] + [{
        "init": out["init"], "nMembers": n, "membersWithSystem": len(with_sys),
        "peakSevereFraction": peak["severeFraction"],
        "maxWs": None if top is None else top[1]["maxWs"],
    }]
    hist_path.write_text(json.dumps(sorted(hist, key=lambda h: h["init"])[-HISTORY_LEN:], indent=1))

    if not a.keep_raw:
        shutil.rmtree(RAW, ignore_errors=True)
    print(json.dumps(summary, indent=2))
    print(f"wrote {out_dir / 'gefs_latest.json'} in {out['runSeconds']} s ({len(failed)} failed fetches)")


if __name__ == "__main__":
    main()
