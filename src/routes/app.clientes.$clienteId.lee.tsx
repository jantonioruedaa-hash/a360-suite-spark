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
  const [editing, setEditing] = useState<{ capitulo: number; workbook: Workbook | null } | null>(null);

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
                {open && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-semibold text-navy uppercase tracking-wider text-[10px]">
                      Resultados esperados ({cap.resultados.length})
                    </summary>
                    <ul className="mt-1 pl-4 space-y-0.5 text-muted-foreground">
                      {cap.resultados.map((r, i) => <li key={i} className="flex gap-1"><span className="text-gold">›</span><span>{r}</span></li>)}
                    </ul>
                  </details>
                )}
                {open && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t">
                    {cap.workbook.map((w) => {
                      const existing = wbs.find((x) => x.respuestas?.__id === w.id) ?? null;
                      const completo = existing?.completado;
                      return (
                        <button
                          key={w.id}
                          onClick={() => setEditing({ capitulo: cap.numero, workbook: existing })}
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
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editing && (
        <WorkbookDialog
          programaId={programa.id}
          capitulo={editing.capitulo}
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

function WorkbookDialog({
  programaId, capitulo, workbook, onClose, onSaved,
}: {
  programaId: string;
  capitulo: number;
  workbook: Workbook | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cap = getCapitulo(capitulo);
  // determinar workbook def: si existe, por __id; si no, abre el primero pendiente
  const wbDef = cap?.workbook.find((x) => x.id === (workbook?.respuestas?.__id as string)) ?? cap?.workbook[0];
  const [respuestas, setRespuestas] = useState<Record<string, string>>(
    (workbook?.respuestas as Record<string, string>) ?? {},
  );
  const [completado, setCompletado] = useState(workbook?.completado ?? false);
  const [saving, setSaving] = useState(false);

  if (!cap || !wbDef) return null;

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
