// Catálogo curado de sugerencias por sector / tamaño
// Determinístico, sin coste IA. Cada sección tiene su propio helper.

export type SectorKey = "tecnologia" | "manufactura" | "servicios" | "retail" | "salud" | "educacion" | "construccion" | "agro" | "financiero" | "otro";

export const detectSector = (sector: string | null | undefined): SectorKey => {
  const s = (sector || "").toLowerCase();
  if (/tecn|software|saas|it|digital/.test(s)) return "tecnologia";
  if (/manufact|industri|fabric/.test(s)) return "manufactura";
  if (/retail|comerc|tienda/.test(s)) return "retail";
  if (/salud|farma|clinic|hospital/.test(s)) return "salud";
  if (/educ|colegio|univers/.test(s)) return "educacion";
  if (/construc|inmob|bienes/.test(s)) return "construccion";
  if (/agro|pesca|ganad|aliment/.test(s)) return "agro";
  if (/finan|banco|seguro/.test(s)) return "financiero";
  if (/servic|consult|profesion/.test(s)) return "servicios";
  return "otro";
};

export type Tamano = "micro" | "pequena" | "mediana" | "grande";
export const detectTamano = (n?: number | null): Tamano => {
  if (!n) return "pequena";
  if (n < 10) return "micro";
  if (n < 50) return "pequena";
  if (n < 250) return "mediana";
  return "grande";
};

// ───────────────── Sec 01: Líneas de productos típicas ─────────────────
export const lineasProductoSugeridas = (sector: SectorKey): string[] => ({
  tecnologia: ["Plataforma SaaS principal", "Servicios de implementación", "Soporte y mantenimiento", "Consultoría estratégica TI"],
  manufactura: ["Línea de producto principal", "Línea complementaria", "Servicio postventa", "Repuestos y accesorios"],
  servicios: ["Servicio core", "Servicio de valor agregado", "Asesoría especializada", "Capacitación"],
  retail: ["Categoría principal", "Categoría secundaria", "Marca propia", "Servicios al cliente"],
  salud: ["Servicios médicos generales", "Servicios especializados", "Procedimientos diagnósticos", "Programas preventivos"],
  educacion: ["Programa académico principal", "Programas de extensión", "Capacitación corporativa", "Servicios complementarios"],
  construccion: ["Obra civil", "Vivienda", "Remodelaciones", "Consultoría técnica"],
  agro: ["Producción primaria", "Procesados", "Insumos y semillas", "Servicios técnicos"],
  financiero: ["Productos crediticios", "Productos de ahorro/inversión", "Seguros", "Asesoría financiera"],
  otro: ["Línea principal", "Línea complementaria"],
}[sector]);

// ───────────────── Sec 02: Factores PESTEL típicos ─────────────────
export interface FactorPESTEL { factor: string; descripcion: string; impacto: number; tipo: "Oportunidad" | "Amenaza"; observacion: string; }
const baseP = (factor: string, descripcion: string, impacto = 3, tipo: "Oportunidad" | "Amenaza" = "Amenaza"): FactorPESTEL =>
  ({ factor, descripcion, impacto, tipo, observacion: "" });

