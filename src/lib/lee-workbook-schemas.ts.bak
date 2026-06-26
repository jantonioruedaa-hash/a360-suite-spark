// Framework de workbooks instrumentados LEE.
// Cada sesión puede declarar un schema (secciones + campos tipados).
// Si no existe schema, la UI cae al workbook simple de 4 textareas.

export type CampoTipo =
  | "textarea"
  | "text"
  | "lista"      // lista editable de strings
  | "escala"     // 1-5 con etiquetas
  | "semaforo"   // verde/ambar/rojo + justificación
  | "tabla"      // filas dinámicas con columnas fijas
  | "opcion";    // radio único

export interface CampoBase {
  id: string;
  label: string;
  ayuda?: string;
  placeholder?: string;
  requerido?: boolean;
}

export interface CampoTextarea extends CampoBase { type: "textarea"; rows?: number; }
export interface CampoText extends CampoBase { type: "text"; }
export interface CampoLista extends CampoBase { type: "lista"; inputLabel?: string; min?: number; }
export interface CampoEscala extends CampoBase {
  type: "escala";
  min: number; max: number;
  minLabel?: string; maxLabel?: string;
  // sub-ítems opcionales (autoevaluación tipo diagnóstico)
  items?: { id: string; texto: string }[];
}
export interface CampoSemaforo extends CampoBase {
  type: "semaforo";
  opciones?: { value: "verde" | "ambar" | "rojo"; label: string }[];
  pedirJustificacion?: boolean;
}
export interface CampoTabla extends CampoBase {
  type: "tabla";
  columnas: { id: string; label: string; placeholder?: string; ancho?: string }[];
  minFilas?: number;
}
export interface CampoOpcion extends CampoBase {
  type: "opcion";
  opciones: { value: string; label: string; descripcion?: string }[];
}

export type Campo =
  | CampoTextarea | CampoText | CampoLista | CampoEscala | CampoSemaforo | CampoTabla | CampoOpcion;

export interface SeccionWorkbook {
  id: string;
  titulo: string;
  moduloRef?: string;        // "1.1", "1.2"
  descripcion?: string;
  preguntaCoaching?: string; // resaltada arriba de la sección
  campos: Campo[];
}

export interface WorkbookSchema {
  sesionKey: string;         // "1-1"
  titulo: string;
  proposito: string;
  duracionEstimada?: string; // "30-45 min en casa"
  secciones: SeccionWorkbook[];
}

// =================================================================
// SCHEMAS POR SESIÓN
// =================================================================

