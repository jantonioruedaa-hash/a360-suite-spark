import { useMemo, useState } from "react";
import { CREENCIAS_FRECUENTES, CATEGORIAS_CREENCIAS, type CreenciaCatalogo } from "@/lib/coaching-instrumentos";
import { Plus, X, Library, ChevronDown } from "lucide-react";

export interface CreenciaItem {
  id: string;
  texto: string;
  categoria?: string;
  origen?: string;
  costo?: string;
  reformulacion?: string;
  evidencia?: string;
  intensidad?: number;
}

// Etapa I — Diagnóstico · Color #7F77DD (violeta)
const C = {
  hero:   "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)",
  accent: "#7F77DD",
  span:   "linear-gradient(135deg, #C4B5FD, #E9D5FF)",
  qBg:    "linear-gradient(135deg, #EDE9FE, #F5F3FF)",
  qBorder: "#7F77DD",
  active: "linear-gradient(135deg, #7F77DD, #A855F7)",
  statBg: "linear-gradient(135deg, #1E1B4B, #312E81)",
};

const TA: React.CSSProperties = { width: "100%", padding: "16px 18px", border: "1.5px solid #E0E7FF", borderRadius: "12px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.75, resize: "vertical", minHeight: "140px", transition: "all 0.15s" };
const IN: React.CSSProperties = { width: "100%", padding: "12px 16px", border: "1.5px solid #E0E7FF", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.5, transition: "all 0.15s" };
const LB: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "8px", display: "block" };