export const pestelSugerido = (sector: SectorKey): Record<string, FactorPESTEL[]> => {
  const com: Record<string, FactorPESTEL[]> = {
    Politico: [
      baseP("Estabilidad política", "Cambios de gobierno y continuidad de políticas públicas", 3, "Amenaza"),
      baseP("Política tributaria", "Reformas fiscales y carga impositiva sobre la actividad", 4, "Amenaza"),
      baseP("Acuerdos comerciales", "TLC, aranceles y barreras de entrada/salida del sector", 3, "Oportunidad"),
      baseP("Política de inversión", "Incentivos a la inversión privada o trabas burocráticas", 3, "Oportunidad"),
      baseP("Riesgo geopolítico", "Conflictos regionales o sanciones que afectan operaciones", 3, "Amenaza"),
      baseP("Compras públicas", "Acceso a contratos del Estado y licitaciones del sector", 3, "Oportunidad"),
    ],
    Economico: [
      baseP("Tipo de cambio", "Volatilidad cambiaria y costos importados", 4, "Amenaza"),
      baseP("Inflación", "Presión sobre costos operativos y poder adquisitivo del cliente", 4, "Amenaza"),
      baseP("Tasas de interés", "Costo del financiamiento y acceso al crédito", 4, "Amenaza"),
      baseP("Crecimiento del PIB sectorial", "Expansión o contracción de la demanda agregada", 3, "Oportunidad"),
      baseP("Empleo y poder adquisitivo", "Capacidad de compra del consumidor objetivo", 3, "Oportunidad"),
      baseP("Acceso al crédito", "Liquidez del sistema financiero para empresas y clientes", 3, "Oportunidad"),
    ],
    Social: [
      baseP("Cambios demográficos", "Envejecimiento, urbanización y crecimiento poblacional", 3, "Oportunidad"),
      baseP("Hábitos de consumo", "Nuevas preferencias, sostenibilidad y estilos de vida", 4, "Oportunidad"),
      baseP("Educación y talento", "Disponibilidad de talento calificado en el mercado", 4, "Amenaza"),
      baseP("Conciencia social y ambiental", "Demanda creciente de marcas con propósito", 3, "Oportunidad"),
      baseP("Movilidad laboral", "Rotación, expectativas salariales y trabajo remoto", 3, "Amenaza"),
      baseP("Salud y bienestar", "Foco creciente en bienestar integral del consumidor/colaborador", 3, "Oportunidad"),
    ],
    Tecnologico: [
      baseP("Digitalización del sector", "Automatización, omnicanalidad y nuevos canales", 4, "Oportunidad"),
      baseP("Ciberseguridad", "Riesgos de ataques, fraude digital y filtraciones", 4, "Amenaza"),
      baseP("Inteligencia artificial", "IA generativa transforma productos, procesos y empleos", 5, "Oportunidad"),
      baseP("Cloud y SaaS", "Migración a infraestructura como servicio y costos variables", 3, "Oportunidad"),
      baseP("Brecha digital interna", "Capacidad del equipo para adoptar nuevas tecnologías", 3, "Amenaza"),
      baseP("Datos y analítica", "Toma de decisiones basada en datos y BI", 4, "Oportunidad"),
    ],
    Ambiental: [
      baseP("Regulación ambiental", "Nuevas exigencias normativas y reportes ESG obligatorios", 3, "Amenaza"),
      baseP("Cambio climático", "Eventos extremos, sequías y costos de adaptación", 3, "Amenaza"),
      baseP("Economía circular", "Reutilización, reciclaje y diseño sostenible", 3, "Oportunidad"),
      baseP("Eficiencia energética", "Costos de energía y oportunidad de optimización", 3, "Oportunidad"),
      baseP("Huella de carbono", "Presión de clientes y reguladores por neutralidad", 3, "Amenaza"),
      baseP("Gestión de residuos", "Normativa y costos de disposición de residuos", 2, "Amenaza"),
    ],
    Legal: [
      baseP("Protección de datos", "Cumplimiento normativo (GDPR/HIPAA/local) y multas", 4, "Amenaza"),
      baseP("Normativa laboral", "Reformas que impactan costos y flexibilidad laboral", 3, "Amenaza"),
      baseP("Defensa del consumidor", "Endurecimiento de derechos y reclamos del consumidor", 3, "Amenaza"),
      baseP("Propiedad intelectual", "Protección de marca, patentes y secretos comerciales", 3, "Oportunidad"),
      baseP("Compliance sectorial", "Regulaciones específicas del sector y certificaciones", 3, "Amenaza"),
      baseP("Normativa antimonopolio", "Restricciones a alianzas, fusiones o prácticas comerciales", 2, "Amenaza"),
    ],
  };
  // Ajustes específicos por sector
  if (sector === "tecnologia") {
    com.Tecnologico.push(baseP("Open source y APIs abiertas", "Modelos colaborativos y plataformización", 4, "Oportunidad"));
    com.Legal.push(baseP("Regulación de IA", "AI Act y normativas emergentes sobre modelos", 4, "Amenaza"));
  }
  if (sector === "salud") {
    com.Legal.push(baseP("Regulación sanitaria", "Cambios en aprobaciones, licencias y farmacovigilancia", 5, "Amenaza"));
    com.Tecnologico.push(baseP("Telemedicina", "Atención remota y dispositivos conectados", 4, "Oportunidad"));
  }
  if (sector === "manufactura") {
    com.Economico.push(baseP("Costo de materias primas", "Volatilidad de commodities e insumos clave", 5, "Amenaza"));
    com.Tecnologico.push(baseP("Industria 4.0", "IoT, robótica y manufactura inteligente", 4, "Oportunidad"));
  }
  if (sector === "retail") {
    com.Social.push(baseP("E-commerce y D2C", "Cambio de hábitos hacia compra online", 5, "Oportunidad"));
    com.Economico.push(baseP("Logística y última milla", "Costos de distribución y expectativa de inmediatez", 4, "Amenaza"));
  }
  if (sector === "financiero") {
    com.Tecnologico.push(baseP("Fintech y open banking", "Nuevos competidores no bancarios", 5, "Amenaza"));
    com.Legal.push(baseP("Regulación financiera", "Basilea, KYC/AML y supervisión", 5, "Amenaza"));
  }
  if (sector === "educacion") {
    com.Tecnologico.push(baseP("EdTech y aprendizaje híbrido", "Plataformas digitales y microcredenciales", 4, "Oportunidad"));
  }
  if (sector === "construccion") {
    com.Economico.push(baseP("Ciclo inmobiliario", "Sensibilidad a tasas y demanda de vivienda", 4, "Amenaza"));
    com.Ambiental.push(baseP("Construcción sostenible", "Certificaciones LEED/EDGE y materiales verdes", 3, "Oportunidad"));
  }
  if (sector === "agro") {
    com.Ambiental.push(baseP("Disponibilidad hídrica", "Estrés hídrico y riego eficiente", 5, "Amenaza"));
    com.Economico.push(baseP("Precios internacionales", "Volatilidad de commodities agrícolas", 4, "Amenaza"));
  }
  return com;
};

