// Marketing Digital A360 — Interfaces y constantes

export interface EmpresaMarketing {
  nombre: string;
  ubicacion: string;
  tipo: string;
  modelo: string;
  productos: string;
  objetivo: string;
  segmentos: string;
  canales: string;
  contexto: string;
}

export const EMPRESA_VACIA: EmpresaMarketing = {
  nombre: "", ubicacion: "", tipo: "", modelo: "",
  productos: "", objetivo: "", segmentos: "", canales: "", contexto: "",
};

export interface DiagPregunta {
  id: string;
  label: string;
  texto: string;
}

export interface ModuloMarketing {
  id: string;
  nombre: string;
  emoji: string;
  desc: string;
  scoreMax: number;
  diag: DiagPregunta[];
}

export interface ModuloData {
  diag: Record<string, number>;
  campos: Record<string, string>;
  aiHtml: string;
}

export interface KpiRow {
  nombre: string;
  meta: string;
  actual: string;
  sem: "rojo" | "amarillo" | "verde";
  interpretacion: string;
}

export interface AccionRow {
  horizonte: "30" | "60" | "90";
  accion: string;
  responsable: string;
  sem: "rojo" | "amarillo" | "verde";
}

export interface MarketingSession {
  id: string;
  cliente_id: string | null;
  consultor_id: string;
  nombre_sesion: string;
  empresa: EmpresaMarketing;
  modulos: Record<string, ModuloData>;
  score_total: number;
  completada: boolean;
  created_at: string;
  updated_at: string;
}

export const MODULO_VACIO = (): ModuloData => ({ diag: {}, campos: {}, aiHtml: "" });

export const scoreModulo = (data: ModuloData, mod: ModuloMarketing): number =>
  mod.diag.reduce((s, q) => s + (data.diag[q.id] ?? 0), 0);

export const scoreTotalSesion = (sesion: MarketingSession): number =>
  MODULOS_MARKETING.reduce((s, m) => s + scoreModulo(sesion.modulos[m.id] ?? MODULO_VACIO(), m), 0);

export const SCORE_MAX_TOTAL = 330; // sum of all module scoreMax values

