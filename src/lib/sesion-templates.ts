// Plantillas de sesión por (programa, etapa) — auto-llenan objetivo, temas y herramientas
// para acelerar el reporte y mantener consistencia metodológica A360.

export interface SesionPlantilla {
  objetivo: string;
  temas: string[];
  herramientas: string[];
  proxima_temas: string[];
}

type Key = string; // `${programa}::${etapa}`

const k = (p: string, e: string) => `${p}::${e}`;

export const SESION_PLANTILLAS: Record<Key, SesionPlantilla> = {
  // ───── Coaching Ejecutivo (A360) ─────
  [k("Coaching Ejecutivo", "Diagnóstico")]: {
    objetivo:
      "Mapear la línea base del líder: identidad, brechas de capacidad y patrones de decisión, para definir el foco del programa.",
    temas: [
      "Historia profesional y momento actual",
      "Autoevaluación de liderazgo (Radar A360)",
      "Mapa de stakeholders clave",
      "Brechas críticas y aspiraciones",
    ],
    herramientas: ["Radar A360 inicial", "Línea de vida ejecutiva", "Mapa de stakeholders"],
    proxima_temas: ["Definición de objetivos del programa", "Compromisos iniciales"],
  },
  [k("Coaching Ejecutivo", "Diseño")]: {
    objetivo:
      "Co-construir el plan de transformación del líder: objetivos, hábitos y rituales de ejecución.",
    temas: [
      "Objetivos del programa (3-5)",
      "Hábitos a instalar / desinstalar",
      "Rituales de seguimiento",
      "Indicadores personales de avance",
    ],
    herramientas: ["Canvas de transformación", "Matriz de hábitos", "Acuerdo de coaching"],
    proxima_temas: ["Primer ciclo de implementación", "Revisión de avances"],
  },
  [k("Coaching Ejecutivo", "Implementación")]: {
    objetivo:
      "Acompañar la puesta en marcha de hábitos y decisiones críticas, removiendo bloqueos.",
    temas: [
      "Avances de la semana / mes",
      "Decisiones difíciles abordadas",
      "Bloqueos y patrones recurrentes",
      "Feedback recibido del entorno",
    ],
    herramientas: ["Bitácora de líder", "Modelo GROW", "Reframing"],
    proxima_temas: ["Continuar bitácora", "Ensayar conversación difícil X"],
  },
  [k("Coaching Ejecutivo", "Seguimiento")]: {
    objetivo: "Consolidar avances, medir delta vs línea base y ajustar rituales.",
    temas: ["Re-medición Radar A360", "Aprendizajes clave", "Ajustes al plan"],
    herramientas: ["Radar A360 de avance", "Retrospectiva ejecutiva"],
    proxima_temas: ["Cierre del programa", "Plan de continuidad"],
  },
  [k("Coaching Ejecutivo", "Cierre")]: {
    objetivo: "Cerrar el programa, capitalizar aprendizajes y definir continuidad.",
    temas: ["Síntesis de transformación", "Mensaje al sponsor", "Plan de continuidad 90 días"],
    herramientas: ["Radar A360 final", "Carta de cierre", "Plan de sostenibilidad"],
    proxima_temas: ["Check-in trimestral"],
  },

  // ───── SIDE + Plan ─────
  [k("SIDE + Plan Esencial", "Diagnóstico")]: {
    objetivo:
      "Aplicar el diagnóstico SIDE (IDF, COF, IVEE, IME) y validar hallazgos con el equipo directivo.",
    temas: [
      "Aplicación SIDE (4 dimensiones)",
      "Resultados y benchmark sectorial",
      "Identificación de brechas críticas",
    ],
    herramientas: ["SIDE", "Mapa de hallazgos", "Heatmap de brechas"],
    proxima_temas: ["Priorización de iniciativas", "Inicio del Plan Estratégico"],
  },
  [k("SIDE + Plan Esencial", "Diseño")]: {
    objetivo:
      "Construir las primeras secciones del Plan Estratégico (identidad, propósito, FODA, objetivos).",
    temas: ["Misión / Visión / Valores", "FODA cruzado", "Objetivos estratégicos 3-5 años"],
    herramientas: ["Plan Estratégico secciones 1-5", "Matriz FODA"],
    proxima_temas: ["Definición de iniciativas", "Mapa estratégico"],
  },
  [k("SIDE + Plan Esencial", "Implementación")]: {
    objetivo: "Activar las iniciativas estratégicas y definir KPIs de seguimiento.",
    temas: ["Plan de iniciativas", "KPIs y CMI", "Roles y responsables"],
    herramientas: ["CMI / Balanced Scorecard", "Tablero de iniciativas"],
    proxima_temas: ["Primera revisión mensual de KPIs"],
  },
  [k("SIDE + Plan Esencial", "Seguimiento")]: {
    objetivo: "Revisar avance del Plan, KPIs y ajustar iniciativas.",
    temas: ["Avance de iniciativas", "Análisis de KPIs", "Ajustes al plan"],
    herramientas: ["Tablero CMI", "Revisión de OKRs"],
    proxima_temas: ["Próxima medición SIDE de avance"],
  },
  [k("SIDE + Plan Esencial", "Cierre")]: {
    objetivo: "Cerrar el ciclo, re-medir SIDE y proyectar la siguiente fase.",
    temas: ["Re-medición SIDE", "Resultados vs línea base", "Hoja de ruta siguiente fase"],
    herramientas: ["SIDE de cierre", "Informe ejecutivo"],
    proxima_temas: ["Definición Plan Avanzado / Corporativo"],
  },

  // ───── LEE ─────
  [k("LEE", "Diagnóstico")]: {
    objetivo: "Evaluar al equipo en las dimensiones LEE y definir foco del programa.",
    temas: ["Aplicación LEE", "Lectura grupal", "Definición de capítulos prioritarios"],
    herramientas: ["LEE Inicial", "Workbook capítulo 1"],
    proxima_temas: ["Sesión 1 capítulo prioritario"],
  },
  [k("LEE", "Implementación")]: {
    objetivo: "Facilitar capítulo LEE con equipo: integración de aprendizajes y compromisos.",
    temas: ["Concepto del capítulo", "Ejercicios prácticos", "Compromisos individuales"],
    herramientas: ["Workbook LEE", "Dinámica grupal"],
    proxima_temas: ["Siguiente capítulo del programa"],
  },
};

