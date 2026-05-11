// ════════════════════════════════════════════════════════════════════
// Bancos precargados para instrumentar las herramientas A360
// Equivalente a lo que SIDE/PESTEL/FODA hacen para el ala estratégica.
// ════════════════════════════════════════════════════════════════════

// ─── 1. CREENCIAS LIMITANTES FRECUENTES EN DIRECTIVOS ───────────────
export interface CreenciaCatalogo {
  id: string;
  texto: string;
  categoria: "control" | "perfeccion" | "exigencia" | "aprobacion" | "vulnerabilidad" | "urgencia";
  costoTipico: string;
  reformulacionSugerida: string;
}

export const CREENCIAS_FRECUENTES: CreenciaCatalogo[] = [
  { id: "c1", texto: "Si delego, pierdo control y algo va a fallar.", categoria: "control",
    costoTipico: "Cuello de botella, equipo desempoderado, 70+ hrs/semana.",
    reformulacionSugerida: "Delegar es multiplicar. Mi rol es elevar criterio, no ejecutar tareas." },
  { id: "c2", texto: "Tengo que tener la respuesta inmediata para mantener autoridad.", categoria: "urgencia",
    costoTipico: "Decisiones impulsivas, equipo no piensa, errores costosos.",
    reformulacionSugerida: "Decir 'déjame pensarlo 24h' es señal de madurez, no debilidad." },
  { id: "c3", texto: "Si muestro duda, pierdo credibilidad.", categoria: "vulnerabilidad",
    costoTipico: "Aislamiento, no pide ayuda, decisiones sin contraste.",
    reformulacionSugerida: "La vulnerabilidad bien dosificada construye confianza, no la destruye." },
  { id: "c4", texto: "Un buen líder nunca debería estar cansado/agotado.", categoria: "exigencia",
    costoTipico: "Burnout, irritabilidad crónica, salud comprometida.",
    reformulacionSugerida: "La energía es un activo estratégico que se gestiona, no un signo de debilidad." },
  { id: "c5", texto: "Si no estoy en cada decisión importante, me hacen a un lado.", categoria: "control",
    costoTipico: "Reuniones eternas, equipo paralizado sin mi presencia.",
    reformulacionSugerida: "Mi valor es construir gente que decida bien sin mí." },
  { id: "c6", texto: "Tengo que ser el más inteligente de la sala.", categoria: "aprobacion",
    costoTipico: "Equipo no contradice, ideas mediocres, se va el talento.",
    reformulacionSugerida: "Mi trabajo es traer al mejor pensamiento del equipo, no demostrar el mío." },
  { id: "c7", texto: "Si todo no está perfecto, mejor no lanzarlo.", categoria: "perfeccion",
    costoTipico: "Velocidad cero, oportunidades perdidas, frustración del equipo.",
    reformulacionSugerida: "80% bien lanzado vence a 100% perfecto guardado." },
  { id: "c8", texto: "Si pido ayuda van a pensar que no puedo solo.", categoria: "vulnerabilidad",
    costoTipico: "Sobrecarga, errores evitables, soledad directiva.",
    reformulacionSugerida: "Pedir ayuda es delegar correctamente, no rendirse." },
  { id: "c9", texto: "El conflicto es señal de que algo está mal en el equipo.", categoria: "aprobacion",
    costoTipico: "Decisiones tibias, problemas tapados, mediocridad acomodada.",
    reformulacionSugerida: "El conflicto productivo es el músculo de un equipo de alto desempeño." },
  { id: "c10", texto: "Si soy estricto con resultados, pierdo a la gente.", categoria: "aprobacion",
    costoTipico: "Bajo estándar, bajos resultados, se va la gente buena igual.",
    reformulacionSugerida: "Exigencia con cuidado humano es lo que la gente buena más respeta." },
  { id: "c11", texto: "Sin mí, esto se cae.", categoria: "control",
    costoTipico: "No vacaciones, ningún sucesor, riesgo de continuidad para la empresa.",
    reformulacionSugerida: "Si esto se cae sin mí, mi trabajo es construir que no se caiga, no estar siempre." },
  { id: "c12", texto: "Mostrar emociones en el trabajo es poco profesional.", categoria: "vulnerabilidad",
    costoTipico: "Equipo no se conecta, baja motivación, no leen al líder.",
    reformulacionSugerida: "Las emociones son data sobre lo que importa. Negarlas no las apaga." },
  { id: "c13", texto: "Si bajo el ritmo, se nota y me reemplazan.", categoria: "urgencia",
    costoTipico: "Ritmo insostenible, errores por agotamiento, salud.",
    reformulacionSugerida: "Mi reemplazabilidad es señal de que construí bien, no de que sobré." },
  { id: "c14", texto: "Tengo que arreglar los problemas yo, así nadie sufra.", categoria: "control",
    costoTipico: "Equipo no aprende a resolver, dependen 100% de mí.",
    reformulacionSugerida: "Si los protejo del problema, los aíslo del aprendizaje." },
  { id: "c15", texto: "El error de mi equipo es mi error como líder.", categoria: "exigencia",
    costoTipico: "Microgestión, miedo del equipo a fallar, no innovan.",
    reformulacionSugerida: "Mi error es no haber creado las condiciones; el suyo es suyo." },
  { id: "c16", texto: "Solo hablo cuando tengo la idea ya pulida.", categoria: "perfeccion",
    costoTipico: "Conversaciones tarde, oportunidades perdidas, desconexión.",
    reformulacionSugerida: "Las ideas a medias en voz alta valen más que las perfectas en silencio." },
  { id: "c17", texto: "Si me retiro un poco, otros van a aprovecharse.", categoria: "control",
    costoTipico: "Hipervigilancia, política, desconfianza generalizada.",
    reformulacionSugerida: "Soltar es la prueba de cuál confianza era real." },
  { id: "c18", texto: "Si soy demasiado humano, dejan de respetarme.", categoria: "vulnerabilidad",
    costoTipico: "Distancia emocional, equipo no se compromete profundo.",
    reformulacionSugerida: "Lo que más se respeta es la consistencia, no la dureza." },
];

