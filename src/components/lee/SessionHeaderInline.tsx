import { ChevronUp } from "lucide-react";
import { getSesion } from "@/lib/lee-catalogo";

interface Props {
  chapter: number;
  tabId: string; // "in" | "s1".."s4" | "ci"
  onEnterImmersive?: () => void;
}

interface PageHeader { eyebrow: string; titulo: string }

// Intro/cierre text extracted from the HTML workbooks — static per chapter
const INTRO: Record<number, PageHeader> = {
  1:  { eyebrow: "Capítulo 1 · Introducción general",      titulo: "Antes de comenzar — Cómo usar este workbook" },
  2:  { eyebrow: "Capítulo 2 · Introducción",              titulo: "Antes de comenzar — El puente del Capítulo 1 al Capítulo 2" },
  3:  { eyebrow: "Capítulo 3 · Introducción",              titulo: "Antes de comenzar — De diseñar sistemas a medirlos" },
  4:  { eyebrow: "Capítulo 4 · Introducción",              titulo: "Antes de comenzar — Del diagnóstico a las habilidades que lo resuelven" },
  5:  { eyebrow: "Capítulo 5 · Índice maestro y encuadre", titulo: "La ruta de construcción de equipos autónomos: de la dependencia a la capacidad instalada" },
  6:  { eyebrow: "Capítulo 6 · Índice maestro y encuadre", titulo: "Dirigir el presente es necesario. Construir el futuro es indelegable." },
  7:  { eyebrow: "Capítulo 7 · Introducción",              titulo: "El verdadero origen de la ventaja competitiva" },
  8:  { eyebrow: "Introducción",                            titulo: "El momento donde el liderazgo es puesto a prueba" },
  9:  { eyebrow: "Introducción ejecutiva",                  titulo: "El liderazgo como sistema personal de evolución" },
  10: { eyebrow: "INTRODUCCIÓN · CAPSTONE",                titulo: "Integración final y transición al liderazgo evolutivo permanente" },
};

const CIERRE: Record<number, PageHeader> = {
  1:  { eyebrow: "Cierre · Capítulo 1",                    titulo: "Síntesis · Compromisos consolidados · Puente al Capítulo 2" },
  2:  { eyebrow: "Cierre · Capítulo 2",                    titulo: "Síntesis · Compromisos consolidados · Puente al Capítulo 3" },
  3:  { eyebrow: "Cierre · Capítulo 3",                    titulo: "Síntesis · Pérdida Total Anual · Puente al Capítulo 4" },
  4:  { eyebrow: "Cierre · Capítulo 4",                    titulo: "Síntesis · Tu Kit de Habilidades Estructurales · Puente al Capítulo 5" },
  5:  { eyebrow: "Capítulo 5 · Cierre · Blueprint de autonomía",    titulo: "Convertir el aprendizaje en una arquitectura de autonomía" },
  6:  { eyebrow: "Capítulo 6 · Cierre · Blueprint estratégico",     titulo: "Convertir dirección, análisis y decisiones en una agenda de construcción futura" },
  7:  { eyebrow: "Cierre · Blueprint de liderazgo humano",          titulo: "Convertir desarrollo, compromiso y cultura en un sistema de gestión" },
  8:  { eyebrow: "Cierre ejecutivo",                                titulo: "Blueprint · Leadership Resilience & Change Operating System" },
  9:  { eyebrow: "Cierre ejecutivo",                                titulo: "Blueprint · Personal Leadership Evolution Operating System" },
  10: { eyebrow: "BLUEPRINT FINAL",                                 titulo: "Leadership Evolution Capstone Blueprint" },
};

const SKY = "#38BDF8";

export function SessionHeaderInline({ chapter, tabId, onEnterImmersive }: Props) {
  let header: PageHeader | undefined;
  let meta: string[] = [];

  if (tabId === "in") {
    header = INTRO[chapter];
  } else if (tabId === "ci") {
    header = CIERRE[chapter];
  } else if (/^s\d+$/.test(tabId)) {
    const ses = getSesion(chapter, parseInt(tabId.slice(1)));
    if (ses) { header = ses; meta = ses.meta; }
  }

  if (!header) return null;

  return (
    <div style={{
      flexShrink: 0,
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 58%, #312E81 100%)",
      borderRadius: "0 0 28px 28px",
      padding: "clamp(24px, 3.5vh, 40px) 52px clamp(28px, 3.5vh, 44px)",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 90% at 88% 20%, rgba(56,189,248,0.20), transparent 60%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.075) 1.4px, transparent 1.4px)",
        backgroundSize: "28px 28px",
      }} />
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: "999px", padding: "7px 15px",
          color: SKY, fontSize: "11px", fontWeight: 900,
          textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "14px",
        }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: SKY, flexShrink: 0, display: "inline-block" }} />
          {header.eyebrow}
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(22px, 2.6vw, 34px)",
          fontWeight: 900, lineHeight: 1.14,
          color: "#fff", letterSpacing: "-.03em",
          margin: "0 0 14px", maxWidth: "860px",
        }}>
          {header.titulo}
        </h2>
        {meta.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {meta.map((m, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center",
                background: "rgba(255,255,255,0.095)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "999px", padding: "5px 13px",
                fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.88)",
              }}>
                {m}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
          <button
            onClick={onEnterImmersive}
            className="flex items-center gap-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #0EA5E9, #3B82F6)",
              border: "none",
              cursor: "pointer", color: "#fff",
              boxShadow: "0 2px 12px rgba(14,165,233,0.45)",
              padding: "6px 12px",
            }}
          >
            <ChevronUp className="w-3.5 h-3.5" /> Ocultar menú
          </button>
        </div>
      </div>
    </div>
  );
}
