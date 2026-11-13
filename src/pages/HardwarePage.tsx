import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit3, Search } from "lucide-react"
import api, { errorMessage } from "@/lib/api"
import type { HardwareSpec, Device } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/PageParts"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Field, Input, Select } from "@/components/ui/input"
import { TableWrap, Th, Td } from "@/components/ui/table"
import { pretty, dateTime } from "@/lib/format"

const MATERIALS = ["SS 304", "SS 302", "Aluminium", "Galvanised Steel", "Other"]
const MESH_SIZES: Record<string, string> = {
  "1mm": "46%",
  "2mm": "58%",
  "3mm": "63%",
  "4mm": "67%",
  "5mm": "70%",
  "6mm": "73%",
  "Custom": "Custom",
}

interface HwForm {
  material: string
  customMaterial: string
  grade: string
  sheetThickness: string
  gauge: string
  meshHoleSize: string
  meshOpenArea: string
  customMeshSize: string
  customOpenArea: string
  deviceId: string
}

const blank: HwForm = {
  material: "SS 304",
  customMaterial: "",
  grade: "",
  sheetThickness: "",
  gauge: "",
  meshHoleSize: "",
  meshOpenArea: "",
  customMeshSize: "",
  customOpenArea: "",
  deviceId: "",
}

export default function HardwarePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<HardwareSpec | null>(null)
  const [form, setForm] = useState<HwForm>(blank)
  const [search, setSearch] = useState("")

  const specs = useQuery({
    queryKey: ["hardware"],
    queryFn: async () => (await api.get<HardwareSpec[]>("/hardware")).data,
  })

  const devices = useQuery({
    queryKey: ["devices"],
    queryFn: async () => (await api.get<Device[]>("/devices")).data,
  })

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        deviceId: form.deviceId ? Number(form.deviceId) : null,
      }
      return editing
        ? (await api.put(`/hardware/${editing.id}`, payload)).data
        : (await api.post("/hardware", payload)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hardware"] })
      setOpen(false)
    },
    onError: (e) => alert(errorMessage(e)),
  })

  function launch(hw?: HardwareSpec) {
    setEditing(hw || null)
    setForm(
      hw
        ? {
            material: hw.material,
            customMaterial: hw.customMaterial || "",
            grade: hw.grade || "",
            sheetThickness: hw.sheetThickness || "",
            gauge: hw.gauge || "",
            meshHoleSize: hw.meshHoleSize || "",
            meshOpenArea: hw.meshOpenArea || "",
            customMeshSize: hw.customMeshSize || "",
            customOpenArea: hw.customOpenArea || "",
            deviceId: hw.deviceId ? String(hw.deviceId) : "",
          }
        : blank,
    )
    setOpen(true)
  }

  const filtered = (specs.data ?? []).filter(
    (s) =>
      (s.material + (s.deviceName || "") + (s.grade || ""))
        .toLowerCase()
        .includes(search.toLowerCase()),
  )

  const selectedMesh = form.meshHoleSize
  const isCustomMesh = selectedMesh === "Custom"

  return (
    <>
      <PageHeader
        title="Hardware specifications"
        description="Materials, mesh sizes and technical specifications for Smart Drain filter devices."
        action={
          <Button onClick={() => launch()}>
            <Plus size={16} /> Add specification
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-xl border bg-white px-3">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-2.5 text-sm outline-none"
          placeholder="Search hardware specs…"
        />
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Material</Th>
            <Th>Grade</Th>
            <Th>Sheet / Gauge</Th>
            <Th>Mesh Size</Th>
            <Th>Open Area</Th>
            <Th>Assigned Device</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((hw) => (
            <tr key={hw.id} className="hover:bg-slate-50/60">
              <Td>
                <b className="text-sm">{hw.material}</b>
                {hw.customMaterial && (
                  <div className="text-xs text-slate-500">{hw.customMaterial}</div>
                )}
              </Td>
              <Td>{hw.grade || "—"}</Td>
              <Td>
                {hw.sheetThickness || hw.gauge
                  ? `${hw.sheetThickness || "—"} / ${hw.gauge || "—"}`
                  : "—"}
              </Td>
              <Td>{hw.meshHoleSize || hw.customMeshSize || "—"}</Td>
              <Td>{hw.meshOpenArea || hw.customOpenArea || "—"}</Td>
              <Td className="text-sm">{hw.deviceName || "—"}</Td>
              <Td className="text-xs text-slate-500">{dateTime(hw.createdAt)}</Td>
              <Td>
                <Button variant="ghost" onClick={() => launch(hw)}>
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
        title={editing ? "Edit hardware specification" : "Add hardware specification"}
        wide
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Material">
            <Select
              value={form.material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
            >
              {MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>

          {form.material === "Other" && (
            <Field label="Custom material name">
              <Input
                value={form.customMaterial}
                onChange={(e) =>
                  setForm({ ...form, customMaterial: e.target.value })
                }
                placeholder="Specify material"
              />
            </Field>
          )}

          <Field label="Grade">
            <Input
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              placeholder="e.g. 304L"
            />
          </Field>

          <Field label="Sheet thickness">
            <Input
              value={form.sheetThickness}
              onChange={(e) =>
                setForm({ ...form, sheetThickness: e.target.value })
              }
              placeholder="e.g. 1.2mm"
            />
          </Field>

          <Field label="Gauge">
            <Input
              value={form.gauge}
              onChange={(e) => setForm({ ...form, gauge: e.target.value })}
              placeholder="e.g. 18 SWG"
            />
          </Field>

          <Field label="Mesh hole size">
            <Select
              value={form.meshHoleSize}
              onChange={(e) => {
                const val = e.target.value
                const area = MESH_SIZES[val]
                setForm({
                  ...form,
                  meshHoleSize: val === "Custom" ? "" : val,
                  meshOpenArea: val === "Custom" ? "" : area || "",
                  customMeshSize: val === "Custom" ? form.customMeshSize : "",
                  customOpenArea: val === "Custom" ? form.customOpenArea : "",
                })
              }}
            >
              <option value="">Select mesh size</option>
              {Object.entries(MESH_SIZES).map(([size, area]) => (
                <option key={size} value={size}>
                  {size === "Custom" ? "Custom" : `${size} (${area} open area)`}
                </option>
              ))}
            </Select>
          </Field>

          {!isCustomMesh && form.meshOpenArea && (
            <Field label="Open area %">
              <Input value={form.meshOpenArea} readOnly />
            </Field>
          )}

          {isCustomMesh && (
            <>
              <Field label="Custom mesh size">
                <Input
                  value={form.customMeshSize}
                  onChange={(e) =>
                    setForm({ ...form, customMeshSize: e.target.value })
                  }
                  placeholder="e.g. 7mm"
                />
              </Field>
              <Field label="Custom open area %">
                <Input
                  value={form.customOpenArea}
                  onChange={(e) =>
                    setForm({ ...form, customOpenArea: e.target.value })
                  }
                  placeholder="e.g. 75%"
                />
              </Field>
            </>
          )}

          <Field label="Assign to device" hint="Optional">
            <Select
              value={form.deviceId}
              onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
            >
              <option value="">None</option>
              {(devices.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.deviceCode})
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save specification"}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
