import React, { useState } from "react";

const MODULES = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "coaching", icon: "🎯", label: "Coaching A360" },
  { id: "side", icon: "🔍", label: "SIDE Diagnóstico" },
  { id: "lee", icon: "📚", label: "Programa LEE" },
  { id: "plan", icon: "📋", label: "Plan Estratégico" },
  { id: "ia", icon: "🤖", label: "Análisis IA" },
  { id: "export", icon: "📊", label: "Exportar reportes" },
  { id: "admin", icon: "⚙️", label: "Panel Admin" },
];

const ROLES = [
  { id: "admin", icon: "👑", label: "Super Admin" },
  { id: "consultor", icon: "🎯", label: "Consultor" },
  { id: "cliente", icon: "🏢", label: "Cliente" },
  { id: "participante", icon: "👤", label: "Participante" },
];

const DEFAULT_PERMS: Record<string, Record<string, boolean>> = {
  dashboard: { admin: true, consultor: true, cliente: true, participante: true },
  coaching: { admin: true, consultor: true, cliente: true, participante: false },
  side: { admin: true, consultor: true, cliente: true, participante: false },
  lee: { admin: true, consultor: true, cliente: true, participante: true },
  plan: { admin: true, consultor: true, cliente: true, participante: false },
  ia: { admin: true, consultor: true, cliente: false, participante: false },
  export: { admin: true, consultor: true, cliente: false, participante: false },
  admin: { admin: true, consultor: false, cliente: false, participante: false },
};

const cell: React.CSSProperties = {
  padding: "18px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
};

const headerRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "220px repeat(4, 1fr)",
  borderBottom: "1px solid #F0F4FF",
  background: "#F8FAFF",
};

const permRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "220px repeat(4, 1fr)",
  borderBottom: "1px solid #F0F4FF",
};

export default function AdminPermisosMatrix() {
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [saved, setSaved] = useState(false);

  const toggle = (mod: string, role: string) => {
    setPerms((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [role]: !prev[mod]?.[role] },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        border: "1px solid #E0E7FF",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "22px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #F0F4FF",
        }}
      >
        <div style={{ fontSize: "19px", fontWeight: 800, color: "#0C4A6E" }}>
          Matriz de permisos
        </div>
        <button
          onClick={handleSave}
          style={{
            padding: "11px 22px",
            borderRadius: "10px",
            background: saved
              ? "linear-gradient(135deg, #059669, #10B981)"
              : "linear-gradient(135deg, #0EA5E9, #6366F1)",
            color: "white",
            fontSize: "14px",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
            transition: "all 0.3s",
          }}
        >
          {saved ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </div>

      <div style={{ padding: "0 0 8px" }}>
        {/* Header row */}
        <div style={headerRow}>
          <div
            style={{
              ...cell,
              justifyContent: "flex-start",
              fontSize: "13px",
              fontWeight: 700,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Módulo / Función
          </div>
          {ROLES.map((r) => (
            <div
              key={r.id}
              style={{
                ...cell,
                fontSize: "13px",
                fontWeight: 700,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {r.icon} {r.label}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {MODULES.map((mod) => (
          <div
            key={mod.id}
            style={{
              ...permRow,
              ...(mod.id === MODULES[MODULES.length - 1]?.id ? { borderBottom: "none" } : {}),
            }}
          >
            <div
              style={{
                ...cell,
                justifyContent: "flex-start",
                fontWeight: 600,
                color: "#374151",
                gap: "10px",
              }}
            >
              <span>{mod.icon}</span>
              {mod.label}
            </div>
            {ROLES.map((role) => {
              const allowed = perms[mod.id]?.[role.id] ?? false;
              return (
                <div key={role.id} style={cell}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(mod.id, role.id)}
                    onKeyDown={(e) => e.key === "Enter" && toggle(mod.id, role.id)}
                    title={allowed ? "Permitido — clic para denegar" : "Denegado — clic para permitir"}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "7px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: allowed
                        ? "linear-gradient(135deg, #0EA5E9, #6366F1)"
                        : "#F0F4FF",
                      color: allowed ? "white" : "#CBD5E1",
                      transition: "all 0.15s",
                      outline: "none",
                      userSelect: "none",
                    }}
                  >
                    {allowed ? "✓" : "×"}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
