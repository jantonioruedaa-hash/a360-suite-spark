import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  Briefcase, Activity, Users2, BookOpen, ArrowUpRight, Plus, MapPin,
  FileText, AlertTriangle, CheckCircle2, Clock, TrendingUp, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

interface Cliente {
  id: string;
  nombre_empresa: string;
  sector: string | null;
  tamano: string | null;
  pais: string | null;
  ciudad: string | null;
  updated_at: string;
}

interface ActividadRow {
  id: string;
  cliente_id: string;
  fecha: string;
  semaforo: string | null;
  es_sesion_consultoria: boolean | null;
  programa: string | null;
}

interface CompromisoRow {
  id: string;
  cliente_id: string;
  estado: string;
  fecha_limite: string | null;
}

interface CotizacionRow {
  id: string;
  cliente_id: string;
  total: number | null;
  estado: string;
  moneda: string | null;
  created_at: string;
}

function Dashboard() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sideCount, setSideCount] = useState(0);
  const [actividades, setActividades] = useState<ActividadRow[]>([]);
  const [compromisos, setCompromisos] = useState<CompromisoRow[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionRow[]>([]);

  useEffect(() => {
    if (!user) return;
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    supabase.from("clientes")
      .select("id,nombre_empresa,sector,tamano,pais,ciudad,updated_at")
      .eq("activo", true)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setClientes((data ?? []) as Cliente[]));

    supabase.from("side_sesiones")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString())
      .then(({ count }) => setSideCount(count ?? 0));

    supabase.from("cliente_actividades")
      .select("id,cliente_id,fecha,semaforo,es_sesion_consultoria,programa")
      .order("fecha", { ascending: false })
      .limit(500)
      .then(({ data }) => setActividades((data ?? []) as ActividadRow[]));

    supabase.from("cliente_compromisos")
      .select("id,cliente_id,estado,fecha_limite")
      .then(({ data }) => setCompromisos((data ?? []) as CompromisoRow[]));

    supabase.from("cliente_cotizaciones")
      .select("id,cliente_id,total,estado,moneda,created_at")
      .then(({ data }) => setCotizaciones((data ?? []) as CotizacionRow[]));
  }, [user]);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const sesionesMes = actividades.filter(
      (a) => a.es_sesion_consultoria && new Date(a.fecha) >= monthStart,
    ).length;

    const semaforo = { verde: 0, amarillo: 0, rojo: 0 } as Record<string, number>;
    actividades.forEach((a) => {
      if (a.semaforo && semaforo[a.semaforo] !== undefined) semaforo[a.semaforo]++;
    });

    const compPend = compromisos.filter((c) => c.estado === "pendiente").length;
    const compVencidos = compromisos.filter(
      (c) => c.estado === "pendiente" && c.fecha_limite && new Date(c.fecha_limite) < today,
    ).length;
    const compCumplidos = compromisos.filter((c) => c.estado === "cumplido").length;
    const tasaCumpl = compromisos.length
      ? Math.round((compCumplidos / compromisos.length) * 100) : 0;

    const cotAbiertas = cotizaciones.filter((c) => ["borrador", "enviada"].includes(c.estado));
    const pipelineUSD = cotAbiertas.reduce((s, c) => s + Number(c.total ?? 0), 0);
    const cotAceptadas = cotizaciones.filter((c) => c.estado === "aceptada");
    const ganadoUSD = cotAceptadas.reduce((s, c) => s + Number(c.total ?? 0), 0);
    const tasaConv = cotizaciones.length
      ? Math.round((cotAceptadas.length / cotizaciones.length) * 100) : 0;

    // Por cliente — top actividad
    const actPorCliente = new Map<string, number>();
    actividades.forEach((a) => actPorCliente.set(a.cliente_id, (actPorCliente.get(a.cliente_id) ?? 0) + 1));

    return { sesionesMes, semaforo, compPend, compVencidos, tasaCumpl,
      pipelineUSD, ganadoUSD, tasaConv, actPorCliente };
  }, [actividades, compromisos, cotizaciones]);

  const metrics = [
    { label: "Clientes activos", value: clientes.length, icon: Briefcase, accent: "Cartera total", to: "/app/clientes" as const },
    { label: "Diagnósticos este mes", value: sideCount, icon: Activity, accent: "SIDE completados", to: "/app/side_/historial" as const },
    { label: "Sesiones este mes", value: stats.sesionesMes, icon: Users2, accent: "Consultoría", to: "/app/coaching" as const },
    { label: "Compromisos pendientes", value: stats.compPend, icon: Clock,
      accent: stats.compVencidos > 0 ? `${stats.compVencidos} vencidos` : "Al día", to: "/app/clientes" as const },
  ];

  const fmtUSD = (n: number) => `USD ${Math.round(n).toLocaleString()}`;

  const topClientes = useMemo(() => {
    return [...clientes]
      .map((c) => ({ ...c, actividadCount: stats.actPorCliente.get(c.id) ?? 0 }))
      .sort((a, b) => b.actividadCount - a.actividadCount)
      .slice(0, 6);
  }, [clientes, stats.actPorCliente]);

  return (
    <div className="space-y-8 max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-navy">Dashboard ejecutivo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visión consolidada de tu cartera, pipeline y avance operacional.
          </p>
        </div>
        <Button asChild className="bg-navy text-primary-foreground hover:bg-navy/90">
          <Link to="/app/side"><Plus className="w-4 h-4 mr-2" /> Nuevo diagnóstico</Link>
        </Button>
      </header>

      {/* KPIs principales */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m) => (
          <div key={m.label} className="a360-card p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gold/10" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{m.label}</p>
                <p className="font-mono-num text-4xl text-navy mt-2 font-semibold">{m.value}</p>
                {m.accent && <p className="text-xs text-gold mt-1.5 font-medium">{m.accent}</p>}
              </div>
              <div className="w-10 h-10 rounded-md bg-navy text-gold flex items-center justify-center">
                <m.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Pipeline comercial + Salud operativa */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="a360-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-navy flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gold" /> Pipeline comercial
            </h2>
            <Link to="/app/clientes" className="text-xs text-gold font-medium hover:underline">
              Ver cotizaciones <ArrowUpRight className="w-3 h-3 inline" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-md border border-border/60 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Pipeline abierto</p>
              <p className="font-mono-num text-2xl text-navy mt-1.5 font-semibold">{fmtUSD(stats.pipelineUSD)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Borradores + enviadas</p>
            </div>
            <div className="rounded-md border border-border/60 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Ganado</p>
              <p className="font-mono-num text-2xl text-navy mt-1.5 font-semibold">{fmtUSD(stats.ganadoUSD)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Cotizaciones aceptadas</p>
            </div>
            <div className="rounded-md border border-border/60 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Conversión</p>
              <p className="font-mono-num text-2xl text-navy mt-1.5 font-semibold">{stats.tasaConv}%</p>
              <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Histórica
              </p>
            </div>
          </div>
        </div>

        <div className="a360-card p-6">
          <h2 className="font-display text-lg text-navy mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gold" /> Cumplimiento
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Tasa de cumplimiento</span>
                <span className="font-mono-num font-semibold text-navy">{stats.tasaCumpl}%</span>
              </div>
              <div className="h-2 bg-border/40 rounded-full overflow-hidden">
                <div className="h-full bg-gold" style={{ width: `${stats.tasaCumpl}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center pt-2">
              <div className="rounded-md bg-amber-50 border border-amber-200 p-2">
                <p className="font-mono-num text-xl font-semibold text-amber-700">{stats.compPend}</p>
                <p className="text-[10px] uppercase tracking-wider text-amber-700">Pendientes</p>
              </div>
              <div className="rounded-md bg-red-50 border border-red-200 p-2">
                <p className="font-mono-num text-xl font-semibold text-red-700">{stats.compVencidos}</p>
                <p className="text-[10px] uppercase tracking-wider text-red-700">Vencidos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Semáforo de sesiones */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {([
          { k: "verde", label: "Sesiones en verde", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
          { k: "amarillo", label: "Sesiones en amarillo", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
          { k: "rojo", label: "Sesiones en rojo", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
        ] as const).map((s) => {
          const v = stats.semaforo[s.k] ?? 0;
          const total = stats.semaforo.verde + stats.semaforo.amarillo + stats.semaforo.rojo || 1;
          const pct = Math.round((v / total) * 100);
          return (
            <div key={s.k} className={`a360-card p-5 border ${s.border}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{s.label}</p>
                <span className={`w-3 h-3 rounded-full ${s.color}`} />
              </div>
              <p className={`font-mono-num text-3xl font-semibold ${s.text}`}>{v}</p>
              <p className="text-xs text-muted-foreground mt-1">{pct}% del histórico</p>
            </div>
          );
        })}
      </section>

      {/* Top clientes por actividad */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl text-navy">Top clientes por actividad</h2>
          <Link to="/app/clientes" className="text-sm text-gold font-medium hover:underline inline-flex items-center gap-1">
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {topClientes.length === 0 ? (
          <div className="a360-card p-8 text-center text-sm text-muted-foreground">
            Aún no tienes clientes. Crea uno desde el módulo SIDE.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {topClientes.map((c) => (
              <article key={c.id} className="a360-card a360-card-lg p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg text-navy leading-tight truncate">{c.nombre_empresa}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[c.sector, c.tamano].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {(c.ciudad || c.pais) && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {[c.ciudad, c.pais].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-num text-2xl font-semibold text-navy">{c.actividadCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">actividades</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-auto">
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {new Date(c.updated_at).toLocaleDateString()}
                  </span>
                  <Button asChild size="sm" className="h-8 text-xs bg-gold text-navy hover:bg-gold/90">
                    <Link to="/app/clientes/$clienteId/resumen" params={{ clienteId: c.id }}>
                      Abrir ficha
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {stats.compVencidos > 0 && (
        <div className="a360-card p-4 border border-red-200 bg-red-50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-red-800">
              Tienes {stats.compVencidos} compromiso{stats.compVencidos !== 1 ? "s" : ""} vencido{stats.compVencidos !== 1 ? "s" : ""}.
            </p>
            <p className="text-red-700 mt-0.5">
              Revisa las fichas de cliente y actualiza el estado o renegocia las fechas límite.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
