"""GEFS forecast skill for the held-out cyclones: does the ensemble see the storm, and where?

For each storm, GEFS forecasts started 7, 5, 3 and 1 days before landfall (00 UTC) are run
through the frozen detector and tracker (pipeline.tracker.DEFAULTS), member by member, and
compared with IBTrACS.

Data (no model versions are mixed in one statistic):
  * GEFS v12 operational (noaa-gefs-pds, 0.25 deg, 31 members) for storms from 2020-09-23 on
    (Nivar, Yaas).
  * GEFSv12 reforecast (noaa-gefs-retrospective, 0.25 deg, 5 members; 11 on Wednesdays) for
    2000-2019 storms (Phailin, Hudhud, Titli, Fani, Bulbul).
  * Amphan (May 2020) only exists as 1 deg GEFS v11 -- a different model version -- so it is
    not evaluated.
Anomalies use data/clim/era5_monthly_stats.nc (ERA5 2010-2019, per month and UTC hour):
GEFS is compared against an ERA5 climatology, so model bias enters the z-scores; this is not
an EFI against the model's own climate.

Matching a member to the storm (never by distance over the whole forecast):
  * storm in IBTrACS and inside the region at the forecast's first step: the member's object nearest to the best
    track within 300 km at that step, then that object's whole track;
  * storm not yet in IBTrACS, or still outside the region (genesis / arrival): the first track, in time order, with an object within
    300 km of the best track, then that whole track.
  Members without a match are misses and every table reports matched / total members.
  The first step is lead 0 h (operational) or 6 h (the reforecast has no 0 h field).

Outputs (data/processed/gefs_skill/):
  <storm>_<init>.json   per start: members, matched tracks, error and detection by lead,
                        first time >= 50% of members detect the storm, strike-probability grid
  strike_<storm>_<init>.png   probability of passing within 120 km (map)
  summary.json          per storm and start, and pooled per data source (operational / reforecast)

    python scripts/gefs_forecast_skill.py                         # everything
    python scripts/gefs_forecast_skill.py --storms hudhud --offsets 1 --max-members 2   # quick test
Raw member files are cached in data/raw/gefs_skill/ (gitignored); reruns skip them. The full run
(~7,400 fields, ~19 GB) is done by .github/workflows/gefs-skill.yml, which commits only the outputs.
"""
import argparse
import json
import os
import sys
import time
import warnings
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

import fetch_gefs  # noqa: E402
from pipeline import anomaly, preprocess, tracker, validate  # noqa: E402

RAW = ROOT / "data" / "raw" / "gefs_skill"
OUT = ROOT / "data" / "processed" / "gefs_skill"
CLIM = ROOT / "data" / "clim" / "era5_monthly_stats.nc"
IBTRACS = ROOT / "data" / "raw" / "ibtracs.NI.list.v04r01.csv"
LAT, LON = (5, 30), (75, 100)
STORMS = {  # key: (IBTrACS name, season)
    "phailin": ("PHAILIN", 2013), "hudhud": ("HUDHUD", 2014), "titli": ("TITLI", 2018),
    "fani": ("FANI", 2019), "bulbul": ("BULBUL:MATMO", 2019),
    "nivar": ("NIVAR", 2020), "yaas": ("YAAS", 2021),
}
OFFSETS_DAYS = [7, 5, 3, 1]
V12_START = pd.Timestamp("2020-09-23")
MATCH_KM = 300.0
STRIKE_KM = 120.0
STEP_H = 6


# ---------------------------------------------------------------- best track / setup
def best_track(name, season):
    df = pd.read_csv(IBTRACS, skiprows=[1], low_memory=False, keep_default_na=False)
    df = df[(df.NAME.str.strip() == name) & (pd.to_numeric(df.SEASON, errors="coerce") == season)].copy()
    df["time"] = pd.to_datetime(df.ISO_TIME)
    for c in ("LAT", "LON", "DIST2LAND", "WMO_WIND", "USA_WIND"):
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df.rename(columns={"LAT": "lat", "LON": "lon"}).sort_values("time").reset_index(drop=True)


