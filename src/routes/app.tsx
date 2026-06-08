import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificacionesBell } from "@/components/NotificacionesBell";
import { HeaderUsoBadge } from "@/components/HeaderUsoBadge";
import { A360Logo } from "@/components/A360Logo";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

// ── Nav types ──────────────────────────────────────────────────────────────
type NavItem =
  | { label: string; href: string; icon: string; upcoming: true }
  | { label: string; href: string; icon: string; upcoming?: false };

type NavModule = { id: string; label: string; items: NavItem[] };

const NAV_MODULES: NavModule[] = [
  {
    id: "inicio",
    label: "Inicio",
    items: [
      { label: "Dashboard",          href: "/app/dashboard", icon: "🏠" },
      { label: "Actividad reciente",  href: "/app/clientes",  icon: "⚡" },
      { label: "Tareas pendientes",   href: "/app/kpis",      icon: "✅" },
    ],
  },
  {
    id: "clientes",
    label: "Clientes",
    items: [
      { label: "Todos los clientes", href: "/app/clientes",    icon: "👥" },
      { label: "Nuevo cliente",      href: "/app/clientes",    icon: "➕" },
      { label: "Segmentos",          href: "/app/crecimiento", icon: "🎯" },
    ],
  },
  {
    id: "diagnostico",
    label: "Diagnóstico",
    items: [
      { label: "SIDE",             href: "/app/side", icon: "📊" },
      { label: "Plan Estratégico", href: "/app/plan", icon: "🗺️" },
      { label: "Resultados",       href: "/app/kpis", icon: "📈" },
    ],
  },
  {
    id: "desarrollo",
    label: "Desarrollo",
    items: [
      { label: "Programa LEE",    href: "/app/lee",                  icon: "🎓" },
      { label: "Coaching A360",   href: "/app/coaching",             icon: "🤝" },
      { label: "Biblioteca",      href: "/app/coaching/metodologia", icon: "📚" },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    items: [
      { label: "Pipeline",          href: "#", icon: "🔄", upcoming: true },
      { label: "Cotizaciones",      href: "#", icon: "💰", upcoming: true },
      { label: "Marketing Digital", href: "/app/crecimiento", icon: "📣" },
    ],
  },
  {
    id: "operaciones",
    label: "Operaciones",
    items: [
      { label: "BizOS",            href: "#", icon: "⚙️", upcoming: true },
      { label: "Suite Financiera", href: "#", icon: "💼", upcoming: true },
      { label: "Suite CX",         href: "#", icon: "🎫", upcoming: true },
    ],
  },
];

// ── TopBar ─────────────────────────────────────────────────────────────────
function TopBar() {
  const { user, profile, role } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [openModule, setOpenModule] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const initials = (profile?.name || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Close dropdown on route change
  useEffect(() => { setOpenModule(null); }, [path]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openModule) return;
    function onDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenModule(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openModule]);

  const isModuleActive = (mod: NavModule) =>
    mod.items.some(
      (item) =>
        !item.upcoming &&
        item.href !== "#" &&
        (path === item.href || path.startsWith(item.href + "/")),
    );

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "56px",
        background: "white",
        borderBottom: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        padding: "0 12px 0 8px",
        zIndex: 50,
        gap: 0,
      }}
    >
      {/* Left: sidebar trigger + logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, paddingRight: "20px" }}>
        <SidebarTrigger className="text-[#94A3B8] hover:text-[#0C4A6E]" />
        <A360Logo size={26} withText />
      </div>

      {/* Center-left: module navigation — flexShrink:0 so it never compresses into the right section */}
      <nav
        ref={navRef}
        style={{ display: "flex", alignItems: "stretch", height: "56px", flexShrink: 0 }}
      >
        {NAV_MODULES.map((mod) => {
          const active = isModuleActive(mod);
          const isOpen = openModule === mod.id;
          const highlighted = active || isOpen;

          return (
            <div key={mod.id} style={{ position: "relative", flexShrink: 0 }}>
              {/* Module button */}
              <button
                onClick={() => setOpenModule(isOpen ? null : mod.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "0 18px",
                  height: "56px",
                  background: "transparent",
                  border: "none",
                  borderBottom: highlighted ? "3px solid #0EA5E9" : "3px solid transparent",
                  borderTop: "3px solid transparent",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: highlighted ? "#0EA5E9" : "#64748B",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!highlighted) {
                    e.currentTarget.style.color = "#0EA5E9";
                    e.currentTarget.style.borderBottomColor = "#BAE6FD";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!highlighted) {
                    e.currentTarget.style.color = "#64748B";
                    e.currentTarget.style.borderBottomColor = "transparent";
                  }
                }}
              >
                {mod.label}
                <ChevronDown
                  size={13}
                  style={{
                    transition: "transform 0.15s",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    opacity: 0.65,
                  }}
                />
              </button>

              {/* Dropdown */}
              {isOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 2px)",
                    left: "0",
                    background: "white",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    borderRadius: "12px",
                    padding: "8px",
                    minWidth: "220px",
                    zIndex: 50,
                    border: "1px solid #F1F5F9",
                  }}
                >
                  {mod.items.map((item) =>
                    item.upcoming ? (
                      // Upcoming item — button with toast
                      <button
                        key={item.label}
                        onClick={() => {
                          setOpenModule(null);
                          toast.info("Módulo próximamente", {
                            description: `${item.label} estará disponible próximamente.`,
                          });
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          background: "transparent",
                          border: "none",
                          fontSize: "15px",
                          color: "#94A3B8",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>{item.icon}</span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          Pronto
                        </span>
                      </button>
                    ) : (
                      // Active item — Link navigation
                      <Link
                        key={item.label}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        to={item.href as any}
                        onClick={() => setOpenModule(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          fontSize: "15px",
                          color: "#374151",
                          textDecoration: "none",
                          transition: "background 0.1s, color 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#F0F9FF";
                          e.currentTarget.style.color = "#0EA5E9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#374151";
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Flexible spacer — absorbs remaining space, can shrink to 0 */}
      <div style={{ flex: "1 1 0", minWidth: 0 }} />

      {/* Right: search + notifications + badge + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, whiteSpace: "nowrap" }}>
        {/* Search input — no absolute icon to avoid placeholder overlap */}
        <input
          placeholder="🔍 Buscar..."
          style={{
            padding: "0 12px",
            height: "34px",
            borderRadius: "8px",
            border: "1.5px solid #E2E8F0",
            fontSize: "14px",
            color: "#374151",
            background: "#F8FAFC",
            outline: "none",
            width: "160px",
            maxWidth: "200px",
            minWidth: "120px",
            flexShrink: 0,
            transition: "border-color 0.15s, width 0.2s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#0EA5E9";
            e.target.style.width = "200px";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E2E8F0";
            e.target.style.width = "160px";
          }}
        />

        <HeaderUsoBadge />
        <NotificacionesBell />

        {/* User info + avatar */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-[#0C4A6E] leading-tight">
              {profile?.name ?? user?.email}
            </div>
            <div className="text-[11px] text-[#94A3B8] capitalize">{role ?? "—"}</div>
          </div>
          <Avatar className="h-8 w-8 border-2" style={{ borderColor: "var(--topbar-border-color)" }}>
            <AvatarFallback
              className="text-white text-xs font-semibold"
              style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

// ── AppLayout ──────────────────────────────────────────────────────────────
function AppLayout() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (loading || !user || !role) return;
    if (role === "admin" || role === "consultor") return;

    const allowed = path.startsWith("/app/clientes/") || path === "/app/configuracion";
    if (allowed) return;

    setRedirecting(true);
    supabase
      .from("clientes")
      .select("id")
      .eq("cliente_user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) {
          navigate({ to: "/app/clientes/$clienteId/resumen", params: { clienteId: data.id }, replace: true });
        } else {
          navigate({ to: "/app/configuracion", replace: true });
        }
      });
  }, [loading, user, role, path, navigate]);

  if (loading || !user || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          className="text-xl font-semibold animate-pulse"
          style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          A360SGP
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        {/* Topbar fixed — full viewport width, independent of sidebar state */}
        <TopBar />

        {/* Body below topbar — sidebar ghost div + main content */}
        <div
          className="flex w-full bg-background"
          style={{ paddingTop: "56px", minHeight: "100vh" }}
        >
          <AppSidebar />
          <main className="flex-1 min-w-0 p-6 lg:p-8">
            {/* page-body: max-width 900px centrado. Módulos que necesitan
                más ancho (dashboard, CRM) sobreescriben con su propio
                max-w-* o usan la clase page-body-wide. */}
            <div className="page-body">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
