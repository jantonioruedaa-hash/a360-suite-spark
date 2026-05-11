import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { analizarReporteSesion } from "@/server/sesion-ia.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  actividadId: string;
  contextoCliente?: string;
  initialAnalisis?: string | null;
  initialFecha?: string | null;
  onSaved?: (analisis: string, fecha: string) => void;
}

export function AnalisisIASesion({ actividadId, contextoCliente, initialAnalisis, initialFecha, onSaved }: Props) {
  const analizar = useServerFn(analizarReporteSesion);
  const [loading, setLoading] = useState(false);
  const [analisis, setAnalisis] = useState<string | null>(initialAnalisis ?? null);
  const [fecha, setFecha] = useState<string | null>(initialFecha ?? null);

  const run = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
      const r = await analizar({ data: { actividadId, contextoCliente, accessToken: session.access_token } });
      setAnalisis(r.analisis);
      setFecha(r.fecha);
      onSaved?.(r.analisis, r.fecha);
      toast.success("Análisis IA generado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar análisis");
    } finally {
      setLoading(false);
    }
  };

  if (!analisis) {
    return (
      <Button size="sm" variant="outline" onClick={run} disabled={loading}>
        <Sparkles className="w-3 h-3 mr-1" /> {loading ? "Analizando…" : "Analizar con IA"}
      </Button>
    );
  }

  return (
    <div className="mt-3 p-4 bg-cream rounded border-l-2 border-gold">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="font-semibold text-navy text-sm">Análisis IA de la sesión</span>
          {fecha && <span className="text-xs text-muted-foreground">· {new Date(fecha).toLocaleString()}</span>}
        </div>
        <Button size="sm" variant="ghost" onClick={run} disabled={loading}>
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} /> Regenerar
        </Button>
      </div>
      <div className="prose prose-sm max-w-none text-navy whitespace-pre-wrap text-sm">{analisis}</div>
    </div>
  );
}
