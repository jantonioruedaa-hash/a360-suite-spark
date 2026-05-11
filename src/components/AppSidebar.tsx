import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { A360Logo } from "@/components/A360Logo";
import {
  Activity, Target, LineChart, Users2, GraduationCap, Briefcase,
  LayoutDashboard, Settings, LogOut, BookOpen, History as HistoryIcon,
  Compass, TrendingUp, Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAlertas } from "@/lib/alertas-helpers";

const sections = [
  {
    label: "Diagnóstico",
    items: [
      { title: "SIDE", url: "/app/side", icon: Activity },
      { title: "Historial SIDE", url: "/app/side/historial", icon: HistoryIcon },
    ],
  },
  {
    label: "Estrategia",
    items: [
      { title: "Plan Estratégico", url: "/app/plan", icon: Target },
      { title: "Seguimiento KPIs", url: "/app/kpis", icon: LineChart },
    ],
  },
  {
    label: "Coaching A360",
    items: [
      { title: "Panel Coaching", url: "/app/coaching", icon: Users2 },
      { title: "Metodología", url: "/app/coaching/metodologia", icon: BookOpen },
      { title: "Resultados", url: "/app/coaching/resultados", icon: TrendingUp },
    ],
  },
  {
    label: "Desarrollo",
    items: [
      { title: "Programa LEE", url: "/app/lee", icon: GraduationCap },
    ],
  },
  {
    label: "Gestión",
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
  const { signOut } = useAuth();
  const { alertas } = useAlertas();

  const isActive = (url: string) => path === url || path.startsWith(url + "/");

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
        {sections.map((s) => (
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