const cap1ses1: WorkbookSchema = {
  sesionKey: "1-1",
  titulo: "La crisis invisible del liderazgo + Qué es el liderazgo real",
  proposito:
    "Diagnosticar el grado de dependencia estructural de tu empresa hacia ti como líder y diferenciar liderazgo operativo, ejecutivo y estratégico en tu rol actual.",
  duracionEstimada: "45–60 min de trabajo posterior a la sesión",
  secciones: [
    {
      id: "sintomas",
      titulo: "1. Síntomas de crisis invisible en mi organización",
      moduloRef: "1.1",
      descripcion:
        "Evidencia con casos concretos los síntomas que reconoces en tu empresa. No basta el síntoma — necesitas el hecho que lo demuestra.",
      preguntaCoaching: "¿Qué pasaría si no estuvieras disponible durante 30 días?",
      campos: [
        {
          id: "tabla_sintomas",
          label: "Mapa de síntomas con evidencia",
          type: "tabla",
          minFilas: 4,
          columnas: [
            { id: "sintoma", label: "Síntoma observado", placeholder: "Decisiones lentas, equipo dependiente…", ancho: "30%" },
            { id: "evidencia", label: "Evidencia concreta (caso real)", placeholder: "El martes pasado, el equipo esperó 3 días mi aprobación para…", ancho: "45%" },
            { id: "impacto", label: "Impacto en el negocio", placeholder: "Pérdida de cliente, retraso, costo…", ancho: "25%" },
          ],
        },
        {
          id: "tres_sintomas_top",
          label: "Top 3 síntomas que más debilitan a mi empresa hoy",
          type: "lista",
          inputLabel: "+ Agregar síntoma",
          min: 3,
        },
      ],
    },
    {
      id: "autoevaluacion",
      titulo: "2. Autoevaluación de autonomía organizacional",
      moduloRef: "1.1",
      descripcion: "Califica del 1 (totalmente en desacuerdo) al 5 (totalmente de acuerdo). El promedio interpreta tu nivel de dependencia.",
      campos: [
        {
          id: "diagnostico_autonomia",
          label: "Diagnóstico inicial de crisis invisible",
          type: "escala",
          min: 1, max: 5,
          minLabel: "Totalmente en desacuerdo",
          maxLabel: "Totalmente de acuerdo",
          items: [
            { id: "i1", texto: "Mi equipo toma decisiones operativas sin consultarme." },
            { id: "i2", texto: "Si yo no estoy, los procesos clave siguen funcionando." },
            { id: "i3", texto: "Tengo tiempo semanal protegido para pensar estratégicamente." },
            { id: "i4", texto: "Las áreas resuelven sus problemas entre sí, sin pasar por mí." },
            { id: "i5", texto: "La información crítica del negocio no vive solo en mi cabeza." },
            { id: "i6", texto: "Puedo desconectarme una semana sin que el negocio se detenga." },
          ],
        },
        {
          id: "nivel_dependencia",
          label: "Nivel de dependencia que asumo según mi promedio",
          type: "opcion",
          opciones: [
            { value: "critica", label: "🔴 Dependencia crítica (1.0–2.5)", descripcion: "Mi empresa no opera sin mí." },
            { value: "media", label: "🟡 Dependencia media (2.6–3.5)", descripcion: "Hay áreas autónomas, pero las decisiones clave siguen pasando por mí." },
            { value: "funcional", label: "🟢 Autonomía funcional (3.6–5.0)", descripcion: "El sistema puede operar y decidir sin mí." },
          ],
        },
        {
          id: "lectura_promedio",
          label: "Mi lectura del resultado",
          type: "textarea",
          rows: 3,
          placeholder: "¿Qué te dice este número sobre cómo construiste el liderazgo en tu empresa?",
        },
      ],
    },
    {
      id: "ilusion_crecimiento",
      titulo: "3. La ilusión del crecimiento",
      moduloRef: "1.1",
      preguntaCoaching: "¿Tu empresa crece... o solo trabaja más?",
      campos: [
        {
          id: "evidencias_crecimiento",
          label: "Evidencias de crecimiento real vs. crecimiento por esfuerzo",
          type: "tabla",
          minFilas: 3,
          columnas: [
            { id: "indicador", label: "Indicador", placeholder: "Ventas, # clientes, margen…", ancho: "25%" },
            { id: "crece", label: "¿Está creciendo?", placeholder: "Sí / No / parcial", ancho: "20%" },
            { id: "evolucion", label: "¿Lo respalda evolución estructural?", placeholder: "Procesos, equipo, sistemas…", ancho: "30%" },
            { id: "riesgo", label: "Riesgo detectado", placeholder: "", ancho: "25%" },
          ],
        },
        {
          id: "semaforo_salud",
          label: "Semáforo de salud organizacional",
          type: "semaforo",
          pedirJustificacion: true,
        },
      ],
    },
    {
      id: "tres_niveles",
      titulo: "4. Mis tres niveles de liderazgo (Operativo / Ejecutivo / Estratégico)",
      moduloRef: "1.2",
      descripcion:
        "Estima honestamente cuánto % de tu tiempo invertiste la última semana en cada nivel. La suma debe dar 100%.",
      preguntaCoaching: "¿Dónde estás invirtiendo tu tiempo realmente — y dónde deberías estarlo?",
      campos: [
        {
          id: "porcentaje_operativo",
          label: "% Operativo (resolver problemas del día, decisiones tácticas)",
          type: "text",
          placeholder: "Ej: 60",
        },
        {
          id: "porcentaje_ejecutivo",
          label: "% Ejecutivo (coordinar áreas, hacer cumplir prioridades, dar seguimiento)",
          type: "text",
          placeholder: "Ej: 30",
        },
        {
          id: "porcentaje_estrategico",
          label: "% Estratégico (visión, modelo de negocio, evolución del sistema)",
          type: "text",
          placeholder: "Ej: 10",
        },
        {
          id: "brecha",
          label: "Brecha entre el tiempo que invierto y el que requiere mi rol",
          type: "textarea",
          rows: 3,
          placeholder: "¿Qué nivel estás invadiendo? ¿Qué nivel estás abandonando?",
        },
        {
          id: "actividades_a_soltar",
          label: "Actividades operativas que debo soltar este mes",
          type: "lista",
          inputLabel: "+ Agregar actividad",
        },
        {
          id: "actividades_a_recuperar",
          label: "Actividades estratégicas que debo recuperar",
          type: "lista",
          inputLabel: "+ Agregar actividad",
        },
      ],
    },
    {
      id: "compromisos",
      titulo: "5. Compromisos y bitácora del aprendizaje",
      descripcion: "Cierra la sesión con compromisos accionables, no con buenas intenciones.",
      campos: [
        {
          id: "insight_personal",
          label: "Insight más fuerte que me llevo de esta sesión",
          type: "textarea",
          rows: 3,
          placeholder: "Una frase que sintetice tu descubrimiento.",
        },
        {
          id: "tabla_compromisos",
          label: "Compromisos para los próximos 7 días",
          type: "tabla",
          minFilas: 3,
          columnas: [
            { id: "accion", label: "Acción concreta", placeholder: "Qué voy a hacer", ancho: "40%" },
            { id: "responsable", label: "Responsable", placeholder: "Yo / equipo / nombre", ancho: "20%" },
            { id: "fecha", label: "Fecha límite", placeholder: "DD/MM", ancho: "15%" },
            { id: "indicador", label: "¿Cómo sabré que se cumplió?", placeholder: "Evidencia observable", ancho: "25%" },
          ],
        },
        {
          id: "preguntas_para_proxima",
          label: "Preguntas que quiero llevar a la próxima sesión",
          type: "lista",
          inputLabel: "+ Agregar pregunta",
        },
      ],
    },
  ],
};

const SCHEMAS: Record<string, WorkbookSchema> = {
  "1-1": cap1ses1,
};

export function getWorkbookSchema(capitulo: number, sesion: number): WorkbookSchema | null {
  return SCHEMAS[`${capitulo}-${sesion}`] ?? null;
}

export const SESIONES_INSTRUMENTADAS = Object.keys(SCHEMAS);
