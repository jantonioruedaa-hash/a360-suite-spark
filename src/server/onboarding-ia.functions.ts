import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

interface Input {
  accessToken?: string;
  empresa: { nombre: string; sector?: string | null; ciudad?: string | null; pais?: string | null };
  paso1: Record<string, unknown>;
  paso2: Record<string, unknown>;
  paso3: Record<string, unknown>;
  paso4: Record<string, unknown>;
  paso5: Record<string, unknown>;
}

export const generarAnalisisOnboarding = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => d)
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

      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) return { contenido: "", error: "LOVABLE_API_KEY no configurada" };

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

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Consultor senior de transformación de PyMEs latinoamericanas." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        let m = `Error de IA (${resp.status})`;
        if (resp.status === 429) m = "Límite de uso alcanzado. Intenta en unos minutos.";
        else if (resp.status === 402) m = "Créditos de IA agotados.";
        console.error("[ONBOARDING-IA]", resp.status, t);
        return { contenido: "", error: m };
      }
      const j = await resp.json();
      const contenido = j?.choices?.[0]?.message?.content ?? "";
      if (!contenido) return { contenido: "", error: "La IA no devolvió contenido." };
      return { contenido, error: null as string | null };
    } catch (e) {
      console.error("[ONBOARDING-IA] ex", e);
      return { contenido: "", error: e instanceof Error ? e.message : "Error inesperado" };
    }
  });
