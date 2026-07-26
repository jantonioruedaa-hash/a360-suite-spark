import { supabase } from "@/integrations/supabase/client";

// lee_workbook_html: tabla separada para workbooks HTML del participante LEE.
// Un registro por (programa_id, capitulo_numero).
// Nota: regenerar tipos Supabase (supabase gen types) para eliminar los casts.

export interface LeeWorkbookHtml {
  id: string;
  programa_id: string;
  capitulo_numero: number;
  respuestas: Record<string, unknown>;
  completado: boolean;
  created_at: string;
  updated_at: string;
}

export async function cargarWorkbookHtml(
  programaId: string,
  capituloNumero: number,
): Promise<LeeWorkbookHtml | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("lee_workbook_html")
    .select("*")
    .eq("programa_id", programaId)
    .eq("capitulo_numero", capituloNumero)
    .maybeSingle();
  if (error) throw error;
  return data as LeeWorkbookHtml | null;
}

export async function guardarWorkbookHtml(
  programaId: string,
  capituloNumero: number,
  respuestas: Record<string, unknown>,
  completado = false,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("lee_workbook_html")
    .upsert(
      { programa_id: programaId, capitulo_numero: capituloNumero, respuestas, completado },
      { onConflict: "programa_id,capitulo_numero" },
    );
  if (error) throw error;
}

export async function listarWorkbooksHtmlPrograma(
  programaId: string,
): Promise<LeeWorkbookHtml[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("lee_workbook_html")
    .select("*")
    .eq("programa_id", programaId)
    .order("capitulo_numero");
  if (error) throw error;
  return (data ?? []) as LeeWorkbookHtml[];
}
