import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  TIPOS_EMPRESA, MERCADOS_OBJETIVO, COBERTURAS, ORG_OPCIONES, PROC_OPCIONES, HERR_OPCIONES,
  ESTILOS_LIDERAZGO, ROLES_LIDER, DISPONIBILIDAD, EXPERIENCIA_CONSULTORES, ACTITUD_CAMBIO,
  DIMENSIONES_SIDE_12, PROGRAMAS_RECOMENDADOS, FRECUENCIAS, MODALIDADES, PASOS_ONBOARDING,
  EXPECTATIVAS_PROGRAMA, COMPROMISOS_CLIENTE_DEFAULT, COMPROMISOS_CONSULTOR_DEFAULT, CONDICIONES_DEFAULT,
  type OnboardingPaso1, type OnboardingPaso2, type OnboardingPaso3, type OnboardingPaso4, type OnboardingPaso5,
} from "@/lib/onboarding-helpers";
import { generarPerfilClientePDF } from "@/lib/onboarding-pdf";
import { generarAnalisisOnboarding } from "@/server/onboarding-ia.functions";
import {
  Plus, Trash2, ArrowLeft, ArrowRight, Save, FileDown, Sparkles, CheckCircle2, Loader2, ClipboardList, Users, Target, Handshake, FileText,
} from "lucide-react";

export const Route = createFileRoute("/app/clientes/$clienteId/onboarding")({ component: OnboardingPage });

interface ClienteRef { id: string; nombre_empresa: string; nombre_comercial?: string | null; sector?: string | null; ciudad?: string | null; pais?: string | null; }

