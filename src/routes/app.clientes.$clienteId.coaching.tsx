import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ETAPAS_A360, HERRAMIENTAS_A360, RADAR_DIMENSIONES, PLAN_CONTINUIDAD_FASES,
  getHerramienta, type EtapaA360,
} from "@/lib/coaching-catalogo";
import {
  listarSesionesCliente, crearSesion, actualizarSesion, eliminarSesion,
  progresoPorEtapa, etapaActual, type SesionCoaching,
} from "@/lib/coaching-helpers";
import { Plus, Check, Trash2, Sparkles, FileText, Clock, ChevronRight } from "lucide-react";
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
import { useAuth } from "@/lib/auth-context";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/app/clientes/$clienteId/coaching")({
  component: CoachingClienteWorkspace,
});

// ── Tipos y constantes de navegación ─────────────────────────────────────────
type CoachingTab = "resumen" | "herramientas" | "progreso" | "ia" | "historial";

const TABS: { id: CoachingTab; label: string }[] = [
  { id: "resumen",      label: "Resumen del programa" },
  { id: "herramientas", label: "Metodología y herramientas" },
  { id: "progreso",     label: "Progreso" },
  { id: "ia",           label: "Análisis IA" },
  { id: "historial",    label: "Historial" },
];

const TRANSFORM_ITEMS = [
  { icon: "😰", before: "Apagando incendios todo el día", after: "Líder que diseña el sistema y delega con confianza" },
  { icon: "🌫️", before: "Decisiones bajo presión sin claridad", after: "Marco de decisión claro y criterios definidos" },
  { icon: "🔄", before: "Reuniones sin resultados concretos", after: "Compromisos medibles que se cumplen sesión a sesión" },
];

const METODOLOGIA_STEPS = [
  { num: "01", icon: "🎯", title: "Enfoque del tema", desc: "Cada herramienta aborda un aspecto estratégico específico del liderazgo con materiales preparados y contexto profesional." },
  { num: "02", icon: "💬", title: "Diálogo profundo", desc: "Sesiones de conversación estructurada con preguntas poderosas diseñadas para revelar insights que el día a día no permite ver." },
  { num: "03", icon: "🤖", title: "Análisis con IA", desc: "Claude analiza los datos de la sesión, genera un resumen ejecutivo e identifica patrones y áreas de atención prioritaria." },
  { num: "04", icon: "📋", title: "Plan de acción", desc: "Cada sesión cierra con compromisos concretos, medibles y con fecha. Se revisan en el siguiente encuentro sin excepción." },
];

// ── Colores y gradientes por etapa ────────────────────────────────────────────
const ETAPA_HERO_GRADS: Record<string, string> = {
  "#7F77DD": "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)",
  "#1D9E75": "linear-gradient(135deg, #064E3B 0%, #065F46 50%, #059669 100%)",
  "#BA7517": "linear-gradient(135deg, #78350F 0%, #92400E 50%, #B45309 100%)",
  "#D85A30": "linear-gradient(135deg, #7C2D12 0%, #9A3412 50%, #C2410C 100%)",
};
const ETAPA_ACTIVE_GRADS: Record<string, string> = {
  "#7F77DD": "linear-gradient(135deg, #7F77DD, #A855F7)",
  "#1D9E75": "linear-gradient(135deg, #1D9E75, #0EA5E9)",
  "#BA7517": "linear-gradient(135deg, #BA7517, #EF4444)",
  "#D85A30": "linear-gradient(135deg, #D85A30, #F59E0B)",
};
const etapaHeroGrad = (color: string) => ETAPA_HERO_GRADS[color] ?? "linear-gradient(135deg, #0C4A6E, #1E3A8A, #312E81)";
const etapaActiveGrad = (color: string) => ETAPA_ACTIVE_GRADS[color] ?? "linear-gradient(135deg, #0EA5E9, #6366F1)";

// ── Estilos inline reutilizables ──────────────────────────────────────────────
const BTN_PRIMARY: React.CSSProperties = {
  padding: "14px 28px", borderRadius: "10px",
  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
  color: "white", fontSize: "14px", fontWeight: 700,
  border: "none", cursor: "pointer",
  boxShadow: "0 4px 20px rgba(14,165,233,0.35)",
  transition: "all 0.2s",
};
const BTN_GHOST: React.CSSProperties = {
  padding: "14px 24px", borderRadius: "10px",
  background: "rgba(255,255,255,0.1)", color: "white",
  fontSize: "14px", fontWeight: 600,
  border: "1.5px solid rgba(255,255,255,0.3)", cursor: "pointer",
};
const GRADIENT_TEXT: React.CSSProperties = {
  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};
const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#0EA5E9",
  textTransform: "uppercase", letterSpacing: "0.15em",
  display: "flex", alignItems: "center", gap: "10px",
  marginBottom: "14px",
};

// ── Gate premium ──────────────────────────────────────────────────────────────
function CoachingPremiumGate() {
  return (
    <div className="px-6 lg:px-16 py-20 flex flex-col items-center text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE" }}>
        <Lock className="w-7 h-7" style={{ color: "#6366F1" }} />
      </div>
      <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.01em", marginBottom: "12px" }}>
        Análisis IA del programa
      </h2>
      <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.75, maxWidth: "480px", marginBottom: "0" }}>
        Desbloquea el análisis de patrones de liderazgo, síntesis ejecutiva del programa y el análisis de IA por sesión con el acompañamiento Advisory Premium de A360SGP.
      </p>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
