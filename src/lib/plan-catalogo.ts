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
  const com = {
    Politico: [baseP("Estabilidad política regional", "Cambios de gobierno y políticas regulatorias", 3, "Amenaza"), baseP("Política tributaria", "Reformas fiscales y carga impositiva", 4, "Amenaza"), baseP("Acuerdos comerciales", "TLC y aranceles del sector", 3, "Oportunidad")],
    Economico: [baseP("Tipo de cambio", "Volatilidad cambiaria y costos importados", 4, "Amenaza"), baseP("Inflación", "Presión sobre costos operativos y precios", 4, "Amenaza"), baseP("Crecimiento del PIB sectorial", "Demanda agregada del sector", 3, "Oportunidad")],
    Social: [baseP("Cambios demográficos", "Envejecimiento o crecimiento poblacional", 3, "Oportunidad"), baseP("Hábitos de consumo", "Nuevas preferencias y estilos de vida", 4, "Oportunidad")],
    Tecnologico: [baseP("Digitalización del sector", "Automatización y nuevos canales", 4, "Oportunidad"), baseP("Ciberseguridad", "Riesgos de ataques y filtraciones", 4, "Amenaza")],
    Ambiental: [baseP("Regulación ambiental", "Nuevas exigencias normativas", 3, "Amenaza"), baseP("Cambio climático", "Eventos extremos y costos de adaptación", 3, "Amenaza")],
    Legal: [baseP("Protección de datos", "Cumplimiento normativo (HIPAA/GDPR/local)", 4, "Amenaza"), baseP("Normativa laboral", "Reformas que impactan costos laborales", 3, "Amenaza")],
  };
  // Pequeños ajustes por sector
  if (sector === "tecnologia") {
    com.Tecnologico.push(baseP("IA generativa", "Disrupción de productos y procesos", 5, "Oportunidad"));
  }
  if (sector === "salud") {
    com.Legal.push(baseP("Regulación sanitaria", "Cambios en aprobaciones y licencias", 5, "Amenaza"));
  }
  if (sector === "manufactura") {
    com.Economico.push(baseP("Costo de materias primas", "Volatilidad de commodities", 5, "Amenaza"));
  }
  return com;
};

// ───────────────── Sec 03: Factores EFI típicos ─────────────────
export interface FactorEFI { factor: string; tipo: "Fortaleza" | "Debilidad"; peso: number; calificacion: number; }
export const efiSugerido = (sector: SectorKey): FactorEFI[] => [
  { factor: "Calidad del producto/servicio", tipo: "Fortaleza", peso: 0.15, calificacion: 3 },
  { factor: "Conocimiento del mercado", tipo: "Fortaleza", peso: 0.12, calificacion: 3 },
  { factor: "Equipo profesional capacitado", tipo: "Fortaleza", peso: 0.12, calificacion: 3 },
  { factor: "Cartera de clientes recurrentes", tipo: "Fortaleza", peso: 0.10, calificacion: 3 },
  { factor: "Procesos documentados", tipo: "Debilidad", peso: 0.10, calificacion: 2 },
  { factor: "Sistemas de información", tipo: "Debilidad", peso: 0.10, calificacion: 2 },
  { factor: "Capacidad financiera", tipo: "Debilidad", peso: 0.13, calificacion: 2 },
  { factor: "Marketing y posicionamiento", tipo: "Debilidad", peso: 0.10, calificacion: 2 },
  { factor: sector === "tecnologia" ? "Capacidad de innovación" : "Eficiencia operativa", tipo: "Fortaleza", peso: 0.08, calificacion: 3 },
];

// ───────────────── Sec 04: FODA sugerido ─────────────────
export const fodaSugerido = (sector: SectorKey) => ({
  fortalezas: ["Equipo experimentado", "Relación cercana con clientes", "Flexibilidad operativa", "Reputación en el mercado local"],
  debilidades: ["Dependencia del fundador", "Procesos no documentados", "Limitada presencia digital", "Capacidad financiera ajustada"],
  oportunidades: sector === "tecnologia"
    ? ["Crecimiento de la digitalización", "Adopción de IA en clientes", "Mercados internacionales", "Modelos de suscripción"]
    : ["Nuevos canales digitales", "Crecimiento del sector", "Alianzas estratégicas", "Expansión geográfica"],
  amenazas: ["Nuevos competidores", "Presión sobre márgenes", "Cambios regulatorios", "Volatilidad económica"],
});

// CAME sugerido por categoría
export const cameSugerido = () => ({
  corregir: ["Implementar plan de documentación de procesos", "Plan de digitalización del back office"],
  afrontar: ["Diferenciación clara vs nuevos competidores", "Estrategia de cobertura ante riesgos regulatorios"],
  mantener: ["Programa de fidelización de clientes clave", "Plan de retención de talento crítico"],
  explotar: ["Plan comercial para nuevos canales digitales", "Búsqueda activa de alianzas estratégicas"],
});

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