export const CATEGORIAS_CREENCIAS = [
  { id: "control", nombre: "Necesidad de control", color: "#7F77DD" },
  { id: "perfeccion", nombre: "Perfeccionismo", color: "#1D9E75" },
  { id: "exigencia", nombre: "Auto-exigencia", color: "#BA7517" },
  { id: "aprobacion", nombre: "Búsqueda de aprobación", color: "#D85A30" },
  { id: "vulnerabilidad", nombre: "Miedo a la vulnerabilidad", color: "#5B9BD5" },
  { id: "urgencia", nombre: "Adicción a la urgencia", color: "#A04668" },
];

// ─── 2. SIMULADOR — DILEMAS REALES ──────────────────────────────────
export interface DilemaCatalogo {
  id: string;
  titulo: string;
  contexto: string;
  dilema: string;
  categoria: "personas" | "decision-rapida" | "etica" | "delegacion" | "conflicto" | "sponsor";
  presionTiempo: "alta" | "media" | "baja";
  rubricaIdeal: string;
  trampaTipica: string;
  cargosAplicables: string[];
}

export const DILEMAS_BANCO: DilemaCatalogo[] = [
  {
    id: "d1",
    titulo: "Director comercial pide despedir a su mejor vendedor",
    contexto: "Tu director comercial entra a tu oficina visiblemente molesto. Te dice que descubrió que su top performer (45% de la cuota anual) ha estado pagando comisiones extra a un comprador clave para cerrar.",
    dilema: "Tienes 5 minutos antes de tu siguiente reunión. ¿Qué decides AHORA y qué dejas para después?",
    categoria: "etica",
    presionTiempo: "alta",
    rubricaIdeal: "Separar la urgencia (parar la conducta) de la decisión final (despido). Pedir 24h, blindar el caso con HR/legal, escuchar al vendedor, decidir con cabeza fría.",
    trampaTipica: "Decidir el despido en caliente o defender al vendedor por el resultado.",
    cargosAplicables: ["CEO", "Director Comercial", "Director General"],
  },
  {
    id: "d2",
    titulo: "Tu sponsor te pide algo que no compartes",
    contexto: "El sponsor de tu programa (presidente del consejo) te pide en privado que ejecutes un recorte del 15% en operaciones, que tú sabes que va a destruir la calidad del servicio y que no fue discutido en comité.",
    dilema: "Te pide respuesta esta misma semana. ¿Cómo te plantas?",
    categoria: "sponsor",
    presionTiempo: "media",
    rubricaIdeal: "No decir sí ni no en frío. Pedir: '¿Qué problema estamos resolviendo realmente?' Construir 2-3 alternativas y devolver con datos. Si insiste sin diálogo, escalar al comité.",
    trampaTipica: "Decir 'sí, jefe' por miedo o decir 'no' sin construir alternativa.",
    cargosAplicables: ["CEO", "Director General", "VP"],
  },
  {
    id: "d3",
    titulo: "Tu equipo directo no se está hablando",
    contexto: "En la última reunión de comité notaste que dos de tus reportes directos no se miraron a la cara. Sabes que hay un conflicto soterrado de meses por presupuesto.",
    dilema: "¿Lo abres en la próxima reunión, los citas por separado, o esperas a que se arregle solo?",
    categoria: "conflicto",
    presionTiempo: "baja",
    rubricaIdeal: "Citarlos juntos, nombrar lo observado sin acusar, pedirles que resuelvan ellos con un plazo. Si no, intervenir con criterios. Nunca esperar 'que se arregle solo'.",
    trampaTipica: "Esperar / hablar por separado y avivar la división / regañar en público.",
    cargosAplicables: ["Todos"],
  },
  {
    id: "d4",
    titulo: "Decisión de inversión sin información completa",
    contexto: "Tienes que decidir hoy si entras a un mercado nuevo con una inversión de USD 2M. El equipo te trajo un análisis con datos incompletos pero la oportunidad cierra el viernes.",
    dilema: "30 segundos para responder: ¿adelante, atrás, o pides más data?",
    categoria: "decision-rapida",
    presionTiempo: "alta",
    rubricaIdeal: "Identificar las 2-3 incógnitas críticas, ver si se pueden responder en 48h, decidir con la información mínima viable. Aceptar el riesgo conscientemente.",
    trampaTipica: "Parálisis por análisis o decisión impulsiva por la urgencia.",
    cargosAplicables: ["CEO", "CFO", "Director Comercial"],
  },
  {
    id: "d5",
    titulo: "Un colaborador clave amenaza con renunciar",
    contexto: "Tu mejor gerente de proyecto te dice 'necesito hablar contigo' y por su cara entiendes que viene a renunciar. Sabes que recibió oferta de la competencia.",
    dilema: "¿Compites con plata, abres conversación profunda o lo dejas ir?",
    categoria: "personas",
    presionTiempo: "media",
    rubricaIdeal: "Primero escuchar 30 min sin contraofertar. Entender la verdadera razón (rara vez es solo dinero). Decidir si la solución es retención, evolución o despedida con dignidad.",
    trampaTipica: "Igualar oferta sin entender el problema real, o tomarlo personal.",
    cargosAplicables: ["Todos"],
  },
  {
    id: "d6",
    titulo: "Tu equipo te oculta un problema",
    contexto: "Te enteras por un cliente de un problema serio en producción que tu equipo conoce desde hace 2 semanas y no te informó.",
    dilema: "¿Qué haces en las primeras 48h: con el cliente, con el equipo, contigo mismo?",
    categoria: "personas",
    presionTiempo: "alta",
    rubricaIdeal: "Cliente: respuesta directa con plan. Equipo: conversación de qué pasó (no por qué me ocultaron, sino qué clima creé yo para que no me dijeran). Contigo: revisar tu reactividad histórica.",
    trampaTipica: "Caer en regaño público y reforzar la cultura del silencio.",
    cargosAplicables: ["Todos"],
  },
  {
    id: "d7",
    titulo: "Hay que despedir gente y no tienes criterio claro",
    contexto: "El consejo aprobó un recorte del 12%. Tienes 3 semanas para definir nombres en tu área de 80 personas.",
    dilema: "¿Por dónde empiezas? ¿Quién decide? ¿Cómo lo comunicas?",
    categoria: "personas",
    presionTiempo: "media",
    rubricaIdeal: "Criterios primero (desempeño, criticidad de rol, costo). Decidir tú con tus líderes, no delegar. Comunicar individual antes que masivo. Cuidar al que se queda tanto como al que se va.",
    trampaTipica: "Delegar la decisión a HR o pedir 'una lista' sin criterios.",
    cargosAplicables: ["Director General", "VP", "Gerente de Área"],
  },
  {
    id: "d8",
    titulo: "Pareja de un colaborador te llama por una crisis",
    contexto: "La pareja de un colaborador clave te llama un viernes 8pm: lleva 3 semanas durmiendo 4 horas, está con ansiedad fuerte, no aguanta más.",
    dilema: "¿Qué haces tú, qué le dices el lunes a tu colaborador, qué cambias?",
    categoria: "personas",
    presionTiempo: "media",
    rubricaIdeal: "Validar la llamada, no prometer nada. Lunes: conversación franca, no ocultar la llamada, ofrecer pausa real. Revisar tu propio rol en la sobrecarga.",
    trampaTipica: "Ignorarlo o sobreactuar paternalista.",
    cargosAplicables: ["Todos"],
  },
  {
    id: "d9",
    titulo: "Te equivocaste en una decisión pública",
    contexto: "Hace 3 meses defendiste públicamente una decisión que hoy es claro que fue un error. El equipo lo sabe pero nadie lo dice.",
    dilema: "¿Lo nombras tú, esperas, lo justificas como aprendizaje?",
    categoria: "personas",
    presionTiempo: "baja",
    rubricaIdeal: "Nombrarlo en el siguiente comité con dato, sin drama. 'Me equivoqué en X. Corregimos así.' Modela cultura de error sano.",
    trampaTipica: "Justificar como 'circunstancias cambiaron', tapar, o sobre-disculparse.",
    cargosAplicables: ["Todos"],
  },
  {
    id: "d10",
    titulo: "Delegación que no cuaja",
    contexto: "Hace 2 meses delegaste un proyecto importante a un gerente con potencial. Va atrasado, la calidad es regular y empiezas a meter mano.",
    dilema: "¿Lo retomas tú, lo dejas fallar, lo coacheas más, lo cambias de proyecto?",
    categoria: "delegacion",
    presionTiempo: "media",
    rubricaIdeal: "Conversación 1:1 honesta: 'esto no va, ¿qué necesitas?'. Definir hito a 2 semanas. Si no avanza, cambio de manos sin drama. No retomar tú = perpetúa el problema.",
    trampaTipica: "Retomar en silencio (lo desempodera más) o dejar fallar para tener excusa.",
    cargosAplicables: ["Todos"],
  },
  {
    id: "d11",
    titulo: "Un par tuyo te pasa por encima",
    contexto: "Un VP par te 'olvidó' invitar a una decisión que afectaba directamente a tu área. Te enteras post-decisión.",
    dilema: "¿Lo confrontas privado, lo escalas al CEO, lo dejas pasar para no entrar en política?",
    categoria: "conflicto",
    presionTiempo: "media",
    rubricaIdeal: "Privado primero, directo y sin aliados políticos. 'Esto no debe repetirse, así operamos a partir de ahora'. Documentar. Si se repite, escalar con datos, no con tono personal.",
    trampaTipica: "Tragarlo (crece resentimiento) o estallar en comité.",
    cargosAplicables: ["VP", "Director", "C-level"],
  },
  {
    id: "d12",
    titulo: "Tu jefe te pide algo que viola el código",
    contexto: "Tu jefe directo te pide que firmes un proceso que sabes que no cumple la política interna de compliance. 'Solo esta vez, urgente'.",
    dilema: "¿Firmas, escalas, te niegas formalmente, pides instrucción por escrito?",
    categoria: "etica",
    presionTiempo: "alta",
    rubricaIdeal: "No firmar en frío. Pedir por escrito, citar la política, ofrecer alternativa cumpliente. Si insiste, escalar a compliance/auditoría. Tu firma es tu nombre.",
    trampaTipica: "Firmar 'solo esta vez' (nunca es solo esta vez).",
    cargosAplicables: ["Todos"],
  },
];

