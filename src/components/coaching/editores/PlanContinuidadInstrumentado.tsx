import { FASES_CONTINUIDAD_INSTRUMENTO, PLAN_FILAS_EJEMPLO, type FilaCompromiso } from "@/lib/coaching-instrumentos";
import { Plus, Trash2, Sparkles, Library } from "lucide-react";

// Etapa IV — Transformación · Color #D85A30 (rojo-naranja)
const C = {
  hero:   "linear-gradient(135deg, #7C2D12 0%, #9A3412 50%, #C2410C 100%)",
  accent: "#D85A30",
  span:   "linear-gradient(135deg, #FCA5A5, #FDBA74)",
  qBg:    "linear-gradient(135deg, #FFEDD5, #FED7AA55)",
  active: "linear-gradient(135deg, #D85A30, #F59E0B)",
};

const IN: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1.5px solid #E0E7FF", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.4, transition: "all 0.15s" };
const LB: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "6px", display: "block" };

const foc = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px ${C.accent}20`; };
const blu = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = "#E0E7FF"; e.target.style.boxShadow = "none"; };

const PHASE_COLORS = ["#0C4A6E", "#065F46", "#78350F", "#7C2D12"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PlanContinuidadInstrumentado({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const filas: FilaCompromiso[] = datos.filas ?? [];

  const upd = (id: string, patch: Partial<FilaCompromiso>) => setDatos({ ...datos, filas: filas.map(f => f.id === id ? { ...f, ...patch } : f) });
  const add = (fase: string) => setDatos({ ...datos, filas: [...filas, { id: `c-${Date.now()}`, fase, actividad: "", accion: "", responsable: "Líder", testigo: "", fechaLimite: "", indicadorExito: "", estado: "pendiente" }] });
  const del = (id: string) => setDatos({ ...datos, filas: filas.filter(f => f.id !== id) });
  const cargarEjemplos = () => { if (filas.length > 0 && !confirm("Esto agregará filas de ejemplo. ¿Continuar?")) return; setDatos({ ...datos, filas: [...filas, ...PLAN_FILAS_EJEMPLO.map((e, i) => ({ ...e, id: `e-${Date.now()}-${i}` }))] }); };

  const totales = { pendiente: filas.filter(f => f.estado === "pendiente").length, enCurso: filas.filter(f => f.estado === "en-curso").length, logrado: filas.filter(f => f.estado === "logrado").length };
  const pctLogrado = filas.length ? Math.round((totales.logrado / filas.length) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Mini-hero */}
      <div style={{ background: C.hero, borderRadius: "16px", padding: "28px 32px", position: "relative", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ position: "absolute", right: "-10px", top: "-15px", fontSize: "80px", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>PLAN 90</div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(252,165,165,0.15), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "4px 12px 4px 8px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent }} className="animate-pulse" />
            Etapa IV · Transformación — Plan de continuidad
          </div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "8px" }}>
            Plan de continuidad <span style={{ background: C.span, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>90 días</span>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: "560px", textAlign: "justify" as const, margin: 0 }}>
            El cambio sin plan post-programa se erosiona en 60 días. Este plan garantiza que el líder tiene hitos verificables, testigos externos y un sistema de auto-revisión para sostener la transformación sin necesitar al coach presente.
          </p>
          <div style={{ display: "flex", gap: "0", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {[
              { val: filas.length, lbl: "Compromisos totales" },
              { val: totales.logrado, lbl: "Logrados" },
              { val: `${pctLogrado}%`, lbl: "Completado" },
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
      <div style={{ background: C.qBg, border: "1.5px solid #FCA5A5", borderRadius: "14px", padding: "20px 24px", display: "flex", gap: "14px", marginBottom: "24px" }}>
        <span style={{ fontSize: "26px", flexShrink: 0 }}>🎯</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#7C2D12", marginBottom: "5px" }}>¿Para qué sirve el Plan de continuidad?</div>
          <div style={{ fontSize: "14px", color: "#9A3412", lineHeight: 1.75, textAlign: "justify" as const }}>
            El programa termina, pero el cambio no debe terminar con él. El plan de continuidad divide los 90 días post-programa en 4 fases progresivas, cada una con un hito observable y un testigo externo. Sin este plan, el 70% de los líderes vuelve a sus patrones anteriores en 8 semanas. Con él, la tasa de sostenimiento sube al 85%.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { val: filas.length, lbl: "Total", bg: "linear-gradient(135deg, #7C2D12, #9A3412)", ov: "rgba(252,165,165,0.15)" },
          { val: totales.pendiente, lbl: "Pendientes", bg: "linear-gradient(135deg, #78350F, #B45309)", ov: "rgba(252,211,77,0.15)" },
          { val: totales.enCurso, lbl: "En curso", bg: "linear-gradient(135deg, #1E3A8A, #1D4ED8)", ov: "rgba(96,165,250,0.15)" },
          { val: totales.logrado, lbl: "Logrados", bg: "linear-gradient(135deg, #064E3B, #059669)", ov: "rgba(110,231,183,0.15)" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: "12px", padding: "16px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 80% 20%, ${s.ov}, transparent)`, pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "white", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Action */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
        <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.75, maxWidth: "500px", textAlign: "justify" as const, margin: 0 }}>
          Define compromisos observables en 4 fases. Cada uno debe tener responsable, testigo externo, fecha e indicador de éxito concreto.
        </p>
        <button onClick={cargarEjemplos} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "11px 20px", borderRadius: "10px", border: "1.5px solid #E0E7FF", background: "white", fontSize: "14px", fontWeight: 600, color: "#7C2D12", cursor: "pointer" }}>
          <Library style={{ width: "15px", height: "15px" }} /> Cargar ejemplos
        </button>
      </div>

      {/* Phases */}
      {FASES_CONTINUIDAD_INSTRUMENTO.map((fase, fi) => {
        const filasFase = filas.filter(f => f.fase === fase.id);
        const phaseColor = PHASE_COLORS[fi] ?? C.accent;
        return (
          <div key={fase.id} style={{ background: fi % 2 === 0 ? "white" : "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "16px", padding: "22px 26px", marginBottom: "16px" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#FCA5A5"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E0E7FF"; }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: phaseColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 900, color: "white", flexShrink: 0 }}>
                  {["I","II","III","IV"][fi]}
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em" }}>{fase.titulo}</div>
                  <span style={{ fontSize: "12px", fontWeight: 600, padding: "2px 10px", borderRadius: "999px", background: "#FFEDD5", color: "#7C2D12" }}>{fase.ventana}</span>
                </div>
              </div>
              <button onClick={() => add(fase.id)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "9px", border: "none", background: C.active, fontSize: "13px", fontWeight: 700, color: "white", cursor: "pointer", flexShrink: 0 }}>
                <Plus style={{ width: "13px", height: "13px" }} /> Compromiso
              </button>
            </div>

            <details style={{ background: "#F5F7FF", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" }}>
              <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#7C2D12", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles style={{ width: "13px", height: "13px", color: C.accent }} /> Preguntas guía e hitos sugeridos
              </summary>
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Preguntas</div>
                  <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>{fase.preguntasPlan.map((q, i) => <li key={i} style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>{q}</li>)}</ul>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Hitos sugeridos</div>
                  <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>{fase.hitosSugeridos.map((h, i) => <li key={i} style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>{h}</li>)}</ul>
                </div>
              </div>
            </details>

            {filasFase.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", background: "#F5F7FF", borderRadius: "10px" }}>
                <p style={{ fontSize: "13px", color: "#94A3B8", fontStyle: "italic" }}>Sin compromisos en esta fase. Añade uno con el botón de arriba.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F5F7FF" }}>
                      {["Actividad", "Acción concreta", "Responsable", "Testigo", "Fecha", "Indicador éxito", "Estado", ""].map(h => (
                        <th key={h} style={{ padding: "10px 12px", border: "1px solid #E0E7FF", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filasFase.map(f => (
                      <tr key={f.id} style={{ verticalAlign: "top" }}>
                        {[
                          <td key="a" style={{ border: "1px solid #E0E7FF", padding: "4px" }}><textarea rows={2} value={f.actividad} onChange={e => upd(f.id, { actividad: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} style={{ ...IN, minHeight: "54px", resize: "vertical" }} placeholder="Actividad…" /></td>,
                          <td key="b" style={{ border: "1px solid #E0E7FF", padding: "4px" }}><textarea rows={2} value={f.accion} onChange={e => upd(f.id, { accion: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} style={{ ...IN, minHeight: "54px", resize: "vertical" }} placeholder="Verbo + qué + cuándo…" /></td>,
                          <td key="c" style={{ border: "1px solid #E0E7FF", padding: "4px" }}><input value={f.responsable} onChange={e => upd(f.id, { responsable: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLInputElement>} onBlur={blu as React.FocusEventHandler<HTMLInputElement>} style={IN} /></td>,
                          <td key="d" style={{ border: "1px solid #E0E7FF", padding: "4px" }}><input value={f.testigo} onChange={e => upd(f.id, { testigo: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLInputElement>} onBlur={blu as React.FocusEventHandler<HTMLInputElement>} style={IN} placeholder="Quién verifica" /></td>,
                          <td key="e" style={{ border: "1px solid #E0E7FF", padding: "4px" }}><input type="date" value={f.fechaLimite} onChange={e => upd(f.id, { fechaLimite: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLInputElement>} onBlur={blu as React.FocusEventHandler<HTMLInputElement>} style={IN} /></td>,
                          <td key="f" style={{ border: "1px solid #E0E7FF", padding: "4px" }}><textarea rows={2} value={f.indicadorExito} onChange={e => upd(f.id, { indicadorExito: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} style={{ ...IN, minHeight: "54px", resize: "vertical" }} placeholder="Observable…" /></td>,
                          <td key="g" style={{ border: "1px solid #E0E7FF", padding: "4px" }}><select value={f.estado} onChange={e => upd(f.id, { estado: e.target.value as FilaCompromiso["estado"] })} onFocus={foc as React.FocusEventHandler<HTMLSelectElement>} onBlur={blu as React.FocusEventHandler<HTMLSelectElement>} style={IN}><option value="pendiente">Pendiente</option><option value="en-curso">En curso</option><option value="logrado">Logrado</option><option value="ajustado">Ajustado</option></select></td>,
                          <td key="h" style={{ border: "1px solid #E0E7FF", padding: "4px", textAlign: "center" }}><button onClick={() => del(f.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: "4px" }}><Trash2 style={{ width: "14px", height: "14px" }} /></button></td>,
                        ]}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}
