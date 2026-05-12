import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Loader2, Edit3, Save, RotateCw, Sparkles } from "lucide-react";
import { sintetizarProgramaCoaching } from "@/lib/coaching-ia.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


export function SintesisProgramaIA({
  clienteId, contextoCliente, sintesisInicial, fechaInicial, onGuardar,
}: {
  clienteId: string;
  contextoCliente?: string;
  sintesisInicial?: string | null;
  fechaInicial?: string | null;
  onGuardar?: (texto: string, fecha: string) => void;
}) {
  const [texto, setTexto] = useState(sintesisInicial ?? "");
  const [fecha, setFecha] = useState(fechaInicial ?? null);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(false);
  const fn = useServerFn(sintetizarProgramaCoaching);

  const generar = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
      const r = await fn({ data: { clienteId, contextoCliente, accessToken: session.access_token } });
      if (r.error || !r.sintesis || !r.fecha) throw new Error(r.error ?? "Error al generar síntesis");
      setTexto(r.sintesis);
      setFecha(r.fecha);
      onGuardar?.(r.sintesis, r.fecha);
      toast.success("Síntesis del programa generada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar síntesis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-navy/20 bg-gradient-to-br from-navy/5 to-gold/5 p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-navy" />
          <h3 className="font-display text-navy">Síntesis IA del programa completo</h3>
        </div>
        <div className="flex items-center gap-2">
          {texto && !edit && (
            <Button size="sm" variant="outline" onClick={() => setEdit(true)}><Edit3 className="w-3 h-3 mr-1" />Editar</Button>
          )}
          {texto && edit && (
            <Button size="sm" onClick={() => { setEdit(false); onGuardar?.(texto, fecha ?? new Date().toISOString()); }} className="bg-navy hover:bg-navy/90 text-white">
              <Save className="w-3 h-3 mr-1" />Guardar
            </Button>
          )}
          <Button size="sm" onClick={generar} disabled={loading} className="bg-gold hover:bg-gold/90 text-navy">
            {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> :
              texto ? <RotateCw className="w-3 h-3 mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            {loading ? "Sintetizando…" : texto ? "Regenerar" : "Generar síntesis"}
          </Button>
        </div>
      </div>
      {fecha && <p className="text-[11px] text-muted-foreground mb-2">Generado: {new Date(fecha).toLocaleString()}</p>}
      {edit ? (
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={20} className="font-mono text-xs" />
      ) : texto ? (
        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{texto}</div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Genera la síntesis ejecutiva del programa: línea base, hilos de transformación, brechas, delta del Radar, recomendaciones y mensaje al sponsor.
        </p>
      )}
    </div>
  );
}
