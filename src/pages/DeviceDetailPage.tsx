import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BatteryMedium,
  Droplets,
  Gauge,
  KeyRound,
  RadioTower,
  Ruler,
  Waves,
  Wind,
} from "lucide-react"
import api from "@/lib/api"
import type { Device, TelemetryPoint } from "@/lib/types"
import { PageHeader, Kpi } from "@/components/PageParts"
import { StatusBadge } from "@/components/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { battery, dateTime, num, pretty, label, shortTime } from "@/lib/format"
import { MonitoringModelConfig, SITE_CONDITIONS } from "./DeviceModelConfig"

export default function DeviceDetailPage() {
  const { id } = useParams()
  const d = useQuery({
    queryKey: ["device", id],
    queryFn: async () => (await api.get<Device>(`/devices/${id}`)).data,
    refetchInterval: 20_000,
  })
  const h = useQuery({
    queryKey: ["history", id],
    queryFn: async () => (await api.get<TelemetryPoint[]>(`/devices/${id}/telemetry`)).data,
    refetchInterval: 20_000,
  })

  if (!d.data) return <div>Loading device…</div>

  const v = d.data
  const latest = v.latest
  const rows = [...(h.data ?? [])].reverse()

  return (
    <>
      <PageHeader
        title={v.name}
        description={`${v.deviceCode} · ${v.councilName} · ${label(v.modelCategory)}`}
        action={<StatusBadge status={v.status} />}
      />

      <div className="metric-grid">
        {v.deviceType === "SMART_DRAIN" ? (
          <>
            <Kpi label="Water depth" value={num(latest?.waterDepthCm, " cm")} icon={<Droplets size={18} />} />
            <Kpi label="Water level" value={num(latest?.waterLevelMm, " mm")} icon={<Waves size={18} />} />
            <Kpi label="Velocity" value={num(latest?.velocityMps, " m/s", 3)} icon={<Wind size={18} />} />
            <Kpi label="Flow rate" value={num(latest?.flowRateLps, " L/s", 2)} icon={<Gauge size={18} />} />
          </>
        ) : (
          <Kpi label="Bin fill" value={num(latest?.binFillPercent, "%")} icon={<Gauge size={18} />} />
        )}
        <Kpi
          label="Battery"
          value={battery(latest?.batteryPercent, latest?.batteryVoltage)}
          icon={<BatteryMedium size={18} />}
        />
        <Kpi label="Signal" value={num(latest?.signalRssi, "", 0)} icon={<RadioTower size={18} />} />
      </div>

      {v.deviceType === "SMART_DRAIN" && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Calculated hydraulic values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricTile label="Sensor distance (D)" value={num(latest?.distanceCm, " cm", 2)} />
                <MetricTile label="Water depth (d)" value={num(latest?.waterDepthCm, " cm", 2)} />
                <MetricTile label="Area (A)" value={num(latest?.crossSectionAreaM2, " m²", 5)} />
                <MetricTile label="Wetted perimeter (P)" value={num(latest?.wettedPerimeterM, " m", 4)} />
                <MetricTile label="Hydraulic radius (R)" value={num(latest?.hydraulicRadiusM, " m", 5)} />
                <MetricTile label="Flow rate (Q)" value={num(latest?.flowRateLps, " L/s", 2)} />
              </div>
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                <b className="text-slate-800">Server calculation:</b> depth = drain height − measured distance; A = width × depth; P = width + 2 × depth; R = A/P; velocity is calculated using Manning&apos;s equation with n = 0.015 and slope = 100/9144.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Drain geometry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info l="Drain / sensor height" v={num(v.drainHeightCm, " cm", 1)} />
              <Info l="Internal width" v={num(v.drainWidthCm, " cm", 1)} />
              <Info l="Latest sensor distance" v={num(latest?.distanceCm, " cm", 2)} />
              <Info l="Latest reading ID" v={latest?.externalReadingId == null ? "—" : String(latest.externalReadingId)} />
              <Info l="Recorded at" v={dateTime(latest?.recordedAt)} />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>{v.deviceType === "SMART_DRAIN" ? "Hydraulic telemetry history" : "Bin fill history"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer>
                {v.deviceType === "SMART_DRAIN" ? (
                  <LineChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="recordedAt" tickFormatter={shortTime} minTickGap={35} tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip labelFormatter={(l) => shortTime(String(l))} />
                    <Legend />
                    <Line type="monotone" dataKey="waterDepthCm" name="Depth cm" stroke="#059669" dot={false} />
                    <Line type="monotone" dataKey="flowRateLps" name="Flow L/s" stroke="#0284c7" dot={false} />
                    <Line type="monotone" dataKey="velocityMps" name="Velocity m/s" stroke="#7c3aed" dot={false} />
                  </LineChart>
                ) : (
                  <AreaChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="recordedAt" tickFormatter={shortTime} minTickGap={35} tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip labelFormatter={(l) => shortTime(String(l))} />
                    <Area type="monotone" dataKey="binFillPercent" stroke="#059669" fill="#d1fae5" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info l="Type" v={label(v.deviceType)} />
            <Info l="Model" v={label(v.modelCategory)} />
            <Info
              l="Site-Specific Condition"
              v={SITE_CONDITIONS.find((s) => s.value === (v.siteCondition ?? "NONE"))?.label ?? "None"}
            />
            <Info l="Serial" v={v.serialNumber || "—"} />
            <Info l="Firmware" v={v.firmwareVersion || "—"} />
            <Info l="Installed" v={dateTime(v.installedAt)} />
            <Info l="Last seen" v={dateTime(v.lastSeenAt)} />
            <Info l="Coordinates" v={`${v.latitude.toFixed(5)}, ${v.longitude.toFixed(5)}`} />
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <KeyRound size={14} /> Device ingest key
              </div>
              <code className="break-all text-xs text-emerald-700">{v.ingestKey}</code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Site-Specific Monitoring Model Configuration */}
      {(v.deviceType === "INLET_FILTER" || v.deviceType === "OPEN_DRAIN_FILTER") && (
        <div className="mt-5">
          <MonitoringModelConfig
            deviceType={v.deviceType}
            condition={v.siteCondition ?? "NONE"}
          />
        </div>
      )}

      {v.deviceType === "SMART_DRAIN" && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Raw sensor & calculation history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-2 py-3">Time</th>
                    <th className="px-2 py-3">Reading ID</th>
                    <th className="px-2 py-3">Distance</th>
                    <th className="px-2 py-3">Depth</th>
                    <th className="px-2 py-3">Area</th>
                    <th className="px-2 py-3">Perimeter</th>
                    <th className="px-2 py-3">Radius</th>
                    <th className="px-2 py-3">Velocity</th>
                    <th className="px-2 py-3">Flow</th>
                    <th className="px-2 py-3">Battery</th>
                    <th className="px-2 py-3">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(h.data ?? [])].slice(0, 30).map((r) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="px-2 py-3 text-xs text-slate-500">{dateTime(r.recordedAt)}</td>
                      <td className="px-2 py-3">{r.externalReadingId ?? "—"}</td>
                      <td className="px-2 py-3">{num(r.distanceCm, " cm", 2)}</td>
                      <td className="px-2 py-3">{num(r.waterDepthCm, " cm", 2)}</td>
                      <td className="px-2 py-3">{num(r.crossSectionAreaM2, " m²", 5)}</td>
                      <td className="px-2 py-3">{num(r.wettedPerimeterM, " m", 4)}</td>
                      <td className="px-2 py-3">{num(r.hydraulicRadiusM, " m", 5)}</td>
                      <td className="px-2 py-3">{num(r.velocityMps, " m/s", 3)}</td>
                      <td className="px-2 py-3 font-semibold">{num(r.flowRateLps, " L/s", 2)}</td>
                      <td className="px-2 py-3">{battery(r.batteryPercent, r.batteryVoltage)}</td>
                      <td className="px-2 py-3">{num(r.signalRssi, "", 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Device health telemetry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="recordedAt" tickFormatter={shortTime} minTickGap={35} tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip labelFormatter={(l) => shortTime(String(l))} />
                <Legend />
                <Line type="monotone" dataKey="batteryVoltage" name="Battery V" stroke="#059669" dot={false} />
                <Line type="monotone" dataKey="batteryPercent" name="Battery %" stroke="#16a34a" dot={false} />
                <Line type="monotone" dataKey="signalRssi" name="Signal" stroke="#0284c7" dot={false} />
                <Line type="monotone" dataKey="temperatureC" name="Temperature °C" stroke="#d97706" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function Info({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
      <span className="text-slate-500">{l}</span>
      <b className="text-right">{v}</b>
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Ruler size={13} /> {label}
      </div>
      <b className="text-base text-slate-900">{value}</b>
    </div>
  )
}
