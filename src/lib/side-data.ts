// SIDE — Sistema Integral de Diagnóstico Empresarial
// 12 dimensiones × 15 preguntas = 180 + IVEE 16 + IDF 12 + COF 12

export type DimKey =
  | "L" | "E" | "G" | "O" | "GE" | "F" | "C" | "M" | "OP" | "CU" | "T" | "ES";

export interface Dimension {
  key: DimKey;
  nombre: string;
  iniciativa: string;
  preguntas: { id: string; texto: string }[];
}

const mk = (prefix: string, items: string[]) =>
  items.map((t, i) => ({ id: `${prefix}${i + 1}`, texto: t }));

export const DIMENSIONES: Dimension[] = [
  { key: "L", nombre: "Liderazgo", iniciativa: "Programa de liderazgo ejecutivo", preguntas: mk("L", [
    "Existe liderazgo claro y reconocido","El líder comunica visión con claridad","El líder toma decisiones oportunas",
    "Existe coherencia entre discurso y acción","El líder desarrolla a su equipo","Se delega con criterio y seguimiento",
    "El líder genera confianza en la organización","Hay liderazgo en los mandos medios","El líder enfrenta conversaciones difíciles",
    "La dirección inspira compromiso","Se reconocen y desarrollan líderes internos","El liderazgo es adaptable al cambio",
    "Los líderes resuelven conflictos efectivamente","La dirección tiene visión de largo plazo","El liderazgo impulsa la cultura organizacional",
  ])},
  { key: "E", nombre: "Estrategia", iniciativa: "Diseño del plan estratégico", preguntas: mk("E", [
    "Existe un plan estratégico formal","La empresa tiene objetivos estratégicos claros","La propuesta de valor está definida",
    "Se analizan tendencias del mercado","Se analiza a la competencia con regularidad","Las decisiones responden a la estrategia",
    "Se revisa la estrategia periódicamente","Las prioridades estratégicas están claras","Se evitan iniciativas fuera de foco",
    "La empresa conoce su posicionamiento","Existen metas anuales definidas","Existen metas trimestrales definidas",
    "Los líderes conocen la estrategia","La estrategia se comunica al equipo","Se toman decisiones pensando en el largo plazo",
  ])},
  { key: "G", nombre: "Gobernanza", iniciativa: "Modelo de gobernanza corporativa", preguntas: mk("G", [
    "Existen reglas claras para la toma de decisiones","Los roles de decisión están definidos","Las decisiones críticas siguen un proceso",
    "Existe comité directivo o equivalente","Las reuniones de dirección tienen agenda clara","Se documentan acuerdos relevantes",
    "Hay claridad sobre autoridad y escalamiento","Existen políticas para decisiones sensibles","La dirección revisa riesgos del negocio",
    "Los conflictos de criterio se gestionan con método","Existe disciplina en seguimiento de acuerdos","Se evalúan implicaciones antes de decidir",
    "Las decisiones se comunican correctamente","Existe equilibrio entre control y autonomía","El gobierno del negocio no depende de improvisación",
  ])},
  { key: "O", nombre: "Organización", iniciativa: "Rediseño organizacional y roles", preguntas: mk("O", [
    "Existe organigrama formal","Los roles y responsabilidades están claros","No existe duplicidad relevante de funciones",
    "Los equipos entienden quién decide qué","Existen descripciones de puesto","Hay mandos medios definidos",
    "La estructura facilita coordinación","Las áreas colaboran con claridad de roles","Las responsabilidades son medibles",
    "Los flujos de aprobación son claros","Se cubren funciones críticas adecuadamente","La estructura soporta el crecimiento",
    "Los cambios organizacionales se comunican","Los equipos entienden su aporte al negocio","Existe orden organizacional consistente",
  ])},
  { key: "GE", nombre: "Gestión", iniciativa: "Sistema de KPIs y control de gestión", preguntas: mk("GE", [
    "Existen KPIs relevantes por área","Se revisan resultados con frecuencia definida","Existen reuniones de seguimiento efectivas",
    "Se corrigen desviaciones a tiempo","Las metas son medibles","Se toman decisiones con datos",
    "Existe dashboard de gestión","Se da seguimiento a proyectos clave","La ejecución tiene responsables claros",
    "Se analizan causas de los resultados","Se da trazabilidad a compromisos","Se aprende de errores y desviaciones",
    "Existe disciplina operativa","Los indicadores se entienden correctamente","La gestión es consistente y no reactiva",
  ])},
  { key: "F", nombre: "Finanzas", iniciativa: "Sistema de control financiero", preguntas: mk("F", [
    "Existe presupuesto anual formal","Se controla flujo de caja con periodicidad","Se analiza rentabilidad por línea o unidad",
    "Se monitorean costos relevantes","Existen reportes financieros oportunos","Se evalúan inversiones con criterio financiero",
    "Existe control de desviaciones presupuestarias","Se conocen necesidades de capital de trabajo","Se gestiona cartera y cobranzas con disciplina",
    "Se evalúan riesgos financieros","Se revisan márgenes periódicamente","Existen políticas financieras claras",
    "La dirección entiende la situación financiera","Hay disciplina en aprobación de gastos","La empresa cuenta con información financiera confiable",
  ])},
  { key: "C", nombre: "Comercial", iniciativa: "Modelo comercial y proceso de ventas", preguntas: mk("C", [
    "Existe un proceso comercial definido","Se gestionan oportunidades con método","Se conocen los objetivos de ventas",
    "Existe seguimiento al pipeline comercial","Se mide conversión comercial","Los ejecutivos conocen el perfil del cliente ideal",
    "Existe disciplina en prospección","Se hace seguimiento postventa","Se analizan causas de pérdida de negocios",
    "Existe claridad en políticas comerciales","El proceso comercial está documentado","Se utilizan herramientas de apoyo comercial",
    "Se monitorea cumplimiento de cuotas","Existe coordinación entre ventas y otras áreas","El crecimiento comercial es gestionado y no casual",
  ])},
  { key: "M", nombre: "Marketing", iniciativa: "Estrategia de marketing y posicionamiento", preguntas: mk("M", [
    "Existe estrategia de marketing definida","Se conoce el segmento objetivo","La propuesta de valor se comunica bien",
    "Existe planificación de campañas","Se mide el rendimiento de marketing","Se gestionan canales adecuados",
    "Existe consistencia de marca","Se genera contenido o acciones con propósito","Marketing está alineado con ventas",
    "Se analizan resultados de campañas","Se evalúa retorno de inversión en marketing","Existe calendario o plan de acciones",
    "Se ajusta la estrategia según resultados","Se monitorea el mercado y clientes","Marketing contribuye al crecimiento del negocio",
  ])},
  { key: "OP", nombre: "Operaciones", iniciativa: "Optimización y estandarización de procesos", preguntas: mk("OP", [
    "Los procesos operativos están definidos","Existen estándares de operación","Se documentan procedimientos críticos",
    "Se controlan tiempos y calidad","Existen responsables operativos claros","Se gestionan incidencias con método",
    "Hay coordinación entre operación y áreas soporte","Se monitorea productividad operativa","Se reducen errores de forma sistemática",
    "Se gestiona capacidad operativa","Se monitorea cumplimiento de servicio","Se revisan cuellos de botella",
    "Se mejoran procesos periódicamente","Existe disciplina operacional","La operación es consistente y predecible",
  ])},
  { key: "CU", nombre: "Cultura", iniciativa: "Programa de cultura y accountability", preguntas: mk("CU", [
    "Existe confianza entre áreas y líderes","La comunicación es clara y respetuosa","Existe accountability en el equipo",
    "Los conflictos se gestionan adecuadamente","Las personas comprenden los valores organizacionales","Existe compromiso con los resultados",
    "Se reconocen buenas prácticas y logros","Hay apertura a la mejora y retroalimentación","Se promueve colaboración entre áreas",
    "Existe disciplina organizacional","Las personas se sienten parte del proyecto","Se gestionan cambios con comunicación",
    "El clima apoya el desempeño","Existe coherencia entre discurso y acciones","La cultura impulsa resultados sostenibles",
  ])},
  { key: "T", nombre: "Talento", iniciativa: "Programa de gestión de talento", preguntas: mk("T", [
    "Existe proceso formal de selección","Las personas reciben inducción adecuada","Existe capacitación periódica",
    "Se evalúa desempeño del equipo","Se desarrollan planes de mejora","Se identifican personas clave",
    "Existe plan de sucesión para roles críticos","Los líderes desarrollan talento","Se reconocen brechas de competencias",
    "Existe claridad en expectativas de desempeño","Se gestionan salidas y reemplazos con orden","Hay seguimiento al compromiso del equipo",
    "Se promueve crecimiento interno","RRHH aporta a la estrategia del negocio","El talento está alineado con las necesidades futuras",
  ])},
  { key: "ES", nombre: "Escalabilidad", iniciativa: "Sistematización y plan de delegación", preguntas: mk("ES", [
    "Los procesos clave están documentados","El negocio puede operar sin depender del fundador","Existe estandarización suficiente",
    "El conocimiento está sistematizado","Los procesos se pueden enseñar y replicar","La estructura soporta crecimiento",
    "Existen sistemas de delegación","Se usan herramientas o sistemas de soporte","El crecimiento no genera caos operativo",
    "Las nuevas personas pueden integrarse rápido","Existen manuales o SOPs relevantes","El negocio podría abrir nuevas unidades",
    "Se gestionan riesgos de crecimiento","El modelo es replicable","La empresa tiene arquitectura para escalar",
  ])},
];

