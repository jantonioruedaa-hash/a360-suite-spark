import React from "react";

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

  // Resolved colors based on variant
  const nameColor = isDark ? "white" : "#0C4A6E";
  const priceColor = isDark ? "#38BDF8" : isPrimary ? "#0EA5E9" : "#0C4A6E";
  const priceUnitColor = isDark ? "rgba(255,255,255,0.45)" : "#94A3B8";
  const descColor = isDark ? "rgba(255,255,255,0.72)" : "#64748B";
  const dividerColor = isDark ? "rgba(255,255,255,0.1)" : "#F0F4FF";
  const clientCountColor = isDark ? "rgba(255,255,255,0.55)" : "#0EA5E9";

  const featureIncludedText = isDark ? "rgba(255,255,255,0.88)" : "#374151";
  const featureExcludedText = isDark ? "rgba(255,255,255,0.28)" : "#CBD5E1";
  const featureIncludedIcon = isDark ? "#38BDF8" : "#0EA5E9";
  const featureExcludedIcon = isDark ? "rgba(255,255,255,0.25)" : "#CBD5E1";

  return (
    <div
      style={{
        background: isDark
          ? "linear-gradient(135deg, #0C4A6E, #1E3A8A)"
          : "white",
        borderRadius: "20px",
        border: isPrimary
          ? "2px solid #0EA5E9"
          : isDark
            ? "2px solid rgba(56,189,248,0.18)"
            : "2px solid #E0E7FF",
        padding: "30px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: isPrimary
          ? "0 8px 32px rgba(14,165,233,0.12)"
          : isDark
            ? "0 8px 32px rgba(12,74,110,0.35)"
            : undefined,
      }}
    >
      {/* Radial glow overlay for dark card */}
      {isDark && (
        <div
          style={{
            position: "absolute",
            top: 0, right: 0, bottom: 0, left: 0,
            background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(14,165,233,0.18), transparent)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* "Más popular" ribbon */}
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

      {/* Plan name */}
      <div
        style={{
          fontSize: "22px",
          fontWeight: 900,
          color: nameColor,
          marginBottom: "8px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {plan.name}
      </div>

      {/* Price */}
      <div
        style={{
          fontSize: "40px",
          fontWeight: 900,
          color: priceColor,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          marginBottom: "6px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {plan.price}
        {plan.priceUnit && (
          <span style={{ fontSize: "16px", fontWeight: 600, color: priceUnitColor }}>
            {" "}{plan.priceUnit}
          </span>
        )}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "15px",
          color: descColor,
          marginBottom: "22px",
          lineHeight: "1.85",
          textAlign: "justify",
          position: "relative",
          zIndex: 1,
        }}
      >
        {plan.description}
      </div>

      {/* Features */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "11px",
          marginBottom: "24px",
          flex: 1,
          position: "relative",
          zIndex: 1,
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
              color: f.included ? featureIncludedText : featureExcludedText,
              lineHeight: 1.5,
            }}
          >
            <span
              style={{
                color: f.included ? featureIncludedIcon : featureExcludedIcon,
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

      {/* Client count */}
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: clientCountColor,
          marginTop: "18px",
          paddingTop: "18px",
          borderTop: `1px solid ${dividerColor}`,
          marginBottom: "16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {plan.clientCount} empresa{plan.clientCount !== 1 ? "s" : ""} en este plan
      </div>

      {/* CTA button */}
      <button
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s",
          position: "relative",
          zIndex: 1,
          ...(isPrimary
            ? {
                background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                color: "white",
                border: "none",
                boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
              }
            : isDark
              ? {
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  border: "1.5px solid rgba(255,255,255,0.22)",
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
