import React from "react";

export type AdminSection =
  | "dashboard"
  | "actividad"
  | "usuarios"
  | "empresas"
  | "planes"
  | "permisos"
  | "modulos"
  | "configuracion";

interface Props {
  active: AdminSection;
  onChange: (s: AdminSection) => void;
  counts?: { usuarios: number; empresas: number };
}

export default function AdminSidebar({ active, onChange, counts }: Props) {
  const [hovered, setHovered] = React.useState<AdminSection | null>(null);

  const lbl: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    padding: "0 22px",
    marginBottom: "8px",
  };

  const nav = (sec: AdminSection, icon: string, label: string, count?: number) => {
    const on = active === sec;
    const isHov = hovered === sec && !on;
    return (
      <div
        key={sec}
        role="button"
        tabIndex={0}
        onClick={() => onChange(sec)}
        onKeyDown={(e) => e.key === "Enter" && onChange(sec)}
        onMouseEnter={() => setHovered(sec)}
        onMouseLeave={() => setHovered(null)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "13px 22px",
          fontSize: "15px",
          fontWeight: on ? 700 : 600,
          color: on ? "#0EA5E9" : isHov ? "#0EA5E9" : "#64748B",
          cursor: "pointer",
          borderLeft: on ? "3px solid #0EA5E9" : "3px solid transparent",
          background: on
            ? "linear-gradient(90deg, #EFF6FF, transparent)"
            : isHov
              ? "#F5F7FF"
              : undefined,
          transition: "all 0.15s",
          userSelect: "none",
          outline: "none",
        }}
      >
        <span style={{ fontSize: "19px", width: "26px", textAlign: "center" }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {count !== undefined && (
          <span
            style={{
              background: "#E0E7FF",
              color: "#6366F1",
              fontSize: "12px",
              fontWeight: 700,
              padding: "2px 9px",
              borderRadius: "20px",
            }}
          >
            {count}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        width: "268px",
        background: "white",
        borderRight: "1px solid #E0E7FF",
        overflowY: "auto",
        padding: "28px 0",
        flexShrink: 0,
      }}
    >
      <div style={{ marginBottom: "36px" }}>
        <div style={lbl}>Principal</div>
        {nav("dashboard", "📊", "Dashboard")}
        {nav("actividad", "⚡", "Actividad reciente")}
      </div>
      <div style={{ marginBottom: "36px" }}>
        <div style={lbl}>Gestión</div>
        {nav("usuarios", "👥", "Usuarios", counts?.usuarios)}
        {nav("empresas", "🏢", "Empresas", counts?.empresas)}
        {nav("planes", "📦", "Planes")}
      </div>
      <div style={{ marginBottom: "36px" }}>
        <div style={lbl}>Control</div>
        {nav("permisos", "🔐", "Permisos")}
        {nav("modulos", "🧩", "Módulos")}
      </div>
      <div>
        <div style={lbl}>Sistema</div>
        {nav("configuracion", "⚙️", "Configuración")}
      </div>
    </div>
  );
}
