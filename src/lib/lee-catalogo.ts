// Programa LEE — Líder Estratégico Efectivo
// Estructura general + capítulos. Catálogo profesional para guiar el workspace.

export interface CapituloLEE {
  numero: number;
  titulo: string;
  proposito: string;
  competencias: string[];
  duracion: string;
  modalidad: string;
  resultados: string[];
  workbook: WorkbookSeccion[];
}

export interface WorkbookSeccion {
  id: string;
  titulo: string;
  tipo: "reflexion" | "ejercicio" | "plan" | "diagnostico";
  descripcion: string;
  preguntas: string[];
}

export const LEE_OVERVIEW = {
  nombre: "LEE — Líder Estratégico Efectivo",
  proposito:
    "Programa de desarrollo de liderazgo de alto impacto que combina autoconocimiento, pensamiento estratégico, gestión de equipos y ejecución disciplinada para formar líderes capaces de transformar resultados.",
  duracionTotal: "12 semanas (1 capítulo por semana)",
  formato: "Sesiones quincenales (90 min) + workbook + retos de aplicación",
  certificacion: "Certificado A360 al completar 80% del programa con evidencias",
};

export const LEE_CAPITULOS: CapituloLEE[] = [
  {
    numero: 1,
    titulo: "Liderazgo consciente — el punto de partida",
    proposito:
      "Conectar al líder con su identidad, propósito y huella actual como punto de origen de la transformación.",
    competencias: ["Autoconocimiento", "Propósito personal", "Coherencia"],
    duracion: "90 min sesión + 60 min workbook",
    modalidad: "Sesión 1:1 o grupo reducido",
    resultados: [
      "Manifiesto personal de liderazgo redactado",
      "Línea base del 'liderazgo actual' identificada",
      "Compromiso público con la transformación",
    ],
    workbook: [
      {
        id: "1-1",
        titulo: "Quién soy como líder hoy",
        tipo: "reflexion",
        descripcion: "Mapeo honesto de fortalezas, sombras y huella actual.",
        preguntas: [
          "¿Qué dirían tus colaboradores que define tu estilo de liderazgo?",
          "¿Qué historia te has contado sobre 'ser líder'?",
          "¿Qué tres cosas hacen los grandes líderes que tú aún no haces?",
        ],
      },
      {
        id: "1-2",
        titulo: "Mi propósito como líder",
        tipo: "ejercicio",
        descripcion: "Construye tu declaración de propósito en formato breve.",
        preguntas: [
          "¿Para qué lideras? (no qué haces, sino para qué)",
          "¿Qué legado quieres dejar en tu organización?",
          "¿Qué cambia para tu equipo si tú lideras desde tu mejor versión?",
        ],
      },
      {
        id: "1-3",
        titulo: "Mi manifiesto de liderazgo",
        tipo: "plan",
        descripcion: "Síntesis pública: principios, promesas y estándares de comportamiento.",
        preguntas: [
          "Mis 3 principios no negociables como líder…",
          "Mis 3 promesas concretas a mi equipo en los próximos 90 días…",
          "Lo que NO toleraré más en mí mismo a partir de hoy…",
        ],
      },
    ],
  },
  { numero: 2, titulo: "Inteligencia emocional aplicada al liderazgo",
    proposito: "Desarrollar la capacidad de auto-gestión emocional y empatía como motor de relaciones efectivas.",
    competencias: ["Autoconciencia", "Autocontrol", "Empatía", "Habilidades sociales"],
    duracion: "90 min sesión + 60 min workbook", modalidad: "Sesión + retos diarios",
    resultados: ["Mapa de gatillos emocionales", "Protocolo personal de auto-regulación", "Evidencia semanal de aplicación"],
    workbook: [
      { id: "2-1", titulo: "Mis gatillos emocionales", tipo: "diagnostico", descripcion: "Identifica situaciones, personas y temas que te desregulan.",
        preguntas: ["¿Qué situaciones laborales te 'sacan de centro'?", "¿Qué emoción aparece primero: ira, miedo, frustración?", "¿Cuál es el costo organizacional de esas reacciones?"] },
      { id: "2-2", titulo: "Mi protocolo de regulación", tipo: "ejercicio", descripcion: "Define tu rutina de pausa-respira-elige-actúa.",
        preguntas: ["¿Qué señal interna te avisa que vas a reaccionar mal?", "¿Cuál es tu técnica de pausa de 30 segundos?", "¿Qué pregunta te haces para reformular antes de responder?"] },
    ],
  },
  { numero: 3, titulo: "Pensamiento estratégico y visión sistémica",
    proposito: "Pasar del operativo del día a día a la visión panorámica del negocio.",
    competencias: ["Visión sistémica", "Análisis de causa raíz", "Toma de decisiones estratégicas"],
    duracion: "90 min + 90 min workbook", modalidad: "Caso + ejercicio en vivo",
    resultados: ["Mapa sistémico del negocio", "3 decisiones estratégicas reformuladas", "Plan de delegación de lo operativo"],
    workbook: [
      { id: "3-1", titulo: "Vista de helicóptero de mi negocio", tipo: "diagnostico", descripcion: "Diagrama de actores, flujos y palancas estratégicas.",
        preguntas: ["¿Cuáles son las 3 palancas que más mueven el negocio?", "¿Qué decisiones tomo que NO debería tomar yo?", "¿Qué decisiones NO tomo y debería?"] },
    ],
  },
  { numero: 4, titulo: "Comunicación poderosa y conversaciones difíciles",
    proposito: "Dominar la conversación como herramienta de liderazgo: claridad, escucha, feedback y desafíos.",
    competencias: ["Escucha activa", "Feedback efectivo", "Manejo de conversaciones difíciles"],
    duracion: "90 min + 60 min workbook", modalidad: "Roleplay + práctica",
    resultados: ["3 conversaciones difíciles preparadas y ejecutadas", "Marco SBI dominado", "Métrica de calidad conversacional"],
    workbook: [
      { id: "4-1", titulo: "Conversación pendiente nº1", tipo: "plan", descripcion: "Diseña en detalle una conversación que vienes evitando.",
        preguntas: ["¿Con quién? ¿Qué tema?", "¿Cuál es el resultado deseado de la conversación?", "¿Qué te frena para tenerla hoy?"] },
    ],
  },
  { numero: 5, titulo: "Gestión y desarrollo de equipos de alto desempeño",
    proposito: "Construir un equipo que ejecuta sin tu micro-gestión y que se desarrolla solo.",
    competencias: ["Diagnóstico de equipo", "Delegación efectiva", "Coaching de equipo"],
    duracion: "90 min + 90 min workbook", modalidad: "Diagnóstico de equipo real",
    resultados: ["Diagnóstico de madurez del equipo", "Matriz delegación 9 cajas", "Plan de desarrollo individual top 3"],
    workbook: [
      { id: "5-1", titulo: "Diagnóstico de mi equipo", tipo: "diagnostico", descripcion: "Mapa de desempeño y potencial de cada miembro.",
        preguntas: ["¿Quiénes son mis A, B y C players?", "¿A quién no he tenido el coraje de mover?", "¿A quién estoy sub-utilizando?"] },
    ],
  },
  { numero: 6, titulo: "Toma de decisiones bajo incertidumbre",
    proposito: "Decidir con velocidad y calidad cuando no hay todos los datos.",
    competencias: ["Marco de decisión", "Gestión de riesgo", "Sesgos cognitivos"],
    duracion: "90 min + 60 min workbook", modalidad: "Casos reales del líder",
    resultados: ["Marco de decisión personal", "3 decisiones aceleradas", "Bitácora de aprendizaje"],
    workbook: [
      { id: "6-1", titulo: "Mis decisiones congeladas", tipo: "diagnostico", descripcion: "Decisiones que llevas semanas postergando.",
        preguntas: ["¿Qué decisiones tienes 'congeladas' >30 días?", "¿Qué te falta realmente para decidir?", "¿Cuál es el costo de NO decidir?"] },
    ],
  },
  { numero: 7, titulo: "Negociación y resolución de conflictos",
    proposito: "Convertir el conflicto en motor de innovación y resultados.",
    competencias: ["Negociación win-win", "Mediación", "Gestión de stakeholders"],
    duracion: "90 min + 60 min workbook", modalidad: "Roleplay con caso real",
    resultados: ["Mapa de stakeholders y conflictos", "Plan de negociación clave", "Acuerdo post-mediación documentado"],
    workbook: [
      { id: "7-1", titulo: "Mi conflicto crítico", tipo: "plan", descripcion: "Caso real para resolver en las próximas 2 semanas.",
        preguntas: ["¿Cuál es el conflicto que más energía me roba?", "¿Cuáles son los intereses reales de cada parte?", "¿Cuál es la zona común de acuerdo?"] },
    ],
  },
  { numero: 8, titulo: "Cultura organizacional y gestión del cambio",
    proposito: "Diseñar y sostener cultura como ventaja competitiva.",
    competencias: ["Diagnóstico cultural", "Gestión del cambio", "Comunicación de visión"],
    duracion: "90 min + 90 min workbook", modalidad: "Taller cultural",
    resultados: ["Diagnóstico cultural actual vs deseado", "Plan de cambio 90 días", "Rituales y símbolos definidos"],
    workbook: [
      { id: "8-1", titulo: "Cultura actual vs deseada", tipo: "diagnostico", descripcion: "¿Qué cultura tienes hoy y cuál necesitas?",
        preguntas: ["¿Qué 5 palabras describen tu cultura HOY?", "¿Qué 5 palabras describirían la cultura IDEAL?", "¿Qué rituales reforzarían la cultura ideal?"] },
    ],
  },
  { numero: 9, titulo: "Liderazgo financiero y orientación a resultados",
    proposito: "Hablar el idioma de los números y dirigir con KPIs.",
    competencias: ["Lectura financiera", "Gestión por KPIs", "Foco en resultados"],
    duracion: "90 min + 60 min workbook", modalidad: "Caso financiero del líder",
    resultados: ["Tablero de 5 KPIs vitales", "Análisis EBITDA / margen / cash", "Decisiones financieras priorizadas"],
    workbook: [
      { id: "9-1", titulo: "Mis 5 KPIs vitales", tipo: "ejercicio", descripcion: "Reduce a 5 los indicadores que mueven tu negocio.",
        preguntas: ["¿Qué 5 KPIs te dirían si tu negocio va bien o mal?", "¿Cuáles miras semanalmente?", "¿Cuál es el KPI que NO miras y deberías?"] },
    ],
  },
  { numero: 10, titulo: "Innovación, agilidad y aprendizaje continuo",
    proposito: "Crear hábitos personales y de equipo que aceleren la innovación.",
    competencias: ["Mentalidad ágil", "Experimentación", "Aprendizaje continuo"],
    duracion: "90 min + 60 min workbook", modalidad: "Diseño de experimento real",
    resultados: ["3 experimentos en marcha", "Ritual de retro mensual", "Métrica de aprendizaje"],
    workbook: [
      { id: "10-1", titulo: "Mis 3 experimentos del mes", tipo: "plan", descripcion: "Diseña pruebas pequeñas, baratas y reversibles.",
        preguntas: ["¿Qué 3 hipótesis quieres probar este mes?", "¿Cuál es el costo y el plazo de cada prueba?", "¿Cómo medirás éxito o fracaso?"] },
    ],
  },
  { numero: 11, titulo: "Marca personal y posicionamiento del líder",
    proposito: "Diseñar cómo el líder se proyecta interna y externamente.",
    competencias: ["Storytelling", "Marca personal", "Influencia"],
    duracion: "90 min + 60 min workbook", modalidad: "Trabajo de posicionamiento",
    resultados: ["Pitch personal de 30s y 2min", "Plan de visibilidad LinkedIn", "Calendario de contenido"],
    workbook: [
      { id: "11-1", titulo: "Mi narrativa de líder", tipo: "ejercicio", descripcion: "Tu historia, tu mensaje y tu voz.",
        preguntas: ["Si tuvieras 30 segundos, ¿quién dirías que eres y qué haces?", "¿Qué temas te apasionan y dominas?", "¿Qué te diferencia de otros líderes de tu sector?"] },
    ],
  },
  { numero: 12, titulo: "Plan de continuidad y proyecto de transformación",
    proposito: "Cerrar el programa con un proyecto de impacto medible y un plan de sostenibilidad.",
    competencias: ["Planificación estratégica", "Gestión de proyectos", "Sostenibilidad del cambio"],
    duracion: "120 min + 90 min workbook", modalidad: "Presentación final + sponsor",
    resultados: ["Proyecto de transformación 6 meses", "Línea de continuidad post-programa", "Compromiso público con sponsor"],
    workbook: [
      { id: "12-1", titulo: "Mi proyecto de transformación", tipo: "plan", descripcion: "Un proyecto medible que demuestre tu nuevo nivel de liderazgo.",
        preguntas: ["¿Qué problema/oportunidad de tu organización vas a resolver?", "¿Cuál es la métrica de éxito a 6 meses?", "¿Quién es tu sponsor y cómo le rendirás cuentas?"] },
    ],
  },
];

export function getCapitulo(numero: number) {
  return LEE_CAPITULOS.find((c) => c.numero === numero);
}
