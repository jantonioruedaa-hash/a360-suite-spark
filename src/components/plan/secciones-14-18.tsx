// Componentes Fase 4 — Secciones 14-18 (Talento, TI, Seguimiento, CMI, Ejecución)
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
  // Sec 14
  type Sec14Data, type IniciativaTalento, type AreaTalento,
  valoresCulturalesSugeridos, competenciasClaveSugeridas, iniciativasTalentoSugeridas,
  // Sec 15
  type Sec15Data, type IniciativaTI, type CategoriaTI, type MadurezDigital,
  iniciativasTISugeridas,
  // Sec 16
  type Sec16Data, type RiesgoEstrategico, type CategoriaRiesgo, type AccionMejora,
  riesgosSugeridos, accionesMejoraSugeridas,
  // Sec 17
  type Sec17Data, type ObjetivoCMI, type PerspectivaCMI,
  objetivosCMISugeridos,
  // Sec 18
  type Sec18Data, type IniciativaEjecucion,
  iniciativasEjecucionSugeridas,
} from "@/lib/plan-catalogo";

export type { Sec14Data, Sec15Data, Sec16Data, Sec17Data, Sec18Data };

// ════════════════════════════════════════════════════════
// SECCIÓN 14 — Talento y cultura
// ════════════════════════════════════════════════════════
const AREAS_TAL: AreaTalento[] = ["Atracción", "Desarrollo", "Retención", "Cultura", "Compensación", "Bienestar", "DEI", "Liderazgo", "Sucesión"];

