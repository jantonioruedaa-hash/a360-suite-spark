// Contador mensual de créditos IA por cliente (Fase B1).
// Lazy reset: si el mes cambió desde creditos_ia_reset_fecha se resetea a 0.
// Admin y consultor no consumen créditos (no tienen límite).
import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { normalizePlan, AI_CREDITS_BY_PLAN, type PlanKey } from "@/lib/plans";

export interface CreditosResult {
  ok: boolean;
  plan: PlanKey;
  usados: number;
  total: number;
  resetFecha: string;
  bypass: boolean;
  error?: string | null;
}

function getClient(accessToken?: string): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !accessToken) return null;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getRole(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as string);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("consultor")) return "consultor";
  return roles[0] ?? null;
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

const inputSchema = z.object({
  clienteId: z.string().uuid(),
  accessToken: z.string().min(10).optional(),
});

// Lectura de uso actual (no incrementa). Aplica reset lazy si corresponde.
export const getCreditosIA = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<CreditosResult> => {
    const supabase = getClient(data.accessToken);
    const base: CreditosResult = {
      ok: true, plan: "starter", usados: 0, total: AI_CREDITS_BY_PLAN.starter,
      resetFecha: firstOfMonth(new Date()), bypass: false, error: null,
    };
    if (!supabase) return { ...base, ok: false, error: "Sesión inválida" };
    const { data: claims } = await supabase.auth.getClaims(data.accessToken);
    const uid = claims?.claims?.sub as string | undefined;
    if (!uid) return { ...base, ok: false, error: "Sesión inválida" };

    const role = await getRole(supabase, uid);
    const bypass = role === "admin" || role === "consultor";

    const { data: cli, error } = await supabase
      .from("clientes")
      .select("plan_licencia, creditos_ia_usados, creditos_ia_reset_fecha, creditos_ia_extra")
      .eq("id", data.clienteId)
      .maybeSingle();
    if (error || !cli) return { ...base, ok: false, error: "Cliente no encontrado" };

    const plan = normalizePlan(cli.plan_licencia);
    const extra = cli.creditos_ia_extra ?? 0;
    const total = AI_CREDITS_BY_PLAN[plan] + extra;
    let usados = cli.creditos_ia_usados ?? 0;
    let resetFecha = (cli.creditos_ia_reset_fecha as string | null) ?? firstOfMonth(new Date());

    if (isNewMonth(resetFecha)) {
      resetFecha = firstOfMonth(new Date());
      usados = 0;
      await supabase.from("clientes").update({
        creditos_ia_usados: 0, creditos_ia_reset_fecha: resetFecha,
      }).eq("id", data.clienteId);
    }
    return { ok: true, plan, usados, total, resetFecha, bypass, error: null };
  });

// Intenta consumir 1 crédito. Devuelve ok:false con error si se alcanzó el límite.
export const consumirCreditoIA = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<CreditosResult> => {
    const supabase = getClient(data.accessToken);
    const base: CreditosResult = {
      ok: true, plan: "starter", usados: 0, total: AI_CREDITS_BY_PLAN.starter,
      resetFecha: firstOfMonth(new Date()), bypass: false, error: null,
    };
    if (!supabase) return { ...base, ok: false, error: "Sesión inválida" };
    const { data: claims } = await supabase.auth.getClaims(data.accessToken);
    const uid = claims?.claims?.sub as string | undefined;
    if (!uid) return { ...base, ok: false, error: "Sesión inválida" };

    const role = await getRole(supabase, uid);
    const bypass = role === "admin" || role === "consultor";

    const { data: cli, error } = await supabase
      .from("clientes")
      .select("plan_licencia, creditos_ia_usados, creditos_ia_reset_fecha")
      .eq("id", data.clienteId)
      .maybeSingle();
    if (error || !cli) return { ...base, ok: false, error: "Cliente no encontrado" };

    const plan = normalizePlan(cli.plan_licencia);
    const total = AI_CREDITS_BY_PLAN[plan];
    let usados = cli.creditos_ia_usados ?? 0;
    let resetFecha = (cli.creditos_ia_reset_fecha as string | null) ?? firstOfMonth(new Date());

    if (isNewMonth(resetFecha)) {
      resetFecha = firstOfMonth(new Date());
      usados = 0;
    }

    if (bypass) {
      // No consume; solo aplica reset si corresponde.
      if (isNewMonth(cli.creditos_ia_reset_fecha as string | null)) {
        await supabase.from("clientes").update({
          creditos_ia_usados: 0, creditos_ia_reset_fecha: resetFecha,
        }).eq("id", data.clienteId);
      }
      return { ok: true, plan, usados, total, resetFecha, bypass: true, error: null };
    }

    if (usados >= total) {
      return {
        ok: false, plan, usados, total, resetFecha, bypass: false,
        error: "Alcanzaste tu límite de análisis IA este mes. Contacta a tu consultor para ampliar tu plan.",
      };
    }

    const nuevos = usados + 1;
    const { error: upErr } = await supabase.from("clientes").update({
      creditos_ia_usados: nuevos, creditos_ia_reset_fecha: resetFecha,
    }).eq("id", data.clienteId);
    if (upErr) return { ok: false, plan, usados, total, resetFecha, bypass: false, error: upErr.message };

    return { ok: true, plan, usados: nuevos, total, resetFecha, bypass: false, error: null };
  });
