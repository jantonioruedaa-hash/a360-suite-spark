import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, CheckCircle2, ChevronDown, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScaleButtons } from "@/components/side/ScaleButtons";
import { SideResultadosCliente } from "@/components/side/SideResultadosCliente";
import {
  DIMENSIONES, IVEE_PREGUNTAS, IDF_PREGUNTAS, COF_PREGUNTAS,
  type ScoreMap,
} from "@/lib/side-data";

export const Route = createFileRoute("/app/clientes/$clienteId/side")({
  component: SideClientePage,
});

const TOTAL_PREGUNTAS = 220; // 12×15 + 16 + 12 + 12

const DIM_EMOJI: Record<string, string> = {
  L: "👑", E: "🎯", G: "⚖️", O: "🏗️", GE: "⚙️", F: "💰",
  C: "🤝", M: "📣", OP: "🔧", CU: "🌱", T: "👥", ES: "🚀",
};

const LIST_SELECT = "id,nombre_sesion,ime_score,ivee_score,idf_score,cof_score,completada,created_at,updated_at,estado_revision,comentario_consultor,revisado_en";

interface Sesion {
  id: string;
  nombre_sesion: string | null;
  ime_score: number | null;
  ivee_score: number | null;
  idf_score: number | null;
  cof_score: number | null;
  completada: boolean;
  created_at: string;
  updated_at: string;
  estado_revision: "borrador" | "pendiente_revision" | "revisado";
  comentario_consultor: string | null;
  revisado_en: string | null;
}

