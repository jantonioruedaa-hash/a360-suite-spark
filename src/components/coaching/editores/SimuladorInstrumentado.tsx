import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DILEMAS_BANCO, CATEGORIAS_DILEMAS, type DilemaCatalogo } from "@/lib/coaching-instrumentos";
import { Plus, X, Library, ChevronDown, Clock } from "lucide-react";

interface BitacoraDilema {
  id: string;
  dilema_id?: string;
  titulo: string;
  contexto: string;
  dilema: string;
  rubricaIdeal?: string;
  trampaTipica?: string;
  respuestaInmediata: string;
  segundosTomados?: number;
  justificacion: string;
  coherenciaManifiesto?: number; // 1-5
  aprendizaje: string;
}

export function SimuladorInstrumentado({
  datos, setDatos,
}: { datos: any; setDatos: (d: any) => void }) {
  const items: BitacoraDilema[] = Array.isArray(datos.dilemas) ? datos.dilemas : [];
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [filtro, setFiltro] = useState<string>("all");

  const sync = (n: BitacoraDilema[]) => setDatos({ ...datos, dilemas: n });

  const añadirDelBanco = (d: DilemaCatalogo) => {
    sync([...items, {
      id: `b-${Date.now()}`,
      dilema_id: d.id,
      titulo: d.titulo,
      contexto: d.contexto,
      dilema: d.dilema,
      rubricaIdeal: d.rubricaIdeal,
      trampaTipica: d.trampaTipica,
      respuestaInmediata: "",
      justificacion: "",
      aprendizaje: "",
      coherenciaManifiesto: 3,
    }]);
  };

  const añadirCustom = () => {
    sync([...items, {
      id: `c-${Date.now()}`, titulo: "", contexto: "", dilema: "",
      respuestaInmediata: "", justificacion: "", aprendizaje: "",
      coherenciaManifiesto: 3,
    }]);
  };

  const quitar = (id: string) => sync(items.filter((i) => i.id !== id));
  const upd = (id: string, p: Partial<BitacoraDilema>) =>
    sync(items.map((i) => i.id === id ? { ...i, ...p } : i));

  const coherenciaProm = items.length
    ? items.reduce((a, b) => a + (b.coherenciaManifiesto ?? 0), 0) / items.length
    : 0;

  const filtrados = filtro === "all" ? DILEMAS_BANCO : DILEMAS_BANCO.filter((d) => d.categoria === filtro);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Dilemas trabajados</div>
          <div className="font-display text-xl text-navy">{items.length}</div>
        </div>
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Coherencia con manifiesto</div>
          <div className="font-display text-xl text-navy">{coherenciaProm.toFixed(1)}/5</div>
        </div>
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Categorías cubiertas</div>
          <div className="font-display text-xl text-navy">
            {new Set(items.map(i => DILEMAS_BANCO.find(d => d.id === i.dilema_id)?.categoria).filter(Boolean)).size}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowCatalogo(s => !s)}>
          <Library className="w-3 h-3 mr-1" /> Banco de dilemas ({DILEMAS_BANCO.length})
          <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showCatalogo ? "rotate-180" : ""}`} />
        </Button>
        <Button size="sm" onClick={añadirCustom} className="bg-navy hover:bg-navy/90">
          <Plus className="w-3 h-3 mr-1" /> Crear dilema custom
        </Button>
      </div>

      {showCatalogo && (
        <div className="border rounded-lg p-3 bg-muted/20 space-y-2 max-h-80 overflow-y-auto">
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setFiltro("all")}
              className={`text-[10px] px-2 py-0.5 rounded-full border ${filtro === "all" ? "bg-navy text-white" : ""}`}>
              Todas
            </button>
            {CATEGORIAS_DILEMAS.map((c) => (
              <button key={c.id} onClick={() => setFiltro(c.id)}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${filtro === c.id ? "bg-navy text-white" : ""}`}>
                {c.nombre}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            {filtrados.map((d) => {
              const ya = items.some((i) => i.dilema_id === d.id);
              const cat = CATEGORIAS_DILEMAS.find((c) => c.id === d.categoria);
              return (
                <div key={d.id} className="p-2 rounded border bg-background">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{d.titulo}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{d.contexto.slice(0, 120)}…</div>
                      <div className="flex gap-1 mt-1">
                        {cat && <Badge variant="outline" className="text-[9px]">{cat.nombre}</Badge>}
                        <Badge variant="outline" className="text-[9px]">
                          <Clock className="w-2 h-2 mr-0.5" /> Presión {d.presionTiempo}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant={ya ? "ghost" : "outline"} disabled={ya} onClick={() => añadirDelBanco(d)}>
                      {ya ? "Añadido" : <><Plus className="w-3 h-3 mr-1" /> Aplicar</>}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-4">
          Selecciona dilemas del banco o crea uno calibrado al perfil del líder.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={it.id} className="border rounded-lg p-3 space-y-2 bg-background">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Dilema #{idx + 1}</Label>
                  <Input value={it.titulo} onChange={(e) => upd(it.id, { titulo: e.target.value })} className="font-medium" />
                </div>
                <Button size="sm" variant="ghost" onClick={() => quitar(it.id)} className="text-red-500">
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Contexto</Label>
                <Textarea rows={2} value={it.contexto} onChange={(e) => upd(it.id, { contexto: e.target.value })} />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pregunta del dilema</Label>
                <Textarea rows={2} value={it.dilema} onChange={(e) => upd(it.id, { dilema: e.target.value })} />
              </div>

              {(it.rubricaIdeal || it.trampaTipica) && (
                <details className="text-[11px] text-muted-foreground bg-muted/20 rounded p-2">
                  <summary className="cursor-pointer font-semibold">Rúbrica del coach</summary>
                  {it.rubricaIdeal && <div className="mt-1"><span className="text-emerald-700 font-semibold">Ideal:</span> {it.rubricaIdeal}</div>}
                  {it.trampaTipica && <div className="mt-1"><span className="text-red-600 font-semibold">Trampa:</span> {it.trampaTipica}</div>}
                </details>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="md:col-span-2">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Respuesta inmediata del líder</Label>
                  <Textarea rows={2} value={it.respuestaInmediata}
                            onChange={(e) => upd(it.id, { respuestaInmediata: e.target.value })}
                            placeholder="Lo que dijo en los primeros segundos" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Segundos tomados</Label>
                  <Input type="number" value={it.segundosTomados ?? ""}
                         onChange={(e) => upd(it.id, { segundosTomados: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Justificación posterior</Label>
                <Textarea rows={2} value={it.justificacion}
                          onChange={(e) => upd(it.id, { justificacion: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Coherencia con manifiesto (1-5)</Label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={1} max={5} value={it.coherenciaManifiesto ?? 3}
                           onChange={(e) => upd(it.id, { coherenciaManifiesto: Number(e.target.value) })}
                           className="flex-1" />
                    <span className="font-mono text-sm w-6 text-right">{it.coherenciaManifiesto ?? 3}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Aprendizaje principal</Label>
                <Textarea rows={2} value={it.aprendizaje}
                          onChange={(e) => upd(it.id, { aprendizaje: e.target.value })}
                          placeholder="Qué se llevó el líder de este dilema" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
