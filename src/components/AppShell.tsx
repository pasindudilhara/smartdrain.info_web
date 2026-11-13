import { NavLink, Outlet, Link } from "react-router-dom"
import {
  Bell,
  Building2,
  ChartNoAxesCombined,
  FileText,
  Gauge,
  LogOut,
  Map,
  Settings2,
  RadioTower,
  ExternalLink,
  Menu,
  X,
  Wrench,
  Warehouse,
  ClipboardList,
  Trash2,
  Users2,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useState } from "react"

const common = [
  ["/app", "Overview", Gauge],
  ["/app/map", "Live Map", Map],
  ["/app/devices", "Monitoring Hot Spots", RadioTower],
  ["/app/analytics", "Analytics", ChartNoAxesCombined],
  ["/app/alerts", "Critical Alerts", Bell],
  ["/app/reports", "Reports", FileText],
  ["/app/thresholds", "Thresholds", Settings2],
] as const

/* ── Sidebar nav item ── */
function SideNavItem({
  to,
  label,
  Icon,
  end,
}: {
  to: string
  label: string
  Icon: React.ElementType
  end?: boolean
}) {
  return (
    <NavLink
      end={end}
      to={to}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          isActive
            ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]"
            : "text-emerald-50/60 hover:bg-white/6 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && (
            <span
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: 3,
                height: 18,
                borderRadius: 99,
                background: "#6ee7b7",
              }}
            />
          )}
          <Icon size={17} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }} />
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav =
    user?.role === "SUPER_ADMIN"
      ? [...common.slice(0, 1), ["/app/councils", "Councils", Building2] as const, ...common.slice(1)]
      : common

  const initials = (user?.displayName ?? user?.username ?? "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  /* ── Sidebar content (shared between desktop + mobile drawer) ── */
  const SidebarContent = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "20px 14px",
      }}
    >
      {/* Brand */}
      <Link
        to="/app"
        onClick={() => setMobileOpen(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "6px 6px 6px 4px",
          marginBottom: 6,
          borderRadius: 14,
          textDecoration: "none",
          transition: "background .15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.05)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        {/* Logo badge */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            overflow: "hidden",
            background: "rgba(110,231,183,.12)",
            border: "1.5px solid rgba(110,231,183,.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <img
            src="/urban-inventors-logo.png"
            alt="SmartDrain"
            style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 8 }}
          />
        </div>
        <div>
          <span
            style={{
              display: "block",
              fontWeight: 700,
              fontSize: 15,
              color: "#fff",
              letterSpacing: "-.01em",
              lineHeight: 1.2,
            }}
          >
            Smart Drain
          </span>
          <span
            style={{
              display: "block",
              fontSize: 11,
              color: "rgba(167,243,208,.5)",
              marginTop: 1,
            }}
          >
            Flood & Waste Hub
          </span>
        </div>
      </Link>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,.06)", margin: "12px 0" }} />

      {/* Nav section label */}
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "rgba(167,243,208,.35)",
          padding: "0 6px",
          marginBottom: 6,
        }}
      >
        Navigation
      </p>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {nav.map(([to, label, Icon]) => (
          <SideNavItem
            key={to}
            to={to}
            label={label}
            Icon={Icon}
            end={to === "/app"}
          />
        ))}

        {/* Litter Management section */}
        <div style={{ height: 1, background: "rgba(255,255,255,.06)", margin: "10px 0" }} />
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "rgba(167,243,208,.35)",
            padding: "0 6px",
            marginBottom: 4,
          }}
        >
          Litter Management
        </p>
        <SideNavItem to="/app/litter" label="Overview" Icon={Trash2} />
        <SideNavItem to="/app/hardware" label="Hardware" Icon={Wrench} />
        <SideNavItem to="/app/facilities" label="Facilities" Icon={Warehouse} />
        <SideNavItem to="/app/handover-records" label="Handover Records" Icon={ClipboardList} />
        <SideNavItem to="/app/collection-partners" label="Collection Partners" Icon={Users2} />
      </nav>

      {/* Bottom section */}
      <div style={{ marginTop: "auto" }}>
        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,.06)", margin: "14px 0" }} />

        {/* User chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 10px",
            borderRadius: 14,
            background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(255,255,255,.07)",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(110,231,183,.18)",
              border: "1.5px solid rgba(110,231,183,.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 700,
              color: "#6ee7b7",
              letterSpacing: ".02em",
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.displayName ?? user?.username}
            </span>
            <span
              style={{
                display: "block",
                fontSize: 11,
                color: "rgba(167,243,208,.45)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.role === "SUPER_ADMIN" ? "Super Admin" : user?.councilName ?? "Council"}
            </span>
          </div>
        </div>

        {/* Public map link */}
        <Link
          to="/public"
          onClick={() => setMobileOpen(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 11,
            border: "1px solid rgba(255,255,255,.08)",
            padding: "8px 10px",
            fontSize: 13,
            color: "rgba(209,250,229,.6)",
            textDecoration: "none",
            transition: "background .15s, color .15s",
            marginBottom: 4,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = "rgba(255,255,255,.05)"
            el.style.color = "rgba(209,250,229,.9)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = "transparent"
            el.style.color = "rgba(209,250,229,.6)"
          }}
        >
          <ExternalLink size={15} style={{ flexShrink: 0 }} />
          Public Map
        </Link>

        {/* Sign out */}
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            borderRadius: 11,
            border: "none",
            background: "transparent",
            padding: "8px 10px",
            fontSize: 13,
            color: "rgba(209,250,229,.5)",
            cursor: "pointer",
            transition: "background .15s, color .15s",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = "rgba(239,68,68,.1)"
            el.style.color = "#fca5a5"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = "transparent"
            el.style.color = "rgba(209,250,229,.5)"
          }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#f5f8f6" }}>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:block"
        style={{
          position: "fixed",
          inset: "0 auto 0 0",
          width: 240,
          zIndex: 40,
          background: "#10251b",
          borderRight: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer backdrop ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 48,
            background: "rgba(0,0,0,.45)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className="lg:hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 240,
          zIndex: 49,
          background: "#10251b",
          borderRight: "1px solid rgba(255,255,255,.06)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .22s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <main className="lg:pl-60">
        {/* Top header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px 0 24px",
            background: "rgba(255,255,255,.92)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(15,23,42,.07)",
            boxShadow: "0 1px 3px rgba(15,23,42,.05)",
          }}
        >
          {/* Mobile: hamburger + logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "transparent",
                cursor: "pointer",
                color: "#334155",
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2">
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "rgba(5,150,105,.1)",
                  border: "1px solid rgba(5,150,105,.18)",
                }}
              >
                <img
                  src="/urban-inventors-logo.png"
                  alt="SmartDrain"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#10251b" }}>Smart Drain</span>
            </div>

            {/* Desktop: page context */}
            <div className="hidden lg:block">
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.2 }}>
                {user?.role === "SUPER_ADMIN" ? "Super Admin Console" : user?.councilName}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
                {user?.displayName}
              </div>
            </div>
          </div>

          {/* Mobile: quick actions */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/public"
              style={{ fontSize: 13, fontWeight: 600, color: "#059669", textDecoration: "none" }}
            >
              Public map
            </Link>
            <button
              onClick={logout}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "transparent",
                cursor: "pointer",
                color: "#475569",
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Mobile bottom tab bar */}
        <div
          className="lg:hidden"
          style={{
            position: "sticky",
            top: 60,
            zIndex: 20,
            display: "flex",
            gap: 4,
            overflowX: "auto",
            borderBottom: "1px solid #e2e8f0",
            background: "#fff",
            padding: "6px 10px",
          }}
        >
          {nav.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              end={to === "/app"}
              to={to}
              style={({ isActive }) => ({
                display: "flex",
                flexShrink: 0,
                alignItems: "center",
                gap: 5,
                borderRadius: 9,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                background: isActive ? "#ecfdf5" : "transparent",
                color: isActive ? "#065f46" : "#64748b",
                transition: "background .15s, color .15s",
              })}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Page content */}
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "20px 20px 32px" }} className="md:px-7">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