def landfall_time(bt):
    """First best-track point on land west of 92E (skips island crossings such as the Andamans)."""
    land = bt[(bt.DIST2LAND <= 0) & (bt.lon < 92) & bt.lat.between(*LAT)]
    return land.time.iloc[0]


def source_for(landfall):
    return "operational" if landfall >= V12_START else "reforecast"


def members_for(source, init):
    if source == "operational":
        return fetch_gefs.member_ids(30)
    return list(range(11 if init.weekday() == 2 else 5))  # reforecast: 11 members on Wednesdays


def leads_for(source, offset):
    first = 0 if source == "operational" else STEP_H
    return list(range(first, offset * 24 + 24 + 1, STEP_H))  # through landfall + 24 h


# ---------------------------------------------------------------- download
def fetch_reforecast_step(init, member, fxx, retries=3):
    from herbie import Herbie
    last = None
    for attempt in range(retries):
        try:
            parts = []
            # each reforecast file holds all 80 lead times, so the search must name the lead too
            for var, search, name in (("ugrd_hgt", f":UGRD:10 m above ground:{fxx} hour fcst:", "u10"),
                                      ("vgrd_hgt", f":VGRD:10 m above ground:{fxx} hour fcst:", "v10"),
                                      ("pres_msl", f":PRES:mean sea level:{fxx} hour fcst:", "prmsl")):
                H = Herbie(str(init), model="gefs_reforecast", member=member, fxx=fxx, variable_level=var,
                           save_dir=str(RAW / "cache"), verbose=False)
                # overwrite: never reuse a cached piece -- Herbie names them identically across searches
                ds = H.xarray(search, remove_grib=True, overwrite=True)
                ds = ds[0] if isinstance(ds, list) else ds
                da = ds[list(ds.data_vars)[0]].rename(name)
                parts.append(da.sel(latitude=slice(max(LAT), min(LAT)), longitude=slice(min(LON), max(LON))))
            out = xr.merge(parts, compat="override").load()
            valid = out.valid_time.values if "valid_time" in out.coords else out.time.values + out.step.values
            out = out.assign_coords(time=valid).drop_vars(["step", "number", "valid_time"], errors="ignore")
            return member, fxx, out
        except Exception as e:  # noqa: BLE001 - network/grib errors, retry
            last = e
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"reforecast member={member} fxx={fxx}: {last}")


def fetch_step(source, init, member, fxx):
    if source == "operational":
        return fetch_gefs.fetch_one_step(str(init), member, fxx, LAT, LON)
    return fetch_reforecast_step(init, member, fxx)


def fetch_start(source, init, members, leads, workers):
    """Download (or reuse) one NetCDF per member for one forecast start."""
    d = RAW / f"{init:%Y%m%d%H}"
    d.mkdir(parents=True, exist_ok=True)
    path = {m: d / f"member_{fetch_gefs.member_label(m)}.nc" for m in members}
    todo = [(m, f) for m in members if not path[m].exists() for f in leads]
    if todo:
        got = {m: {} for m in members}
        t0 = time.time()
        with ProcessPoolExecutor(max_workers=workers) as ex:
            futs = {ex.submit(fetch_step, source, init, m, f): (m, f) for m, f in todo}
            for i, fut in enumerate(as_completed(futs), 1):
                m, f = futs[fut]
                try:
                    got[m][f] = fut.result()[2]
                except Exception as e:  # noqa: BLE001
                    print(f"    {fetch_gefs.member_label(m)} f{f:03d} failed: {e}", flush=True)
                if i % 100 == 0 or i == len(todo):
                    print(f"    {i}/{len(todo)} fields ({time.time() - t0:.0f}s)", flush=True)
        for m in members:
            if not path[m].exists() and len(got[m]) == len(leads):
                fetch_gefs.assemble_member(got[m], leads).to_netcdf(path[m])
    return {fetch_gefs.member_label(m): path[m] for m in members if path[m].exists()}


