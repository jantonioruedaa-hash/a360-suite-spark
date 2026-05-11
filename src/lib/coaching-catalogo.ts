// Catálogo Coaching A360 — metodología propia profundizada
// Cada herramienta es un módulo de consultoría completo, no solo un formulario.

export type EtapaA360 = "Diagnóstico" | "Activación" | "Sostenimiento" | "Transformación";

export interface EtapaInfo {
  id: EtapaA360;
  orden: number;
  color: string;
  titulo: string;
  descripcion: string;
  proposito: string;          // Para qué existe esta etapa
  duracionTipica: string;     // Tiempo esperado
  entregables: string[];      // Qué se produce
  transformacionEsperada: string; // Cambio observable en el líder
}

export const ETAPAS_A360: EtapaInfo[] = [
  {
    id: "Diagnóstico",
    orden: 1,
    color: "#7F77DD",
    titulo: "Diagnóstico — Línea base del líder",
    descripcion: "Establecemos el punto de partida: cómo lidera hoy, qué creencias lo sostienen y qué contexto enfrenta.",
    proposito:
      "Antes de transformar hay que ver con honestidad. Esta etapa rompe la auto-imagen idealizada del líder y produce datos concretos sobre su forma actual de operar, sus puntos ciegos y las fuerzas externas que lo condicionan.",
    duracionTipica: "Semana 1-2 (2 sesiones)",
    entregables: [
      "Radar inicial con 6 dimensiones medidas",
      "Mapa de las 3 creencias limitantes más activas",
      "Perfil de contexto empresarial y personal documentado",
    ],
    transformacionEsperada:
      "El líder pasa de 'sé cómo soy' a 'tengo evidencia de cómo opero'. Aparece la primera grieta de auto-consciencia.",
  },
  {
    id: "Activación",
    orden: 2,
    color: "#1D9E75",
    titulo: "Activación — Compromiso visible",
    descripcion: "Convertimos el diagnóstico en compromisos accionables y los probamos con simulaciones reales.",
    proposito:
      "El insight sin acción se evapora en 72 horas. Esta etapa fuerza la traducción del 'qué descubrí' a 'qué voy a hacer distinto el lunes a las 9am', y lo presiona con dilemas calibrados a su realidad.",
    duracionTipica: "Semana 3-5 (3 sesiones)",
    entregables: [
      "Manifiesto de liderazgo firmado en 5 dimensiones",
      "3 simulaciones de decisión con análisis de respuesta",
      "Cierre de espejo: insight + compromiso + resistencia identificada",
    ],
    transformacionEsperada:
      "El líder deja de hablar en abstracto sobre liderazgo y empieza a tomar decisiones concretas distintas. Sus colaboradores lo notan.",
  },
  {
    id: "Sostenimiento",
    orden: 3,
    color: "#BA7517",
    titulo: "Sostenimiento — Hábitos en presión",
    descripcion: "Mantenemos el momentum con pulsos breves, retos diarios y preguntas poderosas dosificadas.",
    proposito:
      "El cambio profundo no se da en la sesión: se da entre sesiones. Esta etapa instala disciplinas micro (3 min/día) que mantienen al líder consciente bajo carga operativa real.",
    duracionTipica: "Semana 6-10 (4 sesiones + check-ins semanales)",
    entregables: [
      "12 pulsos semanales registrados",
      "Reto de 7 días completado y reflexionado",
      "Bitácora de preguntas poderosas trabajadas",
    ],
    transformacionEsperada:
      "El nuevo comportamiento se vuelve reflejo. El líder se auto-corrige sin necesitar al coach presente.",
  },
  {
    id: "Transformación",
    orden: 4,
    color: "#D85A30",
    titulo: "Transformación — Delta verificado",
    descripcion: "Medimos el cambio real, lo documentamos y diseñamos el plan de continuidad de 90 días.",
    proposito:
      "El cierre no es una despedida: es la formalización del cambio. Comparamos línea base vs cierre con el mismo radar, presentamos evidencia al líder y a su sponsor, y dejamos un plan ejecutable sin coach.",
    duracionTipica: "Semana 11-12 (2 sesiones)",
    entregables: [
      "Radar de cierre con delta visual contra el inicial",
      "Plan de continuidad de 90 días por fases",
      "Reporte ejecutivo de transformación (PDF)",
    ],
    transformacionEsperada:
      "El líder posee un lenguaje propio para describir su evolución, y un plan que no depende de seguir en programa para sostenerse.",
  },
];

