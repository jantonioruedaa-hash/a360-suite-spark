import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Data ─────────────────────────────────────────────────────────────────────

const MODULES = [
  { id: "dashboard",  icon: "📊", label: "Dashboard" },
  { id: "coaching",   icon: "🎯", label: "Coaching A360" },
  { id: "side",       icon: "🔍", label: "SIDE Diagnóstico" },
  { id: "lee",        icon: "📚", label: "Programa LEE" },
  { id: "plan",       icon: "📋", label: "Plan Estratégico" },
  { id: "ia",         icon: "🤖", label: "Análisis IA" },
  { id: "export",     icon: "📤", label: "Exportar reportes" },
  { id: "admin",      icon: "⚙️",  label: "Panel Admin" },
  { id: "gestionar",  icon: "👥", label: "Gestionar usuarios" },
  { id: "marketing",  icon: "📱", label: "Marketing Digital" },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

const ROLES = [
  { id: "admin",       icon: "👑", label: "Admin",       bg: "#EFF6FF", color: "#1D4ED8" },
  { id: "consultor",   icon: "🎯", label: "Consultor",   bg: "#ECFDF5", color: "#059669" },
  { id: "cliente",     icon: "🏢", label: "Cliente",     bg: "#FEF3C7", color: "#B45309" },
  { id: "participante",icon: "👤", label: "Participante",bg: "#EDE9FE", color: "#6D28D9" },
] as const;

type RoleId = (typeof ROLES)[number]["id"];
type PermMatrix = Record<string, Record<string, boolean>>;

const DEFAULT_PERMS: PermMatrix = {
  dashboard:  { admin: true,  consultor: true,  cliente: true,  participante: true  },
  coaching:   { admin: true,  consultor: true,  cliente: true,  participante: false },
  side:       { admin: true,  consultor: true,  cliente: true,  participante: false },
  lee:        { admin: true,  consultor: true,  cliente: true,  participante: true  },
  plan:       { admin: true,  consultor: true,  cliente: true,  participante: false },
  ia:         { admin: true,  consultor: true,  cliente: false, participante: false },
  export:     { admin: true,  consultor: true,  cliente: false, participante: false },
  admin:      { admin: true,  consultor: false, cliente: false, participante: false },
  gestionar:  { admin: true,  consultor: false, cliente: false, participante: false },
  marketing:  { admin: true,  consultor: true,  cliente: false, participante: false },
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const cell: React.CSSProperties = {
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const gridCols: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "240px repeat(4, 1fr)",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPermisosMatrix() {
  const [perms, setPerms]     = useState<PermMatrix>(DEFAULT_PERMS);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ── Load from DB on mount ──────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("content_strings")
        .eq("id", "global")
        .single();

      const cs = data?.content_strings;
      if (
        cs &&
        typeof cs === "object" &&
        !Array.isArray(cs) &&
        "permisos_matriz" in (cs as object)
      ) {
        const stored = (cs as Record<string, unknown>).permisos_matriz;
        if (stored && typeof stored === "object" && !Array.isArray(stored)) {
          setPerms(stored as PermMatrix);
        }
      }
    };
    void load();
  }, []);

  // ── Save helper ────────────────────────────────────────────────────────────

  const savePerms = async (updated: PermMatrix) => {
    setSaving(true);
    try {
      const { data: current } = await supabase
        .from("app_settings")
        .select("content_strings")
        .eq("id", "global")
        .single();

      const existingCs =
        current?.content_strings &&
        typeof current.content_strings === "object" &&
        !Array.isArray(current.content_strings)
          ? (current.content_strings as Record<string, unknown>)
          : {};

      const { error } = await supabase
        .from("app_settings")
        .update({
          content_strings: JSON.parse(
            JSON.stringify({ ...existingCs, permisos_matriz: updated }),
          ),
        })
        .eq("id", "global");

      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle (auto-save) ─────────────────────────────────────────────────────

  const toggle = (mod: ModuleId | string, role: RoleId | string) => {
    const newPerms: PermMatrix = {
      ...perms,
      [mod]: {
        ...(perms[mod] ?? {}),
        [role]: !(perms[mod]?.[role] ?? false),
      },
    };
    setPerms(newPerms);
    void savePerms(newPerms);
  };

  // ── Reset to defaults ──────────────────────────────────────────────────────

  const resetDefaults = () => {
    setPerms(DEFAULT_PERMS);
    void savePerms(DEFAULT_PERMS);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        border: "1px solid #E0E7FF",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ fontSize: "19px", fontWeight: 800, color: "#0C4A6E" }}>
            Matriz de permisos
          </div>
          {saving && (
            <span style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 500 }}>
              Guardando…
            </span>
          )}
          {saved && !saving && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 13px",
                borderRadius: "999px",
                background: "#ECFDF5",
                color: "#059669",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              ✓ Guardado
            </span>
          )}
        </div>
        <button
          onClick={resetDefaults}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "1.5px solid #E0E7FF",
            background: "white",
            color: "#64748B",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Restablecer defaults
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        {/* Header row */}
        <div
          style={{
            ...gridCols,
            borderBottom: "1px solid #F0F4FF",
            background: "#F8FAFF",
          }}
        >
          <div
            style={{
              ...cell,
              justifyContent: "flex-start",
              fontSize: "12px",
              fontWeight: 700,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Módulo / Función
          </div>
          {ROLES.map((r) => (
            <div key={r.id} style={{ ...cell, flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "20px" }}>{r.icon}</span>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 11px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: r.bg,
                  color: r.color,
                  whiteSpace: "nowrap",
                }}
              >
                {r.label}
              </span>
            </div>
          ))}
        </div>

        {/* Data rows */}
        {MODULES.map((mod, idx) => {
          const isLast = idx === MODULES.length - 1;
          return (
            <div
              key={mod.id}
              onMouseEnter={() => setHoveredId(mod.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                ...gridCols,
                borderBottom: isLast ? "none" : "1px solid #F0F4FF",
                background: hoveredId === mod.id ? "#F8FAFF" : "white",
                transition: "background 0.12s",
              }}
            >
              {/* Module label */}
              <div
                style={{
                  ...cell,
                  justifyContent: "flex-start",
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "15px",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "18px", flexShrink: 0 }}>{mod.icon}</span>
                {mod.label}
              </div>

              {/* Permission cells */}
              {ROLES.map((role) => {
                const allowed = perms[mod.id]?.[role.id] ?? false;
                return (
                  <div key={role.id} style={cell}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggle(mod.id, role.id)}
                      onKeyDown={(e) => e.key === "Enter" && toggle(mod.id, role.id)}
                      title={
                        allowed
                          ? "Permitido — clic para denegar"
                          : "Denegado — clic para permitir"
                      }
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "9px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "15px",
                        fontWeight: 800,
                        cursor: "pointer",
                        background: allowed
                          ? "linear-gradient(135deg, #0EA5E9, #6366F1)"
                          : "#F0F4FF",
                        color: allowed ? "white" : "#CBD5E1",
                        transition: "all 0.15s",
                        outline: "none",
                        userSelect: "none",
                        boxShadow: allowed
                          ? "0 2px 8px rgba(14,165,233,0.25)"
                          : "none",
                        flexShrink: 0,
                      }}
                    >
                      {allowed ? "✓" : "×"}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div
        style={{
          padding: "14px 28px",
          borderTop: "1px solid #F0F4FF",
          fontSize: "13px",
          color: "#94A3B8",
          background: "#FAFBFF",
        }}
      >
        Los cambios se guardan automáticamente al hacer clic en cada permiso.
        {" "}
        Los permisos del rol Admin no se pueden revocar para módulos críticos.
      </div>
    </div>
  );
}
