// Programa LEE — Líder Estratégico Efectivo
// Catálogo completo: marco teórico, casos, workbooks, retos, rúbrica, guion del facilitador y bibliografía.
// El contenido reside en lee-content.json (generado profesionalmente).
import contenido from "./lee-content.json";

export interface ConceptoClave { concepto: string; definicion: string; }
export interface ModeloFramework { nombre: string; autor: string; descripcion: string; comoAplicarlo: string; ejemploAplicado?: string; }
export interface MarcoTeorico {
  introduccion: string;
  porQueImportaHoy?: string;
  conceptosClave: ConceptoClave[];
  modelos: ModeloFramework[];
}
export interface CasoEstudio {
  titulo: string;
  contexto: string;
  dilema: string;
  preguntasReflexion: string[];
}
export interface WorkbookSeccion {
  id: string;
  titulo: string;
  tipo: "reflexion" | "ejercicio" | "plan" | "diagnostico";
  descripcion: string;
  instrucciones?: string;
  preguntas: string[];
}
export interface RetoAplicacion {
  titulo: string;
  descripcion: string;
  pasos: string[];
  evidenciaEsperada: string;
}
export interface CriterioRubrica {
  criterio: string;
  nivel1: string;
  nivel2: string;
  nivel3: string;
}
export interface BloqueAgenda { minutos: number; bloque: string; actividad: string; }
export interface GuionFacilitador {
  objetivosSesion: string[];
  agenda: BloqueAgenda[];
  preguntasPoderosas: string[];
  tipsFacilitacion: string[];
}
export interface Lectura {
  tipo: "libro" | "articulo" | "video" | "podcast";
  titulo: string;
  autor: string;
  anio?: string;
  porQueLeerlo: string;
}
export interface CapituloLEE {
  numero: number;
  titulo: string;
  proposito: string;
  competencias: string[];
  duracion: string;
  modalidad: string;
  resultados: string[];
  marcoTeorico: MarcoTeorico;
  casoEstudio: CasoEstudio;
  workbook: WorkbookSeccion[];
  retoAplicacion: RetoAplicacion;
  rubrica: CriterioRubrica[];
  guionFacilitador: GuionFacilitador;
  bibliografia: Lectura[];
}

export const LEE_OVERVIEW = {
  nombre: "LEE — Líder Estratégico Efectivo",
  proposito:
    "Programa de desarrollo de liderazgo de alto impacto que combina autoconocimiento, pensamiento estratégico, gestión de equipos y ejecución disciplinada para formar líderes capaces de transformar resultados.",
  duracionTotal: "12 semanas (1 capítulo por semana)",
  formato: "Sesiones quincenales (90 min) + workbook + retos de aplicación",
  certificacion: "Certificado A360 al completar 80% del programa con evidencias",
};

// Derivar `resultados` desde el nivel 3 de la rúbrica (lo que se ve cuando está dominado)
export const LEE_CAPITULOS: CapituloLEE[] = (contenido as Omit<CapituloLEE, "resultados">[]).map((c) => ({
  ...c,
  resultados: c.rubrica.map((r) => r.nivel3),
}));

export function getCapitulo(numero: number) {
  return LEE_CAPITULOS.find((c) => c.numero === numero);
}