export const CATEGORIAS_DILEMAS = [
  { id: "personas", nombre: "Manejo de personas", icon: "Users" },
  { id: "decision-rapida", nombre: "Decisión bajo presión", icon: "Zap" },
  { id: "etica", nombre: "Dilema ético", icon: "Shield" },
  { id: "delegacion", nombre: "Delegación", icon: "Share2" },
  { id: "conflicto", nombre: "Conflicto / política", icon: "Swords" },
  { id: "sponsor", nombre: "Sponsor / consejo", icon: "Crown" },
];

// ─── 3. RETO 7 DÍAS — CATÁLOGO ──────────────────────────────────────
export interface RetoCatalogo {
  id: string;
  titulo: string;
  dimension: "vision" | "decision" | "influencia" | "ejecucion" | "resiliencia" | "consciencia";
  proposito: string;
  microRetos: string[]; // 7, uno por día, escalonados
  reflexionFinal: string;
}

export const RETOS_BANCO: RetoCatalogo[] = [
  {
    id: "r1",
    titulo: "Soltar el control en 7 días",
    dimension: "ejecucion",
    proposito: "Probar que el mundo no se cae cuando dejas de meter mano.",
    microRetos: [
      "Día 1: No revises tu email entre 9am y 12pm. Anota tu nivel de ansiedad cada hora.",
      "Día 2: En tu reunión clave, no hables los primeros 10 minutos. Solo escucha.",
      "Día 3: Delega 1 decisión que normalmente tomarías tú. No la revises.",
      "Día 4: No respondas ningún mensaje fuera de horario laboral.",
      "Día 5: Pide a un reporte directo: '¿qué decidirías tú?' antes de dar tu opinión.",
      "Día 6: Sal 1 hora antes. Sin avisar a nadie. Observa qué pasa.",
      "Día 7: Reúnete con tu equipo y pregunta: '¿qué cambió esta semana?'",
    ],
    reflexionFinal: "¿Qué descubriste sobre tu necesidad de control? ¿Qué de esto vas a sostener?",
  },
  {
    id: "r2",
    titulo: "7 días de escucha radical",
    dimension: "influencia",
    proposito: "Romper el hábito de hablar primero.",
    microRetos: [
      "Día 1: En cada conversación, espera 3 segundos antes de responder.",
      "Día 2: En tu próxima reunión, haz 5 preguntas antes de dar 1 opinión.",
      "Día 3: Pregunta a un colaborador: '¿qué te frustra de cómo te lidero?' Solo escucha.",
      "Día 4: Almuerza con alguien con quien no hayas hablado en >30 días. No agenda. Solo escucha.",
      "Día 5: En reunión de comité, deja que se debata sin tu intervención por al menos 15 min.",
      "Día 6: Llama a un cliente solo para escuchar, no para vender ni resolver.",
      "Día 7: Pídele a tu pareja/cercano: '¿cómo me ves esta semana?' Sin defenderte.",
    ],
    reflexionFinal: "¿Qué oíste que no habrías oído si hablabas primero?",
  },
  {
    id: "r3",
    titulo: "Visibilidad del impacto",
    dimension: "consciencia",
    proposito: "Recibir feedback honesto sobre cómo aterrizas en otros.",
    microRetos: [
      "Día 1: Pide a 1 reporte directo: 'una cosa que hago bien y una que me frena como líder'.",
      "Día 2: Pide lo mismo a un par.",
      "Día 3: Pide lo mismo a tu jefe.",
      "Día 4: Pide lo mismo a tu pareja.",
      "Día 5: Pide lo mismo a un colaborador junior.",
      "Día 6: Comparte con tu equipo: 'esta semana he escuchado X de mí; esto haré distinto'.",
      "Día 7: Escribe 1 página: ¿qué patrón se repitió en los 5 feedbacks?",
    ],
    reflexionFinal: "¿Cuál fue el patrón más doloroso? ¿Qué vas a hacer con él?",
  },
  {
    id: "r4",
    titulo: "Decisión rápida deliberada",
    dimension: "decision",
    proposito: "Romper la parálisis o la impulsividad — calibrar el músculo.",
    microRetos: [
      "Día 1: Identifica 1 decisión pendiente >7 días. Decide hoy con la info que tienes.",
      "Día 2: En cada decisión <USD500 impacto, decide en <2 minutos.",
      "Día 3: Toma 1 decisión incómoda que vienes posponiendo (conversación, no, sí).",
      "Día 4: En tu reunión clave, pide al equipo: 'decidamos esto en 20 min, no en 60'.",
      "Día 5: Anota cada decisión que tomas con: tiempo gastado vs ganancia esperada.",
      "Día 6: Identifica 1 decisión que te tomó >1 hora. ¿Qué la trabó realmente?",
      "Día 7: Cierra al menos 1 bucle abierto que llevas más de 30 días.",
    ],
    reflexionFinal: "¿Decides lento por análisis real o por evitar incomodidad?",
  },
  {
    id: "r5",
    titulo: "Energía como activo estratégico",
    dimension: "resiliencia",
    proposito: "Tratar tu energía como recurso medible, no como variable de ajuste.",
    microRetos: [
      "Día 1: Mide tu energía 1-10 al iniciar y cerrar el día. Sin juicio, solo dato.",
      "Día 2: Identifica las 2 reuniones que más te drenan. ¿Son indispensables?",
      "Día 3: Bloquea 1 hora protegida sin reuniones ni email. Úsala para lo que tú decidas.",
      "Día 4: Camina 20 minutos al mediodía. Sin teléfono.",
      "Día 5: Cancela 1 reunión que no agrega valor. Observa la culpa.",
      "Día 6: Duerme 8 horas mínimo. No revises pantalla 1h antes.",
      "Día 7: Revisa los 6 días: ¿qué hábito sostienes la próxima semana?",
    ],
    reflexionFinal: "¿Qué te enseñó este reto sobre tu relación con la energía?",
  },
  {
    id: "r6",
    titulo: "Visión que conecta",
    dimension: "vision",
    proposito: "Conectar lo diario con la dirección de largo plazo.",
    microRetos: [
      "Día 1: Escribe en 3 frases dónde quieres estar en 3 años. Pega esa hoja en tu escritorio.",
      "Día 2: Revisa tu calendario de la semana: ¿cuántas horas se conectan con esa visión?",
      "Día 3: Cancela o redirige al menos 2 reuniones que no aportan a esa visión.",
      "Día 4: Comparte la visión con tu equipo en 5 minutos al inicio de tu reunión clave.",
      "Día 5: Pregunta a 3 colaboradores: '¿qué crees que estamos construyendo realmente?'",
      "Día 6: Identifica 1 proyecto activo que NO aporta a la visión. ¿Lo cierras?",
      "Día 7: Escribe la decisión más importante que tomaste esta semana en clave de visión.",
    ],
    reflexionFinal: "¿Tu agenda real refleja tu visión declarada?",
  },
];

