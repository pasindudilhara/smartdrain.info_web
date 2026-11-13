import { useState, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit3, Search, MapPin } from "lucide-react"
import api, { errorMessage } from "@/lib/api"
import type { HandoverFacility, FacilityType, FacilityStatus, Council } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/PageParts"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Field, Input, Select, Textarea } from "@/components/ui/input"
import { TableWrap, Th, Td } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { pretty, dateTime } from "@/lib/format"

interface FacilityForm {
  facilityName: string
  facilityType: FacilityType
  councilId: string
  latitude: string
  longitude: string
  contactPerson: string
  phoneNumber: string
  acceptedWasteTypes: string
  facilityStatus: FacilityStatus
}

const blank: FacilityForm = {
  facilityName: "",
  facilityType: "SORTING_FACILITY",
  councilId: "",
  latitude: "",
  longitude: "",
  contactPerson: "",
  phoneNumber: "",
  acceptedWasteTypes: "",
  facilityStatus: "ACTIVE",
}

export default function FacilitiesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<HandoverFacility | null>(null)
  const [form, setForm] = useState<FacilityForm>(blank)
  const [search, setSearch] = useState("")

  const facilities = useQuery({
    queryKey: ["facilities"],
    queryFn: async () => (await api.get<HandoverFacility[]>("/facilities")).data,
  })

  const councils = useQuery({
    queryKey: ["councils"],
    enabled: user?.role === "SUPER_ADMIN",
    queryFn: async () => (await api.get<Council[]>("/admin/councils")).data,
  })

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        // Map front-end fields to backend field names
        personInCharge: form.contactPerson,
        contactNumber: form.phoneNumber,
        councilId: user?.role === "SUPER_ADMIN" ? Number(form.councilId) : undefined,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      }
      return editing
        ? (await api.put(`/facilities/${editing.id}`, payload)).data
        : (await api.post("/facilities", payload)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facilities"] })
      setOpen(false)
    },
    onError: (e) => alert(errorMessage(e)),
  })

  function launch(f?: HandoverFacility) {
    setEditing(f || null)
    setForm(
      f
        ? {
            facilityName: f.facilityName,
            facilityType: f.facilityType,
            councilId: String(f.councilId),
            latitude: f.latitude != null ? String(f.latitude) : "",
            longitude: f.longitude != null ? String(f.longitude) : "",
            contactPerson: f.personInCharge || "",
            phoneNumber: f.contactNumber || "",
            acceptedWasteTypes: f.acceptedWasteTypes || "",
            facilityStatus: f.facilityStatus,
          }
        : { ...blank, councilId: user?.councilId ? String(user.councilId) : "" },
    )
    setOpen(true)
  }

  const filtered = useMemo(
    () =>
      (facilities.data ?? []).filter((f) =>
        (f.facilityName + f.councilName + (f.personInCharge || ""))
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [facilities.data, search],
  )

  return (
    <>
      <PageHeader
        title="Handover facilities"
        description="Manage sorting, recycling, and waste transfer facilities for litter collection handover."
        action={
          <Button onClick={() => launch()}>
            <Plus size={16} /> Add facility
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-xl border bg-white px-3">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-2.5 text-sm outline-none"
          placeholder="Search facilities…"
        />
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Facility</Th>
            <Th>Type</Th>
            <Th>Council</Th>
            <Th>Contact Person</Th>
            <Th>Phone Number</Th>
            <Th>Status</Th>
            <Th>Location</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((f) => (
            <tr key={f.id} className="hover:bg-slate-50/60">
              <Td>
                <b className="text-sm">{f.facilityName}</b>
              </Td>
              <Td>
                <Badge tone={f.facilityType === "RECYCLING_FACILITY" ? "green" : "blue"}>
                  {pretty(f.facilityType)}
                </Badge>
              </Td>
              <Td className="text-sm">{f.councilName}</Td>
              <Td className="text-sm">{f.personInCharge || "—"}</Td>
              <Td className="text-xs">
                {f.contactNumber || "—"}
              </Td>
              <Td>
                <Badge tone={f.facilityStatus === "ACTIVE" ? "green" : "slate"}>
                  {f.facilityStatus}
                </Badge>
              </Td>
              <Td>
                {f.latitude && f.longitude ? (
                  <a
                    href={`https://www.google.com/maps?q=${f.latitude},${f.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800"
                  >
                    <MapPin size={11} /> Map
                  </a>
                ) : (
                  "—"
                )}
              </Td>
              <Td>
                <Button variant="ghost" onClick={() => launch(f)}>
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
        title={editing ? "Edit facility" : "Add facility"}
        wide
      >
        <div className="grid gap-4 md:grid-cols-2">
          {user?.role === "SUPER_ADMIN" && (
            <Field label="Urban Council">
              <Select
                value={form.councilId}
                onChange={(e) => setForm({ ...form, councilId: e.target.value })}
              >
                <option value="">Select council</option>
                {councils.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Facility name">
            <Input
              value={form.facilityName}
              onChange={(e) =>
                setForm({ ...form, facilityName: e.target.value })
              }
            />
          </Field>

          <Field label="Facility type">
            <Select
              value={form.facilityType}
              onChange={(e) =>
                setForm({
                  ...form,
                  facilityType: e.target.value as FacilityType,
                })
              }
            >
              <option value="SORTING_FACILITY">Sorting Facility</option>
              <option value="RECYCLING_FACILITY">Recycling Facility</option>
              <option value="WASTE_TRANSFER_STATION">
                Waste Transfer Station
              </option>
              <option value="COUNCIL_FACILITY">Council Facility</option>
            </Select>
          </Field>

          <Field label="Status">
            <Select
              value={form.facilityStatus}
              onChange={(e) =>
                setForm({
                  ...form,
                  facilityStatus: e.target.value as FacilityStatus,
                })
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>

          <Field label="Contact Person">
            <Input
              value={form.contactPerson}
              onChange={(e) =>
                setForm({ ...form, contactPerson: e.target.value })
              }
            />
          </Field>

          <Field label="Phone Number">
            <Input
              value={form.phoneNumber}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: e.target.value })
              }
            />
          </Field>

          <Field label="Location (latitude)">
            <Input
              type="number"
              step="0.000001"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            />
          </Field>
          <Field label="Location (longitude)">
            <Input
              type="number"
              step="0.000001"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            />
          </Field>

          <Field label="Accepted waste types" hint="Comma-separated">
            <Textarea
              value={form.acceptedWasteTypes}
              onChange={(e) =>
                setForm({ ...form, acceptedWasteTypes: e.target.value })
              }
              rows={2}
              placeholder="e.g. Plastic, Organic, Metal"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save facility"}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