// ─────────────────────────────────────────────────────────
// HERRAMIENTAS — cada una es un módulo profundo
// ─────────────────────────────────────────────────────────
export interface HerramientaA360 {
  id: string;
  nombre: string;
  etapa: EtapaA360;
  tipo: "radar" | "manifiesto" | "perfil" | "creencias" | "espejo" | "simulador" | "pulso" | "reto" | "biblioteca" | "plan" | "reporte";
  duracion: string;
  descripcion: string;          // Pitch corto (1 línea)
  proposito: string;            // Para qué sirve realmente
  cuandoUsar: string;           // Momento del programa indicado
  comoAplicar: string[];        // Pasos que el coach sigue
  preguntasGuia: string[];      // Preguntas poderosas para la sesión
  ejemploReal: string;          // Caso ilustrativo (anonimizado)
  resultadoEsperado: string;    // Qué transforma en el líder
  entregable: string;           // Qué queda registrado
  tipsCoach: string[];          // Buenas prácticas
}

export const HERRAMIENTAS_A360: HerramientaA360[] = [
  // ── DIAGNÓSTICO ──────────────────────────────────────
  {
    id: "radar-lider",
    nombre: "Radar del líder",
    etapa: "Diagnóstico",
    tipo: "radar",
    duracion: "10 min",
    descripcion: "Evaluación conductual de 6 dimensiones — línea base.",
    proposito:
      "Producir el primer dato objetivo y comparable de cómo el líder se percibe HOY en seis dimensiones críticas. Es la única herramienta que se aplica dos veces (inicio y cierre) para medir delta.",
    cuandoUsar:
      "En la primera sesión, antes de cualquier conversación profunda. Establece el contrato de medición con el líder.",
    comoAplicar: [
      "Explicar las 6 dimensiones en lenguaje del líder, sin jerga.",
      "Pedir auto-evaluación de 1 a 10 en cada una, con un ejemplo concreto que justifique el número.",
      "No discutir el puntaje en esta sesión: solo registrar y devolver el promedio.",
      "Cerrar con: 'Volveremos a este radar al final del programa para ver el delta'.",
    ],
    preguntasGuia: [
      "¿Qué evidencia concreta de la última semana sustenta este puntaje?",
      "¿Si tu equipo te calificara en esta dimensión, qué te darían?",
      "¿En qué dimensión te asusta ver el resultado?",
    ],
    ejemploReal:
      "CEO de empresa familiar mediana se autocalificó 9 en Visión y 4 en Auto-consciencia. El delta entre ambas fue la entrada al trabajo de sombra: descubrió que su 'visión clara' tapaba su dificultad para escuchar disenso.",
    resultadoEsperado:
      "El líder tiene por primera vez un mapa visual de sí mismo. Aparece curiosidad o incomodidad — ambas son combustible para el programa.",
    entregable: "Gráfico radar con 6 puntajes y promedio. Se archiva como línea base.",
    tipsCoach: [
      "No interpretar los números en esta sesión. Solo registrar.",
      "Si el líder se autocalifica todo en 8-10, pedir ejemplo conductual de la última semana — usualmente baja el puntaje solo.",
      "Anotar la dimensión con menor puntaje: ahí estará el primer compromiso.",
    ],
  },
  {
    id: "mapa-creencias",
    nombre: "Mapa de creencias",
    etapa: "Diagnóstico",
    tipo: "creencias",
    duracion: "15 min",
    descripcion: "Identifica las 3 creencias limitantes más activas.",
    proposito:
      "Hacer visibles las narrativas internas que el líder repite inconscientemente y que actúan como techo de su desempeño. Sin nombrarlas, no se pueden desafiar.",
    cuandoUsar:
      "En la sesión 2, después del Radar. El radar muestra el qué, las creencias muestran el por qué.",
    comoAplicar: [
      "Pedir al líder que complete: 'Si delego, entonces…', 'Para tener éxito tengo que…', 'Un buen líder nunca…'.",
      "Escuchar las primeras respuestas (suelen ser declaraciones de manual). Repreguntar hasta llegar a la frase incómoda.",
      "Documentar 3 creencias en lenguaje del propio líder, no traducido.",
      "Validar con: '¿Esta creencia te ha servido hasta hoy? ¿Y para llegar al siguiente nivel, te sirve?'",
    ],
    preguntasGuia: [
      "¿Qué te repites cuando algo sale mal en tu equipo?",
      "¿Qué crees que pasaría si dejaras de controlar X?",
      "¿De quién aprendiste esta forma de liderar?",
    ],
    ejemploReal:
      "Director comercial: 'Si no estoy en cada cierre, el cliente se cae'. Esta creencia explicaba 80 horas/semana y 0 segundos de equipo. Nombrarla fue el primer paso para construir el segundo cinturón comercial.",
    resultadoEsperado:
      "El líder ve sus propias creencias como objetos sobre la mesa, no como verdades. A partir de aquí pueden ser cuestionadas.",
    entregable: "3 creencias limitantes documentadas en su lenguaje original.",
    tipsCoach: [
      "Nunca contradecir la creencia en esta sesión. Solo nombrarla.",
      "Si el líder se resiste a nombrar una, ofrecer una hipótesis: '¿Podría ser algo así como…?'",
      "Las creencias se trabajan en Activación, no aquí.",
    ],
  },
  {
    id: "perfil-contexto",
    nombre: "Perfil de contexto",
    etapa: "Diagnóstico",
    tipo: "perfil",
    duracion: "8 min",
    descripcion: "Captura el contexto empresarial y personal.",
    proposito:
      "Entender las fuerzas externas que condicionan al líder: industria, momento del negocio, sponsor, carga personal. Sin contexto, el coaching se vuelve genérico.",
    cuandoUsar:
      "En la sesión 1, idealmente antes del radar. Permite al coach calibrar todo lo que viene.",
    comoAplicar: [
      "Mapa de stakeholders clave (sponsor, jefe, pares, equipo directo).",
      "Momento del negocio: crecimiento, consolidación, crisis, transición.",
      "Carga personal relevante (familia, salud, transiciones).",
      "Resultado esperado del programa por parte del sponsor.",
    ],
    preguntasGuia: [
      "¿Quién pagó este coaching y qué espera ver al final?",
      "¿Qué cambió en el negocio en los últimos 6 meses?",
      "¿Qué de tu vida personal está afectando hoy tu liderazgo?",
    ],
    ejemploReal:
      "Líder que lucía estable en sesión venía de divorcio reciente y fusión empresarial. Sin ese contexto, las dificultades de foco se hubieran leído como falta de disciplina.",
    resultadoEsperado:
      "El coach tiene un mapa para no caer en consejos genéricos. El líder se siente visto en su realidad completa.",
    entregable: "Documento de contexto archivado y revisado en cada sesión.",
    tipsCoach: [
      "Confidencialidad explícita sobre lo personal antes de preguntar.",
      "Anotar al sponsor: el reporte final habla su idioma.",
    ],
  },

  // ── ACTIVACIÓN ───────────────────────────────────────
  {
    id: "manifiesto",
    nombre: "Manifiesto del líder",
    etapa: "Activación",
    tipo: "manifiesto",
    duracion: "30 min",
    descripcion: "5 dimensiones de liderazgo con compromiso accionable.",
    proposito:
      "Forzar al líder a declarar por escrito y con verbos de acción cómo va a operar distinto en cada dimensión clave. Es el contrato consigo mismo que se firma frente al coach.",
    cuandoUsar:
      "Sesión 3 del programa, después de tener radar + creencias mapeadas.",
    comoAplicar: [
      "Por cada dimensión (Visión, Decisión, Influencia, Ejecución, Resiliencia) pedir un compromiso conductual concreto.",
      "Rechazar formulaciones abstractas: 'voy a comunicar mejor' no se acepta. Sí: 'cada lunes 8am, 15 min con cada reporte directo'.",
      "Probar cada compromiso con: '¿Es observable por alguien más? ¿Es medible esta semana?'",
      "El líder firma (físico o digital) el manifiesto. Se imprime y queda visible.",
    ],
    preguntasGuia: [
      "Si tu equipo viera este compromiso, ¿podría decirte el viernes si lo cumpliste?",
      "¿Qué tendrías que dejar de hacer para hacer espacio a esto?",
      "¿Quién será tu testigo de que esto pasa?",
    ],
    ejemploReal:
      "CFO escribió: 'Decisiones bajo incertidumbre — antes de decir no a una propuesta, daré 24h de revisión real con dato'. En 3 meses, el equipo presentó 4x más iniciativas de las que solían atreverse a llevarle.",
    resultadoEsperado:
      "El líder se ve a sí mismo como autor de un nuevo modelo, no víctima de su estilo. Aparece sentido de agencia.",
    entregable: "Manifiesto firmado en 5 dimensiones, con compromisos verificables.",
    tipsCoach: [
      "Si un compromiso es genérico, devolverlo. No firmar manifiestos vagos.",
      "Pedir que lo comparta con su sponsor o pareja como mecanismo de testigo.",
    ],
  },
  {
    id: "simulador",
    nombre: "Simulador de decisiones",
    etapa: "Activación",
    tipo: "simulador",
    duracion: "20 min",
    descripcion: "Dilemas reales calibrados al perfil del líder.",
    proposito:
      "Probar el manifiesto bajo presión simulada. Plantear dilemas que activan exactamente las creencias limitantes mapeadas y observar qué hace el líder.",
    cuandoUsar:
      "Sesión 4-5, después de manifiesto firmado. Idealmente uno por sesión durante 3 sesiones.",
    comoAplicar: [
      "Diseñar 1 dilema corto basado en la creencia limitante #1 del líder.",
      "Plantear como caso real: 'Es martes 3pm, recibes este mensaje de tu director comercial…'.",
      "Pedir respuesta inmediata sin justificación, luego pedir justificación.",
      "Devolver: '¿Esta respuesta es coherente con tu manifiesto?'",
    ],
    preguntasGuia: [
      "¿Qué emoción te movió a esa primera respuesta?",
      "¿Qué hubiera hecho el líder de tu manifiesto?",
      "¿Qué información te faltaba y por qué no la pediste?",
    ],
    ejemploReal:
      "Director de operaciones con creencia 'tengo que tener la respuesta inmediata' fue puesto frente a dilema de despido. Respondió en 4 segundos. Ver la grabación de su propia respuesta fue más potente que cualquier feedback verbal.",
    resultadoEsperado:
      "El líder confronta la distancia entre lo que declara y lo que hace bajo presión. Esa distancia es el verdadero trabajo.",
    entregable: "Bitácora de dilemas con respuestas y aprendizajes.",
    tipsCoach: [
      "Usar dilemas de su industria, no genéricos.",
      "Si responde 'depende', presionar con: 'Tienes 30 segundos, decide'.",
    ],
  },
  {
    id: "espejo",
    nombre: "Espejo de liderazgo",
    etapa: "Activación",
    tipo: "espejo",
    duracion: "15 min",
    descripcion: "Cierre de sesión: insight, compromiso y resistencia.",
    proposito:
      "Estructurar el cierre de cada sesión de Activación con tres preguntas no negociables. Sin espejo, la sesión se diluye.",
    cuandoUsar:
      "Últimos 15 min de cada sesión de Activación y Sostenimiento.",
    comoAplicar: [
      "Insight: '¿Qué viste hoy que no veías al entrar?'",
      "Compromiso: '¿Qué harás distinto antes de la próxima sesión, observable?'",
      "Resistencia: '¿Qué podría sabotearte? ¿Cómo lo neutralizas?'",
    ],
    preguntasGuia: [
      "Si solo te llevaras una frase de hoy, ¿cuál sería?",
      "¿Qué parte de ti se va a oponer a este compromiso?",
      "¿Cuándo exactamente harás esto?",
    ],
    ejemploReal:
      "Líder cerró 6 sesiones con la misma resistencia: 'me va a faltar tiempo'. Eso reveló el verdadero trabajo, que no era de tiempo sino de prioridad.",
    resultadoEsperado:
      "El líder sale de cada sesión con claridad accionable, no con buena energía vaga.",
    entregable: "3 frases por sesión: insight, compromiso, resistencia.",
    tipsCoach: [
      "Nunca saltarse el espejo aunque la sesión se haya alargado.",
      "Si la resistencia se repite 3 sesiones, abrirla como tema central.",
    ],
  },

  // ── SOSTENIMIENTO ────────────────────────────────────
  {
    id: "pulso-semanal",
    nombre: "Pulso semanal",
    etapa: "Sostenimiento",
    tipo: "pulso",
    duracion: "3 min",
    descripcion: "Check-in breve para detectar momentum y bloqueos.",
    proposito:
      "Mantener al líder en contacto consigo mismo entre sesiones, sin sobrecargarlo. Tres minutos disciplinados valen más que 60 desordenados.",
    cuandoUsar:
      "Cada lunes 8am durante toda la etapa de Sostenimiento (4-6 semanas).",
    comoAplicar: [
      "El líder responde 4 preguntas en menos de 3 min, idealmente por móvil.",
      "Energía 1-10 / Foco 1-10 / Mayor logro de la semana / Mayor obstáculo.",
      "El coach revisa los pulsos antes de la siguiente sesión y los usa para calibrarla.",
    ],
    preguntasGuia: [
      "¿Tu energía es de empuje o de inercia?",
      "¿El obstáculo es externo o interno?",
      "¿Qué del manifiesto se activó esta semana?",
    ],
    ejemploReal:
      "Patrón de 4 pulsos consecutivos con energía 4 y obstáculo 'reuniones' detonó rediseño de su agenda — 12 horas/semana liberadas.",
    resultadoEsperado:
      "El líder construye su propio sistema de auto-monitoreo y empieza a leer patrones en sí mismo.",
    entregable: "Serie de pulsos visualizable como tendencia de energía y foco.",
    tipsCoach: [
      "Si 2 semanas seguidas no hay pulso, llamar — no esperar a la sesión.",
      "Patrones >3 pulsos son material de conversación, eventos aislados no.",
    ],
  },
  {
    id: "reto-7-dias",
    nombre: "Reto de 7 días",
    etapa: "Sostenimiento",
    tipo: "reto",
    duracion: "15 min/día",
    descripcion: "Un reto de liderazgo por día durante 7 días.",
    proposito:
      "Forzar repetición consciente de un comportamiento clave hasta que se vuelva familiar. La repetición es lo único que cambia un patrón.",
    cuandoUsar:
      "Una vez en Sostenimiento, alrededor de la semana 7-8.",
    comoAplicar: [
      "Elegir 1 dimensión del manifiesto donde el líder está más débil.",
      "Diseñar 7 micro-retos diarios escalonados (más simple a más exigente).",
      "Cada noche: 5 min de reflexión escrita sobre qué pasó.",
      "Día 8: revisión conjunta del aprendizaje agregado.",
    ],
    preguntasGuia: [
      "¿Qué reto te dio más resistencia? ¿Por qué?",
      "¿Qué descubriste de ti que no sabías?",
      "¿Cuál de estos 7 retos vas a sostener?",
    ],
    ejemploReal:
      "Reto de 7 días de 'no responder ningún email antes de 9am' reveló a un CEO su adicción a la urgencia ajena. Cambió el ritmo de toda su organización.",
    resultadoEsperado:
      "El líder gana evidencia experiencial — no teórica — de que puede operar distinto.",
    entregable: "Bitácora diaria con 7 reflexiones y un aprendizaje agregado.",
    tipsCoach: [
      "Diseñar retos pequeños y verificables, no épicos.",
      "Si falla un día, no reiniciar — continuar y reflexionar el fallo.",
    ],
  },
  {
    id: "biblioteca",
    nombre: "Biblioteca de preguntas poderosas",
    etapa: "Sostenimiento",
    tipo: "biblioteca",
    duracion: "Libre",
    descripcion: "70+ preguntas poderosas organizadas por dimensión.",
    proposito:
      "Repertorio de preguntas que el líder puede usar en su propio equipo y el coach puede dosificar a lo largo del programa. Una pregunta poderosa puede mover más que una hora de consejo.",
    cuandoUsar:
      "Como recurso permanente del coach y como entregable al líder al cierre.",
    comoAplicar: [
      "Coach selecciona 1-2 preguntas por sesión calibradas al momento del líder.",
      "Líder recibe el catálogo completo al cierre como herramienta para usar con su equipo.",
    ],
    preguntasGuia: [
      "¿Qué pregunta no te has atrevido a hacerle a tu equipo?",
      "¿Qué cambiaría si hicieras esta pregunta el lunes?",
    ],
    ejemploReal:
      "Pregunta 'Si yo no estuviera, ¿qué decisión tomarías hoy?' usada 3 veces por un líder en su comité, cambió la postura del equipo en 2 meses.",
    resultadoEsperado:
      "El líder hereda no solo aprendizajes sino una caja de herramientas conversacional.",
    entregable: "Catálogo digital de 70+ preguntas por dimensión.",
    tipsCoach: [
      "No abrumar: una pregunta por sesión es suficiente.",
      "Anotar cuál pregunta movió al líder — es señal de su zona viva.",
    ],
  },

  // ── TRANSFORMACIÓN ───────────────────────────────────
  {
    id: "radar-cierre",
    nombre: "Radar de cierre",
    etapa: "Transformación",
    tipo: "radar",
    duracion: "10 min",
    descripcion: "Mide el delta de transformación real.",
    proposito:
      "Aplicar exactamente el mismo radar del inicio para producir un delta visible y comparable. Es el dato que sostiene el reporte ejecutivo.",
    cuandoUsar:
      "Penúltima sesión del programa.",
    comoAplicar: [
      "Mismas 6 dimensiones, misma escala.",
      "El líder NO ve su radar inicial antes de calificarse.",
      "Tras calificar, mostrar inicial vs cierre y conversar el delta — positivo o negativo.",
    ],
    preguntasGuia: [
      "¿Dónde el cambio te sorprende?",
      "¿Dónde no cambiaste y por qué?",
      "¿Qué evidencia conductual sustenta este nuevo puntaje?",
    ],
    ejemploReal:
      "Líder subió de 4 a 7 en Auto-consciencia y bajó de 9 a 7 en Visión. Bajar fue señal de mayor honestidad, no retroceso.",
    resultadoEsperado:
      "El líder posee evidencia gráfica de su evolución, comparable y defendible frente a su sponsor.",
    entregable: "Radar comparativo inicial vs cierre con cálculo de delta.",
    tipsCoach: [
      "Bajadas en cierre suelen ser madurez (calibra mejor), no retroceso.",
      "Foco de la conversación en la dimensión de mayor cambio.",
    ],
  },
  {
    id: "plan-continuidad",
    nombre: "Plan de continuidad 90 días",
    etapa: "Transformación",
    tipo: "plan",
    duracion: "20 min",
    descripcion: "Plan post-programa con hitos verificables.",
    proposito:
      "Garantizar que el cambio no se erosione cuando el coach se retira. Cuatro fases progresivas con un hito claro por fase.",
    cuandoUsar:
      "Última sesión del programa.",
    comoAplicar: [
      "Por cada una de las 4 fases del plan (Sem 1-2, Sem 3-4, Mes 2, Mes 3) definir 1 hito observable.",
      "Asignar testigo (sponsor, par, pareja) para cada fase.",
      "Calendario de auto-revisión cada 21 días.",
    ],
    preguntasGuia: [
      "¿Qué de lo aprendido es más frágil sin coach?",
      "¿Quién te va a recordar el manifiesto en 60 días?",
      "¿Qué señal te dirá que estás recayendo?",
    ],
    ejemploReal:
      "Plan que incluyó 'compartir el manifiesto con mi pareja y enviarle status mensual' fue lo que sostuvo el cambio 9 meses después.",
    resultadoEsperado:
      "El líder sale con un plan ejecutable sin necesidad del coach, con testigos y métricas propias.",
    entregable: "Plan de 4 fases con hitos, testigos y fechas.",
    tipsCoach: [
      "Si el plan no tiene testigos externos, devolverlo: la disciplina solitaria suele fallar.",
    ],
  },
  {
    id: "reporte-final",
    nombre: "Reporte de transformación",
    etapa: "Transformación",
    tipo: "reporte",
    duracion: "Auto",
    descripcion: "Reporte ejecutivo con todos los datos del programa.",
    proposito:
      "Documento entregable al líder y al sponsor que sintetiza línea base, proceso y delta. Es el activo institucional del programa.",
    cuandoUsar:
      "Generado al cierre, presentado en sesión final con sponsor.",
    comoAplicar: [
      "Compilación automática: radar inicial + cierre, manifiesto, simulaciones, pulsos, plan de continuidad.",
      "Resumen narrativo del coach: 1 página de transformación observada.",
      "Recomendaciones para el líder y para la organización.",
    ],
    preguntasGuia: [
      "¿Qué de este reporte querrías que tu sponsor entienda primero?",
      "¿Qué dejarías por fuera y por qué?",
    ],
    ejemploReal:
      "Reporte presentado a junta directiva fue el insumo para definir su sucesión 6 meses después.",
    resultadoEsperado:
      "El programa tiene cierre formal con evidencia. Líder y sponsor conversan sobre datos, no sobre impresiones.",
    entregable: "PDF ejecutivo de 4-6 páginas, compartible.",
    tipsCoach: [
      "Revisar con el líder antes de enviar al sponsor: él decide qué se comparte.",
    ],
  },
];

