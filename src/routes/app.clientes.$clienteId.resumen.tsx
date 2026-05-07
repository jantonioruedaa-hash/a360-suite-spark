import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { imeColor, imeLabel, ESTADOS, TIPOS_ACTIVIDAD } from "@/lib/clientes-helpers";
import { Activity, Target, Users2, BookOpen, Calendar, Users, FileText, Building2, Sparkles, BarChart3, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clientes/$clienteId/resumen")({ component: Resumen });

interface Stats {
  ime: number | null;
  totalSide: number;
  coachingDone: number;
  leeDone: number;
  planPct: number;
}

function Resumen() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/resumen" });
  const [stats, setStats] = useState<Stats>({ ime: null, totalSide: 0, coachingDone: 0, leeDone: 0, planPct: 0 });
  const [actividades, setActividades] = useState<Array<{ id: string; tipo: string; titulo: string; fecha: string; descripcion: string | null; proxima_accion: string | null; fecha_proxima_accion: string | null }>>([]);
  const [notas, setNotas] = useState("");
  const [savingNotas, setSavingNotas] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const [planLic, setPlanLic] = useState<string>("esencial");
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: cli }, { data: sides }, { data: coach }, { data: lee }, { data: plan }, { data: acts }] = await Promise.all([
        supabase.from("clientes").select("notas_internas,estado,plan_licencia,fecha_inicio_relacion").eq("id", clienteId).maybeSingle(),
        supabase.from("side_sesiones").select("ime_score,updated_at").eq("cliente_id", clienteId).order("updated_at", { ascending: false }),
        supabase.from("coaching_sesiones").select("id,completada").eq("cliente_id", clienteId),
        supabase.from("lee_programas").select("capitulos_desbloqueados").eq("cliente_id", clienteId).maybeSingle(),
        supabase.from("planes_estrategicos").select("sec01,sec02,sec03,sec04,sec05,sec06,sec07,sec08,sec09,sec10_esg,sec11_alianzas,sec12_innovacion,sec13,sec14,sec15,sec16,sec17_cmi,sec18_ejecucion").eq("cliente_id", clienteId).maybeSingle(),
        supabase.from("cliente_actividades").select("id,tipo,titulo,fecha,descripcion,proxima_accion,fecha_proxima_accion").eq("cliente_id", clienteId).order("fecha", { ascending: false }).limit(5),
      ]);

      setNotas(cli?.notas_internas ?? "");
      setEstado(cli?.estado ?? null);
      setPlanLic(cli?.plan_licencia ?? "esencial");
      setFechaInicio(cli?.fecha_inicio_relacion ?? null);

      const sideList = sides ?? [];
      const planFilled = plan ? Object.values(plan).filter((v) => v && Object.keys(v as object).length > 0).length : 0;

      setStats({
        ime: sideList[0]?.ime_score ?? null,
        totalSide: sideList.length,
        coachingDone: (coach ?? []).filter((c) => c.completada).length,
        leeDone: lee?.capitulos_desbloqueados?.length ?? 0,
        planPct: Math.round((planFilled / 18) * 100),
      });
      setActividades(acts ?? []);
    })();
  }, [clienteId]);

  const guardarNotas = async () => {
    setSavingNotas(true);
    const { error } = await supabase.from("clientes").update({ notas_internas: notas }).eq("id", clienteId);
    if (error) toast.error(error.message); else toast.success("Notas guardadas");
    setSavingNotas(false);
  };

  const estadoObj = ESTADOS.find((e) => e.value === estado);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-display text-2xl text-navy">Resumen ejecutivo</h2>
        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
          {estadoObj && <span>Estado: <strong className="text-navy">{estadoObj.label}</strong></span>}
          <span>Plan: <strong className="capitalize text-navy">{planLic}</strong></span>
          {fechaInicio && <span>Inicio: <strong className="text-navy">{new Date(fechaInicio).toLocaleDateString()}</strong></span>}
        </div>
      </div>

      {/* 4 métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="a360-card a360-card-lg p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">IME actual</div>
          <div className={`font-display text-3xl mt-1 ${imeColor(stats.ime)}`}>
            {stats.ime != null ? stats.ime.toFixed(0) : "—"}
          </div>
          <div className="text-xs text-muted-foreground">{imeLabel(stats.ime)}</div>
        </div>
        <div className="a360-card a360-card-lg p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Diagnósticos SIDE</div>
          <div className="font-display text-3xl mt-1 text-navy">{stats.totalSide}</div>
          <div className="text-xs text-muted-foreground">realizados</div>
        </div>
        <div className="a360-card a360-card-lg p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Coaching</div>
          <div className="font-display text-3xl mt-1 text-navy">{stats.coachingDone}</div>
          <div className="text-xs text-muted-foreground">sesiones completas</div>
        </div>
        <div className="a360-card a360-card-lg p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">LEE</div>
          <div className="font-display text-3xl mt-1 text-navy">{stats.leeDone}/10</div>
          <div className="text-xs text-muted-foreground">capítulos</div>
        </div>
      </div>

      {/* Progreso por módulo */}
      <div className="a360-card a360-card-lg p-5">
        <h3 className="font-display text-navy mb-4">Progreso por módulo</h3>
        <div className="space-y-3">
          <Bar label="SIDE" icon={Activity} value={Math.min(stats.totalSide * 25, 100)} text={`${stats.totalSide} diagnósticos`} />
          <Bar label="Plan estratégico" icon={Target} value={stats.planPct} text={`${stats.planPct}% completado`} />
          <Bar label="Coaching" icon={Users2} value={Math.round((stats.coachingDone / 12) * 100)} text={`${stats.coachingDone}/12 herramientas`} />
          <Bar label="LEE" icon={BookOpen} value={(stats.leeDone / 10) * 100} text={`${stats.leeDone}/10 capítulos`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas actividades */}
        <div className="a360-card a360-card-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-navy">Últimas actividades</h3>
            <Link to="/app/clientes/$clienteId/actividades" params={{ clienteId }} className="text-xs text-gold hover:underline">Ver todas →</Link>
          </div>
          {actividades.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividades registradas.</p>
          ) : (
            <ul className="space-y-3">
              {actividades.map((a) => {
                const tipo = TIPOS_ACTIVIDAD.find((t) => t.value === a.tipo);
                return (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-navy truncate">{a.titulo}</div>
                      <div className="text-xs text-muted-foreground">
                        {tipo?.label ?? a.tipo} · {new Date(a.fecha).toLocaleDateString()}
                      </div>
                      {a.descripcion && <div className="text-xs text-muted-foreground truncate">{a.descripcion}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Próximas acciones */}
        <div className="a360-card a360-card-lg p-5">
          <h3 className="font-display text-navy mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Próximas acciones</h3>
          {actividades.filter((a) => a.proxima_accion).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin acciones pendientes.</p>
          ) : (
            <ul className="space-y-3">
              {actividades.filter((a) => a.proxima_accion).map((a) => (
                <li key={a.id} className="flex justify-between text-sm border-l-2 border-gold pl-3">
                  <div>
                    <div className="text-navy">{a.proxima_accion}</div>
                    <div className="text-xs text-muted-foreground">{a.titulo}</div>
                  </div>
                  {a.fecha_proxima_accion && (
                    <div className="text-xs text-gold font-medium">{new Date(a.fecha_proxima_accion).toLocaleDateString()}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Notas internas */}
      <div className="a360-card a360-card-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-navy">Notas internas del consultor</h3>
          <button onClick={guardarNotas} disabled={savingNotas} className="text-xs text-gold hover:underline">
            {savingNotas ? "Guardando…" : "Guardar"}
          </button>
        </div>
        <Textarea rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas privadas sobre este cliente…" />
      </div>
    </div>
  );
}

function Bar({ label, icon: Icon, value, text }: { label: string; icon: React.ComponentType<{ className?: string }>; value: number; text: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="flex items-center gap-2 text-navy"><Icon className="w-3.5 h-3.5" />{label}</span>
        <span className="text-xs text-muted-foreground">{text}</span>
      </div>
      <div className="h-2 bg-cream rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-navy to-gold transition-all" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
