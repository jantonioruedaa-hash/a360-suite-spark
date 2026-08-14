import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { ScaleButtons } from "@/components/side/ScaleButtons";
import { DimInterpretacionCard } from "@/components/side/DimInterpretacionCard";
import { IndiceInterpretacionCard } from "@/components/side/IndiceInterpretacionCard";
import { semaforo, semaforoIDF } from "@/lib/side-content";
import {
  DIMENSIONES, IVEE_PREGUNTAS, IDF_PREGUNTAS, COF_PREGUNTAS, promedio,
  type ScoreMap,
} from "@/lib/side-data";

interface Props {
  nombre: string;
  imeScore: number;
  iveeScore: number;
  idfScore: number;
  cofScore: number;
  comentarioConsultor: string | null;
  revisadoEn: string | null;
  scores: ScoreMap;
  onBack: () => void;
}

const DIM_EMOJI: Record<string, string> = {
  L: "👑", E: "🎯", G: "⚖️", O: "🏗️", GE: "⚙️", F: "💰",
  C: "🤝", M: "📣", OP: "🔧", CU: "🌱", T: "👥", ES: "🚀",
};

export function SideResultadosCliente({
  nombre, imeScore, iveeScore, idfScore, cofScore,
  comentarioConsultor, revisadoEn, scores, onBack,
}: Props) {
  const [expandido, setExpandido] = useState<string | null>(null);
  const imeSem = semaforo(imeScore);

  const toggle = (key: string) => setExpandido((prev) => (prev === key ? null : key));

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', minHeight: "100vh", background: "#F0F4FF" }}>

      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "linear-gradient(135deg, #059669, #0C4A6E)",
        padding: "16px 32px", display: "flex", alignItems: "center", gap: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
            padding: "8px 12px", color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Volver
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {nombre} — Resultados del diagnóstico
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
            {imeSem.emoji} IME {imeScore > 0 ? imeScore.toFixed(2) : "—"}/5 · {imeSem.label}
            {revisadoEn && ` · Revisado ${new Date(revisadoEn).toLocaleDateString("es-EC")}`}
          </div>
        </div>
      </div>

      <div style={{ padding: "40px 32px", maxWidth: 900, margin: "0 auto" }}>

        {/* Consultant note */}
        {comentarioConsultor && (
          <div style={{ background: "linear-gradient(135deg, #0C4A6E, #0369A1)", borderRadius: 18, padding: "24px 28px", marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>
              Nota de tu consultor
            </div>
            <p style={{ fontSize: 16, color: "white", lineHeight: 1.75, margin: 0 }}>{comentarioConsultor}</p>
          </div>
        )}

        {/* Score summary */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #E0E7FF", padding: "28px 32px", marginBottom: 32 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0C4A6E", marginBottom: 20 }}>Resumen del diagnóstico</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
            {([
              { label: "IME", value: imeScore, fn: semaforo },
              { label: "IVEE", value: iveeScore, fn: semaforo },
              { label: "IDF", value: idfScore, fn: semaforoIDF },
              { label: "COF", value: cofScore, fn: semaforo },
            ] as const).map(({ label, value, fn }) => {
              const s = fn(value);
              return (
                <div key={label} style={{ background: s.bg, borderRadius: 14, padding: "16px 20px", border: `1.5px solid ${s.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1.1, margin: "6px 0" }}>{value > 0 ? value.toFixed(2) : "—"}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{s.label}</div>
                </div>
              );
            })}
          </div>
          {/* Dimension mini-grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {DIMENSIONES.map((d) => {
              const sc = promedio(d.preguntas.map((p) => p.id), scores);
              const s = semaforo(sc);
              return (
                <button
                  key={d.key}
                  onClick={() => toggle(d.key)}
                  style={{
                    background: s.bg, borderRadius: 10, padding: "10px 12px",
                    border: `1.5px solid ${s.border}`, cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.key}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.color, margin: "3px 0" }}>{sc > 0 ? sc.toFixed(1) : "—"}</div>
                  <div style={{ fontSize: 10, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nombre}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dimension accordion */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0C4A6E", marginBottom: 16 }}>Detalle por dimensión</div>
          {DIMENSIONES.map((dim) => {
            const open = expandido === dim.key;
            const sc = promedio(dim.preguntas.map((p) => p.id), scores);
            const s = semaforo(sc);
            const suma = dim.preguntas.reduce((a, p) => a + (scores[p.id] ?? 0), 0);
            const sumaMax = dim.preguntas.length * 5;
            return (
              <div key={dim.key} style={{ background: "white", borderRadius: 18, border: "1px solid #E0E7FF", marginBottom: 10, overflow: "hidden" }}>
                <button
                  onClick={() => toggle(dim.key)}
                  style={{ width: "100%", background: "none", border: "none", padding: "18px 24px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{DIM_EMOJI[dim.key] ?? "📋"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0C4A6E" }}>{dim.nombre}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                      {sc > 0 ? `${sc.toFixed(1)}/5 · ${s.label}` : "Sin datos"}
                    </div>
                  </div>
                  {sc > 0 && (
                    <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, flexShrink: 0 }}>
                      {s.emoji} {sc.toFixed(1)}
                    </span>
                  )}
                  <ChevronDown style={{ width: 20, height: 20, color: "#94A3B8", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {open && (
                  <div style={{ borderTop: "1px solid #F0F4FF" }}>
                    <div style={{ padding: "16px 24px 8px" }}>
                      {dim.preguntas.map((p) => (
                        <ScaleButtons key={p.id} id={p.id} texto={p.texto} value={scores[p.id]} onChange={() => {}} readOnly />
                      ))}
                    </div>
                    <div style={{ margin: "0 24px 24px" }}>
                      <DimInterpretacionCard dimKey={dim.key} score={sc} suma={suma} sumaMax={sumaMax} />
                      {sc === 0 && (
                        <div style={{ padding: "16px 20px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 14, color: "#94A3B8", textAlign: "center" }}>
                          No hay respuestas registradas para esta dimensión.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Index sections */}
        <div style={{ fontSize: 18, fontWeight: 800, color: "#0C4A6E", marginBottom: 16 }}>Índices estratégicos</div>
        {([
          { id: "ivee" as const, label: "IVEE — Viabilidad y Escalabilidad Empresarial", score: iveeScore, preguntas: IVEE_PREGUNTAS },
          { id: "idf"  as const, label: "IDF — Dependencia del Fundador",                 score: idfScore,  preguntas: IDF_PREGUNTAS },
          { id: "cof"  as const, label: "COF — Coherencia Organizacional y Funcional",    score: cofScore,  preguntas: COF_PREGUNTAS },
        ]).map((idx) => {
          const open = expandido === idx.id;
          const s = idx.id === "idf" ? semaforoIDF(idx.score) : semaforo(idx.score);
          return (
            <div key={idx.id} style={{ background: "white", borderRadius: 18, border: "1px solid #E0E7FF", marginBottom: 10, overflow: "hidden" }}>
              <button
                onClick={() => toggle(idx.id)}
                style={{ width: "100%", background: "none", border: "none", padding: "18px 24px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0C4A6E", flex: 1 }}>{idx.label}</div>
                {idx.score > 0 && (
                  <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, flexShrink: 0 }}>
                    {s.emoji} {idx.score.toFixed(2)}
                  </span>
                )}
                <ChevronDown style={{ width: 20, height: 20, color: "#94A3B8", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {open && (
                <div style={{ borderTop: "1px solid #F0F4FF" }}>
                  <div style={{ padding: "16px 24px 8px" }}>
                    {idx.preguntas.map((p) => (
                      <ScaleButtons key={p.id} id={p.id} texto={p.texto} value={scores[p.id]} onChange={() => {}} readOnly />
                    ))}
                  </div>
                  <div style={{ padding: "0 24px 24px" }}>
                    <IndiceInterpretacionCard indiceId={idx.id} score={idx.score} />
                    {idx.score === 0 && (
                      <div style={{ padding: "16px 20px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 14, color: "#94A3B8", textAlign: "center" }}>
                        No hay respuestas registradas para este índice.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
