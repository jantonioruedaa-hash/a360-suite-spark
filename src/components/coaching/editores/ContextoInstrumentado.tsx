import { CONTEXTO_SECCIONES } from "@/lib/coaching-instrumentos";

// Etapa I — Diagnóstico · Color #7F77DD (violeta)
const C = {
  hero:   "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)",
  accent: "#7F77DD",
  span:   "linear-gradient(135deg, #C4B5FD, #E9D5FF)",
  qBg:    "linear-gradient(135deg, #EDE9FE, #F5F3FF)",
  active: "linear-gradient(135deg, #7F77DD, #A855F7)",
};

const IN: React.CSSProperties = { width: "100%", padding: "14px 18px", border: "1.5px solid #E0E7FF", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.5, transition: "all 0.15s" };
const TA: React.CSSProperties = { width: "100%", padding: "14px 18px", border: "1.5px solid #E0E7FF", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.8, resize: "vertical", minHeight: "140px", transition: "all 0.15s" };
const LB: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "8px", display: "block" };

const foc = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px ${C.accent}20`; };
const blu = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = "#E0E7FF"; e.target.style.boxShadow = "none"; };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ContextoInstrumentado({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const ctx = datos.contexto ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upd = (sec: string, campo: string, v: any) =>
    setDatos({ ...datos, contexto: { ...ctx, [sec]: { ...(ctx[sec] ?? {}), [campo]: v } } });

  const totalCampos = Object.values(CONTEXTO_SECCIONES).reduce((a, s) => a + s.campos.length, 0);
  const llenos = Object.entries(CONTEXTO_SECCIONES).reduce((acc, [secId, sec]) =>
    acc + sec.campos.filter(c => { const v = ctx[secId]?.[c.id]; return v !== undefined && v !== "" && v !== null; }).length, 0);
  const pct = totalCampos ? Math.round((llenos / totalCampos) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Mini-hero */}
      <div style={{ background: C.hero, borderRadius: "16px", padding: "28px 32px", position: "relative", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ position: "absolute", right: "-10px", top: "-15px", fontSize: "90px", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>CONTEXTO</div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(167,139,250,0.15), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "4px 12px 4px 8px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent }} className="animate-pulse" />
            Etapa I · Diagnóstico — Herramienta 3
          </div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "8px" }}>
            Perfil de <span style={{ background: C.span, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>contexto</span>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, maxWidth: "560px", textAlign: "justify" as const, margin: 0 }}>
            Mapea las fuerzas externas que condicionan al líder. Sin contexto el coaching se vuelve genérico. Con él, cada conversación se conecta a la realidad específica de esta persona en este momento de su empresa y su vida.
          </p>
          <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: `linear-gradient(90deg, ${C.accent}, #A855F7)`, borderRadius: "999px", width: `${pct}%`, transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>{pct}% completo</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{llenos}/{totalCampos} campos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insight card */}
      <div style={{ background: C.qBg, border: "1.5px solid #C4B5FD", borderRadius: "14px", padding: "20px 24px", display: "flex", gap: "14px", marginBottom: "24px" }}>
        <span style={{ fontSize: "26px", flexShrink: 0 }}>🗺️</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#4C1D95", marginBottom: "5px" }}>¿Para qué sirve el Perfil de contexto?</div>
          <div style={{ fontSize: "15px", color: "#3730A3", lineHeight: 1.8, textAlign: "justify" as const }}>
            Este perfil se completa en la primera sesión y se revisa en cada sesión subsiguiente. Su función es dar al coach el mapa completo: quién pagó el coaching y qué espera, qué está pasando en el negocio, y qué cargas personales están afectando el liderazgo. Sin este mapa el coach da consejos genéricos. Con él, da orientación calibrada a esta persona específica.
          </div>
        </div>
      </div>

      {/* Context sections */}
      {Object.entries(CONTEXTO_SECCIONES).map(([secId, sec], si) => (
        <div key={secId} style={{ background: si % 2 === 0 ? "white" : "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "16px", padding: "24px 28px", marginBottom: "16px" }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#C4B5FD"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${C.accent}10`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E0E7FF"; (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", paddingBottom: "14px", borderBottom: `2px solid ${C.accent}30` }}>
            <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: C.active, flexShrink: 0 }} />
            <div style={{ fontSize: "17px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em" }}>{sec.titulo}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {sec.campos.map(f => {
              const val = ctx[secId]?.[f.id] ?? "";
              const wide = f.tipo === "textarea";
              return (
                <div key={f.id} style={wide ? { gridColumn: "1 / -1" } : {}}>
                  <span style={LB}>{f.label}</span>
                  {f.tipo === "textarea" ? (
                    <textarea style={TA} value={val} onChange={e => upd(secId, f.id, e.target.value)} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} />
                  ) : f.tipo === "select" ? (
                    <select style={IN} value={val} onChange={e => upd(secId, f.id, e.target.value)} onFocus={foc as React.FocusEventHandler<HTMLSelectElement>} onBlur={blu as React.FocusEventHandler<HTMLSelectElement>}>
                      <option value="">— seleccionar —</option>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(f as any).opciones?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.tipo === "scale" ? (
                    <div>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "6px" }}>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                          const on = Number(val || 5) === n;
                          return <button key={n} onClick={() => upd(secId, f.id, n)} style={{ flex: "1 0 auto", minWidth: "36px", height: "40px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, border: `1.5px solid ${on ? "transparent" : "#E0E7FF"}`, background: on ? C.active : "white", color: on ? "white" : "#64748B", cursor: "pointer" }}>{n}</button>;
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8" }}><span>1 — Bajo</span><span>10 — Alto</span></div>
                    </div>
                  ) : f.tipo === "number" ? (
                    <input type="number" style={IN} value={val} onChange={e => upd(secId, f.id, Number(e.target.value))} onFocus={foc as React.FocusEventHandler<HTMLInputElement>} onBlur={blu as React.FocusEventHandler<HTMLInputElement>} />
                  ) : (
                    <input style={IN} value={val} onChange={e => upd(secId, f.id, e.target.value)} onFocus={foc as React.FocusEventHandler<HTMLInputElement>} onBlur={blu as React.FocusEventHandler<HTMLInputElement>} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
}
