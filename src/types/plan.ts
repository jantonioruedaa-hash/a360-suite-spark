import type { BaseRecord } from "./shared";
import type { NivelPlan } from "@/lib/plan-helpers";

// ── ClienteCtx ────────────────────────────────────────────────────────────────
// Client-level context loaded alongside the plan.
// Not a ModuleRecord — it belongs to the clientes table, not to the plan module.
export interface ClienteCtx {
  id: string;
  nombre_empresa: string;
  sector: string | null;
  num_empleados: number | null;
  plan_licencia: string;
  pais: string | null;
  ciudad: string | null;
}

// ── PlanRow ───────────────────────────────────────────────────────────────────
// DB record from planes_estrategicos. Extends BaseRecord for the standard
// id / cliente_id / consultor_id / created_at fields.
// The index signature covers the 18 JSONB section columns (sec01 … sec18_ejecucion).
// All named property types are assignable to `unknown`, so the index signature
// is satisfied without conflict.
export interface PlanRow extends BaseRecord {
  nivel: NivelPlan;
  [key: string]: unknown;
}
