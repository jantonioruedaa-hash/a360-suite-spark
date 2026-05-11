import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ETAPAS_A360,
  HERRAMIENTAS_A360,
  RADAR_DIMENSIONES,
  PLAN_CONTINUIDAD_FASES,
  getHerramienta,
  type EtapaA360,
} from "@/lib/coaching-catalogo";
import {
  listarSesionesCliente,
  crearSesion,
  actualizarSesion,
  eliminarSesion,
  progresoPorEtapa,
  etapaActual,
  type SesionCoaching,
} from "@/lib/coaching-helpers";
import { Plus, Check, Trash2, Sparkles, FileText, Clock } from "lucide-react";
import { AnalisisIACoaching } from "@/components/coaching/AnalisisIACoaching";
import { SintesisProgramaIA } from "@/components/coaching/SintesisProgramaIA";
import { CoachingExportImport } from "@/components/coaching/CoachingExportImport";
import { CreenciasInstrumentado } from "@/components/coaching/editores/CreenciasInstrumentado";
import { ContextoInstrumentado } from "@/components/coaching/editores/ContextoInstrumentado";
import { ManifiestoInstrumentado } from "@/components/coaching/editores/ManifiestoInstrumentado";
import { SimuladorInstrumentado } from "@/components/coaching/editores/SimuladorInstrumentado";
import { RetoInstrumentado } from "@/components/coaching/editores/RetoInstrumentado";
import { BibliotecaPreguntasInstrumentado } from "@/components/coaching/editores/BibliotecaPreguntasInstrumentado";
import { PlanContinuidadInstrumentado } from "@/components/coaching/editores/PlanContinuidadInstrumentado";
import { ReporteTransformacionInstrumentado } from "@/components/coaching/editores/ReporteTransformacionInstrumentado";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/clientes/$clienteId/coaching")({
  component: CoachingClienteWorkspace,
});