// 6 dimensiones del Radar
export const RADAR_DIMENSIONES = [
  { id: "vision",       nombre: "Visión estratégica",  descripcion: "Capacidad de proyectar a largo plazo y conectar decisiones diarias con dirección." },
  { id: "decision",     nombre: "Toma de decisión",    descripcion: "Velocidad y calidad bajo incertidumbre, sin parálisis ni impulsividad." },
  { id: "influencia",   nombre: "Influencia",          descripcion: "Capacidad de movilizar a otros sin recurrir a autoridad formal." },
  { id: "ejecucion",    nombre: "Ejecución",           descripcion: "Disciplina para entregar resultados consistentes y cerrar bucles." },
  { id: "resiliencia",  nombre: "Resiliencia",         descripcion: "Manejo de presión, adversidad y recuperación tras fracaso." },
  { id: "consciencia",  nombre: "Auto-consciencia",    descripcion: "Conocimiento honesto de fortalezas, sombras e impacto en otros." },
];

// 4 fases Plan de Continuidad
export const PLAN_CONTINUIDAD_FASES = [
  { id: "s1", label: "Semanas 1-2", titulo: "Consolidación inmediata", desc: "Aplica los 3 aprendizajes más importantes en decisiones reales esta semana." },
  { id: "s2", label: "Semanas 3-4", titulo: "Instalación de hábitos",  desc: "Convierte los compromisos en rutinas semanales de liderazgo visibles para tu equipo." },
  { id: "s3", label: "Mes 2",       titulo: "Expansión al equipo",     desc: "Comparte con tu equipo al menos un aprendizaje y cómo cambiará tu liderazgo." },
  { id: "s4", label: "Mes 3",       titulo: "Evaluación y ajuste",     desc: "Revisa el delta entre Radar inicial y de cierre. Define los próximos 90 días." },
];

