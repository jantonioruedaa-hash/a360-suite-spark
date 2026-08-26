import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAreaColor, getAreaIcon } from "./area-palette";

// ── Types ──────────────────────────────────────────────────────────────────────

type AreaRow = {
  id: string;
  nombre: string;
  orden: number;
};

type CargoItem = {
  id: string;
  cargo: string;
  area: string;
  estado: string | null;
  vacante: boolean | null;
};

// ── AreaCard ───────────────────────────────────────────────────────────────────

type AreaCardProps = {
  area: AreaRow;
  cargos: CargoItem[];
  colorIdx: number;
  canManage: boolean;
  onSelectArea: () => void;
  onDelete: () => void;
  onSelectCargo: (id: string, areaId: string, areaName: string, colorIdx: number) => void;
};

function AreaCard({ area, cargos, colorIdx, canManage, onSelectArea, onDelete, onSelectCargo }: AreaCardProps) {
  const { bg, border, dot } = getAreaColor(colorIdx);
  const [hovered, setHovered] = useState(false);
  const visible = cargos.slice(0, 6);
  const overflow = cargos.length - visible.length;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Ver área ${area.nombre}`}
      style={{
        background: hovered ? bg : "white",
        border: `1.5px solid ${hovered ? dot : border}`,
        borderRadius: "14px",
        padding: "16px",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered ? `0 4px 16px ${dot}33` : "0 1px 4px rgba(0,0,0,0.06)",
      }}
      onClick={onSelectArea}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelectArea(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "9px", flexShrink: 0,
          background: bg, border: `1.5px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
        }}>
          {getAreaIcon(area.nombre)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "13px", fontWeight: 700, color: "#0C4A6E", lineHeight: 1.2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {area.nombre}
          </div>
          <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
            {cargos.length === 0
              ? "Sin cargos asignados"
              : `${cargos.length} cargo${cargos.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        {cargos.length > 0 && (
          <div style={{
            minWidth: "22px", height: "22px", borderRadius: "11px", padding: "0 6px",
            background: dot, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ color: "white", fontSize: "11px", fontWeight: 700 }}>{cargos.length}</span>
          </div>
        )}
        {canManage && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Eliminar área"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "26px", height: "26px", borderRadius: "7px", flexShrink: 0,
              background: hovered ? "#FFF5F5" : "transparent",
              border: `1px solid ${hovered ? "#FEE2E2" : "transparent"}`,
              color: hovered ? "#EF4444" : "transparent",
              cursor: "pointer", transition: "color 0.15s, background 0.15s, border-color 0.15s",
            }}
          >
            <Trash2 style={{ width: "13px", height: "13px" }} />
          </button>
        )}
      </div>

      {/* Cargo pills — or empty state hint */}
      {cargos.length === 0 ? (
        <div style={{
          fontSize: "11px", color: "#CBD5E1", fontStyle: "italic",
          border: `1px dashed ${border}`, borderRadius: "8px", padding: "6px 10px",
        }}>
          Área sin cargos — haz clic para configurar
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {visible.map((c) => (
            <button
              key={c.id}
              onClick={(e) => { e.stopPropagation(); onSelectCargo(c.id, area.id, area.nombre, colorIdx); }}
              title={c.cargo}
              style={{
                fontSize: "11px", fontWeight: 600, color: dot,
                background: "white", border: `1px solid ${border}`,
                borderRadius: "20px", padding: "3px 10px",
                cursor: "pointer", transition: "background 0.12s",
                whiteSpace: "nowrap", maxWidth: "180px",
                overflow: "hidden", textOverflow: "ellipsis",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "white"; }}
            >
              {c.cargo}
            </button>
          ))}
          {overflow > 0 && (
            <span style={{ fontSize: "11px", color: "#94A3B8", padding: "3px 6px", alignSelf: "center" }}>
              +{overflow} más
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── ManualFuncionesLanding ─────────────────────────────────────────────────────

type Props = {
  clienteId: string;
  canManage: boolean;
  onSelectArea: (areaId: string, areaName: string, colorIdx: number) => void;
  onSelectCargo: (cargoId: string, areaId: string, areaName: string, colorIdx: number) => void;
};

export function ManualFuncionesLanding({ clienteId, canManage, onSelectArea, onSelectCargo }: Props) {
  const [empresa, setEmpresa] = useState("");
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Eliminar Área dialog
  const [areaToDelete, setAreaToDelete] = useState<{ area: AreaRow; cargoCount: number } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteConfirmInputRef = useRef<HTMLInputElement>(null);

  const openDeleteDialog = (area: AreaRow, cargoCount: number) => {
    setAreaToDelete({ area, cargoCount });
    setDeleteConfirmName("");
    setDeleteError(null);
    if (cargoCount === 0) setTimeout(() => deleteConfirmInputRef.current?.focus(), 50);
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setAreaToDelete(null);
    setDeleteConfirmName("");
    setDeleteError(null);
  };

  const handleDeleteArea = async () => {
    if (!areaToDelete || deleting) return;
    if (deleteConfirmName.trim() !== areaToDelete.area.nombre) return;
    setDeleting(true);
    setDeleteError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("manual_areas")
      .delete()
      .eq("id", areaToDelete.area.id);
    if (error) {
      setDeleteError(error.message);
      setDeleting(false);
      return;
    }
    setAreas((prev) => prev.filter((a) => a.id !== areaToDelete.area.id));
    setAreaToDelete(null);
    setDeleteConfirmName("");
    setDeleting(false);
  };

  // Nueva Área dialog
  const [showDialog, setShowDialog] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openDialog = () => {
    setNewAreaName("");
    setSaveError(null);
    setShowDialog(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeDialog = () => {
    if (saving) return;
    setShowDialog(false);
  };

  const handleCreateArea = async () => {
    const nombre = newAreaName.trim();
    if (!nombre || saving) return;
    setSaving(true);
    setSaveError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("manual_areas")
      .insert({ cliente_id: clienteId, nombre, orden: areas.length })
      .select("id,nombre,orden")
      .single();
    if (error || !data) {
      setSaveError(error?.message ?? "Error al crear el área");
      setSaving(false);
      return;
    }
    const newArea = data as AreaRow;
    const newIdx = areas.length;
    setAreas((prev) => [...prev, newArea]);
    setShowDialog(false);
    setNewAreaName("");
    setSaving(false);
    onSelectArea(newArea.id, newArea.nombre, newIdx);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: cl }, { data: areaRows }, { data: cargoRows }] = await Promise.all([
        supabase.from("clientes").select("nombre_empresa").eq("id", clienteId).single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("manual_areas")
          .select("id,nombre,orden")
          .eq("cliente_id", clienteId)
          .order("orden"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("manual_funciones_cargos")
          .select("id,cargo,area,estado,vacante")
          .eq("cliente_id", clienteId)
          .order("cargo"),
      ]);
      if (cancelled) return;
      setEmpresa(cl?.nombre_empresa ?? "");
      setAreas((areaRows ?? []) as AreaRow[]);
      setCargos((cargoRows ?? []) as CargoItem[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clienteId]);

  // Join: group cargos by area name (matches manual_funciones_cargos.area text field)
  const cargosByArea = new Map<string, CargoItem[]>();
  for (const c of cargos) {
    if (!c.area) continue;
    if (!cargosByArea.has(c.area)) cargosByArea.set(c.area, []);
    cargosByArea.get(c.area)!.push(c);
  }

  const totalCargos = cargos.length;
  const vigentes    = cargos.filter((c) => c.estado === "vigente").length;
  const vacantes    = cargos.filter((c) => c.vacante).length;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <Loader2 style={{ width: "28px", height: "28px", color: "#94A3B8" }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 60%, #312E81 100%)",
        borderRadius: "16px", padding: "20px 28px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 50% 70% at 90% 10%, rgba(14,165,233,0.15), transparent)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, color: "#38BDF8",
            textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "4px",
          }}>
            Manual de Funciones · {empresa}
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 900, color: "white", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
            Áreas y Cargos
          </h1>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {[
              { val: totalCargos,  lbl: "Cargos totales" },
              { val: areas.length, lbl: "Áreas" },
              { val: vigentes,     lbl: "Vigentes" },
              { val: vacantes,     lbl: "Vacantes" },
            ].map((s) => (
              <div key={s.lbl} style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px", padding: "8px 14px",
              }}>
                <div style={{ fontSize: "20px", fontWeight: 900, color: "white", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginTop: "3px" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area grid */}
      {areas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8", fontSize: "14px" }}>
          No hay áreas configuradas aún.
          {canManage && (
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={openDialog}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  fontSize: "13px", fontWeight: 700, color: "white",
                  background: "#0C4A6E", border: "none", borderRadius: "10px",
                  padding: "10px 18px", cursor: "pointer",
                }}
              >
                <Plus style={{ width: "14px", height: "14px" }} />
                Nueva Área
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {areas.length} área{areas.length !== 1 ? "s" : ""}
            </div>
            {canManage && (
              <button
                onClick={openDialog}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  fontSize: "12px", fontWeight: 700, color: "#0EA5E9",
                  background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: "8px",
                  padding: "6px 12px", cursor: "pointer",
                }}
              >
                <Plus style={{ width: "12px", height: "12px" }} />
                Nueva Área
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {areas.map((area, idx) => (
              <AreaCard
                key={area.id}
                area={area}
                cargos={cargosByArea.get(area.nombre) ?? []}
                colorIdx={idx}
                canManage={canManage}
                onSelectArea={() => onSelectArea(area.id, area.nombre, idx)}
                onDelete={() => openDeleteDialog(area, cargosByArea.get(area.nombre)?.length ?? 0)}
                onSelectCargo={onSelectCargo}
              />
            ))}
          </div>
        </>
      )}

      {/* Eliminar Área dialog */}
      {areaToDelete && (
        <div onClick={closeDeleteDialog} style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "white", borderRadius: "16px", padding: "28px",
            width: "100%", maxWidth: "440px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "20px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
                background: "#FFF5F5", border: "1px solid #FEE2E2",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Trash2 style={{ width: "18px", height: "18px", color: "#EF4444" }} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E", marginBottom: "6px" }}>
                  Eliminar área
                </div>
                {areaToDelete.cargoCount > 0 ? (
                  <div style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>
                    El área <strong style={{ color: "#0C4A6E" }}>{areaToDelete.area.nombre}</strong> tiene{" "}
                    <strong>{areaToDelete.cargoCount} cargo{areaToDelete.cargoCount !== 1 ? "s" : ""}</strong>.
                    Elimínalos o reasígnalos a otra área antes de borrarla.
                  </div>
                ) : (
                  <div style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>
                    Escribe <strong style={{ color: "#0C4A6E" }}>{areaToDelete.area.nombre}</strong> para confirmar.
                    Esta acción eliminará el área permanentemente y no se puede deshacer.
                  </div>
                )}
              </div>
            </div>

            {areaToDelete.cargoCount === 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B",
                              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  Nombre del área
                </div>
                <input
                  ref={deleteConfirmInputRef}
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && deleteConfirmName.trim() === areaToDelete.area.nombre) void handleDeleteArea();
                    if (e.key === "Escape") closeDeleteDialog();
                  }}
                  placeholder={areaToDelete.area.nombre}
                  style={{
                    width: "100%", padding: "10px 14px", fontSize: "14px",
                    border: `1.5px solid ${deleteConfirmName.trim() === areaToDelete.area.nombre ? "#EF4444" : "#E2E8F0"}`,
                    borderRadius: "10px", color: "#0C4A6E", outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                />
                {deleteError && <div style={{ marginTop: "8px", fontSize: "12px", color: "#DC2626" }}>{deleteError}</div>}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={closeDeleteDialog} disabled={deleting} style={{
                padding: "9px 18px", fontSize: "13px", fontWeight: 600,
                color: "#64748B", background: "#F1F5F9",
                border: "1px solid #E2E8F0", borderRadius: "10px", cursor: deleting ? "default" : "pointer",
              }}>
                {areaToDelete.cargoCount > 0 ? "Entendido" : "Cancelar"}
              </button>
              {areaToDelete.cargoCount === 0 && (
                <button
                  onClick={() => void handleDeleteArea()}
                  disabled={deleting || deleteConfirmName.trim() !== areaToDelete.area.nombre}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "9px 18px", fontSize: "13px", fontWeight: 700,
                    color: "white",
                    background: deleting || deleteConfirmName.trim() !== areaToDelete.area.nombre ? "#94A3B8" : "#DC2626",
                    border: "none", borderRadius: "10px",
                    cursor: deleting || deleteConfirmName.trim() !== areaToDelete.area.nombre ? "default" : "pointer",
                  }}
                >
                  {deleting
                    ? <Loader2 style={{ width: "13px", height: "13px" }} className="animate-spin" />
                    : <Trash2 style={{ width: "13px", height: "13px" }} />}
                  {deleting ? "Eliminando…" : "Eliminar área"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nueva Área dialog */}
      {showDialog && (
        <div
          onClick={closeDialog}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.45)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: "16px", padding: "28px",
              width: "100%", maxWidth: "400px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            {/* Dialog header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E" }}>Nueva Área</div>
              <button
                onClick={closeDialog}
                disabled={saving}
                style={{ background: "none", border: "none", cursor: saving ? "default" : "pointer", color: "#94A3B8", padding: "4px" }}
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            {/* Input */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                Nombre del área
              </div>
              <input
                ref={inputRef}
                type="text"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleCreateArea(); if (e.key === "Escape") closeDialog(); }}
                placeholder="Ej: Recursos Humanos"
                style={{
                  width: "100%", padding: "10px 14px", fontSize: "14px",
                  border: "1.5px solid #E2E8F0", borderRadius: "10px",
                  color: "#0C4A6E", outline: "none", boxSizing: "border-box",
                }}
              />
              {saveError && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#DC2626" }}>{saveError}</div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={closeDialog}
                disabled={saving}
                style={{
                  padding: "9px 18px", fontSize: "13px", fontWeight: 600,
                  color: "#64748B", background: "#F1F5F9",
                  border: "1px solid #E2E8F0", borderRadius: "10px", cursor: saving ? "default" : "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleCreateArea()}
                disabled={saving || !newAreaName.trim()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "9px 18px", fontSize: "13px", fontWeight: 700,
                  color: "white", background: saving || !newAreaName.trim() ? "#94A3B8" : "#0C4A6E",
                  border: "none", borderRadius: "10px",
                  cursor: saving || !newAreaName.trim() ? "default" : "pointer",
                }}
              >
                {saving
                  ? <Loader2 style={{ width: "13px", height: "13px" }} className="animate-spin" />
                  : <Plus style={{ width: "13px", height: "13px" }} />}
                {saving ? "Creando…" : "Crear área"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