const foc = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px ${C.accent}20`; };
const blu = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = "#E0E7FF"; e.target.style.boxShadow = "none"; };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CreenciasInstrumentado({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const inicial: CreenciaItem[] = Array.isArray(datos.creencias)
    ? datos.creencias.map((c: CreenciaItem | string, i: number) =>
        typeof c === "string" ? { id: `c-${i}`, texto: c } : { ...(c as CreenciaItem), id: (c as CreenciaItem).id ?? `c-${i}` })
    : [];

  const [items, setItems] = useState<CreenciaItem[]>(inicial);
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [filtro, setFiltro] = useState<string>("all");

  const sync = (nuevos: CreenciaItem[]) => { setItems(nuevos); setDatos({ ...datos, creencias: nuevos }); };
  const añadir = (base?: CreenciaCatalogo) => sync([...items, base
    ? { id: `c-${Date.now()}`, texto: base.texto, categoria: base.categoria, costo: base.costoTipico, reformulacion: base.reformulacionSugerida, intensidad: 5 }
    : { id: `c-${Date.now()}`, texto: "", intensidad: 5 }]);
  const quitar = (id: string) => sync(items.filter(c => c.id !== id));
  const upd = (id: string, patch: Partial<CreenciaItem>) => sync(items.map(c => c.id === id ? { ...c, ...patch } : c));

  const conteoPorCat = useMemo(() => {
    const r: Record<string, number> = {};
    items.forEach(i => { if (i.categoria) r[i.categoria] = (r[i.categoria] ?? 0) + 1; });
    return r;
  }, [items]);

  const intensidadProm = items.length ? items.reduce((a, b) => a + (b.intensidad ?? 0), 0) / items.length : 0;
  const catalogoFiltrado = filtro === "all" ? CREENCIAS_FRECUENTES : CREENCIAS_FRECUENTES.filter(c => c.categoria === filtro);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Mini-hero */}
      <div style={{ background: C.hero, borderRadius: "16px", padding: "28px 32px", position: "relative", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ position: "absolute", right: "-10px", top: "-15px", fontSize: "90px", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>CREENCIAS</div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(167,139,250,0.15), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "4px 12px 4px 8px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent }} className="animate-pulse" />
            Etapa I · Diagnóstico — Herramienta 2
          </div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "8px" }}>
            Mapa de <span style={{ background: C.span, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>creencias</span>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: "560px", textAlign: "justify" as const, margin: 0 }}>
            Hace visibles las narrativas internas que el líder repite inconscientemente y que actúan como techo invisible de su desempeño. Sin nombrarlas no se pueden desafiar. Con ellas nombradas, empieza el verdadero trabajo de transformación.
          </p>
          <div style={{ display: "flex", gap: "0", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {[
              { val: items.length, lbl: "Creencias identificadas" },
              { val: intensidadProm.toFixed(1), lbl: "Intensidad promedio" },
              { val: Object.keys(conteoPorCat).length, lbl: "Categorías activas" },
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
      <div style={{ background: C.qBg, border: "1.5px solid #C4B5FD", borderRadius: "14px", padding: "20px 24px", display: "flex", gap: "14px", marginBottom: "24px" }}>
        <span style={{ fontSize: "26px", flexShrink: 0 }}>🧠</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#4C1D95", marginBottom: "5px" }}>¿Para qué sirve el Mapa de creencias?</div>
          <div style={{ fontSize: "14px", color: "#3730A3", lineHeight: 1.75, textAlign: "justify" as const }}>
            Las creencias limitantes son las narrativas que el líder se repite — a menudo sin saberlo — y que determinan sus decisiones, su tolerancia al riesgo y su capacidad para delegar. El Mapa hace visible lo invisible: nombrar una creencia es el primer paso para poder cuestionarla. Sin este mapa, el coaching trabaja síntomas; con él, trabaja causas.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { val: items.length, lbl: "Creencias mapeadas", icon: "🧠" },
          { val: intensidadProm > 0 ? intensidadProm.toFixed(1) + "/10" : "—", lbl: "Intensidad promedio", icon: "⚡" },
          { val: Object.keys(conteoPorCat).length, lbl: "Categorías activas", icon: "🗂️" },
        ].map((s, i) => (
          <div key={i} style={{ background: C.statBg, borderRadius: "12px", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(167,139,250,0.2), transparent)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{s.icon} {s.lbl}</div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "white", lineHeight: 1 }}>{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category pills */}
      {Object.keys(conteoPorCat).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          {CATEGORIAS_CREENCIAS.map(cat => {
            const n = conteoPorCat[cat.id] ?? 0;
            if (!n) return null;
            return <span key={cat.id} style={{ background: cat.color, color: "white", borderRadius: "999px", padding: "5px 14px", fontSize: "12px", fontWeight: 700 }}>{cat.nombre}: {n}</span>;
          })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
        <button onClick={() => setShowCatalogo(s => !s)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "11px 20px", borderRadius: "10px", border: "1.5px solid #E0E7FF", background: "white", fontSize: "14px", fontWeight: 600, color: "#4C1D95", cursor: "pointer" }}>
          <Library style={{ width: "15px", height: "15px" }} /> Banco de creencias ({CREENCIAS_FRECUENTES.length})
          <ChevronDown style={{ width: "14px", height: "14px", transform: showCatalogo ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        <button onClick={() => añadir()} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "11px 20px", borderRadius: "10px", border: "none", background: C.active, fontSize: "14px", fontWeight: 700, color: "white", cursor: "pointer", boxShadow: `0 4px 14px ${C.accent}40` }}>
          <Plus style={{ width: "15px", height: "15px" }} /> Crear creencia propia
        </button>
      </div>

      {/* Catalog */}
      {showCatalogo && (
        <div style={{ background: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "560px", overflowY: "auto", marginBottom: "24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <button onClick={() => setFiltro("all")} style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "999px", border: `1.5px solid ${filtro === "all" ? C.accent : "#E0E7FF"}`, background: filtro === "all" ? C.active : "white", color: filtro === "all" ? "white" : "#64748B", cursor: "pointer", fontWeight: 600 }}>Todas</button>
            {CATEGORIAS_CREENCIAS.map(cat => (
              <button key={cat.id} onClick={() => setFiltro(filtro === cat.id ? "all" : cat.id)} style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "999px", border: `1.5px solid ${filtro === cat.id ? cat.color : "#E0E7FF"}`, background: filtro === cat.id ? cat.color : "white", color: filtro === cat.id ? "white" : "#64748B", cursor: "pointer", fontWeight: 600 }}>
                {cat.nombre}
              </button>
            ))}
          </div>
          {catalogoFiltrado.map(c => {
            const cat = CATEGORIAS_CREENCIAS.find(x => x.id === c.categoria);
            const ya = items.some(i => i.texto === c.texto);
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", background: "white", borderRadius: "10px", border: "1px solid #E0E7FF" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", color: "#0C4A6E", fontWeight: 600, marginBottom: "4px" }}>{c.texto}</div>
                  {cat && <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "999px", border: `1.5px solid ${cat.color}`, color: cat.color, fontWeight: 600 }}>{cat.nombre}</span>}
                </div>
                <button disabled={ya} onClick={() => añadir(c)} style={{ padding: "8px 16px", borderRadius: "8px", border: `1.5px solid ${ya ? "#E0E7FF" : C.accent}`, background: ya ? "#F5F7FF" : "white", color: ya ? "#94A3B8" : C.accent, fontSize: "12px", fontWeight: 700, cursor: ya ? "default" : "pointer", flexShrink: 0 }}>
                  {ya ? "Añadida" : "Añadir"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Belief cards */}
      {items.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", background: "#F5F7FF", borderRadius: "16px", border: "1px solid #E0E7FF" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>💭</div>
          <p style={{ fontSize: "15px", color: "#94A3B8", fontStyle: "italic" }}>Añade creencias desde el banco o crea las propias del líder en su propio lenguaje.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {items.map((c, idx) => {
            const cat = CATEGORIAS_CREENCIAS.find(x => x.id === c.categoria);
            const color = cat?.color ?? C.accent;
            return (
              <div key={c.id} style={{ background: "white", border: `1px solid ${color}30`, borderLeft: `4px solid ${color}`, borderRadius: "0 16px 16px 0", padding: "24px 28px" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${color}15`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Creencia #{idx + 1}</div>
                    <textarea style={{ ...TA, minHeight: "100px" }} value={c.texto} onChange={e => upd(c.id, { texto: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} placeholder="En lenguaje del propio líder — tal como lo dice en sus propias palabras…" />
                  </div>
                  <button onClick={() => quitar(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: "4px", flexShrink: 0 }}><X style={{ width: "16px", height: "16px" }} /></button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                  <div>
                    <span style={LB}>Categoría</span>
                    <select style={{ ...IN }} value={c.categoria ?? ""} onChange={e => upd(c.id, { categoria: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLSelectElement>} onBlur={blu as React.FocusEventHandler<HTMLSelectElement>}>
                      <option value="">— sin clasificar —</option>
                      {CATEGORIAS_CREENCIAS.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <span style={LB}>Intensidad: <strong style={{ color: C.accent }}>{c.intensidad ?? 5}/10</strong></span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                        const on = (c.intensidad ?? 5) === n;
                        return <button key={n} onClick={() => upd(c.id, { intensidad: n })} style={{ flex: 1, height: "36px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, border: `1.5px solid ${on ? "transparent" : "#E0E7FF"}`, background: on ? C.active : "white", color: on ? "white" : "#64748B", cursor: "pointer" }}>{n}</button>;
                      })}
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                  <div>
                    <span style={LB}>¿De dónde viene? (origen)</span>
                    <input style={IN} value={c.origen ?? ""} onChange={e => upd(c.id, { origen: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLInputElement>} onBlur={blu as React.FocusEventHandler<HTMLInputElement>} placeholder="Padre, primer jefe, fracaso pasado…" />
                  </div>
                  <div>
                    <span style={LB}>¿Qué le cuesta hoy?</span>
                    <input style={IN} value={c.costo ?? ""} onChange={e => upd(c.id, { costo: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLInputElement>} onBlur={blu as React.FocusEventHandler<HTMLInputElement>} placeholder="Tiempo, relaciones, oportunidades…" />
                  </div>
                </div>

                {/* Question card for belief origin */}
                <div style={{ background: C.qBg, borderLeft: `4px solid ${C.qBorder}`, borderRadius: "0 12px 12px 0", padding: "16px 20px", marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Reflexión sobre el origen</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", lineHeight: 1.5 }}>¿En qué situación concreta de la semana pasada se activó esta creencia? ¿Cómo afectó tu decisión o comportamiento?</div>
                  <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px", fontStyle: "italic" }}>La evidencia concreta es lo que transforma una creencia abstracta en un patrón observable y trabajable.</div>
                </div>
                <textarea style={{ ...TA, minHeight: "100px", marginBottom: "14px" }} value={c.evidencia ?? ""} onChange={e => upd(c.id, { evidencia: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} placeholder="Situación concreta donde se activó esta creencia esta semana…" />

                <div style={{ background: C.qBg, borderLeft: `4px solid ${C.qBorder}`, borderRadius: "0 12px 12px 0", padding: "16px 20px", marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Reformulación</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E", lineHeight: 1.5 }}>Si esta creencia fuera una mentira cómoda, ¿cuál sería la narrativa más útil y honesta que podría tomar su lugar?</div>
                  <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px", fontStyle: "italic" }}>No se trata de pensar positivo — se trata de una narrativa más precisa y útil que la actual.</div>
                </div>
                <textarea style={{ ...TA, minHeight: "100px" }} value={c.reformulacion ?? ""} onChange={e => upd(c.id, { reformulacion: e.target.value })} onFocus={foc as React.FocusEventHandler<HTMLTextAreaElement>} onBlur={blu as React.FocusEventHandler<HTMLTextAreaElement>} placeholder="Nueva narrativa más útil — en primera persona, presente, accionable…" />
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
