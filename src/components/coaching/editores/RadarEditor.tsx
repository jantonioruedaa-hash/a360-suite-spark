import { useMemo } from "react";
import { RADAR_DIMENSIONES } from "@/lib/coaching-catalogo";

// ── Metadata por dimensión: íconos y preguntas de reflexión ───────────────────
const DIM_META: Record<string, {
  icon: string;
  badge: string;
  preguntas: Array<{ texto: string; hint: string }>;
}> = {
  vision: {
    icon: "🧭", badge: "01",
    preguntas: [
      { texto: "¿Tu equipo puede describir con claridad hacia dónde va la empresa en los próximos 3 años? ¿Cómo lo sabes con certeza?", hint: "Piensa en la última vez que preguntaste a alguien del equipo sobre la visión. ¿Qué respondió exactamente?" },
      { texto: "¿Cuándo fue la última vez que ajustaste la estrategia de tu empresa? ¿Qué te llevó a hacerlo o qué te ha impedido hacerlo?", hint: "La estrategia que no se revisa se vuelve obsoleta. La rigidez estratégica es tan peligrosa como la falta de dirección." },
    ],
  },
  decision: {
    icon: "⚡", badge: "02",
    preguntas: [
      { texto: "¿Qué información te falta para decidir hoy, y por qué no la has buscado todavía?", hint: "Identifica si la parálisis viene de falta de datos o de miedo a equivocarte — son causas muy distintas con soluciones distintas." },
      { texto: "¿Qué decisiones importantes estás postergando en este momento? ¿Qué está pasando realmente?", hint: "El costo de no decidir es invisible pero acumulativo. Cada decisión postergada drena energía y credibilidad." },
    ],
  },
  influencia: {
    icon: "🗣️", badge: "03",
    preguntas: [
      { texto: "¿Quién en tu organización se anima a decirte que NO o a contradecirte? ¿Qué dice eso sobre el clima que has construido?", hint: "La cantidad de personas que se animan a contradecirte es un termómetro directo de la seguridad psicológica de tu organización." },
      { texto: "Si mañana perdieras tu cargo, ¿cuántas personas te seguirían igualmente? ¿En base a qué te seguirían?", hint: "La influencia genuina no depende del título — depende de tu credibilidad, coherencia y genuino cuidado por las personas." },
    ],
  },
  ejecucion: {
    icon: "🚀", badge: "04",
    preguntas: [
      { texto: "¿Qué proyecto importante llevas más de 90 días sin cerrar? ¿Cuál es la razón real de esa demora?", hint: "Los proyectos zombi consumen energía sin producir resultados. Identifica qué bucles abiertos te están restando capacidad mental." },
      { texto: "¿Tu equipo sabe exactamente qué significa 'terminado' para ti en los proyectos clave? ¿Cómo lo definiste?", hint: "La ambigüedad en los criterios de éxito es la causa número uno de retrabajos, frustración y ejecución deficiente." },
    ],
  },
  resiliencia: {
    icon: "💪", badge: "05",
    preguntas: [
      { texto: "¿Cuál es tu reserva de energía real hoy de 1 a 10? ¿Qué la está drenando más en este momento?", hint: "Un líder agotado toma peores decisiones, tiene menos tolerancia y genera más incertidumbre en el equipo. No es sostenible ignorarlo." },
      { texto: "¿De qué fracaso reciente aún no te has recuperado del todo? ¿Qué te impide cerrar ese capítulo?", hint: "El tiempo de recuperación emocional es un indicador clave de resiliencia. No se trata de no caer — se trata de cuánto tardas en volver." },
    ],
  },
  consciencia: {
    icon: "🔍", badge: "06",
    preguntas: [
      { texto: "¿Qué dirían de tu estilo de liderazgo tus 3 colaboradores más cercanos si supieran que no los escuchas?", hint: "La brecha entre cómo crees que liderás y cómo te perciben otros es el mayor punto ciego del liderazgo — y el más costoso." },
      { texto: "¿Qué patrón se repite en tus equipos sin importar dónde trabajes? ¿Qué dice ese patrón sobre ti como líder?", hint: "Los patrones que persisten en distintos contextos suelen tener su raíz en el líder, no en el equipo ni en la empresa." },
    ],
  },
};