// ───────────────── Sec 03: Diagnóstico interno — guía por sector ─────────────────
export interface DiagnosticoInternoGuia {
  recursos_clave: string;
  procesos_criticos: string;
  capacidades_distintivas: string;
  areas_mejora: string;
  cultura_actual: string;
}

export const diagnosticoInternoSugerido = (sector: SectorKey): DiagnosticoInternoGuia => {
  const base: DiagnosticoInternoGuia = {
    recursos_clave: "• Equipo humano (perfiles clave y talento crítico)\n• Activos tangibles (infraestructura, equipos, instalaciones)\n• Activos intangibles (marca, propiedad intelectual, base de datos de clientes)\n• Recursos financieros (capital de trabajo, líneas de crédito)\n• Tecnología y sistemas de información",
    procesos_criticos: "• Proceso comercial y captación de clientes\n• Proceso de entrega del producto/servicio\n• Proceso de cobranza y administración financiera\n• Proceso de soporte y postventa\n• Proceso de gestión del talento",
    capacidades_distintivas: "• ¿Qué sabemos hacer mejor que la competencia?\n• ¿Por qué nos eligen los clientes?\n• ¿Qué know-how acumulado tenemos?\n• ¿Qué capacidad es difícil de imitar?",
    areas_mejora: "• Procesos no documentados\n• Sistemas y tecnología obsoletos o ausentes\n• Capacidades de marketing y ventas\n• Estructura organizacional y delegación\n• Indicadores y control de gestión",
    cultura_actual: "• Valores que hoy se viven (no los declarados)\n• Estilo de liderazgo predominante\n• Forma de tomar decisiones (centralizada/descentralizada)\n• Relación con el error y la innovación\n• Nivel de compromiso y rotación del equipo",
  };
  if (sector === "tecnologia") {
    base.recursos_clave += "\n• Stack tecnológico y código fuente\n• Comunidad de usuarios o developers";
    base.capacidades_distintivas += "\n• Velocidad de desarrollo y despliegue (CI/CD)\n• Capacidad de escalar producto sin escalar costos";
  }
  if (sector === "manufactura") {
    base.recursos_clave += "\n• Capacidad instalada y eficiencia de planta\n• Cadena de proveedores estratégicos";
    base.procesos_criticos += "\n• Control de calidad y trazabilidad\n• Gestión de inventarios y almacén";
  }
  if (sector === "servicios" || sector === "otro") {
    base.capacidades_distintivas += "\n• Metodología propia o framework de trabajo\n• Capacidad consultiva del equipo senior";
  }
  if (sector === "retail") {
    base.procesos_criticos += "\n• Gestión de surtido y reposición\n• Experiencia de cliente en tienda y online";
  }
  if (sector === "salud") {
    base.recursos_clave += "\n• Profesionales acreditados y especialidades\n• Equipamiento médico y certificaciones";
    base.cultura_actual += "\n• Cultura de seguridad del paciente";
  }
  if (sector === "financiero") {
    base.procesos_criticos += "\n• Análisis de riesgo y crédito\n• Compliance, KYC y prevención de fraude";
  }
  return base;
};

