import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ETAPAS_A360, HERRAMIENTAS_A360, RADAR_DIMENSIONES, PLAN_CONTINUIDAD_FASES,
  getHerramienta, type HerramientaA360,
} from "@/lib/coaching-catalogo";
import {
  listarSesionesCliente, crearSesion, actualizarSesion, eliminarSesion,
  progresoPorEtapa, etapaActual, type SesionCoaching,
} from "@/lib/coaching-helpers";
import { Check, Trash2, ChevronRight } from "lucide-react";
import { AnalisisIACoaching } from "@/components/coaching/AnalisisIACoaching";
import { SintesisProgramaIA } from "@/components/coaching/SintesisProgramaIA";
import { CoachingExportImport } from "@/components/coaching/CoachingExportImport";
import { CreenciasInstrumentado } from "@/components/coaching/editores/CreenciasInstrumentado";
import { ContextoInstrumentado } from "@/components/coaching/editores/ContextoInstrumentado";
import { ManifiestoInstrumentado } from "@/components/coaching/editores/ManifiestoInstrumentado";
import { SimuladorInstrumentado } from "@/components/coaching/editores/SimuladorInstrumentado";
import { RetoInstrumentado } from "@/components/coaching/editores/RetoInstrumentado";
import { BibliotecaPreguntasInstrumentado } from "@/components/coaching/editores/BibliotecaPreguntasInstrumentado";
import { PlanContinuidadInstrumentado } from "@/components/coaching/editores/PlanContinuidadInstrumentado";
import { ReporteTransformacionInstrumentado } from "@/components/coaching/editores/ReporteTransformacionInstrumentado";
import { RadarEditor } from "@/components/coaching/editores/RadarEditor";
import { EspejoEditor } from "@/components/coaching/editores/EspejoEditor";
import { PulsoEditor } from "@/components/coaching/editores/PulsoEditor";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/clientes/$clienteId/coaching")({
  component: CoachingClienteWorkspace,
});

type VistaSecundaria = "ia" | "historial" | "progreso";

// ── Inline style constants ─────────────────────────────────────────────────────
const AURORA_LABEL: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "8px", display: "block" };
const AURORA_TEXTAREA: React.CSSProperties = { width: "100%", padding: "14px 18px", border: "1.5px solid #E0E7FF", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.8, minHeight: "140px", resize: "vertical", transition: "all 0.15s" };

const onAuroraFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = "#0EA5E9"; e.target.style.boxShadow = "0 0 0 4px rgba(14,165,233,0.1)"; };
const onAuroraBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = "#E0E7FF"; e.target.style.boxShadow = "none"; };

