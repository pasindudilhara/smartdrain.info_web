import { useEffect, useRef } from "react"
import L from "leaflet"
import type { Device } from "@/lib/types"
import { battery, num, pretty } from "@/lib/format"
import { cn } from "@/lib/utils"

const colors: Record<string, string> = {
  ONLINE: "#16a34a",
  WARNING: "#f59e0b",
  CRITICAL: "#ef4444",
  OFFLINE: "#64748b",
  MAINTENANCE: "#8b5cf6",
}

const statusLabels: Record<string, string> = {
  ONLINE: "Online",
  WARNING: "Warning",
  CRITICAL: "Critical",
  OFFLINE: "Offline",
  MAINTENANCE: "Maintenance",
}

export function DeviceMap({
  devices,
  onSelect,
  height = 520,
  className,
  selectedDeviceId,
  fullBleed = false,
}: {
  devices: Device[]
  onSelect?: (d: Device) => void
  height?: number | string
  className?: string
  selectedDeviceId?: number | null
  fullBleed?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const map = L.map(ref.current, {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    }).setView([7.3, 80.7], 7)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: "bottomright" }).addTo(map)

    const bounds: L.LatLngExpression[] = []

    devices.forEach((d) => {
      bounds.push([d.latitude, d.longitude])
      const color = colors[d.status] ?? colors.OFFLINE
      const selected = selectedDeviceId === d.id
      const isBin = d.deviceType === "SMART_DRAIN_BIN"

      const icon = L.divIcon({
        className: "smartdrain-marker-shell",
        html: `<div class="smartdrain-marker ${selected ? "is-selected" : ""}" style="--marker-color:${color}">
          <div class="smartdrain-marker-core">
            ${isBin ? "<span class='smartdrain-marker-bin'>▣</span>" : "<span class='smartdrain-marker-drain'>≈</span>"}
          </div>
          <span class="smartdrain-marker-pulse"></span>
        </div>`,
        iconSize: selected ? [42, 42] : [34, 34],
        iconAnchor: selected ? [21, 21] : [17, 17],
      })

      const tel = d.latest
      const popup = `<div class="smartdrain-map-popup">
        <div class="smartdrain-popup-head">
          <div>
            <strong>${escapeHtml(d.name)}</strong>
            <span>${escapeHtml(d.councilName)}</span>
          </div>
          <em style="color:${color}">${statusLabels[d.status] ?? d.status}</em>
        </div>
        <div class="smartdrain-popup-meta">${pretty(d.modelCategory)} · ${pretty(d.deviceType)}</div>
        <div class="smartdrain-popup-grid">
          ${d.deviceType === "SMART_DRAIN"
            ? `<span><small>Depth</small><b>${num(tel?.waterDepthCm, " cm")}</b></span>
               <span><small>Velocity</small><b>${num(tel?.velocityMps, " m/s", 2)}</b></span>
               <span><small>Flow</small><b>${num(tel?.flowRateLps, " L/s")}</b></span>`
            : `<span><small>Bin fill</small><b>${num(tel?.binFillPercent, "%")}</b></span>`}
          <span><small>Battery</small><b>${battery(tel?.batteryPercent, tel?.batteryVoltage)}</b></span>
        </div>
      </div>`

      L.marker([d.latitude, d.longitude], { icon })
        .addTo(map)
        .bindPopup(popup, { closeButton: false, offset: [0, -12], maxWidth: 310 })
        .on("click", () => onSelect?.(d))
    })

    if (bounds.length) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, {
        paddingTopLeft: fullBleed ? [40, 130] : [30, 30],
        paddingBottomRight: fullBleed ? [60, 70] : [30, 30],
        maxZoom: 13,
      })
    }

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 80)
    return () => {
      window.clearTimeout(resizeTimer)
      map.remove()
    }
  }, [devices, onSelect, selectedDeviceId, fullBleed])

  return (
    <div
      ref={ref}
      style={{ height }}
      className={cn(
        fullBleed
          ? "h-full w-full bg-slate-100"
          : "overflow-hidden rounded-2xl border border-slate-200 bg-slate-100",
        className,
      )}
    />
  )
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}
