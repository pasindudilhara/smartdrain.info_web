import { useState, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit3, Search, ArrowRightLeft } from "lucide-react"
import api, { errorMessage } from "@/lib/api"
import type {
  HandoverRecord,
  Device,
  HandoverFacility,
  Council,
  SortingStatus,
} from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/PageParts"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Field, Input, Select, Textarea } from "@/components/ui/input"
import { TableWrap, Th, Td } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { pretty } from "@/lib/format"

const WASTE_TYPES = [
  "Plastic",
  "Organic",
  "Metal",
  "Paper/Cardboard",
  "Glass",
  "Textile",
  "Polythene",
  "Mixed",
  "Other",
]

const SORTING_COLORS: Record<SortingStatus, "slate" | "amber" | "blue" | "green" | "red"> = {
  PENDING: "slate",
  RECEIVED: "amber",
  SORTED: "blue",
  RECYCLED: "green",
  DISPOSED: "red",
}

interface RecordForm {
  handoverDate: string
  handoverTime: string
  deviceId: string
  collectionLocation: string
  lastCleanedDate: string
  wasteCollected: string
  wasteWeightKg: string
  wasteVolume: string
  wasteCompositions: string[]
  customCompositionDescription: string
  deliveredToFacilityId: string
  receivedBy: string
  transportedBy: string
  vehicleDetails: string
  handoverReference: string
  sortingStatus: SortingStatus
  recyclableWasteKg: string
  residualWasteKg: string
  notes: string
}

const blank: RecordForm = {
  handoverDate: new Date().toISOString().split("T")[0],
  handoverTime: "",
  deviceId: "",
  collectionLocation: "",
  lastCleanedDate: "",
  wasteCollected: "",
  wasteWeightKg: "",
  wasteVolume: "",
  wasteCompositions: [],
  customCompositionDescription: "",
  deliveredToFacilityId: "",
  receivedBy: "",
  transportedBy: "",
  vehicleDetails: "",
  handoverReference: "",
  sortingStatus: "PENDING",
  recyclableWasteKg: "",
  residualWasteKg: "",
  notes: "",
}

