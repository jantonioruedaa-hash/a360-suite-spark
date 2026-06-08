// Etapa II — Activación · Color #1D9E75 (verde)
const C = {
  hero:  "linear-gradient(135deg, #064E3B 0%, #065F46 50%, #059669 100%)",
  accent: "#1D9E75",
  span:  "linear-gradient(135deg, #6EE7B7, #A7F3D0)",
  qBg:   "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
  qBorder: "#1D9E75",
  active: "linear-gradient(135deg, #1D9E75, #0EA5E9)",
  statBg: "linear-gradient(135deg, #064E3B, #065F46)",
};

const TA: React.CSSProperties = { width: "100%", padding: "16px 18px", border: "1.5px solid #E0E7FF", borderRadius: "12px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.8, resize: "vertical", minHeight: "140px", transition: "all 0.15s" };

const foc = (e: React.FocusEvent<HTMLTextAreaElement>) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px ${C.accent}25`; };
const blu = (e: React.FocusEvent<HTMLTextAreaElement>) => { e.target.style.borderColor = "#E0E7FF"; e.target.style.boxShadow = "none"; };

const PREGUNTAS = [
  {
    campo: "insight",
    num: "01",
    titulo: "Insight clave de la sesión",
    pregunta: "¿Cuál es el insight más poderoso que te llevas hoy? ¿Qué descubriste sobre tu forma de liderar que antes no veías con esta claridad?",
    hint: "El mejor insight no es el que aprendiste — es el que no esperabas descubrir. Cuanto más incómodo, más valioso. Sé específico y evita las generalizaciones.",
    placeholder: "Describe con tus propias palabras qué cambió en tu comprensión hoy. Incluye el momento exacto en que algo hizo clic…",
  },
  {
    campo: "compromiso",
    num: "02",
    titulo: "Compromiso concreto — próximos 7 días",
    pregunta: "¿Qué acción específica y observable vas a tomar antes de la próxima sesión? ¿Cuándo exactamente, con quién, y cómo sabrás que lo cumpliste?",
    hint: "Un buen compromiso tiene verbo de acción + fecha + testigo. 'Voy a mejorar la comunicación' no es compromiso. 'El martes 3pm hablaré con Carlos 15 minutos sobre expectativas de delegación' sí lo es.",
    placeholder: "Acción concreta + fecha específica + forma de verificar el cumplimiento + quién puede ser testigo…",
  },
  {
    campo: "resistencia",
    num: "03",
    titulo: "Resistencia o patrón identificado",
    pregunta: "¿Qué patrón de comportamiento o creencia limitante identificaste en ti durante esta sesión? ¿En qué situaciones específicas suele activarse?",
    hint: "La resistencia no es debilidad — es información exacta sobre dónde está la mayor oportunidad de crecimiento. Obsérvalo sin juzgar, con la misma objetividad que observarías a otro.",
    placeholder: "Describe el patrón tal como lo observas en tu comportamiento — con ejemplos concretos de esta semana o del pasado reciente…",
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EspejoEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const filled = PREGUNTAS.filter(p => (datos[p.campo] ?? "").length > 20).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Mini-hero */}
      <div style={{ background: C.hero, borderRadius: "16px", padding: "28px 32px", position: "relative", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ position: "absolute", right: "-10px", top: "-15px", fontSize: "110px", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>ESPEJO</div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(255,255,255,0.06), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "4px 12px 4px 8px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent }} className="animate-pulse" />
            Etapa II · Activación — Cierre de sesión
          </div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "8px" }}>
            Espejo de <span style={{ background: C.span, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>liderazgo</span>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, maxWidth: "560px", textAlign: "justify" as const, margin: 0 }}>
            Tres preguntas no negociables para cerrar cada sesión. Sin espejo, los insights se diluyen en 72 horas. Con él, cada sesión produce una transformación accionable.
          </p>
          <div style={{ display: "flex", gap: "0", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {[
              { val: `${filled}/3`, lbl: "Reflexiones completadas" },
              { val: "15 min", lbl: "Duración típica" },
              { val: "Cierre", lbl: "Momento de la sesión" },
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
      <div style={{ background: C.qBg, border: `1.5px solid #A7F3D0`, borderRadius: "14px", padding: "20px 24px", display: "flex", gap: "14px", marginBottom: "24px" }}>
        <span style={{ fontSize: "26px", flexShrink: 0 }}>🪞</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#065F46", marginBottom: "5px" }}>¿Para qué sirve el Espejo de liderazgo?</div>
          <div style={{ fontSize: "15px", color: "#064E3B", lineHeight: 1.8, textAlign: "justify" as const }}>
            El espejo es la herramienta de cierre de cada sesión de Activación. Su función es obligar al líder a convertir la conversación en acción concreta antes de salir. Insight sin compromiso es solo una buena conversación. Compromiso sin resistencia identificada es un plan ingenuo. Las tres preguntas juntas producen el insumo para la próxima sesión.
          </div>
        </div>
      </div>

      {/* 3 Reflection questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {PREGUNTAS.map((p) => (
          <div key={p.campo}>
            <div style={{ background: C.qBg, borderLeft: `4px solid ${C.qBorder}`, borderRadius: "0 14px 14px 0", padding: "20px 24px", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
                Reflexión {p.num} — {p.titulo}
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
