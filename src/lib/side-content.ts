// Interpretation content for SIDE diagnostic results.
// Separated from side-data.ts (which holds question data) and app.side.tsx
// so it can be reused by both the consultant view and the client results view.

export type SemaforoLevel = "critico" | "desarrollo" | "avanzado" | "nodata";
export interface SemaforoResult {
  level: SemaforoLevel;
  emoji: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

export function semaforo(score: number): SemaforoResult {
  if (score === 0) return { level: "nodata", emoji: "⚪", label: "Sin datos",         color: "#94A3B8", bg: "#F8FAFC", border: "#E2E8F0" };
  if (score <= 2.5) return { level: "critico",    emoji: "🔴", label: "Área crítica",    color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  if (score <= 3.5) return { level: "desarrollo", emoji: "🟡", label: "En desarrollo",   color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  return              { level: "avanzado",    emoji: "🟢", label: "Avanzado",         color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
}

export function semaforoIDF(score: number): SemaforoResult {
  if (score === 0) return { level: "nodata", emoji: "⚪", label: "Sin datos",               color: "#94A3B8", bg: "#F8FAFC", border: "#E2E8F0" };
  if (score > 3.5)  return { level: "critico",    emoji: "🔴", label: "Dependencia crítica",   color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  if (score > 2.5)  return { level: "desarrollo", emoji: "🟡", label: "Dependencia moderada",  color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  return               { level: "avanzado",    emoji: "🟢", label: "Baja dependencia",     color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
}

export interface DimLevelContent { interpretacion: string; recomendaciones: string[]; iniciativas: string[]; }
export interface DimContent { critico: DimLevelContent; desarrollo: DimLevelContent; avanzado: DimLevelContent; }

export const DIM_CONTENT: Record<string, DimContent> = {
  L: {
    critico: {
      interpretacion: "El liderazgo de la organización presenta fallas estructurales críticas. La dirección no comunica la visión con claridad, no delega efectivamente y no genera la confianza necesaria para que el equipo opere con autonomía. Esta brecha limita severamente la capacidad de crecimiento sostenible.",
      recomendaciones: ["Iniciar un proceso de coaching ejecutivo inmediato con foco en comunicación y delegación efectiva", "Implementar reuniones semanales de visión y objetivos con reconocimiento explícito de logros del equipo", "Definir y documentar el estilo de liderazgo esperado: comportamientos, valores y compromisos concretos"],
      iniciativas: ["Programa de coaching ejecutivo de 90 días con sesiones quincenales y métricas de avance", "Manifiesto de Liderazgo: valores, conductas esperadas y compromisos documentados y publicados", "Reuniones 1:1 mensuales del líder principal con cada responsable de área"],
    },
    desarrollo: {
      interpretacion: "El liderazgo tiene bases funcionales, pero depende en exceso de las capacidades del líder principal. La comunicación estratégica es irregular y los mandos medios no están suficientemente desarrollados para sostener el crecimiento planificado.",
      recomendaciones: ["Crear un programa formal de desarrollo para mandos medios con competencias de liderazgo situacional", "Estandarizar la comunicación de visión y prioridades con reuniones mensuales de alineación para todo el equipo", "Implementar evaluaciones 360° para identificar las principales brechas de liderazgo por nivel"],
      iniciativas: ["Taller de liderazgo situacional para mandos medios con seguimiento a 6 meses", "Plan de desarrollo individual para los 3 líderes clave con metas medibles", "Dashboard de indicadores de clima y desempeño de liderazgo"],
    },
    avanzado: {
      interpretacion: "El liderazgo es una fortaleza real de la organización. La visión se comunica con claridad, existe cultura de delegación y el equipo directivo demuestra capacidad de operar con autonomía. El reto es institucionalizar estas prácticas para que no dependan de personas específicas.",
      recomendaciones: ["Documentar el modelo de liderazgo para replicarlo al crecer o abrir nuevas unidades", "Crear un programa formal de sucesión para los roles directivos críticos de la empresa", "Desarrollar programas de mentoring interno para acelerar el crecimiento de líderes emergentes"],
      iniciativas: ["Manual de Liderazgo A360 como activo organizacional transferible y versionado", "Programa de mentoring estructurado: líderes senior → mandos medios con objetivos trimestrales", "Certificación interna de liderazgo con criterios y evaluación medibles"],
    },
  },
  E: {
    critico: {
      interpretacion: "La empresa carece de un rumbo estratégico claro y documentado. Las decisiones se toman de forma reactiva, sin orientación hacia objetivos de largo plazo. Esto genera dispersión de recursos, iniciativas sin foco y resultados inconsistentes que impiden el crecimiento sostenido.",
      recomendaciones: ["Facilitar un taller estratégico de 2 días para definir visión, misión y 3 objetivos anuales medibles", "Comunicar la estrategia a todo el equipo en un formato visual y simple que cualquiera pueda repetir", "Designar un responsable de seguimiento estratégico con reporte mensual al equipo directivo"],
      iniciativas: ["Plan Estratégico A360 a 3 años con revisión anual y hitos trimestrales", "OKRs trimestrales alineados con la estrategia y comunicados a toda la organización", "Reunión mensual de revisión estratégica con el equipo directivo y acta de compromisos"],
    },
    desarrollo: {
      interpretacion: "Existe una visión estratégica, pero su ejecución es irregular. Las prioridades cambian frecuentemente, la estrategia no está suficientemente conectada con las decisiones del día a día y los equipos reciben señales inconsistentes sobre el rumbo de la empresa.",
      recomendaciones: ["Traducir la estrategia en objetivos trimestrales concretos y visibles para cada área del negocio", "Crear un tablero estratégico de seguimiento accesible para todo el equipo directivo", "Establecer una revisión estratégica trimestral formal con análisis de desviaciones y ajustes"],
      iniciativas: ["Mapa estratégico visual con indicadores clave por área y color de semáforo mensual", "OKRs con revisión quincenal por responsable y visibilidad en toda la organización", "Taller de alineación estratégica con mandos medios al inicio de cada trimestre"],
    },
    avanzado: {
      interpretacion: "La estrategia es una herramienta viva en esta organización. Las decisiones están alineadas con los objetivos, el equipo conoce el rumbo y existe un proceso formal de revisión periódica. El reto es explorar el siguiente horizonte de crecimiento con esta base sólida.",
      recomendaciones: ["Integrar análisis de escenarios futuros en el proceso de planeación estratégica anual", "Explorar nuevas oportunidades de crecimiento coherentes con las capacidades organizacionales actuales", "Desarrollar capacidades de planificación estratégica en el segundo nivel directivo"],
      iniciativas: ["Planning estratégico anual con análisis de escenarios: base, optimista y de crisis", "Benchmarking competitivo trimestral con informe ejecutivo y decisiones derivadas", "Foro de innovación estratégica anual con participación de mandos medios y clientes clave"],
    },
  },
  G: {
    critico: {
      interpretacion: "La gobernanza de la empresa es prácticamente inexistente. Las decisiones se toman sin proceso definido, los roles de autoridad son ambiguos y frecuentemente surgen conflictos. Esta situación representa un riesgo operativo y reputacional que bloquea el crecimiento escalable.",
      recomendaciones: ["Crear un Mapa de Autoridad que defina explícitamente quién decide qué en cada área de la organización", "Implementar reuniones directivas semanales con agenda fija, acta y seguimiento de acuerdos", "Establecer políticas documentadas para las 5 decisiones más críticas: compras, contrataciones, precios, inversiones, descuentos"],
      iniciativas: ["Modelo de Gobernanza A360: roles, procesos y matriz de autoridad documentada", "Manual de Políticas para decisiones operativas y estratégicas con rangos de aprobación", "Sistema de actas y seguimiento de acuerdos directivos con responsables y fechas"],
    },
    desarrollo: {
      interpretacion: "Existen estructuras de gobierno básicas, pero son inconsistentes. Las reuniones directivas ocurren sin suficiente disciplina, los acuerdos no siempre se documentan y los procesos de toma de decisión generan cuellos de botella.",
      recomendaciones: ["Implementar un sistema formal de actas de reunión con seguimiento semanal de acuerdos pendientes", "Documentar los flujos de decisión para los 5 tipos de decisiones más frecuentes y críticas", "Establecer métricas de cumplimiento de compromisos directivos con revisión mensual"],
      iniciativas: ["Herramienta de seguimiento de acuerdos y responsables con visibilidad del equipo directivo", "Protocolo de reuniones directivas con agenda tipo, tiempos definidos y acta estandarizada", "Evaluación semestral de la efectividad del modelo de gobierno con ajustes concretos"],
    },
    avanzado: {
      interpretacion: "La gobernanza es una fortaleza: decisiones con proceso definido, documentación sistemática y un modelo de seguimiento que genera confianza y predecibilidad en la operación.",
      recomendaciones: ["Evaluar la incorporación de un Consejo Asesor externo para las decisiones más estratégicas", "Explorar modelos de gobierno distribuido que den mayor autonomía a los mandos medios capacitados", "Documentar y certificar el modelo de gobernanza para replicarlo en nuevas unidades de negocio"],
      iniciativas: ["Consejo Asesor externo con reuniones trimestrales, agenda formal y compromisos medibles", "Modelo de decisión distribuida: catálogo de decisiones delegadas a mandos medios", "Auditoría de gobierno corporativo con plan de mejora y seguimiento"],
    },
  },
  O: {
    critico: {
      interpretacion: "La estructura organizacional es confusa o inexistente. Los roles no están claros, existen duplicidades y vacíos de responsabilidad que generan conflictos frecuentes. La empresa depende de personas específicas para funcionar, lo que la hace vulnerable y no escalable.",
      recomendaciones: ["Diseñar un organigrama formal con roles, responsabilidades y líneas de reporte explícitas", "Eliminar duplicidades críticas de responsabilidad y cubrir los vacíos identificados de forma urgente", "Documentar las funciones de los 5 puestos más estratégicos con descriptivos formales de cargo"],
      iniciativas: ["Rediseño organizacional completo con mapa de roles y responsabilidades actualizado", "Descriptivos de puesto formales para todos los roles críticos del negocio", "Socialización del Manual de Funciones con todo el equipo y proceso de firma de compromisos"],
    },
    desarrollo: {
      interpretacion: "La estructura existe pero tiene inconsistencias importantes. Algunos roles no están delimitados con claridad, existen áreas de fricción entre equipos y la estructura actual no está diseñada para facilitar el crecimiento planificado.",
      recomendaciones: ["Actualizar el organigrama para reflejar la realidad operativa actual, no la aspiración formal", "Resolver las ambigüedades de responsabilidad en las áreas con mayor fricción identificada", "Diseñar la estructura organizacional objetivo para los próximos 2-3 años de crecimiento previsto"],
      iniciativas: ["Taller de clarificación de roles entre las áreas con mayor fricción o duplicidad", "Matriz RACI para los procesos y decisiones más críticas del negocio", "Mapa evolutivo de la estructura organizacional alineado con el plan de crecimiento"],
    },
    avanzado: {
      interpretacion: "La estructura organizacional es una fortaleza: roles claros, responsabilidades definidas y una organización que puede funcionar de forma autónoma. El reto es escalar esta estructura sin perder claridad y eficiencia operativa.",
      recomendaciones: ["Diseñar la estructura organizacional para soportar 2x el tamaño actual de la empresa", "Implementar planes de carrera formales para retener y desarrollar el talento clave", "Explorar modelos organizacionales ágiles o de equipos autónomos para mayor velocidad de ejecución"],
      iniciativas: ["Roadmap de escalabilidad organizacional a 3 años con hitos de contratación e inversión", "Planes de carrera por área y nivel con criterios de progresión claros y medibles", "Piloto de equipos autónomos o círculos de responsabilidad en un área del negocio"],
    },
  },
  GE: {
    critico: {
      interpretacion: "La gestión de la empresa es reactiva y sin indicadores claros. No hay visibilidad sobre los resultados por área, las reuniones no producen acuerdos y la toma de decisiones carece de datos confiables. Esto genera ejecución caótica y resultados inconsistentes.",
      recomendaciones: ["Definir 3-5 KPIs críticos por área y comenzar a medirlos esta semana, aunque sea en hoja de cálculo", "Implementar una reunión semanal de seguimiento de resultados con responsables y compromisos explícitos", "Crear un tablero básico visible para todo el equipo directivo con semáforos de desempeño"],
      iniciativas: ["Dashboard de gestión básico: 5 indicadores por área con semáforo semanal", "Modelo de reuniones: semanal operativo y mensual táctico con agenda fija y acta", "Sistema de seguimiento de tareas y compromisos con visibilidad del equipo directivo"],
    },
    desarrollo: {
      interpretacion: "Existen indicadores y reuniones de seguimiento, pero su implementación es irregular. La toma de decisiones con datos es parcial y las reuniones no siempre generan acciones concretas con responsables y fechas claras.",
      recomendaciones: ["Estandarizar el formato de reuniones de seguimiento con métricas preestablecidas y semáforos de desempeño", "Conectar los KPIs operativos con los objetivos estratégicos para asegurar que se mide lo que importa", "Implementar un protocolo de respuesta ante desviaciones importantes: quién actúa y en qué plazo"],
      iniciativas: ["Cadencia de reuniones: semanal operativo, mensual táctico, trimestral estratégico con OKRs", "Dashboard integrado con alertas automáticas ante desviaciones de indicadores clave", "Modelo predictivo básico para los 3 indicadores más críticos del negocio"],
    },
    avanzado: {
      interpretacion: "La gestión es una fortaleza: indicadores relevantes, reuniones efectivas y decisiones basadas en datos. El siguiente nivel es hacer predictiva la gestión, anticipando problemas antes de que se materialicen.",
      recomendaciones: ["Implementar análisis de tendencias y alertas tempranas sobre los indicadores más críticos", "Explorar herramientas de Business Intelligence para análisis más sofisticados y visualización avanzada", "Desarrollar capacidades de interpretación de datos en el equipo directivo y mandos medios"],
      iniciativas: ["Plataforma de BI integrada con datos en tiempo real de todas las áreas", "Programa de Data Literacy para el equipo directivo y mandos medios", "Modelos predictivos para los 3 indicadores más críticos con alertas automáticas"],
    },
  },
  F: {
    critico: {
      interpretacion: "Las finanzas se gestionan de forma intuitiva, sin sistemas de control ni visibilidad real sobre la rentabilidad. Esta situación expone a la empresa a riesgos severos de liquidez, ineficiencia de costos y decisiones estratégicas mal informadas que comprometen la supervivencia.",
      recomendaciones: ["Implementar un control de flujo de caja semanal como prioridad absoluta e inmediata", "Generar un estado de resultados mensual, aunque sea simplificado, para tomar decisiones informadas", "Definir el margen bruto objetivo por línea de negocio y comenzar a medirlo esta semana"],
      iniciativas: ["Sistema de control financiero básico: flujo de caja, costos e ingresos por semana", "Presupuesto anual con revisión de desviaciones mensual y responsable de seguimiento", "Formación financiera básica para el equipo directivo no financiero de la empresa"],
    },
    desarrollo: {
      interpretacion: "Existen controles financieros básicos pero incompletos. La rentabilidad se mide globalmente pero no por unidad de negocio, producto o cliente. Las decisiones de inversión aún se toman con información parcial y sin proyecciones confiables.",
      recomendaciones: ["Implementar análisis de rentabilidad por línea de producto, servicio o segmento de cliente", "Crear un tablero financiero con los 5-8 indicadores más relevantes para la toma de decisiones", "Establecer políticas claras y documentadas de aprobación de gastos e inversiones por monto"],
      iniciativas: ["Análisis de rentabilidad por segmento con revisión mensual y acción ante desviaciones", "Política financiera documentada: límites de aprobación, responsables y proceso", "Proyecciones financieras a 12 meses con escenarios base, optimista y de crisis"],
    },
    avanzado: {
      interpretacion: "Las finanzas son una fortaleza estratégica real. La empresa tiene visibilidad clara sobre rentabilidad, controla sus costos y toma decisiones con información financiera confiable y oportuna. El objetivo es usar las finanzas como palanca activa de valoración y crecimiento.",
      recomendaciones: ["Explorar oportunidades de optimización de la estructura de capital y el capital de trabajo", "Desarrollar modelos de valoración actualizados para medir el impacto financiero de cada iniciativa", "Implementar una estrategia de diversificación de fuentes de financiamiento para el crecimiento"],
      iniciativas: ["Modelo de valoración empresarial actualizado trimestralmente con múltiplo de referencia", "Estrategia de optimización de capital de trabajo: cobros, inventarios y plazos con proveedores", "Preparación para due diligence financiero ante posibles inversiones, adquisiciones o venta"],
    },
  },
  C: {
    critico: {
      interpretacion: "El proceso comercial es informal y depende de relaciones personales del fundador. No existe un método reproducible de prospección y cierre, los resultados son impredecibles y la empresa no tiene visibilidad real sobre su pipeline ni proyecciones de ingresos confiables.",
      recomendaciones: ["Documentar el proceso comercial en 5 etapas simples: prospección, contacto, propuesta, cierre y postventa", "Establecer objetivos de ventas mensuales claros, medibles y comunicados a los responsables comerciales", "Implementar un CRM básico para dar seguimiento al pipeline, aunque sea en hoja de cálculo"],
      iniciativas: ["Sales Playbook: proceso de venta, argumentarios, manejo de objeciones y materiales estándar", "CRM básico con seguimiento semanal del pipeline por etapa y valor esperado", "Reunión semanal de pipeline con el responsable comercial: oportunidades, avances y bloqueos"],
    },
    desarrollo: {
      interpretacion: "Existe un proceso comercial definido, pero su ejecución es irregular. La prospección no es suficientemente sistemática, el seguimiento postventa es limitado y los indicadores de conversión no se usan para mejorar la efectividad del equipo.",
      recomendaciones: ["Implementar métricas de conversión por etapa del pipeline para identificar dónde se pierden oportunidades", "Crear un programa formal de seguimiento postventa para aumentar retención y generar referencias", "Desarrollar materiales de venta estandarizados que no dependan de una persona específica del equipo"],
      iniciativas: ["Actualización del Sales Playbook con casos de éxito reales y métricas de conversión por etapa", "Programa de NPS y seguimiento trimestral de satisfacción de clientes activos", "Formación mensual del equipo comercial: técnica de ventas, producto y tendencias del mercado"],
    },
    avanzado: {
      interpretacion: "El área comercial opera con método, mide sus resultados y mejora de forma continua. El proceso es reproducible, independiente de estrellas individuales y la empresa tiene visibilidad clara sobre su pipeline y proyecciones de ventas confiables.",
      recomendaciones: ["Desarrollar un modelo de gestión de cuentas clave para los clientes más rentables y estratégicos", "Explorar canales de venta alternativos, alianzas o programas de referidos para diversificar el pipeline", "Implementar automatización de marketing para nutrir prospectos y alimentar el embudo de ventas"],
      iniciativas: ["Key Account Management (KAM) para el top 20% de clientes por valor y potencial", "Estrategia de automatización de prospección con herramientas digitales y secuencias de contacto", "Partnership strategy para multiplicar el alcance comercial sin aumentar proporcionalmente el equipo"],
    },
  },
  M: {
    critico: {
      interpretacion: "La empresa no tiene estrategia de marketing definida. Las acciones son esporádicas, sin objetivo claro ni medición de resultados. Esto limita severamente la visibilidad en el mercado y la capacidad de atraer nuevos clientes de forma consistente y predecible.",
      recomendaciones: ["Definir el cliente ideal (ICP) con sus dolores, deseos y canales donde busca información", "Seleccionar 1-2 canales de marketing prioritarios y ejecutarlos con consistencia durante al menos 3 meses", "Crear un calendario de contenidos mensual básico con al menos 8 publicaciones o acciones"],
      iniciativas: ["Perfil del cliente ideal (ICP) documentado con datos cualitativos y cuantitativos del mercado", "Estrategia de 1 canal digital prioritario: LinkedIn, email marketing o contenido educativo", "Plan de contenidos trimestral con métricas básicas de alcance, engagement y leads generados"],
    },
    desarrollo: {
      interpretacion: "Existe actividad de marketing pero sin coherencia estratégica ni medición sistemática. Las campañas se ejecutan sin analizar en profundidad sus resultados. La propuesta de valor no se comunica con suficiente claridad y consistencia en todos los puntos de contacto.",
      recomendaciones: ["Definir o actualizar la propuesta de valor única y comunicarla de forma consistente en todos los canales", "Implementar medición básica de ROI para cada canal activo: costo por lead, conversión y valor generado", "Alinear marketing con ventas para que los leads generados sean calificados y relevantes para el equipo comercial"],
      iniciativas: ["Actualización de la propuesta de valor y mensajes clave diferenciados por segmento de cliente", "Dashboard de marketing: KPIs por canal activo con revisión mensual y decisiones de optimización", "Proceso de handoff marketing → ventas con criterios explícitos de calificación de leads"],
    },
    avanzado: {
      interpretacion: "Marketing es un motor de crecimiento efectivo. Hay estrategia clara, ejecución consistente y medición de resultados. El reto es escalar lo que funciona y explorar nuevas palancas de posicionamiento y construcción de marca.",
      recomendaciones: ["Explorar estrategias de thought leadership para posicionar a la empresa o fundador como referente del sector", "Desarrollar un programa formal de referidos o embajadores de marca con incentivos estructurados", "Escalar los canales con mejor ROI con mayor inversión y automatización de procesos repetitivos"],
      iniciativas: ["Programa de embajadores y referidos con incentivos claros y trazabilidad de resultados", "Estrategia de thought leadership: artículos, conferencias, podcasts y contenido educativo de alto valor", "Marketing automation integrado con CRM para nutrición automática de prospectos y seguimiento"],
    },
  },
  OP: {
    critico: {
      interpretacion: "Las operaciones son caóticas y dependientes de personas específicas. Los procesos no están documentados, los errores son frecuentes y la productividad varía enormemente. En este estado, crecer solo amplifica los problemas existentes en lugar de los resultados.",
      recomendaciones: ["Mapear los 5 procesos más críticos tal como ocurren hoy — sin optimizar aún, solo documentar la realidad", "Identificar y atacar los 3 cuellos de botella más costosos en tiempo, dinero o calidad", "Asignar un responsable claro para cada proceso operativo crítico con rendición de cuentas explícita"],
      iniciativas: ["Mapa de procesos AS-IS de los 5 flujos más críticos tal como ocurren en la práctica actual", "SOPs (Procedimientos Estándar de Operación) para los procesos más críticos con criterios de calidad", "Sistema de reporte de incidencias y resolución con responsables asignados y tiempo de respuesta"],
    },
    desarrollo: {
      interpretacion: "Los procesos existen pero no están suficientemente documentados ni estandarizados. La calidad del servicio o producto es irregular y existe dependencia de conocimiento concentrado en pocas personas que no ha sido sistematizado.",
      recomendaciones: ["Completar la documentación de todos los procesos críticos con estándares de calidad medibles y verificables", "Implementar indicadores de productividad y calidad para los procesos más relevantes del negocio", "Crear un sistema formal de mejora continua con ciclos de revisión mensual y responsables definidos"],
      iniciativas: ["Biblioteca de SOPs actualizada, accesible y con versionamiento para todo el equipo relevante", "Indicadores de OTD (On Time Delivery) y calidad por proceso con meta definida y revisión mensual", "Ciclos mensuales de mejora continua: identifica → analiza → mejora → mide → itera"],
    },
    avanzado: {
      interpretacion: "Las operaciones son una ventaja competitiva real. Los procesos están documentados, los estándares se cumplen y la empresa puede crecer sin comprometer la calidad. El siguiente paso es automatizar lo posible para liberar capacidad humana para tareas de mayor valor.",
      recomendaciones: ["Identificar los procesos candidatos a automatización o digitalización con mayor impacto en eficiencia", "Explorar tecnologías que reduzcan el trabajo manual repetitivo y aumenten la consistencia y trazabilidad", "Desarrollar capacidades de mejora continua en todo el equipo operativo, no solo en el nivel directivo"],
      iniciativas: ["Programa de automatización de los 5 procesos más repetitivos y de mayor volumen de la empresa", "Certificación ISO u otro estándar internacional para los procesos críticos de cara al cliente", "Centro de Excelencia Operativa interno con roles formalizados de mejora continua"],
    },
  },
  CU: {
    critico: {
      interpretacion: "La cultura organizacional presenta problemas serios: bajo nivel de confianza, comunicación deficiente y falta de accountability generalizado. Este ambiente limita el compromiso, genera alta rotación y hace difícil atraer y retener talento que genere resultados sostenidos.",
      recomendaciones: ["Iniciar conversaciones honestas y estructuradas sobre el clima organizacional actual sin buscar culpables", "Implementar una práctica semanal de reconocimiento visible de logros del equipo con el respaldo de la dirección", "Crear canales seguros para que el equipo exprese inquietudes y propuestas sin miedo a consecuencias"],
      iniciativas: ["Diagnóstico de clima organizacional con encuesta anónima y plan de acción específico derivado", "Programa de cultura: definición participativa de valores, comportamientos esperados y rituales de equipo", "Reuniones mensuales de equipo con espacio estructurado para retroalimentación y propuestas de mejora"],
    },
    desarrollo: {
      interpretacion: "Existe una cultura con valores declarados, pero su implementación es inconsistente entre áreas y niveles. El accountability no es generalizado y los líderes no siempre modelan con su comportamiento los valores que declaran esperar del equipo.",
      recomendaciones: ["Alinear los sistemas de reconocimiento, evaluación y consecuencias explícitamente con los valores declarados", "Desarrollar a los líderes como modelos activos de la cultura deseada — con hechos medibles, no solo palabras", "Crear rituales de equipo que refuercen la cultura de forma consistente, auténtica y frecuente"],
      iniciativas: ["Programa de Values-Based Leadership para todo el equipo directivo y mandos medios", "Sistema de reconocimiento alineado con los valores organizacionales con visibilidad en toda la empresa", "Rituales de cultura: celebraciones de logros, aprendizaje compartido y retroalimentación peer-to-peer"],
    },
    avanzado: {
      interpretacion: "La cultura es una ventaja competitiva real. El equipo está comprometido, hay alto nivel de confianza y accountability, y la comunicación fluye de forma efectiva en todas las direcciones. El reto es preservar esta cultura al escalar y al incorporar nuevo talento.",
      recomendaciones: ["Documentar la cultura explícitamente para transmitirla en el proceso de inducción de nuevos colaboradores", "Implementar métricas de cultura: eNPS trimestral, rotación voluntaria y engagement por área", "Usar la cultura como diferenciador en la propuesta de valor al empleado para atraer al mejor talento del mercado"],
      iniciativas: ["Culture Book documentado, visual y vivido que se entrega desde el primer día de trabajo", "eNPS trimestral con revisión directiva, resultados publicados y plan de acción derivado", "Programa de marca empleadora basado en los valores auténticos de la cultura organizacional"],
    },
  },
  T: {
    critico: {
      interpretacion: "La gestión del talento es informal y reactiva. No hay proceso de selección estructurado, la capacitación es esporádica y el desempeño no se evalúa de forma sistemática. Esto genera alta rotación, bajo rendimiento y dificultad para crecer con el equipo adecuado en el momento correcto.",
      recomendaciones: ["Crear un proceso de selección básico con criterios claros de perfil y desempeño esperado por rol", "Implementar un programa de inducción formal que reduzca el tiempo hasta que alguien sea productivo", "Establecer expectativas de desempeño explícitas y revisarlas al menos semestralmente con cada colaborador"],
      iniciativas: ["Proceso formal de selección con perfil de puesto, etapas, criterios y herramientas de evaluación", "Programa de inducción estructurado para nuevos colaboradores durante las primeras 4 semanas", "Evaluaciones de desempeño semestrales con formulario estándar y espacio para planes de mejora"],
    },
    desarrollo: {
      interpretacion: "Existen prácticas de gestión del talento, pero no están suficientemente integradas ni son efectivas para retener y desarrollar al talento más crítico. Las evaluaciones ocurren pero no generan planes de desarrollo concretos con seguimiento real.",
      recomendaciones: ["Conectar las evaluaciones de desempeño con planes de desarrollo individual accionables y seguidos", "Identificar y desarrollar programas específicos de retención para el talento más crítico e impacto", "Crear planes de sucesión documentados para los 3-5 roles más críticos e irremplazables de la empresa"],
      iniciativas: ["PDIs (Planes de Desarrollo Individual) para el top 20% del equipo por impacto y potencial", "Mapa de talento crítico con plan de retención diferenciado por persona y horizonte temporal", "Plan de sucesión documentado para los 5 roles más críticos del negocio con candidatos identificados"],
    },
    avanzado: {
      interpretacion: "La gestión del talento es un activo estratégico real. Se selecciona bien, se desarrolla con intención y se retiene al talento clave con programas diferenciados. El reto es convertir esta capacidad en una ventaja competitiva que atraiga al mejor talento del mercado.",
      recomendaciones: ["Desarrollar una propuesta de valor al empleado (EVP) diferenciada, auténtica y comunicada activamente", "Implementar un modelo de competencias ligado explícitamente a la estrategia y los valores del negocio", "Explorar programas de participación en resultados o equity para retener al talento de mayor impacto"],
      iniciativas: ["Employee Value Proposition documentada y comunicada en todos los canales de atracción de talento", "Modelo de competencias organizacional con perfil esperado por nivel, área y etapa de crecimiento", "Programa de participación en resultados o equity para el talento crítico con metas claras"],
    },
  },
  ES: {
    critico: {
      interpretacion: "La empresa no está en condiciones de escalar. El conocimiento crítico está concentrado en el fundador y pocas personas clave, los procesos no están documentados y el negocio se deteriora cuando alguien falta. Crecer en este estado multiplica los problemas, no los resultados.",
      recomendaciones: ["Documentar urgentemente los 10 procesos más críticos como primer paso innegociable de sistematización", "Identificar los 3 principales cuellos de botella de escalabilidad y atacarlos de forma sistemática en 90 días", "Crear un plan de delegación inmediato para liberar al fundador de las tareas más operativas y repetitivas"],
      iniciativas: ["Programa de sistematización: procesos, manuales y delegación estructurada en los primeros 90 días", "Transferencia de conocimiento crítico del fundador a las segundas líneas identificadas y capacitadas", "Implementación de herramientas de soporte operativo que reduzcan la dependencia de personas clave"],
    },
    desarrollo: {
      interpretacion: "La empresa tiene bases para escalar pero aún depende demasiado de personas específicas y el conocimiento no está suficientemente sistematizado. Un crecimiento acelerado en este estado generaría fricción, deterioro de la calidad y potencial crisis operativa.",
      recomendaciones: ["Completar la sistematización de los procesos pendientes priorizando los de mayor impacto en el crecimiento", "Fortalecer la segunda línea directiva con autonomía real, responsabilidades claras y recursos asignados", "Probar la escalabilidad con iniciativas de expansión controladas antes de un crecimiento agresivo"],
      iniciativas: ["Biblioteca de SOPs completa con versionamiento y acceso para todo el equipo relevante de la empresa", "Programa de delegación estructurada: mandos medios con autoridad formal y rendición de cuentas clara", "Piloto de expansión controlado: nueva unidad de negocio, ciudad o línea de producto con métricas"],
    },
    avanzado: {
      interpretacion: "La empresa tiene la arquitectura para escalar con confianza. Los procesos están sistematizados, el conocimiento se puede transferir y la organización puede crecer sin depender de personas irreemplazables. Es el momento de acelerar con una estrategia de crecimiento ambiciosa.",
      recomendaciones: ["Diseñar la estrategia de escalabilidad para los próximos 3-5 años con metas ambiciosas y recursos definidos", "Explorar modelos acelerados como franquicias, licencias o alianzas estratégicas para escalar más rápido", "Atraer inversión o financiamiento para ejecutar el plan de crecimiento con mayor velocidad y alcance"],
      iniciativas: ["Roadmap de escalabilidad: mapa de expansión a 3 años con hitos, recursos y métricas de éxito", "Modelo de negocio replicable: documentado, probado en piloto y listo para ser escalado sistemáticamente", "Proceso formal de atracción de capital o socios estratégicos para la siguiente etapa de crecimiento"],
    },
  },
};

export interface IndiceLevelContent { interpretacion: string; recomendaciones: string[]; }
export const INDICE_CONTENT: Record<string, { critico: IndiceLevelContent; desarrollo: IndiceLevelContent; avanzado: IndiceLevelContent }> = {
  ivee: {
    critico: {
      interpretacion: "La empresa NO está lista para escalar — riesgo crítico. Las bases organizacionales, comerciales y operativas son insuficientes para sostener un crecimiento acelerado. Intentar escalar en este estado generaría colapsos operativos, deterioro severo de la calidad y destrucción de valor. Cualquier comprador o inversionista aplicaría un descuento significativo por esta razón.",
      recomendaciones: [
        "Resolver antes de escalar: cerrar las brechas críticas de madurez empresarial (IME) que limitan la base operativa sobre la que se construye cualquier crecimiento sostenible",
        "Sistematizar antes de crecer: documentar los procesos críticos, transferir el conocimiento y eliminar la dependencia de personas individuales como condición previa al crecimiento",
        "Trazar el mapa de escalabilidad: definir explícitamente qué debe estar en orden antes de cada fase de crecimiento y establecer hitos medibles de viabilidad",
      ],
    },
    desarrollo: {
      interpretacion: "Existen limitantes importantes para el crecimiento. La empresa puede avanzar de forma controlada en algunos frentes, pero no está preparada para una expansión agresiva sin riesgo de deterioro operativo y pérdida de calidad. Los inversionistas perciben este nivel como potencial sin garantía de ejecución.",
      recomendaciones: [
        "Fortalecer los sistemas que están limitando la escalabilidad antes de acelerar el crecimiento — crecer en este estado multiplica los problemas, no los resultados",
        "Priorizar por capacidad de escala: identificar qué áreas del negocio ya son escalables hoy y concentrar las iniciativas de crecimiento en esas primero",
        "Construir el roadmap de preparación: definir hitos claros de viabilidad para escalar en fases — con criterios de 'go/no-go' antes de cada etapa de expansión",
      ],
    },
    avanzado: {
      interpretacion: "La empresa tiene bases sólidas para escalar. Los sistemas, procesos y capacidades organizacionales pueden sostener un crecimiento significativo sin comprometer la calidad ni la operación del negocio. Este nivel genera confianza en inversionistas y compradores porque el crecimiento parece predecible y ejecutable.",
      recomendaciones: [
        "Diseñar la estrategia de escalabilidad con metas ambiciosas, recursos claramente asignados y métricas de seguimiento definidas por fase",
        "Explorar modelos acelerados de crecimiento: nuevos mercados, canales alternativos, alianzas estratégicas o modelos replicables como franquicias o licencias",
        "Capitalizar la escalabilidad como activo: usar este nivel como argumento central en procesos de valoración, atracción de inversión o negociación con socios estratégicos",
      ],
    },
  },
  idf: {
    critico: { interpretacion: "La empresa tiene dependencia CRÍTICA del fundador. Las decisiones clave, relaciones con clientes y conocimiento operativo están concentrados en una sola persona. Esto destruye valor en procesos de inversión o venta y hace a la empresa sumamente vulnerable ante cualquier eventualidad.", recomendaciones: ["Iniciar inmediatamente un plan de delegación: identificar qué puede dejar de hacer el fundador esta semana", "Documentar el conocimiento crítico del fundador y transferirlo a segundas líneas de forma sistemática", "Desarrollar líderes que puedan tomar decisiones estratégicas sin requerir la aprobación del fundador"] },
    desarrollo: { interpretacion: "Existe dependencia moderada del fundador. El negocio opera en lo operativo sin su presencia constante, pero las decisiones estratégicas y relaciones clave aún dependen de él/ella, limitando el tiempo disponible para actividades de mayor valor estratégico.", recomendaciones: ["Estructurar las relaciones clave con clientes para que dependan de la empresa como institución, no del fundador", "Delegar progresivamente las decisiones de menor riesgo para entrenar la capacidad de decisión del equipo", "Crear un Comité de Dirección que tome decisiones colectivamente sin necesitar al fundador en cada caso"] },
    avanzado: { interpretacion: "La empresa tiene baja dependencia del fundador. Los sistemas, procesos y el equipo pueden operar y crecer de forma autónoma. Esto aumenta significativamente el valor de la empresa y la libertad del fundador para enfocarse en lo estratégico.", recomendaciones: ["Formalizar la autonomía del equipo con estructuras de gobierno que sostengan la independencia lograda", "Explorar estrategias de salida, sucesión o expansión que capitalicen la autonomía organizacional construida", "Documentar la independencia operativa como activo en el proceso de valoración de la empresa"] },
  },
  cof: {
    critico: { interpretacion: "Existe incoherencia organizacional significativa. Los valores declarados no se viven en la práctica, los sistemas no están alineados entre sí y los equipos parecen operar con agendas distintas. Esto genera fricción interna, decisiones contradictorias y desconfianza generalizada.", recomendaciones: ["Auditar la brecha entre lo que se declara (valores, visión) y lo que los sistemas y comportamientos demuestran", "Alinear los sistemas de incentivo, evaluación y reconocimiento con los valores organizacionales declarados", "Facilitar talleres de alineación entre áreas para crear un lenguaje común de trabajo y colaboración"] },
    desarrollo: { interpretacion: "Existe alineación parcial en la organización. Algunas áreas y procesos están bien alineados, pero hay inconsistencias entre la estrategia, la cultura y los sistemas operativos que generan fricción y oportunidades perdidas.", recomendaciones: ["Mapear las principales incoherencias entre lo que se dice y lo que los sistemas efectivamente incentivan", "Crear un proceso formal de alineación entre áreas con revisión trimestral y compromisos explícitos", "Definir explícitamente qué comportamientos NO son coherentes con los valores de la empresa"] },
    avanzado: { interpretacion: "Alta coherencia organizacional: la estrategia, la cultura y los sistemas operativos están alineados y se refuerzan mutuamente. Las decisiones son consistentes y el equipo opera con propósito compartido.", recomendaciones: ["Usar la coherencia organizacional como ventaja competitiva en atracción de talento e inversión", "Documentar el modelo de coherencia para replicarlo en nuevas unidades o geografías de expansión", "Medir periódicamente la coherencia con encuestas internas y revisiones directivas para mantenerla"] },
  },
};
