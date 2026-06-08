import { REPORTE_SECCIONES } from "@/lib/coaching-instrumentos";
import { CheckCircle2, AlertCircle } from "lucide-react";

// Etapa IV — Transformación · Color #D85A30 (rojo-naranja)
const C = {
  hero:   "linear-gradient(135deg, #7C2D12 0%, #9A3412 50%, #C2410C 100%)",
  accent: "#D85A30",
  span:   "linear-gradient(135deg, #FCA5A5, #FDBA74)",
  qBg:    "linear-gradient(135deg, #FFEDD5, #FED7AA55)",
  active: "linear-gradient(135deg, #D85A30, #F59E0B)",
};

const TA: React.CSSProperties = { width: "100%", padding: "16px 18px", border: "1.5px solid #E0E7FF", borderRadius: "12px", fontSize: "15px", fontFamily: "inherit", color: "#1E293B", background: "white", outline: "none", lineHeight: 1.75, resize: "vertical", minHeight: "160px", transition: "all 0.15s" };

const foc = (e: React.FocusEvent<HTMLTextAreaElement>) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px ${C.accent}20`; };
const blu = (e: React.FocusEvent<HTMLTextAreaElement>) => { e.target.style.borderColor = "#E0E7FF"; e.target.style.boxShadow = "none"; };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ReporteTransformacionInstrumentado({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const secciones = datos.secciones ?? {};
  const upd = (id: string, v: string) => setDatos({ ...datos, secciones: { ...secciones, [id]: v } });

  const cargarPlantilla = () => {
    if (Object.keys(secciones).length > 0 && !confirm("Reemplazará el contenido actual con los ejemplos guía. ¿Continuar?")) return;
    const inicial: Record<string, string> = {};
    REPORTE_SECCIONES.forEach(s => { inicial[s.id] = s.ejemplo; });
    setDatos({ ...datos, secciones: inicial });
  };

  const llenas = REPORTE_SECCIONES.filter(s => (secciones[s.id] ?? "").length > 30).length;
  const pct = REPORTE_SECCIONES.length ? Math.round((llenas / REPORTE_SECCIONES.length) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Mini-hero */}
      <div style={{ background: C.hero, borderRadius: "16px", padding: "28px 32px", position: "relative", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ position: "absolute", right: "-10px", top: "-15px", fontSize: "80px", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>REPORTE</div>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(252,165,165,0.15), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "4px 12px 4px 8px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent }} className="animate-pulse" />
            Etapa IV · Transformación — Reporte de cierre
          </div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "8px" }}>
            Reporte de <span style={{ background: C.span, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>transformación</span>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: "560px", textAlign: "justify" as const, margin: 0 }}>
            Documento ejecutivo que sintetiza el programa completo: línea base, proceso, delta de transformación y recomendaciones. Es el activo institucional que el líder entrega a su sponsor y conserva como evidencia de su evolución.
          </p>
          <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #FCA5A5, #FDBA74)", borderRadius: "999px", width: `${pct}%`, transition: "width 0.5s ease" }} />
            </div>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "white" }}>{pct}%</span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{llenas}/{REPORTE_SECCIONES.length} secciones</span>
          </div>
        </div>
      </div>

      {/* Actions + insight */}
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, background: C.qBg, border: "1.5px solid #FCA5A5", borderRadius: "14px", padding: "18px 22px", display: "flex", gap: "12px" }}>
          <span style={{ fontSize: "24px", flexShrink: 0 }}>📄</span>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#7C2D12", marginBottom: "4px" }}>¿Para qué sirve el Reporte de transformación?</div>
            <div style={{ fontSize: "13px", color: "#9A3412", lineHeight: 1.65, textAlign: "justify" as const }}>
              Este reporte permite que el programa termine con evidencia — no con impresiones. El líder y el sponsor conversan sobre datos concretos: dónde estaba, dónde está y cómo se sostiene. Una vez completas las {REPORTE_SECCIONES.length} secciones, usa <strong>Analizar con IA</strong> para generar la síntesis ejecutiva final.
            </div>
          </div>
        </div>
        <button onClick={cargarPlantilla} style={{ padding: "12px 20px", borderRadius: "10px", border: "1.5px solid #FCA5A5", background: "white", fontSize: "14px", fontWeight: 600, color: "#7C2D12", cursor: "pointer", flexShrink: 0 }}>
          Cargar plantilla
        </button>
      </div>

      {/* Report sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {REPORTE_SECCIONES.map((s, si) => {
          const v = secciones[s.id] ?? "";
          const ok = v.length > 30;
          return (
            <div key={s.id} style={{ background: si % 2 === 0 ? "white" : "#F5F7FF", border: `1px solid ${ok ? "#FCA5A5" : "#E0E7FF"}`, borderLeft: `4px solid ${ok ? C.accent : "#CBD5E1"}`, borderRadius: "0 16px 16px 0", padding: "22px 28px", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${C.accent}10`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                {ok ? <CheckCircle2 style={{ width: "18px", height: "18px", color: C.accent, flexShrink: 0, marginTop: "2px" }} /> : <AlertCircle style={{ width: "18px", height: "18px", color: "#F59E0B", flexShrink: 0, marginTop: "2px" }} />}
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em", marginBottom: "3px" }}>{s.titulo}</div>
                  <div style={{ fontSize: "13px", color: "#64748B", fontStyle: "italic", lineHeight: 1.5 }}>{s.guia}</div>
                </div>
              </div>
              <details style={{ background: "#F5F7FF", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px" }}>
                <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#7C2D12" }}>Ver ejemplo de referencia</summary>
                <p style={{ marginTop: "8px", fontSize: "13px", color: "#475569", lineHeight: 1.65, fontStyle: "italic" }}>"{s.ejemplo}"</p>
              </details>
              <textarea style={TA} value={v} onChange={e => upd(s.id, e.target.value)} onFocus={foc} onBlur={blu} placeholder={`Redacta la sección "${s.titulo}" del reporte final…`} />
            </div>
          );
        })}
      </div>

      {/* Closing note */}
      <div style={{ background: "linear-gradient(135deg, #7C2D12, #9A3412)", borderRadius: "16px", padding: "22px 28px", marginTop: "16px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "6px" }}>✅ Al completar las {REPORTE_SECCIONES.length} secciones</div>
        <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: 1.65 }}>
          Usa el botón <strong>Analizar con IA</strong> en la pantalla principal para que Claude genere la síntesis ejecutiva final — un documento de 1 página en lenguaje del sponsor, listo para presentar. Revisá con el líder antes de enviar: él decide qué se comparte.
        </div>
      </div>

    </div>
  );
}