// ─── 4. CONTEXTO — ESTRUCTURA PRECARGADA ────────────────────────────
export const CONTEXTO_SECCIONES = {
  empresarial: {
    titulo: "Contexto empresarial",
    campos: [
      { id: "momento", label: "Momento del negocio", tipo: "select",
        opciones: ["Crecimiento acelerado", "Consolidación", "Transformación", "Crisis / turnaround", "Sucesión", "Fusión / adquisición"] },
      { id: "industria", label: "Industria / sector", tipo: "text" },
      { id: "tamano_equipo", label: "Tamaño del equipo directo", tipo: "number" },
      { id: "presion_resultado", label: "Nivel de presión por resultado (1-10)", tipo: "scale" },
      { id: "cambio_reciente", label: "¿Qué cambió en los últimos 6 meses?", tipo: "textarea" },
    ],
  },
  stakeholders: {
    titulo: "Mapa de stakeholders clave",
    campos: [
      { id: "sponsor", label: "Sponsor del programa (quién paga, qué espera)", tipo: "textarea" },
      { id: "jefe", label: "Jefe directo (estilo, expectativas)", tipo: "textarea" },
      { id: "pares", label: "Pares clave (aliados / tensiones)", tipo: "textarea" },
      { id: "equipo", label: "Equipo directo (tamaño, dinámica)", tipo: "textarea" },
    ],
  },
  personal: {
    titulo: "Contexto personal (confidencial)",
    campos: [
      { id: "energia_actual", label: "Energía promedio (1-10)", tipo: "scale" },
      { id: "horas_semana", label: "Horas trabajadas por semana", tipo: "number" },
      { id: "carga_familiar", label: "Carga / cambios familiares relevantes", tipo: "textarea" },
      { id: "salud", label: "Tema de salud que afecta el liderazgo", tipo: "textarea" },
      { id: "motor_personal", label: "¿Qué te trae al programa, en lo personal?", tipo: "textarea" },
    ],
  },
  resultado: {
    titulo: "Resultado esperado del programa",
    campos: [
      { id: "objetivo_sponsor", label: "Lo que el sponsor quiere ver al final", tipo: "textarea" },
      { id: "objetivo_lider", label: "Lo que el líder quiere ver al final", tipo: "textarea" },
      { id: "señal_exito", label: "Señal observable de éxito en 90 días", tipo: "text" },
    ],
  },
} as const;

