export const ETAPAS_PROGRAMA = [
  "Diagnóstico", "Diseño", "Implementación", "Seguimiento", "Cierre",
] as const;

export const PROGRAMAS = [
  "Coaching Ejecutivo",
  "SIDE + Plan Esencial",
  "SIDE + Plan Profesional",
  "SIDE + Plan Corporativo",
  "LEE",
  "Otro",
] as const;

export const MODALIDADES_SESION = ["Presencial", "Virtual", "Mixta"] as const;

export const SEMAFOROS = [
  { value: "verde", label: "Verde — En camino", color: "bg-green-500" },
  { value: "amarillo", label: "Amarillo — Atención", color: "bg-yellow-500" },
  { value: "rojo", label: "Rojo — Riesgo", color: "bg-red-500" },
] as const;

// Biblioteca de KPIs por categoría (basado en SIDE)
export const KPI_LIBRARY: Record<string, { nombre: string; unidad: string; formula?: string }[]> = {
  Liderazgo: [
    { nombre: "Índice de claridad de visión", unidad: "%", formula: "Encuesta equipo (1-100)" },
    { nombre: "Decisiones estratégicas/mes", unidad: "und" },
    { nombre: "NPS interno del líder", unidad: "pts" },
  ],
  Estrategia: [
    { nombre: "% iniciativas estratégicas en marcha", unidad: "%" },
    { nombre: "Avance del plan estratégico", unidad: "%" },
    { nombre: "Cumplimiento OKRs trimestrales", unidad: "%" },
  ],
  Finanzas: [
    { nombre: "Margen EBITDA", unidad: "%", formula: "EBITDA / Ventas" },
    { nombre: "Flujo de caja operativo", unidad: "USD" },
    { nombre: "Días de capital de trabajo", unidad: "días" },
    { nombre: "Crecimiento de ventas YoY", unidad: "%" },
  ],
  Comercial: [
    { nombre: "Tasa de conversión", unidad: "%", formula: "Cierres / Oportunidades" },
    { nombre: "Ticket promedio", unidad: "USD" },
    { nombre: "Pipeline ponderado", unidad: "USD" },
    { nombre: "Ciclo de venta", unidad: "días" },
  ],
  Marketing: [
    { nombre: "Costo de adquisición (CAC)", unidad: "USD" },
    { nombre: "Leads cualificados/mes", unidad: "und" },
    { nombre: "Engagement en redes", unidad: "%" },
  ],
  Operaciones: [
    { nombre: "OTIF (entregas a tiempo y completas)", unidad: "%" },
    { nombre: "Productividad por colaborador", unidad: "USD" },
    { nombre: "% procesos documentados", unidad: "%" },
  ],
  Talento: [
    { nombre: "Rotación voluntaria", unidad: "%" },
    { nombre: "eNPS", unidad: "pts" },
    { nombre: "% posiciones críticas con plan de sucesión", unidad: "%" },
  ],
  Cultura: [
    { nombre: "Clima laboral", unidad: "%" },
    { nombre: "Reconocimientos formales/mes", unidad: "und" },
  ],
  Escalabilidad: [
    { nombre: "Ingreso por empleado", unidad: "USD" },
    { nombre: "% de ventas recurrentes", unidad: "%" },
  ],
};

export const CATEGORIAS_KPI = Object.keys(KPI_LIBRARY);

export interface KpiInput {
  categoria: string;
  nombre: string;
  unidad?: string;
  formula?: string;
  valor_actual?: string;
  valor_meta?: string;
  semaforo: "verde" | "amarillo" | "rojo";
  observacion?: string;
}

export interface CompromisoInput {
  descripcion: string;
  responsable: string;
  fecha_limite?: string;
}
