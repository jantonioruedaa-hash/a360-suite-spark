import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Check } from "lucide-react";

// Hook de autosave cada 30s + debounced (5s) para una sección concreta del plan.
export function usePlanSeccionAutosave<T extends Record<string, unknown>>(opts: {
  clienteId: string;
  columna: string;
  data: T;
  analisis_ia?: string | null;
  analisis_ia_fecha?: string | null;
}) {
  const { clienteId, columna, data, analisis_ia, analisis_ia_fecha } = opts;
  const [estado, setEstado] = useState<"idle" | "guardando" | "guardado" | "error">("idle");
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null);
  const ultimaSerie = useRef<string>("");

  const guardar = useCallback(async (forced = false) => {
    const serial = JSON.stringify({ data, analisis_ia, analisis_ia_fecha });
    if (!forced && serial === ultimaSerie.current) return;
    setEstado("guardando");
    try {
      const sb = supabase as unknown as {
        from: (t: string) => {
          select: (s: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { id: string } | null }> } };
          update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
          insert: (v: Record<string, unknown>) => Promise<{ error: unknown }>;
        };
      };
      const { data: existing } = await sb.from("planes_estrategicos")
        .select("id").eq("cliente_id", clienteId).maybeSingle();
      const valor = { data, analisis_ia: analisis_ia ?? null, analisis_ia_fecha: analisis_ia_fecha ?? null, completado: !!analisis_ia };
      if (existing?.id) {
        await sb.from("planes_estrategicos")
          .update({ [columna]: valor, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await sb.from("planes_estrategicos").insert({ cliente_id: clienteId, [columna]: valor });
      }
      ultimaSerie.current = serial;
      setUltimoGuardado(new Date());
      setEstado("guardado");
      setTimeout(() => setEstado((s) => s === "guardado" ? "idle" : s), 2000);
    } catch {
      setEstado("error");
    }
  }, [clienteId, columna, data, analisis_ia, analisis_ia_fecha]);

  // Debounced save 2s después de cambios (reducido de 5s para minimizar pérdida al navegar)
  useEffect(() => {
    const t = setTimeout(() => { guardar(); }, 2000);
    return () => clearTimeout(t);
  }, [guardar]);

  // Forzado cada 30s
  useEffect(() => {
    const i = setInterval(() => { guardar(); }, 30000);
    return () => clearInterval(i);
  }, [guardar]);

  return { estado, ultimoGuardado, guardarAhora: () => guardar(true) };
}

export function AutosaveBadge({ estado, ultimoGuardado }: { estado: string; ultimoGuardado: Date | null }) {
  return (
    <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
      {estado === "guardando" && <><Save className="w-3 h-3 animate-pulse" /> Guardando…</>}
      {estado === "guardado" && <><Check className="w-3 h-3 text-green-600" /> Guardado</>}
      {estado === "error" && <span className="text-red-600">Error al guardar</span>}
      {estado === "idle" && ultimoGuardado && <>Último guardado: {ultimoGuardado.toLocaleTimeString()}</>}
      {estado === "idle" && !ultimoGuardado && <>Autosave activo</>}
    </div>
  );
}