# ---------------------------------------------------------------- matching and scoring
def bt_at(bt, times):
    ref = validate.best_track_at(bt, pd.DatetimeIndex(sorted(set(times)))).set_index("time")
    return ref


def storm_in_region_at(bt, t):
    """IBTrACS has the storm at time t (interpolated inside its record) and inside the analysis region."""
    if not (bt.time.min() <= t <= bt.time.max()):
        return False
    b = bt_at(bt, [t]).loc[t]
    return bool(LAT[0] <= b.lat <= LAT[1] and LON[0] <= b.lon <= LON[1])


def match_member(tracks, bt, first_time):
    """Return (track_id, mode) or (None, mode) following the documented rule."""
    if tracks.empty:
        return None, "no objects"
    ref = bt_at(bt, tracks.time)
    tr = tracks.assign(bt_lat=ref.loc[tracks.time].lat.values, bt_lon=ref.loc[tracks.time].lon.values)
    tr["dist"] = tracker.haversine_km(tr.pmin_lat, tr.pmin_lon, tr.bt_lat, tr.bt_lon)
    if storm_in_region_at(bt, first_time):
        c = tr[(tr.time == first_time) & (tr.dist <= MATCH_KM)]
        return (int(c.sort_values("dist").track_id.iloc[0]) if len(c) else None), "at start"
    c = tr[tr.dist <= MATCH_KM].sort_values(["time", "dist"])
    return (int(c.track_id.iloc[0]) if len(c) else None), "genesis"


def densify(points, step_h=1):
    """Hourly positions between 6-hourly track points, so the 120 km swath has no gaps."""
    p = pd.DataFrame(points).set_index("time")[["lat", "lon"]]
    if len(p) < 2:
        return p
    idx = pd.date_range(p.index.min(), p.index.max(), freq=f"{step_h}h")
    return p.reindex(p.index.union(idx)).interpolate(method="time").loc[idx]


def strike_grid(matched_tracks, n_members):
    lat = np.arange(LAT[0], LAT[1] + 0.01, 0.25)
    lon = np.arange(LON[0], LON[1] + 0.01, 0.25)
    LA, LO = np.meshgrid(lat, lon, indexing="ij")
    hits = np.zeros(LA.shape, int)
    for pts in matched_tracks:
        swath = np.zeros(LA.shape, bool)
        for _, r in densify(pts).iterrows():
            swath |= tracker.haversine_km(LA, LO, r.lat, r.lon) <= STRIKE_KM
        hits += swath
    return lat, lon, hits / n_members