export const IVEE_PREGUNTAS = [
  "Tenemos una propuesta de valor clara y diferenciada",
  "Nuestros clientes nos distinguen de la competencia",
  "Resolvemos un problema relevante del cliente",
  "La propuesta puede explicarse en 30 segundos",
  "Conocemos bien nuestro mercado objetivo",
  "Existe oportunidad real de crecimiento",
  "Entendemos la dinámica competitiva del sector",
  "Tenemos segmentado el mercado claramente",
  "El negocio genera márgenes sostenibles",
  "Existe recurrencia o estabilidad en los ingresos",
  "Sabemos dónde se genera la rentabilidad real",
  "Los márgenes se mantienen al crecer el volumen",
  "La empresa puede crecer sin colapsar operativamente",
  "La operación es replicable y sistematizable",
  "Existen bases financieras y operativas para escalar",
  "La empresa puede crecer sin depender del fundador",
].map((t, i) => ({ id: `IVEE${i + 1}`, texto: t }));

export const IDF_PREGUNTAS = [
  "Las decisiones clave dependen del fundador",
  "El negocio se frena si el fundador no interviene",
  "Las ventas más importantes dependen del fundador",
  "El equipo consulta casi todo al fundador",
  "El conocimiento crítico está en el fundador",
  "Los problemas relevantes escalan al fundador",
  "El rumbo estratégico depende del fundador",
  "El fundador controla demasiados frentes",
  "Los clientes estratégicos exigen al fundador",
  "La resolución de problemas depende del fundador",
  "Los líderes no tienen autonomía suficiente",
  "No existen reglas de decisión sin el fundador",
].map((t, i) => ({ id: `IDF${i + 1}`, texto: t }));

