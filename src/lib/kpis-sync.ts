import { supabase } from "@/integrations/supabase/client";

// Extrae el primer número (entero o decimal) de un string libre como
// "+20% YoY", "≥ 18%", "< 60 días", "≥ 90". Devuelve null si no encuentra.
export function parseFirstNumber(raw: unknown): number | null {
  if (raw == null) return null;
  const s = String(raw).replace(/,/g, ".");
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function parseUnidad(raw: unknown, unidadCampo?: unknown): string | null {
  if (unidadCampo && String(unidadCampo).trim()) return String(unidadCampo).trim();
  if (raw == null) return null;
  const s = String(raw);
  if (s.includes("%")) return "%";
  const m = s.match(/(días|d[ií]as|USD|EUR|pts|und|h|min|meses|años)/i);
  return m ? m[1] : null;
}

// Cumplimiento simple: actual / meta. Semáforo 70/90.
export function computeCumplimiento(
  meta: number | null,
  actual: number | null,
): { pct: number | null; gap: number | null; semaforo: "verde" | "amarillo" | "rojo" } {
  if (meta == null || actual == null || meta === 0) {
    return { pct: null, gap: meta != null && actual != null ? meta - actual : null, semaforo: "rojo" };
  }
  const pct = (actual / meta) * 100;
  const sem = pct >= 90 ? "verde" : pct >= 70 ? "amarillo" : "rojo";
  return { pct, gap: meta - actual, semaforo: sem };
}

const PLAN_PREFIX = "Plan — ";
const SIDE_PREFIX = "SIDE — ";

/**
 * Sincroniza indicadores desde planes_estrategicos (sec17_cmi) y la última
 * sesión SIDE hacia cliente_kpis. Borra previas con prefijos Plan— / SIDE—
 * y vuelve a insertar (los KPIs creados manualmente por el consultor no se tocan).
 * Devuelve la cantidad de filas insertadas.
 */
export async function syncKpisCliente(clienteId: string): Promise<number> {
  const [{ data: plan }, { data: sides }] = await Promise.all([
    supabase
      .from("planes_estrategicos")
      .select("sec17_cmi")
      .eq("cliente_id", clienteId)
      .maybeSingle(),
    supabase
      .from("side_sesiones")
      .select("ime_score,cof_score,idf_score,ivee_score,created_at")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  type Row = {
    cliente_id: string;
    categoria: string;
    nombre: string;
    unidad: string | null;
    valor_meta: number | null;
    valor_actual: number | null;
    semaforo: string;
    observacion: string | null;
  };
  const rows: Row[] = [];

  // --- Plan Estratégico (sec17_cmi.data.objetivos)
  const sec = (plan?.sec17_cmi ?? {}) as { data?: { objetivos?: unknown[] } };
  const objetivos = Array.isArray(sec?.data?.objetivos) ? sec.data!.objetivos! : [];
  for (const o of objetivos as Array<Record<string, unknown>>) {
    const metaNum = parseFirstNumber(o.meta);
    if (metaNum == null) continue; // omitimos los que no son parseables
    const nombre = (o.indicador as string) || (o.objetivo as string) || "Indicador";
    rows.push({
      cliente_id: clienteId,
      categoria: `${PLAN_PREFIX}${(o.perspectiva as string) || "General"}`,
      nombre: String(nombre).slice(0, 200),
      unidad: parseUnidad(o.meta, o.unidad),
      valor_meta: metaNum,
      valor_actual: null,
      semaforo: "rojo",
      observacion: `Fuente: Plan Estratégico · Meta original: ${o.meta ?? "—"}${o.responsable ? ` · Resp: ${o.responsable}` : ""}`,
    });
  }

  // --- SIDE (escala 1-5)
  const side = sides?.[0];
  if (side) {
    const dims: Array<[string, number | null]> = [
      ["IME", side.ime_score],
      ["COF", side.cof_score],
      ["IDF", side.idf_score],
      ["IVEE", side.ivee_score],
    ];
    for (const [k, v] of dims) {
      if (v == null) continue;
      const actual = Number(v);
      const { semaforo } = computeCumplimiento(5, actual);
      rows.push({
        cliente_id: clienteId,
        categoria: `${SIDE_PREFIX}${k}`,
        nombre: `Índice ${k}`,
        unidad: "/5",
        valor_meta: 5,
        valor_actual: actual,
        semaforo,
        observacion: "Fuente: SIDE · última sesión",
      });
    }
  }

  // Borrar previos sincronizados (Plan— / SIDE—) sin tocar KPIs manuales
  await supabase
    .from("cliente_kpis")
    .delete()
    .eq("cliente_id", clienteId)
    .or(`categoria.like.${PLAN_PREFIX}%,categoria.like.${SIDE_PREFIX}%`);

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("cliente_kpis").insert(rows);
  if (error) throw error;
  return rows.length;
}

export async function syncKpisVariosClientes(clienteIds: string[]): Promise<number> {
  let total = 0;
  for (const id of clienteIds) {
    try {
      total += await syncKpisCliente(id);
    } catch (e) {
      console.error("Sync KPIs falló para cliente", id, e);
    }
  }
  return total;
}