function nivelIME(ime: number | null) {
  const v = ime ?? 0;
  if (v >= 4.5) return { label: "Excelente", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (v >= 3.5) return { label: "Bueno",     color: "bg-blue-100 text-blue-700 border-blue-200" };
  if (v >= 2.5) return { label: "Regular",   color: "bg-amber-100 text-amber-700 border-amber-200" };
  return             { label: "Crítico",    color: "bg-red-100 text-red-700 border-red-200" };
}

function pctRespondidas(scores: ScoreMap): number {
  const ids = [
    ...DIMENSIONES.flatMap((d) => d.preguntas.map((p) => p.id)),
    ...IVEE_PREGUNTAS.map((p) => p.id),
    ...IDF_PREGUNTAS.map((p) => p.id),
    ...COF_PREGUNTAS.map((p) => p.id),
  ];
  const respondidas = ids.filter((id) => (scores[id] ?? 0) > 0).length;
  return Math.round((respondidas / TOTAL_PREGUNTAS) * 100);
}

// ─── SideClientePage ──────────────────────────────────────────────────────────

function SideClientePage() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/side" });
  const [sesiones, setSesiones]       = useState<Sesion[]>([]);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState<"lista" | "cuestionario" | "resultados">("lista");
  const [sesionActiva, setSesionActiva]   = useState<Sesion | null>(null);
  const [scoresActivos, setScoresActivos] = useState<ScoreMap>({});
  const [readOnly, setReadOnly]           = useState(false);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("side_sesiones")
      .select(LIST_SELECT)
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    setSesiones((data ?? []) as Sesion[]);
    setLoading(false);
  };
  useEffect(() => { cargar(); }, [clienteId]);

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este diagnóstico?")) return;
    const { error } = await supabase.from("side_sesiones").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Diagnóstico eliminado");
    cargar();
  };

  const iniciarNuevo = async () => {
    const nombre = `Diagnóstico SIDE ${new Date().toLocaleDateString("es-EC")}`;
    const { data, error } = await supabase
      .from("side_sesiones")
      .insert({ cliente_id: clienteId, nombre_sesion: nombre, scores: {} })
      .select(LIST_SELECT)
      .single();
    if (error || !data) return toast.error("No se pudo crear el diagnóstico");
    setSesionActiva(data as Sesion);
    setScoresActivos({});
    setReadOnly(false);
    setView("cuestionario");
  };

  const abrirCuestionario = async (s: Sesion) => {
    if (s.estado_revision === "pendiente_revision") {
      toast.info("Este diagnóstico está en revisión. Los resultados estarán disponibles cuando el consultor los revise.");
      return; // TODO Etapa 2: mostrar vista de resultados bloqueada
    }
    if (s.estado_revision === "revisado") {
      const { data: row } = await supabase
        .from("side_sesiones")
        .select("scores")
        .eq("id", s.id)
        .single();
      setScoresActivos((row?.scores as ScoreMap) ?? {});
      setSesionActiva(s);
      setView("resultados");
      return;
    }

    // estado_revision === 'borrador':
    // editable solo si el cliente inició esta sesión (completada=false).
    // completada=true aquí sería dato histórico del flujo antiguo → readOnly.
    const esEditable = !s.completada;

    const { data: row } = await supabase
      .from("side_sesiones")
      .select("scores")
      .eq("id", s.id)
      .single();
    setScoresActivos((row?.scores as ScoreMap) ?? {});
    setSesionActiva(s);
    setReadOnly(!esEditable);
    setView("cuestionario");
  };

  if (view === "resultados" && sesionActiva) {
    return (
      <SideResultadosCliente
        nombre={sesionActiva.nombre_sesion ?? "Diagnóstico SIDE"}
        imeScore={sesionActiva.ime_score ?? 0}
        iveeScore={sesionActiva.ivee_score ?? 0}
        idfScore={sesionActiva.idf_score ?? 0}
        cofScore={sesionActiva.cof_score ?? 0}
        comentarioConsultor={sesionActiva.comentario_consultor}
        revisadoEn={sesionActiva.revisado_en}
        scores={scoresActivos}
        onBack={() => { setView("lista"); cargar(); }}
      />
    );
  }

  if (view === "cuestionario" && sesionActiva) {
    return (
      <ClienteCuestionario
        sesion={sesionActiva}
        scores={scoresActivos}
        readOnly={readOnly}
        onBack={() => { setView("lista"); cargar(); }}
        onScoresChange={setScoresActivos}
      />
    );
  }

  // ─── Vista lista ─────────────────────────────────────────────────────────

  const revisadas = sesiones.filter((s) => s.completada || s.estado_revision === "revisado");
  const ultimaRevisada  = revisadas[0];
  const previaRevisada  = revisadas[1];
  const delta = ultimaRevisada && previaRevisada
    && ultimaRevisada.ime_score != null && previaRevisada.ime_score != null
    ? +(ultimaRevisada.ime_score - previaRevisada.ime_score).toFixed(2)
    : null;
  const ultimas = sesiones.slice(0, 6);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl text-navy">Diagnósticos SIDE</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Historial completo, evolución del IME y exportables del cliente.
          </p>
        </div>
        <button
          onClick={iniciarNuevo}
          style={{
            background: "linear-gradient(135deg, #0C4A6E, #0EA5E9)",
            color: "white", border: "none", borderRadius: 10,
            padding: "10px 20px", fontSize: 14, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}
        >
          + Nuevo diagnóstico
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Diagnósticos</div>
          <div className="font-display text-2xl text-navy">{sesiones.length}</div>
          <div className="text-xs text-muted-foreground">{revisadas.length} revisados</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">IME actual</div>
          <div className="font-display text-2xl text-navy">{ultimaRevisada?.ime_score?.toFixed(2) ?? "—"}</div>
          {ultimaRevisada && (
            <Badge variant="outline" className={nivelIME(ultimaRevisada.ime_score).color}>
              {nivelIME(ultimaRevisada.ime_score).label}
            </Badge>
          )}
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Δ vs anterior</div>
          <div className={`font-display text-2xl ${delta == null ? "text-muted-foreground" : delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
          </div>
          <div className="text-xs text-muted-foreground">Movimiento del IME</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Subíndices (último)</div>
          <div className="text-xs space-y-0.5 mt-1">
            <div>IVEE: <b>{ultimaRevisada?.ivee_score?.toFixed(2) ?? "—"}</b></div>
            <div>IDF:  <b>{ultimaRevisada?.idf_score?.toFixed(2) ?? "—"}</b></div>
            <div>COF:  <b>{ultimaRevisada?.cof_score?.toFixed(2) ?? "—"}</b></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Listado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Historial completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : sesiones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">Este cliente aún no tiene diagnósticos SIDE.</p>
              <button
                onClick={iniciarNuevo}
                style={{
                  background: "linear-gradient(135deg, #0C4A6E, #0EA5E9)",
                  color: "white", border: "none", borderRadius: 10,
                  padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                Iniciar primer diagnóstico
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase tracking-wider">
                  <tr className="border-b">
                    <th className="text-left py-2">Sesión</th>
                    <th className="text-center py-2">IME</th>
                    <th className="text-center py-2">IVEE</th>
                    <th className="text-center py-2">IDF</th>
                    <th className="text-center py-2">COF</th>
                    <th className="text-center py-2">Estado</th>
                    <th className="text-right py-2">Fecha</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sesiones.map((s) => {
                    const n = nivelIME(s.ime_score);
                    const esEditable = s.estado_revision === "borrador" && !s.completada;
                    return (
                      <tr key={s.id} className="border-b hover:bg-muted/30">
                        <td className="py-2">
                          <button
                            onClick={() => abrirCuestionario(s)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit", color: "#2563EB", textDecoration: "none" }}
                            className="hover:underline text-left"
                          >
                            {s.nombre_sesion ?? "Diagnóstico SIDE"}
                          </button>
                        </td>
                        <td className="text-center font-semibold">
                          <Badge variant="outline" className={n.color}>{(s.ime_score ?? 0).toFixed(2)}</Badge>
                        </td>
                        <td className="text-center">{s.ivee_score?.toFixed(2) ?? "—"}</td>
                        <td className="text-center">{s.idf_score?.toFixed(2) ?? "—"}</td>
                        <td className="text-center">{s.cof_score?.toFixed(2) ?? "—"}</td>
                        <td className="text-center"><EstadoBadge sesion={s} /></td>
                        <td className="text-right text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="text-right">
                          {esEditable && (
                            <button
                              onClick={() => eliminar(s.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: "4px 6px" }}
                              title="Eliminar"
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evolución mini-line */}
      {ultimas.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolución IME (últimos {ultimas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-24">
              {[...ultimas].reverse().map((s) => {
                const v = s.ime_score ?? 0;
                const h = Math.max(6, Math.round((v / 5) * 96));
                const n = nivelIME(s.ime_score);
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t" style={{ height: h, background: "hsl(var(--primary))", opacity: 0.85 }} title={`${v.toFixed(2)}`} />
                    <div className="text-[9px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                    <div className="text-[10px] font-semibold">{v.toFixed(1)}</div>
                    <Badge variant="outline" className={`${n.color} text-[9px] px-1`}>{n.label}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── EstadoBadge ─────────────────────────────────────────────────────────────

function EstadoBadge({ sesion }: { sesion: Sesion }) {
  if (sesion.estado_revision === "revisado" || sesion.completada) {
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">Revisado</Badge>;
  }
  if (sesion.estado_revision === "pendiente_revision") {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200" variant="outline">En revisión</Badge>;
  }
  return <Badge variant="outline">En curso</Badge>;
}

// ─── ClienteCuestionario ──────────────────────────────────────────────────────

interface CuestionarioProps {
  sesion: Sesion;
  scores: ScoreMap;
  readOnly: boolean;
  onBack: () => void;
  onScoresChange: (s: ScoreMap) => void;
}

function ClienteCuestionario({ sesion, scores, readOnly, onBack, onScoresChange }: CuestionarioProps) {
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando]   = useState(false);
  const [expandido, setExpandido] = useState<string | null>(DIMENSIONES[0].key);
  const dirtyRef = useRef(false);

  const pct             = pctRespondidas(scores);
  const todasRespondidas = pct === 100;

  useEffect(() => { dirtyRef.current = true; }, [scores]);

  useEffect(() => {
    if (readOnly) return;
    const interval = setInterval(async () => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      await supabase
        .from("side_sesiones")
        .update({ scores, updated_at: new Date().toISOString() })
        .eq("id", sesion.id);
    }, 30000);
    return () => clearInterval(interval);
  }, [scores, sesion.id, readOnly]);

  const guardarYSalir = async () => {
    setGuardando(true);
    const { error } = await supabase
      .from("side_sesiones")
      .update({ scores, updated_at: new Date().toISOString() })
      .eq("id", sesion.id);
    setGuardando(false);
    if (error) return toast.error(error.message);
    toast.success("Progreso guardado");
    onBack();
  };

  const enviarRevision = async () => {
    if (!todasRespondidas) {
      toast.error(`Debes responder todas las preguntas (${pct}% completado)`);
      return;
    }
    if (!confirm("¿Enviar el diagnóstico para revisión del consultor? No podrás editarlo después.")) return;
    setEnviando(true);
    const { error } = await supabase
      .from("side_sesiones")
      .update({ scores, estado_revision: "pendiente_revision", updated_at: new Date().toISOString() })
      .eq("id", sesion.id);
    setEnviando(false);
    if (error) return toast.error(error.message);
    toast.success("Diagnóstico enviado para revisión");
    onBack();
  };

  const actionButtons = !readOnly ? (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
        {pct}% · {todasRespondidas ? "✓ Listo para enviar" : "Responde todas las preguntas para enviar"}
      </div>
      <button
        onClick={guardarYSalir}
        disabled={guardando}
        style={{
          background: "rgba(255,255,255,0.15)", color: "white",
          border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10,
          padding: "10px 20px", fontSize: 14, fontWeight: 700,
          cursor: guardando ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <Save style={{ width: 16, height: 16 }} />
        {guardando ? "Guardando…" : "Guardar y continuar después"}
      </button>
      <button
        onClick={enviarRevision}
        disabled={!todasRespondidas || enviando}
        style={{
          background: todasRespondidas ? "linear-gradient(135deg, #0EA5E9, #6366F1)" : "rgba(255,255,255,0.1)",
          color: todasRespondidas ? "white" : "rgba(255,255,255,0.4)",
          border: "none", borderRadius: 10, padding: "10px 20px",
          fontSize: 14, fontWeight: 700,
          cursor: todasRespondidas && !enviando ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <CheckCircle2 style={{ width: 16, height: 16 }} />
        {enviando ? "Enviando…" : "Enviar para revisión"}
      </button>
    </div>
  ) : (
    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
      Modo lectura — este diagnóstico no puede editarse
    </div>
  );

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', minHeight: "100vh", background: "#F0F4FF" }}>

      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "linear-gradient(135deg, #0C4A6E, #0369A1)",
        padding: "16px 32px", display: "flex", alignItems: "center", gap: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
            padding: "8px 12px", color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Volver
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sesion.nombre_sesion ?? "Diagnóstico SIDE"}
          </div>
          {!readOnly && (
            <div style={{ marginTop: 6, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 999, overflow: "hidden", maxWidth: 300 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: 999, transition: "width 0.5s ease" }} />
            </div>
          )}
        </div>
        {actionButtons}
      </div>

      <div style={{ padding: "40px 32px", maxWidth: 900, margin: "0 auto" }}>

        {/* Intro card */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #E0E7FF", padding: "28px 32px", marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0C4A6E", marginBottom: 8 }}>
            Sistema Integral de Diagnóstico Empresarial
          </div>
          <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, marginBottom: 16 }}>
            {readOnly
              ? "Estás viendo las respuestas de este diagnóstico en modo lectura."
              : "Responde cada pregunta con honestidad. Usa la escala del 1 al 5 donde 1 significa que casi nunca ocurre y 5 que siempre ocurre. El diagnóstico se guardará automáticamente cada 30 segundos."}
          </p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "#64748B" }}>
              <b style={{ color: "#0C4A6E" }}>220</b> preguntas · <b style={{ color: "#0C4A6E" }}>12</b> dimensiones + IVEE + IDF + COF
            </div>
            {!readOnly && (
              <div style={{ fontSize: 13, color: "#64748B" }}>
                Progreso: <b style={{ color: "#0EA5E9" }}>{pct}%</b>
              </div>
            )}
          </div>
        </div>

        {/* IME — 12 dimensiones */}
        <SectionHeader
          label="IME — Índice de Madurez Empresarial"
          sub="12 dimensiones × 15 preguntas = 180 preguntas"
        />
        {DIMENSIONES.map((dim) => {
          const open     = expandido === dim.key;
          const answered = dim.preguntas.filter((p) => (scores[p.id] ?? 0) > 0).length;
          return (
            <div key={dim.key} style={{ background: "white", borderRadius: 18, border: "1px solid #E0E7FF", marginBottom: 12, overflow: "hidden" }}>
              <button
                onClick={() => setExpandido(open ? null : dim.key)}
                style={{ width: "100%", background: "none", border: "none", padding: "18px 24px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ fontSize: 24, flexShrink: 0 }}>{DIM_EMOJI[dim.key] ?? "📋"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0C4A6E" }}>{dim.nombre}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{answered}/15 respondidas</div>
                </div>
                {answered === 15 && <CheckCircle2 style={{ width: 20, height: 20, color: "#10B981", flexShrink: 0 }} />}
                <ChevronDown style={{ width: 20, height: 20, color: "#94A3B8", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {open && (
                <div style={{ padding: "0 24px 24px" }}>
                  {dim.preguntas.map((p) => (
                    <ScaleButtons
                      key={p.id}
                      id={p.id}
                      texto={p.texto}
                      value={scores[p.id]}
                      readOnly={readOnly}
                      onChange={(v) => onScoresChange({ ...scores, [p.id]: v })}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* IVEE */}
        <IndexSection
          label="IVEE — Índice de Viabilidad Estratégica Empresarial"
          sub="16 preguntas — propuesta de valor, mercado, financiero y escalabilidad"
          preguntas={IVEE_PREGUNTAS}
          scores={scores}
          readOnly={readOnly}
          onChange={onScoresChange}
        />

        {/* IDF */}
        <IndexSection
          label="IDF — Índice de Dependencia del Fundador"
          sub="12 preguntas — puntuaciones altas indican mayor dependencia (escala invertida)"
          preguntas={IDF_PREGUNTAS}
          scores={scores}
          readOnly={readOnly}
          onChange={onScoresChange}
        />

        {/* COF */}
        <IndexSection
          label="COF — Coherencia Organizacional y Funcional"
          sub="12 preguntas — alineación estrategia-estructura-cultura-procesos"
          preguntas={COF_PREGUNTAS}
          scores={scores}
          readOnly={readOnly}
          onChange={onScoresChange}
        />

        {/* Bottom action bar */}
        {!readOnly && (
          <div style={{
            background: "linear-gradient(135deg, #0C4A6E, #0369A1)", borderRadius: 18,
            padding: "24px 32px", display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginTop: 8,
          }}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: 600 }}>
              {pct}% completado
            </div>
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{ marginBottom: 16, marginTop: 8 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#0C4A6E" }}>{label}</div>
      <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

interface IndexSectionProps {
  label: string;
  sub: string;
  preguntas: { id: string; texto: string }[];
  scores: ScoreMap;
  readOnly: boolean;
  onChange: (s: ScoreMap) => void;
}

function IndexSection({ label, sub, preguntas, scores, readOnly, onChange }: IndexSectionProps) {
  const answered = preguntas.filter((p) => (scores[p.id] ?? 0) > 0).length;
  return (
    <div style={{ marginBottom: 32 }}>
      <SectionHeader label={label} sub={sub} />
      <div style={{ background: "white", borderRadius: 18, border: "1px solid #E0E7FF", padding: "24px" }}>
        <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>{answered}/{preguntas.length} respondidas</div>
        {preguntas.map((p) => (
          <ScaleButtons
            key={p.id}
            id={p.id}
            texto={p.texto}
            value={scores[p.id]}
            readOnly={readOnly}
            onChange={(v) => onChange({ ...scores, [p.id]: v })}
          />
        ))}
      </div>
    </div>
  );
}
