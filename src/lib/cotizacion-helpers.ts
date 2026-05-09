// Países LATAM con moneda local y multiplicador de precios respecto al USD base.
// El multiplicador refleja poder adquisitivo y referencia de mercado de consultoría.
export interface PaisLatam {
  code: string;
  nombre: string;
  moneda: string;          // moneda local
  multiplicador: number;   // factor sobre precio USD base
  tasaUsd?: number;        // tasa local por 1 USD (referencial, editable)
  notas?: string;
}

export const PAISES_LATAM: PaisLatam[] = [
  { code: "USD", nombre: "USD (Internacional)",   moneda: "USD", multiplicador: 1.00, tasaUsd: 1 },
  { code: "MX",  nombre: "México",                 moneda: "MXN", multiplicador: 0.95, tasaUsd: 18 },
  { code: "CO",  nombre: "Colombia",               moneda: "COP", multiplicador: 0.70, tasaUsd: 4000 },
  { code: "PE",  nombre: "Perú",                   moneda: "PEN", multiplicador: 0.75, tasaUsd: 3.7 },
  { code: "CL",  nombre: "Chile",                  moneda: "CLP", multiplicador: 0.95, tasaUsd: 950 },
  { code: "AR",  nombre: "Argentina",              moneda: "ARS", multiplicador: 0.65, tasaUsd: 1000 },
  { code: "EC",  nombre: "Ecuador",                moneda: "USD", multiplicador: 0.80, tasaUsd: 1 },
  { code: "BO",  nombre: "Bolivia",                moneda: "BOB", multiplicador: 0.55, tasaUsd: 6.96 },
  { code: "PY",  nombre: "Paraguay",               moneda: "PYG", multiplicador: 0.55, tasaUsd: 7300 },
  { code: "UY",  nombre: "Uruguay",                moneda: "UYU", multiplicador: 0.95, tasaUsd: 39 },
  { code: "CR",  nombre: "Costa Rica",             moneda: "CRC", multiplicador: 0.90, tasaUsd: 520 },
  { code: "PA",  nombre: "Panamá",                 moneda: "USD", multiplicador: 0.95, tasaUsd: 1 },
  { code: "DO",  nombre: "Rep. Dominicana",        moneda: "DOP", multiplicador: 0.75, tasaUsd: 60 },
  { code: "GT",  nombre: "Guatemala",              moneda: "GTQ", multiplicador: 0.70, tasaUsd: 7.8 },
  { code: "SV",  nombre: "El Salvador",            moneda: "USD", multiplicador: 0.70, tasaUsd: 1 },
  { code: "HN",  nombre: "Honduras",               moneda: "HNL", multiplicador: 0.65, tasaUsd: 24.7 },
  { code: "ES",  nombre: "España",                 moneda: "EUR", multiplicador: 1.10, tasaUsd: 0.92 },
];

export function getPais(code: string | null | undefined): PaisLatam {
  return PAISES_LATAM.find((p) => p.code === code) ?? PAISES_LATAM[0];
}

/** Aplica multiplicador y conversión a moneda local; redondea a múltiplos legibles. */
export function ajustarPrecioPorPais(
  precioUsdBase: number,
  pais: PaisLatam,
): number {
  const enUsd = precioUsdBase * pais.multiplicador;
  const enLocal = enUsd * (pais.tasaUsd ?? 1);
  // Redondeo "comercial" según magnitud
  if (enLocal >= 100000) return Math.round(enLocal / 1000) * 1000;
  if (enLocal >= 10000) return Math.round(enLocal / 100) * 100;
  if (enLocal >= 1000) return Math.round(enLocal / 50) * 50;
  return Math.round(enLocal);
}

// ============================================================
// IME — Impacto Monetario Esperado
// ============================================================

export const RANGOS_FACTURACION = [
  { value: "<100k",      label: "Menor a USD 100k anuales",  base: 50000 },
  { value: "100k-500k",  label: "USD 100k – 500k",           base: 300000 },
  { value: "500k-1M",    label: "USD 500k – 1M",             base: 750000 },
  { value: "1M-5M",      label: "USD 1M – 5M",               base: 3000000 },
  { value: "5M-20M",     label: "USD 5M – 20M",              base: 12000000 },
  { value: ">20M",       label: "Mayor a USD 20M",           base: 30000000 },
] as const;

// % esperado de impacto sobre facturación según programa
export const FACTOR_IMPACTO_PROGRAMA: Record<string, { min: number; max: number }> = {
  diagnostico:         { min: 0.02, max: 0.05 },
  estrategico:         { min: 0.08, max: 0.15 },
  transformacion:      { min: 0.15, max: 0.30 },
  coaching_ejecutivo:  { min: 0.05, max: 0.12 },
  programa_integral:   { min: 0.20, max: 0.40 },
  corporativo:         { min: 0.25, max: 0.50 },
};

export function calcularIME(plan: string, rango: string): { min: number; max: number; texto: string } | null {
  const r = RANGOS_FACTURACION.find((x) => x.value === rango);
  const f = FACTOR_IMPACTO_PROGRAMA[plan];
  if (!r || !f) return null;
  const min = r.base * f.min;
  const max = r.base * f.max;
  const fmt = (n: number) => `USD ${Math.round(n / 1000).toLocaleString()}k`;
  return {
    min, max,
    texto: `${fmt(min)} – ${fmt(max)} en 12 meses (${Math.round(f.min * 100)}–${Math.round(f.max * 100)}% sobre facturación estimada)`,
  };
}

// ============================================================
// Justificaciones por programa
// ============================================================

export const JUSTIFICACION_PROGRAMA: Record<string, string> = {
  diagnostico:
    "El Diagnóstico SIDE ofrece una radiografía objetiva del estado actual de la organización en sus 4 dimensiones críticas (IVEE, IDF, COF e IME). Permite identificar palancas de mejora antes de comprometer presupuesto en intervenciones más extensas.",
  estrategico:
    "El Plan Estratégico A360 articula visión, modelo de negocio, estrategia competitiva y arquitectura de ejecución en 18 secciones probadas. Reduce la incertidumbre directiva y alinea al equipo en torno a prioridades medibles.",
  transformacion:
    "El Programa de Transformación combina diagnóstico, plan estratégico y acompañamiento de implementación. Está pensado para empresas que requieren replantear su modelo, capacidades o gobierno corporativo en los próximos 12 meses.",
  coaching_ejecutivo:
    "El Coaching Ejecutivo trabaja sobre las 12 herramientas críticas del líder: claridad de visión, toma de decisión bajo incertidumbre, gestión del talento, foco estratégico y desarrollo personal sostenido.",
  programa_integral:
    "El Programa Integral A360 integra Diagnóstico SIDE, Plan Estratégico, Coaching Ejecutivo y LEE. Es la opción recomendada cuando la empresa busca crecimiento sostenido y formación de su próxima generación de líderes.",
  corporativo:
    "La modalidad Corporativa adapta el Programa Integral a estructuras de mayor complejidad, con customización por unidad de negocio, indicadores ejecutivos consolidados y acompañamiento de 24 meses.",
};

export function justificacionPorPlan(plan: string | null | undefined): string {
  return plan ? JUSTIFICACION_PROGRAMA[plan] ?? "" : "";
}
