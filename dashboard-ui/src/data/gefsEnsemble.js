// Real NOAA GEFS (v12, 0.25 deg, 30 perturbed members + control) forecast run for
// Yaas, exported from data/processed/yaas_gefs_ensemble/ by scripts/export_gefs_for_dashboard.py.
// Every number here is real: run through the same detector/tracker as the ERA5 cases
// (pipeline/anomaly.py, pipeline/tracker.py), not the deck's mock-up numbers.
// Regenerate with: scripts/fetch_gefs.py -> scripts/run_gefs_ensemble.py -> this script.

export const GEFS_META = {
  storm: 'YAAS',
  label: 'Yaas, May 2021 — GEFS v12 ensemble forecast',
  init: '2021-05-21T00:00',
  nMembers: 30,
  nMembersWithTracks: 30,
  center: [18, 88.5],
}

export const GEFS_SUMMARY = {
  "case": "yaas_gefs",
  "storm": "YAAS",
  "init": "2021-05-21T00:00",
  "n_members": 30,
  "n_members_with_tracks": 30,
  "peak_members_agreeing": {
    "members": 7,
    "of": 30,
    "lead_h": 126.0,
    "time": "2021-05-26 06:00:00"
  },
  "peak_severe_fraction": {
    "fraction": 0.733,
    "lead_h": 96.0,
    "time": "2021-05-25 00:00:00"
  },
  "track_error_by_lead_time": {
    "median_km_all_members": 269.6,
    "n_members_validated": 30
  }
}

