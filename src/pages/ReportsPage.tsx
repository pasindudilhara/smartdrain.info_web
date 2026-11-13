import { useMemo, useRef, useState } from "react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas-pro"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  AlertTriangle,
  BatteryMedium,
  Building2,
  Calendar,
  ChevronDown,
  Download,
  FileText,
  Loader2,
  Printer,
  RadioTower,
  RefreshCw,
  Waves,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import api from "@/lib/api"
import type {
  Alert,
  Analytics,
  Council,
  Dashboard,
  Device,
} from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/PageParts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, Select } from "@/components/ui/input"
import { StatusBadge, SeverityBadge } from "@/components/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { battery, dateTime, num, pretty, shortTime } from "@/lib/format"

/* ─────────── Types ─────────── */
type ReportType = "device_health" | "alert_history" | "hydraulic_analytics" | "council_performance"
type DateRange = "24h" | "7d" | "30d" | "90d"

const REPORT_TYPES: { value: ReportType; label: string; icon: React.ElementType; description: string }[] = [
  { value: "device_health", label: "Device Health Summary", icon: RadioTower, description: "Current status, battery, water levels for all devices" },
  { value: "alert_history", label: "Alert History", icon: AlertTriangle, description: "Alert events filtered by date range and severity" },
  { value: "hydraulic_analytics", label: "Hydraulic Analytics", icon: Waves, description: "Water level, flow rate and velocity trend analysis" },
  { value: "council_performance", label: "Council Performance", icon: Building2, description: "Per-council KPIs and device health comparison" },
]

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
]

const COLORS = ["#059669", "#0284c7", "#d97706", "#dc2626", "#7c3aed", "#64748b", "#0f766e"]

function hoursFromRange(r: DateRange) {
  return r === "24h" ? 24 : r === "7d" ? 168 : r === "30d" ? 720 : 2160
}

