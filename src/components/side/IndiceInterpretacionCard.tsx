import { semaforo, semaforoIDF, INDICE_CONTENT } from "@/lib/side-content";

export function IndiceInterpretacionCard({
  indiceId, score,
}: {
  indiceId: "ivee" | "idf" | "cof"; score: number;
}) {
  const sem = indiceId === "idf" ? semaforoIDF(score) : semaforo(score);
  if (sem.level === "nodata") return null;
  const content = INDICE_CONTENT[indiceId];
  if (!content) return null;
  const lvl = content[sem.level as "critico" | "desarrollo" | "avanzado"];
  return (
    <div style={{ marginTop: 24, borderRadius: 16, border: `1.5px solid ${sem.border}`, background: sem.bg, padding: "24px 28px" }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: sem.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{sem.emoji} Interpretación · {sem.label}</div>
      <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.85, textAlign: "justify", marginBottom: 20 }}>{lvl.interpretacion}</p>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#0C4A6E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Acciones recomendadas</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {lvl.recomendaciones.map((r, i) => (
          <div key={i} style={{ background: "white", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: sem.color, color: "white", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>{r}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
