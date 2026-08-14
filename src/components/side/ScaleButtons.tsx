export function ScaleButtons({
  id,
  texto,
  value,
  onChange,
  accentGradient = "linear-gradient(135deg, #0EA5E9, #6366F1)",
  readOnly = false,
}: {
  id: string;
  texto: string;
  value?: number;
  onChange: (v: number) => void;
  accentGradient?: string;
  readOnly?: boolean;
}) {
  return (
    <div style={{ background: "white", borderRadius: 18, border: "1px solid #E0E7FF", marginBottom: 16, overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: accentGradient, color: "white", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {id}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#0C4A6E", flex: 1, lineHeight: 1.5 }}>{texto}</div>
        {value && value > 0 && (
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0EA5E9" }}>{value}</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, padding: "0 24px 16px" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={readOnly ? undefined : () => onChange(n)}
            style={{
              flex: 1, padding: "11px 4px", borderRadius: 10,
              border: value === n ? "1.5px solid transparent" : "1.5px solid #E0E7FF",
              background: value === n ? accentGradient : "white",
              fontSize: 14, fontWeight: 700,
              color: value === n ? "white" : readOnly ? "#CBD5E1" : "#64748B",
              cursor: readOnly ? "default" : "pointer",
              textAlign: "center",
              boxShadow: value === n ? "0 4px 12px rgba(14,165,233,0.3)" : "none",
              transition: "all 0.15s",
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 24px 12px", fontSize: 12, color: "#94A3B8" }}>
        <span>1 — Nunca / Muy bajo</span>
        <span>3 — A veces / Medio</span>
        <span>5 — Siempre / Muy alto</span>
      </div>
    </div>
  );
}
