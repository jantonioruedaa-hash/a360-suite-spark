import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CONTEXTO_SECCIONES } from "@/lib/coaching-instrumentos";

export function ContextoInstrumentado({
  datos, setDatos,
}: { datos: any; setDatos: (d: any) => void }) {
  const ctx = datos.contexto ?? {};
  const upd = (sec: string, campo: string, v: any) =>
    setDatos({ ...datos, contexto: { ...ctx, [sec]: { ...(ctx[sec] ?? {}), [campo]: v } } });

  const totalCampos = Object.values(CONTEXTO_SECCIONES).reduce((a, s) => a + s.campos.length, 0);
  const llenos = Object.entries(CONTEXTO_SECCIONES).reduce((acc, [secId, sec]) => {
    return acc + sec.campos.filter((c) => {
      const v = ctx[secId]?.[c.id];
      return v !== undefined && v !== "" && v !== null;
    }).length;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Mapeo de contexto del líder</span>
        <Badge variant="outline">{llenos} / {totalCampos} campos</Badge>
      </div>

      {Object.entries(CONTEXTO_SECCIONES).map(([secId, sec]) => (
        <div key={secId} className="border rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-semibold text-navy">{sec.titulo}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sec.campos.map((c) => {
              const val = ctx[secId]?.[c.id] ?? "";
              const colspan = c.tipo === "textarea" ? "md:col-span-2" : "";
              return (
                <div key={c.id} className={colspan}>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</Label>
                  {c.tipo === "textarea" ? (
                    <Textarea rows={2} value={val} onChange={(e) => upd(secId, c.id, e.target.value)} />
                  ) : c.tipo === "select" ? (
                    <select className="w-full text-sm border rounded p-2 bg-background"
                            value={val} onChange={(e) => upd(secId, c.id, e.target.value)}>
                      <option value="">— seleccionar —</option>
                      {(c as any).opciones?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : c.tipo === "scale" ? (
                    <div className="flex items-center gap-2">
                      <input type="range" min={1} max={10} value={val || 5}
                             onChange={(e) => upd(secId, c.id, Number(e.target.value))}
                             className="flex-1" />
                      <span className="font-mono text-sm w-6 text-right">{val || 5}</span>
                    </div>
                  ) : c.tipo === "number" ? (
                    <Input type="number" value={val} onChange={(e) => upd(secId, c.id, Number(e.target.value))} />
                  ) : (
                    <Input value={val} onChange={(e) => upd(secId, c.id, e.target.value)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