export const COF_PREGUNTAS = [
  "La estrategia está clara y alineada en toda la organización",
  "Las prioridades son entendidas por las áreas clave",
  "Las decisiones son consistentes con la estrategia",
  "La estructura soporta la estrategia definida",
  "Los roles están claros y sin superposición",
  "No existen vacíos ni duplicidades críticas",
  "Las áreas se coordinan sin fricciones críticas",
  "Los procesos están alineados sin reprocesos",
  "Los traspasos entre áreas son fluidos",
  "La cultura respalda lo que la empresa exige",
  "Los valores se reflejan en el comportamiento real",
  "La conducta de los líderes refuerza el modelo",
].map((t, i) => ({ id: `COF${i + 1}`, texto: t }));

// Scores ↦ promedio
export type ScoreMap = Record<string, number>;
export const promedio = (ids: string[], scores: ScoreMap): number => {
  const vals = ids.map((id) => scores[id]).filter((v): v is number => typeof v === "number" && v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

export interface ImeNivel {
  estado: "critico" | "debil" | "desarrollo" | "solido" | "avanzado";
  label: string;
  color: string;
  bg: string;
}

export const interpretarIME = (ime: number): ImeNivel => {
  if (ime < 2.0) return { estado: "critico", label: "Crítico", color: "#c0392b", bg: "rgba(192,57,43,0.12)" };
  if (ime < 3.0) return { estado: "debil", label: "Débil", color: "#d4820a", bg: "rgba(212,130,10,0.12)" };
  if (ime < 4.0) return { estado: "desarrollo", label: "En desarrollo", color: "#b8960a", bg: "rgba(184,150,10,0.12)" };
  if (ime < 4.5) return { estado: "solido", label: "Sólido", color: "#1e7e50", bg: "rgba(30,126,80,0.12)" };
  return { estado: "avanzado", label: "Avanzado", color: "#1a5fa0", bg: "rgba(26,95,160,0.12)" };
};

export const ESCALA_LABELS = ["Sin responder", "Crítico", "Débil", "En desarrollo", "Sólido", "Avanzado"];

export interface DatosFinancieros {
  ingresos_anuales?: number;
  margen_neto?: number;
  margen_ebitda?: number;
  multiplo_actual?: number;
  multiplo_objetivo?: number;
}

export const calcFinanciero = (d: DatosFinancieros) => {
  const ingresos = d.ingresos_anuales ?? 0;
  const ebitdaPct = (d.margen_ebitda ?? 0) / 100;
  const ebitda = ingresos * ebitdaPct;
  const valActual = ebitda * (d.multiplo_actual ?? 0);
  const valObjetivo = ebitda * (d.multiplo_objetivo ?? 0);
  const gap = valObjetivo - valActual;
  const potencial = valActual > 0 ? ((valObjetivo / valActual) - 1) * 100 : 0;
  return { ebitda, valActual, valObjetivo, gap, potencial };
};
