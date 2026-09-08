import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  LEE_CAPITULOS, LEE_OVERVIEW, TOTAL_SESIONES, getCapitulo, getSesion, sesionKey,
  type CapituloLEE, type ModuloPlan,
} from "@/lib/lee-catalogo";
import { getWorkbookSchema } from "@/lib/lee-workbook-schemas";
import { WorkbookInstrumentado } from "@/components/lee/WorkbookInstrumentado";
import { exportWorkbookJSON, exportWorkbookHTML, importWorkbookJSON } from "@/lib/lee-workbook-io";
import { cargarWorkbookHtml, guardarWorkbookHtml } from "@/lib/lee-workbook-html";
import { guardarVersionLee, listarVersionesLee, eliminarVersionLee, cargarSnapshotLee, sesionesConVersionLee, type VersionRow } from "@/lib/lee-historial";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/shared";
import {
  Lock, Unlock, Check, BookOpen, Award, Sparkles, Play, Brain, Target,
  Clock, FileText, MessageCircle, Download, Upload, ArrowLeft, Save, ChevronDown, ChevronUp,
  History, Trash2, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { ChapterCoverInline } from "@/components/lee/ChapterCoverInline";
import { SessionHeaderInline } from "@/components/lee/SessionHeaderInline";


export const Route = createFileRoute("/app/clientes/$clienteId/lee")({
  component: LeeWorkspace,
  validateSearch: (search: Record<string, unknown>) => ({
    capitulo: typeof search.capitulo === "string" ? Number(search.capitulo) : undefined,
  }),
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
  respuestas: Record<string, unknown>;
  completado: boolean;
}

const WORKBOOK_CAMPOS: { key: string; label: string; placeholder: string }[] = [
  { key: "notas",       label: "Notas de la sesión",          placeholder: "Lo más importante que sucedió hoy…" },
  { key: "reflexiones", label: "Mis reflexiones",             placeholder: "¿Qué descubrí sobre mí o sobre mi empresa?" },
  { key: "evidencias",  label: "Evidencias / ejemplos propios", placeholder: "Casos concretos de mi organización que ilustran lo trabajado." },
  { key: "compromisos", label: "Compromisos para la próxima semana", placeholder: "Acciones concretas, con fecha y responsable." },
];

function LeeWorkspace() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/lee" });
  const navigate = useNavigate();
  const { role } = useAuth();
  const esCliente = role === "cliente" || role === "participante";
  const [accesoInterpretacion, setAccesoInterpretacion] = useState(false);
  const { capitulo: capituloSearch } = Route.useSearch();
  const [selectedChapter, setSelectedChapter] = useState<number | null>(
    capituloSearch != null && !isNaN(capituloSearch) ? capituloSearch : null,
  );

  const selectChapter = (chapter: number | null) => {
    setSelectedChapter(chapter);
    void navigate({
      to: "/app/clientes/$clienteId/lee",
      params: { clienteId },
      search: { capitulo: chapter ?? undefined },
      replace: true,
    });
  };

  // Vista toggle con localStorage
  const [vista, setVista] = useState<"facilitador" | "participante">(() => {
    if (role === "cliente" || role === "participante") return "participante";
    try {
      const saved = localStorage.getItem("lee-vista");
      if (saved === "facilitador" || saved === "participante") return saved;
    } catch { /* ignore */ }
    return "facilitador";
  });
  const cambiarVista = (v: "facilitador" | "participante") => {
    setVista(v);
    try { localStorage.setItem("lee-vista", v); } catch { /* ignore */ }
  };

  const [programa, setPrograma] = useState<Programa | null>(null);
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ capitulo: number; sesion: number } | null>(null);
  const [iaOpen, setIaOpen] = useState<{ capitulo: number; sesion: number } | null>(null);

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

  useEffect(() => {
    if (!esCliente) return;
    supabase.from("clientes").select("acceso_interpretacion").eq("id", clienteId).maybeSingle()
      .then(({ data }) => { if (data?.acceso_interpretacion) setAccesoInterpretacion(true); });
  }, [clienteId, esCliente]);

  const puedeVerInterpretacion = !esCliente || accesoInterpretacion;

  useEffect(() => {
    if (esCliente && !puedeVerInterpretacion) setVista("participante");
  }, [esCliente, puedeVerInterpretacion]);

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
          <BookOpen className="w-12 h-12 text-gold mx-auto" />
          <p className="text-sm text-muted-foreground">
            {esCliente
              ? "Tu facilitador aún no ha iniciado el programa LEE para tu empresa."
              : "Este cliente aún no tiene programa LEE iniciado."}
          </p>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto">{LEE_OVERVIEW.proposito}</p>
          {!esCliente && (
            <Button onClick={iniciar} className="bg-navy hover:bg-navy/90">
              <Play className="w-4 h-4 mr-1" /> Iniciar programa LEE
            </Button>
          )}
        </CardContent></Card>
      </div>
    );
  }

  const desbloqueados = new Set(programa.capitulos_desbloqueados);
  const wbCompletos = workbooks.filter((w) => w.completado).length;
  const pctGlobal = Math.round((wbCompletos / TOTAL_SESIONES) * 100);

  return (
    <div className="space-y-6 max-w-6xl">
      {selectedChapter !== null ? (
        <ChapterDetailInline
          chapter={selectedChapter}
          programa={programa}
          clienteId={clienteId}
          onClose={() => selectChapter(null)}
        />
      ) : (
        <>
          {/* Toggle de vista — solo visible para consultores o clientes con acceso_interpretacion */}
          {puedeVerInterpretacion && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={vista === "facilitador" ? "default" : "outline"}
                onClick={() => cambiarVista("facilitador")}
                className={vista === "facilitador" ? "bg-navy hover:bg-navy/90" : ""}
              >
                🗂 Vista facilitador
              </Button>
              <Button
                size="sm"
                variant={vista === "participante" ? "default" : "outline"}
                onClick={() => cambiarVista("participante")}
                className={vista === "participante" ? "bg-navy hover:bg-navy/90" : ""}
              >
                👤 Vista participante
              </Button>
            </div>
          )}

          {/* ── Vista facilitador (contenido original intacto) ── */}
          {vista === "facilitador" && (
            <>
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
                  <div className="text-xs">{wbCompletos} / {TOTAL_SESIONES} sesiones</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card><CardContent className="p-4">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Capítulos desbloqueados</div>
                  <div className="font-display text-2xl text-navy">{desbloqueados.size}/{LEE_CAPITULOS.length}</div>
                  <Progress value={(desbloqueados.size / LEE_CAPITULOS.length) * 100} className="h-1.5 mt-2" />
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Sesiones con workbook</div>
                  <div className="font-display text-2xl text-navy">{wbCompletos}/{TOTAL_SESIONES}</div>
                  <Progress value={pctGlobal} className="h-1.5 mt-2" />
                </CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <Award className="w-8 h-8 text-gold" />
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Certificación</div>
                    <div className="text-sm font-medium">{pctGlobal >= 80 ? "Disponible 🎉" : `Faltan ${Math.max(0, Math.ceil(TOTAL_SESIONES * 0.8) - wbCompletos)} workbooks`}</div>
                  </div>
                </CardContent></Card>
              </div>

              <div className="space-y-3">
                {LEE_CAPITULOS.map((cap) => {
                  const open = desbloqueados.has(cap.numero);
                  const wbsCap = workbooks.filter((w) => w.capitulo_numero === cap.numero);
                  const wbCompletosCap = wbsCap.filter((w) => w.completado).length;
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
                            <Badge variant="outline" className="text-[10px]">{wbCompletosCap}/{cap.sesiones.length} sesiones</Badge>
                            {!open && !esCliente && (
                              <Button size="sm" variant="outline" onClick={() => desbloquear(cap.numero)}>
                                <Unlock className="w-3 h-3 mr-1" /> Desbloquear
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs text-muted-foreground italic">{cap.objetivo}</p>
                        <div className="flex flex-wrap gap-1">
                          {cap.pills.map((p, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-navy/5">{p}</Badge>
                          ))}
                        </div>
                        {open && (
                          <ContenidoCapitulo
                            cap={cap}
                            workbooksDelCap={wbsCap}
                            onAbrirWorkbook={(s) => setEditing({ capitulo: cap.numero, sesion: s })}
                            onAbrirIA={(s) => setIaOpen({ capitulo: cap.numero, sesion: s })}
                          />
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
                  sesion={editing.sesion}
                  workbook={workbooks.find((w) => w.capitulo_numero === editing.capitulo && w.sesion_numero === editing.sesion) ?? null}
                  onClose={() => setEditing(null)}
                  onSaved={() => { setEditing(null); cargar(); }}
                />
              )}

              {iaOpen && (
                <AnalisisIADialog
                  capitulo={iaOpen.capitulo}
                  sesion={iaOpen.sesion}
                  workbook={workbooks.find((w) => w.capitulo_numero === iaOpen.capitulo && w.sesion_numero === iaOpen.sesion) ?? null}
                  onClose={() => setIaOpen(null)}
                />
              )}
            </>
          )}

          {/* ── Vista participante ── */}
          {vista === "participante" && (
            <ChapterCardsView
              workbooks={workbooks}
              desbloqueados={desbloqueados}
              onSelectChapter={selectChapter}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Historial helpers ─────────────────────────────────────────────────────────

const ORIGEN_LABEL: Record<VersionRow["origen"], string> = {
  auto_nav:  "Auto · navegación",
  auto_exit: "Auto · salida",
  manual:    "Manual",
};

function sesionLabelStr(sesionId: string | null): string {
  if (!sesionId) return "General";
  if (sesionId === "cv") return "Portada";
  if (sesionId === "in") return "Intro";
  if (sesionId === "ci") return "Cierre";
  if (sesionId === "ca") return "Casos";
  if (/^s\d+$/.test(sesionId)) return `Sesión ${sesionId.slice(1)}`;
  return sesionId;
}

// ── ChapterDetailInline ────────────────────────────────────────────

// Tipo para las funciones del iframe (mismo origen — seguro por same-origin policy)
type IframeCW = Window & {
  go?: (id: string, title: string) => void;
  printCurrentSession?: () => void;
  exportSessionHtmlJson?: () => void;
  exportFullDocument?: () => void;
  exportFullJSON?: () => void;
};

function ChapterDetailInline({
  chapter,
  programa,
  clienteId,
  onClose,
}: {
  chapter: number;
  programa: Programa;
  clienteId: string;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [availCmds, setAvailCmds] = useState({ pdf: false, htmlSesion: false, fullDoc: false });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const programaIdRef = useRef<string>(programa.id);
  useEffect(() => { programaIdRef.current = programa.id; }, [programa.id]);

  const lastSnapshotMs = useRef<number>(0);
  const lastPayloadRef = useRef<Record<string, unknown> | null>(null);
  const [savingVersion, setSavingVersion] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const lastVersionId = useRef<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [showHistorial, setShowHistorial] = useState(false);
  const [versiones, setVersiones] = useState<VersionRow[]>([]);
  const [loadingVersiones, setLoadingVersiones] = useState(false);
  const [filtroSesion, setFiltroSesion] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<VersionRow | null>(null);
  const [restoringVersion, setRestoringVersion] = useState(false);
  const [sesionesConVersion, setSesionesConVersion] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<string>("cv");
  const [immersive, setImmersive] = useState(false);
  useEffect(() => {
    let rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => window.scrollTo(0, 0));
    });
    setActiveTab("cv");
    setImmersive(false);
    return () => cancelAnimationFrame(rafId);
  }, [chapter]);
  useEffect(() => {
    if (contentAreaRef.current) contentAreaRef.current.scrollTop = 0;
  }, [chapter, activeTab]);
  useEffect(() => { setIframeLoaded(false); }, [iframeKey]);

  const cap = getCapitulo(chapter);
  const desbloqueados = programa.capitulos_desbloqueados ?? [];
  const bloqueado = !desbloqueados.includes(chapter) || isNaN(chapter) || chapter < 1 || chapter > 10;
  const iframeUrl = `/lee-workbooks/lee-cap-${String(chapter).padStart(2, "0")}.html`;

  const sessionTabs = cap ? [
    { id: "cv", label: "Portada" },
    { id: "in", label: "Intro" },
    ...cap.sesiones.map((s) => ({ id: `s${s.numero}`, label: `Sesión ${s.numero}` })),
    ...(chapter >= 9 ? [{ id: "ca", label: "Casos" }] : []),
    { id: "ci", label: "Cierre" },
  ] : [];

  const tabIdsNoPortada = sessionTabs.filter((t) => t.id !== "cv").map((t) => t.id);
  const sesionesGuardadasCount = tabIdsNoPortada.filter((id) => sesionesConVersion.has(id)).length;
  const totalSesionesCount = tabIdsNoPortada.length;

  useEffect(() => {
    if (bloqueado) return;
    const pid = programaIdRef.current;
    if (!pid) return;
    setSesionesConVersion(new Set());
    sesionesConVersionLee(pid, chapter)
      .then(setSesionesConVersion)
      .catch(() => {});
  }, [chapter, bloqueado]);

  useEffect(() => {
    if (!iframeLoaded || !iframeRef.current?.contentWindow) return;
    const cw = iframeRef.current.contentWindow as unknown as Record<string, unknown>;
    setAvailCmds({
      pdf:        typeof cw.printCurrentSession   === "function",
      htmlSesion: typeof cw.exportSessionHtmlJson === "function",
      fullDoc:    typeof cw.exportFullDocument    === "function"
               || typeof cw.exportFullJSON        === "function",
    });
  }, [iframeLoaded]);

  const getCW = useCallback(() => iframeRef.current?.contentWindow as IframeCW | null, []);
  const navTo = useCallback((sessionId: string) => { getCW()?.go?.(sessionId, ""); }, [getCW]);
  const cmdPDF = useCallback(() => { getCW()?.printCurrentSession?.(); }, [getCW]);
  const cmdHtmlSesion = useCallback(() => { getCW()?.exportSessionHtmlJson?.(); }, [getCW]);
  const cmdFullDoc    = useCallback(() => {
    const cw = getCW();
    if (typeof cw?.exportFullDocument === "function") cw.exportFullDocument();
    else if (typeof cw?.exportFullJSON === "function") cw.exportFullJSON();
  }, [getCW]);

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setImmersive(false);
    if (tabId !== "cv") navTo(tabId);
  }, [navTo]);

  const handleGuardarVersion = useCallback(async () => {
    const pid = programaIdRef.current;
    if (!pid) return;
    setSavingVersion(true);
    try {
      let payload = lastPayloadRef.current;
      if (!payload) {
        const wb = await cargarWorkbookHtml(pid, chapter).catch(() => null);
        payload = (wb?.respuestas as Record<string, unknown>) ?? {};
      }
      const vid = await guardarVersionLee(
        pid, chapter,
        activeTab !== "cv" ? activeTab : null,
        payload,
        "manual",
        versionLabel.trim() || undefined,
      );
      lastVersionId.current = vid;
      toast.success("Versión guardada");
      setShowVersionDialog(false);
      setVersionLabel("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar versión");
    } finally {
      setSavingVersion(false);
    }
  }, [chapter, activeTab, versionLabel]);

  const cargarVersiones = useCallback(async () => {
    const pid = programaIdRef.current;
    if (!pid) return;
    setLoadingVersiones(true);
    try {
      const rows = await listarVersionesLee(pid, chapter);
      setVersiones(rows);
    } catch {
      // silent
    } finally {
      setLoadingVersiones(false);
    }
  }, [chapter]);

  const handleOpenHistorial = useCallback(() => {
    setFiltroSesion(null);
    setShowHistorial(true);
    void cargarVersiones();
  }, [cargarVersiones]);

  const handleEliminarVersion = useCallback(async (id: string) => {
    try {
      await eliminarVersionLee(id);
      setVersiones((prev) => prev.filter((v) => v.id !== id));
      toast.success("Versión eliminada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  }, []);

  const handleConfirmRestaurar = useCallback(async () => {
    if (!confirmRestore) return;
    const pid = programaIdRef.current;
    if (!pid) return;
    setRestoringVersion(true);
    try {
      const ts = new Date().toLocaleString("es-MX");
      let currentPayload = lastPayloadRef.current;
      if (!currentPayload) {
        const wb = await cargarWorkbookHtml(pid, chapter).catch(() => null);
        currentPayload = (wb?.respuestas as Record<string, unknown>) ?? {};
      }
      await guardarVersionLee(
        pid, chapter,
        activeTab !== "cv" ? activeTab : null,
        currentPayload, "manual",
        `Respaldo antes de restaurar · ${ts}`,
      );
      const snapshot = await cargarSnapshotLee(confirmRestore.id);
      await guardarWorkbookHtml(pid, chapter, snapshot);
      lastPayloadRef.current = snapshot;
      lastSnapshotMs.current = Date.now();
      lastVersionId.current = confirmRestore.id;
      setIframeKey((k) => k + 1);
      toast.success("Versión restaurada");
      setConfirmRestore(null);
      setShowHistorial(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al restaurar");
    } finally {
      setRestoringVersion(false);
    }
  }, [confirmRestore, chapter, activeTab]);

  const handleEnterChapter = useCallback(() => {
    setActiveTab("in");
    navTo("in");
  }, [navTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = e.data as {
        type?: string;
        chapter?: number;
        payload?: Record<string, unknown>;
        id?: string;
        sesion_id?: string;
        snapshot?: Record<string, unknown>;
      };
      if (!msg?.type) return;
      if (msg.chapter !== undefined && msg.chapter !== chapter) return;
      const pid = programaIdRef.current;

      if (msg.type === "LEE_DATA_REQUEST") {
        if (!pid) return;
        const wb = await cargarWorkbookHtml(pid, chapter).catch(() => null);
        e.source?.postMessage(
          { type: "LEE_DATA_RESPONSE", chapter, payload: wb?.respuestas ?? {} },
          { targetOrigin: window.location.origin },
        );
      }

      if (msg.type === "LEE_DATA_SAVE") {
        if (!pid || !msg.payload) return;
        lastPayloadRef.current = msg.payload;
        // Dedup: LEE_SESSION_SNAPSHOT ya hizo el UPSERT hace <2 s — evitar doble escritura
        if (Date.now() - lastSnapshotMs.current < 2000) return;
        setSaving(true);
        try {
          await guardarWorkbookHtml(pid, chapter, msg.payload);
          setUltimoGuardado(new Date());
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error al guardar");
        } finally {
          setSaving(false);
        }
      }

      if (msg.type === "LEE_EXIT") {
        if (pid && msg.snapshot) {
          try {
            await guardarWorkbookHtml(pid, chapter, msg.snapshot);
            await guardarVersionLee(pid, chapter, msg.sesion_id ?? null, msg.snapshot, "auto_exit");
            lastPayloadRef.current = msg.snapshot;
            lastSnapshotMs.current = Date.now();
          } catch {
            // No bloquear el cierre aunque falle el snapshot
          }
        }
        onClose();
      }

      if (msg.type === "LEE_NAV_CHANGE" && typeof msg.id === "string") {
        setActiveTab(msg.id);
      }

      if (msg.type === "LEE_SESSION_SNAPSHOT" && msg.payload) {
        if (!pid) return;
        lastPayloadRef.current = msg.payload;
        lastSnapshotMs.current = Date.now();
        setSaving(true);
        try {
          await guardarWorkbookHtml(pid, chapter, msg.payload);
          setUltimoGuardado(new Date());
          const vid = await guardarVersionLee(pid, chapter, msg.sesion_id ?? null, msg.payload, "auto_nav");
          lastVersionId.current = vid;
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error al guardar");
        } finally {
          setSaving(false);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [chapter, onClose]);

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-[45] flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 50%, #312E81 100%)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(14,165,233,0.15), transparent 60%), radial-gradient(ellipse 40% 60% at 10% 80%, rgba(99,102,241,0.12), transparent 60%)",
      }} />
      {!immersive && <div className="relative z-10 flex items-center justify-between px-4 py-2.5 border-b border-gold/30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-white/60 hover:text-white text-xs transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Capítulos
          </button>
          <span className="text-white/20 select-none">|</span>
          <span className="font-mono text-[11px] font-bold text-gold shrink-0">
            CAP {String(chapter).padStart(2, "0")}
          </span>
          {cap && (
            <span className="text-white/70 text-sm truncate hidden sm:block">{cap.titulo}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {(saving || ultimoGuardado) && (
            <span className="flex items-center gap-1 text-[11px] text-white/50 mr-1">
              {saving
                ? <><Save className="w-3 h-3 animate-pulse" /> Guardando…</>
                : <><Check className="w-3 h-3 text-emerald-400" /> {ultimoGuardado!.toLocaleTimeString()}</>
              }
            </span>
          )}
          {activeTab !== "cv" && availCmds.htmlSesion && (
            <button onClick={cmdHtmlSesion} title="Descargar sesión como HTML editable"
              className="text-[11px] text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors">
              ⬇ HTML
            </button>
          )}
          {activeTab !== "cv" && (
            <button
              onClick={() => setShowVersionDialog(true)}
              title="Guardar versión actual del workbook"
              className="text-[11px] text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              <History className="w-3 h-3" />
              Versión
            </button>
          )}
          <button
            onClick={handleOpenHistorial}
            title="Ver historial de versiones"
            className="text-[11px] text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            Historial
          </button>
          <button
            onClick={() => (iframeRef.current?.contentWindow as any)?.toggleEditMode?.()}
            title="Activar modo edición — permite cambiar texto, color y formato directamente en el capítulo"
            className="text-[11px] text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1"
          >
            <Pencil className="w-3 h-3" />
            Editar
          </button>
          {/* ⬇ Doc (exportFullDocument) oculto — no funciona correctamente en ningún cap; retomar en sesión futura */}
          {/* 📄 PDF (printCurrentSession) oculto — falla en blanco en varios caps; PDF disponible dentro del HTML exportado */}
        </div>
      </div>}

      {!bloqueado && !immersive && sessionTabs.length > 0 && (
        <div className="relative z-10 flex items-center gap-0.5 px-3 py-1 border-b border-white/25 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sessionTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabClick(t.id)}
              className={`text-[11px] px-2.5 py-1.5 rounded transition-colors shrink-0 whitespace-nowrap flex items-center gap-1 ${
                activeTab === t.id
                  ? "text-white bg-white/15 font-semibold"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              {sesionesConVersion.has(t.id) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              )}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {bloqueado ? (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-3 text-center px-6">
          <Lock className="w-8 h-8 text-white/30" />
          <div className="font-display text-xl text-white">Capítulo no disponible</div>
          <p className="text-sm text-white/50">Este capítulo aún no está desbloqueado para este cliente.</p>
          <Button variant="outline" onClick={onClose} className="border-white/30 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver a capítulos
          </Button>
        </div>
      ) : (
        <div ref={contentAreaRef} className="relative z-10 flex-1 min-h-0 overflow-y-auto">
          {activeTab === "cv" && (
            <ChapterCoverInline
              key={chapter}
              chapter={chapter}
              clienteId={clienteId}
              onEnterChapter={handleEnterChapter}
              sesionesGuardadas={sesionesGuardadasCount}
              totalSesiones={totalSesionesCount}
            />
          )}
          {activeTab === "cv" && !immersive && (
            <button
              onClick={() => setImmersive(true)}
              className="absolute top-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                color: "#fff",
                background: "linear-gradient(135deg, #0EA5E9, #3B82F6)",
                border: "none",
                boxShadow: "0 2px 12px rgba(14,165,233,0.45)",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              <ChevronUp className="w-3.5 h-3.5" /> Ocultar menú
            </button>
          )}
          {activeTab !== "cv" && !immersive && (
            <SessionHeaderInline
              chapter={chapter}
              tabId={activeTab}
              onEnterImmersive={() => setImmersive(true)}
            />
          )}
          <div className="relative h-full">
            {immersive && /^s\d+$/.test(activeTab) && (
              <div className="absolute top-3 right-16 z-20 px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white/80 backdrop-blur-sm pointer-events-none select-none">
                Sesión {activeTab.slice(1)} de {cap?.sesiones.length ?? "?"}
              </div>
            )}
            {immersive && (
              <button
                onClick={() => setImmersive(false)}
                title="Mostrar navegación"
                className="absolute top-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  color: "#fff",
                  background: "linear-gradient(135deg, #0EA5E9, #3B82F6)",
                  border: "none",
                  boxShadow: "0 2px 12px rgba(14,165,233,0.45)",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                <ChevronDown className="w-3.5 h-3.5" /> Mostrar menú
              </button>
            )}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={iframeUrl}
              title={`LEE Capítulo ${chapter}`}
              onLoad={() => setIframeLoaded(true)}
              className="absolute inset-0 w-full h-full"
              style={{
                border: "none",
                visibility: activeTab === "cv" ? "hidden" : "visible",
              }}
              allow="fullscreen"
            />
          </div>
        </div>
      )}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Guardar versión</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Se guardará el estado actual de este capítulo. La etiqueta es opcional.
            </p>
            <input
              autoFocus
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
              placeholder="Ej: antes de la sesión grupal"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleGuardarVersion(); }}
              maxLength={80}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowVersionDialog(false); setVersionLabel(""); }}>
              Cancelar
            </Button>
            <Button onClick={() => void handleGuardarVersion()} disabled={savingVersion}>
              {savingVersion ? "Guardando…" : "Guardar versión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Historial de versiones ──────────────────────────────── */}
      <Sheet open={showHistorial} onOpenChange={setShowHistorial}>
        <SheetContent side="right" className="w-[380px] sm:w-[420px] flex flex-col p-0 gap-0">
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <SheetTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Historial · Cap {String(chapter).padStart(2, "0")}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 py-2.5 border-b shrink-0 text-[11px] text-muted-foreground leading-relaxed">
            Se guardan automáticamente las últimas 5 versiones por sesión. Las versiones manuales (incluidos los respaldos antes de restaurar) no se eliminan solas — bórralas cuando ya no las necesites.
          </div>

          {(() => {
            const sesionesUnicas = Array.from(
              new Set(versiones.map((v) => v.sesion_id).filter(Boolean)),
            ) as string[];
            const filtradas = filtroSesion === null
              ? versiones
              : versiones.filter((v) => v.sesion_id === filtroSesion);
            const currentVerId = lastVersionId.current;

            return (
              <>
                {sesionesUnicas.length > 1 && (
                  <div className="px-3 py-2 border-b shrink-0 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                      onClick={() => setFiltroSesion(null)}
                      className={`text-[11px] px-2.5 py-1 rounded shrink-0 whitespace-nowrap transition-colors ${
                        filtroSesion === null
                          ? "bg-foreground text-background font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Todas
                    </button>
                    {sesionesUnicas.map((sid) => (
                      <button
                        key={sid}
                        onClick={() => setFiltroSesion(sid)}
                        className={`text-[11px] px-2.5 py-1 rounded shrink-0 whitespace-nowrap transition-colors ${
                          filtroSesion === sid
                            ? "bg-foreground text-background font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {sesionLabelStr(sid)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                  {loadingVersiones && (
                    <p className="text-xs text-muted-foreground text-center py-6">Cargando…</p>
                  )}
                  {!loadingVersiones && filtradas.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Sin versiones guardadas
                    </p>
                  )}
                  {filtradas.map((v) => {
                    const isCurrentState = v.id === currentVerId;
                    const ts = new Date(v.created_at).toLocaleString("es-MX", {
                      day: "2-digit", month: "short",
                      hour: "2-digit", minute: "2-digit",
                    });
                    return (
                      <div
                        key={v.id}
                        className={`rounded-lg border p-3 text-sm space-y-1.5 ${
                          isCurrentState
                            ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-xs">{ts}</span>
                              {isCurrentState && (
                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-full">
                                  Estado actual
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                v.origen === "manual"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {ORIGEN_LABEL[v.origen]}
                              </span>
                              {v.sesion_id && (
                                <span className="text-[10px] text-muted-foreground">
                                  {sesionLabelStr(v.sesion_id)}
                                </span>
                              )}
                            </div>
                            {v.etiqueta && (
                              <p className="text-xs text-foreground/70 mt-1 italic">"{v.etiqueta}"</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {v.origen === "manual" && (
                              <button
                                onClick={() => void handleEliminarVersion(v.id)}
                                title="Eliminar versión"
                                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            <span
                              title="Reemplaza el contenido actual de la sesión con esta versión (se crea un respaldo automático antes de restaurar)"
                              className="text-[11px] text-muted-foreground cursor-help select-none"
                            >
                              ⓘ
                            </span>
                            <button
                              onClick={() => setConfirmRestore(v)}
                              disabled={isCurrentState}
                              title="Reemplaza el contenido actual de la sesión con esta versión (se crea un respaldo automático antes de restaurar)"
                              className="text-[10px] px-2 py-1 rounded border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              Restaurar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Confirmar restauración ──────────────────────────────── */}
      <Dialog open={!!confirmRestore} onOpenChange={(o) => { if (!o) setConfirmRestore(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Restaurar esta versión?</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2 text-sm text-muted-foreground">
            <p>
              El estado actual se guardará automáticamente como respaldo manual antes de restaurar.
            </p>
            <p>El workbook se recargará con el contenido de la versión seleccionada.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestore(null)} disabled={restoringVersion}>
              Cancelar
            </Button>
            <Button onClick={() => void handleConfirmRestaurar()} disabled={restoringVersion}>
              {restoringVersion ? "Restaurando…" : "Restaurar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── ChapterCardsView ──────────────────────────────────────────────────────────

type CapStatus = "bloqueado" | "completado" | "en-progreso" | "no-iniciado";

function getCapStatus(cap: CapituloLEE, workbooks: Workbook[], desbloqueados: Set<number>): CapStatus {
  if (!desbloqueados.has(cap.numero)) return "bloqueado";
  const wbsCap = workbooks.filter((w) => w.capitulo_numero === cap.numero);
  const wbCompletosCap = wbsCap.filter((w) => w.completado).length;
  if (wbCompletosCap === 0) return "no-iniciado";
  if (wbCompletosCap >= cap.sesiones.length) return "completado";
  return "en-progreso";
}

const STATUS_BADGE: Record<CapStatus, { variant: "success" | "warning" | "muted"; label: string; icon: string }> = {
  completado:    { variant: "success", label: "Completado",   icon: "✓" },
  "en-progreso": { variant: "warning", label: "En progreso",  icon: "⏳" },
  "no-iniciado": { variant: "muted",   label: "No iniciado",  icon: "○" },
  bloqueado:     { variant: "muted",   label: "Bloqueado",    icon: "🔒" },
};

const ABRIR_LABEL: Record<CapStatus, string> = {
  completado:    "Revisar workbook",
  "en-progreso": "Continuar workbook ▶",
  "no-iniciado": "Abrir workbook ▶",
  bloqueado:     "",
};

function ChapterCardsView({
  workbooks,
  desbloqueados,
  onSelectChapter,
}: {
  workbooks: Workbook[];
  desbloqueados: Set<number>;
  onSelectChapter: (chapter: number) => void;
}) {
  const [tab, setTab] = useState<"capitulos" | "progreso">("capitulos");
  const wbCompletos = workbooks.filter((w) => w.completado).length;
  const pctGlobal = Math.round((wbCompletos / TOTAL_SESIONES) * 100);
  const nextChapter = LEE_CAPITULOS.find((cap) => {
    const status = getCapStatus(cap, workbooks, desbloqueados);
    return status === "en-progreso" || status === "no-iniciado";
  });

  return (
    <div className="space-y-5">
      {/* ── Hero portada ── */}
      <div className="bg-navy rounded-xl p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="text-xs font-mono text-gold uppercase tracking-wider">Programa</div>
            <h2 className="font-display text-3xl leading-tight">LEE</h2>
            <p className="text-white/60 text-sm">{LEE_OVERVIEW.duracionTotal} · {LEE_OVERVIEW.formato}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-4xl text-gold">{pctGlobal}%</div>
            <div className="text-xs text-white/60 mt-0.5">{wbCompletos} / {TOTAL_SESIONES} sesiones</div>
          </div>
        </div>
        <Progress value={pctGlobal} className="h-1.5 mt-4 bg-white/20 [&>div]:bg-gold" />
        <div className="flex flex-wrap gap-3 mt-4">
          {nextChapter ? (
            <Button
              onClick={() => onSelectChapter(nextChapter.numero)}
              className="bg-gold hover:bg-gold/90 text-navy font-semibold text-sm"
            >
              Continuar → Capítulo {String(nextChapter.numero).padStart(2, "0")}
            </Button>
          ) : wbCompletos === TOTAL_SESIONES ? (
            <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
              <Check className="w-4 h-4" /> Programa completado 🎉
            </div>
          ) : null}
          <Button
            variant="outline"
            onClick={() => setTab("capitulos")}
            className="text-white border-white/30 bg-white/10 hover:bg-white/20 text-sm"
          >
            Ir a sesión específica →
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b">
        {(["capitulos", "progreso"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-navy text-navy"
                : "border-transparent text-muted-foreground hover:text-navy"
            }`}
          >
            {t === "capitulos" ? "Capítulos" : "Mi progreso"}
          </button>
        ))}
      </div>

      {/* ── Tab: Capítulos ── */}
      {tab === "capitulos" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {LEE_CAPITULOS.map((cap) => {
            const status = getCapStatus(cap, workbooks, desbloqueados);
            const bloqueado = status === "bloqueado";
            const badge = STATUS_BADGE[status];
            return (
              <div
                key={cap.numero}
                className={`border rounded-lg p-4 flex flex-col gap-3 bg-white transition-shadow${bloqueado ? " opacity-50" : " hover:shadow-md cursor-pointer"}`}
                style={{ borderColor: bloqueado ? "#e2e8f0" : "#c9a84c40" }}
                onClick={!bloqueado ? () => onSelectChapter(cap.numero) : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-gold">
                    CAP {String(cap.numero).padStart(2, "0")}
                  </span>
                  <StatusBadge variant={badge.variant} label={badge.label} icon={badge.icon} />
                </div>
                <div className="font-display text-sm font-semibold text-navy leading-snug flex-1">
                  {cap.titulo}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{cap.objetivo}</p>
                {!bloqueado ? (
                  <Button
                    size="sm"
                    className="w-full bg-navy hover:bg-navy/90 text-white text-xs mt-auto"
                    onClick={(e) => { e.stopPropagation(); onSelectChapter(cap.numero); }}
                  >
                    {ABRIR_LABEL[status]}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto">
                    <Lock className="w-3 h-3" /> No disponible aún
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Mi progreso ── */}
      {tab === "progreso" && (
        <div className="space-y-3">
          {LEE_CAPITULOS.map((cap) => {
            const status = getCapStatus(cap, workbooks, desbloqueados);
            const bloqueado = status === "bloqueado";
            const wbsCap = workbooks.filter((w) => w.capitulo_numero === cap.numero);
            const completados = wbsCap.filter((w) => w.completado).length;
            const total = cap.sesiones.length;
            const pct = total > 0 ? Math.round((completados / total) * 100) : 0;
            const badge = STATUS_BADGE[status];
            return (
              <div
                key={cap.numero}
                className={`border rounded-lg p-4 space-y-3 bg-white${bloqueado ? " opacity-50" : " hover:shadow-sm cursor-pointer"}`}
                onClick={!bloqueado ? () => onSelectChapter(cap.numero) : undefined}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-gold shrink-0">
                      CAP {String(cap.numero).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium text-navy truncate">{cap.titulo}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{completados}/{total} sesiones</span>
                    <StatusBadge variant={badge.variant} label={badge.label} icon={badge.icon} />
                  </div>
                </div>
                <Progress value={pct} className="h-1.5" />
                <div className="flex gap-1 flex-wrap">
                  {cap.sesiones.map((s) => {
                    const wb = wbsCap.find((w) => w.sesion_numero === s.numero);
                    return (
                      <div
                        key={s.numero}
                        title={`Sesión ${s.numero}: ${s.titulo}`}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
                          wb?.completado
                            ? "bg-emerald-100 text-emerald-700"
                            : bloqueado
                            ? "bg-muted/50 text-muted-foreground/50"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.numero}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ContenidoCapitulo ─────────────────────────────────────────────────────────

function ContenidoCapitulo({ cap, workbooksDelCap, onAbrirWorkbook, onAbrirIA }: {
  cap: CapituloLEE;
  workbooksDelCap: Workbook[];
  onAbrirWorkbook: (sesionNum: number) => void;
  onAbrirIA: (sesionNum: number) => void;
}) {
  return (
    <div className="space-y-3 pt-2 border-t">
      {cap.tablaResumen.length > 0 && (
        <div>
          <h5 className="font-semibold text-navy text-[11px] uppercase tracking-wider mb-2">Resumen ejecutivo</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border">
              <thead className="bg-navy/5">
                <tr>
                  <th className="text-left p-2 border-b">Sesión</th>
                  <th className="text-left p-2 border-b">Módulos</th>
                  <th className="text-left p-2 border-b">Objetivo</th>
                  <th className="text-left p-2 border-b">Herramienta</th>
                </tr>
              </thead>
              <tbody>
                {cap.tablaResumen.map((f, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 font-medium align-top">{f.sesion}</td>
                    <td className="p-2 align-top">{f.modulos}</td>
                    <td className="p-2 text-muted-foreground align-top">{f.objetivo}</td>
                    <td className="p-2 align-top">{f.herramienta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Accordion type="multiple" className="space-y-2">
        {cap.sesiones.map((s) => {
          const wb = workbooksDelCap.find((w) => w.sesion_numero === s.numero);
          return (
            <AccordionItem key={s.numero} value={sesionKey(cap.numero, s.numero)} className="border rounded">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2 flex-1 text-left">
                  <div className="w-7 h-7 rounded-full bg-gold text-navy font-bold flex items-center justify-center text-xs shrink-0">
                    {s.numero}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.eyebrow}</div>
                    <div className="text-sm font-medium">{s.titulo}</div>
                  </div>
                  {wb?.completado && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-3">
                <div className="flex flex-wrap gap-1">
                  {s.meta.map((m, i) => (
                    <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />{m}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  {s.modulos.map((m) => <ModuloCard key={m.numero} m={m} />)}
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t items-center">
                  <Button size="sm" variant="outline" onClick={() => onAbrirWorkbook(s.numero)}>
                    <FileText className="w-3 h-3 mr-1" /> {wb ? "Abrir workbook" : "Iniciar workbook"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAbrirIA(s.numero)} disabled={!wb}>
                    <Brain className="w-3 h-3 mr-1" /> Análisis IA
                  </Button>
                  {getWorkbookSchema(cap.numero, s.numero) && (
                    <Badge className="bg-gold text-navy text-[10px]">Workbook instrumentado ✨</Badge>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function ModuloCard({ m }: { m: ModuloPlan }) {
  return (
    <div className="border rounded p-3 space-y-2 bg-muted/20">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[10px] font-bold text-gold">{m.numero}</span>
        <Badge variant="outline" className="text-[9px]">{m.tipo}</Badge>
        <span className="text-sm font-medium flex-1">{m.titulo}</span>
        {m.duracion && <span className="text-[10px] text-muted-foreground">{m.duracion}</span>}
      </div>

      {(m.objetivo || m.resultadoEsperado) && (
        <div className="grid md:grid-cols-2 gap-2 text-xs">
          {m.objetivo && (
            <div className="bg-white border rounded p-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> Objetivo</div>
              <p className="mt-1">{m.objetivo}</p>
            </div>
          )}
          {m.resultadoEsperado && (
            <div className="bg-white border rounded p-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">⚡ Resultado esperado</div>
              <p className="mt-1">{m.resultadoEsperado}</p>
            </div>
          )}
        </div>
      )}

      {m.marco.length > 0 && (
        <div className="text-xs space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">📖 Marco conceptual</div>
          {m.marco.map((p, i) => <p key={i} className="leading-relaxed">{p}</p>)}
        </div>
      )}

      {m.insight && (
        <div className="bg-gold/10 border border-gold/30 rounded p-2 text-xs">
          <div className="font-semibold text-navy text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-gold" /> Insight clave
          </div>
          <p>{m.insight}</p>
        </div>
      )}

      {m.preguntasCoaching.length > 0 && (
        <div className="text-xs">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> Preguntas de coaching
          </div>
          <ul className="space-y-0.5">
            {m.preguntasCoaching.map((q, i) => (
              <li key={i} className="flex gap-1"><span className="text-gold">?</span><span>{q}</span></li>
            ))}
          </ul>
        </div>
      )}

      {m.ejercicio && (
        <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-xs">
          <div className="font-semibold text-emerald-800 text-[10px] uppercase tracking-wider mb-1">📝 Ejercicio principal</div>
          <p>{m.ejercicio}</p>
        </div>
      )}
    </div>
  );
}

function WorkbookDialog({
  programaId, capitulo, sesion, workbook, onClose, onSaved,
}: {
  programaId: string;
  capitulo: number;
  sesion: number;
  workbook: Workbook | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cap = getCapitulo(capitulo);
  const ses = getSesion(capitulo, sesion);
  const schema = getWorkbookSchema(capitulo, sesion);
  const [respuestas, setRespuestas] = useState<Record<string, unknown>>(
    (workbook?.respuestas as Record<string, unknown>) ?? {},
  );
  const [completado, setCompletado] = useState(workbook?.completado ?? false);
  const [saving, setSaving] = useState(false);
  const [autoestado, setAutoestado] = useState<"idle" | "guardando" | "guardado" | "error">("idle");
  const [wbUltimoGuardado, setWbUltimoGuardado] = useState<Date | null>(null);
  const ultimaSerie = useRef<string>("");

  const guardarSilencioso = useCallback(async (forzar = false) => {
    if (!workbook) return;
    const serial = JSON.stringify({ respuestas, completado });
    if (!forzar && serial === ultimaSerie.current) return;
    setAutoestado("guardando");
    try {
      const payload = { ...respuestas, __id: sesionKey(capitulo, sesion) };
      const { error } = await supabase.from("lee_workbooks")
        .update({ respuestas: payload, completado })
        .eq("id", workbook.id);
      if (error) throw error;
      ultimaSerie.current = serial;
      setWbUltimoGuardado(new Date());
      setAutoestado("guardado");
      setTimeout(() => setAutoestado((s) => s === "guardado" ? "idle" : s), 2000);
    } catch {
      setAutoestado("error");
    }
  }, [workbook, respuestas, completado, capitulo, sesion]);

  useEffect(() => {
    if (!workbook) return;
    const t = setTimeout(() => { void guardarSilencioso(); }, 2000);
    return () => clearTimeout(t);
  }, [guardarSilencioso, workbook]);

  useEffect(() => {
    if (!workbook) return;
    const i = setInterval(() => { void guardarSilencioso(); }, 30000);
    return () => clearInterval(i);
  }, [guardarSilencioso, workbook]);

  const handleClose = useCallback(async () => {
    await guardarSilencioso(true);
    onClose();
  }, [guardarSilencioso, onClose]);

  const fileRef = useRef<HTMLInputElement>(null);

  if (!cap || !ses) return null;

  const guardar = async () => {
    setSaving(true);
    try {
      const payload = { ...respuestas, __id: sesionKey(capitulo, sesion) };
      if (workbook) {
        const { error } = await supabase.from("lee_workbooks").update({ respuestas: payload, completado }).eq("id", workbook.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("lee_workbooks").insert({
          programa_id: programaId,
          capitulo_numero: capitulo,
          sesion_numero: sesion,
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

  const handleExportJSON = () => {
    if (!schema) return toast.error("Esta sesión aún no tiene workbook instrumentado.");
    exportWorkbookJSON(schema, respuestas);
    toast.success("JSON descargado");
  };
  const handleExportHTML = () => {
    if (!schema) return toast.error("Esta sesión aún no tiene workbook instrumentado.");
    exportWorkbookHTML(schema, respuestas);
    toast.success("HTML descargado — ábrelo offline y llénalo");
  };
  const handleImport = async (file: File) => {
    if (!schema) return toast.error("Solo se puede importar en sesiones instrumentadas.");
    try {
      const r = await importWorkbookJSON(file, schema);
      setRespuestas(r);
      toast.success("Respuestas importadas. Recuerda guardar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al importar");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) void handleClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">CAP {capitulo} · Sesión {sesion} · {cap.titulo}</span>
            {ses.titulo}
          </DialogTitle>
        </DialogHeader>

        {schema && (
          <div className="flex flex-wrap gap-2 pb-2 border-b">
            <Button size="sm" variant="outline" onClick={handleExportJSON} className="text-xs">
              <Download className="w-3 h-3 mr-1" /> Exportar JSON
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportHTML} className="text-xs">
              <Download className="w-3 h-3 mr-1" /> Exportar HTML editable
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="text-xs">
              <Upload className="w-3 h-3 mr-1" /> Importar JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
          </div>
        )}
        {schema ? (
          <WorkbookInstrumentado schema={schema} respuestas={respuestas} onChange={setRespuestas} />
        ) : (
          <div className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-3 text-xs border">
              <p className="text-muted-foreground">{ses.eyebrow}</p>
              <p className="mt-1">Workbook simple. Pronto esta sesión tendrá su workbook instrumentado completo.</p>
            </div>
            {WORKBOOK_CAMPOS.map((campo) => (
              <div key={campo.key}>
                <label className="text-xs font-medium text-navy mb-1 block">{campo.label}</label>
                <Textarea
                  rows={4}
                  value={(respuestas[campo.key] as string) ?? ""}
                  onChange={(e) => setRespuestas({ ...respuestas, [campo.key]: e.target.value })}
                  placeholder={campo.placeholder}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 border-t mt-3">
          <input type="checkbox" id="wbcompletada" checked={completado} onChange={(e) => setCompletado(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="wbcompletada" className="text-sm">Marcar sesión como completada</label>
        </div>

        <DialogFooter>
          {workbook && (
            <div className="text-xs flex items-center gap-1.5 text-muted-foreground mr-auto">
              {autoestado === "guardando" && <><Save className="w-3 h-3 animate-pulse" /> Guardando…</>}
              {autoestado === "guardado" && <><Check className="w-3 h-3 text-green-600" /> Guardado</>}
              {autoestado === "error" && <span className="text-red-600">Error al guardar</span>}
              {autoestado === "idle" && wbUltimoGuardado && <>Último guardado: {wbUltimoGuardado.toLocaleTimeString()}</>}
              {autoestado === "idle" && !wbUltimoGuardado && <>Autosave activo</>}
            </div>
          )}
          <Button variant="outline" onClick={() => void handleClose()}>Cancelar</Button>
          <Button onClick={guardar} disabled={saving} className="bg-navy hover:bg-navy/90">
            {saving ? "Guardando…" : "Guardar workbook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AnalisisIADialog({
  capitulo, sesion, workbook, onClose,
}: {
  capitulo: number;
  sesion: number;
  workbook: Workbook | null;
  onClose: () => void;
}) {
  const cap = getCapitulo(capitulo);
  const ses = getSesion(capitulo, sesion);
  if (!cap || !ses) return null;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">CAP {capitulo} · Sesión {sesion}</span>
            <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-gold" /> Análisis IA — {ses.titulo}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="bg-muted/30 border rounded p-3 text-xs">
            <p className="font-medium text-navy">Cómo funciona</p>
            <p className="text-muted-foreground mt-1">
              El Análisis IA tomará lo que el participante escribió en el Workbook de esta sesión
              (notas, reflexiones, evidencias y compromisos) y devolverá: lectura ejecutiva, patrones
              emergentes, riesgos detectados y recomendaciones para la próxima sesión del facilitador.
            </p>
          </div>

          {!workbook ? (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs">
              ⚠️ Aún no hay workbook capturado para esta sesión. Abre primero el workbook y registra notas.
            </div>
          ) : (
            <>
              <div className="text-xs">
                <div className="font-medium text-navy mb-1">Contenido capturado</div>
                <div className="bg-white border rounded p-2 max-h-40 overflow-y-auto space-y-1">
                  {WORKBOOK_CAMPOS.map((c) => {
                    const v = (workbook.respuestas as Record<string, unknown>)?.[c.key];
                    if (typeof v !== "string" || !v) return null;
                    return <div key={c.key}><span className="font-semibold">{c.label}:</span> <span className="text-muted-foreground">{v.slice(0, 120)}{v.length > 120 ? "…" : ""}</span></div>;
                  })}
                </div>
              </div>
              <div className="bg-gold/10 border border-gold/30 rounded p-3 text-xs">
                <p className="font-medium text-navy mb-1">🔧 Próximamente</p>
                <p>El análisis IA será generado bajo demanda al hacer clic en "Analizar con IA". Esta funcionalidad se conectará al gateway en la próxima iteración para mantener controlado el consumo de créditos.</p>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button disabled className="bg-navy hover:bg-navy/90">
            <Sparkles className="w-3 h-3 mr-1" /> Analizar con IA (próximamente)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
