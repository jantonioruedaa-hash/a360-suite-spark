import React, { useState } from "react";

export interface PlanRecord {
  id: string;
  name: string;
  price: string;
  priceUnit?: string;
  description: string;
  features: { text: string; included: boolean }[];
  maxUsers: number;
  modulos: string[];
  popular?: boolean;
  dark?: boolean;
}

interface Props {
  plan: PlanRecord | null;
  onClose: () => void;
  onSave: (plan: PlanRecord) => void;
  saving?: boolean;
}

const ALL_MODULOS = [
  "SIDE",
  "Coaching A360",
  "LEE",
  "Plan Estratégico",
  "Marketing Digital",
  "BizOS",
  "Manual de Funciones",
] as const;

const EMPTY_PLAN: PlanRecord = {
  id: "",
  name: "",
  price: "",
  priceUnit: "/mes",
  description: "",
  features: [],
  maxUsers: 1,
  modulos: [],
  popular: false,
  dark: false,
};

const inputSt: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1.5px solid #E0E7FF",
  fontSize: "15px",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  color: "#0C4A6E",
  background: "white",
};

const labelSt: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  color: "#374151",
  marginBottom: "6px",
};

function Toggle({ on, dark }: { on: boolean; dark?: boolean }) {
  return (
    <div
      style={{
        width: "42px",
        height: "24px",
        borderRadius: "999px",
        background: on
          ? dark
            ? "rgba(255,255,255,0.3)"
            : "linear-gradient(135deg, #0EA5E9, #6366F1)"
          : "#E0E7FF",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: "3px",
          left: on ? "21px" : "3px",
          transition: "left 0.2s",
          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
}

export default function AdminPlanEditor({ plan, onClose, onSave, saving }: Props) {
  const isEdit = plan !== null;
  const [form, setForm] = useState<PlanRecord>(plan ?? EMPTY_PLAN);
  const [newFeatureText, setNewFeatureText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!form.id.trim()) { setError("El ID del plan es obligatorio"); return; }
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    if (!form.price.trim()) { setError("El precio es obligatorio"); return; }
    setError(null);
    onSave({
      ...form,
      id: form.id.trim().toLowerCase().replace(/\s+/g, "_"),
    });
  };

  const addFeature = () => {
    if (!newFeatureText.trim()) return;
    setForm({
      ...form,
      features: [...form.features, { text: newFeatureText.trim(), included: true }],
    });
    setNewFeatureText("");
  };

  const removeFeature = (idx: number) =>
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });

  const toggleFeatureIncluded = (idx: number) =>
    setForm({
      ...form,
      features: form.features.map((f, i) =>
        i === idx ? { ...f, included: !f.included } : f,
      ),
    });

  const toggleModulo = (mod: string) => {
    const has = form.modulos.includes(mod);
    setForm({
      ...form,
      modulos: has ? form.modulos.filter((m) => m !== mod) : [...form.modulos, mod],
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(12, 74, 110, 0.45)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: "20px",
          background: "white",
          boxShadow: "0 20px 60px rgba(12,74,110,0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)",
            padding: "28px 32px",
            borderRadius: "20px 20px 0 0",
          }}
        >
          <div style={{ fontSize: "20px", fontWeight: 800, color: "white" }}>
            {isEdit ? "Editar plan" : "Nuevo plan"}
          </div>
          {isEdit && (
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", marginTop: "4px" }}>
              {plan.name}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "28px 32px 32px" }}>

          {/* Basic fields grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
            {/* ID */}
            <div>
              <label style={labelSt}>
                ID del plan <span style={{ color: "#EF4444" }}>*</span>
                <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 400, marginLeft: "4px" }}>
                  (ej: esencial)
                </span>
              </label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="esencial"
                disabled={isEdit}
                style={{
                  ...inputSt,
                  background: isEdit ? "#F8FAFF" : "white",
                  color: isEdit ? "#94A3B8" : "#0C4A6E",
                }}
              />
            </div>
            {/* Name */}
            <div>
              <label style={labelSt}>
                Nombre <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Básico"
                style={inputSt}
              />
            </div>
            {/* Price */}
            <div>
              <label style={labelSt}>
                Precio <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="$297"
                style={inputSt}
              />
            </div>
            {/* Price unit */}
            <div>
              <label style={labelSt}>Unidad de precio</label>
              <input
                type="text"
                value={form.priceUnit ?? ""}
                onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
                placeholder="/mes"
                style={inputSt}
              />
            </div>
            {/* Max users */}
            <div>
              <label style={labelSt}>
                Máx. usuarios
                <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 400, marginLeft: "4px" }}>
                  (0 = ilimitado)
                </span>
              </label>
              <input
                type="number"
                min={0}
                value={form.maxUsers}
                onChange={(e) =>
                  setForm({ ...form, maxUsers: Math.max(0, parseInt(e.target.value) || 0) })
                }
                style={inputSt}
              />
            </div>
            {/* Description */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelSt}>Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Describe qué incluye este plan..."
                style={{ ...inputSt, resize: "vertical" as const, lineHeight: "1.65" }}
              />
            </div>
          </div>

          {/* Modules */}
          <div style={{ marginTop: "24px" }}>
            <label style={{ ...labelSt, marginBottom: "12px" }}>Módulos incluidos</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {ALL_MODULOS.map((mod) => {
                const checked = form.modulos.includes(mod);
                return (
                  <label
                    key={mod}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: `1.5px solid ${checked ? "#BAE6FD" : "#E0E7FF"}`,
                      background: checked ? "#F0F9FF" : "white",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: checked ? 600 : 400,
                      color: checked ? "#0C4A6E" : "#64748B",
                      transition: "all 0.15s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModulo(mod)}
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                        accentColor: "#0EA5E9",
                      }}
                    />
                    {mod}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Features */}
          <div style={{ marginTop: "24px" }}>
            <label style={{ ...labelSt, marginBottom: "12px" }}>
              Features
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 400, marginLeft: "6px" }}>
                Clic en ✓/× para cambiar si está incluido
              </span>
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
              {form.features.map((f, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #E0E7FF",
                    background: "#F8FAFF",
                  }}
                >
                  <button
                    onClick={() => toggleFeatureIncluded(idx)}
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      border: "none",
                      background: f.included ? "#ECFDF5" : "#FEF2F2",
                      color: f.included ? "#059669" : "#DC2626",
                      fontWeight: 800,
                      cursor: "pointer",
                      flexShrink: 0,
                      fontSize: "14px",
                    }}
                  >
                    {f.included ? "✓" : "×"}
                  </button>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "14px",
                      color: f.included ? "#374151" : "#94A3B8",
                      textDecoration: f.included ? "none" : "line-through",
                    }}
                  >
                    {f.text}
                  </span>
                  <button
                    onClick={() => removeFeature(idx)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#CBD5E1",
                      cursor: "pointer",
                      fontSize: "20px",
                      lineHeight: 1,
                      padding: "0 2px",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFeature()}
                placeholder="Nueva característica..."
                style={{ ...inputSt, flex: 1 }}
              />
              <button
                onClick={addFeature}
                style={{
                  padding: "11px 18px",
                  borderRadius: "10px",
                  background: "#F0F9FF",
                  border: "1.5px solid #BAE6FD",
                  color: "#0EA5E9",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap" as const,
                }}
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* Toggles row */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "24px" }}
          >
            {/* Popular */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setForm({ ...form, popular: !form.popular })}
              onKeyDown={(e) => e.key === "Enter" && setForm({ ...form, popular: !form.popular })}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "12px",
                border: `1.5px solid ${form.popular ? "#BAE6FD" : "#E0E7FF"}`,
                background: form.popular ? "#F0F9FF" : "white",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E" }}>
                  Más popular
                </div>
                <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                  Muestra badge especial
                </div>
              </div>
              <Toggle on={form.popular ?? false} />
            </div>
            {/* Dark */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setForm({ ...form, dark: !form.dark })}
              onKeyDown={(e) => e.key === "Enter" && setForm({ ...form, dark: !form.dark })}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "12px",
                border: `1.5px solid ${form.dark ? "#1E3A8A" : "#E0E7FF"}`,
                background: form.dark ? "#0C4A6E" : "white",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <div>
                <div
                  style={{ fontSize: "14px", fontWeight: 700, color: form.dark ? "white" : "#0C4A6E" }}
                >
                  Tema oscuro
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: form.dark ? "rgba(255,255,255,0.55)" : "#94A3B8",
                    marginTop: "2px",
                  }}
                >
                  Estilo Corporativo
                </div>
              </div>
              <Toggle on={form.dark ?? false} dark={form.dark} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "10px",
                color: "#DC2626",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "11px 22px",
                borderRadius: "10px",
                border: "1.5px solid #E0E7FF",
                background: "white",
                color: "#64748B",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: "11px 28px",
                borderRadius: "10px",
                background: saving ? "#94A3B8" : "linear-gradient(135deg, #0EA5E9, #6366F1)",
                color: "white",
                fontSize: "14px",
                fontWeight: 700,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 4px 14px rgba(14,165,233,0.3)",
              }}
            >
              {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
