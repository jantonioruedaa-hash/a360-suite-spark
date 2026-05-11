// Catálogo de entregables y objetivos por plan comercial.
// Aditivo: no reemplaza PLANES_PRESET; lo enriquece para la Propuesta Comercial.

export interface EntregableItem {
  titulo: string;
  descripcion: string;
}

export const ENTREGABLES_PLAN: Record<string, EntregableItem[]> = {
  diagnostico: [
    { titulo: "Diagnóstico SIDE completo", descripcion: "Evaluación de las 4 dimensiones (IDF, COF, IVEE, IME) con scoring por sub-dimensión." },
    { titulo: "Mapa de brechas estratégicas", descripcion: "Brechas priorizadas por impacto y urgencia." },
    { titulo: "Sesión de devolución (2h)", descripcion: "Presentación ejecutiva de hallazgos y recomendaciones iniciales." },
    { titulo: "Reporte ejecutivo PDF", descripcion: "Documento descargable con todo el diagnóstico." },
  ],
  estrategico: [
    { titulo: "Diagnóstico SIDE completo", descripcion: "Punto de partida y línea base medible." },
    { titulo: "Plan Estratégico (18 secciones)", descripcion: "Marco completo: identidad, contexto, objetivos, capacidades, ESG, alianzas, innovación, CMI, ejecución." },
    { titulo: "Mapa estratégico CMI/BSC", descripcion: "4 perspectivas con objetivos, KPIs e iniciativas." },
    { titulo: "Plan de implementación 90 días", descripcion: "Hoja de ruta operativa con responsables y métricas." },
    { titulo: "3 sesiones de acompañamiento", descripcion: "Validación, ajuste y arranque de la ejecución." },
  ],
  transformacion: [
    { titulo: "Diagnóstico SIDE", descripcion: "Línea base e identificación de palancas." },
    { titulo: "Plan Estratégico (18 secciones)", descripcion: "Marco metodológico completo." },
    { titulo: "Coaching Ejecutivo (12 herramientas)", descripcion: "Programa estructurado para el líder y su equipo cercano." },
    { titulo: "Acompañamiento mensual 12 meses", descripcion: "Sesiones de seguimiento con KPIs y semáforo." },
    { titulo: "Reportes trimestrales", descripcion: "Avance vs. plan, recomendaciones y ajustes." },
  ],
  coaching_ejecutivo: [
    { titulo: "Programa de coaching estructurado", descripcion: "12 herramientas A360 aplicadas con cadencia quincenal." },
    { titulo: "12 sesiones individuales", descripcion: "Sesiones 1:1 con el líder, plan personalizado." },
    { titulo: "Bitácora de progreso", descripcion: "Reportes de cada sesión con compromisos y semáforo." },
    { titulo: "Síntesis final del programa", descripcion: "Cierre con evaluación de impacto y plan de continuidad." },
  ],
  programa_integral: [
    { titulo: "Diagnóstico SIDE", descripcion: "Línea base." },
    { titulo: "Plan Estratégico completo", descripcion: "18 secciones del marco A360." },
    { titulo: "Coaching Ejecutivo", descripcion: "12 herramientas + 12 sesiones." },
    { titulo: "Programa LEE (10 capítulos)", descripcion: "Liderazgo, Equipos y Ejecución para el equipo directivo." },
    { titulo: "Acompañamiento integral 12 meses", descripcion: "Sesiones consultivas y reportes de avance." },
  ],
  corporativo: [
    { titulo: "Programa Integral A360", descripcion: "Diagnóstico + Plan + Coaching + LEE." },
    { titulo: "Customización corporativa", descripcion: "Adaptación de catálogos, KPIs y dashboards a la realidad de la empresa." },
    { titulo: "Equipo consultor dedicado", descripcion: "Consultor senior + analista + facilitador LEE." },
    { titulo: "Acompañamiento 24 meses", descripcion: "Cadencia ejecutiva con comité estratégico." },
    { titulo: "Reportes corporativos trimestrales", descripcion: "Documento ejecutivo para directorio." },
  ],
};

export const OBJETIVOS_PLAN: Record<string, string[]> = {
  diagnostico: [
    "Establecer una línea base medible del estado actual de la empresa.",
    "Identificar las 3 brechas estratégicas más urgentes.",
    "Recomendar el programa de transformación más adecuado.",
  ],
  estrategico: [
    "Definir el rumbo estratégico a 3 años con objetivos medibles.",
    "Construir el Cuadro de Mando Integral (CMI/BSC) operativo.",
    "Habilitar la ejecución con un plan de 90 días.",
  ],
  transformacion: [
    "Acompañar la transformación integral del negocio durante 12 meses.",
    "Desarrollar las capacidades de liderazgo del equipo directivo.",
    "Asegurar la ejecución del plan estratégico con KPIs en seguimiento.",
  ],
  coaching_ejecutivo: [
    "Fortalecer las capacidades del líder en 12 dimensiones clave.",
    "Generar compromisos accionables sesión a sesión.",
    "Cerrar el programa con un líder más estratégico, ejecutor y consciente.",
  ],
  programa_integral: [
    "Transformar la organización desde la estrategia hasta la operación.",
    "Desarrollar el liderazgo individual y de equipos.",
    "Establecer una cultura de ejecución y mejora continua.",
  ],
  corporativo: [
    "Implementar el modelo A360 a nivel corporativo.",
    "Estandarizar la gestión estratégica en todas las unidades.",
    "Generar visibilidad ejecutiva con reportes para directorio.",
  ],
};
