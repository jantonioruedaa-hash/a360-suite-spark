import { useState } from "react";
import { DILEMAS_BANCO, CATEGORIAS_DILEMAS, type DilemaCatalogo } from "@/lib/coaching-instrumentos";
import { Plus, X, Library, ChevronDown, Clock } from "lucide-react";

// Etapa II — Activación · Color #1D9E75 (verde)
const C = {
  hero:   "linear-gradient(135deg, #064E3B 0%, #065F46 50%, #059669 100%)",
  accent: "#1D9E75",
  span:   "linear-gradient(135deg, #6EE7B7, #A7F3D0)",
  qBg:    "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
  active: "linear-gradient(135deg, #1D9E75, #0EA5E9)",
};

const TA: React.CSSProperties = { width: "100%", padding: "16px 18px", border: "1.5px solid #E0E7FF", borderRadius: "12px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.8, resize: "vertical", minHeight: "140px", transition: "all 0.15s" };
const IN: React.CSSProperties = { width: "100%", padding: "14px 18px", border: "1.5px solid #E0E7FF", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.5, transition: "all 0.15s" };
const LB: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "8px", display: "block" };

const foc = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px ${C.accent}25`; };
const blu = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => { e.target.style.borderColor = "#E0E7FF"; e.target.style.boxShadow = "none"; };

interface BitacoraDilema {
  id: string;
  dilema_id?: string;
  titulo: string;
  contexto: string;
  dilema: string;
  rubricaIdeal?: string;
  trampaTipica?: string;
  respuestaInmediata: string;
  segundosTomados?: number;
  justificacion: string;
  coherenciaManifiesto?: number;
  aprendizaje: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SimuladorInstrumentado({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const items: BitacoraDilema[] = Array.isArray(datos.dilemas) ? datos.dilemas : [];
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [filtro, setFiltro] = useState<string>("all");

  const sync = (n: BitacoraDilema[]) => setDatos({ ...datos, dilemas: n });
  const añadirDelBanco = (d: DilemaCatalogo) => sync([...items, { id: `b-${Date.now()}`, dilema_id: d.id, titulo: d.titulo, contexto: d.contexto, dilema: d.dilema, rubricaIdeal: d.rubricaIdeal, trampaTipica: d.trampaTipica, respuestaInmediata: "", justificacion: "", aprendizaje: "", coherenciaManifiesto: 3 }]);
  const añadirCustom = () => sync([...items, { id: `c-${Date.now()}`, titulo: "", contexto: "", dilema: "", respuestaInmediata: "", justificacion: "", aprendizaje: "", coherenciaManifiesto: 3 }]);
  const quitar = (id: string) => sync(items.filter(i => i.id !== id));
  const upd = (id: string, p: Partial<BitacoraDilema>) => sync(items.map(i => i.id === id ? { ...i, ...p } : i));

  const coherenciaProm = items.length ? items.reduce((a, b) => a + (b.coherenciaManifiesto ?? 0), 0) / items.length : 0;
  const catsCubiertas = new Set(items.map(i => DILEMAS_BANCO.find(d => d.id === i.dilema_id)?.categoria).filter(Boolean)).size;
  const filtrados = filtro === "all" ? DILEMAS_BANCO : DILEMAS_BANCO.filter(d => d.categoria === filtro);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Mini-hero */}
      <div style={{ background: C.hero, borderRadius: "16px", padding: "28px 32px", position: "relative", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ position: "absolute", right: "-10px", top: "-15px", fontSize: "80px", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>DILEMAS</div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(110,231,183,0.15), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "4px 12px 4px 8px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent }} className="animate-pulse" />
            Etapa II · Activación — Herramienta 2
          </div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "8px" }}>
            Simulador de <span style={{ background: C.span, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>decisiones</span>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, maxWidth: "560px", textAlign: "justify" as const, margin: 0 }}>
            Prueba el manifiesto bajo presión simulada. Cada dilema activa exactamente las creencias limitantes mapeadas y revela la distancia entre lo que el líder declara y lo que hace cuando no tiene tiempo para pensar.
          </p>
          <div style={{ display: "flex", gap: "0", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {[
              { val: items.length, lbl: "Dilemas trabajados" },
              { val: coherenciaProm > 0 ? coherenciaProm.toFixed(1) + "/5" : "—", lbl: "Coherencia con manifiesto" },
              { val: catsCubiertas, lbl: "Categorías cubiertas" },
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
        <span style={{ fontSize: "26px", flexShrink: 0 }}>⚡</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#064E3B", marginBottom: "5px" }}>¿Para qué sirve el Simulador de decisiones?</div>
          <div style={{ fontSize: "15px", color: "#065F46", lineHeight: 1.8, textAlign: "justify" as const }}>
            Un dilema muestra la naturaleza real del líder — lo que elige bajo presión, en segundos, sin tiempo para pensar. El simulador pone el manifiesto a prueba con situaciones calibradas a las creencias limitantes mapeadas. La distancia entre la respuesta inmediata y el manifiesto es el verdadero material del coaching.
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
        <button onClick={() => setShowCatalogo(s => !s)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "11px 20px", borderRadius: "10px", border: "1.5px solid #E0E7FF", background: "white", fontSize: "14px", fontWeight: 600, color: "#065F46", cursor: "pointer" }}>
          <Library style={{ width: "15px", height: "15px" }} /> Banco de dilemas ({DILEMAS_BANCO.length})
          <ChevronDown style={{ width: "14px", height: "14px", transform: showCatalogo ? "rotate(180deg)" : "none" }} />
        </button>
        <button onClick={añadirCustom} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "11px 20px", borderRadius: "10px", border: "none", background: C.active, fontSize: "14px", fontWeight: 700, color: "white", cursor: "pointer", boxShadow: `0 4px 14px ${C.accent}40` }}>
          <Plus style={{ width: "15px", height: "15px" }} /> Crear dilema custom
        </button>
      </div>

      {/* Catalog */}
      {showCatalogo && (
        <div style={{ background: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "600px", overflowY: "auto", marginBottom: "24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <button onClick={() => setFiltro("all")} style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "999px", border: `1.5px solid ${filtro === "all" ? C.accent : "#E0E7FF"}`, background: filtro === "all" ? C.active : "white", color: filtro === "all" ? "white" : "#64748B", cursor: "pointer", fontWeight: 600 }}>Todos</button>
            {CATEGORIAS_DILEMAS.map(cat => (
              <button key={cat.id} onClick={() => setFiltro(filtro === cat.id ? "all" : cat.id)} style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "999px", border: `1.5px solid ${filtro === cat.id ? C.accent : "#E0E7FF"}`, background: filtro === cat.id ? C.active : "white", color: filtro === cat.id ? "white" : "#64748B", cursor: "pointer", fontWeight: 600 }}>
                {cat.nombre}
              </button>
            ))}
          </div>
          {filtrados.map(d => {
            const ya = items.some(i => i.dilema_id === d.id);
            const cat = CATEGORIAS_DILEMAS.find(c => c.id === d.categoria);
            return (
              <div key={d.id} style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "12px", padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", marginBottom: "4px" }}>{d.titulo}</div>
                    <div style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.5, marginBottom: "8px" }}>{d.contexto.slice(0, 120)}…</div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {cat && <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", background: "#ECFDF5", color: "#064E3B", fontWeight: 600 }}>{cat.nombre}</span>}
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", background: "#FEF3C7", color: "#92400E", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Clock style={{ width: "10px", height: "10px" }} /> {d.presionTiempo}
                      </span>
                    </div>
                  </div>
                  <button disabled={ya} onClick={() => añadirDelBanco(d)} style={{ padding: "8px 16px", borderRadius: "8px", border: `1.5px solid ${ya ? "#E0E7FF" : C.accent}`, background: ya ? "#F5F7FF" : "white", color: ya ? "#94A3B8" : C.accent, fontSize: "12px", fontWeight: 700, cursor: ya ? "default" : "pointer", flexShrink: 0 }}>
                    {ya ? "Añadido" : "Aplicar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dilema cards */}
      {items.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", background: "#F5F7FF", borderRadius: "16px", border: "1px solid #E0E7FF" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎯</div>
          <p style={{ fontSize: "15px", color: "#94A3B8", fontStyle: "italic" }}>Selecciona dilemas del banco o crea uno calibrado al perfil del líder.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {items.map((it, idx) => (
            <div key={it.id} style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "16px", padding: "24px 28px" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#6EE7B7"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${C.accent}12`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E0E7FF"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Dilema #{idx + 1}</div>
                  <input style={IN} value={it.titulo} onChange={e => upd(it.id, { titulo: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLInputElement>} onBlur={blu as React.FocusEventHandler<HTMLInputElement>} placeholder="Título del dilema" />
                </div>
                <button onClick={() => quitar(it.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: "4px", flexShrink: 0 }}><X style={{ width: "16px", height: "16px" }} /></button>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <span style={LB}>Contexto de la situación</span>
                <textarea style={{ ...TA, minHeight: "80px" }} value={it.contexto} onChange={e => upd(it.id, { contexto: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} placeholder="¿Qué está pasando? ¿Quiénes están involucrados? ¿Cuáles son las presiones?" />
              </div>
              <div style={{ background: C.qBg, borderLeft: `4px solid ${C.accent}`, borderRadius: "0 12px 12px 0", padding: "16px 20px", marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>La pregunta del dilema</div>
                <textarea style={{ ...TA, minHeight: "80px", background: "transparent", border: `1.5px solid ${C.accent}40` }} value={it.dilema} onChange={e => upd(it.id, { dilema: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} placeholder="¿Qué haría el líder si tuviera que decidir en 30 segundos?" />
              </div>
              {(it.rubricaIdeal || it.trampaTipica) && (
                <details style={{ background: "#F5F7FF", borderRadius: "10px", padding: "12px 16px", marginBottom: "14px" }}>
                  <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#065F46" }}>📋 Rúbrica del coach</summary>
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {it.rubricaIdeal && <div style={{ fontSize: "13px", color: "#059669", lineHeight: 1.5 }}><strong>Ideal:</strong> {it.rubricaIdeal}</div>}
                    {it.trampaTipica && <div style={{ fontSize: "13px", color: "#DC2626", lineHeight: 1.5 }}><strong>Trampa:</strong> {it.trampaTipica}</div>}
                  </div>
                </details>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <span style={LB}>Respuesta inmediata del líder</span>
                  <textarea style={{ ...TA, minHeight: "80px" }} value={it.respuestaInmediata} onChange={e => upd(it.id, { respuestaInmediata: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} placeholder="Lo que dijo en los primeros 30 segundos — sin editar…" />
                </div>
                <div>
                  <span style={LB}>Segundos tomados</span>
                  <input type="number" style={IN} value={it.segundosTomados ?? ""} onChange={e => upd(it.id, { segundosTomados: Number(e.target.value) })} onFocus={foc as React.FocusEventHandler<HTMLInputElement>} onBlur={blu as React.FocusEventHandler<HTMLInputElement>} placeholder="30" />
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <span style={LB}>Justificación posterior</span>
                <textarea style={{ ...TA, minHeight: "80px" }} value={it.justificacion} onChange={e => upd(it.id, { justificacion: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} placeholder="¿Por qué tomó esa decisión? ¿Qué valores o creencias la guiaron?" />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <span style={LB}>Coherencia con el manifiesto: <strong style={{ color: C.accent }}>{it.coherenciaManifiesto ?? 3}/5</strong></span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const on = (it.coherenciaManifiesto ?? 3) === n;
                    return <button key={n} onClick={() => upd(it.id, { coherenciaManifiesto: n })} style={{ flex: 1, height: "44px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, border: `1.5px solid ${on ? "transparent" : "#E0E7FF"}`, background: on ? C.active : "white", color: on ? "white" : "#64748B", cursor: "pointer", transition: "all 0.15s" }}>{n}</button>;
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}><span>1 — Sin coherencia</span><span>5 — Total coherencia</span></div>
              </div>
              <div>
                <span style={LB}>Aprendizaje principal del dilema</span>
                <textarea style={TA} value={it.aprendizaje} onChange={e => upd(it.id, { aprendizaje: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} placeholder="¿Qué se lleva el líder de trabajar este dilema? ¿Qué decisión próxima ya no tomará igual?" />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
