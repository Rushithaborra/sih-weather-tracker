"""Synthetic data is used here only to test the tracker logic."""
import numpy as np
import pandas as pd

from pipeline.tracker import detect, track


def _blobs(nt=6, centres_fn=None):
    lat = np.arange(0, 20.25, 0.25)
    lon = np.arange(70, 100.25, 0.25)
    LAT, LON = np.meshgrid(lat, lon, indexing="ij")
    z = np.zeros((nt, lat.size, lon.size))
    for t in range(nt):
        for (clat, clon) in centres_fn(t):
            z[t] += 4 * np.exp(-((LAT - clat) ** 2 + (LON - clon) ** 2) / (2 * 0.6 ** 2))
    times = pd.date_range("2020-05-14", periods=nt, freq="6h").values
    return z, lat, lon, times


def _run(z, lat, lon, times, ws_scale=10.0):
    # default rule: z_ws >= 2 AND z_msl <= -2 AND ws >= 17 m/s
    objs = detect(z, -z, ws_scale * z, 1000 - z, lat, lon, times, threshold=2.0, min_size=6)
    return track(objs, max_disp_km=400)


def test_single_blob_one_track_correct_centroids():
    # moves one grid cell (0.25 deg) east per step
    z, lat, lon, times = _blobs(centres_fn=lambda t: [(10.0, 80.0 + 0.25 * t)])
    tr = _run(z, lat, lon, times)
    assert tr.track_id.nunique() == 1
    assert len(tr) == 6
    np.testing.assert_allclose(tr.lat, 10.0, atol=1e-6)
    np.testing.assert_allclose(tr.sort_values("t_index").lon, 80.0 + 0.25 * np.arange(6), atol=1e-6)


def test_far_blob_gets_second_track():
    z, lat, lon, times = _blobs(centres_fn=lambda t: [(10.0, 80.0 + 0.25 * t), (5.0, 95.0)])
    tr = _run(z, lat, lon, times)
    assert tr.track_id.nunique() == 2
    near = tr[tr.lon < 90].track_id.unique()
    far = tr[tr.lon > 90].track_id.unique()
    assert len(near) == 1 and len(far) == 1 and near[0] != far[0]


def test_below_gale_wind_not_detected():
    # strong z-scores but wind peaks at 4 * 4 = 16 m/s < 17 m/s
    z, lat, lon, times = _blobs(centres_fn=lambda t: [(10.0, 80.0)])
    assert _run(z, lat, lon, times, ws_scale=4.0).empty
