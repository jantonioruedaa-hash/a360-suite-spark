import { createFileRoute, Outlet, Link, useRouterState, useParams, redirect } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ESTADOS } from "@/lib/clientes-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard, Building2, Users, Activity, FileText,
  BarChart3, Target, Users2, BookOpen, Sparkles, ArrowLeft, Rocket,
  ChevronDown, DollarSign,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { normalizePlan, planAllowsModule, type ModuloKey } from "@/lib/plans";
import { ModuloNoIncluido } from "@/components/ModuloNoIncluido";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { SECCIONES_PLAN } from "@/lib/plan-helpers";
import { getModuleColor } from "@/lib/module-colors";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const Route = createFileRoute("/app/clientes/$clienteId")({
  component: ClienteLayout,
  beforeLoad: ({ params, location }) => {
    if (location.pathname === `/app/clientes/${params.clienteId}` || location.pathname === `/app/clientes/${params.clienteId}/`) {
      throw redirect({ to: "/app/clientes/$clienteId/resumen", params: { clienteId: params.clienteId } });
    }
  },
});

interface ClienteFull {
  id: string;
  nombre_empresa: string;
  nombre_comercial: string | null;
  sector: string | null;
  subsector: string | null;
  estado: string | null;
  plan_licencia: string;
  logo_url: string | null;
  fecha_inicio_relacion: string | null;
}

interface ClienteKPIs {
  contactos: number;
  ultima_actividad: string | null;
}

type Seccion = { url: string; label: string; icon: typeof LayoutDashboard; modulo?: ModuloKey };

const SECCIONES_CORE: Seccion[] = [
  { url: "resumen", label: "Resumen", icon: LayoutDashboard },
  { url: "empresa", label: "Empresa", icon: Building2 },
  { url: "contactos", label: "Contactos", icon: Users },
  { url: "actividades", label: "Actividades", icon: Activity },
  { url: "cotizaciones", label: "Cotizaciones", icon: FileText },
  { url: "onboarding", label: "Onboarding", icon: Rocket },
  { url: "analisis-ia", label: "Análisis IA", icon: Sparkles },
];

const SECCIONES_MODULOS: Seccion[] = [
  { url: "side", label: "Diagnósticos SIDE", icon: BarChart3, modulo: "side" },
  { url: "plan", label: "Plan estratégico", icon: Target, modulo: "plan" },
  { url: "coaching", label: "Coaching Platform", icon: Users2, modulo: "coaching" },
  { url: "lee", label: "Programa LEE", icon: BookOpen, modulo: "lee" },
  { url: "finanzas", label: "Finanzas", icon: DollarSign, modulo: "finanzas" },
];

const TODAS_SECCIONES = [...SECCIONES_CORE, ...SECCIONES_MODULOS];

// ── Breadcrumb helpers ────────────────────────────────────────────────────────
// hrefs are built as strings and cast with `as any` in <Link to={...}> because
// TanStack Router's `to` prop requires a statically-known route literal —
// dynamic template strings can't be inferred. Runtime safety is guaranteed
// since all routes are stable and internal. (minor typed-router debt)

type CrumbItem = { label: string; href?: string };

