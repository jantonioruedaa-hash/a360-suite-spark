// IA centralizada para el módulo Coaching A360.
// Analiza una sesión específica + sintetiza el programa completo de un líder.
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { consumirCreditoIAInline } from "@/lib/creditos-ia-helper.server";

type CoachingAIResult = {
  analisis?: string | null;
  sintesis?: string | null;
  fecha: string | null;
  error: string | null;
};

function getAuthenticatedClient(accessToken?: string | null) {
  if (!accessToken) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Backend no configurado");

  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

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
//  PROMPTS
// ════════════════════════════════════════════════════════
const SYSTEM_HERRAMIENTA = `Eres coach ejecutivo senior de A360SGP, certificado en metodología A360 (4 etapas, 12 herramientas).
Analizas el registro de UNA herramienta de coaching aplicada a un líder real, con criterio consultivo, sin lugares comunes.
Tu output siempre en Markdown con esta estructura exacta:

## Lectura clínica
(2-4 líneas. Qué revela este registro sobre el líder HOY.)

## Patrones y señales
- 3-5 bullets concretos derivados de los datos del registro

## Riesgos / puntos ciegos
- 2-4 bullets que el líder probablemente no está viendo

## Recomendaciones para la próxima sesión
1. Acción/intervención concreta del coach (1-2 líneas)
2. ...
3. ... (mínimo 3, máximo 5)

## Preguntas poderosas para abrir
- 3 preguntas calibradas al perfil y momento del líder

## Indicador de avance
Una frase breve sobre dónde está el líder en su proceso de transformación.

Tono: senior, directo, basado en evidencia DEL registro. Nunca hables en abstracto. Si los datos son insuficientes, dilo y pide qué falta.`;

const SYSTEM_PROGRAMA = `Eres director de programa de coaching ejecutivo de A360SGP.
Recibes el conjunto de TODAS las sesiones registradas de un líder a lo largo de su programa A360 (4 etapas, 12 herramientas).
Produces una síntesis ejecutiva de transformación, en Markdown, con esta estructura:

## Línea base del líder
(3-5 líneas: cómo llegó al programa, evidenciado por las herramientas de Diagnóstico)

## Hilos de transformación detectados
- 3-5 bullets sobre los cambios visibles a lo largo del programa

## Brechas que persisten
- 2-4 bullets de lo que aún no se ha movido

## Delta cuantitativo (Radar)
(Si hay radar inicial y de cierre, calcula y comenta dimensión por dimensión. Si no hay radar de cierre, dilo y proyecta.)

## Recomendaciones para el cierre / continuidad
1. Acción concreta para el coach
2. Acción concreta para el líder
3. ... (mínimo 3, máximo 6)

## Mensaje al sponsor
(2-3 líneas en lenguaje ejecutivo dirigidas al sponsor del programa.)

Tono: senior, basado en datos reales del cliente. Si faltan datos, dilo explícitamente.`;

// ════════════════════════════════════════════════════════
//  SERVER FN: analizar UNA sesión
// ════════════════════════════════════════════════════════
export const analizarSesionCoaching = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      sesionId: z.string().uuid(),
      herramientaNombre: z.string().min(2).max(120),
      herramientaProposito: z.string().min(2).max(2000),
      etapa: z.string().min(2).max(40),
      datosSesion: z.record(z.string(), z.any()),
      contextoCliente: z.string().max(2000).optional(),
      accessToken: z.string().min(10).optional(),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<CoachingAIResult> => {
    try {
      const supabase = getAuthenticatedClient(data.accessToken);
      const { data: claims, error: authErr } = await supabase.auth.getClaims(data.accessToken);
      if (authErr || !claims?.claims?.sub) return { analisis: null, fecha: null, error: "Sesión inválida o expirada" };

      const userPrompt = `CLIENTE / CONTEXTO:
${data.contextoCliente || "(sin datos de contexto del líder)"}

ETAPA: ${data.etapa}
HERRAMIENTA APLICADA: "${data.herramientaNombre}"
PROPÓSITO DE LA HERRAMIENTA: ${data.herramientaProposito}

REGISTRO DEL LÍDER (JSON):
${JSON.stringify(data.datosSesion, null, 2)}

Analiza estrictamente con el formato definido.`;

      const analisis = await callAI(SYSTEM_HERRAMIENTA, userPrompt);
      if (!analisis.trim()) throw new Error("La IA no devolvió contenido");
      const fecha = new Date().toISOString();

      // Recupera sesión, fusiona analisis dentro del jsonb datos
      const { data: ses, error: sesErr } = await supabase
        .from("coaching_sesiones")
        .select("datos")
        .eq("id", data.sesionId)
        .maybeSingle();
      if (sesErr) throw new Error(`No se pudo leer la sesión: ${sesErr.message}`);
      if (!ses) return { analisis: null, fecha: null, error: "Sesión no encontrada o sin acceso" };
      const datosPrev = (ses.datos ?? {}) as Record<string, unknown>;
      const nuevoDatos = { ...datosPrev, analisis_ia: analisis, analisis_ia_fecha: fecha };

      const { error: upErr } = await supabase
        .from("coaching_sesiones")
        .update({ datos: nuevoDatos })
        .eq("id", data.sesionId);
      if (upErr) throw new Error(`No se pudo guardar el análisis: ${upErr.message}`);

      return { analisis, fecha, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[COACHING-IA] analizarSesionCoaching", msg);
      return { analisis: null, fecha: null, error: msg };
    }
  });

// ════════════════════════════════════════════════════════
//  SERVER FN: síntesis del PROGRAMA completo del líder
// ════════════════════════════════════════════════════════
export const sintetizarProgramaCoaching = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      clienteId: z.string().uuid(),
      contextoCliente: z.string().max(3000).optional(),
      accessToken: z.string().min(10).optional(),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<CoachingAIResult> => {
    try {
      const supabase = getAuthenticatedClient(data.accessToken);
      const { data: claims, error: authErr } = await supabase.auth.getClaims(data.accessToken);
      if (authErr || !claims?.claims?.sub) return { sintesis: null, fecha: null, error: "Sesión inválida o expirada" };

      const { data: sesiones, error: sesErr } = await supabase
        .from("coaching_sesiones")
        .select("herramienta_id, etapa, datos, completada, created_at")
        .eq("cliente_id", data.clienteId)
        .order("created_at", { ascending: true });
      if (sesErr) throw new Error(`No se pudieron leer las sesiones: ${sesErr.message}`);

      if (!sesiones || sesiones.length === 0) {
        return { sintesis: null, fecha: null, error: "Aún no hay sesiones registradas para este cliente." };
      }

      const userPrompt = `CLIENTE / CONTEXTO:
${data.contextoCliente || "(sin datos de contexto del líder)"}

TOTAL SESIONES REGISTRADAS: ${sesiones.length}

REGISTROS COMPLETOS DEL PROGRAMA (JSON ordenado cronológicamente):
${JSON.stringify(sesiones, null, 2)}

Genera la síntesis ejecutiva siguiendo estrictamente el formato definido.`;

      const sintesis = await callAI(SYSTEM_PROGRAMA, userPrompt);
      if (!sintesis.trim()) throw new Error("La IA no devolvió contenido");
      const fecha = new Date().toISOString();
      return { sintesis, fecha, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[COACHING-IA] sintetizarProgramaCoaching", msg);
      return { sintesis: null, fecha: null, error: msg };
    }
  });