export const MODULOS_MARKETING: ModuloMarketing[] = [
  {
    id: "p01", nombre: "Oferta", emoji: "🎯",
    desc: "Claridad, diferenciación y facilidad de compra de la propuesta de valor.",
    scoreMax: 25,
    diag: [
      { id: "claridad", label: "Claridad de la oferta", texto: "¿El cliente entiende en segundos qué se vende, para qué sirve y qué debe hacer?" },
      { id: "cliente", label: "Cliente ideal", texto: "¿La oferta está dirigida a un segmento claro y prioritario?" },
      { id: "resultado", label: "Resultado prometido", texto: "¿La comunicación expresa beneficios concretos, no solo características?" },
      { id: "diferenciacion", label: "Diferenciación", texto: "¿La empresa tiene razones verificables para ser preferida?" },
      { id: "compra", label: "Facilidad de compra", texto: "¿El proceso de contacto, cotización o compra es claro y simple?" },
    ],
  },
  {
    id: "p02", nombre: "Embudo Comercial", emoji: "🔽",
    desc: "Atracción, captura, calificación, nutrición, cierre y fidelización.",
    scoreMax: 30,
    diag: [
      { id: "atraccion", label: "Atracción", texto: "¿La empresa atrae prospectos calificados por canales adecuados?" },
      { id: "captura", label: "Captura", texto: "¿Cada canal convierte interés en datos/contactos trazables?" },
      { id: "calificacion", label: "Calificación", texto: "¿Los leads se clasifican por potencial, urgencia e intención?" },
      { id: "nutricion", label: "Nutrición", texto: "¿Existen secuencias de seguimiento y contenido para avanzar la decisión?" },
      { id: "conversion", label: "Conversión", texto: "¿Ventas tiene proceso, guiones y tiempos de respuesta definidos?" },
      { id: "fidelizacion", label: "Fidelización", texto: "¿La empresa activa recompra, referidos y postventa?" },
    ],
  },
  {
    id: "p03", nombre: "Canales Digitales", emoji: "📡",
    desc: "Prioriza canales según objetivo, cliente, contenido y capacidad real de ejecución.",
    scoreMax: 30,
    diag: [
      { id: "priorizacion", label: "Priorización de canales", texto: "¿La empresa sabe qué canales merecen foco según cliente, objetivo y retorno?" },
      { id: "objetivo", label: "Objetivo por canal", texto: "¿Cada canal tiene un rol definido: atraer, capturar, nutrir, convertir o fidelizar?" },
      { id: "contenido", label: "Contenido por canal", texto: "¿El contenido se adapta al canal y a la etapa del comprador?" },
      { id: "captura", label: "Captura y seguimiento", texto: "¿Cada canal conecta con WhatsApp, landing, CRM, formulario o proceso comercial?" },
      { id: "medicion", label: "Medición por canal", texto: "¿Se mide desempeño por canal más allá de likes, alcance o visitas?" },
      { id: "capacidad", label: "Capacidad operativa", texto: "¿La empresa puede sostener los canales elegidos con equipo, frecuencia y calidad?" },
    ],
  },
  {
    id: "p04", nombre: "Contenido", emoji: "✍️",
    desc: "Publicaciones, guiones y piezas que educan, generan confianza y empujan ventas.",
    scoreMax: 30,
    diag: [
      { id: "intencion", label: "Intención comercial", texto: "¿Cada contenido tiene objetivo, etapa del embudo y CTA definido?" },
      { id: "segmentacion", label: "Segmentación del mensaje", texto: "¿El contenido se adapta a los segmentos prioritarios y sus dolores reales?" },
      { id: "educacion", label: "Educación y autoridad", texto: "¿El contenido enseña, orienta y demuestra criterio experto?" },
      { id: "objeciones", label: "Objeciones y confianza", texto: "¿El contenido responde dudas, reduce riesgo y usa prueba social?" },
      { id: "uso_ventas", label: "Uso por ventas", texto: "¿El equipo comercial usa contenidos en seguimiento, propuestas y cierre?" },
      { id: "medicion", label: "Medición de contenido", texto: "¿Se mide qué contenido genera leads, conversaciones, cotizaciones y ventas?" },
    ],
  },
  {
    id: "p05", nombre: "CRM y Ventas", emoji: "🤝",
    desc: "Ordena oportunidades, seguimiento, recordatorios y recuperación comercial.",
    scoreMax: 30,
    diag: [
      { id: "registro", label: "Registro centralizado", texto: "¿Todos los leads y oportunidades se registran en un solo sistema trazable?" },
      { id: "calificacion", label: "Calificación comercial", texto: "¿Los leads se clasifican por potencial, urgencia, necesidad, presupuesto e intención?" },
      { id: "seguimiento", label: "Seguimiento disciplinado", texto: "¿Cada oportunidad tiene próximo paso, responsable, fecha y guion de seguimiento?" },
      { id: "pipeline", label: "Pipeline y etapas", texto: "¿Ventas trabaja con etapas claras desde lead nuevo hasta cierre ganado o perdido?" },
      { id: "perdidas", label: "Motivos de pérdida", texto: "¿Se registran y analizan razones de pérdida para mejorar oferta, canal, precio o proceso?" },
      { id: "reactivacion", label: "Recompra y reactivación", texto: "¿La empresa gestiona clientes inactivos, recompra, referidos y postventa?" },
    ],
  },
  {
    id: "p06", nombre: "Automatización", emoji: "🤖",
    desc: "Flujos automáticos de respuesta, seguimiento, nutrición y alertas comerciales.",
    scoreMax: 30,
    diag: [
      { id: "respuesta", label: "Respuesta inicial", texto: "¿La empresa responde automáticamente y con contexto cuando entra un lead?" },
      { id: "seguimiento", label: "Seguimiento automático", texto: "¿Existen recordatorios, tareas o secuencias para cotizaciones y oportunidades abiertas?" },
      { id: "segmentacion", label: "Segmentación y etiquetas", texto: "¿Los contactos se etiquetan por canal, segmento, interés, etapa y prioridad?" },
      { id: "nutricion", label: "Nutrición automática", texto: "¿Los leads reciben contenidos o mensajes según etapa, interés y comportamiento?" },
      { id: "alertas", label: "Alertas y control", texto: "¿El sistema alerta oportunidades atrasadas, leads calientes y casos de alto valor?" },
      { id: "medicion", label: "Reportes automáticos", texto: "¿Los KPIs comerciales se actualizan sin depender de trabajo manual excesivo?" },
    ],
  },
  {
    id: "p07", nombre: "KPIs y Tablero", emoji: "📊",
    desc: "Indicadores de decisión con semáforos, responsables y frecuencia de revisión.",
    scoreMax: 30,
    diag: [
      { id: "seleccion", label: "Selección de KPIs", texto: "¿La empresa mide indicadores que explican ventas, conversión, margen, seguimiento y fidelización?" },
      { id: "metas", label: "Metas y brechas", texto: "¿Cada KPI tiene valor actual, meta numérica, brecha calculada y semáforo automático?" },
      { id: "fuentes", label: "Fuentes de datos", texto: "¿Los datos provienen de fuentes confiables como CRM, campañas, web, WhatsApp o ventas?" },
      { id: "responsables", label: "Responsables y cadencia", texto: "¿Cada KPI tiene dueño, frecuencia de revisión y reunión donde se toman decisiones?" },
      { id: "accion", label: "Acción correctiva", texto: "¿Cuando un KPI está en rojo existe una acción definida para corregir la brecha?" },
      { id: "tablero", label: "Tablero ejecutivo", texto: "¿La dirección cuenta con un tablero simple, visual y actualizado para decidir prioridades?" },
    ],
  },
  {
    id: "p08", nombre: "Sistema Creativo", emoji: "💡",
    desc: "Banco de ideas, campañas, ángulos y formatos reutilizables para publicar con intención.",
    scoreMax: 30,
    diag: [
      { id: "fuentes", label: "Fuentes de ideas", texto: "¿La empresa recoge ideas desde clientes, ventas, objeciones, productos y temporadas?" },
      { id: "banco", label: "Banco de ideas", texto: "¿Existe una biblioteca organizada, priorizada y reutilizable de ideas creativas?" },
      { id: "embudo", label: "Conexión con embudo", texto: "¿Cada idea está asociada a etapa del embudo, segmento, canal, CTA y objetivo comercial?" },
      { id: "reutilizacion", label: "Reutilización de activos", texto: "¿Una idea se transforma en varios formatos y piezas para diferentes canales?" },
      { id: "produccion", label: "Cadencia de producción", texto: "¿El equipo tiene proceso, calendario, responsables y criterios para producir ideas?" },
      { id: "medicion", label: "Aprendizaje creativo", texto: "¿Se mide qué ideas, ángulos, formatos y CTAs generan leads, conversaciones y ventas?" },
    ],
  },
  {
    id: "p09", nombre: "Plan Consolidado", emoji: "🗺️",
    desc: "Prioriza hallazgos, riesgos y acciones para convertir el diagnóstico en ejecución gerencial.",
    scoreMax: 30,
    diag: [
      { id: "sintesis", label: "Síntesis ejecutiva", texto: "¿El diagnóstico se resume en prioridades claras y entendibles para gerencia?" },
      { id: "priorizacion", label: "Priorización", texto: "¿Las oportunidades están ordenadas por impacto, urgencia y capacidad real de ejecución?" },
      { id: "responsables", label: "Responsables", texto: "¿Cada acción tiene dueño, plazo, KPI y semáforo de avance?" },
      { id: "riesgos", label: "Riesgos de ejecución", texto: "¿El plan identifica obstáculos, dependencias y condiciones críticas?" },
      { id: "seguimiento", label: "Cadencia de seguimiento", texto: "¿Existe una rutina de revisión semanal o mensual con decisiones concretas?" },
      { id: "entregable", label: "Reporte presentable", texto: "¿El resultado puede presentarse a dirección, equipo comercial o cliente en formato ejecutivo?" },
    ],
  },
  {
    id: "p10", nombre: "Presupuesto y ROI", emoji: "💰",
    desc: "Escenarios de inversión, CPL, CAC, ROAS y ROI por canal y por objetivo.",
    scoreMax: 0,
    diag: [],
  },
  {
    id: "p11", nombre: "Calendario de Ejecución", emoji: "📅",
    desc: "Campañas, contenidos y acciones con responsables, fechas y prioridades.",
    scoreMax: 30,
    diag: [
      { id: "planificacion", label: "Planificación semanal", texto: "¿Existe un calendario visible de campañas, contenidos y acciones comerciales?" },
      { id: "prioridades", label: "Priorización", texto: "¿El equipo distingue actividades críticas, importantes y secundarias?" },
      { id: "responsables", label: "Responsables y coordinación", texto: "¿Cada actividad tiene dueño, fecha y dependencias claras?" },
      { id: "secuencia", label: "Secuencia comercial", texto: "¿Las actividades acompañan el embudo desde atracción hasta recompra?" },
      { id: "cumplimiento", label: "Cumplimiento y control", texto: "¿Se revisa semanalmente el avance, los atrasos y los bloqueos?" },
      { id: "aprendizaje", label: "Aprendizaje y ajuste", texto: "¿Los resultados alimentan decisiones de repetir, pausar, mejorar o escalar?" },
    ],
  },
  {
    id: "p12", nombre: "Activos Comerciales", emoji: "📦",
    desc: "Propuestas, guiones, prueba social y materiales que apoyan el cierre.",
    scoreMax: 30,
    diag: [
      { id: "propuesta", label: "Propuesta y mensajes base", texto: "¿La empresa cuenta con una propuesta de valor y mensajes claros, verificables y reutilizables?" },
      { id: "segmentos", label: "Mensajes por segmento", texto: "¿Existen mensajes diferenciados para segmentos, dolores y decisores prioritarios?" },
      { id: "guiones", label: "Guiones comerciales", texto: "¿El equipo dispone de guiones para contacto, seguimiento, cotización, objeciones y reactivación?" },
      { id: "prueba", label: "Prueba y confianza", texto: "¿Casos, testimonios, comparativos y evidencias están organizados para apoyar la decisión?" },
      { id: "biblioteca", label: "Biblioteca y versiones", texto: "¿Los activos están centralizados, actualizados, con dueño y fecha de revisión?" },
      { id: "adopcion", label: "Uso y aprendizaje", texto: "¿Marketing y ventas usan los activos y miden cuáles contribuyen a conversación o cierre?" },
    ],
  },
  {
    id: "p13", nombre: "Experimentación", emoji: "🔬",
    desc: "Hipótesis, pruebas A/B, métricas de aprendizaje y decisiones de escala.",
    scoreMax: 0,
    diag: [],
  },
  {
    id: "p14", nombre: "Gobierno Comercial", emoji: "🏛️",
    desc: "Reuniones, rituales de revisión, compromisos y cadencia de decisiones.",
    scoreMax: 0,
    diag: [],
  },
  {
    id: "p15", nombre: "Formación Comercial", emoji: "🎓",
    desc: "Competencias, rutas de aprendizaje, coaching y habilitación por rol.",
    scoreMax: 0,
    diag: [],
  },
];
