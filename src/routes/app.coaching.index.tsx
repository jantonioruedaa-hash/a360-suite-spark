import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ETAPAS_A360,
  HERRAMIENTAS_A360,
  RADAR_DIMENSIONES,
  PLAN_CONTINUIDAD_FASES,
  PREGUNTAS_POR_DIMENSION,
} from "@/lib/coaching-catalogo";
import { listarSesionesGlobal, type SesionCoaching } from "@/lib/coaching-helpers";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/coaching/")({
  component: CoachingHome,
});

// ── Types ──────────────────────────────────────────────────────────────────────
type TabId = "inicio" | "metodologia" | "etapas" | "herramientas" | "radar" | "plan90" | "preguntas";
type Cliente = { id: string; nombre_empresa: string };

async function listarClientes(): Promise<Cliente[]> {
  const { data } = await supabase.from("clientes").select("id,nombre_empresa").order("nombre_empresa");
  return (data ?? []) as Cliente[];
}

// ── Visual constants ───────────────────────────────────────────────────────────
const GT: React.CSSProperties = {
  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
};
const BTN_PRI: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "8px",
  padding: "14px 28px", borderRadius: "10px",
  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
  color: "white", fontSize: "15px", fontWeight: 700,
  border: "none", cursor: "pointer",
  boxShadow: "0 4px 20px rgba(14,165,233,0.35)",
  textDecoration: "none",
};
const BTN_GHO: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "8px",
  padding: "14px 24px", borderRadius: "10px",
  background: "rgba(255,255,255,0.1)", color: "white",
  fontSize: "15px", fontWeight: 600,
  border: "1.5px solid rgba(255,255,255,0.3)", cursor: "pointer",
  textDecoration: "none",
};
const SL: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#0EA5E9",
  textTransform: "uppercase", letterSpacing: "0.15em",
  display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px",
};
const SLL: React.CSSProperties = {
  display: "inline-block", width: "28px", height: "3px",
  background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px",
};

// ── Static data ────────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; badge?: number }[] = [
  { id: "inicio",      label: "Coaching A360" },
  { id: "metodologia", label: "Metodología",         badge: 4 },
  { id: "etapas",        label: "Las 4 etapas",        badge: 4 },
  { id: "herramientas", label: "🛠️ Herramientas",    badge: 12 },
  { id: "radar",        label: "Radar 6 dim",         badge: 6 },
  { id: "plan90",      label: "Plan 90 días",        badge: 4 },
  { id: "preguntas",   label: "Preguntas poderosas", badge: 24 },
];

const TRANSFORM_ITEMS = [
  { icon: "😰", before: "Apagando incendios todo el día",        after: "Líder que diseña el sistema y delega con confianza" },
  { icon: "🌫️", before: "Decisiones bajo presión sin claridad", after: "Marco de decisión claro y criterios definidos" },
  { icon: "🔄", before: "Reuniones sin resultados concretos",    after: "Compromisos medibles que se cumplen sesión a sesión" },
];

const MET_STEPS = [
  {
    num: "01", icon: "🎯", title: "Enfoque del tema",
    desc: "Cada herramienta aborda un aspecto estratégico del liderazgo con materiales y contexto profesional previo. El líder llega preparado a la conversación.",
    tools: ["Radar del líder", "Mapa de creencias", "Perfil de contexto"],
  },
  {
    num: "02", icon: "💬", title: "Diálogo profundo",
    desc: "Sesiones estructuradas de 90 minutos con preguntas poderosas que revelan insights que el día a día no permite ver. Sin consejo: solo preguntas precisas.",
    tools: ["Espejo de liderazgo", "Simulador de decisiones", "Preguntas poderosas"],
  },
  {
    num: "03", icon: "🤖", title: "Análisis con IA",
    desc: "Claude analiza los datos de la sesión, genera un resumen ejecutivo e identifica patrones y áreas de atención prioritaria de forma automática.",
    tools: ["Resumen ejecutivo IA", "Patrones conductuales", "Áreas prioritarias"],
  },
  {
    num: "04", icon: "📋", title: "Plan de acción",
    desc: "Cada sesión cierra con compromisos concretos, medibles y con fecha — revisados en el siguiente encuentro sin excepción. Sin acción, no hay transformación.",
    tools: ["Manifiesto del líder", "Plan 90 días", "Compromisos verificables"],
  },
];

const ETAPA_ROMAN = ["I", "II", "III", "IV"];

