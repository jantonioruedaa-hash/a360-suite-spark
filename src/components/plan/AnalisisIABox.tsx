import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Edit3, Save, RotateCw } from "lucide-react";
import { analizarSeccionPlan } from "@/lib/server-fns";
import { toast } from "sonner";

interface Props {
  clienteId: string;
  columna: string;
  seccionTitulo: string;
  contextoEmpresa?: string;
  datosSeccion: Record<string, unknown>;
  analisisActual?: string | null;
  analisisFecha?: string | null;
  onAnalisisGenerado?: (texto: string, fecha: string) => void;
}

export function AnalisisIABox({ clienteId, columna, seccionTitulo, contextoEmpresa, datosSeccion, analisisActual, analisisFecha, onAnalisisGenerado }: Props) {
  const [loading, setLoading] = useState(false);
  const [texto, setTexto] = useState(analisisActual ?? "");
  const [fecha, setFecha] = useState(analisisFecha ?? null);
  const [edit, setEdit] = useState(false);
  const fn = useServerFn(analizarSeccionPlan);

  const generar = async () => {
    setLoading(true);
    try {
      const r = await fn({ data: { clienteId, columna, seccionTitulo, contextoEmpresa, datosSeccion } });
      setTexto(r.analisis);
      setFecha(r.fecha);
      onAnalisisGenerado?.(r.analisis, r.fecha);
      toast.success("Análisis generado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar análisis");
    } finally { setLoading(false); }
  };

  const guardarEdicion = () => {
    setEdit(false);
    onAnalisisGenerado?.(texto, fecha ?? new Date().toISOString());
    toast.success("Análisis actualizado");
  };

  return (
    <div className="a360-card p-5 mt-6 border-l-4 border-gold">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <h3 className="font-display text-navy">Análisis IA — {seccionTitulo}</h3>
        </div>
        <div className="flex items-center gap-2">
          {texto && !edit && (
            <Button size="sm" variant="outline" onClick={() => setEdit(true)}><Edit3 className="w-3 h-3 mr-1" />Editar</Button>
          )}
          {texto && edit && (
            <Button size="sm" onClick={guardarEdicion} className="bg-navy hover:bg-navy/90"><Save className="w-3 h-3 mr-1" />Guardar</Button>
          )}
          <Button size="sm" onClick={generar} disabled={loading} className="bg-gold hover:bg-gold/90 text-navy">
            {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : texto ? <RotateCw className="w-3 h-3 mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            {loading ? "Generando…" : texto ? "Regenerar" : "Analizar con IA"}
          </Button>
        </div>
      </div>
      {fecha && <p className="text-[11px] text-muted-foreground mb-2">Generado: {new Date(fecha).toLocaleString()}</p>}
      {edit ? (
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={14} className="font-mono text-xs" />
      ) : texto ? (
        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{texto}</div>
      ) : (
        <p className="text-sm text-muted-foreground">Aún no hay análisis. Completa la sección y pulsa <span className="font-semibold">Analizar con IA</span> para generar análisis, riesgos, recomendaciones y preguntas reflexivas.</p>
      )}
    </div>
  );
}
