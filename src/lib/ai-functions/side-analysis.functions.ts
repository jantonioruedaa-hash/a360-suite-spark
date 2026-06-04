import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

type AnalisisTipo = "ejecutivo" | "brechas" | "roadmap" | "propuesta" | "financiero";

interface SideAnalysisInput {
  accessToken?: string;
  tipo: AnalisisTipo;
  empresa: { nombre: string; sector?: string | null; tamano?: string | null; pais?: string | null };
  ime: number;
  ivee: number;
  idf: number;
  cof: number;
  dimensiones: { nombre: string; score: number }[];
  fortalezas: { nombre: string; score: number }[];
  brechas: { nombre: string; score: number }[];
  financiero?: {
    ingresos_anuales?: number; margen_neto?: number; margen_ebitda?: number;
    multiplo_actual?: number; multiplo_objetivo?: number;
    ebitda?: number; valActual?: number; valObjetivo?: number; gap?: number; potencial?: number;
  };
}

const PROMPTS: Record<AnalisisTipo, { titulo: string; instruccion: string }> = {
  ejecutivo: {
    titulo: "Análisis ejecutivo estratégico",
    instruccion:
      "Genera un análisis ejecutivo estratégico de 4-6 párrafos para la dirección. Comienza con un diagnóstico global del nivel de madurez y la coherencia organizacional. Identifica los 2-3 patrones estructurales más relevantes (alineación estrategia–ejecución, dependencia del fundador, escalabilidad). Cierra con las prioridades estratégicas clave.",
  },
  brechas: {
    titulo: "Análisis de brechas críticas",
    instruccion:
      "Analiza las brechas más críticas. Para cada una de las 3 dimensiones con menor score: (1) describe qué está fallando, (2) impacto en el negocio, (3) causa raíz probable, (4) intervención recomendada. Usa formato estructurado con encabezados.",
  },
  roadmap: {
    titulo: "Roadmap estratégico de transformación",
    instruccion:
      "Diseña un roadmap de transformación de 12 meses dividido en 3 horizontes (0-3, 3-6, 6-12 meses). Para cada horizonte indica: foco principal, 2-3 iniciativas concretas, indicadores de éxito y entregables esperados. Considera la secuencia lógica de desarrollo organizacional.",
  },
  propuesta: {
    titulo: "Propuesta de consultoría A360SGP",
    instruccion:
      "Redacta una propuesta de consultoría profesional de Aceleradora 360 SGP para esta empresa. Incluye: (1) Diagnóstico ejecutivo, (2) Objetivos del proceso de aceleración, (3) Programas A360SGP recomendados (Plan Estratégico, Coaching Ejecutivo, LEE), (4) Resultados esperados a 12 meses, (5) Inversión estimada en sesiones. Tono profesional consultivo.",
  },
  financiero: {
    titulo: "Análisis de impacto financiero",
    instruccion:
      "Analiza el impacto financiero de cerrar las brechas detectadas. Conecta las brechas operativas y de gestión con su efecto en EBITDA, valoración y múltiplo. Cuantifica (en términos cualitativos si no hay datos exactos) el potencial de creación de valor. Si hay datos financieros, úsalos para argumentar el gap de valoración.",
  },
};