function OnboardingPage() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/onboarding" });
  const [cliente, setCliente] = useState<ClienteRef | null>(null);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [paso, setPaso] = useState(1);
  const [completado, setCompletado] = useState(false);

  const [p1, setP1] = useState<OnboardingPaso1>({});
  const [p2, setP2] = useState<OnboardingPaso2>({});
  const [p3, setP3] = useState<OnboardingPaso3>({ fortalezas: [], debilidades: [], oportunidades: [], amenazas: [], dimensiones_urgentes: [] });
  const [p4, setP4] = useState<OnboardingPaso4>({ objetivos: [], prioridades: {}, expectativas: {} });
  const [p5, setP5] = useState<OnboardingPaso5>({ compromisos_cliente: [], compromisos_consultor: [], condiciones_aceptadas: [] });
  const [analisisIa, setAnalisisIa] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("clientes")
        .select("id,nombre_empresa,nombre_comercial,sector,ciudad,pais").eq("id", clienteId).maybeSingle();
      if (c) setCliente(c as ClienteRef);

      const { data: o } = await supabase.from("cliente_onboarding")
        .select("*").eq("cliente_id", clienteId).maybeSingle();
      if (o) {
        setOnboardingId(o.id);
        setP1((o.paso1_empresa as OnboardingPaso1) ?? {});
        setP2((o.paso2_lider as OnboardingPaso2) ?? {});
        const p3raw = (o.paso3_contexto as Partial<OnboardingPaso3>) ?? {};
        setP3({ fortalezas: [], debilidades: [], oportunidades: [], amenazas: [], dimensiones_urgentes: [], ...p3raw });
        const p4raw = (o.paso4_expectativas as Partial<OnboardingPaso4>) ?? {};
        setP4({ objetivos: [], prioridades: {}, expectativas: {}, ...p4raw });
        const p5raw = (o.paso5_acuerdo as Partial<OnboardingPaso5>) ?? {};
        setP5({ compromisos_cliente: [], compromisos_consultor: [], condiciones_aceptadas: [], ...p5raw });
        setAnalisisIa(o.analisis_ia ?? null);
        setCompletado(o.completado ?? false);
        setPaso(Math.min(Math.max(o.paso_actual ?? 1, 1), 6));
      }
    })();
  }, [clienteId]);

  const guardar = async (pasoNum: number, marcarCompletado = false) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      cliente_id: clienteId,
      consultor_id: user?.id ?? null,
      paso1_empresa: p1 as never,
      paso2_lider: p2 as never,
      paso3_contexto: p3 as never,
      paso4_expectativas: p4 as never,
      paso5_acuerdo: p5 as never,
      paso_actual: pasoNum,
      ...(marcarCompletado ? { completado: true, fecha_completado: new Date().toISOString() } : {}),
      ...(analisisIa ? { analisis_ia: analisisIa } : {}),
    };
    let res;
    if (onboardingId) {
      res = await supabase.from("cliente_onboarding").update(payload).eq("id", onboardingId).select().maybeSingle();
    } else {
      res = await supabase.from("cliente_onboarding").insert(payload).select().maybeSingle();
    }
    if (res.error) toast.error(res.error.message);
    else {
      if (res.data?.id) setOnboardingId(res.data.id);
      if (marcarCompletado) {
        setCompletado(true);
        // Crear actividad "Inicio de programa" en el timeline
        await supabase.from("cliente_actividades").insert({
          cliente_id: clienteId,
          consultor_id: user?.id ?? null,
          tipo: "diagnostico",
          titulo: "Inicio de programa — Onboarding completado",
          descripcion: `Programa: ${p4.programa_recomendado ?? "—"}. Modalidad: ${p5.modalidad ?? "—"}. Frecuencia: ${p5.frecuencia ?? "—"}.`,
          fecha: new Date().toISOString(),
        } as never);
        toast.success("Onboarding completado. SIDE activado para este cliente.");
      } else {
        toast.success("Guardado");
      }
    }
    setSaving(false);
    return !res.error;
  };

  const generarIA = async () => {
    setGenerando(true);
    const { data: { session } } = await supabase.auth.getSession();
    const r = await generarAnalisisOnboarding({ data: {
      accessToken: session?.access_token,
      empresa: { nombre: cliente?.nombre_empresa ?? "—", sector: cliente?.sector, ciudad: cliente?.ciudad, pais: cliente?.pais },
      paso1: p1 as Record<string, unknown>, paso2: p2 as Record<string, unknown>,
      paso3: p3 as unknown as Record<string, unknown>,
      paso4: p4 as unknown as Record<string, unknown>,
      paso5: p5 as unknown as Record<string, unknown>,
    } });
    if (r.error) toast.error(r.error);
    else { setAnalisisIa(r.contenido); toast.success("Análisis IA generado"); }
    setGenerando(false);
  };

  const exportarPDF = () => {
    if (!cliente) return;
    const doc = generarPerfilClientePDF({
      empresa: { nombre: cliente.nombre_empresa, nombre_comercial: cliente.nombre_comercial, sector: cliente.sector, ciudad: cliente.ciudad, pais: cliente.pais },
      paso1: p1 as Record<string, unknown>, paso2: p2 as Record<string, unknown>,
      paso3: p3, paso4: p4, paso5: p5, analisis_ia: analisisIa,
    });
    doc.save(`Perfil-${cliente.nombre_empresa.replace(/\s+/g, "-")}.pdf`);
  };

  const progress = useMemo(() => Math.round((paso / 6) * 100), [paso]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl text-navy">Onboarding · Primera sesión</h2>
          <p className="text-sm text-muted-foreground mt-1">Genera el Perfil del Cliente como documento de entrada al programa.</p>
        </div>
        {completado && (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Onboarding completado
          </Badge>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1.5 flex-wrap">
            {PASOS_ONBOARDING.map((p) => (
              <button key={p.num} onClick={() => setPaso(p.num)}
                className={`text-xs px-2.5 py-1 rounded border transition ${
                  paso === p.num ? "bg-navy text-white border-navy"
                    : paso > p.num ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-muted-foreground border-border"
                }`}>
                {p.num}. {p.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {paso === 1 && <Paso1 v={p1} set={setP1} />}
      {paso === 2 && <Paso2 v={p2} set={setP2} />}
      {paso === 3 && <Paso3 v={p3} set={setP3} />}
      {paso === 4 && <Paso4 v={p4} set={setP4} />}
      {paso === 5 && <Paso5 v={p5} set={setP5} />}
      {paso === 6 && (
        <Paso6
          cliente={cliente} p1={p1} p2={p2} p3={p3} p4={p4} p5={p5}
          analisisIa={analisisIa} generando={generando}
          onGenerarIA={generarIA} onExportarPDF={exportarPDF}
          onCompletar={() => guardar(6, true)} completado={completado}
        />
      )}

      <div className="flex items-center justify-between gap-2 sticky bottom-0 bg-white border-t border-border py-3 -mx-2 px-2">
        <Button variant="outline" disabled={paso === 1} onClick={() => setPaso(paso - 1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => guardar(paso)} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "Guardando…" : "Guardar"}
          </Button>
          {paso < 6 ? (
            <Button className="bg-navy hover:bg-navy/90" onClick={async () => { const ok = await guardar(paso + 1); if (ok) setPaso(paso + 1); }}>
              Siguiente <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="bg-gold hover:bg-gold/90 text-navy" asChild>
              <Link to="/app/clientes/$clienteId/side" params={{ clienteId }}>
                Ir al SIDE <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =================== PASOS =================== */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="a360-card a360-card-lg p-5 space-y-4">
      <h3 className="font-display text-navy">{title}</h3>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}
function F({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "md:col-span-2" : ""}><Label className="text-xs">{label}</Label>{children}</div>;
}

function Sel({ value, onChange, options, placeholder = "—" }: { value?: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string }) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function ListaEditable({ items, onChange, placeholder, label }: { items: string[]; onChange: (v: string[]) => void; placeholder: string; label: string }) {
  const [val, setVal] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onChange([...items, val.trim()]); setVal(""); e.preventDefault(); } }} />
        <Button type="button" variant="outline" size="sm" onClick={() => { if (val.trim()) { onChange([...items, val.trim()]); setVal(""); } }}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {items.length === 0 && <p className="text-xs text-muted-foreground italic">Sin {label.toLowerCase()} aún</p>}
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between gap-2 bg-muted/40 rounded px-2 py-1 text-sm">
            <span className="flex-1">{it}</span>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Paso1({ v, set }: { v: OnboardingPaso1; set: (v: OnboardingPaso1) => void }) {
  const u = (k: keyof OnboardingPaso1, val: string) => set({ ...v, [k]: val });
  return (
    <>
      <Instructivo />
      <Card title="1. Perfil de la empresa">
        <Grid>
          <F label="Año de fundación"><Input value={v.anio_fundacion ?? ""} onChange={(e) => u("anio_fundacion", e.target.value)} placeholder="Ej. 2010" /></F>
          <F label="Tipo de empresa"><Sel value={v.tipo_empresa} onChange={(x) => u("tipo_empresa", x)} options={TIPOS_EMPRESA} /></F>
          <F label="Número de empleados"><Input type="number" value={v.num_empleados ?? ""} onChange={(e) => u("num_empleados", e.target.value)} placeholder="Ej. 25" /></F>
          <F label="Facturación anual (USD)"><Input value={v.facturacion_anual ?? ""} onChange={(e) => u("facturacion_anual", e.target.value)} placeholder="Ej. $500,000" /></F>
          <F label="Mercado objetivo"><Sel value={v.mercado_objetivo} onChange={(x) => u("mercado_objetivo", x)} options={MERCADOS_OBJETIVO} /></F>
          <F label="Cobertura geográfica"><Sel value={v.cobertura} onChange={(x) => u("cobertura", x)} options={COBERTURAS} /></F>
          <F label="¿Tiene organigrama definido?"><Sel value={v.organigrama} onChange={(x) => u("organigrama", x)} options={ORG_OPCIONES} /></F>
          <F label="¿Tiene procesos documentados?"><Sel value={v.procesos} onChange={(x) => u("procesos", x)} options={PROC_OPCIONES} /></F>
          <F label="¿Usa herramientas digitales de gestión?"><Sel value={v.herramientas_digitales} onChange={(x) => u("herramientas_digitales", x)} options={HERR_OPCIONES} /></F>
          <F label="Breve historia de la empresa" wide><Textarea rows={3} value={v.historia ?? ""} onChange={(e) => u("historia", e.target.value)} placeholder="¿Cómo nació la empresa? ¿Cuáles han sido los hitos más importantes?" /></F>
          <F label="Principales productos o servicios" wide><Textarea rows={2} value={v.productos ?? ""} onChange={(e) => u("productos", e.target.value)} placeholder="¿Qué vende? ¿Cuáles son sus líneas más importantes?" /></F>
          <F label="Propuesta de valor actual" wide><Textarea rows={2} value={v.propuesta_valor ?? ""} onChange={(e) => u("propuesta_valor", e.target.value)} placeholder="¿Por qué los clientes eligen esta empresa y no a la competencia?" /></F>
        </Grid>
      </Card>
    </>
  );
}

function Instructivo() {
  const pasos = [
    { n: 1, t: "Empresa", d: "Historia, estructura y modelo de negocio", i: ClipboardList, c: "border-l-gold bg-amber-50" },
    { n: 2, t: "Líder", d: "Perfil del empresario, estilo y motivación", i: Users, c: "border-l-violet-500 bg-violet-50" },
    { n: 3, t: "Contexto", d: "Situación actual, retos y oportunidades", i: Target, c: "border-l-blue-500 bg-blue-50" },
    { n: 4, t: "Expectativas", d: "Objetivos, prioridades y resultados esperados", i: Sparkles, c: "border-l-emerald-500 bg-emerald-50" },
    { n: 5, t: "Acuerdo", d: "Compromisos mutuos y condiciones de trabajo", i: Handshake, c: "border-l-orange-500 bg-orange-50" },
  ];
  return (
    <Card title="Onboarding · Cómo se construye el Perfil del Cliente">
      <p className="text-xs text-muted-foreground">
        Esta herramienta se completa en la <b>primera sesión</b> con el cliente. Levanta el perfil completo de la empresa y el líder, establece el acuerdo de trabajo y genera el <b>Perfil del Cliente</b> que alimenta directamente el diagnóstico SIDE y las apps del Plan Estratégico.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {pasos.map((p) => {
          const Icon = p.i;
          return (
            <div key={p.n} className={`border-l-4 rounded p-2.5 ${p.c}`}>
              <div className="flex items-center gap-1.5 text-navy font-bold text-xs"><Icon className="w-3.5 h-3.5" /> {p.n}. {p.t}</div>
              <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{p.d}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] mt-2">
        <Eco color="bg-navy text-white" t="Onboarding" s="Perfil del cliente" icon="📋" />
        <Eco color="bg-emerald-50 text-emerald-800 border border-emerald-200" t="SIDE" s="Diagnóstico" icon="🔍" />
        <Eco color="bg-blue-50 text-blue-800 border border-blue-200" t="Plan Estratégico" s="18 secciones" icon="📈" />
        <Eco color="bg-amber-50 text-amber-800 border border-amber-200" t="KPIs / BSC" s="Seguimiento" icon="📊" />
      </div>
    </Card>
  );
}

function Eco({ color, t, s, icon }: { color: string; t: string; s: string; icon: string }) {
  return (
    <div className={`rounded p-2 text-center ${color}`}>
      <div className="text-base">{icon}</div>
      <div className="font-bold mt-0.5">{t}</div>
      <div className="opacity-70">{s}</div>
    </div>
  );
}

function Paso2({ v, set }: { v: OnboardingPaso2; set: (v: OnboardingPaso2) => void }) {
  const u = (k: keyof OnboardingPaso2, val: string) => set({ ...v, [k]: val });
  return (
    <>
      <Card title="2A. Datos personales del líder">
        <Grid>
          <F label="Nombre completo"><Input value={v.nombre ?? ""} onChange={(e) => u("nombre", e.target.value)} /></F>
          <F label="Cargo"><Input value={v.cargo ?? ""} onChange={(e) => u("cargo", e.target.value)} /></F>
          <F label="Email"><Input value={v.email ?? ""} onChange={(e) => u("email", e.target.value)} /></F>
          <F label="Teléfono / WhatsApp"><Input value={v.telefono ?? ""} onChange={(e) => u("telefono", e.target.value)} /></F>
          <F label="Edad aproximada"><Input value={v.edad ?? ""} onChange={(e) => u("edad", e.target.value)} /></F>
          <F label="Años de experiencia"><Input value={v.experiencia ?? ""} onChange={(e) => u("experiencia", e.target.value)} /></F>
          <F label="Formación académica" wide><Input value={v.formacion ?? ""} onChange={(e) => u("formacion", e.target.value)} /></F>
        </Grid>
      </Card>
      <Card title="2B. Perfil de liderazgo">
        <Grid>
          <F label="Estilo predominante"><Sel value={v.estilo} onChange={(x) => u("estilo", x)} options={ESTILOS_LIDERAZGO} /></F>
          <F label="Rol principal"><Sel value={v.rol} onChange={(x) => u("rol", x)} options={ROLES_LIDER} /></F>
          <F label="Fortaleza principal como líder" wide><Textarea rows={2} value={v.fortaleza ?? ""} onChange={(e) => u("fortaleza", e.target.value)} /></F>
          <F label="Área de desarrollo prioritaria" wide><Textarea rows={2} value={v.area_desarrollo ?? ""} onChange={(e) => u("area_desarrollo", e.target.value)} /></F>
          <F label="¿Cómo describe su empresa ideal en 5 años?" wide><Textarea rows={2} value={v.vision_5_anios ?? ""} onChange={(e) => u("vision_5_anios", e.target.value)} /></F>
        </Grid>
      </Card>
      <Card title="2C. Motivación y estado actual">
        <Grid>
          <F label="Disponibilidad"><Sel value={v.disponibilidad} onChange={(x) => u("disponibilidad", x)} options={DISPONIBILIDAD} /></F>
          <F label="Experiencia previa con consultores"><Sel value={v.experiencia_consultores} onChange={(x) => u("experiencia_consultores", x)} options={EXPERIENCIA_CONSULTORES} /></F>
          <F label="Actitud hacia el cambio"><Sel value={v.actitud_cambio} onChange={(x) => u("actitud_cambio", x)} options={ACTITUD_CAMBIO} /></F>
          <F label="Motivación principal para buscar consultoría" wide><Textarea rows={2} value={v.motivacion ?? ""} onChange={(e) => u("motivacion", e.target.value)} /></F>
          <F label="Mayor temor o resistencia al cambio" wide><Textarea rows={2} value={v.temor ?? ""} onChange={(e) => u("temor", e.target.value)} /></F>
          <F label="Notas adicionales del líder" wide><Textarea rows={2} value={v.notas ?? ""} onChange={(e) => u("notas", e.target.value)} /></F>
        </Grid>
      </Card>
    </>
  );
}

function Paso3({ v, set }: { v: OnboardingPaso3; set: (v: OnboardingPaso3) => void }) {
  const toggleDim = (k: string) => {
    const cur = v.dimensiones_urgentes ?? [];
    set({ ...v, dimensiones_urgentes: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k] });
  };
  return (
    <>
      <Card title="3A. Diagnóstico inicial percibido">
        <F label="¿Cómo describe el líder la situación actual?" wide>
          <Textarea rows={3} value={v.situacion_actual ?? ""} onChange={(e) => set({ ...v, situacion_actual: e.target.value })} />
        </F>
      </Card>
      <Card title="3B. FODA preliminar">
        <Grid>
          <F label="Fortalezas"><ListaEditable items={v.fortalezas} onChange={(x) => set({ ...v, fortalezas: x })} placeholder="+ Agregar fortaleza" label="fortalezas" /></F>
          <F label="Debilidades"><ListaEditable items={v.debilidades} onChange={(x) => set({ ...v, debilidades: x })} placeholder="+ Agregar debilidad" label="debilidades" /></F>
          <F label="Oportunidades"><ListaEditable items={v.oportunidades} onChange={(x) => set({ ...v, oportunidades: x })} placeholder="+ Agregar oportunidad" label="oportunidades" /></F>
          <F label="Amenazas"><ListaEditable items={v.amenazas} onChange={(x) => set({ ...v, amenazas: x })} placeholder="+ Agregar amenaza" label="amenazas" /></F>
        </Grid>
      </Card>
      <Card title="3C. Dimensiones de mayor urgencia (pre-SIDE)">
        <p className="text-xs text-muted-foreground">Selecciona las dimensiones que el líder considera más urgentes.</p>
        <div className="flex flex-wrap gap-2">
          {DIMENSIONES_SIDE_12.map((d) => {
            const sel = v.dimensiones_urgentes?.includes(d.key);
            return (
              <button key={d.key} type="button" onClick={() => toggleDim(d.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${sel ? "bg-navy text-white border-navy" : "bg-white text-navy border-border hover:border-gold"}`}>
                {d.nombre}
              </button>
            );
          })}
        </div>
      </Card>
      <Card title="3D. Contexto del mercado">
        <Grid>
          <F label="Contexto del sector e industria" wide><Textarea rows={2} value={v.contexto_sector ?? ""} onChange={(e) => set({ ...v, contexto_sector: e.target.value })} /></F>
          <F label="Competencia principal identificada" wide><Textarea rows={2} value={v.competencia ?? ""} onChange={(e) => set({ ...v, competencia: e.target.value })} /></F>
        </Grid>
      </Card>
    </>
  );
}

function Paso4({ v, set }: { v: OnboardingPaso4; set: (v: OnboardingPaso4) => void }) {
  return (
    <>
      <Card title="4A. Objetivos del cliente">
        <ListaEditable items={v.objetivos} onChange={(x) => set({ ...v, objetivos: x })} placeholder="+ Agregar objetivo en palabras del cliente" label="objetivos" />
      </Card>
      <Card title="4B. Prioridades por dimensión SIDE (1 = baja, 5 = crítica)">
        <p className="text-xs text-muted-foreground">El cliente evalúa la importancia de cada dimensión. Esto pre-carga el SIDE.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DIMENSIONES_SIDE_12.map((d) => (
            <div key={d.key} className="flex items-center justify-between gap-3 bg-muted/30 rounded px-3 py-2">
              <span className="text-sm flex-1">{d.nombre}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => {
                  const sel = (v.prioridades?.[d.key] ?? 0) === n;
                  return (
                    <button key={n} type="button"
                      onClick={() => set({ ...v, prioridades: { ...v.prioridades, [d.key]: n } })}
                      className={`w-7 h-7 text-xs rounded border ${sel ? "bg-gold text-navy border-gold font-bold" : "bg-white text-muted-foreground border-border hover:border-gold"}`}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="4B-bis. Importancia de cada expectativa del programa (1-5)">
        <p className="text-xs text-muted-foreground">El cliente evalúa qué tan importante es cada uno de estos resultados típicos del programa.</p>
        <div className="space-y-2">
          {EXPECTATIVAS_PROGRAMA.map((e) => {
            const cur = v.expectativas?.[e.id] ?? 0;
            return (
              <div key={e.id} className="flex items-center justify-between gap-3 bg-muted/30 rounded px-3 py-2">
                <span className="text-sm flex-1">{e.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button"
                      onClick={() => set({ ...v, expectativas: { ...v.expectativas, [e.id]: n } })}
                      className={`w-7 h-7 text-xs rounded border ${cur === n ? "bg-gold text-navy border-gold font-bold" : "bg-white text-muted-foreground border-border hover:border-gold"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="4C. Resultados esperados">
        <Grid>
          <F label="¿Qué resultado concreto espera en 3 meses?" wide><Textarea rows={2} value={v.resultado_3m ?? ""} onChange={(e) => set({ ...v, resultado_3m: e.target.value })} /></F>
          <F label="¿Qué resultado espera al finalizar el programa?" wide><Textarea rows={2} value={v.resultado_final ?? ""} onChange={(e) => set({ ...v, resultado_final: e.target.value })} /></F>
          <F label="Indicador de éxito principal (en sus palabras)" wide><Textarea rows={2} value={v.indicador_exito ?? ""} onChange={(e) => set({ ...v, indicador_exito: e.target.value })} /></F>
        </Grid>
      </Card>
      <Card title="4D. Programa recomendado por el consultor">
        <Grid>
          <F label="Programa recomendado"><Sel value={v.programa_recomendado} onChange={(x) => set({ ...v, programa_recomendado: x })} options={PROGRAMAS_RECOMENDADOS} /></F>
          <F label="Justificación del programa" wide><Textarea rows={3} value={v.justificacion ?? ""} onChange={(e) => set({ ...v, justificacion: e.target.value })} /></F>
        </Grid>
      </Card>
    </>
  );
}

function CheckList({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };
  return (
    <ul className="space-y-1.5">
      {options.map((opt) => {
        const sel = selected.includes(opt);
        return (
          <li key={opt}>
            <button type="button" onClick={() => toggle(opt)}
              className={`w-full text-left flex items-start gap-2 rounded px-2.5 py-1.5 text-sm border transition ${sel ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-white border-border text-foreground hover:border-gold"}`}>
              <span className={`mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded border ${sel ? "bg-emerald-600 border-emerald-600 text-white" : "border-muted-foreground/40"}`}>
                {sel ? "✓" : ""}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Paso5({ v, set }: { v: OnboardingPaso5; set: (v: OnboardingPaso5) => void }) {
  return (
    <>
      <Card title="5A. Cronograma y modalidad">
        <Grid>
          <F label="Fecha de inicio"><Input type="date" value={v.fecha_inicio ?? ""} onChange={(e) => set({ ...v, fecha_inicio: e.target.value })} /></F>
          <F label="Fecha de cierre estimada"><Input type="date" value={v.fecha_cierre ?? ""} onChange={(e) => set({ ...v, fecha_cierre: e.target.value })} /></F>
          <F label="Frecuencia de sesiones"><Sel value={v.frecuencia} onChange={(x) => set({ ...v, frecuencia: x })} options={FRECUENCIAS} /></F>
          <F label="Modalidad"><Sel value={v.modalidad} onChange={(x) => set({ ...v, modalidad: x })} options={MODALIDADES} /></F>
          <F label="Consultor responsable"><Input value={v.consultor_responsable ?? ""} onChange={(e) => set({ ...v, consultor_responsable: e.target.value })} /></F>
        </Grid>
      </Card>
      <Card title="5B. Inversión">
        <Grid>
          <F label="Inversión acordada"><Input value={v.inversion ?? ""} onChange={(e) => set({ ...v, inversion: e.target.value })} placeholder="USD ..." /></F>
          <F label="Forma de pago"><Input value={v.forma_pago ?? ""} onChange={(e) => set({ ...v, forma_pago: e.target.value })} /></F>
        </Grid>
      </Card>
      <Card title="5C. Compromisos del cliente">
        <p className="text-xs text-muted-foreground">Marca los compromisos estándar A360SP que el cliente acepta y agrega los específicos del programa.</p>
        <CheckList
          options={[...COMPROMISOS_CLIENTE_DEFAULT]}
          selected={v.compromisos_cliente}
          onChange={(x) => set({ ...v, compromisos_cliente: x })}
        />
        <div className="mt-3">
          <Label className="text-xs">Compromisos adicionales</Label>
          <ListaEditable
            items={v.compromisos_cliente.filter((c) => !COMPROMISOS_CLIENTE_DEFAULT.includes(c))}
            onChange={(extras) => set({ ...v, compromisos_cliente: [...v.compromisos_cliente.filter((c) => COMPROMISOS_CLIENTE_DEFAULT.includes(c)), ...extras] })}
            placeholder="+ Compromiso específico del cliente" label="compromisos"
          />
        </div>
      </Card>
      <Card title="5D. Compromisos del consultor">
        <CheckList
          options={[...COMPROMISOS_CONSULTOR_DEFAULT]}
          selected={v.compromisos_consultor}
          onChange={(x) => set({ ...v, compromisos_consultor: x })}
        />
        <div className="mt-3">
          <Label className="text-xs">Compromisos adicionales</Label>
          <ListaEditable
            items={v.compromisos_consultor.filter((c) => !COMPROMISOS_CONSULTOR_DEFAULT.includes(c))}
            onChange={(extras) => set({ ...v, compromisos_consultor: [...v.compromisos_consultor.filter((c) => COMPROMISOS_CONSULTOR_DEFAULT.includes(c)), ...extras] })}
            placeholder="+ Compromiso específico del consultor" label="compromisos"
          />
        </div>
      </Card>
      <Card title="5E. Condiciones del servicio">
        <CheckList
          options={[...CONDICIONES_DEFAULT]}
          selected={v.condiciones_aceptadas ?? []}
          onChange={(x) => set({ ...v, condiciones_aceptadas: x })}
        />
        <div className="mt-3">
          <F label="Condiciones especiales" wide><Textarea rows={2} value={v.condiciones ?? ""} onChange={(e) => set({ ...v, condiciones: e.target.value })} placeholder="Cualquier condición particular fuera del estándar..." /></F>
          <F label="Notas finales del consultor" wide><Textarea rows={2} value={v.notas ?? ""} onChange={(e) => set({ ...v, notas: e.target.value })} placeholder="Observaciones, condiciones especiales, aspectos a monitorear..." /></F>
        </div>
      </Card>
    </>
  );
}

function Paso6({
  cliente, p1, p2, p3, p4, p5, analisisIa, generando, completado,
  onGenerarIA, onExportarPDF, onCompletar,
}: {
  cliente: ClienteRef | null;
  p1: OnboardingPaso1; p2: OnboardingPaso2; p3: OnboardingPaso3; p4: OnboardingPaso4; p5: OnboardingPaso5;
  analisisIa: string | null; generando: boolean; completado: boolean;
  onGenerarIA: () => void; onExportarPDF: () => void; onCompletar: () => void;
}) {
  return (
    <>
      <Card title="Vista previa del Perfil del Cliente">
        <div className="border border-border rounded p-5 space-y-5 bg-white">
          <div className="border-b-2 border-gold pb-3">
            <div className="text-[10px] text-gold uppercase tracking-[0.15em] font-bold">A360SP · Documento de entrada</div>
            <h3 className="font-display text-navy text-2xl mt-1">{cliente?.nombre_empresa ?? "—"}</h3>
            <p className="text-xs text-muted-foreground">{[cliente?.sector, cliente?.ciudad, cliente?.pais].filter(Boolean).join(" · ")}</p>
          </div>

          <PerfilSection titulo="1. Identidad y modelo de negocio">
            <Resumen items={[
              ["Tipo de empresa", p1.tipo_empresa], ["Año fundación", p1.anio_fundacion],
              ["Empleados", p1.num_empleados], ["Facturación", p1.facturacion_anual],
              ["Mercado", p1.mercado_objetivo], ["Cobertura", p1.cobertura],
              ["Organigrama", p1.organigrama], ["Procesos doc.", p1.procesos], ["Digitalización", p1.herramientas_digitales],
            ]} />
            {p1.historia && <Narrative title="Historia" text={p1.historia} />}
            {p1.productos && <Narrative title="Productos / Servicios" text={p1.productos} />}
            {p1.propuesta_valor && <Narrative title="Propuesta de valor actual" text={p1.propuesta_valor} />}
          </PerfilSection>

          <PerfilSection titulo="2. Líder">
            <Resumen items={[
              ["Nombre", p2.nombre], ["Cargo", p2.cargo], ["Edad", p2.edad], ["Experiencia", p2.experiencia],
              ["Formación", p2.formacion], ["Estilo", p2.estilo], ["Rol principal", p2.rol],
              ["Disponibilidad", p2.disponibilidad], ["Actitud al cambio", p2.actitud_cambio],
            ]} />
            {p2.fortaleza && <Narrative title="Fortaleza principal" text={p2.fortaleza} />}
            {p2.area_desarrollo && <Narrative title="Área de desarrollo prioritaria" text={p2.area_desarrollo} />}
            {p2.vision_5_anios && <Narrative title="Visión a 5 años" text={p2.vision_5_anios} />}
            {p2.motivacion && <Narrative title="Motivación para buscar consultoría" text={p2.motivacion} />}
            {p2.temor && <Narrative title="Temores / resistencias" text={p2.temor} />}
          </PerfilSection>

          <PerfilSection titulo="3. Contexto estratégico (FODA preliminar)">
            {p3.situacion_actual && <Narrative title="Situación actual descrita por el líder" text={p3.situacion_actual} />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FodaBox titulo="Fortalezas" color="emerald" items={p3.fortalezas} />
              <FodaBox titulo="Debilidades" color="rose" items={p3.debilidades} />
              <FodaBox titulo="Oportunidades" color="blue" items={p3.oportunidades} />
              <FodaBox titulo="Amenazas" color="amber" items={p3.amenazas} />
            </div>
            {p3.dimensiones_urgentes.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-1">Dimensiones SIDE urgentes</div>
                <div className="flex flex-wrap gap-1.5">
                  {p3.dimensiones_urgentes.map((k) => {
                    const d = DIMENSIONES_SIDE_12.find((x) => x.key === k);
                    return <span key={k} className="text-[11px] px-2 py-0.5 rounded-full bg-navy text-white">{d?.nombre ?? k}</span>;
                  })}
                </div>
              </div>
            )}
            {p3.contexto_sector && <Narrative title="Contexto del sector" text={p3.contexto_sector} />}
            {p3.competencia && <Narrative title="Competencia principal" text={p3.competencia} />}
          </PerfilSection>

          <PerfilSection titulo="4. Expectativas y programa recomendado">
            {p4.objetivos.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-1">Objetivos del cliente</div>
                <ul className="text-sm list-disc list-inside space-y-0.5">{p4.objetivos.map((o, i) => <li key={i}>{o}</li>)}</ul>
              </div>
            )}
            {Object.keys(p4.expectativas ?? {}).length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-1">Importancia (1-5)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                  {EXPECTATIVAS_PROGRAMA.filter((e) => p4.expectativas?.[e.id]).map((e) => (
                    <div key={e.id} className="flex justify-between gap-2 bg-muted/40 rounded px-2 py-0.5">
                      <span>{e.label}</span><span className="font-bold text-navy">{p4.expectativas[e.id]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Resumen items={[
              ["Programa recomendado", p4.programa_recomendado],
              ["Indicador de éxito", p4.indicador_exito],
            ]} />
            {p4.resultado_3m && <Narrative title="Resultado esperado a 3 meses" text={p4.resultado_3m} />}
            {p4.resultado_final && <Narrative title="Resultado esperado al cierre" text={p4.resultado_final} />}
            {p4.justificacion && <Narrative title="Justificación del programa" text={p4.justificacion} />}
          </PerfilSection>

          <PerfilSection titulo="5. Acuerdo de trabajo">
            <Resumen items={[
              ["Inicio", p5.fecha_inicio], ["Cierre", p5.fecha_cierre],
              ["Frecuencia", p5.frecuencia], ["Modalidad", p5.modalidad],
              ["Consultor", p5.consultor_responsable],
              ["Inversión", p5.inversion], ["Forma de pago", p5.forma_pago],
            ]} />
            {p5.compromisos_cliente.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-1">Compromisos del cliente</div>
                <ul className="text-sm list-disc list-inside space-y-0.5">{p5.compromisos_cliente.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            )}
            {p5.compromisos_consultor.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-1">Compromisos del consultor</div>
                <ul className="text-sm list-disc list-inside space-y-0.5">{p5.compromisos_consultor.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            )}
            {(p5.condiciones_aceptadas ?? []).length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-1">Condiciones aceptadas</div>
                <ul className="text-sm list-disc list-inside space-y-0.5">{(p5.condiciones_aceptadas ?? []).map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            )}
            {p5.condiciones && <Narrative title="Condiciones especiales" text={p5.condiciones} />}
            {p5.notas && <Narrative title="Notas finales" text={p5.notas} />}
          </PerfilSection>
        </div>
      </Card>

      <Card title="Análisis IA — Recomendaciones para el consultor">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">Genera un análisis del perfil del líder, brechas SIDE probables, riesgos y alertas tempranas.</p>
          <Button onClick={onGenerarIA} disabled={generando} className="bg-gold hover:bg-gold/90 text-navy">
            {generando ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generando…</> : <><Sparkles className="w-4 h-4 mr-1" /> {analisisIa ? "Regenerar" : "Generar análisis IA"}</>}
          </Button>
        </div>
        {analisisIa ? (
          <div className="prose prose-sm max-w-none mt-3 whitespace-pre-wrap text-sm text-foreground">{analisisIa}</div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded">
            Aún no se ha generado el análisis IA.
          </div>
        )}
      </Card>

      <Card title="Acciones finales">
        <div className="flex flex-wrap gap-2">
          <Button onClick={onExportarPDF} className="bg-navy hover:bg-navy/90">
            <FileDown className="w-4 h-4 mr-1" /> Exportar PDF del Perfil
          </Button>
          {!completado && (
            <Button onClick={onCompletar} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar onboarding como completado
            </Button>
          )}
        </div>
        {completado && (
          <p className="text-xs text-emerald-700 mt-2">
            ✓ Onboarding completado. El SIDE ya está activo para este cliente.
          </p>
        )}
      </Card>
    </>
  );
}

function Resumen({ titulo, items }: { titulo?: string; items: Array<[string, string | undefined]> }) {
  return (
    <div>
      {titulo && <div className="text-xs font-bold text-gold uppercase tracking-wider mb-1">{titulo}</div>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{k}</span>
            <span className="text-navy font-medium truncate">{v || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerfilSection({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 pb-4 border-b border-dashed border-border last:border-0">
      <div className="text-sm font-bold text-navy">{titulo}</div>
      {children}
    </div>
  );
}

function Narrative({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-0.5">{title}</div>
      <p className="text-sm text-foreground leading-snug whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function FodaBox({ titulo, color, items }: { titulo: string; color: "emerald" | "rose" | "blue" | "amber"; items: string[] }) {
  const colors: Record<string, string> = {
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-900",
    rose: "border-rose-300 bg-rose-50 text-rose-900",
    blue: "border-blue-300 bg-blue-50 text-blue-900",
    amber: "border-amber-300 bg-amber-50 text-amber-900",
  };
  return (
    <div className={`border rounded p-2.5 ${colors[color]}`}>
      <div className="text-[10px] uppercase tracking-wider font-bold mb-1">{titulo}</div>
      {items.length === 0 ? (
        <p className="text-xs italic opacity-60">—</p>
      ) : (
        <ul className="text-xs list-disc list-inside space-y-0.5">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
      )}
    </div>
  );
}
