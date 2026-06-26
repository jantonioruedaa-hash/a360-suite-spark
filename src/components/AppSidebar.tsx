import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  Activity, Target, LineChart, Users2, GraduationCap, Briefcase,
  LayoutDashboard, Settings, LogOut, BookOpen, History as HistoryIcon, TrendingUp,
  Lock, ShoppingCart, Megaphone, Calculator, Package, Workflow, ShieldCheck, Users, FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAlertas } from "@/lib/alertas-helpers";
import { useAppSettings } from "@/lib/app-settings";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { toast } from "sonner";

type Item = { title: string; url: string; icon: typeof Activity; upcoming?: boolean };
type Section = { label: string; items: Item[]; consultorOnly?: boolean; moduleId?: string };

const sections: Section[] = [
  {
    label: "Diagnóstico",
    consultorOnly: true,
    moduleId: "side",
    items: [
      { title: "SIDE", url: "/app/side", icon: Activity },
      { title: "Historial SIDE", url: "/app/side/historial", icon: HistoryIcon },
    ],
  },
  {
    label: "Estrategia",
    consultorOnly: true,
    moduleId: "plan",
    items: [
      { title: "Plan Estratégico", url: "/app/plan", icon: Target },
      { title: "Seguimiento KPIs", url: "/app/kpis", icon: LineChart },
    ],
  },
  {
    label: "Coaching A360",
    consultorOnly: true,
    moduleId: "coaching",
    items: [
      { title: "Panel Coaching", url: "/app/coaching", icon: Users2 },
      { title: "Metodología", url: "/app/coaching/metodologia", icon: BookOpen },
      { title: "Resultados", url: "/app/coaching/resultados", icon: TrendingUp },
    ],
  },
  {
    label: "Desarrollo",
    consultorOnly: true,
    moduleId: "lee",
    items: [
      { title: "Programa LEE", url: "/app/lee", icon: GraduationCap },
    ],
  },
  {
    label: "BizOS",
    consultorOnly: true,
    moduleId: "bizos",
    items: [
      { title: "Procesos", url: "#", icon: Workflow, upcoming: true },
      { title: "SGC", url: "#", icon: ShieldCheck, upcoming: true },
      { title: "TalentHR", url: "#", icon: Users, upcoming: true },
      { title: "Manual de Funciones", url: "#", icon: FileText, upcoming: true },
    ],
  },
  {
    label: "Comercial & Ops",
    consultorOnly: true,
    moduleId: "marketing",
    items: [
      { title: "CRM Comercial", url: "#", icon: ShoppingCart, upcoming: true },
      { title: "Marketing Digital", url: "/app/crecimiento", icon: Megaphone },
      { title: "Suite Financiera", url: "#", icon: Calculator, upcoming: true },
      { title: "WMS Inventarios", url: "#", icon: Package, upcoming: true },
    ],
  },
  {
    label: "Gestión",
    consultorOnly: true,
    items: [
      { title: "Mis clientes", url: "/app/clientes", icon: Briefcase },
      { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { signOut, role } = useAuth();
  const { alertas } = useAlertas();
  const { settings, getText } = useAppSettings();

  const isConsultorOrAdmin = role === "admin" || role === "consultor";

  // Read module active state from app_settings.content_strings.modulos_activos
  const modulosActivos = (() => {
    const cs = settings.content_strings as unknown as Record<string, unknown>;
    const stored = cs?.modulos_activos;
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      return stored as Record<string, boolean>;
    }
    return null;
  })();

  const visibleSections = sections.filter((s) => {
    if (s.consultorOnly && !isConsultorOrAdmin) return false;
    if (s.moduleId && modulosActivos !== null) {
      return modulosActivos[s.moduleId] !== false;
    }
    return true;
  });

  const exactOnly = new Set(["/app/coaching", "/app/side"]);
  const isActive = (url: string) =>
    exactOnly.has(url) ? path === url : path === url || path.startsWith(url + "/");

  const badgePorUrl: Record<string, number> = {
    "/app/clientes": alertas.filter((a) => a.tipo === "compromiso_vencido" || a.tipo === "cotizacion_por_vencer").length,
    "/app/coaching": alertas.filter((a) => a.tipo === "sesion_proxima").length,
    "/app/dashboard": alertas.filter((a) => a.severidad === "critica").length,
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r"
      style={{
        borderColor: "var(--sidebar-border)",
        top: "56px",
        height: "calc(100vh - 56px)",
      }}
    >

      <SidebarContent className="gap-1">
        {visibleSections.map((s) => (
          <SidebarGroup key={s.label}>
            {!collapsed && (
              <SidebarGroupLabel
                className="text-[10px] uppercase tracking-widest font-semibold px-3 mb-0.5"
                style={{ color: "var(--sidebar-label-text)" }}
              >
                {s.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {s.items.map((item) => {
                  const badge = badgePorUrl[item.url] ?? 0;

                  if (item.upcoming) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() =>
                            toast.info("Módulo próximamente", {
                              description: "Este módulo estará disponible próximamente. Te notificaremos cuando esté listo.",
                            })
                          }
                          className="opacity-50 hover:opacity-60 cursor-not-allowed"
                          style={{ color: "var(--sidebar-foreground)" }}
                        >
                          <Lock className="w-[18px] h-[18px] shrink-0" />
                          <span className="flex-1">{item.title}</span>
                          {!collapsed && (
                            <span
                              className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide text-white"
                              style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)" }}
                            >
                              Pronto
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className="transition-all"
                        style={{
                          color: active ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                          background: active ? "var(--sidebar-accent)" : "transparent",
                          fontWeight: active ? 600 : 400,
                          boxShadow: active ? "0 1px 4px rgba(14,165,233,0.12)" : "none",
                        }}
                      >
                        <Link to={item.url}>
                          <item.icon className="w-[18px] h-[18px] shrink-0" />
                          <span className="flex-1">{item.title}</span>
                          {badge > 0 && !collapsed && (
                            <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                              {badge > 99 ? "99+" : badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {!isConsultorOrAdmin && !collapsed && (
          <div className="px-4 mt-2 text-[11px] leading-relaxed opacity-60" style={{ color: "var(--sidebar-foreground)" }}>
            {getText("sidebar.cliente_hint", "Estás viendo tu portal como cliente. Tu consultor gestiona el resto del workspace.")}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={path.startsWith("/app/admin")}
              className="transition-colors hover:bg-white/10"
              style={{ color: "var(--sidebar-foreground)" }}
            >
              <Link to="/app/admin">
                <ShieldCheck className="w-[18px] h-[18px] shrink-0" />
                <span>🛡️ Panel Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="transition-colors hover:bg-white/10"
              style={{ color: "var(--sidebar-foreground)" }}
            >
              <Link to="/app/configuracion">
                <Settings className="w-[18px] h-[18px] shrink-0" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {!collapsed && (
            <SidebarMenuItem>
              <ThemeSwitcher />
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="transition-colors hover:bg-white/10"
              style={{ color: "var(--sidebar-foreground)" }}
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
