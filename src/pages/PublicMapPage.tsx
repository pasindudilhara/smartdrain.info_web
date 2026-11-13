import { useMemo, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  BatteryMedium,
  Building2,
  ChevronDown,
  Droplets,
  Gauge,
  Layers3,
  LogIn,
  MapPin,
  Search,
  Waves,
  Wind,
  X,
  Zap,
} from "lucide-react"
import { Link } from "react-router-dom"
import api from "@/lib/api"
import type { Device, DeviceStatus, DeviceType, ModelCategory } from "@/lib/types"
import { DeviceMap } from "@/components/DeviceMap"
import { StatusBadge } from "@/components/StatusBadge"
import { battery, dateTime, num, pretty } from "@/lib/format"

const statusOptions: Array<{ value: "ALL" | DeviceStatus; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "ONLINE", label: "Online" },
  { value: "WARNING", label: "Warning" },
  { value: "CRITICAL", label: "Critical" },
  { value: "OFFLINE", label: "Offline" },
  { value: "MAINTENANCE", label: "Maintenance" },
]

const modelOptions: Array<{ value: "ALL" | ModelCategory; label: string }> = [
  { value: "ALL", label: "All models" },
  { value: "DEVELOPED_COUNTRY_MODEL", label: "Developed Country" },
  { value: "DEVELOPING_COUNTRY_MODEL", label: "Developing Country" },
]

const typeOptions: Array<{ value: "ALL" | DeviceType; label: string }> = [
  { value: "ALL", label: "All devices" },
  { value: "SMART_DRAIN", label: "Smart Drain" },
  { value: "SMART_DRAIN_BIN", label: "Smart Drain Bin" },
]

