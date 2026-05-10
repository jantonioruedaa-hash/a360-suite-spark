// Componentes Fase 3 — Secciones 10-13 (ESG, Alianzas, Innovación, Marketing)
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { ListaEditable } from "./ListaEditable";
import {
  type SectorKey,
  // Sec 10
  type Sec10Data, type MaterialidadESG, type ObjetivoESG, type DimensionESG,
  marcoReferenciaESG, odsSugeridos, materialidadSugerida, objetivosESGSugeridos,
  // Sec 11
  type Sec11Data, type Alianza, type TipoAlianza, alianzasSugeridas,
  // Sec 12
  type Sec12Data, type IniciativaInnovacion, type TipoInnovacion, type HorizonteInnovacion,
  metodologiasInnovacion, fuentesFinanciamientoIdi, iniciativasInnovacionSugeridas,
  // Sec 13
  type Sec13Data, type SegmentoCliente, type BuyerPersona, type PropuestaValor, type IniciativaMarketing,
  segmentosSugeridos, buyerPersonasSugeridos, propuestasValorSugeridas, marketingMixSugerido, iniciativasMarketingSugeridas,
} from "@/lib/plan-catalogo";

export type { Sec10Data, Sec11Data, Sec12Data, Sec13Data };

// ════════════════════════════════════════════════════════
// SECCIÓN 10 — ESG / Sostenibilidad
// ════════════════════════════════════════════════════════
const COLOR_DIM: Record<DimensionESG, string> = {
  Ambiental: "border-emerald-500", Social: "border-blue-500", Gobernanza: "border-amber-500",
};
const DIMS: DimensionESG[] = ["Ambiental", "Social", "Gobernanza"];