def evaluate_start(key, bt, landfall, source, init, member_paths, n_members, stats, leads):
    first_time = init + pd.Timedelta(hours=leads[0])
    members, matched_tracks = [], []
    for label, p in sorted(member_paths.items()):
        ds = anomaly.compute_anomalies_from_stats(preprocess.load_case(p), stats)
        tr = tracker.run(ds, **tracker.DEFAULTS)
        tid, mode = match_member(tr, bt, first_time)
        rec = {"member": label, "matched": tid is not None, "mode": mode, "points": []}
        if tid is not None:
            t = tr[tr.track_id == tid].sort_values("time")
            ref = bt_at(bt, t.time)
            for r in t.itertuples():
                b = ref.loc[r.time]
                err = None if pd.isna(b.lat) else float(tracker.haversine_km(r.pmin_lat, r.pmin_lon, b.lat, b.lon))
                rec["points"].append({"leadH": (r.time - init).total_seconds() / 3600, "time": f"{r.time:%Y-%m-%dT%H:%M}Z",
                                      "lat": round(r.pmin_lat, 3), "lon": round(r.pmin_lon, 3),
                                      "maxWs": round(r.max_ws, 1), "minMsl": round(r.min_msl, 1),
                                      "errKm": None if err is None else round(err, 1)})
            matched_tracks.append([{"time": pd.Timestamp(q["time"][:-1]), "lat": q["lat"], "lon": q["lon"]} for q in rec["points"]])
        members.append(rec)

    by_lead = []
    for L in leads:
        errs = [q["errKm"] for m in members for q in m["points"] if q["leadH"] == L and q["errKm"] is not None]
        detected = sum(any(q["leadH"] == L and q["errKm"] is not None and q["errKm"] <= MATCH_KM for q in m["points"]) for m in members)
        by_lead.append({"leadH": L, "validTime": f"{init + pd.Timedelta(hours=L):%Y-%m-%dT%H:%M}Z",
                        "hoursToLandfall": (landfall - init).total_seconds() / 3600 - L,
                        "membersDetecting": detected, "nMembers": n_members,
                        "errN": len(errs), "errMedianKm": round(float(np.median(errs)), 1) if errs else None,
                        "errMeanKm": round(float(np.mean(errs)), 1) if errs else None})
    half = next((r for r in by_lead if r["membersDetecting"] >= n_members / 2), None)
    lat, lon, prob = strike_grid(matched_tracks, n_members)
    return {
        "storm": key, "source": source, "init": f"{init:%Y-%m-%dT%H}Z", "offsetDays": int(round((landfall - init).days)),
        "landfall": f"{landfall:%Y-%m-%dT%H:%M}Z", "nMembers": n_members, "nMembersDownloaded": len(member_paths),
        "matched": sum(m["matched"] for m in members),
        "matchMode": "at start" if storm_in_region_at(bt, first_time) else "genesis",
        "firstHalfDetect": None if half is None else {"validTime": half["validTime"], "hoursBeforeLandfall": half["hoursToLandfall"]},
        "byLead": by_lead, "members": members,
        "strike": {"lat0": LAT[0], "lon0": LON[0], "step": 0.25, "nLat": len(lat), "nLon": len(lon),
                   "pct": np.round(prob * 100).astype(int).ravel().tolist()},
    }


def strike_png(res, bt, path):
    import cartopy.crs as ccrs
    import cartopy.feature as cfeature
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    s = res["strike"]
    prob = np.array(s["pct"]).reshape(s["nLat"], s["nLon"])
    lat = s["lat0"] + s["step"] * np.arange(s["nLat"])
    lon = s["lon0"] + s["step"] * np.arange(s["nLon"])
    fig = plt.figure(figsize=(6.2, 6))
    ax = plt.axes(projection=ccrs.PlateCarree())
    ax.set_extent([LON[0], LON[1], LAT[0], LAT[1]])
    levels = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100.1]
    cf = ax.contourf(lon, lat, np.ma.masked_less(prob, 5), levels=levels, cmap="YlOrRd", transform=ccrs.PlateCarree())
    ax.add_feature(cfeature.COASTLINE, linewidth=0.7)
    ax.add_feature(cfeature.BORDERS, linewidth=0.4, linestyle=":")
    b = bt[bt.time.between(pd.Timestamp(res["init"][:-1]), pd.Timestamp(res["landfall"][:-1]) + pd.Timedelta(hours=24))]
    ax.plot(b.lon, b.lat, "k--", lw=1.4, transform=ccrs.PlateCarree(), label="IBTrACS")
    lf = bt[bt.time == pd.Timestamp(res["landfall"][:-1])]
    ax.plot(lf.lon, lf.lat, "k*", ms=11, transform=ccrs.PlateCarree(), label="landfall")
    gl = ax.gridlines(draw_labels=True, linewidth=0.3, alpha=0.5)
    gl.top_labels = gl.right_labels = False
    plt.colorbar(cf, ax=ax, shrink=0.75, label=f"% of members within {STRIKE_KM:.0f} km")
    ax.legend(loc="lower left", fontsize=8)
    ax.set_title(f"{res['storm'].title()}: GEFS {res['source']} start {res['init']} "
                 f"({res['offsetDays']} d before landfall)\n{res['matched']}/{res['nMembers']} members matched",
                 fontsize=9)
    fig.savefig(path, dpi=110, bbox_inches="tight")
    plt.close(fig)