function CoachingClienteWorkspace() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/coaching" });
  const { role } = useAuth();
  const esCliente = role === "cliente" || role === "participante";
  const [accesoInterpretacion, setAccesoInterpretacion] = useState(false);
  const [sesiones, setSesiones] = useState<SesionCoaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNueva, setOpenNueva] = useState<{ herramientaId: string } | null>(null);
  const [editing, setEditing] = useState<SesionCoaching | null>(null);
  const [clienteNombre, setClienteNombre] = useState<string>("Cliente");
  const [activeTab, setActiveTab] = useState<CoachingTab>("resumen");
  const [filtroEtapa, setFiltroEtapa] = useState<string>("");

  const cargar = async () => {
    setLoading(true);
    try {
      setSesiones(await listarSesionesCliente(clienteId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    supabase.from("clientes").select("nombre_empresa").eq("id", clienteId).maybeSingle()
      .then(({ data }) => { if (data?.nombre_empresa) setClienteNombre(data.nombre_empresa); });
  }, [clienteId]);

  useEffect(() => {
    if (!esCliente) return;
    supabase.from("clientes").select("acceso_interpretacion").eq("id", clienteId).maybeSingle()
      .then(({ data }) => { if (data?.acceso_interpretacion) setAccesoInterpretacion(true); });
  }, [clienteId, esCliente]);

  const puedeVerInterpretacion = !esCliente || accesoInterpretacion;

  const progreso = useMemo(() => progresoPorEtapa(sesiones), [sesiones]);
  const etapa = useMemo(() => etapaActual(sesiones), [sesiones]);
  const totalCompletadas = sesiones.filter((s) => s.completada).length;
  const pctGlobal = Math.round((totalCompletadas / HERRAMIENTAS_A360.length) * 100);
  const analisisCount = sesiones.filter((s) => (s.datos as Record<string, unknown>)?.analisis_ia).length;

  const diasEnPrograma = useMemo(() => {
    if (sesiones.length === 0) return 0;
    const primera = new Date(sesiones[sesiones.length - 1].created_at);
    return Math.round((Date.now() - primera.getTime()) / (1000 * 60 * 60 * 24));
  }, [sesiones]);

  const proximaHerramienta = useMemo(
    () => HERRAMIENTAS_A360.find(h => !sesiones.some(s => s.herramienta_id === h.id)),
    [sesiones]
  );

  const heroStats = [
    { val: totalCompletadas, lbl: "Herramientas completadas" },
    { val: HERRAMIENTAS_A360.length, lbl: "Total herramientas" },
    { val: `${pctGlobal}%`, lbl: "Progreso del programa" },
    { val: analisisCount, lbl: "Análisis IA generados" },
  ];

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 bg-[#F5F7FF]">

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 lg:px-16 pt-16 pb-20"
        style={{ background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 50%, #312E81 100%)" }}
      >
        {/* Radial overlays */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(14,165,233,0.15), transparent 60%), radial-gradient(ellipse 40% 60% at 10% 80%, rgba(99,102,241,0.12), transparent 60%)",
        }} />
        {/* Watermark */}
        <div className="absolute pointer-events-none select-none hidden lg:block" style={{
          right: "-40px", bottom: "-60px",
          fontSize: "260px", fontWeight: 900,
          color: "rgba(255,255,255,0.03)",
          letterSpacing: "-0.06em", lineHeight: 1,
        }}>COACH</div>

        <div className="relative z-10 max-w-[680px]">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full mb-5" style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "5px 14px 5px 10px",
            fontSize: "12px", fontWeight: 700, color: "#38BDF8",
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            <span className="w-[7px] h-[7px] rounded-full animate-pulse" style={{ background: "#0EA5E9" }} />
            Suite · Coaching Ejecutivo A360
          </div>

          {/* Title */}
          <h1 className="mb-[18px]" style={{
            fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "white",
            letterSpacing: "-0.04em", lineHeight: 1.05,
          }}>
            Acompañamiento para el líder<br />
            que sabe que solo<br />
            <span style={{
              background: "linear-gradient(135deg, #38BDF8, #A5B4FC)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              no puede llegar más lejos.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-9" style={{
            fontSize: "17px", color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7, maxWidth: "520px",
          }}>
            {clienteNombre} · Metodología probada en más de 200 empresas latinoamericanas.
            Herramientas estructuradas y análisis con inteligencia artificial incluido en cada sesión.
          </p>

          {/* Actions */}
          <div className="flex gap-3.5 flex-wrap mb-12">
            <button style={BTN_PRIMARY} onClick={() => setActiveTab("herramientas")}>
              + Registrar nueva herramienta
            </button>
            <button style={BTN_GHOST} onClick={() => setActiveTab("ia")}>
              🤖 Ver análisis IA
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-0 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {heroStats.map((s, i) => (
              <div
                key={i}
                className="pr-8 mr-8"
                style={i < heroStats.length - 1 ? { borderRight: "1px solid rgba(255,255,255,0.1)" } : {}}
              >
                <div style={{ fontSize: "36px", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {s.val}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. TABS BAR ─────────────────────────────────────────────────────── */}
      <div
        className="bg-white flex gap-0 overflow-x-auto"
        style={{ borderBottom: "1px solid #E0E7FF", padding: "0 24px" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "18px 20px",
              fontSize: "14px",
              fontWeight: activeTab === tab.id ? 700 : 600,
              color: activeTab === tab.id ? "#0EA5E9" : "#64748B",
              background: "none",
              border: "none",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              borderBottom: `3px solid ${activeTab === tab.id ? "#0EA5E9" : "transparent"}`,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 3. CONTENIDO POR TAB ────────────────────────────────────────────── */}

      {/* ─ TAB: RESUMEN ─────────────────────────────────────────────────────── */}
      {activeTab === "resumen" && (
        <>
          {/* 3 KPI stat cards */}
          <div className="bg-white px-6 lg:px-16 py-12">
            <div style={SECTION_LABEL}>
              <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
              Estado del programa — {clienteNombre}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { val: totalCompletadas, extra: `de ${HERRAMIENTAS_A360.length} herramientas`, lbl: "Completadas", icon: "✅", accent: "#0EA5E9" },
                { val: sesiones.length, extra: `${analisisCount} con análisis IA`, lbl: "Sesiones registradas", icon: "📝", accent: "#6366F1" },
                { val: diasEnPrograma > 0 ? `${diasEnPrograma}d` : "—", extra: diasEnPrograma > 0 ? "desde la primera sesión" : "sin sesiones aún", lbl: "Días en el programa", icon: "📅", accent: "#A855F7" },
              ].map((s, i) => (
                <div key={i} style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", borderRadius: "20px", padding: "28px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(14,165,233,0.2), transparent)", pointerEvents: "none" }} />
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>{s.icon}</div>
                    <div style={{ fontSize: "44px", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.03em" }}>{s.val}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginTop: "6px" }}>{s.lbl}</div>
                    <div style={{ fontSize: "12px", color: "#38BDF8", marginTop: "4px" }}>{s.extra}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quote block */}
          <div className="flex items-center gap-7 px-6 lg:px-16 py-11 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)" }}>
            <div className="absolute left-8 -top-3 pointer-events-none select-none" style={{ fontSize: "140px", color: "rgba(255,255,255,0.08)", lineHeight: 1, fontWeight: 900 }}>"</div>
            <div style={{ fontSize: "52px", flexShrink: 0, position: "relative", zIndex: 2 }}>💡</div>
            <div className="relative z-10">
              <p style={{ fontSize: "20px", fontWeight: 700, color: "white", lineHeight: 1.5 }}>
                "El coaching no te da las respuestas. Te hace las preguntas correctas para que encuentres las tuyas — y actúes en consecuencia."
              </p>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "8px", fontStyle: "italic" }}>
                — Metodología Coaching A360SGP
              </p>
            </div>
          </div>

          {/* Tu transformación — 3 cards con colores de etapas */}
          <div className="bg-white px-6 lg:px-16 py-16">
            <div style={SECTION_LABEL}>
              <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
              Tu transformación
            </div>
            <h2 className="mb-3.5" style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              De líder reactivo a <span style={GRADIENT_TEXT}>arquitecto estratégico</span>
            </h2>
            <p className="mb-12" style={{ fontSize: "17px", color: "#64748B", lineHeight: 1.75, maxWidth: "560px", textAlign: "justify" as const }}>
              El coaching A360 está diseñado para producir una transformación real y medible en la forma en que liderás, decidís y construís tu empresa.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "😰", before: "Apagando incendios todo el día", after: "Líder que diseña el sistema y delega con confianza", color: "#7F77DD", etapa: "Diagnóstico" },
                { icon: "🌫️", before: "Decisiones bajo presión sin claridad", after: "Marco de decisión claro y criterios definidos", color: "#1D9E75", etapa: "Activación" },
                { icon: "🔄", before: "Reuniones sin resultados concretos", after: "Compromisos medibles que se cumplen sesión a sesión", color: "#BA7517", etapa: "Sostenimiento" },
              ].map((item, i) => (
                <div key={i} className="text-center rounded-[18px] transition-all cursor-default"
                  style={{ background: "#F5F7FF", border: `1px solid ${item.color}30`, padding: "32px 28px" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = "white"; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 12px 32px ${item.color}20`; el.style.borderColor = `${item.color}60`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = "#F5F7FF"; el.style.transform = "none"; el.style.boxShadow = "none"; el.style.borderColor = `${item.color}30`; }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: `${item.color}15`, marginBottom: "16px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: item.color }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: item.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.etapa}</span>
                  </div>
                  <div style={{ fontSize: "44px", marginBottom: "14px" }}>{item.icon}</div>
                  <div style={{ fontSize: "14px", color: "#94A3B8", marginBottom: "12px", lineHeight: 1.5 }}>Antes: {item.before}</div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: item.color, marginBottom: "12px" }}>↓</div>
                  <div style={{ fontSize: "17px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em", lineHeight: 1.4 }}>{item.after}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mapa visual: 4 etapas como cards horizontales */}
          <div className="px-6 lg:px-16 py-16" style={{ background: "#F5F7FF" }}>
            <div style={SECTION_LABEL}>
              <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
              Tu ruta de transformación
            </div>
            <h2 className="mb-3.5" style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Las 4 etapas del <span style={GRADIENT_TEXT}>programa</span>
            </h2>
            <p className="mb-10" style={{ fontSize: "17px", color: "#64748B", lineHeight: 1.75, maxWidth: "560px", textAlign: "justify" as const }}>
              Cada etapa tiene un propósito específico en la transformación. El avance es acumulativo — cada herramienta construye sobre la anterior.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {ETAPAS_A360.map((et, etIdx) => {
                const roman = (["I", "II", "III", "IV"] as const)[etIdx] ?? String(etIdx + 1);
                const p = progreso.find(pr => pr.etapa.id === et.id);
                const etapaCompleta = (p?.pct ?? 0) === 100;
                const esActual = et.id === etapa;
                return (
                  <div key={et.id} style={{ background: "white", borderRadius: "16px", border: `2px solid ${esActual ? et.color : etapaCompleta ? `${et.color}60` : "#E0E7FF"}`, padding: "20px", position: "relative", overflow: "hidden", transition: "all 0.2s" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-3px)"; el.style.boxShadow = `0 12px 32px ${et.color}20`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; }}
                  >
                    {esActual && <span style={{ position: "absolute", top: "10px", right: "10px", width: "8px", height: "8px", borderRadius: "50%", background: et.color, display: "block" }} className="animate-pulse" />}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 900, color: "white", background: et.color, width: "32px", height: "32px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{roman}</span>
                      {esActual && <span style={{ fontSize: "11px", fontWeight: 700, color: et.color, background: `${et.color}15`, padding: "2px 10px", borderRadius: "999px" }}>Activa</span>}
                      {etapaCompleta && <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "2px 10px", borderRadius: "999px" }}>✓</span>}
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em", marginBottom: "4px" }}>{et.id}</div>
                    <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "12px", lineHeight: 1.5 }}>{et.descripcion}</div>
                    <div style={{ height: "6px", background: "#F0F4FF", borderRadius: "999px", overflow: "hidden", marginBottom: "6px" }}>
                      <div style={{ height: "100%", background: et.color, borderRadius: "999px", width: `${p?.pct ?? 0}%`, transition: "width 0.5s ease" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "#94A3B8" }}>{p?.completadas ?? 0}/{p?.total ?? 0} herr.</span>
                      <span style={{ fontWeight: 700, color: et.color }}>{p?.pct ?? 0}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Próxima herramienta recomendada */}
          {proximaHerramienta && (() => {
            const etapaInfo = ETAPAS_A360.find(e => e.id === proximaHerramienta.etapa);
            return (
              <div className="bg-white px-6 lg:px-16 py-12">
                <div style={SECTION_LABEL}>
                  <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
                  Recomendación
                </div>
                <h2 className="mb-6" style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>
                  Próxima herramienta <span style={GRADIENT_TEXT}>recomendada</span>
                </h2>
                <div style={{ background: `linear-gradient(135deg, ${etapaInfo?.color ?? "#0EA5E9"}10, ${etapaInfo?.color ?? "#6366F1"}08)`, border: `1.5px solid ${etapaInfo?.color ?? "#C7D2FE"}40`, borderRadius: "20px", padding: "28px 32px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: etapaActiveGrad(etapaInfo?.color ?? "#0EA5E9"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", flexShrink: 0, boxShadow: `0 4px 20px ${etapaInfo?.color ?? "#0EA5E9"}30` }}>
                    🛠️
                  </div>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: etapaInfo?.color ?? "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                      {proximaHerramienta.etapa} · {proximaHerramienta.duracion}
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "#0C4A6E", marginBottom: "6px", letterSpacing: "-0.01em" }}>{proximaHerramienta.nombre}</div>
                    <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.75, textAlign: "justify" as const, margin: 0 }}>{proximaHerramienta.descripcion}</p>
                  </div>
                  {!esCliente && (
                    <button onClick={() => setOpenNueva({ herramientaId: proximaHerramienta.id })} style={{ padding: "14px 28px", borderRadius: "12px", background: etapaActiveGrad(etapaInfo?.color ?? "#0EA5E9"), color: "white", fontSize: "14px", fontWeight: 700, border: "none", cursor: "pointer", boxShadow: `0 4px 20px ${etapaInfo?.color ?? "#0EA5E9"}35`, flexShrink: 0 }}>
                      Iniciar herramienta →
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Últimas sesiones registradas */}
          {sesiones.length > 0 && (
            <div className="px-6 lg:px-16 py-12" style={{ background: "#F5F7FF" }}>
              <div style={SECTION_LABEL}>
                <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
                Actividad reciente
              </div>
              <h2 className="mb-6" style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>
                Últimas <span style={GRADIENT_TEXT}>sesiones registradas</span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sesiones.slice(0, 4).map((s) => {
                  const h = s.herramienta_id ? getHerramienta(s.herramienta_id) : null;
                  const etapaInfo = ETAPAS_A360.find(e => e.id === s.etapa);
                  const hasIA = !!(s.datos as Record<string, unknown>)?.analisis_ia;
                  return (
                    <div key={s.id} onClick={() => setEditing(s)} style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "14px", padding: "18px 22px", display: "flex", gap: "16px", cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = `0 8px 24px ${etapaInfo?.color ?? "#0EA5E9"}15`; el.style.borderColor = `${etapaInfo?.color ?? "#BAE6FD"}60`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; el.style.borderColor = "#E0E7FF"; }}
                    >
                      <div style={{ width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0, background: s.completada ? (etapaInfo?.color ?? "#059669") : `${etapaInfo?.color ?? "#0EA5E9"}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 900, color: s.completada ? "white" : (etapaInfo?.color ?? "#0EA5E9") }}>
                        {s.completada ? <Check style={{ width: "18px", height: "18px" }} /> : "•"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", marginBottom: "4px" }}>{h?.nombre ?? "Sesión"}</div>
                        <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "#94A3B8", flexWrap: "wrap" }}>
                          <span>📅 {new Date(s.created_at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</span>
                          {etapaInfo && <span style={{ color: etapaInfo.color, fontWeight: 600 }}>{s.etapa}</span>}
                          {hasIA && <span style={{ color: "#0EA5E9", fontWeight: 600 }}>🤖 IA</span>}
                        </div>
                      </div>
                      <ChevronRight style={{ width: "16px", height: "16px", color: "#94A3B8", flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
              {sesiones.length > 4 && (
                <button onClick={() => setActiveTab("historial")} style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 600, color: "#0EA5E9", background: "none", border: "none", cursor: "pointer" }}>
                  Ver todas las sesiones <ChevronRight style={{ width: "14px", height: "14px" }} />
                </button>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="px-6 lg:px-16 py-[72px] relative overflow-hidden flex items-center justify-between gap-12 flex-wrap" style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A, #312E81)" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 80% at 20% 50%, rgba(14,165,233,0.12), transparent)" }} />
            <div className="relative z-10">
              <div style={{ width: "48px", height: "4px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px", marginBottom: "18px" }} />
              <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
                El siguiente nivel<br />
                <span style={{ background: "linear-gradient(135deg, #38BDF8, #A5B4FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>te está esperando.</span>
              </h2>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", marginTop: "10px", lineHeight: 1.65 }}>
                {totalCompletadas} de {HERRAMIENTAS_A360.length} herramientas completadas. Cada sesión es un punto de inflexión.
              </p>
            </div>
            {!esCliente && (
              <div className="relative z-10 shrink-0">
                <button style={{ ...BTN_PRIMARY, fontSize: "15px", padding: "16px 36px" }} onClick={() => setActiveTab("herramientas")}>
                  Registrar próxima herramienta →
                </button>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "12px", textAlign: "right" }}>
                  Con análisis IA incluido · Resultados inmediatos
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─ TAB: HERRAMIENTAS ────────────────────────────────────────────────── */}
      {activeTab === "herramientas" && (
        <div>
          {/* Overview stats */}
          <div className="bg-white px-6 lg:px-16 pt-12 pb-8">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
              <div>
                <div style={SECTION_LABEL}>
                  <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
                  Programa completo — {ETAPAS_A360.length} etapas · {HERRAMIENTAS_A360.length} herramientas
                </div>
                <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>
                  {totalCompletadas} de <span style={GRADIENT_TEXT}>{HERRAMIENTAS_A360.length}</span> herramientas completadas
                </h2>
              </div>
              {!esCliente && (
                <button style={{ ...BTN_PRIMARY, fontSize: "13px", padding: "11px 22px" }} onClick={() => setOpenNueva({ herramientaId: HERRAMIENTAS_A360[0]?.id ?? "" })}>
                  + Nueva sesión
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { val: `${pctGlobal}%`, lbl: "Avance del programa", extra: `↑ ${totalCompletadas} herramientas completadas` },
                { val: sesiones.length, lbl: "Registros en total", extra: `${analisisCount} con análisis IA generado` },
                { val: etapa, lbl: "Etapa en curso", extra: `${progreso.find(p => p.etapa.id === etapa)?.pct ?? "—"}% de esta etapa` },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", padding: "28px" }}>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(14,165,233,0.2), transparent)" }} />
                  <div className="relative z-10">
                    <div style={{ fontSize: "40px", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em", color: "white" }}>{s.val}</div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>{s.lbl}</div>
                    <div style={{ fontSize: "12px", color: "#38BDF8", marginTop: "4px", fontWeight: 600 }}>{s.extra}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Etapas con número romano, header degradado y cards grandes */}
          {ETAPAS_A360.map((et, etIdx) => {
            const roman = (["I", "II", "III", "IV"] as const)[etIdx] ?? String(etIdx + 1);
            const herrs = HERRAMIENTAS_A360.filter((h) => h.etapa === et.id);
            const etaProgreso = progreso.find(p => p.etapa.id === et.id);
            return (
              <div key={et.id}>
                {/* Gradient header con número romano decorativo y color de etapa */}
                <div className="relative overflow-hidden" style={{ background: etapaHeroGrad(et.color) }}>
                  <div className="absolute pointer-events-none select-none" style={{ right: "-20px", top: "-30px", fontSize: "220px", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, letterSpacing: "-0.05em" }}>
                    {roman}
                  </div>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 80% at 80% 30%, ${et.color}25, transparent)` }} />
                  <div className="relative z-10 px-6 lg:px-16 py-14">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                      <span style={{ display: "inline-block", width: "20px", height: "2px", background: et.color }} />
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                        Etapa {roman} · {etaProgreso?.completadas ?? 0}/{etaProgreso?.total ?? 0} completadas · {etaProgreso?.pct ?? 0}%
                      </span>
                    </div>
                    <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: "12px" }}>
                      {et.titulo}
                    </h2>
                    <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: "640px", textAlign: "justify" as const, margin: 0 }}>
                      {et.proposito}
                    </p>
                    <div style={{ marginTop: "16px", height: "6px", background: "rgba(255,255,255,0.12)", borderRadius: "999px", overflow: "hidden", maxWidth: "280px" }}>
                      <div style={{ height: "100%", borderRadius: "999px", background: `linear-gradient(90deg, ${et.color}, rgba(255,255,255,0.7))`, width: `${etaProgreso?.pct ?? 0}%`, transition: "width 0.5s ease" }} />
                    </div>
                    <div className="flex flex-wrap gap-3 mt-5">
                      {et.entregables.map((ent, ei) => (
                        <span key={ei} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "5px 14px", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>
                          ✓ {ent}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tool cards grandes */}
                <div className="px-6 lg:px-16 py-12" style={{ background: etIdx % 2 === 0 ? "white" : "#F5F7FF" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                    {herrs.map((h) => {
                      const ses = sesiones.filter((s) => s.herramienta_id === h.id);
                      const ultima = ses[0];
                      const completa = ses.some((s) => s.completada);
                      return (
                        <div
                          key={h.id}
                          style={{ background: completa ? "#F0FDF4" : "white", border: `1px solid ${completa ? "#BBF7D0" : "#E0E7FF"}`, borderRadius: "20px", padding: "28px", display: "flex", flexDirection: "column", gap: "14px", transition: "all 0.2s" }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-3px)"; el.style.boxShadow = "0 12px 32px rgba(14,165,233,0.1)"; el.style.borderColor = "#BAE6FD"; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; el.style.borderColor = completa ? "#BBF7D0" : "#E0E7FF"; }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: completa ? "#DCFCE7" : "linear-gradient(135deg, #EFF6FF, #EDE9FE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>
                              {completa ? "✅" : "🛠️"}
                            </div>
                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "5px 12px", borderRadius: "999px", background: completa ? "#DCFCE7" : ses.length > 0 ? "#EFF6FF" : "#F5F7FF", color: completa ? "#059669" : ses.length > 0 ? "#0369A1" : "#94A3B8", flexShrink: 0 }}>
                              {completa ? "Completada" : ses.length > 0 ? `${ses.length} registro${ses.length > 1 ? "s" : ""}` : "Pendiente"}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: "18px", fontWeight: 800, color: completa ? "#065F46" : "#0C4A6E", letterSpacing: "-0.01em", marginBottom: "8px" }}>{h.nombre}</div>
                            <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.75, textAlign: "justify" as const, margin: 0 }}>{h.descripcion}</p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94A3B8" }}>
                            <Clock style={{ width: "13px", height: "13px" }} />
                            {h.duracion}
                            {ultima && <span>· {new Date(ultima.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}</span>}
                          </div>
                          <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                            {!esCliente && (
                              <button
                                onClick={() => setOpenNueva({ herramientaId: h.id })}
                                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: completa ? "#059669" : etapaActiveGrad(et.color), color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 12px ${et.color}30`, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                              >
                                <Plus style={{ width: "14px", height: "14px" }} />
                                {completa ? "Nueva sesión" : "Iniciar herramienta"}
                              </button>
                            )}
                            {ultima && (
                              <button
                                onClick={() => setEditing(ultima)}
                                style={{ padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #E0E7FF", background: "white", color: "#0369A1", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", ...(esCliente ? { flex: 1 } : {}) }}
                                title="Ver último registro"
                              >
                                <FileText style={{ width: "14px", height: "14px" }} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {etIdx < ETAPAS_A360.length - 1 && (
                  <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, #C7D2FE 30%, #C7D2FE 70%, transparent)" }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─ TAB: PROGRESO ────────────────────────────────────────────────────── */}
      {activeTab === "progreso" && (
        <div>
          {/* 4 KPI cards + barras por etapa */}
          <div className="bg-white px-6 lg:px-16 pt-12 pb-10">
            <div style={SECTION_LABEL}>
              <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
              Dashboard de progreso
            </div>
            <h2 className="mb-10" style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>
              Sesión <span style={GRADIENT_TEXT}>{totalCompletadas} de {HERRAMIENTAS_A360.length}</span> completada
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {[
                { val: `${pctGlobal}%`, lbl: "Avance total", extra: `${totalCompletadas} herramientas` },
                { val: sesiones.length, lbl: "Registros totales", extra: `${analisisCount} con análisis IA` },
                { val: etapa, lbl: "Etapa actual", extra: `${progreso.find(p => p.etapa.id === etapa)?.pct ?? "—"}% completada` },
                { val: diasEnPrograma > 0 ? `${diasEnPrograma}d` : "—", lbl: "Días activo", extra: diasEnPrograma > 0 ? "desde primer registro" : "sin registros aún" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", padding: "24px 22px" }}>
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(14,165,233,0.2), transparent)" }} />
                  <div className="relative z-10">
                    <div style={{ fontSize: "36px", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em", color: "white" }}>{s.val}</div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginTop: "5px" }}>{s.lbl}</div>
                    <div style={{ fontSize: "12px", color: "#38BDF8", marginTop: "3px", fontWeight: 600 }}>{s.extra}</div>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0C4A6E", marginBottom: "20px", letterSpacing: "-0.01em" }}>Progreso por etapa</h3>
            <div className="space-y-4">
              {progreso.map((p, pi) => (
                <div key={p.etapa.id} className="rounded-2xl" style={{ background: "#F5F7FF", border: "1px solid #E0E7FF", padding: "20px 24px" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "white", background: p.etapa.color, width: "28px", height: "28px", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        {(["I","II","III","IV"] as const)[pi] ?? pi + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E" }}>{p.etapa.id}</div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>{p.etapa.descripcion}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span style={{ fontSize: "24px", fontWeight: 900, color: p.pct === 100 ? "#059669" : "#0C4A6E" }}>{p.pct}%</span>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>{p.completadas}/{p.total}</div>
                    </div>
                  </div>
                  <div style={{ height: "8px", background: "#E0E7FF", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "999px", background: p.etapa.color, width: `${p.pct}%`, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mapa visual del programa */}
          <div className="px-6 lg:px-16 py-14" style={{ background: "#F5F7FF" }}>
            <div style={SECTION_LABEL}>
              <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
              Mapa visual del programa
            </div>
            <h2 className="mb-3" style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>
              Ruta de <span style={GRADIENT_TEXT}>transformación completa</span>
            </h2>
            <p className="mb-10" style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.75, maxWidth: "560px", textAlign: "justify" as const }}>
              Haz clic en cualquier herramienta para abrirla. Verde = completada · Gradiente = próxima recomendada · Gris = pendiente.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {ETAPAS_A360.map((et, etIdx) => {
                const herrs = HERRAMIENTAS_A360.filter(h => h.etapa === et.id);
                const roman = (["I", "II", "III", "IV"] as const)[etIdx] ?? String(etIdx + 1);
                return (
                  <div key={et.id} style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "16px", padding: "20px 24px" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#BAE6FD"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E0E7FF"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "white", background: et.color, padding: "3px 10px", borderRadius: "6px" }}>{roman}</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E" }}>{et.id}</span>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>— {et.descripcion}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0" }}>
                      {herrs.map((h, hi) => {
                        const ses = sesiones.filter(s => s.herramienta_id === h.id);
                        const completa = ses.some(s => s.completada);
                        const esProxima = !completa && hi === herrs.findIndex(ph => !sesiones.some(s => s.herramienta_id === ph.id && s.completada));
                        return (
                          <div key={h.id} style={{ display: "flex", alignItems: "center" }}>
                            <div
                              title={h.nombre}
                              onClick={() => { const ms = ses[0]; if (ms) setEditing(ms); else setOpenNueva({ herramientaId: h.id }); }}
                              style={{ width: "52px", height: "52px", borderRadius: "50%", background: completa ? et.color : esProxima ? etapaActiveGrad(et.color) : "white", color: completa || esProxima ? "white" : "#94A3B8", border: `2px solid ${completa ? et.color : esProxima ? "transparent" : "#E0E7FF"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, cursor: "pointer", boxShadow: esProxima ? `0 4px 14px ${et.color}40` : "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.2s" }}
                              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "scale(1.12)"}
                              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = "none"}
                            >
                              {completa ? <Check style={{ width: "18px", height: "18px" }} /> : hi + 1}
                            </div>
                            {hi < herrs.length - 1 && (
                              <div style={{ width: "20px", height: "2px", background: completa ? et.color : "#E0E7FF" }} />
                            )}
                          </div>
                        );
                      })}
                      <span style={{ marginLeft: "14px", fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>
                        {herrs.filter(h => sesiones.some(s => s.herramienta_id === h.id && s.completada)).length}/{herrs.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico de actividad por semana — solo si hay 2+ registros */}
          {sesiones.length >= 2 && (() => {
            const getWeekKey = (d: Date) => {
              const startOfWeek = new Date(d);
              startOfWeek.setDate(d.getDate() - d.getDay());
              return startOfWeek.toISOString().slice(0, 10);
            };
            const byWeek = new Map<string, number>();
            sesiones.forEach(s => {
              const key = getWeekKey(new Date(s.created_at));
              byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
            });
            const weeks = Array.from(byWeek.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
            const maxVal = Math.max(...weeks.map(([, v]) => v), 1);
            const weekLabel = (iso: string) => {
              const d = new Date(iso);
              return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
            };
            return (
              <div className="bg-white px-6 lg:px-16 py-12">
                <div style={SECTION_LABEL}>
                  <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
                  Gráfico de actividad
                </div>
                <h2 className="mb-8" style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>
                  Registros por <span style={GRADIENT_TEXT}>semana</span>
                </h2>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "140px" }}>
                  {weeks.map(([week, count], wi) => {
                    const etapaColors = ["#7F77DD", "#1D9E75", "#BA7517", "#D85A30"];
                    const barColor = etapaColors[wi % etapaColors.length];
                    return (
                      <div key={week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#0C4A6E" }}>{count}</div>
                        <div style={{ width: "100%", background: barColor, borderRadius: "6px 6px 0 0", height: `${Math.max((count / maxVal) * 90, 8)}px`, transition: "height 0.3s ease", opacity: 0.85 }} />
                        <div style={{ fontSize: "9px", color: "#94A3B8", fontWeight: 600, textAlign: "center" as const }}>{weekLabel(week)}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
                  {ETAPAS_A360.map(et => (
                    <div key={et.id} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#64748B", fontWeight: 600 }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: et.color, display: "inline-block" }} />
                      {et.id}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Plan de continuidad */}
          <div className="px-6 lg:px-16 py-12" style={{ background: "#F5F7FF" }}>
            <div style={SECTION_LABEL}>
              <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
              Post-programa
            </div>
            <h2 className="mb-10" style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>
              Plan de continuidad — <span style={GRADIENT_TEXT}>90 días post-programa</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PLAN_CONTINUIDAD_FASES.map((f) => (
                <div key={f.id} className="rounded-2xl transition-all" style={{ background: "white", border: "1px solid #E0E7FF", padding: "24px" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-3px)"; el.style.boxShadow = "0 12px 32px rgba(14,165,233,0.1)"; el.style.borderColor = "#BAE6FD"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; el.style.borderColor = "#E0E7FF"; }}
                >
                  <div style={{ fontSize: "10px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>{f.label}</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E", marginBottom: "8px", letterSpacing: "-0.01em" }}>{f.titulo}</div>
                  <div style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.75, textAlign: "justify" as const }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─ TAB: ANÁLISIS IA ─────────────────────────────────────────────────── */}
      {activeTab === "ia" && !puedeVerInterpretacion && <CoachingPremiumGate />}
      {activeTab === "ia" && puedeVerInterpretacion && (
        <div>
          {sesiones.length === 0 ? (
            <div className="px-6 lg:px-16 py-16 bg-white">
              <div className="rounded-2xl p-12 text-center" style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE" }}>
                <div style={{ fontSize: "56px", marginBottom: "20px" }}>🤖</div>
                <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#0C4A6E", marginBottom: "12px", letterSpacing: "-0.01em" }}>Aún no hay datos para analizar</h3>
                <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.75, maxWidth: "440px", margin: "0 auto 28px", textAlign: "justify" as const }}>
                  Registra y guarda tu primera herramienta de coaching para que la IA pueda generar análisis de patrones, evolución y recomendaciones personalizadas.
                </p>
                <button style={BTN_PRIMARY} onClick={() => setActiveTab("herramientas")}>
                  Ir a herramientas →
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Hero del análisis IA */}
              <div className="relative overflow-hidden px-6 lg:px-16 py-14" style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A, #312E81)" }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(14,165,233,0.15), transparent)" }} />
                <div className="absolute pointer-events-none select-none hidden lg:block" style={{ right: "-20px", bottom: "-40px", fontSize: "200px", fontWeight: 900, color: "rgba(255,255,255,0.03)", lineHeight: 1 }}>IA</div>
                <div className="relative z-10 max-w-[640px]">
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-block", width: "20px", height: "2px", background: "#0EA5E9" }} />
                    Inteligencia artificial · Síntesis del programa
                  </div>
                  <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: "white", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: "12px" }}>
                    Análisis profundo con <span style={{ background: "linear-gradient(135deg, #38BDF8, #A5B4FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Claude AI</span>
                  </h2>
                  <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, textAlign: "justify" as const }}>
                    Claude analiza los {sesiones.length} registros de sesión para identificar patrones de liderazgo, evolución del radar, brechas de comportamiento, compromisos cumplidos vs. pendientes, y genera recomendaciones estratégicas para el coach y el sponsor.
                  </p>
                  <div className="flex gap-3 mt-6 flex-wrap">
                    <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>
                      📊 {sesiones.length} registros analizados
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>
                      🤖 {analisisCount} análisis individuales
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>
                      📈 {pctGlobal}% del programa completado
                    </div>
                  </div>
                </div>
              </div>

              {/* Análisis individual por sesión con IA */}
              {analisisCount > 0 && (
                <div className="px-6 lg:px-16 py-12" style={{ background: "#F5F7FF" }}>
                  <div style={SECTION_LABEL}>
                    <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
                    Análisis generados por sesión
                  </div>
                  <h3 className="mb-6" style={{ fontSize: "20px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em" }}>
                    {analisisCount} sesión{analisisCount !== 1 ? "es" : ""} con análisis IA disponible
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {sesiones.filter(s => !!(s.datos as Record<string, unknown>)?.analisis_ia).map((s) => {
                      const h = s.herramienta_id ? getHerramienta(s.herramienta_id) : null;
                      const etapaInfo = ETAPAS_A360.find(e => e.id === s.etapa);
                      const etapaColor = etapaInfo?.color ?? "#0EA5E9";
                      const analisisTexto = String((s.datos as Record<string, unknown>).analisis_ia ?? "");
                      const preview = analisisTexto.slice(0, 200).trim();
                      return (
                        <div key={s.id}
                          onClick={() => setEditing(s)}
                          style={{ background: "white", border: "1px solid #E0E7FF", borderLeft: `4px solid ${etapaColor}`, borderRadius: "0 14px 14px 0", padding: "20px 24px", cursor: "pointer", transition: "all 0.2s" }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateX(4px)"; el.style.boxShadow = `0 4px 16px ${etapaColor}15`; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E" }}>{h?.nombre ?? "Sesión"}</div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              {etapaInfo && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: `${etapaColor}15`, color: etapaColor }}>{s.etapa}</span>}
                              <span style={{ fontSize: "11px", color: "#94A3B8", flexShrink: 0 }}>
                                {new Date(s.created_at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6, textAlign: "justify" as const }}>
                            {preview}{analisisTexto.length > 200 ? "…" : ""}
                          </p>
                          <div style={{ fontSize: "12px", color: etapaColor, fontWeight: 600, marginTop: "8px" }}>
                            Ver análisis completo →
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Síntesis global + export */}
              <div className="px-6 lg:px-16 py-12 bg-white">
                <div style={SECTION_LABEL}>
                  <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
                  Síntesis ejecutiva del programa completo
                </div>
                <h3 className="mb-6" style={{ fontSize: "20px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em" }}>
                  Análisis integral · Línea base + evolución + recomendaciones
                </h3>
                <SintesisProgramaIA clienteId={clienteId} readOnly={esCliente} />
              </div>

              {/* Export */}
              <div className="px-6 lg:px-16 py-10" style={{ background: "#F5F7FF" }}>
                <CoachingExportImport
                  clienteId={clienteId}
                  clienteNombre={clienteNombre}
                  sesiones={sesiones}
                  onImported={cargar}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ─ TAB: HISTORIAL ───────────────────────────────────────────────────── */}
      {activeTab === "historial" && (() => {
        const etapasDisponibles = [...new Set(sesiones.map(s => s.etapa).filter((e): e is string => !!e))];
        const sesionesFiltradas = filtroEtapa ? sesiones.filter(s => s.etapa === filtroEtapa) : sesiones;
        const lastSes = sesiones[0];
        const avgPerMonth = (() => {
          if (sesiones.length < 2) return sesiones.length;
          const fechas = sesiones.map(s => new Date(s.created_at).getTime());
          const rango = (Math.max(...fechas) - Math.min(...fechas)) / (1000 * 60 * 60 * 24 * 30);
          return (sesiones.length / Math.max(rango, 1)).toFixed(1);
        })();

        return (
          <div className="px-6 lg:px-16 py-12 bg-white">
            <div style={SECTION_LABEL}>
              <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
              Historial completo del programa
            </div>
            <h2 className="mb-8" style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>
              {sesiones.length} registro{sesiones.length !== 1 ? "s" : ""} de sesión
            </h2>

            {/* Stats rápidas — gradient cards */}
            {sesiones.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { val: sesiones.length, lbl: "Total registros", icon: "📝" },
                  { val: lastSes ? new Date(lastSes.created_at).toLocaleDateString("es", { day: "numeric", month: "short" }) : "—", lbl: "Última sesión", icon: "📅" },
                  { val: avgPerMonth, lbl: "Promedio por mes", icon: "📊" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", borderRadius: "14px", padding: "20px 22px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(14,165,233,0.2), transparent)", pointerEvents: "none" }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ fontSize: "20px", marginBottom: "4px" }}>{s.icon}</div>
                      <div style={{ fontSize: "28px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.lbl}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filtros por etapa con color de etapa */}
            {etapasDisponibles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                <button onClick={() => setFiltroEtapa("")} style={{ fontSize: "12px", padding: "6px 16px", borderRadius: "999px", border: `1.5px solid ${filtroEtapa === "" ? "#0C4A6E" : "#E0E7FF"}`, background: filtroEtapa === "" ? "#0C4A6E" : "white", color: filtroEtapa === "" ? "white" : "#64748B", cursor: "pointer", fontWeight: 600, transition: "all 0.15s" }}>
                  Todas las etapas
                </button>
                {etapasDisponibles.map(e => {
                  const etapaInfo = ETAPAS_A360.find(et => et.id === e);
                  const eColor = etapaInfo?.color ?? "#0EA5E9";
                  const isActive = filtroEtapa === e;
                  return (
                    <button key={e} onClick={() => setFiltroEtapa(isActive ? "" : e)} style={{ fontSize: "12px", padding: "6px 16px", borderRadius: "999px", border: `1.5px solid ${isActive ? eColor : "#E0E7FF"}`, background: isActive ? eColor : "white", color: isActive ? "white" : "#64748B", cursor: "pointer", fontWeight: 600, transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isActive ? "rgba(255,255,255,0.7)" : eColor, display: "inline-block" }} />
                      {e}
                    </button>
                  );
                })}
              </div>
            )}

            {loading ? (
              <p style={{ fontSize: "15px", color: "#94A3B8" }}>Cargando…</p>
            ) : sesionesFiltradas.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: "#F5F7FF", border: "1px solid #E0E7FF" }}>
                <p style={{ fontSize: "15px", color: "#94A3B8", fontStyle: "italic" }}>
                  {sesiones.length === 0 ? "Aún no hay registros. Empieza por una herramienta de la pestaña Metodología." : "Sin registros para esta etapa."}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {sesionesFiltradas.map((s, idx) => {
                  const h = s.herramienta_id ? getHerramienta(s.herramienta_id) : null;
                  const etapaInfo = ETAPAS_A360.find(e => e.id === s.etapa);
                  const eColor = etapaInfo?.color ?? "#0EA5E9";
                  const isLatest = idx === 0 && sesiones[0]?.id === s.id;
                  const notas = String((s.datos as Record<string, unknown>)?.notas ?? "").trim();
                  const hasIA = !!(s.datos as Record<string, unknown>)?.analisis_ia;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setEditing(s)}
                      style={{ background: isLatest ? `${eColor}08` : s.completada ? "#F0FDF4" : "white", border: `1px solid ${isLatest ? `${eColor}40` : s.completada ? "#BBF7D0" : "#E0E7FF"}`, borderRadius: "16px", padding: "22px 28px", display: "flex", gap: "20px", cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = `0 8px 24px ${eColor}15`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; }}
                    >
                      {/* Number with etapa color */}
                      <div style={{ width: "52px", height: "52px", borderRadius: "12px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900, ...(isLatest ? { background: etapaActiveGrad(eColor), color: "white", boxShadow: `0 4px 12px ${eColor}40` } : s.completada ? { background: `${eColor}20`, color: eColor } : { background: "white", border: `1.5px solid ${eColor}40`, color: eColor }) }}>
                        {s.completada ? <Check style={{ width: "20px", height: "20px" }} /> : sesionesFiltradas.length - idx}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                          <div style={{ fontSize: "16px", fontWeight: 800, color: isLatest ? eColor : "#0C4A6E", letterSpacing: "-0.01em" }}>
                            {h?.nombre ?? "Sesión"}
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "999px", flexShrink: 0, background: isLatest ? etapaActiveGrad(eColor) : s.completada ? `${eColor}20` : "#F1F5F9", color: isLatest ? "white" : s.completada ? eColor : "#94A3B8" }}>
                            {isLatest ? "Más reciente" : s.completada ? "✓ Completada" : "Pendiente"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mb-2" style={{ fontSize: "13px", color: "#64748B" }}>
                          <span>📅 {new Date(s.created_at).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</span>
                          {etapaInfo && <span style={{ color: eColor, fontWeight: 700 }}>{s.etapa}</span>}
                          {h && <span style={{ color: "#94A3B8" }}>🛠 {h.tipo}</span>}
                          {hasIA && <span style={{ color: "#0EA5E9", fontWeight: 600 }}>🤖 Con análisis IA</span>}
                        </div>
                        {notas && (
                          <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.55, fontStyle: "italic", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                            "{notas.slice(0, 140)}{notas.length > 140 ? "…" : ""}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Diálogos ──────────────────────────────────────────────────────────── */}
      {openNueva && (
        <DialogoSesion
          clienteId={clienteId}
          herramientaId={openNueva.herramientaId}
          onClose={() => setOpenNueva(null)}
          onSaved={() => { setOpenNueva(null); cargar(); }}
          esCliente={esCliente}
          puedeVerInterpretacion={puedeVerInterpretacion}
        />
      )}
      {editing && (
        <DialogoSesion
          clienteId={clienteId}
          herramientaId={editing.herramienta_id ?? ""}
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); cargar(); }}
          esCliente={esCliente}
          puedeVerInterpretacion={puedeVerInterpretacion}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Diálogo nueva/editar sesión — lógica sin cambios
// ─────────────────────────────────────────────────────────────────────────────
function DialogoSesion({
  clienteId, herramientaId, existing, onClose, onSaved, esCliente = false, puedeVerInterpretacion = true,
}: {
  clienteId: string;
  herramientaId: string;
  existing?: SesionCoaching;
  onClose: () => void;
  onSaved: () => void;
  esCliente?: boolean;
  puedeVerInterpretacion?: boolean;
}) {
  const h = getHerramienta(herramientaId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [datos, setDatos] = useState<any>(existing?.datos ?? {});
  const [completada, setCompletada] = useState(existing?.completada ?? false);
  const [saving, setSaving] = useState(false);

  if (!h) return null;

  const guardar = async () => {
    setSaving(true);
    try {
      if (existing) {
        await actualizarSesion(existing.id, { datos, completada });
        toast.success("Sesión actualizada");
      } else {
        await crearSesion({
          cliente_id: clienteId,
          herramienta_id: h.id,
          etapa: h.etapa,
          datos,
          completada,
        });
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
    if (!existing) return;
    if (!confirm("¿Eliminar esta sesión?")) return;
    await eliminarSesion(existing.id);
    toast.success("Sesión eliminada");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[92vw] max-w-[1200px] max-h-[90vh] overflow-y-auto p-0">

        {/* ── Gradient header ── */}
        <div style={{ background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 100%)", padding: "28px", borderRadius: "8px 8px 0 0", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 90% 20%, rgba(14,165,233,0.15), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ display: "inline-block", width: "20px", height: "2px", background: "#0EA5E9" }} />
              {h.etapa}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "10px" }}>
              {h.nombre}
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: "480px" }}>
              {h.proposito}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
              <span style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                ⏱ {h.duracion}
              </span>
              <span style={{ background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.3)", borderRadius: "6px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, color: "#7DD3FC" }}>
                🎯 {h.tipo}
              </span>
            </div>
          </div>
        </div>

        {/* ── Guía del coach (colapsable) — solo para consultores o clientes con acceso_interpretacion ── */}
        {puedeVerInterpretacion && (
        <div style={{ background: "#F5F7FF", borderBottom: "1px solid #E0E7FF", padding: "14px 28px" }}>
          <details>
            <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#0C4A6E", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📚</span> Guía del coach — cuándo usar, preguntas y tips
            </summary>
            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "4px" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Cuándo usar</div>
                  <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>{h.cuandoUsar}</p>
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Resultado esperado</div>
                  <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>{h.resultadoEsperado}</p>
                </div>
              </div>
              {h.preguntasGuia.length > 0 && (
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                    Preguntas guía ({h.preguntasGuia.length})
                  </div>
                  <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {h.preguntasGuia.map((p, i) => (
                      <li key={i} style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>
                        <span style={{ color: "#0EA5E9", marginRight: "6px" }}>›</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <details style={{ background: "#EFF6FF", borderRadius: "8px", padding: "10px 14px" }}>
                <summary style={{ cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#0C4A6E" }}>
                  Tips del coach ({h.tipsCoach.length})
                </summary>
                <ul style={{ marginTop: "8px", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {h.comoAplicar.map((p, i) => <li key={i} style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.5 }}>{p}</li>)}
                  {h.tipsCoach.map((t, i) => <li key={i} style={{ fontSize: "12px", color: "#64748B", fontStyle: "italic" }}>• {t}</li>)}
                </ul>
              </details>
            </div>
          </details>
        </div>
        )}

        {/* ── Contenido del editor ── */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px", ...(esCliente ? { pointerEvents: "none" as const } : {}) }}>
          {h.tipo === "radar" && <RadarEditor datos={datos} setDatos={setDatos} />}
          {h.tipo === "creencias" && <CreenciasInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "perfil" && <ContextoInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "manifiesto" && <ManifiestoInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "simulador" && <SimuladorInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "reto" && <RetoInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "espejo" && <EspejoEditor datos={datos} setDatos={setDatos} />}
          {h.tipo === "pulso" && <PulsoEditor datos={datos} setDatos={setDatos} />}
          {h.tipo === "biblioteca" && <BibliotecaPreguntasInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "plan" && <PlanContinuidadInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "reporte" && <ReporteTransformacionInstrumentado datos={datos} setDatos={setDatos} />}
          {!["radar","creencias","perfil","manifiesto","simulador","reto","espejo","pulso","biblioteca","plan","reporte"].includes(h.tipo) && (
            <NotasEditor datos={datos} setDatos={setDatos} />
          )}

          {/* Marcar como completada */}
          <div style={{ background: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "10px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="checkbox"
              id="completada"
              checked={completada}
              onChange={(e) => setCompletada(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <label htmlFor="completada" style={{ fontSize: "14px", fontWeight: 600, color: "#0C4A6E", cursor: "pointer", lineHeight: 1.4 }}>
              Marcar como completada — herramienta documentada y lista
            </label>
          </div>

          {/* Análisis IA — solo si puedeVerInterpretacion */}
          {existing && puedeVerInterpretacion && (
            <AnalisisIACoaching
              sesionId={existing.id}
              herramientaNombre={h.nombre}
              herramientaProposito={h.proposito}
              etapa={h.etapa}
              datosSesion={datos}
              analisisActual={(datos as Record<string, unknown>)?.analisis_ia as string ?? null}
              analisisFecha={(datos as Record<string, unknown>)?.analisis_ia_fecha as string ?? null}
              onAnalisisGenerado={(t: string, f: string) => setDatos({ ...datos, analisis_ia: t, analisis_ia_fecha: f })}
              readOnly={esCliente}
            />
          )}
          {!existing && (
            <div style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>🤖</span>
              <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
                Guarda el registro primero y vuelve a abrirlo para generar el <strong>análisis IA</strong> del coach.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 px-7 pb-7 pt-4 border-t border-[#E0E7FF]">
          {existing && !esCliente && (
            <Button variant="ghost" size="sm" onClick={eliminar} className="text-red-600 mr-auto">
              <Trash2 className="w-3 h-3 mr-1" /> Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={onClose} style={{ borderColor: "#E0E7FF" }}>{esCliente ? "Cerrar" : "Cancelar"}</Button>
          {!esCliente && (
            <Button
              onClick={guardar}
              disabled={saving}
              style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)", color: "white", border: "none", boxShadow: "0 4px 14px rgba(14,165,233,0.3)" }}
            >
              {saving ? "Guardando…" : "💾 Guardar sesión"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Constantes Aurora compartidas entre editores inline
// ─────────────────────────────────────────────────────────────────────────────
const AURORA_LABEL: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "8px", display: "block" };
const AURORA_TEXTAREA: React.CSSProperties = { width: "100%", padding: "14px 18px", border: "1.5px solid #E0E7FF", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.75, minHeight: "140px", resize: "vertical", transition: "all 0.15s" };
const AURORA_QCARD: React.CSSProperties = { background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", borderLeft: "4px solid #0EA5E9", borderRadius: "0 12px 12px 0", padding: "20px 24px", marginBottom: "12px" };
const AURORA_SECTION: React.CSSProperties = { background: "white", border: "1px solid #E0E7FF", borderRadius: "16px", padding: "20px 24px" };
const AURORA_STAT_DARK: React.CSSProperties = { background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", borderRadius: "12px", padding: "18px 22px", color: "white", position: "relative", overflow: "hidden" };

const onAuroraFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "#0EA5E9";
  e.target.style.boxShadow = "0 0 0 4px rgba(14,165,233,0.1)";
};
const onAuroraBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "#E0E7FF";
  e.target.style.boxShadow = "none";
};

// EspejoEditor y PulsoEditor ahora en src/components/coaching/editores/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NotasEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE", borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "12px" }}>
        <span style={{ fontSize: "24px", flexShrink: 0 }}>✨</span>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E", marginBottom: "4px" }}>Consejo para documentar mejor</div>
          <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>
            Los mejores registros responden: ¿Qué descubrí hoy? ¿Qué va a cambiar en mi forma de liderar? ¿Qué me sorprendió? ¿Qué acuerdo concreto se tomó? Escribe en lenguaje del líder — este registro será analizado por IA.
          </div>
        </div>
      </div>
      <div>
        <div style={AURORA_LABEL}>📝 Contenido de la sesión</div>
        <textarea
          style={{ ...AURORA_TEXTAREA, minHeight: "200px" }}
          value={datos.notas ?? ""}
          onChange={(e) => setDatos({ ...datos, notas: e.target.value })}
          onFocus={onAuroraFocus}
          onBlur={onAuroraBlur}
          placeholder="Registra los temas trabajados, los insights del líder, los acuerdos tomados y las observaciones del coach. Incluye contexto suficiente para dar seguimiento en la próxima sesión…"
        />
      </div>
    </div>
  );
}

// ── Legacy editors (mantenidos para compatibilidad) ───────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CreenciasEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const c = datos.creencias ?? ["", "", ""];
  const upd = (i: number, v: string) => {
    const arr = [...c];
    arr[i] = v;
    setDatos({ ...datos, creencias: arr });
  };
  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: "#94A3B8" }}>Identifica las 3 creencias limitantes más activas del líder:</p>
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <Label className="text-xs">Creencia #{i + 1}</Label>
          <Textarea rows={2} value={c[i] ?? ""} onChange={(e) => upd(i, e.target.value)} placeholder="Ej. Si delego pierdo control…" />
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ManifiestoEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const dims = ["Visión", "Decisión", "Influencia", "Ejecución", "Resiliencia"];
  const m = datos.manifiesto ?? {};
  const upd = (k: string, v: string) => setDatos({ ...datos, manifiesto: { ...m, [k]: v } });
  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: "#94A3B8" }}>Compromiso accionable por cada dimensión:</p>
      {dims.map((d) => (
        <div key={d}>
          <Label className="text-xs">{d}</Label>
          <Textarea rows={2} value={m[d] ?? ""} onChange={(e) => upd(d, e.target.value)} placeholder={`Mi compromiso en ${d.toLowerCase()}…`} />
        </div>
      ))}
    </div>
  );
}

// Ensure legacy editors satisfy unused-variable check
void CreenciasEditor;
void ManifiestoEditor;