// Catálogo de preguntas poderosas por dimensión (extracto)
export const PREGUNTAS_POR_DIMENSION: Record<string, string[]> = {
  vision: [
    "Si tuvieras que renunciar a 2 prioridades, ¿cuáles serían y por qué?",
    "¿Qué decisión de hoy te avergonzaría dentro de 3 años?",
    "¿Tu visión es tuya o heredada?",
    "¿Dónde estarás dentro de 5 años si NO cambias nada?",
  ],
  decision: [
    "¿Qué información te falta para decidir, y por qué no la has buscado?",
    "Si tuvieras 30 segundos, ¿qué decidirías?",
    "¿Qué decides por miedo y qué decides por estrategia?",
    "¿Cuál fue tu última decisión que sorprendió a alguien que te conoce?",
  ],
  influencia: [
    "¿Quién te dice que NO en tu organización? ¿Por qué tan pocos?",
    "¿Qué tendrías que dejar de hacer para que tu equipo crezca?",
    "Si no tuvieras tu cargo, ¿te seguirían?",
    "¿Cuándo fue la última vez que cambiaste de opinión por alguien de tu equipo?",
  ],
  ejecucion: [
    "¿Qué proyecto llevas más de 90 días sin cerrar y por qué?",
    "¿Qué bucle abierto te roba energía sin que lo notes?",
    "¿Tu equipo sabe qué es 'terminado' para ti?",
    "¿Qué dejarías de hacer si supieras que nadie lo notaría?",
  ],
  resiliencia: [
    "¿Cuál es tu reserva de energía hoy de 1 a 10?",
    "¿De qué fracaso aún no te has recuperado del todo?",
    "¿Quién sostiene tu peso emocional? ¿Lo sabe?",
    "¿Qué hábito te recarga y cuándo dejaste de practicarlo?",
  ],
  consciencia: [
    "¿Qué dirían de ti tus colaboradores si supieran que no escuchas?",
    "¿Qué patrón se repite en tus equipos sin importar dónde estés?",
    "¿Qué emoción tuya incomoda a otros sin que lo notes?",
    "¿Cuál es tu punto ciego favorito?",
  ],
};

// Helpers
export const HERRAMIENTAS_POR_ETAPA = (etapa: EtapaA360) =>
  HERRAMIENTAS_A360.filter((h) => h.etapa === etapa);

export const getHerramienta = (id: string) => HERRAMIENTAS_A360.find((h) => h.id === id);

export const getEtapa = (id: EtapaA360) => ETAPAS_A360.find((e) => e.id === id);