/* ─────────── Main Component ─────────── */
export default function ReportsPage() {
  const { user } = useAuth()
  const printRef = useRef<HTMLDivElement>(null)

  const [reportType, setReportType] = useState<ReportType>("device_health")
  const [dateRange, setDateRange] = useState<DateRange>("7d")
  const [downloading, setDownloading] = useState(false)
  const [councilFilter, setCouncilFilter] = useState<string>("all")
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)

  /* ── Queries ── */
  const dashboardQ = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<Dashboard>("/dashboard")).data,
    enabled: generated,
  })

  const devicesQ = useQuery({
    queryKey: ["devices"],
    queryFn: async () => (await api.get<Device[]>("/devices")).data,
    enabled: generated,
  })

  const alertsQ = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await api.get<Alert[]>("/alerts")).data,
    enabled: generated,
  })

  const analyticsQ = useQuery({
    queryKey: ["analytics", dateRange],
    queryFn: async () =>
      (await api.get<Analytics>(`/analytics?hours=${hoursFromRange(dateRange)}`)).data,
    enabled: generated,
  })

  const councilsQ = useQuery({
    queryKey: ["councils"],
    enabled: user?.role === "SUPER_ADMIN",
    queryFn: async () => (await api.get<Council[]>("/admin/councils")).data,
  })

  /* ── Derived data ── */
  const filteredDevices = useMemo(() => {
    if (!devicesQ.data) return []
    if (councilFilter === "all") return devicesQ.data
    return devicesQ.data.filter((d) => String(d.councilId) === councilFilter)
  }, [devicesQ.data, councilFilter])

  const filteredAlerts = useMemo(() => {
    if (!alertsQ.data) return []
    const cutoff = new Date(Date.now() - hoursFromRange(dateRange) * 3600000)
    let list = alertsQ.data.filter((a) => new Date(a.createdAt) >= cutoff)
    if (councilFilter !== "all") list = list.filter((a) => String(a.councilId) === councilFilter)
    return list
  }, [alertsQ.data, dateRange, councilFilter])

  const isLoading =
    generated &&
    (dashboardQ.isLoading || devicesQ.isLoading || alertsQ.isLoading || analyticsQ.isLoading)

  /* ── Generate ── */
  function handleGenerate() {
    setGenerating(true)
    setGenerated(true)
    setTimeout(() => setGenerating(false), 800)
  }

  /* ── Download PDF ── */
  async function handleDownloadPDF() {
    const el = document.getElementById("report-printable")
    if (!el) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2
      const imgWidth = usableWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = margin
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
      heightLeft -= usableHeight
      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft) + margin
        pdf.addPage()
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
        heightLeft -= usableHeight
      }
      const fileName = `smartdrain_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error("PDF generation failed:", err)
      // Fallback to browser print
      window.print()
    } finally {
      setDownloading(false)
    }
  }

  /* ── CSV export ── */
  function handleCSV() {
    let csv = ""
    if (reportType === "device_health") {
      csv = "Name,Code,Council,Model,Type,Status,Battery,Water Depth (cm),Last Seen\n"
      filteredDevices.forEach((d) => {
        csv += `"${d.name}","${d.deviceCode}","${d.councilName}","${pretty(d.modelCategory)}","${pretty(d.deviceType)}","${d.status}","${battery(d.latest?.batteryPercent, d.latest?.batteryVoltage)}","${num(d.latest?.waterDepthCm, "", 1)}","${dateTime(d.lastSeenAt)}"\n`
      })
    } else if (reportType === "alert_history") {
      csv = "Device,Council,Type,Severity,Status,Message,Created At\n"
      filteredAlerts.forEach((a) => {
        csv += `"${a.deviceName}","${a.councilName}","${pretty(a.alertType)}","${a.severity}","${a.status}","${a.message}","${dateTime(a.createdAt)}"\n`
      })
    }
    if (!csv) return
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `smartdrain_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const selectedReport = REPORT_TYPES.find((r) => r.value === reportType)!
  const now = new Date().toLocaleString()

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate, preview & download operational reports for the SmartDrain network."
      />

      <div className="report-layout">
        {/* ─── Config Panel ─── */}
        <div className="report-config no-print">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                Report configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Report type */}
              <Field label="Report type">
                <Select
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value as ReportType)
                    setGenerated(false)
                  }}
                >
                  {REPORT_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>

              {/* Active report type card */}
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                <selectedReport.icon size={20} className="mt-0.5 shrink-0 text-emerald-700" />
                <div>
                  <b className="text-sm text-emerald-900">{selectedReport.label}</b>
                  <p className="mt-0.5 text-xs text-emerald-700/70">{selectedReport.description}</p>
                </div>
              </div>

              {/* Date range */}
              <Field label="Date range">
                <Select
                  value={dateRange}
                  onChange={(e) => {
                    setDateRange(e.target.value as DateRange)
                    setGenerated(false)
                  }}
                >
                  {DATE_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>

              {/* Council filter (Super Admin only) */}
              {user?.role === "SUPER_ADMIN" && (
                <Field label="Council">
                  <Select
                    value={councilFilter}
                    onChange={(e) => {
                      setCouncilFilter(e.target.value)
                      setGenerated(false)
                    }}
                  >
                    <option value="all">All councils</option>
                    {councilsQ.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              {/* Generate button */}
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Generating…
                  </>
                ) : generated ? (
                  <>
                    <RefreshCw size={16} /> Regenerate report
                  </>
                ) : (
                  <>
                    <FileText size={16} /> Generate report
                  </>
                )}
              </Button>

              {/* Export buttons */}
              {generated && !isLoading && (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Generating PDF…
                      </>
                    ) : (
                      <>
                        <Download size={15} /> Download PDF
                      </>
                    )}
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                      <Printer size={15} /> Print
                    </Button>
                    {(reportType === "device_health" || reportType === "alert_history") && (
                      <Button variant="outline" className="flex-1" onClick={handleCSV}>
                        <Download size={15} /> CSV
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Report Preview ─── */}
        <div className="report-preview" ref={printRef}>
          {!generated ? (
            <EmptyState />
          ) : isLoading || generating ? (
            <LoadingState />
          ) : (
            <div className="report-paper" id="report-printable">
              {/* Report header */}
              <ReportHeader
                title={selectedReport.label}
                dateRange={DATE_RANGES.find((r) => r.value === dateRange)!.label}
                councilName={
                  councilFilter === "all"
                    ? "All councils"
                    : councilsQ.data?.find((c) => String(c.id) === councilFilter)?.name ??
                      user?.councilName ??
                      ""
                }
                generatedAt={now}
              />

              {/* Report body */}
              {reportType === "device_health" && (
                <DeviceHealthReport
                  devices={filteredDevices}
                  dashboard={dashboardQ.data!}
                />
              )}

              {reportType === "alert_history" && (
                <AlertHistoryReport
                  alerts={filteredAlerts}
                  dateRange={DATE_RANGES.find((r) => r.value === dateRange)!.label}
                />
              )}

              {reportType === "hydraulic_analytics" && analyticsQ.data && (
                <HydraulicAnalyticsReport
                  analytics={analyticsQ.data}
                  dateRange={DATE_RANGES.find((r) => r.value === dateRange)!.label}
                />
              )}

              {reportType === "council_performance" && analyticsQ.data && (
                <CouncilPerformanceReport
                  analytics={analyticsQ.data}
                  dashboard={dashboardQ.data!}
                  devices={filteredDevices}
                />
              )}

              {/* Report footer */}
              <ReportFooter generatedAt={now} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════
   Report Header
   ═══════════════════════════════════════════════ */
function ReportHeader({
  title,
  dateRange,
  councilName,
  generatedAt,
}: {
  title: string
  dateRange: string
  councilName: string
  generatedAt: string
}) {
  return (
    <div className="report-header">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <FileText size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">SmartDrain Operations Report</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Calendar size={13} /> {dateRange}
        </span>
        <span className="flex items-center gap-1.5">
          <Building2 size={13} /> {councilName}
        </span>
        <span className="flex items-center gap-1.5">
          <FileText size={13} /> Generated {generatedAt}
        </span>
      </div>
      <div className="mt-4 h-px bg-gradient-to-r from-emerald-200 via-emerald-300 to-transparent" />
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Report Footer
   ═══════════════════════════════════════════════ */
function ReportFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <div className="mt-8 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>SmartDrain — Urban Operations Platform</span>
        <span>Generated {generatedAt}</span>
      </div>
      <p className="mt-1 text-[10px] text-slate-300">
        This report is automatically generated from live telemetry data. Values may differ from final audited figures.
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Empty State
   ═══════════════════════════════════════════════ */
function EmptyState() {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-inner">
        <FileText size={36} className="text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700">No report generated</h3>
      <p className="mt-2 max-w-xs text-sm text-slate-400">
        Configure your report options and click <b>Generate report</b> to preview the results here.
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Loading State
   ═══════════════════════════════════════════════ */
function LoadingState() {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100">
        <Loader2 size={36} className="animate-spin text-emerald-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700">Generating report…</h3>
      <p className="mt-2 text-sm text-slate-400">Fetching live data from the SmartDrain network.</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   1) Device Health Report
   ═══════════════════════════════════════════════ */
function DeviceHealthReport({
  devices,
  dashboard,
}: {
  devices: Device[]
  dashboard: Dashboard
}) {
  const onlineCount = devices.filter((d) => d.status === "ONLINE").length
  const warningCount = devices.filter((d) => d.status === "WARNING").length
  const criticalCount = devices.filter((d) => d.status === "CRITICAL").length
  const offlineCount = devices.filter((d) => d.status === "OFFLINE").length

  const statusData = [
    { status: "Online", count: onlineCount },
    { status: "Warning", count: warningCount },
    { status: "Critical", count: criticalCount },
    { status: "Offline", count: offlineCount },
  ]

  const statusColors = ["#059669", "#d97706", "#dc2626", "#64748b"]

  return (
    <div className="mt-6 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniKpi label="Total devices" value={devices.length} color="emerald" />
        <MiniKpi label="Online" value={onlineCount} color="emerald" />
        <MiniKpi label="Warning" value={warningCount} color="amber" />
        <MiniKpi label="Critical" value={criticalCount} color="red" />
      </div>

      {/* Status pie chart */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
        <h4 className="mb-3 text-sm font-semibold text-slate-700">Device status distribution</h4>
        <div className="h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="status"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={statusColors[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2.5">Device</th>
              <th className="px-3 py-2.5">Council</th>
              <th className="px-3 py-2.5">Model</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Battery</th>
              <th className="px-3 py-2.5">Water depth</th>
              <th className="px-3 py-2.5">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="border-b border-slate-50">
                <td className="px-3 py-2.5">
                  <b className="text-slate-800">{d.name}</b>
                  <div className="text-xs text-slate-400">{d.deviceCode}</div>
                </td>
                <td className="px-3 py-2.5 text-slate-600">{d.councilName}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={d.modelCategory === "DEVELOPED_COUNTRY_MODEL" ? "blue" : "purple"}>
                    {pretty(d.modelCategory)}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-3 py-2.5">
                  {battery(d.latest?.batteryPercent, d.latest?.batteryVoltage)}
                </td>
                <td className="px-3 py-2.5">
                  {d.deviceType === "SMART_DRAIN"
                    ? num(d.latest?.waterDepthCm, " cm")
                    : num(d.latest?.binFillPercent, "%")}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-400">{dateTime(d.lastSeenAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-400">
        Showing {devices.length} device{devices.length !== 1 ? "s" : ""} · Average network battery:{" "}
        {dashboard.avgBattery.toFixed(0)}%
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   2) Alert History Report
   ═══════════════════════════════════════════════ */
function AlertHistoryReport({
  alerts,
  dateRange,
}: {
  alerts: Alert[]
  dateRange: string
}) {
  const openCount = alerts.filter((a) => a.status === "OPEN").length
  const ackCount = alerts.filter((a) => a.status === "ACKNOWLEDGED").length
  const resolvedCount = alerts.filter((a) => a.status === "RESOLVED").length
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length

  // Alerts by type
  const typeCounts: Record<string, number> = {}
  alerts.forEach((a) => {
    typeCounts[a.alertType] = (typeCounts[a.alertType] || 0) + 1
  })
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({ type: pretty(type), count }))

  return (
    <div className="mt-6 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniKpi label="Total alerts" value={alerts.length} color="slate" />
        <MiniKpi label="Open" value={openCount} color="red" />
        <MiniKpi label="Acknowledged" value={ackCount} color="amber" />
        <MiniKpi label="Resolved" value={resolvedCount} color="emerald" />
      </div>

      {/* Alert type chart */}
      {typeData.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Alerts by type</h4>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#dc2626" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Severity breakdown */}
      <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 text-sm text-amber-900">
        <b>Severity breakdown:</b> {criticalCount} critical · {alerts.length - criticalCount} warning
        <span className="ml-3 text-xs text-amber-600">({dateRange})</span>
      </div>

      {/* Alert table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2.5">Severity</th>
              <th className="px-3 py-2.5">Device</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Message</th>
              <th className="px-3 py-2.5">Created</th>
            </tr>
          </thead>
          <tbody>
            {alerts.slice(0, 100).map((a) => (
              <tr key={a.id} className="border-b border-slate-50">
                <td className="px-3 py-2.5">
                  <SeverityBadge severity={a.severity} />
                </td>
                <td className="px-3 py-2.5">
                  <b className="text-slate-800">{a.deviceName}</b>
                  <div className="text-xs text-slate-400">{a.councilName}</div>
                </td>
                <td className="px-3 py-2.5">{pretty(a.alertType)}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={a.status} />
                </td>
                <td className="max-w-[220px] truncate px-3 py-2.5 text-xs text-slate-500">
                  {a.message}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-400">{dateTime(a.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-400">
        Showing {Math.min(alerts.length, 100)} of {alerts.length} alert
        {alerts.length !== 1 ? "s" : ""} in {dateRange.toLowerCase()}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   3) Hydraulic Analytics Report
   ═══════════════════════════════════════════════ */
function HydraulicAnalyticsReport({
  analytics,
  dateRange,
}: {
  analytics: Analytics
  dateRange: string
}) {
  const timeline = analytics.timeline

  // Compute averages
  const avgWater =
    timeline.reduce((s, t) => s + (t.waterLevel ?? 0), 0) /
    Math.max(timeline.filter((t) => t.waterLevel != null).length, 1)
  const avgFlow =
    timeline.reduce((s, t) => s + (t.flowRate ?? 0), 0) /
    Math.max(timeline.filter((t) => t.flowRate != null).length, 1)
  const avgVelocity =
    timeline.reduce((s, t) => s + (t.velocity ?? 0), 0) /
    Math.max(timeline.filter((t) => t.velocity != null).length, 1)
  const avgTemp =
    timeline.reduce((s, t) => s + (t.temperature ?? 0), 0) /
    Math.max(timeline.filter((t) => t.temperature != null).length, 1)

  return (
    <div className="mt-6 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniKpi label="Avg water level" value={`${avgWater.toFixed(0)} mm`} color="emerald" />
        <MiniKpi label="Avg flow rate" value={`${avgFlow.toFixed(2)} L/s`} color="blue" />
        <MiniKpi label="Avg velocity" value={`${avgVelocity.toFixed(3)} m/s`} color="purple" />
        <MiniKpi label="Avg temperature" value={`${avgTemp.toFixed(1)} °C`} color="amber" />
      </div>

      {/* Water level & flow chart */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
        <h4 className="mb-3 text-sm font-semibold text-slate-700">
          Water level & flow rate ({dateRange.toLowerCase()})
        </h4>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={shortTime} minTickGap={35} tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip labelFormatter={(l) => shortTime(String(l))} />
              <Legend />
              <Line dataKey="waterLevel" name="Water level (mm)" stroke="#059669" dot={false} />
              <Line dataKey="flowRate" name="Flow rate (L/s)" stroke="#0284c7" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Velocity & temperature chart */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
        <h4 className="mb-3 text-sm font-semibold text-slate-700">Velocity & temperature</h4>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={shortTime} minTickGap={35} tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip labelFormatter={(l) => shortTime(String(l))} />
              <Legend />
              <Line dataKey="velocity" name="Velocity (m/s)" stroke="#7c3aed" dot={false} />
              <Line dataKey="temperature" name="Temperature (°C)" stroke="#d97706" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model & status distribution */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Device model distribution</h4>
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={analytics.modelDistribution}
                  dataKey="count"
                  nameKey="model"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {analytics.modelDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, pretty(String(n))]} />
                <Legend formatter={pretty} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Alert type breakdown</h4>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={analytics.alertsByType}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="type" tickFormatter={pretty} tick={{ fontSize: 9 }} />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={(l) => pretty(String(l))} />
                <Bar dataKey="count" fill="#dc2626" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        Based on {timeline.length} data points over {dateRange.toLowerCase()}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   4) Council Performance Report
   ═══════════════════════════════════════════════ */
function CouncilPerformanceReport({
  analytics,
  dashboard,
  devices,
}: {
  analytics: Analytics
  dashboard: Dashboard
  devices: Device[]
}) {
  const councils = analytics.councils

  // Council bar chart data
  const councilChartData = councils.map((c) => ({
    name: c.councilName.length > 16 ? c.councilName.slice(0, 14) + "…" : c.councilName,
    fullName: c.councilName,
    devices: c.devices,
    alerts: c.openAlerts,
    battery: c.avgBattery,
  }))

  return (
    <div className="mt-6 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniKpi label="Total councils" value={councils.length} color="emerald" />
        <MiniKpi label="Total devices" value={dashboard.devices} color="blue" />
        <MiniKpi label="Open alerts" value={dashboard.openAlerts} color="red" />
        <MiniKpi label="Avg battery" value={`${dashboard.avgBattery.toFixed(0)}%`} color="amber" />
      </div>

      {/* Council comparison chart */}
      {councilChartData.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Council device & alert comparison</h4>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={councilChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName ?? ""
                  }
                />
                <Legend />
                <Bar dataKey="devices" name="Devices" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alerts" name="Open alerts" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Council cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {councils.map((c) => (
          <div
            key={c.councilId}
            className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Building2 size={16} />
              </div>
              <b className="text-sm text-slate-800">{c.councilName}</b>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="block text-slate-400">Devices</span>
                <b className="text-base">{c.devices}</b>
              </div>
              <div>
                <span className="block text-slate-400">Alerts</span>
                <b className="text-base text-red-600">{c.openAlerts}</b>
              </div>
              <div>
                <span className="block text-slate-400">Battery</span>
                <b className="text-base">{c.avgBattery.toFixed(0)}%</b>
              </div>
            </div>
            {/* Alert ratio bar */}
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                <span>Health score</span>
                <span>
                  {c.devices > 0
                    ? Math.max(0, 100 - Math.round((c.openAlerts / c.devices) * 100)).toFixed(0)
                    : 100}
                  %
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${c.devices > 0 ? Math.max(0, 100 - (c.openAlerts / c.devices) * 100) : 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status distribution bar */}
      {analytics.statusDistribution.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">
            Network-wide device status distribution
          </h4>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={analytics.statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tickFormatter={pretty} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={(l) => pretty(String(l))} />
                <Bar dataKey="count" fill="#059669" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-400">
        Covering {councils.length} council{councils.length !== 1 ? "s" : ""} · {devices.length} device
        {devices.length !== 1 ? "s" : ""}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Mini KPI Card
   ═══════════════════════════════════════════════ */
function MiniKpi({
  label,
  value,
  color,
}: {
  label: string
  value: React.ReactNode
  color: "emerald" | "blue" | "red" | "amber" | "slate" | "purple"
}) {
  const bgMap = {
    emerald: "bg-emerald-50 border-emerald-100",
    blue: "bg-sky-50 border-sky-100",
    red: "bg-red-50 border-red-100",
    amber: "bg-amber-50 border-amber-100",
    slate: "bg-slate-50 border-slate-100",
    purple: "bg-purple-50 border-purple-100",
  }
  const textMap = {
    emerald: "text-emerald-700",
    blue: "text-sky-700",
    red: "text-red-700",
    amber: "text-amber-700",
    slate: "text-slate-700",
    purple: "text-purple-700",
  }

  return (
    <div className={`rounded-xl border p-3.5 ${bgMap[color]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className={`mt-1 text-xl font-bold ${textMap[color]}`}>{value}</div>
    </div>
  )
}
