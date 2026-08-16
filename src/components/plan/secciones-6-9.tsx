// Componentes de las secciones 6-9 del Plan Estratégico
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import {
  ejesSugeridos, objetivosBSCSugeridos, estrategiasSugeridas, planOperativoSugerido,
  type SectorKey, type EjeEstrategico, type ObjetivoBSC, type EstrategiaSeleccion, type IniciativaOperativa, type PerspectivaBSC,
} from "@/lib/plan-catalogo";

// ─────────────────────────────────────────────────────────
// SECCIÓN 6 — EJES ESTRATÉGICOS
// ─────────────────────────────────────────────────────────
export interface Sec06Data { ejes?: EjeEstrategico[]; narrativa?: string; }
export function Sec06({ data, onChange, sector }: { data: Sec06Data; onChange: (d: Sec06Data) => void; sector: SectorKey }) {
  const ejes = data.ejes?.length ? data.ejes : ejesSugeridos(sector);
  const upd = (i: number, k: keyof EjeEstrategico, v: string) =>
    onChange({ ...data, ejes: ejes.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const add = () => onChange({ ...data, ejes: [...ejes, { nombre: "", descripcion: "", prioridad: "Media" }] });
  const remove = (i: number) => onChange({ ...data, ejes: ejes.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define los grandes pilares (3-7 ejes) que vertebran el plan. Cada objetivo y estrategia se asocia a un eje.</p>
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-navy">Ejes ({ejes.length})</h4>
          <Button size="sm" variant="outline" onClick={add}><Plus className="w-3 h-3 mr-1" />Eje</Button>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1">
            <div className="col-span-3">Nombre</div><div className="col-span-7">Descripción</div><div className="col-span-1">Prioridad</div><div className="col-span-1"></div>
          </div>
          {ejes.map((e, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <Input className="col-span-3 h-8 text-sm" value={e.nombre} onChange={(ev) => upd(i, "nombre", ev.target.value)} />
              <Input className="col-span-7 h-8 text-sm" value={e.descripcion} onChange={(ev) => upd(i, "descripcion", ev.target.value)} />
              <Select value={e.prioridad} onValueChange={(v) => upd(i, "prioridad", v)}>
                <SelectTrigger className="col-span-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem><SelectItem value="Media">Media</SelectItem><SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-red-600" onClick={() => remove(i)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Narrativa estratégica</Label>
        <Textarea rows={4} value={data.narrativa ?? ""} onChange={(e) => onChange({ ...data, narrativa: e.target.value })}
          placeholder="¿Cómo se articulan los ejes entre sí? ¿Qué eje es el motor principal este período?" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SECCIÓN 7 — OBJETIVOS + BSC
// ─────────────────────────────────────────────────────────
const PERSPECTIVAS: PerspectivaBSC[] = ["Financiera", "Cliente", "Procesos", "Aprendizaje"];
const COLOR_PERS: Record<PerspectivaBSC, string> = {
  Financiera: "border-emerald-500", Cliente: "border-blue-500", Procesos: "border-amber-500", Aprendizaje: "border-violet-500",
};
export interface Sec07Data { objetivos?: ObjetivoBSC[]; }
export function Sec07({ data, onChange }: { data: Sec07Data; onChange: (d: Sec07Data) => void }) {
  const objs = data.objetivos?.length ? data.objetivos : objetivosBSCSugeridos();
  const upd = (i: number, k: keyof ObjetivoBSC, v: string) =>
    onChange({ objetivos: objs.map((o, idx) => idx === i ? { ...o, [k]: v } : o) });
  const remove = (i: number) => onChange({ objetivos: objs.filter((_, idx) => idx !== i) });
  const addAt = (p: PerspectivaBSC) => onChange({ objetivos: [...objs, { perspectiva: p, objetivo: "", indicador: "", meta: "", plazo: "", responsable: "", iniciativa: "" }] });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Objetivos SMART distribuidos en las 4 perspectivas del Balanced Scorecard. Cada objetivo debe tener indicador, meta cuantitativa, plazo y responsable.</p>
      {PERSPECTIVAS.map((p) => {
        const lista = objs.map((o, idx) => ({ o, idx })).filter(({ o }) => o.perspectiva === p);
        return (
          <div key={p} className={`a360-card p-4 border-l-4 ${COLOR_PERS[p]}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-navy">{p} <span className="text-xs text-muted-foreground">({lista.length})</span></h4>
              <Button size="sm" variant="outline" onClick={() => addAt(p)}><Plus className="w-3 h-3 mr-1" />Objetivo</Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1">
                <div className="col-span-3">Objetivo</div><div className="col-span-2">Indicador</div><div className="col-span-1">Meta</div><div className="col-span-1">Plazo</div><div className="col-span-2">Responsable</div><div className="col-span-2">Iniciativa</div><div className="col-span-1"></div>
              </div>
              {lista.length === 0 && <p className="text-xs text-muted-foreground italic">Aún sin objetivos en esta perspectiva.</p>}
              {lista.map(({ o, idx }) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <Input className="col-span-3 h-8 text-sm" value={o.objetivo}    onChange={(e) => upd(idx, "objetivo", e.target.value)} />
                  <Input className="col-span-2 h-8 text-sm" value={o.indicador}   onChange={(e) => upd(idx, "indicador", e.target.value)} />
                  <Input className="col-span-1 h-8 text-sm" value={o.meta}        onChange={(e) => upd(idx, "meta", e.target.value)} />
                  <Input className="col-span-1 h-8 text-sm" value={o.plazo}       onChange={(e) => upd(idx, "plazo", e.target.value)} />
                  <Input className="col-span-2 h-8 text-sm" value={o.responsable} onChange={(e) => upd(idx, "responsable", e.target.value)} />
                  <Input className="col-span-2 h-8 text-sm" value={o.iniciativa ?? ""} onChange={(e) => upd(idx, "iniciativa", e.target.value)} />
                  <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-red-600" onClick={() => remove(idx)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div className="flex gap-3 text-sm">
        {PERSPECTIVAS.map((p) => (
          <Badge key={p} variant="outline">{p}: {objs.filter((o) => o.perspectiva === p).length}</Badge>
        ))}
        <Badge className="bg-navy text-white">Total: {objs.length}</Badge>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SECCIÓN 8 — ESTRATEGIAS CORPORATIVAS
// ─────────────────────────────────────────────────────────
export type Sec08Data = EstrategiaSeleccion;
export function Sec08({ data, onChange }: { data: Sec08Data; onChange: (d: Sec08Data) => void }) {
  const sug = estrategiasSugeridas();
  const iniciativas = data.iniciativas?.length ? data.iniciativas : sug.iniciativas;
  const setI = (v: string[]) => onChange({ ...data, iniciativas: v });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define la estrategia competitiva (Porter), de crecimiento (Ansoff) y de espacio competitivo (Océano azul/rojo). Justifica cada elección con base en el FODA y el diagnóstico previo.</p>

      {/* PORTER */}
      <div className="a360-card p-4 border-l-4 border-emerald-600">
        <h4 className="font-display text-navy mb-1">Estrategia competitiva — Porter</h4>
        <p className="text-xs text-muted-foreground mb-3">{sug.tips.porter}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Estrategia seleccionada</Label>
            <Select value={data.porter ?? ""} onValueChange={(v) => onChange({ ...data, porter: v as Sec08Data["porter"] })}>
              <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Liderazgo en costos">Liderazgo en costos</SelectItem>
                <SelectItem value="Diferenciación">Diferenciación</SelectItem>
                <SelectItem value="Enfoque/Nicho">Enfoque / Nicho</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Justificación</Label>
            <Textarea rows={3} value={data.porter_justificacion ?? ""} onChange={(e) => onChange({ ...data, porter_justificacion: e.target.value })} />
          </div>
        </div>
      </div>

      {/* ANSOFF */}
      <div className="a360-card p-4 border-l-4 border-blue-600">
        <h4 className="font-display text-navy mb-1">Estrategia de crecimiento — Ansoff</h4>
        <p className="text-xs text-muted-foreground mb-3">{sug.tips.ansoff}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Estrategia seleccionada</Label>
            <Select value={data.ansoff ?? ""} onValueChange={(v) => onChange({ ...data, ansoff: v as Sec08Data["ansoff"] })}>
              <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Penetración de mercado">Penetración de mercado</SelectItem>
                <SelectItem value="Desarrollo de mercado">Desarrollo de mercado</SelectItem>
                <SelectItem value="Desarrollo de producto">Desarrollo de producto</SelectItem>
                <SelectItem value="Diversificación">Diversificación</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Justificación</Label>
            <Textarea rows={3} value={data.ansoff_justificacion ?? ""} onChange={(e) => onChange({ ...data, ansoff_justificacion: e.target.value })} />
          </div>
        </div>
      </div>

      {/* OCEANO */}
      <div className="a360-card p-4 border-l-4 border-cyan-600">
        <h4 className="font-display text-navy mb-1">Espacio competitivo — Océano</h4>
        <p className="text-xs text-muted-foreground mb-3">{sug.tips.oceano}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Tipo de océano</Label>
            <Select value={data.oceano ?? ""} onValueChange={(v) => onChange({ ...data, oceano: v as Sec08Data["oceano"] })}>
              <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Océano rojo">Océano rojo</SelectItem>
                <SelectItem value="Océano azul">Océano azul</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Justificación</Label>
            <Textarea rows={3} value={data.oceano_justificacion ?? ""} onChange={(e) => onChange({ ...data, oceano_justificacion: e.target.value })} />
          </div>
        </div>
      </div>

      {/* INICIATIVAS */}
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Iniciativas estratégicas derivadas</h4>
          <Button size="sm" variant="outline" onClick={() => setI([...iniciativas, ""])}><Plus className="w-3 h-3 mr-1" />Iniciativa</Button>
        </div>
        <div className="space-y-2">
          {iniciativas.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input className="h-8 text-sm" value={it} onChange={(e) => setI(iniciativas.map((x, idx) => idx === i ? e.target.value : x))} />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setI(iniciativas.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SECCIÓN 9 — ESTRUCTURA Y PLAN OPERATIVO
// ─────────────────────────────────────────────────────────
export interface Sec09Data {
  estructura_descripcion?: string;
  organigrama?: string;
  roles_responsables?: string;
  iniciativas?: IniciativaOperativa[];
}
export function Sec09({ data, onChange }: { data: Sec09Data; onChange: (d: Sec09Data) => void }) {
  const inis = data.iniciativas?.length ? data.iniciativas : planOperativoSugerido();
  const upd = (i: number, k: keyof IniciativaOperativa, v: string | number) =>
    onChange({ ...data, iniciativas: inis.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const add = () => onChange({ ...data, iniciativas: [...inis, { nombre: "", eje: "", responsable: "", fecha_inicio: "", fecha_fin: "", presupuesto: 0, kpi: "", estado: "Por iniciar" }] });
  const remove = (i: number) => onChange({ ...data, iniciativas: inis.filter((_, idx) => idx !== i) });

  const totalPpto = inis.reduce((a, b) => a + (Number(b.presupuesto) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label>Estructura organizativa propuesta</Label>
          <Textarea rows={4} value={data.estructura_descripcion ?? ""} onChange={(e) => onChange({ ...data, estructura_descripcion: e.target.value })}
            placeholder="Describe la estructura: ¿funcional, divisional, matricial? ¿Qué áreas se crean/refuerzan/eliminan?" />
        </div>
        <div>
          <Label>Organigrama (texto)</Label>
          <Textarea rows={5} className="font-mono text-xs" value={data.organigrama ?? ""} onChange={(e) => onChange({ ...data, organigrama: e.target.value })}
            placeholder={"Ej.\nGerencia General\n├── Comercial\n├── Operaciones\n├── Finanzas\n└── Talento Humano"} />
        </div>
        <div>
          <Label>Roles y responsables clave</Label>
          <Textarea rows={3} value={data.roles_responsables ?? ""} onChange={(e) => onChange({ ...data, roles_responsables: e.target.value })}
            placeholder="Ej. Gerencia Comercial: María X | Operaciones: Juan Y | TI: …" />
        </div>
      </div>

      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Plan operativo — Iniciativas</h4>
          <div className="flex items-center gap-3">
            <Badge variant="outline">Presupuesto total: ${totalPpto.toLocaleString()}</Badge>
            <Button size="sm" variant="outline" onClick={add}><Plus className="w-3 h-3 mr-1" />Iniciativa</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1 min-w-[1100px]">
            <div className="col-span-2">Iniciativa</div><div className="col-span-2">Eje</div><div className="col-span-2">Responsable</div>
            <div className="col-span-1">Inicio</div><div className="col-span-1">Fin</div><div className="col-span-1">Ppto.</div>
            <div className="col-span-1">KPI</div><div className="col-span-1">Estado</div><div className="col-span-1"></div>
          </div>
          {inis.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start min-w-[1100px]">
              <Input className="col-span-2 h-8 text-sm" value={it.nombre} onChange={(e) => upd(i, "nombre", e.target.value)} />
              <Input className="col-span-2 h-8 text-sm" value={it.eje} onChange={(e) => upd(i, "eje", e.target.value)} />
              <Input className="col-span-2 h-8 text-sm" value={it.responsable} onChange={(e) => upd(i, "responsable", e.target.value)} />
              <Input type="date" className="col-span-1 h-8 text-xs" value={it.fecha_inicio} onChange={(e) => upd(i, "fecha_inicio", e.target.value)} />
              <Input type="date" className="col-span-1 h-8 text-xs" value={it.fecha_fin} onChange={(e) => upd(i, "fecha_fin", e.target.value)} />
              <Input type="number" className="col-span-1 h-8 text-sm" value={it.presupuesto} onChange={(e) => upd(i, "presupuesto", Number(e.target.value))} />
              <Input className="col-span-1 h-8 text-sm" value={it.kpi} onChange={(e) => upd(i, "kpi", e.target.value)} />
              <Select value={it.estado} onValueChange={(v) => upd(i, "estado", v)}>
                <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Por iniciar">Por iniciar</SelectItem>
                  <SelectItem value="En curso">En curso</SelectItem>
                  <SelectItem value="Completada">Completada</SelectItem>
                  <SelectItem value="En riesgo">En riesgo</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-red-600" onClick={() => remove(i)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
