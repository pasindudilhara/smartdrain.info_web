import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"
import type { Device } from "@/lib/types"
import { PageHeader } from "@/components/PageParts"
import { DeviceMap } from "@/components/DeviceMap"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/StatusBadge"
import { battery, num, pretty } from "@/lib/format"

export default function MapPage() {
  const nav = useNavigate()
  const [selected, setSelected] = useState<Device | null>(null)
  const q = useQuery({
    queryKey: ["devices"],
    queryFn: async () => (await api.get<Device[]>("/devices")).data,
    refetchInterval: 20_000,
  })

  return (
    <>
      <PageHeader title="Live device map" description="Council-scoped operational map with current device state and telemetry." />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <DeviceMap devices={q.data ?? []} onSelect={setSelected} height={650} />
        <Card className="p-5">
          {selected ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">{selected.name}</h3>
                  <p className="text-xs text-slate-500">{selected.deviceCode}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <p className="mt-4 text-xs text-slate-500">
                {pretty(selected.modelCategory)} · {pretty(selected.deviceType)}
              </p>
              <div className="mt-5 space-y-3 text-sm">
                {selected.deviceType === "SMART_DRAIN" ? (
                  <>
                    <Row l="Water depth" v={num(selected.latest?.waterDepthCm, " cm")} />
                    <Row l="Sensor distance" v={num(selected.latest?.distanceCm, " cm")} />
                    <Row l="Velocity" v={num(selected.latest?.velocityMps, " m/s", 3)} />
                    <Row l="Flow rate" v={num(selected.latest?.flowRateLps, " L/s", 2)} />
                    <Row l="Drain size" v={`${num(selected.drainWidthCm, " cm")} W × ${num(selected.drainHeightCm, " cm")} H`} />
                  </>
                ) : (
                  <Row l="Bin fill" v={num(selected.latest?.binFillPercent, "%")} />
                )}
                <Row l="Battery" v={battery(selected.latest?.batteryPercent, selected.latest?.batteryVoltage)} />
                <Row l="Signal" v={num(selected.latest?.signalRssi, "", 0)} />
              </div>
              <button
                onClick={() => nav(`/app/devices/${selected.id}`)}
                className="mt-5 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white"
              >
                Open device details
              </button>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">Select a marker to inspect its current readings.</p>
          )}
        </Card>
      </div>
    </>
  )
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
      <span className="text-slate-500">{l}</span>
      <b className="text-right">{v}</b>
    </div>
  )
}