const ETAPA_COLOR: Record<string, string> = {
  "Diagnóstico":    "#7F77DD",
  "Activación":     "#1D9E75",
  "Sostenimiento":  "#BA7517",
  "Transformación": "#D85A30",
};

const DIM_CFG: Record<string, { color: string; bg: string; icono: string }> = {
  vision:      { color: "#7F77DD", bg: "#F0EFFE", icono: "🎯" },
  decision:    { color: "#1D9E75", bg: "#E6FAF4", icono: "⚡" },
  influencia:  { color: "#0EA5E9", bg: "#E0F2FE", icono: "🤝" },
  ejecucion:   { color: "#BA7517", bg: "#FEF3C7", icono: "⚙️" },
  resiliencia: { color: "#D85A30", bg: "#FEE8E0", icono: "💪" },
  consciencia: { color: "#6366F1", bg: "#EEF2FF", icono: "🔍" },
};

const PHASE_COLORS = ["#7F77DD", "#1D9E75", "#BA7517", "#D85A30"];
const PHASE_ICONS  = ["🎯", "🔧", "🤝", "📊"];

const HERRAMIENTAS_VISTA = [
  {
    icono: "📡", nombre: "Radar del líder",
    etapa: "Diagnóstico", color: "#7F77DD", duracion: "10 min",
    desc: "Diagnóstico inicial de las 6 dimensiones del liderazgo ejecutivo. Establece la línea base honesta desde la que se medirá toda la transformación del programa.",
  },
  {
    icono: "🗺️", nombre: "Mapa de creencias",
    etapa: "Diagnóstico", color: "#7F77DD", duracion: "15 min",
    desc: "Identifica las creencias limitantes y potenciadoras que gobiernan las decisiones del líder. Revela los patrones invisibles que frenan o impulsan el desempeño.",
  },
  {
    icono: "👤", nombre: "Perfil de contexto",
    etapa: "Diagnóstico", color: "#7F77DD", duracion: "8 min",
    desc: "Captura el contexto organizacional, el equipo y los desafíos actuales del líder. Permite al coach diseñar sesiones calibradas a la realidad específica del cliente.",
  },
  {
    icono: "📜", nombre: "Manifiesto del líder",
    etapa: "Activación", color: "#1D9E75", duracion: "30 min",
    desc: "Define la declaración de liderazgo personal: quién elige ser, cómo decide y qué compromisos asume. Es el ancla de transformación del programa.",
  },
  {
    icono: "⚡", nombre: "Simulador de decisiones",
    etapa: "Activación", color: "#1D9E75", duracion: "20 min",
    desc: "Estructura situaciones reales de alta complejidad para practicar el proceso de decisión bajo presión. Convierte la teoría en músculo ejecutivo.",
  },
  {
    icono: "🪞", nombre: "Espejo de liderazgo",
    etapa: "Activación", color: "#1D9E75", duracion: "15 min",
    desc: "Confronta al líder con su impacto real en el equipo a través de retroalimentación estructurada. Es el punto de inflexión más poderoso del programa.",
  },
  {
    icono: "💓", nombre: "Pulso semanal",
    etapa: "Sostenimiento", color: "#BA7517", duracion: "3 min",
    desc: "Check-in de 3 minutos para mantener el foco y la energía entre sesiones. Registra avances, bloqueos y compromisos de la semana con precisión quirúrgica.",
  },
  {
    icono: "🎯", nombre: "Reto de 7 días",
    etapa: "Sostenimiento", color: "#BA7517", duracion: "15 min/día",
    desc: "Desafío práctico diario para instalar un nuevo comportamiento de liderazgo. Diseñado para producir cambio observable en una semana de práctica sostenida.",
  },
  {
    icono: "📚", nombre: "Biblioteca de preguntas poderosas",
    etapa: "Sostenimiento", color: "#BA7517", duracion: "libre",
    desc: "Colección de preguntas calibradas por dimensión e intensidad. Una pregunta precisa en el momento correcto mueve más que una hora de consejo directo.",
  },
  {
    icono: "🔚", nombre: "Radar de cierre",
    etapa: "Transformación", color: "#D85A30", duracion: "10 min",
    desc: "Segunda medición de las 6 dimensiones al finalizar el programa. El delta con el radar inicial es la evidencia más impactante de la transformación lograda.",
  },
  {
    icono: "📋", nombre: "Plan de continuidad 90 días",
    etapa: "Transformación", color: "#D85A30", duracion: "20 min",
    desc: "Diseña el plan de acción post-programa con métricas, testigos y revisiones periódicas. Asegura que el cambio se instale como hábito permanente.",
  },
  {
    icono: "📊", nombre: "Reporte de transformación",
    etapa: "Transformación", color: "#D85A30", duracion: "auto",
    desc: "Documento ejecutivo generado con IA que consolida los insights, compromisos cumplidos y la evolución del líder a lo largo de todo el programa.",
  },
];

