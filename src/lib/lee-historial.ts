import { supabase } from "@/integrations/supabase/client";

// lee_historial_versiones: snapshots append-only del workbook HTML por capítulo/sesión.
// Nota: regenerar tipos Supabase (supabase gen types) para eliminar los casts.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const TABLE = "lee_historial_versiones";
const AUTO_LIMIT = 5;

export interface VersionRow {
  id: string;
  sesion_id: string | null;
  origen: "auto_nav" | "auto_exit" | "manual";
  etiqueta: string | null;
  created_at: string;
}

// INSERT + poda automática para versiones auto; solo INSERT para manuales.
export async function guardarVersionLee(
  programaId: string,
  capituloNumero: number,
  sesionId: string | null,
  snapshot: Record<string, unknown>,
  origen: "auto_nav" | "auto_exit" | "manual",
  etiqueta?: string,
): Promise<string> {
  const { data, error } = await db.from(TABLE).insert({
    programa_id: programaId,
    capitulo_numero: capituloNumero,
    sesion_id: sesionId,
    snapshot,
    origen,
    etiqueta: etiqueta ?? null,
  }).select("id").single();
  if (error) throw error;
  const newId = (data as { id: string }).id;

  if (origen !== "manual") {
    const { data: surplus } = await db
      .from(TABLE)
      .select("id")
      .eq("programa_id", programaId)
      .eq("capitulo_numero", capituloNumero)
      .eq("sesion_id", sesionId)
      .in("origen", ["auto_nav", "auto_exit"])
      .order("created_at", { ascending: false })
      .range(AUTO_LIMIT, 9999);

    if (surplus?.length > 0) {
      await db
        .from(TABLE)
        .delete()
        .in("id", surplus.map((r: { id: string }) => r.id));
    }
  }

  return newId;
}

// Listar versiones de un capítulo sin snapshot (solo metadatos para la UI).
export async function listarVersionesLee(
  programaId: string,
  capituloNumero: number,
): Promise<VersionRow[]> {
  const { data, error } = await db
    .from(TABLE)
    .select("id, sesion_id, origen, etiqueta, created_at")
    .eq("programa_id", programaId)
    .eq("capitulo_numero", capituloNumero)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VersionRow[];
}

// Cargar snapshot completo de una versión (solo al restaurar).
export async function cargarSnapshotLee(
  id: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await db
    .from(TABLE)
    .select("snapshot")
    .eq("id", id)
    .single();
  if (error) throw error;
  return (data as { snapshot: Record<string, unknown> }).snapshot;
}

// Conjunto de sesion_id con al menos 1 versión (para indicador de progreso).
export async function sesionesConVersionLee(
  programaId: string,
  capituloNumero: number,
): Promise<Set<string>> {
  const { data } = await db
    .from(TABLE)
    .select("sesion_id")
    .eq("programa_id", programaId)
    .eq("capitulo_numero", capituloNumero)
    .not("sesion_id", "is", null);
  const ids = (data ?? []).map((r: { sesion_id: string }) => r.sesion_id);
  return new Set(ids);
}

// Eliminar una versión manual (acción explícita del usuario desde la UI).
export async function eliminarVersionLee(id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
