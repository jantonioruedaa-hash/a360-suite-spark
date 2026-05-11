import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DIMENSIONES_MANIFIESTO } from "@/lib/coaching-instrumentos";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function ManifiestoInstrumentado({
  datos, setDatos,
}: { datos: any; setDatos: (d: any) => void }) {
  const m = datos.manifiesto ?? {};
  const firmado = !!datos.firmado_por;

  const upd = (k: string, patch: any) =>
    setDatos({ ...datos, manifiesto: { ...m, [k]: { ...(m[k] ?? {}), ...patch } } });

  const completado = (val: string | undefined) => !!val && val.length > 25;
  const compromisosLlenos = DIMENSIONES_MANIFIESTO.filter((d) => completado(m[d.id]?.compromiso)).length;

  const compromisoMedio = DIMENSIONES_MANIFIESTO.reduce(
    (acc, d) => acc + (Number(m[d.id]?.nivel) || 0), 0
  ) / DIMENSIONES_MANIFIESTO.length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Dimensiones</div>
          <div className="font-display text-xl text-navy">{compromisosLlenos}/5</div>
        </div>
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Compromiso medio</div>
          <div className="font-display text-xl text-navy">{compromisoMedio.toFixed(1)}/5</div>
        </div>
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Estado</div>
          <div className="font-display text-sm mt-1">
            {firmado ? <Badge className="bg-emerald-600">Firmado</Badge> : <Badge variant="outline">Borrador</Badge>}
          </div>
        </div>
      </div>

      {DIMENSIONES_MANIFIESTO.map((d) => {
        const item = m[d.id] ?? {};
        const ok = completado(item.compromiso);
        return (
          <div key={d.id} className="border rounded-lg p-3 space-y-2 bg-background">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-navy flex items-center gap-1">
                  {ok ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                  {d.nombre}
                </h4>
                <p className="text-[11px] text-muted-foreground">{d.pregunta}</p>
              </div>
            </div>

            <details className="text-[11px] text-muted-foreground bg-muted/20 rounded p-2">
              <summary className="cursor-pointer font-semibold">Ver ejemplos buenos vs malos</summary>
              <div className="mt-1 space-y-1">
                <div><span className="text-emerald-700 font-semibold">✓</span> {d.ejemploBueno}</div>
                <div><span className="text-red-600 font-semibold">✗</span> {d.ejemploMalo}</div>
                <div className="italic mt-1">Validador: {d.validador}</div>
              </div>
            </details>

            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Compromiso accionable</Label>
              <Textarea rows={2} value={item.compromiso ?? ""}
                        onChange={(e) => upd(d.id, { compromiso: e.target.value })}
                        placeholder="Cuándo, qué, con quién, observable…" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Testigo</Label>
                <Input value={item.testigo ?? ""} onChange={(e) => upd(d.id, { testigo: e.target.value })}
                       placeholder="Quién verá si lo cumples" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Compromiso (1-5)</Label>
                <div className="flex items-center gap-2">
                  <input type="range" min={1} max={5} value={item.nivel ?? 3}
                         onChange={(e) => upd(d.id, { nivel: Number(e.target.value) })}
                         className="flex-1" />
                  <span className="font-mono text-sm w-6 text-right">{item.nivel ?? 3}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Firma */}
      <div className="border-t pt-3 grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Firmado por (líder)</Label>
          <Input value={datos.firmado_por ?? ""} onChange={(e) => setDatos({ ...datos, firmado_por: e.target.value })}
                 placeholder="Nombre completo" />
        </div>
        <div>
          <Label className="text-xs">Fecha</Label>
          <Input type="date" value={datos.firmado_fecha ?? ""}
                 onChange={(e) => setDatos({ ...datos, firmado_fecha: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
