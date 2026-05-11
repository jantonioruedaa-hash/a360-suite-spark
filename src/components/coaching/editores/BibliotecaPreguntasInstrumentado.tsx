import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PREGUNTAS_PODEROSAS, type PreguntaPoderosa } from "@/lib/coaching-instrumentos";
import { Star, StarOff, Search } from "lucide-react";

const DIMS: { id: PreguntaPoderosa["dimension"]; nombre: string; color: string }[] = [
  { id: "vision", nombre: "Visión", color: "#7F77DD" },
  { id: "decision", nombre: "Decisión", color: "#1D9E75" },
  { id: "influencia", nombre: "Influencia", color: "#BA7517" },
  { id: "ejecucion", nombre: "Ejecución", color: "#D85A30" },
  { id: "resiliencia", nombre: "Resiliencia", color: "#5B9BD5" },
  { id: "consciencia", nombre: "Auto-consciencia", color: "#A04668" },
];

interface PreguntaTrabajada {
  id: string;
  texto: string;
  dimension: string;
  fechaUso: string;
  respuestaLider: string;
  observacionCoach: string;
}

export function BibliotecaPreguntasInstrumentado({
  datos, setDatos,
}: { datos: any; setDatos: (d: any) => void }) {
  const [filtroDim, setFiltroDim] = useState<string>("");
  const [filtroInt, setFiltroInt] = useState<number>(0);
  const [busqueda, setBusqueda] = useState("");
  const favoritos: string[] = datos.favoritos ?? [];
  const trabajadas: PreguntaTrabajada[] = datos.trabajadas ?? [];

  const filtradas = useMemo(() => PREGUNTAS_PODEROSAS.filter((p) => {
    if (filtroDim && p.dimension !== filtroDim) return false;
    if (filtroInt && p.intensidad !== filtroInt) return false;
    if (busqueda && !p.texto.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  }), [filtroDim, filtroInt, busqueda]);

  const togFav = (id: string) => {
    const next = favoritos.includes(id) ? favoritos.filter((x) => x !== id) : [...favoritos, id];
    setDatos({ ...datos, favoritos: next });
  };

  const trabajar = (p: PreguntaPoderosa) => {
    const nueva: PreguntaTrabajada = {
      id: `t-${Date.now()}`,
      texto: p.texto, dimension: p.dimension,
      fechaUso: new Date().toISOString().slice(0, 10),
      respuestaLider: "", observacionCoach: "",
    };
    setDatos({ ...datos, trabajadas: [nueva, ...trabajadas] });
  };

  const updTrab = (id: string, patch: Partial<PreguntaTrabajada>) => {
    setDatos({ ...datos, trabajadas: trabajadas.map((t) => t.id === id ? { ...t, ...patch } : t) });
  };

  const delTrab = (id: string) => {
    setDatos({ ...datos, trabajadas: trabajadas.filter((t) => t.id !== id) });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Catálogo</div>
          <div className="font-display text-xl text-navy">{PREGUNTAS_PODEROSAS.length}</div>
        </div>
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Favoritas</div>
          <div className="font-display text-xl text-navy">{favoritos.length}</div>
        </div>
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trabajadas</div>
          <div className="font-display text-xl text-navy">{trabajadas.length}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3 h-3 absolute left-2 top-2.5 text-muted-foreground" />
          <Input className="pl-7 h-8 text-xs" placeholder="Buscar pregunta…"
                 value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <select className="text-xs border rounded h-8 px-2 bg-background"
                value={filtroDim} onChange={(e) => setFiltroDim(e.target.value)}>
          <option value="">Todas las dimensiones</option>
          {DIMS.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
        </select>
        <select className="text-xs border rounded h-8 px-2 bg-background"
                value={filtroInt} onChange={(e) => setFiltroInt(Number(e.target.value))}>
          <option value={0}>Toda intensidad</option>
          <option value={1}>1 · abre</option>
          <option value={2}>2 · desafía</option>
          <option value={3}>3 · confronta</option>
        </select>
      </div>

      {/* Lista */}
      <div className="border rounded-lg divide-y max-h-[280px] overflow-y-auto">
        {filtradas.map((p) => {
          const dim = DIMS.find((d) => d.id === p.dimension);
          const fav = favoritos.includes(p.id);
          return (
            <div key={p.id} className="p-2 text-xs space-y-1 hover:bg-muted/20">
              <div className="flex items-start gap-2">
                <button onClick={() => togFav(p.id)} className="mt-0.5">
                  {fav ? <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                       : <StarOff className="w-3 h-3 text-muted-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{p.texto}</div>
                  <div className="flex flex-wrap gap-1 mt-1 items-center">
                    <Badge variant="outline" className="text-[9px]" style={{ borderColor: dim?.color, color: dim?.color }}>
                      {dim?.nombre}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">Int. {p.intensidad}</Badge>
                    <span className="text-[10px] text-muted-foreground">· {p.cuandoUsar}</span>
                  </div>
                  <details className="text-[10px] text-muted-foreground mt-0.5">
                    <summary className="cursor-pointer">Ejemplo de efecto</summary>
                    <p className="italic mt-0.5">"{p.ejemploEfecto}"</p>
                  </details>
                </div>
                <Button size="sm" variant="outline" className="h-6 text-[10px] shrink-0"
                        onClick={() => trabajar(p)}>Trabajar</Button>
              </div>
            </div>
          );
        })}
        {filtradas.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">Sin coincidencias.</div>
        )}
      </div>

      {/* Bitácora de preguntas trabajadas */}
      {trabajadas.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-navy">Bitácora de preguntas trabajadas</h4>
          {trabajadas.map((t) => (
            <div key={t.id} className="border rounded-lg p-3 bg-background space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium flex-1">{t.texto}</div>
                <Button size="sm" variant="ghost" className="text-red-600 h-6 text-[10px]"
                        onClick={() => delTrab(t.id)}>Quitar</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fecha de uso</Label>
                  <Input type="date" value={t.fechaUso} onChange={(e) => updTrab(t.id, { fechaUso: e.target.value })} className="h-7 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Dimensión</Label>
                  <Input value={t.dimension} disabled className="h-7 text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Respuesta del líder (resumen)</Label>
                <Textarea rows={2} value={t.respuestaLider} onChange={(e) => updTrab(t.id, { respuestaLider: e.target.value })} className="text-xs" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Observación del coach</Label>
                <Textarea rows={2} value={t.observacionCoach} onChange={(e) => updTrab(t.id, { observacionCoach: e.target.value })} className="text-xs" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
