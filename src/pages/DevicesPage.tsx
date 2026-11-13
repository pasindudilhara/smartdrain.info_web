import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit3, Plus, Search, ChevronDown, ChevronRight } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import api, { errorMessage } from "@/lib/api"
import type { Council, Device, DeviceType, ModelCategory, SiteCondition } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/PageParts"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Field, Input, Select } from "@/components/ui/input"
import { TableWrap, Th, Td } from "@/components/ui/table"
import { StatusBadge } from "@/components/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { battery, dateTime, num, pretty, label } from "@/lib/format"
import { MonitoringModelConfig, SITE_CONDITIONS } from "./DeviceModelConfig"

interface DeviceForm {
  deviceCode: string
  name: string
  modelCategory: ModelCategory
  deviceType: DeviceType
  latitude: number | string
  longitude: number | string
  address: string
  serialNumber: string
  firmwareVersion: string
  drainHeightCm: number | string
  drainWidthCm: number | string
  drainLengthCm: number | string
  councilId: string
  siteCondition: SiteCondition
}

const blank: DeviceForm = {
  deviceCode: "",
  name: "",
  modelCategory: "UNDERGROUND_DRAINS",
  deviceType: "INLET_FILTER",
  latitude: 6.9271,
  longitude: 79.8612,
  address: "",
  serialNumber: "",
  firmwareVersion: "",
  drainHeightCm: "",
  drainWidthCm: "",
  drainLengthCm: "",
  councilId: "",
  siteCondition: "NONE",
}

const needsDrain = (dt: DeviceType) =>
  dt === "SMART_DRAIN" || dt === "INLET_FILTER" || dt === "OPEN_DRAIN_FILTER"

