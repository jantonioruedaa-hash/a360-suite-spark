import { useMemo, useState } from "react";
import { PREGUNTAS_PODEROSAS, type PreguntaPoderosa } from "@/lib/coaching-instrumentos";
import { Star, StarOff, Search, X } from "lucide-react";

// Etapa III — Sostenimiento · Color #BA7517 (naranja)
const C = {
  hero:   "linear-gradient(135deg, #78350F 0%, #92400E 50%, #B45309 100%)",
  accent: "#BA7517",
  span:   "linear-gradient(135deg, #FCD34D, #FDE68A)",
  qBg:    "linear-gradient(135deg, #FEF3C7, #FDE68A55)",
  active: "linear-gradient(135deg, #BA7517, #EF4444)",
};

const TA: React.CSSProperties = { width: "100%", padding: "16px 18px", border: "1.5px solid #E0E7FF", borderRadius: "12px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.75, resize: "vertical", minHeight: "120px", transition: "all 0.15s" };
const LB: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "8px", display: "block" };

const foc = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px ${C.accent}25`; };
const blu = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => { e.target.style.borderColor = "#E0E7FF"; e.target.style.boxShadow = "none"; };

const DIMS: { id: PreguntaPoderosa["dimension"]; nombre: string; color: string }[] = [
  { id: "vision",      nombre: "Visión",          color: "#7F77DD" },
  { id: "decision",    nombre: "Decisión",        color: "#1D9E75" },
  { id: "influencia",  nombre: "Influencia",      color: "#BA7517" },
  { id: "ejecucion",   nombre: "Ejecución",       color: "#D85A30" },
  { id: "resiliencia", nombre: "Resiliencia",     color: "#5B9BD5" },
  { id: "consciencia", nombre: "Auto-consciencia", color: "#A04668" },
];

interface PreguntaTrabajada {
  id: string; texto: string; dimension: string;
  fechaUso: string; respuestaLider: string; observacionCoach: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BibliotecaPreguntasInstrumentado({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const [filtroDim, setFiltroDim] = useState<string>("");
  const [filtroInt, setFiltroInt] = useState<number>(0);
  const [busqueda, setBusqueda] = useState("");
  const favoritos: string[] = datos.favoritos ?? [];
  const trabajadas: PreguntaTrabajada[] = datos.trabajadas ?? [];

  const filtradas = useMemo(() => PREGUNTAS_PODEROSAS.filter(p => {
    if (filtroDim && p.dimension !== filtroDim) return false;
    if (filtroInt && p.intensidad !== filtroInt) return false;
    if (busqueda && !p.texto.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  }), [filtroDim, filtroInt, busqueda]);

  const togFav = (id: string) => setDatos({ ...datos, favoritos: favoritos.includes(id) ? favoritos.filter(x => x !== id) : [...favoritos, id] });
  const trabajar = (p: PreguntaPoderosa) => setDatos({ ...datos, trabajadas: [{ id: `t-${Date.now()}`, texto: p.texto, dimension: p.dimension, fechaUso: new Date().toISOString().slice(0, 10), respuestaLider: "", observacionCoach: "" }, ...trabajadas] });
  const updTrab = (id: string, patch: Partial<PreguntaTrabajada>) => setDatos({ ...datos, trabajadas: trabajadas.map(t => t.id === id ? { ...t, ...patch } : t) });
  const delTrab = (id: string) => setDatos({ ...datos, trabajadas: trabajadas.filter(t => t.id !== id) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Mini-hero */}
      <div style={{ background: C.hero, borderRadius: "16px", padding: "28px 32px", position: "relative", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ position: "absolute", right: "-10px", top: "-15px", fontSize: "80px", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>PREGUNTAS</div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(252,211,77,0.1), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "4px 12px 4px 8px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent }} className="animate-pulse" />
            Etapa III · Sostenimiento — Biblioteca
          </div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "8px" }}>
            Biblioteca de <span style={{ background: C.span, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>preguntas poderosas</span>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: "560px", textAlign: "justify" as const, margin: 0 }}>
            {PREGUNTAS_PODEROSAS.length}+ preguntas calibradas por dimensión e intensidad. Una pregunta poderosa dosificada en el momento correcto puede mover más que una hora de consejo. El líder hereda este catálogo al cierre del programa.
          </p>
          <div style={{ display: "flex", gap: "0", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {[
              { val: PREGUNTAS_PODEROSAS.length, lbl: "En el catálogo" },
              { val: favoritos.length, lbl: "Favoritas" },
              { val: trabajadas.length, lbl: "Trabajadas" },
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
        <span style={{ fontSize: "26px", flexShrink: 0 }}>❓</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#78350F", marginBottom: "5px" }}>¿Cómo usar la Biblioteca de preguntas?</div>
          <div style={{ fontSize: "14px", color: "#92400E", lineHeight: 1.75, textAlign: "justify" as const }}>
            El coach selecciona 1-2 preguntas por sesión calibradas al momento del líder. Marca las favoritas para usarlas cuando el líder enfrente esa dimensión específica. Para cada pregunta trabajada, registra la respuesta del líder y tus observaciones — estos registros son insumo clave para la síntesis ejecutiva de cierre.
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "14px", padding: "18px 22px", marginBottom: "16px" }}>
        <div style={{ position: "relative", marginBottom: "14px" }}>
          <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#94A3B8" }} />
          <input style={{ width: "100%", padding: "12px 14px 12px 40px", border: "1.5px solid #E0E7FF", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", outline: "none" }} placeholder="Buscar pregunta…" value={busqueda} onChange={e => setBusqueda(e.target.value)} onFocus={foc as React.FocusEventHandler<HTMLInputElement>} onBlur={blu as React.FocusEventHandler<HTMLInputElement>} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {DIMS.map(d => (
            <button key={d.id} onClick={() => setFiltroDim(filtroDim === d.id ? "" : d.id)} style={{ fontSize: "12px", padding: "5px 14px", borderRadius: "999px", border: `1.5px solid ${filtroDim === d.id ? d.color : "#E0E7FF"}`, background: filtroDim === d.id ? d.color : "white", color: filtroDim === d.id ? "white" : "#64748B", cursor: "pointer", fontWeight: 600 }}>
              {d.nombre}
            </button>
          ))}
          <div style={{ display: "flex", gap: "4px", marginLeft: "auto" }}>
            {[0, 1, 2, 3].map(n => (
              <button key={n} onClick={() => setFiltroInt(filtroInt === n ? 0 : n)} style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "8px", border: `1.5px solid ${filtroInt === n && n !== 0 ? C.accent : "#E0E7FF"}`, background: filtroInt === n && n !== 0 ? C.active : "white", color: filtroInt === n && n !== 0 ? "white" : "#64748B", cursor: "pointer", fontWeight: 600 }}>
                {n === 0 ? "Todas" : `Int. ${n}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question list */}
      <div style={{ border: "1px solid #E0E7FF", borderRadius: "14px", overflow: "hidden", maxHeight: "560px", overflowY: "auto", marginBottom: "28px" }}>
        {filtradas.map(p => {
          const dim = DIMS.find(d => d.id === p.dimension);
          const fav = favoritos.includes(p.id);
          const yaTrab = trabajadas.some(t => t.texto === p.texto);
          return (
            <div key={p.id} style={{ padding: "14px 18px", borderBottom: "1px solid #E0E7FF", background: "white", transition: "background 0.1s" }} onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#FFFBEB"} onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "white"}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <button onClick={() => togFav(p.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", flexShrink: 0, marginTop: "2px" }}>
                  {fav ? <Star style={{ width: "16px", height: "16px", fill: "#F59E0B", color: "#F59E0B" }} /> : <StarOff style={{ width: "16px", height: "16px", color: "#94A3B8" }} />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#0C4A6E", lineHeight: 1.5, marginBottom: "6px" }}>{p.texto}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {dim && <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "999px", border: `1.5px solid ${dim.color}`, color: dim.color, fontWeight: 600 }}>{dim.nombre}</span>}
                    <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "999px", background: "#F5F7FF", color: "#64748B", fontWeight: 600 }}>Int. {p.intensidad}</span>
                  </div>
                  <details style={{ marginTop: "6px" }}>
                    <summary style={{ cursor: "pointer", fontSize: "12px", color: C.accent, fontWeight: 600 }}>Ver efecto típico</summary>
                    <p style={{ fontSize: "12px", color: "#64748B", marginTop: "4px", fontStyle: "italic", lineHeight: 1.5 }}>"{p.ejemploEfecto}"</p>
                  </details>
                </div>
                <button disabled={yaTrab} onClick={() => trabajar(p)} style={{ padding: "7px 14px", borderRadius: "8px", border: `1.5px solid ${yaTrab ? "#E0E7FF" : C.accent}`, background: yaTrab ? "#F5F7FF" : "white", color: yaTrab ? "#94A3B8" : C.accent, fontSize: "12px", fontWeight: 700, cursor: yaTrab ? "default" : "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
                  {yaTrab ? "Trabajada" : "Trabajar →"}
                </button>
              </div>
            </div>
          );
        })}
        {filtradas.length === 0 && <div style={{ padding: "32px", textAlign: "center" }}><p style={{ fontSize: "14px", color: "#94A3B8" }}>Sin coincidencias con los filtros actuales.</p></div>}
      </div>

      {/* Bitácora */}
      {trabajadas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em" }}>📓 Bitácora de preguntas trabajadas ({trabajadas.length})</div>
          {trabajadas.map(t => {
            const dim = DIMS.find(d => d.id === t.dimension);
            return (
              <div key={t.id} style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "16px", padding: "22px 26px" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#FCD34D"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${C.accent}12`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E0E7FF"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", lineHeight: 1.5, marginBottom: "5px" }}>{t.texto}</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {dim && <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "999px", border: `1.5px solid ${dim.color}`, color: dim.color, fontWeight: 600 }}>{dim.nombre}</span>}
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>{t.fechaUso}</span>
                    </div>
                  </div>
                  <button onClick={() => delTrab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: "4px", flexShrink: 0 }}><X style={{ width: "16px", height: "16px" }} /></button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <span style={LB}>Respuesta del líder (resumen)</span>
                    <textarea style={TA} value={t.respuestaLider} onChange={e => updTrab(t.id, { respuestaLider: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} placeholder="¿Cómo respondió? ¿Qué silencios hubo? ¿Qué te sorprendió?" />
                  </div>
                  <div>
                    <span style={LB}>Observación del coach</span>
                    <textarea style={TA} value={t.observacionCoach} onChange={e => updTrab(t.id, { observacionCoach: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} placeholder="¿Qué patrones observaste? ¿Qué preguntas de seguimiento genera esta respuesta?" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
