import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ETAPAS_A360, HERRAMIENTAS_A360,
  type HerramientaA360,
} from "@/lib/coaching-catalogo";
import {
  listarSesionesCliente, crearSesion, actualizarSesion,
  type SesionCoaching,
} from "@/lib/coaching-helpers";
import { AnalisisIACoaching } from "@/components/coaching/AnalisisIACoaching";
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

const AURORA_LABEL: React.CSSProperties = {
  fontSize: "13px", fontWeight: 700, color: "#374151",
  marginBottom: "8px", display: "block",
};
const AURORA_TEXTAREA: React.CSSProperties = {
  width: "100%", padding: "14px 18px", border: "1.5px solid #E0E7FF",
  borderRadius: "10px", fontSize: "15px", fontFamily: "inherit",
  color: "#1E293B", background: "white", outline: "none",
  lineHeight: 1.8, minHeight: "140px", resize: "vertical", transition: "all 0.15s",
};
const onAuroraFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "#0EA5E9";
  e.target.style.boxShadow = "0 0 0 4px rgba(14,165,233,0.1)";
};
const onAuroraBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "#E0E7FF";
  e.target.style.boxShadow = "none";
};

// ── Main component ──────────────────────────────────────────────────────────────
function CoachingClienteWorkspace() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/coaching" });

  const [sesiones, setSesiones]               = useState<SesionCoaching[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [clienteNombre, setClienteNombre]     = useState("Cliente");
  const [herramientaIndex, setHerramientaIndex] = useState(0);
  const [visible, setVisible]                 = useState(true);
  const initialSetDone                        = useRef(false);
  const mainRef                               = useRef<HTMLDivElement>(null);

  const cargar = async () => {
    setLoading(true);
    try { setSesiones(await listarSesionesCliente(clienteId)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    cargar();
    supabase
      .from("clientes")
      .select("nombre_empresa")
      .eq("id", clienteId)
      .maybeSingle()
      .then(({ data }) => { if (data?.nombre_empresa) setClienteNombre(data.nombre_empresa); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  useEffect(() => {
    if (!initialSetDone.current && sesiones.length > 0) {
      initialSetDone.current = true;
      const first = HERRAMIENTAS_A360.findIndex(
        (h) => !sesiones.some((s) => s.herramienta_id === h.id && s.completada)
      );
      const idx = first >= 0 ? first : HERRAMIENTAS_A360.length - 1;
      setHerramientaIndex(idx);
      toast(`Bienvenido de vuelta · Continúas en ${HERRAMIENTAS_A360[idx].nombre}`);
    }
  }, [sesiones]);

  const completadasSet = new Set(
    sesiones.filter((s) => s.completada).map((s) => s.herramienta_id)
  );

  const navegarA = (newIdx: number) => {
    setVisible(false);
    setTimeout(() => {
      setHerramientaIndex(newIdx);
      setVisible(true);
      if (mainRef.current) mainRef.current.scrollTop = 0;
    }, 220);
  };

  const herramientaActual = HERRAMIENTAS_A360[herramientaIndex];
  const sesionActual = herramientaActual
    ? sesiones.find((s) => s.herramienta_id === herramientaActual.id)
    : undefined;

  return (
    <>
      <style>{`
        @keyframes coachingPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.4); }
        }
      `}</style>
      <div
        className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8"
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        {/* ═══ STICKY HEADER ═══════════════════════════════════════════════════ */}
        <header style={{
          position: "sticky", top: 0, zIndex: 20, flexShrink: 0,
          background: "#0C4A6E",
          height: "56px", padding: "0 28px",
          display: "grid", gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center", gap: "16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          {/* Left: breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <Link
              to="/app/coaching"
              style={{
                fontSize: "13px", fontWeight: 600,
                color: "rgba(255,255,255,0.55)", textDecoration: "none",
                whiteSpace: "nowrap", transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "white"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)"; }}
            >
              ← Mis clientes
            </Link>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", margin: "0 6px" }}>·</span>
            <span style={{
              fontSize: "13px", fontWeight: 700, color: "white",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px",
            }}>
              {clienteNombre}
            </span>
          </div>

          {/* Center: 12 animated progress dots */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {HERRAMIENTAS_A360.map((h, i) => {
              const isCompleta = completadasSet.has(h.id);
              const isActual   = i === herramientaIndex;
              return (
                <button
                  key={h.id}
                  onClick={() => navegarA(i)}
                  title={`${i + 1}. ${h.nombre}`}
                  style={{
                    width: isActual ? "10px" : "8px",
                    height: isActual ? "10px" : "8px",
                    borderRadius: "50%", border: "none", padding: 0,
                    cursor: "pointer", flexShrink: 0,
                    background: isCompleta
                      ? "#38BDF8"
                      : isActual
                      ? "white"
                      : "rgba(255,255,255,0.22)",
                    animation: isActual ? "coachingPulse 1.8s ease-in-out infinite" : "none",
                    transition: "background 0.2s, width 0.2s, height 0.2s",
                  }}
                />
              );
            })}
          </div>

          {/* Right: X / 12 counter */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
              {herramientaIndex + 1}
              <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.35)" }}>
                {" "}/ {HERRAMIENTAS_A360.length}
              </span>
            </span>
          </div>
        </header>

        {/* ═══ MAIN SCROLLABLE AREA ════════════════════════════════════════════ */}
        <main
          ref={mainRef}
          style={{ flex: 1, overflowY: "auto", background: "#F5F7FF" }}
        >
          {loading ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: "60vh", flexDirection: "column", gap: "16px",
            }}>
              <div style={{ fontSize: "40px" }}>⏳</div>
              <p style={{ fontSize: "15px", color: "#64748B" }}>Cargando programa…</p>
            </div>
          ) : herramientaActual ? (
            <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.2s ease" }}>
              <WizardHerramienta
                key={herramientaIndex}
                clienteId={clienteId}
                herramienta={herramientaActual}
                herramientaIndex={herramientaIndex}
                existingSesion={sesionActual}
                onSaved={cargar}
                onPrev={() => navegarA(Math.max(herramientaIndex - 1, 0))}
                onNext={() => navegarA(Math.min(herramientaIndex + 1, HERRAMIENTAS_A360.length - 1))}
                isFirst={herramientaIndex === 0}
                isLast={herramientaIndex === HERRAMIENTAS_A360.length - 1}
              />
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Full-screen tool editor
// ────────────────────────────────────────────────────────────────────────────────
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
  const [datos, setDatos]           = useState<any>(existingSesion?.datos ?? {});
  const [completada, setCompletada] = useState(existingSesion?.completada ?? false);
  const [saving, setSaving]         = useState(false);

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

      {/* ── Eyebrow + Title ── */}
      <div style={{ padding: "40px 40px 28px", background: "white", borderBottom: "1px solid #E0E7FF" }}>
        <div style={{
          fontSize: "12px", fontWeight: 700, color: etapaColor,
          textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px",
        }}>
          Herramienta {herramientaIndex + 1} de {HERRAMIENTAS_A360.length} · {herramienta.etapa}
        </div>
        <h2 style={{
          fontSize: "28px", fontWeight: 700, color: "#0C4A6E",
          letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: "10px", margin: "0 0 10px",
        }}>
          {herramienta.nombre}
        </h2>
        <p style={{
          fontSize: "15px", color: "#64748B", lineHeight: 1.7,
          maxWidth: "640px", margin: "0 0 14px",
        }}>
          {herramienta.proposito}
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "11px", fontWeight: 700, padding: "3px 12px",
            borderRadius: "999px", background: `${etapaColor}15`,
            color: etapaColor, border: `1px solid ${etapaColor}35`,
          }}>
            {herramienta.etapa}
          </span>
          <span style={{
            fontSize: "11px", fontWeight: 600, padding: "3px 12px",
            borderRadius: "999px", background: "#F1F5F9",
            color: "#64748B", border: "1px solid #E2E8F0",
          }}>
            ⏱ {herramienta.duracion}
          </span>
          {completada && (
            <span style={{
              fontSize: "11px", fontWeight: 700, padding: "3px 12px",
              borderRadius: "999px", background: "rgba(5,150,105,0.1)",
              color: "#059669", border: "1px solid rgba(5,150,105,0.25)",
            }}>
              ✅ Completada
            </span>
          )}
        </div>
      </div>

      {/* ── Coach guide (collapsible) ── */}
      <div style={{ background: "#F8FAFF", borderBottom: "1px solid #E0E7FF", padding: "14px 40px" }}>
        <details>
          <summary style={{
            cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#0C4A6E",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
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
        {herramienta.tipo === "radar"      && <RadarEditor datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "creencias"  && <CreenciasInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "perfil"     && <ContextoInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "manifiesto" && <ManifiestoInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "simulador"  && <SimuladorInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "reto"       && <RetoInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "espejo"     && <EspejoEditor datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "pulso"      && <PulsoEditor datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "biblioteca" && <BibliotecaPreguntasInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "plan"       && <PlanContinuidadInstrumentado datos={datos} setDatos={setDatos} />}
        {herramienta.tipo === "reporte"    && <ReporteTransformacionInstrumentado datos={datos} setDatos={setDatos} />}
        {!["radar","creencias","perfil","manifiesto","simulador","reto","espejo","pulso","biblioteca","plan","reporte"].includes(herramienta.tipo) && (
          <NotasEditor datos={datos} setDatos={setDatos} />
        )}

        {/* Marcar completada */}
        <div style={{
          background: "#F5F7FF", border: "1px solid #E0E7FF",
          borderRadius: "10px", padding: "16px 20px",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
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
          <div style={{
            background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)",
            border: "1.5px solid #C7D2FE", borderRadius: "10px",
            padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px",
          }}>
            <span style={{ fontSize: "20px" }}>🤖</span>
            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Guarda el registro primero para generar el <strong>análisis IA</strong> de esta herramienta.
            </p>
          </div>
        )}
      </div>

      {/* ── Sticky footer navigation ── */}
      <div style={{
        position: "sticky", bottom: 0,
        background: "white", borderTop: "1.5px solid #E0E7FF",
        padding: "16px 40px",
        display: "grid", gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center", gap: "16px",
      }}>
        {/* Left: ← Anterior */}
        <div>
          <button
            onClick={onPrev}
            disabled={isFirst}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", borderRadius: "10px",
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
        </div>

        {/* Center: tool name */}
        <span style={{
          fontSize: "13px", color: "#94A3B8", fontWeight: 500,
          textAlign: "center", whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis", maxWidth: "280px",
        }}>
          {herramienta.nombre}
        </span>

        {/* Right: save + complete */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => guardar()}
            disabled={saving}
            style={{
              padding: "10px 18px", borderRadius: "10px",
              border: "1.5px solid #E0E7FF", background: "white",
              color: "#374151", fontSize: "14px", fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1, transition: "all 0.15s",
            }}
          >
            {saving ? "Guardando…" : "💾 Guardar"}
          </button>
          <button
            onClick={() => guardar(true)}
            disabled={saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 22px", borderRadius: "10px",
              background: saving ? "#94A3B8" : "#0C4A6E",
              color: "white", fontSize: "14px", fontWeight: 700,
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: saving ? "none" : "0 4px 12px rgba(12,74,110,0.3)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#0D5F8F"; }}
            onMouseLeave={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#0C4A6E"; }}
          >
            {saving ? "Guardando…" : isLast ? "Ver resumen del programa ✓" : "Completar y continuar →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Notas editor (fallback for tools without a specific editor)
// ────────────────────────────────────────────────────────────────────────────────
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