export const GEFS_MEMBERS = [
  {
    "id": "c00",
    "trackId": 3,
    "validation": {
      "n": 10,
      "meanKm": 116.5,
      "medianKm": 117.4,
      "minKm": 71.5,
      "maxKm": 163.1
    },
    "points": [
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 17.5128,
        "lon": 91.4571,
        "pminLat": 17.25,
        "pminLon": 90.75,
        "maxWs": 23.46,
        "minMsl": 989.87,
        "maxZ": 7.76
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 16.0057,
        "lon": 90.1559,
        "pminLat": 17.5,
        "pminLon": 90.25,
        "maxWs": 29.12,
        "minMsl": 986.87,
        "maxZ": 9.91
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 16.8266,
        "lon": 90.0966,
        "pminLat": 17.75,
        "pminLon": 89.75,
        "maxWs": 37.56,
        "minMsl": 980.91,
        "maxZ": 13.64
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 17.942,
        "lon": 89.1028,
        "pminLat": 18.25,
        "pminLon": 89.25,
        "maxWs": 42.14,
        "minMsl": 979.21,
        "maxZ": 15.5
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 18.9463,
        "lon": 89.2281,
        "pminLat": 19.0,
        "pminLon": 88.75,
        "maxWs": 46.05,
        "minMsl": 977.25,
        "maxZ": 18.52
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 19.0337,
        "lon": 89.0332,
        "pminLat": 20.0,
        "pminLon": 88.5,
        "maxWs": 43.32,
        "minMsl": 976.88,
        "maxZ": 20.63
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 20.1023,
        "lon": 88.3171,
        "pminLat": 20.5,
        "pminLon": 88.0,
        "maxWs": 48.19,
        "minMsl": 976.87,
        "maxZ": 21.02
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 20.7759,
        "lon": 88.1628,
        "pminLat": 21.5,
        "pminLon": 87.75,
        "maxWs": 34.56,
        "minMsl": 981.55,
        "maxZ": 16.71
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 21.2885,
        "lon": 87.6974,
        "pminLat": 22.0,
        "pminLon": 87.5,
        "maxWs": 25.53,
        "minMsl": 984.25,
        "maxZ": 17.22
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 21.3903,
        "lon": 87.8445,
        "pminLat": 22.25,
        "pminLon": 87.25,
        "maxWs": 20.78,
        "minMsl": 989.84,
        "maxZ": 9.98
      }
    ]
  },
  {
    "id": "p01",
    "trackId": 2,
    "validation": {
      "n": 8,
      "meanKm": 324.4,
      "medianKm": 303.1,
      "minKm": 219.5,
      "maxKm": 522.3
    },
    "points": [
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 16.5211,
        "lon": 90.1311,
        "pminLat": 17.5,
        "pminLon": 91.0,
        "maxWs": 23.24,
        "minMsl": 997.65,
        "maxZ": 6.95
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 17.1739,
        "lon": 90.3158,
        "pminLat": 18.5,
        "pminLon": 91.0,
        "maxWs": 25.35,
        "minMsl": 996.91,
        "maxZ": 8.69
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 18.2931,
        "lon": 89.3825,
        "pminLat": 18.5,
        "pminLon": 90.0,
        "maxWs": 19.34,
        "minMsl": 996.2,
        "maxZ": 7.76
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 17.6954,
        "lon": 90.0233,
        "pminLat": 18.75,
        "pminLon": 90.25,
        "maxWs": 20.17,
        "minMsl": 997.63,
        "maxZ": 5.89
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 18.3076,
        "lon": 89.9993,
        "pminLat": 19.75,
        "pminLon": 90.0,
        "maxWs": 20.3,
        "minMsl": 997.6,
        "maxZ": 6.26
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 19.8064,
        "lon": 91.0119,
        "pminLat": 20.5,
        "pminLon": 90.0,
        "maxWs": 22.15,
        "minMsl": 997.19,
        "maxZ": 8.52
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 19.7229,
        "lon": 90.0074,
        "pminLat": 20.0,
        "pminLon": 89.5,
        "maxWs": 19.36,
        "minMsl": 996.19,
        "maxZ": 7.39
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 22.0734,
        "lon": 91.0859,
        "pminLat": 21.5,
        "pminLon": 90.75,
        "maxWs": 18.75,
        "minMsl": 998.91,
        "maxZ": 9.19
      }
    ]
  },
  {
    "id": "p02",
    "trackId": 3,
    "validation": {
      "n": 5,
      "meanKm": 362.3,
      "medianKm": 373.0,
      "minKm": 299.1,
      "maxKm": 428.0
    },
    "points": [
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 18.2354,
        "lon": 91.9801,
        "pminLat": 18.5,
        "pminLon": 92.5,
        "maxWs": 24.58,
        "minMsl": 997.43,
        "maxZ": 9.28
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 17.8544,
        "lon": 91.6486,
        "pminLat": 18.25,
        "pminLon": 92.0,
        "maxWs": 21.49,
        "minMsl": 995.85,
        "maxZ": 7.79
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 17.3678,
        "lon": 90.9935,
        "pminLat": 18.25,
        "pminLon": 92.0,
        "maxWs": 23.46,
        "minMsl": 998.31,
        "maxZ": 7.52
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 17.2611,
        "lon": 91.577,
        "pminLat": 18.0,
        "pminLon": 92.25,
        "maxWs": 23.69,
        "minMsl": 998.44,
        "maxZ": 8.02
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 17.8661,
        "lon": 91.6638,
        "pminLat": 18.5,
        "pminLon": 92.25,
        "maxWs": 20.96,
        "minMsl": 998.92,
        "maxZ": 7.16
      }
    ]
  },
  {
    "id": "p03",
    "trackId": 1,
    "validation": {
      "n": 12,
      "meanKm": 245.7,
      "medianKm": 222.5,
      "minKm": 121.4,
      "maxKm": 394.9
    },
    "points": [
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 15.5144,
        "lon": 89.4615,
        "pminLat": 16.5,
        "pminLon": 90.75,
        "maxWs": 19.57,
        "minMsl": 997.5,
        "maxZ": 4.75
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 16.3041,
        "lon": 90.0415,
        "pminLat": 17.5,
        "pminLon": 90.5,
        "maxWs": 23.85,
        "minMsl": 990.06,
        "maxZ": 7.72
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 18.1654,
        "lon": 90.2146,
        "pminLat": 18.25,
        "pminLon": 90.25,
        "maxWs": 26.44,
        "minMsl": 986.89,
        "maxZ": 9.75
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 16.6804,
        "lon": 89.1374,
        "pminLat": 18.75,
        "pminLon": 90.0,
        "maxWs": 41.01,
        "minMsl": 980.58,
        "maxZ": 15.85
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 18.5029,
        "lon": 90.2133,
        "pminLat": 19.75,
        "pminLon": 90.0,
        "maxWs": 33.16,
        "minMsl": 978.6,
        "maxZ": 14.65
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 19.9672,
        "lon": 90.1068,
        "pminLat": 20.5,
        "pminLon": 89.75,
        "maxWs": 36.43,
        "minMsl": 976.5,
        "maxZ": 16.97
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 20.6284,
        "lon": 89.8222,
        "pminLat": 21.25,
        "pminLon": 89.75,
        "maxWs": 38.08,
        "minMsl": 978.22,
        "maxZ": 16.18
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 21.8918,
        "lon": 89.8449,
        "pminLat": 22.25,
        "pminLon": 89.5,
        "maxWs": 35.12,
        "minMsl": 978.2,
        "maxZ": 22.01
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 22.9151,
        "lon": 89.7513,
        "pminLat": 23.5,
        "pminLon": 89.25,
        "maxWs": 23.61,
        "minMsl": 982.23,
        "maxZ": 15.97
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 24.0146,
        "lon": 88.9123,
        "pminLat": 24.25,
        "pminLon": 89.25,
        "maxWs": 19.44,
        "minMsl": 982.79,
        "maxZ": 17.02
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 24.5427,
        "lon": 89.1804,
        "pminLat": 24.5,
        "pminLon": 89.0,
        "maxWs": 18.02,
        "minMsl": 987.34,
        "maxZ": 15.67
      },
      {
        "leadH": 144.0,
        "time": "2021-05-27T00:00:00",
        "lat": 25.8997,
        "lon": 88.7284,
        "pminLat": 25.5,
        "pminLon": 88.25,
        "maxWs": 19.18,
        "minMsl": 990.89,
        "maxZ": 16.57
      }
    ]
  },
  {
    "id": "p05",
    "trackId": 3,
    "validation": {
      "n": 9,
      "meanKm": 690.9,
      "medianKm": 741.7,
      "minKm": 408.5,
      "maxKm": 968.8
    },
    "points": [
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 10.2671,
        "lon": 90.1562,
        "pminLat": 11.5,
        "pminLon": 90.75,
        "maxWs": 18.45,
        "minMsl": 1002.57,
        "maxZ": 3.87
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 11.6459,
        "lon": 88.7895,
        "pminLat": 15.0,
        "pminLon": 90.5,
        "maxWs": 19.34,
        "minMsl": 999.26,
        "maxZ": 4.08
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 12.1188,
        "lon": 90.2664,
        "pminLat": 16.25,
        "pminLon": 90.0,
        "maxWs": 24.38,
        "minMsl": 990.8,
        "maxZ": 8.08
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 12.9205,
        "lon": 90.6917,
        "pminLat": 16.0,
        "pminLon": 90.0,
        "maxWs": 26.61,
        "minMsl": 989.72,
        "maxZ": 6.79
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 12.6425,
        "lon": 91.8912,
        "pminLat": 16.0,
        "pminLon": 90.5,
        "maxWs": 34.37,
        "minMsl": 986.06,
        "maxZ": 9.46
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 13.6523,
        "lon": 91.5793,
        "pminLat": 16.25,
        "pminLon": 91.25,
        "maxWs": 29.43,
        "minMsl": 984.98,
        "maxZ": 8.21
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 15.1566,
        "lon": 91.1341,
        "pminLat": 16.25,
        "pminLon": 91.5,
        "maxWs": 34.85,
        "minMsl": 984.34,
        "maxZ": 11.51
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 15.5507,
        "lon": 90.9788,
        "pminLat": 16.5,
        "pminLon": 91.5,
        "maxWs": 30.69,
        "minMsl": 984.47,
        "maxZ": 9.99
      },
      {
        "leadH": 144.0,
        "time": "2021-05-27T00:00:00",
        "lat": 15.5142,
        "lon": 91.6145,
        "pminLat": 16.5,
        "pminLon": 91.75,
        "maxWs": 32.8,
        "minMsl": 982.7,
        "maxZ": 10.54
      }
    ]
  },
  {
    "id": "p06",
    "trackId": 1,
    "validation": {
      "n": 9,
      "meanKm": 258.7,
      "medianKm": 258.1,
      "minKm": 122.3,
      "maxKm": 384.8
    },
    "points": [
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 16.8214,
        "lon": 88.5066,
        "pminLat": 16.5,
        "pminLon": 89.0,
        "maxWs": 20.06,
        "minMsl": 995.91,
        "maxZ": 6.03
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 17.0679,
        "lon": 89.017,
        "pminLat": 17.0,
        "pminLon": 90.0,
        "maxWs": 25.59,
        "minMsl": 989.41,
        "maxZ": 8.95
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 17.2146,
        "lon": 90.1015,
        "pminLat": 17.5,
        "pminLon": 90.0,
        "maxWs": 29.23,
        "minMsl": 986.87,
        "maxZ": 9.25
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 17.9885,
        "lon": 90.1596,
        "pminLat": 18.25,
        "pminLon": 90.0,
        "maxWs": 25.86,
        "minMsl": 981.9,
        "maxZ": 10.93
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 18.5626,
        "lon": 89.8614,
        "pminLat": 19.25,
        "pminLon": 90.0,
        "maxWs": 32.81,
        "minMsl": 982.78,
        "maxZ": 12.9
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 19.561,
        "lon": 89.8918,
        "pminLat": 20.0,
        "pminLon": 90.0,
        "maxWs": 35.97,
        "minMsl": 978.88,
        "maxZ": 14.55
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 20.1978,
        "lon": 89.9777,
        "pminLat": 21.0,
        "pminLon": 89.75,
        "maxWs": 32.31,
        "minMsl": 979.69,
        "maxZ": 14.99
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 21.365,
        "lon": 89.8932,
        "pminLat": 22.25,
        "pminLon": 89.75,
        "maxWs": 30.0,
        "minMsl": 979.52,
        "maxZ": 15.78
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 21.4937,
        "lon": 89.8509,
        "pminLat": 22.0,
        "pminLon": 89.5,
        "maxWs": 22.4,
        "minMsl": 988.34,
        "maxZ": 11.51
      }
    ]
  },
  {
    "id": "p07",
    "trackId": 2,
    "validation": {
      "n": 13,
      "meanKm": 129.8,
      "medianKm": 128.3,
      "minKm": 66.4,
      "maxKm": 234.1
    },
    "points": [
      {
        "leadH": 54.0,
        "time": "2021-05-23T06:00:00",
        "lat": 15.8723,
        "lon": 90.938,
        "pminLat": 16.25,
        "pminLon": 91.25,
        "maxWs": 17.99,
        "minMsl": 993.62,
        "maxZ": 4.44
      },
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 16.1821,
        "lon": 92.187,
        "pminLat": 16.75,
        "pminLon": 91.5,
        "maxWs": 23.62,
        "minMsl": 990.34,
        "maxZ": 7.78
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 16.4656,
        "lon": 90.6697,
        "pminLat": 17.0,
        "pminLon": 90.75,
        "maxWs": 32.71,
        "minMsl": 988.07,
        "maxZ": 10.63
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 17.0702,
        "lon": 89.7055,
        "pminLat": 17.25,
        "pminLon": 90.25,
        "maxWs": 37.21,
        "minMsl": 984.32,
        "maxZ": 11.53
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 16.7749,
        "lon": 89.2561,
        "pminLat": 17.75,
        "pminLon": 89.5,
        "maxWs": 41.9,
        "minMsl": 983.29,
        "maxZ": 13.75
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 17.2062,
        "lon": 88.7108,
        "pminLat": 18.0,
        "pminLon": 88.75,
        "maxWs": 41.08,
        "minMsl": 979.29,
        "maxZ": 16.64
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 17.4347,
        "lon": 88.3121,
        "pminLat": 18.25,
        "pminLon": 88.25,
        "maxWs": 40.47,
        "minMsl": 981.41,
        "maxZ": 15.61
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 18.0102,
        "lon": 88.3212,
        "pminLat": 19.0,
        "pminLon": 88.5,
        "maxWs": 39.72,
        "minMsl": 979.24,
        "maxZ": 16.22
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 18.473,
        "lon": 88.8089,
        "pminLat": 19.5,
        "pminLon": 88.5,
        "maxWs": 45.09,
        "minMsl": 978.86,
        "maxZ": 21.23
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 19.1326,
        "lon": 88.6625,
        "pminLat": 20.25,
        "pminLon": 88.75,
        "maxWs": 35.17,
        "minMsl": 980.04,
        "maxZ": 15.21
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 19.9481,
        "lon": 88.6109,
        "pminLat": 21.25,
        "pminLon": 88.5,
        "maxWs": 34.91,
        "minMsl": 984.56,
        "maxZ": 14.24
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 22.0094,
        "lon": 87.4279,
        "pminLat": 21.75,
        "pminLon": 87.75,
        "maxWs": 18.15,
        "minMsl": 984.63,
        "maxZ": 14.67
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 20.7785,
        "lon": 87.7092,
        "pminLat": 21.0,
        "pminLon": 87.25,
        "maxWs": 22.99,
        "minMsl": 986.28,
        "maxZ": 10.78
      }
    ]
  },
  {
    "id": "p08",
    "trackId": 3,
    "validation": {
      "n": 7,
      "meanKm": 790.7,
      "medianKm": 743.0,
      "minKm": 675.9,
      "maxKm": 990.0
    },
    "points": [
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 12.9468,
        "lon": 93.3929,
        "pminLat": 13.5,
        "pminLon": 93.25,
        "maxWs": 18.87,
        "minMsl": 1001.76,
        "maxZ": 5.06
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 13.1323,
        "lon": 92.6211,
        "pminLat": 15.5,
        "pminLon": 94.25,
        "maxWs": 22.01,
        "minMsl": 1000.84,
        "maxZ": 5.55
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 14.3211,
        "lon": 92.1208,
        "pminLat": 15.5,
        "pminLon": 93.0,
        "maxWs": 19.43,
        "minMsl": 999.07,
        "maxZ": 5.11
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 15.2761,
        "lon": 92.2996,
        "pminLat": 16.75,
        "pminLon": 94.0,
        "maxWs": 20.59,
        "minMsl": 999.04,
        "maxZ": 5.73
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 15.7548,
        "lon": 93.3069,
        "pminLat": 17.75,
        "pminLon": 94.0,
        "maxWs": 24.95,
        "minMsl": 996.53,
        "maxZ": 9.47
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 16.3131,
        "lon": 93.0279,
        "pminLat": 18.0,
        "pminLon": 94.75,
        "maxWs": 22.7,
        "minMsl": 998.84,
        "maxZ": 9.01
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 15.7935,
        "lon": 94.2886,
        "pminLat": 16.5,
        "pminLon": 94.0,
        "maxWs": 19.4,
        "minMsl": 1000.09,
        "maxZ": 8.49
      }
    ]
  },
  {
    "id": "p09",
    "trackId": 2,
    "validation": {
      "n": 9,
      "meanKm": 283.3,
      "medianKm": 286.6,
      "minKm": 259.6,
      "maxKm": 293.3
    },
    "points": [
      {
        "leadH": 54.0,
        "time": "2021-05-23T06:00:00",
        "lat": 17.3097,
        "lon": 89.8573,
        "pminLat": 17.75,
        "pminLon": 90.75,
        "maxWs": 22.59,
        "minMsl": 994.95,
        "maxZ": 6.38
      },
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 17.2152,
        "lon": 89.7983,
        "pminLat": 18.0,
        "pminLon": 90.5,
        "maxWs": 24.35,
        "minMsl": 992.82,
        "maxZ": 8.18
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 16.52,
        "lon": 90.4393,
        "pminLat": 18.0,
        "pminLon": 90.75,
        "maxWs": 22.86,
        "minMsl": 994.45,
        "maxZ": 7.17
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 17.3777,
        "lon": 90.2143,
        "pminLat": 18.5,
        "pminLon": 90.75,
        "maxWs": 26.76,
        "minMsl": 992.74,
        "maxZ": 9.44
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 17.7336,
        "lon": 90.3639,
        "pminLat": 19.0,
        "pminLon": 90.75,
        "maxWs": 29.78,
        "minMsl": 992.96,
        "maxZ": 10.55
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 18.1499,
        "lon": 90.589,
        "pminLat": 19.5,
        "pminLon": 90.75,
        "maxWs": 22.27,
        "minMsl": 990.45,
        "maxZ": 9.6
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 18.3148,
        "lon": 89.6226,
        "pminLat": 19.75,
        "pminLon": 90.5,
        "maxWs": 21.37,
        "minMsl": 992.21,
        "maxZ": 7.46
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 18.8771,
        "lon": 90.4459,
        "pminLat": 20.0,
        "pminLon": 90.5,
        "maxWs": 27.89,
        "minMsl": 990.81,
        "maxZ": 10.92
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 19.5868,
        "lon": 90.6583,
        "pminLat": 20.25,
        "pminLon": 90.5,
        "maxWs": 24.91,
        "minMsl": 994.52,
        "maxZ": 10.01
      }
    ]
  },
  {
    "id": "p10",
    "trackId": 1,
    "validation": {
      "n": 11,
      "meanKm": 207.0,
      "medianKm": 176.9,
      "minKm": 125.2,
      "maxKm": 453.1
    },
    "points": [
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 12.6692,
        "lon": 92.2009,
        "pminLat": 12.75,
        "pminLon": 92.5,
        "maxWs": 19.89,
        "minMsl": 1003.08,
        "maxZ": 5.23
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 14.1935,
        "lon": 90.8074,
        "pminLat": 15.0,
        "pminLon": 91.75,
        "maxWs": 20.63,
        "minMsl": 1001.67,
        "maxZ": 4.8
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 15.8691,
        "lon": 90.5531,
        "pminLat": 17.5,
        "pminLon": 91.5,
        "maxWs": 24.25,
        "minMsl": 992.75,
        "maxZ": 7.42
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 15.2325,
        "lon": 89.9212,
        "pminLat": 17.75,
        "pminLon": 90.75,
        "maxWs": 27.93,
        "minMsl": 989.86,
        "maxZ": 8.88
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 17.4304,
        "lon": 90.8324,
        "pminLat": 18.25,
        "pminLon": 90.5,
        "maxWs": 27.78,
        "minMsl": 985.36,
        "maxZ": 11.61
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 18.5354,
        "lon": 89.9612,
        "pminLat": 18.75,
        "pminLon": 90.0,
        "maxWs": 37.86,
        "minMsl": 984.11,
        "maxZ": 13.65
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 19.3233,
        "lon": 89.829,
        "pminLat": 19.75,
        "pminLon": 89.5,
        "maxWs": 34.97,
        "minMsl": 982.21,
        "maxZ": 13.47
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 19.5515,
        "lon": 89.0948,
        "pminLat": 20.25,
        "pminLon": 88.75,
        "maxWs": 33.49,
        "minMsl": 981.89,
        "maxZ": 15.23
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 19.8434,
        "lon": 88.9393,
        "pminLat": 20.5,
        "pminLon": 88.75,
        "maxWs": 43.24,
        "minMsl": 982.18,
        "maxZ": 19.68
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 21.0181,
        "lon": 89.3717,
        "pminLat": 21.75,
        "pminLon": 88.75,
        "maxWs": 33.94,
        "minMsl": 985.0,
        "maxZ": 14.55
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 21.0745,
        "lon": 88.4461,
        "pminLat": 21.75,
        "pminLon": 87.5,
        "maxWs": 20.77,
        "minMsl": 988.67,
        "maxZ": 7.67
      }
    ]
  },
  {
    "id": "p11",
    "trackId": 1,
    "validation": {
      "n": 9,
      "meanKm": 530.6,
      "medianKm": 502.5,
      "minKm": 404.3,
      "maxKm": 629.5
    },
    "points": [
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 15.7897,
        "lon": 91.0789,
        "pminLat": 15.75,
        "pminLon": 91.5,
        "maxWs": 19.32,
        "minMsl": 996.4,
        "maxZ": 4.89
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 15.341,
        "lon": 91.2257,
        "pminLat": 16.0,
        "pminLon": 91.5,
        "maxWs": 25.5,
        "minMsl": 993.95,
        "maxZ": 7.01
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 16.853,
        "lon": 90.9666,
        "pminLat": 16.5,
        "pminLon": 91.0,
        "maxWs": 26.34,
        "minMsl": 988.16,
        "maxZ": 8.87
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 15.3788,
        "lon": 90.9095,
        "pminLat": 16.75,
        "pminLon": 90.75,
        "maxWs": 33.4,
        "minMsl": 985.36,
        "maxZ": 10.9
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 16.0697,
        "lon": 90.9685,
        "pminLat": 17.5,
        "pminLon": 91.0,
        "maxWs": 39.54,
        "minMsl": 979.17,
        "maxZ": 14.24
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 16.5647,
        "lon": 91.8414,
        "pminLat": 18.5,
        "pminLon": 91.5,
        "maxWs": 46.6,
        "minMsl": 977.51,
        "maxZ": 16.78
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 18.7681,
        "lon": 91.813,
        "pminLat": 19.75,
        "pminLon": 92.0,
        "maxWs": 42.69,
        "minMsl": 975.02,
        "maxZ": 21.26
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 19.847,
        "lon": 91.7289,
        "pminLat": 21.25,
        "pminLon": 91.75,
        "maxWs": 39.72,
        "minMsl": 977.41,
        "maxZ": 20.35
      },
      {
        "leadH": 144.0,
        "time": "2021-05-27T00:00:00",
        "lat": 20.6417,
        "lon": 91.8167,
        "pminLat": 22.5,
        "pminLon": 91.75,
        "maxWs": 22.75,
        "minMsl": 982.41,
        "maxZ": 11.56
      }
    ]
  },
  {
    "id": "p12",
    "trackId": 2,
    "validation": {
      "n": 7,
      "meanKm": 1070.1,
      "medianKm": 1061.0,
      "minKm": 935.0,
      "maxKm": 1350.0
    },
    "points": [
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 12.4977,
        "lon": 94.2295,
        "pminLat": 13.5,
        "pminLon": 95.0,
        "maxWs": 23.99,
        "minMsl": 993.88,
        "maxZ": 7.35
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 12.1982,
        "lon": 95.5588,
        "pminLat": 14.0,
        "pminLon": 95.5,
        "maxWs": 27.09,
        "minMsl": 992.37,
        "maxZ": 8.4
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 12.3321,
        "lon": 95.3831,
        "pminLat": 14.75,
        "pminLon": 96.0,
        "maxWs": 27.6,
        "minMsl": 992.25,
        "maxZ": 9.9
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 13.5023,
        "lon": 94.1056,
        "pminLat": 16.0,
        "pminLon": 95.75,
        "maxWs": 30.65,
        "minMsl": 989.93,
        "maxZ": 12.83
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 15.8714,
        "lon": 95.7857,
        "pminLat": 16.5,
        "pminLon": 95.5,
        "maxWs": 25.67,
        "minMsl": 990.19,
        "maxZ": 11.28
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 14.8123,
        "lon": 95.0102,
        "pminLat": 17.0,
        "pminLon": 95.5,
        "maxWs": 21.35,
        "minMsl": 991.25,
        "maxZ": 16.59
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 12.794,
        "lon": 93.4966,
        "pminLat": 13.0,
        "pminLon": 93.75,
        "maxWs": 18.99,
        "minMsl": 1003.09,
        "maxZ": 5.0
      }
    ]
  },
  {
    "id": "p13",
    "trackId": 2,
    "validation": {
      "n": 12,
      "meanKm": 370.9,
      "medianKm": 386.1,
      "minKm": 271.1,
      "maxKm": 439.6
    },
    "points": [
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 12.4009,
        "lon": 93.13,
        "pminLat": 13.5,
        "pminLon": 92.75,
        "maxWs": 21.04,
        "minMsl": 1000.52,
        "maxZ": 5.59
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 12.9782,
        "lon": 93.5221,
        "pminLat": 16.75,
        "pminLon": 93.0,
        "maxWs": 22.65,
        "minMsl": 999.61,
        "maxZ": 8.63
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 13.7796,
        "lon": 92.5922,
        "pminLat": 16.75,
        "pminLon": 92.25,
        "maxWs": 24.37,
        "minMsl": 990.24,
        "maxZ": 7.43
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 14.2453,
        "lon": 92.5151,
        "pminLat": 17.0,
        "pminLon": 92.25,
        "maxWs": 27.96,
        "minMsl": 987.06,
        "maxZ": 11.53
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 14.9851,
        "lon": 92.4965,
        "pminLat": 17.5,
        "pminLon": 92.25,
        "maxWs": 28.77,
        "minMsl": 982.72,
        "maxZ": 10.32
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 15.5853,
        "lon": 92.5071,
        "pminLat": 18.25,
        "pminLon": 92.25,
        "maxWs": 40.24,
        "minMsl": 981.26,
        "maxZ": 12.85
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 18.0075,
        "lon": 92.0296,
        "pminLat": 19.0,
        "pminLon": 92.25,
        "maxWs": 43.74,
        "minMsl": 981.32,
        "maxZ": 17.92
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 19.1365,
        "lon": 91.5718,
        "pminLat": 20.5,
        "pminLon": 91.75,
        "maxWs": 41.81,
        "minMsl": 984.05,
        "maxZ": 23.42
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 20.0794,
        "lon": 91.299,
        "pminLat": 21.75,
        "pminLon": 91.0,
        "maxWs": 38.93,
        "minMsl": 985.32,
        "maxZ": 22.21
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 21.3968,
        "lon": 91.0549,
        "pminLat": 22.5,
        "pminLon": 90.5,
        "maxWs": 34.52,
        "minMsl": 990.52,
        "maxZ": 16.4
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 22.5448,
        "lon": 91.0795,
        "pminLat": 23.5,
        "pminLon": 90.5,
        "maxWs": 27.38,
        "minMsl": 991.98,
        "maxZ": 21.67
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 24.4317,
        "lon": 89.7439,
        "pminLat": 24.25,
        "pminLon": 89.75,
        "maxWs": 18.94,
        "minMsl": 994.37,
        "maxZ": 13.23
      }
    ]
  },
  {
    "id": "p14",
    "trackId": 1,
    "validation": {
      "n": 12,
      "meanKm": 185.5,
      "medianKm": 164.5,
      "minKm": 115.8,
      "maxKm": 312.5
    },
    "points": [
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 16.8925,
        "lon": 88.746,
        "pminLat": 17.25,
        "pminLon": 88.75,
        "maxWs": 20.77,
        "minMsl": 1000.4,
        "maxZ": 5.61
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 17.1083,
        "lon": 88.4248,
        "pminLat": 17.75,
        "pminLon": 87.75,
        "maxWs": 21.24,
        "minMsl": 997.73,
        "maxZ": 6.99
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 16.8597,
        "lon": 87.7085,
        "pminLat": 17.5,
        "pminLon": 87.5,
        "maxWs": 20.19,
        "minMsl": 996.92,
        "maxZ": 5.72
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 17.0569,
        "lon": 87.1487,
        "pminLat": 18.0,
        "pminLon": 87.0,
        "maxWs": 26.33,
        "minMsl": 993.71,
        "maxZ": 9.53
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 17.5664,
        "lon": 87.1745,
        "pminLat": 18.5,
        "pminLon": 87.0,
        "maxWs": 33.27,
        "minMsl": 992.07,
        "maxZ": 12.94
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 17.5437,
        "lon": 87.6132,
        "pminLat": 18.75,
        "pminLon": 87.25,
        "maxWs": 28.62,
        "minMsl": 988.89,
        "maxZ": 11.36
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 18.3552,
        "lon": 87.5552,
        "pminLat": 19.25,
        "pminLon": 87.5,
        "maxWs": 33.97,
        "minMsl": 988.7,
        "maxZ": 14.72
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 18.6589,
        "lon": 88.4673,
        "pminLat": 19.5,
        "pminLon": 88.0,
        "maxWs": 36.34,
        "minMsl": 985.25,
        "maxZ": 15.72
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 19.292,
        "lon": 88.9936,
        "pminLat": 20.0,
        "pminLon": 88.25,
        "maxWs": 39.81,
        "minMsl": 984.49,
        "maxZ": 19.07
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 20.7221,
        "lon": 88.6533,
        "pminLat": 20.75,
        "pminLon": 88.5,
        "maxWs": 42.09,
        "minMsl": 981.27,
        "maxZ": 18.31
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 21.3312,
        "lon": 88.7172,
        "pminLat": 21.25,
        "pminLon": 88.5,
        "maxWs": 40.01,
        "minMsl": 982.82,
        "maxZ": 20.05
      },
      {
        "leadH": 144.0,
        "time": "2021-05-27T00:00:00",
        "lat": 22.0433,
        "lon": 88.3894,
        "pminLat": 22.0,
        "pminLon": 88.5,
        "maxWs": 35.65,
        "minMsl": 982.21,
        "maxZ": 21.8
      }
    ]
  },
  {
    "id": "p15",
    "trackId": 0,
    "validation": {
      "n": 14,
      "meanKm": 97.1,
      "medianKm": 103.8,
      "minKm": 26.8,
      "maxKm": 132.2
    },
    "points": [
      {
        "leadH": 42.0,
        "time": "2021-05-22T18:00:00",
        "lat": 13.629,
        "lon": 90.3421,
        "pminLat": 14.75,
        "pminLon": 89.75,
        "maxWs": 23.29,
        "minMsl": 1001.23,
        "maxZ": 5.64
      },
      {
        "leadH": 48.0,
        "time": "2021-05-23T00:00:00",
        "lat": 14.4629,
        "lon": 91.1324,
        "pminLat": 15.5,
        "pminLon": 90.25,
        "maxWs": 20.91,
        "minMsl": 999.11,
        "maxZ": 5.08
      },
      {
        "leadH": 54.0,
        "time": "2021-05-23T06:00:00",
        "lat": 13.7776,
        "lon": 90.5142,
        "pminLat": 16.25,
        "pminLon": 90.5,
        "maxWs": 23.4,
        "minMsl": 997.98,
        "maxZ": 6.08
      },
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 14.9767,
        "lon": 91.624,
        "pminLat": 16.25,
        "pminLon": 90.5,
        "maxWs": 25.04,
        "minMsl": 995.8,
        "maxZ": 6.52
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 15.2365,
        "lon": 91.2404,
        "pminLat": 16.5,
        "pminLon": 90.5,
        "maxWs": 26.15,
        "minMsl": 992.51,
        "maxZ": 7.92
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 15.5489,
        "lon": 90.5385,
        "pminLat": 16.75,
        "pminLon": 90.25,
        "maxWs": 25.55,
        "minMsl": 985.28,
        "maxZ": 8.72
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 16.1781,
        "lon": 90.4629,
        "pminLat": 17.25,
        "pminLon": 89.75,
        "maxWs": 32.69,
        "minMsl": 982.7,
        "maxZ": 12.32
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 16.8537,
        "lon": 89.9421,
        "pminLat": 17.75,
        "pminLon": 89.0,
        "maxWs": 37.94,
        "minMsl": 976.74,
        "maxZ": 14.03
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 17.054,
        "lon": 88.5311,
        "pminLat": 18.0,
        "pminLon": 88.25,
        "maxWs": 44.24,
        "minMsl": 975.02,
        "maxZ": 18.79
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 16.7057,
        "lon": 87.9772,
        "pminLat": 18.25,
        "pminLon": 87.5,
        "maxWs": 42.29,
        "minMsl": 967.76,
        "maxZ": 19.98
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 17.556,
        "lon": 88.1238,
        "pminLat": 18.5,
        "pminLon": 87.25,
        "maxWs": 46.39,
        "minMsl": 968.16,
        "maxZ": 20.63
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 18.9765,
        "lon": 87.7424,
        "pminLat": 19.25,
        "pminLon": 87.25,
        "maxWs": 50.08,
        "minMsl": 965.14,
        "maxZ": 23.15
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 19.6409,
        "lon": 87.5459,
        "pminLat": 20.25,
        "pminLon": 86.75,
        "maxWs": 56.25,
        "minMsl": 969.13,
        "maxZ": 27.7
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 20.1781,
        "lon": 87.3554,
        "pminLat": 21.0,
        "pminLon": 86.5,
        "maxWs": 42.15,
        "minMsl": 973.01,
        "maxZ": 31.22
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 20.781,
        "lon": 87.4941,
        "pminLat": 21.75,
        "pminLon": 86.0,
        "maxWs": 26.37,
        "minMsl": 979.68,
        "maxZ": 20.11
      }
    ]
  },
  {
    "id": "p16",
    "trackId": 0,
    "validation": {
      "n": 14,
      "meanKm": 161.8,
      "medianKm": 139.9,
      "minKm": 87.3,
      "maxKm": 280.3
    },
    "points": [
      {
        "leadH": 42.0,
        "time": "2021-05-22T18:00:00",
        "lat": 14.3578,
        "lon": 92.5527,
        "pminLat": 14.75,
        "pminLon": 91.5,
        "maxWs": 19.87,
        "minMsl": 1001.63,
        "maxZ": 4.83
      },
      {
        "leadH": 48.0,
        "time": "2021-05-23T00:00:00",
        "lat": 14.3611,
        "lon": 92.1143,
        "pminLat": 15.25,
        "pminLon": 91.75,
        "maxWs": 23.01,
        "minMsl": 998.3,
        "maxZ": 6.13
      },
      {
        "leadH": 54.0,
        "time": "2021-05-23T06:00:00",
        "lat": 15.1459,
        "lon": 92.9074,
        "pminLat": 16.5,
        "pminLon": 92.25,
        "maxWs": 21.67,
        "minMsl": 996.32,
        "maxZ": 6.04
      },
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 16.1475,
        "lon": 92.2298,
        "pminLat": 17.0,
        "pminLon": 91.75,
        "maxWs": 24.62,
        "minMsl": 992.33,
        "maxZ": 8.29
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 16.6254,
        "lon": 90.8134,
        "pminLat": 17.0,
        "pminLon": 91.25,
        "maxWs": 24.25,
        "minMsl": 991.17,
        "maxZ": 7.21
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 15.6731,
        "lon": 91.0007,
        "pminLat": 17.25,
        "pminLon": 91.0,
        "maxWs": 31.04,
        "minMsl": 984.46,
        "maxZ": 10.91
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 16.6475,
        "lon": 90.5996,
        "pminLat": 17.5,
        "pminLon": 90.5,
        "maxWs": 41.75,
        "minMsl": 980.64,
        "maxZ": 14.63
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 17.3368,
        "lon": 89.9125,
        "pminLat": 18.0,
        "pminLon": 90.0,
        "maxWs": 45.12,
        "minMsl": 977.69,
        "maxZ": 17.0
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 18.3988,
        "lon": 89.5853,
        "pminLat": 18.5,
        "pminLon": 89.75,
        "maxWs": 46.76,
        "minMsl": 980.52,
        "maxZ": 17.13
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 19.1052,
        "lon": 89.3117,
        "pminLat": 19.25,
        "pminLon": 89.25,
        "maxWs": 42.27,
        "minMsl": 977.55,
        "maxZ": 16.99
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 19.9603,
        "lon": 88.7542,
        "pminLat": 20.0,
        "pminLon": 88.25,
        "maxWs": 40.88,
        "minMsl": 976.5,
        "maxZ": 18.84
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 19.9389,
        "lon": 87.9882,
        "pminLat": 20.25,
        "pminLon": 87.5,
        "maxWs": 39.12,
        "minMsl": 977.15,
        "maxZ": 18.18
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 20.0831,
        "lon": 87.0527,
        "pminLat": 20.75,
        "pminLon": 86.75,
        "maxWs": 35.08,
        "minMsl": 982.53,
        "maxZ": 20.34
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 20.2163,
        "lon": 86.9437,
        "pminLat": 20.75,
        "pminLon": 86.25,
        "maxWs": 24.98,
        "minMsl": 985.58,
        "maxZ": 16.23
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 20.6257,
        "lon": 87.2137,
        "pminLat": 21.0,
        "pminLon": 86.25,
        "maxWs": 18.31,
        "minMsl": 991.68,
        "maxZ": 8.56
      }
    ]
  },
  {
    "id": "p17",
    "trackId": 6,
    "validation": {
      "n": 6,
      "meanKm": 195.6,
      "medianKm": 196.0,
      "minKm": 170.3,
      "maxKm": 220.5
    },
    "points": [
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 18.209,
        "lon": 90.775,
        "pminLat": 18.0,
        "pminLon": 90.25,
        "maxWs": 23.76,
        "minMsl": 990.41,
        "maxZ": 7.82
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 18.8992,
        "lon": 89.274,
        "pminLat": 18.75,
        "pminLon": 89.25,
        "maxWs": 27.55,
        "minMsl": 985.6,
        "maxZ": 10.46
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 19.0255,
        "lon": 88.5763,
        "pminLat": 19.5,
        "pminLon": 88.5,
        "maxWs": 34.87,
        "minMsl": 984.09,
        "maxZ": 14.2
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 19.596,
        "lon": 88.2861,
        "pminLat": 20.0,
        "pminLon": 88.0,
        "maxWs": 38.54,
        "minMsl": 980.69,
        "maxZ": 16.61
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 20.1119,
        "lon": 88.259,
        "pminLat": 20.5,
        "pminLon": 87.75,
        "maxWs": 27.86,
        "minMsl": 983.01,
        "maxZ": 12.82
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 18.2992,
        "lon": 85.8201,
        "pminLat": 18.75,
        "pminLon": 86.5,
        "maxWs": 20.81,
        "minMsl": 993.23,
        "maxZ": 7.28
      }
    ]
  },
  {
    "id": "p18",
    "trackId": 6,
    "validation": {
      "n": 10,
      "meanKm": 403.1,
      "medianKm": 417.7,
      "minKm": 308.1,
      "maxKm": 484.9
    },
    "points": [
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 17.7198,
        "lon": 90.9754,
        "pminLat": 18.25,
        "pminLon": 91.5,
        "maxWs": 27.54,
        "minMsl": 988.52,
        "maxZ": 8.89
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 18.2197,
        "lon": 91.2243,
        "pminLat": 18.5,
        "pminLon": 91.25,
        "maxWs": 34.8,
        "minMsl": 983.76,
        "maxZ": 13.05
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 18.7366,
        "lon": 91.1524,
        "pminLat": 19.5,
        "pminLon": 91.25,
        "maxWs": 37.49,
        "minMsl": 982.38,
        "maxZ": 15.31
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 20.1232,
        "lon": 90.8263,
        "pminLat": 20.5,
        "pminLon": 90.5,
        "maxWs": 38.73,
        "minMsl": 978.19,
        "maxZ": 21.92
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 20.9658,
        "lon": 90.3323,
        "pminLat": 21.25,
        "pminLon": 90.0,
        "maxWs": 41.38,
        "minMsl": 979.68,
        "maxZ": 18.74
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 21.6871,
        "lon": 89.8208,
        "pminLat": 21.75,
        "pminLon": 89.75,
        "maxWs": 35.31,
        "minMsl": 979.22,
        "maxZ": 22.58
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 22.2535,
        "lon": 89.5711,
        "pminLat": 22.75,
        "pminLon": 89.5,
        "maxWs": 27.66,
        "minMsl": 982.6,
        "maxZ": 14.34
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 23.5657,
        "lon": 89.1825,
        "pminLat": 23.75,
        "pminLon": 89.25,
        "maxWs": 22.08,
        "minMsl": 983.83,
        "maxZ": 20.04
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 24.3787,
        "lon": 88.8044,
        "pminLat": 24.0,
        "pminLon": 88.75,
        "maxWs": 20.03,
        "minMsl": 987.43,
        "maxZ": 16.89
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 24.574,
        "lon": 88.2468,
        "pminLat": 24.25,
        "pminLon": 88.5,
        "maxWs": 17.85,
        "minMsl": 988.68,
        "maxZ": 15.29
      }
    ]
  },
  {
    "id": "p19",
    "trackId": 2,
    "validation": {
      "n": 12,
      "meanKm": 135.2,
      "medianKm": 144.5,
      "minKm": 28.3,
      "maxKm": 300.4
    },
    "points": [
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 12.3255,
        "lon": 90.1677,
        "pminLat": 13.0,
        "pminLon": 89.5,
        "maxWs": 24.74,
        "minMsl": 999.89,
        "maxZ": 6.48
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 13.5469,
        "lon": 92.8025,
        "pminLat": 15.5,
        "pminLon": 91.75,
        "maxWs": 27.23,
        "minMsl": 998.7,
        "maxZ": 8.34
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 15.8304,
        "lon": 92.3793,
        "pminLat": 15.5,
        "pminLon": 91.25,
        "maxWs": 30.32,
        "minMsl": 992.29,
        "maxZ": 10.33
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 15.6808,
        "lon": 91.8893,
        "pminLat": 15.5,
        "pminLon": 90.5,
        "maxWs": 29.89,
        "minMsl": 988.55,
        "maxZ": 9.46
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 14.9229,
        "lon": 90.9043,
        "pminLat": 15.75,
        "pminLon": 90.0,
        "maxWs": 29.25,
        "minMsl": 982.81,
        "maxZ": 9.35
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 15.4155,
        "lon": 90.1794,
        "pminLat": 16.5,
        "pminLon": 89.5,
        "maxWs": 38.05,
        "minMsl": 978.46,
        "maxZ": 12.79
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 17.1038,
        "lon": 89.5812,
        "pminLat": 17.5,
        "pminLon": 89.0,
        "maxWs": 43.61,
        "minMsl": 973.85,
        "maxZ": 14.6
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 18.3025,
        "lon": 89.2929,
        "pminLat": 18.75,
        "pminLon": 88.5,
        "maxWs": 44.21,
        "minMsl": 970.76,
        "maxZ": 16.25
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 19.1064,
        "lon": 88.9576,
        "pminLat": 19.75,
        "pminLon": 88.25,
        "maxWs": 46.81,
        "minMsl": 968.28,
        "maxZ": 23.65
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 20.1562,
        "lon": 88.6327,
        "pminLat": 20.75,
        "pminLon": 88.25,
        "maxWs": 45.71,
        "minMsl": 971.93,
        "maxZ": 22.62
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 21.278,
        "lon": 88.4768,
        "pminLat": 22.0,
        "pminLon": 87.75,
        "maxWs": 32.77,
        "minMsl": 975.59,
        "maxZ": 21.04
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 21.5886,
        "lon": 88.0828,
        "pminLat": 22.0,
        "pminLon": 87.5,
        "maxWs": 21.48,
        "minMsl": 984.34,
        "maxZ": 10.31
      }
    ]
  },
  {
    "id": "p20",
    "trackId": 2,
    "validation": {
      "n": 16,
      "meanKm": 345.0,
      "medianKm": 362.1,
      "minKm": 212.0,
      "maxKm": 407.2
    },
    "points": [
      {
        "leadH": 54.0,
        "time": "2021-05-23T06:00:00",
        "lat": 13.0275,
        "lon": 90.6595,
        "pminLat": 13.25,
        "pminLon": 91.0,
        "maxWs": 19.31,
        "minMsl": 1002.74,
        "maxZ": 4.05
      },
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 12.6315,
        "lon": 93.0844,
        "pminLat": 13.75,
        "pminLon": 92.75,
        "maxWs": 21.82,
        "minMsl": 999.55,
        "maxZ": 6.8
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 13.5834,
        "lon": 92.0497,
        "pminLat": 14.5,
        "pminLon": 92.75,
        "maxWs": 20.99,
        "minMsl": 999.78,
        "maxZ": 5.38
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 14.6819,
        "lon": 92.0104,
        "pminLat": 15.75,
        "pminLon": 93.5,
        "maxWs": 21.18,
        "minMsl": 994.9,
        "maxZ": 6.13
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 14.3369,
        "lon": 90.2255,
        "pminLat": 15.25,
        "pminLon": 91.0,
        "maxWs": 23.66,
        "minMsl": 997.96,
        "maxZ": 6.09
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 15.0645,
        "lon": 91.2565,
        "pminLat": 15.75,
        "pminLon": 91.5,
        "maxWs": 31.26,
        "minMsl": 989.04,
        "maxZ": 10.49
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 14.9355,
        "lon": 91.2524,
        "pminLat": 15.75,
        "pminLon": 91.25,
        "maxWs": 30.47,
        "minMsl": 987.99,
        "maxZ": 9.01
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 14.8871,
        "lon": 90.5155,
        "pminLat": 15.75,
        "pminLon": 90.5,
        "maxWs": 29.31,
        "minMsl": 984.03,
        "maxZ": 9.41
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 15.4144,
        "lon": 90.1206,
        "pminLat": 16.0,
        "pminLon": 90.0,
        "maxWs": 35.15,
        "minMsl": 980.58,
        "maxZ": 10.07
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 15.9904,
        "lon": 89.896,
        "pminLat": 16.25,
        "pminLon": 89.25,
        "maxWs": 40.81,
        "minMsl": 974.27,
        "maxZ": 14.9
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 16.7309,
        "lon": 89.2194,
        "pminLat": 16.75,
        "pminLon": 88.75,
        "maxWs": 43.79,
        "minMsl": 972.5,
        "maxZ": 14.97
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 15.8025,
        "lon": 88.2146,
        "pminLat": 17.25,
        "pminLon": 88.25,
        "maxWs": 45.69,
        "minMsl": 969.15,
        "maxZ": 16.78
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 17.6033,
        "lon": 88.62,
        "pminLat": 18.0,
        "pminLon": 87.5,
        "maxWs": 44.19,
        "minMsl": 967.66,
        "maxZ": 18.82
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 17.9978,
        "lon": 88.4586,
        "pminLat": 18.75,
        "pminLon": 87.25,
        "maxWs": 44.27,
        "minMsl": 966.82,
        "maxZ": 19.39
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 17.9465,
        "lon": 87.6203,
        "pminLat": 19.75,
        "pminLon": 87.25,
        "maxWs": 44.77,
        "minMsl": 968.17,
        "maxZ": 21.12
      },
      {
        "leadH": 144.0,
        "time": "2021-05-27T00:00:00",
        "lat": 18.8852,
        "lon": 87.5343,
        "pminLat": 20.75,
        "pminLon": 87.0,
        "maxWs": 43.88,
        "minMsl": 969.14,
        "maxZ": 23.37
      }
    ]
  },
  {
    "id": "p21",
    "trackId": 4,
    "validation": {
      "n": 9,
      "meanKm": 243.0,
      "medianKm": 240.5,
      "minKm": 172.3,
      "maxKm": 414.8
    },
    "points": [
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 19.627,
        "lon": 86.5442,
        "pminLat": 19.25,
        "pminLon": 87.0,
        "maxWs": 17.59,
        "minMsl": 991.0,
        "maxZ": 5.81
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 16.4793,
        "lon": 87.2634,
        "pminLat": 17.75,
        "pminLon": 87.0,
        "maxWs": 28.34,
        "minMsl": 981.09,
        "maxZ": 8.93
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 17.4317,
        "lon": 86.928,
        "pminLat": 17.75,
        "pminLon": 86.5,
        "maxWs": 46.06,
        "minMsl": 976.09,
        "maxZ": 18.43
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 17.6982,
        "lon": 87.1072,
        "pminLat": 18.5,
        "pminLon": 86.5,
        "maxWs": 39.08,
        "minMsl": 976.63,
        "maxZ": 16.67
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 17.9686,
        "lon": 87.1208,
        "pminLat": 19.25,
        "pminLon": 86.75,
        "maxWs": 34.15,
        "minMsl": 975.67,
        "maxZ": 17.54
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 18.4373,
        "lon": 86.6192,
        "pminLat": 19.75,
        "pminLon": 86.25,
        "maxWs": 33.65,
        "minMsl": 979.64,
        "maxZ": 15.62
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 18.301,
        "lon": 85.8597,
        "pminLat": 19.75,
        "pminLon": 86.25,
        "maxWs": 27.31,
        "minMsl": 981.97,
        "maxZ": 12.98
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 18.5617,
        "lon": 86.9387,
        "pminLat": 20.25,
        "pminLon": 86.5,
        "maxWs": 25.31,
        "minMsl": 986.5,
        "maxZ": 13.1
      },
      {
        "leadH": 144.0,
        "time": "2021-05-27T00:00:00",
        "lat": 18.7235,
        "lon": 87.3556,
        "pminLat": 19.5,
        "pminLon": 86.75,
        "maxWs": 18.76,
        "minMsl": 988.66,
        "maxZ": 6.61
      }
    ]
  },
  {
    "id": "p22",
    "trackId": 1,
    "validation": {
      "n": 16,
      "meanKm": 180.6,
      "medianKm": 133.8,
      "minKm": 57.0,
      "maxKm": 510.9
    },
    "points": [
      {
        "leadH": 54.0,
        "time": "2021-05-23T06:00:00",
        "lat": 12.978,
        "lon": 93.5179,
        "pminLat": 13.5,
        "pminLon": 93.25,
        "maxWs": 18.32,
        "minMsl": 1001.2,
        "maxZ": 5.15
      },
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 12.0186,
        "lon": 93.3088,
        "pminLat": 12.5,
        "pminLon": 93.0,
        "maxWs": 20.04,
        "minMsl": 1001.61,
        "maxZ": 5.33
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 12.2741,
        "lon": 91.2811,
        "pminLat": 14.75,
        "pminLon": 92.0,
        "maxWs": 21.28,
        "minMsl": 998.28,
        "maxZ": 5.24
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 13.7929,
        "lon": 91.9193,
        "pminLat": 15.25,
        "pminLon": 91.5,
        "maxWs": 26.57,
        "minMsl": 988.02,
        "maxZ": 8.31
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 14.3734,
        "lon": 91.2216,
        "pminLat": 15.75,
        "pminLon": 91.0,
        "maxWs": 36.35,
        "minMsl": 983.65,
        "maxZ": 10.59
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 14.5702,
        "lon": 91.0023,
        "pminLat": 16.25,
        "pminLon": 90.25,
        "maxWs": 37.68,
        "minMsl": 977.56,
        "maxZ": 13.36
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 15.8615,
        "lon": 89.5266,
        "pminLat": 16.5,
        "pminLon": 89.75,
        "maxWs": 54.93,
        "minMsl": 976.41,
        "maxZ": 18.25
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 15.8784,
        "lon": 88.881,
        "pminLat": 17.25,
        "pminLon": 89.25,
        "maxWs": 53.56,
        "minMsl": 975.48,
        "maxZ": 17.18
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 16.4617,
        "lon": 89.6723,
        "pminLat": 18.0,
        "pminLon": 89.0,
        "maxWs": 39.9,
        "minMsl": 977.29,
        "maxZ": 14.28
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 18.4533,
        "lon": 88.9432,
        "pminLat": 18.75,
        "pminLon": 88.5,
        "maxWs": 46.33,
        "minMsl": 974.3,
        "maxZ": 20.41
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 18.9424,
        "lon": 88.6755,
        "pminLat": 19.75,
        "pminLon": 88.25,
        "maxWs": 38.73,
        "minMsl": 976.43,
        "maxZ": 16.76
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 19.2795,
        "lon": 88.3818,
        "pminLat": 20.25,
        "pminLon": 88.0,
        "maxWs": 40.27,
        "minMsl": 978.83,
        "maxZ": 18.6
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 19.6573,
        "lon": 88.3047,
        "pminLat": 20.75,
        "pminLon": 87.25,
        "maxWs": 34.32,
        "minMsl": 982.39,
        "maxZ": 18.46
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 20.4866,
        "lon": 87.3954,
        "pminLat": 21.0,
        "pminLon": 87.0,
        "maxWs": 36.14,
        "minMsl": 982.79,
        "maxZ": 20.31
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 20.9079,
        "lon": 87.3916,
        "pminLat": 21.75,
        "pminLon": 86.75,
        "maxWs": 30.66,
        "minMsl": 987.45,
        "maxZ": 16.85
      },
      {
        "leadH": 144.0,
        "time": "2021-05-27T00:00:00",
        "lat": 20.7717,
        "lon": 87.5919,
        "pminLat": 21.75,
        "pminLon": 86.75,
        "maxWs": 20.87,
        "minMsl": 988.74,
        "maxZ": 10.65
      }
    ]
  },
  {
    "id": "p23",
    "trackId": 0,
    "validation": {
      "n": 12,
      "meanKm": 277.0,
      "medianKm": 313.7,
      "minKm": 137.1,
      "maxKm": 374.8
    },
    "points": [
      {
        "leadH": 36.0,
        "time": "2021-05-22T12:00:00",
        "lat": 13.9745,
        "lon": 91.5329,
        "pminLat": 15.0,
        "pminLon": 90.75,
        "maxWs": 23.74,
        "minMsl": 1000.48,
        "maxZ": 6.09
      },
      {
        "leadH": 42.0,
        "time": "2021-05-22T18:00:00",
        "lat": 14.5486,
        "lon": 91.9364,
        "pminLat": 16.0,
        "pminLon": 91.25,
        "maxWs": 21.39,
        "minMsl": 996.86,
        "maxZ": 5.5
      },
      {
        "leadH": 48.0,
        "time": "2021-05-23T00:00:00",
        "lat": 15.3335,
        "lon": 91.6448,
        "pminLat": 16.5,
        "pminLon": 90.75,
        "maxWs": 25.9,
        "minMsl": 993.76,
        "maxZ": 7.22
      },
      {
        "leadH": 54.0,
        "time": "2021-05-23T06:00:00",
        "lat": 16.1273,
        "lon": 91.4679,
        "pminLat": 17.0,
        "pminLon": 90.0,
        "maxWs": 24.83,
        "minMsl": 993.76,
        "maxZ": 6.74
      },
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 15.3904,
        "lon": 90.165,
        "pminLat": 17.25,
        "pminLon": 89.5,
        "maxWs": 30.52,
        "minMsl": 989.13,
        "maxZ": 10.88
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 17.6239,
        "lon": 88.9632,
        "pminLat": 18.0,
        "pminLon": 88.5,
        "maxWs": 27.02,
        "minMsl": 987.47,
        "maxZ": 10.93
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 17.9509,
        "lon": 87.423,
        "pminLat": 18.0,
        "pminLon": 87.25,
        "maxWs": 38.74,
        "minMsl": 984.12,
        "maxZ": 14.45
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 17.3668,
        "lon": 87.0093,
        "pminLat": 18.5,
        "pminLon": 87.0,
        "maxWs": 40.04,
        "minMsl": 982.58,
        "maxZ": 14.6
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 18.0922,
        "lon": 86.8535,
        "pminLat": 19.25,
        "pminLon": 86.75,
        "maxWs": 40.53,
        "minMsl": 979.07,
        "maxZ": 16.56
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 18.6758,
        "lon": 87.0293,
        "pminLat": 20.0,
        "pminLon": 86.5,
        "maxWs": 32.7,
        "minMsl": 981.45,
        "maxZ": 16.66
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 19.7475,
        "lon": 87.5498,
        "pminLat": 20.75,
        "pminLon": 86.5,
        "maxWs": 34.21,
        "minMsl": 981.35,
        "maxZ": 16.25
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 20.5296,
        "lon": 87.5571,
        "pminLat": 21.5,
        "pminLon": 86.25,
        "maxWs": 24.63,
        "minMsl": 986.98,
        "maxZ": 12.49
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 19.7641,
        "lon": 87.2534,
        "pminLat": 21.0,
        "pminLon": 86.0,
        "maxWs": 21.64,
        "minMsl": 991.73,
        "maxZ": 8.95
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 19.5561,
        "lon": 87.271,
        "pminLat": 19.75,
        "pminLon": 86.5,
        "maxWs": 18.67,
        "minMsl": 998.08,
        "maxZ": 6.28
      }
    ]
  },
  {
    "id": "p24",
    "trackId": 5,
    "validation": {
      "n": 11,
      "meanKm": 253.5,
      "medianKm": 210.8,
      "minKm": 179.9,
      "maxKm": 639.2
    },
    "points": [
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 14.9657,
        "lon": 91.2489,
        "pminLat": 15.5,
        "pminLon": 90.0,
        "maxWs": 23.96,
        "minMsl": 994.97,
        "maxZ": 7.37
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 15.915,
        "lon": 90.1146,
        "pminLat": 16.0,
        "pminLon": 89.25,
        "maxWs": 22.91,
        "minMsl": 992.89,
        "maxZ": 7.04
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 15.8878,
        "lon": 87.9606,
        "pminLat": 16.25,
        "pminLon": 88.75,
        "maxWs": 23.92,
        "minMsl": 989.28,
        "maxZ": 6.42
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 15.5358,
        "lon": 87.5464,
        "pminLat": 16.75,
        "pminLon": 88.25,
        "maxWs": 30.96,
        "minMsl": 986.56,
        "maxZ": 8.89
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 16.8274,
        "lon": 88.1428,
        "pminLat": 17.75,
        "pminLon": 87.75,
        "maxWs": 33.74,
        "minMsl": 980.19,
        "maxZ": 13.52
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 17.6573,
        "lon": 87.5591,
        "pminLat": 18.0,
        "pminLon": 87.5,
        "maxWs": 40.5,
        "minMsl": 978.38,
        "maxZ": 15.26
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 17.8885,
        "lon": 87.6215,
        "pminLat": 18.75,
        "pminLon": 87.75,
        "maxWs": 43.77,
        "minMsl": 975.98,
        "maxZ": 17.57
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 18.7298,
        "lon": 88.4381,
        "pminLat": 19.5,
        "pminLon": 87.75,
        "maxWs": 33.68,
        "minMsl": 974.35,
        "maxZ": 13.88
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 19.8553,
        "lon": 88.078,
        "pminLat": 20.25,
        "pminLon": 87.5,
        "maxWs": 40.18,
        "minMsl": 973.61,
        "maxZ": 19.03
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 17.6281,
        "lon": 89.6209,
        "pminLat": 17.75,
        "pminLon": 89.25,
        "maxWs": 17.63,
        "minMsl": 995.24,
        "maxZ": 5.26
      },
      {
        "leadH": 144.0,
        "time": "2021-05-27T00:00:00",
        "lat": 20.6369,
        "lon": 87.5768,
        "pminLat": 21.25,
        "pminLon": 86.5,
        "maxWs": 28.05,
        "minMsl": 979.46,
        "maxZ": 18.72
      }
    ]
  },
  {
    "id": "p25",
    "trackId": 3,
    "validation": {
      "n": 12,
      "meanKm": 313.1,
      "medianKm": 374.1,
      "minKm": 123.5,
      "maxKm": 430.9
    },
    "points": [
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 15.9929,
        "lon": 92.4681,
        "pminLat": 16.25,
        "pminLon": 90.75,
        "maxWs": 25.37,
        "minMsl": 993.25,
        "maxZ": 7.01
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 16.282,
        "lon": 91.9282,
        "pminLat": 16.25,
        "pminLon": 90.0,
        "maxWs": 20.35,
        "minMsl": 990.11,
        "maxZ": 7.42
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 17.0393,
        "lon": 90.1691,
        "pminLat": 16.0,
        "pminLon": 89.5,
        "maxWs": 20.12,
        "minMsl": 990.69,
        "maxZ": 6.23
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 16.0768,
        "lon": 89.0656,
        "pminLat": 16.0,
        "pminLon": 88.75,
        "maxWs": 26.59,
        "minMsl": 986.11,
        "maxZ": 7.17
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 15.0052,
        "lon": 87.886,
        "pminLat": 16.0,
        "pminLon": 87.75,
        "maxWs": 35.33,
        "minMsl": 981.66,
        "maxZ": 9.38
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 15.7418,
        "lon": 87.1801,
        "pminLat": 16.25,
        "pminLon": 87.25,
        "maxWs": 33.47,
        "minMsl": 978.54,
        "maxZ": 9.95
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 15.8996,
        "lon": 87.0149,
        "pminLat": 16.5,
        "pminLon": 87.0,
        "maxWs": 46.94,
        "minMsl": 976.38,
        "maxZ": 15.11
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 15.9207,
        "lon": 87.2346,
        "pminLat": 17.25,
        "pminLon": 87.25,
        "maxWs": 42.91,
        "minMsl": 972.99,
        "maxZ": 14.43
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 16.3567,
        "lon": 87.4241,
        "pminLat": 18.0,
        "pminLon": 86.75,
        "maxWs": 34.94,
        "minMsl": 973.22,
        "maxZ": 12.36
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 17.1374,
        "lon": 87.0779,
        "pminLat": 18.25,
        "pminLon": 86.25,
        "maxWs": 42.17,
        "minMsl": 972.39,
        "maxZ": 17.37
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 17.7966,
        "lon": 87.2308,
        "pminLat": 18.75,
        "pminLon": 86.25,
        "maxWs": 38.11,
        "minMsl": 976.01,
        "maxZ": 16.5
      },
      {
        "leadH": 144.0,
        "time": "2021-05-27T00:00:00",
        "lat": 18.537,
        "lon": 86.5781,
        "pminLat": 19.75,
        "pminLon": 86.0,
        "maxWs": 38.34,
        "minMsl": 977.41,
        "maxZ": 23.14
      }
    ]
  },
  {
    "id": "p26",
    "trackId": 4,
    "validation": {
      "n": 11,
      "meanKm": 203.8,
      "medianKm": 197.5,
      "minKm": 69.6,
      "maxKm": 330.7
    },
    "points": [
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 14.1732,
        "lon": 88.5001,
        "pminLat": 14.5,
        "pminLon": 89.0,
        "maxWs": 20.08,
        "minMsl": 1000.0,
        "maxZ": 4.47
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 15.6761,
        "lon": 90.3424,
        "pminLat": 17.25,
        "pminLon": 92.5,
        "maxWs": 19.65,
        "minMsl": 992.61,
        "maxZ": 5.26
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 15.4204,
        "lon": 91.3479,
        "pminLat": 17.5,
        "pminLon": 92.5,
        "maxWs": 26.33,
        "minMsl": 987.97,
        "maxZ": 8.72
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 16.7588,
        "lon": 91.5753,
        "pminLat": 17.75,
        "pminLon": 92.0,
        "maxWs": 30.53,
        "minMsl": 987.47,
        "maxZ": 10.46
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 18.4284,
        "lon": 91.226,
        "pminLat": 18.75,
        "pminLon": 91.5,
        "maxWs": 29.47,
        "minMsl": 986.42,
        "maxZ": 11.32
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 19.5942,
        "lon": 90.4816,
        "pminLat": 19.5,
        "pminLon": 90.25,
        "maxWs": 31.74,
        "minMsl": 985.38,
        "maxZ": 14.03
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 20.0076,
        "lon": 89.2508,
        "pminLat": 20.0,
        "pminLon": 89.5,
        "maxWs": 34.06,
        "minMsl": 983.74,
        "maxZ": 15.6
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 20.2782,
        "lon": 88.4006,
        "pminLat": 20.25,
        "pminLon": 88.75,
        "maxWs": 34.07,
        "minMsl": 986.45,
        "maxZ": 14.63
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 20.54,
        "lon": 88.4708,
        "pminLat": 20.75,
        "pminLon": 88.25,
        "maxWs": 40.37,
        "minMsl": 984.92,
        "maxZ": 16.75
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 21.1252,
        "lon": 88.4548,
        "pminLat": 21.5,
        "pminLon": 88.0,
        "maxWs": 30.51,
        "minMsl": 987.73,
        "maxZ": 14.92
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 20.7395,
        "lon": 87.2938,
        "pminLat": 21.25,
        "pminLon": 87.25,
        "maxWs": 21.04,
        "minMsl": 987.8,
        "maxZ": 10.31
      }
    ]
  },
  {
    "id": "p27",
    "trackId": 2,
    "validation": {
      "n": 12,
      "meanKm": 175.9,
      "medianKm": 189.1,
      "minKm": 64.0,
      "maxKm": 283.4
    },
    "points": [
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 18.0144,
        "lon": 91.0939,
        "pminLat": 17.5,
        "pminLon": 91.25,
        "maxWs": 18.9,
        "minMsl": 993.12,
        "maxZ": 6.18
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 16.9437,
        "lon": 91.3035,
        "pminLat": 17.75,
        "pminLon": 91.25,
        "maxWs": 24.31,
        "minMsl": 989.13,
        "maxZ": 10.48
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 18.0225,
        "lon": 89.7565,
        "pminLat": 18.25,
        "pminLon": 90.0,
        "maxWs": 33.87,
        "minMsl": 990.58,
        "maxZ": 11.84
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 17.5145,
        "lon": 89.0762,
        "pminLat": 18.25,
        "pminLon": 89.5,
        "maxWs": 34.51,
        "minMsl": 989.3,
        "maxZ": 12.26
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 18.5652,
        "lon": 89.4892,
        "pminLat": 18.75,
        "pminLon": 89.25,
        "maxWs": 30.44,
        "minMsl": 990.12,
        "maxZ": 10.72
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 18.6889,
        "lon": 88.9778,
        "pminLat": 19.25,
        "pminLon": 88.75,
        "maxWs": 23.8,
        "minMsl": 987.22,
        "maxZ": 9.31
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 18.8713,
        "lon": 88.5028,
        "pminLat": 19.75,
        "pminLon": 89.0,
        "maxWs": 25.26,
        "minMsl": 989.61,
        "maxZ": 9.71
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 19.6824,
        "lon": 89.0275,
        "pminLat": 20.25,
        "pminLon": 89.25,
        "maxWs": 29.5,
        "minMsl": 987.34,
        "maxZ": 11.89
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 20.2397,
        "lon": 89.1914,
        "pminLat": 21.0,
        "pminLon": 89.0,
        "maxWs": 27.22,
        "minMsl": 988.97,
        "maxZ": 11.96
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 20.9693,
        "lon": 88.7372,
        "pminLat": 21.5,
        "pminLon": 88.75,
        "maxWs": 34.65,
        "minMsl": 988.2,
        "maxZ": 15.25
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 21.2689,
        "lon": 88.3728,
        "pminLat": 22.0,
        "pminLon": 88.5,
        "maxWs": 25.62,
        "minMsl": 990.39,
        "maxZ": 10.23
      },
      {
        "leadH": 144.0,
        "time": "2021-05-27T00:00:00",
        "lat": 21.9174,
        "lon": 88.0893,
        "pminLat": 22.0,
        "pminLon": 87.75,
        "maxWs": 23.32,
        "minMsl": 990.07,
        "maxZ": 15.24
      }
    ]
  },
  {
    "id": "p28",
    "trackId": 2,
    "validation": {
      "n": 11,
      "meanKm": 319.5,
      "medianKm": 341.1,
      "minKm": 157.2,
      "maxKm": 377.7
    },
    "points": [
      {
        "leadH": 54.0,
        "time": "2021-05-23T06:00:00",
        "lat": 17.6726,
        "lon": 88.6648,
        "pminLat": 18.0,
        "pminLon": 89.0,
        "maxWs": 18.08,
        "minMsl": 994.56,
        "maxZ": 5.44
      },
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 18.1876,
        "lon": 88.7318,
        "pminLat": 18.5,
        "pminLon": 89.25,
        "maxWs": 24.21,
        "minMsl": 988.9,
        "maxZ": 8.94
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 17.6097,
        "lon": 88.7805,
        "pminLat": 18.75,
        "pminLon": 88.75,
        "maxWs": 26.14,
        "minMsl": 987.88,
        "maxZ": 8.99
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 17.9785,
        "lon": 88.5816,
        "pminLat": 19.0,
        "pminLon": 88.75,
        "maxWs": 26.19,
        "minMsl": 984.09,
        "maxZ": 9.84
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 19.1922,
        "lon": 89.1964,
        "pminLat": 19.75,
        "pminLon": 88.5,
        "maxWs": 31.4,
        "minMsl": 982.37,
        "maxZ": 12.9
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 19.5737,
        "lon": 88.2546,
        "pminLat": 20.25,
        "pminLon": 88.25,
        "maxWs": 29.79,
        "minMsl": 980.12,
        "maxZ": 13.84
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 19.7468,
        "lon": 88.132,
        "pminLat": 20.5,
        "pminLon": 87.75,
        "maxWs": 35.27,
        "minMsl": 980.37,
        "maxZ": 16.04
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 20.4359,
        "lon": 87.9341,
        "pminLat": 21.25,
        "pminLon": 87.25,
        "maxWs": 28.94,
        "minMsl": 979.85,
        "maxZ": 18.62
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 20.4241,
        "lon": 87.5944,
        "pminLat": 21.5,
        "pminLon": 86.5,
        "maxWs": 20.9,
        "minMsl": 985.27,
        "maxZ": 11.14
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 20.0078,
        "lon": 86.8397,
        "pminLat": 21.25,
        "pminLon": 86.25,
        "maxWs": 21.3,
        "minMsl": 990.09,
        "maxZ": 9.78
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 20.9762,
        "lon": 88.2606,
        "pminLat": 21.5,
        "pminLon": 87.0,
        "maxWs": 21.53,
        "minMsl": 994.21,
        "maxZ": 8.27
      }
    ]
  },
  {
    "id": "p29",
    "trackId": 0,
    "validation": {
      "n": 8,
      "meanKm": 604.5,
      "medianKm": 632.2,
      "minKm": 330.7,
      "maxKm": 832.4
    },
    "points": [
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 15.5554,
        "lon": 88.8575,
        "pminLat": 16.0,
        "pminLon": 89.25,
        "maxWs": 18.81,
        "minMsl": 1000.26,
        "maxZ": 4.4
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 15.1072,
        "lon": 88.9668,
        "pminLat": 16.25,
        "pminLon": 90.0,
        "maxWs": 24.07,
        "minMsl": 996.12,
        "maxZ": 7.17
      },
      {
        "leadH": 114.0,
        "time": "2021-05-25T18:00:00",
        "lat": 14.4961,
        "lon": 89.9568,
        "pminLat": 16.5,
        "pminLon": 90.0,
        "maxWs": 22.6,
        "minMsl": 995.27,
        "maxZ": 5.59
      },
      {
        "leadH": 120.0,
        "time": "2021-05-26T00:00:00",
        "lat": 14.2967,
        "lon": 89.6771,
        "pminLat": 16.0,
        "pminLon": 90.25,
        "maxWs": 27.09,
        "minMsl": 992.03,
        "maxZ": 7.28
      },
      {
        "leadH": 126.0,
        "time": "2021-05-26T06:00:00",
        "lat": 12.8205,
        "lon": 91.2249,
        "pminLat": 16.75,
        "pminLon": 91.0,
        "maxWs": 27.47,
        "minMsl": 991.64,
        "maxZ": 9.38
      },
      {
        "leadH": 132.0,
        "time": "2021-05-26T12:00:00",
        "lat": 14.8477,
        "lon": 91.1002,
        "pminLat": 17.0,
        "pminLon": 91.0,
        "maxWs": 31.83,
        "minMsl": 988.45,
        "maxZ": 10.88
      },
      {
        "leadH": 138.0,
        "time": "2021-05-26T18:00:00",
        "lat": 15.4166,
        "lon": 91.576,
        "pminLat": 17.25,
        "pminLon": 91.0,
        "maxWs": 24.88,
        "minMsl": 987.03,
        "maxZ": 7.62
      },
      {
        "leadH": 144.0,
        "time": "2021-05-27T00:00:00",
        "lat": 14.6865,
        "lon": 90.1195,
        "pminLat": 17.5,
        "pminLon": 91.0,
        "maxWs": 31.46,
        "minMsl": 984.18,
        "maxZ": 10.13
      }
    ]
  },
  {
    "id": "p30",
    "trackId": 3,
    "validation": {
      "n": 9,
      "meanKm": 271.2,
      "medianKm": 281.0,
      "minKm": 135.0,
      "maxKm": 389.2
    },
    "points": [
      {
        "leadH": 60.0,
        "time": "2021-05-23T12:00:00",
        "lat": 13.379,
        "lon": 92.116,
        "pminLat": 15.5,
        "pminLon": 92.75,
        "maxWs": 21.7,
        "minMsl": 993.71,
        "maxZ": 6.49
      },
      {
        "leadH": 66.0,
        "time": "2021-05-23T18:00:00",
        "lat": 13.0291,
        "lon": 91.3044,
        "pminLat": 15.5,
        "pminLon": 92.5,
        "maxWs": 27.94,
        "minMsl": 990.26,
        "maxZ": 7.54
      },
      {
        "leadH": 72.0,
        "time": "2021-05-24T00:00:00",
        "lat": 13.8202,
        "lon": 92.5963,
        "pminLat": 15.75,
        "pminLon": 92.25,
        "maxWs": 27.71,
        "minMsl": 983.5,
        "maxZ": 9.33
      },
      {
        "leadH": 78.0,
        "time": "2021-05-24T06:00:00",
        "lat": 14.3351,
        "lon": 92.4191,
        "pminLat": 16.0,
        "pminLon": 92.25,
        "maxWs": 38.18,
        "minMsl": 978.38,
        "maxZ": 11.96
      },
      {
        "leadH": 84.0,
        "time": "2021-05-24T12:00:00",
        "lat": 15.0911,
        "lon": 91.976,
        "pminLat": 16.75,
        "pminLon": 92.0,
        "maxWs": 40.73,
        "minMsl": 971.13,
        "maxZ": 14.9
      },
      {
        "leadH": 90.0,
        "time": "2021-05-24T18:00:00",
        "lat": 15.5431,
        "lon": 91.35,
        "pminLat": 17.75,
        "pminLon": 91.25,
        "maxWs": 41.38,
        "minMsl": 970.83,
        "maxZ": 14.14
      },
      {
        "leadH": 96.0,
        "time": "2021-05-25T00:00:00",
        "lat": 16.4594,
        "lon": 89.8023,
        "pminLat": 18.5,
        "pminLon": 90.25,
        "maxWs": 54.16,
        "minMsl": 970.96,
        "maxZ": 22.63
      },
      {
        "leadH": 102.0,
        "time": "2021-05-25T06:00:00",
        "lat": 17.5536,
        "lon": 89.403,
        "pminLat": 19.5,
        "pminLon": 89.25,
        "maxWs": 48.87,
        "minMsl": 973.65,
        "maxZ": 21.1
      },
      {
        "leadH": 108.0,
        "time": "2021-05-25T12:00:00",
        "lat": 15.4443,
        "lon": 89.5478,
        "pminLat": 16.0,
        "pminLon": 88.25,
        "maxWs": 17.55,
        "minMsl": 997.54,
        "maxZ": 5.1
      }
    ]
  }
]

