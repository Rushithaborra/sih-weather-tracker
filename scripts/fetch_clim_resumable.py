"""Resumable version of `python step1_get_data.py --clim`, with optional hours/years.

Same source, variables, region and date window as step1_get_data.py (imported,
not copied). Each year is fetched in a child process with a timeout and retried,
because long gcsfs reads can hang silently on a flaky connection. Finished years
are cached in data/raw/clim_parts/ so a restart skips them.

Run from data/raw/:
    python ../../scripts/fetch_clim_resumable.py
        -> 00 UTC, CLIM_YEARS from step1_get_data.py, writes clim_sample.nc
    python ../../scripts/fetch_clim_resumable.py --hours 6,12,18 --years 2015-2019 --out clim_sample_061218.nc
    python ../../scripts/fetch_clim_resumable.py --case yaas
        -> a held-out case with CASE_VARS, all hours, written to CASES[name]["out"]
"""
import argparse
import subprocess
import sys
from pathlib import Path

import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import step1_get_data as s1  # noqa: E402

PARTS = Path("clim_parts")
TIMEOUT_S = 300
RETRIES = 5

# Extra case slices. Same region and variables (CASE_VARS) as step1_get_data.py.
CASES = {
    "yaas": {"time": ("2021-05-21", "2021-05-28"), "out": "yaas_case.nc"},
}


def part_path(y, hours):
    return PARTS / f"{y}_h{'-'.join(f'{h:02d}' for h in hours)}.nc"


def fetch_year(y, hours):
    ds = s1.cut(s1.open_era5(), s1.CLIM_VARS)
    part = ds.sel(time=slice(f"{y}-{s1.CLIM_WINDOW[0]}", f"{y}-{s1.CLIM_WINDOW[1]}"))
    part = part.sel(time=part.time.dt.hour.isin(hours))
    out = part_path(y, hours)
    tmp = out.with_suffix(".tmp")
    part.load().to_netcdf(tmp)
    tmp.rename(out)
    print(f"  {y}: {part.sizes['time']} steps", flush=True)


def fetch_case_child(name):
    c = CASES[name]
    ds = s1.cut(s1.open_era5(), s1.CASE_VARS).sel(time=slice(*c["time"]))
    tmp = Path(c["out"] + ".tmp")
    ds.load().to_netcdf(tmp)
    tmp.rename(c["out"])
    print(f"Saved {c['out']}: {ds.sizes['time']} steps", flush=True)


def fetch_case(name):
    for attempt in range(1, RETRIES + 1):
        try:
            subprocess.run([sys.executable, __file__, "--case-child", name], check=True, timeout=TIMEOUT_S)
            return
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
            print(f"  {name}: attempt {attempt} failed ({type(e).__name__}), retrying", flush=True)
    sys.exit(f"Case {name} failed after {RETRIES} attempts")


def parse():
    p = argparse.ArgumentParser()
    p.add_argument("--hours", default="0")
    p.add_argument("--years", default=f"{min(s1.CLIM_YEARS)}-{max(s1.CLIM_YEARS)}")
    p.add_argument("--out", default="clim_sample.nc")
    p.add_argument("--year", type=int, help="internal: fetch one year")
    p.add_argument("--case", choices=sorted(CASES))
    p.add_argument("--case-child", choices=sorted(CASES), help="internal")
    a = p.parse_args()
    hours = [int(h) for h in a.hours.split(",")]
    y0, y1 = (int(v) for v in a.years.split("-"))
    return a, hours, range(y0, y1 + 1)


def main():
    a, hours, years = parse()
    if a.case_child:
        fetch_case_child(a.case_child)
        return
    if a.case:
        fetch_case(a.case)
        return
    if a.year is not None:
        fetch_year(a.year, hours)
        return
    PARTS.mkdir(exist_ok=True)
    for y in years:
        if part_path(y, hours).exists():
            print(f"  {y}: cached", flush=True)
            continue
        for attempt in range(1, RETRIES + 1):
            try:
                subprocess.run([sys.executable, __file__, "--year", str(y), "--hours", a.hours],
                               check=True, timeout=TIMEOUT_S)
                break
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
                print(f"  {y}: attempt {attempt} failed ({type(e).__name__}), retrying", flush=True)
        else:
            sys.exit(f"Year {y} failed after {RETRIES} attempts")
    parts = [xr.open_dataset(part_path(y, hours)).load() for y in years]
    xr.concat(parts, dim="time").to_netcdf(a.out)
    print(f"Saved {a.out}")


if __name__ == "__main__":
    main()
