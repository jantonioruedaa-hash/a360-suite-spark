import { supabase } from "@/integrations/supabase/client";
import { HERRAMIENTAS_A360, ETAPAS_A360, type EtapaA360 } from "./coaching-catalogo";

export interface SesionCoaching {
  id: string;
  cliente_id: string;
  consultor_id: string | null;
  herramienta_id: string | null;
  etapa: string | null;
  datos: Record<string, unknown>;
  completada: boolean;
  created_at: string;
}

export async function listarSesionesCliente(clienteId: string): Promise<SesionCoaching[]> {
  const { data, error } = await supabase
    .from("coaching_sesiones")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SesionCoaching[];
}

export async function listarSesionesGlobal(): Promise<SesionCoaching[]> {
  const { data, error } = await supabase
    .from("coaching_sesiones")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as SesionCoaching[];
}

export async function crearSesion(input: {
  cliente_id: string;
  herramienta_id: string;
  etapa: string;
  datos: Record<string, unknown>;
  completada?: boolean;
}) {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("coaching_sesiones")
    .insert({
      cliente_id: input.cliente_id,
      consultor_id: u.user?.id ?? null,
      herramienta_id: input.herramienta_id,
      etapa: input.etapa,
      datos: input.datos,
      completada: input.completada ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SesionCoaching;
}

export async function actualizarSesion(id: string, patch: Partial<Pick<SesionCoaching, "datos" | "completada" | "etapa">>) {
  const { data, error } = await supabase
    .from("coaching_sesiones")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as SesionCoaching;
}

export async function eliminarSesion(id: string) {
  const { error } = await supabase.from("coaching_sesiones").delete().eq("id", id);
  if (error) throw error;
}

// Cálculo de progreso por etapa: % herramientas completadas
export function progresoPorEtapa(sesiones: SesionCoaching[]) {
  return ETAPAS_A360.map((et) => {
    const herrs = HERRAMIENTAS_A360.filter((h) => h.etapa === et.id);
    const completadasIds = new Set(
      sesiones.filter((s) => s.completada && s.etapa === et.id).map((s) => s.herramienta_id),
    );
    const completadas = herrs.filter((h) => completadasIds.has(h.id)).length;
    return {
      etapa: et,
      total: herrs.length,
      completadas,
      pct: herrs.length === 0 ? 0 : Math.round((completadas / herrs.length) * 100),
    };
  });
}

// Etapa actual = primera etapa no 100% completada
export function etapaActual(sesiones: SesionCoaching[]): EtapaA360 {
  const prog = progresoPorEtapa(sesiones);
  const next = prog.find((p) => p.pct < 100);
  return (next?.etapa.id ?? "Transformación") as EtapaA360;
}
