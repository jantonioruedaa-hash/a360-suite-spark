export type Funcion     = { descripcion: string; porcentaje_tiempo: number };
export type Competencia = { nombre: string; nivel: string };
export type KPI         = { nombre: string; meta: string; frecuencia: string };
export type Condiciones = Record<string, string>;

// ── Niveles de competencia ─────────────────────────────────────────────────────
export const NIVELES = ["Básico", "Intermedio", "Avanzado", "Experto"] as const;
export type NivelStr = typeof NIVELES[number];

export const NIVEL_SCORE: Record<NivelStr, number> = {
  "Básico":     25,
  "Intermedio": 50,
  "Avanzado":   75,
  "Experto":    100,
};

export const NIVEL_NUM: Record<NivelStr, number> = {
  "Básico":     1,
  "Intermedio": 2,
  "Avanzado":   3,
  "Experto":    4,
};

// ── Evaluación de Competencias / PDI ──────────────────────────────────────────

export type ReqRow = {
  dim: string;
  req: string;
  act: string;
  cum: string;
};

export type CompEval = {
  nombre: string;
  tipo: "blanda" | "tecnica";
  nivel_requerido: string;
  nivel_actual: string;
  observacion: string;
};

export type PlanDevRow = {
  prioridad: string;
  brecha: string;
  modalidad: string;
  detalle: string;
  proveedor: string;
  responsable: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  avance_pct: number;
  evidencia: string;
};

export type FirmasEval = {
  n0: string; c0: string; f0: string;
  n1: string; c1: string; f1: string;
  n2: string; c2: string; f2: string;
};

export type EvalCompForm = {
  nombre_evaluado: string;
  evaluador: string;
  fecha_evaluacion: string;
  proxima_revision: string;
  observacion_general: string;
  requisitos_evaluados: ReqRow[];
  competencias_evaluadas: CompEval[];
  plan_desarrollo: PlanDevRow[];
  firmas: FirmasEval;
  cargo_data_hash?: string;
};

export const EVAL_COMP_BLANK: EvalCompForm = {
  nombre_evaluado: "", evaluador: "",
  fecha_evaluacion: new Date().toISOString().slice(0, 10),
  proxima_revision: "",
  observacion_general: "",
  requisitos_evaluados: [],
  competencias_evaluadas: [],
  plan_desarrollo: [],
  firmas: { n0: "", c0: "", f0: "", n1: "", c1: "", f1: "", n2: "", c2: "", f2: "" },
};

// ── Evaluación de Desempeño ───────────────────────────────────────────────────

export const CONDUCTUALES_FIJAS = [
  "Trabajo en equipo",
  "Comunicación efectiva",
  "Orientación al resultado",
  "Adaptabilidad al cambio",
  "Responsabilidad y compromiso",
  "Iniciativa y proactividad",
  "Integridad y ética",
  "Orientación al cliente",
  "Gestión del tiempo",
  "Liderazgo",
] as const;

export type KpiScore = {
  nombre: string;
  resultado: string;
  calificacion: number; // 1-5
  observacion: string;
};

export type CompScore = {
  nombre: string;
  calificacion: number; // 1-5
  observacion: string;
};

export type ObjetivoRow = {
  objetivo: string;
  peso: number;
  resultado: string;
  calificacion: number; // 1-5
  observacion: string;
};

export type PlanMejoraRow = {
  area: string;
  accion: string;
  recurso: string;
  plazo: string;
  responsable: string;
};

export type EvalDesempForm = {
  nombre_evaluado: string;
  evaluador: string;
  fecha_evaluacion: string;
  periodo: string;
  kpi_scores: KpiScore[];
  comp_scores: CompScore[];
  cond_scores: CompScore[];
  objetivos: ObjetivoRow[];
  observacion_evaluado: string;
  observacion_evaluador: string;
  observacion_rrhh: string;
  plan_mejora: PlanMejoraRow[];
  firma_rrhh: string;
  fecha_firma: string;
};

export const EVAL_DESEMP_BLANK: EvalDesempForm = {
  nombre_evaluado: "", evaluador: "",
  fecha_evaluacion: new Date().toISOString().slice(0, 10),
  periodo: "",
  kpi_scores: [],
  comp_scores: [],
  cond_scores: [],
  objetivos: [],
  observacion_evaluado: "", observacion_evaluador: "", observacion_rrhh: "",
  plan_mejora: [],
  firma_rrhh: "", fecha_firma: "",
};

// ── Cargo ─────────────────────────────────────────────────────────────────────

export type Cargo = {
  id: string;
  cliente_id: string;
  consultor_id: string | null;
  cargo: string;
  area: string;
  area_id: string | null;
  jefe_inmediato: string | null;
  codigo: string | null;
  version: string | null;
  estado: string | null;
  vacante: boolean | null;
  objetivo: string | null;
  funciones: Funcion[];
  competencias_blandas: Competencia[];
  competencias_tecnicas: Competencia[];
  kpis: KPI[];
  elaborado_por: string | null;
  aprobado_por: string | null;
  revisado_por: string | null;
  fecha_elaboracion: string | null;
  fecha_revision: string | null;
  plan_carrera: string | null;
  supervisa_a: string[];
  condiciones: Condiciones | null;
  relaciones_internas: string[];
  relaciones_externas: string[];
  requisitos: Record<string, string> | null;
  resultados_esperados: unknown[];
};

export type FormDatos = Omit<Cargo, "id" | "supervisa_a" | "requisitos">;

export const FORM_BLANK: FormDatos = {
  cliente_id: "", consultor_id: null,
  cargo: "", area: "", area_id: null, jefe_inmediato: "", codigo: "", version: "1.0",
  estado: "vigente", vacante: false, objetivo: "",
  funciones: [], competencias_blandas: [], competencias_tecnicas: [], kpis: [],
  elaborado_por: "", aprobado_por: "", revisado_por: null, fecha_elaboracion: "", fecha_revision: "",
  plan_carrera: "",
  relaciones_internas: [], relaciones_externas: [],
  condiciones: {}, resultados_esperados: [],
};