export function obtenerPlantilla(programa: string, etapa: string): SesionPlantilla | null {
  return SESION_PLANTILLAS[k(programa, etapa)] ?? null;
}

// Instructivo metodológico que se muestra al inicio del módulo
export const INSTRUCTIVO_SESION = {
  titulo: "Reporte de Sesión — Eje del seguimiento A360",
  descripcion:
    "Cada sesión es un nodo de avance dentro del programa del cliente. Captura el contexto, mide los KPIs derivados del Plan Estratégico, deja compromisos accionables y alimenta el sistema de alertas y métricas globales.",
  flujo: [
    {
      etapa: "1. Contexto",
      desc: "Programa, etapa y participantes — vincula la sesión al recorrido metodológico (Onboarding → SIDE → Plan → Coaching).",
    },
    {
      etapa: "2. Contenido",
      desc: "Temas, logros y herramientas A360 aplicadas. El semáforo refleja el momento real del programa.",
    },
    {
      etapa: "3. KPIs",
      desc: "Indicadores medidos en la sesión, alimentados desde el Plan Estratégico (sec. 17 CMI).",
    },
    {
      etapa: "4. Compromisos",
      desc: "Acciones con responsable y fecha. Disparan alertas y se monitorean en el tablero del cliente.",
    },
    {
      etapa: "5. Cierre",
      desc: "Próxima sesión, mensaje ejecutivo y análisis IA del progreso. Se comparte vía PDF / link seguro.",
    },
  ],
};