// ─── 5. MANIFIESTO — DIMENSIONES INSTRUMENTADAS ─────────────────────
export interface DimensionManifiesto {
  id: string;
  nombre: string;
  pregunta: string;
  ejemploBueno: string;
  ejemploMalo: string;
  validador: string; // criterio para evaluar si el compromiso es accionable
}

export const DIMENSIONES_MANIFIESTO: DimensionManifiesto[] = [
  { id: "vision", nombre: "Visión",
    pregunta: "¿Cómo voy a operar distinto para sostener una visión clara y comunicable?",
    ejemploBueno: "Cada lunes 8am dedico 30 min a revisar si las decisiones de la semana pasada nos acercan o alejan de la visión 2027.",
    ejemploMalo: "Voy a tener una visión más clara.",
    validador: "¿Es observable por alguien externo? ¿Tiene cuándo y cómo?" },
  { id: "decision", nombre: "Decisión",
    pregunta: "¿Cómo voy a decidir distinto bajo presión o incertidumbre?",
    ejemploBueno: "Antes de decir no a una propuesta del equipo, daré 24h de revisión real con dato. Si decido no, explico el dato.",
    ejemploMalo: "Voy a tomar mejores decisiones.",
    validador: "¿Define un disparador claro y un nuevo comportamiento?" },
  { id: "influencia", nombre: "Influencia",
    pregunta: "¿Cómo voy a movilizar al equipo sin recurrir a autoridad?",
    ejemploBueno: "En cada comité, las primeras 10 minutos son de mis reportes. Yo cierro, no abro.",
    ejemploMalo: "Voy a comunicar mejor con mi equipo.",
    validador: "¿Cambia el comportamiento del líder en una situación recurrente?" },
  { id: "ejecucion", nombre: "Ejecución",
    pregunta: "¿Cómo voy a entregar resultados con menos micro-gestión?",
    ejemploBueno: "Cada viernes 4pm, revisión de 3 indicadores con cada gerente, 15 min cada uno. Sin entrar en operativa intermedia.",
    ejemploMalo: "Voy a ser más eficiente en la ejecución.",
    validador: "¿Sustituye un comportamiento de microgestión existente?" },
  { id: "resiliencia", nombre: "Resiliencia",
    pregunta: "¿Cómo voy a sostener mi energía bajo carga real?",
    ejemploBueno: "No reuniones antes de las 9am ni después de las 6pm. Almuerzo sin pantalla 4 días/semana.",
    ejemploMalo: "Voy a cuidar más mi energía.",
    validador: "¿Define una restricción concreta y verificable?" },
];

