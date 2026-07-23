// Datos mock aislados para el módulo de Evaluación de Competencias.
// NO se conecta a la base de datos real. Mantiene la misma forma que el HTML original.

export type NivelTexto = "Básico" | "Intermedio" | "Competente" | "Avanzado" | "Experto";

export interface CompetenciaMock {
  nombre: string;
  nivel: NivelTexto;
  desc: string;
}

export interface RequisitosMock {
  educacion: string;
  experiencia: string;
  otros: string;
}

export interface CargoMock {
  id: string;
  cargo: string;
  area: string;
  competencias_blandas: CompetenciaMock[];
  competencias_tecnicas: CompetenciaMock[];
  requisitos: RequisitosMock;
}

export const NIVELES_LABEL = ["—", "Básico", "Intermedio", "Competente", "Avanzado", "Experto"];
export const NIVEL_MAP: Record<string, number> = {
  "Básico": 1, "Intermedio": 2, "Competente": 3, "Avanzado": 4, "Experto": 5,
};
export const nivelToNum = (s?: string) => NIVEL_MAP[s || ""] || 0;

export const MODALIDADES = [
  "Formación académica",
  "Capacitación técnica (curso, taller, seminario)",
  "Coaching ejecutivo",
  "Mentoría interna",
  "Práctica supervisada en el puesto",
  "Autoformación (libro, plataforma, e-learning)",
  "Rotación o asignación especial",
];

// Cargo de ejemplo — Gerente General (idéntico en forma al del HTML original)
export const CARGO_MOCK: CargoMock = {
  id: "gerente_general_demo",
  cargo: "Gerente General",
  area: "Dirección General",
  competencias_blandas: [
    { nombre: "Liderazgo estratégico", nivel: "Experto", desc: "Inspira y dirige equipos de alto desempeño hacia objetivos de largo plazo, adaptando el estilo de liderazgo a la madurez y contexto de cada colaborador." },
    { nombre: "Toma de decisiones bajo incertidumbre", nivel: "Experto", desc: "Estructura problemas complejos, evalúa escenarios con información incompleta y decide con rapidez y criterio." },
    { nombre: "Visión sistémica de negocio", nivel: "Experto", desc: "Comprende integralmente el entorno competitivo, financiero, operativo y de talento; identifica oportunidades y amenazas." },
    { nombre: "Comunicación ejecutiva", nivel: "Avanzado", desc: "Transmite la estrategia con claridad y persuasión a todos los niveles: directorio, equipos operativos, clientes y entidades externas." },
    { nombre: "Negociación de alto nivel", nivel: "Avanzado", desc: "Construye acuerdos de valor sostenido para la empresa manejando intereses múltiples y situaciones de alta presión." },
    { nombre: "Inteligencia emocional", nivel: "Avanzado", desc: "Autoconciencia y autorregulación que le permiten gestionar el estrés y crear entornos psicológicamente seguros." },
  ],
  competencias_tecnicas: [
    { nombre: "Gestión financiera y presupuestaria", nivel: "Avanzado", desc: "Lee e interpreta estados financieros, EBITDA, flujo de caja y variaciones presupuestarias." },
    { nombre: "Planificación estratégica", nivel: "Experto", desc: "Domina BSC, OKRs, análisis FODA/PESTEL, mapas estratégicos y metodologías de seguimiento." },
    { nombre: "Gestión de operaciones comerciales", nivel: "Intermedio", desc: "Comprende el ciclo comercial, importación y logística lo suficiente para tomar decisiones informadas." },
    { nombre: "Normativa empresarial", nivel: "Avanzado", desc: "Conoce la legislación laboral, tributaria, societaria y de comercio exterior aplicable al negocio." },
    { nombre: "Herramientas de gestión ejecutiva", nivel: "Intermedio", desc: "Maneja tableros de BI, ERP a nivel gerencial y plataformas de comunicación ejecutiva." },
  ],
  requisitos: {
    educacion: "Licenciatura o Ingeniería en Administración de Empresas, Economía o afines. MBA o posgrado en Gestión Empresarial deseable",
    experiencia: "Mínimo 5 años en roles directivos o de gerencia general; experiencia en empresas distribuidoras o del sector comercial",
    otros: "Inglés intermedio-avanzado. Disponibilidad para viajes nacionales e internacionales. Certificación en metodologías de gestión estratégica deseable",
  },
};

// Divide un bloque de requisitos en ítems (separadores: . ; salto de línea)
export function splitReqItems(txt: string): string[] {
  if (!txt) return [];
  return txt.split(/[.;\n]+/).map(s => s.trim()).filter(Boolean);
}
