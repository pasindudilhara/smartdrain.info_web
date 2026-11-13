import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit3, Plus, Search } from "lucide-react"
import api, { errorMessage } from "@/lib/api"
import type { CollectionPartner, Council } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/PageParts"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Field, Input, Select } from "@/components/ui/input"
import { TableWrap, Th, Td } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { dateTime } from "@/lib/format"

interface PartnerForm {
  partnerName: string
  contactPerson: string
  phoneNumber: string
  email: string
  councilId: string
  status: "ACTIVE" | "INACTIVE"
}

const blank: PartnerForm = {
  partnerName: "",
  contactPerson: "",
  phoneNumber: "",
  email: "",
  councilId: "",
  status: "ACTIVE",
}

export default function CollectionPartnersPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CollectionPartner | null>(null)
  const [form, setForm] = useState<PartnerForm>(blank)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [councilFilter, setCouncilFilter] = useState<string>("")

  const partners = useQuery({
    queryKey: ["collection-partners"],
    queryFn: async () =>
      (await api.get<CollectionPartner[]>("/collection-partners")).data,
  })

  const councils = useQuery({
    queryKey: ["councils"],
    enabled: user?.role === "SUPER_ADMIN",
    queryFn: async () =>
      (await api.get<Council[]>("/admin/councils")).data,
  })

  const save = useMutation({
    mutationFn: async () => {
      if (!form.partnerName.trim()) throw new Error("Partner / Company Name is required.")
      const payload = {
        ...form,
        councilId: user?.role === "SUPER_ADMIN" ? Number(form.councilId) : undefined,
      }
      return editing
        ? (await api.put(`/collection-partners/${editing.id}`, payload)).data
        : (await api.post("/collection-partners", payload)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection-partners"] })
      setOpen(false)
    },
    onError: (e) => alert(errorMessage(e)),
  })

  function launch(p?: CollectionPartner) {
    setEditing(p || null)
    setForm(
      p
        ? {
            partnerName: p.partnerName,
            contactPerson: p.contactPerson || "",
            phoneNumber: p.phoneNumber || "",
            email: p.email || "",
            councilId: String(p.councilId),
            status: p.status,
          }
        : { ...blank, councilId: user?.councilId ? String(user.councilId) : "" },
    )
    setOpen(true)
  }

  const filtered = useMemo(() => {
    let list = partners.data ?? []
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) =>
        (p.partnerName + (p.contactPerson ?? "") + p.councilName)
          .toLowerCase()
          .includes(q),
      )
    }
    if (statusFilter) list = list.filter((p) => p.status === statusFilter)
    if (councilFilter) list = list.filter((p) => String(p.councilId) === councilFilter)
    return list
  }, [partners.data, search, statusFilter, councilFilter])

  const isApiReady = !partners.isError

  return (
    <>
      <PageHeader
        title="Collection Partners"
        description="Companies and individuals responsible for emptying filters/bins and transporting collected litter."
        action={
          <Button onClick={() => launch()}>
            <Plus size={16} /> Add partner
          </Button>
        }
      />

      {/* API not yet available notice */}
      {partners.isError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <b>Backend endpoint not yet available:</b> <code>GET /collection-partners</code> returned an error.
          This module requires a new backend endpoint. Displaying empty state until the API is ready.
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border bg-white px-3">
          <Search size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 text-sm outline-none"
            placeholder="Search partners, contacts or councils…"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        {user?.role === "SUPER_ADMIN" && councils.data && (
          <select
            value={councilFilter}
            onChange={(e) => setCouncilFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">All councils</option>
            {councils.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Partner / Company</Th>
            <Th>Contact Person</Th>
            <Th>Phone Number</Th>
            <Th>Email</Th>
            <Th>Council Area</Th>
            <Th>Status</Th>
            <Th>Since</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="py-10 text-center text-sm text-slate-400"
              >
                {partners.isLoading
                  ? "Loading collection partners…"
                  : "No collection partners found."}
              </td>
            </tr>
          ) : (
            filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <Td>
                  <b className="text-sm">{p.partnerName}</b>
                </Td>
                <Td className="text-sm">{p.contactPerson || "—"}</Td>
                <Td className="text-sm">{p.phoneNumber || "—"}</Td>
                <Td className="text-sm">{p.email || "—"}</Td>
                <Td className="text-sm">{p.councilName}</Td>
                <Td>
                  <Badge tone={p.status === "ACTIVE" ? "green" : "slate"}>
                    {p.status}
                  </Badge>
                </Td>
                <Td className="text-xs text-slate-500">
                  {dateTime(p.createdAt)}
                </Td>
                <Td>
                  <Button variant="ghost" onClick={() => launch(p)}>
                    <Edit3 size={15} /> Edit
                  </Button>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit collection partner" : "Add collection partner"}
        wide
      >
        <div className="grid gap-4 md:grid-cols-2">
          {user?.role === "SUPER_ADMIN" && (
            <Field label="Council Area">
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

          <Field label="Partner / Company Name *">
            <Input
              value={form.partnerName}
              placeholder="e.g. Green Collect Ltd."
              onChange={(e) => setForm({ ...form, partnerName: e.target.value })}
              required
            />
          </Field>

          <Field label="Contact Person">
            <Input
              value={form.contactPerson}
              placeholder="e.g. John Silva"
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            />
          </Field>

          <Field label="Phone Number">
            <Input
              type="tel"
              value={form.phoneNumber}
              placeholder="e.g. +94 77 123 4567"
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              placeholder="e.g. contact@greencollect.lk"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>

          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as "ACTIVE" | "INACTIVE" })
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save partner"}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
