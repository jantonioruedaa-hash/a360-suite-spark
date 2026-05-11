import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CREENCIAS_FRECUENTES, CATEGORIAS_CREENCIAS, type CreenciaCatalogo } from "@/lib/coaching-instrumentos";
import { Plus, X, Library, ChevronDown } from "lucide-react";

export interface CreenciaItem {
  id: string;
  texto: string;
  categoria?: string;
  origen?: string;        // ¿de dónde viene?
  costo?: string;         // ¿qué le cuesta?
  reformulacion?: string; // versión reformulada
  evidencia?: string;     // evidencia de la última semana
  intensidad?: number;    // 1-10 cuánto opera
}

export function CreenciasInstrumentado({
  datos, setDatos,
}: { datos: any; setDatos: (d: any) => void }) {
  // Migración silenciosa del formato antiguo (string[])
  const inicial: CreenciaItem[] = Array.isArray(datos.creencias)
    ? datos.creencias.map((c: any, i: number) =>
        typeof c === "string"
          ? { id: `c-${i}`, texto: c }
          : { id: c.id ?? `c-${i}`, ...c })
    : [];

  const [items, setItems] = useState<CreenciaItem[]>(inicial);
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [filtro, setFiltro] = useState<string>("all");

  const sync = (nuevos: CreenciaItem[]) => {
    setItems(nuevos);
    setDatos({ ...datos, creencias: nuevos });
  };

  const añadir = (base?: CreenciaCatalogo) => {
    sync([
      ...items,
      base
        ? {
            id: `c-${Date.now()}`,
            texto: base.texto,
            categoria: base.categoria,
            costo: base.costoTipico,
            reformulacion: base.reformulacionSugerida,
            intensidad: 5,
          }
        : { id: `c-${Date.now()}`, texto: "", intensidad: 5 },
    ]);
  };

  const quitar = (id: string) => sync(items.filter((c) => c.id !== id));
  const upd = (id: string, patch: Partial<CreenciaItem>) =>
    sync(items.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const conteoPorCategoria = useMemo(() => {
    const conteo: Record<string, number> = {};
    items.forEach((i) => {
      if (i.categoria) conteo[i.categoria] = (conteo[i.categoria] ?? 0) + 1;
    });
    return conteo;
  }, [items]);

  const intensidadProm = items.length
    ? items.reduce((a, b) => a + (b.intensidad ?? 0), 0) / items.length
    : 0;

  const catalogoFiltrado = filtro === "all"
    ? CREENCIAS_FRECUENTES
    : CREENCIAS_FRECUENTES.filter((c) => c.categoria === filtro);

  return (
    <div className="space-y-3">
      {/* Tablero */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Creencias</div>
          <div className="font-display text-xl text-navy">{items.length}</div>
        </div>
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Intensidad media</div>
          <div className="font-display text-xl text-navy">{intensidadProm.toFixed(1)}</div>
        </div>
        <div className="bg-muted/30 border rounded p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Categorías activas</div>
          <div className="font-display text-xl text-navy">{Object.keys(conteoPorCategoria).length}</div>
        </div>
      </div>

      {/* Heatmap por categoría */}
      {Object.keys(conteoPorCategoria).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {CATEGORIAS_CREENCIAS.map((cat) => {
            const n = conteoPorCategoria[cat.id] ?? 0;
            if (!n) return null;
            return (
              <Badge key={cat.id} style={{ backgroundColor: cat.color, color: "white" }}>
                {cat.nombre}: {n}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowCatalogo((s) => !s)}>
          <Library className="w-3 h-3 mr-1" /> Banco de creencias frecuentes ({CREENCIAS_FRECUENTES.length})
          <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showCatalogo ? "rotate-180" : ""}`} />
        </Button>
        <Button size="sm" onClick={() => añadir()} className="bg-navy hover:bg-navy/90">
          <Plus className="w-3 h-3 mr-1" /> Crear creencia propia
        </Button>
      </div>

      {/* Catálogo precargado */}
      {showCatalogo && (
        <div className="border rounded-lg p-3 bg-muted/20 space-y-2 max-h-72 overflow-y-auto">
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setFiltro("all")}
              className={`text-[10px] px-2 py-0.5 rounded-full border ${filtro === "all" ? "bg-navy text-white" : ""}`}>
              Todas
            </button>
            {CATEGORIAS_CREENCIAS.map((c) => (
              <button key={c.id} onClick={() => setFiltro(c.id)}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${filtro === c.id ? "text-white" : ""}`}
                style={filtro === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}>
                {c.nombre}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            {catalogoFiltrado.map((c) => {
              const cat = CATEGORIAS_CREENCIAS.find((x) => x.id === c.categoria);
              const ya = items.some((i) => i.texto === c.texto);
              return (
                <div key={c.id} className="flex items-start gap-2 p-2 rounded border bg-background">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{c.texto}</div>
                    <div className="flex gap-2 mt-1">
                      {cat && <Badge variant="outline" className="text-[9px]" style={{ borderColor: cat.color, color: cat.color }}>{cat.nombre}</Badge>}
                    </div>
                  </div>
                  <Button size="sm" variant={ya ? "ghost" : "outline"} disabled={ya} onClick={() => añadir(c)}>
                    {ya ? "Añadida" : <><Plus className="w-3 h-3 mr-1" /> Añadir</>}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de creencias activas — tabla rica */}
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-4">
          Añade desde el banco o crea creencias propias del líder.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((c, idx) => {
            const cat = CATEGORIAS_CREENCIAS.find((x) => x.id === c.categoria);
            return (
              <div key={c.id} className="border rounded-lg p-3 space-y-2 bg-background"
                   style={cat ? { borderLeft: `3px solid ${cat.color}` } : {}}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Creencia #{idx + 1}</Label>
                    <Textarea rows={2} value={c.texto} onChange={(e) => upd(c.id, { texto: e.target.value })}
                              placeholder="En lenguaje del propio líder…" className="mt-1" />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => quitar(c.id)} className="text-red-500">
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Categoría</Label>
                    <select className="w-full text-xs border rounded p-1.5 bg-background"
                            value={c.categoria ?? ""} onChange={(e) => upd(c.id, { categoria: e.target.value })}>
                      <option value="">— sin clasificar —</option>
                      {CATEGORIAS_CREENCIAS.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Intensidad (1-10)</Label>
                    <div className="flex items-center gap-2">
                      <input type="range" min={1} max={10} value={c.intensidad ?? 5}
                             onChange={(e) => upd(c.id, { intensidad: Number(e.target.value) })}
                             className="flex-1" />
                      <span className="font-mono text-sm w-6 text-right">{c.intensidad ?? 5}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Origen (¿de dónde viene?)</Label>
                    <Input value={c.origen ?? ""} onChange={(e) => upd(c.id, { origen: e.target.value })}
                           placeholder="Padre, primer jefe, fracaso pasado…" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Costo actual</Label>
                    <Input value={c.costo ?? ""} onChange={(e) => upd(c.id, { costo: e.target.value })}
                           placeholder="Qué le cuesta hoy esta creencia" />
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidencia última semana</Label>
                  <Textarea rows={2} value={c.evidencia ?? ""} onChange={(e) => upd(c.id, { evidencia: e.target.value })}
                            placeholder="Situación concreta donde se activó esta creencia" />
                </div>

                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Reformulación</Label>
                  <Textarea rows={2} value={c.reformulacion ?? ""} onChange={(e) => upd(c.id, { reformulacion: e.target.value })}
                            placeholder="Nueva narrativa más útil" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
