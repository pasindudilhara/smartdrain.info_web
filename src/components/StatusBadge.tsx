import { Badge } from "./ui/badge"
import { pretty } from "@/lib/format"
import type { DeviceStatus, AlertSeverity, AlertStatus } from "@/lib/types"
export function StatusBadge({ status }: { status: DeviceStatus | AlertStatus }) {
  const tone =
    status === "ONLINE" || status === "RESOLVED"
      ? "green"
      : status === "ADDRESSED"
        ? "green"
        : status === "WARNING" || status === "ACKNOWLEDGED"
          ? "amber"
          : status === "CRITICAL" || status === "OPEN"
            ? "red"
            : "slate"
  return <Badge tone={tone}>{pretty(status)}</Badge>
}
export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <Badge tone={severity === "CRITICAL" ? "red" : "amber"}>{pretty(severity)}</Badge>
}
