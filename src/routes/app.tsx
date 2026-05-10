import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificacionesBell } from "@/components/NotificacionesBell";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, profile, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="font-display text-navy text-xl animate-pulse">A360SGP</div>
      </div>
    );
  }

  const initials = (profile?.name || user.email || "?")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-cream">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white border-b border-border/70 flex items-center justify-between px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-navy" />
              <div className="hidden md:block">
                <div className="text-xs text-muted-foreground">A360SGP Suite</div>
                <div className="font-display text-navy text-sm leading-tight">Panel del consultor</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificacionesBell />
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-navy leading-tight">{profile?.name ?? user.email}</div>
                  <div className="text-[11px] uppercase tracking-wider text-gold font-semibold">{role ?? "—"}</div>
                </div>
                <Avatar className="h-9 w-9 border border-gold/30">
                  <AvatarFallback className="bg-navy text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
