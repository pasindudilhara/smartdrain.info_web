import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { MapPin, CheckCircle2, MessageSquare } from "lucide-react"
import api from "@/lib/api"
import type { Alert, AlertStatus } from "@/lib/types"
import { PageHeader } from "@/components/PageParts"
import { TableWrap, Th, Td } from "@/components/ui/table"
import { SeverityBadge, StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { dateTime, pretty } from "@/lib/format"
import { useAuth } from "@/lib/auth"

export default function AlertsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await api.get<Alert[]>("/alerts")).data,
    refetchInterval: 20000,
  })

  const m = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number
      status: AlertStatus
    }) => (await api.patch(`/alerts/${id}/status?status=${status}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })

  const isCouncilUser =
    user?.role === "URBAN_COUNCIL_ADMIN" || user?.role === "SUPER_ADMIN"

  return (
    <>
      <PageHeader
        title="Critical Alerts"
        description="Threshold events generated from council-configured rules with notification tracking."
      />

      <TableWrap>
        <thead>
          <tr>
            <Th>Severity</Th>
            <Th>Device</Th>
            <Th>Alert</Th>
            <Th>Location</Th>
            <Th>Notified To</Th>
            <Th>Status</Th>
            <Th>Time</Th>
            <Th>Addressed</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {q.data?.map((a) => (
            <tr key={a.id}>
              <Td>
                <SeverityBadge severity={a.severity} />
              </Td>
              <Td>
                <b>{a.deviceName}</b>
                <div className="text-xs text-slate-500">{a.councilName}</div>
              </Td>
              <Td>
                <b className="text-sm">{pretty(a.alertType)}</b>
                <div className="max-w-md text-xs text-slate-500">
                  {a.message}
                </div>
              </Td>
              <Td>
                {a.deviceAddress && (
                  <div className="text-xs text-slate-500 mb-1">
                    {a.deviceAddress}
                  </div>
                )}
                <a
                  href={`https://www.google.com/maps?q=${a.deviceLatitude},${a.deviceLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100 transition-colors"
                >
                  <MapPin size={10} /> Map
                </a>
              </Td>
              <Td>
                {a.notifications && a.notifications.length > 0 ? (
                  <div className="space-y-1">
                    {a.notifications.map((n) => (
                      <div key={n.id} className="text-xs">
                        <span className="font-medium">{n.recipientName}</span>
                        {/* Show WhatsApp channel indicator */}
                        {n.channel === "WHATSAPP" && (
                          <span
                            className="ml-1 inline-flex items-center gap-0.5 text-emerald-600"
                            title="Council WhatsApp channel"
                          >
                            <MessageSquare size={10} />
                            <span className="text-[10px]">WA</span>
                          </span>
                        )}
                        <Badge
                          tone={
                            n.deliveryStatus === "DELIVERED" ||
                            n.deliveryStatus === "SENT"
                              ? "green"
                              : n.deliveryStatus === "FAILED"
                                ? "red"
                                : "slate"
                          }
                        >
                          {n.deliveryStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </Td>
              <Td>
                <StatusBadge status={a.status} />
              </Td>
              <Td className="text-xs text-slate-500">
                {dateTime(a.createdAt)}
              </Td>
              {/* Addressed info column */}
              <Td>
                {a.status === "ADDRESSED" ? (
                  <div className="text-xs text-emerald-700 space-y-0.5">
                    <div className="flex items-center gap-1 font-medium">
                      <CheckCircle2 size={12} />
                      Addressed
                    </div>
                    {a.addressedAt && (
                      <div className="text-slate-400">{dateTime(a.addressedAt)}</div>
                    )}
                    {a.addressedBy && (
                      <div className="text-slate-500">by {a.addressedBy}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </Td>
              <Td>
                <div className="flex flex-col gap-1">
                  {a.status === "OPEN" && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        m.mutate({ id: a.id, status: "ACKNOWLEDGED" })
                      }
                      disabled={m.isPending}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {(a.status === "OPEN" || a.status === "ACKNOWLEDGED") &&
                    isCouncilUser && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Mark this alert as addressed? This records that your team has attended to the issue.",
                            )
                          ) {
                            m.mutate({ id: a.id, status: "ADDRESSED" })
                          }
                        }}
                        disabled={m.isPending}
                        className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      >
                        <CheckCircle2 size={14} /> Mark as Addressed
                      </Button>
                    )}
                  {a.status !== "RESOLVED" && a.status !== "ADDRESSED" && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        m.mutate({ id: a.id, status: "RESOLVED" })
                      }
                      disabled={m.isPending}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </>
  )
}
