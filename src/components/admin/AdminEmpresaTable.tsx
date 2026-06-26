import React, { useState } from "react";

export interface AdminEmpresaRow {
  id: string;
  nombre_empresa: string;
  sector: string | null;
  ciudad: string | null;
  plan_licencia: string;
  consultor_nombre: string | null;
  usuarios_activos: number;
  modulos: string[];
  activo: boolean;
  created_at: string;
}

interface Props {
  empresas: AdminEmpresaRow[];
}

const PLAN_BADGE: Record<string, { bg: string; color: string; icon: string }> = {
  esencial: { bg: "#F5F7FF", color: "#6366F1", icon: "" },
  avanzado: {
    bg: "linear-gradient(135deg, #EFF6FF, #EDE9FE)",
    color: "#0EA5E9",
    icon: "💼 ",
  },
  corporativo: {
    bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
    color: "#B45309",
    icon: "⭐ ",
  },
};

const COLORS = [
  "linear-gradient(135deg, #0EA5E9, #6366F1)",
  "linear-gradient(135deg, #1D9E75, #10B981)",
  "linear-gradient(135deg, #BA7517, #D97706)",
  "linear-gradient(135deg, #6366F1, #8B5CF6)",
  "linear-gradient(135deg, #EC4899, #F43F5E)",
];

const td: React.CSSProperties = {
  padding: "18px 28px",
  fontSize: "15px",
  color: "#374151",
  borderBottom: "1px solid #F8FAFF",
  verticalAlign: "middle",
};

const th: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#94A3B8",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  padding: "14px 28px",
  textAlign: "left",
  background: "#F8FAFF",
  borderBottom: "1px solid #F0F4FF",
};

export default function AdminEmpresaTable({ empresas }: Props) {
  const [search, setSearch] = useState("");

  const filtered = empresas.filter(
    (e) =>
      e.nombre_empresa.toLowerCase().includes(search.toLowerCase()) ||
      (e.sector ?? "").toLowerCase().includes(search.toLowerCase()),
  );

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
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ fontSize: "19px", fontWeight: 800, color: "#0C4A6E" }}>
          Todas las empresas
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar empresa..."
            style={{
              padding: "11px 18px",
              borderRadius: "10px",
              border: "1.5px solid #E0E7FF",
              fontSize: "15px",
              fontFamily: "inherit",
              outline: "none",
              width: "240px",
            }}
          />
          <button
            style={{
              padding: "11px 22px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
              color: "white",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
            }}
          >
            + Nueva empresa
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Empresa", "Plan", "Consultor", "Usuarios", "Módulos", "Registrada", "Estado", "Acciones"].map(
                (h) => (
                  <th key={h} style={th}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: "40px 28px",
                    textAlign: "center",
                    color: "#94A3B8",
                    fontSize: "15px",
                  }}
                >
                  No se encontraron empresas
                </td>
              </tr>
            ) : (
              filtered.map((e, i) => {
                const pb = PLAN_BADGE[e.plan_licencia] ?? PLAN_BADGE.esencial!;
                const grad = COLORS[i % COLORS.length]!;
                return (
                  <tr key={e.id}>
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "11px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "17px",
                            fontWeight: 800,
                            color: "white",
                            flexShrink: 0,
                            background: grad,
                          }}
                        >
                          {e.nombre_empresa[0]?.toUpperCase() ?? "E"}
                        </div>
                        <div>
                          <div
                            style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E" }}
                          >
                            {e.nombre_empresa}
                          </div>
                          <div
                            style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}
                          >
                            {[e.sector, e.ciudad].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "5px 13px",
                          borderRadius: "999px",
                          background: pb.bg,
                          color: pb.color,
                        }}
                      >
                        {pb.icon}
                        {e.plan_licencia}
                      </span>
                    </td>
                    <td style={td}>{e.consultor_nombre ?? "—"}</td>
                    <td style={td}>
                      <span style={{ fontWeight: 700, color: "#0C4A6E" }}>
                        {e.usuarios_activos}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: "13px", color: "#64748B" }}>
                        {e.modulos.length > 0 ? e.modulos.join(" · ") : "—"}
                      </span>
                    </td>
                    <td style={td}>
                      {new Date(e.created_at).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "5px 13px",
                          borderRadius: "999px",
                          background: e.activo ? "#ECFDF5" : "#FEF2F2",
                          color: e.activo ? "#059669" : "#DC2626",
                        }}
                      >
                        ● {e.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={td}>
                      <button
                        style={{
                          padding: "7px 14px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          border: "1.5px solid #E0E7FF",
                          background: "white",
                          color: "#64748B",
                          cursor: "pointer",
                          marginRight: "6px",
                        }}
                      >
                        Ver
                      </button>
                      <button
                        style={{
                          padding: "7px 14px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          border: "1.5px solid #E0E7FF",
                          background: "white",
                          color: "#64748B",
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