export default function PublicMapPage() {
  const [selected, setSelected] = useState<Device | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"ALL" | DeviceStatus>("ALL")
  const [model, setModel] = useState<"ALL" | ModelCategory>("ALL")
  const [type, setType] = useState<"ALL" | DeviceType>("ALL")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const devicesQuery = useQuery({
    queryKey: ["public-map"],
    queryFn: async () => (await api.get<{ devices: Device[] }>("/public/map")).data.devices,
    refetchInterval: 30_000,
  })

  const devices = devicesQuery.data ?? []
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      devices.filter((device) => {
        const searchMatch =
          !normalizedQuery ||
          device.name.toLowerCase().includes(normalizedQuery) ||
          device.deviceCode.toLowerCase().includes(normalizedQuery) ||
          device.councilName.toLowerCase().includes(normalizedQuery) ||
          (device.address ?? "").toLowerCase().includes(normalizedQuery)
        return (
          searchMatch &&
          (status === "ALL" || device.status === status) &&
          (model === "ALL" || device.modelCategory === model) &&
          (type === "ALL" || device.deviceType === type)
        )
      }),
    [devices, normalizedQuery, status, model, type],
  )

  const stats = useMemo(
    () => ({
      total: devices.length,
      online: devices.filter((d) => d.status === "ONLINE").length,
      attention: devices.filter((d) => d.status === "WARNING" || d.status === "CRITICAL").length,
      councils: new Set(devices.map((d) => d.councilId)).size,
    }),
    [devices],
  )

  const activeFilters = [status !== "ALL", model !== "ALL", type !== "ALL"].filter(Boolean).length

  function clearFilters() {
    setQuery("")
    setStatus("ALL")
    setModel("ALL")
    setType("ALL")
  }

  return (
    <div className="relative h-[100dvh] min-h-[620px] w-full overflow-hidden bg-slate-950 text-slate-900">
      <DeviceMap
        devices={filtered}
        onSelect={setSelected}
        height="100%"
        className="absolute inset-0"
        selectedDeviceId={selected?.id}
        fullBleed
      />

      <div className="pointer-events-none absolute inset-0 z-[400] bg-[linear-gradient(180deg,rgba(8,20,18,.09),transparent_24%,transparent_72%,rgba(8,20,18,.12))]" />

      <header className="pointer-events-none absolute left-0 right-0 top-0 z-[700] px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="mx-auto flex max-w-[1780px] items-center justify-between gap-3">
          <div className="pointer-events-auto flex h-[66px] min-w-0 items-center gap-3 rounded-[22px] border border-white/65 bg-white/92 px-4 shadow-[0_14px_45px_rgba(15,23,42,.16)] backdrop-blur-xl sm:h-[72px] sm:px-5">
            <img
              src="/urban-inventors-logo.svg"
              alt="Urban Inventors"
              className="h-10 w-auto max-w-[170px] object-contain sm:h-12 sm:max-w-[220px]"
            />
            <div className="hidden h-8 w-px bg-slate-200 lg:block" />
            <div className="hidden lg:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Live public network</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">Smart Drain Monitoring</p>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-2xl border border-white/65 bg-white/92 px-3 py-2.5 shadow-[0_12px_35px_rgba(15,23,42,.13)] backdrop-blur-xl sm:flex">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-slate-700">LIVE</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">30s refresh</span>
            </div>
            <Link
              to="/login"
              className="flex h-[48px] items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white shadow-[0_12px_32px_rgba(15,23,42,.25)] transition hover:-translate-y-0.5 hover:bg-emerald-800 sm:h-[50px]"
            >
              <LogIn size={17} />
              <span className="hidden sm:inline">Client login</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="pointer-events-none absolute left-3 right-3 top-[86px] z-[700] sm:left-5 sm:right-auto sm:top-[96px] sm:w-[420px]">
        <div className="pointer-events-auto rounded-[24px] border border-white/70 bg-white/94 p-2 shadow-[0_16px_50px_rgba(15,23,42,.17)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search device, council or location"
                className="h-12 w-full rounded-[17px] border-0 bg-slate-100/90 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(5,150,105,.18)]"
              />
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-[17px] border transition ${filtersOpen || activeFilters ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              aria-label="Map filters"
            >
              <Layers3 size={19} />
              {activeFilters ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-700 px-1 text-[10px] font-bold text-white">
                  {activeFilters}
                </span>
              ) : null}
            </button>
          </div>

          {filtersOpen ? (
            <div className="grid gap-2 px-1 pb-1 pt-3 sm:grid-cols-3">
              <FilterSelect value={status} onChange={(v) => setStatus(v as "ALL" | DeviceStatus)} options={statusOptions} />
              <FilterSelect value={model} onChange={(v) => setModel(v as "ALL" | ModelCategory)} options={modelOptions} />
              <FilterSelect value={type} onChange={(v) => setType(v as "ALL" | DeviceType)} options={typeOptions} />
              <div className="flex items-center justify-between gap-2 sm:col-span-3">
                <p className="pl-1 text-xs font-medium text-slate-500">Showing {filtered.length} of {devices.length} devices</p>
                {(activeFilters > 0 || query) && (
                  <button onClick={clearFilters} className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2 pb-1 pt-2">
              <p className="text-[11px] font-semibold text-slate-500">{filtered.length} devices visible</p>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <LegendDot color="bg-emerald-500" label="Online" />
                <LegendDot color="bg-amber-500" label="Warning" />
                <LegendDot color="bg-red-500" label="Critical" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[650] hidden sm:block sm:bottom-5 sm:left-5">
        <div className="pointer-events-auto flex overflow-hidden rounded-[22px] border border-white/70 bg-white/92 shadow-[0_16px_45px_rgba(15,23,42,.15)] backdrop-blur-xl">
          <MiniStat icon={<MapPin />} value={stats.total} label="Devices" />
          <MiniStat icon={<Zap />} value={stats.online} label="Online" accent />
          <MiniStat icon={<Activity />} value={stats.attention} label="Need attention" />
          <MiniStat icon={<Building2 />} value={stats.councils} label="Councils" />
        </div>
      </div>

      {selected ? (
        <aside className="pointer-events-none absolute bottom-0 right-0 top-auto z-[800] w-full p-3 sm:bottom-5 sm:right-5 sm:top-[96px] sm:w-[390px] sm:p-0 lg:w-[420px]">
          <div className="pointer-events-auto max-h-[76dvh] overflow-y-auto rounded-[28px] border border-white/75 bg-white/96 p-5 shadow-[0_24px_70px_rgba(15,23,42,.22)] backdrop-blur-2xl sm:max-h-full sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{selected.deviceCode}</span>
                </div>
                <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-950">{selected.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500"><Building2 size={14} />{selected.councilName}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                aria-label="Close device details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2.5">
              <Pill label={pretty(selected.modelCategory).replace(" Model", "")} />
              <Pill label={pretty(selected.deviceType)} />
            </div>

            <section className="rounded-[24px] bg-slate-950 p-4 text-white shadow-[0_16px_38px_rgba(15,23,42,.20)]">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Latest telemetry</p>
                  <p className="mt-1 text-xs text-slate-400">Live sensor measurements</p>
                </div>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {selected.deviceType === "SMART_DRAIN" ? (
                  <>
                    <TelemetryMetric icon={<Droplets />} label="Water depth" value={num(selected.latest?.waterDepthCm, " cm")} />
                    <TelemetryMetric icon={<Wind />} label="Velocity" value={num(selected.latest?.velocityMps, " m/s", 3)} />
                    <TelemetryMetric icon={<Gauge />} label="Flow rate" value={num(selected.latest?.flowRateLps, " L/s", 2)} />
                    <TelemetryMetric icon={<Waves />} label="Sensor distance" value={num(selected.latest?.distanceCm, " cm")} />
                  </>
                ) : (
                  <TelemetryMetric icon={<Waves />} label="Bin fill" value={num(selected.latest?.binFillPercent, "%")} wide />
                )}
                <TelemetryMetric icon={<BatteryMedium />} label="Battery" value={battery(selected.latest?.batteryPercent, selected.latest?.batteryVoltage)} wide />
              </div>
            </section>

            <div className="mt-5 space-y-3 rounded-[22px] border border-slate-200 bg-white p-4">
              <DetailRow icon={<MapPin />} label="Location" value={selected.address || `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`} />
              <DetailRow icon={<Activity />} label="Last update" value={dateTime(selected.lastSeenAt)} />
              {selected.deviceType === "SMART_DRAIN" ? <DetailRow icon={<Gauge />} label="Drain geometry" value={`${num(selected.drainWidthCm, " cm")} W × ${num(selected.drainHeightCm, " cm")} H`} /> : null}
              {selected.serialNumber ? <DetailRow icon={<Gauge />} label="Serial number" value={selected.serialNumber} /> : null}
              {selected.firmwareVersion ? <DetailRow icon={<Layers3 />} label="Firmware" value={selected.firmwareVersion} /> : null}
            </div>
          </div>
        </aside>
      ) : (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[650] -translate-x-1/2 sm:bottom-5 sm:left-auto sm:right-5 sm:translate-x-0">
          <div className="rounded-2xl border border-white/75 bg-slate-950/90 px-4 py-3 text-center text-xs font-semibold text-white shadow-xl backdrop-blur-lg">
            Select a map marker to inspect live telemetry
          </div>
        </div>
      )}

      {devicesQuery.isLoading ? (
        <div className="absolute inset-0 z-[900] grid place-items-center bg-slate-950/10 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-2xl">
            <Activity className="animate-pulse text-emerald-600" size={18} /> Loading SmartDrain network…
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="relative block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </label>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1"><i className={`h-1.5 w-1.5 rounded-full ${color}`} />{label}</span>
}

function MiniStat({ icon, value, label, accent = false }: { icon: ReactNode; value: number; label: string; accent?: boolean }) {
  return (
    <div className="flex min-w-[112px] items-center gap-2.5 border-r border-slate-200 px-4 py-3.5 last:border-r-0">
      <div className={`grid h-9 w-9 place-items-center rounded-xl [&>svg]:h-4 [&>svg]:w-4 ${accent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{icon}</div>
      <div><b className="block text-base leading-none text-slate-950">{value}</b><span className="mt-1 block text-[10px] font-semibold text-slate-400">{label}</span></div>
    </div>
  )
}

function Pill({ label }: { label: string }) {
  return <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-[11px] font-extrabold uppercase tracking-wide text-emerald-800">{label}</div>
}

function TelemetryMetric({ icon, label, value, wide = false }: { icon: ReactNode; label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-[18px] border border-white/10 bg-white/[0.07] p-3.5 ${wide ? "col-span-2" : ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400">{label}</span>
        <span className="text-emerald-300 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <b className="text-lg tracking-tight text-white">{value}</b>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-0.5 break-words text-sm font-semibold text-slate-700">{value}</p></div>
    </div>
  )
}
