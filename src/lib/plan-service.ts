import { supabase } from "@/integrations/supabase/client";
import type { ClienteCtx, PlanRow } from "@/types/plan";

// Loads the client context and its strategic plan in parallel.
// Returns nulls when either record does not exist yet.
export async function cargarPlan(
  clienteId: string,
): Promise<{ cliente: ClienteCtx | null; plan: PlanRow | null }> {
  const [{ data: c }, { data: p }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id,nombre_empresa,sector,num_empleados,plan_licencia,pais,ciudad")
      .eq("id", clienteId)
      .maybeSingle(),
    supabase
      .from("planes_estrategicos")
      .select("*")
      .eq("cliente_id", clienteId)
      .maybeSingle(),
  ]);
  return {
    cliente: c as ClienteCtx | null,
    plan:    p as PlanRow    | null,
  };
}
