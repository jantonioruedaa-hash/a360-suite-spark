// Marco metodológico A360 — descripción rica de cada una de las 18 secciones
// del Plan Estratégico. Se usa tanto en el panel global (/app/plan) como en
// el workspace del cliente (/app/clientes/:id/plan) para que metodología y
// edición estén interconectadas.

export interface MarcoSeccion {
  numero: number;
  key: string;
  proposito: string;          // por qué existe
  enfoque: string;            // perspectiva conceptual
  metodologia: string[];      // pasos / técnicas
  entregables: string[];      // qué debe quedar al cerrar
  preguntasClave: string[];   // detonadores de conversación
  kpis: string[];             // indicadores que se miden
  conectaCon: string[];       // claves de otras secciones
  transformacion: string;     // resultado esperado en el cliente
}

export const MARCO_PLAN: Record<string, MarcoSeccion> = {
  "01": {
    numero: 1, key: "01",
    proposito: "Establecer la identidad ejecutiva del plan: empresa, líderes, alcance temporal y promesa estratégica.",
    enfoque: "Cápsula ejecutiva tipo board-deck: lo que un comité directivo necesita ver en los primeros 3 minutos.",
    metodologia: [
      "Entrevista al CEO / dueño: historia, modelo de negocio, líneas de producto",
      "Inventario de stakeholders y estructura accionaria",
      "Definición de horizonte (3-5 años) y grado de ambición",
    ],
    entregables: ["Ficha ejecutiva 1 página", "Mapa de stakeholders", "Promesa estratégica del ciclo"],
    preguntasClave: [
      "¿Qué hace única a esta empresa hoy?",
      "¿Quiénes son los stakeholders críticos del próximo ciclo?",
      "¿Qué nivel de ambición vamos a sostener: defender, crecer o transformar?",
    ],
    kpis: ["Claridad de promesa (1-5)", "Cobertura de stakeholders mapeados (%)"],
    conectaCon: ["05", "07", "18"],
    transformacion: "El equipo directivo se alinea sobre quién es la empresa y a dónde va antes de discutir el cómo.",
  },
  "02": {
    numero: 2, key: "02",
    proposito: "Mapear el entorno externo (PESTEL) y separar lo controlable de lo condicionante.",
    enfoque: "Inteligencia de contexto: factores políticos, económicos, sociales, tecnológicos, ecológicos y legales con impacto estimado.",
    metodologia: [
      "Inventario de factores por dimensión PESTEL",
      "Calificación de impacto (1-5) y tipo (oportunidad/amenaza)",
      "Priorización con matriz impacto × probabilidad",
    ],
    entregables: ["Tablero PESTEL priorizado", "Top 5 oportunidades y top 5 amenazas externas"],
    preguntasClave: [
      "¿Qué cambios regulatorios pueden alterar el modelo en 12-24 meses?",
      "¿Qué tendencias sociales o tecnológicas abren un mercado nuevo?",
      "¿Qué riesgos del entorno no estamos cubriendo?",
    ],
    kpis: ["# factores priorizados", "Cobertura de dimensiones (6/6)", "Score promedio de impacto"],
    conectaCon: ["04", "10_esg", "15"],
    transformacion: "Pasar de 'reaccionar' al entorno a anticiparlo con un mapa vivo.",
  },
  "03": {
    numero: 3, key: "03",
    proposito: "Auditar capacidades internas (EFI) por área funcional y declarar fortalezas y debilidades reales.",
    enfoque: "Diagnóstico funcional integral: comercial, operaciones, finanzas, talento, tecnología, gobierno corporativo.",
    metodologia: [
      "Cuestionario por área con evidencia",
      "Calificación EFI (peso × calificación)",
      "Triangulación con datos cuantitativos (KPIs, financieros)",
    ],
    entregables: ["Matriz EFI ponderada", "Inventario de fortalezas y debilidades por área"],
    preguntasClave: [
      "¿Qué área es nuestra ventaja competitiva real, demostrada?",
      "¿Dónde tenemos riesgo operativo que el mercado aún no ve?",
      "¿Qué procesos están sostenidos por personas y no por sistemas?",
    ],
    kpis: ["Score EFI ponderado", "Brecha entre área top y área débil"],
    conectaCon: ["04", "09", "14", "15"],
    transformacion: "El equipo deja de operar bajo supuestos y reconoce dónde está fuerte y dónde frágil.",
  },
  "04": {
    numero: 4, key: "04",
    proposito: "Cruzar diagnóstico interno y externo para producir un FODA accionable y derivar acciones CAME.",
    enfoque: "Síntesis estratégica: del diagnóstico a la decisión.",
    metodologia: [
      "Construcción de FODA con evidencia de Sec 02 y Sec 03",
      "CAME: Corregir, Afrontar, Mantener, Explotar",
      "Priorización por valor estratégico × esfuerzo",
    ],
    entregables: ["Matriz FODA con evidencia", "Plan CAME priorizado", "Top 10 movimientos estratégicos"],
    preguntasClave: [
      "¿Qué fortaleza usaremos para capturar qué oportunidad?",
      "¿Qué debilidad vamos a corregir antes de que el entorno la castigue?",
      "¿Qué amenaza puede convertirse en ventaja si actuamos antes?",
    ],
    kpis: ["# acciones CAME priorizadas", "% acciones con responsable y fecha"],
    conectaCon: ["06", "07", "08", "18"],
    transformacion: "El equipo sale con una agenda concreta de movimientos, no con un análisis bonito.",
  },
  "05": {
    numero: 5, key: "05",
    proposito: "Declarar misión, visión, valores y propósito que guíen las decisiones del ciclo.",
    enfoque: "Identidad estratégica: brújula no decorativa, prueba para cada decisión.",
    metodologia: [
      "Taller de declaración con equipo directivo",
      "Validación contra el FODA y el modelo de negocio",
      "Test de uso: ¿esta declaración nos ayuda a decidir?",
    ],
    entregables: ["Declaración misión-visión-valores-propósito", "Comportamientos esperados por valor"],
    preguntasClave: [
      "Si nuestra misión desapareciera, ¿quién la extrañaría y por qué?",
      "¿Qué decisión reciente habría sido distinta si los valores fueran prueba real?",
    ],
    kpis: ["% colaboradores que reconocen los 4 elementos", "Decisiones documentadas que usaron valores"],
    conectaCon: ["01", "06", "14"],
    transformacion: "La identidad deja de ser un poster y empieza a filtrar decisiones.",
  },
  "06": {
    numero: 6, key: "06",
    proposito: "Definir 3-5 ejes estratégicos que organicen el ciclo y absorban el FODA + CAME.",
    enfoque: "Arquitectura de la estrategia: temas con dueño, narrativa y métricas.",
    metodologia: [
      "Agrupar acciones CAME en temas",
      "Asignar narrativa, sponsor y horizonte por eje",
      "Validar cobertura: cada amenaza/oportunidad crítica vive en un eje",
    ],
    entregables: ["3-5 ejes con narrativa, sponsor y horizonte"],
    preguntasClave: [
      "¿Qué pasa si no movemos este eje en los próximos 12 meses?",
      "¿Quién en el comité es dueño y rinde cuentas por cada eje?",
    ],
    kpis: ["# ejes (3-5)", "# acciones huérfanas (= 0)", "Sponsor asignado por eje"],
    conectaCon: ["07", "08", "17_cmi", "18"],
    transformacion: "La organización pasa de 50 iniciativas dispersas a 4-5 conversaciones estratégicas.",
  },
  "07": {
    numero: 7, key: "07",
    proposito: "Traducir ejes en objetivos con BSC (Financiero, Cliente, Procesos, Aprendizaje).",
    enfoque: "Equilibrio de Kaplan & Norton: la estrategia se ejecuta cuando se mide en 4 perspectivas.",
    metodologia: [
      "Definir objetivos SMART por eje y perspectiva",
      "Asignar KPI, meta, frecuencia y responsable",
      "Construir mapa estratégico de causa-efecto",
    ],
    entregables: ["BSC con 12-20 objetivos", "Mapa estratégico", "Catálogo de KPIs"],
    preguntasClave: [
      "¿Cómo se conecta un objetivo de aprendizaje con un resultado financiero?",
      "¿Qué KPI vamos a abandonar porque no nos mueve?",
    ],
    kpis: ["% objetivos con KPI y meta", "Cobertura de las 4 perspectivas"],
    conectaCon: ["06", "17_cmi", "16"],
    transformacion: "La estrategia se vuelve medible y conversable en cualquier nivel.",
  },
  "08": {
    numero: 8, key: "08",
    proposito: "Elegir tipo de estrategia corporativa (Porter / Ansoff): liderazgo en costos, diferenciación, foco, integración, diversificación.",
    enfoque: "Decisiones de portafolio: dónde competir y cómo ganar.",
    metodologia: [
      "Mapeo Ansoff (producto-mercado actual/nuevo)",
      "Selección Porter por unidad/segmento",
      "Definición de movimientos M&A, alianzas o spin-off",
    ],
    entregables: ["Matriz Ansoff con apuestas marcadas", "Estrategia genérica por unidad"],
    preguntasClave: [
      "¿Estamos defendiendo, penetrando, expandiendo o reinventando?",
      "¿Qué dejamos de hacer para liberar foco?",
    ],
    kpis: ["% revenue por cuadrante Ansoff", "# unidades con estrategia explícita"],
    conectaCon: ["06", "09", "11_alianzas", "13"],
    transformacion: "El equipo elige conscientemente dónde poner el músculo financiero del próximo ciclo.",
  },
  "09": {
    numero: 9, key: "09",
    proposito: "Bajar la estrategia a estructura organizacional, procesos y plan operativo con responsables y plazos.",
    enfoque: "Del qué al cómo: la estrategia que no se organiza no se ejecuta.",
    metodologia: [
      "Revisión de estructura vs. ejes",
      "Mapeo de procesos críticos",
      "Plan operativo con iniciativas, hitos y dependencias",
    ],
    entregables: ["Organigrama alineado a ejes", "Plan operativo 12 meses", "Mapa de procesos críticos"],
    preguntasClave: [
      "¿La estructura actual sostiene la estrategia o la frena?",
      "¿Qué proceso debemos rediseñar este trimestre?",
    ],
    kpis: ["% iniciativas con dueño y fecha", "# procesos críticos documentados"],
    conectaCon: ["03", "14", "15", "18"],
    transformacion: "La estrategia se convierte en un calendario operativo con dueños.",
  },
  "10_esg": {
    numero: 10, key: "10_esg",
    proposito: "Integrar Sostenibilidad y ESG como dimensión estratégica, no como reporte cosmético.",
    enfoque: "Materialidad doble (impacto y financiera), ODS y marcos GRI/SASB.",
    metodologia: [
      "Análisis de materialidad doble",
      "Selección de ODS prioritarios",
      "Definición de objetivos ESG con KPIs",
    ],
    entregables: ["Matriz de materialidad", "Top 5 ODS", "Objetivos ESG con métricas"],
    preguntasClave: [
      "¿Qué riesgos ESG son materiales para nuestro modelo de negocio?",
      "¿Qué exige el mercado, el regulador y nuestra cadena de valor?",
    ],
    kpis: ["# objetivos ESG con KPI", "Score de materialidad"],
    conectaCon: ["02", "07", "13"],
    transformacion: "ESG deja de ser PR y se convierte en ventaja competitiva y licencia social.",
  },
  "11_alianzas": {
    numero: 11, key: "11_alianzas",
    proposito: "Mapear, priorizar y gobernar alianzas estratégicas que aceleren los ejes.",
    enfoque: "Capital relacional: el negocio que se construye con otros.",
    metodologia: [
      "Inventario de aliados actuales y potenciales",
      "Tipología (comercial, tecnológica, capital, distribución)",
      "Modelo de gobierno por alianza",
    ],
    entregables: ["Mapa de alianzas priorizadas", "Modelo de gobierno"],
    preguntasClave: [
      "¿Qué alianza puede acortar 12 meses un eje?",
      "¿Con quién dejamos de aliarnos para no diluir la propuesta?",
    ],
    kpis: ["# alianzas activas con KPI", "Revenue/Costo asociado a alianzas"],
    conectaCon: ["08", "13", "12_innovacion"],
    transformacion: "Las alianzas se gestionan como activo estratégico, no como contactos.",
  },
  "12_innovacion": {
    numero: 12, key: "12_innovacion",
    proposito: "Diseñar el sistema de innovación e I+D+i: portafolio, metodologías y financiamiento.",
    enfoque: "Innovación como capacidad organizacional, no como evento.",
    metodologia: [
      "Portafolio horizon 1-2-3 (core, adyacente, disruptivo)",
      "Selección de metodologías (Design Thinking, Lean Startup, Stage-Gate)",
      "Mapeo de fuentes de financiamiento (CTI, capital, fondos)",
    ],
    entregables: ["Portafolio de innovación", "Stack metodológico", "Pipeline de proyectos"],
    preguntasClave: [
      "¿Qué % del revenue 2027 vendrá de algo que hoy no vendemos?",
      "¿Quién es el dueño del sistema de innovación?",
    ],
    kpis: ["% revenue de productos < 3 años", "# proyectos en pipeline por horizonte"],
    conectaCon: ["08", "11_alianzas", "15"],
    transformacion: "La innovación se vuelve sistemática, financiada y medible.",
  },
  "13": {
    numero: 13, key: "13",
    proposito: "Definir estrategia de marketing: segmentos, posicionamiento, propuesta de valor y mix.",
    enfoque: "STP + 4P/7P + customer journey + métricas comerciales.",
    metodologia: [
      "Segmentación y selección de target",
      "Posicionamiento y propuesta de valor por segmento",
      "Mix de marketing y plan de canales",
    ],
    entregables: ["Mapa STP", "Propuesta de valor por segmento", "Plan comercial 12 meses"],
    preguntasClave: [
      "¿A qué cliente decimos NO para servir mejor a quien sí?",
      "¿Qué hace que un cliente nos prefiera contra la mejor alternativa?",
    ],
    kpis: ["CAC, LTV, NPS", "Conversión por canal", "Market share"],
    conectaCon: ["08", "11_alianzas", "07"],
    transformacion: "La empresa pasa de vender a todos a ganar segmentos elegidos.",
  },
  "14": {
    numero: 14, key: "14",
    proposito: "Definir estrategia de talento, cultura, liderazgo y compensación alineada al plan.",
    enfoque: "La estrategia se ejecuta a la velocidad del talento y la cultura.",
    metodologia: [
      "Diagnóstico de cultura y clima",
      "Mapa de talento crítico y plan de sucesión",
      "Esquema de compensación variable ligado a BSC",
    ],
    entregables: ["Plan de talento y cultura", "Mapa de sucesión", "Esquema de compensación"],
    preguntasClave: [
      "¿Tenemos al equipo que la estrategia exige?",
      "¿Qué comportamiento estamos premiando vs. el que decimos querer?",
    ],
    kpis: ["Rotación regretted", "% posiciones críticas con sucesor", "Engagement"],
    conectaCon: ["05", "09", "16"],
    transformacion: "La organización deja de perder talento clave por desalineación cultural.",
  },
  "15": {
    numero: 15, key: "15",
    proposito: "Trazar la hoja de ruta de TI y transformación digital para sostener la estrategia.",
    enfoque: "Tecnología como habilitador de procesos, datos y experiencia.",
    metodologia: [
      "Mapeo de stack actual y gaps",
      "Roadmap de transformación digital 12-24 meses",
      "Modelo de gobierno de datos y ciberseguridad",
    ],
    entregables: ["Roadmap TI", "Modelo de gobierno de datos", "Plan de ciberseguridad"],
    preguntasClave: [
      "¿Qué proceso clave seguimos haciendo manual y por qué?",
      "¿Qué decisión tomamos hoy sin datos confiables?",
    ],
    kpis: ["% procesos digitalizados", "Madurez de datos", "# incidentes de seguridad"],
    conectaCon: ["09", "12_innovacion", "16"],
    transformacion: "La tecnología deja de ser costo y empieza a ser palanca de margen y velocidad.",
  },
  "16": {
    numero: 16, key: "16",
    proposito: "Diseñar el sistema de seguimiento y mejora continua del plan.",
    enfoque: "PDCA + revisión por excepción + comité estratégico.",
    metodologia: [
      "Cadencia de comités (mensual, trimestral, anual)",
      "Tableros con KPIs por eje",
      "Mecanismo de re-priorización y adaptación",
    ],
    entregables: ["Calendario de comités", "Plantilla de revisión estratégica"],
    preguntasClave: [
      "¿Cómo sabremos que la estrategia está funcionando antes de que sea tarde?",
      "¿Qué hacemos cuando un KPI clave falla 2 trimestres seguidos?",
    ],
    kpis: ["% KPIs con dueño y meta", "Tiempo medio de reacción ante desvío"],
    conectaCon: ["07", "17_cmi", "18"],
    transformacion: "El plan se vuelve un sistema vivo, no un PDF anual.",
  },
  "17_cmi": {
    numero: 17, key: "17_cmi",
    proposito: "Consolidar el Cuadro de Mando Integral como tablero ejecutivo del ciclo.",
    enfoque: "Visualización de las 4 perspectivas con semáforos y tendencias.",
    metodologia: [
      "Selección de KPIs ejecutivos (15-25)",
      "Definición de semáforos y umbrales",
      "Diseño del tablero (físico o digital)",
    ],
    entregables: ["CMI ejecutivo", "Manual de KPIs"],
    preguntasClave: [
      "¿Qué KPI miramos cada semana porque mueve la decisión?",
      "¿Qué métrica vamos a retirar del CMI por ruido?",
    ],
    kpis: ["# KPIs en verde / amarillo / rojo", "Frecuencia de actualización"],
    conectaCon: ["07", "16", "18"],
    transformacion: "La toma de decisiones del comité se basa en el mismo tablero todos los meses.",
  },
  "18_ejecucion": {
    numero: 18, key: "18_ejecucion",
    proposito: "Convertir el plan en portafolio ejecutable: iniciativas con dueño, presupuesto y dependencias.",
    enfoque: "Gestión por portafolio + OKRs + revisión trimestral.",
    metodologia: [
      "Inventario de iniciativas con scoring valor/esfuerzo",
      "Asignación de presupuesto y recursos",
      "Calendarización con dependencias e hitos",
    ],
    entregables: ["Portafolio priorizado", "Presupuesto por iniciativa", "Roadmap 12 meses"],
    preguntasClave: [
      "¿Qué 5 iniciativas, si todo lo demás falla, mueven la estrategia?",
      "¿Qué iniciativas matamos para liberar capacidad?",
    ],
    kpis: ["% iniciativas a tiempo", "% presupuesto ejecutado vs. valor entregado"],
    conectaCon: ["06", "09", "16", "17_cmi"],
    transformacion: "La estrategia se ejecuta porque alguien la lleva en la agenda cada semana.",
  },
};

export const getMarco = (key: string): MarcoSeccion | null => MARCO_PLAN[key] ?? null;
