import { DIMENSIONES, promedio, interpretarIME } from "@/lib/side-data";
import type { ScoreMap } from "@/lib/side-data";

export function contarBrechasCriticas(scores: ScoreMap): number {
  return DIMENSIONES.filter((dim) =>
    interpretarIME(promedio(dim.preguntas.map((p) => p.id), scores)).estado === "critico"
  ).length;
}

export function sugerirPlanYNivel(params: {
  numEmpleados: number | null;
  esGrupoEmpresarial: boolean;
  imeGeneral: number;
  brechasCriticas: number;
}): {
  plan: "esencial" | "profesional" | "corporativo" | "premium";
  nivel: "autogestionado" | "guiado" | "acompanado" | "advisory";
} {
  const { numEmpleados, esGrupoEmpresarial, imeGeneral, brechasCriticas } = params;
  const emp = numEmpleados ?? 0;

  let plan: "esencial" | "profesional" | "corporativo" | "premium";
  if (esGrupoEmpresarial) {
    plan = "premium";
  } else if (emp >= 100 && brechasCriticas >= 5) {
    plan = "premium";
  } else if (emp >= 100) {
    plan = "corporativo";
  } else if (emp >= 21 && brechasCriticas >= 5) {
    plan = "corporativo";
  } else if (emp >= 21) {
    plan = "profesional";
  } else if (brechasCriticas >= 4) {
    plan = "profesional";
  } else {
    plan = "esencial";
  }

  let nivel: "autogestionado" | "guiado" | "acompanado" | "advisory";
  if (imeGeneral < 1.75 || brechasCriticas >= 7) {
    nivel = "advisory";
  } else if (imeGeneral < 2.75 || brechasCriticas >= 5) {
    nivel = "acompanado";
  } else if (imeGeneral < 3.75 || brechasCriticas >= 3) {
    nivel = "guiado";
  } else {
    nivel = "autogestionado";
  }

  return { plan, nivel };
}
