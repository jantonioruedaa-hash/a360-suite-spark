import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  Activity, Target, LineChart, Users2, GraduationCap, Briefcase,
  ArrowUpRight, AlertTriangle, Clock, Megaphone, Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlertas, formatearDelta } from "@/lib/alertas-helpers";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

/* ── Suites launcher data ── */
const SUITES = [
  {
    id: "side",
    title: "SIDE",
    subtitle: "Diagnóstico Integral de la Empresa",
    description: "Evalúa estrategia, procesos, equipo y finanzas en un diagnóstico 360°.",
    url: "/app/side" as const,
    gradient: "linear-gradient(135deg, #0C4A6E 0%, #0EA5E9 100%)",
    icon: Activity,
    upcoming: false,
  },
  {
    id: "plan",
    title: "Plan Estratégico",
    subtitle: "Estrategia y KPIs",
    description: "Define objetivos, hoja de ruta y seguimiento de indicadores clave.",
    url: "/app/plan" as const,
    gradient: "linear-gradient(135deg, #1E1B4B 0%, #6366F1 100%)",
    icon: Target,
    upcoming: false,
  },
  {
    id: "coaching",
    title: "Coaching A360",
    subtitle: "Sesiones y compromisos",
    description: "Gestiona sesiones de consultoría, compromisos y avance de coaching.",
    url: "/app/coaching" as const,
    gradient: "linear-gradient(135deg, #0C4A6E 0%, #0D9488 100%)",
    icon: Users2,
    upcoming: false,
  },
  {
    id: "lee",
    title: "Programa LEE",
    subtitle: "Liderazgo · Estrategia · Ejecución",
    description: "Programa de transformación empresarial con metodología estructurada.",
    url: "/app/lee" as const,
    gradient: "linear-gradient(135deg, #312E81 0%, #A855F7 100%)",
    icon: GraduationCap,
    upcoming: false,
  },
  {
    id: "marketing",
    title: "Marketing Digital",
    subtitle: "Crecimiento Comercial",
    description: "Estrategia digital, métricas de crecimiento y gestión de campañas.",
    url: "/app/crecimiento" as const,
    gradient: "linear-gradient(135deg, #0369A1 0%, #38BDF8 100%)",
    icon: Megaphone,
    upcoming: false,
  },
  {
    id: "bizos",
    title: "BizOS",
    subtitle: "Sistema Operativo de Negocio",
    description: "Procesos, calidad, talento y operaciones — todo en un solo sistema.",
    url: "/app/dashboard" as const,
    gradient: "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
    icon: Workflow,
    upcoming: true,
  },
] as const;

/* ── Data interfaces ── */
interface ActividadRow {
  id: string;
  fecha: string;
  es_sesion_consultoria: boolean | null;
  semaforo: string | null;
}
interface CompromisoRow { id: string; estado: string; fecha_limite: string | null }
interface CotizacionRow { id: string; total: number | null; estado: string }