// ─── 6. PLAN 90 DÍAS — PLANTILLA POR FASE ───────────────────────────
export interface FaseContinuidadInstrumento {
  id: string;
  titulo: string;
  ventana: string;
  preguntasPlan: string[];
  hitosSugeridos: string[];
}

export const FASES_CONTINUIDAD_INSTRUMENTO: FaseContinuidadInstrumento[] = [
  { id: "f1", titulo: "Consolidación inmediata", ventana: "Semanas 1-2",
    preguntasPlan: [
      "¿Cuáles son los 3 aprendizajes más importantes que vas a aplicar esta semana?",
      "¿Quién será tu testigo en estas 2 semanas?",
      "¿Qué señal observable indica que estás aplicando?",
    ],
    hitosSugeridos: [
      "Compartir el manifiesto con sponsor + 1 persona cercana",
      "Aplicar 3 compromisos del manifiesto en decisiones reales",
      "Bitácora diaria de 5 min sobre aplicación",
    ],
  },
  { id: "f2", titulo: "Instalación de hábitos", ventana: "Semanas 3-4",
    preguntasPlan: [
      "¿Qué rutina semanal va a sostener tu cambio?",
      "¿Qué reunión recurrente vas a rediseñar?",
      "¿Cómo medirás el progreso?",
    ],
    hitosSugeridos: [
      "Rediseñar 1 reunión semanal según manifiesto",
      "Mantener pulso semanal personal (auto-aplicado)",
      "Conversación 1:1 con cada reporte directo sobre el cambio",
    ],
  },
  { id: "f3", titulo: "Expansión al equipo", ventana: "Mes 2",
    preguntasPlan: [
      "¿Qué del aprendizaje vas a compartir con tu equipo?",
      "¿Qué hábito de equipo vas a instalar?",
      "¿Qué feedback vas a pedir?",
    ],
    hitosSugeridos: [
      "Sesión de 60 min con equipo: '¿qué cambia en cómo lidero?'",
      "Pedir feedback estructurado a 3 reportes directos",
      "Compromiso de equipo en 1-2 prácticas nuevas",
    ],
  },
  { id: "f4", titulo: "Evaluación y ajuste", ventana: "Mes 3",
    preguntasPlan: [
      "¿Qué del cambio se sostuvo y qué se erosionó?",
      "¿Qué vas a renovar para los próximos 90 días?",
      "¿Cuál es tu próximo nivel?",
    ],
    hitosSugeridos: [
      "Auto-aplicar el Radar y comparar con cierre",
      "Conversación con sponsor sobre evolución",
      "Definir nuevo manifiesto para próximos 90 días",
    ],
  },
];
