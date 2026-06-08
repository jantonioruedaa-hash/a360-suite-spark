import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificacionesBell } from "@/components/NotificacionesBell";
import { HeaderUsoBadge } from "@/components/HeaderUsoBadge";
import { A360Logo } from "@/components/A360Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, profile, role, loading } = useAuth();
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

  const initials = (profile?.name || user.email || "?")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header
              className="h-14 bg-white flex items-center justify-between px-4 sticky top-0 z-30 border-b"
              style={{ borderColor: "var(--topbar-border-color)" }}
            >
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-[#94A3B8] hover:text-[#0C4A6E]" />
                <A360Logo size={26} withText />
              </div>
              <div className="flex items-center gap-3">
                <HeaderUsoBadge />
                <NotificacionesBell />
                <div className="flex items-center gap-2.5">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-[#0C4A6E] leading-tight">
                      {profile?.name ?? user.email}
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
            <main className="flex-1 p-6 lg:p-8">
              {/* page-body: max-width 900px centrado. Módulos que necesitan
                  más ancho (dashboard, CRM) sobreescriben con su propio
                  max-w-* o usan la clase page-body-wide. */}
              <div className="page-body">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
