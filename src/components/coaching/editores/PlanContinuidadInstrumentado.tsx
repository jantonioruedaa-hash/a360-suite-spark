import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  FASES_CONTINUIDAD_INSTRUMENTO,
  PLAN_FILAS_EJEMPLO,
  type FilaCompromiso,
} from "@/lib/coaching-instrumentos";
import { Plus, Trash2, Sparkles, Library } from "lucide-react";

export function PlanContinuidadInstrumentado({
  datos, setDatos,
}: { datos: any; setDatos: (d: any) => void }) {
  const filas: FilaCompromiso[] = datos.filas ?? [];

  const upd = (id: string, patch: Partial<FilaCompromiso>) =>
    setDatos({ ...datos, filas: filas.map((f) => f.id === id ? { ...f, ...patch } : f) });

  const add = (fase: string) => {
    const nueva: FilaCompromiso = {
      id: `c-${Date.now()}`,
      fase, actividad: "", accion: "", responsable: "Líder", testigo: "",
      fechaLimite: "", indicadorExito: "", estado: "pendiente",
    };
    setDatos({ ...datos, filas: [...filas, nueva] });
  };

  const del = (id: string) => setDatos({ ...datos, filas: filas.filter((f) => f.id !== id) });

  const cargarEjemplos = () => {
    if (filas.length > 0 && !confirm("Esto agregará 8 filas de ejemplo a tu plan. ¿Continuar?")) return;
    const ejemplos: FilaCompromiso[] = PLAN_FILAS_EJEMPLO.map((e, i) => ({
      ...e, id: `e-${Date.now()}-${i}`,
    }));
    setDatos({ ...datos, filas: [...filas, ...ejemplos] });
  };

  const totales = {
    pendiente: filas.filter((f) => f.estado === "pendiente").length,
    enCurso: filas.filter((f) => f.estado === "en-curso").length,
    logrado: filas.filter((f) => f.estado === "logrado").length,
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
          <div className="font-display text-xl text-navy">{filas.length}</div>
        </div>
        <div className="bg-amber-50 border rounded p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pendientes</div>
          <div className="font-display text-xl text-amber-700">{totales.pendiente}</div>
        </div>
        <div className="bg-blue-50 border rounded p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">En curso</div>
          <div className="font-display text-xl text-blue-700">{totales.enCurso}</div>
        </div>
        <div className="bg-emerald-50 border rounded p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Logrados</div>
          <div className="font-display text-xl text-emerald-700">{totales.logrado}</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Plan de 90 días en formato tabla por fase. Carga la plantilla y ajusta a tu líder.
        </p>
        <Button size="sm" variant="outline" onClick={cargarEjemplos}>
          <Library className="w-3 h-3 mr-1" /> Cargar ejemplos
        </Button>
      </div>

      {FASES_CONTINUIDAD_INSTRUMENTO.map((fase) => {
        const filasFase = filas.filter((f) => f.fase === fase.id);
        return (
          <div key={fase.id} className="border rounded-lg p-3 space-y-2 bg-background">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-navy">{fase.titulo}</h4>
                <Badge variant="outline" className="text-[10px] mt-0.5">{fase.ventana}</Badge>
              </div>
              <Button size="sm" variant="outline" onClick={() => add(fase.id)}>
                <Plus className="w-3 h-3 mr-1" /> Compromiso
              </Button>
            </div>

            <details className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded">
              <summary className="cursor-pointer font-semibold">
                <Sparkles className="inline w-3 h-3 mr-1" />
                Preguntas guía e hitos sugeridos
              </summary>
              <div className="mt-1 space-y-1">
                <div>
                  <span className="font-semibold">Preguntas:</span>
                  <ul className="list-disc pl-4">
                    {fase.preguntasPlan.map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold">Hitos sugeridos:</span>
                  <ul className="list-disc pl-4">
                    {fase.hitosSugeridos.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              </div>
            </details>

            {filasFase.length === 0 ? (
              <p className="text-xs italic text-muted-foreground py-2">Sin compromisos en esta fase aún.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/30 text-left">
                      <th className="p-1.5 border w-[18%]">Actividad</th>
                      <th className="p-1.5 border w-[28%]">Acción concreta</th>
                      <th className="p-1.5 border w-[10%]">Responsable</th>
                      <th className="p-1.5 border w-[10%]">Testigo</th>
                      <th className="p-1.5 border w-[10%]">Fecha</th>
                      <th className="p-1.5 border w-[18%]">Indicador de éxito</th>
                      <th className="p-1.5 border w-[6%]">Estado</th>
                      <th className="p-1.5 border w-[2%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasFase.map((f) => (
                      <tr key={f.id} className="align-top">
                        <td className="border p-0.5">
                          <Textarea rows={2} value={f.actividad} onChange={(e) => upd(f.id, { actividad: e.target.value })} className="text-xs min-h-[40px] border-0" placeholder="Actividad…" />
                        </td>
                        <td className="border p-0.5">
                          <Textarea rows={2} value={f.accion} onChange={(e) => upd(f.id, { accion: e.target.value })} className="text-xs min-h-[40px] border-0" placeholder="Verbo + qué + cuándo + cómo…" />
                        </td>
                        <td className="border p-0.5">
                          <Input value={f.responsable} onChange={(e) => upd(f.id, { responsable: e.target.value })} className="text-xs h-8 border-0" />
                        </td>
                        <td className="border p-0.5">
                          <Input value={f.testigo} onChange={(e) => upd(f.id, { testigo: e.target.value })} className="text-xs h-8 border-0" placeholder="Quién verifica" />
                        </td>
                        <td className="border p-0.5">
                          <Input type="date" value={f.fechaLimite} onChange={(e) => upd(f.id, { fechaLimite: e.target.value })} className="text-xs h-8 border-0" />
                        </td>
                        <td className="border p-0.5">
                          <Textarea rows={2} value={f.indicadorExito} onChange={(e) => upd(f.id, { indicadorExito: e.target.value })} className="text-xs min-h-[40px] border-0" placeholder="Observable / medible…" />
                        </td>
                        <td className="border p-0.5">
                          <select value={f.estado}
                                  onChange={(e) => upd(f.id, { estado: e.target.value as FilaCompromiso["estado"] })}
                                  className="text-xs h-8 w-full bg-background">
                            <option value="pendiente">Pendiente</option>
                            <option value="en-curso">En curso</option>
                            <option value="logrado">Logrado</option>
                            <option value="ajustado">Ajustado</option>
                          </select>
                        </td>
                        <td className="border p-0.5 text-center">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => del(f.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
