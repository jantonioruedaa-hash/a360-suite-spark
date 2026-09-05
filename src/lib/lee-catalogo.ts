// Programa LEE — Líder Estratégico Efectivo
// Estructura: Capítulo → 4 Sesiones de 2h → Módulos (Marco / Ejercicio / Diagnóstico / Caso)
// Contenido extraído del Plan Maestro de Facilitación v3.1.
import contenido from "./lee-content.json";

export interface ModuloPlan {
  numero: string;
  tipo: string;
  titulo: string;
  duracion: string;
  objetivo: string;
  resultadoEsperado: string;
  marco: string[];
  insight: string;
  preguntasCoaching: string[];
  ejercicio: string;
}

export interface SesionPlan {
  numero: number;
  eyebrow: string;
  titulo: string;
  meta: string[];
  modulos: ModuloPlan[];
}

export interface FilaResumen {
  sesion: string;
  modulos: string;
  tipo: string;
  objetivo: string;
  herramienta: string;
}

export interface CapituloCover {
  badge: string;
  titleLine1: string;
  titleLine2Em: string;
  titleInline?: boolean;
  subtitulo: string;
  pills: string[];
}

export interface CapituloLEE {
  numero: number;
  titulo: string;
  objetivo: string;
  eyebrow: string;
  pills: string[];
  tablaResumen: FilaResumen[];
  sesiones: SesionPlan[];
  cierre: string;
  cover: CapituloCover;
}

interface ContenidoLEE { capitulos: CapituloLEE[]; }

export const LEE_CAPITULOS: CapituloLEE[] = (contenido as ContenidoLEE).capitulos;

export const LEE_OVERVIEW = {
  nombre: "LEE — Líder Estratégico Efectivo",
  proposito:
    "Programa de evolución del liderazgo empresarial: 10 capítulos × 8 horas (4 sesiones de 2h) que instalan conciencia, diagnóstico, habilidades estructurales y un plan de evolución medible.",
  duracionTotal: "10 capítulos · 80 horas · ~5 meses",
  formato: "Sesiones de facilitación (2h) + Workbook del participante + Análisis IA por sesión",
  certificacion: "Certificado A360 al completar 80% del programa con evidencias",
};

export const TOTAL_SESIONES = LEE_CAPITULOS.reduce((a, c) => a + c.sesiones.length, 0);

export function getCapitulo(numero: number) {
  return LEE_CAPITULOS.find((c) => c.numero === numero);
}

export function getSesion(capitulo: number, sesion: number) {
  return getCapitulo(capitulo)?.sesiones.find((s) => s.numero === sesion);
}

export function getCover(numero: number): CapituloCover | undefined {
  return getCapitulo(numero)?.cover;
}

export function sesionKey(capitulo: number, sesion: number) {
  return `s-${capitulo}-${sesion}`;
}
