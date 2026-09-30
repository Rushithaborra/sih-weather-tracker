"""Fetch a GEFS ensemble forecast run and save it in the same raw variable schema
ERA5 case files use (10m_u_component_of_wind, 10m_v_component_of_wind,
mean_sea_level_pressure, latitude/longitude, time), one NetCDF per member, so
pipeline/preprocess.py and everything downstream (anomaly, tracker, validate)
run completely unchanged on forecast data instead of reanalysis.

Only usable for dates >= 2020-09-23 (GEFSv12, 31 members, native 0.25 deg via the
pgrb2sp25 product) -- the same grid as the ERA5 climatology, so no regridding.
Earlier GEFS (e.g. Amphan 2020-05) is 21 members at 1 degree and needs a regrid
step this script does not do.

(member, lead time) pairs are fetched concurrently (network/GRIB-decode bound,
so threads help a lot) -- 31 members x 25 lead times sequentially is ~3h, this
gets it down to well under an hour with --workers 12-16.

Usage:
    python scripts/fetch_gefs.py --init 2021-05-21T00:00 --case yaas_gefs \
        --fxx-end 144 --fxx-step 6 --lat 5 30 --lon 75 100 --workers 12

Resumable: existing per-member files are skipped unless --overwrite is passed.
"""
import argparse
import sys
import time
import warnings
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import numpy as np
import xarray as xr

warnings.filterwarnings("ignore")

RAW = Path(__file__).parent.parent / "data" / "raw"


def member_ids(n_perturbed=30):
    """GEFSv12: control (0) + n_perturbed members."""
    return [0] + list(range(1, n_perturbed + 1))


def member_label(m):
    return "c00" if m == 0 else f"p{m:02d}"


def fetch_one_step(init, member, fxx, lat_range, lon_range, retries=3):
    """One member, one lead time -> a (lat, lon) slice with u10, v10, msl (Pa)."""
    from herbie import Herbie

    last_err = None
    for attempt in range(retries):
        try:
            H = Herbie(init, model="gefs", product="atmos.25", member=member, fxx=fxx,
                       save_dir=str(RAW / "gefs_cache"), verbose=False)
            dss = H.xarray(":(UGRD|VGRD):10 m above ground|:PRMSL:", remove_grib=True)
            if not isinstance(dss, list):
                dss = [dss]
            merged = xr.merge(dss, compat="override")
            merged = merged.sel(latitude=slice(max(lat_range), min(lat_range)),
                                 longitude=slice(min(lon_range), max(lon_range)))
            valid_time = merged.valid_time.values if "valid_time" in merged.coords else merged.time.values + merged.step.values
            out = merged[["u10", "v10", "prmsl"]].load()
            out = out.assign_coords(time=valid_time).drop_vars(["step", "number"], errors="ignore")
            return member, fxx, out
        except Exception as e:  # noqa: BLE001 - network/grib errors, just retry
            last_err = e
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"member={member} fxx={fxx}: {last_err}")


def assemble_member(steps_by_fxx, fxx_list):
    steps = [steps_by_fxx[f] for f in fxx_list if f in steps_by_fxx]
    ds = xr.concat(steps, dim="time").sortby("time")
    return xr.Dataset(
        coords={"time": ds.time, "latitude": ds.latitude, "longitude": ds.longitude},
        data_vars={
            "10m_u_component_of_wind": (("time", "latitude", "longitude"), ds.u10.values.astype("float32")),
            "10m_v_component_of_wind": (("time", "latitude", "longitude"), ds.v10.values.astype("float32")),
            "mean_sea_level_pressure": (("time", "latitude", "longitude"), ds.prmsl.values.astype("float32")),
        },
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--init", required=True, help="forecast init time, e.g. 2021-05-21T00:00")
    ap.add_argument("--case", required=True, help="output subfolder name under data/raw/")
    ap.add_argument("--fxx-end", type=int, default=144)
    ap.add_argument("--fxx-step", type=int, default=6)
    ap.add_argument("--lat", type=float, nargs=2, default=[5, 30])
    ap.add_argument("--lon", type=float, nargs=2, default=[75, 100])
    ap.add_argument("--members", type=int, default=30, help="number of perturbed members (control is added automatically)")
    ap.add_argument("--workers", type=int, default=12)
    ap.add_argument("--overwrite", action="store_true")
    args = ap.parse_args()

    out_dir = RAW / args.case
    out_dir.mkdir(parents=True, exist_ok=True)
    fxx_list = list(range(0, args.fxx_end + 1, args.fxx_step))
    all_members = member_ids(args.members)
    members = [m for m in all_members if args.overwrite or not (out_dir / f"member_{member_label(m)}.nc").exists()]
    skipped = len(all_members) - len(members)

    print(f"init={args.init} members={len(members)} (skipping {skipped} already done) "
          f"fxx={fxx_list[0]}..{fxx_list[-1]} step={args.fxx_step}h "
          f"-> {len(members) * len(fxx_list)} grib fetches, {args.workers} workers, output {out_dir}")

    tasks = [(m, f) for m in members for f in fxx_list]
    results = {m: {} for m in members}
    done, failed, t0 = 0, [], time.time()

    with ProcessPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(fetch_one_step, args.init, m, f, args.lat, args.lon): (m, f) for m, f in tasks}
        for fut in as_completed(futures):
            m, f = futures[fut]
            try:
                _, _, ds = fut.result()
                results[m][f] = ds
                done += 1
            except Exception as e:  # noqa: BLE001
                failed.append((m, f, str(e)))
                done += 1
            if done % 20 == 0 or done == len(tasks):
                elapsed = time.time() - t0
                print(f"  {done}/{len(tasks)} fetched ({elapsed:.0f}s, {elapsed / done:.1f}s/req avg)")

    for m in members:
        if len(results[m]) != len(fxx_list):
            print(f"[{member_label(m)}] incomplete ({len(results[m])}/{len(fxx_list)} steps) — not saved", file=sys.stderr)
            continue
        ds = assemble_member(results[m], fxx_list)
        out_path = out_dir / f"member_{member_label(m)}.nc"
        ds.to_netcdf(out_path)
        print(f"[{member_label(m)}] saved {out_path.name}")

    if failed:
        print(f"{len(failed)} step fetches failed, e.g.: {failed[:3]}", file=sys.stderr)
    print("done")


if __name__ == "__main__":
    main()
