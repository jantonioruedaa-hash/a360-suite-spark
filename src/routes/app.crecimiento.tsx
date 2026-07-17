import { createFileRoute } from "@tanstack/react-router";
import { PreviewGate } from "@/components/PreviewGate";

export const Route = createFileRoute("/app/crecimiento")({
  component: CrecimientoPage,
});

// ── Preview (sin datos reales) ────────────────────────────────────────────────
function CrecimientoPreview() {
  const capabilities = [
    { icon: "📝", name: "Estrategia de contenido", desc: "Plan editorial digitalizado para redes sociales y canales LATAM adaptado a tu industria y audiencia.", color: "#7C3AED" },
    { icon: "🔄", name: "Embudo de conversión",    desc: "Visualiza el journey del cliente desde el primer contacto hasta la venta y la fidelización.",           color: "#0EA5E9" },
    { icon: "📊", name: "Plan de medios digital",  desc: "Distribución de presupuesto y canales optimizada para el mercado latinoamericano con métricas claras.",    color: "#059669" },
    { icon: "📈", name: "KPIs de marketing",       desc: "Indicadores clave: CAC, LTV, ROI por canal y tasa de conversión para cada etapa del embudo.",              color: "#F59E0B" },
  ];

  const funnel = [
    { label: "Visitas",   value: "12,400", pct: 100, color: "#7C3AED" },
    { label: "Leads",     value: "3,720",  pct: 30,  color: "#0EA5E9" },
    { label: "Prospectos",value: "742",    pct: 13,  color: "#059669" },
    { label: "Clientes",  value: "89",     pct: 5,   color: "#F59E0B" },
  ];

  return (
    <div style={{ background: "#F5F7FF" }}>
      {/* Capabilities */}
      <div style={{ background: "white", padding: "56px 64px", borderBottom: "1px solid #E0E7FF" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "8px" }}>
          Lo que incluye este módulo
        </div>
        <h2 style={{ fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em", marginBottom: "32px" }}>
          Marketing digital para PyMEs latinoamericanas
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          {capabilities.map((cap) => (
            <div
              key={cap.name}
              style={{
                background: "#F5F7FF", borderRadius: "14px",
                border: "1px solid #E0E7FF", borderLeft: `4px solid ${cap.color}`,
                padding: "24px",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{cap.icon}</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0C4A6E", marginBottom: "8px" }}>{cap.name}</div>
              <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.7, margin: 0 }}>{cap.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mini funnel */}
      <div style={{ padding: "56px 64px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "8px" }}>
          Visualización incluida
        </div>
        <h2 style={{ fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em", marginBottom: "28px" }}>
          Embudo de conversión
        </h2>
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E0E7FF", padding: "32px", maxWidth: "480px" }}>
          {funnel.map((stage, i) => (
            <div key={stage.label} style={{ marginBottom: i < funnel.length - 1 ? "14px" : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{stage.label}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: stage.color }}>{stage.value}</span>
              </div>
              <div style={{ height: "26px", background: "#F0F4FF", borderRadius: "6px", overflow: "hidden" }}>
                <div
                  style={{ height: "100%", width: `${stage.pct}%`, background: stage.color, borderRadius: "6px", opacity: 0.82 }}
                />
              </div>
            </div>
          ))}
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #E0E7FF", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>Tasa de conversión total</span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#7C3AED" }}>0.72%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Full module (iframe) ──────────────────────────────────────────────────────
function CrecimientoFull() {
  return (
    <div
      style={{
        margin: "-24px -32px",
        height: "calc(100vh - 56px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <iframe
        src="/marketing-digital-v9.html"
        title="Marketing Digital A360"
        style={{ width: "100%", flex: 1, border: "none" }}
        allow="clipboard-write"
      />
    </div>
  );
}

// ── Route entry point (auth-gated) ────────────────────────────────────────────
function CrecimientoPage() {
  return (
    <PreviewGate
      moduleName="Marketing Digital"
      moduleDescription="Estrategia de crecimiento digital adaptada al mercado latinoamericano: contenido, medios, embudos de conversión y KPIs de marketing para PyMEs."
      moduleIcon={<span style={{ fontSize: "1.6rem" }}>📢</span>}
      previewContent={<CrecimientoPreview />}
    >
      <CrecimientoFull />
    </PreviewGate>
  );
}
