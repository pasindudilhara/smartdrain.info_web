import type { DeviceType, SiteCondition } from "@/lib/types"

export const SITE_CONDITIONS: { value: SiteCondition; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "BACKWATER_AFFECTED", label: "Backwater-affected" },
  { value: "CLOGGING_HOTSPOT", label: "Clogging hotspot" },
  { value: "LITTER_HOTSPOT", label: "Litter hotspot" },
  { value: "UNDULATING_TERRAIN", label: "Undulating terrain" },
  { value: "LOW_LYING_AREA", label: "Low-lying area" },
  { value: "NEAR_A_MARSH", label: "Near a marsh" },
]

interface ModelConfigEntry {
  summary: string
  bullets: string[]
}

type ModelMap = Record<string, Record<string, ModelConfigEntry>>

const MODEL_CONFIG: ModelMap = {
  INLET_FILTER: {
    NONE: {
      summary: "Normal model — daily dashboard update",
      bullets: [
        "Primary metrics: water depth (H), flow rate (Q)",
        "Update frequency: daily",
      ],
    },
    BACKWATER_AFFECTED: {
      summary: "Backwater-sensitive monitoring",
      bullets: [
        "Prioritise water level / depth",
        "Do NOT estimate flow rate (Q) from water depth alone",
        "Monitor rate of water-level rise",
      ],
    },
    CLOGGING_HOTSPOT: {
      summary: "Clogging hotspot — reduced threshold & 2-hourly updates",
      bullets: [
        "Fill / blockage alert threshold: 40%",
        "Update frequency: every 2 hours",
      ],
    },
    LITTER_HOTSPOT: {
      summary: "Litter hotspot — reduced threshold & 2-hourly updates",
      bullets: [
        "Litter / fill alert threshold: 40%",
        "Update frequency: every 2 hours",
      ],
    },
    UNDULATING_TERRAIN: {
      summary: "Terrain factor +15% applied",
      bullets: [
        "Terrain sensitivity factor: +15%",
        "Increased sensitivity to rapid changes in water depth and flow rate",
      ],
    },
    LOW_LYING_AREA: {
      summary: "Low-lying factor +30% applied",
      bullets: [
        "Low-lying sensitivity factor: +30%",
        "Lower water-level alert threshold",
        "Increased importance of rising water levels",
      ],
    },
    NEAR_A_MARSH: {
      summary: "Marsh factor +25% applied",
      bullets: [
        "Marsh / wetland sensitivity factor: +25%",
        "Primary indicators: water level and rate of rise",
        "Consider possible backwater conditions",
      ],
    },
  },
  OPEN_DRAIN_FILTER: {
    NONE: {
      summary: "Normal model — daily dashboard update",
      bullets: [
        "Primary metrics: water depth (H), velocity (V)",
        "Update frequency: daily",
      ],
    },
    BACKWATER_AFFECTED: {
      summary: "Backwater-sensitive monitoring",
      bullets: [
        "Prioritise water level / depth",
        "High water level + low velocity may indicate backwater",
      ],
    },
    CLOGGING_HOTSPOT: {
      summary: "Clogging hotspot — reduced threshold & 2-hourly updates",
      bullets: [
        "Alert threshold: 40%",
        "Update frequency: every 2 hours",
      ],
    },
    LITTER_HOTSPOT: {
      summary: "Litter hotspot — reduced threshold & 2-hourly updates",
      bullets: [
        "Litter / fill alert threshold: 40%",
        "Update frequency: every 2 hours",
      ],
    },
    UNDULATING_TERRAIN: {
      summary: "Terrain factor +15% applied",
      bullets: [
        "Terrain sensitivity factor: +15%",
        "Monitor both water depth and velocity changes",
        "Consider local acceleration and ponding from slope changes",
      ],
    },
    LOW_LYING_AREA: {
      summary: "Low-lying factor +30% applied",
      bullets: [
        "Low-lying sensitivity factor: +30%",
        "Rising water depth treated as critical earlier",
        "Rapid velocity increase may indicate strong incoming flow",
      ],
    },
    NEAR_A_MARSH: {
      summary: "Marsh factor +25% applied",
      bullets: [
        "Marsh / wetland sensitivity factor: +25%",
        "High water levels + low or stagnant velocity indicate possible backwater",
      ],
    },
  },
}

// For types that aren't INLET_FILTER or OPEN_DRAIN_FILTER, show nothing
const SUPPORTED_TYPES: DeviceType[] = ["INLET_FILTER", "OPEN_DRAIN_FILTER"]

export function MonitoringModelConfig({
  deviceType,
  condition,
}: {
  deviceType: DeviceType
  condition: SiteCondition
}) {
  if (!SUPPORTED_TYPES.includes(deviceType)) return null

  const config = MODEL_CONFIG[deviceType]?.[condition]
  if (!config) return null

  const deviceLabel =
    deviceType === "INLET_FILTER" ? "Inlet Filter" : "Open Drain Retrofit"
  const conditionLabel =
    SITE_CONDITIONS.find((s) => s.value === condition)?.label ?? condition

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
        Monitoring Model Configuration
      </div>
      <div className="mb-1 flex flex-wrap gap-3 text-xs text-slate-600">
        <span>
          <b>Device Type:</b> {deviceLabel}
        </span>
        <span>
          <b>Condition:</b> {conditionLabel}
        </span>
      </div>
      <p className="mb-2 text-xs font-semibold text-emerald-900">
        {config.summary}
      </p>
      <ul className="list-disc pl-4 space-y-1">
        {config.bullets.map((b, i) => (
          <li key={i} className="text-xs text-slate-700">
            {b}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-slate-400 italic">
        Note: Actual calculations, thresholds and alert generation are applied by the backend monitoring engine.
      </p>
    </div>
  )
}