// ───────────────── Sec 03: Factores EFI típicos ─────────────────
export interface FactorEFI { factor: string; tipo: "Fortaleza" | "Debilidad"; peso: number; calificacion: number; }
export const efiSugerido = (sector: SectorKey): FactorEFI[] => [
  { factor: "Calidad del producto/servicio", tipo: "Fortaleza", peso: 0.08, calificacion: 3 },
  { factor: "Conocimiento del mercado y clientes", tipo: "Fortaleza", peso: 0.07, calificacion: 3 },
  { factor: "Equipo profesional capacitado", tipo: "Fortaleza", peso: 0.07, calificacion: 3 },
  { factor: "Cartera de clientes recurrentes", tipo: "Fortaleza", peso: 0.06, calificacion: 3 },
  { factor: "Reputación y marca en el sector", tipo: "Fortaleza", peso: 0.06, calificacion: 3 },
  { factor: "Relación cercana con clientes clave", tipo: "Fortaleza", peso: 0.05, calificacion: 3 },
  { factor: "Flexibilidad y agilidad operativa", tipo: "Fortaleza", peso: 0.05, calificacion: 3 },
  { factor: sector === "tecnologia" ? "Capacidad de innovación tecnológica" : "Eficiencia operativa", tipo: "Fortaleza", peso: 0.06, calificacion: 3 },
  { factor: "Procesos documentados y estandarizados", tipo: "Debilidad", peso: 0.07, calificacion: 2 },
  { factor: "Sistemas de información y datos", tipo: "Debilidad", peso: 0.07, calificacion: 2 },
  { factor: "Capacidad financiera y de inversión", tipo: "Debilidad", peso: 0.08, calificacion: 2 },
  { factor: "Marketing y posicionamiento digital", tipo: "Debilidad", peso: 0.07, calificacion: 2 },
  { factor: "Estructura organizacional y delegación", tipo: "Debilidad", peso: 0.05, calificacion: 2 },
  { factor: "Indicadores de gestión y control", tipo: "Debilidad", peso: 0.05, calificacion: 2 },
  { factor: "Dependencia del fundador/socio principal", tipo: "Debilidad", peso: 0.06, calificacion: 2 },
  { factor: "Gestión del talento y retención", tipo: "Debilidad", peso: 0.05, calificacion: 2 },
];

