import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RETOS_BANCO, type RetoCatalogo } from "@/lib/coaching-instrumentos";
import { CheckCircle2, Circle, Library, ChevronDown } from "lucide-react";

interface RetoActivo {
  id: string;
  reto_id?: string;
  titulo: string;
  dimension: string;
  dias: { texto: string; completado: boolean; reflexion?: string }[];
  reflexionFinal?: string;
  aprendizajeAgregado?: string;
}

export function RetoInstrumentado({
  datos, setDatos,
}: { datos: any; setDatos: (d: any) => void }) {
  const reto: RetoActivo | null = datos.reto_activo ?? null;
  const [showCatalogo, setShowCatalogo] = useState(!reto);

  const elegir = (r: RetoCatalogo) => {
    const nuevo: RetoActivo = {
      id: `r-${Date.now()}`,
      reto_id: r.id,
      titulo: r.titulo,
      dimension: r.dimension,
      dias: r.microRetos.map((m) => ({ texto: m, completado: false, reflexion: "" })),
      reflexionFinal: r.reflexionFinal,
      aprendizajeAgregado: "",
    };
    setDatos({ ...datos, reto_activo: nuevo });
    setShowCatalogo(false);
  };

  const updDia = (idx: number, patch: any) => {
    if (!reto) return;
    const dias = reto.dias.map((d, i) => i === idx ? { ...d, ...patch } : d);
    setDatos({ ...datos, reto_activo: { ...reto, dias } });
  };

  const updReto = (patch: Partial<RetoActivo>) => {
    if (!reto) return;
    setDatos({ ...datos, reto_activo: { ...reto, ...patch } });
  };

  const reiniciar = () => {
    if (!confirm("¿Cambiar de reto? Perderás el progreso actual.")) return;
    setDatos({ ...datos, reto_activo: null });
    setShowCatalogo(true);
  };

  const completados = reto?.dias.filter((d) => d.completado).length ?? 0;
  const totalDias = reto?.dias.length ?? 7;

  return (
    <div className="space-y-3">
      {reto && (
        <>
          <div className="border rounded-lg p-3 bg-muted/20">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Reto activo · {reto.dimension}</div>
                <h4 className="font-display text-lg text-navy">{reto.titulo}</h4>
              </div>
              <div className="text-right">
                <Badge className="bg-navy text-white">{completados} / {totalDias} días</Badge>
                <Button size="sm" variant="ghost" onClick={reiniciar} className="text-xs mt-1 block">Cambiar reto</Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {reto.dias.map((d, i) => (
              <div key={i} className={`border rounded-lg p-3 ${d.completado ? "bg-emerald-50/40 border-emerald-200" : "bg-background"}`}>
                <div className="flex items-start gap-2">
                  <button onClick={() => updDia(i, { completado: !d.completado })} className="mt-0.5 shrink-0">
                    {d.completado
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      : <Circle className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="text-sm font-medium">{d.texto}</div>
                    <Textarea rows={2} value={d.reflexion ?? ""} onChange={(e) => updDia(i, { reflexion: e.target.value })}
                              placeholder="Reflexión del día (5 min)" className="text-xs" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reto.reflexionFinal && (
            <div className="border-t pt-3 space-y-2">
              <Label className="text-xs font-semibold">Reflexión final del reto</Label>
              <p className="text-xs text-muted-foreground italic">{reto.reflexionFinal}</p>
              <Textarea rows={3} value={reto.aprendizajeAgregado ?? ""}
                        onChange={(e) => updReto({ aprendizajeAgregado: e.target.value })}
                        placeholder="Tu aprendizaje agregado de los 7 días" />
            </div>
          )}
        </>
      )}

      <Button size="sm" variant="outline" onClick={() => setShowCatalogo(s => !s)}>
        <Library className="w-3 h-3 mr-1" /> Banco de retos ({RETOS_BANCO.length})
        <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showCatalogo ? "rotate-180" : ""}`} />
      </Button>

      {showCatalogo && (
        <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
          {RETOS_BANCO.map((r) => (
            <div key={r.id} className="p-3 border rounded bg-background">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{r.titulo}</div>
                  <Badge variant="outline" className="text-[9px] mt-0.5">{r.dimension}</Badge>
                  <p className="text-[11px] text-muted-foreground mt-1">{r.proposito}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => elegir(r)}>Elegir</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
