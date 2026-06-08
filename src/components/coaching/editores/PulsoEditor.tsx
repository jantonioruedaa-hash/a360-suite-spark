// Etapa III — Sostenimiento · Color #BA7517 (naranja)
const C = {
  hero:   "linear-gradient(135deg, #78350F 0%, #92400E 50%, #B45309 100%)",
  accent: "#BA7517",
  span:   "linear-gradient(135deg, #FCD34D, #FDE68A)",
  qBg:    "linear-gradient(135deg, #FEF3C7, #FDE68A55)",
  qBorder: "#BA7517",
  active: "linear-gradient(135deg, #BA7517, #EF4444)",
};

const TA: React.CSSProperties = { width: "100%", padding: "16px 18px", border: "1.5px solid #E0E7FF", borderRadius: "12px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.75, resize: "vertical", minHeight: "140px", transition: "all 0.15s" };

const foc = (e: React.FocusEvent<HTMLTextAreaElement>) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px ${C.accent}25`; };
const blu = (e: React.FocusEvent<HTMLTextAreaElement>) => { e.target.style.borderColor = "#E0E7FF"; e.target.style.boxShadow = "none"; };

const MOMENTUM_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1:  { label: "Paralizado", emoji: "🔴", color: "#EF4444" },
  2:  { label: "Muy bajo", emoji: "🔴", color: "#EF4444" },
  3:  { label: "Bajo", emoji: "🟠", color: "#F97316" },
  4:  { label: "Bajo-medio", emoji: "🟠", color: "#F97316" },
  5:  { label: "Estable", emoji: "🟡", color: "#EAB308" },
  6:  { label: "Bien", emoji: "🟡", color: "#EAB308" },
  7:  { label: "Bueno", emoji: "🟢", color: "#22C55E" },
  8:  { label: "Muy bueno", emoji: "🟢", color: "#22C55E" },
  9:  { label: "Excelente", emoji: "🚀", color: "#059669" },
  10: { label: "Imparable", emoji: "🚀", color: "#059669" },
};

const PREGUNTAS = [
  {
    campo: "bloqueo",
    num: "01",
    pregunta: "¿Qué está frenando el avance de tu equipo o empresa esta semana?",
    hint: "Distingue entre obstáculos externos (recursos, sistemas, mercado) e internos (decisiones no tomadas, conversaciones evitadas, falta de claridad del liderazgo). Los externos se resuelven con recursos; los internos, con decisiones.",
    placeholder: "Describe qué está frenando el avance y tu hipótesis sobre la causa real. ¿Es externo o interno? ¿Tiene solución esta semana?",
  },
  {
    campo: "necesidad",
    num: "02",
    pregunta: "¿Qué necesitas desbloquearte a ti mismo para que el equipo pueda avanzar?",
    hint: "A veces el mayor obstáculo del equipo somos nosotros — una decisión no tomada, una conversación difícil evitada, o un sistema que necesitamos cambiar aunque incomode. ¿Qué acción solo tú puedes tomar esta semana?",
    placeholder: "¿Qué estás evitando que, si lo abordaras esta semana, desbloquearía al equipo? ¿Por qué lo has evitado hasta ahora?",
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PulsoEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const momentum: number = datos.momentum ?? 0;
  const anterior: number = datos.momentum_anterior ?? 0;
  const tendencia = anterior > 0 ? momentum - anterior : null;
  const ml = momentum > 0 ? MOMENTUM_LABELS[momentum] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Mini-hero */}
      <div style={{ background: C.hero, borderRadius: "16px", padding: "28px 32px", position: "relative", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ position: "absolute", right: "-10px", top: "-15px", fontSize: "100px", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>PULSO</div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(255,255,255,0.06), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "4px 12px 4px 8px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent }} className="animate-pulse" />
            Etapa III · Sostenimiento — Check-in semanal
          </div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "8px" }}>
            Pulso del <span style={{ background: C.span, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>equipo</span>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: "560px", textAlign: "justify" as const, margin: 0 }}>
            Tres minutos disciplinados cada semana para monitorear el momentum y detectar bloqueos antes de que se conviertan en crisis. Los patrones de más de 3 semanas son señales de alerta que se trabajan en sesión.
          </p>
          <div style={{ display: "flex", gap: "0", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {[
              { val: momentum > 0 ? `${momentum}/10` : "—", lbl: "Momentum actual" },
              { val: tendencia !== null ? (tendencia >= 0 ? `+${tendencia}` : `${tendencia}`) : "—", lbl: "Vs semana anterior" },
              { val: "3 min", lbl: "Duración del pulso" },
            ].map((s, i) => (
              <div key={i} style={{ paddingRight: "22px", marginRight: "22px", ...(i < 2 ? { borderRight: "1px solid rgba(255,255,255,0.1)" } : {}) }}>
                <div style={{ fontSize: "22px", fontWeight: 900, color: "white", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight card */}
      <div style={{ background: C.qBg, border: "1.5px solid #FCD34D", borderRadius: "14px", padding: "20px 24px", display: "flex", gap: "14px", marginBottom: "24px" }}>
        <span style={{ fontSize: "26px", flexShrink: 0 }}>📊</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#78350F", marginBottom: "5px" }}>¿Para qué sirve el Pulso semanal?</div>
          <div style={{ fontSize: "14px", color: "#92400E", lineHeight: 1.75, textAlign: "justify" as const }}>
            El Pulso es un auto-monitoreo de 3 minutos que el líder hace cada semana durante la etapa de Sostenimiento. No es un reporte — es una foto de su estado real en este momento. El coach revisa los pulsos antes de cada sesión para calibrar el trabajo. Los patrones de más de 3 semanas revelan los verdaderos bloqueos del programa.
          </div>
        </div>
      </div>

      {/* Momentum scale */}
      <div style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "16px", padding: "24px 28px", marginBottom: "20px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <span>📊 Nivel de momentum del equipo esta semana</span>
          {ml && <span style={{ fontSize: "14px", fontWeight: 800, color: ml.color }}>{ml.emoji} {ml.label}</span>}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const active = momentum === n;
            const lbl = MOMENTUM_LABELS[n];
            return (
              <button key={n} onClick={() => setDatos({ ...datos, momentum: n, momentum_anterior: momentum > 0 ? momentum : anterior })} style={{ flex: "1 0 auto", minWidth: "40px", height: "48px", borderRadius: "10px", fontSize: "15px", fontWeight: 700, border: `1.5px solid ${active ? "transparent" : "#E0E7FF"}`, background: active ? C.active : "white", color: active ? "white" : "#64748B", cursor: "pointer", boxShadow: active ? `0 4px 14px ${C.accent}40` : "none", transition: "all 0.15s" }}>
                {n}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94A3B8", marginBottom: "12px" }}>
          <span>1 — Paralizado</span><span>5 — Estable</span><span>10 — Imparable</span>
        </div>
        {ml && (
          <div style={{ padding: "12px 16px", background: "#F5F7FF", borderRadius: "10px", fontSize: "14px", color: "#0C4A6E", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: ml.color, fontSize: "18px" }}>{ml.emoji}</span>
            <span>
              {momentum >= 8 ? "Momentum alto — aprovecha para avanzar en los compromisos más desafiantes" :
               momentum >= 6 ? "Momentum estable — identifica qué podría acelerarlo esta semana" :
               momentum >= 4 ? "Momentum moderado — hay un bloqueo que necesita atención" :
               "Momentum bajo — urgente identificar y abordar el bloqueo central antes de la próxima sesión"}
            </span>
          </div>
        )}
        {tendencia !== null && tendencia !== 0 && (
          <div style={{ marginTop: "8px", fontSize: "13px", color: tendencia > 0 ? "#059669" : "#EF4444", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
            {tendencia > 0 ? "↑" : "↓"} {Math.abs(tendencia)} punto{Math.abs(tendencia) !== 1 ? "s" : ""} vs semana anterior
          </div>
        )}
      </div>

      {/* 2 Blocking questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {PREGUNTAS.map((p) => (
          <div key={p.campo}>
            <div style={{ background: C.qBg, borderLeft: `4px solid ${C.qBorder}`, borderRadius: "0 14px 14px 0", padding: "18px 22px", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
                Pregunta {p.num}
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0C4A6E", lineHeight: 1.5, marginBottom: "5px" }}>{p.pregunta}</div>
              <div style={{ fontSize: "13px", color: "#64748B", fontStyle: "italic", lineHeight: 1.5 }}>{p.hint}</div>
            </div>
            <textarea style={TA} value={datos[p.campo] ?? ""} onChange={(e) => setDatos({ ...datos, [p.campo]: e.target.value })} onFocus={foc} onBlur={blu} placeholder={p.placeholder} />
          </div>
        ))}
      </div>

    </div>
  );
}
