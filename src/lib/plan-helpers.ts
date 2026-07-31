// Plan Estratégico — metadata, niveles y helpers
import { Briefcase, Globe2, ClipboardList, Layers, Compass, Waypoints, Target, Network, Workflow, Leaf, Handshake, Lightbulb, Megaphone, Users, Cpu, Activity, LayoutGrid, Rocket } from "lucide-react";

export type NivelPlan = "esencial" | "avanzado" | "corporativo";

export interface SeccionPlan {
  numero: number;        // 1..18
  key: string;           // "01", "10_esg", etc. para columna BD
  columna: string;       // nombre exacto columna jsonb
  titulo: string;
  corto: string;         // label tab corto
  icon: typeof Target;
  niveles: NivelPlan[];  // licencias que la incluyen
}

export const SECCIONES_PLAN: SeccionPlan[] = [
  { numero: 1,  key: "01", columna: "sec01", titulo: "Presentación ejecutiva",         corto: "Presentación",  icon: Briefcase,    niveles: ["esencial","avanzado","corporativo"] },
  { numero: 2,  key: "02", columna: "sec02", titulo: "PESTEL",                          corto: "PESTEL",        icon: Globe2,       niveles: ["esencial","avanzado","corporativo"] },
  { numero: 3,  key: "03", columna: "sec03", titulo: "Diagnóstico interno + EFI",       corto: "EFI",           icon: ClipboardList,niveles: ["esencial","avanzado","corporativo"] },
  { numero: 4,  key: "04", columna: "sec04", titulo: "FODA + CAME",                     corto: "FODA",          icon: Layers,       niveles: ["esencial","avanzado","corporativo"] },
  { numero: 5,  key: "05", columna: "sec05", titulo: "Declaración estratégica",         corto: "Declaración",   icon: Compass,      niveles: ["esencial","avanzado","corporativo"] },
  { numero: 6,  key: "06", columna: "sec06", titulo: "Ejes estratégicos",               corto: "Ejes",          icon: Waypoints,    niveles: ["esencial","avanzado","corporativo"] },
  { numero: 7,  key: "07", columna: "sec07", titulo: "Objetivos + BSC",                 corto: "Objetivos/BSC", icon: Target,       niveles: ["esencial","avanzado","corporativo"] },
  { numero: 8,  key: "08", columna: "sec08", titulo: "Estrategias corporativas",        corto: "Estrategias",   icon: Network,      niveles: ["esencial","avanzado","corporativo"] },
  { numero: 9,  key: "09", columna: "sec09", titulo: "Estructura y plan operativo",     corto: "Operativo",     icon: Workflow,     niveles: ["esencial","avanzado","corporativo"] },
  { numero: 10, key: "10_esg", columna: "sec10_esg", titulo: "Sostenibilidad y ESG",    corto: "ESG",           icon: Leaf,         niveles: ["avanzado","corporativo"] },
  { numero: 11, key: "11_alianzas", columna: "sec11_alianzas", titulo: "Alianzas estratégicas", corto: "Alianzas", icon: Handshake, niveles: ["avanzado","corporativo"] },
  { numero: 12, key: "12_innovacion", columna: "sec12_innovacion", titulo: "Innovación e I+D+i", corto: "Innovación", icon: Lightbulb, niveles: ["corporativo"] },
  { numero: 13, key: "13", columna: "sec13", titulo: "Marketing estratégico",           corto: "Marketing",     icon: Megaphone,    niveles: ["esencial","avanzado","corporativo"] },
  { numero: 14, key: "14", columna: "sec14", titulo: "Talento y cultura",               corto: "Talento",       icon: Users,        niveles: ["esencial","avanzado","corporativo"] },
  { numero: 15, key: "15", columna: "sec15", titulo: "TI y transformación digital",     corto: "TI / Digital",  icon: Cpu,          niveles: ["esencial","avanzado","corporativo"] },
  { numero: 16, key: "16", columna: "sec16", titulo: "Seguimiento y mejora continua",   corto: "Seguimiento",   icon: Activity,     niveles: ["esencial","avanzado","corporativo"] },
  { numero: 17, key: "17_cmi", columna: "sec17_cmi", titulo: "CMI — Cuadro de Mando",   corto: "CMI",           icon: LayoutGrid,   niveles: ["esencial","avanzado","corporativo"] },
  { numero: 18, key: "18_ejecucion", columna: "sec18_ejecucion", titulo: "Ejecución y portafolio", corto: "Ejecución", icon: Rocket,  niveles: ["esencial","avanzado","corporativo"] },
];

export const seccionesParaNivel = (nivel: NivelPlan) =>
  SECCIONES_PLAN.filter((s) => s.niveles.includes(nivel));

export const NIVEL_MAP: Record<string, NivelPlan> = {
  esencial:    "esencial",
  avanzado:    "avanzado",
  corporativo: "corporativo",
  profesional: "avanzado",    // parche temporal — ver backlog consolidación nomenclatura
  enterprise:  "corporativo",
  premium:     "corporativo",
};
export const normalizarNivel = (raw: string | null | undefined): NivelPlan =>
  NIVEL_MAP[raw?.toLowerCase() ?? ""] ?? "esencial";

export const seccionPorKey = (key: string) =>
  SECCIONES_PLAN.find((s) => s.key === key);

// Forma estándar de cada sección guardada en jsonb
export interface SeccionData<T = Record<string, unknown>> {
  data: T;
  analisis_ia?: string | null;
  analisis_ia_fecha?: string | null;
  completado?: boolean;
}

export const empty = <T,>(d: T): SeccionData<T> => ({ data: d, analisis_ia: null, completado: false });

// % completitud (heurística: cuántas secciones aplicables tienen .completado=true)
export const completitudPlan = (plan: Record<string, unknown> | null | undefined, nivel: NivelPlan) => {
  if (!plan) return 0;
  const apl = seccionesParaNivel(nivel);
  let done = 0;
  for (const s of apl) {
    const v = plan[s.columna] as SeccionData | null | undefined;
    if (v && (v.completado || (v.data && Object.keys(v.data).length > 4))) done++;
  }
  return Math.round((done / apl.length) * 100);
};