function buildCrumbs(path: string, href: string, clienteId: string, nombreEmpresa: string): CrumbItem[] {
  const base = `/app/clientes/${clienteId}`;
  const resumen = `${base}/resumen`;
  const modPath = path.startsWith(base + "/") ? path.slice(base.length + 1) : "";

  const crumbs: CrumbItem[] = [
    { label: "Inicio", href: resumen },
    { label: nombreEmpresa, href: resumen },
  ];

  // On the resumen page: empresa becomes the current (non-clickable) level
  if (!modPath || modPath === "resumen") {
    crumbs[1] = { label: nombreEmpresa };
    return crumbs;
  }

  // Checked before "side" because "side-historial" starts with the same prefix
  if (modPath.startsWith("side-historial")) {
    crumbs.push({ label: "Diagnósticos SIDE", href: `${base}/side` });
    crumbs.push({ label: "Historial" });
    return crumbs;
  }

  if (modPath.startsWith("side")) {
    crumbs.push({ label: "Diagnósticos SIDE" });
    return crumbs;
  }

  if (modPath.startsWith("plan")) {
    const rawSearch = href.includes("?") ? href.split("?")[1] : "";
    const secKey = new URLSearchParams(rawSearch).get("s");
    const sec = secKey ? SECCIONES_PLAN.find((s) => s.key === secKey) : null;
    if (sec) {
      crumbs.push({ label: "Plan Estratégico", href: `${base}/plan` });
      crumbs.push({ label: `${String(sec.numero).padStart(2, "0")}. ${sec.titulo}` });
    } else {
      crumbs.push({ label: "Plan Estratégico" });
    }
    return crumbs;
  }

  // Checked before "coaching" because "coaching-resultados" starts with the same prefix
  if (modPath.startsWith("coaching-resultados")) {
    crumbs.push({ label: "Coaching Platform", href: `${base}/coaching` });
    crumbs.push({ label: "Resultados" });
    return crumbs;
  }

  if (modPath.startsWith("coaching")) {
    crumbs.push({ label: "Coaching Platform" });
    return crumbs;
  }

  if (modPath.startsWith("lee/")) {
    const cap = modPath.match(/^lee\/(.+)$/);
    crumbs.push({ label: "Programa LEE", href: `${base}/lee` });
    crumbs.push({ label: cap ? `Capítulo ${cap[1]}` : "Capítulo" });
    return crumbs;
  }

  if (modPath === "lee") {
    crumbs.push({ label: "Programa LEE" });
    return crumbs;
  }

  if (modPath.includes("finanzas/presupuesto/cuentas")) {
    crumbs.push({ label: "Finanzas", href: `${base}/finanzas` });
    crumbs.push({ label: "Plan de Cuentas" });
    return crumbs;
  }

  if (modPath.includes("finanzas/presupuesto/ventas")) {
    crumbs.push({ label: "Finanzas", href: `${base}/finanzas` });
    crumbs.push({ label: "Ventas" });
    return crumbs;
  }

  if (modPath.startsWith("finanzas")) {
    crumbs.push({ label: "Finanzas" });
    return crumbs;
  }

  if (modPath === "onboarding") {
    crumbs.push({ label: "Onboarding" });
    return crumbs;
  }

  // Generic fallback for remaining SECCIONES_CORE (empresa, contactos, actividades, cotizaciones, analisis-ia)
  const found = TODAS_SECCIONES.find((s) => modPath === s.url || modPath.startsWith(s.url + "/"));
  if (found) crumbs.push({ label: found.label });

  return crumbs;
}

// ─────────────────────────────────────────────────────────────────────────────