// ───────────────── Sec 04: FODA sugerido ─────────────────
export const fodaSugerido = (sector: SectorKey) => ({
  fortalezas: [
    "Equipo experimentado y comprometido",
    "Relación cercana con clientes",
    "Flexibilidad y capacidad de respuesta",
    "Reputación en el mercado local",
    "Conocimiento profundo del sector",
    "Cartera diversificada de clientes",
  ],
  debilidades: [
    "Dependencia del fundador en decisiones clave",
    "Procesos no documentados ni estandarizados",
    "Limitada presencia digital y marketing",
    "Capacidad financiera ajustada",
    "Sistemas de información débiles",
    "Estructura organizacional poco definida",
  ],
  oportunidades: sector === "tecnologia"
    ? ["Crecimiento de la digitalización en clientes", "Adopción masiva de IA generativa", "Mercados internacionales vía SaaS", "Modelos de suscripción y recurrencia", "Alianzas con integradores y partners", "Demanda de ciberseguridad"]
    : ["Nuevos canales digitales y e-commerce", "Crecimiento del sector", "Alianzas estratégicas y co-creación", "Expansión geográfica regional", "Nuevos segmentos desatendidos", "Servitización del producto"],
  amenazas: [
    "Entrada de nuevos competidores",
    "Presión sobre márgenes y precios",
    "Cambios regulatorios en el sector",
    "Volatilidad económica y cambiaria",
    "Pérdida de talento clave a competidores",
    "Disrupción tecnológica del modelo de negocio",
  ],
});

// CAME sugerido por categoría — acciones derivadas (catálogo amplio)
export const cameSugerido = () => ({
  corregir: [
    "Implementar plan de documentación y estandarización de procesos críticos",
    "Plan de digitalización del back office (ERP/CRM)",
    "Programa de profesionalización de la gestión (gobierno corporativo)",
    "Plan de fortalecimiento financiero (estructura de capital y caja)",
    "Plan de marketing digital y posicionamiento de marca",
    "Programa de desarrollo de mandos medios para reducir dependencia del fundador",
    "Implementar sistema de indicadores de gestión (CMI)",
    "Plan de mejora de experiencia de cliente (CX)",
  ],
  afrontar: [
    "Estrategia de diferenciación clara frente a nuevos competidores",
    "Plan de cobertura ante riesgos regulatorios y compliance",
    "Estrategia de cobertura cambiaria y financiera",
    "Plan de retención de talento crítico (compensación y carrera)",
    "Diversificación de proveedores y reducción de dependencias",
    "Plan de continuidad del negocio y gestión de riesgos",
    "Innovación defensiva ante disrupción tecnológica",
    "Estrategia de precios para defender márgenes",
  ],
  mantener: [
    "Programa de fidelización de clientes clave (key account)",
    "Plan de retención y desarrollo del talento crítico",
    "Inversión continua en calidad del producto/servicio",
    "Refuerzo de la cultura organizacional y propósito",
    "Mantener cercanía con clientes (NPS y voz del cliente)",
    "Mantener flexibilidad operativa como ventaja competitiva",
    "Cuidar la reputación de marca y referencias",
    "Mantener inversión en formación del equipo",
  ],
  explotar: [
    "Plan comercial para nuevos canales digitales",
    "Búsqueda activa de alianzas estratégicas y partners",
    "Lanzamiento de nuevos productos/servicios para segmentos desatendidos",
    "Plan de expansión geográfica regional",
    "Modelos de suscripción y servitización",
    "Adopción de IA para mejorar productividad y oferta",
    "Programa de innovación abierta con clientes y proveedores",
    "Internacionalización vía e-commerce o canales digitales",
  ],
});

