import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  DIMENSIONES,
  IVEE_PREGUNTAS,
  IDF_PREGUNTAS,
  COF_PREGUNTAS,
  promedio,
  interpretarIME,
  calcFinanciero,
  type ScoreMap,
  type Dimension,
  type DatosFinancieros,
} from "@/lib/side-data";
import { generarAnalisisSide, generarIniciativasSide, type IniciativaIA } from "@/lib/server-fns";
import { ScaleButtons } from "@/components/side/ScaleButtons";
import { DimInterpretacionCard } from "@/components/side/DimInterpretacionCard";
import { IndiceInterpretacionCard } from "@/components/side/IndiceInterpretacionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Loader2, Sparkles, Plus, Download, FileText, Save,
  Pencil, Copy, CheckCircle2, RotateCcw, Trash2, ChevronDown, Check, X,
} from "lucide-react";

// ── Route ──────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/app/side")({
  validateSearch: (s: Record<string, unknown>) => ({
    sesion: typeof s.sesion === "string" ? s.sesion : undefined,
  }),
  component: SidePage,
});

// ── Types ──────────────────────────────────────────────────────────────────
type SideTabKey = "side" | "dimensiones" | "indices" | "financiero" | "resultados" | "ia" | "historial";

interface Cliente {
  id: string;
  nombre_empresa: string;
  sector: string | null;
  tamano: string | null;
  pais: string | null;
  ciudad: string | null;
  acceso_interpretacion?: boolean;
}

interface Sesion {
  id: string;
  cliente_id: string;
  consultor_id: string | null;
  nombre_sesion: string | null;
  scores: ScoreMap;
  ime_score: number | null;
  ivee_score: number | null;
  idf_score: number | null;
  cof_score: number | null;
  datos_financieros: DatosFinancieros | null;
  analisis_ia: Record<string, { titulo: string; contenido: string; fecha: string }>;
  completada: boolean;
  estado_revision: "borrador" | "pendiente_revision" | "revisado";
  created_at: string;
  updated_at: string;
}

type AnalisisMap = Record<string, { titulo: string; contenido: string; fecha: string }>;

// ── Constants ──────────────────────────────────────────────────────────────
const DIM_META: Record<string, { emoji: string; desc: string }> = {
  L:  { emoji: "👑", desc: "Capacidad de dirección, inspiración y desarrollo organizacional" },
  E:  { emoji: "🎯", desc: "Claridad, coherencia y ejecución del plan estratégico" },
  G:  { emoji: "⚖️", desc: "Estructura de toma de decisiones y control organizacional" },
  O:  { emoji: "🏗️", desc: "Estructura, roles y capacidad de escalar sin depender del fundador" },
  GE: { emoji: "⚙️", desc: "Procesos de gestión y sistemas de seguimiento de resultados" },
  F:  { emoji: "💰", desc: "Control financiero, rentabilidad y decisiones basadas en datos" },
  C:  { emoji: "🤝", desc: "Proceso comercial, pipeline de ventas y desarrollo de clientes" },
  M:  { emoji: "📣", desc: "Marketing, posicionamiento y estrategia de marca" },
  OP: { emoji: "🔧", desc: "Estandarización y eficiencia de los procesos operativos" },
  CU: { emoji: "🌱", desc: "Cultura, valores y accountability organizacional" },
  T:  { emoji: "👥", desc: "Gestión y desarrollo del talento humano clave" },
  ES: { emoji: "🚀", desc: "Sistematización y capacidad de crecer de forma ordenada" },
};

const TIPOS_ANALISIS_DEF = [
  { id: "ejecutivo" as const, num: "01", label: "Análisis ejecutivo estratégico", desc: "Síntesis ejecutiva del estado actual, identificación de los 3 factores críticos de éxito y recomendaciones prioritarias." },
  { id: "brechas" as const, num: "02", label: "Análisis de brechas críticas", desc: "Profundización en las dimensiones más débiles, análisis de causa raíz y plan de acción específico." },
  { id: "roadmap" as const, num: "03", label: "Roadmap estratégico de transformación", desc: "Plan en 3 horizontes temporales (90 días, 6 meses, 12 meses) con iniciativas priorizadas." },
  { id: "propuesta" as const, num: "04", label: "Propuesta de consultoría A360SGP", desc: "Propuesta personalizada de servicios con alcance, metodología y estimación de inversión." },
  { id: "financiero" as const, num: "05", label: "Análisis de impacto financiero", desc: "Proyección del impacto financiero de implementar las mejoras: ingresos, costos y valoración." },
];

const TABS: { key: SideTabKey; label: string; badge?: string }[] = [
  { key: "side", label: "🏠 SIDE" },
  { key: "dimensiones", label: "📊 Dimensiones", badge: "12" },
  { key: "indices", label: "📈 Índices", badge: "IVEE·IDF·COF" },
  { key: "financiero", label: "💰 Financiero" },
  { key: "resultados", label: "🎯 Resultados" },
  { key: "ia", label: "🤖 Análisis IA", badge: "5" },
  { key: "historial", label: "📋 Historial" },
];

const REQUIRES_SESSION: SideTabKey[] = ["dimensiones", "indices", "financiero", "resultados", "ia"];

// ── Shared style helpers ────────────────────────────────────────────────────
const S = {
  sectionWhite: { padding: "48px 64px", background: "white" } as React.CSSProperties,
  sectionLight: { padding: "48px 64px", background: "#F5F7FF" } as React.CSSProperties,
  secLabel: {
    fontSize: 12, fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase" as const,
    letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
  } as React.CSSProperties,
  secTitle: { fontSize: 32, fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 } as React.CSSProperties,
  secSub: { fontSize: 17, color: "#64748B", lineHeight: 1.85, maxWidth: 720, marginBottom: 40, textAlign: "justify" as const } as React.CSSProperties,
};

// ── 3-tier semáforo ─────────────────────────────────────────────────────────
type SemaforoLevel = "critico" | "desarrollo" | "avanzado" | "nodata";
interface SemaforoResult { level: SemaforoLevel; emoji: string; label: string; color: string; bg: string; border: string; }