export default function DevicesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Device | null>(null)
  const [form, setForm] = useState<DeviceForm>(blank)
  const [search, setSearch] = useState("")
  // Type filter from URL or local state
  const [typeFilter, setTypeFilter] = useState<string>(
    searchParams.get("type") ?? "",
  )
  // For admin: selected council group (null = show all)
  const [selectedCouncil, setSelectedCouncil] = useState<string>("")
  const [expandedCouncils, setExpandedCouncils] = useState<Set<string>>(new Set())

  const devices = useQuery({
    queryKey: ["devices"],
    queryFn: async () => (await api.get<Device[]>("/devices")).data,
  })

  const councils = useQuery({
    queryKey: ["councils"],
    enabled: user?.role === "SUPER_ADMIN",
    queryFn: async () => (await api.get<Council[]>("/admin/councils")).data,
  })

  const save = useMutation({
    mutationFn: async () => {
      if (!form.siteCondition) throw new Error("Site-Specific Condition is required.")
      if (needsDrain(form.deviceType as DeviceType)) {
        const height = Number(form.drainHeightCm)
        const width = Number(form.drainWidthCm)
        if (!Number.isFinite(height) || height <= 0) throw new Error("Drain height must be greater than 0 cm")
        if (!Number.isFinite(width) || width <= 0) throw new Error("Drain width must be greater than 0 cm")
      }

      const isDrain = needsDrain(form.deviceType as DeviceType)
      const payload = {
        ...form,
        councilId: user?.role === "SUPER_ADMIN" ? Number(form.councilId) : undefined,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        drainHeightCm: isDrain ? Number(form.drainHeightCm) : null,
        drainWidthCm: isDrain ? Number(form.drainWidthCm) : null,
        drainLengthCm: isDrain && form.drainLengthCm ? Number(form.drainLengthCm) : null,
        siteCondition: form.siteCondition,
        active: true,
      }

      return editing
        ? (await api.put(`/devices/${editing.id}`, payload)).data
        : (await api.post("/devices", payload)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["devices"] })
      setOpen(false)
    },
    onError: (e) => alert(errorMessage(e)),
  })

  function launch(d?: Device) {
    setEditing(d || null)
    setForm(
      d
        ? {
            deviceCode: d.deviceCode,
            name: d.name,
            modelCategory: d.modelCategory,
            deviceType: d.deviceType,
            latitude: d.latitude,
            longitude: d.longitude,
            address: d.address || "",
            serialNumber: d.serialNumber || "",
            firmwareVersion: d.firmwareVersion || "",
            drainHeightCm: d.drainHeightCm ?? "",
            drainWidthCm: d.drainWidthCm ?? "",
            drainLengthCm: d.drainLengthCm ?? "",
            councilId: String(d.councilId),
            siteCondition: d.siteCondition ?? "NONE",
          }
        : { ...blank, councilId: user?.councilId ? String(user.councilId) : "" },
    )
    setOpen(true)
  }

  // Apply all filters
  const filtered = useMemo(() => {
    let list = devices.data ?? []
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((d) =>
        (d.name + d.deviceCode + d.councilName).toLowerCase().includes(q),
      )
    }
    if (typeFilter) {
      list = list.filter((d) => d.deviceType === typeFilter)
    }
    return list
  }, [devices.data, search, typeFilter])

  // Group by council for admin view
  const groupedByCouncil = useMemo(() => {
    const map = new Map<string, Device[]>()
    filtered.forEach((d) => {
      const key = d.councilName
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    })
    return map
  }, [filtered])

  const isAdmin = user?.role === "SUPER_ADMIN"

  function toggleCouncil(name: string) {
    setExpandedCouncils((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  // Initialize all councils as expanded on first load
  useMemo(() => {
    if (devices.data && expandedCouncils.size === 0) {
      const names = new Set(devices.data.map((d) => d.councilName))
      setExpandedCouncils(names)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices.data])

  return (
    <>
      <PageHeader
        title="Monitoring Hot Spots"
        description="Register drain geometry, then calculated hydraulic telemetry is generated from each sensor reading."
        action={
          <Button onClick={() => launch()}>
            <Plus size={16} /> Add device
          </Button>
        }
      />

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border bg-white px-3">
          <Search size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 text-sm outline-none"
            placeholder="Search devices, codes or councils…"
          />
        </div>
        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All device types</option>
          <option value="INLET_FILTER">Inlet Filter</option>
          <option value="OPEN_DRAIN_FILTER">Open Drain Retrofit</option>
          <option value="SMART_DRAIN">Smart Drain</option>
          <option value="SMART_DRAIN_BIN">Smart Drain Bin</option>
        </select>
      </div>

      {/* Council-grouped view (admin) vs flat view (council user) */}
      {isAdmin ? (
        <div className="space-y-4">
          {groupedByCouncil.size === 0 ? (
            <EmptyState />
          ) : (
            [...groupedByCouncil.entries()].map(([councilName, devs]) => (
              <div key={councilName} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  className="flex w-full items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  onClick={() => toggleCouncil(councilName)}
                >
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    {expandedCouncils.has(councilName) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    {councilName}
                    <Badge tone="slate">{devs.length} devices</Badge>
                  </div>
                </button>
                {expandedCouncils.has(councilName) && (
                  <DeviceTable devices={devs} onEdit={launch} onView={(d) => nav(`/app/devices/${d.id}`)} />
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <DeviceTable devices={filtered} onEdit={launch} onView={(d) => nav(`/app/devices/${d.id}`)} />
          )}
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit monitoring device" : "Add monitoring device"}
        wide
      >
        <div className="grid gap-4 md:grid-cols-2">
          {user?.role === "SUPER_ADMIN" && (
            <Field label="Urban Council">
              <Select value={form.councilId} onChange={(e) => setForm({ ...form, councilId: e.target.value })}>
                <option value="">Select council</option>
                {councils.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Device code">
            <Input value={form.deviceCode} onChange={(e) => setForm({ ...form, deviceCode: e.target.value })} />
          </Field>
          <Field label="Device name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Drain classification">
            <Select
              value={form.modelCategory}
              onChange={(e) => {
                const m = e.target.value as ModelCategory
                setForm({
                  ...form,
                  modelCategory: m,
                  deviceType: m === "DEVELOPING_COUNTRY_MODEL" ? "SMART_DRAIN" : form.deviceType,
                })
              }}
            >
              <option value="UNDERGROUND_DRAINS">Closed Drains</option>
              <option value="OPEN_DRAINS">Open Drains</option>
              <option value="DEVELOPED_COUNTRY_MODEL">Developed Country Model</option>
              <option value="DEVELOPING_COUNTRY_MODEL">Developing Country Model</option>
            </Select>
          </Field>
          <Field label="Device type">
            <Select
              value={form.deviceType}
              onChange={(e) => setForm({ ...form, deviceType: e.target.value as DeviceType })}
            >
              <option value="INLET_FILTER">Inlet Filter</option>
              <option value="OPEN_DRAIN_FILTER">Open Drain Retrofit</option>
              <option value="SMART_DRAIN">Smart Drain</option>
              {form.modelCategory === "DEVELOPED_COUNTRY_MODEL" && (
                <option value="SMART_DRAIN_BIN">Smart Drain Bin</option>
              )}
            </Select>
          </Field>

          {needsDrain(form.deviceType as DeviceType) && (
            <>
              <Field label="Drain height / sensor height (cm)">
                <Input
                  type="number"
                  min="0.01"
                  step="0.1"
                  placeholder="e.g. 50"
                  value={form.drainHeightCm}
                  onChange={(e) => setForm({ ...form, drainHeightCm: e.target.value })}
                />
              </Field>
              <Field label="Internal drain width (cm)">
                <Input
                  type="number"
                  min="0.01"
                  step="0.1"
                  placeholder="e.g. 60"
                  value={form.drainWidthCm}
                  onChange={(e) => setForm({ ...form, drainWidthCm: e.target.value })}
                />
              </Field>
              <Field
                label="Drain length (cm)"
                hint="Length of the open-drain section included in the Smart Drain project (optional)"
              >
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 120"
                  value={form.drainLengthCm}
                  onChange={(e) => setForm({ ...form, drainLengthCm: e.target.value })}
                />
              </Field>
              <div className="md:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900">
                The sensor sends the distance from the sensor to the water surface. The backend uses these dimensions to calculate
                water depth, cross-sectional area, wetted perimeter, hydraulic radius, velocity and flow rate.
              </div>
            </>
          )}

          <Field label="Latitude">
            <Input
              type="number"
              step="0.000001"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            />
          </Field>
          <Field label="Longitude">
            <Input
              type="number"
              step="0.000001"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Serial number">
            <Input
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
            />
          </Field>
          <Field label="Firmware version">
            <Input
              value={form.firmwareVersion}
              onChange={(e) => setForm({ ...form, firmwareVersion: e.target.value })}
            />
          </Field>

          {/* UPDATE 7: Site-Specific Conditions — required field */}
          <Field label="Site-Specific Conditions *">
            <Select
              value={form.siteCondition}
              required
              onChange={(e) => setForm({ ...form, siteCondition: e.target.value as SiteCondition })}
            >
              {SITE_CONDITIONS.map((sc) => (
                <option key={sc.value} value={sc.value}>
                  {sc.label}
                </option>
              ))}
            </Select>
          </Field>

          {/* Model Configuration hint */}
          <div className="md:col-span-2">
            <MonitoringModelConfig
              deviceType={form.deviceType as DeviceType}
              condition={form.siteCondition}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save device"}
          </Button>
        </div>
      </Dialog>
    </>
  )
}

function DeviceTable({
  devices,
  onEdit,
  onView,
}: {
  devices: Device[]
  onEdit: (d: Device) => void
  onView: (d: Device) => void
}) {
  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>Device</Th>
          <Th>Model / Type</Th>
          <Th>Drain geometry</Th>
          <Th>Condition</Th>
          <Th>Status</Th>
          <Th>Current reading</Th>
          <Th>Battery</Th>
          <Th>Last seen</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody>
        {devices.map((d) => (
          <tr key={d.id} className="hover:bg-slate-50/60">
            <Td>
              <button onClick={() => onView(d)} className="text-left">
                <b>{d.name}</b>
                <div className="text-xs text-slate-500">
                  {d.deviceCode} · {d.councilName}
                </div>
              </button>
            </Td>
            <Td>
              <div className="space-y-1">
                <Badge
                  tone={
                    d.modelCategory === "UNDERGROUND_DRAINS" ||
                    d.modelCategory === "DEVELOPED_COUNTRY_MODEL"
                      ? "blue"
                      : "purple"
                  }
                >
                  {label(d.modelCategory)}
                </Badge>
                <div className="text-xs text-slate-500">{label(d.deviceType)}</div>
              </div>
            </Td>
            <Td>
              {needsDrain(d.deviceType) ? (
                <div className="text-sm">
                  <b>{num(d.drainWidthCm, " cm")}</b>
                  <div className="text-xs text-slate-500">
                    W × {num(d.drainHeightCm, " cm")} H
                    {d.drainLengthCm ? ` × ${num(d.drainLengthCm, " cm")} L` : ""}
                  </div>
                </div>
              ) : (
                "—"
              )}
            </Td>
            <Td>
              {d.siteCondition && d.siteCondition !== "NONE" ? (
                <Badge tone="purple">{pretty(d.siteCondition)}</Badge>
              ) : (
                <span className="text-xs text-slate-400">None</span>
              )}
            </Td>
            <Td>
              <StatusBadge status={d.status} />
            </Td>
            <Td>
              {needsDrain(d.deviceType)
                ? num(d.latest?.waterDepthCm, " cm")
                : num(d.latest?.binFillPercent, "%")}
            </Td>
            <Td>{battery(d.latest?.batteryPercent, d.latest?.batteryVoltage)}</Td>
            <Td className="text-xs text-slate-500">{dateTime(d.lastSeenAt)}</Td>
            <Td>
              <Button variant="ghost" onClick={() => onEdit(d)}>
                <Edit3 size={15} /> Edit
              </Button>
            </Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
      No devices match the current filters.
    </div>
  )
}