export const GEFS_AGREEMENT = [
  {
    "leadH": 48.0,
    "time": "2021-05-23T00:00:00",
    "membersPresent": 19,
    "membersAgreeing": 1,
    "nMembers": 30
  },
  {
    "leadH": 54.0,
    "time": "2021-05-23T06:00:00",
    "membersPresent": 18,
    "membersAgreeing": 0,
    "nMembers": 30
  },
  {
    "leadH": 60.0,
    "time": "2021-05-23T12:00:00",
    "membersPresent": 18,
    "membersAgreeing": 1,
    "nMembers": 30
  },
  {
    "leadH": 66.0,
    "time": "2021-05-23T18:00:00",
    "membersPresent": 21,
    "membersAgreeing": 1,
    "nMembers": 30
  },
  {
    "leadH": 72.0,
    "time": "2021-05-24T00:00:00",
    "membersPresent": 25,
    "membersAgreeing": 1,
    "nMembers": 30
  },
  {
    "leadH": 78.0,
    "time": "2021-05-24T06:00:00",
    "membersPresent": 27,
    "membersAgreeing": 3,
    "nMembers": 30
  },
  {
    "leadH": 84.0,
    "time": "2021-05-24T12:00:00",
    "membersPresent": 28,
    "membersAgreeing": 2,
    "nMembers": 30
  },
  {
    "leadH": 90.0,
    "time": "2021-05-24T18:00:00",
    "membersPresent": 26,
    "membersAgreeing": 2,
    "nMembers": 30
  },
  {
    "leadH": 96.0,
    "time": "2021-05-25T00:00:00",
    "membersPresent": 29,
    "membersAgreeing": 3,
    "nMembers": 30
  },
  {
    "leadH": 102.0,
    "time": "2021-05-25T06:00:00",
    "membersPresent": 30,
    "membersAgreeing": 3,
    "nMembers": 30
  },
  {
    "leadH": 108.0,
    "time": "2021-05-25T12:00:00",
    "membersPresent": 29,
    "membersAgreeing": 4,
    "nMembers": 30
  },
  {
    "leadH": 114.0,
    "time": "2021-05-25T18:00:00",
    "membersPresent": 29,
    "membersAgreeing": 4,
    "nMembers": 30
  },
  {
    "leadH": 120.0,
    "time": "2021-05-26T00:00:00",
    "membersPresent": 27,
    "membersAgreeing": 4,
    "nMembers": 30
  },
  {
    "leadH": 126.0,
    "time": "2021-05-26T06:00:00",
    "membersPresent": 26,
    "membersAgreeing": 7,
    "nMembers": 30
  },
  {
    "leadH": 132.0,
    "time": "2021-05-26T12:00:00",
    "membersPresent": 18,
    "membersAgreeing": 0,
    "nMembers": 30
  },
  {
    "leadH": 138.0,
    "time": "2021-05-26T18:00:00",
    "membersPresent": 18,
    "membersAgreeing": 0,
    "nMembers": 30
  },
  {
    "leadH": 144.0,
    "time": "2021-05-27T00:00:00",
    "membersPresent": 17,
    "membersAgreeing": 0,
    "nMembers": 30
  }
]

