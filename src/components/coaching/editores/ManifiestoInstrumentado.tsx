import { Input } from "@/components/ui/input";
import { DIMENSIONES_MANIFIESTO } from "@/lib/coaching-instrumentos";
import { CheckCircle2, AlertCircle } from "lucide-react";

// Etapa II — Activación · Color #1D9E75 (verde)
const C = {
  hero:   "linear-gradient(135deg, #064E3B 0%, #065F46 50%, #059669 100%)",
  accent: "#1D9E75",
  span:   "linear-gradient(135deg, #6EE7B7, #A7F3D0)",
  qBg:    "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
  active: "linear-gradient(135deg, #1D9E75, #0EA5E9)",
};

const TA: React.CSSProperties = { width: "100%", padding: "16px 18px", border: "1.5px solid #E0E7FF", borderRadius: "12px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.75, resize: "vertical", minHeight: "140px", transition: "all 0.15s" };
const IN: React.CSSProperties = { width: "100%", padding: "12px 16px", border: "1.5px solid #E0E7FF", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.5, transition: "all 0.15s" };
const LB: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "8px", display: "block" };

const foc = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px ${C.accent}25`; };
const blu = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => { e.target.style.borderColor = "#E0E7FF"; e.target.style.boxShadow = "none"; };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManifiestoInstrumentado({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const m = datos.manifiesto ?? {};
  const firmado = !!datos.firmado_por;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upd = (k: string, patch: any) => setDatos({ ...datos, manifiesto: { ...m, [k]: { ...(m[k] ?? {}), ...patch } } });

  const completado = (val: string | undefined) => !!val && val.length > 25;
  const compromisosLlenos = DIMENSIONES_MANIFIESTO.filter(d => completado(m[d.id]?.compromiso)).length;
  const compromisoMedio = DIMENSIONES_MANIFIESTO.reduce((acc, d) => acc + (Number(m[d.id]?.nivel) || 0), 0) / DIMENSIONES_MANIFIESTO.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Mini-hero */}
      <div style={{ background: C.hero, borderRadius: "16px", padding: "28px 32px", position: "relative", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ position: "absolute", right: "-10px", top: "-15px", fontSize: "80px", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>MANIFIESTO</div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(110,231,183,0.15), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "4px 12px 4px 8px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent }} className="animate-pulse" />
            Etapa II · Activación — Herramienta 1
          </div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "8px" }}>
            Manifiesto del <span style={{ background: C.span, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>líder</span>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: "560px", textAlign: "justify" as const, margin: 0 }}>
            El contrato del líder consigo mismo. No declaraciones de intención — compromisos accionables, observables y verificables en cada una de las 5 dimensiones del liderazgo ejecutivo.
          </p>
          <div style={{ display: "flex", gap: "0", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {[
              { val: `${compromisosLlenos}/5`, lbl: "Compromisos redactados" },
              { val: compromisoMedio > 0 ? compromisoMedio.toFixed(1) + "/5" : "—", lbl: "Compromiso promedio" },
              { val: firmado ? "✓ Firmado" : "Borrador", lbl: "Estado" },
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
      <div style={{ background: C.qBg, border: "1.5px solid #6EE7B7", borderRadius: "14px", padding: "20px 24px", display: "flex", gap: "14px", marginBottom: "24px" }}>
        <span style={{ fontSize: "26px", flexShrink: 0 }}>📜</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#064E3B", marginBottom: "5px" }}>¿Para qué sirve el Manifiesto del líder?</div>
          <div style={{ fontSize: "14px", color: "#065F46", lineHeight: 1.75, textAlign: "justify" as const }}>
            El manifiesto fuerza al líder a traducir el diagnóstico en compromisos accionables. Es el contrato visible que firma frente al coach y que define exactamente cómo va a operar distinto. Sin manifiesto, el insight se convierte en buenas intenciones. Con él, se convierte en compromisos verificables que el coach revisa en cada sesión.
          </div>
        </div>
      </div>

      {/* Dimensions */}
      {DIMENSIONES_MANIFIESTO.map((d, idx) => {
        const item = m[d.id] ?? {};
        const ok = completado(item.compromiso);
        return (
          <div key={d.id} style={{ background: ok ? "#F0FDF4" : "white", border: `1px solid ${ok ? "#BBF7D0" : "#E0E7FF"}`, borderLeft: `4px solid ${ok ? "#059669" : C.accent}`, borderRadius: "0 16px 16px 0", padding: "24px 28px", marginBottom: "16px", transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px ${C.accent}15`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
          >
            {/* Dimension header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "10px", background: ok ? "linear-gradient(135deg, #059669, #10B981)" : C.active, flexShrink: 0, fontSize: "14px", fontWeight: 900, color: "white" }}>
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  {ok ? <CheckCircle2 style={{ width: "16px", height: "16px", color: "#059669" }} /> : <AlertCircle style={{ width: "16px", height: "16px", color: "#F59E0B" }} />}
                  <span style={{ fontSize: "17px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em" }}>{d.nombre}</span>
                </div>
                <div style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6, textAlign: "justify" as const }}>{d.pregunta}</div>
              </div>
            </div>

            {/* Examples */}
            <details style={{ background: "#F5F7FF", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" }}>
              <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#0C4A6E" }}>Ver ejemplos — bueno vs. a evitar</summary>
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "13px", color: "#059669", lineHeight: 1.5 }}><strong>✓ Bien:</strong> {d.ejemploBueno}</div>
                <div style={{ fontSize: "13px", color: "#DC2626", lineHeight: 1.5 }}><strong>✗ Evitar:</strong> {d.ejemploMalo}</div>
                <div style={{ fontSize: "12px", color: "#64748B", fontStyle: "italic" }}>Validador: {d.validador}</div>
              </div>
            </details>

            {/* Question card */}
            <div style={{ background: C.qBg, borderLeft: `4px solid ${C.accent}`, borderRadius: "0 12px 12px 0", padding: "16px 20px", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Compromiso accionable <span style={{ color: "#EF4444" }}>*</span></div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", lineHeight: 1.5 }}>¿Qué harás distinto esta semana en {d.nombre.toLowerCase()}? ¿Cuándo exactamente, con quién, observable por un tercero?</div>
              <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px", fontStyle: "italic" }}>Rechazar formulaciones abstractas. Solo compromisos con verbo de acción + fecha + testigo.</div>
            </div>
            <textarea style={TA} value={item.compromiso ?? ""} onChange={e => upd(d.id, { compromiso: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} placeholder="Cuándo, qué acción concreta, con quién, cómo saber que se cumplió…" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
              <div>
                <span style={LB}>Testigo (quién puede verificarlo)</span>
                <Input style={IN} value={item.testigo ?? ""} onChange={e => upd(d.id, { testigo: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLInputElement>} onBlur={blu as React.FocusEventHandler<HTMLInputElement>} placeholder="Nombre de quien puede confirmar el cumplimiento" />
              </div>
              <div>
                <span style={LB}>Nivel de compromiso: <strong style={{ color: C.accent }}>{item.nivel ?? 3}/5</strong></span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const on = (item.nivel ?? 3) === n;
                    return <button key={n} onClick={() => upd(d.id, { nivel: n })} style={{ flex: 1, height: "44px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, border: `1.5px solid ${on ? "transparent" : "#E0E7FF"}`, background: on ? C.active : "white", color: on ? "white" : "#64748B", cursor: "pointer", transition: "all 0.15s" }}>{n}</button>;
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Signature */}
      <div style={{ background: "linear-gradient(135deg, #064E3B, #065F46)", borderRadius: "16px", padding: "24px 28px", marginTop: "8px" }}>
        <div style={{ fontSize: "16px", fontWeight: 800, color: "white", marginBottom: "16px" }}>✍️ Firma del compromiso</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <span style={{ ...LB, color: "rgba(255,255,255,0.8)" }}>Firmado por (líder)</span>
            <input style={{ ...IN, background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", color: "white" }} value={datos.firmado_por ?? ""} onChange={e => setDatos({ ...datos, firmado_por: e.target.value })} placeholder="Nombre completo del líder" />
          </div>
          <div>
            <span style={{ ...LB, color: "rgba(255,255,255,0.8)" }}>Fecha de compromiso</span>
            <input type="date" style={{ ...IN, background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", color: "white" }} value={datos.firmado_fecha ?? ""} onChange={e => setDatos({ ...datos, firmado_fecha: e.target.value })} />
          </div>
        </div>
      </div>

    </div>
  );
}