function CoachingClienteWorkspace() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/coaching" });
  const [sesiones, setSesiones] = useState<SesionCoaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNueva, setOpenNueva] = useState<{ herramientaId: string } | null>(null);
  const [editing, setEditing] = useState<SesionCoaching | null>(null);
  const [clienteNombre, setClienteNombre] = useState<string>("Cliente");

  const cargar = async () => {
    setLoading(true);
    try {
      setSesiones(await listarSesionesCliente(clienteId));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    cargar();
    supabase.from("clientes").select("nombre_empresa").eq("id", clienteId).maybeSingle()
      .then(({ data }) => { if (data?.nombre_empresa) setClienteNombre(data.nombre_empresa); });
  }, [clienteId]);

  const progreso = useMemo(() => progresoPorEtapa(sesiones), [sesiones]);
  const etapa = useMemo(() => etapaActual(sesiones), [sesiones]);
  const totalCompletadas = sesiones.filter((s) => s.completada).length;
  const pctGlobal = Math.round((totalCompletadas / HERRAMIENTAS_A360.length) * 100);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl text-navy">Coaching A360 — Workspace</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {clienteNombre} · Etapa actual: <Badge className="bg-navy text-white ml-1">{etapa}</Badge>
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Progreso global</div>
          <div className="font-display text-2xl text-navy">{pctGlobal}%</div>
          <div className="text-xs">{totalCompletadas} / {HERRAMIENTAS_A360.length} herramientas</div>
        </div>
      </div>

      <CoachingExportImport
        clienteId={clienteId}
        clienteNombre={clienteNombre}
        sesiones={sesiones}
        onImported={cargar}
      />

      {/* Progreso por etapa */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {progreso.map((p) => (
          <Card key={p.etapa.id} className="border-l-4" style={{ borderLeftColor: p.etapa.color }}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm" style={{ color: p.etapa.color }}>
                  {p.etapa.id}
                </h3>
                <span className="text-xs text-muted-foreground">{p.completadas}/{p.total}</span>
              </div>
              <Progress value={p.pct} className="h-1.5" />
              <div className="text-[10px] text-muted-foreground mt-1">{p.pct}%</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Herramientas por etapa */}
      {ETAPAS_A360.map((et) => {
        const herrs = HERRAMIENTAS_A360.filter((h) => h.etapa === et.id);
        return (
          <Card key={et.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: et.color }} />
                {et.id}
                <span className="text-xs text-muted-foreground font-normal">— {et.descripcion}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {herrs.map((h) => {
                  const ses = sesiones.filter((s) => s.herramienta_id === h.id);
                  const ultima = ses[0];
                  const completa = ses.some((s) => s.completada);
                  return (
                    <div
                      key={h.id}
                      className={`p-3 rounded-lg border ${completa ? "bg-emerald-50 border-emerald-200" : "bg-white"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm flex items-center gap-1">
                            {completa && <Check className="w-3 h-3 text-emerald-600" />}
                            {h.nombre}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{h.descripcion}</div>
                          <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {h.duracion}
                            {ses.length > 0 && <span>· {ses.length} registro{ses.length > 1 ? "s" : ""}</span>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={completa ? "outline" : "default"}
                          className={completa ? "" : "bg-navy hover:bg-navy/90"}
                          onClick={() => setOpenNueva({ herramientaId: h.id })}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      {ultima && (
                        <button
                          onClick={() => setEditing(ultima)}
                          className="mt-2 text-[10px] text-blue-600 hover:underline block w-full text-left"
                        >
                          Última: {new Date(ultima.created_at).toLocaleDateString()} · ver/editar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Plan de continuidad */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" /> Plan de continuidad — 90 días post-programa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {PLAN_CONTINUIDAD_FASES.map((f) => (
              <div key={f.id} className="p-3 rounded-lg bg-muted/30 border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</div>
                <div className="font-medium text-sm mt-0.5">{f.titulo}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> Historial de registros ({sesiones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : sesiones.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Aún no hay registros. Empieza por una herramienta de Diagnóstico.
            </p>
          ) : (
            <div className="space-y-1">
              {sesiones.map((s) => {
                const h = s.herramienta_id ? getHerramienta(s.herramienta_id) : null;
                return (
                  <div
                    key={s.id}
                    onClick={() => setEditing(s)}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {s.completada ? (
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-amber-400 shrink-0" />
                      )}
                      <span className="truncate">{h?.nombre ?? "Sesión"}</span>
                      <Badge variant="outline" className="text-[10px]">{s.etapa}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Síntesis IA del programa completo */}
      {sesiones.length > 0 && (
        <SintesisProgramaIA clienteId={clienteId} />
      )}

      {/* Diálogo nueva sesión */}
      {openNueva && (
        <DialogoSesion
          clienteId={clienteId}
          herramientaId={openNueva.herramientaId}
          onClose={() => setOpenNueva(null)}
          onSaved={() => { setOpenNueva(null); cargar(); }}
        />
      )}
      {editing && (
        <DialogoSesion
          clienteId={clienteId}
          herramientaId={editing.herramienta_id ?? ""}
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); cargar(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Diálogo nueva/editar sesión
// ─────────────────────────────────────────────────────────
function DialogoSesion({
  clienteId, herramientaId, existing, onClose, onSaved,
}: {
  clienteId: string;
  herramientaId: string;
  existing?: SesionCoaching;
  onClose: () => void;
  onSaved: () => void;
}) {
  const h = getHerramienta(herramientaId);
  const [datos, setDatos] = useState<any>(existing?.datos ?? {});
  const [completada, setCompletada] = useState(existing?.completada ?? false);
  const [saving, setSaving] = useState(false);

  if (!h) return null;

  const guardar = async () => {
    setSaving(true);
    try {
      if (existing) {
        await actualizarSesion(existing.id, { datos, completada });
        toast.success("Sesión actualizada");
      } else {
        await crearSesion({
          cliente_id: clienteId,
          herramienta_id: h.id,
          etapa: h.etapa,
          datos,
          completada,
        });
        toast.success("Sesión registrada");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!existing) return;
    if (!confirm("¿Eliminar esta sesión?")) return;
    await eliminarSesion(existing.id);
    toast.success("Sesión eliminada");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">{h.etapa}</span>
            {h.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Contexto profesional de la herramienta */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs border border-muted">
            <div>
              <div className="font-semibold text-navy uppercase tracking-wider text-[10px]">Propósito</div>
              <p className="text-muted-foreground mt-0.5">{h.proposito}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <div className="font-semibold text-navy uppercase tracking-wider text-[10px]">Cuándo usar</div>
                <p className="text-muted-foreground mt-0.5">{h.cuandoUsar}</p>
              </div>
              <div>
                <div className="font-semibold text-navy uppercase tracking-wider text-[10px]">Resultado esperado</div>
                <p className="text-muted-foreground mt-0.5">{h.resultadoEsperado}</p>
              </div>
            </div>
            {h.preguntasGuia.length > 0 && (
              <details className="text-muted-foreground">
                <summary className="cursor-pointer font-semibold text-navy uppercase tracking-wider text-[10px]">
                  Preguntas guía ({h.preguntasGuia.length})
                </summary>
                <ul className="mt-1 space-y-0.5 pl-3">
                  {h.preguntasGuia.map((p, i) => (
                    <li key={i} className="flex gap-1"><span className="text-gold">›</span><span>{p}</span></li>
                  ))}
                </ul>
              </details>
            )}
            <details className="text-muted-foreground">
              <summary className="cursor-pointer font-semibold text-navy uppercase tracking-wider text-[10px]">
                Cómo aplicar / Tips coach
              </summary>
              <ol className="mt-1 space-y-0.5 pl-5 list-decimal">
                {h.comoAplicar.map((p, i) => <li key={i}>{p}</li>)}
              </ol>
              {h.tipsCoach.length > 0 && (
                <ul className="mt-1 space-y-0.5 pl-3 italic">
                  {h.tipsCoach.map((t, i) => <li key={i} className="flex gap-1"><span className="text-gold">•</span><span>{t}</span></li>)}
                </ul>
              )}
            </details>
            <details className="text-muted-foreground">
              <summary className="cursor-pointer font-semibold text-navy uppercase tracking-wider text-[10px]">
                Ejemplo real
              </summary>
              <p className="mt-1 italic">"{h.ejemploReal}"</p>
            </details>
          </div>

          {/* Editor específico por tipo */}
          {h.tipo === "radar" && <RadarEditor datos={datos} setDatos={setDatos} />}
          {h.tipo === "creencias" && <CreenciasInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "perfil" && <ContextoInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "manifiesto" && <ManifiestoInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "simulador" && <SimuladorInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "reto" && <RetoInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "espejo" && <EspejoEditor datos={datos} setDatos={setDatos} />}
          {h.tipo === "pulso" && <PulsoEditor datos={datos} setDatos={setDatos} />}
          {h.tipo === "biblioteca" && <BibliotecaPreguntasInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "plan" && <PlanContinuidadInstrumentado datos={datos} setDatos={setDatos} />}
          {h.tipo === "reporte" && <ReporteTransformacionInstrumentado datos={datos} setDatos={setDatos} />}
          {!["radar", "creencias", "perfil", "manifiesto", "simulador", "reto", "espejo", "pulso", "biblioteca", "plan", "reporte"].includes(h.tipo) && (
            <NotasEditor datos={datos} setDatos={setDatos} />
          )}

          <div className="flex items-center gap-2 pt-2 border-t">
            <input
              type="checkbox"
              id="completada"
              checked={completada}
              onChange={(e) => setCompletada(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="completada" className="text-sm">Marcar como completada</label>
          </div>

          {/* Análisis IA — solo si la sesión ya existe persistida */}
          {existing && (
            <AnalisisIACoaching
              sesionId={existing.id}
              herramientaNombre={h.nombre}
              herramientaProposito={h.proposito}
              etapa={h.etapa}
              datosSesion={datos}
              analisisActual={(datos as any)?.analisis_ia ?? null}
              analisisFecha={(datos as any)?.analisis_ia_fecha ?? null}
              onAnalisisGenerado={(t: string, f: string) => setDatos({ ...datos, analisis_ia: t, analisis_ia_fecha: f })}
            />
          )}
          {!existing && (
            <p className="text-[11px] text-muted-foreground italic border-t pt-2">
              💡 Guarda primero el registro y vuelve a abrirlo para generar el análisis IA del coach.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          {existing && (
            <Button variant="ghost" size="sm" onClick={eliminar} className="text-red-600 mr-auto">
              <Trash2 className="w-3 h-3 mr-1" /> Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={saving} className="bg-navy hover:bg-navy/90">
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────
// Editores por tipo de herramienta
// ─────────────────────────────────────────────────────────
function RadarEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const respuestas = datos.respuestas ?? {};
  const upd = (id: string, val: number) =>
    setDatos({ ...datos, respuestas: { ...respuestas, [id]: val } });
  const promedio = RADAR_DIMENSIONES.reduce((acc, d) => acc + (Number(respuestas[d.id]) || 0), 0) / RADAR_DIMENSIONES.length;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Califica cada dimensión de 1 a 10:</p>
      {RADAR_DIMENSIONES.map((d) => (
        <div key={d.id} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-5">
            <div className="text-sm font-medium">{d.nombre}</div>
            <div className="text-[10px] text-muted-foreground">{d.descripcion}</div>
          </div>
          <input
            type="range" min={1} max={10}
            value={respuestas[d.id] ?? 5}
            onChange={(e) => upd(d.id, Number(e.target.value))}
            className="col-span-6"
          />
          <div className="col-span-1 text-center font-mono text-sm">{respuestas[d.id] ?? 5}</div>
        </div>
      ))}
      <div className="text-right text-sm pt-2 border-t">
        Promedio: <span className="font-mono font-bold text-navy">{promedio.toFixed(1)}</span>
      </div>
    </div>
  );
}

function CreenciasEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const c = datos.creencias ?? ["", "", ""];
  const upd = (i: number, v: string) => {
    const arr = [...c];
    arr[i] = v;
    setDatos({ ...datos, creencias: arr });
  };
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Identifica las 3 creencias limitantes más activas del líder:</p>
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <Label className="text-xs">Creencia #{i + 1}</Label>
          <Textarea rows={2} value={c[i] ?? ""} onChange={(e) => upd(i, e.target.value)} placeholder="Ej. Si delego pierdo control…" />
        </div>
      ))}
    </div>
  );
}

function ManifiestoEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  const dims = ["Visión", "Decisión", "Influencia", "Ejecución", "Resiliencia"];
  const m = datos.manifiesto ?? {};
  const upd = (k: string, v: string) => setDatos({ ...datos, manifiesto: { ...m, [k]: v } });
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Compromiso accionable por cada dimensión:</p>
      {dims.map((d) => (
        <div key={d}>
          <Label className="text-xs">{d}</Label>
          <Textarea rows={2} value={m[d] ?? ""} onChange={(e) => upd(d, e.target.value)} placeholder={`Mi compromiso en ${d.toLowerCase()}…`} />
        </div>
      ))}
    </div>
  );
}

function EspejoEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs">Insight clave de la sesión</Label>
        <Textarea rows={2} value={datos.insight ?? ""} onChange={(e) => setDatos({ ...datos, insight: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Compromiso para la próxima semana</Label>
        <Textarea rows={2} value={datos.compromiso ?? ""} onChange={(e) => setDatos({ ...datos, compromiso: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Resistencia / obstáculo identificado</Label>
        <Textarea rows={2} value={datos.resistencia ?? ""} onChange={(e) => setDatos({ ...datos, resistencia: e.target.value })} />
      </div>
    </div>
  );
}

function PulsoEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs">Nivel de momentum (1-10)</Label>
        <Input type="number" min={1} max={10} value={datos.momentum ?? ""} onChange={(e) => setDatos({ ...datos, momentum: Number(e.target.value) })} />
      </div>
      <div>
        <Label className="text-xs">¿Qué me bloquea esta semana?</Label>
        <Textarea rows={2} value={datos.bloqueo ?? ""} onChange={(e) => setDatos({ ...datos, bloqueo: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">¿Qué necesito desbloquear?</Label>
        <Textarea rows={2} value={datos.necesidad ?? ""} onChange={(e) => setDatos({ ...datos, necesidad: e.target.value })} />
      </div>
    </div>
  );
}

function NotasEditor({ datos, setDatos }: { datos: any; setDatos: (d: any) => void }) {
  return (
    <div>
      <Label className="text-xs">Notas / contenido</Label>
      <Textarea rows={6} value={datos.notas ?? ""} onChange={(e) => setDatos({ ...datos, notas: e.target.value })} placeholder="Registra el contenido trabajado, observaciones, acuerdos…" />
    </div>
  );
}
