import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { A360Logo } from "@/components/A360Logo";
import {
  Activity, Target, LineChart, Users2, GraduationCap, Briefcase,
  LayoutDashboard, Settings, LogOut, BookOpen, History as HistoryIcon, TrendingUp,
  Lock, ShoppingCart, Megaphone, Calculator, Package, Workflow, ShieldCheck, Users, FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAlertas } from "@/lib/alertas-helpers";
import { useAppSettings } from "@/lib/app-settings";
import { toast } from "sonner";

type Item = { title: string; url: string; icon: typeof Activity; upcoming?: boolean };
type Section = { label: string; items: Item[]; consultorOnly?: boolean };

const sections: Section[] = [
  {
    label: "Diagnóstico",
    consultorOnly: true,
    items: [
      { title: "SIDE", url: "/app/side", icon: Activity },
      { title: "Historial SIDE", url: "/app/side/historial", icon: HistoryIcon },
    ],
  },
  {
    label: "Estrategia",
    consultorOnly: true,
    items: [
      { title: "Plan Estratégico", url: "/app/plan", icon: Target },
      { title: "Seguimiento KPIs", url: "/app/kpis", icon: LineChart },
    ],
  },
  {
    label: "Coaching A360",
    consultorOnly: true,
    items: [
      { title: "Panel Coaching", url: "/app/coaching", icon: Users2 },
      { title: "Metodología", url: "/app/coaching/metodologia", icon: BookOpen },
      { title: "Resultados", url: "/app/coaching/resultados", icon: TrendingUp },
    ],
  },
  {
    label: "Desarrollo",
    consultorOnly: true,
    items: [
      { title: "Programa LEE", url: "/app/lee", icon: GraduationCap },
    ],
  },
  {
    label: "BizOS",
    consultorOnly: true,
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
    items: [
      { title: "CRM Comercial", url: "#", icon: ShoppingCart, upcoming: true },
      { title: "Marketing Digital", url: "#", icon: Megaphone, upcoming: true },
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
  const { getText } = useAppSettings();

  const isConsultorOrAdmin = role === "admin" || role === "consultor";
  const visibleSections = sections.filter((s) => !s.consultorOnly || isConsultorOrAdmin);

  const exactOnly = new Set(["/app/coaching", "/app/side"]);
  const isActive = (url: string) =>
    exactOnly.has(url) ? path === url : path === url || path.startsWith(url + "/");

  const badgePorUrl: Record<string, number> = {
    "/app/clientes": alertas.filter((a) => a.tipo === "compromiso_vencido" || a.tipo === "cotizacion_por_vencer").length,
    "/app/coaching": alertas.filter((a) => a.tipo === "sesion_proxima").length,
    "/app/dashboard": alertas.filter((a) => a.severidad === "critica").length,
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="bg-sidebar pt-5 pb-4 px-3">
        <A360Logo size={36} withText={!collapsed} />
      </SidebarHeader>

      <SidebarContent className="bg-sidebar gap-2">
        {visibleSections.map((s) => (
          <SidebarGroup key={s.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-gold/80 font-semibold px-3">
                ─── {s.label} ───
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {s.items.map((item) => {
                  const badge = badgePorUrl[item.url] ?? 0;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}
                        className="text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-gold data-[active=true]:font-medium">
                        <Link to={item.url}>
                          <item.icon className="w-4 h-4" />
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
          <div className="px-4 mt-2 text-[11px] text-sidebar-foreground/60 leading-relaxed">
            {getText("sidebar.cliente_hint", "Estás viendo tu portal como cliente. Tu consultor gestiona el resto del workspace.")}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-sidebar border-t border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground/85 hover:bg-sidebar-accent">
              <Link to="/app/configuracion"><Settings className="w-4 h-4" /><span>Configuración</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-sidebar-foreground/85 hover:bg-sidebar-accent">
              <LogOut className="w-4 h-4" /><span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
