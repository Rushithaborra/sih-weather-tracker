"""Streamlit dashboard: ERA5 anomaly tracking for Bay of Bengal cyclones.

Loads only precomputed files from data/processed/<case>/ (built by scripts/build_processed.py).
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
import xarray as xr

from pipeline import alerts, downscale, tracker, validate

PROC = Path(__file__).parent / "data" / "processed"


def r2(df):
    """Round numeric columns only (pandas warns when datetime columns are rounded)."""
    return df.round(dict.fromkeys(df.select_dtypes("number").columns, 2))

# Palette (dataviz reference instance)
SEQ_BLUE = [[0, "#f0efec"], [0.15, "#cde2fb"], [0.35, "#86b6ef"], [0.55, "#3987e5"],
            [0.75, "#256abf"], [1, "#0d366b"]]
DIVERGING = [[0, "#0d366b"], [0.25, "#3987e5"], [0.5, "#f0efec"], [0.75, "#e66767"], [1, "#8f1d1d"]]
SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"]
OTHER = "#9a9994"
STATUS = {"low": "#fab219", "moderate": "#ec835a", "severe": "#d03b3b"}  # warning / serious / critical
INK = "#0b0b0b"
METHODS = {"pmin": "Minimum MSLP in box", "centroid": "Anomaly centroid"}

st.set_page_config(page_title="Cyclone anomaly tracker", layout="wide")


@st.cache_data
def load_cases():
    return json.loads((PROC / "cases.json").read_text())


@st.cache_resource
def load_fields(case):
    with xr.open_dataset(PROC / case / "fields.nc") as f:  # close the file so rebuilds can overwrite it
        return f.load()


@st.cache_data
def load_static(case):
    d = PROC / case
    bt = pd.read_csv(d / "ibtracs.csv", parse_dates=["time"])
    return bt, json.loads((d / "meta.json").read_text()), json.loads((d / "validation.json").read_text())


@st.cache_data
def run_tracking(case, threshold, min_size, max_disp, rule, ws_min):
    return tracker.run(load_fields(case), threshold=threshold, min_size=min_size,
                       max_disp_km=max_disp, rule=rule, ws_min=ws_min)


# ---------------- Sidebar ----------------
cases = load_cases()
st.sidebar.header("Case")
case = st.sidebar.radio("Cyclone", list(cases), format_func=lambda c: cases[c]["label"])
st.sidebar.caption(f"Validation role: **{cases[case]['role']}**")

ds = load_fields(case)
bt, meta, val_frozen = load_static(case)
D = meta["defaults"]
times = pd.to_datetime(ds.time.values)
lat, lon = ds.lat.values, ds.lon.values

st.sidebar.header("Display")
var_opts = {"Wind speed (10 m)": "ws", "Mean sea-level pressure": "msl"}
if "tp" in ds:
    var_opts["Precipitation (6 h)"] = "tp"
var_label = st.sidebar.selectbox("Variable", list(var_opts))
var = var_opts[var_label]
view_opts = ["raw"] if var == "tp" else ["raw", "z-score", "percentile"]
view = st.sidebar.radio("View", view_opts, horizontal=True)
if var == "tp":
    st.sidebar.caption("Precipitation has no climatology sample here, so only the raw view exists.")
method = st.sidebar.radio("Track position", list(METHODS), format_func=METHODS.get,
                          help="Minimum MSLP had the lower median error on both cases, so it is the default.")

st.sidebar.header("Detection")
rule_labels = {"Wind z ≥ thr AND MSLP z ≤ −thr": "ws_and_msl", "Wind z ≥ thr": "ws", "MSLP z ≤ −thr": "msl"}
rule = rule_labels[st.sidebar.selectbox("Rule", list(rule_labels),
                                        index=list(rule_labels.values()).index(D["rule"]))]
thr = st.sidebar.slider("Anomaly threshold (z)", 1.0, 4.0, float(D["threshold"]), 0.25)
ws_min = st.sidebar.slider("Minimum wind speed (m/s)", 0.0, 30.0, float(D["ws_min"]), 1.0,
                           help="17 m/s ≈ 34 kt, gale force. 0 disables the absolute check.")
min_size = st.sidebar.slider("Min object size (cells)", 1, 40, int(D["min_size"]))
max_disp = st.sidebar.slider("Max displacement per 6 h (km)", 100, 800, int(D["max_disp_km"]), 50)
at_defaults = (rule, thr, ws_min, min_size, max_disp) == (D["rule"], D["threshold"], D["ws_min"],
                                                           D["min_size"], D["max_disp_km"])

tracks = run_tracking(case, thr, min_size, max_disp, rule, ws_min)
default_t = int(np.argmax(tracks.groupby("t_index").min_msl.min().reindex(range(len(times))).fillna(1e9)
                          .values == tracks.min_msl.min())) if len(tracks) else 0
t_idx = st.sidebar.select_slider("Time (UTC)", options=list(range(len(times))), value=default_t,
                                 format_func=lambda i: times[i].strftime("%d %b %H:%M"))
t_now = times[t_idx]

# ---------------- Header ----------------
st.title(f"Extreme-weather anomaly tracking: Cyclone {cases[case]['label']}")
st.caption("SIH 2026 · PS 26078 · Tracking of an observed event on **ERA5 reanalysis (0.25°, ~28 km)**. "
           "This is not a forecast and says nothing about forecast skill. "
           f"Climatology: {meta['clim_n_samples']} samples per UTC hour (00/06/12/18), 7–29 May {meta['clim_years']}.")

# ---------------- Map field ----------------
UNITS = {"ws": "m/s", "msl": "hPa", "tp": "mm/6h"}
msl_raw = var == "msl" and view == "raw"
if view == "raw":
    field = ds[var].isel(time=t_idx).values
    if msl_raw:  # low pressure = dark
        field_c, cmin, cmax = -field, float(-ds.msl.max()), float(-ds.msl.min())
    else:
        field_c, cmin, cmax = field, 0.0, float(ds[var].max())
    cs, ctitle = SEQ_BLUE, UNITS[var]
elif view == "z-score":
    field = ds[f"z_{var}"].isel(time=t_idx).values
    field_c, cs, cmin, cmax, ctitle = field, DIVERGING, -5.0, 5.0, "z"
else:
    field = ds["pct_ws" if var == "ws" else "pct_msl_low"].isel(time=t_idx).values
    field_c, cs, cmin, cmax = field, SEQ_BLUE, 0.0, 100.0
    ctitle = "pct" if var == "ws" else "low-P pct"

LAT2, LON2 = np.meshgrid(lat, lon, indexing="ij")


def base_geo(fig, height=620):
    fig.update_geos(projection_type="equirectangular", lataxis_range=[lat[0] - 0.2, lat[-1] + 0.2],
                    lonaxis_range=[lon[0] - 0.2, lon[-1] + 0.2], showcoastlines=True, coastlinecolor="#0b0b0b", coastlinewidth=1.2,
                    showcountries=True, countrycolor="#9a9994", showland=False, showocean=False,
                    showframe=False, lataxis_showgrid=True, lonaxis_showgrid=True,
                    lataxis_gridcolor="#e6e5e0", lonaxis_gridcolor="#e6e5e0")
    fig.update_layout(height=height, margin=dict(l=0, r=0, t=10, b=0),
                      legend=dict(orientation="h", yanchor="bottom", y=1.0, x=0))


def track_colors(tr):
    order = tr.groupby("track_id").size().sort_values(ascending=False).index.tolist()
    return {tid: (SERIES[i] if i < len(SERIES) else OTHER) for i, tid in enumerate(order)}


PLA, PLO = validate.POSITIONS[method]
fig = go.Figure()
ticks = np.linspace(cmin, cmax, 5)
fig.add_trace(go.Scattergeo(
    lat=LAT2.ravel(), lon=LON2.ravel(), mode="markers", showlegend=False,
    marker=dict(symbol="square", size=6.2, color=field_c.ravel(), colorscale=cs, cmin=cmin, cmax=cmax,
                line_width=0, opacity=0.75,
                colorbar=dict(title=ctitle, thickness=12, len=0.8,
                              tickvals=ticks if msl_raw else None,
                              ticktext=[f"{-v:.0f}" for v in ticks] if msl_raw else None)),
    text=np.round(field, 2).ravel(), hovertemplate="%{lat:.2f}°N %{lon:.2f}°E<br>%{text}<extra></extra>"))

bt_win = bt[(bt.time >= times[0]) & (bt.time <= times[-1])]
fig.add_trace(go.Scattergeo(
    lat=bt_win.lat, lon=bt_win.lon, mode="lines+markers", name="IBTrACS best track",
    line=dict(color=INK, width=1.5, dash="dash"), marker=dict(size=5, color=INK),
    hovertemplate="Best track %{customdata}<br>%{lat:.1f}°N %{lon:.1f}°E<extra></extra>",
    customdata=bt_win.time.dt.strftime("%d %b %H:%M")))
colors = track_colors(tracks) if len(tracks) else {}
now = tracks[tracks.time == t_now] if len(tracks) else tracks
for _, o in now.iterrows():
    fig.add_trace(go.Scattergeo(
        lat=[o.lat_min, o.lat_min, o.lat_max, o.lat_max, o.lat_min],
        lon=[o.lon_min, o.lon_max, o.lon_max, o.lon_min, o.lon_min],
        mode="lines", line=dict(color=INK, width=1.5), showlegend=False, hoverinfo="skip"))
for tid, g in (tracks.groupby("track_id") if len(tracks) else []):
    g = g[g.time <= t_now].sort_values("time")
    if g.empty:
        continue
    fig.add_trace(go.Scattergeo(
        lat=g[PLA], lon=g[PLO], mode="lines+markers", name=f"Track {tid}",
        line=dict(color=colors[tid], width=3), marker=dict(size=9, color=colors[tid], line=dict(color="white", width=2)),
        hovertemplate=f"Track {tid}<br>%{{lat:.2f}}°N %{{lon:.2f}}°E<extra></extra>"))
    fig.add_trace(go.Scattergeo(lat=[g[PLA].iloc[-1]], lon=[g[PLO].iloc[-1]], mode="text", text=[f"T{tid}"],
                                textposition="top right", textfont=dict(color=INK, size=12),
                                showlegend=False, hoverinfo="skip"))
bt_now = validate.best_track_at(bt, [t_now]).dropna()
if len(bt_now):
    fig.add_trace(go.Scattergeo(lat=bt_now.lat, lon=bt_now.lon, mode="markers", name="Best track now",
                                marker=dict(size=14, symbol="circle-open", color=INK, line_width=2.5)))
base_geo(fig)

left, right = st.columns([3, 2])
with left:
    st.subheader(f"{var_label} · {view} · {t_now:%d %b %Y %H:%M} UTC")
    st.plotly_chart(fig, width="stretch")
    st.caption(f"Black boxes: objects detected at this time. Coloured lines: tracks up to this time, "
               f"positioned by **{METHODS[method]}**. Dashed black: IBTrACS best track (observed).")

with right:
    st.subheader("Objects at this time")
    cols = ["track_id", "pmin_lat", "pmin_lon", "lat", "lon", "area_km2", "max_ws", "min_msl", "max_z", "n_cells"]
    tbl = now[cols].rename(columns={"lat": "centroid_lat", "lon": "centroid_lon"}) if len(now) else pd.DataFrame()
    st.dataframe(r2(tbl), hide_index=True, width="stretch")
    st.subheader("Track summary (4D boxes)")
    boxes = tracker.tracks_4d(tracks)
    if len(boxes):
        st.dataframe(r2(boxes.sort_values("n_steps", ascending=False)), hide_index=True,
                     width="stretch")
    else:
        st.info("No objects pass these settings.")

# ---------------- Validation ----------------
st.header("Validation against IBTrACS")
st.markdown(f"**{cases[case]['label']}: {cases[case]['role']}.** "
            + ("Amphan was used while choosing the detection rules, so its numbers are in-sample. "
               "Yaas was run afterwards with every parameter frozen." if case == "amphan" else
               "Every parameter was fixed on Amphan before Yaas was downloaded; nothing was adjusted for Yaas.")
            + " Track method (pressure minimum) chosen on Amphan, confirmed on Yaas (held out). "
              "Two storms; tracking on reanalysis, not forecast skill.")
if not at_defaults:
    st.info("Settings differ from the frozen defaults, so the numbers below are live and differ from the logged result.")
tid, err = validate.position_errors(tracks, bt)
if tid is None or err.empty:
    st.warning("No track overlaps the best-track period with these settings.")
else:
    other = "centroid" if method == "pmin" else "pmin"
    s_main, s_other = validate.error_stats(err, method), validate.error_stats(err, other)
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Validated track (lowest MSLP)", f"T{tid}")
    c2.metric("Matched steps", s_main["n"])
    c3.metric(f"Median error · {METHODS[method]}", f"{s_main['median_km']:.0f} km",
              help=f"{METHODS[other]}: {s_other['median_km']:.0f} km")
    c4.metric(f"Mean error · {METHODS[method]}", f"{s_main['mean_km']:.0f} km",
              help=f"{METHODS[other]}: {s_other['mean_km']:.0f} km")
    ef = go.Figure()
    for i, m in enumerate([method, other]):
        ef.add_trace(go.Scatter(x=err.time, y=err[f"{m}_error_km"], mode="lines+markers", name=METHODS[m],
                                line=dict(color=SERIES[i], width=2), marker=dict(size=8),
                                hovertemplate="%{x|%d %b %H:%M}<br>%{y:.0f} km<extra>" + METHODS[m] + "</extra>"))
    ef.update_layout(height=300, margin=dict(l=10, r=10, t=30, b=10), yaxis_title="Distance to best track (km)",
                     yaxis_rangemode="tozero", hovermode="x unified",
                     legend=dict(orientation="h", yanchor="bottom", y=1.0, x=0))
    st.plotly_chart(ef, width="stretch")
    on = validate.onset(bt, tracks)
    st.caption(
        f"Mean / median / min / max (km): **{METHODS[method]}** {s_main['mean_km']} / {s_main['median_km']} / "
        f"{s_main['min_km']} / {s_main['max_km']}; {METHODS[other]} {s_other['mean_km']} / {s_other['median_km']} / "
        f"{s_other['min_km']} / {s_other['max_km']}. One ERA5 grid cell ≈ 28 km. "
        f"Onset: first detection {on['first_detection'][:16].replace('T', ' ')} UTC; first best-track wind ≥ 34 kt: "
        f"IMD {(on.get('first_wmo_wind_ge_34kt') or 'n/a')[:16].replace('T', ' ')}, "
        f"JTWC {(on.get('first_usa_wind_ge_34kt') or 'n/a')[:16].replace('T', ' ')} UTC. "
        "The anomaly centroid is not a cyclone centre (the wind maximum is an asymmetric ring and drifts "
        "over the sea at landfall); the MSLP minimum sits closer to the centre.")
    with st.expander("Per-timestep errors"):
        st.dataframe(r2(err), hide_index=True, width="stretch")

# ---------------- Placeholder downscale + alerts ----------------
d1, d2 = st.columns(2)
with d1:
    st.header("5 km view: interpolation placeholder")
    st.warning("Bilinear interpolation from 0.25° to 0.05°. **Adds no new information.** "
               "It stands in for the diffusion downscaler, which is designed, not implemented.")
    if len(now):
        pick = st.selectbox("Object box", now.track_id.tolist(), format_func=lambda x: f"Track {x}")
        o = now[now.track_id == pick].iloc[0]
        f_lat, f_lon, fine = downscale.bilinear_box(field, lat, lon, (o.lat_min, o.lat_max, o.lon_min, o.lon_max))
        hz = go.Figure(go.Heatmap(z=fine, x=f_lon, y=f_lat, colorscale=cs,
                                  zmin=None if view == "raw" else cmin, zmax=None if view == "raw" else cmax,
                                  reversescale=msl_raw,
                                  colorbar=dict(title=ctitle, thickness=12),
                                  hovertemplate="%{y:.2f}°N %{x:.2f}°E<br>%{z:.2f}<extra></extra>"))
        hz.update_layout(height=380, margin=dict(l=10, r=10, t=10, b=10),
                         xaxis_title="lon (°E)", yaxis_title="lat (°N)", yaxis_scaleanchor="x")
        st.plotly_chart(hz, width="stretch")
    else:
        st.info("No object at this time.")

T = meta["alert_tiers"]
with d2:
    st.header("Alert tiers")
    a_var = "msl" if var == "msl" else "ws"
    pct_all = ds["pct_ws" if a_var == "ws" else "pct_msl_low"].values
    z_all = ds.z_ws.values if a_var == "ws" else -ds.z_msl.values
    ws_all = ds.ws.values
    amask = alerts.box_mask(now, lat, lon, meta["alert_box_pad_deg"])
    tg = alerts.tier_grid(pct_all[t_idx], z_all[t_idx], ws_all[t_idx], T, amask)
    af = go.Figure()
    for k, name, rule_txt in ((1, "low", f"z ≥ {T['low_z']:.1f} & ≥ {T['low_ws']:.1f} m/s"),
                              (2, "moderate", f"z ≥ {T['moderate_z']:.0f} & ≥ {T['moderate_ws']:.0f} m/s"),
                              (3, "severe", f"z ≥ {T['severe_z']:.0f} & ≥ {T['severe_ws']:.0f} m/s")):
        m = tg == k
        af.add_trace(go.Scattergeo(lat=LAT2[m], lon=LON2[m], mode="markers", name=f"{name} ({rule_txt})",
                                   marker=dict(symbol="square", size=5, color=STATUS[name], line_width=0),
                                   customdata=np.c_[pct_all[t_idx][m], z_all[t_idx][m], ws_all[t_idx][m]],
                                   hovertemplate=(f"{name}<br>%{{lat:.2f}}°N %{{lon:.2f}}°E<br>"
                                                  "pct %{customdata[0]:.1f} · z %{customdata[1]:.1f} · "
                                                  "wind %{customdata[2]:.1f} m/s<extra></extra>")))
    base_geo(af, height=380)
    st.plotly_chart(af, width="stretch")
    counts = {n: int((tg == k).sum()) for k, n in ((1, "low"), (2, "moderate"), (3, "severe"))}
    share = 100 * (tg > 0).sum() / tg.size
    st.caption(f"Anomaly basis: {'wind speed' if a_var == 'ws' else 'low MSLP'} z-score vs the per-hour reanalysis "
               "climatology. Each tier also needs the wind to reach an IMD category: Depression "
               f"({T['low_ws']} m/s, 17 kt), Cyclonic Storm ({T['moderate_ws']:.0f} m/s, 34 kt), Severe Cyclonic "
               f"Storm ({T['severe_ws']:.0f} m/s, 48 kt). Alerts are only issued inside tracked-object boxes "
               f"extended by {meta['alert_box_pad_deg']:.0f}°. Cells: {counts} ({share:.1f}% of the map). "
               "**Alert tiers are anchored to IMD wind categories and were adjusted after observing results; they are not validated against observed impacts. Tracking validation is independent of the alert layer.** Single member, not an ensemble EFI.")

# ---------------- Downloads ----------------
st.header("Downloads (current settings)")
b1, b2, b3 = st.columns(3)
b1.download_button("Tracks CSV", tracks.drop(columns=["t_index"], errors="ignore").to_csv(index=False),
                   f"{case}_tracks.csv", "text/csv")
gj = alerts.alerts_geojson(pct_all[t_idx:t_idx + 1], z_all[t_idx:t_idx + 1], ws_all[t_idx:t_idx + 1],
                           ds[a_var].values[t_idx:t_idx + 1],
                           lat, lon, times.values[t_idx:t_idx + 1], a_var, T, amask)
b2.download_button("Alerts GeoJSON (this time)", alerts.dumps(gj),
                   f"{case}_alerts_{a_var}_{t_now:%Y%m%d%H}.geojson", "application/geo+json")
b3.download_button("Tracks JSON", alerts.dumps(alerts.tracks_json(tracks)), f"{case}_tracks.json", "application/json")

# ---------------- About ----------------
with st.expander("About & limitations"):
    st.markdown(f"""
