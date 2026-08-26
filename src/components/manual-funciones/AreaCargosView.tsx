import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Loader2, Plus, UserCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAreaColor, getAreaIcon } from "./area-palette";

// ── Types ──────────────────────────────────────────────────────────────────────

type CargoCard = {
  id: string;
  cargo: string;
  jefe_inmediato: string | null;
  vacante: boolean | null;
  estado: string | null;
  codigo: string | null;
};

// ── CargoCardItem ──────────────────────────────────────────────────────────────

type CargoCardItemProps = {
  cargo: CargoCard;
  dot: string;
  bg: string;
  border: string;
  onClick: () => void;
};

function CargoCardItem({ cargo, dot, bg, border, onClick }: CargoCardItemProps) {
  const [hovered, setHovered] = useState(false);
  const initial = cargo.cargo.charAt(0).toUpperCase();
  const isVigente = (cargo.estado ?? "vigente") === "vigente";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir ficha ${cargo.cargo}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "14px 16px",
        background: hovered ? bg : "white",
        border: `1.5px solid ${hovered ? dot : border}`,
        borderRadius: "12px", cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered ? `0 4px 14px ${dot}2a` : "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
        background: bg, border: `1.5px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "16px", fontWeight: 800, color: dot,
      }}>
        {initial}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "14px", fontWeight: 700, color: "#0C4A6E",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {cargo.cargo}
        </div>
        {cargo.jefe_inmediato && (
          <div style={{
            fontSize: "11px", color: "#64748B", marginTop: "2px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            <UserCircle2 style={{ width: "11px", height: "11px", display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
            Reporta a: {cargo.jefe_inmediato}
          </div>
        )}
        {/* Badges */}
        <div style={{ display: "flex", gap: "5px", marginTop: "5px", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px",
            background: isVigente ? "#DCFCE7" : "#F1F5F9",
            color:      isVigente ? "#16A34A" : "#64748B",
          }}>
            {cargo.estado ?? "Vigente"}
          </span>
          {cargo.vacante && (
            <span style={{
              fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px",
              background: "#FEF9C3", color: "#854D0E",
            }}>
              Vacante
            </span>
          )}
          {cargo.codigo && (
            <span style={{
              fontSize: "10px", color: "#94A3B8", padding: "2px 7px",
              borderRadius: "20px", background: "#F8FAFC", border: "1px solid #E2E8F0",
            }}>
              {cargo.codigo}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight style={{ width: "18px", height: "18px", color: hovered ? dot : "#CBD5E1", flexShrink: 0 }} />
    </div>
  );
}

// ── AreaCargosView ─────────────────────────────────────────────────────────────

type Props = {
  clienteId: string;
  areaId: string;         // manual_areas.id — used for permission gate
  areaName: string;       // display label only (cargo filter uses areaId)
  colorIdx: number;       // palette index from landing
  canManage: boolean;
  userRolEmpresa: string | null;
  restrictedAreaId: string | null; // empresa_usuarios.area_id; null = no restriction
  onBack: () => void;
  onSelectCargo: (cargoId: string) => void;
};

export function AreaCargosView({
  clienteId,
  areaId,
  areaName,
  colorIdx,
  canManage,
  userRolEmpresa,
  restrictedAreaId,
  onBack,
  onSelectCargo,
}: Props) {
  const [cargos, setCargos] = useState<CargoCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Nuevo Cargo dialog
  const [showDialog, setShowDialog] = useState(false);
  const [newCargoName, setNewCargoName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openDialog = () => {
    setNewCargoName("");
    setSaveError(null);
    setShowDialog(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeDialog = () => { if (!saving) setShowDialog(false); };

  const handleCreateCargo = async () => {
    const nombre = newCargoName.trim();
    if (!nombre || saving) return;
    setSaving(true);
    setSaveError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("manual_funciones_cargos")
      .insert({ cliente_id: clienteId, cargo: nombre, area: areaName, area_id: areaId })
      .select("id,cargo")
      .single();
    if (error || !data) {
      setSaveError(error?.message ?? "Error al crear el cargo");
      setSaving(false);
      return;
    }
    setSaving(false);
    setShowDialog(false);
    setNewCargoName("");
    onSelectCargo((data as { id: string }).id);
  };

  // Permission gate: jefe_area can only see their own area
  useEffect(() => {
    if (
      userRolEmpresa === "jefe_area" &&
      restrictedAreaId !== null &&
      restrictedAreaId !== areaId
    ) {
      onBack();
    }
  }, [userRolEmpresa, restrictedAreaId, areaId, onBack]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Filter by area_id (UUID FK) — not the area text field — to avoid
      // tilde/case mismatch between manual_areas.nombre and cargos.area.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("manual_funciones_cargos")
        .select("id,cargo,jefe_inmediato,vacante,estado,codigo")
        .eq("cliente_id", clienteId)
        .eq("area_id", areaId)
        .order("cargo");
      if (cancelled) return;
      setCargos((data ?? []) as CargoCard[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clienteId, areaId]);

  const { bg, border, dot } = getAreaColor(colorIdx);
  const icon = getAreaIcon(areaName);

  // While the permission gate redirect is in flight, render nothing
  if (userRolEmpresa === "jefe_area" && restrictedAreaId !== null && restrictedAreaId !== areaId) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Breadcrumb + header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          onClick={onBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            fontSize: "12px", fontWeight: 600, color: "#475569",
            background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "8px",
            cursor: "pointer", padding: "5px 12px",
            width: "fit-content",
          }}
        >
          <ArrowLeft style={{ width: "14px", height: "14px" }} />
          Manual de Funciones
        </button>

        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          background: `linear-gradient(135deg, ${dot}18, ${dot}08)`,
          border: `1.5px solid ${border}`,
          borderRadius: "14px", padding: "14px 18px",
        }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "11px", flexShrink: 0,
            background: bg, border: `1.5px solid ${border}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: dot, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>
              Área
            </div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.01em" }}>
              {areaName}
            </div>
            {!loading && (
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                {cargos.length === 0
                  ? "Sin cargos asignados"
                  : `${cargos.length} cargo${cargos.length !== 1 ? "s" : ""}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar: cargo count + Nuevo Cargo button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {!loading && (
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#94A3B8",
                        letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {cargos.length === 0 ? "Sin cargos" : `${cargos.length} cargo${cargos.length !== 1 ? "s" : ""}`}
          </div>
        )}
        {canManage && (
          <button onClick={openDialog} style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            fontSize: "12px", fontWeight: 700, color: "#0EA5E9",
            background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: "8px",
            padding: "6px 12px", cursor: "pointer", marginLeft: "auto",
          }}>
            <Plus style={{ width: "12px", height: "12px" }} />
            Nuevo Cargo
          </button>
        )}
      </div>

      {/* Cargo list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "160px" }}>
          <Loader2 style={{ width: "24px", height: "24px", color: "#94A3B8" }} className="animate-spin" />
        </div>
      ) : cargos.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 24px",
          border: `1.5px dashed ${border}`, borderRadius: "12px",
          color: "#94A3B8", fontSize: "14px",
        }}>
          Esta área no tiene cargos asignados aún.
          {canManage && (
            <div style={{ marginTop: "16px" }}>
              <button onClick={openDialog} style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "13px", fontWeight: 700, color: "white",
                background: "#0C4A6E", border: "none", borderRadius: "10px",
                padding: "10px 18px", cursor: "pointer",
              }}>
                <Plus style={{ width: "14px", height: "14px" }} />
                Nuevo Cargo
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {cargos.map((c) => (
            <CargoCardItem
              key={c.id}
              cargo={c}
              dot={dot}
              bg={bg}
              border={border}
              onClick={() => onSelectCargo(c.id)}
            />
          ))}
        </div>
      )}

      {/* Nuevo Cargo dialog */}
      {showDialog && (
        <div onClick={closeDialog} style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "white", borderRadius: "16px", padding: "28px",
            width: "100%", maxWidth: "400px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E" }}>Nuevo Cargo</div>
                <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>Área: {areaName}</div>
              </div>
              <button onClick={closeDialog} disabled={saving}
                style={{ background: "none", border: "none", cursor: saving ? "default" : "pointer", color: "#94A3B8", padding: "4px" }}>
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B",
                            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                Nombre del cargo
              </div>
              <input
                ref={inputRef}
                type="text"
                value={newCargoName}
                onChange={(e) => setNewCargoName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleCreateCargo(); if (e.key === "Escape") closeDialog(); }}
                placeholder="Ej: Coordinador de Nómina"
                style={{
                  width: "100%", padding: "10px 14px", fontSize: "14px",
                  border: "1.5px solid #E2E8F0", borderRadius: "10px",
                  color: "#0C4A6E", outline: "none", boxSizing: "border-box",
                }}
              />
              {saveError && <div style={{ marginTop: "8px", fontSize: "12px", color: "#DC2626" }}>{saveError}</div>}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={closeDialog} disabled={saving} style={{
                padding: "9px 18px", fontSize: "13px", fontWeight: 600,
                color: "#64748B", background: "#F1F5F9",
                border: "1px solid #E2E8F0", borderRadius: "10px", cursor: saving ? "default" : "pointer",
              }}>Cancelar</button>
              <button onClick={() => void handleCreateCargo()}
                disabled={saving || !newCargoName.trim()} style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "9px 18px", fontSize: "13px", fontWeight: 700,
                color: "white",
                background: saving || !newCargoName.trim() ? "#94A3B8" : "#0C4A6E",
                border: "none", borderRadius: "10px",
                cursor: saving || !newCargoName.trim() ? "default" : "pointer",
              }}>
                {saving
                  ? <Loader2 style={{ width: "13px", height: "13px" }} className="animate-spin" />
                  : <Plus style={{ width: "13px", height: "13px" }} />}
                {saving ? "Creando…" : "Crear cargo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
