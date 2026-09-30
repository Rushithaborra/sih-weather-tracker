// IMD wind-speed categories (3-min sustained, m/s). ERA5 at 0.25 deg analyzes a shallower
// vortex than observed, so peak category here can sit below the storm's real-world category
// (e.g. Amphan reached Super Cyclone in observations; ERA5-analyzed winds here top out at VSCS).
export const CATEGORIES = [
  { code: 'D', label: 'Depression', min: 0, color: '#7FB3D5' },
  { code: 'CS', label: 'Cyclonic Storm', min: 13.9, color: '#2E86C1' },
  { code: 'SCS', label: 'Severe Cyclonic Storm', min: 17.5, color: '#16A085' },
  { code: 'VSCS', label: 'Very Severe Cyclonic Storm', min: 24.7, color: '#F1C40F' },
  { code: 'ESCS', label: 'Extremely Severe Cyclonic Storm', min: 32.9, color: '#E67E22' },
  { code: 'SuCS', label: 'Super Cyclonic Storm', min: 61.7, color: '#C0392B' },
]

export function categoryFor(maxWs) {
  let best = CATEGORIES[0]
  for (const c of CATEGORIES) if (maxWs >= c.min) best = c
  return best
}