export function Sec14({ data, onChange, sector }: { data: Sec14Data; onChange: (d: Sec14Data) => void; sector: SectorKey }) {
  const inis = data.iniciativas ?? [];
  const upd = (i: number, k: keyof IniciativaTalento, v: string | number) =>
    onChange({ ...data, iniciativas: inis.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const rem = (i: number) => onChange({ ...data, iniciativas: inis.filter((_, idx) => idx !== i) });
  const add = () => onChange({ ...data, iniciativas: [...inis, { nombre: "", area: "Atracción", objetivo: "", kpi: "", responsable: "RRHH", presupuesto: 0, estado: "Por iniciar" }] });
  const cargar = () => onChange({ ...data, iniciativas: iniciativasTalentoSugeridas(sector) });
  const totalPpto = inis.reduce((a, b) => a + (Number(b.presupuesto) || 0), 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define la visión de talento, valores y competencias clave, y articula los planes de atracción, desarrollo, retención, compensación y cultura. Soporta la ejecución del resto del plan estratégico.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Visión de talento</Label>
          <Textarea rows={4} value={data.vision_talento ?? ""} onChange={(e) => onChange({ ...data, vision_talento: e.target.value })}
            placeholder="¿Qué tipo de organización queremos ser para nuestra gente y qué talento necesitamos para ejecutar la estrategia?" />
        </div>
        <div>
          <Label>Estructura organizacional</Label>
          <Textarea rows={4} value={data.estructura_organizacional ?? ""} onChange={(e) => onChange({ ...data, estructura_organizacional: e.target.value })}
            placeholder="Estructura actual y cambios necesarios para soportar la estrategia (nuevos roles, áreas, comités)." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Valores culturales</Label>
          <ListaEditable items={data.valores_culturales ?? []} onChange={(v) => onChange({ ...data, valores_culturales: v })} placeholder="Ej. Integridad" inputLabel="+ Valor" />
          <div className="mt-2"><Button size="sm" variant="outline" onClick={() => onChange({ ...data, valores_culturales: valoresCulturalesSugeridos() })}><Sparkles className="w-3 h-3 mr-1" />Cargar valores sugeridos</Button></div>
        </div>
        <div>
          <Label>Competencias clave</Label>
          <ListaEditable items={data.competencias_clave ?? []} onChange={(v) => onChange({ ...data, competencias_clave: v })} placeholder="Ej. Liderazgo de equipos" inputLabel="+ Competencia" />
          <div className="mt-2"><Button size="sm" variant="outline" onClick={() => onChange({ ...data, competencias_clave: competenciasClaveSugeridas(sector) })}><Sparkles className="w-3 h-3 mr-1" />Cargar competencias sugeridas</Button></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><Label>Plan de atracción</Label><Textarea rows={4} value={data.plan_atraccion ?? ""} onChange={(e) => onChange({ ...data, plan_atraccion: e.target.value })} placeholder="EVP, marca empleadora, fuentes de talento, onboarding." /></div>
        <div><Label>Plan de desarrollo</Label><Textarea rows={4} value={data.plan_desarrollo ?? ""} onChange={(e) => onChange({ ...data, plan_desarrollo: e.target.value })} placeholder="PDI, academia, mentoring, evaluación de desempeño." /></div>
        <div><Label>Plan de retención</Label><Textarea rows={4} value={data.plan_retencion ?? ""} onChange={(e) => onChange({ ...data, plan_retencion: e.target.value })} placeholder="Retención de talento crítico, planes de carrera, reconocimiento." /></div>
        <div><Label>Compensación y beneficios</Label><Textarea rows={4} value={data.compensacion_beneficios ?? ""} onChange={(e) => onChange({ ...data, compensacion_beneficios: e.target.value })} placeholder="Bandas salariales, variable, beneficios y total reward." /></div>
        <div><Label>Evaluación del desempeño</Label><Textarea rows={4} value={data.evaluacion_desempeno ?? ""} onChange={(e) => onChange({ ...data, evaluacion_desempeno: e.target.value })} placeholder="Modelo, frecuencia, calibración y vínculo con compensación." /></div>
        <div><Label>Plan de sucesión</Label><Textarea rows={4} value={data.plan_sucesion ?? ""} onChange={(e) => onChange({ ...data, plan_sucesion: e.target.value })} placeholder="Roles críticos, sucesores listos y planes de desarrollo." /></div>
        <div><Label>Diversidad, equidad e inclusión</Label><Textarea rows={4} value={data.diversidad_inclusion ?? ""} onChange={(e) => onChange({ ...data, diversidad_inclusion: e.target.value })} placeholder="Compromiso, métricas y prácticas DEI." /></div>
        <div><Label>Clima organizacional</Label><Textarea rows={4} value={data.clima_organizacional ?? ""} onChange={(e) => onChange({ ...data, clima_organizacional: e.target.value })} placeholder="Cómo medimos y actuamos sobre el clima (eNPS, encuestas)." /></div>
      </div>

      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Iniciativas de talento ({inis.length})</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Presupuesto: ${totalPpto.toLocaleString()}</Badge>
            <Button size="sm" variant="outline" onClick={cargar}><Sparkles className="w-3 h-3 mr-1" />Cargar plantilla</Button>
            <Button size="sm" variant="outline" onClick={add}><Plus className="w-3 h-3 mr-1" />Iniciativa</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1 min-w-[1300px]">
            <div className="col-span-3">Iniciativa</div><div className="col-span-1">Área</div>
            <div className="col-span-3">Objetivo</div><div className="col-span-2">KPI</div>
            <div className="col-span-1">Responsable</div><div className="col-span-1">Ppto.</div><div className="col-span-1">Estado</div>
          </div>
          {inis.length === 0 && <p className="text-xs text-muted-foreground italic">Sin iniciativas de talento aún.</p>}
          {inis.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start min-w-[1300px]">
              <Input className="col-span-3 h-8 text-sm" value={r.nombre} onChange={(e) => upd(i, "nombre", e.target.value)} />
              <Select value={r.area} onValueChange={(v) => upd(i, "area", v)}>
                <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{AREAS_TAL.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="col-span-3 h-8 text-sm" value={r.objetivo} onChange={(e) => upd(i, "objetivo", e.target.value)} />
              <Input className="col-span-2 h-8 text-sm" value={r.kpi} onChange={(e) => upd(i, "kpi", e.target.value)} />
              <Input className="col-span-1 h-8 text-sm" value={r.responsable} onChange={(e) => upd(i, "responsable", e.target.value)} />
              <Input type="number" className="col-span-1 h-8 text-sm" value={r.presupuesto} onChange={(e) => upd(i, "presupuesto", Number(e.target.value))} />
              <div className="col-span-1 flex items-center gap-1">
                <Select value={r.estado} onValueChange={(v) => upd(i, "estado", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Por iniciar","En curso","Completada","En riesgo"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => rem(i)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {AREAS_TAL.map((t) => {
            const c = inis.filter((x) => x.area === t).length;
            return c > 0 ? <Badge key={t} variant="outline">{t}: {c}</Badge> : null;
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SECCIÓN 15 — TI y transformación digital
// ════════════════════════════════════════════════════════
const CATS_TI: CategoriaTI[] = ["Infraestructura", "Datos & BI", "Aplicaciones", "Ciberseguridad", "IA y automatización", "Experiencia digital", "Cultura digital", "Cumplimiento"];
const NIV_MAD: MadurezDigital[] = ["Inicial", "En desarrollo", "Definida", "Gestionada", "Optimizada"];

export function Sec15({ data, onChange, sector }: { data: Sec15Data; onChange: (d: Sec15Data) => void; sector: SectorKey }) {
  const inis = data.iniciativas ?? [];
  const upd = (i: number, k: keyof IniciativaTI, v: string | number) =>
    onChange({ ...data, iniciativas: inis.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const rem = (i: number) => onChange({ ...data, iniciativas: inis.filter((_, idx) => idx !== i) });
  const add = () => onChange({ ...data, iniciativas: [...inis, { nombre: "", categoria: "Infraestructura", objetivo: "", kpi: "", responsable: "TI", presupuesto: 0, prioridad: "Media", estado: "Por iniciar" }] });
  const cargar = () => onChange({ ...data, iniciativas: iniciativasTISugeridas(sector) });
  const totalPpto = inis.reduce((a, b) => a + (Number(b.presupuesto) || 0), 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define la visión digital, el nivel de madurez actual, los pilares (datos, ciberseguridad, IA, experiencia digital) y el portafolio de iniciativas tecnológicas con sus KPIs.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Label>Visión digital</Label>
          <Textarea rows={4} value={data.vision_digital ?? ""} onChange={(e) => onChange({ ...data, vision_digital: e.target.value })}
            placeholder="¿Qué papel juega la tecnología en la estrategia? ¿Qué queremos lograr en 3 años?" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label>Madurez digital actual</Label>
            <Select value={data.madurez_digital ?? ""} onValueChange={(v) => onChange({ ...data, madurez_digital: v as MadurezDigital })}>
              <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
              <SelectContent>{NIV_MAD.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Inversión TI (% ventas)</Label>
            <Input value={data.inversion_ti_pct ?? ""} onChange={(e) => onChange({ ...data, inversion_ti_pct: e.target.value })} placeholder="Ej. 4%" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label>Arquitectura actual</Label><Textarea rows={4} value={data.arquitectura_actual ?? ""} onChange={(e) => onChange({ ...data, arquitectura_actual: e.target.value })} placeholder="Sistemas core, integraciones y deuda técnica." /></div>
        <div><Label>Arquitectura objetivo</Label><Textarea rows={4} value={data.arquitectura_objetivo ?? ""} onChange={(e) => onChange({ ...data, arquitectura_objetivo: e.target.value })} placeholder="Plataforma y stack al que queremos llegar." /></div>
        <div><Label>Gobierno de datos</Label><Textarea rows={4} value={data.gobierno_datos ?? ""} onChange={(e) => onChange({ ...data, gobierno_datos: e.target.value })} placeholder="Dueños, calidad, modelo, BI y data warehouse." /></div>
        <div><Label>Ciberseguridad</Label><Textarea rows={4} value={data.ciberseguridad ?? ""} onChange={(e) => onChange({ ...data, ciberseguridad: e.target.value })} placeholder="Plan director, identidades, backups, DRP/BCP." /></div>
        <div><Label>Cumplimiento normativo</Label><Textarea rows={4} value={data.cumplimiento_normativo ?? ""} onChange={(e) => onChange({ ...data, cumplimiento_normativo: e.target.value })} placeholder="Protección de datos, sectorial, certificaciones." /></div>
        <div><Label>Adopción de IA</Label><Textarea rows={4} value={data.adopcion_ia ?? ""} onChange={(e) => onChange({ ...data, adopcion_ia: e.target.value })} placeholder="Casos de uso priorizados, gobernanza y gestión de riesgos de IA." /></div>
        <div><Label>Automatización de procesos</Label><Textarea rows={4} value={data.automatizacion_procesos ?? ""} onChange={(e) => onChange({ ...data, automatizacion_procesos: e.target.value })} placeholder="RPA, workflows e iniciativas hyperautomation." /></div>
        <div><Label>Experiencia digital del cliente</Label><Textarea rows={4} value={data.experiencia_cliente_digital ?? ""} onChange={(e) => onChange({ ...data, experiencia_cliente_digital: e.target.value })} placeholder="Web, app, omnicanalidad y self-service." /></div>
        <div className="md:col-span-2"><Label>Cultura digital</Label><Textarea rows={3} value={data.cultura_digital ?? ""} onChange={(e) => onChange({ ...data, cultura_digital: e.target.value })} placeholder="Adopción, upskilling, gestión del cambio, modelo data-driven." /></div>
      </div>

      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Iniciativas de TI / Digital ({inis.length})</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Presupuesto: ${totalPpto.toLocaleString()}</Badge>
            <Button size="sm" variant="outline" onClick={cargar}><Sparkles className="w-3 h-3 mr-1" />Cargar plantilla</Button>
            <Button size="sm" variant="outline" onClick={add}><Plus className="w-3 h-3 mr-1" />Iniciativa</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1 min-w-[1400px]">
            <div className="col-span-3">Iniciativa</div><div className="col-span-2">Categoría</div>
            <div className="col-span-2">Objetivo</div><div className="col-span-2">KPI</div>
            <div className="col-span-1">Resp.</div><div className="col-span-1">Ppto.</div>
            <div className="col-span-1">Prio.</div>
          </div>
          {inis.length === 0 && <p className="text-xs text-muted-foreground italic">Sin iniciativas TI aún.</p>}
          {inis.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start min-w-[1400px]">
              <Input className="col-span-3 h-8 text-sm" value={r.nombre} onChange={(e) => upd(i, "nombre", e.target.value)} />
              <Select value={r.categoria} onValueChange={(v) => upd(i, "categoria", v)}>
                <SelectTrigger className="col-span-2 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{CATS_TI.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="col-span-2 h-8 text-sm" value={r.objetivo} onChange={(e) => upd(i, "objetivo", e.target.value)} />
              <Input className="col-span-2 h-8 text-sm" value={r.kpi} onChange={(e) => upd(i, "kpi", e.target.value)} />
              <Input className="col-span-1 h-8 text-sm" value={r.responsable} onChange={(e) => upd(i, "responsable", e.target.value)} />
              <Input type="number" className="col-span-1 h-8 text-sm" value={r.presupuesto} onChange={(e) => upd(i, "presupuesto", Number(e.target.value))} />
              <div className="col-span-1 flex items-center gap-1">
                <Select value={r.prioridad} onValueChange={(v) => upd(i, "prioridad", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem><SelectItem value="Media">Media</SelectItem><SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => rem(i)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {CATS_TI.map((t) => {
            const c = inis.filter((x) => x.categoria === t).length;
            return c > 0 ? <Badge key={t} variant="outline">{t}: {c}</Badge> : null;
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SECCIÓN 16 — Seguimiento y mejora continua
// ════════════════════════════════════════════════════════
const CATS_RIESGO: CategoriaRiesgo[] = ["Estratégico", "Operacional", "Financiero", "Mercado", "Cumplimiento", "Tecnológico", "Reputacional", "ESG", "Talento"];

export function Sec16({ data, onChange, sector }: { data: Sec16Data; onChange: (d: Sec16Data) => void; sector: SectorKey }) {
  const riesgos = data.riesgos ?? [];
  const mejoras = data.mejoras ?? [];

  const updR = (i: number, k: keyof RiesgoEstrategico, v: string | number) =>
    onChange({ ...data, riesgos: riesgos.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const remR = (i: number) => onChange({ ...data, riesgos: riesgos.filter((_, idx) => idx !== i) });
  const addR = () => onChange({ ...data, riesgos: [...riesgos, { nombre: "", categoria: "Estratégico", probabilidad: 3, impacto: 3, mitigacion: "", responsable: "", estado: "Identificado" }] });
  const cargarR = () => onChange({ ...data, riesgos: riesgosSugeridos(sector) });

  const updM = (i: number, k: keyof AccionMejora, v: string) =>
    onChange({ ...data, mejoras: mejoras.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const remM = (i: number) => onChange({ ...data, mejoras: mejoras.filter((_, idx) => idx !== i) });
  const addM = () => onChange({ ...data, mejoras: [...mejoras, { proceso: "", problema: "", accion: "", responsable: "", plazo: "", estado: "Por iniciar", beneficio_esperado: "" }] });
  const cargarM = () => onChange({ ...data, mejoras: accionesMejoraSugeridas() });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define el modelo de seguimiento, gobernanza, cadencia de revisiones, gestión de riesgos y mejora continua del plan.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label>Modelo de seguimiento</Label><Textarea rows={4} value={data.modelo_seguimiento ?? ""} onChange={(e) => onChange({ ...data, modelo_seguimiento: e.target.value })} placeholder="Cómo seguimos la ejecución del plan: tableros, reportes, revisiones." /></div>
        <div><Label>Cadencia de revisiones</Label><Textarea rows={4} value={data.cadencia_revisiones ?? ""} onChange={(e) => onChange({ ...data, cadencia_revisiones: e.target.value })} placeholder="Diaria operativa, semanal de áreas, mensual de comité, trimestral estratégica." /></div>
        <div><Label>Comités y gobernanza</Label><Textarea rows={4} value={data.comites_y_gobernanza ?? ""} onChange={(e) => onChange({ ...data, comites_y_gobernanza: e.target.value })} placeholder="Comités, integrantes, propósito y agenda." /></div>
        <div>
          <Label>Metodología de mejora</Label>
          <Select value={data.metodologia_mejora ?? ""} onValueChange={(v) => onChange({ ...data, metodologia_mejora: v })}>
            <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {["PDCA","Kaizen","Lean","Six Sigma","Lean Six Sigma","OKR","Scrum","Mixta"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Label className="mt-3">Herramientas de seguimiento</Label>
          <Input value={data.herramientas_seguimiento ?? ""} onChange={(e) => onChange({ ...data, herramientas_seguimiento: e.target.value })} placeholder="Power BI, Looker, Tableau, A360SGP…" />
        </div>
        <div><Label>Indicadores globales del plan</Label><Textarea rows={4} value={data.indicadores_globales ?? ""} onChange={(e) => onChange({ ...data, indicadores_globales: e.target.value })} placeholder="KPIs maestros del plan estratégico." /></div>
        <div><Label>Aprendizaje organizacional</Label><Textarea rows={4} value={data.aprendizaje_organizacional ?? ""} onChange={(e) => onChange({ ...data, aprendizaje_organizacional: e.target.value })} placeholder="Lecciones aprendidas, post-mortems, gestión del conocimiento." /></div>
      </div>

      {/* RIESGOS */}
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Riesgos estratégicos ({riesgos.length})</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cargarR}><Sparkles className="w-3 h-3 mr-1" />Cargar riesgos sugeridos</Button>
            <Button size="sm" variant="outline" onClick={addR}><Plus className="w-3 h-3 mr-1" />Riesgo</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1 min-w-[1300px]">
            <div className="col-span-3">Riesgo</div><div className="col-span-2">Categoría</div>
            <div className="col-span-1">Prob (1-5)</div><div className="col-span-1">Impacto</div>
            <div className="col-span-3">Mitigación</div><div className="col-span-1">Resp.</div><div className="col-span-1">Estado</div>
          </div>
          {riesgos.length === 0 && <p className="text-xs text-muted-foreground italic">Sin riesgos registrados.</p>}
          {riesgos.map((r, i) => {
            const exposicion = (r.probabilidad || 0) * (r.impacto || 0);
            const color = exposicion >= 15 ? "text-red-600" : exposicion >= 9 ? "text-amber-600" : "text-emerald-600";
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-start min-w-[1300px]">
                <div className="col-span-3 flex items-center gap-1">
                  <Input className="h-8 text-sm" value={r.nombre} onChange={(e) => updR(i, "nombre", e.target.value)} />
                  <span className={`text-[10px] font-mono ${color}`}>×{exposicion}</span>
                </div>
                <Select value={r.categoria} onValueChange={(v) => updR(i, "categoria", v)}>
                  <SelectTrigger className="col-span-2 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATS_RIESGO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" min={1} max={5} className="col-span-1 h-8 text-sm" value={r.probabilidad} onChange={(e) => updR(i, "probabilidad", Number(e.target.value))} />
                <Input type="number" min={1} max={5} className="col-span-1 h-8 text-sm" value={r.impacto} onChange={(e) => updR(i, "impacto", Number(e.target.value))} />
                <Input className="col-span-3 h-8 text-sm" value={r.mitigacion} onChange={(e) => updR(i, "mitigacion", e.target.value)} />
                <Input className="col-span-1 h-8 text-sm" value={r.responsable} onChange={(e) => updR(i, "responsable", e.target.value)} />
                <div className="col-span-1 flex items-center gap-1">
                  <Select value={r.estado} onValueChange={(v) => updR(i, "estado", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Identificado","En tratamiento","Mitigado","Materializado"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => remR(i)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MEJORAS */}
      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Acciones de mejora continua ({mejoras.length})</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cargarM}><Sparkles className="w-3 h-3 mr-1" />Cargar mejoras sugeridas</Button>
            <Button size="sm" variant="outline" onClick={addM}><Plus className="w-3 h-3 mr-1" />Acción</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1 min-w-[1300px]">
            <div className="col-span-2">Proceso</div><div className="col-span-3">Problema</div>
            <div className="col-span-3">Acción</div><div className="col-span-1">Resp.</div>
            <div className="col-span-1">Plazo</div><div className="col-span-1">Estado</div><div className="col-span-1">Beneficio</div>
          </div>
          {mejoras.length === 0 && <p className="text-xs text-muted-foreground italic">Sin acciones de mejora.</p>}
          {mejoras.map((m, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start min-w-[1300px]">
              <Input className="col-span-2 h-8 text-sm" value={m.proceso} onChange={(e) => updM(i, "proceso", e.target.value)} />
              <Input className="col-span-3 h-8 text-sm" value={m.problema} onChange={(e) => updM(i, "problema", e.target.value)} />
              <Input className="col-span-3 h-8 text-sm" value={m.accion} onChange={(e) => updM(i, "accion", e.target.value)} />
              <Input className="col-span-1 h-8 text-sm" value={m.responsable} onChange={(e) => updM(i, "responsable", e.target.value)} />
              <Input className="col-span-1 h-8 text-sm" value={m.plazo} onChange={(e) => updM(i, "plazo", e.target.value)} />
              <Select value={m.estado} onValueChange={(v) => updM(i, "estado", v)}>
                <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Por iniciar","En curso","Completada"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="col-span-1 flex items-center gap-1">
                <Input className="h-8 text-sm" value={m.beneficio_esperado} onChange={(e) => updM(i, "beneficio_esperado", e.target.value)} />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => remM(i)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Gestión de riesgos (enfoque general)</Label>
        <Textarea rows={3} value={data.gestion_riesgos ?? ""} onChange={(e) => onChange({ ...data, gestion_riesgos: e.target.value })}
          placeholder="Modelo ERM, apetito de riesgo, comité de riesgos, periodicidad y reporte." />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SECCIÓN 17 — CMI / Balanced Scorecard
// ════════════════════════════════════════════════════════
const PERSPS: PerspectivaCMI[] = ["Financiera", "Cliente", "Procesos internos", "Aprendizaje y crecimiento"];
const COLOR_PER: Record<PerspectivaCMI, string> = {
  "Financiera": "border-emerald-500",
  "Cliente": "border-blue-500",
  "Procesos internos": "border-amber-500",
  "Aprendizaje y crecimiento": "border-violet-500",
};

export function Sec17({ data, onChange, sector }: { data: Sec17Data; onChange: (d: Sec17Data) => void; sector: SectorKey }) {
  const objs = data.objetivos ?? [];

  const upd = (i: number, k: keyof ObjetivoCMI, v: string) =>
    onChange({ ...data, objetivos: objs.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const rem = (i: number) => onChange({ ...data, objetivos: objs.filter((_, idx) => idx !== i) });
  const addAt = (p: PerspectivaCMI) => onChange({ ...data, objetivos: [...objs, { perspectiva: p, objetivo: "", indicador: "", unidad: "", linea_base: "", meta: "", frecuencia: "Mensual", responsable: "", iniciativa: "" }] });
  const cargar = () => onChange({ ...data, objetivos: objetivosCMISugeridos(sector) });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Construye el Cuadro de Mando Integral con las cuatro perspectivas (Financiera, Cliente, Procesos, Aprendizaje), articulando objetivos, indicadores, metas e iniciativas asociadas.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label>Visión del CMI</Label><Textarea rows={4} value={data.vision_cmi ?? ""} onChange={(e) => onChange({ ...data, vision_cmi: e.target.value })} placeholder="Por qué adoptamos un CMI y qué queremos lograr con él." /></div>
        <div><Label>Mapa estratégico</Label><Textarea rows={4} value={data.mapa_estrategico ?? ""} onChange={(e) => onChange({ ...data, mapa_estrategico: e.target.value })} placeholder="Relaciones causa-efecto entre objetivos de las cuatro perspectivas." /></div>
        <div><Label>Metodología</Label><Input value={data.metodologia ?? ""} onChange={(e) => onChange({ ...data, metodologia: e.target.value })} placeholder="Kaplan & Norton, OKR, mixta…" /></div>
        <div><Label>Cadencia de revisión</Label><Input value={data.cadencia_revision ?? ""} onChange={(e) => onChange({ ...data, cadencia_revision: e.target.value })} placeholder="Mensual operativa, trimestral estratégica" /></div>
        <div className="md:col-span-2"><Label>Herramientas</Label><Input value={data.herramientas ?? ""} onChange={(e) => onChange({ ...data, herramientas: e.target.value })} placeholder="A360SGP, Power BI, Looker, hoja de cálculo…" /></div>
      </div>

      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Objetivos del CMI ({objs.length})</h4>
          <Button size="sm" variant="outline" onClick={cargar}><Sparkles className="w-3 h-3 mr-1" />Cargar plantilla CMI</Button>
        </div>
        {PERSPS.map((p) => {
          const lista = objs.map((o, idx) => ({ o, idx })).filter(({ o }) => o.perspectiva === p);
          return (
            <div key={p} className={`mb-3 p-3 rounded border-l-4 ${COLOR_PER[p]} bg-muted/20`}>
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-navy text-sm">{p} <span className="text-xs text-muted-foreground">({lista.length})</span></h5>
                <Button size="sm" variant="outline" onClick={() => addAt(p)}><Plus className="w-3 h-3 mr-1" />Objetivo</Button>
              </div>
              <div className="space-y-1 overflow-x-auto">
                <div className="grid grid-cols-12 gap-2 text-[11px] text-muted-foreground font-semibold border-b pb-1 min-w-[1400px]">
                  <div className="col-span-3">Objetivo</div><div className="col-span-2">Indicador</div>
                  <div className="col-span-1">Unidad</div><div className="col-span-1">L. base</div>
                  <div className="col-span-1">Meta</div><div className="col-span-1">Frec.</div>
                  <div className="col-span-1">Resp.</div><div className="col-span-2">Iniciativa</div>
                </div>
                {lista.map(({ o, idx }) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-start min-w-[1400px]">
                    <Input className="col-span-3 h-8 text-sm" value={o.objetivo} onChange={(e) => upd(idx, "objetivo", e.target.value)} />
                    <Input className="col-span-2 h-8 text-sm" value={o.indicador} onChange={(e) => upd(idx, "indicador", e.target.value)} />
                    <Input className="col-span-1 h-8 text-sm" value={o.unidad} onChange={(e) => upd(idx, "unidad", e.target.value)} />
                    <Input className="col-span-1 h-8 text-sm" value={o.linea_base} onChange={(e) => upd(idx, "linea_base", e.target.value)} />
                    <Input className="col-span-1 h-8 text-sm" value={o.meta} onChange={(e) => upd(idx, "meta", e.target.value)} />
                    <Select value={o.frecuencia} onValueChange={(v) => upd(idx, "frecuencia", v)}>
                      <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Mensual","Trimestral","Semestral","Anual"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input className="col-span-1 h-8 text-sm" value={o.responsable} onChange={(e) => upd(idx, "responsable", e.target.value)} />
                    <div className="col-span-2 flex items-center gap-1">
                      <Input className="h-8 text-sm" value={o.iniciativa} onChange={(e) => upd(idx, "iniciativa", e.target.value)} />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => rem(idx)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SECCIÓN 18 — Ejecución y portafolio de iniciativas
// ════════════════════════════════════════════════════════
export function Sec18({ data, onChange, sector }: { data: Sec18Data; onChange: (d: Sec18Data) => void; sector: SectorKey }) {
  const inis = data.iniciativas ?? [];
  const upd = (i: number, k: keyof IniciativaEjecucion, v: string | number) =>
    onChange({ ...data, iniciativas: inis.map((x, idx) => idx === i ? { ...x, [k]: v } : x) });
  const rem = (i: number) => onChange({ ...data, iniciativas: inis.filter((_, idx) => idx !== i) });
  const add = () => onChange({ ...data, iniciativas: [...inis, { nombre: "", eje_estrategico: "", descripcion: "", responsable: "", fecha_inicio: "", fecha_fin: "", presupuesto: 0, prioridad: "Media", estado: "Por iniciar", kpi: "", dependencias: "" }] });
  const cargar = () => onChange({ ...data, iniciativas: iniciativasEjecucionSugeridas(sector) });
  const totalPpto = inis.reduce((a, b) => a + (Number(b.presupuesto) || 0), 0);
  const porEstado = (e: string) => inis.filter((x) => x.estado === e).length;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Cierra el plan estratégico definiendo el modelo de ejecución, gobernanza, gestión del cambio y el portafolio consolidado de iniciativas con responsables, plazos, presupuesto y KPIs.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label>Modelo de ejecución</Label><Textarea rows={4} value={data.modelo_ejecucion ?? ""} onChange={(e) => onChange({ ...data, modelo_ejecucion: e.target.value })} placeholder="Cómo se ejecuta el plan: roles, responsabilidades, sponsors, equipos." /></div>
        <div><Label>Prioridades estratégicas (top 3-5)</Label><Textarea rows={4} value={data.prioridades_estrategicas ?? ""} onChange={(e) => onChange({ ...data, prioridades_estrategicas: e.target.value })} placeholder="Las 3-5 apuestas que NO pueden fallar este año." /></div>
        <div><Label>Gobernanza de la ejecución</Label><Textarea rows={4} value={data.gobernanza_ejecucion ?? ""} onChange={(e) => onChange({ ...data, gobernanza_ejecucion: e.target.value })} placeholder="Comité estratégico, sponsors, decisiones, escalamiento." /></div>
        <div><Label>PMO / oficina de proyectos</Label><Textarea rows={4} value={data.pmo ?? ""} onChange={(e) => onChange({ ...data, pmo: e.target.value })} placeholder="Cómo se coordinan, monitorean y reportan las iniciativas." /></div>
        <div><Label>Gestión del cambio</Label><Textarea rows={4} value={data.gestion_cambio ?? ""} onChange={(e) => onChange({ ...data, gestion_cambio: e.target.value })} placeholder="Modelo (ADKAR, Kotter), stakeholders, resistencias y tácticas." /></div>
        <div><Label>Plan de comunicación</Label><Textarea rows={4} value={data.comunicacion_plan ?? ""} onChange={(e) => onChange({ ...data, comunicacion_plan: e.target.value })} placeholder="Cómo comunicamos el plan dentro y fuera, qué canales y cadencia." /></div>
        <div><Label>Celebración de logros y quick wins</Label><Textarea rows={3} value={data.celebracion_logros ?? ""} onChange={(e) => onChange({ ...data, celebracion_logros: e.target.value })} placeholder="Cómo identificamos y celebramos quick wins y hitos." /></div>
        <div><Label>Riesgos de la ejecución</Label><Textarea rows={3} value={data.riesgos_ejecucion ?? ""} onChange={(e) => onChange({ ...data, riesgos_ejecucion: e.target.value })} placeholder="Riesgos típicos: capacidad, prioridades cambiantes, resistencia, capital." /></div>
        <div className="md:col-span-2"><Label>Cronograma general (hitos clave)</Label><Textarea rows={3} value={data.cronograma_general ?? ""} onChange={(e) => onChange({ ...data, cronograma_general: e.target.value })} placeholder="Hitos por trimestre del año 1 y por semestre del año 2-3." /></div>
      </div>

      <div className="a360-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-display text-navy">Portafolio consolidado de iniciativas ({inis.length})</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">Presupuesto: ${totalPpto.toLocaleString()}</Badge>
            <Badge variant="outline" className="text-emerald-700">Completadas: {porEstado("Completada")}</Badge>
            <Badge variant="outline" className="text-amber-700">En curso: {porEstado("En curso")}</Badge>
            <Badge variant="outline" className="text-red-700">En riesgo: {porEstado("En riesgo")}</Badge>
            <Button size="sm" variant="outline" onClick={cargar}><Sparkles className="w-3 h-3 mr-1" />Cargar plantilla</Button>
            <Button size="sm" variant="outline" onClick={add}><Plus className="w-3 h-3 mr-1" />Iniciativa</Button>
          </div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-semibold border-b pb-1 min-w-[1700px]">
            <div className="col-span-2">Iniciativa</div><div className="col-span-1">Eje</div>
            <div className="col-span-2">Descripción</div><div className="col-span-1">Resp.</div>
            <div className="col-span-1">Inicio</div><div className="col-span-1">Fin</div>
            <div className="col-span-1">Ppto.</div><div className="col-span-1">Prio.</div>
            <div className="col-span-1">Estado</div><div className="col-span-1">KPI</div>
          </div>
          {inis.length === 0 && <p className="text-xs text-muted-foreground italic">Sin iniciativas.</p>}
          {inis.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start min-w-[1700px]">
              <Input className="col-span-2 h-8 text-sm" value={r.nombre} onChange={(e) => upd(i, "nombre", e.target.value)} />
              <Input className="col-span-1 h-8 text-sm" value={r.eje_estrategico} onChange={(e) => upd(i, "eje_estrategico", e.target.value)} />
              <Input className="col-span-2 h-8 text-sm" value={r.descripcion} onChange={(e) => upd(i, "descripcion", e.target.value)} />
              <Input className="col-span-1 h-8 text-sm" value={r.responsable} onChange={(e) => upd(i, "responsable", e.target.value)} />
              <Input type="date" className="col-span-1 h-8 text-sm" value={r.fecha_inicio} onChange={(e) => upd(i, "fecha_inicio", e.target.value)} />
              <Input type="date" className="col-span-1 h-8 text-sm" value={r.fecha_fin} onChange={(e) => upd(i, "fecha_fin", e.target.value)} />
              <Input type="number" className="col-span-1 h-8 text-sm" value={r.presupuesto} onChange={(e) => upd(i, "presupuesto", Number(e.target.value))} />
              <Select value={r.prioridad} onValueChange={(v) => upd(i, "prioridad", v)}>
                <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem><SelectItem value="Media">Media</SelectItem><SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Select value={r.estado} onValueChange={(v) => upd(i, "estado", v)}>
                <SelectTrigger className="col-span-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Por iniciar","En curso","En riesgo","Completada","Pausada"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="col-span-1 flex items-center gap-1">
                <Input className="h-8 text-sm" value={r.kpi} onChange={(e) => upd(i, "kpi", e.target.value)} />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => rem(i)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