function ClienteLayout() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId" });
  const [cliente, setCliente] = useState<ClienteFull | null>(null);
  const [clienteLoading, setClienteLoading] = useState(true);
  const [kpis, setKpis] = useState<ClienteKPIs | null>(null);
  const path = useRouterState({ select: (r) => r.location.pathname });
  const href = useRouterState({ select: (r) => r.location.href });
  const { role } = useAuth();

  useEffect(() => {
    supabase
      .from("clientes")
      .select("id,nombre_empresa,nombre_comercial,sector,subsector,estado,plan_licencia,logo_url,fecha_inicio_relacion")
      .eq("id", clienteId)
      .maybeSingle()
      .then(({ data }) => {
        setCliente(data as ClienteFull | null);
        setClienteLoading(false);
      });

    Promise.all([
      supabase
        .from("cliente_contactos")
        .select("id", { count: "exact", head: true })
        .eq("cliente_id", clienteId),
      supabase
        .from("cliente_actividades")
        .select("fecha")
        .eq("cliente_id", clienteId)
        .order("fecha", { ascending: false })
        .limit(1),
    ]).then(([contactosRes, actividadesRes]) => {
      setKpis({
        contactos: contactosRes.count ?? 0,
        ultima_actividad: (actividadesRes.data?.[0] as { fecha: string } | undefined)?.fecha ?? null,
      });
    });
  }, [clienteId]);

  if (clienteLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando cliente…</div>;
  }
  if (!cliente) {
    return <div className="p-8 text-center text-muted-foreground">Cliente no encontrado.</div>;
  }

  const crumbs = buildCrumbs(path, href, clienteId, cliente.nombre_empresa);
  const accentColor = getModuleColor(path).accent;

  const estado = ESTADOS.find((e) => e.value === (cliente.estado ?? "activo"));
  const isActive = (url: string) => path.endsWith(`/${url}`) || path.includes(`/${url}/`);

  const plan = normalizePlan(cliente.plan_licencia);
  const bypassPlan = role === "admin" || role === "consultor";
  const moduloVisible = (s: Seccion) => !s.modulo || bypassPlan || planAllowsModule(plan, s.modulo);

  const coreSecciones = SECCIONES_CORE.filter(moduloVisible);
  const modulosSecciones = SECCIONES_MODULOS.filter(moduloVisible);

  const seccionActual = TODAS_SECCIONES.find((s) => isActive(s.url));
  const bloqueado = !!seccionActual?.modulo && !bypassPlan && !planAllowsModule(plan, seccionActual.modulo);
  const activeModulo = modulosSecciones.find((s) => isActive(s.url));

  const tabClass = (url: string) =>
    `flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition ${
      isActive(url)
        ? "border-gold text-navy font-semibold"
        : "border-transparent text-muted-foreground hover:text-navy"
    }`;

  return (
    <div className="-m-6 lg:-m-8 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header unificado: info + KPIs + tabs — un solo bloque sticky */}
      <div className="bg-white border-b border-border sticky top-0 z-20">

        {/* Fila principal: logo, nombre, badges */}
        <div className="px-6 pt-3 pb-2 flex items-center gap-4 flex-wrap">
          <Link to="/app/clientes" className="text-muted-foreground hover:text-navy text-xs flex items-center gap-1 shrink-0">
            <ArrowLeft className="w-3 h-3" /> Clientes
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {cliente.logo_url ? (
              <img src={cliente.logo_url} alt="" className="w-9 h-9 rounded border object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded bg-navy text-white flex items-center justify-center font-display shrink-0">
                {cliente.nombre_empresa[0]}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-display text-navy text-base leading-tight truncate">{cliente.nombre_empresa}</div>
              <div className="text-xs text-muted-foreground truncate">
                {cliente.nombre_comercial ?? cliente.sector ?? "—"}
                {cliente.subsector && ` · ${cliente.subsector}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {estado && <Badge variant="outline" className={estado.color}>{estado.label}</Badge>}
            <Badge variant="outline">{cliente.plan_licencia.charAt(0).toUpperCase() + cliente.plan_licencia.slice(1)}</Badge>
          </div>
        </div>

        {/* Fila KPIs + acciones rápidas */}
        <div className="px-6 pb-1 flex items-center justify-between gap-4 border-t border-border/40 pt-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {kpis ? (
              <>
                <span>
                  {kpis.contactos} {kpis.contactos === 1 ? "contacto" : "contactos"}
                </span>
                {kpis.ultima_actividad && (
                  <>
                    <span className="text-border/70">·</span>
                    <span>
                      Última actividad{" "}
                      {formatDistanceToNow(new Date(kpis.ultima_actividad), { addSuffix: true, locale: es })}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-border/50">—</span>
            )}
          </div>

          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-muted-foreground hover:text-navy">
                    <Link to="/app/clientes/$clienteId/actividades" params={{ clienteId }}>
                      <Activity className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline ml-1 text-xs">+ Actividad</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Registrar actividad</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-muted-foreground hover:text-navy">
                    <Link to="/app/clientes/$clienteId/contactos" params={{ clienteId }}>
                      <Users className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline ml-1 text-xs">+ Contacto</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Agregar contacto</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-muted-foreground hover:text-navy">
                    <Link to="/app/clientes/$clienteId/cotizaciones" params={{ clienteId }}>
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline ml-1 text-xs">+ Cotización</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Nueva cotización</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Barra de tabs */}
        <div className="px-2">
          <nav className="flex items-end gap-0.5">
            {/* Tabs primarias */}
            {coreSecciones.map((s) => (
              <Link
                key={s.url}
                to={`/app/clientes/$clienteId/${s.url}` as "/app/clientes/$clienteId/resumen"}
                params={{ clienteId }}
                className={tabClass(s.url)}
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </Link>
            ))}

            {/* Divisor + dropdown de módulos */}
            {modulosSecciones.length > 0 && (
              <>
                <div className="w-px h-4 bg-border/50 mx-1.5 self-center mb-2.5" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition outline-none ${
                        activeModulo
                          ? "border-gold text-navy font-semibold"
                          : "border-transparent text-muted-foreground hover:text-navy"
                      }`}
                    >
                      {activeModulo ? (
                        <>
                          <activeModulo.icon className="w-3.5 h-3.5" />
                          {activeModulo.label}
                        </>
                      ) : (
                        "Módulos"
                      )}
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {modulosSecciones.map((s) => (
                      <DropdownMenuItem key={s.url} asChild>
                        <Link
                          to={`/app/clientes/$clienteId/${s.url}` as "/app/clientes/$clienteId/resumen"}
                          params={{ clienteId }}
                          className={`flex items-center gap-2 ${isActive(s.url) ? "font-semibold text-navy" : ""}`}
                        >
                          <s.icon className="w-4 h-4 shrink-0" />
                          {s.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Breadcrumb bar */}
      <div className="bg-white border-b border-[#E0E7FF] px-6 lg:px-8 py-2">
        <Breadcrumb>
          <BreadcrumbList className="gap-1 sm:gap-1.5" style={{ fontSize: 13 }}>
            {crumbs.map((crumb, i) => (
              <Fragment key={i}>
                {i > 0 && <BreadcrumbSeparator className="text-slate-300" />}
                <BreadcrumbItem>
                  {!crumb.href ? (
                    <BreadcrumbPage className="font-medium" style={{ color: accentColor }}>
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild className="text-slate-400 hover:text-slate-700">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <Link to={crumb.href as any}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Contenido de la sección activa */}
      <div className="flex-1 p-6 lg:p-8 min-w-0 overflow-x-auto">
        {bloqueado ? (
          <ModuloNoIncluido
            moduloLabel={seccionActual?.label ?? "Este módulo"}
            planActual={plan}
          />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}
