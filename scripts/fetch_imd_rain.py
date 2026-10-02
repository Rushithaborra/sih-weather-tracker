"""Download IMD 0.25 deg gridded daily rainfall year files (imdlib's source, imdpune.gov.in).

The server is slow and drops long transfers, so each year is fetched in its own thread with
retries; a shorter retry never replaces a longer partial file, and a file is renamed to
<year>.grd only when complete. Partial files stay usable: scripts/rainfall_vs_imd.imd_year reads
whole days from <year>.grd.tmp.

    python scripts/fetch_imd_rain.py 2010 2011 ... 2021
"""
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

URL = "https://imdpune.gov.in/cmpg/Griddata/rainfall.php"
DIR = Path(__file__).resolve().parents[1] / "data" / "raw" / "imd_rain" / "rain"
DAY_BYTES = 129 * 135 * 4
ATTEMPTS = 15


def full_size(year):
    leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
    return (366 if leap else 365) * DAY_BYTES


def fetch(year):
    done, part = DIR / f"{year}.grd", DIR / f"{year}.grd.tmp"
    want = full_size(year)
    for attempt in range(1, ATTEMPTS + 1):
        if done.exists():
            return year, "complete"
        have = part.stat().st_size if part.exists() else 0
        if have >= want:
            part.replace(done)
            return year, "complete"
        trial = DIR / f"{year}.try"
        try:
            with requests.post(URL, data={"rain": year}, stream=True, timeout=(30, 120)) as r:
                r.raise_for_status()
                with open(trial, "wb") as f:
                    for chunk in r.iter_content(1 << 16):
                        f.write(chunk)
        except Exception as e:  # noqa: BLE001 - dropped transfer; keep whatever arrived
            print(f"  {year} attempt {attempt}: {type(e).__name__}", flush=True)
        got = trial.stat().st_size if trial.exists() else 0
        if got > have:
            trial.replace(part)
        else:
            trial.unlink(missing_ok=True)
        print(f"  {year} attempt {attempt}: {max(got, have) / 1e6:.1f} of {want / 1e6:.1f} MB", flush=True)
        time.sleep(10)
    return year, f"partial ({max(have, 0) // DAY_BYTES} days)"


def main():
    DIR.mkdir(parents=True, exist_ok=True)
    years = [int(y) for y in sys.argv[1:]]
    with ThreadPoolExecutor(max_workers=len(years)) as ex:
        for year, status in ex.map(fetch, years):
            print(f"{year}: {status}", flush=True)


if __name__ == "__main__":
    main()
