import React, { useState } from "react";
import { toast } from "sonner";
import {
  adminCreateUser,
  adminUpdateProfile,
  adminToggleBan,
  adminResetPassword,
} from "@/lib/admin-users.functions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  empresa: string | null;
  empresaId: string | null;
  plan: string | null;
  activo: boolean;
  ultimo_acceso: string | null;
  created_at: string;
}

type AppRole = "admin" | "consultor" | "cliente" | "participante";
interface ClienteOption { id: string; nombre_empresa: string }

interface Props {
  usuarios: AdminUserRow[];
  accessToken: string | null;
  clientes: ClienteOption[];
  onRefresh: () => void;
}

// ─── Style constants ──────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { bg: string; color: string; icon: string; label: string }> = {
  admin: { bg: "linear-gradient(135deg,#EDE9FE,#DDD6FE)", color: "#6D28D9", icon: "👑", label: "Super Admin" },
  consultor: { bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", color: "#1D4ED8", icon: "🎯", label: "Consultor" },
  cliente: { bg: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", color: "#065F46", icon: "🏢", label: "Cliente" },
  participante: { bg: "#F5F7FF", color: "#6366F1", icon: "👤", label: "Participante" },
};

const AVATAR_GRAD: Record<string, string> = {
  admin: "linear-gradient(135deg,#0C4A6E,#1E3A8A)",
  consultor: "linear-gradient(135deg,#0EA5E9,#6366F1)",
  cliente: "linear-gradient(135deg,#1D9E75,#10B981)",
  participante: "linear-gradient(135deg,#94A3B8,#64748B)",
};

const td: React.CSSProperties = {
  padding: "16px 20px",
  fontSize: "14px",
  color: "#374151",
  borderBottom: "1px solid #F8FAFF",
  verticalAlign: "middle",
};

const th: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#94A3B8",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  padding: "13px 20px",
  textAlign: "left",
  background: "#F8FAFF",
  borderBottom: "1px solid #F0F4FF",
  whiteSpace: "nowrap",
};

const inputSt: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1.5px solid #E0E7FF",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  color: "#1E293B",
  background: "white",
  boxSizing: "border-box",
};

const labelSt: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "#0C4A6E",
  marginBottom: "7px",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

const fieldSt: React.CSSProperties = { marginBottom: "18px" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string) {
  return (name ?? email).split(" ").map(s => s[0] ?? "").slice(0, 2).join("").toUpperCase();
}

function fmtDate(iso: string | null) {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

interface ModalWrapProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
  children: React.ReactNode;
}

