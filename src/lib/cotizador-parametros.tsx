import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CotizadorParametros = {
  tarifa_coaching: number;
  tarifa_consultoria_estrategica: number;
  factor_tamano_pequena: number;
  factor_tamano_mediana: number;
  factor_tamano_grande: number;
  factor_segmento_esencial: number;
  factor_segmento_profesional: number;
  factor_segmento_corporativo: number;
  factor_segmento_premium: number;
  descuento_anual_plataforma_pct: number;
  descuento_prepago_guiado_pct: number;
  descuento_prepago_acompanado_pct: number;
  descuento_prepago_advisory_pct: number;
};

export const COTIZADOR_DEFAULTS: CotizadorParametros = {
  tarifa_coaching: 125,
  tarifa_consultoria_estrategica: 165,
  factor_tamano_pequena: 0.6,
  factor_tamano_mediana: 1.0,
  factor_tamano_grande: 1.5,
  factor_segmento_esencial: 0.6,
  factor_segmento_profesional: 0.65,
  factor_segmento_corporativo: 1.0,
  factor_segmento_premium: 1.0,
  descuento_anual_plataforma_pct: 15,
  descuento_prepago_guiado_pct: 8,
  descuento_prepago_acompanado_pct: 12,
  descuento_prepago_advisory_pct: 15,
};

export function useCotizadorParametros() {
  const [parametros, setParametros] = useState<CotizadorParametros>(COTIZADOR_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("cotizador_parametros")
      .select("*")
      .eq("id", "global")
      .maybeSingle();
    if (!error && data) {
      const parsed: CotizadorParametros = {} as CotizadorParametros;
      for (const key of Object.keys(COTIZADOR_DEFAULTS) as (keyof CotizadorParametros)[]) {
        parsed[key] = data[key] !== undefined ? Number(data[key]) : COTIZADOR_DEFAULTS[key];
      }
      setParametros(parsed);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async (patch: Partial<CotizadorParametros>): Promise<{ error: string | null }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("cotizador_parametros")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", "global")
      .select()
      .maybeSingle();
    if (error) return { error: error.message };
    if (data) {
      const parsed: CotizadorParametros = {} as CotizadorParametros;
      for (const key of Object.keys(COTIZADOR_DEFAULTS) as (keyof CotizadorParametros)[]) {
        parsed[key] = data[key] !== undefined ? Number(data[key]) : COTIZADOR_DEFAULTS[key];
      }
      setParametros(parsed);
    }
    return { error: null };
  }, []);

  return { parametros, loading, refresh: load, save };
}
