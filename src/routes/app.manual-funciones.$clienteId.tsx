import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/manual-funciones/$clienteId")({
  component: ManualFuncionesViewer,
});

// ── Types ──────────────────────────────────────────────────────────────────────

type HtmlCargo = Record<string, unknown>;

type SupabaseCargo = {
  id: string;
  cliente_id: string;
  cargo: string;
  area: string;
  jefe_inmediato?: string | null;
  vacante?: boolean;
  estado?: string | null;
  version?: string | null;
  codigo?: string | null;
  objetivo?: string | null;
  elaborado_por?: string | null;
  aprobado_por?: string | null;
  fecha_elaboracion?: string | null;
  fecha_revision?: string | null;
  supervisa_a?: string[];
  relaciones_internas?: string[];
  relaciones_externas?: string[];
  requisitos?: Record<string, string>;
  condiciones?: Record<string, string>;
  plan_carrera?: string | null;
  funciones?: Array<{ descripcion: string; porcentaje_tiempo: number }>;
  competencias_blandas?: Array<{ nombre: string; nivel: string; desc?: string }>;
  competencias_tecnicas?: Array<{ nombre: string; nivel: string; desc?: string }>;
  kpis?: Array<{ nombre: string; meta: string; frecuencia: string; formula?: string }>;
};

// ── Format helpers ─────────────────────────────────────────────────────────────

function isoToMmYyyy(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  return m && y ? `${m}/${y}` : "";
}

function mmYyyyToIso(s: string | null | undefined): string | null {
  if (!s) return null;
  const [m, y] = s.split("/");
  if (!m || !y) return null;
  return `${y}-${m.padStart(2, "0")}-01`;
}

function supabaseToHtml(row: SupabaseCargo, clienteNombre: string): HtmlCargo {
  return {
    id:                  row.id,
    cargo:               row.cargo,
    area:                row.area,
    jefe:                row.jefe_inmediato ?? "",
    vacante:             row.vacante ?? false,
    estado:              row.estado ?? "vigente",
    version:             row.version ?? "1.0",
    codigo:              row.codigo ?? "",
    objetivo:            row.objetivo ?? "",
    elaborado:           row.elaborado_por ?? "",
    aprobado:            row.aprobado_por ?? "",
    fecha_elaboracion:   isoToMmYyyy(row.fecha_elaboracion),
    fecha_revision:      isoToMmYyyy(row.fecha_revision),
    supervisa_a:         row.supervisa_a ?? [],
    relaciones_internas: row.relaciones_internas ?? [],
    relaciones_externas: row.relaciones_externas ?? [],
    requisitos:          row.requisitos ?? {},
    condiciones:         row.condiciones ?? {},
    plan_carrera:        row.plan_carrera ?? "",
    funciones:           (row.funciones ?? []).map(f => f.descripcion),
    competencias_blandas:  row.competencias_blandas ?? [],
    competencias_tecnicas: row.competencias_tecnicas ?? [],
    kpis: (row.kpis ?? []).map(k => ({
      nombre:  k.nombre,
      meta:    k.meta,
      freq:    k.frecuencia,
      formula: k.formula ?? "",
    })),
    nombre_empresa: clienteNombre,
  };
}

type ContentFields = Omit<SupabaseCargo, "id" | "cliente_id">;

function htmlToContent(c: HtmlCargo): ContentFields {
  return {
    cargo:               (c.cargo as string) ?? "",
    area:                (c.area as string) ?? "",
    jefe_inmediato:      (c.jefe as string) || null,
    vacante:             (c.vacante as boolean) ?? false,
    estado:              (c.estado as string) ?? "vigente",
    version:             (c.version as string) ?? "1.0",
    codigo:              (c.codigo as string) || null,
    objetivo:            (c.objetivo as string) || null,
    elaborado_por:       (c.elaborado as string) || null,
    aprobado_por:        (c.aprobado as string) || null,
    fecha_elaboracion:   mmYyyyToIso(c.fecha_elaboracion as string),
    fecha_revision:      mmYyyyToIso(c.fecha_revision as string),
    supervisa_a:         (c.supervisa_a as string[]) ?? [],
    relaciones_internas: (c.relaciones_internas as string[]) ?? [],
    relaciones_externas: (c.relaciones_externas as string[]) ?? [],
    requisitos:          (c.requisitos as Record<string, string>) ?? {},
    condiciones:         (c.condiciones as Record<string, string>) ?? {},
    plan_carrera:        (c.plan_carrera as string) || null,
    funciones: ((c.funciones as unknown[]) ?? []).map(f =>
      typeof f === "string"
        ? { descripcion: f, porcentaje_tiempo: 0 }
        : (f as { descripcion: string; porcentaje_tiempo: number }),
    ),
    competencias_blandas:  (c.competencias_blandas as SupabaseCargo["competencias_blandas"]) ?? [],
    competencias_tecnicas: (c.competencias_tecnicas as SupabaseCargo["competencias_tecnicas"]) ?? [],
    kpis: ((c.kpis as Array<Record<string, string>>) ?? []).map(k => ({
      nombre:     k.nombre    ?? "",
      meta:       k.meta      ?? "",
      frecuencia: k.freq      ?? "",
      formula:    k.formula   ?? "",
    })),
  };
}

// ── DELETE safeguard constants ─────────────────────────────────────────────────

const SAFE_DELETE_THRESHOLD  = 0.5;
const MIN_SET_SIZE_FOR_GUARD = 3;

// ── Component ─────────────────────────────────────────────────────────────────