export function Sec10({ data, onChange, sector }: { data: Sec10Data; onChange: (d: Sec10Data) => void; sector: SectorKey }) {
  const mat = data.materialidad ?? [];
  const objs = data.objetivos ?? [];

  const updMat = (i: number, k: keyof MaterialidadESG, v: string | number) =>
    onChange({ ...data, materialidad: mat.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const remMat = (i: number) => onChange({ ...data, materialidad: mat.filter((_, idx) => idx !== i) });
  const addMat = () => onChange({ ...data, materialidad: [...mat, { tema: "", dimension: "Ambiental", impacto_negocio: 3, importancia_grupos: 3, prioridad: "Media", accion: "" }] });
  const cargarMat = () => onChange({ ...data, materialidad: materialidadSugerida(sector) });

  const updObj = (i: number, k: keyof ObjetivoESG, v: string) =>
    onChange({ ...data, objetivos: objs.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const remObj = (i: number) => onChange({ ...data, objetivos: objs.filter((_, idx) => idx !== i) });
  const addObjAt = (d: DimensionESG) => onChange({ ...data, objetivos: [...objs, { dimension: d, objetivo: "", indicador: "", meta: "", plazo: "", responsable: "", ods: "" }] });
  const cargarObj = () => onChange({ ...data, objetivos: objetivosESGSugeridos() });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define el propósito de sostenibilidad, marco de referencia, materialidad, ODS priorizados y objetivos ESG cuantificables. La estrategia ESG debe estar integrada con los ejes y el CMI.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Propósito de sostenibilidad</Label>
          <Textarea rows={4} value={data.proposito_sostenibilidad ?? ""}
            onChange={(e) => onChange({ ...data, proposito_sostenibilidad: e.target.value })}
            placeholder="¿Cuál es la contribución de la empresa al desarrollo sostenible y cómo se conecta con el negocio?" />
        </div>
        <div>
          <Label>Marco de referencia adoptado</Label>
          <ListaEditable items={data.marco_referencia ?? []} onChange={(v) => onChange({ ...data, marco_referencia: v })} placeholder="Ej. GRI, SASB, TCFD…" inputLabel="+ Marco" />
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => onChange({ ...data, marco_referencia: marcoReferenciaESG() })}><Sparkles className="w-3 h-3 mr-1" />Cargar marcos sugeridos</Button>
          </div>
        </div>
      </div>

      <div>
        <Label>ODS priorizados</Label>
        <ListaEditable items={data.ods_priorizados ?? []} onChange={(v) => onChange({ ...data, ods_priorizados: v })} placeholder="Ej. ODS 13 — Acción climática" inputLabel="+ ODS" />
        <div className="mt-2">
          <Button size="sm" variant="outline" onClick={() => onChange({ ...data, ods_priorizados: odsSugeridos(sector) })}><Sparkles className="w-3 h-3 mr-1" />Cargar ODS sugeridos (sector)</Button>
        </div>
      </div>

      {/* MATERIALIDAD */}
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Matriz de materialidad ({mat.length})</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cargarMat}><Sparkles className="w-3 h-3 mr-1" />Cargar materialidad sugerida</Button>
            <Button size="sm" variant="outline" onClick={addMat}><Plus className="w-3 h-3 mr-1" />Tema</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1 min-w-[1100px]">
            <div className="col-span-3">Tema</div><div className="col-span-2">Dimensión</div>
            <div className="col-span-1">Impacto neg.</div><div className="col-span-1">Imp. grupos</div>
            <div className="col-span-1">Prioridad</div><div className="col-span-3">Acción</div><div className="col-span-1"></div>
          </div>
          {mat.length === 0 && <p className="text-xs text-muted-foreground italic">Sin temas materiales aún.</p>}
          {mat.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start min-w-[1100px]">
              <Input className="col-span-3 h-8 text-sm" value={r.tema} onChange={(e) => updMat(i, "tema", e.target.value)} />
              <Select value={r.dimension} onValueChange={(v) => updMat(i, "dimension", v)}>
                <SelectTrigger className="col-span-2 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{DIMS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" min={1} max={5} className="col-span-1 h-8 text-sm" value={r.impacto_negocio} onChange={(e) => updMat(i, "impacto_negocio", Number(e.target.value))} />
              <Input type="number" min={1} max={5} className="col-span-1 h-8 text-sm" value={r.importancia_grupos} onChange={(e) => updMat(i, "importancia_grupos", Number(e.target.value))} />
              <Select value={r.prioridad} onValueChange={(v) => updMat(i, "prioridad", v)}>
                <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem><SelectItem value="Media">Media</SelectItem><SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Input className="col-span-3 h-8 text-sm" value={r.accion} onChange={(e) => updMat(i, "accion", e.target.value)} />
              <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-red-600" onClick={() => remMat(i)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </div>

      {/* OBJETIVOS ESG */}
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Objetivos ESG ({objs.length})</h4>
          <Button size="sm" variant="outline" onClick={cargarObj}><Sparkles className="w-3 h-3 mr-1" />Cargar objetivos sugeridos</Button>
        </div>
        {DIMS.map((d) => {
          const lista = objs.map((o, idx) => ({ o, idx })).filter(({ o }) => o.dimension === d);
          return (
            <div key={d} className={`mb-3 p-3 rounded border-l-4 ${COLOR_DIM[d]} bg-muted/20`}>
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-navy text-sm">{d} <span className="text-xs text-muted-foreground">({lista.length})</span></h5>
                <Button size="sm" variant="outline" onClick={() => addObjAt(d)}><Plus className="w-3 h-3 mr-1" />Objetivo</Button>
              </div>
              <div className="space-y-1 overflow-x-auto">
                <div className="grid grid-cols-12 gap-2 text-[11px] text-muted-foreground font-semibold border-b pb-1 min-w-[1000px]">
                  <div className="col-span-3">Objetivo</div><div className="col-span-2">Indicador</div><div className="col-span-1">Meta</div>
                  <div className="col-span-1">Plazo</div><div className="col-span-2">Responsable</div><div className="col-span-2">ODS</div><div className="col-span-1"></div>
                </div>
                {lista.map(({ o, idx }) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-start min-w-[1000px]">
                    <Input className="col-span-3 h-8 text-sm" value={o.objetivo} onChange={(e) => updObj(idx, "objetivo", e.target.value)} />
                    <Input className="col-span-2 h-8 text-sm" value={o.indicador} onChange={(e) => updObj(idx, "indicador", e.target.value)} />
                    <Input className="col-span-1 h-8 text-sm" value={o.meta} onChange={(e) => updObj(idx, "meta", e.target.value)} />
                    <Input className="col-span-1 h-8 text-sm" value={o.plazo} onChange={(e) => updObj(idx, "plazo", e.target.value)} />
                    <Input className="col-span-2 h-8 text-sm" value={o.responsable} onChange={(e) => updObj(idx, "responsable", e.target.value)} />
                    <Input className="col-span-2 h-8 text-sm" value={o.ods} onChange={(e) => updObj(idx, "ods", e.target.value)} />
                    <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-red-600" onClick={() => remObj(idx)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Riesgos climáticos y resiliencia</Label>
          <Textarea rows={4} value={data.riesgos_climaticos ?? ""} onChange={(e) => onChange({ ...data, riesgos_climaticos: e.target.value })}
            placeholder="Riesgos físicos y de transición; planes de mitigación y adaptación (alineado a TCFD)." />
        </div>
        <div>
          <Label>Cadena de valor responsable</Label>
          <Textarea rows={4} value={data.cadena_valor_responsable ?? ""} onChange={(e) => onChange({ ...data, cadena_valor_responsable: e.target.value })}
            placeholder="Selección, evaluación y desarrollo de proveedores con criterios ESG. DDHH y compras responsables." />
        </div>
        <div>
          <Label>Reporte y gobierno ESG</Label>
          <Textarea rows={4} value={data.reporte_y_gobierno ?? ""} onChange={(e) => onChange({ ...data, reporte_y_gobierno: e.target.value })}
            placeholder="Comité de sostenibilidad, KPIs reportados, periodicidad y aseguramiento externo." />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SECCIÓN 11 — Alianzas estratégicas
// ════════════════════════════════════════════════════════
const TIPOS_ALIANZA: TipoAlianza[] = ["Comercial", "Tecnológica", "I+D / Innovación", "Operativa / Logística", "Financiera", "Joint Venture", "Académica", "Institucional / Sectorial", "ESG / Comunidad"];

export function Sec11({ data, onChange, sector }: { data: Sec11Data; onChange: (d: Sec11Data) => void; sector: SectorKey }) {
  const al = data.alianzas ?? [];
  const upd = (i: number, k: keyof Alianza, v: string) =>
    onChange({ ...data, alianzas: al.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const rem = (i: number) => onChange({ ...data, alianzas: al.filter((_, idx) => idx !== i) });
  const add = () => onChange({ ...data, alianzas: [...al, { socio: "", tipo: "Comercial", objetivo: "", aporte_propio: "", aporte_socio: "", modelo_relacion: "", estado: "Identificada", responsable: "", riesgo: "Medio", valor_esperado: "" }] });
  const cargar = () => onChange({ ...data, alianzas: alianzasSugeridas(sector) });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define la estrategia de alianzas, los criterios de selección y mapea el portafolio de socios actuales y potenciales con su tipo, aporte mutuo y estado.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Estrategia de alianzas</Label>
          <Textarea rows={4} value={data.estrategia_alianzas ?? ""} onChange={(e) => onChange({ ...data, estrategia_alianzas: e.target.value })}
            placeholder="¿Qué buscamos lograr a través de alianzas que no podríamos lograr solos? ¿Qué tipo de socios necesitamos?" />
        </div>
        <div>
          <Label>Criterios de selección de socios</Label>
          <Textarea rows={4} value={data.criterios_seleccion ?? ""} onChange={(e) => onChange({ ...data, criterios_seleccion: e.target.value })}
            placeholder="Encaje estratégico, capacidades complementarias, valores, salud financiera, reputación, gobernanza…" />
        </div>
      </div>

      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Mapa de alianzas ({al.length})</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cargar}><Sparkles className="w-3 h-3 mr-1" />Cargar alianzas sugeridas</Button>
            <Button size="sm" variant="outline" onClick={add}><Plus className="w-3 h-3 mr-1" />Alianza</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1 min-w-[1500px]">
            <div className="col-span-2">Socio</div><div className="col-span-1">Tipo</div>
            <div className="col-span-2">Objetivo</div><div className="col-span-1">Aporte propio</div>
            <div className="col-span-1">Aporte socio</div><div className="col-span-1">Modelo</div>
            <div className="col-span-1">Estado</div><div className="col-span-1">Responsable</div>
            <div className="col-span-1">Riesgo</div><div className="col-span-1">Valor esperado</div>
          </div>
          {al.length === 0 && <p className="text-xs text-muted-foreground italic">Sin alianzas registradas.</p>}
          {al.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start min-w-[1500px]">
              <Input className="col-span-2 h-8 text-sm" value={r.socio} onChange={(e) => upd(i, "socio", e.target.value)} />
              <Select value={r.tipo} onValueChange={(v) => upd(i, "tipo", v)}>
                <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_ALIANZA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="col-span-2 h-8 text-sm" value={r.objetivo} onChange={(e) => upd(i, "objetivo", e.target.value)} />
              <Input className="col-span-1 h-8 text-sm" value={r.aporte_propio} onChange={(e) => upd(i, "aporte_propio", e.target.value)} />
              <Input className="col-span-1 h-8 text-sm" value={r.aporte_socio} onChange={(e) => upd(i, "aporte_socio", e.target.value)} />
              <Input className="col-span-1 h-8 text-sm" value={r.modelo_relacion} onChange={(e) => upd(i, "modelo_relacion", e.target.value)} />
              <Select value={r.estado} onValueChange={(v) => upd(i, "estado", v)}>
                <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Identificada","En conversación","Negociación","Activa","Pausada"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="col-span-1 h-8 text-sm" value={r.responsable} onChange={(e) => upd(i, "responsable", e.target.value)} />
              <Select value={r.riesgo} onValueChange={(v) => upd(i, "riesgo", v)}>
                <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bajo">Bajo</SelectItem><SelectItem value="Medio">Medio</SelectItem><SelectItem value="Alto">Alto</SelectItem>
                </SelectContent>
              </Select>
              <div className="col-span-1 flex items-center gap-1">
                <Input className="h-8 text-sm" value={r.valor_esperado} onChange={(e) => upd(i, "valor_esperado", e.target.value)} />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => rem(i)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {TIPOS_ALIANZA.map((t) => {
            const c = al.filter((x) => x.tipo === t).length;
            return c > 0 ? <Badge key={t} variant="outline">{t}: {c}</Badge> : null;
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Ecosistema actual</Label>
          <Textarea rows={4} value={data.ecosistema_actual ?? ""} onChange={(e) => onChange({ ...data, ecosistema_actual: e.target.value })}
            placeholder="Describe el ecosistema en el que la empresa ya participa (gremios, hubs, programas, eventos)…" />
        </div>
        <div>
          <Label>Gobernanza de alianzas</Label>
          <Textarea rows={4} value={data.gobernanza_alianzas ?? ""} onChange={(e) => onChange({ ...data, gobernanza_alianzas: e.target.value })}
            placeholder="¿Quién gestiona, mide y reporta el portafolio de alianzas? Cadencia y KPIs." />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SECCIÓN 12 — Innovación e I+D+i
// ════════════════════════════════════════════════════════
const TIPOS_INN: TipoInnovacion[] = ["Producto", "Servicio", "Proceso", "Modelo de negocio", "Marketing", "Organizacional", "Tecnológica"];
const HORIZ: HorizonteInnovacion[] = ["H1 (Core 0-12m)", "H2 (Adyacente 12-36m)", "H3 (Disruptiva 36m+)"];
const COLOR_HOR: Record<HorizonteInnovacion, string> = {
  "H1 (Core 0-12m)": "border-emerald-500", "H2 (Adyacente 12-36m)": "border-blue-500", "H3 (Disruptiva 36m+)": "border-violet-500",
};

export function Sec12({ data, onChange, sector }: { data: Sec12Data; onChange: (d: Sec12Data) => void; sector: SectorKey }) {
  const inis = data.iniciativas ?? [];
  const upd = (i: number, k: keyof IniciativaInnovacion, v: string | number) =>
    onChange({ ...data, iniciativas: inis.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const rem = (i: number) => onChange({ ...data, iniciativas: inis.filter((_, idx) => idx !== i) });
  const add = (h: HorizonteInnovacion) => onChange({ ...data, iniciativas: [...inis, { nombre: "", tipo: "Producto", horizonte: h, descripcion: "", responsable: "", presupuesto: 0, kpi: "", estado: "Idea" }] });
  const cargar = () => onChange({ ...data, iniciativas: iniciativasInnovacionSugeridas(sector) });

  const totalPpto = inis.reduce((a, b) => a + (Number(b.presupuesto) || 0), 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define la visión y modelo de innovación, las metodologías, el portafolio por horizontes (H1/H2/H3) y la gestión de la propiedad intelectual.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Visión de innovación</Label>
          <Textarea rows={4} value={data.vision_innovacion ?? ""} onChange={(e) => onChange({ ...data, vision_innovacion: e.target.value })}
            placeholder="¿Qué papel juega la innovación en el futuro de la empresa? ¿Qué queremos lograr en 3-5 años?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Modelo de innovación</Label>
            <Select value={data.modelo_innovacion ?? ""} onValueChange={(v) => onChange({ ...data, modelo_innovacion: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cerrada">Innovación cerrada</SelectItem>
                <SelectItem value="Abierta">Innovación abierta</SelectItem>
                <SelectItem value="Mixta">Modelo mixto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Inversión I+D+i (% ventas)</Label>
            <Input value={data.inversion_idi_pct_ventas ?? ""} onChange={(e) => onChange({ ...data, inversion_idi_pct_ventas: e.target.value })} placeholder="Ej. 3%" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Metodologías de innovación</Label>
          <ListaEditable items={data.metodologias ?? []} onChange={(v) => onChange({ ...data, metodologias: v })} placeholder="Ej. Design Thinking" inputLabel="+ Metodología" />
          <div className="mt-2"><Button size="sm" variant="outline" onClick={() => onChange({ ...data, metodologias: metodologiasInnovacion() })}><Sparkles className="w-3 h-3 mr-1" />Cargar metodologías</Button></div>
        </div>
        <div>
          <Label>Fuentes de financiamiento I+D+i</Label>
          <ListaEditable items={data.fuentes_financiamiento ?? []} onChange={(v) => onChange({ ...data, fuentes_financiamiento: v })} placeholder="Ej. créditos fiscales" inputLabel="+ Fuente" />
          <div className="mt-2"><Button size="sm" variant="outline" onClick={() => onChange({ ...data, fuentes_financiamiento: fuentesFinanciamientoIdi() })}><Sparkles className="w-3 h-3 mr-1" />Cargar fuentes</Button></div>
        </div>
      </div>

      <div>
        <Label>Ecosistema de innovación</Label>
        <Textarea rows={3} value={data.ecosistema ?? ""} onChange={(e) => onChange({ ...data, ecosistema: e.target.value })}
          placeholder="Universidades, startups, hubs, programas y comunidades en las que participa la empresa." />
      </div>

      {/* Portafolio por horizontes */}
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Portafolio de innovación ({inis.length})</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Presupuesto total: ${totalPpto.toLocaleString()}</Badge>
            <Button size="sm" variant="outline" onClick={cargar}><Sparkles className="w-3 h-3 mr-1" />Cargar plantilla</Button>
          </div>
        </div>
        {HORIZ.map((h) => {
          const lista = inis.map((o, idx) => ({ o, idx })).filter(({ o }) => o.horizonte === h);
          return (
            <div key={h} className={`mb-3 p-3 rounded border-l-4 ${COLOR_HOR[h]} bg-muted/20`}>
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-navy text-sm">{h} <span className="text-xs text-muted-foreground">({lista.length})</span></h5>
                <Button size="sm" variant="outline" onClick={() => add(h)}><Plus className="w-3 h-3 mr-1" />Iniciativa</Button>
              </div>
              <div className="space-y-1 overflow-x-auto">
                <div className="grid grid-cols-12 gap-2 text-[11px] text-muted-foreground font-semibold border-b pb-1 min-w-[1200px]">
                  <div className="col-span-2">Iniciativa</div><div className="col-span-1">Tipo</div>
                  <div className="col-span-3">Descripción</div><div className="col-span-2">Responsable</div>
                  <div className="col-span-1">Ppto.</div><div className="col-span-2">KPI</div>
                  <div className="col-span-1">Estado</div>
                </div>
                {lista.map(({ o, idx }) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-start min-w-[1200px]">
                    <Input className="col-span-2 h-8 text-sm" value={o.nombre} onChange={(e) => upd(idx, "nombre", e.target.value)} />
                    <Select value={o.tipo} onValueChange={(v) => upd(idx, "tipo", v)}>
                      <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{TIPOS_INN.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="col-span-3 h-8 text-sm" value={o.descripcion} onChange={(e) => upd(idx, "descripcion", e.target.value)} />
                    <Input className="col-span-2 h-8 text-sm" value={o.responsable} onChange={(e) => upd(idx, "responsable", e.target.value)} />
                    <Input type="number" className="col-span-1 h-8 text-sm" value={o.presupuesto} onChange={(e) => upd(idx, "presupuesto", Number(e.target.value))} />
                    <Input className="col-span-2 h-8 text-sm" value={o.kpi} onChange={(e) => upd(idx, "kpi", e.target.value)} />
                    <div className="col-span-1 flex items-center gap-1">
                      <Select value={o.estado} onValueChange={(v) => upd(idx, "estado", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Idea">Idea</SelectItem>
                          <SelectItem value="Pilotaje">Pilotaje</SelectItem>
                          <SelectItem value="Escalado">Escalado</SelectItem>
                          <SelectItem value="Descartada">Descartada</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => rem(idx)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Protección de propiedad intelectual</Label>
          <Textarea rows={4} value={data.proteccion_pi ?? ""} onChange={(e) => onChange({ ...data, proteccion_pi: e.target.value })}
            placeholder="Patentes, marcas, derechos de autor, secreto industrial, NDAs y políticas internas." />
        </div>
        <div>
          <Label>Cultura de innovación</Label>
          <Textarea rows={4} value={data.cultura_innovacion ?? ""} onChange={(e) => onChange({ ...data, cultura_innovacion: e.target.value })}
            placeholder="¿Cómo se fomenta? Tiempo dedicado, premios, gestión del fracaso, métricas de innovación." />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SECCIÓN 13 — Marketing estratégico
// ════════════════════════════════════════════════════════
const CAT_MK: IniciativaMarketing["categoria"][] = ["Marca", "Demand Gen", "Contenidos", "Performance", "ABM", "Eventos", "PR", "CRM / Fidelización", "Producto / Pricing"];

export function Sec13({ data, onChange, sector }: { data: Sec13Data; onChange: (d: Sec13Data) => void; sector: SectorKey }) {
  const segs = data.segmentacion ?? [];
  const personas = data.buyer_personas ?? [];
  const pvs = data.propuestas_valor ?? [];
  const mix = data.marketing_mix ?? { producto: "", precio: "", plaza: "", promocion: "", personas: "", procesos: "", evidencia_fisica: "" };
  const inis = data.iniciativas ?? [];

  const totalPpto = inis.reduce((a, b) => a + (Number(b.presupuesto) || 0), 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define el posicionamiento, segmentación, buyer personas, propuestas de valor por segmento, marketing mix (7P) y el portafolio de iniciativas con presupuesto y KPIs.</p>

      <div>
        <Label>Posicionamiento estratégico</Label>
        <Textarea rows={3} value={data.posicionamiento ?? ""} onChange={(e) => onChange({ ...data, posicionamiento: e.target.value })}
          placeholder="Para [segmento], que [necesidad], somos [categoría] que [beneficio único], a diferencia de [alternativa], porque [razón para creer]." />
      </div>

      {/* SEGMENTOS */}
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Segmentación de clientes ({segs.length})</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onChange({ ...data, segmentacion: segmentosSugeridos(sector) })}><Sparkles className="w-3 h-3 mr-1" />Cargar segmentos sugeridos</Button>
            <Button size="sm" variant="outline" onClick={() => onChange({ ...data, segmentacion: [...segs, { nombre: "", descripcion: "", tamano_mercado: "", necesidad_clave: "", prioridad: "Media" }] })}><Plus className="w-3 h-3 mr-1" />Segmento</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1 min-w-[1100px]">
            <div className="col-span-2">Segmento</div><div className="col-span-3">Descripción</div>
            <div className="col-span-2">Tamaño</div><div className="col-span-3">Necesidad clave</div>
            <div className="col-span-1">Prioridad</div><div className="col-span-1"></div>
          </div>
          {segs.map((s, i) => {
            const u = (k: keyof SegmentoCliente, v: string) => onChange({ ...data, segmentacion: segs.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-start min-w-[1100px]">
                <Input className="col-span-2 h-8 text-sm" value={s.nombre} onChange={(e) => u("nombre", e.target.value)} />
                <Input className="col-span-3 h-8 text-sm" value={s.descripcion} onChange={(e) => u("descripcion", e.target.value)} />
                <Input className="col-span-2 h-8 text-sm" value={s.tamano_mercado} onChange={(e) => u("tamano_mercado", e.target.value)} />
                <Input className="col-span-3 h-8 text-sm" value={s.necesidad_clave} onChange={(e) => u("necesidad_clave", e.target.value)} />
                <Select value={s.prioridad} onValueChange={(v) => u("prioridad", v)}>
                  <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem><SelectItem value="Media">Media</SelectItem><SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-red-600" onClick={() => onChange({ ...data, segmentacion: segs.filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* BUYER PERSONAS */}
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Buyer personas ({personas.length})</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onChange({ ...data, buyer_personas: buyerPersonasSugeridos(sector) })}><Sparkles className="w-3 h-3 mr-1" />Cargar personas sugeridas</Button>
            <Button size="sm" variant="outline" onClick={() => onChange({ ...data, buyer_personas: [...personas, { nombre: "", rol: "", motivaciones: "", dolores: "", canales: "" }] })}><Plus className="w-3 h-3 mr-1" />Persona</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1 min-w-[1200px]">
            <div className="col-span-2">Nombre</div><div className="col-span-2">Rol</div>
            <div className="col-span-3">Motivaciones</div><div className="col-span-3">Dolores</div>
            <div className="col-span-1">Canales</div><div className="col-span-1"></div>
          </div>
          {personas.map((p, i) => {
            const u = (k: keyof BuyerPersona, v: string) => onChange({ ...data, buyer_personas: personas.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-start min-w-[1200px]">
                <Input className="col-span-2 h-8 text-sm" value={p.nombre} onChange={(e) => u("nombre", e.target.value)} />
                <Input className="col-span-2 h-8 text-sm" value={p.rol} onChange={(e) => u("rol", e.target.value)} />
                <Input className="col-span-3 h-8 text-sm" value={p.motivaciones} onChange={(e) => u("motivaciones", e.target.value)} />
                <Input className="col-span-3 h-8 text-sm" value={p.dolores} onChange={(e) => u("dolores", e.target.value)} />
                <Input className="col-span-1 h-8 text-sm" value={p.canales} onChange={(e) => u("canales", e.target.value)} />
                <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-red-600" onClick={() => onChange({ ...data, buyer_personas: personas.filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* PROPUESTAS DE VALOR */}
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Propuestas de valor por segmento ({pvs.length})</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onChange({ ...data, propuestas_valor: propuestasValorSugeridas(sector) })}><Sparkles className="w-3 h-3 mr-1" />Cargar propuestas sugeridas</Button>
            <Button size="sm" variant="outline" onClick={() => onChange({ ...data, propuestas_valor: [...pvs, { segmento: "", problema: "", solucion: "", diferencial: "", prueba: "" }] })}><Plus className="w-3 h-3 mr-1" />Propuesta</Button>
          </div>
        </div>
        <div className="space-y-3">
          {pvs.map((p, i) => {
            const u = (k: keyof PropuestaValor, v: string) => onChange({ ...data, propuestas_valor: pvs.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
            return (
              <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 border rounded bg-muted/10">
                <div><Label className="text-xs">Segmento</Label><Input className="h-8 text-sm" value={p.segmento} onChange={(e) => u("segmento", e.target.value)} /></div>
                <div><Label className="text-xs">Problema</Label><Input className="h-8 text-sm" value={p.problema} onChange={(e) => u("problema", e.target.value)} /></div>
                <div><Label className="text-xs">Solución</Label><Input className="h-8 text-sm" value={p.solucion} onChange={(e) => u("solucion", e.target.value)} /></div>
                <div><Label className="text-xs">Diferencial</Label><Input className="h-8 text-sm" value={p.diferencial} onChange={(e) => u("diferencial", e.target.value)} /></div>
                <div className="flex items-end gap-1">
                  <div className="flex-1"><Label className="text-xs">Prueba</Label><Input className="h-8 text-sm" value={p.prueba} onChange={(e) => u("prueba", e.target.value)} /></div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => onChange({ ...data, propuestas_valor: pvs.filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MARKETING MIX 7P */}
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Marketing Mix (7P)</h4>
          <Button size="sm" variant="outline" onClick={() => onChange({ ...data, marketing_mix: marketingMixSugerido() })}><Sparkles className="w-3 h-3 mr-1" />Cargar mix sugerido</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(["producto","precio","plaza","promocion","personas","procesos","evidencia_fisica"] as const).map((k) => (
            <div key={k}>
              <Label className="capitalize">{k.replace("_", " ")}</Label>
              <Textarea rows={3} value={mix[k] ?? ""} onChange={(e) => onChange({ ...data, marketing_mix: { ...mix, [k]: e.target.value } })} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Estrategia de marca</Label>
          <Textarea rows={4} value={data.estrategia_marca ?? ""} onChange={(e) => onChange({ ...data, estrategia_marca: e.target.value })}
            placeholder="Arquitectura de marca, tono, narrativa, atributos clave." />
        </div>
        <div>
          <Label>Estrategia de pricing</Label>
          <Textarea rows={4} value={data.estrategia_pricing ?? ""} onChange={(e) => onChange({ ...data, estrategia_pricing: e.target.value })}
            placeholder="Modelo (cost-plus, value-based, dynamic), packaging, descuentos, posicionamiento de precio." />
        </div>
        <div>
          <Label>Canales y distribución</Label>
          <Textarea rows={4} value={data.canales_y_distribucion ?? ""} onChange={(e) => onChange({ ...data, canales_y_distribucion: e.target.value })}
            placeholder="Mix de canales: directo, digital, partners, marketplaces. Cobertura y rol de cada canal." />
        </div>
      </div>

      <div>
        <Label>Funnel y customer journey</Label>
        <Textarea rows={3} value={data.funnel_y_journey ?? ""} onChange={(e) => onChange({ ...data, funnel_y_journey: e.target.value })}
          placeholder="Etapas del funnel, touchpoints, métricas por etapa y experiencia esperada." />
      </div>

      {/* INICIATIVAS DE MARKETING */}
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Plan de iniciativas de marketing ({inis.length})</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Presupuesto total: ${totalPpto.toLocaleString()}</Badge>
            <Button size="sm" variant="outline" onClick={() => onChange({ ...data, iniciativas: iniciativasMarketingSugeridas(sector) })}><Sparkles className="w-3 h-3 mr-1" />Cargar plan sugerido</Button>
            <Button size="sm" variant="outline" onClick={() => onChange({ ...data, iniciativas: [...inis, { nombre: "", categoria: "Marca", objetivo: "", canal: "", kpi: "", presupuesto: 0, responsable: "", estado: "Por iniciar" }] })}><Plus className="w-3 h-3 mr-1" />Iniciativa</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1 min-w-[1300px]">
            <div className="col-span-2">Iniciativa</div><div className="col-span-2">Categoría</div>
            <div className="col-span-2">Objetivo</div><div className="col-span-1">Canal</div>
            <div className="col-span-1">KPI</div><div className="col-span-1">Ppto.</div>
            <div className="col-span-1">Responsable</div><div className="col-span-1">Estado</div><div className="col-span-1"></div>
          </div>
          {inis.map((it, i) => {
            const u = (k: keyof IniciativaMarketing, v: string | number) => onChange({ ...data, iniciativas: inis.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-start min-w-[1300px]">
                <Input className="col-span-2 h-8 text-sm" value={it.nombre} onChange={(e) => u("nombre", e.target.value)} />
                <Select value={it.categoria} onValueChange={(v) => u("categoria", v)}>
                  <SelectTrigger className="col-span-2 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{CAT_MK.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input className="col-span-2 h-8 text-sm" value={it.objetivo} onChange={(e) => u("objetivo", e.target.value)} />
                <Input className="col-span-1 h-8 text-sm" value={it.canal} onChange={(e) => u("canal", e.target.value)} />
                <Input className="col-span-1 h-8 text-sm" value={it.kpi} onChange={(e) => u("kpi", e.target.value)} />
                <Input type="number" className="col-span-1 h-8 text-sm" value={it.presupuesto} onChange={(e) => u("presupuesto", Number(e.target.value))} />
                <Input className="col-span-1 h-8 text-sm" value={it.responsable} onChange={(e) => u("responsable", e.target.value)} />
                <Select value={it.estado} onValueChange={(v) => u("estado", v)}>
                  <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Por iniciar">Por iniciar</SelectItem>
                    <SelectItem value="En curso">En curso</SelectItem>
                    <SelectItem value="Completada">Completada</SelectItem>
                    <SelectItem value="En riesgo">En riesgo</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-red-600" onClick={() => onChange({ ...data, iniciativas: inis.filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {CAT_MK.map((c) => {
            const n = inis.filter((x) => x.categoria === c).length;
            return n > 0 ? <Badge key={c} variant="outline">{c}: {n}</Badge> : null;
          })}
        </div>
      </div>

      <div>
        <Label>KPIs globales de marketing</Label>
        <Textarea rows={3} value={data.kpis_globales ?? ""} onChange={(e) => onChange({ ...data, kpis_globales: e.target.value })}
          placeholder="Ej. CAC, LTV, LTV/CAC, ROAS, payback, % marketing-sourced revenue, NPS de marca…" />
      </div>
    </div>
  );
}
