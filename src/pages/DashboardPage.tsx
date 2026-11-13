import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  BellRing,
  Building2,
  CheckCircle2,
  RadioTower,
  Wifi,
  WifiOff,
  AlertTriangle,
  Leaf,
} from "lucide-react"
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"
import type { Dashboard, DeviceStatus, Device } from "@/lib/types"
import { PageHeader, Kpi } from "@/components/PageParts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge, SeverityBadge } from "@/components/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { dateTime, pretty, label } from "@/lib/format"
import { useAuth } from "@/lib/auth"

const STATUS_COLORS: Record<DeviceStatus, string> = {
  ONLINE: "#059669",
  WARNING: "#d97706",
  CRITICAL: "#dc2626",
  OFFLINE: "#64748b",
  MAINTENANCE: "#7c3aed",
}

export default function DashboardPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const q = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<Dashboard>("/dashboard")).data,
    refetchInterval: 20000,
  })
  const d = q.data

  if (!d)
    return (
      <div className="animate-pulse text-slate-400">Loading dashboard…</div>
    )

  // ── Derived device-type counts (from full devices list if available) ──
  const pieData = (d.statusCounts ?? []).map((s) => ({
    name: pretty(s.status),
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "#64748b",
  }))

  // ── Network Status summary ──
  const totalDevices = d.devices
  const onlineCount = d.online
  const offlineCount = d.offline
  const criticalCount = d.critical
  const warningCount = d.warning

  return (
    <>
      <PageHeader
        title={
          user?.role === "SUPER_ADMIN"
            ? "Network overview"
            : "Council operations overview"
        }
        description="Live operational health across the Smart Drain Flood & Waste Intelligence network."
      />

      {/* ── KPI Row ── */}
      <div className="metric-grid">
        <Kpi
          label={user?.role === "SUPER_ADMIN" ? "Councils" : "Devices"}
          value={user?.role === "SUPER_ADMIN" ? d.councils : d.devices}
          icon={
            user?.role === "SUPER_ADMIN" ? (
              <Building2 size={19} />
            ) : (
              <RadioTower size={19} />
            )
          }
        />
        <Kpi
          label="Monitoring Hot Spots"
          value={d.online}
          sub={`${d.devices} total`}
          icon={<Activity size={19} />}
        />
        <Kpi
          label="Critical Alerts"
          value={d.openAlerts}
          sub={`${d.critical} critical devices`}
          icon={<BellRing size={19} />}
        />
        <Kpi
          label="Alerts Attended To (Past 24 Hours)"
          value={d.alertsAddressed24h ?? "—"}
          sub={d.alertsAddressed24h == null ? "Backend update required" : "alerts addressed"}
          icon={<CheckCircle2 size={19} />}
        />
      </div>

      {/* ── Device Type Clickable Counts ── */}
      <DeviceTypeCounts />

      {/* ── Charts Row ── */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        {/* UPDATE 1: Pie chart for Device Status */}
        <Card>
          <CardHeader>
            <CardTitle>Device status</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-slate-400">
                No device status data available.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} devices`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* UPDATE 2: Network Status (replaces avg water level) */}
        <Card>
          <CardHeader>
            <CardTitle>Network status</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary tiles */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <NetworkTile
                icon={<Wifi size={16} className="text-emerald-600" />}
                label="Online"
                value={onlineCount}
                total={totalDevices}
                color="emerald"
              />
              <NetworkTile
                icon={<AlertTriangle size={16} className="text-amber-500" />}
                label="Warning"
                value={warningCount}
                total={totalDevices}
                color="amber"
              />
              <NetworkTile
                icon={<AlertTriangle size={16} className="text-red-500" />}
                label="Critical"
                value={criticalCount}
                total={totalDevices}
                color="red"
              />
              <NetworkTile
                icon={<WifiOff size={16} className="text-slate-400" />}
                label="Offline"
                value={offlineCount}
                total={totalDevices}
                color="slate"
              />
            </div>
            {/* Model counts */}
            <div className="space-y-3">
              {d.modelCounts.map((m) => (
                <div
                  key={m.model}
                  className="flex justify-between border-b border-slate-100 pb-3 text-sm"
                >
                  <span className="text-slate-600">{label(m.model)}</span>
                  <b>{m.count}</b>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Alerts ── */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Recent alerts</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="divide-y divide-slate-100">
            {d.recentAlerts.length === 0 ? (
              <div className="py-6 text-sm text-slate-500">
                No recent alerts.
              </div>
            ) : (
              d.recentAlerts.map((a) => (
                <div
                  key={a.id}
                  className="grid gap-2 py-3 md:grid-cols-[130px_1fr_150px_150px_auto] md:items-center"
                >
                  <SeverityBadge severity={a.severity} />
                  <div>
                    <b className="text-sm">{a.deviceName}</b>
                    <p className="text-xs text-slate-500">{a.message}</p>
                  </div>
                  <StatusBadge status={a.status} />
                  <span className="text-xs text-slate-400">
                    {dateTime(a.createdAt)}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${a.deviceLatitude},${a.deviceLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100 transition-colors"
                  >
                    Map
                  </a>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ── UPDATE 3: Clickable Device Type Counts ──
function DeviceTypeCounts() {
  const nav = useNavigate()
  const devices = useQuery({
    queryKey: ["devices"],
    queryFn: async () => (await api.get<Device[]>("/devices")).data,
  })

  const counts = useMemo(() => {
    const all = devices.data ?? []
    return {
      openDrainRetrofit: all.filter((d) => d.deviceType === "OPEN_DRAIN_FILTER").length,
      inletFilter: all.filter((d) => d.deviceType === "INLET_FILTER").length,
    }
  }, [devices.data])

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
      <button
        onClick={() => nav("/app/devices?type=OPEN_DRAIN_FILTER")}
        className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-400 hover:shadow-md transition-all group"
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 transition-colors">
          Open Drain Retrofits
        </div>
        <div className="mt-2 text-3xl font-bold text-slate-900">
          {devices.isLoading ? "…" : counts.openDrainRetrofit}
        </div>
        <div className="mt-1 text-xs text-slate-400">Click to view →</div>
      </button>
      <button
        onClick={() => nav("/app/devices?type=INLET_FILTER")}
        className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-400 hover:shadow-md transition-all group"
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 transition-colors">
          Inlet Filters
        </div>
        <div className="mt-2 text-3xl font-bold text-slate-900">
          {devices.isLoading ? "…" : counts.inletFilter}
        </div>
        <div className="mt-1 text-xs text-slate-400">Click to view →</div>
      </button>
    </div>
  )
}

// ── Network Tile Helper ──
function NetworkTile({
  icon,
  label: lbl,
  value,
  total,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  total: number
  color: "emerald" | "amber" | "red" | "slate"
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const bg = {
    emerald: "bg-emerald-50",
    amber: "bg-amber-50",
    red: "bg-red-50",
    slate: "bg-slate-50",
  }[color]

  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 ${bg}`}>
      {icon}
      <div>
        <div className="text-xs text-slate-500">{lbl}</div>
        <div className="text-lg font-bold text-slate-900">
          {value}
          <span className="ml-1 text-xs font-normal text-slate-400">
            ({pct}%)
          </span>
        </div>
      </div>
    </div>
  )
}
