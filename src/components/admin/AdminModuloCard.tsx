import { useState } from "react";

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
}

export default function AdminModuloCard({ modulo }: Props) {
  const [active, setActive] = useState(modulo.defaultActive ?? false);

  return (
    <div
      style={{
        background: "white",
        borderRadius: "18px",
        border: "1.5px solid #E0E7FF",
        padding: "26px",
        display: "flex",
        alignItems: "center",
        gap: "18px",
        transition: "all 0.2s",
        opacity: modulo.pending && !active ? 0.6 : 1,
      }}
    >
      <div style={{ fontSize: "44px", flexShrink: 0 }}>{modulo.emoji}</div>

      <div style={{ flex: 1 }}>
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
            lineHeight: "1.6",
          }}
        >
          {modulo.description}
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: "999px",
            display: "inline-block",
            marginTop: "8px",
            background: modulo.pending ? "#FEF3C7" : "#ECFDF5",
            color: modulo.pending ? "#B45309" : "#059669",
          }}
        >
          {modulo.badge}
        </span>
      </div>

      {/* Toggle */}
      <div
        role="switch"
        aria-checked={active}
        tabIndex={0}
        onClick={() => setActive((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setActive((v) => !v)}
        style={{
          width: "46px",
          height: "26px",
          borderRadius: "999px",
          background: active
            ? "linear-gradient(135deg, #0EA5E9, #6366F1)"
            : "#E0E7FF",
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