const buildPrompt = (input: SideAnalysisInput) => {
  const { titulo, instruccion } = PROMPTS[input.tipo];
  const fin = input.financiero;
  const finBlock = fin && fin.ingresos_anuales
    ? `\nDATOS FINANCIEROS:
- Ingresos anuales: $${fin.ingresos_anuales?.toLocaleString()}
- Margen neto: ${fin.margen_neto}%
- Margen EBITDA: ${fin.margen_ebitda}%
- EBITDA estimado: $${fin.ebitda?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
- Múltiplo actual: ${fin.multiplo_actual}x → Valor empresa: $${fin.valActual?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
- Múltiplo objetivo: ${fin.multiplo_objetivo}x → Valor potencial: $${fin.valObjetivo?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
- Gap de valoración: $${fin.gap?.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${fin.potencial?.toFixed(0)}% potencial)`
    : "";

  return `Eres un consultor senior de Aceleradora 360 SGP, firma especializada en transformación de PyMEs latinoamericanas. Tu tono es consultivo, ejecutivo, claro y orientado a resultados de negocio. Evita relleno y vaguedad.

EMPRESA: ${input.empresa.nombre}
Sector: ${input.empresa.sector ?? "—"} | Tamaño: ${input.empresa.tamano ?? "—"} | País: ${input.empresa.pais ?? "—"}

ÍNDICES SIDE:
- IME (Madurez Empresarial): ${input.ime.toFixed(2)}/5.0
- IVEE (Viabilidad y Escalabilidad): ${input.ivee.toFixed(2)}/5.0
- IDF (Dependencia del Fundador, alto = más dependencia): ${input.idf.toFixed(2)}/5.0
- COF (Coherencia Organizacional): ${input.cof.toFixed(2)}/5.0

DIMENSIONES (1-5):
${input.dimensiones.map((d) => `- ${d.nombre}: ${d.score.toFixed(2)}`).join("\n")}

TOP FORTALEZAS: ${input.fortalezas.map((f) => `${f.nombre} (${f.score.toFixed(1)})`).join(", ")}
BRECHAS CRÍTICAS: ${input.brechas.map((b) => `${b.nombre} (${b.score.toFixed(1)})`).join(", ")}${finBlock}

TAREA — ${titulo}:
${instruccion}

Responde en español, con formato Markdown legible (encabezados ##, listas, énfasis). No incluyas disclaimers.`;
};

export const generarAnalisisSide = createServerFn({ method: "POST" })
  .inputValidator((d: SideAnalysisInput) => d)
  .handler(async ({ data }) => {
    try {
      if (!data.accessToken) {
        return { tipo: data.tipo, titulo: PROMPTS[data.tipo].titulo, contenido: "", error: "Tu sesión expiró. Vuelve a iniciar sesión e intenta nuevamente." };
      }

      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !supabaseKey) {
        return { tipo: data.tipo, titulo: PROMPTS[data.tipo].titulo, contenido: "", error: "La autenticación del backend no está configurada." };
      }

      const authClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      });
      const { data: authData, error: authError } = await authClient.auth.getClaims(data.accessToken);
      if (authError || !authData?.claims?.sub) {
        return { tipo: data.tipo, titulo: PROMPTS[data.tipo].titulo, contenido: "", error: "No pudimos validar tu sesión. Vuelve a iniciar sesión e intenta nuevamente." };
      }

      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) {
        return { tipo: data.tipo, titulo: PROMPTS[data.tipo].titulo, contenido: "", error: "LOVABLE_API_KEY no configurada" };
      }

      const prompt = buildPrompt(data);

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Eres un consultor senior de transformación empresarial para PyMEs latinoamericanas." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        let msg = `Error de IA (${resp.status})`;
        if (resp.status === 429) msg = "Límite de uso alcanzado. Intenta de nuevo en unos minutos.";
        else if (resp.status === 402) msg = "Créditos de IA agotados. Agrega créditos en Lovable Cloud.";
        else if (txt) msg += `: ${txt.slice(0, 200)}`;
        console.error("[SIDE] AI gateway error", resp.status, txt);
        return { tipo: data.tipo, titulo: PROMPTS[data.tipo].titulo, contenido: "", error: msg };
      }

      const json = await resp.json();
      const contenido = json?.choices?.[0]?.message?.content ?? "";
      if (!contenido) {
        return { tipo: data.tipo, titulo: PROMPTS[data.tipo].titulo, contenido: "", error: "La IA no devolvió contenido. Intenta de nuevo." };
      }
      return { tipo: data.tipo, titulo: PROMPTS[data.tipo].titulo, contenido, error: null as string | null };
    } catch (e) {
      console.error("[SIDE] handler exception", e);
      return { tipo: data.tipo, titulo: PROMPTS[data.tipo].titulo, contenido: "", error: e instanceof Error ? e.message : "Error inesperado" };
    }
  });