- **Data**: ERA5 **reanalysis** at **0.25° (~28 km)** from WeatherBench2 (Copernicus / ECMWF). It is a best estimate
  of what happened, **not a forecast**, and not 12 km. Nothing here measures forecast skill.
- **Climatology**: {meta['clim_n_samples']} samples for each UTC hour (00/06/12/18), 7–29 May {meta['clim_years']}.
  Each time step is compared with its own hour so the daily cycle is not flagged as an anomaly.
  Std floors: {meta['std_floor']['ws']} m/s (wind), {meta['std_floor']['msl']} hPa (MSLP).
- **EFI**: a proper Extreme Forecast Index needs an ensemble and the model's own reforecast climate.
  These z-scores and percentiles are the single-member reanalysis analogue.
- **Detection**: wind z ≥ {D['threshold']} AND MSLP z ≤ −{D['threshold']} AND wind ≥ {D['ws_min']:.0f} m/s (gale force),
  8-connected objects of ≥ {D['min_size']} cells, Hungarian linking gated at {D['max_disp_km']:.0f} km per 6 h.
  Storms are only tracked once winds reach gale force; weaker depression stages are not detected.
- **Validation**: two cases. Amphan is in-sample (rules chosen while looking at it); Yaas is held out.
  Two cases are a small sample.
- **Positions**: the minimum-MSLP position is limited to the 0.25° grid; the anomaly centroid is not a cyclone centre.
- **5 km layer**: bilinear interpolation placeholder; adds no new information.
- **Precipitation**: {'raw display only (no precipitation climatology was downloaded)' if meta['has_tp'] else 'not available'}.
""")

with st.expander("Planned architecture (designed, not implemented)"):
    st.markdown("""
**Stage 1: GNN anomaly tracker (designed, not implemented)**
- Graph neural network on an icosahedral mesh, run over each NEPS-G ensemble member.
- Ensemble EFI against the model's reforecast climate instead of reanalysis percentiles.
- Output: 4D (lat, lon, time, probability) tracked bounding boxes.

**Stage 2: Conditional diffusion downscaling (designed, not implemented)**
- Conditioned on the coarse ensemble fields inside tracked boxes, with a physics-informed loss.
- Output: probabilistic ~5 km exceedance maps feeding an alert API.
- **Open issue**: high-quality 5 km training truth for India is scarce; this is the main risk for Stage 2.

Nothing in this prototype implements the GNN or the diffusion model.
""")