function ManualFuncionesViewer() {
  const { clienteId } = Route.useParams();
  const navigate = useNavigate();
  const iframeRef      = useRef<HTMLIFrameElement>(null);
  const loadedUUIDs    = useRef<Set<string>>(new Set());
  const clienteNombre  = useRef<string>("");

  const [saving, setSaving] = useState(false);

  // Esc → volver al índice
  const handleBack = useCallback(
    () => navigate({ to: "/app/manual-funciones" }),
    [navigate],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleBack(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleBack]);

  // ── Bridge ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      // Validación 1: origin
      if (e.origin !== window.location.origin) return;
      const msg = e.data as { type?: string; clienteId?: string; cargos?: HtmlCargo[] };
      if (!msg?.type) return;
      // Validación 2: clienteId activo
      if (msg.clienteId !== clienteId) return;

      // ── MF_READY → inyectar datos ──────────────────────────────────────────
      if (msg.type === "MF_READY") {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const supa = supabase as any;
          const [{ data: cliente }, { data: rows, error: rowsErr }] = await Promise.all([
            supabase.from("clientes").select("nombre_empresa").eq("id", clienteId).single(),
            supa.from("manual_funciones_cargos").select("*").eq("cliente_id", clienteId).order("created_at"),
          ]);

          if (rowsErr) throw rowsErr;

          clienteNombre.current  = cliente?.nombre_empresa ?? "";
          const cargosDB         = (rows ?? []) as SupabaseCargo[];
          loadedUUIDs.current    = new Set(cargosDB.map(r => r.id));
          const htmlCargos       = cargosDB.map(r => supabaseToHtml(r, clienteNombre.current));

          // Validación 3: targetOrigin específico, nunca '*'
          iframeRef.current?.contentWindow?.postMessage(
            { type: "MF_DATA_RESPONSE", clienteId, cargos: htmlCargos },
            { targetOrigin: window.location.origin },
          );
        } catch (err) {
          toast.error("Error cargando cargos: " + (err instanceof Error ? err.message : String(err)));
          // Enviar array vacío para no bloquear al HTML
          iframeRef.current?.contentWindow?.postMessage(
            { type: "MF_DATA_RESPONSE", clienteId, cargos: [] },
            { targetOrigin: window.location.origin },
          );
        }
      }

      // ── MF_SAVE → persistir en Supabase ───────────────────────────────────
      if (msg.type === "MF_SAVE") {
        if (!Array.isArray(msg.cargos)) return;
        setSaving(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const consultorId = user?.id ?? null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const supa2 = supabase as any;

          const knownUUIDs  = loadedUUIDs.current;
          const payloadIds  = new Set(msg.cargos.map(c => c.id as string));

          // INSERTs y UPDATEs
          for (const cargo of msg.cargos) {
            const cargoId  = cargo.id as string;
            const fields   = htmlToContent(cargo);

            if (knownUUIDs.has(cargoId)) {
              // UPDATE — consultor_id no se toca
              const { error } = await supa2
                .from("manual_funciones_cargos")
                .update({ ...fields, updated_at: new Date().toISOString() })
                .eq("id", cargoId);
              if (error) throw error;
            } else {
              // INSERT — consultor_id = usuario actual
              const { error } = await supa2
                .from("manual_funciones_cargos")
                .insert({ id: cargoId, cliente_id: clienteId, consultor_id: consultorId, ...fields });
              if (error) throw error;
            }
          }

          // DELETEs con salvaguarda
          const toDelete = [...knownUUIDs].filter(uuid => !payloadIds.has(uuid));
          if (toDelete.length > 0) {
            const dropRatio    = toDelete.length / knownUUIDs.size;
            const shouldGuard  =
              knownUUIDs.size >= MIN_SET_SIZE_FOR_GUARD &&
              dropRatio > SAFE_DELETE_THRESHOLD;

            if (shouldGuard) {
              console.warn(
                `[MF_BRIDGE] DELETE suprimido — payload: ${payloadIds.size} cargos, ` +
                `cargados: ${knownUUIDs.size}, caída: ${(dropRatio * 100).toFixed(0)}%. ` +
                `IDs omitidos: ${toDelete.join(", ")}`,
              );
              toast.warning("Cambios guardados. Algunos cargos pendientes de reconciliar.");
            } else {
              const { error } = await supa2
                .from("manual_funciones_cargos")
                .delete()
                .in("id", toDelete);
              if (error) throw error;
            }
          }

          // Actualizar set de UUIDs conocidos para el siguiente ciclo
          loadedUUIDs.current = payloadIds;
          toast.success("Cambios guardados en la nube");
        } catch (err) {
          toast.error("Error al guardar: " + (err instanceof Error ? err.message : String(err)));
        } finally {
          setSaving(false);
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [clienteId]);

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", flexDirection: "column",
      background: "#0C4A6E",
    }}>
      {/* Franja superior */}
      <div style={{
        height: "44px", flexShrink: 0,
        background: "#0C4A6E", borderBottom: "3px solid #0EA5E9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <span style={{ color: "#38BDF8", fontWeight: 700, fontSize: "13px", letterSpacing: "0.04em" }}>
          Manual de Funciones
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {saving && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
              <Save style={{ width: "12px", height: "12px" }} /> Guardando…
            </span>
          )}
          <button
            onClick={handleBack}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              color: "white", fontSize: "13px", fontWeight: 500,
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "4px", padding: "5px 14px", cursor: "pointer",
            }}
          >
            <ArrowLeft style={{ width: "14px", height: "14px" }} /> Volver a clientes
          </button>
        </div>
      </div>

      {/* iframe */}
      <iframe
        ref={iframeRef}
        src={`/manual-funciones.html?clienteId=${clienteId}`}
        title="Manual de Funciones"
        style={{ flex: 1, border: "none", width: "100%" }}
        allow="fullscreen"
      />
    </div>,
    document.body,
  );
}