function ModalWrap({ title, onClose, onSubmit, submitting, error, submitLabel, children }: ModalWrapProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(12,74,110,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={e => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 24px 64px rgba(12,74,110,0.22)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg,#0C4A6E,#1E3A8A)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "17px", fontWeight: 800, color: "white" }}>{title}</div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
              borderRadius: "8px",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 24px 0" }}>{children}</div>

        {/* Footer */}
        <div style={{ padding: "12px 24px 22px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#DC2626",
                borderRadius: "10px",
                padding: "11px 15px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              ⚠️ {error}
            </div>
          )}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "1.5px solid #E0E7FF",
                background: "white",
                color: "#64748B",
                fontSize: "14px",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting}
              style={{
                padding: "10px 22px",
                borderRadius: "10px",
                background: submitting ? "#94A3B8" : "linear-gradient(135deg,#0EA5E9,#6366F1)",
                color: "white",
                fontSize: "14px",
                fontWeight: 700,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : "0 4px 14px rgba(14,165,233,0.28)",
              }}
            >
              {submitting ? "Guardando…" : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Role selector ────────────────────────────────────────────────────────────

const ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "👑 Super Admin" },
  { value: "consultor", label: "🎯 Consultor" },
  { value: "cliente", label: "🏢 Cliente" },
  { value: "participante", label: "👤 Participante" },
];

// ─── Main component ───────────────────────────────────────────────────────────

const EMPTY_CREATE = { name: "", email: "", password: "", role: "consultor" as AppRole, clienteId: "" };

export default function AdminUserTable({ usuarios, accessToken, clientes, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | { type: "create" } | { type: "edit"; user: AdminUserRow }>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<{ name: string; role: AppRole; clienteId: string }>({
    name: "", role: "consultor", clienteId: "",
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateForm(EMPTY_CREATE);
    setModalError(null);
    setModal({ type: "create" });
  };

  const openEdit = (u: AdminUserRow) => {
    setEditForm({ name: u.name ?? "", role: (u.role as AppRole) ?? "cliente", clienteId: u.empresaId ?? "" });
    setModalError(null);
    setModal({ type: "edit", user: u });
  };

  const closeModal = () => { if (!submitting) setModal(null); };

  const handleCreate = async () => {
    if (!createForm.email) { setModalError("El email es obligatorio."); return; }
    if (createForm.password.length < 6) { setModalError("La contraseña debe tener al menos 6 caracteres."); return; }
    setSubmitting(true);
    setModalError(null);
    try {
      const sel = clientes.find(c => c.id === createForm.clienteId);
      await adminCreateUser({
        data: {
          accessToken: accessToken ?? undefined,
          email: createForm.email.trim(),
          password: createForm.password,
          name: createForm.name.trim() || undefined,
          company: sel?.nombre_empresa,
          role: createForm.role,
          clienteId: createForm.clienteId || undefined,
        },
      });
      setModal(null);
      setCreateForm(EMPTY_CREATE);
      onRefresh();
      toast.success("Usuario creado exitosamente");
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Error al crear usuario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (modal?.type !== "edit") return;
    setSubmitting(true);
    setModalError(null);
    try {
      const sel = clientes.find(c => c.id === editForm.clienteId);
      await adminUpdateProfile({
        data: {
          accessToken: accessToken ?? undefined,
          userId: modal.user.id,
          name: editForm.name.trim() || null,
          company: sel?.nombre_empresa ?? null,
          role: editForm.role,
          clienteId: editForm.clienteId || null,
        },
      });
      setModal(null);
      onRefresh();
      toast.success("Usuario actualizado");
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Error al actualizar usuario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBan = async (u: AdminUserRow) => {
    setLoadingId(u.id);
    try {
      await adminToggleBan({ data: { accessToken: accessToken ?? undefined, userId: u.id, block: u.activo } });
      onRefresh();
      toast.success(u.activo ? "Usuario desactivado" : "Usuario activado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cambiar estado");
    } finally {
      setLoadingId(null);
    }
  };

  const handleResetPassword = async (u: AdminUserRow) => {
    setLoadingId(u.id + "_pwd");
    try {
      await adminResetPassword({
        data: { accessToken: accessToken ?? undefined, userId: u.id, sendEmail: true, email: u.email },
      });
      toast.success(`Email de restablecimiento enviado a ${u.email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar email");
    } finally {
      setLoadingId(null);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const filtered = usuarios.filter(
    u => (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: usuarios.length,
    admin: usuarios.filter(u => u.role === "admin").length,
    consultor: usuarios.filter(u => u.role === "consultor").length,
    otros: usuarios.filter(u => u.role === "cliente" || u.role === "participante").length,
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Stats row */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "28px" }}>
        {[
          { val: stats.total, lbl: "Total usuarios" },
          { val: stats.admin, lbl: "Administradores" },
          { val: stats.consultor, lbl: "Consultores" },
          { val: stats.otros, lbl: "Clientes / Participantes" },
        ].map(s => (
          <div
            key={s.lbl}
            style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid #E0E7FF",
              padding: "20px 24px",
              flex: 1,
            }}
          >
            <div style={{ fontSize: "30px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>
              {s.val}
            </div>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "5px", fontWeight: 600 }}>
              {s.lbl}
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: "white", borderRadius: "20px", border: "1px solid #E0E7FF", overflow: "hidden" }}>
        {/* Toolbar */}
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F0F4FF",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#0C4A6E" }}>Todos los usuarios</div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Buscar por nombre o email…"
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                border: "1.5px solid #E0E7FF",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                width: "240px",
              }}
            />
            <button
              onClick={openCreate}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                background: "linear-gradient(135deg,#0EA5E9,#6366F1)",
                color: "white",
                fontSize: "14px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(14,165,233,0.28)",
                whiteSpace: "nowrap",
              }}
            >
              + Nuevo usuario
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Usuario", "Rol", "Empresa", "Último acceso", "Creado", "Estado", "Acciones"].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const rb = ROLE_BADGE[u.role] ?? ROLE_BADGE.cliente!;
                  const isBanLoading = loadingId === u.id;
                  const isPwdLoading = loadingId === u.id + "_pwd";
                  return (
                    <tr
                      key={u.id}
                      onMouseEnter={() => setHoveredId(u.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{ background: hoveredId === u.id ? "#F8FAFF" : "white", cursor: "pointer" }}
                    >
                      {/* Usuario */}
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "white",
                              flexShrink: 0,
                              background: AVATAR_GRAD[u.role] ?? AVATAR_GRAD.cliente,
                            }}
                          >
                            {getInitials(u.name, u.email)}
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E" }}>
                              {u.name ?? "—"}
                            </div>
                            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td style={td}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "5px 12px",
                            borderRadius: "999px",
                            background: rb.bg,
                            color: rb.color,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rb.icon} {rb.label}
                        </span>
                      </td>

                      {/* Empresa */}
                      <td style={{ ...td, color: u.empresa ? "#374151" : "#94A3B8" }}>
                        {u.empresa ?? "—"}
                      </td>

                      {/* Último acceso */}
                      <td style={{ ...td, color: "#64748B", fontSize: "13px" }}>
                        {fmtDate(u.ultimo_acceso)}
                      </td>

                      {/* Creado */}
                      <td style={{ ...td, color: "#64748B", fontSize: "13px" }}>
                        {fmtDate(u.created_at)}
                      </td>

                      {/* Estado */}
                      <td style={td}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "5px 12px",
                            borderRadius: "999px",
                            background: u.activo ? "#ECFDF5" : "#FEF2F2",
                            color: u.activo ? "#059669" : "#DC2626",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ● {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ ...td, whiteSpace: "nowrap" }}>
                        {/* Editar */}
                        <button
                          onClick={() => openEdit(u)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "7px",
                            fontSize: "12px",
                            fontWeight: 600,
                            border: "1.5px solid #E0E7FF",
                            background: "white",
                            color: "#0EA5E9",
                            cursor: "pointer",
                            marginRight: "5px",
                          }}
                        >
                          Editar
                        </button>

                        {/* Activar / Desactivar (no se muestra para admins) */}
                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleToggleBan(u)}
                            disabled={isBanLoading}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "7px",
                              fontSize: "12px",
                              fontWeight: 600,
                              border: `1.5px solid ${u.activo ? "#FEE2E2" : "#D1FAE5"}`,
                              background: "white",
                              color: u.activo ? "#DC2626" : "#059669",
                              cursor: isBanLoading ? "not-allowed" : "pointer",
                              opacity: isBanLoading ? 0.6 : 1,
                              marginRight: "5px",
                            }}
                          >
                            {isBanLoading ? "…" : u.activo ? "Desactivar" : "Activar"}
                          </button>
                        )}

                        {/* Reset contraseña */}
                        <button
                          onClick={() => handleResetPassword(u)}
                          disabled={isPwdLoading}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "7px",
                            fontSize: "12px",
                            fontWeight: 600,
                            border: "1.5px solid #E0E7FF",
                            background: "white",
                            color: "#6366F1",
                            cursor: isPwdLoading ? "not-allowed" : "pointer",
                            opacity: isPwdLoading ? 0.6 : 1,
                          }}
                        >
                          {isPwdLoading ? "…" : "Reset pwd"}
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

      {/* ── Create modal ──────────────────────────────────────────────────────── */}
      {modal?.type === "create" && (
        <ModalWrap
          title="Crear nuevo usuario"
          onClose={closeModal}
          onSubmit={handleCreate}
          submitting={submitting}
          error={modalError}
          submitLabel="Crear usuario"
        >
          <div style={fieldSt}>
            <label style={labelSt}>Nombre completo</label>
            <input
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              placeholder="María González"
              style={inputSt}
            />
          </div>
          <div style={fieldSt}>
            <label style={labelSt}>Email <span style={{ color: "#EF4444" }}>*</span></label>
            <input
              type="email"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              placeholder="usuario@empresa.com"
              style={inputSt}
            />
          </div>
          <div style={fieldSt}>
            <label style={labelSt}>Contraseña temporal <span style={{ color: "#EF4444" }}>*</span></label>
            <input
              type="password"
              value={createForm.password}
              onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              style={inputSt}
            />
          </div>
          <div style={fieldSt}>
            <label style={labelSt}>Rol</label>
            <select
              value={createForm.role}
              onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as AppRole }))}
              style={{ ...inputSt, cursor: "pointer" }}
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div style={fieldSt}>
            <label style={labelSt}>Empresa asignada</label>
            <select
              value={createForm.clienteId}
              onChange={e => setCreateForm(f => ({ ...f, clienteId: e.target.value }))}
              style={{ ...inputSt, cursor: "pointer" }}
            >
              <option value="">— Sin empresa —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_empresa}</option>)}
            </select>
          </div>
        </ModalWrap>
      )}

      {/* ── Edit modal ────────────────────────────────────────────────────────── */}
      {modal?.type === "edit" && (
        <ModalWrap
          title={`Editar: ${modal.user.name ?? modal.user.email}`}
          onClose={closeModal}
          onSubmit={handleEdit}
          submitting={submitting}
          error={modalError}
          submitLabel="Guardar cambios"
        >
          <div style={fieldSt}>
            <label style={labelSt}>Nombre completo</label>
            <input
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              placeholder="María González"
              style={inputSt}
            />
          </div>
          <div style={{ ...fieldSt, background: "#F8FAFF", borderRadius: "10px", padding: "12px 14px" }}>
            <label style={{ ...labelSt, marginBottom: "4px", color: "#94A3B8" }}>Email (no editable aquí)</label>
            <div style={{ fontSize: "14px", color: "#374151", fontWeight: 600 }}>{modal.user.email}</div>
          </div>
          <div style={fieldSt}>
            <label style={labelSt}>Rol</label>
            <select
              value={editForm.role}
              onChange={e => setEditForm(f => ({ ...f, role: e.target.value as AppRole }))}
              style={{ ...inputSt, cursor: "pointer" }}
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div style={fieldSt}>
            <label style={labelSt}>Empresa asignada</label>
            <select
              value={editForm.clienteId}
              onChange={e => setEditForm(f => ({ ...f, clienteId: e.target.value }))}
              style={{ ...inputSt, cursor: "pointer" }}
            >
              <option value="">— Sin empresa —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_empresa}</option>)}
            </select>
          </div>
          <div
            style={{
              ...fieldSt,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 14px",
              background: modal.user.activo ? "#ECFDF5" : "#FEF2F2",
              borderRadius: "10px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700, color: modal.user.activo ? "#059669" : "#DC2626" }}>
              Estado: {modal.user.activo ? "Activo ●" : "Inactivo ○"}
            </span>
            {modal.user.role !== "admin" && (
              <button
                onClick={() => {
                  handleToggleBan(modal.user);
                  setModal(null);
                }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "7px",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "none",
                  background: modal.user.activo ? "#DC2626" : "#059669",
                  color: "white",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                {modal.user.activo ? "Desactivar" : "Activar"}
              </button>
            )}
          </div>
        </ModalWrap>
      )}
    </>
  );
}
