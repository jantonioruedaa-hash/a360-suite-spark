// Función IA centralizada para el Módulo Plan Estratégico.
// CAMBIO DE PROVEEDOR: solo se edita callAI() — todo lo demás permanece igual.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ════════════════════════════════════════════════════════
//  ÚNICO PUNTO DE CAMBIO DE PROVEEDOR
// ════════════════════════════════════════════════════════
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (res.status === 429) throw new Error("Límite de uso de IA superado. Inténtalo más tarde.");
  if (res.status === 402) throw new Error("Créditos de IA agotados. Agrega fondos a tu workspace.");
  if (!res.ok) throw new Error(`AI Gateway error ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

// ════════════════════════════════════════════════════════
//  SYSTEM PROMPT MAESTRO
// ════════════════════════════════════════════════════════
const SYSTEM_BASE = `Eres director senior de estrategia de A360SGP, consultora boutique de alto nivel.
Tu misión: analizar secciones de planes estratégicos empresariales con criterio consultivo, sin rodeos, accionable.
Para cada análisis devuelves siempre y en este orden, en formato Markdown:

## Situación actual
(1 párrafo, 4-6 líneas)

## Puntos fuertes
- 3 a 5 bullets específicos

## Riesgos y brechas
- 3 a 5 bullets concretos

## Recomendaciones accionables
1. Acción concreta con plazo sugerido
2. ...
3. ... (mínimo 3, máximo 5)

## Preguntas reflexivas para el empresario
- 3 preguntas potentes que abran conversación

Tono: consultivo senior, directo, basado en evidencia del propio contenido del cliente. Nunca uses lugares comunes.`;

// ════════════════════════════════════════════════════════
//  SERVER FN: analizar una sección
// ════════════════════════════════════════════════════════
export const analizarSeccionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    clienteId: z.string().uuid(),
    columna: z.string().min(3).max(40),
    seccionTitulo: z.string().min(3).max(80),
    contextoEmpresa: z.string().max(2000).optional(),
    datosSeccion: z.record(z.string(), z.any()),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const userPrompt = `EMPRESA Y CONTEXTO:
${data.contextoEmpresa || "(sin datos de contexto)"}

SECCIÓN A ANALIZAR: "${data.seccionTitulo}"

CONTENIDO ACTUAL DE LA SECCIÓN (JSON):
${JSON.stringify(data.datosSeccion, null, 2)}

Genera el análisis siguiendo estrictamente el formato definido.`;

    const analisis = await callAI(SYSTEM_BASE, userPrompt);

    // Guardar en BD: actualiza la columna correspondiente preservando los datos
    const allowedCols = ["sec01","sec02","sec03","sec04","sec05","sec06","sec07","sec08","sec09","sec10_esg","sec11_alianzas","sec12_innovacion","sec13","sec14","sec15","sec16","sec17_cmi","sec18_ejecucion"];
    if (!allowedCols.includes(data.columna)) throw new Error("Columna inválida");

    const { data: existing } = await supabase
      .from("planes_estrategicos")
      .select(`id, ${data.columna}`)
      .eq("cliente_id", data.clienteId)
      .maybeSingle();

    const fecha = new Date().toISOString();
    const seccionPrev = (existing as Record<string, unknown> | null)?.[data.columna] as { data?: Record<string, unknown> } | null;
    const nuevoValor = {
      data: seccionPrev?.data ?? data.datosSeccion,
      analisis_ia: analisis,
      analisis_ia_fecha: fecha,
      completado: true,
    };

    if (existing?.id) {
      await supabase.from("planes_estrategicos")
        .update({ [data.columna]: nuevoValor, updated_at: fecha })
        .eq("id", existing.id);
    } else {
      await supabase.from("planes_estrategicos").insert({
        cliente_id: data.clienteId,
        [data.columna]: nuevoValor,
      });
    }

    return { analisis, fecha };
  });
