export const TIPOS_EMPRESA = [
  "Unipersonal", "Startup", "PyME familiar", "PyME no familiar", "Empresa mediana",
] as const;

export const MERCADOS_OBJETIVO = ["B2B", "B2C", "Mixto", "Gobierno"] as const;
export const COBERTURAS = ["Local", "Regional", "Nacional", "Internacional"] as const;

export const ESTILOS_LIDERAZGO = [
  "Directivo", "Participativo", "Delegador", "Visionario", "Coaching",
] as const;

export const ROLES_LIDER = ["Operativo", "Comercial", "Estratégico", "Financiero", "Mixto"] as const;
export const DISPONIBILIDAD = ["Alta", "Media", "Limitada"] as const;
export const EXPERIENCIA_CONSULTORES = [
  "Primera vez", "Experiencia positiva", "Experiencia negativa", "Varias veces",
] as const;
export const ACTITUD_CAMBIO = [
  "Muy abierto", "Abierto con reservas", "Cauteloso", "Resistente",
] as const;

export const DIMENSIONES_SIDE_12 = [
  { key: "L", nombre: "Liderazgo" },
  { key: "E", nombre: "Estrategia" },
  { key: "G", nombre: "Gobernanza" },
  { key: "O", nombre: "Organización" },
  { key: "GE", nombre: "Gestión" },
  { key: "F", nombre: "Finanzas" },
  { key: "C", nombre: "Comercial" },
  { key: "M", nombre: "Marketing" },
  { key: "OP", nombre: "Operaciones" },
  { key: "CU", nombre: "Cultura" },
  { key: "T", nombre: "Talento" },
  { key: "ES", nombre: "Escalabilidad" },
] as const;

export const PROGRAMAS_RECOMENDADOS = [
  "Coaching Ejecutivo",
  "SIDE + Plan Esencial",
  "SIDE + Plan Profesional",
  "SIDE + Plan Corporativo",
] as const;

export const FRECUENCIAS = ["Semanal", "Quincenal", "Mensual"] as const;
export const MODALIDADES = ["Presencial", "Virtual", "Mixta"] as const;

export const ORG_OPCIONES = ["Sí formal", "Sí informal", "No existe"] as const;
export const PROC_OPCIONES = ["La mayoría", "Algunos", "Muy pocos", "Ninguno"] as const;
export const HERR_OPCIONES = ["Sí varias", "Sí pocas", "Muy pocas", "No"] as const;

export interface OnboardingPaso1 {
  anio_fundacion?: string;
  tipo_empresa?: string;
  mercado_objetivo?: string;
  cobertura?: string;
  num_empleados?: string;
  facturacion_anual?: string;
  historia?: string;
  productos?: string;
  propuesta_valor?: string;
  organigrama?: string;
  procesos?: string;
  herramientas_digitales?: string;
}

/* Expectativas pre-cargadas (App7) — separadas de las prioridades SIDE */
export const EXPECTATIVAS_PROGRAMA = [
  { id: "estrategia", label: "Claridad estratégica y visión de futuro" },
  { id: "ventas", label: "Crecimiento en ventas e ingresos" },
  { id: "procesos", label: "Mejora de procesos y eficiencia operativa" },
  { id: "finanzas", label: "Rentabilidad y control financiero" },
  { id: "equipo", label: "Desarrollo del equipo y talento humano" },
  { id: "digital", label: "Transformación digital y herramientas tecnológicas" },
  { id: "escalar", label: "Escalabilidad y reducción de dependencia del dueño" },
] as const;

/* Compromisos y condiciones estándar A360SP (App7) */
export const COMPROMISOS_CLIENTE_DEFAULT = [
  "Asistir puntualmente a todas las sesiones programadas",
  "Dedicar el tiempo necesario entre sesiones para implementar los acuerdos",
  "Compartir información real y transparente sobre la empresa",
  "Involucrar al equipo clave en las sesiones que lo requieran",
  "Respetar la confidencialidad de las metodologías y herramientas",
  "Realizar el pago acordado según las condiciones pactadas",
];
export const COMPROMISOS_CONSULTOR_DEFAULT = [
  "Preparar cada sesión con información y herramientas actualizadas",
  "Entregar el reporte de sesión dentro de las 24 horas siguientes",
  "Mantener total confidencialidad de la información del cliente",
  "Estar disponible para consultas puntuales entre sesiones",
  "Adaptar la metodología a las necesidades específicas del cliente",
];
export const CONDICIONES_DEFAULT = [
  "Las sesiones canceladas con menos de 24 horas se cobrarán como realizadas",
  "El incumplimiento reiterado de compromisos puede ser causal de terminación del programa",
  "Los materiales y herramientas entregados son de uso exclusivo del cliente",
  "Este acuerdo tiene carácter de documento de buena fe entre las partes",
];

export interface OnboardingPaso2 {
  nombre?: string; cargo?: string; email?: string;
  edad?: string; telefono?: string; formacion?: string; experiencia?: string;
  estilo?: string; rol?: string;
  fortaleza?: string; area_desarrollo?: string; vision_5_anios?: string;
  motivacion?: string; temor?: string; disponibilidad?: string;
  experiencia_consultores?: string; actitud_cambio?: string; notas?: string;
}

export interface OnboardingPaso3 {
  situacion_actual?: string;
  fortalezas: string[];
  debilidades: string[];
  oportunidades: string[];
  amenazas: string[];
  dimensiones_urgentes: string[];
  contexto_sector?: string;
  competencia?: string;
}

export interface OnboardingPaso4 {
  objetivos: string[];
  prioridades: Record<string, number>; // dim key -> 1-5 (SIDE)
  expectativas: Record<string, number>; // EXPECTATIVAS_PROGRAMA id -> 1-5
  resultado_3m?: string;
  resultado_final?: string;
  indicador_exito?: string;
  programa_recomendado?: string;
  justificacion?: string;
}

export interface OnboardingPaso5 {
  fecha_inicio?: string;
  fecha_cierre?: string;
  frecuencia?: string;
  modalidad?: string;
  consultor_responsable?: string;
  inversion?: string;
  forma_pago?: string;
  compromisos_cliente: string[];
  compromisos_consultor: string[];
  condiciones_aceptadas?: string[]; // condiciones DEFAULT marcadas
  condiciones?: string;
  notas?: string;
}

export interface OnboardingPaso5 {
  fecha_inicio?: string;
  fecha_cierre?: string;
  frecuencia?: string;
  modalidad?: string;
  consultor_responsable?: string;
  inversion?: string;
  forma_pago?: string;
  compromisos_cliente: string[];
  compromisos_consultor: string[];
  condiciones?: string;
  notas?: string;
}

export const PASOS_ONBOARDING = [
  { num: 1, label: "Perfil empresa" },
  { num: 2, label: "Perfil líder" },
  { num: 3, label: "Contexto estratégico" },
  { num: 4, label: "Expectativas" },
  { num: 5, label: "Acuerdo" },
  { num: 6, label: "Documento" },
] as const;
