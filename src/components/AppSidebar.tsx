import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { getModuleColor } from "@/lib/module-colors";
import { toast } from "sonner";

type Item = { title: string; url: string; icon: typeof Activity; upcoming?: boolean; modulo?: string; clienteUrl?: string; clienteOnly?: boolean };
type Section = { label: string; items: Item[]; consultorOnly?: boolean };

const sections: Section[] = [
  {
    label: "Diagnóstico",
    consultorOnly: true,
    items: [
      { title: "SIDE", url: "/app/side", icon: Activity, modulo: "side", clienteUrl: "/app/clientes/{id}/side" },
      { title: "Historial SIDE", url: "/app/side/historial", icon: HistoryIcon, modulo: "side_historial", clienteUrl: "/app/clientes/{id}/side-historial" },
    ],
  },
  {
    label: "Estrategia",
    consultorOnly: true,
    items: [
      { title: "Plan Estratégico", url: "/app/plan", icon: Target, modulo: "plan_estrategico", clienteUrl: "/app/clientes/{id}/plan" },
      { title: "Seguimiento KPIs", url: "/app/kpis", icon: LineChart, modulo: "kpis" },
    ],
  },
  {
    label: "Coaching A360",
    consultorOnly: true,
    items: [
      { title: "Panel Coaching", url: "/app/coaching", icon: Users2, modulo: "coaching", clienteUrl: "/app/clientes/{id}/coaching" },
      { title: "Metodología", url: "/app/coaching/metodologia", icon: BookOpen, modulo: "coaching_metodologia", clienteUrl: "/app/coaching/metodologia" },
      { title: "Resultados", url: "/app/coaching/resultados", icon: TrendingUp, modulo: "coaching_resultados", clienteUrl: "/app/clientes/{id}/coaching-resultados" },
    ],
  },
  {
    label: "Desarrollo",
    consultorOnly: true,
    items: [
      { title: "Programa LEE", url: "/app/lee", icon: GraduationCap, modulo: "lee", clienteUrl: "/app/clientes/{id}/lee" },
    ],
  },
  {
    label: "BizOS",
    consultorOnly: true,
    items: [
      { title: "Procesos", url: "#", icon: Workflow, upcoming: true },
      { title: "SGC", url: "#", icon: ShieldCheck, upcoming: true },
      { title: "TalentHR", url: "#", icon: Users, upcoming: true },
      { title: "Manual de Funciones", url: "/app/manual-funciones", icon: FileText, modulo: "manual_funciones", clienteUrl: "/app/manual-funciones/{id}" },
    ],
  },
  {
    label: "Comercial & Ops",
    consultorOnly: true,
    items: [
      { title: "CRM Comercial", url: "#", icon: ShoppingCart, upcoming: true },
      { title: "Marketing Digital", url: "/app/crecimiento", icon: Megaphone, modulo: "marketing_digital", clienteUrl: "/app/crecimiento" },
      { title: "Suite Financiera", url: "#", icon: Calculator, upcoming: true },
      { title: "WMS Inventarios", url: "#", icon: Package, upcoming: true },
      { title: "Cotizaciones", url: "#", icon: FileText, modulo: "cotizador", clienteUrl: "/app/clientes/{id}/cotizaciones", clienteOnly: true },
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
  const { signOut, role, user } = useAuth();
  const { alertas } = useAlertas();
  const { getText } = useAppSettings();

  const isConsultorOrAdmin = !user || role === "admin" || role === "consultor";
  const isClientRole = role === "cliente" || role === "participante";

  const [allowedModules, setAllowedModules] = useState<Set<string> | null>(null);
  const [clienteIdState, setClienteIdState] = useState<string | null>(null);

  useEffect(() => {
    if (!isClientRole || !user) {
      setAllowedModules(null);
      setClienteIdState(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: eu } = await supabase
          .from("empresa_usuarios")
          .select("cliente_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (!eu?.cliente_id) { setAllowedModules(new Set()); return; }

        const { data: cli } = await supabase
          .from("clientes")
          .select("plan_licencia, plan_id")
          .eq("id", eu.cliente_id)
          .maybeSingle();
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!cli?.plan_licencia && !(cli as any)?.plan_id) { setAllowedModules(new Set()); return; }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let planId: string | null = (cli as any).plan_id ?? null;

        if (!planId) {
          // Fallback: plan_licencia sin mapeo directo a plan_id
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: planRow } = await (supabase as any)
            .from("planes")
            .select("id")
            .ilike("nombre", cli!.plan_licencia)
            .maybeSingle();
          if (cancelled) return;
          planId = planRow?.id ?? null;
        }

        if (!planId) { setAllowedModules(new Set()); return; }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: mods } = await (supabase as any)
          .from("plan_modulos")
          .select("modulo_slug")
          .eq("plan_id", planId)
          .eq("activo", true);
        if (cancelled) return;
        setAllowedModules(new Set((mods ?? []).map((m: { modulo_slug: string }) => m.modulo_slug)));
        setClienteIdState(eu.cliente_id);
      } catch {
        if (!cancelled) { setAllowedModules(new Set()); setClienteIdState(null); }
      }
    })();
    return () => { cancelled = true; };
  }, [isClientRole, user?.id]);

  const visibleSections = isConsultorOrAdmin
    ? sections.map((s) => ({ ...s, items: s.items.filter((i) => !i.clienteOnly) })).filter((s) => s.items.length > 0)
    : allowedModules === null
      ? []
      : sections
          .map((s) => ({
            ...s,
            items: s.items
              .filter(
                (item) =>
                  !item.upcoming && item.modulo && allowedModules.has(item.modulo) && !!item.clienteUrl
              )
              .map((item) =>
                clienteIdState
                  ? { ...item, url: item.clienteUrl!.replace("{id}", clienteIdState) }
                  : item
              ),
          }))
          .filter((s) => s.items.length > 0);

  const exactOnly = new Set(["/app/coaching", "/app/side"]);
  const isActive = (url: string) =>
    exactOnly.has(url) ? path === url : path === url || path.startsWith(url + "/");

  const moduleColor = getModuleColor(path);

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
                  if (item.upcoming) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() =>
                            toast.info("Módulo próximamente", {
                              description: "Este módulo estará disponible próximamente. Te notificaremos cuando esté listo.",
                            })
                          }
                          className="text-sidebar-foreground/40 hover:text-sidebar-foreground/50 cursor-not-allowed"
                        >
                          <Lock className="w-4 h-4" />
                          <span className="flex-1">{item.title}</span>
                          {!collapsed && (
                            <span className="ml-auto px-1.5 py-0.5 rounded bg-gold/20 text-gold text-[9px] font-semibold uppercase tracking-wide">
                              Próximamente
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                  return (
                    <SidebarMenuItem key={item.url} style={isActive(item.url) ? { borderLeft: `3px solid ${moduleColor.accent}` } : { borderLeft: "3px solid transparent" }}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}
                        className="text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-gold data-[active=true]:font-medium">
                        <Link to={item.url}>
                          <item.icon className="w-4 h-4" style={isActive(item.url) ? { color: moduleColor.accent } : undefined} />
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

        {!isConsultorOrAdmin && !collapsed && allowedModules !== null && (
          allowedModules.size === 0 ? (
            <div className="px-4 mt-4 text-[11px] text-sidebar-foreground/60 leading-relaxed">
              No hay módulos disponibles — contacta a tu consultor.
            </div>
          ) : (
            <div className="px-4 mt-2 text-[11px] text-sidebar-foreground/60 leading-relaxed">
              {getText("sidebar.cliente_hint", "Estás viendo tu portal como cliente. Tu consultor gestiona el resto del workspace.")}
            </div>
          )
        )}
      </SidebarContent>

      <SidebarFooter className="bg-sidebar border-t border-sidebar-border/60">
        <SidebarMenu>
          {role === "admin" && (
            <SidebarMenuItem style={path.startsWith("/app/admin") ? { borderLeft: `3px solid ${moduleColor.accent}` } : { borderLeft: "3px solid transparent" }}>
              <SidebarMenuButton
                asChild
                isActive={path.startsWith("/app/admin")}
                className="text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-gold data-[active=true]:bg-sidebar-accent data-[active=true]:text-gold data-[active=true]:font-medium"
              >
                <Link to="/app/admin-simple">
                  <ShieldCheck className="w-4 h-4" style={path.startsWith("/app/admin") ? { color: moduleColor.accent } : undefined} />
                  <span>🛡️ Panel Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {user ? (
            <>
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
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-sidebar-foreground/85 hover:bg-sidebar-accent">
                <Link to="/login"><LogOut className="w-4 h-4" /><span>Iniciar sesión</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
