import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TIPOS_ACTIVIDAD } from "@/lib/clientes-helpers";
import { ETAPAS_PROGRAMA, PROGRAMAS, MODALIDADES_SESION, SEMAFOROS, KPI_LIBRARY, CATEGORIAS_KPI, type KpiInput, type CompromisoInput } from "@/lib/sesion-helpers";
import { generarReporteSesionPDF } from "@/lib/sesion-pdf";
import { toast } from "sonner";
import { Plus, Trash2, FileDown, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/clientes/$clienteId/actividades")({ component: Actividades });

interface Actividad {
  id: string; cliente_id: string; contacto_id: string | null; tipo: string; titulo: string;
  descripcion: string | null; fecha: string; duracion_minutos: number | null;
  resultado: string | null; proxima_accion: string | null; fecha_proxima_accion: string | null;
  es_sesion_consultoria: boolean; numero_sesion: number | null; programa: string | null;
  etapa_programa: string | null; modalidad: string | null; objetivo: string | null;
  participantes: string[]; temas: string[]; logros: string[]; herramientas: string[];
  semaforo: string | null; justificacion_semaforo: string | null;
  proxima_fecha: string | null; proxima_temas: string[]; mensaje_cliente: string | null;
}

interface ContactoLite { id: string; nombre: string; apellido: string }

const EMPTY_BASIC = {
  tipo: "reunion", titulo: "", descripcion: "",
  fecha: new Date().toISOString().slice(0, 16), contacto_id: "",
  duracion_minutos: "", resultado: "", proxima_accion: "", fecha_proxima_accion: "",
};

const EMPTY_SESION = {
  numero_sesion: "1", programa: "Coaching Ejecutivo", etapa_programa: "Diagnóstico",
  modalidad: "Virtual", fecha: new Date().toISOString().slice(0, 16), duracion_minutos: "60",
  objetivo: "", participantes_text: "", temas_text: "", logros_text: "", herramientas_text: "",
  semaforo: "verde", justificacion_semaforo: "",
  proxima_fecha: "", proxima_temas_text: "", mensaje_cliente: "",
};

function Actividades() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/actividades" });
  const { user } = useAuth();
  const [list, setList] = useState<Actividad[]>([]);
  const [contactos, setContactos] = useState<ContactoLite[]>([]);
  const [empresa, setEmpresa] = useState<{ nombre_empresa: string; sector: string | null } | null>(null);
  const [filtro, setFiltro] = useState("__all");
  const [openBasic, setOpenBasic] = useState(false);
  const [openSesion, setOpenSesion] = useState(false);
  const [formBasic, setFormBasic] = useState(EMPTY_BASIC);
  const [formSesion, setFormSesion] = useState(EMPTY_SESION);
  const [kpis, setKpis] = useState<KpiInput[]>([]);
  const [compromisos, setCompromisos] = useState<CompromisoInput[]>([]);

  const reload = async () => {
    const [{ data: a }, { data: c }, { data: e }] = await Promise.all([
      supabase.from("cliente_actividades").select("*").eq("cliente_id", clienteId).order("fecha", { ascending: false }),
      supabase.from("cliente_contactos").select("id,nombre,apellido").eq("cliente_id", clienteId).eq("activo", true),
      supabase.from("clientes").select("nombre_empresa,sector").eq("id", clienteId).maybeSingle(),
    ]);
    setList((a ?? []) as unknown as Actividad[]);
    setContactos((c ?? []) as ContactoLite[]);
    setEmpresa(e as { nombre_empresa: string; sector: string | null } | null);
  };

  useEffect(() => { reload(); }, [clienteId]);

  const filtered = useMemo(() => filtro === "__all" ? list : filtro === "__sesion" ? list.filter((a) => a.es_sesion_consultoria) : list.filter((a) => a.tipo === filtro), [list, filtro]);
  const numSesiones = list.filter((a) => a.es_sesion_consultoria).length;

  const saveBasic = async () => {
    if (!formBasic.titulo.trim()) { toast.error("Falta el título"); return; }
    const { error } = await supabase.from("cliente_actividades").insert({
      cliente_id: clienteId, consultor_id: user?.id ?? null,
      contacto_id: formBasic.contacto_id || null, tipo: formBasic.tipo,
      titulo: formBasic.titulo, descripcion: formBasic.descripcion || null,
      fecha: new Date(formBasic.fecha).toISOString(),
      duracion_minutos: formBasic.duracion_minutos ? parseInt(formBasic.duracion_minutos) : null,
      resultado: formBasic.resultado || null,
      proxima_accion: formBasic.proxima_accion || null,
      fecha_proxima_accion: formBasic.fecha_proxima_accion || null,
      es_sesion_consultoria: false,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Actividad registrada"); setOpenBasic(false); setFormBasic(EMPTY_BASIC); reload();
  };

  const splitLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

  const saveSesion = async () => {
    if (!formSesion.objetivo.trim()) { toast.error("Falta el objetivo de la sesión"); return; }
    const titulo = `Sesión #${formSesion.numero_sesion} — ${formSesion.programa} (${formSesion.etapa_programa})`;
    const payload = {
      cliente_id: clienteId, consultor_id: user?.id ?? null,
      tipo: "sesion_coaching", titulo,
      fecha: new Date(formSesion.fecha).toISOString(),
      duracion_minutos: formSesion.duracion_minutos ? parseInt(formSesion.duracion_minutos) : null,
      es_sesion_consultoria: true,
      numero_sesion: parseInt(formSesion.numero_sesion) || 1,
      programa: formSesion.programa, etapa_programa: formSesion.etapa_programa,
      modalidad: formSesion.modalidad, objetivo: formSesion.objetivo,
      participantes: splitLines(formSesion.participantes_text),
      temas: splitLines(formSesion.temas_text),
      logros: splitLines(formSesion.logros_text),
      herramientas: splitLines(formSesion.herramientas_text),
      semaforo: formSesion.semaforo,
      justificacion_semaforo: formSesion.justificacion_semaforo || null,
      proxima_fecha: formSesion.proxima_fecha ? new Date(formSesion.proxima_fecha).toISOString() : null,
      proxima_temas: splitLines(formSesion.proxima_temas_text),
      mensaje_cliente: formSesion.mensaje_cliente || null,
    };
    const { data: act, error } = await supabase.from("cliente_actividades").insert(payload).select("id").single();
    if (error || !act) { toast.error(error?.message ?? "Error"); return; }

    if (kpis.length) {
      await supabase.from("cliente_kpis").insert(kpis.map((k) => ({
        cliente_id: clienteId, actividad_id: act.id,
        categoria: k.categoria, nombre: k.nombre, unidad: k.unidad ?? null, formula: k.formula ?? null,
        valor_actual: k.valor_actual ? parseFloat(k.valor_actual) : null,
        valor_meta: k.valor_meta ? parseFloat(k.valor_meta) : null,
        semaforo: k.semaforo, observacion: k.observacion ?? null,
      })));
    }
    if (compromisos.length) {
      await supabase.from("cliente_compromisos").insert(compromisos.map((c) => ({
        cliente_id: clienteId, actividad_id: act.id, origen: "sesion",
        descripcion: c.descripcion, responsable: c.responsable,
        fecha_limite: c.fecha_limite || null, estado: "pendiente",
      })));
    }
    toast.success("Reporte de sesión guardado");
    setOpenSesion(false); setFormSesion(EMPTY_SESION); setKpis([]); setCompromisos([]); reload();
  };

  const exportarPDF = async (a: Actividad) => {
    if (!a.es_sesion_consultoria) { toast.error("Solo sesiones de consultoría"); return; }
    const [{ data: ks }, { data: cs }] = await Promise.all([
      supabase.from("cliente_kpis").select("*").eq("actividad_id", a.id),
      supabase.from("cliente_compromisos").select("*").eq("actividad_id", a.id),
    ]);
    const doc = generarReporteSesionPDF({
      empresa: { nombre: empresa?.nombre_empresa ?? "—", sector: empresa?.sector },
      numero_sesion: a.numero_sesion, programa: a.programa, etapa: a.etapa_programa,
      fecha: a.fecha, duracion_minutos: a.duracion_minutos, modalidad: a.modalidad,
      participantes: a.participantes ?? [], objetivo: a.objetivo,
      temas: a.temas ?? [], logros: a.logros ?? [], herramientas: a.herramientas ?? [],
      semaforo: a.semaforo, justificacion_semaforo: a.justificacion_semaforo,
      kpis: (ks ?? []).map((k) => ({
        categoria: k.categoria, nombre: k.nombre,
        valor_actual: k.valor_actual?.toString(), valor_meta: k.valor_meta?.toString(),
        unidad: k.unidad ?? undefined, semaforo: k.semaforo, observacion: k.observacion ?? undefined,
      })),
      compromisos: (cs ?? []).map((c) => ({
        descripcion: c.descripcion, responsable: c.responsable ?? "—",
        fecha_limite: c.fecha_limite ?? undefined,
      })),
      proxima_fecha: a.proxima_fecha, proxima_temas: a.proxima_temas ?? [],
      mensaje_cliente: a.mensaje_cliente,
    });
    doc.save(`Sesion-${a.numero_sesion ?? ""}-${empresa?.nombre_empresa ?? "cliente"}.pdf`);
  };

  const addKpiFromLibrary = (categoria: string, nombre: string) => {
    const lib = KPI_LIBRARY[categoria]?.find((k) => k.nombre === nombre);
    setKpis([...kpis, { categoria, nombre, unidad: lib?.unidad, formula: lib?.formula, semaforo: "verde" }]);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl text-navy">Actividades y seguimiento</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenBasic(true)}>
            <Plus className="w-4 h-4 mr-1" /> Actividad rápida
          </Button>
          <Button onClick={() => { setFormSesion({ ...EMPTY_SESION, numero_sesion: String(numSesiones + 1) }); setOpenSesion(true); }} className="bg-navy hover:bg-navy/90">
            <Sparkles className="w-4 h-4 mr-1" /> Reporte de sesión
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltro("__all")} className={`px-3 py-1 rounded-full text-xs ${filtro === "__all" ? "bg-navy text-white" : "bg-cream text-navy"}`}>Todas ({list.length})</button>
        <button onClick={() => setFiltro("__sesion")} className={`px-3 py-1 rounded-full text-xs ${filtro === "__sesion" ? "bg-gold text-navy" : "bg-cream text-navy"}`}>🌟 Sesiones ({numSesiones})</button>
        {TIPOS_ACTIVIDAD.map((t) => {
          const n = list.filter((a) => a.tipo === t.value && !a.es_sesion_consultoria).length;
          if (!n) return null;
          return <button key={t.value} onClick={() => setFiltro(t.value)} className={`px-3 py-1 rounded-full text-xs ${filtro === t.value ? "bg-navy text-white" : "bg-cream text-navy"}`}>{t.label} ({n})</button>;
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="a360-card a360-card-lg p-12 text-center text-muted-foreground">Sin actividades registradas.</div>
      ) : (
        <div className="a360-card a360-card-lg p-5">
          <ol className="relative border-l-2 border-cream space-y-6 ml-3">
            {filtered.map((a) => {
              const tipo = TIPOS_ACTIVIDAD.find((t) => t.value === a.tipo);
              const ct = contactos.find((c) => c.id === a.contacto_id);
              const sem = SEMAFOROS.find((s) => s.value === a.semaforo);
              return (
                <li key={a.id} className="ml-6">
                  <span className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 border-white ${a.es_sesion_consultoria ? "bg-gold" : "bg-navy"}`} />
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {a.es_sesion_consultoria ? (
                      <>
                        <Badge className="bg-gold text-navy">Sesión #{a.numero_sesion}</Badge>
                        <span className="text-xs text-muted-foreground">{a.programa} · {a.etapa_programa}</span>
                      </>
                    ) : (
                      <span className="text-xs uppercase tracking-wider text-gold font-semibold">{tipo?.label ?? a.tipo}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{new Date(a.fecha).toLocaleString()}</span>
                    {ct && <span className="text-xs text-muted-foreground">· con {ct.nombre} {ct.apellido}</span>}
                    {a.duracion_minutos && <span className="text-xs text-muted-foreground">· {a.duracion_minutos} min</span>}
                    {sem && <span className={`inline-block w-2.5 h-2.5 rounded-full ${sem.color}`} title={sem.label} />}
                  </div>
                  <h4 className="text-navy font-semibold mt-1">{a.titulo}</h4>
                  {a.objetivo && <p className="text-sm text-muted-foreground mt-1"><strong>Objetivo:</strong> {a.objetivo}</p>}
                  {a.descripcion && <p className="text-sm text-muted-foreground mt-1">{a.descripcion}</p>}
                  {!!a.logros?.length && (
                    <div className="text-xs mt-2"><strong className="text-navy">Logros:</strong> {a.logros.join(" · ")}</div>
                  )}
                  {a.resultado && <p className="text-sm mt-2"><strong className="text-navy">Resultado:</strong> {a.resultado}</p>}
                  {(a.proxima_accion || a.proxima_fecha) && (
                    <div className="mt-2 p-2 bg-cream rounded text-xs">
                      <strong className="text-navy">Próxima:</strong> {a.proxima_accion ?? a.proxima_temas?.join(", ")}
                      {(a.fecha_proxima_accion || a.proxima_fecha) && <span className="text-gold ml-2">· {new Date((a.fecha_proxima_accion ?? a.proxima_fecha)!).toLocaleDateString()}</span>}
                    </div>
                  )}
                  {a.es_sesion_consultoria && (
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => exportarPDF(a)}>
                      <FileDown className="w-3 h-3 mr-1" /> PDF de sesión
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Diálogo actividad rápida */}
      <Dialog open={openBasic} onOpenChange={setOpenBasic}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva actividad</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo *</Label>
              <Select value={formBasic.tipo} onValueChange={(v) => setFormBasic({ ...formBasic, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_ACTIVIDAD.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fecha y hora *</Label><Input type="datetime-local" value={formBasic.fecha} onChange={(e) => setFormBasic({ ...formBasic, fecha: e.target.value })} /></div>
            <div className="col-span-2"><Label>Título *</Label><Input value={formBasic.titulo} onChange={(e) => setFormBasic({ ...formBasic, titulo: e.target.value })} /></div>
            <div className="col-span-2"><Label>Descripción</Label><Textarea rows={2} value={formBasic.descripcion} onChange={(e) => setFormBasic({ ...formBasic, descripcion: e.target.value })} /></div>
            <div><Label>Contacto</Label>
              <Select value={formBasic.contacto_id} onValueChange={(v) => setFormBasic({ ...formBasic, contacto_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{contactos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre} {c.apellido}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Duración (min)</Label><Input type="number" value={formBasic.duracion_minutos} onChange={(e) => setFormBasic({ ...formBasic, duracion_minutos: e.target.value })} /></div>
            <div className="col-span-2"><Label>Resultado</Label><Textarea rows={2} value={formBasic.resultado} onChange={(e) => setFormBasic({ ...formBasic, resultado: e.target.value })} /></div>
            <div><Label>Próxima acción</Label><Input value={formBasic.proxima_accion} onChange={(e) => setFormBasic({ ...formBasic, proxima_accion: e.target.value })} /></div>
            <div><Label>Fecha próxima acción</Label><Input type="date" value={formBasic.fecha_proxima_accion} onChange={(e) => setFormBasic({ ...formBasic, fecha_proxima_accion: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenBasic(false)}>Cancelar</Button>
            <Button onClick={saveBasic} className="bg-gold text-navy hover:bg-gold/90">Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Reporte de sesión */}
      <Dialog open={openSesion} onOpenChange={setOpenSesion}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold" /> Reporte de sesión de consultoría</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="contexto">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="contexto">1. Contexto</TabsTrigger>
              <TabsTrigger value="contenido">2. Contenido</TabsTrigger>
              <TabsTrigger value="kpis">3. KPIs</TabsTrigger>
              <TabsTrigger value="compromisos">4. Compromisos</TabsTrigger>
              <TabsTrigger value="cierre">5. Cierre</TabsTrigger>
            </TabsList>

            <TabsContent value="contexto" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label># Sesión</Label><Input type="number" value={formSesion.numero_sesion} onChange={(e) => setFormSesion({ ...formSesion, numero_sesion: e.target.value })} /></div>
                <div><Label>Programa</Label>
                  <Select value={formSesion.programa} onValueChange={(v) => setFormSesion({ ...formSesion, programa: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROGRAMAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Etapa</Label>
                  <Select value={formSesion.etapa_programa} onValueChange={(v) => setFormSesion({ ...formSesion, etapa_programa: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ETAPAS_PROGRAMA.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Fecha y hora</Label><Input type="datetime-local" value={formSesion.fecha} onChange={(e) => setFormSesion({ ...formSesion, fecha: e.target.value })} /></div>
                <div><Label>Duración (min)</Label><Input type="number" value={formSesion.duracion_minutos} onChange={(e) => setFormSesion({ ...formSesion, duracion_minutos: e.target.value })} /></div>
                <div><Label>Modalidad</Label>
                  <Select value={formSesion.modalidad} onValueChange={(v) => setFormSesion({ ...formSesion, modalidad: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MODALIDADES_SESION.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Participantes (uno por línea)</Label><Textarea rows={3} value={formSesion.participantes_text} onChange={(e) => setFormSesion({ ...formSesion, participantes_text: e.target.value })} placeholder="Juan Pérez (CEO)\nMaría López (CFO)" /></div>
              <div><Label>Objetivo de la sesión *</Label><Textarea rows={2} value={formSesion.objetivo} onChange={(e) => setFormSesion({ ...formSesion, objetivo: e.target.value })} /></div>
            </TabsContent>

            <TabsContent value="contenido" className="space-y-3 pt-3">
              <div><Label>Temas abordados (uno por línea)</Label><Textarea rows={4} value={formSesion.temas_text} onChange={(e) => setFormSesion({ ...formSesion, temas_text: e.target.value })} /></div>
              <div><Label>Logros / Avances (uno por línea)</Label><Textarea rows={4} value={formSesion.logros_text} onChange={(e) => setFormSesion({ ...formSesion, logros_text: e.target.value })} /></div>
              <div><Label>Herramientas aplicadas (una por línea)</Label><Textarea rows={3} value={formSesion.herramientas_text} onChange={(e) => setFormSesion({ ...formSesion, herramientas_text: e.target.value })} placeholder="FODA\nMatriz BCG\nCanvas" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Semáforo de la sesión</Label>
                  <Select value={formSesion.semaforo} onValueChange={(v) => setFormSesion({ ...formSesion, semaforo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SEMAFOROS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Justificación del semáforo</Label><Input value={formSesion.justificacion_semaforo} onChange={(e) => setFormSesion({ ...formSesion, justificacion_semaforo: e.target.value })} /></div>
              </div>
            </TabsContent>

            <TabsContent value="kpis" className="space-y-3 pt-3">
              <div className="bg-cream p-3 rounded">
                <Label className="text-xs text-navy">Agregar KPI desde biblioteca</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Select onValueChange={(v) => { const [cat, n] = v.split("||"); addKpiFromLibrary(cat, n); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona un KPI…" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {CATEGORIAS_KPI.map((cat) => (
                        <div key={cat}>
                          <div className="px-2 py-1 text-xs font-bold text-gold uppercase">{cat}</div>
                          {KPI_LIBRARY[cat].map((k) => (
                            <SelectItem key={`${cat}-${k.nombre}`} value={`${cat}||${k.nombre}`}>{k.nombre} ({k.unidad})</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setKpis([...kpis, { categoria: "Otro", nombre: "", semaforo: "verde" }])}>
                    <Plus className="w-3 h-3 mr-1" /> KPI personalizado
                  </Button>
                </div>
              </div>
              {kpis.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Aún no hay KPIs medidos en esta sesión.</p> : (
                <div className="space-y-2">
                  {kpis.map((k, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end p-2 bg-white border rounded">
                      <div className="col-span-3"><Label className="text-xs">Categoría</Label><Input value={k.categoria} onChange={(e) => { const c = [...kpis]; c[i].categoria = e.target.value; setKpis(c); }} /></div>
                      <div className="col-span-3"><Label className="text-xs">Nombre</Label><Input value={k.nombre} onChange={(e) => { const c = [...kpis]; c[i].nombre = e.target.value; setKpis(c); }} /></div>
                      <div className="col-span-1"><Label className="text-xs">Actual</Label><Input value={k.valor_actual ?? ""} onChange={(e) => { const c = [...kpis]; c[i].valor_actual = e.target.value; setKpis(c); }} /></div>
                      <div className="col-span-1"><Label className="text-xs">Meta</Label><Input value={k.valor_meta ?? ""} onChange={(e) => { const c = [...kpis]; c[i].valor_meta = e.target.value; setKpis(c); }} /></div>
                      <div className="col-span-1"><Label className="text-xs">Unidad</Label><Input value={k.unidad ?? ""} onChange={(e) => { const c = [...kpis]; c[i].unidad = e.target.value; setKpis(c); }} /></div>
                      <div className="col-span-2"><Label className="text-xs">Semáforo</Label>
                        <Select value={k.semaforo} onValueChange={(v) => { const c = [...kpis]; c[i].semaforo = v as "verde" | "amarillo" | "rojo"; setKpis(c); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{SEMAFOROS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setKpis(kpis.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="compromisos" className="space-y-3 pt-3">
              <Button variant="outline" size="sm" onClick={() => setCompromisos([...compromisos, { descripcion: "", responsable: "", fecha_limite: "" }])}>
                <Plus className="w-3 h-3 mr-1" /> Agregar compromiso
              </Button>
              {compromisos.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Sin compromisos registrados.</p> : (
                <div className="space-y-2">
                  {compromisos.map((c, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end p-2 bg-white border rounded">
                      <div className="col-span-6"><Label className="text-xs">Descripción</Label><Input value={c.descripcion} onChange={(e) => { const x = [...compromisos]; x[i].descripcion = e.target.value; setCompromisos(x); }} /></div>
                      <div className="col-span-3"><Label className="text-xs">Responsable</Label><Input value={c.responsable} onChange={(e) => { const x = [...compromisos]; x[i].responsable = e.target.value; setCompromisos(x); }} /></div>
                      <div className="col-span-2"><Label className="text-xs">Fecha límite</Label><Input type="date" value={c.fecha_limite ?? ""} onChange={(e) => { const x = [...compromisos]; x[i].fecha_limite = e.target.value; setCompromisos(x); }} /></div>
                      <Button variant="ghost" size="sm" onClick={() => setCompromisos(compromisos.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cierre" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Fecha próxima sesión</Label><Input type="datetime-local" value={formSesion.proxima_fecha} onChange={(e) => setFormSesion({ ...formSesion, proxima_fecha: e.target.value })} /></div>
              </div>
              <div><Label>Temas planificados próxima sesión (uno por línea)</Label><Textarea rows={3} value={formSesion.proxima_temas_text} onChange={(e) => setFormSesion({ ...formSesion, proxima_temas_text: e.target.value })} /></div>
              <div><Label>Mensaje para el cliente</Label><Textarea rows={4} value={formSesion.mensaje_cliente} onChange={(e) => setFormSesion({ ...formSesion, mensaje_cliente: e.target.value })} placeholder="Resumen ejecutivo, agradecimiento, próximos pasos…" /></div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenSesion(false)}>Cancelar</Button>
            <Button onClick={saveSesion} className="bg-gold text-navy hover:bg-gold/90">Guardar reporte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
