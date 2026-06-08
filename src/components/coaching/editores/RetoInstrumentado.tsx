import { useState } from "react";
import { RETOS_BANCO, type RetoCatalogo } from "@/lib/coaching-instrumentos";
import { CheckCircle2, Circle, Library, ChevronDown } from "lucide-react";

// Etapa III — Sostenimiento · Color #BA7517 (naranja)
const C = {
  hero:   "linear-gradient(135deg, #78350F 0%, #92400E 50%, #B45309 100%)",
  accent: "#BA7517",
  span:   "linear-gradient(135deg, #FCD34D, #FDE68A)",
  qBg:    "linear-gradient(135deg, #FEF3C7, #FDE68A55)",
  active: "linear-gradient(135deg, #BA7517, #EF4444)",
};

const TA: React.CSSProperties = { width: "100%", padding: "16px 18px", border: "1.5px solid #E0E7FF", borderRadius: "12px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.75, resize: "vertical", minHeight: "100px", transition: "all 0.15s" };
const foc = (e: React.FocusEvent<HTMLTextAreaElement>) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px ${C.accent}25`; };
const blu = (e: React.FocusEvent<HTMLTextAreaElement>) => { e.target.style.borderColor = "#E0E7FF"; e.target.style.boxShadow = "none"; };

interface RetoActivo {
  id: string; reto_id?: string; titulo: string; dimension: string;
  dias: { texto: string; completado: boolean; reflexion?: string }[];
  reflexionFinal?: string; aprendizajeAgregado?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RetoInstrumentado({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const reto: RetoActivo | null = datos.reto_activo ?? null;
  const [showCatalogo, setShowCatalogo] = useState(!reto);

  const elegir = (r: RetoCatalogo) => {
    setDatos({ ...datos, reto_activo: { id: `r-${Date.now()}`, reto_id: r.id, titulo: r.titulo, dimension: r.dimension, dias: r.microRetos.map(m => ({ texto: m, completado: false, reflexion: "" })), reflexionFinal: r.reflexionFinal, aprendizajeAgregado: "" } });
    setShowCatalogo(false);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updDia = (idx: number, patch: any) => { if (!reto) return; setDatos({ ...datos, reto_activo: { ...reto, dias: reto.dias.map((d, i) => i === idx ? { ...d, ...patch } : d) } }); };
  const updReto = (patch: Partial<RetoActivo>) => { if (!reto) return; setDatos({ ...datos, reto_activo: { ...reto, ...patch } }); };
  const reiniciar = () => { if (!confirm("¿Cambiar de reto? Perderás el progreso actual.")) return; setDatos({ ...datos, reto_activo: null }); setShowCatalogo(true); };

  const completados = reto?.dias.filter(d => d.completado).length ?? 0;
  const totalDias = reto?.dias.length ?? 7;
  const pct = totalDias ? Math.round((completados / totalDias) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Mini-hero */}
      <div style={{ background: C.hero, borderRadius: "16px", padding: "28px 32px", position: "relative", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ position: "absolute", right: "-10px", top: "-15px", fontSize: "110px", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>RETO</div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(252,211,77,0.1), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "4px 12px 4px 8px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent }} className="animate-pulse" />
            Etapa III · Sostenimiento — Reto de 7 días
          </div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "8px" }}>
            Reto de <span style={{ background: C.span, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>7 días</span>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: "560px", textAlign: "justify" as const, margin: 0 }}>
            Instalación de un nuevo comportamiento de liderazgo a través de la repetición consciente. La práctica diaria de 7 días crea el surco neuronal que convierte el comportamiento nuevo en automático.
          </p>
          {reto && (
            <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, #FCD34D, #FDE68A)", borderRadius: "999px", width: `${pct}%`, transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: "16px", fontWeight: 900, color: "white" }}>{completados}/{totalDias}</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>días · {pct}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Insight card */}
      <div style={{ background: C.qBg, border: "1.5px solid #FCD34D", borderRadius: "14px", padding: "20px 24px", display: "flex", gap: "14px", marginBottom: "24px" }}>
        <span style={{ fontSize: "26px", flexShrink: 0 }}>💪</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#78350F", marginBottom: "5px" }}>¿Para qué sirve el Reto de 7 días?</div>
          <div style={{ fontSize: "14px", color: "#92400E", lineHeight: 1.75, textAlign: "justify" as const }}>
            El cambio profundo no ocurre en la sesión — ocurre entre sesiones, en los micro-momentos del día real. El reto fuerza la repetición de un nuevo comportamiento hasta que deja de requerir esfuerzo consciente. Si el líder falla un día, no se reinicia — se continúa y se reflexiona el fallo. La imperfección es parte del aprendizaje.
          </div>
        </div>
      </div>

      {/* Active challenge */}
      {reto && (
        <>
          <div style={{ background: "linear-gradient(135deg, #78350F, #B45309)", borderRadius: "16px", padding: "24px 28px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(252,211,77,0.15), transparent)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#FCD34D", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Reto activo · {reto.dimension}</div>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", marginBottom: "14px" }}>{reto.titulo}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg, #FCD34D, #FDE68A)", borderRadius: "999px", width: `${pct}%` }} />
                </div>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "white" }}>{completados}/{totalDias}</span>
              </div>
              <button onClick={reiniciar} style={{ marginTop: "12px", background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
                Cambiar reto
              </button>
            </div>
          </div>

          {/* Day cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {reto.dias.map((d, i) => (
              <div key={i} style={{ background: d.completado ? "#FFFBEB" : "white", border: `1px solid ${d.completado ? "#FCD34D" : "#E0E7FF"}`, borderRadius: "16px", padding: "20px 24px", display: "flex", gap: "16px", transition: "all 0.2s" }}
                onMouseEnter={e => { if (!d.completado) (e.currentTarget as HTMLDivElement).style.borderColor = "#FCD34D"; }}
                onMouseLeave={e => { if (!d.completado) (e.currentTarget as HTMLDivElement).style.borderColor = "#E0E7FF"; }}
              >
                <button onClick={() => updDia(i, { completado: !d.completado })} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", flexShrink: 0, marginTop: "2px" }}>
                  {d.completado
                    ? <CheckCircle2 style={{ width: "28px", height: "28px", color: C.accent }} />
                    : <Circle style={{ width: "28px", height: "28px", color: "#CBD5E1" }} />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Día {i + 1}</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: d.completado ? C.accent : "#0C4A6E", marginBottom: "12px", lineHeight: 1.4 }}>{d.texto}</div>
                  <textarea style={TA} value={d.reflexion ?? ""} onChange={e => updDia(i, { reflexion: e.target.value })} onFocus={foc} onBlur={blu} placeholder="¿Cómo fue este día? ¿Qué observaste en ti? ¿Qué resultó diferente? (5 minutos de honestidad)" />
                </div>
              </div>
            ))}
          </div>

          {/* Final reflection */}
          {reto.reflexionFinal && pct > 50 && (
            <div style={{ background: C.qBg, border: "1.5px solid #FCD34D", borderRadius: "16px", padding: "24px 28px", marginBottom: "20px" }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#78350F", marginBottom: "10px" }}>🎯 Reflexión final del reto</div>
              <div style={{ fontSize: "14px", color: "#92400E", fontStyle: "italic", marginBottom: "16px", padding: "12px 16px", background: "white", borderRadius: "8px", lineHeight: 1.75 }}>
                "{reto.reflexionFinal}"
              </div>
              <textarea style={TA} value={reto.aprendizajeAgregado ?? ""} onChange={e => updReto({ aprendizajeAgregado: e.target.value })} onFocus={foc} onBlur={blu} placeholder="¿Qué aprendiste sobre ti mismo como líder después de estos 7 días? ¿Qué cambio observaste? ¿Qué vas a sostener después del reto?" />
            </div>
          )}
        </>
      )}

      {/* Catalog */}
      <button onClick={() => setShowCatalogo(s => !s)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 20px", borderRadius: "10px", border: "1.5px solid #E0E7FF", background: "white", fontSize: "14px", fontWeight: 600, color: "#78350F", cursor: "pointer", alignSelf: "flex-start", marginBottom: "16px" }}>
        <Library style={{ width: "15px", height: "15px" }} /> Banco de retos ({RETOS_BANCO.length})
        <ChevronDown style={{ width: "14px", height: "14px", transform: showCatalogo ? "rotate(180deg)" : "none" }} />
      </button>

      {showCatalogo && (
        <div style={{ background: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {RETOS_BANCO.map(r => (
            <div key={r.id} style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "12px", padding: "18px 22px", display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#0C4A6E", marginBottom: "4px" }}>{r.titulo}</div>
                <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", background: "#FEF3C7", color: "#78350F", fontWeight: 600 }}>{r.dimension}</span>
                <p style={{ fontSize: "13px", color: "#64748B", marginTop: "8px", lineHeight: 1.6, textAlign: "justify" as const }}>{r.proposito}</p>
              </div>
              <button onClick={() => elegir(r)} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: C.active, color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                Elegir
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
