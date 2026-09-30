// Real output of the pipeline in ../data/processed/<case>/ (tracks.json, validation.csv/json,
// tracks_4d.csv, meta.json, alerts_ws_sample.geojson). Nothing here is synthetic — every number
// is copied from that pipeline's output for the two validated cases, Amphan (2020) and Yaas (2021).
// See ../../README.md and ../../DEV_LOG.md for how these were produced.

export const CASES = {
  amphan: {
    id: 'amphan',
    label: 'Amphan, May 2020',
    role: 'in-sample',
    roleNote: 'Detection rules were chosen while looking at this case.',
    center: [17.5, 88],
    track: [
      { t: 0, time: '2020-05-16T18:00:00Z', lat: 10.8409, lon: 85.7251, pminLat: 10.75, pminLon: 86.0, box: [9.375, 12.375, 84.625, 86.875], nCells: 68, maxWs: 20.93, minMsl: 989.71, maxZ: 5.08, areaKm2: 51596, bt: [10.9, 86.1], pminErrKm: 19.9, centroidErrKm: 41.5 },
      { t: 6, time: '2020-05-17T00:00:00Z', lat: 10.9876, lon: 86.1915, pminLat: 11.0, pminLon: 86.0, box: [9.375, 12.875, 84.625, 87.875], nCells: 130, maxWs: 25.96, minMsl: 981.65, maxZ: 6.08, areaKm2: 98603, bt: [11.2, 86.1], pminErrKm: 24.8, centroidErrKm: 25.6 },
      { t: 12, time: '2020-05-17T06:00:00Z', lat: 11.548, lon: 86.4893, pminLat: 11.5, pminLon: 86.5, box: [9.625, 13.375, 84.625, 88.375], nCells: 179, maxWs: 25.76, minMsl: 979.51, maxZ: 5.96, areaKm2: 135504, bt: [11.5, 86.2], pminErrKm: 32.7, centroidErrKm: 32.0 },
      { t: 18, time: '2020-05-17T12:00:00Z', lat: 12.04, lon: 86.5254, pminLat: 12.25, pminLon: 86.25, box: [10.125, 13.875, 84.625, 88.625], nCells: 164, maxWs: 25.5, minMsl: 977.25, maxZ: 6.77, areaKm2: 123941, bt: [11.9, 86.2], pminErrKm: 39.3, centroidErrKm: 38.7 },
      { t: 24, time: '2020-05-17T18:00:00Z', lat: 12.6502, lon: 86.5404, pminLat: 12.75, pminLon: 86.5, box: [10.625, 14.875, 84.625, 88.625], nCells: 203, maxWs: 25.26, minMsl: 976.39, maxZ: 6.0, areaKm2: 153030, bt: [12.5, 86.4], pminErrKm: 29.8, centroidErrKm: 22.6 },
      { t: 30, time: '2020-05-18T00:00:00Z', lat: 13.0227, lon: 86.527, pminLat: 13.0, pminLon: 86.25, box: [10.625, 15.625, 84.125, 88.875], nCells: 264, maxWs: 27.1, minMsl: 970.9, maxZ: 6.18, areaKm2: 198764, bt: [13.2, 86.4], pminErrKm: 27.5, centroidErrKm: 24.0 },
      { t: 36, time: '2020-05-18T06:00:00Z', lat: 13.4971, lon: 86.4479, pminLat: 13.75, pminLon: 86.25, box: [10.875, 16.125, 84.125, 88.875], nCells: 293, maxWs: 27.24, minMsl: 968.41, maxZ: 6.42, areaKm2: 220150, bt: [13.4, 86.2], pminErrKm: 39.3, centroidErrKm: 28.9 },
      { t: 42, time: '2020-05-18T12:00:00Z', lat: 13.9851, lon: 86.5137, pminLat: 14.0, pminLon: 86.25, box: [11.375, 16.625, 84.125, 89.375], nCells: 325, maxWs: 29.23, minMsl: 961.47, maxZ: 8.05, areaKm2: 243697, bt: [14.1, 86.4], pminErrKm: 19.6, centroidErrKm: 17.7 },
      { t: 48, time: '2020-05-18T18:00:00Z', lat: 14.6825, lon: 86.9069, pminLat: 14.75, pminLon: 86.5, box: [12.125, 17.125, 83.875, 89.875], nCells: 376, maxWs: 29.47, minMsl: 959.8, maxZ: 8.24, areaKm2: 281158, bt: [14.9, 86.6], pminErrKm: 19.8, centroidErrKm: 40.9 },
      { t: 54, time: '2020-05-19T00:00:00Z', lat: 15.5723, lon: 86.9337, pminLat: 15.75, pminLon: 86.75, box: [12.625, 18.375, 84.125, 89.625], nCells: 385, maxWs: 31.26, minMsl: 952.79, maxZ: 9.73, areaKm2: 286779, bt: [15.6, 86.8], pminErrKm: 17.5, centroidErrKm: 14.7 },
      { t: 60, time: '2020-05-19T06:00:00Z', lat: 16.4212, lon: 87.1028, pminLat: 16.75, pminLon: 86.75, box: [13.375, 19.125, 84.125, 89.875], nCells: 385, maxWs: 33.13, minMsl: 948.66, maxZ: 10.71, areaKm2: 285630, bt: [16.5, 87.0], pminErrKm: 38.5, centroidErrKm: 14.0 },
      { t: 66, time: '2020-05-19T12:00:00Z', lat: 17.3441, lon: 87.5302, pminLat: 17.25, pminLon: 87.0, box: [14.625, 19.875, 84.625, 90.625], nCells: 365, maxWs: 34.6, minMsl: 954.34, maxZ: 13.2, areaKm2: 269396, bt: [17.3, 87.1], pminErrKm: 12.0, centroidErrKm: 45.9 },
      { t: 72, time: '2020-05-19T18:00:00Z', lat: 18.0508, lon: 87.7587, pminLat: 18.25, pminLon: 87.25, box: [15.625, 20.375, 84.875, 90.875], nCells: 342, maxWs: 32.68, minMsl: 961.08, maxZ: 13.3, areaKm2: 251403, bt: [18.3, 87.2], pminErrKm: 7.7, centroidErrKm: 65.2 },
      { t: 78, time: '2020-05-20T00:00:00Z', lat: 18.8296, lon: 88.1344, pminLat: 19.25, pminLon: 87.5, box: [16.375, 21.375, 85.375, 90.875], nCells: 279, maxWs: 29.0, minMsl: 963.65, maxZ: 12.18, areaKm2: 204082, bt: [19.2, 87.5], pminErrKm: 5.6, centroidErrKm: 78.4 },
      { t: 84, time: '2020-05-20T06:00:00Z', lat: 19.9139, lon: 88.7341, pminLat: 20.75, pminLon: 87.75, box: [17.625, 21.875, 86.375, 91.125], nCells: 248, maxWs: 27.1, minMsl: 968.64, maxZ: 12.37, areaKm2: 180263, bt: [20.6, 88.0], pminErrKm: 30.9, centroidErrKm: 108.1 },
      { t: 90, time: '2020-05-20T12:00:00Z', lat: 21.1595, lon: 89.4293, pminLat: 22.0, pminLon: 88.25, box: [19.875, 22.375, 87.125, 91.625], nCells: 104, maxWs: 24.35, minMsl: 973.47, maxZ: 11.99, areaKm2: 74973, bt: [22.1, 88.4], pminErrKm: 19.0, centroidErrKm: 149.2 },
      { t: 96, time: '2020-05-20T18:00:00Z', lat: 21.652, lon: 90.3192, pminLat: 22.25, pminLon: 88.5, box: [21.125, 22.375, 88.375, 91.625], nCells: 33, maxWs: 18.54, minMsl: 994.66, maxZ: 6.81, areaKm2: 23704, bt: [23.5, 89.1], pminErrKm: 152.0, centroidErrKm: 240.6 },
    ],
    validation: {
      trackId: 0,
      matchedSteps: 17,
      pmin: { medianKm: 24.8, meanKm: 31.5, minKm: 5.6, maxKm: 152.0 },
      centroid: { medianKm: 38.7, meanKm: 58.1, minKm: 14.0, maxKm: 240.6 },
      onset: { detection: '2020-05-16T18:00:00Z', imdWmo: '2020-05-16T12:00:00Z', jtwcUsa: '2020-05-16T00:00:00Z' },
    },
    peak: { minMsl: 948.66, minMslAt: 60, maxWs: 34.6, maxWsAt: 66, maxZ: 13.3, maxZAt: 72 },
    alertSnapshot: {
      time: '2020-05-20T06:00:00Z', t: 84, domainCells: 10201,
      counts: { low: 375, moderate: 239, severe: 9 },
      examples: {
        severe: { lat: 20.0, lon: 87.75, z: 10.75, windMs: 27.1 },
        moderate: { lat: 21.25, lon: 87.0, z: 12.37, windMs: 20.02 },
        low: { lat: 21.25, lon: 86.75, z: 10.39, windMs: 15.52 },
      },
    },
  },

  yaas: {
    id: 'yaas',
    label: 'Yaas, May 2021',
    role: 'held out',
    roleNote: 'Downloaded after the rules were frozen on Amphan; nothing was adjusted.',
    center: [18, 88.5],
    track: [
      { t: 0, time: '2021-05-23T12:00:00Z', lat: 13.9016, lon: 88.7526, pminLat: 14.25, pminLon: 88.75, box: [13.625, 14.375, 87.875, 89.625], nCells: 15, maxWs: 18.8, minMsl: 996.97, maxZ: 4.32, areaKm2: 11252, bt: [15.7, 89.6], pminErrKm: 185.3, centroidErrKm: 219.7 },
      { t: 6, time: '2021-05-23T18:00:00Z', lat: 14.1371, lon: 89.3683, pminLat: 14.75, pminLon: 90.25, box: [13.375, 14.875, 87.625, 91.125], nCells: 46, maxWs: 19.53, minMsl: 997.34, maxZ: 4.32, areaKm2: 34472, bt: [15.8, 89.5], pminErrKm: 141.8, centroidErrKm: 185.5 },
      { t: 12, time: '2021-05-24T00:00:00Z', lat: 14.5265, lon: 89.0668, pminLat: 15.0, pminLon: 89.25, box: [13.875, 15.125, 88.375, 89.625], nCells: 18, maxWs: 18.44, minMsl: 993.41, maxZ: 4.08, areaKm2: 13466, bt: [16.1, 89.8], pminErrKm: 135.8, centroidErrKm: 191.8 },
      { t: 18, time: '2021-05-24T06:00:00Z', lat: 15.3059, lon: 89.2898, pminLat: 16.75, pminLon: 90.0, box: [13.875, 17.375, 86.125, 91.875], nCells: 168, maxWs: 24.94, minMsl: 991.91, maxZ: 6.34, areaKm2: 125239, bt: [16.6, 89.6], pminErrKm: 45.8, centroidErrKm: 147.7 },
      { t: 24, time: '2021-05-24T12:00:00Z', lat: 16.507, lon: 88.767, pminLat: 17.5, pminLon: 88.75, box: [13.125, 19.375, 86.125, 91.625], nCells: 264, maxWs: 22.79, minMsl: 987.16, maxZ: 7.05, areaKm2: 195735, bt: [17.2, 89.4], pminErrKm: 76.6, centroidErrKm: 102.4 },
      { t: 30, time: '2021-05-24T18:00:00Z', lat: 17.2351, lon: 88.9506, pminLat: 17.0, pminLon: 89.0, box: [14.625, 19.875, 85.875, 91.875], nCells: 306, maxWs: 27.96, minMsl: 982.85, maxZ: 8.31, areaKm2: 225909, bt: [17.6, 89.0], pminErrKm: 66.7, centroidErrKm: 40.9 },
      { t: 36, time: '2021-05-25T00:00:00Z', lat: 18.0462, lon: 89.3213, pminLat: 18.5, pminLon: 88.75, box: [14.625, 21.375, 85.875, 92.125], nCells: 406, maxWs: 26.82, minMsl: 980.34, maxZ: 8.77, areaKm2: 298388, bt: [18.1, 88.6], pminErrKm: 47.2, centroidErrKm: 76.5 },
      { t: 42, time: '2021-05-25T06:00:00Z', lat: 18.2546, lon: 89.0452, pminLat: 18.75, pminLon: 88.75, box: [13.625, 21.625, 85.625, 92.125], nCells: 445, maxWs: 28.23, minMsl: 978.14, maxZ: 10.19, areaKm2: 327034, bt: [18.8, 88.2], pminErrKm: 58.2, centroidErrKm: 107.8 },
      { t: 48, time: '2021-05-25T12:00:00Z', lat: 19.2285, lon: 88.6802, pminLat: 19.5, pminLon: 88.25, box: [16.875, 21.625, 86.125, 90.875], nCells: 286, maxWs: 26.48, minMsl: 977.67, maxZ: 11.57, areaKm2: 208656, bt: [19.5, 88.2], pminErrKm: 5.2, centroidErrKm: 58.7 },
      { t: 54, time: '2021-05-25T18:00:00Z', lat: 19.4033, lon: 88.6818, pminLat: 20.25, pminLon: 88.0, box: [16.875, 21.875, 85.875, 91.125], nCells: 305, maxWs: 24.0, minMsl: 978.45, maxZ: 8.87, areaKm2: 222325, bt: [20.3, 87.8], pminErrKm: 21.6, centroidErrKm: 135.8 },
      { t: 60, time: '2021-05-26T00:00:00Z', lat: 19.8515, lon: 88.1885, pminLat: 21.0, pminLon: 87.5, box: [18.125, 21.875, 86.375, 90.125], nCells: 155, maxWs: 23.53, minMsl: 976.75, maxZ: 10.22, areaKm2: 112686, bt: [20.6, 87.6], pminErrKm: 45.7, centroidErrKm: 103.4 },
      { t: 66, time: '2021-05-26T06:00:00Z', lat: 20.7672, lon: 87.7739, pminLat: 21.25, pminLon: 87.0, box: [19.875, 21.625, 86.625, 88.875], nCells: 37, maxWs: 20.94, minMsl: 982.23, maxZ: 7.67, areaKm2: 26738, bt: [21.5, 86.9], pminErrKm: 29.7, centroidErrKm: 121.9 },
      { t: 72, time: '2021-05-26T12:00:00Z', lat: 21.1316, lon: 87.4943, pminLat: 21.5, pminLon: 87.25, box: [20.375, 21.625, 87.125, 88.125], nCells: 13, maxWs: 19.08, minMsl: 986.01, maxZ: 5.89, areaKm2: 9370, bt: [21.9, 86.5], pminErrKm: 89.3, centroidErrKm: 133.7 },
    ],
    validation: {
      trackId: 0,
      matchedSteps: 13,
      pmin: { medianKm: 58.2, meanKm: 73.0, minKm: 5.2, maxKm: 185.3 },
      centroid: { medianKm: 121.9, meanKm: 125.1, minKm: 40.9, maxKm: 219.7 },
      onset: { detection: '2021-05-23T12:00:00Z', imdWmo: '2021-05-24T00:00:00Z', jtwcUsa: '2021-05-23T18:00:00Z' },
    },
    peak: { minMsl: 976.75, minMslAt: 60, maxWs: 28.23, maxWsAt: 42, maxZ: 11.57, maxZAt: 48 },
    alertSnapshot: {
      time: '2021-05-26T00:00:00Z', t: 60, domainCells: 10201,
      counts: { low: 347, moderate: 167, severe: 0 },
      examples: {
        severe: null,
        moderate: { lat: 21.0, lon: 87.0, z: 10.22, windMs: 18.56 },
        low: { lat: 21.0, lon: 86.75, z: 11.23, windMs: 15.1 },
      },
    },
    extraObjects: [
      { time: '2021-05-24T00:00:00Z', box: [14.625, 15.625, 86.125, 87.875], maxWs: 17.92, minMsl: 996.38 },
      { time: '2021-05-26T00:00:00Z', box: [20.875, 21.875, 89.875, 90.875], maxWs: 17.73, minMsl: 992.91 },
    ],
  },
}

export const ALERT_TIERS_DEF = {
  low: { z: 1.5, windMs: 8.7, windKt: 17, imd: 'Depression' },
  moderate: { z: 2.0, windMs: 17.0, windKt: 34, imd: 'Cyclonic Storm' },
  severe: { z: 3.0, windMs: 25.0, windKt: 48, imd: 'Severe Cyclonic Storm' },
}

export const PIPELINE_META = {
  source: 'ERA5 reanalysis, 0.25° (~28 km), WeatherBench2 / Copernicus / ECMWF',
  bestTrack: 'IBTrACS v04r01 (NOAA), North Indian basin',
  climatology: '115 samples per UTC hour (00/06/12/18), 2015–2019',
  detection: 'wind z ≥ 2 AND MSLP z ≤ −2 AND wind ≥ 17 m/s (gale), 8-connected, ≥ 6 cells',
  tracking: 'Hungarian assignment on great-circle distance, gated at 400 km / 6 h',
}