// ── Main component ─────────────────────────────────────────────────────────────
function CoachingClienteWorkspace() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/coaching" });

  const [sesiones, setSesiones]         = useState<SesionCoaching[]>([]);
  const [loading, setLoading]           = useState(true);
  const [clienteNombre, setClienteNombre] = useState("Cliente");
  const [herramientaIndex, setHerramientaIndex] = useState(0);
  const [vistaSecundaria, setVistaSecundaria]   = useState<VistaSecundaria | null>(null);
  const [editing, setEditing]           = useState<SesionCoaching | null>(null);
  const initialSetDone = useRef(false);

  const cargar = async () => {
    setLoading(true);
    try { setSesiones(await listarSesionesCliente(clienteId)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    cargar();
    supabase.from("clientes").select("nombre_empresa").eq("id", clienteId).maybeSingle()
      .then(({ data }) => { if (data?.nombre_empresa) setClienteNombre(data.nombre_empresa); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  // Set initial tool to first incomplete one
  useEffect(() => {
    if (!initialSetDone.current && sesiones.length > 0) {
      initialSetDone.current = true;
      const first = HERRAMIENTAS_A360.findIndex(
        (h) => !sesiones.some((s) => s.herramienta_id === h.id && s.completada)
      );
      setHerramientaIndex(first >= 0 ? first : HERRAMIENTAS_A360.length - 1);
    }
  }, [sesiones]);

  const progreso       = useMemo(() => progresoPorEtapa(sesiones), [sesiones]);
  const totalCompletadas = sesiones.filter((s) => s.completada).length;
  const pctGlobal      = Math.round((totalCompletadas / HERRAMIENTAS_A360.length) * 100);
  const analisisCount  = sesiones.filter((s) => !!(s.datos as Record<string, unknown>)?.analisis_ia).length;
  const diasEnPrograma = useMemo(() => {
    if (sesiones.length === 0) return 0;
    const primera = new Date(sesiones[sesiones.length - 1].created_at);
    return Math.round((Date.now() - primera.getTime()) / 86400000);
  }, [sesiones]);

  const herramientaActual = HERRAMIENTAS_A360[herramientaIndex];
  const sesionActual      = herramientaActual
    ? sesiones.find((s) => s.herramienta_id === herramientaActual.id)
    : undefined;

  const openSecundaria = (v: VistaSecundaria) =>
    setVistaSecundaria((prev) => (prev === v ? null : v));

  return (
    <div
      className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8"
      style={{ display: "flex", alignItems: "flex-start", minHeight: "100vh" }}
    >
      {/* ═══════════════════ SIDEBAR ═══════════════════════════════════════════ */}
      <aside
        style={{
          width: "280px", flexShrink: 0,
          position: "sticky", top: 0, height: "100vh",
          background: "linear-gradient(180deg, #060D1A 0%, #0F172A 100%)",
          display: "flex", flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Scrollable top section */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 8px" }}>

          {/* Back button */}
          <Link
            to="/app/coaching"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textDecoration: "none", padding: "7px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "20px", transition: "color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.8)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)"; }}
          >
            ← Mis clientes
          </Link>

          {/* Company avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #0EA5E9, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 900, color: "white", flexShrink: 0 }}>
              {clienteNombre[0]?.toUpperCase() ?? "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clienteNombre}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>Programa A360</div>
            </div>
          </div>

          {/* Global progress */}
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px 16px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>Progreso del programa</span>
              <span style={{ fontSize: "18px", fontWeight: 900, color: "white" }}>{pctGlobal}%</span>
            </div>
            <div style={{ height: "5px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", overflow: "hidden", marginBottom: "8px" }}>
              <div style={{ height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", width: `${pctGlobal}%`, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
              {totalCompletadas} de {HERRAMIENTAS_A360.length} herramientas
            </div>
          </div>

          {/* Tool list grouped by stage */}
          <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
            Herramientas del programa
          </div>

          {ETAPAS_A360.map((et) => {
            const herrsDeEtapa = HERRAMIENTAS_A360.filter((h) => h.etapa === et.id);
            return (
              <div key={et.id} style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", paddingLeft: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: et.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, color: et.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{et.id}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                  {herrsDeEtapa.map((h) => {
                    const globalIdx = HERRAMIENTAS_A360.findIndex((x) => x.id === h.id);
                    const sesion    = sesiones.find((s) => s.herramienta_id === h.id);
                    const isCompleta = sesion?.completada ?? false;
                    const isActual   = herramientaIndex === globalIdx && vistaSecundaria === null;

                    return (
                      <button
                        key={h.id}
                        onClick={() => { setHerramientaIndex(globalIdx); setVistaSecundaria(null); }}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "8px 10px", borderRadius: "8px",
                          background: isActual ? "rgba(14,165,233,0.14)" : "transparent",
                          border: `1px solid ${isActual ? "rgba(14,165,233,0.28)" : "transparent"}`,
                          cursor: "pointer", textAlign: "left", width: "100%",
                          transition: "all 0.12s",
                        }}
                        onMouseEnter={(e) => { if (!isActual) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { if (!isActual) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        {/* Status circle */}
                        <div style={{
                          width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: isCompleta ? et.color : "transparent",
                          border: isCompleta ? "none" : isActual ? `2px solid #0EA5E9` : `1.5px solid rgba(255,255,255,0.18)`,
                          fontSize: "10px", fontWeight: 900,
                          color: isCompleta ? "white" : isActual ? "#38BDF8" : "rgba(255,255,255,0.25)",
                        }}>
                          {isCompleta ? "✓" : globalIdx + 1}
                        </div>
                        {/* Tool name */}
                        <span style={{
                          fontSize: "12px", lineHeight: 1.3,
                          fontWeight: isActual ? 700 : 400,
                          color: isCompleta ? "rgba(255,255,255,0.65)" : isActual ? "#38BDF8" : "rgba(255,255,255,0.38)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                        }}>
                          {h.nombre}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom secondary view icons ── */}
        <div style={{ flexShrink: 0, padding: "12px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px" }}>
          {([
            { id: "ia"        as VistaSecundaria, emoji: "🤖", label: "Análisis IA" },
            { id: "historial" as VistaSecundaria, emoji: "🕐", label: "Historial" },
            { id: "progreso"  as VistaSecundaria, emoji: "📊", label: "Progreso" },
          ]).map((item) => {
            const active = vistaSecundaria === item.id;
            return (
              <button
                key={item.id}
                onClick={() => openSecundaria(item.id)}
                title={item.label}
                style={{
                  flex: 1, padding: "10px 6px", borderRadius: "10px",
                  background: active ? "rgba(14,165,233,0.18)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${active ? "rgba(14,165,233,0.35)" : "rgba(255,255,255,0.08)"}`,
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
              >
                <span style={{ fontSize: "15px" }}>{item.emoji}</span>
                <span style={{ fontSize: "9px", fontWeight: 700, color: active ? "#38BDF8" : "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ═══════════════════ MAIN AREA ════════════════════════════════════════ */}
      <main style={{ flex: 1, minHeight: "100vh", background: "#F5F7FF" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "400px", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "40px" }}>⏳</div>
            <p style={{ fontSize: "15px", color: "#64748B" }}>Cargando programa…</p>
          </div>
        )}

        {!loading && vistaSecundaria === null && herramientaActual && (
          <WizardHerramienta
            key={herramientaIndex}
            clienteId={clienteId}
            herramienta={herramientaActual}
            herramientaIndex={herramientaIndex}
            existingSesion={sesionActual}
            onSaved={cargar}
            onPrev={() => setHerramientaIndex((p) => Math.max(p - 1, 0))}
            onNext={() => setHerramientaIndex((p) => Math.min(p + 1, HERRAMIENTAS_A360.length - 1))}
            isFirst={herramientaIndex === 0}
            isLast={herramientaIndex === HERRAMIENTAS_A360.length - 1}
          />
        )}

        {!loading && vistaSecundaria === "progreso" && (
          <VistaProgreso
            progreso={progreso}
            pctGlobal={pctGlobal}
            totalCompletadas={totalCompletadas}
            sesiones={sesiones}
            diasEnPrograma={diasEnPrograma}
            onSelectTool={(idx) => { setHerramientaIndex(idx); setVistaSecundaria(null); }}
          />
        )}

        {!loading && vistaSecundaria === "ia" && (
          <VistaIA
            clienteId={clienteId}
            sesiones={sesiones}
            clienteNombre={clienteNombre}
            pctGlobal={pctGlobal}
            analisisCount={analisisCount}
            onEdit={setEditing}
            onCargar={cargar}
          />
        )}

        {!loading && vistaSecundaria === "historial" && (
          <VistaHistorial sesiones={sesiones} onEdit={setEditing} />
        )}
      </main>

      {/* Dialog for editing sessions from historial */}
      {editing && (
        <DialogoSesion
          clienteId={clienteId}
          herramientaId={editing.herramienta_id ?? ""}
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); cargar(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Wizard inline tool editor
// ─────────────────────────────────────────────────────────────────────────────
function WizardHerramienta({
  clienteId, herramienta, herramientaIndex,
  existingSesion, onSaved, onPrev, onNext, isFirst, isLast,
}: {
  clienteId: string;
  herramienta: HerramientaA360;
  herramientaIndex: number;
  existingSesion?: SesionCoaching;
  onSaved: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [datos, setDatos]         = useState<any>(existingSesion?.datos ?? {});
  const [completada, setCompletada] = useState(existingSesion?.completada ?? false);
  const [saving, setSaving]       = useState(false);

  const etapaInfo  = ETAPAS_A360.find((e) => e.id === herramienta.etapa);
  const etapaColor = etapaInfo?.color ?? "#0EA5E9";

  const guardar = async (markComplete?: boolean) => {
    setSaving(true);
    try {
      const finalCompletada = markComplete === true ? true : completada;
      if (existingSesion) {
        await actualizarSesion(existingSesion.id, { datos, completada: finalCompletada });
      } else {
        await crearSesion({
          cliente_id: clienteId,
          herramienta_id: herramienta.id,
          etapa: herramienta.etapa,
          datos,
          completada: finalCompletada,
        });
      }
      toast.success(markComplete ? "¡Herramienta completada!" : "Guardado correctamente");
      onSaved();
      if (markComplete && !isLast) onNext();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* ── Gradient header ── */}
      <div style={{ background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 100%)", padding: "32px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 90% 20%, rgba(14,165,233,0.15), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Herramienta {herramientaIndex + 1} de {HERRAMIENTAS_A360.length}
            </span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>·</span>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 10px", borderRadius: "999px", background: `${etapaColor}28`, color: etapaColor, border: `1px solid ${etapaColor}40` }}>
              {herramienta.etapa}
            </span>
            {completada && (
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 10px", borderRadius: "999px", background: "rgba(5,150,105,0.2)", color: "#34D399", border: "1px solid rgba(5,150,105,0.35)" }}>
                ✅ Completada
              </span>
            )}
          </div>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "10px" }}>
            {herramienta.nombre}
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: "520px", margin: "0 0 14px" }}>
            {herramienta.proposito}
          </p>
          <span style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
            ⏱ {herramienta.duracion}
          </span>
        </div>
      </div>

      {/* ── Coach guide (collapsible) ── */}
      <div style={{ background: "#F5F7FF", borderBottom: "1px solid #E0E7FF", padding: "14px 40px" }}>
        <details>
          <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#0C4A6E", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📚</span> Guía del coach — cuándo usar, preguntas y tips
          </summary>
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "4px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Cuándo usar</div>
                <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>{herramienta.cuandoUsar}</p>
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Resultado esperado</div>
                <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>{herramienta.resultadoEsperado}</p>
              </div>
            </div>
            {herramienta.preguntasGuia.length > 0 && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  Preguntas guía ({herramienta.preguntasGuia.length})
                </div>
                <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {herramienta.preguntasGuia.map((p, i) => (
                    <li key={i} style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>
                      <span style={{ color: "#0EA5E9", marginRight: "6px" }}>›</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <details style={{ background: "#EFF6FF", borderRadius: "8px", padding: "10px 14px" }}>
              <summary style={{ cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#0C4A6E" }}>
                Tips del coach ({herramienta.tipsCoach.length})
              </summary>
              <ul style={{ marginTop: "8px", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {herramienta.comoAplicar.map((p, i) => <li key={i} style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.5 }}>{p}</li>)}
                {herramienta.tipsCoach.map((t, i) => <li key={i} style={{ fontSize: "12px", color: "#64748B", fontStyle: "italic" }}>• {t}</li>)}
              </ul>
            </details>
          </div>
        </details>
      </div>

      {/* ── Editor ── */}
      <div style={{ padding: "32px 40px", display: "flex", flexDirection: "column", gap: "20px", background: "white" }}>
        {herramienta.tipo === "radar"     && <RadarEditor datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "creencias" && <CreenciasInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "perfil"    && <ContextoInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "manifiesto"&& <ManifiestoInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "simulador" && <SimuladorInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "reto"      && <RetoInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "espejo"    && <EspejoEditor datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "pulso"     && <PulsoEditor datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "biblioteca"&& <BibliotecaPreguntasInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "plan"      && <PlanContinuidadInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "reporte"   && <ReporteTransformacionInstrumentado datos={datos} setDatos={setDatos} />}
        {!["radar","creencias","perfil","manifiesto","simulador","reto","espejo","pulso","biblioteca","plan","reporte"].includes(herramienta.tipo) && (
          <NotasEditor datos={datos} setDatos={setDatos} />
        )}

        {/* Marcar completada */}
        <div style={{ background: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "10px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            type="checkbox"
            id="completada-wizard"
            checked={completada}
            onChange={(e) => setCompletada(e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <label htmlFor="completada-wizard" style={{ fontSize: "14px", fontWeight: 600, color: "#0C4A6E", cursor: "pointer" }}>
            Marcar como completada — herramienta documentada y lista
          </label>
        </div>

        {/* Análisis IA */}
        {existingSesion ? (
          <AnalisisIACoaching
            sesionId={existingSesion.id}
            herramientaNombre={herramienta.nombre}
            herramientaProposito={herramienta.proposito}
            etapa={herramienta.etapa}
            datosSesion={datos}
            analisisActual={(datos as Record<string, unknown>)?.analisis_ia as string ?? null}
            analisisFecha={(datos as Record<string, unknown>)?.analisis_ia_fecha as string ?? null}
            onAnalisisGenerado={(t: string, f: string) => setDatos({ ...datos, analisis_ia: t, analisis_ia_fecha: f })}
          />
        ) : (
          <div style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>🤖</span>
            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Guarda el registro primero para generar el <strong>análisis IA</strong> de esta herramienta.
            </p>
          </div>
        )}
      </div>

      {/* ── Footer navigation ── */}
      <div style={{ borderTop: "2px solid #E0E7FF", padding: "20px 40px", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", position: "sticky", bottom: 0 }}>
        <button
          onClick={onPrev}
          disabled={isFirst}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "12px 20px", borderRadius: "10px",
            border: "1.5px solid #E0E7FF",
            background: isFirst ? "#F8FAFC" : "white",
            color: isFirst ? "#CBD5E1" : "#374151",
            fontSize: "14px", fontWeight: 600,
            cursor: isFirst ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          ← Anterior
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => guardar()}
            disabled={saving}
            style={{
              padding: "12px 20px", borderRadius: "10px",
              border: "1.5px solid #E0E7FF", background: "white",
              color: "#374151", fontSize: "14px", fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Guardando…" : "💾 Guardar"}
          </button>
          <button
            onClick={() => guardar(true)}
            disabled={saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "10px",
              background: saving ? "#94A3B8" : "linear-gradient(135deg, #0EA5E9, #6366F1)",
              color: "white", fontSize: "14px", fontWeight: 700,
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              boxShadow: saving ? "none" : "0 4px 14px rgba(14,165,233,0.3)",
              transition: "all 0.15s",
            }}
          >
            {saving ? "Guardando…" : isLast ? "✅ Completar programa" : "Completar y continuar →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vista: Progreso
// ─────────────────────────────────────────────────────────────────────────────
function VistaProgreso({ progreso, pctGlobal, totalCompletadas, sesiones, diasEnPrograma, onSelectTool }: {
  progreso: ReturnType<typeof progresoPorEtapa>;
  pctGlobal: number;
  totalCompletadas: number;
  sesiones: SesionCoaching[];
  diasEnPrograma: number;
  onSelectTool: (idx: number) => void;
}) {
  const SECTION_LABEL: React.CSSProperties = { fontSize: "11px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" };

  return (
    <div>
      {/* KPIs */}
      <div style={{ background: "white", padding: "40px" }}>
        <div style={SECTION_LABEL}><span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />Dashboard de progreso</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "36px" }}>
          {[
            { val: `${pctGlobal}%`, lbl: "Avance total", sub: `${totalCompletadas} herramientas` },
            { val: sesiones.length, lbl: "Registros totales", sub: `${sesiones.filter(s => !!(s.datos as Record<string,unknown>)?.analisis_ia).length} con análisis IA` },
            { val: etapaActual(sesiones), lbl: "Etapa en curso", sub: "" },
            { val: diasEnPrograma > 0 ? `${diasEnPrograma}d` : "—", lbl: "Días activo", sub: diasEnPrograma > 0 ? "desde primer registro" : "sin registros" },
          ].map((s, i) => (
            <div key={i} style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", borderRadius: "16px", padding: "22px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(14,165,233,0.2), transparent)", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: "32px", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>{s.val}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "5px" }}>{s.lbl}</div>
                {s.sub && <div style={{ fontSize: "11px", color: "#38BDF8", marginTop: "3px", fontWeight: 600 }}>{s.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Progress by stage */}
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0C4A6E", marginBottom: "16px", letterSpacing: "-0.01em" }}>Progreso por etapa</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {progreso.map((p, pi) => (
            <div key={p.etapa.id} style={{ background: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "14px", padding: "18px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "white", background: p.etapa.color, width: "26px", height: "26px", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    {(["I","II","III","IV"] as const)[pi] ?? pi + 1}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E" }}>{p.etapa.id}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "22px", fontWeight: 900, color: p.pct === 100 ? "#059669" : "#0C4A6E" }}>{p.pct}%</span>
                  <div style={{ fontSize: "11px", color: "#94A3B8" }}>{p.completadas}/{p.total}</div>
                </div>
              </div>
              <div style={{ height: "6px", background: "#E0E7FF", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: "999px", background: p.etapa.color, width: `${p.pct}%`, transition: "width 0.5s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual map */}
      <div style={{ padding: "40px", background: "#F5F7FF" }}>
        <div style={SECTION_LABEL}><span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />Mapa visual del programa</div>
        <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px" }}>
          Haz clic en cualquier herramienta para ir directamente a ella. Verde = completada · Azul = próxima recomendada.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {ETAPAS_A360.map((et, etIdx) => {
            const herrsDeEtapa = HERRAMIENTAS_A360.filter((h) => h.etapa === et.id);
            const roman = (["I","II","III","IV"] as const)[etIdx] ?? String(etIdx + 1);
            return (
              <div key={et.id} style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "14px", padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "white", background: et.color, padding: "3px 8px", borderRadius: "5px" }}>{roman}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E" }}>{et.id}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0" }}>
                  {herrsDeEtapa.map((h, hi) => {
                    const globalIdx = HERRAMIENTAS_A360.findIndex((x) => x.id === h.id);
                    const ses = sesiones.filter((s) => s.herramienta_id === h.id);
                    const completa = ses.some((s) => s.completada);
                    const esProxima = !completa && hi === herrsDeEtapa.findIndex((ph) => !sesiones.some((s) => s.herramienta_id === ph.id && s.completada));
                    return (
                      <div key={h.id} style={{ display: "flex", alignItems: "center" }}>
                        <div
                          title={h.nombre}
                          onClick={() => onSelectTool(globalIdx)}
                          style={{ width: "44px", height: "44px", borderRadius: "50%", background: completa ? et.color : esProxima ? "linear-gradient(135deg, #0EA5E9, #6366F1)" : "white", color: completa || esProxima ? "white" : "#94A3B8", border: `2px solid ${completa ? et.color : esProxima ? "transparent" : "#E0E7FF"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, cursor: "pointer", boxShadow: esProxima ? "0 4px 12px rgba(14,165,233,0.3)" : "0 1px 3px rgba(0,0,0,0.06)", transition: "transform 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.transform = "scale(1.12)"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.transform = "none"}
                        >
                          {completa ? <Check style={{ width: "16px", height: "16px" }} /> : hi + 1}
                        </div>
                        {hi < herrsDeEtapa.length - 1 && (
                          <div style={{ width: "16px", height: "2px", background: completa ? et.color : "#E0E7FF" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post-program */}
      <div style={{ padding: "40px", background: "white" }}>
        <div style={SECTION_LABEL}><span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />Post-programa</div>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0C4A6E", marginBottom: "20px", letterSpacing: "-0.01em" }}>Plan de continuidad — 90 días</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {PLAN_CONTINUIDAD_FASES.map((f) => (
            <div key={f.id} style={{ background: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "10px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>{f.label}</div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0C4A6E", marginBottom: "8px" }}>{f.titulo}</div>
              <div style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vista: Análisis IA
// ─────────────────────────────────────────────────────────────────────────────
function VistaIA({ clienteId, sesiones, clienteNombre, pctGlobal, analisisCount, onEdit, onCargar }: {
  clienteId: string;
  sesiones: SesionCoaching[];
  clienteNombre: string;
  pctGlobal: number;
  analisisCount: number;
  onEdit: (s: SesionCoaching) => void;
  onCargar: () => void;
}) {
  if (sesiones.length === 0) {
    return (
      <div style={{ padding: "64px 40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE", borderRadius: "20px", padding: "56px 48px", textAlign: "center", maxWidth: "440px" }}>
          <div style={{ fontSize: "52px", marginBottom: "20px" }}>🤖</div>
          <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0C4A6E", marginBottom: "12px" }}>Aún no hay datos para analizar</h3>
          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.7 }}>
            Registra y guarda tu primera herramienta de coaching para que la IA pueda generar análisis de patrones.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A, #312E81)", padding: "40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(14,165,233,0.15), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "580px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
            Inteligencia artificial · Síntesis del programa
          </div>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.02em", marginBottom: "10px" }}>
            Análisis profundo con{" "}
            <span style={{ background: "linear-gradient(135deg, #38BDF8, #A5B4FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Claude AI</span>
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
            {clienteNombre} · {sesiones.length} registros analizados · {analisisCount} análisis individuales · {pctGlobal}% del programa
          </p>
        </div>
      </div>

      {/* Individual analyses */}
      {analisisCount > 0 && (
        <div style={{ padding: "40px", background: "#F5F7FF" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>Análisis por sesión</div>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0C4A6E", marginBottom: "20px" }}>
            {analisisCount} sesión{analisisCount !== 1 ? "es" : ""} con análisis IA disponible
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sesiones.filter((s) => !!(s.datos as Record<string, unknown>)?.analisis_ia).map((s) => {
              const h = s.herramienta_id ? getHerramienta(s.herramienta_id) : null;
              const etapaInfo = ETAPAS_A360.find((e) => e.id === s.etapa);
              const eColor = etapaInfo?.color ?? "#0EA5E9";
              const texto = String((s.datos as Record<string, unknown>).analisis_ia ?? "");
              return (
                <div
                  key={s.id}
                  onClick={() => onEdit(s)}
                  style={{ background: "white", border: "1px solid #E0E7FF", borderLeft: `4px solid ${eColor}`, borderRadius: "0 12px 12px 0", padding: "18px 22px", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateX(4px)"; el.style.boxShadow = `0 4px 14px ${eColor}15`; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E" }}>{h?.nombre ?? "Sesión"}</span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                      {etapaInfo && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: `${eColor}15`, color: eColor }}>{s.etapa}</span>}
                      <span style={{ fontSize: "11px", color: "#94A3B8" }}>{new Date(s.created_at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>
                    {texto.slice(0, 200).trim()}{texto.length > 200 ? "…" : ""}
                  </p>
                  <div style={{ fontSize: "12px", color: eColor, fontWeight: 600, marginTop: "8px" }}>Ver análisis completo →</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Síntesis global */}
      <div style={{ padding: "40px", background: "white" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>Síntesis ejecutiva</div>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0C4A6E", marginBottom: "20px" }}>Análisis integral del programa completo</h3>
        <SintesisProgramaIA clienteId={clienteId} />
      </div>

      {/* Export */}
      <div style={{ padding: "24px 40px", background: "#F5F7FF" }}>
        <CoachingExportImport
          clienteId={clienteId}
          clienteNombre={clienteId}
          sesiones={sesiones}
          onImported={onCargar}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vista: Historial
// ─────────────────────────────────────────────────────────────────────────────
function VistaHistorial({ sesiones, onEdit }: {
  sesiones: SesionCoaching[];
  onEdit: (s: SesionCoaching) => void;
}) {
  const [filtroEtapa, setFiltroEtapa] = useState("");

  const etapasDisponibles = [...new Set(sesiones.map((s) => s.etapa).filter((e): e is string => !!e))];
  const sesionesFiltradas = filtroEtapa ? sesiones.filter((s) => s.etapa === filtroEtapa) : sesiones;

  return (
    <div style={{ padding: "40px", background: "white", minHeight: "100%" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>Historial</div>
      <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em", marginBottom: "24px" }}>
        {sesiones.length} registro{sesiones.length !== 1 ? "s" : ""} de sesión
      </h2>

      {/* Filters */}
      {etapasDisponibles.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
          <button
            onClick={() => setFiltroEtapa("")}
            style={{ fontSize: "12px", padding: "6px 16px", borderRadius: "999px", border: `1.5px solid ${filtroEtapa === "" ? "#0C4A6E" : "#E0E7FF"}`, background: filtroEtapa === "" ? "#0C4A6E" : "white", color: filtroEtapa === "" ? "white" : "#64748B", cursor: "pointer", fontWeight: 600 }}
          >
            Todas
          </button>
          {etapasDisponibles.map((e) => {
            const et = ETAPAS_A360.find((x) => x.id === e);
            const active = filtroEtapa === e;
            return (
              <button
                key={e}
                onClick={() => setFiltroEtapa(active ? "" : e)}
                style={{ fontSize: "12px", padding: "6px 16px", borderRadius: "999px", border: `1.5px solid ${active ? et?.color ?? "#0EA5E9" : "#E0E7FF"}`, background: active ? (et?.color ?? "#0EA5E9") : "white", color: active ? "white" : "#64748B", cursor: "pointer", fontWeight: 600 }}
              >
                {e}
              </button>
            );
          })}
        </div>
      )}

      {sesionesFiltradas.length === 0 ? (
        <div style={{ background: "#F5F7FF", borderRadius: "14px", padding: "40px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: "#94A3B8", fontStyle: "italic" }}>Sin registros para esta etapa.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sesionesFiltradas.map((s, idx) => {
            const h = s.herramienta_id ? getHerramienta(s.herramienta_id) : null;
            const etapaInfo = ETAPAS_A360.find((e) => e.id === s.etapa);
            const eColor = etapaInfo?.color ?? "#0EA5E9";
            const hasIA = !!(s.datos as Record<string, unknown>)?.analisis_ia;
            const notas = String((s.datos as Record<string, unknown>)?.notas ?? "").trim();

            return (
              <div
                key={s.id}
                onClick={() => onEdit(s)}
                style={{ background: s.completada ? "#F0FDF4" : "white", border: `1px solid ${s.completada ? "#BBF7D0" : "#E0E7FF"}`, borderRadius: "14px", padding: "20px 24px", display: "flex", gap: "16px", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = `0 8px 24px ${eColor}12`; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; }}
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 900, ...(s.completada ? { background: eColor, color: "white" } : { background: `${eColor}15`, color: eColor, border: `1.5px solid ${eColor}30` }) }}>
                  {s.completada ? <Check style={{ width: "16px", height: "16px" }} /> : sesionesFiltradas.length - idx}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", marginBottom: "4px" }}>{h?.nombre ?? "Sesión"}</div>
                  <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "#94A3B8", flexWrap: "wrap" }}>
                    <span>📅 {new Date(s.created_at).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</span>
                    {etapaInfo && <span style={{ color: eColor, fontWeight: 700 }}>{s.etapa}</span>}
                    {hasIA && <span style={{ color: "#0EA5E9", fontWeight: 600 }}>🤖 Con análisis IA</span>}
                    {s.completada && <span style={{ color: "#059669", fontWeight: 600 }}>✓ Completada</span>}
                  </div>
                  {notas && (
                    <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.5, fontStyle: "italic", marginTop: "6px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                      "{notas.slice(0, 140)}{notas.length > 140 ? "…" : ""}"
                    </p>
                  )}
                </div>
                <ChevronRight style={{ width: "16px", height: "16px", color: "#94A3B8", flexShrink: 0, alignSelf: "center" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialog for editing sessions from historial
// ─────────────────────────────────────────────────────────────────────────────
function DialogoSesion({
  clienteId, herramientaId, existing, onClose, onSaved,
}: {
  clienteId: string;
  herramientaId: string;
  existing?: SesionCoaching;
  onClose: () => void;
  onSaved: () => void;
}) {
  const h = getHerramienta(herramientaId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [datos, setDatos]           = useState<any>(existing?.datos ?? {});
  const [completada, setCompletada] = useState(existing?.completada ?? false);
  const [saving, setSaving]         = useState(false);

  if (!h) return null;

  const guardar = async () => {
    setSaving(true);
    try {
      if (existing) {
        await actualizarSesion(existing.id, { datos, completada });
        toast.success("Sesión actualizada");
      } else {
        await crearSesion({ cliente_id: clienteId, herramienta_id: h.id, etapa: h.etapa, datos, completada });
        toast.success("Sesión registrada");
      }
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!existing || !confirm("¿Eliminar esta sesión?")) return;
    await eliminarSesion(existing.id);
    toast.success("Sesión eliminada");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[92vw] max-w-[1100px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", padding: "24px 28px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 90% 20%, rgba(14,165,233,0.15), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>{h.etapa}</div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "white", marginBottom: "6px" }}>{h.nombre}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{h.proposito}</div>
          </div>
        </div>

        {/* Coach guide */}
        <div style={{ background: "#F5F7FF", borderBottom: "1px solid #E0E7FF", padding: "12px 28px" }}>
          <details>
            <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#0C4A6E" }}>📚 Guía del coach</summary>
            <div style={{ marginTop: "12px", paddingBottom: "4px" }}>
              {h.preguntasGuia.length > 0 && (
                <ul style={{ paddingLeft: "16px" }}>
                  {h.preguntasGuia.map((p, i) => <li key={i} style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "4px" }}><span style={{ color: "#0EA5E9", marginRight: "6px" }}>›</span>{p}</li>)}
                </ul>
              )}
            </div>
          </details>
        </div>

        {/* Editor */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {h.tipo === "radar"      && <RadarEditor datos={datos} setDatos={setDatos} />}
          {h.tipo === "creencias"  && <CreenciasInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "perfil"     && <ContextoInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "manifiesto" && <ManifiestoInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "simulador"  && <SimuladorInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "reto"       && <RetoInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "espejo"     && <EspejoEditor datos={datos} setDatos={setDatos} />}
          {h.tipo === "pulso"      && <PulsoEditor datos={datos} setDatos={setDatos} />}
          {h.tipo === "biblioteca" && <BibliotecaPreguntasInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "plan"       && <PlanContinuidadInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "reporte"    && <ReporteTransformacionInstrumentado datos={datos} setDatos={setDatos} />}
          {!["radar","creencias","perfil","manifiesto","simulador","reto","espejo","pulso","biblioteca","plan","reporte"].includes(h.tipo) && (
            <NotasEditor datos={datos} setDatos={setDatos} />
          )}

          <div style={{ background: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
            <input type="checkbox" id="completada-dialog" checked={completada} onChange={(e) => setCompletada(e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
            <label htmlFor="completada-dialog" style={{ fontSize: "14px", fontWeight: 600, color: "#0C4A6E", cursor: "pointer" }}>Marcar como completada</label>
          </div>

          {existing && (
            <AnalisisIACoaching
              sesionId={existing.id}
              herramientaNombre={h.nombre}
              herramientaProposito={h.proposito}
              etapa={h.etapa}
              datosSesion={datos}
              analisisActual={(datos as Record<string, unknown>)?.analisis_ia as string ?? null}
              analisisFecha={(datos as Record<string, unknown>)?.analisis_ia_fecha as string ?? null}
              onAnalisisGenerado={(t: string, f: string) => setDatos({ ...datos, analisis_ia: t, analisis_ia_fecha: f })}
            />
          )}
        </div>

        <DialogFooter className="gap-2 px-7 pb-7 pt-4 border-t border-[#E0E7FF]">
          {existing && (
            <Button variant="ghost" size="sm" onClick={eliminar} className="text-red-600 mr-auto">
              <Trash2 className="w-3 h-3 mr-1" /> Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={saving} style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)", color: "white", border: "none" }}>
            {saving ? "Guardando…" : "💾 Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notas editor (fallback for tools without a specific editor)
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NotasEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE", borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "12px" }}>
        <span style={{ fontSize: "24px", flexShrink: 0 }}>✨</span>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E", marginBottom: "4px" }}>Consejo para documentar mejor</div>
          <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>
            Los mejores registros responden: ¿Qué descubrí hoy? ¿Qué va a cambiar en mi forma de liderar? ¿Qué acuerdo concreto se tomó? Escribe en lenguaje del líder — este registro será analizado por IA.
          </div>
        </div>
      </div>
      <div>
        <span style={AURORA_LABEL}>📝 Contenido de la sesión</span>
        <textarea
          style={{ ...AURORA_TEXTAREA, minHeight: "200px" }}
          value={datos.notas ?? ""}
          onChange={(e) => setDatos({ ...datos, notas: e.target.value })}
          onFocus={onAuroraFocus}
          onBlur={onAuroraBlur}
          placeholder="Registra los temas trabajados, los insights del líder, los acuerdos tomados y las observaciones del coach…"
        />
      </div>
    </div>
  );
}
