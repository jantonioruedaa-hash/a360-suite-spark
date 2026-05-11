// IA para Reportes de Sesión: análisis ejecutivo de UNA sesión registrada.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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
  if (res.status === 402) throw new Error("Créditos de IA agotados.");
  if (!res.ok) throw new Error(`AI Gateway error ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

const SYSTEM = `Eres consultor ejecutivo senior de A360SGP.
Recibes el reporte de UNA sesión de consultoría con un cliente. Produces un análisis ejecutivo
en Markdown con esta estructura exacta:

## Lectura ejecutiva
(2-4 líneas. Qué nos dice esta sesión sobre el momento del cliente y la calidad del avance.)

## Avances reales
- 3-5 bullets concretos basados en logros, KPIs y temas tratados

## Riesgos / señales de alerta
- 2-4 bullets a partir del semáforo, KPIs en rojo/amarillo y temas pendientes

## Recomendaciones para la próxima sesión
1. Acción concreta (1-2 líneas)
2. ...
3. ... (mínimo 3, máximo 5)

## Mensaje sugerido al cliente
(2-3 líneas en tono ejecutivo, listo para enviar.)

Tono: consultivo, basado en EVIDENCIA del reporte. Si faltan datos, dilo explícitamente.`;

export const analizarReporteSesion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      actividadId: z.string().uuid(),
      contextoCliente: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    try {
      const { supabase } = context as { supabase: any };
      const { data: act, error } = await supabase
        .from("cliente_actividades")
        .select("*")
        .eq("id", data.actividadId)
        .maybeSingle();
      if (error) throw new Error(`DB: ${error.message}`);
      if (!act) throw new Error("Sesión no encontrada");
      if (!act.es_sesion_consultoria) throw new Error("Solo aplicable a sesiones de consultoría");

      const [kpisRes, compsRes] = await Promise.all([
        supabase.from("cliente_kpis").select("*").eq("actividad_id", data.actividadId),
        supabase.from("cliente_compromisos").select("*").eq("actividad_id", data.actividadId),
      ]);
      const kpis = kpisRes.data ?? [];
      const comps = compsRes.data ?? [];

      const userPrompt = `CLIENTE / CONTEXTO:
${data.contextoCliente || "(sin contexto adicional)"}

REPORTE DE SESIÓN (JSON):
${JSON.stringify({
  numero_sesion: act.numero_sesion, programa: act.programa, etapa: act.etapa_programa,
  fecha: act.fecha, duracion_minutos: act.duracion_minutos, modalidad: act.modalidad,
  participantes: act.participantes, objetivo: act.objetivo,
  temas: act.temas, logros: act.logros, herramientas: act.herramientas,
  semaforo: act.semaforo, justificacion_semaforo: act.justificacion_semaforo,
  proxima_fecha: act.proxima_fecha, proxima_temas: act.proxima_temas,
  mensaje_cliente: act.mensaje_cliente,
}, null, 2)}

KPIs MEDIDOS:
${JSON.stringify(kpis, null, 2)}

COMPROMISOS:
${JSON.stringify(comps, null, 2)}

Genera el análisis siguiendo estrictamente el formato definido.`;

      const analisis = await callAI(SYSTEM, userPrompt);
      if (!analisis || !analisis.trim()) throw new Error("La IA no devolvió contenido");
      const fecha = new Date().toISOString();

      const { error: upErr } = await supabase
        .from("cliente_actividades")
        .update({ analisis_ia: analisis, analisis_ia_fecha: fecha })
        .eq("id", data.actividadId);
      if (upErr) throw new Error(`No se pudo guardar el análisis: ${upErr.message}`);

      return { analisis, fecha };
    } catch (err) {
      // Convertir cualquier Response u objeto no-Error en Error legible
      if (err instanceof Response) {
        const txt = await err.text().catch(() => err.statusText);
        console.error("[analizarReporteSesion] Response error:", err.status, txt);
        throw new Error(`Error ${err.status}: ${txt || err.statusText}`);
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[analizarReporteSesion] error:", msg);
      throw new Error(msg);
    }
  });
