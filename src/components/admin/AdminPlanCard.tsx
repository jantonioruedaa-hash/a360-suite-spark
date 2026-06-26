interface Feature {
  text: string;
  included: boolean;
}

export interface AdminPlanData {
  name: string;
  price: string;
  priceUnit?: string;
  description: string;
  features: Feature[];
  clientCount: number;
  popular?: boolean;
  dark?: boolean;
}

interface Props {
  plan: AdminPlanData;
}

export default function AdminPlanCard({ plan }: Props) {
  const isPrimary = plan.popular;
  const isDark = plan.dark;

  return (
    <div
      style={{
        background: isDark ? "linear-gradient(135deg, #F8FAFF, #EEF2FF)" : "white",
        borderRadius: "20px",
        border: isPrimary
          ? "2px solid #0EA5E9"
          : isDark
            ? "2px solid #0C4A6E"
            : "2px solid #E0E7FF",
        padding: "30px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: isPrimary ? "0 8px 32px rgba(14,165,233,0.1)" : undefined,
      }}
    >
      {plan.popular && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "-28px",
            background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
            color: "white",
            fontSize: "11px",
            fontWeight: 800,
            padding: "5px 40px",
            transform: "rotate(45deg)",
            zIndex: 1,
          }}
        >
          Más popular
        </div>
      )}

      <div
        style={{
          fontSize: "22px",
          fontWeight: 900,
          color: "#0C4A6E",
          marginBottom: "8px",
        }}
      >
        {plan.name}
      </div>

      <div
        style={{
          fontSize: "40px",
          fontWeight: 900,
          color: isDark ? "#0C4A6E" : "#0EA5E9",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          marginBottom: "6px",
        }}
      >
        {plan.price}
        {plan.priceUnit && (
          <span style={{ fontSize: "16px", fontWeight: 600, color: "#94A3B8" }}>
            {" "}
            {plan.priceUnit}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: "15px",
          color: "#64748B",
          marginBottom: "22px",
          lineHeight: "1.75",
          textAlign: "justify",
        }}
      >
        {plan.description}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "11px",
          marginBottom: "24px",
          flex: 1,
        }}
      >
        {plan.features.map((f) => (
          <div
            key={f.text}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "9px",
              fontSize: "15px",
              color: f.included ? "#374151" : "#CBD5E1",
              lineHeight: 1.5,
            }}
          >
            <span
              style={{
                color: f.included ? "#0EA5E9" : "#CBD5E1",
                fontWeight: 800,
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              {f.included ? "✓" : "×"}
            </span>
            {f.text}
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: isDark ? "#0C4A6E" : "#0EA5E9",
          marginTop: "18px",
          paddingTop: "18px",
          borderTop: "1px solid #F0F4FF",
          marginBottom: "16px",
        }}
      >
        {plan.clientCount} empresa{plan.clientCount !== 1 ? "s" : ""} en este plan
      </div>

      <button
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s",
          ...(isPrimary
            ? {
                background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                color: "white",
                border: "none",
                boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
              }
            : isDark
              ? {
                  background: "white",
                  color: "#0C4A6E",
                  border: "1.5px solid #0C4A6E",
                }
              : {
                  background: "white",
                  color: "#0EA5E9",
                  border: "1.5px solid #BAE6FD",
                }),
        }}
      >
        Editar plan
      </button>
    </div>
  );
}
