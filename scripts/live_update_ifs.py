"""Live ECMWF IFS HRES run through the frozen detector: systems, wind alerts, IMD rain categories, T2m.

Fetches the latest complete IFS HRES forecast (ECMWF open data, `oper`, 0.25 deg; CC-BY-4.0)
for 0-35N, 60-100E: 10u/10v/msl/2t every 6 h to 240 h, plus total precipitation at the 03 UTC
steps needed for IMD rainfall days. Then:
  * anomalies for wind, MSLP and T2m per valid month and UTC hour against
    data/clim/era5_monthly_stats_wide.nc (ERA5 2015-2019) -- IFS is compared against an ERA5
    climatology, not its own reforecasts, so model bias enters and this is not an EFI;
  * detection + tracking with the frozen pipeline.tracker.DEFAULTS (nothing retuned);
  * wind alert tiers exactly as in the case studies (pipeline.alerts, inside tracked boxes + 1 deg);
  * 24 h rainfall per IMD day (03-03 UTC) in IMD categories, where the 03 UTC steps exist (3-hourly
    to 144 h);
  * T2m flagged only where |z| >= 2 ("unusual warm/cold"), no alert tiers.
Writes <out>/ifs_latest.json with status ok / no_system / stale / error. A failure still writes
an "error" file so the page can say so.

    python scripts/live_update_ifs.py --out live_out
"""
import argparse
import json
import os
import sys
import tempfile
import time
import traceback
import warnings
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from pipeline import alerts, anomaly, tracker  # noqa: E402

CLIM = ROOT / "data" / "clim" / "era5_monthly_stats_wide.nc"
LAT, LON = (0, 35), (60, 100)
STEPS = list(range(0, 241, 6))
STALE_H = 24
MIN_TRACK_STEPS = 2
FIELD_STRIDE = 2  # 0.25 -> 0.5 deg for the map fields
# IMD 24 h rainfall categories (mm) and wind categories (m/s, from IMD knots)
RAIN_CATS = [(0.1, "very light"), (2.5, "light"), (15.6, "moderate"), (64.5, "heavy"),
             (115.6, "very heavy"), (204.5, "extremely heavy")]
WIND_CATS = [(8.7, "D"), (14.4, "DD"), (17.5, "CS"), (24.7, "SCS"), (32.9, "VSCS"), (46.3, "ESCS"), (61.7, "SuCS")]


def wind_category(ws):
    cat = "below D"
    for v, c in WIND_CATS:
        if ws >= v:
            cat = c
    return cat


def rain_category_index(mm):
    """0 = none (< 0.1 mm), 1..6 = RAIN_CATS."""
    idx = np.zeros(mm.shape, "int8")
    for k, (v, _) in enumerate(RAIN_CATS, 1):
        idx[mm >= v] = k
    return idx


def imd_tp_steps(init):
    """03 UTC valid times reachable with the 3-hourly steps (<= 144 h)."""
    return [h for h in range(0, 145, 3) if (init + pd.Timedelta(hours=h)).hour == 3]


def fetch(init_override, tmp):
    from ecmwf.opendata import Client
    client = Client(source="ecmwf")
    init = pd.Timestamp(init_override) if init_override else \
        pd.Timestamp(client.latest(type="fc", stream="oper", step=240, param="msl"))
    grib_a, grib_b = Path(tmp) / "fields.grib2", Path(tmp) / "tp.grib2"
    client.retrieve(date=init.strftime("%Y%m%d"), time=init.hour, stream="oper", type="fc", step=STEPS,
                    param=["10u", "10v", "msl", "2t"], target=str(grib_a))
    tp_steps = sorted(set(imd_tp_steps(init)))
    client.retrieve(date=init.strftime("%Y%m%d"), time=init.hour, stream="oper", type="fc", step=tp_steps,
                    param=["tp"], target=str(grib_b))
    return init, grib_a, grib_b, tp_steps


def open_grib(path):
    import cfgrib
    parts = []
    for d in cfgrib.open_datasets(str(path), backend_kwargs={"indexpath": ""}):
        d = d.sel(latitude=slice(max(LAT), min(LAT)), longitude=slice(min(LON), max(LON)))
        parts.append(d.drop_vars([c for c in ("heightAboveGround", "surface", "meanSea", "number") if c in d.coords]))
    return xr.merge(parts, compat="override").load()


