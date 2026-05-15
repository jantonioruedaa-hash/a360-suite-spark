import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LEE_CAPITULOS, LEE_OVERVIEW, getCapitulo, type CapituloLEE } from "@/lib/lee-catalogo";
import { Lock, Unlock, Check, BookOpen, Award, Sparkles, Play, Brain, Briefcase, Target, ListChecks, Mic, Library } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clientes/$clienteId/lee")({
  component: LeeWorkspace,
});

interface Programa {
  id: string;
  cliente_id: string;
  facilitador_id: string | null;
  capitulos_desbloqueados: number[];
}
interface Workbook {
  id: string;
  programa_id: string;
  capitulo_numero: number;
  sesion_numero: number;
  respuestas: Record<string, string>;
  completado: boolean;
}

function LeeWorkspace() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/lee" });
  const [programa, setPrograma] = useState<Programa | null>(null);
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ capitulo: number; workbookDefId: string; workbook: Workbook | null } | null>(null);

  const cargar = async () => {
    setLoading(true);
    const { data: p } = await supabase.from("lee_programas").select("*").eq("cliente_id", clienteId).maybeSingle();
    setPrograma(p as Programa | null);
    if (p) {
      const { data: wbs } = await supabase.from("lee_workbooks").select("*").eq("programa_id", (p as Programa).id);
      setWorkbooks((wbs ?? []) as Workbook[]);
    } else {
      setWorkbooks([]);
    }
    setLoading(false);
  };
  useEffect(() => { cargar(); }, [clienteId]);

  const iniciar = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("lee_programas").insert({
      cliente_id: clienteId,
      facilitador_id: u.user?.id ?? null,
      capitulos_desbloqueados: [1],
    });
    if (error) return toast.error(error.message);
    toast.success("Programa LEE iniciado");
    cargar();
  };

  const desbloquear = async (cap: number) => {
    if (!programa) return;
    const next = Array.from(new Set([...programa.capitulos_desbloqueados, cap])).sort((a, b) => a - b);
    const { error } = await supabase.from("lee_programas").update({ capitulos_desbloqueados: next }).eq("id", programa.id);
    if (error) return toast.error(error.message);
    toast.success(`Capítulo ${cap} desbloqueado`);
    cargar();
  };

  if (loading) return <div className="text-muted-foreground">Cargando programa…</div>;

  if (!programa) {
    return (
      <div className="max-w-3xl space-y-4">
        <h2 className="font-display text-2xl text-navy">Programa LEE</h2>
        <Card><CardContent className="p-8 text-center space-y-3">
          <GraduationIcon />
          <p className="text-sm text-muted-foreground">Este cliente aún no tiene programa LEE iniciado.</p>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto">{LEE_OVERVIEW.proposito}</p>
          <Button onClick={iniciar} className="bg-navy hover:bg-navy/90">
            <Play className="w-4 h-4 mr-1" /> Iniciar programa LEE
          </Button>
        </CardContent></Card>
      </div>
    );
  }

  const desbloqueados = new Set(programa.capitulos_desbloqueados);
  const wbCompletos = workbooks.filter((w) => w.completado).length;
  const totalWbs = LEE_CAPITULOS.reduce((a, c) => a + c.workbook.length, 0);
  const pctGlobal = Math.round((wbCompletos / totalWbs) * 100);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl text-navy">Programa LEE — Workspace</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {LEE_OVERVIEW.duracionTotal} · {LEE_OVERVIEW.formato}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Progreso global</div>
          <div className="font-display text-2xl text-navy">{pctGlobal}%</div>
          <div className="text-xs">{wbCompletos} / {totalWbs} ejercicios</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Capítulos desbloqueados</div>
          <div className="font-display text-2xl text-navy">{desbloqueados.size}/{LEE_CAPITULOS.length}</div>
          <Progress value={(desbloqueados.size / LEE_CAPITULOS.length) * 100} className="h-1.5 mt-2" />
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Workbooks</div>
          <div className="font-display text-2xl text-navy">{wbCompletos}/{totalWbs}</div>
          <Progress value={pctGlobal} className="h-1.5 mt-2" />
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Award className="w-8 h-8 text-gold" />
          <div>
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Certificación</div>
            <div className="text-sm font-medium">{pctGlobal >= 80 ? "Disponible 🎉" : `Faltan ${Math.max(0, Math.ceil(totalWbs * 0.8) - wbCompletos)} workbooks`}</div>
          </div>
        </CardContent></Card>
      </div>

      <div className="space-y-3">
        {LEE_CAPITULOS.map((cap) => {
          const open = desbloqueados.has(cap.numero);
          const wbs = workbooks.filter((w) => w.capitulo_numero === cap.numero);
          const wbCompletosCap = wbs.filter((w) => w.completado).length;
          return (
            <Card key={cap.numero} className={open ? "" : "opacity-60"}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    {open ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-[10px] font-mono text-gold font-bold">CAP {String(cap.numero).padStart(2, "0")}</span>
                    <CardTitle className="text-sm">{cap.titulo}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{wbCompletosCap}/{cap.workbook.length} workbooks</Badge>
                    {!open && (
                      <Button size="sm" variant="outline" onClick={() => desbloquear(cap.numero)}>
                        <Unlock className="w-3 h-3 mr-1" /> Desbloquear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{cap.proposito}</p>
                <div className="flex flex-wrap gap-1">
                  {cap.competencias.map((c) => (
                    <Badge key={c} variant="outline" className="text-[10px] bg-navy/5">{c}</Badge>
                  ))}
                </div>
                {open && <ContenidoCapitulo cap={cap} workbooksDelCap={wbs} onAbrirWorkbook={(wbId) => {
                  const existing = wbs.find((x) => (x.respuestas as Record<string, string>)?.__id === wbId) ?? null;
                  setEditing({ capitulo: cap.numero, workbookDefId: wbId, workbook: existing });
                }} />}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editing && (
        <WorkbookDialog
          programaId={programa.id}
          capitulo={editing.capitulo}
          workbookDefId={editing.workbookDefId}
          workbook={editing.workbook}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); cargar(); }}
        />
      )}
    </div>
  );
}

function GraduationIcon() {
  return <BookOpen className="w-12 h-12 text-gold mx-auto" />;
}

function ContenidoCapitulo({ cap, workbooksDelCap, onAbrirWorkbook }: {
  cap: CapituloLEE;
  workbooksDelCap: Workbook[];
  onAbrirWorkbook: (wbId: string) => void;
}) {
  return (
    <Tabs defaultValue="marco" className="pt-2 border-t">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
        <TabsTrigger value="marco" className="text-[11px] gap-1"><Brain className="w-3 h-3" />Marco</TabsTrigger>
        <TabsTrigger value="caso" className="text-[11px] gap-1"><Briefcase className="w-3 h-3" />Caso</TabsTrigger>
        <TabsTrigger value="workbook" className="text-[11px] gap-1"><BookOpen className="w-3 h-3" />Workbook</TabsTrigger>
        <TabsTrigger value="reto" className="text-[11px] gap-1"><Target className="w-3 h-3" />Reto</TabsTrigger>
        <TabsTrigger value="rubrica" className="text-[11px] gap-1"><ListChecks className="w-3 h-3" />Rúbrica</TabsTrigger>
        <TabsTrigger value="facilitador" className="text-[11px] gap-1"><Mic className="w-3 h-3" />Facilitador</TabsTrigger>
        <TabsTrigger value="bibliografia" className="text-[11px] gap-1"><Library className="w-3 h-3" />Lecturas</TabsTrigger>
      </TabsList>

      <TabsContent value="marco" className="text-xs space-y-3 pt-3">
        <p className="leading-relaxed whitespace-pre-line">{cap.marcoTeorico.introduccion}</p>
        <div>
          <h5 className="font-semibold text-navy text-[11px] uppercase tracking-wider mb-1">Conceptos clave</h5>
          <div className="grid md:grid-cols-2 gap-2">
            {cap.marcoTeorico.conceptosClave.map((c, i) => (
              <div key={i} className="bg-muted/30 p-2 rounded border">
                <div className="font-medium">{c.concepto}</div>
                <p className="text-muted-foreground mt-0.5">{c.definicion}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h5 className="font-semibold text-navy text-[11px] uppercase tracking-wider mb-1">Modelos y frameworks</h5>
          <div className="space-y-2">
            {cap.marcoTeorico.modelos.map((m, i) => (
              <div key={i} className="border-l-2 border-gold pl-2">
                <div className="font-medium">{m.nombre} <span className="text-muted-foreground font-normal">— {m.autor}</span></div>
                <p className="text-muted-foreground mt-0.5">{m.descripcion}</p>
                <p className="mt-1"><span className="font-medium text-navy">Cómo aplicarlo:</span> {m.comoAplicarlo}</p>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="caso" className="text-xs space-y-2 pt-3">
        <h5 className="font-display text-navy text-base">{cap.casoEstudio.titulo}</h5>
        <p><span className="font-semibold text-navy">Contexto: </span>{cap.casoEstudio.contexto}</p>
        <p><span className="font-semibold text-navy">Dilema: </span>{cap.casoEstudio.dilema}</p>
        <div>
          <h6 className="font-semibold text-navy text-[11px] uppercase tracking-wider mt-2 mb-1">Preguntas para discutir</h6>
          <ul className="space-y-1 pl-4">
            {cap.casoEstudio.preguntasReflexion.map((p, i) => (
              <li key={i} className="flex gap-1"><span className="text-gold">›</span><span>{p}</span></li>
            ))}
          </ul>
        </div>
      </TabsContent>

      <TabsContent value="workbook" className="pt-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {cap.workbook.map((w) => {
            const existing = workbooksDelCap.find((x) => (x.respuestas as Record<string, string>)?.__id === w.id) ?? null;
            const completo = existing?.completado;
            return (
              <button
                key={w.id}
                onClick={() => onAbrirWorkbook(w.id)}
                className={`text-left p-3 rounded border ${completo ? "bg-emerald-50 border-emerald-200" : "bg-white hover:bg-muted/30"}`}
              >
                <div className="flex items-center gap-2">
                  {completo && <Check className="w-3 h-3 text-emerald-600" />}
                  <span className="text-sm font-medium">{w.titulo}</span>
                  <Badge variant="outline" className="text-[9px] ml-auto">{w.tipo}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{w.descripcion}</p>
              </button>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="reto" className="text-xs space-y-2 pt-3">
        <h5 className="font-display text-navy text-base">{cap.retoAplicacion.titulo}</h5>
        <p>{cap.retoAplicacion.descripcion}</p>
        <div>
          <h6 className="font-semibold text-navy text-[11px] uppercase tracking-wider mt-2 mb-1">Pasos</h6>
          <ol className="list-decimal pl-5 space-y-0.5">
            {cap.retoAplicacion.pasos.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        </div>
        <p className="bg-gold/10 p-2 rounded border border-gold/30"><span className="font-semibold text-navy">Evidencia esperada: </span>{cap.retoAplicacion.evidenciaEsperada}</p>
      </TabsContent>

      <TabsContent value="rubrica" className="pt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border">
            <thead className="bg-navy/5">
              <tr>
                <th className="text-left p-2 border-b">Criterio</th>
                <th className="text-left p-2 border-b">Inicial</th>
                <th className="text-left p-2 border-b">En desarrollo</th>
                <th className="text-left p-2 border-b">Dominado</th>
              </tr>
            </thead>
            <tbody>
              {cap.rubrica.map((r, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2 font-medium align-top">{r.criterio}</td>
                  <td className="p-2 text-muted-foreground align-top">{r.nivel1}</td>
                  <td className="p-2 align-top">{r.nivel2}</td>
                  <td className="p-2 text-emerald-700 align-top">{r.nivel3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="facilitador" className="text-xs space-y-3 pt-3">
        <div>
          <h6 className="font-semibold text-navy text-[11px] uppercase tracking-wider mb-1">Objetivos de la sesión</h6>
          <ul className="pl-4 space-y-0.5">
            {cap.guionFacilitador.objetivosSesion.map((o, i) => <li key={i} className="flex gap-1"><span className="text-gold">›</span><span>{o}</span></li>)}
          </ul>
        </div>
        <div>
          <h6 className="font-semibold text-navy text-[11px] uppercase tracking-wider mb-1">Agenda</h6>
          <table className="w-full">
            <tbody>
              {cap.guionFacilitador.agenda.map((a, i) => (
                <tr key={i} className="border-b">
                  <td className="py-1 pr-2 font-mono text-gold w-12">{a.minutos}'</td>
                  <td className="py-1 pr-2 font-medium w-32">{a.bloque}</td>
                  <td className="py-1 text-muted-foreground">{a.actividad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h6 className="font-semibold text-navy text-[11px] uppercase tracking-wider mb-1">Preguntas poderosas</h6>
          <ul className="pl-4 space-y-0.5">
            {cap.guionFacilitador.preguntasPoderosas.map((p, i) => <li key={i} className="flex gap-1"><Sparkles className="w-3 h-3 text-gold shrink-0 mt-0.5" /><span>{p}</span></li>)}
          </ul>
        </div>
        <div>
          <h6 className="font-semibold text-navy text-[11px] uppercase tracking-wider mb-1">Tips de facilitación</h6>
          <ul className="pl-4 space-y-0.5">
            {cap.guionFacilitador.tipsFacilitacion.map((t, i) => <li key={i} className="flex gap-1"><span className="text-gold">›</span><span>{t}</span></li>)}
          </ul>
        </div>
      </TabsContent>

      <TabsContent value="bibliografia" className="text-xs space-y-2 pt-3">
        {cap.bibliografia.map((b, i) => (
          <div key={i} className="border rounded p-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[9px] capitalize">{b.tipo}</Badge>
              <span className="font-medium">{b.titulo}</span>
              <span className="text-muted-foreground">— {b.autor}{b.anio ? ` (${b.anio})` : ""}</span>
            </div>
            <p className="text-muted-foreground mt-1">{b.porQueLeerlo}</p>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}

  const guardar = async () => {
    setSaving(true);
    try {
      const payload = { ...respuestas, __id: wbDef.id };
      if (workbook) {
        const { error } = await supabase.from("lee_workbooks").update({ respuestas: payload, completado }).eq("id", workbook.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("lee_workbooks").insert({
          programa_id: programaId,
          capitulo_numero: capitulo,
          sesion_numero: 1,
          participante_id: u.user?.id ?? null,
          respuestas: payload,
          completado,
        });
        if (error) throw error;
      }
      toast.success("Workbook guardado");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">CAP {capitulo} · {cap.titulo}</span>
            {wbDef.titulo}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1 border">
            <Badge variant="outline" className="text-[10px]">{wbDef.tipo}</Badge>
            <p className="text-muted-foreground">{wbDef.descripcion}</p>
          </div>
          {wbDef.preguntas.map((p, i) => (
            <div key={i}>
              <label className="text-xs font-medium text-navy flex gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-gold shrink-0 mt-0.5" /> {p}
              </label>
              <Textarea
                rows={3}
                value={respuestas[`q${i}`] ?? ""}
                onChange={(e) => setRespuestas({ ...respuestas, [`q${i}`]: e.target.value })}
                placeholder="Tu respuesta…"
              />
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2 border-t">
            <input type="checkbox" id="wbcompletada" checked={completado} onChange={(e) => setCompletado(e.target.checked)} className="w-4 h-4" />
            <label htmlFor="wbcompletada" className="text-sm">Marcar como completado</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={saving} className="bg-navy hover:bg-navy/90">
            {saving ? "Guardando…" : "Guardar workbook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
