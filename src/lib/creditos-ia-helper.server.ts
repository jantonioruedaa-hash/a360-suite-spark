// Helper puro (no server-fn) para usar dentro de handlers que ya tienen
// un SupabaseClient autenticado. Aplica reset lazy mensual y enforces el límite.
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlan, AI_CREDITS_BY_PLAN, type PlanKey } from "@/lib/plans";

export interface ConsumoResult {
  ok: boolean;
  plan: PlanKey;
  usados: number;
  total: number;
  bypass: boolean;
  error?: string | null;
}

function firstOfMonth(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function isNewMonth(resetFecha: string | null | undefined): boolean {
  if (!resetFecha) return true;
  const now = new Date();
  const r = new Date(resetFecha);
  return r.getUTCFullYear() !== now.getUTCFullYear() || r.getUTCMonth() !== now.getUTCMonth();
}

async function userIsBypass(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as string);
  return roles.includes("admin") || roles.includes("consultor");
}

export async function consumirCreditoIAInline(
  supabase: SupabaseClient,
  clienteId: string,
  userId: string,
): Promise<ConsumoResult> {
  const bypass = await userIsBypass(supabase, userId);

  const { data: cli, error } = await supabase
    .from("clientes")
    .select("plan_licencia, creditos_ia_usados, creditos_ia_reset_fecha, creditos_ia_extra")
    .eq("id", clienteId)
    .maybeSingle();
  if (error || !cli) {
    return { ok: false, plan: "starter", usados: 0, total: 0, bypass, error: "Cliente no encontrado" };
  }

  const plan = normalizePlan(cli.plan_licencia);
  const total = AI_CREDITS_BY_PLAN[plan];
  let usados = (cli.creditos_ia_usados as number | null) ?? 0;
  let resetFecha = (cli.creditos_ia_reset_fecha as string | null) ?? firstOfMonth(new Date());

  if (isNewMonth(resetFecha)) {
    resetFecha = firstOfMonth(new Date());
    usados = 0;
  }

  if (bypass) {
    if (isNewMonth(cli.creditos_ia_reset_fecha as string | null)) {
      await supabase.from("clientes").update({
        creditos_ia_usados: 0, creditos_ia_reset_fecha: resetFecha,
      }).eq("id", clienteId);
    }
    return { ok: true, plan, usados, total, bypass: true, error: null };
  }

  if (usados >= total) {
    return {
      ok: false, plan, usados, total, bypass: false,
      error: "Alcanzaste tu límite de análisis IA este mes. Contacta a tu consultor para ampliar tu plan.",
    };
  }

  const nuevos = usados + 1;
  const { error: upErr } = await supabase.from("clientes").update({
    creditos_ia_usados: nuevos, creditos_ia_reset_fecha: resetFecha,
  }).eq("id", clienteId);
  if (upErr) return { ok: false, plan, usados, total, bypass: false, error: upErr.message };

  return { ok: true, plan, usados: nuevos, total, bypass: false, error: null };
}
