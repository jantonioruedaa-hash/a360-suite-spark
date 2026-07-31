import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLANES_LICENCIA, ESTADOS } from "@/lib/clientes-helpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminEmpresaRow {
  id: string;
  nombre_empresa: string;
  sector: string | null;
  ciudad: string | null;
  plan_licencia: string;
  consultor_id: string | null;
  consultor_nombre: string | null;
  usuarios_activos: number;
  modulos: string[];
  activo: boolean;
  estado: string | null;
  descripcion: string | null;
  fecha_inicio_relacion: string | null;
  created_at: string;
}

interface ConsultorOption {
  id: string;
  nombre: string;
}

interface EmpresaForm {
  nombre_empresa: string;
  sector: string;
  ciudad: string;
  plan_licencia: string;
  consultor_id: string;
  fecha_inicio_relacion: string;
  estado: string;
  descripcion: string;
}

interface Actividad {
  id: string;
  tipo: string;
  titulo: string;
  fecha: string;
  resultado: string | null;
}

type ModalState =
  | null
  | { type: "create" }
  | { type: "edit"; empresa: AdminEmpresaRow }
  | { type: "detail"; empresa: AdminEmpresaRow };

interface Props {
  empresas: AdminEmpresaRow[];
  consultores: ConsultorOption[];
  onRefresh: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<string, { bg: string; color: string; icon: string; border?: string }> = {
  esencial:    { bg: "#F5F7FF", color: "#6366F1", icon: "", border: "1px solid #E0E7FF" },
  profesional: { bg: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", color: "#0EA5E9", icon: "💼 " },
  corporativo: { bg: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", color: "white", icon: "🏆 " },
  premium:     { bg: "linear-gradient(135deg, #92400E, #B45309)", color: "white", icon: "👑 " },
};

const PLAN_MODULES: Record<string, string[]> = {
  esencial:    ["SIDE"],
  profesional: ["SIDE", "Coaching A360", "LEE"],
  corporativo: ["SIDE", "Coaching A360", "LEE", "Plan Estratégico", "BizOS"],
  premium:     ["SIDE", "Coaching A360", "LEE", "Plan Estratégico", "BizOS"],
};

const ESTADO_STYLE: Record<string, { bg: string; color: string }> = {
  prospecto: { bg: "#EFF6FF", color: "#1D4ED8" },
  activo: { bg: "#ECFDF5", color: "#059669" },
  en_pausa: { bg: "#FEF3C7", color: "#B45309" },
  completado: { bg: "#EDE9FE", color: "#6D28D9" },
  inactivo: { bg: "#F3F4F6", color: "#6B7280" },
};

const TIPO_ICONS: Record<string, string> = {
  llamada: "📞",
  reunion: "👥",
  email: "✉️",
  propuesta: "📄",
  contrato: "📝",
  pago: "💰",
  nota: "📋",
  seguimiento: "🔔",
  diagnostico: "🔍",
  sesion_coaching: "🎯",
  sesion_lee: "📚",
  entrega: "📦",
};

const COLORS = [
  "linear-gradient(135deg, #0EA5E9, #6366F1)",
  "linear-gradient(135deg, #1D9E75, #10B981)",
  "linear-gradient(135deg, #BA7517, #D97706)",
  "linear-gradient(135deg, #6366F1, #8B5CF6)",
  "linear-gradient(135deg, #EC4899, #F43F5E)",
];

const EMPTY_FORM: EmpresaForm = {
  nombre_empresa: "",
  sector: "",
  ciudad: "",
  plan_licencia: "esencial",
  consultor_id: "",
  fecha_inicio_relacion: "",
  estado: "activo",
  descripcion: "",
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const td: React.CSSProperties = {
  padding: "18px 24px",
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
  padding: "14px 24px",
  textAlign: "left",
  background: "#F8FAFF",
  borderBottom: "1px solid #F0F4FF",
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

// ─── ModalWrap ────────────────────────────────────────────────────────────────

function ModalWrap({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
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
          maxWidth: wide ? "680px" : "520px",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: "20px",
          background: "white",
          boxShadow: "0 20px 60px rgba(12,74,110,0.2)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)",
            padding: "28px 32px",
            borderRadius: "20px 20px 0 0",
          }}
        >
          <div style={{ fontSize: "20px", fontWeight: 800, color: "white" }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", marginTop: "4px" }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{ padding: "28px 32px 32px" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminEmpresaTable({ empresas, consultores, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<EmpresaForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<EmpresaForm>(EMPTY_FORM);
  const [detailActividades, setDetailActividades] = useState<Actividad[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Narrowed modal state for clean JSX access
  const editEmpresa = modal?.type === "edit" ? modal.empresa : null;
  const detailEmpresa = modal?.type === "detail" ? modal.empresa : null;

  // Stats
  const total = empresas.length;
  const activas = empresas.filter((e) => e.activo).length;
  const enPausa = empresas.filter((e) => e.estado === "en_pausa").length;
  const sinConsultor = empresas.filter((e) => !e.consultor_id).length;

  const filtered = empresas.filter(
    (e) =>
      e.nombre_empresa.toLowerCase().includes(search.toLowerCase()) ||
      (e.sector ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.ciudad ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  // ── Modal helpers ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateForm(EMPTY_FORM);
    setModalError(null);
    setModal({ type: "create" });
  };

  const openEdit = (empresa: AdminEmpresaRow) => {
    setEditForm({
      nombre_empresa: empresa.nombre_empresa,
      sector: empresa.sector ?? "",
      ciudad: empresa.ciudad ?? "",
      plan_licencia: empresa.plan_licencia,
      consultor_id: empresa.consultor_id ?? "",
      fecha_inicio_relacion: empresa.fecha_inicio_relacion
        ? empresa.fecha_inicio_relacion.slice(0, 10)
        : "",
      estado: empresa.estado ?? "activo",
      descripcion: empresa.descripcion ?? "",
    });
    setModalError(null);
    setModal({ type: "edit", empresa });
  };

  const openDetail = async (empresa: AdminEmpresaRow) => {
    setModal({ type: "detail", empresa });
    setDetailLoading(true);
    setDetailActividades([]);
    const { data } = await supabase
      .from("cliente_actividades")
      .select("id,tipo,titulo,fecha,resultado")
      .eq("cliente_id", empresa.id)
      .order("fecha", { ascending: false })
      .limit(5);
    setDetailActividades(
      (data ?? []).map((a) => ({
        id: a.id,
        tipo: a.tipo,
        titulo: a.titulo,
        fecha: a.fecha,
        resultado: a.resultado,
      })),
    );
    setDetailLoading(false);
  };

  const closeModal = () => {
    setModal(null);
    setModalError(null);
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!createForm.nombre_empresa.trim()) {
      setModalError("El nombre de la empresa es obligatorio");
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      const { error } = await supabase.from("clientes").insert({
        nombre_empresa: createForm.nombre_empresa.trim(),
        sector: createForm.sector.trim() || null,
        ciudad: createForm.ciudad.trim() || null,
        plan_licencia: createForm.plan_licencia,
        consultor_id: createForm.consultor_id || null,
        fecha_inicio_relacion: createForm.fecha_inicio_relacion || null,
        estado: createForm.estado,
        descripcion: createForm.descripcion.trim() || null,
        activo: createForm.estado === "activo",
      });
      if (error) throw new Error(error.message);
      closeModal();
      onRefresh();
      toast.success("Empresa creada exitosamente");
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Error al crear empresa");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editEmpresa) return;
    if (!editForm.nombre_empresa.trim()) {
      setModalError("El nombre de la empresa es obligatorio");
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      const { error } = await supabase
        .from("clientes")
        .update({
          nombre_empresa: editForm.nombre_empresa.trim(),
          sector: editForm.sector.trim() || null,
          ciudad: editForm.ciudad.trim() || null,
          plan_licencia: editForm.plan_licencia,
          consultor_id: editForm.consultor_id || null,
          fecha_inicio_relacion: editForm.fecha_inicio_relacion || null,
          estado: editForm.estado,
          descripcion: editForm.descripcion.trim() || null,
          activo: editForm.estado === "activo",
        })
        .eq("id", editEmpresa.id);
      if (error) throw new Error(error.message);
      closeModal();
      onRefresh();
      toast.success("Empresa actualizada");
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Error al actualizar empresa");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (empresa: AdminEmpresaRow) => {
    setLoadingId(empresa.id);
    try {
      const newActivo = !empresa.activo;
      const { error } = await supabase
        .from("clientes")
        .update({
          activo: newActivo,
          estado: newActivo ? "activo" : "inactivo",
        })
        .eq("id", empresa.id);
      if (error) throw new Error(error.message);
      onRefresh();
      toast.success(newActivo ? "Empresa activada" : "Empresa desactivada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cambiar estado");
    } finally {
      setLoadingId(null);
    }
  };

  // ── Form helpers ───────────────────────────────────────────────────────────

  const renderFormBody = (
    form: EmpresaForm,
    setForm: React.Dispatch<React.SetStateAction<EmpresaForm>>,
  ) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
      {/* Nombre */}
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelSt}>
          Nombre de la empresa <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <input
          type="text"
          value={form.nombre_empresa}
          onChange={(e) => setForm({ ...form, nombre_empresa: e.target.value })}
          placeholder="Ej: Innovatech S.A."
          style={inputSt}
        />
      </div>
      {/* Sector */}
      <div>
        <label style={labelSt}>Sector</label>
        <input
          type="text"
          value={form.sector}
          onChange={(e) => setForm({ ...form, sector: e.target.value })}
          placeholder="Ej: Tecnología"
          style={inputSt}
        />
      </div>
      {/* Ciudad */}
      <div>
        <label style={labelSt}>Ciudad</label>
        <input
          type="text"
          value={form.ciudad}
          onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
          placeholder="Ej: Ciudad de México"
          style={inputSt}
        />
      </div>
      {/* Plan */}
      <div>
        <label style={labelSt}>
          Plan <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <select
          value={form.plan_licencia}
          onChange={(e) => setForm({ ...form, plan_licencia: e.target.value })}
          style={{ ...inputSt, appearance: "auto" as const }}
        >
          {PLANES_LICENCIA.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>
      {/* Estado */}
      <div>
        <label style={labelSt}>Estado</label>
        <select
          value={form.estado}
          onChange={(e) => setForm({ ...form, estado: e.target.value })}
          style={{ ...inputSt, appearance: "auto" as const }}
        >
          {ESTADOS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {/* Consultor */}
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelSt}>Consultor asignado</label>
        <select
          value={form.consultor_id}
          onChange={(e) => setForm({ ...form, consultor_id: e.target.value })}
          style={{ ...inputSt, appearance: "auto" as const }}
        >
          <option value="">— Sin consultor —</option>
          {consultores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      {/* Fecha inicio */}
      <div>
        <label style={labelSt}>Fecha de inicio</label>
        <input
          type="date"
          value={form.fecha_inicio_relacion}
          onChange={(e) => setForm({ ...form, fecha_inicio_relacion: e.target.value })}
          style={inputSt}
        />
      </div>
      {/* Descripción */}
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelSt}>Descripción / Notas internas</label>
        <textarea
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          placeholder="Notas internas sobre la empresa..."
          rows={3}
          style={{ ...inputSt, resize: "vertical" as const, lineHeight: "1.65" }}
        />
      </div>
    </div>
  );

  const renderSubmitRow = (label: string, onSubmit: () => void) => (
    <>
      {modalError && (
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
          {modalError}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
        <button
          onClick={closeModal}
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
          onClick={onSubmit}
          disabled={submitting}
          style={{
            padding: "11px 28px",
            borderRadius: "10px",
            background: submitting
              ? "#94A3B8"
              : "linear-gradient(135deg, #0EA5E9, #6366F1)",
            color: "white",
            fontSize: "14px",
            fontWeight: 700,
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
            boxShadow: submitting ? "none" : "0 4px 14px rgba(14,165,233,0.3)",
          }}
        >
          {submitting ? "Guardando…" : label}
        </button>
      </div>
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {[
          { label: "Total empresas", value: total, icon: "🏢", color: "#0C4A6E" },
          { label: "Activas", value: activas, icon: "✅", color: "#059669" },
          { label: "En pausa", value: enPausa, icon: "⏸️", color: "#B45309" },
          { label: "Sin consultor", value: sinConsultor, icon: "👤", color: "#6366F1" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "white",
              borderRadius: "14px",
              border: "1px solid #E0E7FF",
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <span style={{ fontSize: "24px" }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>{s.label}</div>
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
              onClick={openCreate}
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

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Empresa", "Plan", "Consultor", "Módulos", "Inicio", "Estado", "Acciones"].map(
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
                    {search
                      ? "No se encontraron empresas con esa búsqueda"
                      : "No hay empresas registradas"}
                  </td>
                </tr>
              ) : (
                filtered.map((e, i) => {
                  const pb = PLAN_BADGE[e.plan_licencia] ?? PLAN_BADGE.esencial!;
                  const grad = COLORS[i % COLORS.length]!;
                  const rawEstado = e.estado ?? (e.activo ? "activo" : "inactivo");
                  const estadoSt = ESTADO_STYLE[rawEstado] ?? ESTADO_STYLE.activo!;
                  const isLoading = loadingId === e.id;
                  return (
                    <tr
                      key={e.id}
                      onMouseEnter={() => setHoveredId(e.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        background: hoveredId === e.id ? "#F8FAFF" : "white",
                        cursor: "pointer",
                      }}
                    >
                      {/* Empresa */}
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
                      {/* Plan */}
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
                            border: pb.border ?? "none",
                          }}
                        >
                          {pb.icon}
                          {e.plan_licencia}
                        </span>
                      </td>
                      {/* Consultor */}
                      <td style={td}>
                        {e.consultor_nombre ?? (
                          <span style={{ color: "#CBD5E1" }}>—</span>
                        )}
                      </td>
                      {/* Módulos */}
                      <td style={td}>
                        <span style={{ fontSize: "13px", color: "#64748B" }}>
                          {e.modulos.length > 0 ? e.modulos.join(" · ") : "—"}
                        </span>
                      </td>
                      {/* Inicio */}
                      <td style={td}>
                        <span style={{ fontSize: "13px", color: "#64748B" }}>
                          {e.fecha_inicio_relacion ? (
                            new Date(e.fecha_inicio_relacion).toLocaleDateString("es", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          ) : (
                            <span style={{ color: "#CBD5E1" }}>—</span>
                          )}
                        </span>
                      </td>
                      {/* Estado */}
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
                            background: estadoSt.bg,
                            color: estadoSt.color,
                          }}
                        >
                          ● {rawEstado}
                        </span>
                      </td>
                      {/* Acciones */}
                      <td style={td}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => openDetail(e)}
                            style={{
                              padding: "7px 13px",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: 600,
                              border: "1.5px solid #E0E7FF",
                              background: "white",
                              color: "#6366F1",
                              cursor: "pointer",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => openEdit(e)}
                            style={{
                              padding: "7px 13px",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: 600,
                              border: "1.5px solid #E0E7FF",
                              background: "white",
                              color: "#64748B",
                              cursor: "pointer",
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleActive(e)}
                            disabled={isLoading}
                            style={{
                              padding: "7px 13px",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: 600,
                              border: "none",
                              background: e.activo ? "#FEF2F2" : "#ECFDF5",
                              color: e.activo ? "#DC2626" : "#059669",
                              cursor: isLoading ? "not-allowed" : "pointer",
                              whiteSpace: "nowrap" as const,
                              opacity: isLoading ? 0.6 : 1,
                            }}
                          >
                            {isLoading ? "…" : e.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create modal ───────────────────────────────────────────────────────── */}
      {modal?.type === "create" && (
        <ModalWrap
          title="Nueva empresa"
          subtitle="Registra una nueva empresa cliente"
          onClose={closeModal}
        >
          {renderFormBody(createForm, setCreateForm)}
          {renderSubmitRow("Crear empresa", handleCreate)}
        </ModalWrap>
      )}

      {/* ── Edit modal ─────────────────────────────────────────────────────────── */}
      {editEmpresa && (
        <ModalWrap
          title="Editar empresa"
          subtitle={editEmpresa.nombre_empresa}
          onClose={closeModal}
        >
          {renderFormBody(editForm, setEditForm)}
          {renderSubmitRow("Guardar cambios", handleEdit)}
        </ModalWrap>
      )}

      {/* ── Detail modal ───────────────────────────────────────────────────────── */}
      {detailEmpresa && (() => {
        const e = detailEmpresa;
        const pb = PLAN_BADGE[e.plan_licencia] ?? PLAN_BADGE.esencial!;
        const rawEstado = e.estado ?? (e.activo ? "activo" : "inactivo");
        const estadoSt = ESTADO_STYLE[rawEstado] ?? ESTADO_STYLE.activo!;
        const modules = PLAN_MODULES[e.plan_licencia] ?? ["SIDE"];
        return (
          <ModalWrap title="Detalle de empresa" onClose={closeModal} wide>
            {/* Header banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
                marginBottom: "24px",
                padding: "18px 20px",
                background: "linear-gradient(135deg, #F8FAFF, #EFF6FF)",
                borderRadius: "14px",
                border: "1px solid #E0E7FF",
              }}
            >
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "white",
                  flexShrink: 0,
                  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                }}
              >
                {e.nombre_empresa[0]?.toUpperCase() ?? "E"}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: "19px", fontWeight: 800, color: "#0C4A6E", marginBottom: "8px" }}
                >
                  {e.nombre_empresa}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: "999px",
                      background: pb.bg,
                      color: pb.color,
                      border: pb.border ?? "none",
                    }}
                  >
                    {pb.icon}
                    {e.plan_licencia}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: "999px",
                      background: estadoSt.bg,
                      color: estadoSt.color,
                    }}
                  >
                    ● {rawEstado}
                  </span>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              {[
                { icon: "🏭", label: "Sector", value: e.sector },
                { icon: "📍", label: "Ciudad", value: e.ciudad },
                {
                  icon: "📅",
                  label: "Inicio de relación",
                  value: e.fecha_inicio_relacion
                    ? new Date(e.fecha_inicio_relacion).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : null,
                },
                { icon: "👤", label: "Consultor", value: e.consultor_nombre },
                {
                  icon: "🧩",
                  label: "Módulos",
                  value: `${modules.length} módulo${modules.length !== 1 ? "s" : ""}`,
                },
                {
                  icon: "📆",
                  label: "Registrada",
                  value: new Date(e.created_at).toLocaleDateString("es", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "#F8FAFF",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    border: "1px solid #F0F4FF",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "4px",
                    }}
                  >
                    {item.icon} {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: item.value ? "#0C4A6E" : "#CBD5E1",
                    }}
                  >
                    {item.value ?? "—"}
                  </div>
                </div>
              ))}
            </div>

            {/* Descripción */}
            {e.descripcion && (
              <div
                style={{
                  background: "#F8FAFF",
                  borderRadius: "12px",
                  padding: "16px",
                  border: "1px solid #F0F4FF",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "8px",
                  }}
                >
                  📝 Descripción
                </div>
                <div style={{ fontSize: "14px", color: "#374151", lineHeight: "1.7" }}>
                  {e.descripcion}
                </div>
              </div>
            )}

            {/* Módulos disponibles */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "10px" }}
              >
                Módulos disponibles — plan {e.plan_licencia}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {modules.map((m) => (
                  <span
                    key={m}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: 600,
                      background: "#ECFDF5",
                      color: "#059669",
                      border: "1px solid #A7F3D0",
                    }}
                  >
                    ✓ {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Actividad reciente */}
            <div style={{ marginBottom: "8px" }}>
              <div
                style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "12px" }}
              >
                Actividad reciente
              </div>
              {detailLoading ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#94A3B8",
                    fontSize: "14px",
                    background: "#F8FAFF",
                    borderRadius: "12px",
                  }}
                >
                  Cargando actividades…
                </div>
              ) : detailActividades.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#CBD5E1",
                    fontSize: "14px",
                    background: "#F8FAFF",
                    borderRadius: "12px",
                    border: "1px solid #F0F4FF",
                  }}
                >
                  Sin actividad registrada
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {detailActividades.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "12px 16px",
                        background: "#F8FAFF",
                        borderRadius: "12px",
                        border: "1px solid #F0F4FF",
                      }}
                    >
                      <span style={{ fontSize: "20px", flexShrink: 0 }}>
                        {TIPO_ICONS[a.tipo] ?? "⚡"}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0C4A6E" }}>
                          {a.titulo}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                          {new Date(a.fecha).toLocaleDateString("es", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          {a.resultado && ` · ${a.resultado}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "28px" }}
            >
              <button
                onClick={() => {
                  closeModal();
                  openEdit(e);
                }}
                style={{
                  padding: "11px 22px",
                  borderRadius: "10px",
                  border: "1.5px solid #E0E7FF",
                  background: "white",
                  color: "#0EA5E9",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Editar empresa
              </button>
              <button
                onClick={closeModal}
                style={{
                  padding: "11px 28px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
          </ModalWrap>
        );
      })()}
    </>
  );
}
