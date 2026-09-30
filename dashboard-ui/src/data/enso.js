// Real NOAA CPC Oceanic Nino Index (ONI) values for each case's formation/peak month --
// https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/oni/v6/
// ONI is a 3-month running mean of Nino 3.4 SST anomaly (deg C). Standard NOAA thresholds:
// El Nino >= +0.5, La Nina <= -0.5, Neutral in between. This is context only -- the
// detection/tracking pipeline does not condition on ENSO phase (see the roadmap note).
export const ENSO = {
  amphan: { season: 'AMJ 2020', oni: 0.0, phase: 'Neutral' },
  yaas: { season: 'AMJ 2021', oni: -0.4, phase: 'Neutral (weak La Nina fading)' },
  phailin: { season: 'ASO 2013', oni: -0.3, phase: 'Neutral' },
  hudhud: { season: 'SON 2014', oni: 0.5, phase: 'El Nino (borderline weak)' },
  titli: { season: 'SON 2018', oni: 0.8, phase: 'El Nino (weak-moderate)' },
  fani: { season: 'AMJ 2019', oni: 0.7, phase: 'El Nino (weak)' },
  bulbul: { season: 'SON 2019', oni: 0.5, phase: 'El Nino (weak)' },
  nivar: { season: 'OND 2020', oni: -1.1, phase: 'La Nina (moderate-strong)' },
}