export default function HandoverRecordsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<HandoverRecord | null>(null)
  const [form, setForm] = useState<RecordForm>(blank)
  const [search, setSearch] = useState("")

  const records = useQuery({
    queryKey: ["handover-records"],
    queryFn: async () =>
      (await api.get<HandoverRecord[]>("/litter/records")).data,
  })

  const devices = useQuery({
    queryKey: ["devices"],
    queryFn: async () => (await api.get<Device[]>("/devices")).data,
  })

  const facilities = useQuery({
    queryKey: ["facilities"],
    queryFn: async () =>
      (await api.get<HandoverFacility[]>("/facilities")).data,
  })

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        deviceId: Number(form.deviceId),
        wasteWeightKg: form.wasteWeightKg ? Number(form.wasteWeightKg) : null,
        deliveredToFacilityId: form.deliveredToFacilityId
          ? Number(form.deliveredToFacilityId)
          : null,
        recyclableWasteKg: form.recyclableWasteKg
          ? Number(form.recyclableWasteKg)
          : null,
        residualWasteKg: form.residualWasteKg
          ? Number(form.residualWasteKg)
          : null,
        lastCleanedDate: form.lastCleanedDate || null,
        handoverTime: form.handoverTime || null,
      }
      return editing
        ? (await api.put(`/litter/records/${editing.id}`, payload)).data
        : (await api.post("/litter/records", payload)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["handover-records"] })
      qc.invalidateQueries({ queryKey: ["litter-stats"] })
      setOpen(false)
    },
    onError: (e) => alert(errorMessage(e)),
  })

  function launch(r?: HandoverRecord) {
    setEditing(r || null)
    setForm(
      r
        ? {
            handoverDate: r.handoverDate,
            handoverTime: r.handoverTime || "",
            deviceId: String(r.deviceId),
            collectionLocation: r.collectionLocation || "",
            lastCleanedDate: r.lastCleanedDate || "",
            wasteCollected: r.wasteCollected || "",
            wasteWeightKg: r.wasteWeightKg != null ? String(r.wasteWeightKg) : "",
            wasteVolume: r.wasteVolume || "",
            wasteCompositions: r.wasteCompositions || [],
            customCompositionDescription: "",
            deliveredToFacilityId: r.facilityId ? String(r.facilityId) : "",
            receivedBy: r.receivedBy || "",
            transportedBy: r.transportedBy || "",
            vehicleDetails: r.vehicleDetails || "",
            handoverReference: r.handoverReference || "",
            sortingStatus: r.sortingStatus,
            recyclableWasteKg:
              r.recyclableWasteKg != null ? String(r.recyclableWasteKg) : "",
            residualWasteKg:
              r.residualWasteKg != null ? String(r.residualWasteKg) : "",
            notes: r.notes || "",
          }
        : blank,
    )
    setOpen(true)
  }

  const toggleComposition = (type: string) => {
    setForm((f) => ({
      ...f,
      wasteCompositions: f.wasteCompositions.includes(type)
        ? f.wasteCompositions.filter((t) => t !== type)
        : [...f.wasteCompositions, type],
    }))
  }

  const filtered = useMemo(
    () =>
      (records.data ?? []).filter((r) =>
        (r.deviceName + r.deviceCode + r.councilName + (r.facilityName || ""))
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [records.data, search],
  )

  return (
    <>
      <PageHeader
        title="Litter handover records"
        description="Track waste collection from drain filters and handover to processing facilities."
        action={
          <Button onClick={() => launch()}>
            <Plus size={16} /> New record
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-xl border bg-white px-3">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-2.5 text-sm outline-none"
          placeholder="Search records…"
        />
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Date</Th>
            <Th>Device</Th>
            <Th>Council</Th>
            <Th>Weight</Th>
            <Th>Composition</Th>
            <Th>Facility</Th>
            <Th>Sorting Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/60">
              <Td className="text-sm font-medium">{r.handoverDate}</Td>
              <Td>
                <b className="text-sm">{r.deviceName}</b>
                <div className="text-xs text-slate-500">{r.deviceCode}</div>
              </Td>
              <Td className="text-sm">{r.councilName}</Td>
              <Td className="text-sm font-medium">
                {r.wasteWeightKg != null ? `${r.wasteWeightKg} kg` : "—"}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {(r.wasteCompositions || []).slice(0, 3).map((wc, i) => (
                    <Badge key={i} tone="slate">
                      {wc}
                    </Badge>
                  ))}
                  {(r.wasteCompositions || []).length > 3 && (
                    <Badge tone="slate">
                      +{r.wasteCompositions.length - 3}
                    </Badge>
                  )}
                </div>
              </Td>
              <Td className="text-sm">{r.facilityName || "—"}</Td>
              <Td>
                <Badge tone={SORTING_COLORS[r.sortingStatus]}>
                  {pretty(r.sortingStatus)}
                </Badge>
              </Td>
              <Td>
                <Button variant="ghost" onClick={() => launch(r)}>
                  <Edit3 size={15} /> Edit
                </Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit handover record" : "New handover record"}
        wide
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Handover date">
            <Input
              type="date"
              value={form.handoverDate}
              onChange={(e) =>
                setForm({ ...form, handoverDate: e.target.value })
              }
            />
          </Field>
          <Field label="Handover time" hint="Optional">
            <Input
              type="time"
              value={form.handoverTime}
              onChange={(e) =>
                setForm({ ...form, handoverTime: e.target.value })
              }
            />
          </Field>

          <Field label="Device">
            <Select
              value={form.deviceId}
              onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
            >
              <option value="">Select device</option>
              {(devices.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.deviceCode})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Collection location" hint="Optional">
            <Input
              value={form.collectionLocation}
              onChange={(e) =>
                setForm({ ...form, collectionLocation: e.target.value })
              }
            />
          </Field>

          <Field label="Last cleaned date" hint="Optional">
            <Input
              type="date"
              value={form.lastCleanedDate}
              onChange={(e) =>
                setForm({ ...form, lastCleanedDate: e.target.value })
              }
            />
          </Field>

          <Field label="Waste collected">
            <Input
              value={form.wasteCollected}
              onChange={(e) =>
                setForm({ ...form, wasteCollected: e.target.value })
              }
              placeholder="Description of waste"
            />
          </Field>

          <Field label="Waste weight (kg)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.wasteWeightKg}
              onChange={(e) =>
                setForm({ ...form, wasteWeightKg: e.target.value })
              }
            />
          </Field>

          <Field label="Waste volume" hint="Optional">
            <Input
              value={form.wasteVolume}
              onChange={(e) =>
                setForm({ ...form, wasteVolume: e.target.value })
              }
              placeholder="e.g. 2 bags"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Waste composition">
              <div className="flex flex-wrap gap-2 mt-1">
                {WASTE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleComposition(type)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.wasteCompositions.includes(type)
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {form.wasteCompositions.includes("Other") && (
            <Field label="Other waste description">
              <Input
                value={form.customCompositionDescription}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customCompositionDescription: e.target.value,
                  })
                }
                placeholder="Describe other waste types"
              />
            </Field>
          )}

          <Field label="Delivered to facility">
            <Select
              value={form.deliveredToFacilityId}
              onChange={(e) =>
                setForm({ ...form, deliveredToFacilityId: e.target.value })
              }
            >
              <option value="">Select facility</option>
              {(facilities.data ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.facilityName}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Received by">
            <Input
              value={form.receivedBy}
              onChange={(e) =>
                setForm({ ...form, receivedBy: e.target.value })
              }
            />
          </Field>

          <Field label="Transported by">
            <Input
              value={form.transportedBy}
              onChange={(e) =>
                setForm({ ...form, transportedBy: e.target.value })
              }
            />
          </Field>

          <Field label="Vehicle details" hint="Optional">
            <Input
              value={form.vehicleDetails}
              onChange={(e) =>
                setForm({ ...form, vehicleDetails: e.target.value })
              }
            />
          </Field>

          <Field label="Handover reference" hint="Optional">
            <Input
              value={form.handoverReference}
              onChange={(e) =>
                setForm({ ...form, handoverReference: e.target.value })
              }
            />
          </Field>

          <Field label="Sorting status">
            <Select
              value={form.sortingStatus}
              onChange={(e) =>
                setForm({
                  ...form,
                  sortingStatus: e.target.value as SortingStatus,
                })
              }
            >
              <option value="PENDING">Pending</option>
              <option value="RECEIVED">Received</option>
              <option value="SORTED">Sorted</option>
              <option value="RECYCLED">Recycled</option>
              <option value="DISPOSED">Disposed</option>
            </Select>
          </Field>

          <Field label="Recyclable waste (kg)" hint="After sorting">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.recyclableWasteKg}
              onChange={(e) =>
                setForm({ ...form, recyclableWasteKg: e.target.value })
              }
            />
          </Field>

          <Field label="Residual waste (kg)" hint="After sorting">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.residualWasteKg}
              onChange={(e) =>
                setForm({ ...form, residualWasteKg: e.target.value })
              }
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Notes" hint="Optional">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save record"}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
