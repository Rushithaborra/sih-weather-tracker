import React from 'react'

// Stylised illustration of the "GNN on a sphere" design stage (icosahedral mesh,
// message passing, macro 4D box) -- a diagram of a planned stage, not a rendering
// of running code. Node/mesh positions are a fixed decorative layout, not real data.
const NODES = [
  [40, 55], [58, 40], [78, 48], [95, 38], [112, 50], [130, 42], [148, 55], [30, 80],
  [62, 70], [88, 75], [108, 68], [140, 78], [58, 100], [80, 105], [102, 100], [125, 108],
  [42, 122], [65, 132], [92, 128], [118, 135], [140, 120], [55, 150], [78, 158], [100, 152],
  [122, 160], [40, 100], [150, 95], [35, 140], [145, 145], [88, 40],
]
const CLUSTER = [[82, 92], [100, 86], [96, 104], [112, 96], [84, 108], [104, 112]]
const CLUSTER_EDGES = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 5], [2, 5], [4, 5]]

export default function GnnSphereConcept() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <svg viewBox="0 0 180 200" className="w-[160px] h-[178px] shrink-0">
        <defs>
          <clipPath id="sphereClip">
            <circle cx="90" cy="100" r="78" />
          </clipPath>
        </defs>
        <circle cx="90" cy="100" r="78" fill="none" stroke="var(--line)" strokeWidth="1.5" />
        <g clipPath="url(#sphereClip)" opacity="0.55">
          {[-55, -33, -11, 11, 33, 55].map((dy) => (
            <ellipse key={`lat${dy}`} cx="90" cy={100 + dy} rx="78" ry={14 + Math.abs(dy) * 0.15} fill="none" stroke="var(--muted)" strokeWidth="0.6" />
          ))}
          {[-60, -36, -12, 12, 36, 60].map((dx) => (
            <ellipse key={`lon${dx}`} cx={90 + dx} cy="100" rx={16 + Math.abs(dx) * 0.1} ry="78" fill="none" stroke="var(--muted)" strokeWidth="0.6" />
          ))}
        </g>
        <g clipPath="url(#sphereClip)">
          {NODES.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="var(--muted)" opacity="0.6" />
          ))}
          {CLUSTER_EDGES.map(([a, b], i) => (
            <line key={i} x1={CLUSTER[a][0]} y1={CLUSTER[a][1]} x2={CLUSTER[b][0]} y2={CLUSTER[b][1]} stroke="#E67E22" strokeWidth="1" opacity="0.8" />
          ))}
          {CLUSTER.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.6" fill="#E67E22" />
          ))}
        </g>
        <rect x="72" y="76" width="48" height="44" fill="none" stroke="#C2185B" strokeWidth="1.3" strokeDasharray="4 3" rx="3" />
        <text x="90" y="192" textAnchor="middle" fontSize="9" fill="var(--muted)" fontWeight="600">icosahedral mesh (concept)</text>
      </svg>
      <div className="text-[12px] text-muted leading-relaxed flex-1">
        <ul className="space-y-1 list-disc list-inside">
          <li>Icosahedron refined 6× → 40,962 evenly spaced nodes (GraphCast multi-mesh)</li>
          <li>Message passing spots anomalies with no polar or map-edge distortion</li>
          <li>Dashed box = macro 4D bounding box around a flagged node cluster</li>
        </ul>
        <span className="inline-block mt-2 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-ink900 text-white">
          GraphCast (Lam et al. 2023) · design concept, not implemented
        </span>
      </div>
    </div>
  )
}
