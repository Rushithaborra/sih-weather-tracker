"""Stage 2 downscaler experiment: coarse ERA5 rain (1.5 deg) -> IMD gauge grid (0.25 deg).

Design, split and metrics were fixed in DEV_LOG.md (2026-10-02) before training. Models:
  bilinear, bicubic            no learning
  unet                         U-Net, masked MSE on log1p(rain)
  unet_conserve                same, then each 1.5 deg block rescaled to the input mean ("physics" constraint)
  diffusion                    conditional DDPM on the U-Net residual, 8-member ensemble (mean and members)
Train 2010-2017 (Phailin/Hudhud windows removed), validation 2018-2019 (epoch selection only),
test 2020-2021 plus the Phailin/Hudhud windows. Metrics on IMD land cells.

    python scripts/downscale_train.py
Output: models/downscaler_*.pt, data/processed/downscaler.json, data/processed/downscaler_maps/*.png,
dashboard-ui/src/data/downscaler.js
"""
import json
import math
import os
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "raw" / "downscale"
MODELS = ROOT / "models"
OUT_JSON = ROOT / "data" / "processed" / "downscaler.json"
OUT_JS = ROOT / "dashboard-ui" / "src" / "data" / "downscaler.js"
MAPS = ROOT / "data" / "processed" / "downscaler_maps"
TRAIN_YEARS, VAL_YEARS, TEST_YEARS = range(2010, 2018), (2018, 2019), (2020, 2021)
HELD = {"phailin": "2013-10-12", "hudhud": "2014-10-12"}  # landfall IMD dates; +/- 7 days held out
STORM_DAYS = {"amphan": ["2020-05-21", "2020-05-22"], "nivar": ["2020-11-26", "2020-11-27"],
              "yaas": ["2021-05-27", "2021-05-28"], "phailin": ["2013-10-13", "2013-10-14"],
              "hudhud": ["2014-10-13", "2014-10-14"], "titli": ["2018-10-11", "2018-10-12"],
              "fani": ["2019-05-04", "2019-05-05"], "bulbul": ["2019-11-10", "2019-11-11"]}
THRESH = {"heavy": 64.5, "veryHeavy": 115.6, "extremelyHeavy": 204.5}
PAD = (136, 136)  # IMD grid 129 x 135 padded to a multiple of 8
SEED = 0
DEV = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
torch.set_num_threads(os.cpu_count() or 4)
EPOCHS = int(os.environ.get("DS_EPOCHS", 20))
SAMPLE_STEPS = int(os.environ.get("DS_SAMPLE_STEPS", 20))
MEMBERS = 8


# ------------------------------------------------------------------ data
def load_years(years):
    parts = [xr.open_dataset(DATA / f"{y}.nc").load() for y in years if (DATA / f"{y}.nc").exists()]
    return xr.concat(parts, dim="time") if parts else None


def held_out_mask(times):
    t = pd.DatetimeIndex(times)
    m = np.zeros(len(t), bool)
    for d in HELD.values():
        m |= np.abs((t - pd.Timestamp(d)).days) <= 7
    return m


def tensors(ds, static):
    x = np.log1p(ds.x_coarse_mm.values)
    terr = np.broadcast_to((static.terrain_m.values / 1000.0)[None], x.shape)
    lsm = np.broadcast_to(static.land_sea_mask.values[None], x.shape)
    inp = np.stack([x, terr, lsm], 1).astype("float32")
    y = ds.y_imd_mm.values
    mask = ~np.isnan(y)
    tgt = np.log1p(np.nan_to_num(y, nan=0.0))[:, None].astype("float32")
    pad = lambda a: np.pad(a, ((0, 0), (0, 0), (0, PAD[0] - a.shape[2]), (0, PAD[1] - a.shape[3])))  # noqa: E731
    return torch.from_numpy(pad(inp)), torch.from_numpy(pad(tgt)), torch.from_numpy(pad(mask[:, None].astype("float32")))