# ---------------------------------------------------------------- pooling
def pooled(results):
    """Per data source (never mixed): matched members, error by lead-day bin, >=50% detection."""
    out = {}
    for src in ("operational", "reforecast"):
        rs = [r for r in results if r["source"] == src]
        if not rs:
            continue
        bins = {}
        for r in rs:
            for m in r["members"]:
                for q in m["points"]:
                    if q["errKm"] is not None and q["leadH"] >= 0:
                        bins.setdefault(int(q["leadH"] // 24), []).append(q["errKm"])
        out[src] = {
            "storms": sorted({r["storm"] for r in rs}), "starts": len(rs),
            "matched": sum(r["matched"] for r in rs), "members": sum(r["nMembers"] for r in rs),
            "errorByLeadDay": [{"leadDays": f"{d}-{d + 1}", "n": len(v), "medianKm": round(float(np.median(v)), 1),
                                "meanKm": round(float(np.mean(v)), 1)} for d, v in sorted(bins.items())],
            "halfDetectByOffset": {str(o): [f"{r['storm']}: {'none' if r['firstHalfDetect'] is None else str(round(r['firstHalfDetect']['hoursBeforeLandfall'])) + ' h before landfall'}"
                                            for r in rs if r["offsetDays"] == o] for o in OFFSETS_DAYS},
        }
    return out


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--storms", nargs="*", default=list(STORMS))
    ap.add_argument("--offsets", nargs="*", type=int, default=OFFSETS_DAYS)
    ap.add_argument("--max-members", type=int, help="testing only: first N members")
    ap.add_argument("--workers", type=int, default=16)
    ap.add_argument("--out", default=str(OUT))
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    stats = xr.open_dataset(CLIM).load()

    for key in a.storms:
        name, season = STORMS[key]
        bt = best_track(name, season)
        lf = landfall_time(bt)
        src = source_for(lf)
        for off in a.offsets:
            init = (lf - pd.Timedelta(days=off)).floor("D")
            members = members_for(src, init)[: a.max_members]
            leads = leads_for(src, off)
            print(f"\n## {key} ({src}) start {init:%Y-%m-%d %HZ} = {off} d before landfall {lf:%d %b %H:%MZ}: "
                  f"{len(members)} members x {len(leads)} leads", flush=True)
            paths = fetch_start(src, init, members, leads, a.workers)
            res = evaluate_start(key, bt, lf, src, init, paths, len(members), stats, leads)
            (out / f"{key}_{init:%Y%m%d%H}.json").write_text(json.dumps(res, separators=(",", ":")))
            strike_png(res, bt, out / f"strike_{key}_{init:%Y%m%d%H}.png")
            h = res["firstHalfDetect"]
            print(f"   matched {res['matched']}/{res['nMembers']} ({res['matchMode']}); >=50% detect: "
                  f"{'never' if h is None else str(round(h['hoursBeforeLandfall'])) + ' h before landfall'}", flush=True)

    results = [json.loads(p.read_text()) for p in sorted(out.glob("*_20*.json"))]
    summary = {
        "notes": ["GEFS compared against ERA5 climatology (2010-2019 month/hour stats): model bias enters the "
                  "z-scores; not an EFI.",
                  "Operational (31 members) and reforecast (5, or 11 on Wednesdays) are never pooled together.",
                  "Amphan excluded: only GEFS v11 (1 deg) exists for May 2020, a different model version.",
                  f"Match: object within {MATCH_KM:.0f} km of IBTrACS at the first step (or first track to come within "
                  f"{MATCH_KM:.0f} km for genesis), then that track; unmatched members are misses."],
        "starts": [{k: r[k] for k in ("storm", "source", "init", "offsetDays", "landfall", "nMembers", "matched",
                                       "matchMode", "firstHalfDetect")} for r in results],
        "pooled": pooled(results),
    }
    (out / "summary.json").write_text(json.dumps(summary, indent=1))
    print(f"\nwrote {out}")


if __name__ == "__main__":
    main()
    # GRIB/netCDF C libraries can segfault during interpreter teardown after all output is
    # written (seen on GitHub runners, exit 139); skip teardown.
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(0)