export const GEFS_SEVERE_FRACTION = [
  {
    "leadH": 30.0,
    "time": "2021-05-22T06:00:00",
    "fraction": 0.0,
    "nWithObject": 2
  },
  {
    "leadH": 36.0,
    "time": "2021-05-22T12:00:00",
    "fraction": 0.0,
    "nWithObject": 8
  },
  {
    "leadH": 42.0,
    "time": "2021-05-22T18:00:00",
    "fraction": 0.0,
    "nWithObject": 19
  },
  {
    "leadH": 48.0,
    "time": "2021-05-23T00:00:00",
    "fraction": 0.1,
    "nWithObject": 19
  },
  {
    "leadH": 54.0,
    "time": "2021-05-23T06:00:00",
    "fraction": 0.1,
    "nWithObject": 18
  },
  {
    "leadH": 60.0,
    "time": "2021-05-23T12:00:00",
    "fraction": 0.1,
    "nWithObject": 18
  },
  {
    "leadH": 66.0,
    "time": "2021-05-23T18:00:00",
    "fraction": 0.233,
    "nWithObject": 21
  },
  {
    "leadH": 72.0,
    "time": "2021-05-24T00:00:00",
    "fraction": 0.333,
    "nWithObject": 25
  },
  {
    "leadH": 78.0,
    "time": "2021-05-24T06:00:00",
    "fraction": 0.533,
    "nWithObject": 27
  },
  {
    "leadH": 84.0,
    "time": "2021-05-24T12:00:00",
    "fraction": 0.533,
    "nWithObject": 28
  },
  {
    "leadH": 90.0,
    "time": "2021-05-24T18:00:00",
    "fraction": 0.6,
    "nWithObject": 26
  },
  {
    "leadH": 96.0,
    "time": "2021-05-25T00:00:00",
    "fraction": 0.733,
    "nWithObject": 29
  },
  {
    "leadH": 102.0,
    "time": "2021-05-25T06:00:00",
    "fraction": 0.733,
    "nWithObject": 30
  },
  {
    "leadH": 108.0,
    "time": "2021-05-25T12:00:00",
    "fraction": 0.667,
    "nWithObject": 29
  },
  {
    "leadH": 114.0,
    "time": "2021-05-25T18:00:00",
    "fraction": 0.733,
    "nWithObject": 29
  },
  {
    "leadH": 120.0,
    "time": "2021-05-26T00:00:00",
    "fraction": 0.667,
    "nWithObject": 27
  },
  {
    "leadH": 126.0,
    "time": "2021-05-26T06:00:00",
    "fraction": 0.5,
    "nWithObject": 26
  },
  {
    "leadH": 132.0,
    "time": "2021-05-26T12:00:00",
    "fraction": 0.367,
    "nWithObject": 18
  },
  {
    "leadH": 138.0,
    "time": "2021-05-26T18:00:00",
    "fraction": 0.3,
    "nWithObject": 18
  },
  {
    "leadH": 144.0,
    "time": "2021-05-27T00:00:00",
    "fraction": 0.2,
    "nWithObject": 17
  }
]