def build_case(raw, init):
    raw = raw.sortby("latitude")
    times = pd.DatetimeIndex(init + pd.to_timedelta(raw.step.values))
    dims = ("time", "lat", "lon")
    ds = xr.Dataset(coords={"time": times, "lat": raw.latitude.values, "lon": raw.longitude.values})
    ds["ws"] = (dims, np.hypot(raw.u10.values, raw.v10.values).astype("float32"))
    ds["msl"] = (dims, (raw.msl.values / 100.0).astype("float32"))
    ds["t2m"] = (dims, raw.t2m.values.astype("float32"))
    return ds


def run(a):
    t0 = time.time()
    stats = xr.open_dataset(CLIM).load()
    with tempfile.TemporaryDirectory() as tmp:
        init, grib_a, grib_b, tp_steps = fetch(a.init, tmp)
        raw = open_grib(grib_a)
        tp_raw = open_grib(grib_b).sortby("latitude")
    ds = anomaly.compute_anomalies_from_stats(build_case(raw, init), stats)
    tr = tracker.run(ds, **tracker.DEFAULTS)
    lead = lambda t: float((pd.Timestamp(t) - init).total_seconds() / 3600)  # noqa: E731

    systems = []
    if len(tr):
        for tid, g in tr.groupby("track_id"):
            if len(g) < MIN_TRACK_STEPS:
                continue
            g = g.sort_values("time")
            systems.append({
                "id": int(tid), "firstLeadH": lead(g.time.iloc[0]), "lastLeadH": lead(g.time.iloc[-1]),
                "minMslHpa": round(float(g.min_msl.min()), 1), "maxWsMs": round(float(g.max_ws.max()), 1),
                "imdCategory": wind_category(float(g.max_ws.max())),
                "points": [{"leadH": lead(r.time), "time": f"{pd.Timestamp(r.time):%Y-%m-%dT%H:%M}Z",
                            "lat": round(float(r.pmin_lat), 2), "lon": round(float(r.pmin_lon), 2),
                            "maxWs": round(float(r.max_ws), 1), "minMsl": round(float(r.min_msl), 1),
                            "box": [float(r.lat_min), float(r.lat_max), float(r.lon_min), float(r.lon_max)]}
                           for r in g.itertuples()],
            })

    # wind alert tiers per step (z-score AND IMD wind gate, inside tracked boxes + 1 deg)
    lat, lon = ds.lat.values, ds.lon.values
    wind_alerts = []
    for i, t in enumerate(ds.time.values):
        objs = tr[tr.t_index == i] if len(tr) else tr
        tg = alerts.tier_grid(np.zeros(ds.ws.shape[1:]), ds.z_ws.values[i], ds.ws.values[i],
                              mask=alerts.box_mask(objs, lat, lon))
        wind_alerts.append({"leadH": lead(t), "low": int((tg == 1).sum()), "moderate": int((tg == 2).sum()),
                            "severe": int((tg == 3).sum())})

    # rainfall per IMD day (24 h ending 03 UTC), from cumulative tp at consecutive 03 UTC steps
    tp = tp_raw.tp.values * 1000.0  # m -> mm, cumulative since the start of the run
    tp_steps_h = [int(pd.Timedelta(s).total_seconds() // 3600) for s in tp_raw.step.values]
    rain_days = []
    for k in range(1, len(tp_steps_h)):
        acc = np.clip(tp[k] - tp[k - 1], 0, None)
        cat = rain_category_index(acc)
        end = init + pd.Timedelta(hours=tp_steps_h[k])
        rain_days.append({
            "imdDayEnding": f"{end:%Y-%m-%dT03:00}Z", "leadHEnd": tp_steps_h[k], "maxMm": round(float(acc.max()), 1),
            "cells": {name: int((cat == j).sum()) for j, (_, name) in enumerate(RAIN_CATS, 1)},
            "categoryGrid": cat[::FIELD_STRIDE, ::FIELD_STRIDE].ravel().tolist(),
        })

    # T2m: flag only, |z| >= 2
    zt = ds.z_t2m.values
    t2m_flags = [{"leadH": lead(t), "unusualWarmCells": int((zt[i] >= 2).sum()), "unusualColdCells": int((zt[i] <= -2).sum())}
                 for i, t in enumerate(ds.time.values)]

    field_leads = [i for i, t in enumerate(ds.time.values) if lead(t) % 24 == 0]
    clim_anom = lambda i: ds.t2m.values[i] - stats.sel(month=pd.Timestamp(ds.time.values[i]).month,  # noqa: E731
                                                       hour=pd.Timestamp(ds.time.values[i]).hour,
                                                       lat=ds.lat, lon=ds.lon, method="nearest").mean_t2m.values
    fields = {
        "lat": [round(float(v), 2) for v in lat[::FIELD_STRIDE]], "lon": [round(float(v), 2) for v in lon[::FIELD_STRIDE]],
        "leadHours": [lead(ds.time.values[i]) for i in field_leads],
        "windZ": {str(int(lead(ds.time.values[i]))): np.round(ds.z_ws.values[i][::FIELD_STRIDE, ::FIELD_STRIDE], 1).ravel().tolist() for i in field_leads},
        "mslZ": {str(int(lead(ds.time.values[i]))): np.round(ds.z_msl.values[i][::FIELD_STRIDE, ::FIELD_STRIDE], 1).ravel().tolist() for i in field_leads},
        "t2mAnomK": {str(int(lead(ds.time.values[i]))): np.round(clim_anom(i)[::FIELD_STRIDE, ::FIELD_STRIDE], 1).ravel().tolist() for i in field_leads},
    }

    now = datetime.now(timezone.utc)
    age_h = (pd.Timestamp(now).tz_localize(None) - init).total_seconds() / 3600
    status = "stale" if age_h > STALE_H + 12 else ("ok" if systems else "no_system")
    return {
        "status": status, "model": "ECMWF IFS HRES (oper), 0.25 deg, ECMWF open data (CC-BY-4.0)",
        "init": f"{init:%Y-%m-%dT%H:%M}Z", "fetchedAt": now.isoformat(timespec="seconds").replace("+00:00", "Z"),
        "runSeconds": round(time.time() - t0), "region": {"lat": list(LAT), "lon": list(LON)},
        "stepsH": [lead(t) for t in ds.time.values],
        "climatology": stats.attrs.get("source", ""),
        "detection": "frozen pipeline.tracker.DEFAULTS: z(wind) >= 2 and z(MSLP) <= -2 and wind >= 17 m/s, >= 6 cells; tracks of >= 2 steps",
        "systems": systems, "windAlerts": wind_alerts, "rainDays": rain_days, "t2m": t2m_flags, "fields": fields,
        "caveats": [
            "Forecast, not validated live.",
            "IFS is compared against an ERA5 climatology (2015-2019), not the model's own reforecasts: "
            "model bias enters the anomalies, so this is not an EFI.",
            "Skill decreases with lead time.",
            "Rain categories only for IMD days whose 03 UTC ends fall on the 3-hourly steps (to 144 h).",
            "T2m flags (|z| >= 2) are sensitive over the tropical ocean, where the ERA5 2015-2019 spread is tiny "
            "(0.5 K floor): a 1-1.5 K offset from a warmer year or from IFS-vs-ERA5 differences flags large areas. "
            "Read them as 'warmer/cooler than the 2015-2019 baseline', not as heat or cold extremes.",
            "Not an official warning; official warnings: IMD (mausam.imd.gov.in).",
        ],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="live_out")
    ap.add_argument("--init", help="e.g. 2026-10-01T00:00; default: latest complete run")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    try:
        res = run(a)
    except Exception as e:  # noqa: BLE001 - write an honest error state for the page
        res = {"status": "error", "model": "ECMWF IFS HRES (oper)", "error": f"{type(e).__name__}: {e}",
               "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
               "trace": traceback.format_exc()[-2000:]}
    (out / "ifs_latest.json").write_text(json.dumps(res, separators=(",", ":")))
    print(f"status {res['status']} | init {res.get('init')} | systems {len(res.get('systems', []))} | "
          f"{(out / 'ifs_latest.json').stat().st_size / 1e6:.2f} MB" + (f" | {res.get('error')}" if res["status"] == "error" else ""))
    return 0 if res["status"] != "error" else 1


if __name__ == "__main__":
    code = main()
    # GRIB/netCDF C libraries can segfault during interpreter teardown after output is written.
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(code)