/* ── Component ── */
function Dashboard() {
  const { user, profile } = useAuth();
  const { alertas } = useAlertas();
  const urgentes = alertas.filter((a) => a.severidad === "critica" || a.severidad === "alta").slice(0, 6);

  const [clientesCount, setClientesCount] = useState(0);
  const [sideCount, setSideCount] = useState(0);
  const [actividades, setActividades] = useState<ActividadRow[]>([]);
  const [compromisos, setCompromisos] = useState<CompromisoRow[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionRow[]>([]);

  useEffect(() => {
    if (!user) return;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("activo", true)
      .then(({ count }) => setClientesCount(count ?? 0));

    supabase.from("side_sesiones").select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString())
      .then(({ count }) => setSideCount(count ?? 0));

    supabase.from("cliente_actividades")
      .select("id,fecha,es_sesion_consultoria,semaforo")
      .order("fecha", { ascending: false }).limit(300)
      .then(({ data }) => setActividades((data ?? []) as ActividadRow[]));

    supabase.from("cliente_compromisos").select("id,estado,fecha_limite")
      .then(({ data }) => setCompromisos((data ?? []) as CompromisoRow[]));

    supabase.from("cliente_cotizaciones").select("id,total,estado")
      .then(({ data }) => setCotizaciones((data ?? []) as CotizacionRow[]));
  }, [user]);

  const stats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sesionesMes = actividades.filter(
      (a) => a.es_sesion_consultoria && new Date(a.fecha) >= monthStart,
    ).length;

    const compPend = compromisos.filter((c) => c.estado === "pendiente").length;
    const compVencidos = compromisos.filter(
      (c) => c.estado === "pendiente" && c.fecha_limite && new Date(c.fecha_limite) < today,
    ).length;

    const cotAceptadas = cotizaciones.filter((c) => c.estado === "aceptada");
    const tasaConv = cotizaciones.length
      ? Math.round((cotAceptadas.length / cotizaciones.length) * 100) : 0;

    return { sesionesMes, compPend, compVencidos, tasaConv };
  }, [actividades, compromisos, cotizaciones]);

  /* Greeting */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const firstName = (profile?.name ?? "").split(" ")[0] || "Consultor";
  const todayStr = new Date().toLocaleDateString("es", {
    weekday: "long", day: "numeric", month: "long",
  });

  const metrics = [
    { label: "Clientes activos", value: clientesCount, icon: Briefcase, sub: "cartera total" },
    { label: "Diagnósticos SIDE", value: sideCount, icon: Activity, sub: "este mes" },
    { label: "Sesiones coaching", value: stats.sesionesMes, icon: Users2, sub: "este mes" },
    {
      label: "Compromisos",
      value: stats.compPend,
      icon: Clock,
      sub: stats.compVencidos > 0 ? `${stats.compVencidos} vencidos` : "al día",
      warn: stats.compVencidos > 0,
    },
  ];

  return (
    <div className="space-y-8 page-body-wide">

      {/* ── Hero greeting ── */}
      <section
        className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 50%, #312E81 100%)" }}
      >
        {/* Orbs decorativos */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #0EA5E9, transparent)" }} />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #A855F7, transparent)" }} />

        <div className="relative">
          <p className="text-sky-300 text-sm font-medium capitalize">{todayStr}</p>
          <h1 className="text-2xl font-semibold mt-1 text-white">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sky-200 text-sm mt-2 max-w-md">
            Plataforma A360SGP · Aceleradora 360 de Empresas
          </p>
          <div className="flex gap-3 mt-6 flex-wrap">
            <Button asChild className="btn-aurora h-9 px-5 text-sm font-medium rounded-xl">
              <Link to="/app/side" search={undefined as any}>
                <Activity className="w-4 h-4 mr-2" /> Nuevo diagnóstico SIDE
              </Link>
            </Button>
            <Button asChild variant="ghost"
              className="h-9 px-5 text-sm text-white border border-white/30 bg-white/10 hover:bg-white/20 rounded-xl">
              <Link to="/app/clientes">
                <Briefcase className="w-4 h-4 mr-2" /> Mis clientes
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats rápidas ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-white rounded-2xl p-5 border flex flex-col gap-1"
            style={{ borderColor: m.warn ? "#FCA5A5" : "#E0F2FE", background: m.warn ? "#FFF5F5" : "white" }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#94A3B8]">{m.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: m.warn ? "rgba(239,68,68,0.1)" : "rgba(14,165,233,0.1)" }}>
                <m.icon className="w-4 h-4" style={{ color: m.warn ? "#EF4444" : "#0EA5E9" }} />
              </div>
            </div>
            <p className="font-mono-num text-3xl font-bold" style={{ color: m.warn ? "#DC2626" : "#0C4A6E" }}>
              {m.value}
            </p>
            <p className="text-xs" style={{ color: m.warn ? "#EF4444" : "#94A3B8" }}>{m.sub}</p>
          </div>
        ))}
      </section>

      {/* ── Suite Launcher ── */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-[#0C4A6E]">Suites A360SGP</h2>
            <p className="text-sm text-[#94A3B8] mt-0.5">Accede directamente a cada módulo de la plataforma</p>
          </div>
          <Button asChild variant="ghost" className="text-[#0EA5E9] hover:text-[#0369A1] text-sm">
            <Link to="/app/clientes">
              Ver cartera <ArrowUpRight className="w-3.5 h-3.5 ml-1 inline" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SUITES.map((suite) => {
            const card = (
              <article
                key={suite.id}
                className="rounded-2xl overflow-hidden border group transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                style={{ borderColor: "#E0F2FE" }}
              >
                {/* Gradient banner */}
                <div className="relative h-28 p-5 flex flex-col justify-end" style={{ background: suite.gradient }}>
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <suite.icon className="w-5 h-5 text-white" />
                  </div>
                  {suite.upcoming && (
                    <span className="self-start text-[10px] uppercase tracking-widest font-semibold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                      Próximamente
                    </span>
                  )}
                  {!suite.upcoming && (
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-white/70">{suite.subtitle}</p>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 bg-white">
                  <h3 className="font-semibold text-[#0C4A6E] text-base leading-tight">{suite.title}</h3>
                  <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">{suite.description}</p>
                  {!suite.upcoming ? (
                    <div className="mt-4 flex items-center text-sm font-medium text-[#0EA5E9] group-hover:gap-2 transition-all">
                      Abrir suite
                      <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-[#94A3B8]">En desarrollo — disponible próximamente</p>
                  )}
                </div>
              </article>
            );

            if (suite.upcoming) return <div key={suite.id} className="opacity-60 cursor-default">{card}</div>;
            return (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Link key={suite.id} to={suite.url as any}>
                {card}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Alertas urgentes ── */}
      {urgentes.length > 0 && (
        <section className="rounded-2xl border border-red-200 overflow-hidden">
          <div className="bg-red-50 px-5 py-3 flex items-center justify-between border-b border-red-200">
            <h2 className="font-semibold text-red-800 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Pendientes urgentes
              <span className="ml-1 text-[11px] bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-semibold">
                {urgentes.length}
              </span>
            </h2>
          </div>
          <div className="bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {urgentes.map((a) => (
              <Link
                key={a.id}
                to={a.to}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors hover:bg-muted/30 ${
                  a.severidad === "critica" ? "border-red-100 bg-red-50/40" : "border-amber-100 bg-amber-50/40"
                }`}
              >
                <div className={`mt-0.5 shrink-0 ${a.severidad === "critica" ? "text-red-500" : "text-amber-500"}`}>
                  {a.tipo === "sesion_proxima" ? <Clock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[#0C4A6E] truncate">{a.titulo}</p>
                    <span className="text-[10px] text-[#94A3B8] shrink-0">{formatearDelta(a.diasDelta)}</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] truncate">{a.clienteNombre}</p>
                  <p className="text-xs text-[#64748B] line-clamp-1 mt-0.5">{a.detalle}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── KPI rápido: tasa de conversión ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E0F2FE] col-span-1">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#94A3B8] mb-2">
            <LineChart className="w-3.5 h-3.5 inline mr-1" /> Conversión comercial
          </p>
          <p className="font-mono-num text-4xl font-bold text-[#0C4A6E]">{stats.tasaConv}%</p>
          <p className="text-xs text-[#94A3B8] mt-1">Histórica de cotizaciones</p>
          <div className="mt-3 h-1.5 bg-[#E0F2FE] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${stats.tasaConv}%`, background: "linear-gradient(90deg, #0EA5E9, #6366F1)" }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E0F2FE] md:col-span-2 flex flex-col justify-between">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#94A3B8] mb-3">Acceso rápido</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Nueva sesión SIDE", to: "/app/side" as const, icon: Activity },
              { label: "Ver clientes", to: "/app/clientes" as const, icon: Briefcase },
              { label: "KPIs & Metas", to: "/app/kpis" as const, icon: LineChart },
              { label: "Panel coaching", to: "/app/coaching" as const, icon: Users2 },
            ].map((q) => (
              <Link
                key={q.label}
                to={q.to}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#E0F2FE] hover:border-[#BAE6FD] hover:bg-[#F5F7FF] transition-all text-center"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(14,165,233,0.1)" }}>
                  <q.icon className="w-4 h-4 text-[#0EA5E9]" />
                </div>
                <span className="text-[11px] text-[#64748B] font-medium leading-tight">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
