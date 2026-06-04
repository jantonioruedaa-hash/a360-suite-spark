import sccdRaw from "./sccd-modules.json";

export interface SccdKpi {
  name: string;
  definition: string;
  formula: string;
  target: string;
  good: number;
  warn: number;
}

export interface SccdField {
  key: string;
  label: string;
  question: string;
  commercial: string;
  service: string;
}

export interface SccdModule {
  id: string;
  title: string;
  problem: string;
  opportunity: string;
  analysis: string;
  decision: string;
  actions: string[];
  deliverable: string;
  fields: SccdField[];
  kpis: SccdKpi[];
  promptTask: string;
}

type SccdRaw = {
  modules: SccdModule[];
  companyTypes: string[];
  segments: string[];
};

const raw = sccdRaw as SccdRaw;

export const sccdModules: SccdModule[] = raw.modules;
export const sccdCompanyTypes: string[] = raw.companyTypes;
export const sccdSegments: string[] = raw.segments;

export function getSccdModule(id: string): SccdModule | undefined {
  return sccdModules.find((m) => m.id === id);
}

export const sccdStats = {
  totalModulos: sccdModules.length,
  totalKpis: sccdModules.reduce((s, m) => s + m.kpis.length, 0),
  totalAcciones: sccdModules.reduce((s, m) => s + m.actions.length, 0),
  totalCampos: sccdModules.reduce((s, m) => s + m.fields.length, 0),
};
