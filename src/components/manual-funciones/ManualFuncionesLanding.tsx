import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
  onSelectArea: () => void;
  onSelectCargo: (id: string, areaId: string, areaName: string, colorIdx: number) => void;
};

function AreaCard({ area, cargos, colorIdx, onSelectArea, onSelectCargo }: AreaCardProps) {
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
  onSelectArea: (areaId: string, areaName: string, colorIdx: number) => void;
  onSelectCargo: (cargoId: string, areaId: string, areaName: string, colorIdx: number) => void;
};

export function ManualFuncionesLanding({ clienteId, onSelectArea, onSelectCargo }: Props) {
  const [empresa, setEmpresa] = useState("");
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        </div>
      ) : (
        <>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {areas.length} área{areas.length !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {areas.map((area, idx) => (
              <AreaCard
                key={area.id}
                area={area}
                cargos={cargosByArea.get(area.nombre) ?? []}
                colorIdx={idx}
                onSelectArea={() => onSelectArea(area.id, area.nombre, idx)}
                onSelectCargo={onSelectCargo}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