export const GEFS_BEST_TRACK = [
  {
    "time": "2021-05-23T00:00:00",
    "lat": 15.5,
    "lon": 90.0
  },
  {
    "time": "2021-05-23T03:00:00",
    "lat": 15.4,
    "lon": 89.9
  },
  {
    "time": "2021-05-23T06:00:00",
    "lat": 15.6,
    "lon": 89.8
  },
  {
    "time": "2021-05-23T09:00:00",
    "lat": 15.6,
    "lon": 89.7
  },
  {
    "time": "2021-05-23T12:00:00",
    "lat": 15.7,
    "lon": 89.6
  },
  {
    "time": "2021-05-23T15:00:00",
    "lat": 15.8,
    "lon": 89.5
  },
  {
    "time": "2021-05-23T18:00:00",
    "lat": 15.8,
    "lon": 89.5
  },
  {
    "time": "2021-05-23T21:00:00",
    "lat": 16.0,
    "lon": 89.6
  },
  {
    "time": "2021-05-24T00:00:00",
    "lat": 16.1,
    "lon": 89.8
  },
  {
    "time": "2021-05-24T03:00:00",
    "lat": 16.5,
    "lon": 89.7
  },
  {
    "time": "2021-05-24T06:00:00",
    "lat": 16.6,
    "lon": 89.6
  },
  {
    "time": "2021-05-24T09:00:00",
    "lat": 16.9,
    "lon": 89.6
  },
  {
    "time": "2021-05-24T12:00:00",
    "lat": 17.2,
    "lon": 89.4
  },
  {
    "time": "2021-05-24T15:00:00",
    "lat": 17.4,
    "lon": 89.2
  },
  {
    "time": "2021-05-24T18:00:00",
    "lat": 17.6,
    "lon": 89.0
  },
  {
    "time": "2021-05-24T21:00:00",
    "lat": 17.8,
    "lon": 88.9
  },
  {
    "time": "2021-05-25T00:00:00",
    "lat": 18.1,
    "lon": 88.6
  },
  {
    "time": "2021-05-25T03:00:00",
    "lat": 18.4,
    "lon": 88.4
  },
  {
    "time": "2021-05-25T06:00:00",
    "lat": 18.8,
    "lon": 88.2
  },
  {
    "time": "2021-05-25T09:00:00",
    "lat": 19.1,
    "lon": 88.2
  },
  {
    "time": "2021-05-25T12:00:00",
    "lat": 19.5,
    "lon": 88.2
  },
  {
    "time": "2021-05-25T15:00:00",
    "lat": 19.9,
    "lon": 88.0
  },
  {
    "time": "2021-05-25T18:00:00",
    "lat": 20.3,
    "lon": 87.8
  },
  {
    "time": "2021-05-25T21:00:00",
    "lat": 20.4,
    "lon": 87.7
  },
  {
    "time": "2021-05-26T00:00:00",
    "lat": 20.6,
    "lon": 87.6
  },
  {
    "time": "2021-05-26T03:00:00",
    "lat": 21.1,
    "lon": 87.2
  },
  {
    "time": "2021-05-26T06:00:00",
    "lat": 21.5,
    "lon": 86.9
  },
  {
    "time": "2021-05-26T09:00:00",
    "lat": 21.7,
    "lon": 86.6
  },
  {
    "time": "2021-05-26T12:00:00",
    "lat": 21.9,
    "lon": 86.5
  },
  {
    "time": "2021-05-26T15:00:00",
    "lat": 22.2,
    "lon": 86.1
  },
  {
    "time": "2021-05-26T18:00:00",
    "lat": 22.5,
    "lon": 85.8
  },
  {
    "time": "2021-05-26T21:00:00",
    "lat": 22.8,
    "lon": 85.7
  },
  {
    "time": "2021-05-27T00:00:00",
    "lat": 23.1,
    "lon": 85.7
  },
  {
    "time": "2021-05-27T03:00:00",
    "lat": 23.3,
    "lon": 85.7
  },
  {
    "time": "2021-05-27T06:00:00",
    "lat": 23.6,
    "lon": 85.6
  },
  {
    "time": "2021-05-27T09:00:00",
    "lat": 23.9,
    "lon": 85.5
  },
  {
    "time": "2021-05-27T12:00:00",
    "lat": 24.3,
    "lon": 85.3
  },
  {
    "time": "2021-05-27T15:00:00",
    "lat": 24.5,
    "lon": 85.1
  },
  {
    "time": "2021-05-27T18:00:00",
    "lat": 24.7,
    "lon": 84.8
  }
]
