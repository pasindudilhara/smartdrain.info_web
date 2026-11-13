export const pretty = (v: string) =>
  v.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

// Label overrides: display label for backend enum values without changing the enum
const LABEL_OVERRIDES: Record<string, string> = {
  UNDERGROUND_DRAINS: "Closed Drains",
  OPEN_DRAIN_FILTER: "Open Drain Retrofit",
}

export const label = (v: string) => LABEL_OVERRIDES[v] ?? pretty(v)

export const num = (v: number | null | undefined, unit = "", digits = 1) =>
  v == null ? "—" : `${v.toFixed(digits)}${unit}`

export const battery = (percent: number | null | undefined, voltage: number | null | undefined) => {
  if (percent != null) return `${percent.toFixed(0)}%`
  if (voltage != null) return `${voltage.toFixed(3)} V`
  return "—"
}

export const dateTime = (v: string | null | undefined) => (v ? new Date(v).toLocaleString() : "—")

export const shortTime = (v: string) =>
  new Date(v).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
