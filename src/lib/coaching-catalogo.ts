// Catálogo Coaching A360 — basado en metodología propia (4 etapas, 12 herramientas)

export type EtapaA360 = "Diagnóstico" | "Activación" | "Sostenimiento" | "Transformación";

export const ETAPAS_A360: { id: EtapaA360; orden: number; color: string; descripcion: string }[] = [
  { id: "Diagnóstico",    orden: 1, color: "#7F77DD", descripcion: "Línea base del líder y su contexto" },
  { id: "Activación",     orden: 2, color: "#1D9E75", descripcion: "Compromisos accionables y simulaciones" },
  { id: "Sostenimiento",  orden: 3, color: "#BA7517", descripcion: "Pulso semanal, retos y preguntas poderosas" },
  { id: "Transformación", orden: 4, color: "#D85A30", descripcion: "Delta de transformación y plan de continuidad" },
];

export interface HerramientaA360 {
  id: string;
  nombre: string;
  etapa: EtapaA360;
  descripcion: string;
  duracion: string;
  tipo: "radar" | "manifiesto" | "perfil" | "creencias" | "espejo" | "simulador" | "pulso" | "reto" | "biblioteca" | "plan" | "reporte";
}

export const HERRAMIENTAS_A360: HerramientaA360[] = [
  { id: "radar-lider",       nombre: "Radar del líder",         etapa: "Diagnóstico",    descripcion: "Evaluación conductual de 6 dimensiones — línea base", duracion: "10 min", tipo: "radar" },
  { id: "mapa-creencias",    nombre: "Mapa de creencias",       etapa: "Diagnóstico",    descripcion: "Identifica las 3 creencias limitantes más activas",   duracion: "15 min", tipo: "creencias" },
  { id: "perfil-contexto",   nombre: "Perfil de contexto",      etapa: "Diagnóstico",    descripcion: "Captura el contexto empresarial y personal",          duracion: "8 min",  tipo: "perfil" },
  { id: "manifiesto",        nombre: "Manifiesto",              etapa: "Activación",     descripcion: "5 dimensiones de liderazgo con compromiso accionable",duracion: "30 min", tipo: "manifiesto" },
  { id: "simulador",         nombre: "Simulador de decisiones", etapa: "Activación",     descripcion: "Dilemas reales calibrados al perfil del líder",       duracion: "20 min", tipo: "simulador" },
  { id: "espejo",            nombre: "Espejo de liderazgo",     etapa: "Activación",     descripcion: "Cierre: insight, compromiso y resistencia",           duracion: "15 min", tipo: "espejo" },
  { id: "pulso-semanal",     nombre: "Pulso semanal",           etapa: "Sostenimiento",  descripcion: "Check-in de 3 min para detectar momentum y bloqueos", duracion: "3 min",  tipo: "pulso" },
  { id: "reto-7-dias",       nombre: "Reto de 7 días",          etapa: "Sostenimiento",  descripcion: "Un reto de liderazgo por día durante 7 días",         duracion: "15 min/día", tipo: "reto" },
  { id: "biblioteca",        nombre: "Biblioteca de preguntas", etapa: "Sostenimiento",  descripcion: "70+ preguntas poderosas por dimensión",               duracion: "Libre",  tipo: "biblioteca" },
  { id: "radar-cierre",      nombre: "Radar de cierre",         etapa: "Transformación", descripcion: "Mide el delta de transformación real",                duracion: "10 min", tipo: "radar" },
  { id: "plan-continuidad",  nombre: "Plan de continuidad",     etapa: "Transformación", descripcion: "Plan de 90 días post-programa con hitos verificables",duracion: "20 min", tipo: "plan" },
  { id: "reporte-final",     nombre: "Reporte de transformación", etapa: "Transformación", descripcion: "Reporte ejecutivo con todos los datos del programa",duracion: "Auto",   tipo: "reporte" },
];

// Las 6 dimensiones del Radar del Líder
export const RADAR_DIMENSIONES = [
  { id: "vision",       nombre: "Visión estratégica",  descripcion: "Capacidad de proyectar a largo plazo" },
  { id: "decision",     nombre: "Toma de decisión",    descripcion: "Decisiones bajo incertidumbre" },
  { id: "influencia",   nombre: "Influencia",          descripcion: "Capacidad de movilizar a otros" },
  { id: "ejecucion",    nombre: "Ejecución",           descripcion: "Disciplina para entregar resultados" },
  { id: "resiliencia",  nombre: "Resiliencia",         descripcion: "Manejo de presión y adversidad" },
  { id: "consciencia",  nombre: "Auto-consciencia",    descripcion: "Conocimiento de fortalezas y sombras" },
];

// 4 fases del Plan de Continuidad post-programa (90 días)
export const PLAN_CONTINUIDAD_FASES = [
  { id: "s1", label: "Semanas 1-2", titulo: "Consolidación inmediata", desc: "Aplica los 3 aprendizajes más importantes en decisiones reales esta semana." },
  { id: "s2", label: "Semanas 3-4", titulo: "Instalación de hábitos",  desc: "Convierte los compromisos en rutinas semanales de liderazgo." },
  { id: "s3", label: "Mes 2",       titulo: "Expansión al equipo",     desc: "Comparte con tu equipo al menos un aprendizaje y cómo cambiará tu liderazgo." },
  { id: "s4", label: "Mes 3",       titulo: "Evaluación y ajuste",     desc: "Revisa el delta entre Radar inicial y de cierre. Define los próximos 90 días." },
];

export const HERRAMIENTAS_POR_ETAPA = (etapa: EtapaA360) =>
  HERRAMIENTAS_A360.filter((h) => h.etapa === etapa);

export const getHerramienta = (id: string) => HERRAMIENTAS_A360.find((h) => h.id === id);