function semaforo(score: number): SemaforoResult {
  if (score === 0) return { level: "nodata", emoji: "⚪", label: "Sin datos", color: "#94A3B8", bg: "#F8FAFC", border: "#E2E8F0" };
  if (score <= 2.5) return { level: "critico", emoji: "🔴", label: "Área crítica", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  if (score <= 3.5) return { level: "desarrollo", emoji: "🟡", label: "En desarrollo", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  return { level: "avanzado", emoji: "🟢", label: "Avanzado", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
}

function semaforoIDF(score: number): SemaforoResult {
  if (score === 0) return { level: "nodata", emoji: "⚪", label: "Sin datos", color: "#94A3B8", bg: "#F8FAFC", border: "#E2E8F0" };
  if (score > 3.5) return { level: "critico", emoji: "🔴", label: "Dependencia crítica", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  if (score > 2.5) return { level: "desarrollo", emoji: "🟡", label: "Dependencia moderada", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  return { level: "avanzado", emoji: "🟢", label: "Baja dependencia", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
}

interface DimLevelContent { interpretacion: string; recomendaciones: string[]; iniciativas: string[]; }
interface DimContent { critico: DimLevelContent; desarrollo: DimLevelContent; avanzado: DimLevelContent; }

const DIM_CONTENT: Record<string, DimContent> = {
  L: {
    critico: {
      interpretacion: "El liderazgo de la organización presenta fallas estructurales críticas. La dirección no comunica la visión con claridad, no delega efectivamente y no genera la confianza necesaria para que el equipo opere con autonomía. Esta brecha limita severamente la capacidad de crecimiento sostenible.",
      recomendaciones: ["Iniciar un proceso de coaching ejecutivo inmediato con foco en comunicación y delegación efectiva", "Implementar reuniones semanales de visión y objetivos con reconocimiento explícito de logros del equipo", "Definir y documentar el estilo de liderazgo esperado: comportamientos, valores y compromisos concretos"],
      iniciativas: ["Programa de coaching ejecutivo de 90 días con sesiones quincenales y métricas de avance", "Manifiesto de Liderazgo: valores, conductas esperadas y compromisos documentados y publicados", "Reuniones 1:1 mensuales del líder principal con cada responsable de área"],
    },
    desarrollo: {
      interpretacion: "El liderazgo tiene bases funcionales, pero depende en exceso de las capacidades del líder principal. La comunicación estratégica es irregular y los mandos medios no están suficientemente desarrollados para sostener el crecimiento planificado.",
      recomendaciones: ["Crear un programa formal de desarrollo para mandos medios con competencias de liderazgo situacional", "Estandarizar la comunicación de visión y prioridades con reuniones mensuales de alineación para todo el equipo", "Implementar evaluaciones 360° para identificar las principales brechas de liderazgo por nivel"],
      iniciativas: ["Taller de liderazgo situacional para mandos medios con seguimiento a 6 meses", "Plan de desarrollo individual para los 3 líderes clave con metas medibles", "Dashboard de indicadores de clima y desempeño de liderazgo"],
    },
    avanzado: {
      interpretacion: "El liderazgo es una fortaleza real de la organización. La visión se comunica con claridad, existe cultura de delegación y el equipo directivo demuestra capacidad de operar con autonomía. El reto es institucionalizar estas prácticas para que no dependan de personas específicas.",
      recomendaciones: ["Documentar el modelo de liderazgo para replicarlo al crecer o abrir nuevas unidades", "Crear un programa formal de sucesión para los roles directivos críticos de la empresa", "Desarrollar programas de mentoring interno para acelerar el crecimiento de líderes emergentes"],
      iniciativas: ["Manual de Liderazgo A360 como activo organizacional transferible y versionado", "Programa de mentoring estructurado: líderes senior → mandos medios con objetivos trimestrales", "Certificación interna de liderazgo con criterios y evaluación medibles"],
    },
  },
  E: {
    critico: {
      interpretacion: "La empresa carece de un rumbo estratégico claro y documentado. Las decisiones se toman de forma reactiva, sin orientación hacia objetivos de largo plazo. Esto genera dispersión de recursos, iniciativas sin foco y resultados inconsistentes que impiden el crecimiento sostenido.",
      recomendaciones: ["Facilitar un taller estratégico de 2 días para definir visión, misión y 3 objetivos anuales medibles", "Comunicar la estrategia a todo el equipo en un formato visual y simple que cualquiera pueda repetir", "Designar un responsable de seguimiento estratégico con reporte mensual al equipo directivo"],
      iniciativas: ["Plan Estratégico A360 a 3 años con revisión anual y hitos trimestrales", "OKRs trimestrales alineados con la estrategia y comunicados a toda la organización", "Reunión mensual de revisión estratégica con el equipo directivo y acta de compromisos"],
    },
    desarrollo: {
      interpretacion: "Existe una visión estratégica, pero su ejecución es irregular. Las prioridades cambian frecuentemente, la estrategia no está suficientemente conectada con las decisiones del día a día y los equipos reciben señales inconsistentes sobre el rumbo de la empresa.",
      recomendaciones: ["Traducir la estrategia en objetivos trimestrales concretos y visibles para cada área del negocio", "Crear un tablero estratégico de seguimiento accesible para todo el equipo directivo", "Establecer una revisión estratégica trimestral formal con análisis de desviaciones y ajustes"],
      iniciativas: ["Mapa estratégico visual con indicadores clave por área y color de semáforo mensual", "OKRs con revisión quincenal por responsable y visibilidad en toda la organización", "Taller de alineación estratégica con mandos medios al inicio de cada trimestre"],
    },
    avanzado: {
      interpretacion: "La estrategia es una herramienta viva en esta organización. Las decisiones están alineadas con los objetivos, el equipo conoce el rumbo y existe un proceso formal de revisión periódica. El reto es explorar el siguiente horizonte de crecimiento con esta base sólida.",
      recomendaciones: ["Integrar análisis de escenarios futuros en el proceso de planeación estratégica anual", "Explorar nuevas oportunidades de crecimiento coherentes con las capacidades organizacionales actuales", "Desarrollar capacidades de planificación estratégica en el segundo nivel directivo"],
      iniciativas: ["Planning estratégico anual con análisis de escenarios: base, optimista y de crisis", "Benchmarking competitivo trimestral con informe ejecutivo y decisiones derivadas", "Foro de innovación estratégica anual con participación de mandos medios y clientes clave"],
    },
  },
  G: {
    critico: {
      interpretacion: "La gobernanza de la empresa es prácticamente inexistente. Las decisiones se toman sin proceso definido, los roles de autoridad son ambiguos y frecuentemente surgen conflictos. Esta situación representa un riesgo operativo y reputacional que bloquea el crecimiento escalable.",
      recomendaciones: ["Crear un Mapa de Autoridad que defina explícitamente quién decide qué en cada área de la organización", "Implementar reuniones directivas semanales con agenda fija, acta y seguimiento de acuerdos", "Establecer políticas documentadas para las 5 decisiones más críticas: compras, contrataciones, precios, inversiones, descuentos"],
      iniciativas: ["Modelo de Gobernanza A360: roles, procesos y matriz de autoridad documentada", "Manual de Políticas para decisiones operativas y estratégicas con rangos de aprobación", "Sistema de actas y seguimiento de acuerdos directivos con responsables y fechas"],
    },
    desarrollo: {
      interpretacion: "Existen estructuras de gobierno básicas, pero son inconsistentes. Las reuniones directivas ocurren sin suficiente disciplina, los acuerdos no siempre se documentan y los procesos de toma de decisión generan cuellos de botella.",
      recomendaciones: ["Implementar un sistema formal de actas de reunión con seguimiento semanal de acuerdos pendientes", "Documentar los flujos de decisión para los 5 tipos de decisiones más frecuentes y críticas", "Establecer métricas de cumplimiento de compromisos directivos con revisión mensual"],
      iniciativas: ["Herramienta de seguimiento de acuerdos y responsables con visibilidad del equipo directivo", "Protocolo de reuniones directivas con agenda tipo, tiempos definidos y acta estandarizada", "Evaluación semestral de la efectividad del modelo de gobierno con ajustes concretos"],
    },
    avanzado: {
      interpretacion: "La gobernanza es una fortaleza: decisiones con proceso definido, documentación sistemática y un modelo de seguimiento que genera confianza y predecibilidad en la operación.",
      recomendaciones: ["Evaluar la incorporación de un Consejo Asesor externo para las decisiones más estratégicas", "Explorar modelos de gobierno distribuido que den mayor autonomía a los mandos medios capacitados", "Documentar y certificar el modelo de gobernanza para replicarlo en nuevas unidades de negocio"],
      iniciativas: ["Consejo Asesor externo con reuniones trimestrales, agenda formal y compromisos medibles", "Modelo de decisión distribuida: catálogo de decisiones delegadas a mandos medios", "Auditoría de gobierno corporativo con plan de mejora y seguimiento"],
    },
  },
  O: {
    critico: {
      interpretacion: "La estructura organizacional es confusa o inexistente. Los roles no están claros, existen duplicidades y vacíos de responsabilidad que generan conflictos frecuentes. La empresa depende de personas específicas para funcionar, lo que la hace vulnerable y no escalable.",
      recomendaciones: ["Diseñar un organigrama formal con roles, responsabilidades y líneas de reporte explícitas", "Eliminar duplicidades críticas de responsabilidad y cubrir los vacíos identificados de forma urgente", "Documentar las funciones de los 5 puestos más estratégicos con descriptivos formales de cargo"],
      iniciativas: ["Rediseño organizacional completo con mapa de roles y responsabilidades actualizado", "Descriptivos de puesto formales para todos los roles críticos del negocio", "Socialización del Manual de Funciones con todo el equipo y proceso de firma de compromisos"],
    },
    desarrollo: {
      interpretacion: "La estructura existe pero tiene inconsistencias importantes. Algunos roles no están delimitados con claridad, existen áreas de fricción entre equipos y la estructura actual no está diseñada para facilitar el crecimiento planificado.",
      recomendaciones: ["Actualizar el organigrama para reflejar la realidad operativa actual, no la aspiración formal", "Resolver las ambigüedades de responsabilidad en las áreas con mayor fricción identificada", "Diseñar la estructura organizacional objetivo para los próximos 2-3 años de crecimiento previsto"],
      iniciativas: ["Taller de clarificación de roles entre las áreas con mayor fricción o duplicidad", "Matriz RACI para los procesos y decisiones más críticas del negocio", "Mapa evolutivo de la estructura organizacional alineado con el plan de crecimiento"],
    },
    avanzado: {
      interpretacion: "La estructura organizacional es una fortaleza: roles claros, responsabilidades definidas y una organización que puede funcionar de forma autónoma. El reto es escalar esta estructura sin perder claridad y eficiencia operativa.",
      recomendaciones: ["Diseñar la estructura organizacional para soportar 2x el tamaño actual de la empresa", "Implementar planes de carrera formales para retener y desarrollar el talento clave", "Explorar modelos organizacionales ágiles o de equipos autónomos para mayor velocidad de ejecución"],
      iniciativas: ["Roadmap de escalabilidad organizacional a 3 años con hitos de contratación e inversión", "Planes de carrera por área y nivel con criterios de progresión claros y medibles", "Piloto de equipos autónomos o círculos de responsabilidad en un área del negocio"],
    },
  },
  GE: {
    critico: {
      interpretacion: "La gestión de la empresa es reactiva y sin indicadores claros. No hay visibilidad sobre los resultados por área, las reuniones no producen acuerdos y la toma de decisiones carece de datos confiables. Esto genera ejecución caótica y resultados inconsistentes.",
      recomendaciones: ["Definir 3-5 KPIs críticos por área y comenzar a medirlos esta semana, aunque sea en hoja de cálculo", "Implementar una reunión semanal de seguimiento de resultados con responsables y compromisos explícitos", "Crear un tablero básico visible para todo el equipo directivo con semáforos de desempeño"],
      iniciativas: ["Dashboard de gestión básico: 5 indicadores por área con semáforo semanal", "Modelo de reuniones: semanal operativo y mensual táctico con agenda fija y acta", "Sistema de seguimiento de tareas y compromisos con visibilidad del equipo directivo"],
    },
    desarrollo: {
      interpretacion: "Existen indicadores y reuniones de seguimiento, pero su implementación es irregular. La toma de decisiones con datos es parcial y las reuniones no siempre generan acciones concretas con responsables y fechas claras.",
      recomendaciones: ["Estandarizar el formato de reuniones de seguimiento con métricas preestablecidas y semáforos de desempeño", "Conectar los KPIs operativos con los objetivos estratégicos para asegurar que se mide lo que importa", "Implementar un protocolo de respuesta ante desviaciones importantes: quién actúa y en qué plazo"],
      iniciativas: ["Cadencia de reuniones: semanal operativo, mensual táctico, trimestral estratégico con OKRs", "Dashboard integrado con alertas automáticas ante desviaciones de indicadores clave", "Modelo predictivo básico para los 3 indicadores más críticos del negocio"],
    },
    avanzado: {
      interpretacion: "La gestión es una fortaleza: indicadores relevantes, reuniones efectivas y decisiones basadas en datos. El siguiente nivel es hacer predictiva la gestión, anticipando problemas antes de que se materialicen.",
      recomendaciones: ["Implementar análisis de tendencias y alertas tempranas sobre los indicadores más críticos", "Explorar herramientas de Business Intelligence para análisis más sofisticados y visualización avanzada", "Desarrollar capacidades de interpretación de datos en el equipo directivo y mandos medios"],
      iniciativas: ["Plataforma de BI integrada con datos en tiempo real de todas las áreas", "Programa de Data Literacy para el equipo directivo y mandos medios", "Modelos predictivos para los 3 indicadores más críticos con alertas automáticas"],
    },
  },
  F: {
    critico: {
      interpretacion: "Las finanzas se gestionan de forma intuitiva, sin sistemas de control ni visibilidad real sobre la rentabilidad. Esta situación expone a la empresa a riesgos severos de liquidez, ineficiencia de costos y decisiones estratégicas mal informadas que comprometen la supervivencia.",
      recomendaciones: ["Implementar un control de flujo de caja semanal como prioridad absoluta e inmediata", "Generar un estado de resultados mensual, aunque sea simplificado, para tomar decisiones informadas", "Definir el margen bruto objetivo por línea de negocio y comenzar a medirlo esta semana"],
      iniciativas: ["Sistema de control financiero básico: flujo de caja, costos e ingresos por semana", "Presupuesto anual con revisión de desviaciones mensual y responsable de seguimiento", "Formación financiera básica para el equipo directivo no financiero de la empresa"],
    },
    desarrollo: {
      interpretacion: "Existen controles financieros básicos pero incompletos. La rentabilidad se mide globalmente pero no por unidad de negocio, producto o cliente. Las decisiones de inversión aún se toman con información parcial y sin proyecciones confiables.",
      recomendaciones: ["Implementar análisis de rentabilidad por línea de producto, servicio o segmento de cliente", "Crear un tablero financiero con los 5-8 indicadores más relevantes para la toma de decisiones", "Establecer políticas claras y documentadas de aprobación de gastos e inversiones por monto"],
      iniciativas: ["Análisis de rentabilidad por segmento con revisión mensual y acción ante desviaciones", "Política financiera documentada: límites de aprobación, responsables y proceso", "Proyecciones financieras a 12 meses con escenarios base, optimista y de crisis"],
    },
    avanzado: {
      interpretacion: "Las finanzas son una fortaleza estratégica real. La empresa tiene visibilidad clara sobre rentabilidad, controla sus costos y toma decisiones con información financiera confiable y oportuna. El objetivo es usar las finanzas como palanca activa de valoración y crecimiento.",
      recomendaciones: ["Explorar oportunidades de optimización de la estructura de capital y el capital de trabajo", "Desarrollar modelos de valoración actualizados para medir el impacto financiero de cada iniciativa", "Implementar una estrategia de diversificación de fuentes de financiamiento para el crecimiento"],
      iniciativas: ["Modelo de valoración empresarial actualizado trimestralmente con múltiplo de referencia", "Estrategia de optimización de capital de trabajo: cobros, inventarios y plazos con proveedores", "Preparación para due diligence financiero ante posibles inversiones, adquisiciones o venta"],
    },
  },
  C: {
    critico: {
      interpretacion: "El proceso comercial es informal y depende de relaciones personales del fundador. No existe un método reproducible de prospección y cierre, los resultados son impredecibles y la empresa no tiene visibilidad real sobre su pipeline ni proyecciones de ingresos confiables.",
      recomendaciones: ["Documentar el proceso comercial en 5 etapas simples: prospección, contacto, propuesta, cierre y postventa", "Establecer objetivos de ventas mensuales claros, medibles y comunicados a los responsables comerciales", "Implementar un CRM básico para dar seguimiento al pipeline, aunque sea en hoja de cálculo"],
      iniciativas: ["Sales Playbook: proceso de venta, argumentarios, manejo de objeciones y materiales estándar", "CRM básico con seguimiento semanal del pipeline por etapa y valor esperado", "Reunión semanal de pipeline con el responsable comercial: oportunidades, avances y bloqueos"],
    },
    desarrollo: {
      interpretacion: "Existe un proceso comercial definido, pero su ejecución es irregular. La prospección no es suficientemente sistemática, el seguimiento postventa es limitado y los indicadores de conversión no se usan para mejorar la efectividad del equipo.",
      recomendaciones: ["Implementar métricas de conversión por etapa del pipeline para identificar dónde se pierden oportunidades", "Crear un programa formal de seguimiento postventa para aumentar retención y generar referencias", "Desarrollar materiales de venta estandarizados que no dependan de una persona específica del equipo"],
      iniciativas: ["Actualización del Sales Playbook con casos de éxito reales y métricas de conversión por etapa", "Programa de NPS y seguimiento trimestral de satisfacción de clientes activos", "Formación mensual del equipo comercial: técnica de ventas, producto y tendencias del mercado"],
    },
    avanzado: {
      interpretacion: "El área comercial opera con método, mide sus resultados y mejora de forma continua. El proceso es reproducible, independiente de estrellas individuales y la empresa tiene visibilidad clara sobre su pipeline y proyecciones de ventas confiables.",
      recomendaciones: ["Desarrollar un modelo de gestión de cuentas clave para los clientes más rentables y estratégicos", "Explorar canales de venta alternativos, alianzas o programas de referidos para diversificar el pipeline", "Implementar automatización de marketing para nutrir prospectos y alimentar el embudo de ventas"],
      iniciativas: ["Key Account Management (KAM) para el top 20% de clientes por valor y potencial", "Estrategia de automatización de prospección con herramientas digitales y secuencias de contacto", "Partnership strategy para multiplicar el alcance comercial sin aumentar proporcionalmente el equipo"],
    },
  },
  M: {
    critico: {
      interpretacion: "La empresa no tiene estrategia de marketing definida. Las acciones son esporádicas, sin objetivo claro ni medición de resultados. Esto limita severamente la visibilidad en el mercado y la capacidad de atraer nuevos clientes de forma consistente y predecible.",
      recomendaciones: ["Definir el cliente ideal (ICP) con sus dolores, deseos y canales donde busca información", "Seleccionar 1-2 canales de marketing prioritarios y ejecutarlos con consistencia durante al menos 3 meses", "Crear un calendario de contenidos mensual básico con al menos 8 publicaciones o acciones"],
      iniciativas: ["Perfil del cliente ideal (ICP) documentado con datos cualitativos y cuantitativos del mercado", "Estrategia de 1 canal digital prioritario: LinkedIn, email marketing o contenido educativo", "Plan de contenidos trimestral con métricas básicas de alcance, engagement y leads generados"],
    },
    desarrollo: {
      interpretacion: "Existe actividad de marketing pero sin coherencia estratégica ni medición sistemática. Las campañas se ejecutan sin analizar en profundidad sus resultados. La propuesta de valor no se comunica con suficiente claridad y consistencia en todos los puntos de contacto.",
      recomendaciones: ["Definir o actualizar la propuesta de valor única y comunicarla de forma consistente en todos los canales", "Implementar medición básica de ROI para cada canal activo: costo por lead, conversión y valor generado", "Alinear marketing con ventas para que los leads generados sean calificados y relevantes para el equipo comercial"],
      iniciativas: ["Actualización de la propuesta de valor y mensajes clave diferenciados por segmento de cliente", "Dashboard de marketing: KPIs por canal activo con revisión mensual y decisiones de optimización", "Proceso de handoff marketing → ventas con criterios explícitos de calificación de leads"],
    },
    avanzado: {
      interpretacion: "Marketing es un motor de crecimiento efectivo. Hay estrategia clara, ejecución consistente y medición de resultados. El reto es escalar lo que funciona y explorar nuevas palancas de posicionamiento y construcción de marca.",
      recomendaciones: ["Explorar estrategias de thought leadership para posicionar a la empresa o fundador como referente del sector", "Desarrollar un programa formal de referidos o embajadores de marca con incentivos estructurados", "Escalar los canales con mejor ROI con mayor inversión y automatización de procesos repetitivos"],
      iniciativas: ["Programa de embajadores y referidos con incentivos claros y trazabilidad de resultados", "Estrategia de thought leadership: artículos, conferencias, podcasts y contenido educativo de alto valor", "Marketing automation integrado con CRM para nutrición automática de prospectos y seguimiento"],
    },
  },
  OP: {
    critico: {
      interpretacion: "Las operaciones son caóticas y dependientes de personas específicas. Los procesos no están documentados, los errores son frecuentes y la productividad varía enormemente. En este estado, crecer solo amplifica los problemas existentes en lugar de los resultados.",
      recomendaciones: ["Mapear los 5 procesos más críticos tal como ocurren hoy — sin optimizar aún, solo documentar la realidad", "Identificar y atacar los 3 cuellos de botella más costosos en tiempo, dinero o calidad", "Asignar un responsable claro para cada proceso operativo crítico con rendición de cuentas explícita"],
      iniciativas: ["Mapa de procesos AS-IS de los 5 flujos más críticos tal como ocurren en la práctica actual", "SOPs (Procedimientos Estándar de Operación) para los procesos más críticos con criterios de calidad", "Sistema de reporte de incidencias y resolución con responsables asignados y tiempo de respuesta"],
    },
    desarrollo: {
      interpretacion: "Los procesos existen pero no están suficientemente documentados ni estandarizados. La calidad del servicio o producto es irregular y existe dependencia de conocimiento concentrado en pocas personas que no ha sido sistematizado.",
      recomendaciones: ["Completar la documentación de todos los procesos críticos con estándares de calidad medibles y verificables", "Implementar indicadores de productividad y calidad para los procesos más relevantes del negocio", "Crear un sistema formal de mejora continua con ciclos de revisión mensual y responsables definidos"],
      iniciativas: ["Biblioteca de SOPs actualizada, accesible y con versionamiento para todo el equipo relevante", "Indicadores de OTD (On Time Delivery) y calidad por proceso con meta definida y revisión mensual", "Ciclos mensuales de mejora continua: identifica → analiza → mejora → mide → itera"],
    },
    avanzado: {
      interpretacion: "Las operaciones son una ventaja competitiva real. Los procesos están documentados, los estándares se cumplen y la empresa puede crecer sin comprometer la calidad. El siguiente paso es automatizar lo posible para liberar capacidad humana para tareas de mayor valor.",
      recomendaciones: ["Identificar los procesos candidatos a automatización o digitalización con mayor impacto en eficiencia", "Explorar tecnologías que reduzcan el trabajo manual repetitivo y aumenten la consistencia y trazabilidad", "Desarrollar capacidades de mejora continua en todo el equipo operativo, no solo en el nivel directivo"],
      iniciativas: ["Programa de automatización de los 5 procesos más repetitivos y de mayor volumen de la empresa", "Certificación ISO u otro estándar internacional para los procesos críticos de cara al cliente", "Centro de Excelencia Operativa interno con roles formalizados de mejora continua"],
    },
  },
  CU: {
    critico: {
      interpretacion: "La cultura organizacional presenta problemas serios: bajo nivel de confianza, comunicación deficiente y falta de accountability generalizado. Este ambiente limita el compromiso, genera alta rotación y hace difícil atraer y retener talento que genere resultados sostenidos.",
      recomendaciones: ["Iniciar conversaciones honestas y estructuradas sobre el clima organizacional actual sin buscar culpables", "Implementar una práctica semanal de reconocimiento visible de logros del equipo con el respaldo de la dirección", "Crear canales seguros para que el equipo exprese inquietudes y propuestas sin miedo a consecuencias"],
      iniciativas: ["Diagnóstico de clima organizacional con encuesta anónima y plan de acción específico derivado", "Programa de cultura: definición participativa de valores, comportamientos esperados y rituales de equipo", "Reuniones mensuales de equipo con espacio estructurado para retroalimentación y propuestas de mejora"],
    },
    desarrollo: {
      interpretacion: "Existe una cultura con valores declarados, pero su implementación es inconsistente entre áreas y niveles. El accountability no es generalizado y los líderes no siempre modelan con su comportamiento los valores que declaran esperar del equipo.",
      recomendaciones: ["Alinear los sistemas de reconocimiento, evaluación y consecuencias explícitamente con los valores declarados", "Desarrollar a los líderes como modelos activos de la cultura deseada — con hechos medibles, no solo palabras", "Crear rituales de equipo que refuercen la cultura de forma consistente, auténtica y frecuente"],
      iniciativas: ["Programa de Values-Based Leadership para todo el equipo directivo y mandos medios", "Sistema de reconocimiento alineado con los valores organizacionales con visibilidad en toda la empresa", "Rituales de cultura: celebraciones de logros, aprendizaje compartido y retroalimentación peer-to-peer"],
    },
    avanzado: {
      interpretacion: "La cultura es una ventaja competitiva real. El equipo está comprometido, hay alto nivel de confianza y accountability, y la comunicación fluye de forma efectiva en todas las direcciones. El reto es preservar esta cultura al escalar y al incorporar nuevo talento.",
      recomendaciones: ["Documentar la cultura explícitamente para transmitirla en el proceso de inducción de nuevos colaboradores", "Implementar métricas de cultura: eNPS trimestral, rotación voluntaria y engagement por área", "Usar la cultura como diferenciador en la propuesta de valor al empleado para atraer al mejor talento del mercado"],
      iniciativas: ["Culture Book documentado, visual y vivido que se entrega desde el primer día de trabajo", "eNPS trimestral con revisión directiva, resultados publicados y plan de acción derivado", "Programa de marca empleadora basado en los valores auténticos de la cultura organizacional"],
    },
  },
  T: {
    critico: {
      interpretacion: "La gestión del talento es informal y reactiva. No hay proceso de selección estructurado, la capacitación es esporádica y el desempeño no se evalúa de forma sistemática. Esto genera alta rotación, bajo rendimiento y dificultad para crecer con el equipo adecuado en el momento correcto.",
      recomendaciones: ["Crear un proceso de selección básico con criterios claros de perfil y desempeño esperado por rol", "Implementar un programa de inducción formal que reduzca el tiempo hasta que alguien sea productivo", "Establecer expectativas de desempeño explícitas y revisarlas al menos semestralmente con cada colaborador"],
      iniciativas: ["Proceso formal de selección con perfil de puesto, etapas, criterios y herramientas de evaluación", "Programa de inducción estructurado para nuevos colaboradores durante las primeras 4 semanas", "Evaluaciones de desempeño semestrales con formulario estándar y espacio para planes de mejora"],
    },
    desarrollo: {
      interpretacion: "Existen prácticas de gestión del talento, pero no están suficientemente integradas ni son efectivas para retener y desarrollar al talento más crítico. Las evaluaciones ocurren pero no generan planes de desarrollo concretos con seguimiento real.",
      recomendaciones: ["Conectar las evaluaciones de desempeño con planes de desarrollo individual accionables y seguidos", "Identificar y desarrollar programas específicos de retención para el talento más crítico e impacto", "Crear planes de sucesión documentados para los 3-5 roles más críticos e irremplazables de la empresa"],
      iniciativas: ["PDIs (Planes de Desarrollo Individual) para el top 20% del equipo por impacto y potencial", "Mapa de talento crítico con plan de retención diferenciado por persona y horizonte temporal", "Plan de sucesión documentado para los 5 roles más críticos del negocio con candidatos identificados"],
    },
    avanzado: {
      interpretacion: "La gestión del talento es un activo estratégico real. Se selecciona bien, se desarrolla con intención y se retiene al talento clave con programas diferenciados. El reto es convertir esta capacidad en una ventaja competitiva que atraiga al mejor talento del mercado.",
      recomendaciones: ["Desarrollar una propuesta de valor al empleado (EVP) diferenciada, auténtica y comunicada activamente", "Implementar un modelo de competencias ligado explícitamente a la estrategia y los valores del negocio", "Explorar programas de participación en resultados o equity para retener al talento de mayor impacto"],
      iniciativas: ["Employee Value Proposition documentada y comunicada en todos los canales de atracción de talento", "Modelo de competencias organizacional con perfil esperado por nivel, área y etapa de crecimiento", "Programa de participación en resultados o equity para el talento crítico con metas claras"],
    },
  },
  ES: {
    critico: {
      interpretacion: "La empresa no está en condiciones de escalar. El conocimiento crítico está concentrado en el fundador y pocas personas clave, los procesos no están documentados y el negocio se deteriora cuando alguien falta. Crecer en este estado multiplica los problemas, no los resultados.",
      recomendaciones: ["Documentar urgentemente los 10 procesos más críticos como primer paso innegociable de sistematización", "Identificar los 3 principales cuellos de botella de escalabilidad y atacarlos de forma sistemática en 90 días", "Crear un plan de delegación inmediato para liberar al fundador de las tareas más operativas y repetitivas"],
      iniciativas: ["Programa de sistematización: procesos, manuales y delegación estructurada en los primeros 90 días", "Transferencia de conocimiento crítico del fundador a las segundas líneas identificadas y capacitadas", "Implementación de herramientas de soporte operativo que reduzcan la dependencia de personas clave"],
    },
    desarrollo: {
      interpretacion: "La empresa tiene bases para escalar pero aún depende demasiado de personas específicas y el conocimiento no está suficientemente sistematizado. Un crecimiento acelerado en este estado generaría fricción, deterioro de la calidad y potencial crisis operativa.",
      recomendaciones: ["Completar la sistematización de los procesos pendientes priorizando los de mayor impacto en el crecimiento", "Fortalecer la segunda línea directiva con autonomía real, responsabilidades claras y recursos asignados", "Probar la escalabilidad con iniciativas de expansión controladas antes de un crecimiento agresivo"],
      iniciativas: ["Biblioteca de SOPs completa con versionamiento y acceso para todo el equipo relevante de la empresa", "Programa de delegación estructurada: mandos medios con autoridad formal y rendición de cuentas clara", "Piloto de expansión controlado: nueva unidad de negocio, ciudad o línea de producto con métricas"],
    },
    avanzado: {
      interpretacion: "La empresa tiene la arquitectura para escalar con confianza. Los procesos están sistematizados, el conocimiento se puede transferir y la organización puede crecer sin depender de personas irreemplazables. Es el momento de acelerar con una estrategia de crecimiento ambiciosa.",
      recomendaciones: ["Diseñar la estrategia de escalabilidad para los próximos 3-5 años con metas ambiciosas y recursos definidos", "Explorar modelos acelerados como franquicias, licencias o alianzas estratégicas para escalar más rápido", "Atraer inversión o financiamiento para ejecutar el plan de crecimiento con mayor velocidad y alcance"],
      iniciativas: ["Roadmap de escalabilidad: mapa de expansión a 3 años con hitos, recursos y métricas de éxito", "Modelo de negocio replicable: documentado, probado en piloto y listo para ser escalado sistemáticamente", "Proceso formal de atracción de capital o socios estratégicos para la siguiente etapa de crecimiento"],
    },
  },
};

interface IndiceLevelContent { interpretacion: string; recomendaciones: string[]; }
const INDICE_CONTENT: Record<string, { critico: IndiceLevelContent; desarrollo: IndiceLevelContent; avanzado: IndiceLevelContent }> = {
  ivee: {
    critico: {
      interpretacion: "La empresa NO está lista para escalar — riesgo crítico. Las bases organizacionales, comerciales y operativas son insuficientes para sostener un crecimiento acelerado. Intentar escalar en este estado generaría colapsos operativos, deterioro severo de la calidad y destrucción de valor. Cualquier comprador o inversionista aplicaría un descuento significativo por esta razón.",
      recomendaciones: [
        "Resolver antes de escalar: cerrar las brechas críticas de madurez empresarial (IME) que limitan la base operativa sobre la que se construye cualquier crecimiento sostenible",
        "Sistematizar antes de crecer: documentar los procesos críticos, transferir el conocimiento y eliminar la dependencia de personas individuales como condición previa al crecimiento",
        "Trazar el mapa de escalabilidad: definir explícitamente qué debe estar en orden antes de cada fase de crecimiento y establecer hitos medibles de viabilidad",
      ],
    },
    desarrollo: {
      interpretacion: "Existen limitantes importantes para el crecimiento. La empresa puede avanzar de forma controlada en algunos frentes, pero no está preparada para una expansión agresiva sin riesgo de deterioro operativo y pérdida de calidad. Los inversionistas perciben este nivel como potencial sin garantía de ejecución.",
      recomendaciones: [
        "Fortalecer los sistemas que están limitando la escalabilidad antes de acelerar el crecimiento — crecer en este estado multiplica los problemas, no los resultados",
        "Priorizar por capacidad de escala: identificar qué áreas del negocio ya son escalables hoy y concentrar las iniciativas de crecimiento en esas primero",
        "Construir el roadmap de preparación: definir hitos claros de viabilidad para escalar en fases — con criterios de 'go/no-go' antes de cada etapa de expansión",
      ],
    },
    avanzado: {
      interpretacion: "La empresa tiene bases sólidas para escalar. Los sistemas, procesos y capacidades organizacionales pueden sostener un crecimiento significativo sin comprometer la calidad ni la operación del negocio. Este nivel genera confianza en inversionistas y compradores porque el crecimiento parece predecible y ejecutable.",
      recomendaciones: [
        "Diseñar la estrategia de escalabilidad con metas ambiciosas, recursos claramente asignados y métricas de seguimiento definidas por fase",
        "Explorar modelos acelerados de crecimiento: nuevos mercados, canales alternativos, alianzas estratégicas o modelos replicables como franquicias o licencias",
        "Capitalizar la escalabilidad como activo: usar este nivel como argumento central en procesos de valoración, atracción de inversión o negociación con socios estratégicos",
      ],
    },
  },
  idf: {
    critico: { interpretacion: "La empresa tiene dependencia CRÍTICA del fundador. Las decisiones clave, relaciones con clientes y conocimiento operativo están concentrados en una sola persona. Esto destruye valor en procesos de inversión o venta y hace a la empresa sumamente vulnerable ante cualquier eventualidad.", recomendaciones: ["Iniciar inmediatamente un plan de delegación: identificar qué puede dejar de hacer el fundador esta semana", "Documentar el conocimiento crítico del fundador y transferirlo a segundas líneas de forma sistemática", "Desarrollar líderes que puedan tomar decisiones estratégicas sin requerir la aprobación del fundador"] },
    desarrollo: { interpretacion: "Existe dependencia moderada del fundador. El negocio opera en lo operativo sin su presencia constante, pero las decisiones estratégicas y relaciones clave aún dependen de él/ella, limitando el tiempo disponible para actividades de mayor valor estratégico.", recomendaciones: ["Estructurar las relaciones clave con clientes para que dependan de la empresa como institución, no del fundador", "Delegar progresivamente las decisiones de menor riesgo para entrenar la capacidad de decisión del equipo", "Crear un Comité de Dirección que tome decisiones colectivamente sin necesitar al fundador en cada caso"] },
    avanzado: { interpretacion: "La empresa tiene baja dependencia del fundador. Los sistemas, procesos y el equipo pueden operar y crecer de forma autónoma. Esto aumenta significativamente el valor de la empresa y la libertad del fundador para enfocarse en lo estratégico.", recomendaciones: ["Formalizar la autonomía del equipo con estructuras de gobierno que sostengan la independencia lograda", "Explorar estrategias de salida, sucesión o expansión que capitalicen la autonomía organizacional construida", "Documentar la independencia operativa como activo en el proceso de valoración de la empresa"] },
  },
  cof: {
    critico: { interpretacion: "Existe incoherencia organizacional significativa. Los valores declarados no se viven en la práctica, los sistemas no están alineados entre sí y los equipos parecen operar con agendas distintas. Esto genera fricción interna, decisiones contradictorias y desconfianza generalizada.", recomendaciones: ["Auditar la brecha entre lo que se declara (valores, visión) y lo que los sistemas y comportamientos demuestran", "Alinear los sistemas de incentivo, evaluación y reconocimiento con los valores organizacionales declarados", "Facilitar talleres de alineación entre áreas para crear un lenguaje común de trabajo y colaboración"] },
    desarrollo: { interpretacion: "Existe alineación parcial en la organización. Algunas áreas y procesos están bien alineados, pero hay inconsistencias entre la estrategia, la cultura y los sistemas operativos que generan fricción y oportunidades perdidas.", recomendaciones: ["Mapear las principales incoherencias entre lo que se dice y lo que los sistemas efectivamente incentivan", "Crear un proceso formal de alineación entre áreas con revisión trimestral y compromisos explícitos", "Definir explícitamente qué comportamientos NO son coherentes con los valores de la empresa"] },
    avanzado: { interpretacion: "Alta coherencia organizacional: la estrategia, la cultura y los sistemas operativos están alineados y se refuerzan mutuamente. Las decisiones son consistentes y el equipo opera con propósito compartido.", recomendaciones: ["Usar la coherencia organizacional como ventaja competitiva en atracción de talento e inversión", "Documentar el modelo de coherencia para replicarlo en nuevas unidades o geografías de expansión", "Medir periódicamente la coherencia con encuestas internas y revisiones directivas para mantenerla"] },
  },
};

// ── Hero component ──────────────────────────────────────────────────────────
function Hero({
  gradient = "linear-gradient(135deg, #065F46 0%, #0C4A6E 50%, #1E3A8A 100%)",
  watermark,
  eyebrow,
  title,
  titleHighlight,
  desc,
  stats,
  children,
}: {
  gradient?: string;
  watermark: string;
  eyebrow: string;
  title: string;
  titleHighlight?: string;
  desc: string;
  stats?: { val: string; lbl: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div style={{ background: gradient, padding: "64px 64px 56px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 85% 30%, rgba(14,165,233,0.15), transparent 60%)" }} />
      <div style={{ position: "absolute", right: -20, bottom: -55, fontSize: 220, fontWeight: 900, color: "rgba(255,255,255,0.025)", letterSpacing: "-0.05em", lineHeight: 1 }}>
        {watermark}
      </div>
      <div style={{ position: "relative", zIndex: 2, maxWidth: 800 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "7px 18px 7px 12px", fontSize: 12, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 22 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0EA5E9", display: "inline-block" }} />
          {eyebrow}
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
          {title}{titleHighlight && (
            <> <span style={{ background: "linear-gradient(135deg, #38BDF8, #6EE7B7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{titleHighlight}</span></>
          )}
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", lineHeight: 1.85, marginBottom: children ? 32 : stats ? 32 : 0, textAlign: "justify", maxWidth: 680 }}>
          {desc}
        </p>
        {children}
        {stats && (
          <div style={{ display: "flex", gap: 0, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap" }}>
            {stats.map((s, i) => (
              <div key={i} style={{ paddingRight: 40, marginRight: 40, borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none", marginBottom: 8 }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SideCore (main) ─────────────────────────────────────────────────────────
export function SideCore({
  mode,
  fixedClienteId,
  sesionIdParam,
}: {
  mode: "consultor" | "cliente";
  fixedClienteId?: string;
  sesionIdParam?: string;
}) {
  const { user, role, session } = useAuth();
  const navigate = useNavigate();
  const esCliente = mode === "cliente";

  const [sideTab, setSideTab] = useState<SideTabKey>("side");
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [scores, setScores] = useState<ScoreMap>({});
  const [financiero, setFinanciero] = useState<DatosFinancieros>({});
  const [analisis, setAnalisis] = useState<AnalisisMap>({});
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);

  // Load clients
  useEffect(() => {
    if (!user) return;
    if (esCliente && fixedClienteId) {
      supabase.from("clientes").select("id,nombre_empresa,sector,tamano,pais,ciudad,acceso_interpretacion")
        .eq("id", fixedClienteId)
        .then(({ data }) => setClientes((data ?? []) as Cliente[]));
    } else {
      supabase.from("clientes").select("id,nombre_empresa,sector,tamano,pais,ciudad,acceso_interpretacion")
        .eq("activo", true).order("nombre_empresa")
        .then(({ data }) => setClientes((data ?? []) as Cliente[]));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-open from URL ?sesion=<id>
  useEffect(() => {
    if (!sesionIdParam || !user) return;
    (async () => {
      const { data, error } = await supabase.from("side_sesiones").select("*").eq("id", sesionIdParam).maybeSingle();
      if (error || !data) { toast.error("No se pudo cargar la sesión"); return; }
      const s = data as unknown as Sesion;
      setSesion(s);
      setScores(s.scores ?? {});
      setFinanciero(s.datos_financieros ?? {});
      setAnalisis((s.analisis_ia ?? {}) as AnalisisMap);
      dirtyRef.current = false;
      const cid = s.cliente_id;
      setClientes((prev) => {
        if (prev.find((c) => c.id === cid)) return prev;
        void supabase.from("clientes").select("id,nombre_empresa,sector,tamano,pais,ciudad").eq("id", cid).maybeSingle()
          .then(({ data: c }) => { if (c) setClientes((p) => [...p, c as Cliente]); });
        return prev;
      });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesionIdParam, user]);

  // Dirty tracking
  useEffect(() => { dirtyRef.current = true; }, [scores, financiero, analisis]);

  // Computed scores
  const dimScores = useMemo(() => DIMENSIONES.map((d) => ({
    key: d.key,
    nombre: d.nombre,
    iniciativa: d.iniciativa,
    score: promedio(d.preguntas.map((p) => p.id), scores),
  })), [scores]);

  const ime = useMemo(() => {
    const v = dimScores.map((d) => d.score).filter((s) => s > 0);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }, [dimScores]);
  const ivee = useMemo(() => promedio(IVEE_PREGUNTAS.map((p) => p.id), scores), [scores]);
  const idf = useMemo(() => promedio(IDF_PREGUNTAS.map((p) => p.id), scores), [scores]);
  const cof = useMemo(() => promedio(COF_PREGUNTAS.map((p) => p.id), scores), [scores]);
  const calcFin = useMemo(() => calcFinanciero(financiero), [financiero]);

  const totalPreguntas = DIMENSIONES.reduce((a, d) => a + d.preguntas.length, 0) + IVEE_PREGUNTAS.length + IDF_PREGUNTAS.length + COF_PREGUNTAS.length;
  const respondidas = Object.values(scores).filter((v) => v > 0).length;
  const progresoPct = totalPreguntas > 0 ? Math.round((respondidas / totalPreguntas) * 100) : 0;

  // Save function
  const guardar = async (silent = false) => {
    if (!sesion) return;
    if (!silent) setSaving(true);
    const payload = {
      scores: scores as Record<string, number>,
      datos_financieros: financiero as Record<string, unknown>,
      analisis_ia: analisis as Record<string, { titulo: string; contenido: string; fecha: string }>,
      ime_score: ime || null,
      ivee_score: ivee || null,
      idf_score: idf || null,
      cof_score: cof || null,
    };
    const { error } = await supabase.from("side_sesiones").update(payload as never).eq("id", sesion.id);
    if (!silent) setSaving(false);
    if (error) { if (!silent) toast.error(error.message); return; }
    dirtyRef.current = false;
    setSavedAt(new Date());
    if (!silent) toast.success("Sesión guardada");
    setSesion((prev) => prev ? ({ ...prev, ...payload } as Sesion) : prev);
  };

  // Auto-save every 30s
  useEffect(() => {
    if (!sesion) return;
    const t = setInterval(() => { if (dirtyRef.current) void guardar(true); }, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, financiero, analisis, sesion]);

  const setScore = (id: string, v: number) => setScores((prev) => ({ ...prev, [id]: v }));

  const cliente = sesion ? (clientes.find((c) => c.id === sesion.cliente_id) ?? null) : null;

  const puedeVerInterpretacion = !esCliente
    || (cliente?.acceso_interpretacion ?? false)
    || sesion?.estado_revision === "revisado";
  const esEditableSession = !esCliente
    || (sesion?.estado_revision === "borrador" && !sesion?.completada);

  const abrirSesion = (s: Sesion) => {
    setSesion(s);
    setScores(s.scores ?? {});
    setFinanciero(s.datos_financieros ?? {});
    setAnalisis((s.analisis_ia ?? {}) as AnalisisMap);
    dirtyRef.current = false;
    setSavedAt(null);
    setSideTab("side");
    if (!esCliente) void navigate({ to: "/app/side", search: { sesion: s.id } });
  };

  const cerrarSesion = () => {
    setSesion(null);
    setScores({});
    setFinanciero({});
    setAnalisis({});
    dirtyRef.current = false;
    setSavedAt(null);
    setSideTab(esCliente ? "historial" : "side");
    if (!esCliente) void navigate({ to: "/app/side", search: { sesion: undefined } });
  };

  const enviarRevision = async () => {
    if (progresoPct < 100) {
      toast.error(`Debes responder todas las preguntas (${progresoPct}% completado)`);
      return;
    }
    if (!confirm("¿Enviar el diagnóstico para revisión del consultor? No podrás editarlo después.")) return;
    const { error } = await supabase
      .from("side_sesiones")
      .update({ scores: scores as Record<string, number>, estado_revision: "pendiente_revision" })
      .eq("id", sesion!.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Diagnóstico enviado para revisión — tu consultor lo revisará pronto");
    cerrarSesion();
  };

  const goTab = (tab: SideTabKey) => {
    if (REQUIRES_SESSION.includes(tab) && !sesion) {
      toast.info("Inicia una sesión de diagnóstico primero");
      return;
    }
    setSideTab(tab);
  };

  return (
    <div style={{ margin: "-24px -24px 0" }}>
      {/* ── Inner Nav ── */}
      <div style={{
        background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)",
        padding: "0 64px",
        display: "flex",
        gap: 0,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        overflowX: "auto",
      }}>
        {TABS.map((t) => {
          const active = sideTab === t.key;
          const disabled = REQUIRES_SESSION.includes(t.key) && !sesion;
          return (
            <button
              key={t.key}
              onClick={() => goTab(t.key)}
              style={{
                padding: "17px 24px",
                fontSize: 14,
                fontWeight: active ? 700 : 600,
                color: disabled ? "rgba(255,255,255,0.25)" : active ? "#38BDF8" : "rgba(255,255,255,0.55)",
                cursor: disabled ? "not-allowed" : "pointer",
                background: "transparent",
                border: "none",
                borderBottom: `3px solid ${active ? "#0EA5E9" : "transparent"}`,
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
            >
              {t.label}
              {t.badge && (
                <span style={{ background: "rgba(14,165,233,0.2)", color: "#38BDF8", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999, opacity: disabled ? 0.4 : 1 }}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
        {sesion && !esCliente && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, padding: "0 8px", flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>
              {savedAt ? `✓ ${savedAt.toLocaleTimeString("es-EC")}` : "Sin guardar"}
            </span>
            <button
              onClick={() => void guardar(false)}
              disabled={saving}
              style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              {saving ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <Save style={{ width: 12, height: 12 }} />}
              Guardar
            </button>
            <button
              onClick={cerrarSesion}
              style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              ← Salir
            </button>
          </div>
        )}
        {sesion && esCliente && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, padding: "0 8px", flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>
              {progresoPct}% completado
            </span>
            {esEditableSession && (
              <>
                <button
                  onClick={() => void guardar(false)}
                  disabled={saving}
                  style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {saving ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <Save style={{ width: 12, height: 12 }} />}
                  Guardar
                </button>
                <button
                  onClick={() => void enviarRevision()}
                  disabled={progresoPct < 100}
                  style={{ padding: "6px 14px", borderRadius: 8, background: progresoPct === 100 ? "linear-gradient(135deg,#0EA5E9,#6366F1)" : "rgba(255,255,255,0.08)", border: "none", color: progresoPct === 100 ? "white" : "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 600, cursor: progresoPct === 100 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <CheckCircle2 style={{ width: 12, height: 12 }} /> Enviar para revisión
                </button>
              </>
            )}
            <button
              onClick={cerrarSesion}
              style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              ← Volver
            </button>
          </div>
        )}
      </div>

      {/* ── Tab content ── */}
      {sideTab === "side" && (
        <TabSide
          sesion={sesion}
          cliente={cliente}
          clientes={clientes}
          setClientes={setClientes}
          ime={ime} ivee={ivee} idf={idf} cof={cof}
          dimScores={dimScores}
          progresoPct={progresoPct}
          respondidas={respondidas}
          role={role}
          user={user}
          esCliente={esCliente}
          fixedClienteId={fixedClienteId}
          onIniciar={abrirSesion}
          onGoTab={goTab}
        />
      )}
      {sideTab === "dimensiones" && sesion && (
        <TabDimensiones
          dimensiones={DIMENSIONES}
          scores={scores}
          setScore={setScore}
          dimScores={dimScores}
          respondidas={respondidas}
          progresoPct={progresoPct}
          readOnly={!esEditableSession}
          puedeVerInterpretacion={puedeVerInterpretacion}
        />
      )}
      {sideTab === "indices" && sesion && (
        <TabIndices
          scores={scores}
          setScore={setScore}
          ivee={ivee} idf={idf} cof={cof}
          readOnly={!esEditableSession}
          puedeVerInterpretacion={puedeVerInterpretacion}
        />
      )}
      {sideTab === "financiero" && sesion && (
        <TabFinanciero financiero={financiero} setFinanciero={setFinanciero} ime={ime} ivee={ivee} idf={idf} cof={cof} />
      )}
      {sideTab === "resultados" && sesion && cliente && (
        <TabResultados
          ime={ime} ivee={ivee} idf={idf} cof={cof}
          dimScores={dimScores}
          sesionId={sesion.id}
          cliente={cliente}
          iniciativasIA={(analisis as Record<string, unknown> as { _iniciativas?: { items: IniciativaIA[]; fecha: string } })?._iniciativas?.items ?? []}
          iniciativasFecha={(analisis as Record<string, unknown> as { _iniciativas?: { items: IniciativaIA[]; fecha: string } })?._iniciativas?.fecha ?? null}
          onIniciativas={(items: IniciativaIA[]) => {
            setAnalisis((prev) => ({ ...prev, _iniciativas: { items, fecha: new Date().toISOString() } } as unknown as AnalisisMap));
            setTimeout(() => void guardar(true), 100);
          }}
          accessToken={session?.access_token ?? null}
        />
      )}
      {sideTab === "ia" && sesion && cliente && (
        <TabAnalisisIA
          cliente={cliente}
          ime={ime} ivee={ivee} idf={idf} cof={cof}
          dimScores={dimScores}
          financiero={{ ...financiero, ...calcFin }}
          analisis={analisis}
          setAnalisis={setAnalisis}
          onSave={() => void guardar(true)}
          accessToken={session?.access_token ?? null}
          puedeVerInterpretacion={puedeVerInterpretacion}
        />
      )}
      {sideTab === "historial" && (
        <TabHistorial
          clientes={clientes}
          onAbrir={abrirSesion}
          onNuevaSesion={() => setSideTab("side")}
          fixedClienteId={fixedClienteId}
          esCliente={esCliente}
        />
      )}
    </div>
  );
}

// ── Premium gate components ──────────────────────────────────────────────────
function PremiumGateInline() {
  return (
    <div style={{ borderRadius: 16, border: "1.5px dashed #CBD5E1", background: "linear-gradient(135deg,#F8FAFC,#F0F4FF)", padding: "24px 28px", textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0C4A6E", marginBottom: 6 }}>
        Análisis desbloqueado con Advisory Premium
      </div>
      <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
        Desbloquea el análisis con IA y las recomendaciones de tu consultor con el acompañamiento Advisory Premium de A360SGP.
      </div>
    </div>
  );
}

function PremiumGateIA() {
  return (
    <div style={{ padding: "64px 48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F5F7FF" }}>
      <div style={{ background: "white", borderRadius: 24, border: "1.5px solid #E0E7FF", padding: "48px 56px", textAlign: "center", maxWidth: 560 }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🔒</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0C4A6E", marginBottom: 14, letterSpacing: "-0.02em" }}>
          Análisis estratégico con IA
        </div>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.85, marginBottom: 28, textAlign: "justify" }}>
          Desbloquea el análisis con IA y las recomendaciones de tu consultor con el acompañamiento <strong>Advisory Premium de A360SGP</strong>.
        </p>
        <div style={{ background: "linear-gradient(135deg,#EFF6FF,#ECFDF5)", border: "1.5px solid #A7F3D0", borderRadius: 14, padding: "18px 24px", fontSize: 14, color: "#0C4A6E", fontWeight: 600 }}>
          Habla con tu consultor para activar este módulo.
        </div>
      </div>
    </div>
  );
}

// ── SidePage (route wrapper) ─────────────────────────────────────────────────
function SidePage() {
  const { sesion: sesionIdParam } = Route.useSearch();
  return <SideCore mode="consultor" sesionIdParam={sesionIdParam} />;
}

// ── Tab SIDE ────────────────────────────────────────────────────────────────
function TabSide({
  sesion, cliente, clientes, setClientes, ime, ivee, idf, cof,
  dimScores, progresoPct, respondidas, role, user, esCliente, fixedClienteId,
  onIniciar, onGoTab,
}: {
  sesion: Sesion | null;
  cliente: Cliente | null;
  clientes: Cliente[];
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  ime: number; ivee: number; idf: number; cof: number;
  dimScores: { key: string; nombre: string; score: number }[];
  progresoPct: number;
  respondidas: number;
  role: string | null;
  user: { id: string } | null;
  esCliente: boolean;
  fixedClienteId?: string;
  onIniciar: (s: Sesion) => void;
  onGoTab: (tab: SideTabKey) => void;
}) {
  const [clienteId, setClienteId] = useState("");
  const [nombreSesion, setNombreSesion] = useState("");
  const [creando, setCreando] = useState(false);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [showForm, setShowForm] = useState(!sesion);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre_empresa: "", sector: "", tamano: "", pais: "Ecuador", ciudad: "" });

  useEffect(() => { if (sesion) setShowForm(false); }, [sesion]);

  const crearCliente = async () => {
    if (!nuevoCliente.nombre_empresa.trim()) { toast.error("Nombre requerido"); return; }
    const insert = { ...nuevoCliente, consultor_id: (role === "consultor" || role === "admin") ? user!.id : null };
    const { data, error } = await supabase.from("clientes").insert(insert).select().single();
    if (error) { toast.error(error.message); return; }
    setClientes((prev) => [...prev, data as Cliente]);
    setClienteId(data.id);
    setNuevoOpen(false);
    toast.success("Cliente creado");
  };

  const iniciar = async () => {
    const cid = esCliente ? fixedClienteId! : clienteId;
    if (!cid) { toast.error("Selecciona un cliente"); return; }
    setCreando(true);
    const { data, error } = await supabase.from("side_sesiones").insert({
      cliente_id: cid,
      consultor_id: (!esCliente && (role === "consultor" || role === "admin")) ? user!.id : null,
      nombre_sesion: nombreSesion || `Diagnóstico ${new Date().toLocaleDateString("es-EC")}`,
      scores: {}, analisis_ia: {},
    }).select().single();
    setCreando(false);
    if (error) { toast.error(error.message); return; }
    onIniciar(data as unknown as Sesion);
  };

  const fmtScore5 = (s: number) => s > 0 ? `${s.toFixed(1)}/5` : "—";
  const fmtPctScore = (s: number) => s > 0 ? `${Math.round(s * 20)}%` : "";

  const INDICE_CARDS = [
    { label: "IME · Madurez", val: fmtScore5(ime), sub2: fmtPctScore(ime), name: "Madurez Empresarial", sub: "12 dimensiones · 180 preguntas", gradient: "linear-gradient(135deg,#0C4A6E,#1E3A8A)" },
    { label: "IVEE · Viabilidad", val: fmtScore5(ivee), sub2: fmtPctScore(ivee), name: "Viabilidad y Escalabilidad", sub: "16 preguntas estratégicas", gradient: "linear-gradient(135deg,#065F46,#059669)" },
    { label: "IDF · Dependencia", val: fmtScore5(idf), sub2: fmtPctScore(idf), name: "Dependencia del Fundador", sub: "12 preguntas · Inverso", gradient: "linear-gradient(135deg,#92580E,#BA7517)" },
    { label: "COF · Coherencia", val: fmtScore5(cof), sub2: fmtPctScore(cof), name: "Coherencia Organizacional", sub: "12 preguntas de alineación", gradient: "linear-gradient(135deg,#312E81,#6366F1)" },
  ];

  return (
    <div>
      <Hero
        gradient="linear-gradient(135deg, #065F46 0%, #0C4A6E 50%, #1E3A8A 100%)"
        watermark="SIDE"
        eyebrow="Suite · Sistema Integral de Diagnóstico Empresarial"
        title="Radiografía completa de tu"
        titleHighlight="empresa en 220 preguntas"
        desc="El SIDE es el diagnóstico más completo y preciso para identificar el estado real de una organización. Mide 12 dimensiones críticas, 4 índices estratégicos y genera un análisis financiero del potencial de transformación."
        stats={[
          { val: "12", lbl: "Dimensiones del negocio" },
          { val: "180", lbl: "Preguntas IME" },
          { val: "4", lbl: "Índices estratégicos" },
          { val: "5", lbl: "Análisis con IA" },
        ]}
      >
        <>
          {!sesion && !esCliente && (
            <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 14, padding: "24px 28px", marginBottom: 24, maxWidth: 560 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                Configurar diagnóstico
              </div>

              <div style={{ marginBottom: 14 }}>
                <Label style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: 6 }}>Cliente</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <Select value={clienteId} onValueChange={setClienteId}>
                    <SelectTrigger style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}{c.ciudad ? ` · ${c.ciudad}` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button onClick={() => setNuevoOpen(!nuevoOpen)} style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <Plus style={{ width: 16, height: 16, color: "white" }} />
                  </button>
                </div>
              </div>

              {nuevoOpen && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: 14, background: "rgba(0,0,0,0.2)", borderRadius: 10, marginBottom: 14, border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ gridColumn: "1/-1" }}>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Empresa *</Label>
                    <Input value={nuevoCliente.nombre_empresa} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre_empresa: e.target.value })} style={{ marginTop: 4 }} />
                  </div>
                  <div>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Sector</Label>
                    <Input value={nuevoCliente.sector} onChange={(e) => setNuevoCliente({ ...nuevoCliente, sector: e.target.value })} style={{ marginTop: 4 }} />
                  </div>
                  <div>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Tamaño</Label>
                    <Input value={nuevoCliente.tamano} onChange={(e) => setNuevoCliente({ ...nuevoCliente, tamano: e.target.value })} placeholder="ej: 45 empleados" style={{ marginTop: 4 }} />
                  </div>
                  <div>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>País</Label>
                    <Input value={nuevoCliente.pais} onChange={(e) => setNuevoCliente({ ...nuevoCliente, pais: e.target.value })} style={{ marginTop: 4 }} />
                  </div>
                  <div>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Ciudad</Label>
                    <Input value={nuevoCliente.ciudad} onChange={(e) => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value })} style={{ marginTop: 4 }} />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <button onClick={crearCliente} style={{ padding: "8px 20px", borderRadius: 8, background: "linear-gradient(135deg,#0C4A6E,#1E3A8A)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>
                      Crear cliente
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <Label style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: 6 }}>Nombre de la sesión</Label>
                <Input
                  value={nombreSesion}
                  onChange={(e) => setNombreSesion(e.target.value)}
                  placeholder={`Diagnóstico ${new Date().toLocaleDateString("es-EC")}`}
                />
              </div>

              <button
                onClick={iniciar}
                disabled={creando || !clienteId}
                style={{
                  width: "100%", padding: "13px 28px", borderRadius: 10,
                  background: (creando || !clienteId) ? "rgba(255,255,255,0.15)" : "linear-gradient(135deg,#0EA5E9,#6366F1)",
                  color: "white", fontSize: 15, fontWeight: 700, border: "none",
                  cursor: (creando || !clienteId) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: (creando || !clienteId) ? "none" : "0 4px 20px rgba(14,165,233,0.35)",
                }}
              >
                {creando && <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />}
                Iniciar diagnóstico SIDE →
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button
              onClick={() => onGoTab("historial")}
              style={{ padding: "14px 24px", borderRadius: 10, background: esCliente ? "linear-gradient(135deg,#0EA5E9,#6366F1)" : "rgba(255,255,255,0.1)", color: "white", fontSize: 15, fontWeight: 600, border: esCliente ? "none" : "1.5px solid rgba(255,255,255,0.3)", cursor: "pointer", boxShadow: esCliente ? "0 4px 20px rgba(14,165,233,0.35)" : "none" }}
            >
              {esCliente ? "📋 Mis diagnósticos" : "📋 Ver historial"}
            </button>
            {esCliente && (
              <button
                onClick={() => setShowForm((v) => !v)}
                style={{ padding: "14px 24px", borderRadius: 10, background: "rgba(255,255,255,0.1)", color: "white", fontSize: 15, fontWeight: 600, border: "1.5px solid rgba(255,255,255,0.3)", cursor: "pointer" }}
              >
                + Nuevo diagnóstico
              </button>
            )}
          </div>
        </>
      </Hero>

      {/* Session active banner */}
      {sesion && cliente && (
        <div style={{ background: "linear-gradient(90deg,#0C4A6E,#1E3A8A)", padding: "16px 64px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Sesión activa</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>{sesion.nombre_sesion}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{cliente.nombre_empresa} · {progresoPct}% completado</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => onGoTab("dimensiones")} style={{ padding: "8px 18px", borderRadius: 9, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Continuar cuestionario →
            </button>
          </div>
        </div>
      )}

      {/* New session form — solo cliente (consultor usa el form inline en el hero) */}
      {esCliente && showForm && (
        <div style={{ ...S.sectionWhite, borderBottom: "1px solid #E0E7FF" }}>
          <div style={{ maxWidth: 600 }}>
            <div style={S.secLabel}>Nueva sesión de diagnóstico</div>
            <div style={{ ...S.secTitle, fontSize: 24, marginBottom: 24 }}>Configurar diagnóstico</div>

            {!esCliente && (
              <div style={{ marginBottom: 16 }}>
                <Label style={{ fontSize: 14, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Cliente</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <Select value={clienteId} onValueChange={setClienteId}>
                    <SelectTrigger style={{ flex: 1 }}><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}{c.ciudad ? ` · ${c.ciudad}` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button onClick={() => setNuevoOpen(!nuevoOpen)} style={{ padding: "8px 14px", borderRadius: 8, background: "white", border: "1.5px solid #E0E7FF", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <Plus style={{ width: 16, height: 16, color: "#64748B" }} />
                  </button>
                </div>
              </div>
            )}

            {nuevoOpen && !esCliente && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 16, background: "#F5F7FF", borderRadius: 12, marginBottom: 16, border: "1px solid #E0E7FF" }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <Label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Empresa *</Label>
                  <Input value={nuevoCliente.nombre_empresa} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre_empresa: e.target.value })} style={{ marginTop: 4 }} />
                </div>
                <div>
                  <Label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Sector</Label>
                  <Input value={nuevoCliente.sector} onChange={(e) => setNuevoCliente({ ...nuevoCliente, sector: e.target.value })} style={{ marginTop: 4 }} />
                </div>
                <div>
                  <Label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Tamaño</Label>
                  <Input value={nuevoCliente.tamano} onChange={(e) => setNuevoCliente({ ...nuevoCliente, tamano: e.target.value })} placeholder="ej: 45 empleados" style={{ marginTop: 4 }} />
                </div>
                <div>
                  <Label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>País</Label>
                  <Input value={nuevoCliente.pais} onChange={(e) => setNuevoCliente({ ...nuevoCliente, pais: e.target.value })} style={{ marginTop: 4 }} />
                </div>
                <div>
                  <Label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Ciudad</Label>
                  <Input value={nuevoCliente.ciudad} onChange={(e) => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value })} style={{ marginTop: 4 }} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <button onClick={crearCliente} style={{ padding: "8px 20px", borderRadius: 8, background: "linear-gradient(135deg,#0C4A6E,#1E3A8A)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>
                    Crear cliente
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <Label style={{ fontSize: 14, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Nombre de la sesión</Label>
              <Input
                value={nombreSesion}
                onChange={(e) => setNombreSesion(e.target.value)}
                placeholder={`Diagnóstico ${new Date().toLocaleDateString("es-EC")}`}
              />
            </div>

            <button
              onClick={iniciar}
              disabled={creando || (!esCliente && !clienteId)}
              style={{
                width: "100%", padding: "14px 28px", borderRadius: 10,
                background: (creando || (!esCliente && !clienteId)) ? "#CBD5E1" : "linear-gradient(135deg,#0EA5E9,#6366F1)",
                color: "white", fontSize: 16, fontWeight: 700, border: "none",
                cursor: (creando || (!esCliente && !clienteId)) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: (creando || (!esCliente && !clienteId)) ? "none" : "0 4px 20px rgba(14,165,233,0.3)",
              }}
            >
              {creando && <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />}
              Iniciar diagnóstico SIDE →
            </button>
          </div>
        </div>
      )}

      {/* Insight card */}
      <div style={S.sectionWhite}>
        <div style={{ background: "linear-gradient(135deg,#EFF6FF,#ECFDF5)", border: "1.5px solid #A7F3D0", borderRadius: 16, padding: "28px 32px", display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 48 }}>
          <div style={{ fontSize: 36, flexShrink: 0 }}>🔬</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0C4A6E", marginBottom: 10 }}>¿Qué mide el SIDE?</div>
            <div style={{ fontSize: 16, color: "#334155", lineHeight: 1.85, textAlign: "justify" }}>
              El Sistema Integral de Diagnóstico Empresarial evalúa cuatro grandes dimensiones: el <strong>IME</strong> (Índice de Madurez Empresarial) a través de 12 áreas del negocio, el <strong>IVEE</strong> (Viabilidad y Escalabilidad), el <strong>IDF</strong> (Dependencia del Fundador) y el <strong>COF</strong> (Coherencia Organizacional). Juntos ofrecen una radiografía precisa del estado actual y el potencial de transformación de la empresa.
            </div>
          </div>
        </div>

        {/* 4 Index cards */}
        <div style={S.secLabel}>Los 4 índices estratégicos</div>
        <div style={{ ...S.secTitle }}>Una visión <span style={{ background: "linear-gradient(135deg,#0EA5E9,#059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>360° de la empresa</span></div>
        <p style={S.secSub}>Cada índice mide una dimensión crítica diferente del negocio. Juntos revelan no solo dónde está la empresa hoy, sino cuánto potencial de crecimiento está sin explotar.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 56 }}>
          {INDICE_CARDS.map((c) => (
            <div key={c.label} style={{ borderRadius: 20, padding: 28, position: "relative", overflow: "hidden", background: c.gradient, cursor: sesion ? "pointer" : "default" }}
              onClick={() => sesion && onGoTab("resultados")}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(255,255,255,0.08), transparent)" }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, position: "relative", zIndex: 2 }}>{c.label}</div>
              <div style={{ position: "relative", zIndex: 2, marginBottom: 6, display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>{c.val}</span>
                {c.sub2 && <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{c.sub2}</span>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.8)", position: "relative", zIndex: 2, marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", position: "relative", zIndex: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* 12 Dim grid */}
        <div style={S.secLabel}>Las 12 dimensiones del IME</div>
        <div style={{ ...S.secTitle }}>Radiografía completa de <span style={{ background: "linear-gradient(135deg,#0EA5E9,#059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>cada área del negocio</span></div>
        <p style={S.secSub}>El IME evalúa 12 dimensiones críticas con 15 preguntas cada una. Cada dimensión revela el nivel de madurez de esa área y genera recomendaciones específicas de mejora.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {DIMENSIONES.map((d) => {
            const ds = dimScores.find((x) => x.key === d.key)!;
            const meta = DIM_META[d.key] ?? { emoji: "📋", desc: "" };
            const scoreRaw = ds.score;
            const pctBar = scoreRaw > 0 ? Math.round(scoreRaw * 20) : 0;
            const nivel = interpretarIME(scoreRaw);
            return (
              <div
                key={d.key}
                onClick={() => sesion && onGoTab("dimensiones")}
                style={{ background: "white", borderRadius: 18, border: "1px solid #E0E7FF", padding: 24, position: "relative", overflow: "hidden", cursor: sesion ? "pointer" : "default", transition: "all 0.25s" }}
              >
                <div style={{ position: "absolute", right: 10, bottom: -10, fontSize: 72, fontWeight: 900, color: "#EEF2FF", lineHeight: 1 }}>{d.key}</div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{meta.emoji}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0C4A6E" }}>{d.nombre}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: scoreRaw > 0 ? nivel.color : "#E2E8F0" }}>
                      {scoreRaw > 0 ? scoreRaw.toFixed(1) : "—"}
                    </div>
                    {scoreRaw > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8" }}>/5 · {pctBar}%</div>}
                  </div>
                </div>
                <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.75, textAlign: "justify", marginBottom: 14 }}>{meta.desc}</div>
                <div style={{ height: 8, background: "#F0F4FF", borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ height: "100%", width: `${pctBar}%`, borderRadius: 999, background: "linear-gradient(90deg,#0EA5E9,#6366F1)", transition: "width 1s ease" }} />
                </div>
                {scoreRaw > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: nivel.bg, color: nivel.color }}>
                    {nivel.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab Dimensiones ─────────────────────────────────────────────────────────
function TabDimensiones({
  dimensiones, scores, setScore, dimScores, respondidas, progresoPct, readOnly, puedeVerInterpretacion,
}: {
  dimensiones: Dimension[];
  scores: ScoreMap;
  setScore: (id: string, v: number) => void;
  dimScores: { key: string; nombre: string; score: number }[];
  respondidas: number;
  progresoPct: number;
  readOnly?: boolean;
  puedeVerInterpretacion?: boolean;
}) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setOpenKeys((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const totalIME = dimensiones.reduce((a, d) => a + d.preguntas.length, 0);

  return (
    <div>
      <Hero
        gradient="linear-gradient(135deg,#0C4A6E,#1E3A8A,#312E81)"
        watermark="IME"
        eyebrow="SIDE · Índice de Madurez Empresarial"
        title="12 dimensiones ·"
        titleHighlight="180 preguntas"
        desc="Evalúa cada dimensión con total honestidad usando la escala del 1 al 5. Las respuestas determinan el IME — el indicador más preciso del estado de madurez de tu empresa."
      />
      <div style={S.sectionWhite}>
        {/* Progress bar */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #E0E7FF", padding: "24px 28px", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0C4A6E" }}>Progreso del cuestionario IME</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0EA5E9" }}>{progresoPct}%</div>
          </div>
          <div style={{ height: 12, background: "#F0F4FF", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progresoPct}%`, background: "linear-gradient(90deg,#0EA5E9,#059669)", borderRadius: 999, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#94A3B8" }}>
            <span>0 respondidas</span>
            <span>{respondidas} / {totalIME} preguntas</span>
            <span>{totalIME} total</span>
          </div>
        </div>

        {/* Accordion */}
        {dimensiones.map((d) => {
          const ds = dimScores.find((x) => x.key === d.key)!;
          const meta = DIM_META[d.key] ?? { emoji: "📋", desc: "" };
          const open = openKeys.has(d.key);
          const answered = d.preguntas.filter((p) => (scores[p.id] ?? 0) > 0).length;
          const suma = d.preguntas.reduce((a, p) => a + (scores[p.id] ?? 0), 0);
          const sumaMax = d.preguntas.length * 5;
          const pct = answered / d.preguntas.length;

          return (
            <div key={d.key} style={{ background: "white", borderRadius: 18, border: "1px solid #E0E7FF", marginBottom: 16, overflow: "hidden" }}>
              <div
                onClick={() => toggle(d.key)}
                style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
              >
                <div style={{ fontSize: 28, flexShrink: 0 }}>{meta.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0C4A6E", marginBottom: 4 }}>{d.key} — {d.nombre}</div>
                  <div style={{ fontSize: 14, color: "#64748B" }}>{meta.desc}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: ds.score > 0 ? "#0EA5E9" : "#CBD5E1" }}>
                      {ds.score > 0 ? `${ds.score.toFixed(1)}/5` : "—"}
                    </div>
                    {ds.score > 0 && (
                      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
                        {suma}/{sumaMax} · {Math.round(ds.score * 20)}%
                      </div>
                    )}
                  </div>
                  <div style={{ width: 72, height: 8, background: "#F0F4FF", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct * 100}%`, background: "linear-gradient(90deg,#0EA5E9,#6366F1)", borderRadius: 999 }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>{answered}/{d.preguntas.length}</div>
                </div>
                <div style={{ fontSize: 18, color: "#94A3B8", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <ChevronDown style={{ width: 20, height: 20 }} />
                </div>
              </div>
              {open && (
                <div style={{ borderTop: "1px solid #F0F4FF" }}>
                  <div style={{ padding: "16px 24px 8px" }}>
                    {d.preguntas.map((p) => (
                      <ScaleButtons key={p.id} id={p.id} texto={p.texto} value={scores[p.id]} onChange={(v) => setScore(p.id, v)} readOnly={readOnly} />
                    ))}
                  </div>
                  <div style={{ margin: "0 24px 24px" }}>
                    {(puedeVerInterpretacion ?? true) ? (
                      <>
                        <DimInterpretacionCard dimKey={d.key} score={ds.score} suma={suma} sumaMax={sumaMax} />
                        {ds.score === 0 && (
                          <div style={{ padding: "16px 20px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 14, color: "#94A3B8", textAlign: "center" }}>
                            Responde las preguntas de esta dimensión para ver la interpretación y recomendaciones personalizadas.
                          </div>
                        )}
                      </>
                    ) : (
                      <PremiumGateInline />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab Índices ─────────────────────────────────────────────────────────────
function TabIndices({
  scores, setScore, ivee, idf, cof, readOnly, puedeVerInterpretacion,
}: {
  scores: ScoreMap;
  setScore: (id: string, v: number) => void;
  ivee: number; idf: number; cof: number;
  readOnly?: boolean;
  puedeVerInterpretacion?: boolean;
}) {
  const blocks = [
    {
      id: "ivee", label: "IVEE", title: "Índice de Viabilidad y Escalabilidad Empresarial",
      sub: "16 preguntas · Mide la capacidad real de la empresa para crecer y escalar sin depender del fundador ni del contexto actual",
      score: ivee, color: "#059669", gradient: "linear-gradient(135deg,#065F46,#059669)",
      preguntas: IVEE_PREGUNTAS, accentGradient: "linear-gradient(135deg,#065F46,#059669)",
    },
    {
      id: "idf", label: "IDF", title: "Índice de Dependencia del Fundador",
      sub: "12 preguntas · Escala 1-5 · Mayor puntaje = mayor dependencia (inverso)",
      score: idf, color: "#DC2626", gradient: "linear-gradient(135deg,#7F1D1D,#DC2626)",
      preguntas: IDF_PREGUNTAS, accentGradient: "linear-gradient(135deg,#7F1D1D,#DC2626)",
    },
    {
      id: "cof", label: "COF", title: "Índice de Coherencia Organizacional",
      sub: "12 preguntas · Mide la alineación interna de la organización",
      score: cof, color: "#0EA5E9", gradient: "linear-gradient(135deg,#0C4A6E,#1E3A8A)",
      preguntas: COF_PREGUNTAS, accentGradient: "linear-gradient(135deg,#0C4A6E,#0EA5E9)",
    },
  ];

  return (
    <div>
      <Hero
        gradient="linear-gradient(135deg,#065F46,#0C4A6E,#312E81)"
        watermark="IDX"
        eyebrow="SIDE · Índices estratégicos complementarios"
        title="IVEE · IDF ·"
        titleHighlight="COF"
        desc="Los tres índices complementarios del SIDE revelan dimensiones críticas que el IME no captura: la viabilidad para escalar, el nivel de dependencia del fundador y la coherencia interna de la organización."
      />
      <div style={S.sectionWhite}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {blocks.map((b) => {
            const scoreAvg5 = b.score > 0 ? b.score.toFixed(1) : "—";
            const scorePct = b.score > 0 ? Math.round(b.score * 20) : 0;
            const totalPreg = b.preguntas.length;
            const answeredCount = b.preguntas.filter((p: { id: string }) => (scores[p.id] ?? 0) > 0).length;
            const sem = b.id === "idf" ? semaforoIDF(b.score) : semaforo(b.score);
            return (
              <div key={b.id} style={{ background: "white", borderRadius: 20, border: "1px solid #E0E7FF", padding: 36 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #F0F4FF" }}>
                  <div style={{ minWidth: 80, borderRadius: 14, background: b.gradient, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 14px", flexShrink: 0, textAlign: "center" }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "white", lineHeight: 1 }}>{scoreAvg5}/5</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{answeredCount}/{totalPreg}{scorePct > 0 ? ` · ${scorePct}%` : ""}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0C4A6E" }}>{b.label} — {b.title}</div>
                    <div style={{ fontSize: 15, color: "#64748B", marginTop: 3 }}>{b.sub}</div>
                  </div>
                  {b.score > 0 && (
                    <span style={{ padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 800, color: sem.color, background: sem.bg, border: `1.5px solid ${sem.border}`, flexShrink: 0 }}>
                      {sem.emoji} {sem.label}
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 0 }}>
                  {b.preguntas.map((p) => (
                    <ScaleButtons key={p.id} id={p.id} texto={p.texto} value={scores[p.id]} onChange={(v) => setScore(p.id, v)} accentGradient={b.accentGradient} readOnly={readOnly} />
                  ))}
                </div>
                {(puedeVerInterpretacion ?? true) ? (
                  <>
                    <IndiceInterpretacionCard indiceId={b.id as "ivee" | "idf" | "cof"} score={b.score} />
                    {b.score === 0 && (
                      <div style={{ marginTop: 16, padding: "14px 18px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 14, color: "#94A3B8", textAlign: "center" }}>
                        Responde las preguntas para ver la interpretación de {b.label}.
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ marginTop: 24 }}><PremiumGateInline /></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab Financiero ──────────────────────────────────────────────────────────
const SECTOR_CFG: Array<{ value: string; label: string; eMin: number; eMax: number }> = [
  { value: "manufactura",  label: "Manufactura",                           eMin: 4.0, eMax: 6.5  },
  { value: "retail",       label: "Retail / Comercio",                     eMin: 3.5, eMax: 6.0  },
  { value: "servicios",    label: "Servicios profesionales / Consultoría", eMin: 4.5, eMax: 7.5  },
  { value: "salud",        label: "Salud",                                 eMin: 5.0, eMax: 8.5  },
  { value: "tecnologia",   label: "Tecnología",                            eMin: 5.5, eMax: 10.0 },
  { value: "construccion", label: "Construcción",                          eMin: 3.0, eMax: 5.5  },
  { value: "alimentos",    label: "Alimentos y bebidas",                   eMin: 4.0, eMax: 7.0  },
  { value: "educacion",    label: "Educación",                             eMin: 4.5, eMax: 7.0  },
  { value: "otro",         label: "Otro",                                  eMin: 3.5, eMax: 6.0  },
];

function TabFinanciero({
  financiero, setFinanciero, ime, ivee, idf, cof,
}: {
  financiero: DatosFinancieros;
  setFinanciero: (d: DatosFinancieros) => void;
  ime: number; ivee: number; idf: number; cof: number;
}) {
  const [ebitdaMode, setEbitdaMode] = useState<"pct" | "usd">("pct");
  const upd = (patch: Partial<DatosFinancieros>) => setFinanciero({ ...financiero, ...patch });
  const fmt = (n: number) => n > 0 ? `$${Math.round(n).toLocaleString("en-US")}` : "—";
  const fmtX = (n: number) => `${n.toFixed(2)}x`;

  const sc = SECTOR_CFG.find(s => s.value === financiero.sector) ?? { value: "otro", label: "Otro", eMin: 3.5, eMax: 6.0 };
  const sectorBase = (sc.eMin + sc.eMax) / 2;
  const baseMultiple = financiero.multiplo_base_manual ?? sectorBase;

  const ingresos = financiero.ingresos ?? financiero.ingresos_anuales ?? 0;
  const ebitdaBase = ebitdaMode === "usd"
    ? (financiero.ebitda ?? 0)
    : ingresos * ((financiero.margen_ebitda ?? 0) / 100);

  // Adjustments from SIDE scores
  interface Ajuste { factor: string; score: string; impacto: number; positivo: boolean; }
  const ajustes: Ajuste[] = [];

  if (idf > 0) {
    const s = `${idf.toFixed(1)}/5 · ${Math.round(idf * 20)}%`;
    if (idf > 3.5)      ajustes.push({ factor: "Dependencia del fundador (IDF)", score: s, impacto: -1.0, positivo: false });
    else if (idf > 2.5) ajustes.push({ factor: "Dependencia del fundador (IDF)", score: s, impacto: -0.5, positivo: false });
    else                ajustes.push({ factor: "Dependencia del fundador (IDF)", score: s, impacto: 0.3,  positivo: true  });
  }
  if (ivee > 0) {
    const s = `${ivee.toFixed(1)}/5 · ${Math.round(ivee * 20)}%`;
    if (ivee > 3.5)      ajustes.push({ factor: "Escalabilidad (IVEE)", score: s, impacto: 0.8,  positivo: true  });
    else if (ivee > 3.0) ajustes.push({ factor: "Escalabilidad (IVEE)", score: s, impacto: 0.2,  positivo: true  });
    else if (ivee > 2.0) ajustes.push({ factor: "Escalabilidad (IVEE)", score: s, impacto: -0.5, positivo: false });
    else                 ajustes.push({ factor: "Escalabilidad (IVEE)", score: s, impacto: -1.0, positivo: false });
  }
  if (ime > 0) {
    const s = `${ime.toFixed(1)}/5 · ${Math.round(ime * 20)}%`;
    if (ime > 3.75)      ajustes.push({ factor: "Madurez empresarial (IME)", score: s, impacto: 0.6,  positivo: true  });
    else if (ime > 3.0)  ajustes.push({ factor: "Madurez empresarial (IME)", score: s, impacto: 0.3,  positivo: true  });
    else                 ajustes.push({ factor: "Madurez empresarial (IME)", score: s, impacto: -0.3, positivo: false });
  }
  if (cof > 0) {
    const s = `${cof.toFixed(1)}/5 · ${Math.round(cof * 20)}%`;
    if (cof < 2.0)      ajustes.push({ factor: "Coherencia organizacional (COF)", score: s, impacto: -0.8, positivo: false });
    else if (cof < 3.0) ajustes.push({ factor: "Coherencia organizacional (COF)", score: s, impacto: -0.4, positivo: false });
    else if (cof < 3.5) ajustes.push({ factor: "Coherencia organizacional (COF)", score: s, impacto:  0.1, positivo: true  });
    else                ajustes.push({ factor: "Coherencia organizacional (COF)", score: s, impacto:  0.5, positivo: true  });
  }
  const recPct = financiero.ingresos_recurrentes_pct ?? 0;
  if (recPct > 80)      ajustes.push({ factor: "Ingresos recurrentes", score: `${recPct}%`, impacto: 1.0,  positivo: true  });
  else if (recPct > 50) ajustes.push({ factor: "Ingresos recurrentes", score: `${recPct}%`, impacto: 0.5,  positivo: true  });
  else if (recPct > 0)  ajustes.push({ factor: "Ingresos recurrentes", score: `${recPct}%`, impacto: -0.3, positivo: false });

  const totalAdj = ajustes.reduce((s, a) => s + a.impacto, 0);
  const multipleAdj = Math.max(0.5, baseMultiple + totalAdj);

  // Scenario 1 — Actual
  const valActual = ebitdaBase * multipleAdj;
  const valMin = ebitdaBase * sc.eMin;
  const valMax = ebitdaBase * sc.eMax;

  // Scenario 2 — Potential (mejoras SIDE)
  const mejoraEbitda = ime > 0 ? (ime < 3.0 ? 0.25 : ime < 3.75 ? 0.15 : 0.08) : 0.15;
  const idfBonus  = idf > 3.5 ? 0.8 : idf > 2.5 ? 0.4 : 0;
  const iveeBonus = ivee > 0 && ivee < 3.5 ? 0.5 : 0;
  const cofBonus  = cof > 0 && cof < 3.0 ? 0.4 : cof > 0 && cof < 3.5 ? 0.1 : 0;
  const ebitdaPot = ebitdaBase * (1 + mejoraEbitda);
  const multPot   = Math.min(sc.eMax, multipleAdj + idfBonus + iveeBonus + cofBonus);
  const valPot    = ebitdaPot * multPot;
  const gap       = valPot - valActual;
  const gapPct    = valActual > 0 ? Math.round((gap / valActual) * 100) : 0;

  // Scenario 3 — all 4 indices as table rows
  const tablaFactores = [
    {
      index: "IDF", nombre: "Dependencia del fundador",
      scoreLabel: idf > 0 ? `${idf.toFixed(1)}/5` : "—",
      sem: semaforoIDF(idf),
      nivel: idf > 3.5 ? "Crítica" : idf > 2.5 ? "Moderada" : idf > 0 ? "Baja" : "Sin datos",
      descuento: idf > 3.5 ? 1.0 : idf > 2.5 ? 0.5 : 0,
      costo: ebitdaBase > 0 ? (idf > 3.5 ? ebitdaBase * 1.0 : idf > 2.5 ? ebitdaBase * 0.5 : 0) : 0,
      tieneImpacto: idf > 2.5,
      isPending: idf === 0,
      mensaje: idf === 0 ? "Pendiente — complete el índice IDF"
             : idf > 3.5 ? "Dependencia crítica: el negocio no opera sin el fundador"
             : idf > 2.5 ? "Dependencia moderada: genera incertidumbre de continuidad"
             : "Baja dependencia: positivo para la valoración",
    },
    {
      index: "IME", nombre: "Madurez empresarial",
      scoreLabel: ime > 0 ? `${ime.toFixed(1)}/5` : "—",
      sem: semaforo(ime),
      nivel: ime > 3.75 ? "Avanzada" : ime > 3.0 ? "En desarrollo" : ime > 0 ? "Crítica" : "Sin datos",
      descuento: ime > 0 && ime < 3.0 ? 0.3 : ime > 0 && ime < 3.75 ? 0.15 : 0,
      costo: ebitdaBase > 0 ? (ime > 0 && ime < 3.0 ? ebitdaBase * 0.3 : ime > 0 && ime < 3.75 ? ebitdaBase * 0.15 : 0) : 0,
      tieneImpacto: ime > 0 && ime < 3.75,
      isPending: ime === 0,
      mensaje: ime === 0 ? "Pendiente — complete el diagnóstico SIDE"
             : ime > 0 && ime < 3.0 ? "Madurez crítica: alto riesgo operativo percibido por inversores"
             : ime > 0 && ime < 3.75 ? "En desarrollo: el comprador asume el costo de mejorarla"
             : "Madurez avanzada: sistemas sólidos reducen el riesgo",
    },
    {
      index: "IVEE", nombre: "Escalabilidad del modelo",
      scoreLabel: ivee > 0 ? `${ivee.toFixed(1)}/5` : "—",
      sem: semaforo(ivee),
      nivel: ivee > 3.5 ? "Alta" : ivee > 3.0 ? "Moderada-alta" : ivee > 2.0 ? "Baja" : ivee > 0 ? "Crítica" : "Sin datos",
      descuento: ivee > 0 && ivee < 2.0 ? 1.0 : ivee > 0 && ivee < 3.0 ? 0.5 : 0,
      // EBITDA × descuento × múltiplo_base — impacto real sobre valor de empresa
      costo: ebitdaBase > 0 ? (ivee > 0 && ivee < 2.0 ? ebitdaBase * 1.0 * baseMultiple : ivee > 0 && ivee < 3.0 ? ebitdaBase * 0.5 * baseMultiple : 0) : 0,
      tieneImpacto: ivee > 0 && ivee < 3.0,
      isPending: ivee === 0,
      mensaje: ivee === 0 ? "Pendiente — complete el índice IVEE para ver el impacto en valoración"
             : ivee > 0 && ivee < 2.0 ? "Escalabilidad crítica: el modelo colapsa al intentar crecer"
             : ivee > 0 && ivee < 3.0 ? "Baja escalabilidad: el modelo no puede crecer sin colapsar"
             : "Escalabilidad adecuada: el modelo soporta el crecimiento",
    },
    {
      index: "COF", nombre: "Coherencia organizacional",
      scoreLabel: cof > 0 ? `${cof.toFixed(1)}/5` : "—",
      sem: semaforo(cof),
      nivel: cof > 0 && cof < 2.0 ? "Crítica" : cof > 0 && cof < 3.0 ? "Baja" : cof > 0 && cof < 3.5 ? "Moderada" : cof > 0 ? "Alta" : "Sin datos",
      descuento: cof > 0 && cof < 2.0 ? 0.8 : cof > 0 && cof < 3.0 ? 0.4 : 0,
      // EBITDA × descuento × múltiplo_base — impacto real sobre valor de empresa
      costo: ebitdaBase > 0 ? (cof > 0 && cof < 2.0 ? ebitdaBase * 0.8 * baseMultiple : cof > 0 && cof < 3.0 ? ebitdaBase * 0.4 * baseMultiple : 0) : 0,
      tieneImpacto: cof > 0 && cof < 3.0,
      isPending: cof === 0,
      mensaje: cof === 0 ? "Pendiente — complete el índice COF"
             : cof > 0 && cof < 2.0 ? "Incoherencia crítica: riesgo sistémico que destruye valor"
             : cof > 0 && cof < 3.0 ? "Coherencia baja: fricciones que reducen la eficiencia y el valor percibido"
             : "Coherencia adecuada: la organización opera alineada",
    },
  ];
  const totalCosto  = tablaFactores.reduce((s, f) => s + f.costo, 0);
  const imeTarget   = ime < 3.0 ? 3.5 : ime < 3.75 ? 4.0 : 4.5;
  const imeGanancia = ebitdaBase * (ime < 3.0 ? 0.6 : ime < 3.75 ? 0.3 : 0);

  const hasData = ingresos > 0 && ebitdaBase > 0;

  // Style helpers
  const iWrap: React.CSSProperties = { display: "flex", alignItems: "center", border: "1.5px solid #E0E7FF", borderRadius: 10, overflow: "hidden", background: "white" };
  const iPfx: React.CSSProperties  = { padding: "11px 10px 11px 14px", background: "#F8FAFC", color: "#94A3B8", fontSize: 13, fontWeight: 600, borderRight: "1px solid #E0E7FF", flexShrink: 0 };
  const iSfx: React.CSSProperties  = { padding: "11px 14px 11px 8px", background: "#F8FAFC", color: "#94A3B8", fontSize: 13, fontWeight: 600, borderLeft: "1px solid #E0E7FF", flexShrink: 0 };
  const iBase: React.CSSProperties = { flex: 1, padding: "11px 14px", border: "none", outline: "none", fontSize: 15, fontFamily: "inherit", color: "#1E293B", background: "transparent", width: "100%" };
  const lbl = (t: string, sub?: string) => (
    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
      {t}{sub && <span style={{ fontWeight: 400, color: "#94A3B8" }}> {sub}</span>}
    </label>
  );
  const numFld = (k: keyof DatosFinancieros, label: string, ph: string, pfx?: string, sfx?: string, sub?: string) => (
    <div style={{ marginBottom: 16 }}>
      {lbl(label, sub)}
      <div style={iWrap}>
        {pfx && <span style={iPfx}>{pfx}</span>}
        <input type="number" placeholder={ph} value={(financiero[k] as number | undefined) ?? ""}
          onChange={(e) => upd({ [k]: e.target.value === "" ? undefined : Number(e.target.value) } as Partial<DatosFinancieros>)}
          style={iBase} />
        {sfx && <span style={iSfx}>{sfx}</span>}
      </div>
    </div>
  );

  return (
    <div>
      <Hero
        gradient="linear-gradient(135deg,#065F46,#0C4A6E)"
        watermark="$"
        eyebrow="SIDE · Impacto financiero del diagnóstico"
        title="¿Cuánto vale y cuánto pierde"
        titleHighlight="por la mala gestión?"
        desc="El módulo financiero traduce los resultados del SIDE a valoración empresarial: lo que su empresa vale hoy, lo que podría valer con mejoras, y el costo real — en dólares — de cada problema identificado en el diagnóstico."
        stats={[
          { val: hasData ? fmt(valActual) : "—", lbl: "Valoración actual estimada" },
          { val: hasData && gapPct > 0 ? `+${gapPct}%` : "—", lbl: "Gap de transformación SIDE" },
        ]}
      />
      <div style={S.sectionWhite}>

        {/* ── 5 campos de entrada ── */}
        <div style={S.secLabel}>Datos financieros</div>
        <div style={{ ...S.secTitle, marginBottom: 24 }}>Ingresa los <span style={{ background: "linear-gradient(135deg,#065F46,#0EA5E9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>datos base</span></div>

        <div style={{ background: "white", borderRadius: 18, border: "1px solid #E0E7FF", padding: 28, marginBottom: 36 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            {/* Column left */}
            <div>
              <div style={{ marginBottom: 16 }}>
                {lbl("Sector de la empresa")}
                <select value={financiero.sector ?? ""}
                  onChange={(e) => upd({ sector: e.target.value || undefined, multiplo_base_manual: undefined })}
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E0E7FF", borderRadius: 10, fontSize: 15, fontFamily: "inherit", outline: "none", color: financiero.sector ? "#1E293B" : "#94A3B8", background: "white", cursor: "pointer" }}>
                  <option value="">— Seleccionar sector —</option>
                  {SECTOR_CFG.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {financiero.sector && (
                <div style={{ marginBottom: 16 }}>
                  {lbl("Múltiplo base (ajustable)", "(EBITDA)")}
                  <div style={iWrap}>
                    <input type="number" placeholder={sectorBase.toFixed(1)} min="0.5" step="0.1"
                      value={financiero.multiplo_base_manual ?? ""}
                      onChange={(e) => upd({ multiplo_base_manual: e.target.value === "" ? undefined : Number(e.target.value) })}
                      style={iBase} />
                    <span style={iSfx}>x</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#0EA5E9", fontWeight: 600, marginTop: 5 }}>
                    El sistema sugiere <strong>{fmtX(sectorBase)}</strong> para el sector {sc.label}. Puedes ajustarlo según tu criterio.
                    {financiero.multiplo_base_manual !== undefined && (
                      <button onClick={() => upd({ multiplo_base_manual: undefined })}
                        style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 11, textDecoration: "underline", padding: 0 }}>
                        Restablecer
                      </button>
                    )}
                  </div>
                </div>
              )}
              {numFld("ingresos", "Ingresos anuales", "500,000", "$", undefined, "(USD)")}
              {/* EBITDA toggle */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>EBITDA</span>
                  <div style={{ display: "flex", background: "#F0F4FF", borderRadius: 8, padding: 3, gap: 2 }}>
                    {(["pct", "usd"] as const).map(m => (
                      <button key={m} onClick={() => setEbitdaMode(m)} style={{ padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: ebitdaMode === m ? "white" : "transparent", color: ebitdaMode === m ? "#0C4A6E" : "#94A3B8", boxShadow: ebitdaMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>
                        {m === "pct" ? "% Margen" : "USD directo"}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={iWrap}>
                  {ebitdaMode === "usd" && <span style={iPfx}>$</span>}
                  <input type="number" placeholder={ebitdaMode === "pct" ? "18" : "90,000"}
                    value={ebitdaMode === "pct" ? (financiero.margen_ebitda ?? "") : (financiero.ebitda ?? "")}
                    onChange={(e) => { const v = e.target.value === "" ? undefined : Number(e.target.value); upd(ebitdaMode === "pct" ? { margen_ebitda: v } : { ebitda: v }); }}
                    style={iBase} />
                  {ebitdaMode === "pct" && <span style={iSfx}>%</span>}
                </div>
                {ebitdaBase > 0 && ingresos > 0 && (
                  <div style={{ fontSize: 11, color: "#0EA5E9", fontWeight: 600, marginTop: 5 }}>
                    EBITDA: {fmt(ebitdaBase)} · {((ebitdaBase / ingresos) * 100).toFixed(1)}% de ingresos
                  </div>
                )}
              </div>
            </div>
            {/* Column right */}
            <div>
              {numFld("margen_bruto", "Margen bruto", "45", undefined, "%", "(%) — informativo")}
              {numFld("margen_neto", "Margen neto", "12", undefined, "%", "(%) — informativo")}
              {numFld("ingresos_recurrentes_pct", "% de ingresos recurrentes", "0–100", undefined, "%", "(contratos, suscripciones)")}
              {/* Sector hint */}
              {financiero.sector && (
                <div style={{ background: "linear-gradient(135deg,#EFF6FF,#F0FDF4)", borderRadius: 10, padding: "14px 16px", border: "1px solid #BFDBFE", marginTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#1E40AF", marginBottom: 4 }}>Múltiplos — {sc.label}</div>
                  <div style={{ fontSize: 13, color: "#1E3A8A", fontWeight: 600 }}>Rango sectorial: {fmtX(sc.eMin)}–{fmtX(sc.eMax)} EBITDA</div>
                  <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>Base: {fmtX(baseMultiple)} → Ajustado con SIDE: <strong style={{ color: "#0EA5E9" }}>{fmtX(multipleAdj)}</strong></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ajustes automáticos del SIDE al múltiplo */}
        {ajustes.length > 0 && (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E0E7FF", marginBottom: 36, overflow: "hidden" }}>
            <div style={{ padding: "14px 24px", background: "linear-gradient(135deg,#F0F9FF,#EFF6FF)", borderBottom: "1px solid #E0E7FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0C4A6E" }}>Ajustes automáticos al múltiplo</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Calculados con base en tu diagnóstico SIDE</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Múltiplo ajustado</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: multipleAdj >= baseMultiple ? "#059669" : "#DC2626" }}>{fmtX(multipleAdj)}</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>Base: {fmtX(baseMultiple)} ({totalAdj >= 0 ? "+" : ""}{totalAdj.toFixed(1)}x)</div>
              </div>
            </div>
            {ajustes.map((a, i) => (
              <div key={a.factor} style={{ display: "grid", gridTemplateColumns: "2.5fr 1.2fr 0.8fr", gap: 12, padding: "12px 24px", borderBottom: i < ajustes.length - 1 ? "1px solid #F8FAFC" : "none", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{a.factor}</div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>{a.score}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: a.positivo ? "#059669" : "#DC2626", background: a.positivo ? "#ECFDF5" : "#FEF2F2", padding: "3px 10px", borderRadius: 7, textAlign: "center", border: `1px solid ${a.positivo ? "#A7F3D0" : "#FECACA"}` }}>
                  {a.impacto > 0 ? "+" : ""}{a.impacto.toFixed(1)}x
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resultados */}
        {hasData ? (
          <>
            {/* ── SIDE index badges ── */}
            <div style={{ background: "linear-gradient(135deg,#F0F9FF,#EFF6FF)", borderRadius: 14, padding: "16px 20px", marginBottom: 32, border: "1px solid #BFDBFE" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                Resultados calculados automáticamente con base en tu diagnóstico SIDE
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {([
                  { lbl: "IME", score: ime, sem: semaforo(ime), sub: "Madurez empresarial" },
                  { lbl: "IDF", score: idf, sem: semaforoIDF(idf), sub: "Dep. del fundador" },
                  { lbl: "IVEE", score: ivee, sem: semaforo(ivee), sub: "Escalabilidad" },
                  { lbl: "COF", score: cof, sem: semaforo(cof), sub: "Coherencia" },
                ] as const).map(b => (
                  <div key={b.lbl} style={{ background: b.sem.bg, borderRadius: 10, padding: "12px 14px", border: `1.5px solid ${b.sem.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{b.lbl}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: b.score > 0 ? b.sem.color : "#CBD5E1" }}>{b.score > 0 ? `${b.score.toFixed(1)}/5` : "—"}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: b.sem.color, marginTop: 3 }}>{b.sem.emoji} {b.sem.label}</div>
                    <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{b.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Escenario 1 ── */}
            <div style={S.secLabel}>Escenario 1 — Sin cambios</div>
            <div style={{ background: "linear-gradient(135deg,#0C4A6E,#1E3A8A)", borderRadius: 20, padding: "36px 40px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 70% at 90% 10%, rgba(14,165,233,0.25), transparent)" }} />
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 50% at 10% 90%, rgba(99,102,241,0.15), transparent)" }} />
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Escenario actual — Estado presente sin cambios</div>
                    <div style={{ fontSize: 52, fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>{fmt(valActual)}</div>
                    <div style={{ fontSize: 14, color: "rgba(56,189,248,0.9)", marginTop: 12, fontWeight: 600 }}>Rango sectorial: {fmt(valMin)} — {fmt(valMax)}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 20px", textAlign: "center", flexShrink: 0, backdropFilter: "blur(8px)" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Múltiplo EBITDA</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "white" }}>{fmtX(multipleAdj)}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>ajustado con SIDE</div>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 5 }}>Desglose del cálculo</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                    EBITDA {fmt(ebitdaBase)} × {fmtX(multipleAdj)} = <span style={{ color: "white", fontWeight: 900 }}>{fmt(valActual)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Escenario 2 ── */}
            <div style={S.secLabel}>Escenario 2 — Con mejoras del SIDE implementadas</div>
            <div style={{ background: "linear-gradient(135deg,#065F46,#059669)", borderRadius: 20, padding: "36px 40px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 70% at 90% 10%, rgba(110,231,183,0.2), transparent)" }} />
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Escenario potencial — Con mejoras implementadas</div>
                    <div style={{ fontSize: 52, fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>{fmt(valPot)}</div>
                    <div style={{ fontSize: 15, color: "#6EE7B7", marginTop: 12, fontWeight: 800 }}>+{fmt(gap)} · +{gapPct}% sobre valoración actual</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 14, padding: "14px 20px", textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Múltiplo EBITDA</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#6EE7B7" }}>{fmtX(multPot)}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>con mejoras SIDE</div>
                  </div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.1)", borderRadius: 12, padding: "14px 18px", marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 5 }}>Desglose del cálculo</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                    EBITDA {fmt(ebitdaPot)} (+{Math.round(mejoraEbitda * 100)}%) × {fmtX(multPot)} = <span style={{ color: "white", fontWeight: 900 }}>{fmt(valPot)}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Mejoras del SIDE que generan este incremento</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      ...(idfBonus > 0 ? [`Reducir dependencia del fundador (IDF ${idf.toFixed(1)}/5): +${fmtX(idfBonus)} al múltiplo`] : []),
                      ...(iveeBonus > 0 ? [`Mejorar escalabilidad (IVEE ${ivee.toFixed(1)}/5 → >3.5): +${fmtX(iveeBonus)} al múltiplo`] : []),
                      ...(cofBonus > 0 ? [`Mejorar coherencia organizacional (COF ${cof.toFixed(1)}/5 → >3.5): +${fmtX(cofBonus)} al múltiplo`] : []),
                      `Incremento de EBITDA al cerrar brechas críticas de gestión (IME): +${Math.round(mejoraEbitda * 100)}%`,
                    ].map((m, mi) => (
                      <div key={mi} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px" }}>
                        <span style={{ color: "#6EE7B7", fontWeight: 900, flexShrink: 0, fontSize: 14 }}>→</span>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.45 }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Comparativo de 3 barras ── */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E0E7FF", padding: "24px 28px", marginBottom: 36 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0C4A6E", marginBottom: 20 }}>Comparativo de valoración</div>
              {([
                { lbl: "Valor mínimo sectorial", val: valMin, color: "#94A3B8", bg: "#F1F5F9", grad: "linear-gradient(90deg,#94A3B8,#CBD5E1)", diff: "" },
                { lbl: "Valoración actual", val: valActual, color: "#0C4A6E", bg: "#EFF6FF", grad: "linear-gradient(90deg,#0C4A6E,#0EA5E9)", diff: valMin > 0 ? `+${fmt(valActual - valMin)} vs mínimo sectorial` : "" },
                { lbl: "Valoración potencial (con mejoras)", val: valPot, color: "#059669", bg: "#ECFDF5", grad: "linear-gradient(90deg,#065F46,#059669)", diff: `+${fmt(gap)} (+${gapPct}%) vs actual` },
              ] as const).map(row => {
                const mx = Math.max(valPot, valMin, valActual, 1);
                return (
                  <div key={row.lbl} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 7 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{row.lbl}</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: row.color }}>{fmt(row.val)}</div>
                        {row.diff ? <div style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>{row.diff}</div> : null}
                      </div>
                    </div>
                    <div style={{ height: 16, background: row.bg, borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.round((row.val / mx) * 100)}%`, background: row.grad, borderRadius: 999, transition: "width 1s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Tabla costo mala gestión ── */}
            <div style={S.secLabel}>Escenario 3 — El costo de la mala gestión</div>
            <div style={{ ...S.secTitle, marginBottom: 24 }}>¿Cuánto le está <span style={{ background: "linear-gradient(135deg,#DC2626,#B45309)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>costando la mala gestión?</span></div>

            <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #FECACA", marginBottom: 16, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 0.65fr 1fr 0.9fr 1.2fr", gap: 8, padding: "12px 24px", background: "linear-gradient(135deg,#FEF2F2,#FFF7ED)", borderBottom: "1px solid #FECACA" }}>
                {["Factor", "Score", "Nivel", "Desc. múltiplo", "Costo USD"].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
                ))}
              </div>
              {tablaFactores.map((f, i) => (
                <div key={f.index} style={{ display: "grid", gridTemplateColumns: "2fr 0.65fr 1fr 0.9fr 1.2fr", gap: 8, padding: "14px 24px", borderBottom: i < tablaFactores.length - 1 ? "1px solid #FFF5F5" : "none", alignItems: "center", opacity: f.tieneImpacto ? 1 : 0.55 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0C4A6E" }}>{f.nombre}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, lineHeight: 1.4 }}>{f.mensaje}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: f.tieneImpacto ? f.sem.color : "#94A3B8" }}>{f.scoreLabel}</div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: f.sem.bg, color: f.sem.color, border: `1px solid ${f.sem.border}`, whiteSpace: "nowrap" }}>
                      {f.sem.emoji} {f.nivel}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: f.tieneImpacto ? "#DC2626" : "#94A3B8", textAlign: "center", background: f.tieneImpacto ? "#FEF2F2" : "#F8FAFC", padding: "3px 8px", borderRadius: 6, border: `1px solid ${f.tieneImpacto ? "#FECACA" : "#E2E8F0"}` }}>
                    {f.tieneImpacto ? `-${f.descuento.toFixed(1)}x` : "—"}
                  </div>
                  <div style={{ fontSize: f.tieneImpacto && ebitdaBase > 0 ? 16 : 13, fontWeight: 900, color: f.isPending ? "#D97706" : f.tieneImpacto && ebitdaBase > 0 ? "#DC2626" : "#94A3B8" }}>
                    {f.isPending
                      ? `Pendiente — complete el índice ${f.index}`
                      : f.tieneImpacto
                        ? (ebitdaBase > 0 ? `-${fmt(f.costo)}` : "—")
                        : "Sin costo"}
                  </div>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 0.65fr 1fr 0.9fr 1.2fr", gap: 8, padding: "16px 24px", background: "linear-gradient(135deg,#FEF2F2,#FFF0F0)", borderTop: "2px solid #FECACA", alignItems: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#991B1B", gridColumn: "1 / 5" }}>
                  {ebitdaBase > 0 ? <>Su empresa vale <strong>{fmt(totalCosto)}</strong> menos por estas brechas de gestión</> : "Ingresa el EBITDA para calcular el costo en USD"}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: ebitdaBase > 0 ? "#DC2626" : "#94A3B8" }}>
                  {ebitdaBase > 0 ? `-${fmt(totalCosto)}` : "—"}
                </div>
              </div>
            </div>

            {/* ── Card naranja de cierre con ROI ── */}
            <div style={{ background: "linear-gradient(135deg,#92400E,#B45309)", borderRadius: 20, padding: "28px 36px", marginBottom: 8, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 70% at 90% 10%, rgba(251,191,36,0.2), transparent)" }} />
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Retorno de invertir en transformación empresarial</div>
                <p style={{ fontSize: 17, fontWeight: 700, color: "white", lineHeight: 1.75, textAlign: "justify", margin: "0 0 16px" }}>
                  Invertir en transformar la gestión empresarial — mejorando los indicadores identificados en el SIDE — podría agregar hasta{" "}
                  <strong style={{ color: "#FCD34D" }}>{fmt(gap)}</strong> al valor de su empresa, representando un crecimiento de valor del{" "}
                  <strong style={{ color: "#FCD34D" }}>{gapPct}%</strong>.
                </p>
                {imeGanancia > 0 && (
                  <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 18px" }}>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, textAlign: "justify", margin: 0 }}>
                      Mejorar el IME de{" "}
                      <strong style={{ color: "#FCD34D" }}>{ime > 0 ? `${ime.toFixed(1)}/5` : "—"}</strong>{" "}
                      a <strong style={{ color: "#FCD34D" }}>{imeTarget.toFixed(1)}/5</strong> podría agregar hasta{" "}
                      <strong style={{ color: "#FCD34D" }}>{fmt(imeGanancia)}</strong> al valor de la empresa. Este no es un costo hipotético: es el descuento real que cualquier comprador, socio o inversor aplicaría hoy al valor de la empresa.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ background: "#F8FAFC", borderRadius: 16, border: "1px solid #E2E8F0", padding: "48px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>💼</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Ingresa los datos financieros para ver el análisis</div>
            <div style={{ fontSize: 14, color: "#94A3B8" }}>Selecciona el sector, ingresa los ingresos y el EBITDA. El sistema calculará automáticamente el impacto financiero de cada resultado del diagnóstico SIDE.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab Resultados ──────────────────────────────────────────────────────────
function TabResultados({
  ime, ivee, idf, cof, dimScores, sesionId, cliente,
  iniciativasIA, iniciativasFecha, onIniciativas, accessToken,
}: {
  ime: number; ivee: number; idf: number; cof: number;
  dimScores: { key: string; nombre: string; score: number; iniciativa: string }[];
  sesionId: string; cliente: Cliente;
  iniciativasIA: IniciativaIA[];
  iniciativasFecha: string | null;
  onIniciativas: (items: IniciativaIA[]) => void;
  accessToken: string | null;
}) {
  const [historial, setHistorial] = useState<Sesion[]>([]);
  const [compararConId, setCompararConId] = useState("");
  const [genIA, setGenIA] = useState(false);

  useEffect(() => {
    supabase.from("side_sesiones").select("*").eq("cliente_id", cliente.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setHistorial((data ?? []) as unknown as Sesion[]));
  }, [cliente.id]);

  const nivel = interpretarIME(ime);
  const fortalezas = [...dimScores].filter((d) => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  const brechas = [...dimScores].filter((d) => d.score > 0).sort((a, b) => a.score - b.score).slice(0, 3);
  const radarData = dimScores.map((d) => ({ dimension: d.nombre, score: Number(d.score.toFixed(2)) }));
  const compararCon = historial.find((h) => h.id === compararConId);
  const radarComparado = compararCon ? DIMENSIONES.map((d) => {
    const ids = d.preguntas.map((p) => p.id);
    return {
      dimension: d.nombre,
      actual: Number((dimScores.find((x) => x.key === d.key)?.score ?? 0).toFixed(2)),
      comparado: Number(promedio(ids, compararCon.scores).toFixed(2)),
    };
  }) : null;
  const evolucion = [...historial].filter((h) => h.ime_score).reverse().map((h) => ({
    fecha: new Date(h.created_at).toLocaleDateString("es-EC", { month: "short", day: "numeric" }),
    IME: Number(h.ime_score),
  }));

  const fmt5 = (s: number) => s > 0 ? `${s.toFixed(1)}/5` : "—";
  const fmtPct = (s: number) => s > 0 ? `${Math.round(s * 20)}%` : "—";

  return (
    <div>
      <Hero
        gradient="linear-gradient(135deg,#0C4A6E,#312E81)"
        watermark="IME"
        eyebrow="SIDE · Resultados del diagnóstico"
        title={`IME: ${fmt5(ime)} —`}
        titleHighlight={nivel.label}
        desc="El diagnóstico revela el estado actual de madurez empresarial. Los resultados identifican las fortalezas, brechas críticas y el potencial de transformación disponible."
        stats={[
          { val: fmt5(ime), lbl: `IME · ${fmtPct(ime)}` },
          { val: fmt5(ivee), lbl: `IVEE · ${fmtPct(ivee)}` },
          { val: fmt5(idf), lbl: `IDF · ${fmtPct(idf)}` },
          { val: fmt5(cof), lbl: `COF · ${fmtPct(cof)}` },
        ]}
      />
      <div style={S.sectionWhite}>
        {/* IME Interpretation */}
        {ime > 0 && (() => {
          const imePct = Math.round(ime * 20);
          const imeTextos: Record<string, { titulo: string; texto: string; siguiente: string }> = {
            critico: { titulo: "Estado crítico — Se requiere intervención urgente", texto: `Con un IME de ${ime.toFixed(1)}/5 (${imePct}%), la empresa se encuentra en un estado crítico de madurez. Las brechas en múltiples dimensiones están limitando severamente el desempeño, la eficiencia y la capacidad de crecer de forma sostenida. Sin intervención sistémica en las áreas identificadas, el riesgo de estancamiento o retroceso es alto. Esta es la lectura de mayor urgencia: las acciones deben iniciarse esta semana.`, siguiente: "Focalizar el 80% de la energía directiva en las 3 dimensiones más críticas identificadas abajo." },
            debil: { titulo: "Empresa en construcción — Bases a consolidar", texto: `Con un IME de ${ime.toFixed(1)}/5 (${imePct}%), la empresa tiene avances en algunas áreas pero presenta brechas importantes que frenan su desarrollo. La organización funciona, pero depende en exceso de personas clave y carece de los sistemas necesarios para crecer de forma escalable. Con foco en las áreas prioritarias, el potencial de mejora en los próximos 6-12 meses es significativo.`, siguiente: "Priorizar la sistematización de los procesos críticos y el fortalecimiento de las áreas con menor puntaje." },
            desarrollo: { titulo: "Empresa en transición — Potencial por desbloquear", texto: `Con un IME de ${ime.toFixed(1)}/5 (${imePct}%), la empresa está en una fase de transición hacia mayor madurez. Tiene bases sólidas en varias dimensiones, pero aún hay brechas específicas que limitan el crecimiento acelerado. Este es el punto de inflexión: las inversiones en las áreas débiles generarán retornos desproporcionados en valor, eficiencia y escalabilidad.`, siguiente: "Abordar sistemáticamente las brechas identificadas mientras se mantienen las fortalezas actuales." },
            solido: { titulo: "Empresa sólida — Optimización y escalabilidad", texto: `Con un IME de ${ime.toFixed(1)}/5 (${imePct}%), la empresa tiene una base sólida de madurez organizacional. La mayoría de las dimensiones funcionan bien, con algunas oportunidades específicas de mejora. La prioridad ahora es optimizar lo que ya funciona, cerrar las brechas restantes y preparar la arquitectura para un crecimiento acelerado sostenible.`, siguiente: "Enfocarse en la excelencia operativa y en escalar las capacidades existentes hacia nuevos mercados o modelos." },
            avanzado: { titulo: "Empresa avanzada — Excelencia y expansión", texto: `Con un IME de ${ime.toFixed(1)}/5 (${imePct}%), la empresa ha alcanzado un nivel avanzado de madurez organizacional. Los sistemas, procesos y capacidades están bien desarrollados en la mayoría de las dimensiones. El foco ahora es mantener esta ventaja competitiva, explorar nuevas fronteras de crecimiento y consolidar el modelo para ser referente del sector.`, siguiente: "Explorar estrategias de expansión, innovación o captación de inversión que aprovechen esta madurez." },
          };
          const t = imeTextos[nivel.estado] ?? imeTextos.desarrollo;
          return (
            <div style={{ background: "linear-gradient(135deg,#EFF6FF,#ECFDF5)", border: `1.5px solid ${nivel.color}`, borderRadius: 18, padding: "28px 32px", marginBottom: 48, display: "flex", gap: 24, alignItems: "flex-start" }}>
              <div style={{ minWidth: 72, borderRadius: 16, background: nivel.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 10px", flexShrink: 0, textAlign: "center" }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: nivel.color, lineHeight: 1 }}>{ime.toFixed(1)}</span>
                <span style={{ fontSize: 11, color: nivel.color, fontWeight: 700, opacity: 0.7, marginTop: 3 }}>/5 · {imePct}%</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0C4A6E", marginBottom: 10 }}>{t.titulo}</div>
                <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.85, textAlign: "justify", marginBottom: 12 }}>{t.texto}</p>
                <div style={{ fontSize: 14, fontWeight: 700, color: nivel.color }}>→ Próximo paso: {t.siguiente}</div>
              </div>
            </div>
          );
        })()}

        {/* Radar */}
        <div style={S.secLabel}>Perfil de madurez</div>
        <div style={{ ...S.secTitle }}>Radar de las <span style={{ background: "linear-gradient(135deg,#0EA5E9,#059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>12 dimensiones</span></div>
        <p style={S.secSub}>El gráfico muestra el nivel de madurez de cada dimensión. Las brechas más grandes representan las mayores oportunidades de transformación.</p>

        <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0E7FF", padding: 36, marginBottom: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {historial.length > 1 && (
            <div style={{ alignSelf: "flex-end", marginBottom: 16 }}>
              <Select value={compararConId} onValueChange={setCompararConId}>
                <SelectTrigger style={{ width: 240, height: 36, fontSize: 13 }}><SelectValue placeholder="Comparar con…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin comparar</SelectItem>
                  {historial.filter((h) => h.id !== sesionId && h.ime_score).map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.nombre_sesion} ({(h.ime_score ?? 0).toFixed(1)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarComparado ?? radarData}>
              <PolarGrid stroke="rgba(26,43,90,0.15)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "#1a2b5a" }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} />
              {radarComparado ? (
                <>
                  <Radar name="Actual" dataKey="actual" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.3} animationDuration={700} />
                  <Radar name="Anterior" dataKey="comparado" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} animationDuration={700} />
                </>
              ) : (
                <Radar name="Score" dataKey="score" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.25} animationDuration={700} />
              )}
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension comparison table */}
        {dimScores.some((d) => d.score > 0) && (
          <>
            <div style={S.secLabel}>Tabla comparativa</div>
            <div style={{ ...S.secTitle }}>Las <span style={{ background: "linear-gradient(135deg,#0EA5E9,#059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>12 dimensiones</span> en detalle</div>
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0E7FF", overflow: "hidden", marginBottom: 48 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFF" }}>
                    {["Dimensión", "Puntuación", "Nivel", "Estado", "Barra"].map((h) => (
                      <th key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", padding: "12px 20px", textAlign: "left", borderBottom: "1px solid #F0F4FF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...dimScores].sort((a, b) => b.score - a.score).map((d, i) => {
                    const sem = semaforo(d.score);
                    const meta = DIM_META[d.key] ?? { emoji: "📋" };
                    return (
                      <tr key={d.key} style={{ borderBottom: i < dimScores.length - 1 ? "1px solid #F8FAFF" : "none" }}>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#0C4A6E" }}>{d.nombre}</div>
                              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>{d.key}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ textAlign: "center" }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: d.score > 0 ? sem.color : "#CBD5E1" }}>
                              {d.score > 0 ? `${d.score.toFixed(1)}/5` : "—"}
                            </span>
                            {d.score > 0 && <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700 }}>{Math.round(d.score * 20)}%</div>}
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: sem.bg, color: sem.color, border: `1px solid ${sem.border}` }}>
                            {sem.emoji} {sem.label}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748B" }}>
                          {d.score > 0 ? (
                            sem.level === "avanzado" ? "Mantener y capitalizar" :
                            sem.level === "desarrollo" ? "Fortalecer con foco" : "Intervención urgente"
                          ) : "Sin evaluar"}
                        </td>
                        <td style={{ padding: "14px 20px", minWidth: 120 }}>
                          <div style={{ height: 8, background: "#F0F4FF", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${d.score > 0 ? Math.round(d.score * 20) : 0}%`, background: `linear-gradient(90deg,${sem.color},${sem.border})`, borderRadius: 999, transition: "width 0.8s ease" }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Fortalezas / Brechas */}
        <div style={S.secLabel}>Diagnóstico estratégico</div>
        <div style={{ ...S.secTitle }}>Fortalezas y <span style={{ background: "linear-gradient(135deg,#0EA5E9,#059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>brechas críticas</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
          <div style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", border: "1.5px solid #A7F3D0", borderRadius: 18, padding: 28 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#065F46", marginBottom: 18 }}>✅ Top 3 fortalezas</div>
            {fortalezas.length === 0 && <p style={{ fontSize: 14, color: "#64748B" }}>Aún sin datos suficientes.</p>}
            {fortalezas.map((f, i) => {
              const content = DIM_CONTENT[f.key]?.avanzado ?? DIM_CONTENT[f.key]?.desarrollo;
              return (
                <div key={f.key} style={{ padding: "16px 0", borderBottom: i < fortalezas.length - 1 ? "1px solid rgba(5,150,105,0.15)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(5,150,105,0.15)", color: "#059669", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>#{i + 1}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0C4A6E", flex: 1 }}>{f.nombre}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#059669" }}>{f.score.toFixed(1)}/5</div>
                  </div>
                  {content && (
                    <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, textAlign: "justify", paddingLeft: 44, margin: 0 }}>
                      {content.interpretacion.split(".")[0]}. Para mantener esta fortaleza: {content.recomendaciones[0].toLowerCase()}.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ background: "linear-gradient(135deg,#FEF2F2,#FEE2E2)", border: "1.5px solid #FECACA", borderRadius: 18, padding: 28 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#7F1D1D", marginBottom: 18 }}>⚠️ Top 3 brechas críticas</div>
            {brechas.length === 0 && <p style={{ fontSize: 14, color: "#64748B" }}>Aún sin datos suficientes.</p>}
            {brechas.map((b, i) => {
              const sem = semaforo(b.score);
              const content = DIM_CONTENT[b.key]?.[sem.level === "nodata" ? "critico" : sem.level as "critico" | "desarrollo" | "avanzado"];
              return (
                <div key={b.key} style={{ padding: "16px 0", borderBottom: i < brechas.length - 1 ? "1px solid rgba(220,38,38,0.15)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.15)", color: "#DC2626", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>#{i + 1}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0C4A6E", flex: 1 }}>{b.nombre}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#DC2626" }}>{b.score.toFixed(1)}/5</div>
                  </div>
                  {content && (
                    <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, textAlign: "justify", paddingLeft: 44, margin: "0 0 8px" }}>
                      {content.interpretacion.split(".")[0]}.
                    </p>
                  )}
                  {content && (
                    <div style={{ paddingLeft: 44, fontSize: 13, color: "#DC2626", fontWeight: 600 }}>→ Acción prioritaria: {content.recomendaciones[0]}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Consolidated action plan */}
        {brechas.length >= 2 && (
          <div style={{ background: "linear-gradient(135deg,#0C4A6E,#1E3A8A)", borderRadius: 20, padding: "32px 36px", marginBottom: 48 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Plan de acción consolidado</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "white", marginBottom: 20 }}>3 iniciativas prioritarias de las brechas críticas</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {brechas.slice(0, 3).map((b, i) => {
                const sem = semaforo(b.score);
                const content = DIM_CONTENT[b.key]?.[sem.level === "nodata" ? "critico" : sem.level as "critico" | "desarrollo" | "avanzado"];
                return (
                  <div key={b.key} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: "#0EA5E9", color: "white", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>P{i + 1}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>{b.nombre}</div>
                    </div>
                    {content && content.iniciativas.map((ini, j) => (
                      <div key={j} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                        <span style={{ color: "#38BDF8", fontSize: 14, flexShrink: 0 }}>→</span>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{ini}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Iniciativas */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <div style={S.secLabel}>Iniciativas por dimensión</div>
            {iniciativasFecha
              ? <p style={{ fontSize: 13, color: "#64748B" }}>Generadas con IA · {new Date(iniciativasFecha).toLocaleString("es-EC")}</p>
              : <p style={{ fontSize: 13, color: "#64748B" }}>Plantilla genérica · genera con IA para personalizar según tus resultados.</p>}
          </div>
          <button
            onClick={async () => {
              if (ime === 0) { toast.error("Completa al menos algunas dimensiones"); return; }
              if (!accessToken) { toast.error("Tu sesión expiró. Vuelve a iniciar sesión."); return; }
              setGenIA(true);
              try {
                const res = await generarIniciativasSide({
                  data: {
                    accessToken,
                    empresa: { nombre: cliente.nombre_empresa, sector: cliente.sector, tamano: cliente.tamano, pais: cliente.pais },
                    ime, ivee, idf, cof,
                    dimensiones: dimScores.map((d) => ({ key: d.key, nombre: d.nombre, score: d.score })),
                  },
                });
                if (res.error || !res.iniciativas?.length) { toast.error(res.error || "Sin iniciativas"); return; }
                onIniciativas(res.iniciativas);
                toast.success("Iniciativas personalizadas generadas");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error generando iniciativas");
              } finally { setGenIA(false); }
            }}
            disabled={genIA}
            style={{ padding: "10px 20px", borderRadius: 10, background: genIA ? "#CBD5E1" : "linear-gradient(135deg,#0C4A6E,#1E3A8A)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: genIA ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            {genIA ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Sparkles style={{ width: 14, height: 14 }} />}
            {iniciativasIA.length ? "Regenerar con IA" : "Generar con IA"}
          </button>
        </div>

        {(() => {
          const byKey = new Map(iniciativasIA.map((i) => [i.key, i]));
          const prioColor = (p?: string) =>
            p === "alta" ? { color: "#DC2626", bg: "rgba(220,38,38,0.1)" }
            : p === "media" ? { color: "#D97706", bg: "rgba(217,119,6,0.1)" }
            : p === "baja" ? { color: "#059669", bg: "rgba(5,150,105,0.1)" }
            : { color: "#0C4A6E", bg: "rgba(12,74,110,0.06)" };
          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>
              {[...dimScores].sort((a, b) => a.score - b.score).map((d) => {
                const n = interpretarIME(d.score || 1);
                const ini = byKey.get(d.key);
                const pr = prioColor(ini?.prioridad);
                return (
                  <div key={d.key} style={{ padding: 20, borderRadius: 14, border: "1px solid #E0E7FF", background: "white" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94A3B8", fontWeight: 700 }}>{d.nombre}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {ini && (
                          <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: pr.color, background: pr.bg }}>
                            {ini.prioridad} · {ini.horizonte}
                          </span>
                        )}
                        <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, color: n.color, background: n.bg }}>
                          {d.score > 0 ? `${d.score.toFixed(1)}/5` : "—"}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0C4A6E", lineHeight: 1.4 }}>{ini?.titulo ?? d.iniciativa}</div>
                    {ini?.descripcion && <div style={{ fontSize: 13, color: "#64748B", marginTop: 6, lineHeight: 1.65 }}>{ini.descripcion}</div>}
                    {ini?.impacto && <div style={{ fontSize: 12, color: "#0C4A6E", opacity: 0.7, marginTop: 8, fontStyle: "italic" }}>→ {ini.impacto}</div>}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Evolution chart */}
        {evolucion.length > 1 && (
          <>
            <div style={S.secLabel}>Evolución histórica</div>
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0E7FF", padding: 36 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#0C4A6E", marginBottom: 24 }}>Evolución del IME</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolucion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,43,90,0.1)" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="IME" stroke="#0EA5E9" strokeWidth={2.5} dot={{ fill: "#0C4A6E", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab Análisis IA ─────────────────────────────────────────────────────────
function TabAnalisisIA({
  cliente, ime, ivee, idf, cof, dimScores, financiero,
  analisis, setAnalisis, onSave, accessToken, puedeVerInterpretacion,
}: {
  cliente: Cliente;
  ime: number; ivee: number; idf: number; cof: number;
  dimScores: { nombre: string; score: number }[];
  financiero: DatosFinancieros & ReturnType<typeof calcFinanciero>;
  analisis: AnalisisMap;
  setAnalisis: React.Dispatch<React.SetStateAction<AnalisisMap>>;
  onSave: () => void;
  accessToken: string | null;
  puedeVerInterpretacion?: boolean;
}) {
  const [tipo, setTipo] = useState<typeof TIPOS_ANALISIS_DEF[number]["id"]>("ejecutivo");
  const [loading, setLoading] = useState(false);

  const generar = async () => {
    if (ime === 0) { toast.error("Completa primero al menos algunas dimensiones"); return; }
    if (!accessToken) { toast.error("Tu sesión expiró. Vuelve a iniciar sesión."); return; }
    setLoading(true);
    try {
      const fortalezas = [...dimScores].filter((d) => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
      const brechas = [...dimScores].filter((d) => d.score > 0).sort((a, b) => a.score - b.score).slice(0, 3);
      const res = await generarAnalisisSide({
        data: {
          accessToken,
          tipo,
          empresa: { nombre: cliente.nombre_empresa, sector: cliente.sector, tamano: cliente.tamano, pais: cliente.pais },
          ime, ivee, idf, cof,
          dimensiones: dimScores,
          fortalezas, brechas,
          financiero,
        },
      });
      if ((res as { error?: string }).error || !res.contenido) {
        toast.error((res as { error?: string }).error || "La IA no devolvió contenido");
        return;
      }
      setAnalisis((prev) => ({ ...prev, [tipo]: { titulo: res.titulo, contenido: res.contenido, fecha: new Date().toISOString() } }));
      setTimeout(onSave, 100);
      toast.success("Análisis generado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar análisis");
    } finally { setLoading(false); }
  };

  const actual = analisis[tipo];
  const generadosCount = TIPOS_ANALISIS_DEF.filter((t) => analisis[t.id]).length;

  return (
    <div>
      <Hero
        gradient="linear-gradient(135deg,#312E81,#0C4A6E)"
        watermark="IA"
        eyebrow="SIDE · Análisis con Inteligencia Artificial"
        title="5 análisis estratégicos"
        titleHighlight="generados por Claude"
        desc="Con base en los resultados del diagnóstico, Claude genera 5 análisis estratégicos especializados que transforman los datos en recomendaciones accionables, roadmaps de transformación y propuestas de consultoría."
        stats={[
          { val: `${generadosCount}/5`, lbl: "Análisis generados" },
          { val: ime > 0 ? `${ime.toFixed(1)}/5` : "—", lbl: "IME base del análisis" },
        ]}
      />
      {!(puedeVerInterpretacion ?? true) ? (
        <PremiumGateIA />
      ) : (
      <div style={S.sectionWhite}>
        {/* Diagnostic context card */}
        {ime > 0 && (
          <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0E7FF", padding: "28px 32px", marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Contexto diagnóstico enviado a Claude</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
              {[
                { label: "IME", raw: ime, pct: Math.round(ime * 20), sub: "Madurez empresarial", sem: semaforo(ime) },
                { label: "IVEE", raw: ivee, pct: Math.round(ivee * 20), sub: "Viabilidad escalabilidad", sem: semaforo(ivee) },
                { label: "IDF", raw: idf, pct: Math.round(idf * 20), sub: "Dependencia fundador", sem: semaforoIDF(idf) },
                { label: "COF", raw: cof, pct: Math.round(cof * 20), sub: "Coherencia organizacional", sem: semaforo(cof) },
              ].map((s) => (
                <div key={s.label} style={{ background: s.sem.bg, borderRadius: 14, padding: "18px 20px", border: `1.5px solid ${s.sem.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: s.raw > 0 ? s.sem.color : "#CBD5E1", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.raw > 0 ? `${s.raw.toFixed(1)}/5` : "—"}</div>
                  {s.raw > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: s.sem.color, opacity: 0.7, marginTop: 3 }}>{s.pct}%</div>}
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 6 }}>{s.sub}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.sem.color, marginTop: 4 }}>{s.sem.emoji} {s.sem.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
              Claude también recibe: <strong>empresa</strong> ({cliente.nombre_empresa}), <strong>sector</strong> ({cliente.sector ?? "no especificado"}), <strong>tamaño</strong> ({cliente.tamano ?? "no especificado"}), <strong>los 12 scores de dimensiones IME</strong>, las <strong>fortalezas y brechas identificadas</strong>, y los <strong>datos financieros disponibles</strong>. Cuantos más datos estén completos, más preciso y relevante será el análisis.
            </div>
          </div>
        )}

        {/* Insight */}
        <div style={{ background: "linear-gradient(135deg,#EFF6FF,#ECFDF5)", border: "1.5px solid #A7F3D0", borderRadius: 16, padding: "28px 32px", display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 40 }}>
          <div style={{ fontSize: 36, flexShrink: 0 }}>🤖</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0C4A6E", marginBottom: 10 }}>¿Cómo funciona el análisis IA del SIDE?</div>
            <div style={{ fontSize: 16, color: "#334155", lineHeight: 1.85, textAlign: "justify" }}>
              Claude analiza los 220 puntos de datos del diagnóstico y genera análisis estratégicos especializados. Cada análisis está calibrado para el sector, tamaño y contexto específico de la empresa diagnosticada.
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          {TIPOS_ANALISIS_DEF.map((t) => {
            const generado = !!analisis[t.id];
            const selected = tipo === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setTipo(t.id)}
                style={{
                  background: "white",
                  borderRadius: 18,
                  border: selected ? "2px solid #0EA5E9" : "1px solid #E0E7FF",
                  borderLeft: generado ? "4px solid #059669" : selected ? "4px solid #0EA5E9" : "4px solid #E0E7FF",
                  padding: 28,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: selected ? "0 4px 20px rgba(14,165,233,0.12)" : "none",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Análisis {t.num}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0C4A6E", marginBottom: 10, letterSpacing: "-0.01em" }}>{t.label}</div>
                <div style={{ fontSize: 15, color: "#64748B", lineHeight: 1.75, textAlign: "justify", marginBottom: 18 }}>{t.desc}</div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999, background: generado ? "#ECFDF5" : "#F5F7FF", color: generado ? "#059669" : "#94A3B8" }}>
                  {generado ? "✓ Generado" : "⏳ Pendiente"}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={generar}
          disabled={loading}
          style={{ padding: "14px 28px", borderRadius: 10, background: loading ? "#CBD5E1" : "linear-gradient(135deg,#0EA5E9,#6366F1)", color: "white", fontSize: 15, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: 40, boxShadow: loading ? "none" : "0 4px 20px rgba(14,165,233,0.3)" }}
        >
          {loading ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Sparkles style={{ width: 16, height: 16 }} />}
          {actual ? "Regenerar análisis seleccionado" : "Generar análisis seleccionado"}
        </button>

        {/* Content viewer */}
        {loading && (
          <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0E7FF", padding: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
            <Loader2 style={{ width: 40, height: 40, color: "#0EA5E9" }} className="animate-spin" />
            <p style={{ marginTop: 16, fontSize: 15, color: "#64748B" }}>Generando análisis con IA…</p>
          </div>
        )}
        {actual && !loading && (
          <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0E7FF", padding: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E0E7FF", flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>{actual.titulo}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{new Date(actual.fecha).toLocaleString("es-EC")}</span>
                <button
                  onClick={() => {
                    const blob = new Blob([`# ${actual.titulo}\n\n_${cliente.nombre_empresa} — ${new Date(actual.fecha).toLocaleString("es-EC")}_\n\n${actual.contenido}`], { type: "text/markdown;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `SIDE_${cliente.nombre_empresa.replace(/\s+/g, "_")}_${tipo}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{ padding: "6px 14px", borderRadius: 8, background: "white", border: "1.5px solid #E0E7FF", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Download style={{ width: 13, height: 13 }} /> Markdown
                </button>
                <button
                  onClick={() => {
                    const w = window.open("", "_blank");
                    if (!w) return;
                    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${actual.titulo}</title><style>body{font-family:Georgia,serif;max-width:780px;margin:40px auto;padding:0 24px;color:#1a2332;line-height:1.6}h1{border-bottom:2px solid #0EA5E9;padding-bottom:8px}pre{white-space:pre-wrap;font-family:inherit}</style></head><body><h1>${actual.titulo}</h1><p style="color:#666;font-size:13px">${cliente.nombre_empresa} — ${new Date(actual.fecha).toLocaleString("es-EC")}</p><pre>${(actual.contenido ?? "").replace(/[<>&]/g,(c)=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]!))}</pre><script>window.onload=()=>window.print()</script></body></html>`);
                    w.document.close();
                  }}
                  style={{ padding: "6px 14px", borderRadius: 8, background: "white", border: "1.5px solid #E0E7FF", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <FileText style={{ width: 13, height: 13 }} /> PDF
                </button>
              </div>
            </div>
            <div style={{ fontSize: 16, color: "#1E293B", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{actual.contenido}</div>
          </div>
        )}
        {!actual && !loading && (
          <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0E7FF", padding: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
            <FileText style={{ width: 40, height: 40, color: "#CBD5E1" }} />
            <p style={{ marginTop: 12, fontSize: 15, color: "#94A3B8" }}>Selecciona un análisis arriba y haz clic en Generar.</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

// ── Tab Historial ────────────────────────────────────────────────────────────
function TabHistorial({
  clientes, onAbrir, onNuevaSesion, fixedClienteId, esCliente,
}: {
  clientes: Cliente[];
  onAbrir: (s: Sesion) => void;
  onNuevaSesion: () => void;
  fixedClienteId?: string;
  esCliente?: boolean;
}) {
  const { user } = useAuth();
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [clientesMap, setClientesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; open: boolean }>({ id: "", open: false });

  const cargar = async () => {
    setLoading(true);
    const sesQuery = supabase.from("side_sesiones").select("*").order("updated_at", { ascending: false });
    const [{ data: ses }, { data: cli }] = await Promise.all([
      fixedClienteId ? sesQuery.eq("cliente_id", fixedClienteId) : sesQuery,
      supabase.from("clientes").select("id,nombre_empresa"),
    ]);
    setSesiones((ses ?? []) as unknown as Sesion[]);
    const map: Record<string, string> = {};
    (cli ?? []).forEach((c: { id: string; nombre_empresa: string }) => { map[c.id] = c.nombre_empresa; });
    setClientesMap(map);
    setLoading(false);
  };

  useEffect(() => { if (user) void cargar(); }, [user]);

  const pct = (s: Sesion) => {
    const total = DIMENSIONES.reduce((a, d) => a + d.preguntas.length, 0) + IVEE_PREGUNTAS.length + IDF_PREGUNTAS.length + COF_PREGUNTAS.length;
    const done = Object.values(s.scores ?? {}).filter((v) => v > 0).length;
    return Math.round((done / total) * 100);
  };

  const saveRename = async () => {
    if (!editingId) return;
    const { error } = await supabase.from("side_sesiones").update({ nombre_sesion: editingName || null }).eq("id", editingId);
    if (error) { toast.error(error.message); return; }
    setSesiones((prev) => prev.map((s) => s.id === editingId ? { ...s, nombre_sesion: editingName || null } : s));
    toast.success("Nombre actualizado");
    setEditingId(null);
  };

  const duplicar = async (s: Sesion) => {
    const { data, error } = await supabase.from("side_sesiones").insert({
      cliente_id: s.cliente_id,
      consultor_id: s.consultor_id,
      nombre_sesion: `${s.nombre_sesion ?? "Diagnóstico"} (copia)`,
      scores: s.scores ?? {},
      datos_financieros: JSON.parse(JSON.stringify(s.datos_financieros ?? null)),
      analisis_ia: {},
      ime_score: s.ime_score,
      ivee_score: s.ivee_score,
      idf_score: s.idf_score,
      cof_score: s.cof_score,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success("Sesión duplicada");
    setSesiones((prev) => [data as unknown as Sesion, ...prev]);
  };

  const toggleCompleta = async (s: Sesion) => {
    const { error } = await supabase.from("side_sesiones").update({ completada: !s.completada }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    setSesiones((prev) => prev.map((x) => x.id === s.id ? { ...x, completada: !x.completada } : x));
    toast.success(!s.completada ? "Marcada como completada" : "Marcada como en progreso");
  };

  const exportar = (s: Sesion) => {
    const blob = new Blob([JSON.stringify({ ...s, cliente: clientesMap[s.cliente_id] }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIDE_${(s.nombre_sesion ?? "sesion").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ id: "", open: false });
    const { error } = await supabase.from("side_sesiones").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Sesión eliminada");
    setSesiones((prev) => prev.filter((s) => s.id !== id));
  };

  const filtered = sesiones.filter((s) => {
    if (!q) return true;
    const qLow = q.toLowerCase();
    return (s.nombre_sesion ?? "").toLowerCase().includes(qLow) || (clientesMap[s.cliente_id] ?? "").toLowerCase().includes(qLow);
  });

  const totalSes = sesiones.length;
  const completadas = sesiones.filter((s) => s.completada).length;
  const enProgreso = totalSes - completadas;

  return (
    <div>
      <Hero
        gradient="linear-gradient(135deg,#0C4A6E,#1E3A8A)"
        watermark="HIST"
        eyebrow="SIDE · Historial de diagnósticos"
        title="Todas las sesiones"
        titleHighlight="de diagnóstico"
        desc="Gestiona todas las sesiones de diagnóstico SIDE — abre, duplica, exporta o compara sesiones para ver la evolución de la madurez empresarial en el tiempo."
        stats={[
          { val: totalSes.toString(), lbl: "Sesiones totales" },
          { val: completadas.toString(), lbl: "Completadas" },
          { val: enProgreso.toString(), lbl: "En progreso" },
        ]}
      />
      <div style={S.sectionWhite}>
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0E7FF", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F0F4FF", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#0C4A6E" }}>Sesiones de diagnóstico</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="🔍 Buscar por cliente o sesión..."
                  style={{ padding: "11px 18px", borderRadius: 10, border: "1.5px solid #E0E7FF", fontSize: 14, fontFamily: "inherit", outline: "none", width: 260 }}
                />
              </div>
              <button
                onClick={onNuevaSesion}
                style={{ padding: "11px 20px", borderRadius: 10, background: "linear-gradient(135deg,#0EA5E9,#6366F1)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                + Nueva sesión
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: 48, display: "flex", justifyContent: "center" }}>
              <Loader2 style={{ width: 32, height: 32, color: "#0EA5E9" }} className="animate-spin" />
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Sesión", "Cliente", "Fecha", "Progreso", "IME", "Estado", "Acciones"].map((h) => (
                    <th key={h} style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", padding: "14px 24px", textAlign: "left", background: "#F8FAFF", borderBottom: "1px solid #F0F4FF" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px 24px", textAlign: "center", color: "#94A3B8", fontSize: 15 }}>
                      {q ? "No se encontraron sesiones." : "Sin sesiones registradas."}
                    </td>
                  </tr>
                )}
                {filtered.map((s) => {
                  const p = pct(s);
                  const nivel = interpretarIME(s.ime_score ?? 0);
                  const isEditing = editingId === s.id;
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #F8FAFF" }}>
                      <td style={{ padding: "16px 24px" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") void saveRename(); if (e.key === "Escape") setEditingId(null); }}
                              autoFocus
                              style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #0EA5E9", fontSize: 14, outline: "none", flex: 1 }}
                            />
                            <button onClick={() => void saveRename()} style={{ background: "#059669", color: "white", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}><Check style={{ width: 14, height: 14 }} /></button>
                            <button onClick={() => setEditingId(null)} style={{ background: "#E2E8F0", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}><X style={{ width: 14, height: 14 }} /></button>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#0C4A6E" }}>{s.nombre_sesion ?? "Sin nombre"}</div>
                            <div style={{ fontSize: 12, color: "#94A3B8" }}>ID: {s.id.slice(0, 8)}…</div>
                          </>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>{clientesMap[s.cliente_id] ?? "—"}</div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ fontSize: 15, color: "#374151" }}>{new Date(s.updated_at).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: "#F0F4FF", borderRadius: 999, overflow: "hidden", minWidth: 60 }}>
                            <div style={{ width: `${p}%`, height: "100%", background: p === 100 ? "linear-gradient(90deg,#0EA5E9,#059669)" : "linear-gradient(90deg,#0EA5E9,#6366F1)", borderRadius: 999 }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: p === 100 ? "#059669" : "#0EA5E9" }}>{p}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: s.ime_score ? nivel.color : "#CBD5E1" }}>
                          {s.ime_score ? `${s.ime_score.toFixed(1)}/5` : "—"}
                        </div>
                        {s.ime_score ? <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700 }}>{Math.round(s.ime_score * 20)}%</div> : null}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ background: s.completada ? "#ECFDF5" : "#FEF3C7", color: s.completada ? "#059669" : "#B45309", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999 }}>
                          {s.completada ? "✓ Completada" : "⏳ En progreso"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            onClick={() => onAbrir(s)}
                            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1.5px solid #E0E7FF", background: "white", color: "#0EA5E9", cursor: "pointer" }}
                          >
                            {s.completada || s.estado_revision === "revisado" ? "Ver resultados" : "Continuar"}
                          </button>
                          {!esCliente && (
                            <>
                              <button
                                onClick={() => { setEditingId(s.id); setEditingName(s.nombre_sesion ?? ""); }}
                                title="Renombrar"
                                style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E0E7FF", background: "white", color: "#64748B", cursor: "pointer" }}
                              >
                                <Pencil style={{ width: 13, height: 13 }} />
                              </button>
                              <button
                                onClick={() => void duplicar(s)}
                                title="Duplicar"
                                style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E0E7FF", background: "white", color: "#64748B", cursor: "pointer" }}
                              >
                                <Copy style={{ width: 13, height: 13 }} />
                              </button>
                              <button
                                onClick={() => void toggleCompleta(s)}
                                title={s.completada ? "Marcar en progreso" : "Marcar completa"}
                                style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E0E7FF", background: "white", color: s.completada ? "#D97706" : "#059669", cursor: "pointer" }}
                              >
                                {s.completada ? <RotateCcw style={{ width: 13, height: 13 }} /> : <CheckCircle2 style={{ width: 13, height: 13 }} />}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => exportar(s)}
                            title="Exportar JSON"
                            style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E0E7FF", background: "white", color: "#64748B", cursor: "pointer" }}
                          >
                            <Download style={{ width: 13, height: 13 }} />
                          </button>
                          {(!esCliente || s.estado_revision === "borrador") && (
                            <button
                              onClick={() => setConfirmDelete({ id: s.id, open: true })}
                              title="Eliminar"
                              style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #FEE2E2", background: "#FEF2F2", color: "#DC2626", cursor: "pointer" }}
                            >
                              <Trash2 style={{ width: 13, height: 13 }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete.open} onOpenChange={(open) => setConfirmDelete((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sesión?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminarán todos los datos del diagnóstico, incluyendo scores y análisis IA.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doDelete()} style={{ background: "#DC2626" }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
