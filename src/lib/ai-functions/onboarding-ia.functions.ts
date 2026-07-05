import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const PasoSchema = z.record(z.string().max(200), z.unknown()).refine(
  (o) => JSON.stringify(o).length <= 10000,
  { message: "Paso demasiado grande" },
);

const InputSchema = z.object({
  accessToken: z.string().min(10).max(4000).optional(),
  empresa: z.object({
    nombre: z.string().trim().min(1).max(200),
    sector: z.string().trim().max(120).nullable().optional(),
    ciudad: z.string().trim().max(120).nullable().optional(),
    pais: z.string().trim().max(120).nullable().optional(),
  }),
  paso1: PasoSchema,
  paso2: PasoSchema,
  paso3: PasoSchema,
  paso4: PasoSchema,
  paso5: PasoSchema,
});

type Input = z.infer<typeof InputSchema>;

export const generarAnalisisOnboarding = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      if (!data.accessToken) return { contenido: "", error: "Sesión expirada." };
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) return { contenido: "", error: "Backend no configurado" };
      const c = createClient(url, key, {
        global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      });
      const { data: a, error: e } = await c.auth.getClaims(data.accessToken);
      if (e || !a?.claims?.sub) return { contenido: "", error: "Sesión inválida" };

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return { contenido: "", error: "ANTHROPIC_API_KEY no configurada" };

      const prompt = `Eres consultor senior de Aceleradora 360 SGP. Acabas de completar el onboarding de "${data.empresa.nombre}" (${data.empresa.sector ?? "—"}, ${[data.empresa.ciudad, data.empresa.pais].filter(Boolean).join(", ") || "—"}).

PERFIL EMPRESA: ${JSON.stringify(data.paso1)}
PERFIL LÍDER: ${JSON.stringify(data.paso2)}
CONTEXTO ESTRATÉGICO: ${JSON.stringify(data.paso3)}
EXPECTATIVAS: ${JSON.stringify(data.paso4)}
ACUERDO: ${JSON.stringify(data.paso5)}

Genera un análisis ejecutivo en 5 secciones (usa encabezados ## en español):
1. Perfil psicológico del líder y su impacto en la transformación
2. Dimensiones SIDE que probablemente mostrarán mayor brecha según el contexto
3. Riesgos del proceso según actitud al cambio y disponibilidad
4. Recomendaciones para el primer diagnóstico SIDE
5. Alertas tempranas que el consultor debe monitorear en las primeras sesiones

Tono consultivo, ejecutivo, sin relleno. Máximo 700 palabras.`;

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
          system: "Consultor senior de transformación de PyMEs latinoamericanas.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        let m = `Error de IA (${resp.status})`;
        if (resp.status === 429) m = "Límite de uso alcanzado. Intenta en unos minutos.";
        console.error("[ONBOARDING-IA]", resp.status, t);
        return { contenido: "", error: m };
      }
      const j = await resp.json();
      const contenido = j?.content?.[0]?.text ?? "";
      if (!contenido) return { contenido: "", error: "La IA no devolvió contenido." };
      return { contenido, error: null as string | null };
    } catch (e) {
      console.error("[ONBOARDING-IA] ex", e);
      return { contenido: "", error: e instanceof Error ? e.message : "Error inesperado" };
    }
  });
