"""Add more held-out cyclones: fetch ERA5 for each, then run the unchanged pipeline.

Each storm gets exactly the treatment Yaas got: its own ERA5 case slice (same region
and variables as step1_get_data.py) and its own same-season climatology (2015-2019,
all four UTC hours, the case dates +/- 7 days in every year), then
build_processed.build_case -- same detector, tracker, validation and alert tiers,
parameters frozen on Amphan. Nothing is tuned per storm.

The only per-storm choice is the alert sample time, fixed by rule rather than by
eye: the last best-track time over sea before first landfall (IBTrACS DIST2LAND),
rounded to the ERA5 6 h step.

    python scripts/build_extra_cases.py              # all storms in STORMS
    python scripts/build_extra_cases.py fani titli   # some of them

Needs gcsfs + zarr + dask (see requirements-live.txt) and
data/raw/ibtracs.NI.list.v04r01.csv.
"""
import json
import subprocess
import sys
from pathlib import Path

import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

import build_processed as bp  # noqa: E402
import step1_get_data as s1  # noqa: E402
from pipeline import preprocess  # noqa: E402

RAW, PROC = bp.RAW, bp.PROC
IBTRACS = RAW / "ibtracs.NI.list.v04r01.csv"
CLIM_YEARS = range(2015, 2020)  # same years as the case studies' climatology
CLIM_PAD_DAYS = 7
TIMEOUT_S = 900
RETRIES = 4

# key: (IBTrACS NAME, season, dashboard label)
STORMS = {
    "phailin": ("PHAILIN", 2013, "Phailin, Oct 2013"),
    "hudhud": ("HUDHUD", 2014, "Hudhud, Oct 2014"),
    "titli": ("TITLI", 2018, "Titli, Oct 2018"),
    "fani": ("FANI", 2019, "Fani, May 2019"),
    "bulbul": ("BULBUL:MATMO", 2019, "Bulbul, Nov 2019"),
    "nivar": ("NIVAR", 2020, "Nivar, Nov 2020"),
}


def best_track(name, season):
    df = pd.read_csv(IBTRACS, skiprows=[1], low_memory=False, keep_default_na=False)
    df = df[(df.NAME.str.strip() == name) & (pd.to_numeric(df.SEASON, errors="coerce") == season)].copy()
    df["time"] = pd.to_datetime(df.ISO_TIME)
    for c in ("LAT", "LON", "DIST2LAND"):
        df[c] = pd.to_numeric(df[c], errors="coerce")
    # Only the part inside the analysis region counts (Fani formed near the equator,
    # Bulbul came in from the Pacific).
    inside = df.LAT.between(*s1.LAT) & df.LON.between(*s1.LON)
    return df[inside].sort_values("time")


def case_window(bt):
    start = bt.time.min().floor("D") - pd.Timedelta(days=1)
    end = bt.time.max().ceil("D") + pd.Timedelta(days=1)
    return start, end


def sample_time(bt):
    """Last best-track time over sea before first landfall; else time of lowest pressure."""
    land = bt[bt.DIST2LAND <= 0]
    if len(land):
        before = bt[(bt.time < land.time.iloc[0]) & (bt.DIST2LAND > 0)]
        if len(before):
            return before.time.iloc[-1].floor("6h")
    pres = pd.to_numeric(bt.WMO_PRES, errors="coerce")
    return bt.time.iloc[int(pres.fillna(pres.max()).argmin())].floor("6h")


def fetch_child(key, what):
    """Child process: one ERA5 download (case slice or climatology) -> netCDF."""
    import dask
    dask.config.set(scheduler="threads", num_workers=32)
    name, season, _ = STORMS[key]
    start, end = case_window(best_track(name, season))
    ds = xr.open_zarr(s1.ERA5, storage_options={"token": "anon"})
    if what == "case":
        out = s1.cut(ds, s1.CASE_VARS).sel(time=slice(start, end))
        path = RAW / f"{key}_case.nc"
    else:
        c = s1.cut(ds, s1.CLIM_VARS)
        lo, hi = start - pd.Timedelta(days=CLIM_PAD_DAYS), end + pd.Timedelta(days=CLIM_PAD_DAYS)
        parts = [c.sel(time=slice(f"{y}-{lo:%m-%d}", f"{y}-{hi:%m-%d} 18:00")) for y in CLIM_YEARS]
        out = xr.concat(parts, dim="time")
        path = RAW / f"{key}_clim.nc"
    tmp = path.with_suffix(".tmp")
    out.load().to_netcdf(tmp)
    tmp.replace(path)
    print(f"    saved {path.name}: {out.sizes['time']} steps", flush=True)


def fetch(key, what):
    path = RAW / f"{key}_{what}.nc"
    if path.exists():
        return path
    for attempt in range(1, RETRIES + 1):
        try:
            subprocess.run([sys.executable, __file__, "--fetch", key, what], check=True, timeout=TIMEOUT_S)
            return path
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
            print(f"    {key} {what}: attempt {attempt} failed ({type(e).__name__}), retrying", flush=True)
    sys.exit(f"{key} {what}: failed after {RETRIES} attempts")


def main():
    if sys.argv[1:2] == ["--fetch"]:
        fetch_child(sys.argv[2], sys.argv[3])
        return
    keys = sys.argv[1:] or list(STORMS)
    results = {}
    for key in keys:
        name, season, label = STORMS[key]
        bt = best_track(name, season)
        start, end = case_window(bt)
        print(f"\n### {label}: ERA5 {start:%Y-%m-%d} -> {end:%Y-%m-%d}, alert sample {sample_time(bt)}", flush=True)
        case_path, clim_path = fetch(key, "case"), fetch(key, "clim")
        cfg = {"file": case_path.name, "storm": name, "season": season, "label": label,
               "role": "held out (parameters frozen, nothing adjusted)",
               "sample_time": str(sample_time(bt))}
        bp.CASES[key] = cfg
        results[key] = bp.build_case(key, cfg, preprocess.load_clim(clim_path))

    registry = json.loads((PROC / "cases.json").read_text()) if (PROC / "cases.json").exists() else {}
    for key in keys:
        registry[key] = {k: bp.CASES[key][k] for k in ("label", "role")}
    (PROC / "cases.json").write_text(json.dumps(registry, indent=2))
    print("\nSummary (pmin median error km, matched steps):")
    for key, val in results.items():
        print(f"  {key:8s} {val['pmin'].get('median_km')} km over {val['pmin'].get('n')} steps")


if __name__ == "__main__":
    main()
