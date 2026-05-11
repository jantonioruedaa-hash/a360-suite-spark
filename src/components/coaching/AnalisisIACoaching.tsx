import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Edit3, Save, RotateCw, Brain } from "lucide-react";
import { analizarSesionCoaching } from "@/server/coaching-ia.functions";
import { toast } from "sonner";


interface Props {
  sesionId: string;
  herramientaNombre: string;
  herramientaProposito: string;
  etapa: string;
  datosSesion: Record<string, unknown>;
  contextoCliente?: string;
  analisisActual?: string | null;
  analisisFecha?: string | null;
  onAnalisisGenerado?: (texto: string, fecha: string) => void;
}

export function AnalisisIACoaching({
  sesionId, herramientaNombre, herramientaProposito, etapa,
  datosSesion, contextoCliente, analisisActual, analisisFecha, onAnalisisGenerado,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [texto, setTexto] = useState(analisisActual ?? "");
  const [fecha, setFecha] = useState(analisisFecha ?? null);
  const [edit, setEdit] = useState(false);
  const fn = useServerFn(analizarSesionCoaching);

  const generar = async () => {
    setLoading(true);
    try {
      const r = await fn({
        data: {
          sesionId,
          herramientaNombre,
          herramientaProposito,
          etapa,
          datosSesion,
          contextoCliente,
        },
      });
      setTexto(r.analisis);
      setFecha(r.fecha);
      onAnalisisGenerado?.(r.analisis, r.fecha);
      toast.success("Análisis generado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar análisis");
    } finally {
      setLoading(false);
    }
  };

  const guardarEdicion = () => {
    setEdit(false);
    onAnalisisGenerado?.(texto, fecha ?? new Date().toISOString());
    toast.success("Análisis actualizado");
  };

  return (
    <div className="rounded-lg border-l-4 border-gold bg-gold/5 p-4 mt-3">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-gold" />
          <h3 className="font-display text-sm text-navy">Análisis IA — Coach senior A360</h3>
        </div>
        <div className="flex items-center gap-2">
          {texto && !edit && (
            <Button size="sm" variant="outline" onClick={() => setEdit(true)}>
              <Edit3 className="w-3 h-3 mr-1" /> Editar
            </Button>
          )}
          {texto && edit && (
            <Button size="sm" onClick={guardarEdicion} className="bg-navy hover:bg-navy/90 text-white">
              <Save className="w-3 h-3 mr-1" /> Guardar
            </Button>
          )}
          <Button
            size="sm"
            onClick={generar}
            disabled={loading || Object.keys(datosSesion ?? {}).length === 0}
            className="bg-gold hover:bg-gold/90 text-navy"
          >
            {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> :
              texto ? <RotateCw className="w-3 h-3 mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            {loading ? "Analizando…" : texto ? "Regenerar" : "Analizar con IA"}
          </Button>
        </div>
      </div>
      {fecha && <p className="text-[10px] text-muted-foreground mb-1">Generado: {new Date(fecha).toLocaleString()}</p>}
      {edit ? (
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={14} className="font-mono text-xs" />
      ) : texto ? (
        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{texto}</div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Completa el registro y pulsa <span className="font-semibold">Analizar con IA</span> para obtener
          lectura clínica, patrones, riesgos, recomendaciones, preguntas poderosas e indicador de avance.
        </p>
      )}
    </div>
  );
}
