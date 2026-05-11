import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { REPORTE_SECCIONES } from "@/lib/coaching-instrumentos";
import { CheckCircle2, AlertCircle, FileText } from "lucide-react";

export function ReporteTransformacionInstrumentado({
  datos, setDatos,
}: { datos: any; setDatos: (d: any) => void }) {
  const secciones = datos.secciones ?? {};
  const upd = (id: string, v: string) => setDatos({ ...datos, secciones: { ...secciones, [id]: v } });

  const cargarPlantilla = () => {
    if (Object.keys(secciones).length > 0 && !confirm("Reemplazará el contenido actual con los ejemplos guía. ¿Continuar?")) return;
    const inicial: Record<string, string> = {};
    REPORTE_SECCIONES.forEach((s) => { inicial[s.id] = s.ejemplo; });
    setDatos({ ...datos, secciones: inicial });
  };

  const llenas = REPORTE_SECCIONES.filter((s) => (secciones[s.id] ?? "").length > 30).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-navy" />
          <span className="text-sm font-semibold text-navy">Reporte de transformación</span>
          <Badge variant="outline" className="text-[10px]">{llenas} / {REPORTE_SECCIONES.length} secciones</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={cargarPlantilla}>
          Cargar plantilla con ejemplos
        </Button>
      </div>

      {REPORTE_SECCIONES.map((s) => {
        const v = secciones[s.id] ?? "";
        const ok = v.length > 30;
        return (
          <div key={s.id} className="border rounded-lg p-3 space-y-2 bg-background">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1">
                {ok ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                <Label className="text-sm font-semibold text-navy">{s.titulo}</Label>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground italic">{s.guia}</p>
            <details className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded">
              <summary className="cursor-pointer font-semibold">Ver ejemplo</summary>
              <p className="mt-1 italic">"{s.ejemplo}"</p>
            </details>
            <Textarea rows={3} value={v} onChange={(e) => upd(s.id, e.target.value)}
                      placeholder="Redacta esta sección…" />
          </div>
        );
      })}

      <div className="bg-gold/10 border border-gold/30 rounded p-3 text-xs">
        <p className="font-semibold text-navy mb-1">Cierre del reporte</p>
        <p className="text-muted-foreground">
          Una vez completas las 8 secciones, usa el botón <span className="font-semibold">Analizar con IA</span> de abajo para que el coach senior A360 genere una síntesis ejecutiva final en lenguaje del sponsor.
        </p>
      </div>
    </div>
  );
}