// ───────────────── Sec 06: Ejes estratégicos ─────────────────
export interface EjeEstrategico { nombre: string; descripcion: string; prioridad: "Alta" | "Media" | "Baja"; }
export const ejesSugeridos = (sector: SectorKey): EjeEstrategico[] => {
  const base: EjeEstrategico[] = [
    { nombre: "Crecimiento rentable",       descripcion: "Aumentar ingresos y margen sostenible mediante nuevos clientes, líneas y canales.", prioridad: "Alta" },
    { nombre: "Excelencia operativa",       descripcion: "Optimizar procesos críticos, productividad y calidad de la operación.",            prioridad: "Alta" },
    { nombre: "Experiencia del cliente",    descripcion: "Elevar NPS, fidelización y diferenciación a través de la experiencia.",             prioridad: "Alta" },
    { nombre: "Talento y cultura",          descripcion: "Atraer, desarrollar y retener al talento crítico en una cultura de alto desempeño.", prioridad: "Media" },
    { nombre: "Transformación digital",     descripcion: "Digitalizar procesos, datos y oferta para escalar y diferenciarse.",                prioridad: "Media" },
    { nombre: "Sostenibilidad y reputación",descripcion: "Integrar criterios ESG en estrategia y reforzar reputación de marca.",              prioridad: "Media" },
  ];
  if (sector === "tecnologia") base.push({ nombre: "Innovación de producto", descripcion: "Roadmap de producto basado en evidencia y feedback de clientes.", prioridad: "Alta" });
  if (sector === "manufactura") base.push({ nombre: "Industria 4.0 y eficiencia energética", descripcion: "Automatización y uso eficiente de recursos.", prioridad: "Media" });
  if (sector === "retail") base.push({ nombre: "Omnicanalidad", descripcion: "Integración fluida entre canal físico y digital.", prioridad: "Alta" });
  return base;
};

// ───────────────── Sec 07: Objetivos + BSC ─────────────────
export type PerspectivaBSC = "Financiera" | "Cliente" | "Procesos" | "Aprendizaje";
export interface ObjetivoBSC {
  perspectiva: PerspectivaBSC;
  objetivo: string;
  indicador: string;
  meta: string;
  plazo: string;
  responsable: string;
  iniciativa?: string;
}
export const objetivosBSCSugeridos = (): ObjetivoBSC[] => [
  { perspectiva: "Financiera",   objetivo: "Incrementar ingresos anuales",            indicador: "Ventas netas (USD)",          meta: "+20% anual",   plazo: "12 meses", responsable: "Gerencia Comercial",  iniciativa: "Plan comercial 2026" },
  { perspectiva: "Financiera",   objetivo: "Mejorar margen operativo",                indicador: "EBITDA / Ventas",              meta: "≥ 18%",        plazo: "12 meses", responsable: "Dirección Financiera",iniciativa: "Plan de eficiencia de costos" },
  { perspectiva: "Cliente",      objetivo: "Elevar satisfacción y fidelización",      indicador: "NPS",                          meta: "≥ 60",         plazo: "12 meses", responsable: "Customer Success",    iniciativa: "Programa de experiencia de cliente" },
  { perspectiva: "Cliente",      objetivo: "Aumentar cuota en clientes clave",         indicador: "Share of wallet (%)",         meta: "+10 pp",       plazo: "12 meses", responsable: "Key Account Mgmt",    iniciativa: "Programa Key Account" },
  { perspectiva: "Procesos",     objetivo: "Estandarizar procesos críticos",          indicador: "% procesos documentados",      meta: "100%",         plazo: "9 meses",  responsable: "Operaciones",         iniciativa: "Proyecto de mapeo y SOP" },
  { perspectiva: "Procesos",     objetivo: "Reducir tiempos de entrega",              indicador: "Lead time promedio (días)",    meta: "-30%",         plazo: "12 meses", responsable: "Operaciones",         iniciativa: "Lean / Mejora continua" },
  { perspectiva: "Aprendizaje",  objetivo: "Desarrollar competencias clave del equipo", indicador: "Horas formación/colaborador", meta: "≥ 40 h/año", plazo: "12 meses", responsable: "RRHH",                iniciativa: "Plan de formación 2026" },
  { perspectiva: "Aprendizaje",  objetivo: "Retener talento crítico",                 indicador: "Rotación voluntaria (%)",      meta: "< 10%",        plazo: "12 meses", responsable: "RRHH",                iniciativa: "Plan de retención y carrera" },
];

