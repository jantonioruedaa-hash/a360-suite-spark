// Componentes de las secciones 1-5 del Plan Estratégico
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { ListaEditable } from "./ListaEditable";
import { lineasProductoSugeridas, pestelSugerido, efiSugerido, fodaSugerido, cameSugerido, valoresSugeridos, diagnosticoInternoSugerido, type SectorKey, type FactorPESTEL, type FactorEFI } from "@/lib/plan-catalogo";

// ─────────────────────────────────────────────────────────
// SECCIÓN 1 — PRESENTACIÓN EJECUTIVA
// ─────────────────────────────────────────────────────────
export interface Sec01Data {
  nombre_empresa?: string; sector?: string; industria?: string; pais?: string; ciudad?: string;
  anios_trayectoria?: number; periodo_inicio?: string; periodo_fin?: string;
  responsable_plan?: string; historia?: string;
  lineas_productos?: string[]; sectores_atendidos?: string; num_empleados?: number; presencia_geografica?: string;
}
export function Sec01({ data, onChange, sector }: { data: Sec01Data; onChange: (d: Sec01Data) => void; sector: SectorKey }) {
  const lineas = data.lineas_productos ?? lineasProductoSugeridas(sector);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Nombre empresa</Label><Input value={data.nombre_empresa ?? ""} onChange={(e) => onChange({ ...data, nombre_empresa: e.target.value })} /></div>
        <div><Label>Sector / Industria</Label><Input value={data.sector ?? ""} onChange={(e) => onChange({ ...data, sector: e.target.value })} /></div>
        <div><Label>País</Label><Input value={data.pais ?? ""} onChange={(e) => onChange({ ...data, pais: e.target.value })} /></div>
        <div><Label>Ciudad</Label><Input value={data.ciudad ?? ""} onChange={(e) => onChange({ ...data, ciudad: e.target.value })} /></div>
        <div><Label>Años de trayectoria</Label><Input type="number" value={data.anios_trayectoria ?? ""} onChange={(e) => onChange({ ...data, anios_trayectoria: Number(e.target.value) })} /></div>
        <div><Label>Nº empleados</Label><Input type="number" value={data.num_empleados ?? ""} onChange={(e) => onChange({ ...data, num_empleados: Number(e.target.value) })} /></div>
        <div><Label>Período del plan — inicio</Label><Input type="date" value={data.periodo_inicio ?? ""} onChange={(e) => onChange({ ...data, periodo_inicio: e.target.value })} /></div>
        <div><Label>Período del plan — fin</Label><Input type="date" value={data.periodo_fin ?? ""} onChange={(e) => onChange({ ...data, periodo_fin: e.target.value })} /></div>
        <div><Label>Responsable del plan</Label><Input value={data.responsable_plan ?? ""} onChange={(e) => onChange({ ...data, responsable_plan: e.target.value })} /></div>
        <div>
          <Label>Sectores atendidos</Label>
          <Select value={data.sectores_atendidos ?? ""} onValueChange={(v) => onChange({ ...data, sectores_atendidos: v })}>
            <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="B2B">B2B</SelectItem><SelectItem value="B2C">B2C</SelectItem><SelectItem value="Mixto">Mixto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Historia y descripción</Label><Textarea rows={4} value={data.historia ?? ""} onChange={(e) => onChange({ ...data, historia: e.target.value })} /></div>
      <div><Label>Presencia geográfica</Label><Input value={data.presencia_geografica ?? ""} onChange={(e) => onChange({ ...data, presencia_geografica: e.target.value })} placeholder="Ej. Quito, Guayaquil, Cuenca" /></div>
      <div>
        <Label>Líneas de productos y servicios <span className="text-xs text-muted-foreground">(sugeridas según sector — edita y agrega)</span></Label>
        <ListaEditable items={lineas} onChange={(v) => onChange({ ...data, lineas_productos: v })} placeholder="Línea de producto/servicio" inputLabel="+ Agregar línea" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SECCIÓN 2 — PESTEL
// ─────────────────────────────────────────────────────────
const DIMS_PESTEL = ["Politico", "Economico", "Social", "Tecnologico", "Ambiental", "Legal"] as const;
export interface Sec02Data { factores?: Record<string, FactorPESTEL[]>; }
export function Sec02({ data, onChange, sector }: { data: Sec02Data; onChange: (d: Sec02Data) => void; sector: SectorKey }) {
  const factores = data.factores ?? pestelSugerido(sector);
  const update = (dim: string, list: FactorPESTEL[]) => onChange({ factores: { ...factores, [dim]: list } });
  const add = (dim: string) => update(dim, [...(factores[dim] ?? []), { factor: "", descripcion: "", impacto: 3, tipo: "Oportunidad", observacion: "" }]);
  const remove = (dim: string, i: number) => update(dim, (factores[dim] ?? []).filter((_, idx) => idx !== i));
  const upd = (dim: string, i: number, k: keyof FactorPESTEL, v: string | number) =>
    update(dim, (factores[dim] ?? []).map((f, idx) => idx === i ? { ...f, [k]: v } : f));

  // Conteo para gráfico simple
  const allFactores = Object.values(factores).flat();
  const oportunidades = allFactores.filter(f => f.tipo === "Oportunidad");
  const amenazas = allFactores.filter(f => f.tipo === "Amenaza");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="a360-card p-4 border-l-4 border-green-500">
          <div className="text-xs text-muted-foreground">Oportunidades</div>
          <div className="text-2xl font-display text-green-700">{oportunidades.length}</div>
          <div className="text-xs">Impacto promedio: {oportunidades.length ? (oportunidades.reduce((a, b) => a + b.impacto, 0) / oportunidades.length).toFixed(1) : "—"}</div>
        </div>
        <div className="a360-card p-4 border-l-4 border-red-500">
          <div className="text-xs text-muted-foreground">Amenazas</div>
          <div className="text-2xl font-display text-red-700">{amenazas.length}</div>
          <div className="text-xs">Impacto promedio: {amenazas.length ? (amenazas.reduce((a, b) => a + b.impacto, 0) / amenazas.length).toFixed(1) : "—"}</div>
        </div>
      </div>
      {DIMS_PESTEL.map((dim) => (
        <div key={dim} className="a360-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-navy">{dim === "Politico" ? "Político" : dim === "Economico" ? "Económico" : dim === "Tecnologico" ? "Tecnológico" : dim}</h4>
            <Button size="sm" variant="outline" onClick={() => add(dim)}><Plus className="w-3 h-3 mr-1" />Factor</Button>
          </div>
          <div className="space-y-2">
            {(factores[dim] ?? []).map((f, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <Input className="col-span-3 h-8 text-sm" value={f.factor} onChange={(e) => upd(dim, i, "factor", e.target.value)} placeholder="Factor" />
                <Input className="col-span-4 h-8 text-sm" value={f.descripcion} onChange={(e) => upd(dim, i, "descripcion", e.target.value)} placeholder="Descripción" />
                <Input type="number" min={1} max={5} className="col-span-1 h-8 text-sm text-center" value={f.impacto} onChange={(e) => upd(dim, i, "impacto", Math.max(1, Math.min(5, Number(e.target.value))))} />
                <Select value={f.tipo} onValueChange={(v) => upd(dim, i, "tipo", v)}>
                  <SelectTrigger className="col-span-2 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oportunidad">Oportunidad</SelectItem>
                    <SelectItem value="Amenaza">Amenaza</SelectItem>
                  </SelectContent>
                </Select>
                <Input className="col-span-1 h-8 text-sm" value={f.observacion} onChange={(e) => upd(dim, i, "observacion", e.target.value)} placeholder="Obs." />
                <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-red-600" onClick={() => remove(dim, i)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SECCIÓN 3 — DIAGNÓSTICO INTERNO + EFI
// ─────────────────────────────────────────────────────────
export interface Sec03Data {
  recursos_clave?: string; procesos_criticos?: string; capacidades_distintivas?: string; areas_mejora?: string; cultura_actual?: string;
  factores?: FactorEFI[];
}
export function Sec03({ data, onChange, sector }: { data: Sec03Data; onChange: (d: Sec03Data) => void; sector: SectorKey }) {
  const factores = data.factores?.length ? data.factores : efiSugerido(sector);
  const sumPesos = factores.reduce((a, b) => a + b.peso, 0);
  const score = factores.reduce((a, b) => a + b.peso * b.calificacion, 0);
  const upd = (i: number, k: keyof FactorEFI, v: string | number) =>
    onChange({ ...data, factores: factores.map((f, idx) => idx === i ? { ...f, [k]: v } : f) });
  const add = () => onChange({ ...data, factores: [...factores, { factor: "", tipo: "Fortaleza", peso: 0, calificacion: 3 }] });
  const remove = (i: number) => onChange({ ...data, factores: factores.filter((_, idx) => idx !== i) });

  const guia = diagnosticoInternoSugerido(sector);

  const labels: [keyof Sec03Data, string][] = [
    ["recursos_clave", "Recursos clave"],
    ["procesos_criticos", "Procesos críticos"],
    ["capacidades_distintivas", "Capacidades distintivas"],
    ["areas_mejora", "Áreas de mejora"],
    ["cultura_actual", "Cultura organizacional actual"],
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Cada campo trae una guía de preguntas/elementos a desarrollar según el sector. Edítala según la realidad de la empresa.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {labels.map(([k, l]) => {
          const guiaValor = (guia as unknown as Record<string, string>)[k as string];
          const valor = (data as Record<string, string>)[k as string] ?? guiaValor ?? "";
          const placeholder = guiaValor;
          return (
            <div key={k as string}>
              <Label>{l}</Label>
              <Textarea rows={6} value={valor} placeholder={placeholder} onChange={(e) => onChange({ ...data, [k as string]: e.target.value })} />
            </div>
          );
        })}
      </div>

      <div className="a360-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h4 className="font-display text-navy">Matriz EFI</h4>
          <div className="flex items-center gap-3 text-sm">
            <span>Σ pesos: <span className={Math.abs(sumPesos - 1) > 0.01 ? "text-red-600 font-bold" : "text-green-700 font-bold"}>{sumPesos.toFixed(2)}</span></span>
            <Badge className={score >= 2.5 ? "bg-green-600" : "bg-red-600"}>Score: {score.toFixed(2)} — {score >= 2.5 ? "Posición fuerte" : "Posición débil"}</Badge>
            <Button size="sm" variant="outline" onClick={add}><Plus className="w-3 h-3 mr-1" />Factor</Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1">
            <div className="col-span-5">Factor</div><div className="col-span-2">Tipo</div><div className="col-span-1">Peso</div><div className="col-span-1">Calif.</div><div className="col-span-2">Ponderado</div><div className="col-span-1"></div>
          </div>
          {factores.map((f, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input className="col-span-5 h-8 text-sm" value={f.factor} onChange={(e) => upd(i, "factor", e.target.value)} />
              <Select value={f.tipo} onValueChange={(v) => upd(i, "tipo", v)}>
                <SelectTrigger className="col-span-2 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Fortaleza">Fortaleza</SelectItem><SelectItem value="Debilidad">Debilidad</SelectItem></SelectContent>
              </Select>
              <Input type="number" step="0.01" min={0} max={1} className="col-span-1 h-8 text-sm" value={f.peso} onChange={(e) => upd(i, "peso", Number(e.target.value))} />
              <Input type="number" min={1} max={4} className="col-span-1 h-8 text-sm" value={f.calificacion} onChange={(e) => upd(i, "calificacion", Math.max(1, Math.min(4, Number(e.target.value))))} />
              <div className="col-span-2 text-sm font-mono">{(f.peso * f.calificacion).toFixed(2)}</div>
              <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-red-600" onClick={() => remove(i)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
        {Math.abs(sumPesos - 1) > 0.01 && <p className="text-xs text-red-600 mt-2">⚠ La suma de pesos debe ser exactamente 1.00</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SECCIÓN 4 — FODA + CAME
// ─────────────────────────────────────────────────────────
export interface Sec04Data {
  fortalezas?: string[]; debilidades?: string[]; oportunidades?: string[]; amenazas?: string[];
  came_corregir?: string[]; came_afrontar?: string[]; came_mantener?: string[]; came_explotar?: string[];
}
export function Sec04({ data, onChange, sector }: { data: Sec04Data; onChange: (d: Sec04Data) => void; sector: SectorKey }) {
  const sug = fodaSugerido(sector);
  const came = cameSugerido();
  const get = (k: keyof Sec04Data, fallback: string[]) => (data[k] as string[] | undefined) ?? fallback;
  const set = (k: keyof Sec04Data, v: string[]) => onChange({ ...data, [k]: v });

  const cuadrante = (key: keyof Sec04Data, titulo: string, fallback: string[], color: string) => (
    <div className={`a360-card p-4 border-l-4 ${color}`}>
      <h4 className="font-display text-navy mb-2">{titulo} <span className="text-xs text-muted-foreground">({get(key, fallback).length})</span></h4>
      <ListaEditable items={get(key, fallback)} onChange={(v) => set(key, v)} placeholder={titulo.slice(0, -1).toLowerCase()} inputLabel="+ Agregar" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cuadrante("fortalezas",    "Fortalezas",    sug.fortalezas,    "border-green-500")}
        {cuadrante("oportunidades", "Oportunidades", sug.oportunidades, "border-blue-500")}
        {cuadrante("debilidades",   "Debilidades",   sug.debilidades,   "border-yellow-500")}
        {cuadrante("amenazas",      "Amenazas",      sug.amenazas,      "border-red-500")}
      </div>
      <h3 className="font-display text-lg text-navy mt-6">CAME — Acciones derivadas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cuadrante("came_corregir", "Corregir Debilidades", came.corregir, "border-yellow-600")}
        {cuadrante("came_afrontar", "Afrontar Amenazas",    came.afrontar, "border-red-600")}
        {cuadrante("came_mantener", "Mantener Fortalezas",  came.mantener, "border-green-600")}
        {cuadrante("came_explotar", "Explotar Oportunidades", came.explotar, "border-blue-600")}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SECCIÓN 5 — DECLARACIÓN ESTRATÉGICA
// ─────────────────────────────────────────────────────────
export interface ValorCorp { nombre: string; descripcion: string; }
export interface Sec05Data {
  mision?: string; vision?: string; proposito?: string;
  valores?: ValorCorp[];
  filosofia?: string; posicionamiento?: string; propuesta_valor?: string;
}
export function Sec05({ data, onChange }: { data: Sec05Data; onChange: (d: Sec05Data) => void }) {
  const valores = data.valores ?? valoresSugeridos();
  const upd = (i: number, k: "nombre" | "descripcion", v: string) =>
    onChange({ ...data, valores: valores.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const add = () => onChange({ ...data, valores: [...valores, { nombre: "", descripcion: "" }] });
  const remove = (i: number) => onChange({ ...data, valores: valores.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div><Label>Misión</Label><Textarea rows={3} value={data.mision ?? ""} onChange={(e) => onChange({ ...data, mision: e.target.value })} placeholder="¿Para qué existimos? ¿A quién servimos? ¿Cómo lo hacemos?" /></div>
        <div><Label>Visión</Label><Textarea rows={3} value={data.vision ?? ""} onChange={(e) => onChange({ ...data, vision: e.target.value })} placeholder="¿En qué queremos convertirnos en 3-5 años?" /></div>
        <div><Label>Propósito superior</Label><Textarea rows={2} value={data.proposito ?? ""} onChange={(e) => onChange({ ...data, proposito: e.target.value })} placeholder="¿Qué cambio profundo aspiramos a generar en el mundo?" /></div>
        <div><Label>Filosofía de marca</Label><Textarea rows={2} value={data.filosofia ?? ""} onChange={(e) => onChange({ ...data, filosofia: e.target.value })} /></div>
        <div><Label>Posicionamiento deseado</Label><Textarea rows={2} value={data.posicionamiento ?? ""} onChange={(e) => onChange({ ...data, posicionamiento: e.target.value })} /></div>
        <div><Label>Propuesta de valor central</Label><Textarea rows={3} value={data.propuesta_valor ?? ""} onChange={(e) => onChange({ ...data, propuesta_valor: e.target.value })} /></div>
      </div>
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-navy">Valores corporativos</h4>
          <Button size="sm" variant="outline" onClick={add}><Plus className="w-3 h-3 mr-1" />Valor</Button>
        </div>
        <div className="space-y-2">
          {valores.map((v, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <Input className="col-span-3 h-9 text-sm" value={v.nombre} onChange={(e) => upd(i, "nombre", e.target.value)} placeholder="Nombre del valor" />
              <Input className="col-span-8 h-9 text-sm" value={v.descripcion} onChange={(e) => upd(i, "descripcion", e.target.value)} placeholder="¿Qué significa en la práctica?" />
              <Button size="icon" variant="ghost" className="col-span-1 h-9 w-9 text-red-600" onClick={() => remove(i)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
