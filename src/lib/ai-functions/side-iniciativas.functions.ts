import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const InputSchema = z.object({
  accessToken: z.string().min(10).max(4000).optional(),
  empresa: z.object({
    nombre: z.string().trim().min(1).max(200),
    sector: z.string().trim().max(120).nullable().optional(),
    tamano: z.string().trim().max(120).nullable().optional(),
    pais: z.string().trim().max(120).nullable().optional(),
  }),
  ime: z.number().min(0).max(5),
  ivee: z.number().min(0).max(5),
  idf: z.number().min(0).max(5),
  cof: z.number().min(0).max(5),
  dimensiones: z.array(z.object({
    key: z.string().trim().max(10),
    nombre: z.string().trim().max(120),
    score: z.number().min(0).max(5),
  })).max(50),
});

type Input = z.infer<typeof InputSchema>;

export interface IniciativaIA {
  key: string;
  titulo: string;
  descripcion: string;
  prioridad: "alta" | "media" | "baja";
  horizonte: "0-3m" | "3-6m" | "6-12m";
  impacto: string;
}

export const generarIniciativasSide = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      if (!data.accessToken) return { iniciativas: [] as IniciativaIA[], error: "Tu sesión expiró. Vuelve a iniciar sesión." };
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !supabaseKey) return { iniciativas: [], error: "Backend no configurado" };

      const authClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      });
      const { data: authData, error: authError } = await authClient.auth.getClaims(data.accessToken);
      if (authError || !authData?.claims?.sub) return { iniciativas: [], error: "Sesión inválida" };

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return { iniciativas: [], error: "ANTHROPIC_API_KEY no configurada" };

      const prompt = `Eres consultor senior de Aceleradora 360 SGP. Para la empresa "${data.empresa.nombre}" (sector: ${data.empresa.sector ?? "—"}, tamaño: ${data.empresa.tamano ?? "—"}), genera UNA iniciativa concreta y accionable para CADA UNA de las 12 dimensiones SIDE en función del score obtenido.

Índices: IME ${data.ime.toFixed(2)} · IVEE ${data.ivee.toFixed(2)} · IDF ${data.idf.toFixed(2)} (alto=más dependencia) · COF ${data.cof.toFixed(2)}

Scores por dimensión (escala 1-5):
${data.dimensiones.map((d) => `- ${d.key} ${d.nombre}: ${d.score.toFixed(2)}`).join("\n")}

Reglas:
- Si score < 2.0 → prioridad "alta", horizonte "0-3m", iniciativa de remediación urgente.
- Si 2.0 ≤ score < 3.5 → prioridad "media", horizonte "3-6m", iniciativa de desarrollo.
- Si score ≥ 3.5 → prioridad "baja", horizonte "6-12m", iniciativa de optimización/escalamiento.
- Cada iniciativa debe ser específica al sector y al nivel actual, NO genérica.
- "titulo": 4-8 palabras, accionable.
- "descripcion": 1-2 oraciones explicando QUÉ se hace.
- "impacto": 1 frase sobre el efecto esperado en el negocio.

Devuelve EXACTAMENTE las 12 dimensiones usando los keys: L, E, G, O, GE, F, C, M, OP, CU, T, ES.`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: "Consultor senior de transformación de PyMEs latinoamericanas. Respondes solo con la herramienta provista.",
          messages: [{ role: "user", content: prompt }],
          tools: [{
            name: "registrar_iniciativas",
            description: "Registra las 12 iniciativas recomendadas, una por dimensión.",
            input_schema: {
              type: "object",
              properties: {
                iniciativas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: { type: "string", enum: ["L","E","G","O","GE","F","C","M","OP","CU","T","ES"] },
                      titulo: { type: "string" },
                      descripcion: { type: "string" },
                      prioridad: { type: "string", enum: ["alta","media","baja"] },
                      horizonte: { type: "string", enum: ["0-3m","3-6m","6-12m"] },
                      impacto: { type: "string" },
                    },
                    required: ["key","titulo","descripcion","prioridad","horizonte","impacto"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["iniciativas"],
              additionalProperties: false,
            },
          }],
          tool_choice: { type: "tool", name: "registrar_iniciativas" },
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        let msg = `Error de IA (${resp.status})`;
        if (resp.status === 429) msg = "Límite de uso alcanzado. Intenta en unos minutos.";
        else if (txt) msg += `: ${txt.slice(0, 200)}`;
        console.error("[SIDE-INIC] Anthropic API error", resp.status, txt);
        return { iniciativas: [], error: msg };
      }

      const json = await resp.json();
      const toolUse = json?.content?.find((b: { type: string }) => b.type === "tool_use");
      const args = toolUse?.input;
      if (!args) return { iniciativas: [], error: "La IA no devolvió iniciativas estructuradas." };
      const parsed = args ?? {};
      const iniciativas = (parsed?.iniciativas ?? []) as IniciativaIA[];
      return { iniciativas, error: null as string | null };
    } catch (e) {
      console.error("[SIDE-INIC] exception", e);
      return { iniciativas: [] as IniciativaIA[], error: e instanceof Error ? e.message : "Error inesperado" };
    }
  });