// ── Focus / blur handlers ──────────────────────────────────────────────────────
const onFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
  e.target.style.borderColor = "#0EA5E9";
  e.target.style.boxShadow = "0 0 0 4px rgba(14,165,233,0.1)";
};
const onBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
  e.target.style.borderColor = "#E0E7FF";
  e.target.style.boxShadow = "none";
};

// ── SVG Radar Chart hexagonal ─────────────────────────────────────────────────
function RadarChartSVG({
  valores,
  anteriores,
}: {
  valores: Record<string, number>;
  anteriores?: Record<string, number>;
}) {
  const SIZE = 320, C = SIZE / 2, R = 120;
  const n = RADAR_DIMENSIONES.length;
  const step = (2 * Math.PI) / n;

  const pt = (angle: number, r: number) => ({
    x: C + r * Math.cos(angle - Math.PI / 2),
    y: C + r * Math.sin(angle - Math.PI / 2),
  });

  const levels = [2, 4, 6, 8, 10];

  const dataPoints = RADAR_DIMENSIONES.map((d, i) => {
    const v = Math.max(1, Math.min(10, Number(valores[d.id] ?? 5)));
    return pt(i * step, (v / 10) * R);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  const prevPoints = anteriores
    ? RADAR_DIMENSIONES.map((d, i) => {
        const v = Math.max(1, Math.min(10, Number(anteriores[d.id] ?? 5)));
        return pt(i * step, (v / 10) * R);
      })
    : null;
  const prevPath = prevPoints
    ? prevPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z"
    : null;

  const labelPositions = RADAR_DIMENSIONES.map((_, i) => pt(i * step, R + 26));

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", maxWidth: "300px", overflow: "visible" }}>
      <defs>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0EA5E9" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Grid hexagons */}
      {levels.map((l) => {
        const r = (l / 10) * R;
        const pts = RADAR_DIMENSIONES.map((_, i) => {
          const p = pt(i * step, r);
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        }).join(" ");
        return <polygon key={l} points={pts} fill="none" stroke={l === 10 ? "#C7D2FE" : "#E0E7FF"} strokeWidth={l === 10 ? 1.5 : 1} />;
      })}

      {/* Level numbers */}
      {levels.map((l) => {
        const p = pt(0, (l / 10) * R + 2);
        return <text key={l} x={(p.x + 5).toFixed(1)} y={p.y.toFixed(1)} fontSize="9" fill="#94A3B8" dominantBaseline="middle">{l}</text>;
      })}

      {/* Axis lines */}
      {RADAR_DIMENSIONES.map((_, i) => {
        const p = pt(i * step, R);
        return <line key={i} x1={C} y1={C} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#C7D2FE" strokeWidth="1.5" />;
      })}

      {/* Previous data overlay */}
      {prevPath && (
        <path d={prevPath} fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="5,4" />
      )}

      {/* Data area */}
      <path d={dataPath} fill="rgba(14,165,233,0.15)" stroke="url(#rg)" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Data points */}
      {dataPoints.map((p, i) => {
        const v = Number(valores[RADAR_DIMENSIONES[i].id] ?? 5);
        const fill = v >= 7 ? "#059669" : v >= 5 ? "#0EA5E9" : "#EF4444";
        return <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="7" fill={fill} stroke="white" strokeWidth="2.5" style={{ filter: "drop-shadow(0 2px 6px rgba(14,165,233,0.4))" }} />;
      })}

      {/* Dimension labels */}
      {RADAR_DIMENSIONES.map((d, i) => {
        const p = labelPositions[i];
        const v = Number(valores[d.id] ?? 5);
        const anchor = p.x < C - 10 ? "end" : p.x > C + 10 ? "start" : "middle";
        const scoreColor = v >= 7 ? "#059669" : v >= 5 ? "#0C4A6E" : "#EF4444";
        const meta = DIM_META[d.id];
        return (
          <g key={i}>
            <text x={p.x.toFixed(1)} y={(p.y - 7).toFixed(1)} textAnchor={anchor} dominantBaseline="middle" fontSize="10" fill="#0C4A6E" fontWeight="700">
              {meta?.icon} {d.nombre}
            </text>
            <text x={p.x.toFixed(1)} y={(p.y + 7).toFixed(1)} textAnchor={anchor} dominantBaseline="middle" fontSize="12" fill={scoreColor} fontWeight="900">
              {v}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RadarEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const respuestas: Record<string, number> = datos.respuestas ?? {};
  const reflexiones: Record<string, string> = datos.reflexiones ?? {};
  const snapshot: Record<string, number> | undefined = datos.snapshot;

  const upd = (id: string, val: number) =>
    setDatos({ ...datos, respuestas: { ...respuestas, [id]: val } });
  const updRef = (id: string, txt: string) =>
    setDatos({ ...datos, reflexiones: { ...reflexiones, [id]: txt } });
  const guardarSnapshot = () =>
    setDatos({ ...datos, snapshot: { ...respuestas } });

  const promedio = useMemo(
    () => RADAR_DIMENSIONES.reduce((acc, d) => acc + (Number(respuestas[d.id]) || 5), 0) / RADAR_DIMENSIONES.length,
    [respuestas]
  );

  const { masAlta, masBaja } = useMemo(() => {
    let alta = RADAR_DIMENSIONES[0], baja = RADAR_DIMENSIONES[0];
    RADAR_DIMENSIONES.forEach(d => {
      const v = Number(respuestas[d.id] ?? 5);
      if (v > (Number(respuestas[alta.id] ?? 5))) alta = d;
      if (v < (Number(respuestas[baja.id] ?? 5))) baja = d;
    });
    return { masAlta: alta, masBaja: baja };
  }, [respuestas]);

  const snapshotPromedio = snapshot
    ? RADAR_DIMENSIONES.reduce((acc, d) => acc + (Number(snapshot[d.id]) || 5), 0) / RADAR_DIMENSIONES.length
    : null;
  const delta = snapshotPromedio !== null ? promedio - snapshotPromedio : null;

  const levelLabel = (v: number) =>
    v >= 7 ? "✓ Avanzado" : v >= 5 ? "En desarrollo" : "⚠ Área crítica";
  const levelStyle = (v: number): React.CSSProperties =>
    v >= 7
      ? { background: "#ECFDF5", color: "#065F46" }
      : v >= 5
      ? { background: "#EFF6FF", color: "#0369A1" }
      : { background: "#FEF2F2", color: "#7F1D1D" };
  const scoreColor = (v: number) => v >= 7 ? "#059669" : v >= 5 ? "#0EA5E9" : "#EF4444";
  const barGradient = (v: number) =>
    v >= 7 ? "linear-gradient(90deg, #059669, #10B981)"
    : v >= 5 ? "linear-gradient(90deg, #0EA5E9, #6366F1)"
    : "linear-gradient(90deg, #EF4444, #F97316)";

  const DIVIDER = (
    <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #C7D2FE, transparent)", margin: "32px 0" }} />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

      {/* ── Insight card ──────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE", borderRadius: "14px", padding: "22px 26px", display: "flex", gap: "16px", marginBottom: "28px" }}>
        <span style={{ fontSize: "28px", flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E", marginBottom: "5px" }}>¿Para qué sirve el Radar de Liderazgo?</div>
          <div style={{ fontSize: "15px", color: "#475569", lineHeight: 1.8, textAlign: "justify" as const }}>
            El Radar no juzga ni califica — revela. Cada dimensión representa un área crítica del liderazgo ejecutivo que determina tu capacidad para construir, escalar y sostener una organización de alto desempeño. Complétalo con total honestidad — cuanto más preciso sea tu autodiagnóstico, más poderoso será el plan de desarrollo que construiremos juntos.
          </div>
        </div>
      </div>

      {/* ── Dashboard: SVG Radar + 3 stat cards ──────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "8px" }}>
        {/* SVG Radar */}
        <div style={{ background: "white", borderRadius: "20px", border: "1px solid #E0E7FF", padding: "28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#0C4A6E", marginBottom: "20px", textAlign: "center" }}>
            Perfil de liderazgo · Medición actual
          </div>
          <RadarChartSVG valores={respuestas} anteriores={snapshot} />
          <div style={{ display: "flex", gap: "16px", marginTop: "16px", fontSize: "12px", color: "#64748B" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "linear-gradient(135deg,#0EA5E9,#6366F1)" }} />
              Medición actual
            </div>
            {snapshot && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", border: "1.5px dashed #CBD5E1" }} />
                Medición anterior
              </div>
            )}
          </div>
        </div>

        {/* 3 Stat cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Índice global */}
          <div style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", borderRadius: "16px", padding: "22px 24px", position: "relative", overflow: "hidden", flex: 1 }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(14,165,233,0.2), transparent)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "44px", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>{promedio.toFixed(1)}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "5px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Índice global de liderazgo</div>
              {delta !== null && (
                <div style={{ fontSize: "13px", color: "#38BDF8", marginTop: "4px", fontWeight: 600 }}>
                  {delta >= 0 ? "↑" : "↓"} {delta >= 0 ? "+" : ""}{delta.toFixed(1)} vs medición anterior
                </div>
              )}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 14px", borderRadius: "999px", background: "linear-gradient(135deg, #0EA5E9, #6366F1)", color: "white", fontSize: "12px", fontWeight: 700, marginTop: "10px" }}>
                ⭐ {promedio >= 7 ? "Liderazgo sólido" : promedio >= 5 ? "Liderazgo en desarrollo" : "Área de mejora prioritaria"}
              </div>
            </div>
          </div>

          {/* Dimensión más fuerte */}
          <div style={{ background: "linear-gradient(135deg, #065F46, #059669)", borderRadius: "16px", padding: "18px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(16,185,129,0.2), transparent)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {Number(respuestas[masAlta.id] ?? 5).toFixed(0)}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Dimensión más fuerte · {DIM_META[masAlta.id]?.icon} {masAlta.nombre}
              </div>
              <div style={{ fontSize: "12px", color: "#6EE7B7", marginTop: "3px", fontWeight: 600 }}>Fortaleza clave del programa</div>
            </div>
          </div>

          {/* Área crítica */}
          <div style={{ background: "linear-gradient(135deg, #7F1D1D, #EF4444)", borderRadius: "16px", padding: "18px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(239,68,68,0.15), transparent)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {Number(respuestas[masBaja.id] ?? 5).toFixed(0)}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Área prioritaria · {DIM_META[masBaja.id]?.icon} {masBaja.nombre}
              </div>
              <div style={{ fontSize: "12px", color: "#FCA5A5", marginTop: "3px", fontWeight: 600 }}>
                ⚠ Foco de desarrollo inmediato
              </div>
            </div>
          </div>
        </div>
      </div>

      {DIVIDER}

      {/* ── Section label ────────────────────────────────────────────────────── */}
      <div style={{ fontSize: "11px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
        Las 6 dimensiones
      </div>
      <h3 style={{ fontSize: "24px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em", marginBottom: "8px" }}>
        Evalúa cada área de <span style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>tu liderazgo</span>
      </h3>
      <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.8, marginBottom: "28px", textAlign: "justify" as const }}>
        Asigna una puntuación del 1 al 10 a cada dimensión con total honestidad. No hay respuestas correctas — hay respuestas honestas que generan planes de desarrollo poderosos.
      </p>

      {/* ── 6 Dimension cards — grid 2 columnas ──────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "8px" }}>
        {RADAR_DIMENSIONES.map((d, idx) => {
          const val = Number(respuestas[d.id] ?? 5);
          const meta = DIM_META[d.id];
          return (
            <div
              key={d.id}
              style={{ background: "white", borderRadius: "18px", border: "1px solid #E0E7FF", padding: "24px", cursor: "default", position: "relative", overflow: "hidden", transition: "all 0.25s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = "0 16px 40px rgba(14,165,233,0.12)"; el.style.borderColor = "#BAE6FD"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; el.style.borderColor = "#E0E7FF"; }}
            >
              {/* Background number */}
              <div style={{ position: "absolute", right: "10px", bottom: "-12px", fontSize: "80px", fontWeight: 900, opacity: 0.05, lineHeight: 1, color: "#0C4A6E", userSelect: "none", pointerEvents: "none" }}>
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{meta?.icon}</div>
                  <div style={{ fontSize: "17px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em", marginBottom: "5px" }}>{d.nombre}</div>
                  <div style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6, textAlign: "justify" as const }}>{d.descripcion}</div>
                </div>
                <div style={{ fontSize: "52px", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, flexShrink: 0, marginLeft: "12px", color: scoreColor(val) }}>
                  {val}
                </div>
              </div>
              <div style={{ height: "8px", background: "#F0F4FF", borderRadius: "999px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ height: "100%", borderRadius: "999px", background: barGradient(val), width: `${val * 10}%`, transition: "width 0.5s ease" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "999px", ...levelStyle(val) }}>
                  {levelLabel(val)}
                </span>
                <span style={{ fontSize: "12px", color: "#0EA5E9", fontWeight: 600 }}>Reflexión ↓</span>
              </div>
            </div>
          );
        })}
      </div>

      {DIVIDER}

      {/* ── Reflection blocks ─────────────────────────────────────────────────── */}
      <div style={{ fontSize: "11px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
        Reflexión y autoevaluación profunda
      </div>
      <h3 style={{ fontSize: "24px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em", marginBottom: "8px" }}>
        Profundiza en cada <span style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>dimensión</span>
      </h3>
      <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.8, marginBottom: "28px", textAlign: "justify" as const }}>
        Para cada dimensión evalúa tu puntuación y responde las preguntas de reflexión. Estas respuestas son la base del plan de desarrollo personalizado.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "8px" }}>
        {RADAR_DIMENSIONES.map((d, idx) => {
          const val = Number(respuestas[d.id] ?? 5);
          const meta = DIM_META[d.id];
          const isCritical = val < 5;
          const borderColor = isCritical ? "#FCA5A5" : "#E0E7FF";
          const numBg = isCritical ? "linear-gradient(135deg, #EF4444, #F97316)" : "linear-gradient(135deg, #0EA5E9, #6366F1)";
          const qCardStyle: React.CSSProperties = isCritical
            ? { background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)", borderLeft: "4px solid #EF4444", borderRadius: "0 12px 12px 0", padding: "18px 22px", marginBottom: "14px" }
            : { background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", borderLeft: "4px solid #0EA5E9", borderRadius: "0 12px 12px 0", padding: "18px 22px", marginBottom: "14px" };

          return (
            <div key={d.id} style={{ background: "white", borderRadius: "18px", border: `1px solid ${borderColor}`, padding: "28px", transition: "all 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#BAE6FD"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = borderColor}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 900, color: "white", background: numBg, flexShrink: 0, boxShadow: "0 4px 12px rgba(14,165,233,0.3)" }}>
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#0C4A6E" }}>
                    {meta?.icon} {d.nombre}
                    {isCritical && <span style={{ fontSize: "13px", color: "#EF4444", fontWeight: 600, marginLeft: "8px" }}>⚠ Área prioritaria</span>}
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                    {isCritical ? "Tu mayor oportunidad de crecimiento como líder" : `Nivel ${levelLabel(val).toLowerCase()}`}
                  </div>
                </div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: scoreColor(val) }}>{val}/10</div>
              </div>

              {/* Critical alert */}
              {isCritical && (
                <div style={{ background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)", border: "1.5px solid #FCA5A5", borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "12px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>🎯</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#7F1D1D", marginBottom: "4px" }}>Esta dimensión requiere atención inmediata</div>
                    <div style={{ fontSize: "13px", color: "#7F1D1D", lineHeight: 1.65, textAlign: "justify" as const }}>
                      Una puntuación de {val} indica que esta área está limitando tu capacidad de escalar como líder. Esta será una de las dimensiones de mayor impacto en las próximas sesiones del programa.
                    </div>
                  </div>
                </div>
              )}

              {/* Score buttons 1-10 */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                  <span>Tu puntuación</span>
                  <span style={{ color: scoreColor(val), fontWeight: 800 }}>{val} — {levelLabel(val)}</span>
                </div>
                <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                    const active = val === n;
                    const activeGrad = isCritical && n < 5
                      ? "linear-gradient(135deg, #EF4444, #F97316)"
                      : "linear-gradient(135deg, #0EA5E9, #6366F1)";
                    return (
                      <button
                        key={n}
                        onClick={() => upd(d.id, n)}
                        style={{
                          flex: 1, padding: "10px 4px", borderRadius: "8px",
                          border: `1.5px solid ${active ? "transparent" : "#E0E7FF"}`,
                          background: active ? activeGrad : "white",
                          fontSize: "13px", fontWeight: 700,
                          color: active ? "white" : "#64748B",
                          cursor: "pointer",
                          boxShadow: active ? "0 4px 12px rgba(14,165,233,0.3)" : "none",
                          transition: "all 0.15s",
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8" }}>
                  <span>1 — Inicial</span><span>5 — Competente</span><span>10 — Maestría</span>
                </div>
              </div>

              {/* 2 Reflection questions */}
              {meta?.preguntas.map((pq, qi) => (
                <div key={qi}>
                  <div style={qCardStyle}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: isCritical ? "#EF4444" : "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>
                      {isCritical ? "Pregunta prioritaria" : "Pregunta de reflexión"} {String(qi + 1).padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", lineHeight: 1.5 }}>{pq.texto}</div>
                    <div style={{ fontSize: "13px", color: "#64748B", marginTop: "5px", fontStyle: "italic" }}>{pq.hint}</div>
                  </div>
                  <textarea
                    style={{ width: "100%", padding: "16px 18px", border: "1.5px solid #E0E7FF", borderRadius: "12px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", resize: "vertical", minHeight: "140px", outline: "none", lineHeight: 1.8, transition: "all 0.15s", marginBottom: qi === 0 ? "16px" : "0" }}
                    value={reflexiones[`${d.id}_${qi}`] ?? ""}
                    onChange={(e) => updRef(`${d.id}_${qi}`, e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={qi === 0 ? `Escribe tu reflexión sobre ${d.nombre} — sé específico con ejemplos concretos...` : "Describe la situación con honestidad..."}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Comparativa ───────────────────────────────────────────────────────── */}
      {snapshot ? (
        <>
          {DIVIDER}
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ display: "inline-block", width: "28px", height: "3px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px" }} />
            Evolución del liderazgo
          </div>
          <h3 style={{ fontSize: "24px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            Tu progreso <span style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>en el tiempo</span>
          </h3>
          <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.8, marginBottom: "24px", textAlign: "justify" as const }}>
            Comparativa entre la medición guardada como referencia y la medición actual. Cada punto de mejora representa trabajo real y decisiones valientes.
          </p>
          <div style={{ background: "white", borderRadius: "18px", border: "1px solid #E0E7FF", padding: "28px", marginBottom: "8px" }}>
            {RADAR_DIMENSIONES.map((d) => {
              const prev = Number(snapshot[d.id] ?? 5);
              const curr = Number(respuestas[d.id] ?? 5);
              const meta = DIM_META[d.id];
              return (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 0", borderBottom: "1px solid #F0F4FF" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E", width: "160px", flexShrink: 0 }}>
                    {meta?.icon} {d.nombre}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ fontSize: "11px", color: "#94A3B8", width: "55px", flexShrink: 0 }}>Anterior</div>
                      <div style={{ flex: 1, height: "8px", background: "#F0F4FF", borderRadius: "999px", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "999px", background: "#CBD5E1", width: `${prev * 10}%` }} />
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#94A3B8", width: "30px", textAlign: "right" as const }}>{prev}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ fontSize: "11px", color: "#94A3B8", width: "55px", flexShrink: 0 }}>Actual</div>
                      <div style={{ flex: 1, height: "8px", background: "#F0F4FF", borderRadius: "999px", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "999px", background: barGradient(curr), width: `${curr * 10}%` }} />
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: scoreColor(curr), width: "30px", textAlign: "right" as const }}>{curr}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {/* ── Actions ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "24px 0 4px", borderTop: "1px solid #E0E7FF", marginTop: "24px", flexWrap: "wrap" }}>
        <button
          onClick={guardarSnapshot}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "12px 22px", borderRadius: "10px", background: "white", color: "#0369A1", fontSize: "14px", fontWeight: 600, border: "1.5px solid #BAE6FD", cursor: "pointer", transition: "all 0.15s" }}
          title={snapshot ? "Actualizar medición de referencia para la comparativa" : "Guardar como referencia para futuras comparaciones"}
        >
          📸 {snapshot ? "Actualizar referencia" : "Guardar como referencia"}
        </button>
        <div style={{ marginLeft: "auto", fontSize: "13px", color: "#94A3B8", display: "flex", alignItems: "center", gap: "6px" }}>
          ✓ Los cambios se guardan al cerrar la sesión
        </div>
      </div>

    </div>
  );
}
