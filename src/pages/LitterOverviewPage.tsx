import { useQuery } from "@tanstack/react-query"
import { Recycle, Scale, Trash2, Calendar, Building2, Users2 } from "lucide-react"
import api from "@/lib/api"
import type { LitterStats, HandoverRecord } from "@/lib/types"
import { PageHeader, Kpi } from "@/components/PageParts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { pretty } from "@/lib/format"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const COLORS = [
  "#059669",
  "#0284c7",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#64748b",
  "#0f766e",
  "#be185d",
  "#78716c",
]

export default function LitterOverviewPage() {
  const stats = useQuery({
    queryKey: ["litter-stats"],
    queryFn: async () => (await api.get<LitterStats>("/litter/stats")).data,
    refetchInterval: 30000,
  })

  const records = useQuery({
    queryKey: ["handover-records"],
    queryFn: async () =>
      (await api.get<HandoverRecord[]>("/litter/records")).data,
  })

  const s = stats.data
  const recs = records.data ?? []

  // Build composition breakdown from all records
  const compositionMap = new Map<string, number>()
  recs.forEach((r) =>
    (r.wasteCompositions || []).forEach((wc) => {
      const base = wc.split(":")[0].trim()
      compositionMap.set(base, (compositionMap.get(base) || 0) + 1)
    }),
  )
  const compositionData = [...compositionMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Sorting status distribution
  const sortingMap = new Map<string, number>()
  recs.forEach((r) => {
    sortingMap.set(
      r.sortingStatus,
      (sortingMap.get(r.sortingStatus) || 0) + 1,
    )
  })
  const sortingData = [...sortingMap.entries()].map(([name, count]) => ({
    name: pretty(name),
    count,
  }))

  // Recent 10 records
  const recent = recs.slice(0, 10)

  if (!s)
    return (
      <div className="animate-pulse text-slate-400">
        Loading litter statistics…
      </div>
    )

  const recyclingRate =
    s.totalWasteCollectedKg > 0
      ? ((s.totalRecyclableWasteKg / s.totalWasteCollectedKg) * 100).toFixed(1)
      : "0"

  return (
    <>
      <PageHeader
        title="Litter management overview"
        description="Waterway litter interception, waste collection, and recycling tracking dashboard."
      />

      {/* ── KPI Row ── */}
      <div className="metric-grid">
        <Kpi
          label="Total Waste Collected"
          value={`${s.totalWasteCollectedKg.toFixed(1)} kg`}
          icon={<Scale size={19} />}
        />
        <Kpi
          label="Recyclable Waste"
          value={`${s.totalRecyclableWasteKg.toFixed(1)} kg`}
          sub={`${recyclingRate}% recycling rate`}
          icon={<Recycle size={19} />}
        />
        <Kpi
          label="Residual Waste"
          value={`${s.totalResidualWasteKg.toFixed(1)} kg`}
          icon={<Trash2 size={19} />}
        />
        <Kpi
          label="Last Collection"
          value={s.lastCleanedDate || "None"}
          sub={s.lastHandoverFacility || "No facility"}
          icon={<Calendar size={19} />}
        />
        <Kpi
          label="Collection Partner"
          value={s.lastCollectionPartner || "—"}
          sub="Company / person responsible for collection"
          icon={<Users2 size={19} />}
        />
      </div>

      {/* ── Charts ── */}
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {compositionData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Waste composition breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={compositionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {compositionData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {sortingData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sorting status distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={sortingData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="#059669"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Recent Records ── */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Recent handover records</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="divide-y divide-slate-100">
            {recent.length === 0 ? (
              <div className="py-6 text-sm text-slate-500">
                No handover records yet.
              </div>
            ) : (
              recent.map((r) => (
                <div
                  key={r.id}
                  className="grid gap-2 py-3 md:grid-cols-[100px_1fr_100px_120px_120px] md:items-center"
                >
                  <span className="text-sm font-medium">
                    {r.handoverDate}
                  </span>
                  <div>
                    <b className="text-sm">{r.deviceName}</b>
                    <span className="ml-2 text-xs text-slate-500">
                      {r.deviceCode}
                    </span>
                    {r.facilityName && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                        <Building2 size={10} />
                        {r.facilityName}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold">
                    {r.wasteWeightKg != null ? `${r.wasteWeightKg} kg` : "—"}
                  </span>
                  <Badge
                    tone={
                      r.sortingStatus === "RECYCLED"
                        ? "green"
                        : r.sortingStatus === "DISPOSED"
                          ? "red"
                          : "slate"
                    }
                  >
                    {pretty(r.sortingStatus)}
                  </Badge>
                  <div className="flex flex-wrap gap-1">
                    {(r.wasteCompositions || []).slice(0, 2).map((wc, i) => (
                      <Badge key={i} tone="slate">
                        {wc.split(":")[0]}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
