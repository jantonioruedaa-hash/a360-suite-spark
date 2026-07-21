export type Funcion     = { descripcion: string; porcentaje_tiempo: number };
export type Competencia = { nombre: string; nivel: string };
export type KPI         = { nombre: string; meta: string; frecuencia: string };
export type Condiciones = Record<string, string>;

export type Cargo = {
  id: string;
  cargo: string;
  area: string;
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
  fecha_elaboracion: string | null;
  fecha_revision: string | null;
  plan_carrera: string | null;
  supervisa_a: string[];
  condiciones: Condiciones | null;
  relaciones_internas: string[];
  relaciones_externas: string[];
  requisitos: Record<string, string> | null;
};

export type FormDatos = Omit<Cargo, "id" | "supervisa_a" | "requisitos">;

export const FORM_BLANK: FormDatos = {
  cargo: "", area: "", jefe_inmediato: "", codigo: "", version: "1.0",
  estado: "vigente", vacante: false, objetivo: "",
  funciones: [], competencias_blandas: [], competencias_tecnicas: [], kpis: [],
  elaborado_por: "", aprobado_por: "", fecha_elaboracion: "", fecha_revision: "",
  plan_carrera: "",
  relaciones_internas: [], relaciones_externas: [],
  condiciones: {},
};

// ── Fase 2: Evaluaciones ───────────────────────────────────────────────────────
export type CompetenciaEvaluada = {
  categoria: "blanda" | "tecnica";
  nombre: string;
  nivel_requerido: string;
  puntaje: number;       // 1–5
  comentario?: string;
};

export type AccionDesarrollo = {
  area: string;
  accion: string;
  plazo: string;
  estado: "pendiente" | "en_progreso" | "completado";
};

export type Evaluacion = {
  id: string;
  cargo_id: string;
  consultor_id: string | null;
  nombre_evaluado: string | null;
  fecha_evaluacion: string | null;
  competencias_evaluadas: CompetenciaEvaluada[];
  indice_global: number | null;
  semaforo: "verde" | "amarillo" | "rojo" | null;
  plan_desarrollo: AccionDesarrollo[];
  created_at: string;
};

export type EvaluacionFormData = {
  cargo_id: string;
  nombre_evaluado: string;
  fecha_evaluacion: string;
  competencias_evaluadas: CompetenciaEvaluada[];
  plan_desarrollo: AccionDesarrollo[];
};

export const EVAL_BLANK: EvaluacionFormData = {
  cargo_id: "",
  nombre_evaluado: "",
  fecha_evaluacion: new Date().toISOString().split("T")[0],
  competencias_evaluadas: [],
  plan_desarrollo: [],
};