// ───────────────── Sec 08: Estrategias corporativas ─────────────────
export interface EstrategiaSeleccion {
  porter: "Liderazgo en costos" | "Diferenciación" | "Enfoque/Nicho" | "";
  porter_justificacion: string;
  ansoff: "Penetración de mercado" | "Desarrollo de mercado" | "Desarrollo de producto" | "Diversificación" | "";
  ansoff_justificacion: string;
  oceano: "Océano rojo" | "Océano azul" | "";
  oceano_justificacion: string;
  iniciativas?: string[];
}
export const estrategiasSugeridas = (): { iniciativas: string[]; tips: Record<string, string> } => ({
  iniciativas: [
    "Lanzar nueva propuesta de valor diferenciada en el segmento prioritario",
    "Plan de cross-selling y up-selling sobre cartera actual",
    "Desarrollo de canal digital propio (e-commerce / SaaS)",
    "Alianzas con partners para acelerar cobertura geográfica",
    "Programa de innovación abierta con clientes",
    "Reposicionamiento de marca y nueva narrativa",
    "Plan de internacionalización selectiva",
    "Modelo de ingresos recurrentes (suscripción / servicios gestionados)",
  ],
  tips: {
    porter: "Liderazgo en costos requiere escala y eficiencia. Diferenciación exige capacidades únicas y marca. Enfoque/Nicho concentra recursos en un segmento específico.",
    ansoff: "Penetración: vender más a clientes actuales. Desarrollo de mercado: nuevos segmentos/geografías. Desarrollo de producto: innovar oferta. Diversificación: nuevo producto + nuevo mercado (mayor riesgo).",
    oceano: "Océano rojo: competir en mercados existentes. Océano azul: crear nuevos espacios de mercado sin competencia directa.",
  },
});

// ───────────────── Sec 09: Plan operativo ─────────────────
export interface IniciativaOperativa {
  nombre: string;
  eje: string;
  responsable: string;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto: number;
  kpi: string;
  estado: "Por iniciar" | "En curso" | "Completada" | "En riesgo";
}
export const planOperativoSugerido = (): IniciativaOperativa[] => [
  { nombre: "Plan comercial 2026",          eje: "Crecimiento rentable",   responsable: "Gerencia Comercial", fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Ventas netas",   estado: "Por iniciar" },
  { nombre: "Programa de experiencia CX",   eje: "Experiencia del cliente",responsable: "Customer Success",   fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "NPS",            estado: "Por iniciar" },
  { nombre: "Mapeo y estandarización SOP",  eje: "Excelencia operativa",   responsable: "Operaciones",        fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "% procesos doc.",estado: "Por iniciar" },
  { nombre: "Plan de formación 2026",       eje: "Talento y cultura",      responsable: "RRHH",               fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Horas/colab.",   estado: "Por iniciar" },
  { nombre: "Implementación CRM",           eje: "Transformación digital", responsable: "TI",                 fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Adopción CRM",   estado: "Por iniciar" },
];

// ───────────────── Sec 05: Valores corporativos ─────────────────
export const valoresSugeridos = () => [
  { nombre: "Integridad",   descripcion: "Actuamos con honestidad y coherencia en todo momento." },
  { nombre: "Excelencia",   descripcion: "Buscamos la calidad superior en lo que hacemos." },
  { nombre: "Innovación",   descripcion: "Cuestionamos lo establecido y proponemos mejoras constantes." },
  { nombre: "Colaboración", descripcion: "Trabajamos en equipo dentro y fuera de la organización." },
  { nombre: "Compromiso",   descripcion: "Cumplimos lo que prometemos a clientes y equipo." },
  { nombre: "Responsabilidad", descripcion: "Asumimos las consecuencias de nuestras decisiones." },
  { nombre: "Respeto",      descripcion: "Valoramos la diversidad y dignidad de cada persona." },
  { nombre: "Orientación al cliente", descripcion: "El cliente es el centro de nuestras decisiones." },
  { nombre: "Aprendizaje",  descripcion: "Aprendemos de los errores y los aciertos." },
  { nombre: "Sostenibilidad", descripcion: "Generamos valor económico, social y ambiental." },
];
