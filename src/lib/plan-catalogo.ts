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
    { nombre: "Crecimiento rentable",         descripcion: "Aumentar ingresos y margen sostenible mediante nuevos clientes, líneas, canales y geografías.", prioridad: "Alta" },
    { nombre: "Excelencia operativa",         descripcion: "Optimizar procesos críticos, productividad, calidad y costos de la operación.",                  prioridad: "Alta" },
    { nombre: "Experiencia del cliente",      descripcion: "Elevar NPS, fidelización y diferenciación a través de la experiencia end-to-end.",               prioridad: "Alta" },
    { nombre: "Talento y cultura",            descripcion: "Atraer, desarrollar y retener al talento crítico en una cultura de alto desempeño.",             prioridad: "Alta" },
    { nombre: "Transformación digital",       descripcion: "Digitalizar procesos, datos, canales y oferta para escalar y diferenciarse.",                    prioridad: "Alta" },
    { nombre: "Sostenibilidad y ESG",         descripcion: "Integrar criterios ambientales, sociales y de gobierno en la estrategia y la reputación.",       prioridad: "Media" },
    { nombre: "Innovación y desarrollo",      descripcion: "Sistematizar la innovación de producto, servicio y modelo de negocio.",                          prioridad: "Media" },
    { nombre: "Marca y posicionamiento",      descripcion: "Consolidar reputación, narrativa y visibilidad en el mercado objetivo.",                         prioridad: "Media" },
    { nombre: "Solidez financiera",           descripcion: "Asegurar liquidez, estructura de capital sana y disciplina de inversión.",                       prioridad: "Alta" },
    { nombre: "Gobierno corporativo y riesgos", descripcion: "Profesionalizar la gestión, controles internos y gestión integral de riesgos.",                prioridad: "Media" },
  ];
  if (sector === "tecnologia") base.push(
    { nombre: "Innovación de producto",          descripcion: "Roadmap de producto basado en evidencia, métricas y feedback de clientes.",  prioridad: "Alta" },
    { nombre: "Plataforma y arquitectura",       descripcion: "Escalabilidad, observabilidad, ciberseguridad y deuda técnica controlada.", prioridad: "Alta" },
  );
  if (sector === "manufactura") base.push(
    { nombre: "Industria 4.0",                   descripcion: "Automatización, IoT, mantenimiento predictivo y manufactura inteligente.",   prioridad: "Alta" },
    { nombre: "Eficiencia energética y residuos", descripcion: "Reducción de consumo, huella de carbono y economía circular.",              prioridad: "Media" },
    { nombre: "Cadena de suministro resiliente", descripcion: "Diversificación de proveedores, near-shoring y trazabilidad.",               prioridad: "Alta" },
  );
  if (sector === "retail") base.push(
    { nombre: "Omnicanalidad",                   descripcion: "Integración fluida entre tienda física, e-commerce, marketplace y app.",    prioridad: "Alta" },
    { nombre: "Logística y última milla",        descripcion: "Optimización de fulfillment, inventarios y experiencia de entrega.",        prioridad: "Alta" },
  );
  if (sector === "salud") base.push(
    { nombre: "Calidad asistencial y seguridad", descripcion: "Estándares de atención, acreditaciones y seguridad del paciente.",          prioridad: "Alta" },
    { nombre: "Telemedicina y salud digital",    descripcion: "Atención remota, expediente digital y dispositivos conectados.",            prioridad: "Media" },
  );
  if (sector === "financiero") base.push(
    { nombre: "Gestión de riesgos y compliance", descripcion: "Riesgo de crédito, mercado, operativo, KYC/AML y ciberseguridad.",         prioridad: "Alta" },
    { nombre: "Banca digital y open banking",    descripcion: "Canales digitales, APIs y nuevos modelos de ingreso.",                      prioridad: "Alta" },
  );
  if (sector === "educacion") base.push(
    { nombre: "Innovación pedagógica",           descripcion: "Modelos híbridos, microcredenciales y experiencia del estudiante.",         prioridad: "Alta" },
  );
  if (sector === "construccion") base.push(
    { nombre: "Construcción sostenible",         descripcion: "Materiales verdes, certificaciones LEED/EDGE y eficiencia en obra.",        prioridad: "Media" },
    { nombre: "Gestión de proyectos y BIM",      descripcion: "Estándares BIM, control de plazos, costos y calidad.",                      prioridad: "Alta" },
  );
  if (sector === "agro") base.push(
    { nombre: "Productividad y agricultura de precisión", descripcion: "Tecnología, riego eficiente y manejo de cultivos basado en datos.", prioridad: "Alta" },
    { nombre: "Trazabilidad y certificaciones",  descripcion: "Trazabilidad end-to-end, certificaciones orgánicas y de comercio justo.",   prioridad: "Media" },
  );
  if (sector === "servicios") base.push(
    { nombre: "Productización del servicio",     descripcion: "Empaquetar servicios en ofertas escalables y replicables.",                  prioridad: "Alta" },
  );
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
  // FINANCIERA
  { perspectiva: "Financiera",   objetivo: "Incrementar ingresos anuales",                    indicador: "Ventas netas (USD)",            meta: "+20% anual",   plazo: "12 meses", responsable: "Gerencia Comercial",    iniciativa: "Plan comercial anual" },
  { perspectiva: "Financiera",   objetivo: "Mejorar margen operativo",                        indicador: "EBITDA / Ventas",                meta: "≥ 18%",        plazo: "12 meses", responsable: "Dirección Financiera",  iniciativa: "Plan de eficiencia de costos" },
  { perspectiva: "Financiera",   objetivo: "Optimizar capital de trabajo",                    indicador: "Días de ciclo de caja",          meta: "≤ 45 días",    plazo: "9 meses",  responsable: "CFO",                   iniciativa: "Gestión de cobranzas e inventarios" },
  { perspectiva: "Financiera",   objetivo: "Diversificar fuentes de ingreso",                 indicador: "% ingresos recurrentes",          meta: "≥ 35%",        plazo: "18 meses", responsable: "Estrategia",            iniciativa: "Modelo de suscripción / servicios" },
  { perspectiva: "Financiera",   objetivo: "Asegurar rentabilidad por cliente",               indicador: "Margen por cliente (USD)",        meta: "+15%",         plazo: "12 meses", responsable: "Comercial",             iniciativa: "Pricing y mix de productos" },
  { perspectiva: "Financiera",   objetivo: "Reducir costos operativos",                       indicador: "Costos OpEx / Ventas",            meta: "-8 pp",        plazo: "12 meses", responsable: "COO",                   iniciativa: "Programa de eficiencia y compras" },

  // CLIENTE
  { perspectiva: "Cliente",      objetivo: "Elevar satisfacción y fidelización",              indicador: "NPS",                            meta: "≥ 60",         plazo: "12 meses", responsable: "Customer Success",      iniciativa: "Programa de experiencia de cliente" },
  { perspectiva: "Cliente",      objetivo: "Aumentar cuota en clientes clave",                indicador: "Share of wallet (%)",            meta: "+10 pp",       plazo: "12 meses", responsable: "Key Account Mgmt",      iniciativa: "Programa Key Account" },
  { perspectiva: "Cliente",      objetivo: "Captar nuevos clientes en segmento prioritario",  indicador: "Nuevos clientes/mes",            meta: "≥ 15",         plazo: "12 meses", responsable: "Marketing y Ventas",    iniciativa: "Plan de demand generation" },
  { perspectiva: "Cliente",      objetivo: "Reducir churn de clientes",                       indicador: "Tasa de churn anual (%)",        meta: "< 8%",         plazo: "12 meses", responsable: "Customer Success",      iniciativa: "Plan de retención y health score" },
  { perspectiva: "Cliente",      objetivo: "Fortalecer marca y reputación",                   indicador: "Brand awareness asistido (%)",   meta: "+15 pp",       plazo: "12 meses", responsable: "Marketing",             iniciativa: "Plan de comunicación y PR" },
  { perspectiva: "Cliente",      objetivo: "Mejorar conversión digital",                      indicador: "Tasa de conversión web (%)",     meta: "≥ 4%",         plazo: "9 meses",  responsable: "Marketing Digital",     iniciativa: "Optimización de funnel y UX" },

  // PROCESOS
  { perspectiva: "Procesos",     objetivo: "Estandarizar procesos críticos",                  indicador: "% procesos documentados",        meta: "100%",         plazo: "9 meses",  responsable: "Operaciones",           iniciativa: "Mapeo y SOP" },
  { perspectiva: "Procesos",     objetivo: "Reducir tiempos de entrega",                      indicador: "Lead time promedio (días)",      meta: "-30%",         plazo: "12 meses", responsable: "Operaciones",           iniciativa: "Lean / mejora continua" },
  { perspectiva: "Procesos",     objetivo: "Elevar calidad del producto/servicio",            indicador: "Tasa de no-conformidades",       meta: "< 1%",         plazo: "12 meses", responsable: "Calidad",               iniciativa: "Sistema de gestión de calidad" },
  { perspectiva: "Procesos",     objetivo: "Digitalizar procesos clave",                      indicador: "% procesos digitalizados",       meta: "≥ 80%",        plazo: "18 meses", responsable: "TI / Transformación",   iniciativa: "Programa de transformación digital" },
  { perspectiva: "Procesos",     objetivo: "Fortalecer ciberseguridad",                       indicador: "Madurez NIST (1-5)",             meta: "≥ 3.5",        plazo: "12 meses", responsable: "CISO / TI",             iniciativa: "Plan director de ciberseguridad" },
  { perspectiva: "Procesos",     objetivo: "Reducir huella ambiental",                        indicador: "Toneladas CO₂e",                 meta: "-15%",         plazo: "18 meses", responsable: "ESG / Operaciones",     iniciativa: "Plan de descarbonización" },
  { perspectiva: "Procesos",     objetivo: "Optimizar cadena de suministro",                  indicador: "OTIF (%)",                       meta: "≥ 95%",        plazo: "12 meses", responsable: "Supply Chain",          iniciativa: "Plan S&OP y diversificación de proveedores" },
  { perspectiva: "Procesos",     objetivo: "Implementar gestión de riesgos",                  indicador: "% riesgos mitigados",            meta: "≥ 80%",        plazo: "12 meses", responsable: "Compliance / Riesgos",  iniciativa: "Matriz de riesgos y BCP" },

  // APRENDIZAJE
  { perspectiva: "Aprendizaje",  objetivo: "Desarrollar competencias clave del equipo",       indicador: "Horas formación/colaborador",    meta: "≥ 40 h/año",   plazo: "12 meses", responsable: "RRHH",                  iniciativa: "Plan de formación anual" },
  { perspectiva: "Aprendizaje",  objetivo: "Retener talento crítico",                         indicador: "Rotación voluntaria (%)",        meta: "< 10%",        plazo: "12 meses", responsable: "RRHH",                  iniciativa: "Plan de retención y carrera" },
  { perspectiva: "Aprendizaje",  objetivo: "Elevar compromiso del equipo",                    indicador: "eNPS",                           meta: "≥ 40",         plazo: "12 meses", responsable: "RRHH / Cultura",        iniciativa: "Plan de engagement y bienestar" },
  { perspectiva: "Aprendizaje",  objetivo: "Construir cantera de liderazgo",                  indicador: "% posiciones críticas con sucesor", meta: "≥ 70%",     plazo: "18 meses", responsable: "RRHH",                  iniciativa: "Plan de sucesión y desarrollo" },
  { perspectiva: "Aprendizaje",  objetivo: "Fomentar cultura de innovación",                  indicador: "N° ideas implementadas/año",     meta: "≥ 12",         plazo: "12 meses", responsable: "Innovación",            iniciativa: "Programa de innovación interna" },
  { perspectiva: "Aprendizaje",  objetivo: "Diversidad e inclusión",                          indicador: "% diversidad en liderazgo",      meta: "≥ 40%",        plazo: "18 meses", responsable: "RRHH / DEI",            iniciativa: "Plan DEI" },
  { perspectiva: "Aprendizaje",  objetivo: "Adopción de herramientas digitales",              indicador: "% usuarios activos en CRM/ERP",  meta: "≥ 90%",        plazo: "9 meses",  responsable: "TI / Procesos",         iniciativa: "Plan de adopción y change mgmt" },
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
    // Comercial / Mercado
    "Lanzar nueva propuesta de valor diferenciada en el segmento prioritario",
    "Plan de cross-selling y up-selling sobre cartera actual",
    "Programa Key Account para los 20 clientes top",
    "Plan de internacionalización selectiva (mercados ancla)",
    "Apertura de nuevos canales (distribuidores, marketplace, partners)",
    // Producto / Innovación
    "Roadmap de producto basado en evidencia y feedback de clientes",
    "Modelo de ingresos recurrentes (suscripción / servicios gestionados)",
    "Programa de innovación abierta con clientes y startups",
    "Lanzamiento de línea premium / línea económica para ampliar mercado",
    // Marca y Marketing
    "Reposicionamiento de marca y nueva narrativa estratégica",
    "Plan de marketing digital (SEO, performance, content, ABM)",
    "Programa de embajadores y referrals",
    // Digital y Operaciones
    "Desarrollo de canal digital propio (e-commerce / portal cliente / SaaS)",
    "Implementación de CRM y automatización del funnel comercial",
    "Implementación de ERP y digitalización del back office",
    "Plan director de ciberseguridad y protección de datos",
    "Programa de analítica avanzada e IA para decisiones",
    // Personas y Cultura
    "Plan de atracción y retención de talento crítico",
    "Programa de desarrollo de mandos medios y sucesión",
    "Transformación cultural hacia alto desempeño",
    // Sostenibilidad / ESG
    "Plan de descarbonización y reporte ESG",
    "Programa de proveedores responsables",
    // Finanzas / M&A
    "Plan de fortalecimiento financiero y acceso a capital",
    "Búsqueda activa de alianzas estratégicas y posibles M&A",
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
  // Comercial
  { nombre: "Plan comercial anual",                eje: "Crecimiento rentable",        responsable: "Gerencia Comercial", fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Ventas netas",          estado: "Por iniciar" },
  { nombre: "Programa Key Account",                eje: "Crecimiento rentable",        responsable: "Key Account Mgmt",   fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Share of wallet",       estado: "Por iniciar" },
  { nombre: "Apertura de nuevos canales",          eje: "Crecimiento rentable",        responsable: "Comercial",          fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Ingresos por canal",    estado: "Por iniciar" },
  // Marketing y Marca
  { nombre: "Plan de marketing digital",           eje: "Marca y posicionamiento",     responsable: "Marketing",          fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "MQL / SQL",             estado: "Por iniciar" },
  { nombre: "Reposicionamiento de marca",          eje: "Marca y posicionamiento",     responsable: "Marketing",          fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Brand awareness",       estado: "Por iniciar" },
  // Cliente
  { nombre: "Programa de experiencia de cliente",  eje: "Experiencia del cliente",     responsable: "Customer Success",   fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "NPS",                   estado: "Por iniciar" },
  { nombre: "Plan de retención y health score",    eje: "Experiencia del cliente",     responsable: "Customer Success",   fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Churn",                 estado: "Por iniciar" },
  // Operaciones
  { nombre: "Mapeo y estandarización SOP",         eje: "Excelencia operativa",        responsable: "Operaciones",        fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "% procesos doc.",       estado: "Por iniciar" },
  { nombre: "Programa Lean / mejora continua",     eje: "Excelencia operativa",        responsable: "Operaciones",        fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Lead time",             estado: "Por iniciar" },
  { nombre: "Sistema de gestión de calidad",       eje: "Excelencia operativa",        responsable: "Calidad",            fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "No-conformidades",      estado: "Por iniciar" },
  { nombre: "Optimización de cadena de suministro",eje: "Excelencia operativa",        responsable: "Supply Chain",       fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "OTIF",                  estado: "Por iniciar" },
  // TI / Digital
  { nombre: "Implementación CRM",                  eje: "Transformación digital",      responsable: "TI",                 fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Adopción CRM",          estado: "Por iniciar" },
  { nombre: "Implementación ERP",                  eje: "Transformación digital",      responsable: "TI / Finanzas",      fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Adopción ERP",          estado: "Por iniciar" },
  { nombre: "Plan director de ciberseguridad",     eje: "Transformación digital",      responsable: "CISO / TI",          fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Madurez NIST",          estado: "Por iniciar" },
  { nombre: "Programa de analítica e IA",          eje: "Transformación digital",      responsable: "Data / TI",          fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Casos de uso en prod.", estado: "Por iniciar" },
  // Talento
  { nombre: "Plan de formación anual",             eje: "Talento y cultura",           responsable: "RRHH",               fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Horas/colab.",          estado: "Por iniciar" },
  { nombre: "Plan de retención y carrera",         eje: "Talento y cultura",           responsable: "RRHH",               fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Rotación voluntaria",   estado: "Por iniciar" },
  { nombre: "Plan de sucesión y liderazgo",        eje: "Talento y cultura",           responsable: "RRHH",               fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "% sucesores",           estado: "Por iniciar" },
  { nombre: "Programa de cultura y engagement",    eje: "Talento y cultura",           responsable: "RRHH / Cultura",     fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "eNPS",                  estado: "Por iniciar" },
  // Innovación
  { nombre: "Programa de innovación interna",      eje: "Innovación y desarrollo",     responsable: "Innovación",         fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Ideas implementadas",   estado: "Por iniciar" },
  { nombre: "Roadmap de producto/servicio",        eje: "Innovación y desarrollo",     responsable: "Producto",           fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Time-to-market",        estado: "Por iniciar" },
  // Finanzas / Riesgos
  { nombre: "Plan de eficiencia de costos",        eje: "Solidez financiera",          responsable: "CFO",                fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "OpEx / Ventas",         estado: "Por iniciar" },
  { nombre: "Gestión de capital de trabajo",       eje: "Solidez financiera",          responsable: "Tesorería",          fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Días ciclo de caja",    estado: "Por iniciar" },
  { nombre: "Matriz de riesgos y BCP",             eje: "Gobierno corporativo y riesgos", responsable: "Compliance",      fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "% riesgos mitigados",   estado: "Por iniciar" },
  // ESG
  { nombre: "Plan de descarbonización",            eje: "Sostenibilidad y ESG",        responsable: "ESG / Operaciones",  fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Toneladas CO₂e",        estado: "Por iniciar" },
  { nombre: "Reporte ESG y materialidad",          eje: "Sostenibilidad y ESG",        responsable: "ESG",                fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "Cumplimiento KPIs ESG", estado: "Por iniciar" },
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

// ═══════════════════════════════════════════════════════════════
//  FASE 3 — Secciones 10 a 13
// ═══════════════════════════════════════════════════════════════

// ───────────────── Sec 10: ESG / Sostenibilidad ─────────────────
export type DimensionESG = "Ambiental" | "Social" | "Gobernanza";
export interface MaterialidadESG {
  tema: string;
  dimension: DimensionESG;
  impacto_negocio: number;     // 1-5
  importancia_grupos: number;  // 1-5
  prioridad: "Alta" | "Media" | "Baja";
  accion: string;
}
export interface ObjetivoESG {
  dimension: DimensionESG;
  objetivo: string;
  indicador: string;
  meta: string;
  plazo: string;
  responsable: string;
  ods: string;          // Ej. "ODS 13"
}
export interface Sec10Data {
  proposito_sostenibilidad?: string;
  marco_referencia?: string[];     // GRI, SASB, TCFD, ISO 26000…
  ods_priorizados?: string[];
  materialidad?: MaterialidadESG[];
  objetivos?: ObjetivoESG[];
  riesgos_climaticos?: string;
  cadena_valor_responsable?: string;
  reporte_y_gobierno?: string;
}

export const marcoReferenciaESG = (): string[] => [
  "GRI Standards", "SASB", "TCFD", "ISO 26000", "Pacto Mundial ONU",
  "ODS 2030", "CDP (Carbon Disclosure)", "SBTi (Science Based Targets)",
  "B Corp", "ISO 14001", "ISO 45001", "ISO 37301 (Compliance)"
];
export const odsSugeridos = (sector: SectorKey): string[] => {
  const base = ["ODS 8 — Trabajo decente", "ODS 9 — Industria e innovación", "ODS 12 — Producción responsable", "ODS 13 — Acción climática"];
  const map: Partial<Record<SectorKey, string[]>> = {
    salud: ["ODS 3 — Salud y bienestar", "ODS 10 — Reducción de desigualdades"],
    educacion: ["ODS 4 — Educación de calidad", "ODS 5 — Igualdad de género"],
    agro: ["ODS 2 — Hambre cero", "ODS 6 — Agua limpia", "ODS 15 — Vida de ecosistemas"],
    construccion: ["ODS 11 — Ciudades sostenibles", "ODS 6 — Agua limpia"],
    tecnologia: ["ODS 4 — Educación de calidad", "ODS 5 — Igualdad de género"],
    financiero: ["ODS 1 — Fin de la pobreza", "ODS 10 — Reducción de desigualdades"],
    manufactura: ["ODS 7 — Energía asequible", "ODS 12 — Producción responsable"],
    retail: ["ODS 12 — Producción responsable", "ODS 5 — Igualdad de género"],
  };
  return Array.from(new Set([...base, ...(map[sector] ?? [])]));
};
const m = (tema: string, dimension: DimensionESG, impacto = 4, importancia = 4, accion = ""): MaterialidadESG =>
  ({ tema, dimension, impacto_negocio: impacto, importancia_grupos: importancia, prioridad: impacto + importancia >= 8 ? "Alta" : impacto + importancia >= 6 ? "Media" : "Baja", accion });
export const materialidadSugerida = (sector: SectorKey): MaterialidadESG[] => {
  const base: MaterialidadESG[] = [
    m("Cambio climático y emisiones GEI", "Ambiental", 5, 5, "Plan de descarbonización con SBTi"),
    m("Eficiencia energética", "Ambiental", 4, 4, "Auditoría energética y plan de eficiencia"),
    m("Gestión del agua", "Ambiental", 3, 4, "Medición y reducción de huella hídrica"),
    m("Economía circular y residuos", "Ambiental", 4, 4, "Programa de reducción y reciclaje"),
    m("Diversidad, equidad e inclusión", "Social", 4, 5, "Plan DEI con metas medibles"),
    m("Salud y seguridad ocupacional", "Social", 5, 5, "Sistema de gestión SST (ISO 45001)"),
    m("Desarrollo del talento", "Social", 4, 4, "Plan de formación y carrera"),
    m("Comunidades locales", "Social", 3, 4, "Programa de inversión social"),
    m("Derechos humanos en cadena de valor", "Social", 4, 4, "Debida diligencia en proveedores"),
    m("Ética y anticorrupción", "Gobernanza", 5, 5, "Programa de compliance ISO 37301"),
    m("Gobierno corporativo y consejo", "Gobernanza", 4, 4, "Profesionalización del directorio"),
    m("Ciberseguridad y protección de datos", "Gobernanza", 5, 5, "Plan director de ciberseguridad"),
    m("Transparencia y reporte", "Gobernanza", 4, 4, "Reporte integrado anual GRI/SASB"),
  ];
  if (sector === "manufactura" || sector === "construccion") base.push(
    m("Materiales y abastecimiento responsable", "Ambiental", 4, 4, "Política de compras sostenibles"),
    m("Biodiversidad", "Ambiental", 3, 4, "Evaluación de impacto en biodiversidad"),
  );
  if (sector === "agro") base.push(
    m("Uso del suelo y agroquímicos", "Ambiental", 5, 5, "Manejo integrado y certificación"),
    m("Bienestar animal", "Social", 3, 4, "Estándares de bienestar animal"),
  );
  if (sector === "financiero") base.push(
    m("Finanzas sostenibles y taxonomía", "Gobernanza", 5, 5, "Cartera con criterios ESG"),
    m("Inclusión financiera", "Social", 4, 5, "Productos para segmentos no bancarizados"),
  );
  if (sector === "salud") base.push(
    m("Acceso a la salud", "Social", 5, 5, "Programas de acceso y precios diferenciados"),
    m("Privacidad de datos clínicos", "Gobernanza", 5, 5, "Cumplimiento HIPAA / normativa local"),
  );
  if (sector === "tecnologia") base.push(
    m("IA responsable y ética algorítmica", "Gobernanza", 5, 5, "Marco de IA responsable"),
    m("Huella digital y data centers", "Ambiental", 4, 4, "Cloud verde y eficiencia de cómputo"),
  );
  return base;
};
export const objetivosESGSugeridos = (): ObjetivoESG[] => [
  { dimension: "Ambiental", objetivo: "Reducir emisiones GEI alcance 1+2", indicador: "tCO₂e", meta: "-30%", plazo: "2030", responsable: "ESG / Operaciones", ods: "ODS 13" },
  { dimension: "Ambiental", objetivo: "Energía renovable en operaciones", indicador: "% energía renovable", meta: "≥ 80%", plazo: "2028", responsable: "Operaciones", ods: "ODS 7" },
  { dimension: "Ambiental", objetivo: "Cero residuos a vertedero", indicador: "% residuos valorizados", meta: "≥ 90%", plazo: "2027", responsable: "Operaciones", ods: "ODS 12" },
  { dimension: "Ambiental", objetivo: "Reducir consumo de agua", indicador: "m³/unidad producida", meta: "-20%", plazo: "2027", responsable: "Operaciones", ods: "ODS 6" },
  { dimension: "Social", objetivo: "Cero accidentes graves", indicador: "Tasa de frecuencia (LTIFR)", meta: "< 1.0", plazo: "12 meses", responsable: "SST", ods: "ODS 8" },
  { dimension: "Social", objetivo: "Diversidad en liderazgo", indicador: "% mujeres en posiciones directivas", meta: "≥ 40%", plazo: "2027", responsable: "RRHH / DEI", ods: "ODS 5" },
  { dimension: "Social", objetivo: "Brecha salarial de género", indicador: "Brecha (%)", meta: "< 3%", plazo: "2026", responsable: "RRHH", ods: "ODS 5" },
  { dimension: "Social", objetivo: "Inversión en comunidad", indicador: "% utilidades reinvertidas", meta: "≥ 1%", plazo: "Anual", responsable: "Sostenibilidad", ods: "ODS 11" },
  { dimension: "Social", objetivo: "Cadena de valor auditada en DDHH", indicador: "% proveedores auditados", meta: "100% críticos", plazo: "24 meses", responsable: "Compras", ods: "ODS 8" },
  { dimension: "Gobernanza", objetivo: "Programa de compliance certificado", indicador: "Certificación ISO 37301", meta: "Lograda", plazo: "24 meses", responsable: "Compliance", ods: "ODS 16" },
  { dimension: "Gobernanza", objetivo: "Independencia del directorio", indicador: "% miembros independientes", meta: "≥ 33%", plazo: "12 meses", responsable: "Directorio", ods: "ODS 16" },
  { dimension: "Gobernanza", objetivo: "Reporte de sostenibilidad", indicador: "Reporte GRI verificado", meta: "Anual", plazo: "12 meses", responsable: "ESG", ods: "ODS 12" },
  { dimension: "Gobernanza", objetivo: "Gestión integral de riesgos ESG", indicador: "Matriz de riesgos ESG", meta: "Implementada", plazo: "12 meses", responsable: "Riesgos", ods: "ODS 16" },
];

// ───────────────── Sec 11: Alianzas estratégicas ─────────────────
export type TipoAlianza = "Comercial" | "Tecnológica" | "I+D / Innovación" | "Operativa / Logística" | "Financiera" | "Joint Venture" | "Académica" | "Institucional / Sectorial" | "ESG / Comunidad";
export interface Alianza {
  socio: string;
  tipo: TipoAlianza;
  objetivo: string;
  aporte_propio: string;
  aporte_socio: string;
  modelo_relacion: string;     // Acuerdo marco, contrato, JV…
  estado: "Identificada" | "En conversación" | "Negociación" | "Activa" | "Pausada";
  responsable: string;
  riesgo: "Bajo" | "Medio" | "Alto";
  valor_esperado: string;
}
export interface Sec11Data {
  estrategia_alianzas?: string;
  criterios_seleccion?: string;
  alianzas?: Alianza[];
  ecosistema_actual?: string;
  gobernanza_alianzas?: string;
}

const a = (socio: string, tipo: TipoAlianza, objetivo: string, aporte_propio = "", aporte_socio = "", modelo = "Acuerdo marco", estado: Alianza["estado"] = "Identificada", responsable = "Dirección de Estrategia", riesgo: Alianza["riesgo"] = "Medio", valor_esperado = ""): Alianza =>
  ({ socio, tipo, objetivo, aporte_propio, aporte_socio, modelo_relacion: modelo, estado, responsable, riesgo, valor_esperado });

export const alianzasSugeridas = (sector: SectorKey): Alianza[] => {
  const base: Alianza[] = [
    a("Cliente ancla del segmento prioritario", "Comercial", "Co-creación de propuesta de valor y caso de éxito flagship", "Producto/servicio", "Volumen y referencia", "Acuerdo marco", "En conversación", "Comercial", "Bajo", "Caso de éxito + 20% incremento en pipeline"),
    a("Distribuidor regional especializado", "Comercial", "Ampliar cobertura geográfica con bajo CapEx", "Marca y producto", "Red comercial y logística", "Contrato de distribución", "Identificada", "Comercial", "Medio", "Acceso a 3 nuevos mercados"),
    a("Marketplace o plataforma digital líder", "Comercial", "Acelerar canal digital y captación", "Catálogo y operación", "Tráfico y marca", "Acuerdo de marketplace", "Identificada", "Marketing Digital", "Bajo", "Nuevo canal de ingresos"),
    a("Proveedor estratégico crítico", "Operativa / Logística", "Asegurar suministro y mejorar costos vía partnership", "Volumen y previsión", "Capacidad y desarrollo conjunto", "Contrato a largo plazo", "Negociación", "Compras / Supply Chain", "Medio", "Reducción 8-12% en costo de insumos"),
    a("Operador logístico (3PL/4PL)", "Operativa / Logística", "Externalizar logística no core y elevar OTIF", "Volumen", "Red, tecnología y SLAs", "Contrato de servicio", "Identificada", "Supply Chain", "Bajo", "OTIF ≥ 95%"),
    a("Universidad / Centro de I+D", "Académica", "Desarrollo conjunto de capacidades y captación de talento", "Casos reales y financiación", "Investigación y talento", "Convenio marco", "Identificada", "Innovación / RRHH", "Bajo", "Pipeline de talento + proyectos I+D"),
    a("Proveedor tecnológico (cloud / SaaS / IA)", "Tecnológica", "Acelerar transformación digital y reducir time-to-market", "Casos de uso y presupuesto", "Plataforma, expertise y co-marketing", "Acuerdo de partnership", "Negociación", "TI", "Bajo", "Reducción 30% en time-to-market"),
    a("Partner integrador / consultor", "Tecnológica", "Implementación rápida de plataformas críticas (ERP/CRM)", "Sponsor ejecutivo", "Implementación y change mgmt", "Contrato de servicio", "Identificada", "TI / Procesos", "Medio", "Implementación en plazo y presupuesto"),
    a("Startup del ecosistema (open innovation)", "I+D / Innovación", "Pilotos de innovación con bajo riesgo", "Acceso a clientes y datos", "Tecnología disruptiva", "Acuerdo de pilotaje", "Identificada", "Innovación", "Medio", "2-3 pilotos al año, 1 escalado"),
    a("Banca corporativa / fondo", "Financiera", "Financiamiento estructurado para crecimiento o M&A", "Plan de inversión", "Capital y asesoría", "Línea de crédito / equity", "En conversación", "CFO", "Medio", "Acceso a USD X de capital"),
    a("Aseguradora / corredor especializado", "Financiera", "Cobertura integral de riesgos del negocio", "Información y volumen", "Pólizas y asesoría", "Contrato anual", "Identificada", "Riesgos / CFO", "Bajo", "Reducción de exposición a riesgos clave"),
    a("Gremio o asociación sectorial", "Institucional / Sectorial", "Influencia regulatoria y networking de alto nivel", "Cuota y participación activa", "Voz colectiva e información", "Membresía", "Activa", "Dirección General", "Bajo", "Posicionamiento sectorial"),
    a("ONG / fundación local", "ESG / Comunidad", "Programa de inversión social con impacto medible", "Recursos y voluntariado", "Conocimiento territorial", "Convenio de colaboración", "Identificada", "Sostenibilidad / RRHH", "Bajo", "Programa con impacto reportable"),
    a("Competidor complementario", "Joint Venture", "Acceso conjunto a mercado/producto que ninguno cubre solo", "Capacidades complementarias", "Capacidades complementarias", "Joint Venture", "Identificada", "Estrategia / CFO", "Alto", "Nueva línea de negocio compartida"),
  ];
  if (sector === "tecnologia") base.push(
    a("Hyperscaler (AWS / Azure / GCP)", "Tecnológica", "Programa de partnership y co-selling", "Casos y arquitectura", "Créditos cloud y leads", "Programa de partner", "En conversación", "TI / Comercial", "Bajo", "Pipeline conjunto + créditos"),
  );
  if (sector === "manufactura" || sector === "construccion") base.push(
    a("Proveedor de tecnología 4.0 / BIM", "Tecnológica", "Modernización de planta/obra y eficiencia", "Casos piloto", "Tecnología y soporte", "Contrato + pilotos", "Identificada", "Operaciones", "Medio", "Mejora de productividad 10-15%"),
  );
  if (sector === "salud") base.push(
    a("Aseguradoras y EPS", "Comercial", "Convenios para acceso de pacientes", "Servicios y calidad", "Volumen de afiliados", "Convenio", "Negociación", "Comercial", "Medio", "Crecimiento de demanda"),
  );
  if (sector === "agro") base.push(
    a("Cadena exportadora / trading", "Comercial", "Acceso a mercados internacionales", "Producto certificado", "Logística y comercialización", "Contrato de exportación", "Identificada", "Comercial", "Medio", "Nuevos mercados de exportación"),
  );
  if (sector === "financiero") base.push(
    a("Fintech / wallet", "Tecnológica", "Open banking y nuevos canales", "Base de clientes", "Tecnología y UX", "Acuerdo de integración", "Identificada", "Innovación", "Medio", "Nuevos productos digitales"),
  );
  return base;
};

// ───────────────── Sec 12: Innovación e I+D+i ─────────────────
export type TipoInnovacion = "Producto" | "Servicio" | "Proceso" | "Modelo de negocio" | "Marketing" | "Organizacional" | "Tecnológica";
export type HorizonteInnovacion = "H1 (Core 0-12m)" | "H2 (Adyacente 12-36m)" | "H3 (Disruptiva 36m+)";
export interface IniciativaInnovacion {
  nombre: string;
  tipo: TipoInnovacion;
  horizonte: HorizonteInnovacion;
  descripcion: string;
  responsable: string;
  presupuesto: number;
  kpi: string;
  estado: "Idea" | "Pilotaje" | "Escalado" | "Descartada";
}
export interface Sec12Data {
  vision_innovacion?: string;
  modelo_innovacion?: string;        // abierta, cerrada, mixta
  inversion_idi_pct_ventas?: string;
  fuentes_financiamiento?: string[]; // créditos fiscales, fondos, capital propio
  metodologias?: string[];           // Design Thinking, Lean Startup, Stage-Gate, Scrum
  ecosistema?: string;               // universidades, startups, hubs
  iniciativas?: IniciativaInnovacion[];
  proteccion_pi?: string;            // patentes, marcas, secreto industrial
  cultura_innovacion?: string;
}
export const metodologiasInnovacion = (): string[] => [
  "Design Thinking", "Lean Startup", "Stage-Gate", "Agile / Scrum", "Jobs-to-be-Done",
  "Design Sprint", "Open Innovation", "Co-creación con clientes", "Hackathons internos", "Innovation Labs"
];
export const fuentesFinanciamientoIdi = (): string[] => [
  "Capital propio (CapEx I+D)", "Créditos fiscales / deducciones I+D",
  "Fondos públicos / agencias de innovación", "Cooperación internacional",
  "Capital de riesgo / corporate venture", "Crowdfunding", "Banca de desarrollo"
];

const inn = (nombre: string, tipo: TipoInnovacion, horizonte: HorizonteInnovacion, descripcion: string, responsable = "Innovación", presupuesto = 0, kpi = "", estado: IniciativaInnovacion["estado"] = "Idea"): IniciativaInnovacion =>
  ({ nombre, tipo, horizonte, descripcion, responsable, presupuesto, kpi, estado });

export const iniciativasInnovacionSugeridas = (sector: SectorKey): IniciativaInnovacion[] => {
  const base: IniciativaInnovacion[] = [
    inn("Mejora continua del producto principal", "Producto", "H1 (Core 0-12m)", "Roadmap trimestral basado en feedback de clientes y datos de uso", "Producto", 0, "NPS / adopción"),
    inn("Personalización por segmento", "Producto", "H1 (Core 0-12m)", "Versiones adaptadas a 2-3 segmentos clave", "Producto", 0, "Conversión por segmento"),
    inn("Servicios postventa de valor agregado", "Servicio", "H1 (Core 0-12m)", "Mantenimiento, monitoreo y consultoría como ingreso recurrente", "Customer Success", 0, "ARR servicios"),
    inn("Automatización de procesos críticos (RPA)", "Proceso", "H1 (Core 0-12m)", "Identificar 5 procesos repetitivos y automatizarlos", "TI / Procesos", 0, "Horas ahorradas"),
    inn("Modelo de suscripción / 'as-a-service'", "Modelo de negocio", "H2 (Adyacente 12-36m)", "Migrar parte de la oferta a ingresos recurrentes", "Estrategia", 0, "% ingresos recurrentes"),
    inn("Plataforma digital de cliente", "Tecnológica", "H2 (Adyacente 12-36m)", "Portal/app con autoservicio, soporte y comunidad", "TI / Producto", 0, "Usuarios activos / NPS digital"),
    inn("Analítica avanzada y casos de IA", "Tecnológica", "H2 (Adyacente 12-36m)", "3-5 casos de uso de IA priorizados (forecast, churn, pricing)", "Data / TI", 0, "Casos en producción"),
    inn("Producto sostenible / línea verde", "Producto", "H2 (Adyacente 12-36m)", "Línea con menor huella, certificación y narrativa propia", "Producto / ESG", 0, "Ventas línea verde"),
    inn("Programa de innovación abierta", "Organizacional", "H2 (Adyacente 12-36m)", "Pilotos con startups y universidades, 4 retos al año", "Innovación", 0, "Pilotos / escalados"),
    inn("Co-creación con clientes clave", "Marketing", "H1 (Core 0-12m)", "Advisory board y sesiones trimestrales de co-creación", "Producto / Comercial", 0, "Ideas implementadas"),
    inn("Nuevo modelo de distribución", "Modelo de negocio", "H2 (Adyacente 12-36m)", "D2C, marketplace propio o partner", "Comercial", 0, "Ingresos nuevo canal"),
    inn("Spin-off o nueva línea disruptiva", "Modelo de negocio", "H3 (Disruptiva 36m+)", "Explorar negocio adyacente con potencial 10x", "Estrategia / CEO", 0, "TIR proyecto"),
    inn("Ingreso a mercado internacional", "Modelo de negocio", "H3 (Disruptiva 36m+)", "Mercado ancla con socio local", "Internacional", 0, "Ventas exportación"),
    inn("Cultura y capacidades de innovación", "Organizacional", "H1 (Core 0-12m)", "Formación, premios internos, tiempo dedicado a innovar", "RRHH / Innovación", 0, "Ideas presentadas"),
  ];
  if (sector === "tecnologia") base.push(
    inn("Producto nativo de IA generativa", "Producto", "H2 (Adyacente 12-36m)", "Feature/producto basado en LLMs con caso de uso claro", "Producto / Data", 0, "Adopción + ARR"),
    inn("Marketplace de extensiones / API pública", "Tecnológica", "H3 (Disruptiva 36m+)", "Plataforma abierta con ecosistema de partners", "Producto / Plataforma", 0, "N° integraciones activas"),
  );
  if (sector === "manufactura") base.push(
    inn("Mantenimiento predictivo IoT", "Proceso", "H2 (Adyacente 12-36m)", "Sensores + ML para reducir paradas no planificadas", "Operaciones / TI", 0, "Downtime no planificado"),
    inn("Producto conectado (servitización)", "Modelo de negocio", "H3 (Disruptiva 36m+)", "Vender uso del activo, no el activo", "Estrategia", 0, "% ingresos por uso"),
  );
  if (sector === "retail") base.push(
    inn("Personalización con IA en e-commerce", "Tecnológica", "H1 (Core 0-12m)", "Recomendaciones, búsqueda y pricing dinámico", "Marketing Digital", 0, "Conversión / AOV"),
    inn("Tienda híbrida / phygital", "Servicio", "H2 (Adyacente 12-36m)", "Click & collect, AR, escaparate digital", "Operaciones", 0, "Tráfico cruzado canales"),
  );
  if (sector === "salud") base.push(
    inn("Telemedicina y monitoreo remoto", "Servicio", "H1 (Core 0-12m)", "Consulta remota y seguimiento crónico", "Médica / TI", 0, "Pacientes atendidos"),
    inn("Plataforma de expediente y datos clínicos", "Tecnológica", "H2 (Adyacente 12-36m)", "Interoperabilidad y analítica clínica", "TI", 0, "Adopción"),
  );
  if (sector === "financiero") base.push(
    inn("App móvil de nueva generación", "Producto", "H1 (Core 0-12m)", "UX líder + onboarding 100% digital", "Digital", 0, "Usuarios activos / NPS"),
    inn("Open banking y APIs", "Tecnológica", "H2 (Adyacente 12-36m)", "APIs para fintechs y comercios", "TI / Producto", 0, "N° integraciones"),
  );
  if (sector === "agro") base.push(
    inn("Agricultura de precisión", "Tecnológica", "H2 (Adyacente 12-36m)", "Sensores, drones, prescripciones por lote", "Operaciones", 0, "Rendimiento por hectárea"),
  );
  if (sector === "construccion") base.push(
    inn("Adopción BIM nivel 2/3", "Proceso", "H2 (Adyacente 12-36m)", "Modelado integral y coordinación digital de obra", "Proyectos", 0, "Reducción de retrabajos"),
  );
  if (sector === "educacion") base.push(
    inn("Aprendizaje adaptativo con IA", "Producto", "H2 (Adyacente 12-36m)", "Rutas personalizadas y analítica de aprendizaje", "Académica / TI", 0, "Tasa de finalización"),
  );
  return base;
};

// ───────────────── Sec 13: Marketing estratégico ─────────────────
export interface SegmentoCliente {
  nombre: string;
  descripcion: string;
  tamano_mercado: string;
  necesidad_clave: string;
  prioridad: "Alta" | "Media" | "Baja";
}
export interface BuyerPersona {
  nombre: string;
  rol: string;
  motivaciones: string;
  dolores: string;
  canales: string;
}
export interface PropuestaValor {
  segmento: string;
  problema: string;
  solucion: string;
  diferencial: string;
  prueba: string;       // testimonios, métricas, certificaciones
}
export interface MarketingMix {
  producto: string;
  precio: string;
  plaza: string;          // canales
  promocion: string;
  personas: string;
  procesos: string;
  evidencia_fisica: string;
}
export interface IniciativaMarketing {
  nombre: string;
  categoria: "Marca" | "Demand Gen" | "Contenidos" | "Performance" | "ABM" | "Eventos" | "PR" | "CRM / Fidelización" | "Producto / Pricing";
  objetivo: string;
  canal: string;
  kpi: string;
  presupuesto: number;
  responsable: string;
  estado: "Por iniciar" | "En curso" | "Completada" | "En riesgo";
}
export interface Sec13Data {
  posicionamiento?: string;
  segmentacion?: SegmentoCliente[];
  buyer_personas?: BuyerPersona[];
  propuestas_valor?: PropuestaValor[];
  marketing_mix?: MarketingMix;
  funnel_y_journey?: string;
  estrategia_marca?: string;
  estrategia_pricing?: string;
  canales_y_distribucion?: string;
  iniciativas?: IniciativaMarketing[];
  presupuesto_total?: number;
  kpis_globales?: string;
}

export const segmentosSugeridos = (sector: SectorKey): SegmentoCliente[] => {
  const com: SegmentoCliente[] = [
    { nombre: "Cliente premium", descripcion: "Alto poder adquisitivo, valora calidad y servicio sobre precio", tamano_mercado: "—", necesidad_clave: "Calidad superior y experiencia diferenciada", prioridad: "Alta" },
    { nombre: "Cliente masivo", descripcion: "Sensible a precio, busca relación calidad-precio", tamano_mercado: "—", necesidad_clave: "Accesibilidad y conveniencia", prioridad: "Media" },
    { nombre: "Cliente corporativo / B2B", descripcion: "Compra profesional, ciclos largos, decisión por comité", tamano_mercado: "—", necesidad_clave: "ROI demostrable y soporte continuo", prioridad: "Alta" },
  ];
  if (sector === "tecnologia") return [
    ...com,
    { nombre: "Mid-market SaaS", descripcion: "Empresas 50-500 empleados con necesidad de digitalización", tamano_mercado: "—", necesidad_clave: "Implementación rápida y ROI < 12m", prioridad: "Alta" },
    { nombre: "Enterprise", descripcion: "Grandes corporaciones con ciclos largos y alta personalización", tamano_mercado: "—", necesidad_clave: "Seguridad, compliance e integración", prioridad: "Media" },
  ];
  if (sector === "retail") return [
    ...com,
    { nombre: "Comprador digital nativo", descripcion: "Millennials/Z que compran principalmente online", tamano_mercado: "—", necesidad_clave: "Experiencia móvil y entrega rápida", prioridad: "Alta" },
  ];
  if (sector === "salud") return [
    { nombre: "Paciente particular", descripcion: "Paga directo, busca calidad y trato personal", tamano_mercado: "—", necesidad_clave: "Atención humana y rápida", prioridad: "Alta" },
    { nombre: "Asegurado por EPS/aseguradora", descripcion: "Acceso vía convenio", tamano_mercado: "—", necesidad_clave: "Cobertura y oportunidad", prioridad: "Alta" },
    { nombre: "Empresas (medicina ocupacional)", descripcion: "Convenios corporativos", tamano_mercado: "—", necesidad_clave: "Cumplimiento y precio", prioridad: "Media" },
  ];
  return com;
};

export const buyerPersonasSugeridos = (sector: SectorKey): BuyerPersona[] => {
  if (sector === "tecnologia") return [
    { nombre: "CIO / Director TI", rol: "Decisor técnico", motivaciones: "Modernizar stack, reducir deuda técnica, ciberseguridad", dolores: "Presupuesto limitado, riesgo de fracaso", canales: "LinkedIn, eventos sectoriales, analyst reports" },
    { nombre: "CFO", rol: "Decisor económico", motivaciones: "ROI claro, control de costos", dolores: "Gastos imprevistos, vendor lock-in", canales: "Webinars, business cases, referencias" },
    { nombre: "Head of Operations", rol: "Usuario / champion interno", motivaciones: "Eficiencia operativa, automatización", dolores: "Procesos manuales, errores", canales: "Demos, comunidades, contenidos prácticos" },
  ];
  if (sector === "retail") return [
    { nombre: "Comprador digital 25-40", rol: "Consumidor final", motivaciones: "Conveniencia, variedad, precio", dolores: "Tiempos de entrega, devoluciones", canales: "Instagram, TikTok, email, Google" },
    { nombre: "Comprador familiar", rol: "Consumidor final con poder de decisión familiar", motivaciones: "Calidad-precio, confianza", dolores: "Falta de tiempo, ofertas confusas", canales: "Tienda física, WhatsApp, Facebook" },
  ];
  return [
    { nombre: "Decisor B2B", rol: "Gerente / director del área compradora", motivaciones: "Resultados medibles, bajar riesgo", dolores: "Presión por resultados, falta de tiempo", canales: "LinkedIn, referidos, eventos" },
    { nombre: "Influenciador técnico", rol: "Especialista que recomienda", motivaciones: "Solución que funcione y le simplifique trabajo", dolores: "Soluciones que prometen y no cumplen", canales: "Demos, contenidos técnicos, comunidades" },
    { nombre: "Usuario final", rol: "Quien usará el producto/servicio", motivaciones: "Facilidad de uso, soporte", dolores: "Curva de aprendizaje, falta de soporte", canales: "Onboarding, tutoriales, soporte" },
  ];
};

export const propuestasValorSugeridas = (sector: SectorKey): PropuestaValor[] => [
  { segmento: "Cliente prioritario", problema: "Pierde tiempo y dinero por procesos ineficientes / oferta indiferenciada", solucion: `Solución integral del sector ${sector} con acompañamiento experto`, diferencial: "Experiencia, time-to-value rápido y soporte dedicado", prueba: "Casos de éxito, métricas verificables y testimonios" },
  { segmento: "Cliente corporativo", problema: "Necesita escalar con confianza y cumplimiento", solucion: "Servicio enterprise con SLA, seguridad y gobierno", diferencial: "Capacidad de escalado y certificaciones", prueba: "Logos de clientes, certificaciones, SLAs cumplidos" },
];

export const marketingMixSugerido = (): MarketingMix => ({
  producto: "Portafolio segmentado por necesidad: línea core, premium y entry. Roadmap evolutivo trimestral.",
  precio: "Pricing por valor (value-based) con paquetes (good/better/best). Descuentos por volumen y compromiso multianual.",
  plaza: "Canales: venta directa consultiva (B2B), e-commerce propio (B2C), marketplaces y partners/distribuidores en regiones secundarias.",
  promocion: "Mix: marketing de contenidos + SEO/SEM + ABM para top accounts + eventos sectoriales + PR + email automation.",
  personas: "Equipo comercial consultivo, customer success dedicado, voz del cliente integrada en producto.",
  procesos: "Funnel automatizado en CRM, SLA de respuesta, journeys de onboarding y fidelización medidos.",
  evidencia_fisica: "Identidad de marca consistente, casos de éxito, certificaciones, oficinas/web/app que reflejen la promesa.",
});

const im = (nombre: string, categoria: IniciativaMarketing["categoria"], objetivo: string, canal: string, kpi: string, responsable = "Marketing"): IniciativaMarketing =>
  ({ nombre, categoria, objetivo, canal, kpi, presupuesto: 0, responsable, estado: "Por iniciar" });

export const iniciativasMarketingSugeridas = (sector: SectorKey): IniciativaMarketing[] => {
  const base: IniciativaMarketing[] = [
    im("Reposicionamiento y rebranding", "Marca", "Reforzar promesa de marca y diferenciación", "Identidad, web, comunicación", "Brand awareness asistido"),
    im("Estrategia de contenidos / inbound", "Contenidos", "Atraer demanda cualificada con autoridad de categoría", "Blog, SEO, LinkedIn, YouTube", "Tráfico orgánico / MQL"),
    im("Plan SEO técnico y de contenidos", "Contenidos", "Posicionar en términos de alto intento de compra", "Google", "Posiciones top 3 / sesiones"),
    im("Performance: Google + Meta Ads", "Performance", "Generación de leads y ventas con ROAS positivo", "Google Ads, Meta Ads", "ROAS / CAC"),
    im("Programa ABM (Account-Based Marketing)", "ABM", "Penetrar 50 cuentas top con campañas 1:1 y 1:few", "LinkedIn, email, eventos privados", "Reuniones / pipeline ABM"),
    im("Email marketing y nurturing", "CRM / Fidelización", "Convertir base de leads y reactivar clientes", "Email / Marketing automation", "Open / CTR / conversiones"),
    im("Programa de referidos y embajadores", "CRM / Fidelización", "Crecer vía recomendación de clientes y empleados", "Comunidad / programa", "Leads referidos"),
    im("Eventos propios y participación sectorial", "Eventos", "Generar relación y pipeline con decisores", "Eventos físicos e híbridos", "Leads y oportunidades"),
    im("Webinars y demos masivas", "Demand Gen", "Educar mercado y alimentar pipeline", "Webinar / video", "Inscritos / SQL"),
    im("Plan de PR y relaciones públicas", "PR", "Posicionamiento como referente sectorial", "Medios, podcasts, foros", "Menciones / share of voice"),
    im("Caso de éxito flagship con cliente ancla", "Contenidos", "Dotar al equipo comercial de prueba potente", "Video, PDF, charlas", "Uso en deals / win rate"),
    im("Optimización de la web y CRO", "Performance", "Subir conversión del tráfico actual", "Web", "Tasa de conversión"),
    im("Implementación / madurez de CRM", "CRM / Fidelización", "Visibilidad full funnel y forecasting confiable", "CRM (HubSpot/Salesforce)", "Adopción y forecast accuracy"),
    im("Estrategia de pricing y empaquetado", "Producto / Pricing", "Mejorar margen y ticket promedio", "Comercial", "Ticket promedio / margen"),
    im("Programa de fidelización y lealtad", "CRM / Fidelización", "Reducir churn y aumentar LTV", "App / email / tarjeta", "Churn / LTV"),
    im("Voz del cliente y NPS", "CRM / Fidelización", "Captura sistemática de NPS y CSAT con loops de mejora", "Encuestas / entrevistas", "NPS / CSAT"),
    im("Estrategia de redes sociales orgánicas", "Contenidos", "Construir comunidad y autoridad", "LinkedIn, Instagram, TikTok", "Engagement / followers cualificados"),
    im("Influencer / partner marketing", "Performance", "Aprovechar audiencias afines de terceros", "Influencers / partners", "CAC / leads"),
  ];
  if (sector === "tecnologia") base.push(
    im("Programa de partners y co-marketing", "ABM", "Generar pipeline conjunto con hyperscalers/integradores", "Co-marketing", "Pipeline conjunto"),
    im("Comunidad de usuarios y developers", "CRM / Fidelización", "Crear moat vía comunidad activa", "Foro / Slack / eventos", "Miembros activos"),
  );
  if (sector === "retail") base.push(
    im("Estrategia omnicanal (online + tienda)", "Demand Gen", "Integrar experiencia entre canales", "Web, app, tienda", "Cliente cross-canal"),
    im("Marketplace y D2C", "Demand Gen", "Diversificar canales digitales", "Marketplaces / web propia", "Ingresos por canal"),
  );
  if (sector === "salud") base.push(
    im("Convenios con aseguradoras y empresas", "ABM", "Acceso a flujo continuo de pacientes", "B2B salud", "Pacientes/mes por convenio"),
    im("Educación al paciente / contenidos salud", "Contenidos", "Generar confianza y diferenciación", "Web, video, redes", "Tráfico / leads"),
  );
  if (sector === "financiero") base.push(
    im("Marketing de productos digitales", "Performance", "Onboarding 100% digital de clientes nuevos", "App / web", "CAC / activación"),
    im("Educación financiera", "Contenidos", "Posicionamiento como aliado financiero", "Contenidos / talleres", "Engagement / leads"),
  );
  if (sector === "agro") base.push(
    im("Ferias y demostraciones de campo", "Eventos", "Demostrar valor con productores en terreno", "Ferias / días de campo", "Leads cualificados"),
  );
  if (sector === "construccion") base.push(
    im("Showroom virtual / tour 360", "Producto / Pricing", "Mostrar proyectos terminados a distancia", "Web / VR", "Visitas / leads"),
  );
  return base;
};