# ------------------------------------------------------------------ models
class Block(nn.Module):
    def __init__(self, cin, cout, temb=0):
        super().__init__()
        self.c1, self.c2 = nn.Conv2d(cin, cout, 3, padding=1), nn.Conv2d(cout, cout, 3, padding=1)
        self.n1, self.n2 = nn.GroupNorm(8, cout), nn.GroupNorm(8, cout)
        self.t = nn.Linear(temb, cout) if temb else None
        self.skip = nn.Conv2d(cin, cout, 1) if cin != cout else nn.Identity()

    def forward(self, x, t=None):
        h = F.silu(self.n1(self.c1(x)))
        if self.t is not None:
            h = h + self.t(t)[:, :, None, None]
        return F.silu(self.n2(self.c2(h))) + self.skip(x)


class UNet(nn.Module):
    def __init__(self, cin, cout=1, ch=(32, 64, 128), temb=0):
        super().__init__()
        self.temb = temb
        self.d = nn.ModuleList()
        c = cin
        for k in ch:
            self.d.append(Block(c, k, temb)); c = k
        self.mid = Block(c, c, temb)
        self.u = nn.ModuleList()
        for k in reversed(ch):
            self.u.append(Block(c + k, k, temb)); c = k
        self.out = nn.Conv2d(c, cout, 1)

    def forward(self, x, t=None):
        if self.temb:
            half = self.temb // 2
            f = torch.exp(-math.log(10000) * torch.arange(half, device=x.device) / half)
            t = torch.cat([torch.sin(t[:, None] * f), torch.cos(t[:, None] * f)], 1)
        skips = []
        for i, b in enumerate(self.d):
            x = b(x, t); skips.append(x)
            if i < len(self.d) - 1:
                x = F.avg_pool2d(x, 2)
        x = self.mid(x, t)
        for i, b in enumerate(self.u):
            s = skips.pop()
            if x.shape[-1] != s.shape[-1]:
                x = F.interpolate(x, size=s.shape[-2:], mode="nearest")
            x = b(torch.cat([x, s], 1), t)
        return self.out(x)


def masked_mse(a, b, m):
    return ((a - b) ** 2 * m).sum() / m.sum().clamp(min=1)


