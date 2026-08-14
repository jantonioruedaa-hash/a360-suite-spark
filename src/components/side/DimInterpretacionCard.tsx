import { semaforo, DIM_CONTENT } from "@/lib/side-content";

export function DimInterpretacionCard({
  dimKey, score, suma, sumaMax,
}: {
  dimKey: string; score: number; suma: number; sumaMax: number;
}) {
  const sem = semaforo(score);
  if (sem.level === "nodata") return null;
  const content = DIM_CONTENT[dimKey];
  if (!content) return null;
  const lvl = content[sem.level as "critico" | "desarrollo" | "avanzado"];
  return (
    <div style={{ borderRadius: 16, border: `1.5px solid ${sem.border}`, background: sem.bg, padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>{sem.emoji}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: sem.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{sem.label}</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>{`${score.toFixed(1)}/5 · ${Math.round(score * 20)}% · suma ${suma}/${sumaMax}`}</div>
        </div>
      </div>
      <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.85, textAlign: "justify", marginBottom: 20 }}>{lvl.interpretacion}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#0C4A6E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Recomendaciones</div>
          {lvl.recomendaciones.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: sem.color, color: "white", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>{r}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#0C4A6E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Iniciativas concretas</div>
          {lvl.iniciativas.map((ini, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <div style={{ fontSize: 16, flexShrink: 0 }}>→</div>
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>{ini}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
