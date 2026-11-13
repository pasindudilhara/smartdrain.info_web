import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, MapPinned, User, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username, password);
      nav("/app");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f5f8f6" }}>
      {/* ── Left hero panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden"
        style={{ background: "#10251b" }}
      >
        {/* Decorative radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 20% 80%, rgba(52,211,153,.13) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 10%, rgba(52,211,153,.07) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />

        {/* Logo watermark at the bottom */}
        <div
          style={{
            position: "absolute",
            bottom: -30,
            right: -40,
            width: 480,
            opacity: 0.07,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <img
            src="/urban-inventors-logo.png"
            alt=""
            style={{ width: "100%", filter: "brightness(3) saturate(0)" }}
            draggable={false}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                overflow: "hidden",
                background: "rgba(52,211,153,.12)",
                border: "1.5px solid rgba(52,211,153,.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img
                src="/urban-inventors-logo.png"
                alt="SmartDrain logo"
                style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }}
              />
            </div>
            <div>
              <span
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#fff",
                  letterSpacing: "-.01em",
                }}
              >
                SmartDrain
              </span>
              <span style={{ display: "block", fontSize: 11, color: "rgba(167,243,208,.55)", marginTop: 1 }}>
                Urban Infrastructure Intelligence
              </span>
            </div>
          </div>

          {/* Hero copy */}
          <div style={{ maxWidth: 460 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "#6ee7b7",
                marginBottom: 20,
              }}
            >
              One network. Every drain.
            </p>
            <h1
              style={{
                fontSize: "clamp(2rem, 3.2vw, 3.2rem)",
                fontWeight: 700,
                lineHeight: 1.12,
                color: "#fff",
                letterSpacing: "-.025em",
                margin: 0,
              }}
            >
              Live visibility for safer, smarter&nbsp;urban drainage.
            </h1>
            <p
              style={{
                marginTop: 20,
                fontSize: 15,
                lineHeight: 1.7,
                color: "rgba(209,250,229,.55)",
                maxWidth: 380,
              }}
            >
              Multi-council device monitoring, threshold intelligence, public transparency
              and operational analytics — all in one platform.
            </p>

            {/* Feature pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 32 }}>
              {["Real-time monitoring", "Multi-council", "Public transparency", "Smart alerts"].map((f) => (
                <span
                  key={f}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 99,
                    background: "rgba(52,211,153,.1)",
                    border: "1px solid rgba(52,211,153,.2)",
                    color: "#6ee7b7",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ fontSize: 12, color: "rgba(209,250,229,.3)" }}>
            Urban Inventors · SmartDrain Platform
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Mobile-only brand mark */}
          <div
            className="flex lg:hidden items-center gap-3 mb-8"
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                overflow: "hidden",
                background: "rgba(5,150,105,.1)",
                border: "1.5px solid rgba(5,150,105,.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img
                src="/urban-inventors-logo.png"
                alt="SmartDrain"
                style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6 }}
              />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#10251b", display: "block" }}>
                SmartDrain
              </span>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Urban Infrastructure Intelligence</span>
            </div>
          </div>

          {/* Card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: "36px 32px",
              boxShadow:
                "0 0 0 1px rgba(15,23,42,.06), 0 4px 6px -1px rgba(15,23,42,.07), 0 24px 48px -8px rgba(15,23,42,.10)",
            }}
          >
            {/* Card header */}
            <div style={{ marginBottom: 28 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-.025em",
                  color: "#0f172a",
                }}
              >
                Welcome back
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
                Sign in as Super Admin or an Urban Council operator.
              </p>
            </div>

            <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
              {/* Username field */}
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Username</span>
                <div style={{ position: "relative" }}>
                  <User
                    size={15}
                    style={{
                      position: "absolute",
                      left: 13,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      pointerEvents: "none",
                    }}
                  />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="Enter username"
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </label>

              {/* Password field */}
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</span>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={15}
                    style={{
                      position: "absolute",
                      left: 13,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      pointerEvents: "none",
                    }}
                  />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </label>

              {/* Error message */}
              {error && (
                <div
                  style={{
                    borderRadius: 12,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16 }}>⚠</span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                disabled={busy}
                size="lg"
                className="w-full mt-1"
                style={{ borderRadius: 14, fontWeight: 600, letterSpacing: "-.01em" }}
              >
                {busy ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,.4)",
                        borderTopColor: "#fff",
                        animation: "spin .7s linear infinite",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>

          </div>

          {/* Public map link */}
          <Link
            to="/public"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 20,
              fontSize: 14,
              fontWeight: 600,
              color: "#059669",
              textDecoration: "none",
              padding: "10px 0",
              borderRadius: 12,
              transition: "background .15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(5,150,105,.06)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")
            }
          >
            <MapPinned size={16} />
            Open public device map
          </Link>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
