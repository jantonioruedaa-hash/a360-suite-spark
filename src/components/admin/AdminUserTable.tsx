import React, { useState } from "react";

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  empresa: string | null;
  plan: string | null;
  activo: boolean;
  created_at: string;
}

interface Props {
  usuarios: AdminUserRow[];
}

const ROLE_BADGE: Record<string, { bg: string; color: string; icon: string; label: string }> = {
  admin: {
    bg: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
    color: "#6D28D9",
    icon: "👑",
    label: "Super Admin",
  },
  consultor: {
    bg: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
    color: "#1D4ED8",
    icon: "🎯",
    label: "Consultor",
  },
  cliente: {
    bg: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
    color: "#065F46",
    icon: "🏢",
    label: "Cliente",
  },
  participante: {
    bg: "#F5F7FF",
    color: "#6366F1",
    icon: "👤",
    label: "Participante",
  },
};

const PLAN_BADGE: Record<string, { bg: string; color: string }> = {
  esencial: { bg: "#F5F7FF", color: "#6366F1" },
  avanzado: { bg: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", color: "#0EA5E9" },
  corporativo: { bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)", color: "#B45309" },
};

const AVATAR_GRAD: Record<string, string> = {
  admin: "linear-gradient(135deg, #0C4A6E, #1E3A8A)",
  consultor: "linear-gradient(135deg, #0EA5E9, #6366F1)",
  cliente: "linear-gradient(135deg, #1D9E75, #10B981)",
  participante: "linear-gradient(135deg, #94A3B8, #64748B)",
};

function initials(name: string | null, email: string) {
  const src = name ?? email;
  return src
    .split(" ")
    .map((s) => s[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

export default function AdminUserTable({ usuarios }: Props) {
  const [search, setSearch] = useState("");

  const filtered = usuarios.filter(
    (u) =>
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: usuarios.length,
    admin: usuarios.filter((u) => u.role === "admin").length,
    consultor: usuarios.filter((u) => u.role === "consultor").length,
    otros: usuarios.filter((u) => u.role === "cliente" || u.role === "participante").length,
  };

  return (
    <>
      {/* Stats row */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "28px" }}>
        {[
          { val: stats.total, lbl: "Total usuarios" },
          { val: stats.admin, lbl: "Administradores" },
          { val: stats.consultor, lbl: "Consultores" },
          { val: stats.otros, lbl: "Clientes / Participantes" },
        ].map((s) => (
          <div
            key={s.lbl}
            style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid #E0E7FF",
              padding: "22px 26px",
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: "32px",
                fontWeight: 900,
                color: "#0C4A6E",
                letterSpacing: "-0.02em",
              }}
            >
              {s.val}
            </div>
            <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "5px", fontWeight: 600 }}>
              {s.lbl}
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
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
            Todos los usuarios
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Buscar usuario..."
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
                padding: "11px 18px",
                borderRadius: "10px",
                background: "white",
                color: "#0EA5E9",
                fontSize: "14px",
                fontWeight: 600,
                border: "1.5px solid #BAE6FD",
                cursor: "pointer",
              }}
            >
              Importar CSV
            </button>
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
              + Nuevo usuario
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Usuario", "Rol", "Empresa", "Plan", "Creado", "Estado", "Acciones"].map(
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
                    colSpan={7}
                    style={{
                      padding: "40px 28px",
                      textAlign: "center",
                      color: "#94A3B8",
                      fontSize: "15px",
                    }}
                  >
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const rb = ROLE_BADGE[u.role] ?? ROLE_BADGE.cliente!;
                  const pb = u.plan ? (PLAN_BADGE[u.plan] ?? PLAN_BADGE.esencial!) : null;
                  return (
                    <tr key={u.id}>
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
                              fontSize: "15px",
                              fontWeight: 800,
                              color: "white",
                              flexShrink: 0,
                              background:
                                AVATAR_GRAD[u.role] ?? AVATAR_GRAD.cliente,
                            }}
                          >
                            {initials(u.name, u.email)}
                          </div>
                          <div>
                            <div
                              style={{ fontSize: "15px", fontWeight: 700, color: "#0C4A6E" }}
                            >
                              {u.name ?? "—"}
                            </div>
                            <div
                              style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}
                            >
                              {u.email}
                            </div>
                          </div>
                        </div>
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
                            background: rb.bg,
                            color: rb.color,
                          }}
                        >
                          {rb.icon} {rb.label}
                        </span>
                      </td>
                      <td style={td}>{u.empresa ?? "—"}</td>
                      <td style={td}>
                        {pb ? (
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
                            {u.plan}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={td}>
                        {new Date(u.created_at).toLocaleDateString("es", {
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
                            background: u.activo ? "#ECFDF5" : "#FEF2F2",
                            color: u.activo ? "#059669" : "#DC2626",
                          }}
                        >
                          ● {u.activo ? "Activo" : "Inactivo"}
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
                          Editar
                        </button>
                        {u.role !== "admin" && (
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
                            Desactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