def train(model, fit, val, epochs, lr, loss_fn, tag):
    torch.manual_seed(SEED)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    best, best_state = float("inf"), None
    n = fit[0].shape[0]
    for ep in range(epochs):
        model.train()
        perm = torch.randperm(n)
        for i in range(0, n, 16):
            idx = perm[i:i + 16]
            loss = loss_fn(model, *(t[idx].to(DEV) for t in fit))
            opt.zero_grad(); loss.backward(); opt.step()
        model.eval()
        with torch.no_grad():
            vl = sum(float(loss_fn(model, *(t[i:i + 32].to(DEV) for t in val))) for i in range(0, val[0].shape[0], 32))
        if vl < best:
            best, best_state = vl, {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
        print(f"  [{tag}] epoch {ep + 1}/{epochs} val {vl:.4f}{' *' if vl == best else ''}", flush=True)
    model.load_state_dict(best_state)
    return model


# ------------------------------------------------------------------ diffusion (residual DDPM)
T_STEPS = 200
BETAS = torch.linspace(1e-4, 0.02, T_STEPS)
ALPHA_BAR = torch.cumprod(1 - BETAS, 0)


def diff_loss(model, cond, res, m):
    t = torch.randint(0, T_STEPS, (res.shape[0],), device=res.device)
    ab = ALPHA_BAR.to(res.device)[t][:, None, None, None]
    noise = torch.randn_like(res)
    noisy = ab.sqrt() * res + (1 - ab).sqrt() * noise
    return masked_mse(model(torch.cat([cond, noisy], 1), t.float()), noise, m)


@torch.no_grad()
def diff_sample(model, cond, steps=SAMPLE_STEPS, seed=0):
    g = torch.Generator(device="cpu").manual_seed(seed)
    x = torch.randn((cond.shape[0], 1) + cond.shape[2:], generator=g).to(cond.device)
    ts = torch.linspace(T_STEPS - 1, 0, steps).long()
    ab_all = ALPHA_BAR.to(cond.device)
    for i, t in enumerate(ts):  # deterministic DDIM
        ab = ab_all[t]
        eps = model(torch.cat([cond, x], 1), torch.full((x.shape[0],), float(t), device=cond.device))
        x0 = (x - (1 - ab).sqrt() * eps) / ab.sqrt()
        ab_next = ab_all[ts[i + 1]] if i + 1 < len(ts) else torch.tensor(1.0, device=cond.device)
        x = ab_next.sqrt() * x0 + (1 - ab_next).sqrt() * eps
    return x


# ------------------------------------------------------------------ evaluation
def conserve(pred_mm, x_mm, block=6):
    """Rescale each 1.5 deg block (6 x 6 fine cells) so its mean equals the input's mean."""
    out = pred_mm.copy()
    H, W = pred_mm.shape[-2:]
    for i in range(0, H, block):
        for j in range(0, W, block):
            p = pred_mm[..., i:i + block, j:j + block]
            target = x_mm[..., i:i + block, j:j + block].mean(axis=(-2, -1), keepdims=True)
            pm = p.mean(axis=(-2, -1), keepdims=True)
            out[..., i:i + block, j:j + block] = np.where(pm > 0.01, p * target / np.maximum(pm, 1e-6), p)
    return out


def metrics(pred, truth):
    m = ~np.isnan(truth)
    p, t = pred[m], truth[m]
    out = {"cells": int(m.sum()), "rmseMm": round(float(np.sqrt(((p - t) ** 2).mean())), 2),
           "r": round(float(np.corrcoef(p, t)[0, 1]), 3), "biasMm": round(float((p - t).mean()), 2),
           "cellsGe204": {"model": int((p >= 204.5).sum()), "imd": int((t >= 204.5).sum())}}
    for k, v in THRESH.items():
        hit, miss, fa = int(((p >= v) & (t >= v)).sum()), int(((p < v) & (t >= v)).sum()), int(((p >= v) & (t < v)).sum())
        out[k] = {"pod": round(hit / (hit + miss), 3) if hit + miss else None,
                  "far": round(fa / (hit + fa), 3) if hit + fa else None,
                  "csi": round(hit / (hit + miss + fa), 3) if hit + miss + fa else None, "events": hit + miss}
    return out


def bicubic(x):
    t = torch.from_numpy(x[:, None])
    return F.interpolate(F.interpolate(t, scale_factor=1 / 6, mode="area"), size=x.shape[-2:], mode="bicubic",
                         align_corners=False)[:, 0].clamp(min=0).numpy()


def storm_maps(storms, preds, members, truth, tt, lat, lon):
    """One PNG per storm landfall day: IMD | bilinear | U-Net | U-Net + conservation | diffusion member | ensemble mean."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.colors import BoundaryNorm, ListedColormap
    MAPS.mkdir(parents=True, exist_ok=True)
    levels = [0.1, 2.5, 15.6, 64.5, 115.6, 204.5, 400]
    cmap = ListedColormap(["#d6eaf8", "#85c1e9", "#2e86c1", "#e67e22", "#c0392b", "#7b1fa2"])
    norm = BoundaryNorm(levels, cmap.N)
    try:
        import cartopy.crs as ccrs
        import cartopy.feature as cfeature
        proj = dict(projection=ccrs.PlateCarree())
    except ImportError:
        ccrs = None
        proj = {}
    files, seen = [], set()
    rv = json.loads((ROOT / "data" / "processed" / "rainfall_vs_imd.json").read_text())
    foot = {r["storm"]: r["footprint"] for r in rv["rows"] if "footprint" in r}
    for r in storms:
        if r["storm"] in seen:
            continue
        seen.add(r["storm"])
        i = int(np.where(tt == pd.Timestamp(r["imdDay"]))[0][0])
        la0, la1, lo0, lo1 = foot[r["storm"]]
        land = ~np.isnan(truth[i])
        panels = [("IMD gauges (truth)", truth[i]), ("Bilinear (no learning)", preds["bilinear"][i]), ("U-Net (MSE)", preds["unet"][i]),
                  ("U-Net + conservation", preds["unet_conserve"][i])]
        if "diffusion_member" in preds:
            panels += [("Diffusion, 1 member", preds["diffusion_member"][i]), (f"Diffusion, {MEMBERS}-member mean", preds["diffusion_mean"][i])]
        else:
            panels += [("Bicubic (no learning)", preds["bicubic"][i]), ("ERA5 coarse input (1.5°)", preds["bilinear"][i])]
        fig, axes = plt.subplots(2, 3, figsize=(12, 8.2), subplot_kw=proj)
        for ax, (title, f) in zip(axes.ravel(), panels):
            f = np.where(land, f, np.nan)
            kw = dict(transform=ccrs.PlateCarree()) if ccrs else {}
            im = ax.pcolormesh(lon, lat, np.ma.masked_less(f, 0.1), cmap=cmap, norm=norm, shading="auto", **kw)
            if ccrs:
                ax.set_extent([lo0 - 1, lo1 + 1, la0 - 1, la1 + 1])
                ax.add_feature(cfeature.COASTLINE, linewidth=0.6)
                ax.add_feature(cfeature.BORDERS, linewidth=0.4, linestyle=":")
            else:
                ax.set_xlim(lo0 - 1, lo1 + 1); ax.set_ylim(la0 - 1, la1 + 1)
            box = (lat[:, None] >= la0) & (lat[:, None] <= la1) & (lon[None] >= lo0) & (lon[None] <= lo1) & land
            ax.set_title(f"{title}\nmax {np.nanmax(np.where(box, f, np.nan)):.0f} mm", fontsize=9)
        fig.colorbar(im, ax=axes, shrink=0.7, label="24 h rain (mm), IMD categories", ticks=levels[:-1])
        fig.suptitle(f"{r['storm'].title()} — IMD day ending {r['imdDay']} 03 UTC (test data; IMD land cells only)", fontsize=11)
        name = f"{r['storm']}_{r['imdDay']}.png"
        fig.savefig(MAPS / name, dpi=100, bbox_inches="tight")
        plt.close(fig)
        files.append(name)
    return files


def main():
    t0 = time.time()
    static = xr.open_dataset(DATA / "static.nc").load()
    tr = load_years(TRAIN_YEARS)
    va = load_years(VAL_YEARS)
    te = load_years(TEST_YEARS)
    keep = ~held_out_mask(tr.time.values)
    held = tr.isel(time=~keep)
    tr = tr.isel(time=keep)
    test = xr.concat([te, held], dim="time")
    print(f"train {tr.sizes['time']} days ({sorted(set(pd.DatetimeIndex(tr.time.values).year))}), val {va.sizes['time']}, "
          f"test {test.sizes['time']} (incl. {held.sizes['time']} Phailin/Hudhud window days) on {DEV}", flush=True)
    fit, val, tst = tensors(tr, static), tensors(va, static), tensors(test, static)
    H, W = 129, 135

    # U-Net (MSE on log1p)
    unet = UNet(3).to(DEV)
    unet = train(unet, fit, val, EPOCHS, 2e-3, lambda m, x, y, k: masked_mse(m(x), y, k), "unet")

    def unet_pred(inp):
        unet.eval()
        with torch.no_grad():
            return torch.cat([unet(inp[i:i + 32].to(DEV)).cpu() for i in range(0, inp.shape[0], 32)])

    # Deterministic models first -- saved before the slow diffusion step, so they survive a time-out
    x_mm = test.x_coarse_mm.values
    truth = test.y_imd_mm.values
    base = unet_pred(tst[0])
    preds = {"bilinear": x_mm, "bicubic": bicubic(x_mm),
             "unet": np.expm1(base[:, 0, :H, :W].numpy()).clip(0)}
    preds["unet_conserve"] = conserve(preds["unet"], x_mm)
    tt = pd.DatetimeIndex(test.time.values)
    lat, lon = test.lat.values, test.lon.values
    MODELS.mkdir(exist_ok=True)
    torch.save(unet.state_dict(), MODELS / "downscaler_unet.pt")
    meta = {"design": "DEV_LOG 2026-10-02: ERA5 1.5 deg daily rain -> IMD 0.25 deg gauge rain; train 2010-2017, val 2018-2019, "
                      "test 2020-2021 + Phailin/Hudhud windows", "device": str(DEV), "trainDays": int(tr.sizes["time"]),
            "valDays": int(va.sizes["time"]), "testDays": int(test.sizes["time"]),
            "trainYears": sorted(set(int(y) for y in pd.DatetimeIndex(tr.time.values).year)),
            "settings": {"epochs": EPOCHS, "ddimSteps": SAMPLE_STEPS, "members": MEMBERS}}
    storm_idx = storm_indices(tt, truth, lat, lon)
    write_results(meta, preds, None, None, truth, tt, lat, lon, storm_idx, t0, "diffusion pending")

    budget = float(os.environ.get("DS_TIME_BUDGET_MIN", 300))
    if (time.time() - t0) / 60 > budget * 0.5:
        write_results(meta, preds, None, None, truth, tt, lat, lon, storm_idx, t0, "diffusion skipped: time budget")
        return

    # Diffusion on the residual log1p(y) - unet, sampled on the storm days + a fixed random sample of test days
    fit_res = fit[1] - unet_pred(fit[0]); val_res = val[1] - unet_pred(val[0])
    cond = lambda inp: torch.cat([inp, unet_pred(inp)], 1)  # noqa: E731
    diff = UNet(5, temb=64).to(DEV)
    diff = train(diff, (cond(fit[0]), fit_res, fit[2]), (cond(val[0]), val_res, val[2]), EPOCHS, 1e-3,
                 lambda m, c, r, k: diff_loss(m, c, r, k), "diffusion")
    torch.save(diff.state_dict(), MODELS / "downscaler_diffusion.pt")
    rng = np.random.default_rng(SEED)
    others = [i for i in range(len(tt)) if i not in set(storm_idx.values())]
    sub = sorted(set(storm_idx.values()) | set(rng.choice(others, size=min(SUBSET_DAYS, len(others)), replace=False).tolist()))
    c = cond(tst[0][sub]).to(DEV)
    members = []
    diff.eval()
    for s_ in range(MEMBERS):
        res = torch.cat([diff_sample(diff, c[i:i + 16], seed=s_).cpu() for i in range(0, c.shape[0], 16)])
        members.append(np.expm1((base[sub] + res)[:, 0, :H, :W].numpy()).clip(0))
        print(f"  [diffusion] member {s_ + 1}/{MEMBERS} sampled ({(time.time() - t0) / 60:.0f} min)", flush=True)
    write_results(meta, preds, np.stack(members), sub, truth, tt, lat, lon, storm_idx, t0, "complete")


SUBSET_DAYS = int(os.environ.get("DS_SUBSET_DAYS", 100))


def storm_indices(tt, truth, lat, lon):
    """Test-set index of each held-out storm day with IMD heavy rain (>= 64.5 mm) in its footprint."""
    rv = json.loads((ROOT / "data" / "processed" / "rainfall_vs_imd.json").read_text())
    foot = {r["storm"]: r["footprint"] for r in rv["rows"] if "footprint" in r}
    out = {}
    for s, days in STORM_DAYS.items():
        for d in days:
            if pd.Timestamp(d) not in tt:
                continue
            i = int(np.where(tt == pd.Timestamp(d))[0][0])
            la0, la1, lo0, lo1 = foot[s]
            box = (lat[:, None] >= la0) & (lat[:, None] <= la1) & (lon[None] >= lo0) & (lon[None] <= lo1) & ~np.isnan(truth[i])
            if box.any() and float(truth[i][box].max()) >= 64.5:
                out[(s, d)] = i
    return out


def write_results(meta, preds, members, sub, truth, tt, lat, lon, storm_idx, t0, status):
    """Full-test-set metrics for the deterministic models; when diffusion members exist (sampled on the
    subset `sub`), every model is also scored on that same subset so the comparison is like for like."""
    rv = json.loads((ROOT / "data" / "processed" / "rainfall_vs_imd.json").read_text())
    foot = {r["storm"]: r["footprint"] for r in rv["rows"] if "footprint" in r}
    era5_native = {(r["storm"], r["imdDay"]): r.get("era5MaxMm") for r in rv["rows"]}
    allp = dict(preds)
    results = {k: metrics(v, truth) for k, v in preds.items()}
    subset = None
    if members is not None:
        pos = {i: j for j, i in enumerate(sub)}
        dm, d1 = members.mean(0), members[0]
        subset = {"days": len(sub), "note": "all models scored on the same days: the storm days plus a fixed random sample of test days"}
        subset.update({k: metrics(v[sub], truth[sub]) for k, v in preds.items()})
        subset["diffusion_mean"] = metrics(dm, truth[sub])
        subset["diffusion_member"] = metrics(d1, truth[sub])
    storms = []
    for (s, d), i in storm_idx.items():
        la0, la1, lo0, lo1 = foot[s]
        box = (lat[:, None] >= la0) & (lat[:, None] <= la1) & (lon[None] >= lo0) & (lon[None] <= lo1) & ~np.isnan(truth[i])
        row = {"storm": s, "imdDay": d, "imdMaxMm": round(float(truth[i][box].max()), 1), "era5NativeMaxMm": era5_native.get((s, d))}
        for k, v in preds.items():
            row[k] = round(float(v[i][box].max()), 1)
        if members is not None:
            j = pos[i]
            row["diffusion_mean"] = round(float(members.mean(0)[j][box].max()), 1)
            row["diffusion_member"] = round(float(members[0][j][box].max()), 1)
            row["diffusionMemberMaxMm"] = [round(float(m[j][box].max()), 1) for m in members]
        storms.append(row)
    for k in list(preds) + (["diffusion_mean", "diffusion_member"] if members is not None else []):
        ratios = [r[k] / r["imdMaxMm"] for r in storms if k in r]
        target = results if k in results else subset
        target[k]["stormPeakKeptMedian"] = round(float(np.median(ratios)), 3) if ratios else None
    if members is not None:
        full_like = {k: np.full_like(preds["unet"], np.nan) for k in ("diffusion_mean", "diffusion_member")}
        for j, i in enumerate(sub):
            full_like["diffusion_mean"][i], full_like["diffusion_member"][i] = members.mean(0)[j], members[0][j]
        allp.update(full_like)
    out = {**meta, "status": status, "minutes": round((time.time() - t0) / 60, 1), "test": results, "testSubset": subset,
           "storms": storms}
    out["maps"] = storm_maps(storms, allp, None, truth, tt, lat, lon)
    OUT_JSON.write_text(json.dumps(out, indent=1))
    OUT_JS.write_text("// Stage 2 downscaler experiment, generated by scripts/downscale_train.py.\n"
                      f"export const DOWNSCALER = {json.dumps(out, indent=1)}\n")
    print(f"results written ({status})", flush=True)


if __name__ == "__main__":
    main()
