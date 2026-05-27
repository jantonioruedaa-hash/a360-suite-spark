// Catálogo de planes y módulos (Fase A)
// El nombre en BD (plan_licencia) se mantiene como está; aquí solo mapeamos a etiquetas/módulos.

export type PlanKey = "starter" | "business" | "enterprise" | "full";

export type ModuloKey =
  | "side"
  | "plan"
  | "kpis"
  | "coaching"
  | "lee"
  | "procesos"
  | "sgc"
  | "talenthr"
  | "manual_funciones"
  | "crm"
  | "marketing"
  | "finanzas"
  | "wms";

export const PLAN_LABELS: Record<PlanKey, string> = {
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
  full: "Full Suite",
};

export const AI_CREDITS_BY_PLAN: Record<PlanKey, number> = {
  starter: 10,
  business: 30,
  enterprise: 75,
  full: 200,
};

// null = ilimitado (mostrar "∞")
export const USER_LIMITS_BY_PLAN: Record<PlanKey, number | null> = {
  starter: 3,
  business: 10,
  enterprise: 25,
  full: null,
};

export const PARTICIPANT_LIMITS_BY_PLAN: Record<PlanKey, number | null> = {
  starter: 5,
  business: 20,
  enterprise: 50,
  full: null,
};

// Mapeo de los nombres existentes en BD → PlanKey.
// Cualquier valor desconocido cae a "starter".
export function normalizePlan(plan_licencia?: string | null): PlanKey {
  switch ((plan_licencia ?? "").toLowerCase()) {
    case "esencial":
    case "starter":
      return "starter";
    case "profesional":
    case "business":
      return "business";
    case "enterprise":
      return "enterprise";
    case "full":
    case "full_suite":
    case "fullsuite":
      return "full";
    default:
      return "starter";
  }
}

const STARTER: ModuloKey[] = ["side", "plan", "kpis"];
const BUSINESS: ModuloKey[] = [...STARTER, "coaching", "lee"];
const ENTERPRISE: ModuloKey[] = [
  ...BUSINESS,
  "procesos",
  "sgc",
  "talenthr",
  "manual_funciones",
  "crm",
];
const FULL: ModuloKey[] = [
  ...ENTERPRISE,
  "marketing",
  "finanzas",
  "wms",
];

export const PLAN_MODULES: Record<PlanKey, ModuloKey[]> = {
  starter: STARTER,
  business: BUSINESS,
  enterprise: ENTERPRISE,
  full: FULL,
};

export function planAllowsModule(plan: PlanKey, modulo: ModuloKey): boolean {
  return PLAN_MODULES[plan].includes(modulo);
}

export function planAllowsModuleFromDb(plan_licencia: string | null | undefined, modulo: ModuloKey) {
  return planAllowsModule(normalizePlan(plan_licencia), modulo);
}
