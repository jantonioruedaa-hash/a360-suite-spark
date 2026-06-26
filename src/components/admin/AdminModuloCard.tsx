import React from "react";

export interface AdminModuloData {
  id: string;
  emoji: string;
  name: string;
  description: string;
  badge: string;
  pending?: boolean;
  defaultActive?: boolean;
}

interface Props {
  modulo: AdminModuloData;
  active: boolean;
  onToggle: () => void;
  empresasCount?: number;
  sesionesCount?: number;
}

export default function AdminModuloCard({
  modulo,
  active,
  onToggle,
  empresasCount,
  sesionesCount,
}: Props) {
  // Badge text
  const badgeText = !active
    ? modulo.pending
      ? "En desarrollo"
      : "Inactivo"
    : empresasCount !== undefined
      ? `${empresasCount} empresa${empresasCount !== 1 ? "s" : ""} activa${empresasCount !== 1 ? "s" : ""}`
      : modulo.badge;

  // Badge colors
  const badgeBg = !active
    ? modulo.pending
      ? "#FEF3C7"
      : "#F3F4F6"
    : "#ECFDF5";
  const badgeColor = !active
    ? modulo.pending
      ? "#B45309"
      : "#6B7280"
    : "#059669";

  return (
    <div
      style={{
        background: "white",
        borderRadius: "18px",
        border: `1.5px solid ${active ? "#E0E7FF" : "#F0F4FF"}`,
        padding: "26px",
        display: "flex",
        alignItems: "center",
        gap: "18px",
        transition: "all 0.2s",
        opacity: active ? 1 : 0.6,
      }}
    >
      <div style={{ fontSize: "44px", flexShrink: 0 }}>{modulo.emoji}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 800,
            color: "#0C4A6E",
            marginBottom: "5px",
          }}
        >
          {modulo.name}
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#64748B",
            lineHeight: "1.85",
            textAlign: "justify",
          }}
        >
          {modulo.description}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginTop: "8px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "999px",
              display: "inline-block",
              background: badgeBg,
              color: badgeColor,
            }}
          >
            {badgeText}
          </span>
          {sesionesCount !== undefined && active && sesionesCount > 0 && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "999px",
                display: "inline-block",
                background: "#F0F9FF",
                color: "#0EA5E9",
              }}
            >
              {sesionesCount} sesión{sesionesCount !== 1 ? "es" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Toggle */}
      <div
        role="switch"
        aria-checked={active}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        style={{
          width: "46px",
          height: "26px",
          borderRadius: "999px",
          background: active ? "linear-gradient(135deg, #0EA5E9, #6366F1)" : "#E0E7FF",
          position: "relative",
          cursor: "pointer",
          transition: "all 0.2s",
          flexShrink: 0,
          outline: "none",
        }}
      >
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "white",
            position: "absolute",
            top: "3px",
            left: active ? "23px" : "3px",
            transition: "all 0.2s",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        />
      </div>
    </div>
  );
}