// ── Main component ─────────────────────────────────────────────────────────────
function CoachingHome() {
  const [tab, setTab] = useState<TabId>("inicio");
  const [sesiones, setSesiones] = useState<SesionCoaching[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listarSesionesGlobal(), listarClientes()])
      .then(([s, c]) => { setSesiones(s); setClientes(c); })
      .finally(() => setLoading(false));
  }, []);

  const porCliente = useMemo(() => {
    const map = new Map<string, SesionCoaching[]>();
    sesiones.forEach((s) => {
      const arr = map.get(s.cliente_id) ?? [];
      arr.push(s);
      map.set(s.cliente_id, arr);
    });
    return map;
  }, [sesiones]);

  const clientesConCoaching = useMemo(
    () =>
      clientes
        .filter((c) => porCliente.has(c.id))
        .map((c) => {
          const sess = porCliente.get(c.id)!;
          const completadas = sess.filter((s) => s.completada).length;
          const pct = Math.round((completadas / HERRAMIENTAS_A360.length) * 100);
          const herramientasUsadas = new Set(sess.map((s) => s.herramienta_id));
          const proxima = HERRAMIENTAS_A360.find((h) => !herramientasUsadas.has(h.id));
          const etapaActual: string = proxima?.etapa ?? "Transformación";
          return { cliente: c, sesiones: sess, completadas, pct, proxima, etapaActual };
        }),
    [clientes, porCliente]
  );

  const globalCompletadas = useMemo(() => sesiones.filter((s) => s.completada).length, [sesiones]);
  const avgPct = useMemo(() => {
    if (clientesConCoaching.length === 0) return 0;
    return Math.round(clientesConCoaching.reduce((acc, c) => acc + c.pct, 0) / clientesConCoaching.length);
  }, [clientesConCoaching]);

  const heroStats = [
    { val: loading ? "—" : clientesConCoaching.length, lbl: "Clientes en programa" },
    { val: loading ? "—" : globalCompletadas,          lbl: "Herramientas completadas" },
    { val: HERRAMIENTAS_A360.length,                   lbl: "Herramientas del programa" },
    { val: ETAPAS_A360.length,                         lbl: "Etapas de transformación" },
  ];

  // ── Shared hero util ─────────────────────────────────────────────────────────
  function DarkHero({ bg, eyebrow, title, span, sub }: {
    bg: string; eyebrow: string; title: string; span: string; sub: string;
  }) {
    return (
      <section style={{ background: bg, padding: "56px 64px 64px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 70% 30%, rgba(255,255,255,0.07), transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: "680px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>{eyebrow}</div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "14px" }}>
            {title}<br />
            <span style={{ background: "rgba(255,255,255,0.9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{span}</span>
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, maxWidth: "520px", textAlign: "justify", margin: 0 }}>{sub}</p>
        </div>
      </section>
    );
  }

  // ── Tab: Inicio ──────────────────────────────────────────────────────────────
  function renderInicio() {
    return (
      <>
        {/* HERO */}
        <section style={{ background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 50%, #312E81 100%)", padding: "64px 64px 80px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(14,165,233,0.15), transparent 60%), radial-gradient(ellipse 40% 60% at 10% 80%, rgba(99,102,241,0.12), transparent 60%)" }} />
          <div style={{ position: "absolute", right: "-40px", bottom: "-60px", fontSize: "260px", fontWeight: 900, color: "rgba(255,255,255,0.03)", letterSpacing: "-0.06em", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>COACH</div>

          <div style={{ position: "relative", zIndex: 2, maxWidth: "680px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "5px 14px 5px 10px", fontSize: "12px", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px" }}>
              <span className="animate-pulse" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#0EA5E9", display: "inline-block" }} />
              Suite · Coaching Ejecutivo A360
            </div>

            <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "18px" }}>
              Acompañamiento para el líder<br />que sabe que solo<br />
              <span style={{ background: "linear-gradient(135deg, #38BDF8, #A5B4FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                no puede llegar más lejos.
              </span>
            </h1>

            <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.6)", lineHeight: 1.8, maxWidth: "520px", marginBottom: "24px", textAlign: "justify" }}>
              Sesiones estructuradas de 90 minutos. Metodología probada en más de 200 empresas latinoamericanas. Análisis con inteligencia artificial incluido en cada sesión.
            </p>

            {/* Promise card */}
            <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "16px 20px", marginBottom: "32px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {[
                { icon: "⏱", label: "90 min por sesión" },
                { icon: "🤖", label: "IA en cada sesión" },
                { icon: "🗺️", label: `${HERRAMIENTAS_A360.length} herramientas · 4 etapas` },
                { icon: "✅", label: "+200 empresas LatAm" },
              ].map(item => (
                <div key={item.label} style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "48px" }}>
              <Link to="/app/clientes" style={BTN_PRI}>Ver mis clientes</Link>
              <button onClick={() => setTab("metodologia")} style={BTN_GHO}>📋 Metodología completa</button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              {heroStats.map((s, i) => (
                <div key={i} style={{ paddingRight: "36px", marginRight: "36px", borderRight: i < heroStats.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                  <div style={{ fontSize: "36px", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* QUOTE */}
        <div style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)", padding: "44px 64px", display: "flex", alignItems: "center", gap: "28px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: "32px", top: "-10px", fontSize: "140px", color: "rgba(255,255,255,0.08)", lineHeight: 1, fontWeight: 900, pointerEvents: "none" }}>"</div>
          <div style={{ fontSize: "52px", flexShrink: 0, position: "relative", zIndex: 2 }}>💡</div>
          <div style={{ position: "relative", zIndex: 2 }}>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "white", lineHeight: 1.5, margin: 0 }}>
              "El coaching no te da las respuestas. Te hace las preguntas correctas para que encuentres las tuyas — y actúes en consecuencia."
            </p>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "8px", fontStyle: "italic", margin: "8px 0 0" }}>
              — Metodología Coaching A360SGP ·{" "}
              <button onClick={() => setTab("metodologia")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", textDecoration: "underline", cursor: "pointer", fontSize: "13px" }}>
                Ver metodología completa
              </button>
            </p>
          </div>
        </div>

        {/* TRANSFORMACIÓN */}
        <div style={{ background: "white", padding: "64px" }}>
          <div style={SL}><span style={SLL} />Lo que logra el programa</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "14px" }}>
            De líder reactivo a <span style={GT}>arquitecto estratégico</span>
          </h2>
          <p style={{ fontSize: "17px", color: "#64748B", lineHeight: 1.8, maxWidth: "560px", marginBottom: "48px", textAlign: "justify" }}>
            El coaching A360 está diseñado para producir una transformación real y medible en la forma en que liderás, decidís y construís tu empresa.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {TRANSFORM_ITEMS.map((item, i) => (
              <div key={i} style={{ background: "#F5F7FF", borderRadius: "18px", padding: "32px 28px", border: "1px solid #E0E7FF", textAlign: "center", transition: "all 0.2s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = "white"; el.style.transform = "translateY(-4px)"; el.style.boxShadow = "0 12px 32px rgba(14,165,233,0.1)"; el.style.borderColor = "#BAE6FD"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = "#F5F7FF"; el.style.transform = "none"; el.style.boxShadow = "none"; el.style.borderColor = "#E0E7FF"; }}
              >
                <div style={{ fontSize: "44px", marginBottom: "14px", opacity: 0.7 }}>{item.icon}</div>
                <div style={{ fontSize: "15px", color: "#94A3B8", marginBottom: "12px" }}>Antes: {item.before}</div>
                <div style={{ fontSize: "22px", fontWeight: 900, ...GT, marginBottom: "12px" }}>↓</div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "#0C4A6E" }}>{item.after}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RESUMEN DEL PROGRAMA */}
        <div style={{ background: "#F5F7FF", padding: "64px" }}>
          <div style={SL}><span style={SLL} />Resumen del programa</div>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em", marginBottom: "32px" }}>
            Estado actual del <span style={GT}>coaching A360</span>
          </h2>

          {/* 3 dark stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "24px" }}>
            {[
              { val: loading ? "—" : clientesConCoaching.length, lbl: "Clientes activos", sub: "Con sesiones registradas" },
              { val: loading ? "—" : globalCompletadas, lbl: "Herramientas completadas", sub: `de ${HERRAMIENTAS_A360.length} por cliente` },
              { val: loading ? "—" : `${avgPct}%`, lbl: "Progreso promedio", sub: "Avance del grupo" },
            ].map((s, i) => (
              <div key={i} style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", borderRadius: "16px", padding: "28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(14,165,233,0.2), transparent)", pointerEvents: "none" }} />
                <div style={{ fontSize: "40px", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1, position: "relative", zIndex: 2 }}>{s.val}</div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", marginTop: "6px", position: "relative", zIndex: 2 }}>{s.lbl}</div>
                <div style={{ fontSize: "12px", color: "#38BDF8", marginTop: "4px", fontWeight: 600, position: "relative", zIndex: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Card with 4 etapas + color badges */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E0E7FF", padding: "28px 32px" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", marginBottom: "20px" }}>Las 4 etapas del programa</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
              {ETAPAS_A360.map((et, i) => {
                const herrs = HERRAMIENTAS_A360.filter(h => h.etapa === et.id);
                return (
                  <div key={et.id} style={{ borderLeft: `3px solid ${et.color}`, paddingLeft: "14px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: et.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Etapa {i + 1}</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#0C4A6E", marginBottom: "6px" }}>{et.id}</div>
                    <div style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.5, marginBottom: "10px" }}>{et.descripcion.split("—")[0].trim()}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {herrs.map(h => (
                        <span key={h.id} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: `${et.color}18`, color: et.color, fontWeight: 600 }}>{h.nombre}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CLIENTES ACTIVOS — sin nombres */}
        <div style={{ background: "white", padding: "64px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={SL}><span style={SLL} />Programa en curso</div>
              <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em" }}>
                Clientes en <span style={GT}>coaching activo</span>
              </h2>
            </div>
            <Link to="/app/coaching/resultados" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "15px", fontWeight: 600, color: "#0EA5E9", textDecoration: "none" }}>
              <TrendingUp size={16} /> Ver resultados globales
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "64px" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
              <p style={{ fontSize: "15px", color: "#64748B" }}>Cargando clientes…</p>
            </div>
          ) : clientesConCoaching.length === 0 ? (
            <div style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE", borderRadius: "18px", padding: "64px", textAlign: "center" }}>
              <div style={{ fontSize: "56px", marginBottom: "20px" }}>✨</div>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0C4A6E", marginBottom: "10px" }}>Aún no hay sesiones registradas</h3>
              <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.8, maxWidth: "400px", margin: "0 auto 28px", textAlign: "justify" }}>
                Abre la ficha de cualquier cliente y ve a la pestaña "Coaching" para registrar la primera sesión.
              </p>
              <Link to="/app/clientes" style={BTN_PRI}>Ir a Mis clientes</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
              {clientesConCoaching.map(({ cliente, completadas, pct, etapaActual }) => {
                const etColor = ETAPA_COLOR[etapaActual] ?? "#0EA5E9";
                return (
                  <Link key={cliente.id} to="/app/clientes/$clienteId/coaching" params={{ clienteId: cliente.id }} style={{ textDecoration: "none" }}>
                    <div
                      style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "all 0.2s" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#BAE6FD"; el.style.boxShadow = "0 8px 28px rgba(14,165,233,0.1)"; el.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#E0E7FF"; el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; el.style.transform = "none"; }}
                    >
                      <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #E0E7FF" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                          {/* Anonymous avatar — solo inicial */}
                          <div style={{ width: "48px", height: "48px", borderRadius: "14px", flexShrink: 0, background: `linear-gradient(135deg, ${etColor}, ${etColor}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900, color: "white" }}>
                            {cliente.nombre_empresa[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Cliente en programa</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "13px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: `${etColor}18`, color: etColor }}>{etapaActual}</span>
                              <span style={{ fontSize: "13px", color: "#64748B" }}>{completadas} / {HERRAMIENTAS_A360.length} herramientas</span>
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: "right" }}>
                            <div style={{ fontSize: "24px", fontWeight: 900, color: pct >= 80 ? "#059669" : "#0C4A6E", letterSpacing: "-0.02em" }}>{pct}%</div>
                            <div style={{ fontSize: "11px", color: "#94A3B8" }}>avance</div>
                          </div>
                        </div>
                        <div style={{ height: "6px", background: "#E0E7FF", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: "999px", background: pct >= 80 ? "linear-gradient(90deg, #059669, #10B981)" : `linear-gradient(90deg, ${etColor}, ${etColor}88)`, width: `${pct}%`, transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                      <div style={{ padding: "12px 24px", display: "flex", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0EA5E9", display: "flex", alignItems: "center", gap: "4px" }}>
                          Abrir workspace <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A, #312E81)", padding: "72px 64px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "48px", flexWrap: "wrap", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 80% at 20% 50%, rgba(14,165,233,0.12), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ width: "48px", height: "4px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px", marginBottom: "18px" }} />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
              El siguiente nivel<br />
              <span style={{ background: "linear-gradient(135deg, #38BDF8, #A5B4FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>te está esperando.</span>
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", marginTop: "10px", lineHeight: 1.65 }}>Cada sesión de coaching es un punto de inflexión. El momento de actuar es ahora.</p>
          </div>
          <div style={{ position: "relative", zIndex: 2, flexShrink: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link to="/app/clientes" style={{ ...BTN_PRI, fontSize: "15px", padding: "16px 36px" }}>Ir a mis clientes →</Link>
            <Link to="/app/coaching/resultados" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 600 }}>
              <TrendingUp size={14} /> Ver resultados globales
            </Link>
          </div>
        </div>
      </>
    );
  }

  // ── Tab: Metodología ─────────────────────────────────────────────────────────
  function renderMetodologia() {
    return (
      <>
        <DarkHero
          bg="linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 50%, #312E81 100%)"
          eyebrow="Metodología A360 · Cómo funciona cada sesión"
          title="Una estructura probada"
          span="que produce resultados"
          sub="Cada sesión de 90 minutos sigue una metodología rigurosa que convierte la conversación en acción concreta. 4 pasos, sin excepción, en cada sesión del programa."
        />
        <div style={{ background: "white", padding: "64px" }}>
          <div style={{ maxWidth: "720px", position: "relative" }}>
            {/* Connecting line */}
            <div style={{ position: "absolute", left: "25px", top: "52px", bottom: "52px", width: "2px", background: "linear-gradient(180deg, #0EA5E9, #6366F1, #A5B4FC)" }} />

            {MET_STEPS.map((step, i) => (
              <div key={step.num} style={{ display: "flex", gap: "32px", marginBottom: i < MET_STEPS.length - 1 ? "56px" : 0, position: "relative" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #0EA5E9, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 2, boxShadow: "0 4px 16px rgba(14,165,233,0.35)", fontSize: "16px", fontWeight: 900, color: "white" }}>
                  {step.num}
                </div>
                <div style={{ flex: 1, paddingTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "28px" }}>{step.icon}</span>
                    <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#0C4A6E", letterSpacing: "-0.02em" }}>{step.title}</h3>
                  </div>
                  <p style={{ fontSize: "16px", color: "#475569", lineHeight: 1.8, textAlign: "justify", marginBottom: "16px" }}>{step.desc}</p>
                  <div style={{ background: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "10px", padding: "14px 16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Herramientas y recursos</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {step.tools.map(tool => (
                        <span key={tool} style={{ fontSize: "13px", padding: "5px 12px", borderRadius: "999px", background: "#E0F2FE", color: "#0369A1", fontWeight: 600 }}>{tool}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── Tab: Las 4 etapas ────────────────────────────────────────────────────────
  function renderEtapas() {
    return (
      <>
        <DarkHero
          bg="linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 50%, #312E81 100%)"
          eyebrow="Programa A360 · Mapa completo"
          title="Las 4 etapas de la"
          span="transformación ejecutiva"
          sub="El programa A360 sigue un arco progresivo de 12 semanas: de la línea base honesta al plan de continuidad verificado, con evidencia en cada etapa."
        />
        <div style={{ background: "#F5F7FF", padding: "64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
            {ETAPAS_A360.map((et, i) => {
              const herrs = HERRAMIENTAS_A360.filter(h => h.etapa === et.id);
              return (
                <div key={et.id}
                  style={{ background: "white", borderRadius: "20px", border: `1.5px solid ${et.color}30`, padding: "36px 32px", position: "relative", overflow: "hidden", transition: "all 0.2s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 12px 36px ${et.color}22`; el.style.borderColor = `${et.color}60`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; el.style.borderColor = `${et.color}30`; }}
                >
                  {/* Roman numeral watermark */}
                  <div style={{ position: "absolute", right: "-10px", bottom: "-20px", fontSize: "120px", fontWeight: 900, color: `${et.color}08`, lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>{ETAPA_ROMAN[i]}</div>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: et.color, borderRadius: "20px 20px 0 0" }} />

                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: et.color, textTransform: "uppercase", letterSpacing: "0.12em" }}>Etapa {i + 1}</span>
                      <span style={{ fontSize: "11px", color: "#94A3B8" }}>·</span>
                      <span style={{ fontSize: "11px", color: "#94A3B8" }}>{et.duracionTipica}</span>
                    </div>
                    <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "8px" }}>{et.id}</h3>
                    <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.8, textAlign: "justify" }}>{et.descripcion}</p>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Herramientas</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {herrs.map(h => (
                        <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: et.color, flexShrink: 0 }} />
                            <span style={{ fontSize: "15px", color: "#374151" }}>{h.nombre}</span>
                          </div>
                          <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>{h.duracion}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ height: "6px", background: "#F0F4FF", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(i + 1) * 25}%`, background: `linear-gradient(90deg, ${et.color}, ${et.color}88)`, borderRadius: "999px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>Posición en el programa</div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: et.color }}>{(i + 1) * 25}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // ── Tab: Herramientas ────────────────────────────────────────────────────────
  function renderHerramientas() {
    return (
      <>
        <DarkHero
          bg="linear-gradient(135deg, #0C4A6E, #1E3A8A)"
          eyebrow="Programa A360 · Catálogo completo"
          title="Las 12 herramientas"
          span="del programa"
          sub="Una herramienta para cada momento del proceso de transformación. Cada una tiene un propósito claro, una duración estimada y su lugar en el arco del programa."
        />
        <div style={{ background: "#F5F7FF", padding: "64px" }}>
          <div style={SL}><span style={SLL} />Catálogo de herramientas</div>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em", marginBottom: "40px" }}>
            Todas las herramientas, <span style={GT}>sin excepción</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {HERRAMIENTAS_VISTA.map((h, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  border: "1px solid #E0E7FF",
                  borderTop: `3px solid ${h.color}`,
                  padding: "28px 24px",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translateY(-4px)";
                  el.style.boxShadow = `0 12px 32px ${h.color}28`;
                  el.style.borderColor = `${h.color}50`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "none";
                  el.style.boxShadow = "none";
                  el.style.borderColor = "#E0E7FF";
                }}
              >
                {/* Icon + name row */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "14px", flexShrink: 0,
                    background: `${h.color}12`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "26px",
                  }}>
                    {h.icono}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E", lineHeight: 1.3, marginBottom: "8px" }}>
                      {h.nombre}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: 700,
                        padding: "3px 9px", borderRadius: "999px",
                        background: `${h.color}18`, color: h.color,
                      }}>
                        {h.etapa}
                      </span>
                      <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>
                        ⏱ {h.duracion}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Description */}
                <p style={{
                  fontSize: "15px", color: "#64748B",
                  lineHeight: 1.8, textAlign: "justify",
                  margin: 0, flexGrow: 1,
                }}>
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── Tab: Radar 6 dimensiones ─────────────────────────────────────────────────
  function renderRadar() {
    return (
      <>
        <DarkHero
          bg="linear-gradient(135deg, #5B54C7 0%, #312E81 100%)"
          eyebrow="Radar A360 · Línea base de liderazgo"
          title="Las 6 dimensiones del"
          span="liderazgo ejecutivo"
          sub="El radar A360 mide 6 dimensiones críticas en la apertura y el cierre del programa. El delta entre ambas mediciones es el dato que más impacta a los líderes."
        />
        <div style={{ background: "#F5F7FF", padding: "64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {RADAR_DIMENSIONES.map((dim) => {
              const cfg = DIM_CFG[dim.id] ?? { color: "#6366F1", bg: "#EEF2FF", icono: "📌" };
              return (
                <div key={dim.id}
                  style={{ background: "white", borderRadius: "16px", border: `1.5px solid ${cfg.color}20`, borderLeft: `4px solid ${cfg.color}`, padding: "28px 24px", transition: "all 0.2s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 8px 28px ${cfg.color}18`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div style={{ width: "52px", height: "52px", borderRadius: "14px", flexShrink: 0, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>
                      {cfg.icono}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0C4A6E", letterSpacing: "-0.01em", marginBottom: "8px" }}>{dim.nombre}</h3>
                      <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.8, textAlign: "justify", margin: 0 }}>{dim.descripcion}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // ── Tab: Plan 90 días ────────────────────────────────────────────────────────
  function renderPlan90() {
    return (
      <>
        <DarkHero
          bg="linear-gradient(135deg, #BA7517 0%, #D85A30 100%)"
          eyebrow="Transformación · Fase final del programa"
          title="Plan de continuidad"
          span="90 días"
          sub="El cambio no termina al salir del programa. El Plan de 90 días garantiza que lo aprendido se instale como hábito permanente, con testigos y métricas propias."
        />
        <div style={{ background: "#F5F7FF", padding: "64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {PLAN_CONTINUIDAD_FASES.map((fase, i) => {
              const color = PHASE_COLORS[i];
              const icon  = PHASE_ICONS[i];
              return (
                <div key={fase.id}
                  style={{ background: "white", borderRadius: "16px", border: `1.5px solid ${color}20`, padding: "32px 28px", position: "relative", overflow: "hidden", transition: "all 0.2s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-3px)"; el.style.boxShadow = `0 8px 28px ${color}18`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; }}
                >
                  <div style={{ position: "absolute", right: "16px", top: "16px", fontSize: "80px", fontWeight: 900, color: `${color}08`, lineHeight: 1, pointerEvents: "none" }}>{i + 1}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{fase.label}</div>
                      <div style={{ fontSize: "18px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>{fase.titulo}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.8, textAlign: "justify", marginBottom: "20px" }}>{fase.desc}</p>
                  <div style={{ height: "4px", background: "#F0F4FF", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(i + 1) * 25}%`, background: color, borderRadius: "999px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // ── Tab: Preguntas poderosas ─────────────────────────────────────────────────
  function renderPreguntas() {
    const total = Object.values(PREGUNTAS_POR_DIMENSION).flat().length;
    return (
      <>
        <DarkHero
          bg="linear-gradient(135deg, #BA7517 0%, #92400E 100%)"
          eyebrow="Sostenimiento · Herramienta de conversación"
          title="Biblioteca de"
          span="preguntas poderosas"
          sub={`${total}+ preguntas calibradas por dimensión e intensidad. Una pregunta poderosa dosificada en el momento correcto puede mover más que una hora de consejo.`}
        />
        <div style={{ background: "#F5F7FF", padding: "64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
            {RADAR_DIMENSIONES.map((dim) => {
              const cfg = DIM_CFG[dim.id] ?? { color: "#6366F1", bg: "#EEF2FF", icono: "📌" };
              const preguntas = PREGUNTAS_POR_DIMENSION[dim.id] ?? [];
              return (
                <div key={dim.id} style={{ background: "white", borderRadius: "16px", border: "1px solid #E0E7FF", borderLeft: `4px solid ${cfg.color}`, overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ background: `${cfg.color}12`, padding: "18px 22px", borderBottom: `1px solid ${cfg.color}20`, display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{cfg.icono}</span>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#0C4A6E" }}>{dim.nombre}</div>
                      <div style={{ fontSize: "12px", color: cfg.color, fontWeight: 600 }}>{preguntas.length} preguntas</div>
                    </div>
                  </div>
                  {/* Questions */}
                  <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {preguntas.map((pregunta, qi) => (
                      <div key={qi} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <span style={{ width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, background: `${cfg.color}18`, color: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, marginTop: "2px" }}>{qi + 1}</span>
                        <p style={{ fontSize: "15px", color: "#374151", lineHeight: 1.8, textAlign: "justify", margin: 0 }}>{pregunta}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 bg-[#F5F7FF]">
      {/* Sticky dark internal navbar — 2-row grid: 4 cols on md+, 2 cols on mobile */}
      <nav
        className="grid grid-cols-2 md:grid-cols-4"
        style={{
          background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)",
          position: "sticky", top: 0, zIndex: 40,
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "16px 14px",
              fontSize: "15px",
              fontWeight: tab === t.id ? 700 : 600,
              color: tab === t.id ? "#38BDF8" : "rgba(255,255,255,0.55)",
              background: "transparent",
              border: "none",
              borderBottom: tab === t.id ? "3px solid #0EA5E9" : "3px solid transparent",
              borderTop: "3px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              outline: "none",
              width: "100%",
            }}
          >
            {t.label}
            {t.badge !== undefined && (
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px", background: tab === t.id ? "#0EA5E9" : "rgba(255,255,255,0.15)", color: "white", minWidth: "22px", textAlign: "center" }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === "inicio"      && renderInicio()}
      {tab === "metodologia" && renderMetodologia()}
      {tab === "etapas"        && renderEtapas()}
      {tab === "herramientas" && renderHerramientas()}
      {tab === "radar"         && renderRadar()}
      {tab === "plan90"      && renderPlan90()}
      {tab === "preguntas"   && renderPreguntas()}
    </div>
  );
}
