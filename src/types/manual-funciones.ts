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
