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


def test_merge_tracks_joins_a_gap_but_not_a_distant_track():
    from pipeline.tracker import merge_track_fragments as merge_tracks
    t = pd.to_datetime(["2020-05-14 00:00", "2020-05-14 06:00", "2020-05-14 18:00", "2020-05-15 00:00", "2020-05-14 18:00"])
    tr = pd.DataFrame({"time": t, "lat": [10.0, 10.5, 11.5, 12.0, 25.0], "lon": [85.0, 85.0, 85.0, 85.0, 95.0],
                       "min_msl": [990.0, 988.0, 985.0, 984.0, 1000.0], "track_id": [0, 0, 1, 1, 2]})
    merged, links = merge_tracks(tr)
    assert links == [{"from": 0, "to": 1, "gapH": 12.0, "km": round(float(links[0]["km"]), 1)}]
    assert merged.track_id.nunique() == 2  # the distant track 2 stays separate


def test_merge_off_by_default():
    import inspect
    from pipeline import tracker
    assert inspect.signature(tracker.run).parameters["merge_tracks"].default is False
