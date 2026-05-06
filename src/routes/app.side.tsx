import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  DIMENSIONES, IVEE_PREGUNTAS, IDF_PREGUNTAS, COF_PREGUNTAS,
  promedio, interpretarIME, ESCALA_LABELS, calcFinanciero,
  type ScoreMap, type Dimension, type DatosFinancieros,
} from "@/lib/side-data";
import { generarAnalisisSide } from "@/server/side-analysis.functions";
import { generarIniciativasSide, type IniciativaIA } from "@/server/side-iniciativas.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Loader2, Save, Sparkles, TrendingUp, AlertTriangle, ChevronRight, Plus, FileText, History, Download } from "lucide-react";

export const Route = createFileRoute("/app/side")({
  validateSearch: (s: Record<string, unknown>) => ({ sesion: typeof s.sesion === "string" ? s.sesion : undefined }),
  component: SidePage,
});

interface Cliente { id: string; nombre_empresa: string; sector: string | null; tamano: string | null; pais: string | null; ciudad: string | null }
interface Sesion {
  id: string;
  cliente_id: string;
  nombre_sesion: string | null;
  scores: ScoreMap;
  ime_score: number | null;
  ivee_score: number | null;
  idf_score: number | null;
  cof_score: number | null;
  datos_financieros: DatosFinancieros | null;
  analisis_ia: Record<string, { titulo: string; contenido: string; fecha: string }>;
  completada: boolean;
  created_at: string;
  updated_at: string;
}

function SidePage() {
  const { user, role } = useAuth();
  const { sesion: sesionIdParam } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState<"inicio" | "cuestionario">("inicio");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [historial, setHistorial] = useState<Sesion[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("clientes").select("id,nombre_empresa,sector,tamano,pais,ciudad").eq("activo", true)
      .order("nombre_empresa").then(({ data }) => setClientes((data ?? []) as Cliente[]));
  }, [user]);

  // Auto-abrir sesión cuando viene ?sesion=<id>
  useEffect(() => {
    if (!sesionIdParam || !user) return;
    (async () => {
      const { data, error } = await supabase.from("side_sesiones").select("*").eq("id", sesionIdParam).maybeSingle();
      if (error || !data) { toast.error("No se pudo cargar la sesión"); return; }
      setSesion(data as unknown as Sesion);
      setStep("cuestionario");
      // Asegurar que el cliente esté cargado
      const clienteId = (data as { cliente_id: string }).cliente_id;
      if (!clientes.find((c) => c.id === clienteId)) {
        const { data: c } = await supabase.from("clientes").select("id,nombre_empresa,sector,tamano,pais,ciudad").eq("id", clienteId).maybeSingle();
        if (c) setClientes((prev) => [...prev, c as Cliente]);
      }
    })();
  }, [sesionIdParam, user]);

  const cargarHistorial = async (clienteId: string) => {
    const { data } = await supabase.from("side_sesiones").select("*").eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    setHistorial((data ?? []) as unknown as Sesion[]);
  };

  return (
    <div className="max-w-[1500px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-navy">Diagnóstico SIDE</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistema Integral de Diagnóstico Empresarial · 12 dimensiones · 4 índices</p>
        </div>
        {step === "cuestionario" && sesion && (
          <Button variant="outline" onClick={() => { setStep("inicio"); navigate({ to: "/app/side", search: {} }); }}>← Volver</Button>
        )}
      </div>

      {step === "inicio" && (
        <InicioSesion
          clientes={clientes}
          historial={historial}
          onClienteChange={cargarHistorial}
          role={role}
          onIniciar={(s) => { setSesion(s); setStep("cuestionario"); }}
          onAbrir={(s) => { setSesion(s); setStep("cuestionario"); }}
          onClientesChange={setClientes}
        />
      )}

      {step === "cuestionario" && sesion && (
        <Cuestionario
          sesion={sesion}
          onUpdate={setSesion}
          cliente={clientes.find((c) => c.id === sesion.cliente_id)!}
          historial={historial}
        />
      )}
    </div>
  );
}

// ── INICIO ──────────────────────────────────────────────────────────
function InicioSesion({
  clientes, historial, onClienteChange, onIniciar, onAbrir, onClientesChange, role,
}: {
  clientes: Cliente[]; historial: Sesion[];
  onClienteChange: (id: string) => void;
  onIniciar: (s: Sesion) => void;
  onAbrir: (s: Sesion) => void;
  onClientesChange: (c: Cliente[]) => void;
  role: string | null;
}) {
  const { user } = useAuth();
  const [clienteId, setClienteId] = useState<string>("");
  const [nombreSesion, setNombreSesion] = useState("");
  const [modo, setModo] = useState<"consultor" | "autoeval">("consultor");
  const [creando, setCreando] = useState(false);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [nuevoClienteData, setNuevoClienteData] = useState({ nombre_empresa: "", sector: "", tamano: "", pais: "Ecuador", ciudad: "" });

  useEffect(() => { if (clienteId) onClienteChange(clienteId); }, [clienteId, onClienteChange]);

  const crearCliente = async () => {
    if (!nuevoClienteData.nombre_empresa.trim()) { toast.error("Nombre requerido"); return; }
    const insert = { ...nuevoClienteData, consultor_id: role === "consultor" ? user!.id : null };
    const { data, error } = await supabase.from("clientes").insert(insert).select().single();
    if (error) { toast.error(error.message); return; }
    onClientesChange([...clientes, data as Cliente]);
    setClienteId(data.id);
    setNuevoOpen(false);
    toast.success("Cliente creado");
  };

  const iniciar = async () => {
    if (!clienteId) { toast.error("Selecciona un cliente"); return; }
    setCreando(true);
    const { data, error } = await supabase.from("side_sesiones").insert({
      cliente_id: clienteId,
      consultor_id: role === "consultor" || role === "admin" ? user!.id : null,
      nombre_sesion: nombreSesion || `Diagnóstico ${new Date().toLocaleDateString("es-EC")}`,
      scores: {}, analisis_ia: {},
    }).select().single();
    setCreando(false);
    if (error) { toast.error(error.message); return; }
    onIniciar(data as unknown as Sesion);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6">
      <div className="a360-card a360-card-lg p-8">
        <h2 className="font-display text-xl text-navy">Iniciar nueva sesión diagnóstica</h2>
        <p className="text-sm text-muted-foreground mt-1">Aplica el SIDE a un cliente o autoevalúate.</p>

        <div className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <div className="flex gap-2">
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}{c.ciudad ? ` · ${c.ciudad}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setNuevoOpen(!nuevoOpen)}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>

          {nuevoOpen && (
            <div className="grid grid-cols-2 gap-3 p-4 bg-cream rounded-md border border-border/60">
              <div className="col-span-2 space-y-1"><Label className="text-xs">Empresa *</Label>
                <Input value={nuevoClienteData.nombre_empresa} onChange={(e) => setNuevoClienteData({ ...nuevoClienteData, nombre_empresa: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Sector</Label>
                <Input value={nuevoClienteData.sector} onChange={(e) => setNuevoClienteData({ ...nuevoClienteData, sector: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Tamaño</Label>
                <Input value={nuevoClienteData.tamano} onChange={(e) => setNuevoClienteData({ ...nuevoClienteData, tamano: e.target.value })} placeholder="ej: 45 empleados" /></div>
              <div className="space-y-1"><Label className="text-xs">País</Label>
                <Input value={nuevoClienteData.pais} onChange={(e) => setNuevoClienteData({ ...nuevoClienteData, pais: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Ciudad</Label>
                <Input value={nuevoClienteData.ciudad} onChange={(e) => setNuevoClienteData({ ...nuevoClienteData, ciudad: e.target.value })} /></div>
              <div className="col-span-2"><Button size="sm" onClick={crearCliente} className="bg-navy text-primary-foreground">Crear cliente</Button></div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Nombre de la sesión</Label>
            <Input value={nombreSesion} onChange={(e) => setNombreSesion(e.target.value)} placeholder={`Diagnóstico ${new Date().toLocaleDateString("es-EC")}`} />
          </div>

          <div className="space-y-1.5">
            <Label>Modo</Label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setModo("consultor")} className={`text-left p-3 rounded-md border ${modo === "consultor" ? "border-gold bg-gold/10" : "border-border"}`}>
                <div className="text-xs font-semibold text-navy">Consultor aplica</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Entrevista guiada</div>
              </button>
              <button onClick={() => setModo("autoeval")} className={`text-left p-3 rounded-md border ${modo === "autoeval" ? "border-gold bg-gold/10" : "border-border"}`}>
                <div className="text-xs font-semibold text-navy">Cliente autoevalúa</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Self-service</div>
              </button>
            </div>
          </div>

          <Button onClick={iniciar} disabled={creando || !clienteId} className="w-full bg-navy text-primary-foreground hover:bg-navy/90 h-11">
            {creando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Iniciar diagnóstico SIDE <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="a360-card a360-card-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-gold" />
          <h3 className="font-display text-lg text-navy">Historial</h3>
        </div>
        {!clienteId && <p className="text-sm text-muted-foreground">Selecciona un cliente para ver sus diagnósticos.</p>}
        {clienteId && historial.length === 0 && <p className="text-sm text-muted-foreground">Sin diagnósticos previos.</p>}
        <div className="space-y-2">
          {historial.map((s) => {
            const nivel = interpretarIME(s.ime_score ?? 0);
            return (
              <button key={s.id} onClick={() => onAbrir(s)} className="w-full text-left p-3 rounded-md border border-border hover:bg-cream/50">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-navy truncate">{s.nombre_sesion}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{new Date(s.created_at).toLocaleDateString("es-EC")}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: nivel.color, background: nivel.bg }}>
                    IME {(s.ime_score ?? 0).toFixed(1)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── CUESTIONARIO ────────────────────────────────────────────────────
function Cuestionario({
  sesion: sesionInicial, onUpdate, cliente, historial,
}: { sesion: Sesion; onUpdate: (s: Sesion) => void; cliente: Cliente; historial: Sesion[] }) {
  const [scores, setScores] = useState<ScoreMap>(sesionInicial.scores ?? {});
  const [financiero, setFinanciero] = useState<DatosFinancieros>(sesionInicial.datos_financieros ?? {});
  const [analisis, setAnalisis] = useState(sesionInicial.analisis_ia ?? {});
  const [tab, setTab] = useState("dimensiones");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => { dirtyRef.current = true; }, [scores, financiero, analisis]);

  // Cálculos en vivo
  const dimScores = useMemo(() => DIMENSIONES.map((d) => ({
    key: d.key, nombre: d.nombre, score: promedio(d.preguntas.map((p) => p.id), scores), iniciativa: d.iniciativa,
  })), [scores]);

  const ime = useMemo(() => {
    const v = dimScores.map((d) => d.score).filter((s) => s > 0);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }, [dimScores]);
  const ivee = useMemo(() => promedio(IVEE_PREGUNTAS.map((p) => p.id), scores), [scores]);
  const idf = useMemo(() => promedio(IDF_PREGUNTAS.map((p) => p.id), scores), [scores]);
  const cof = useMemo(() => promedio(COF_PREGUNTAS.map((p) => p.id), scores), [scores]);
  const calcFin = useMemo(() => calcFinanciero(financiero), [financiero]);

  const guardar = async (silent = false) => {
    const payload = {
      scores: scores as Record<string, number>,
      datos_financieros: financiero as Record<string, number | undefined>,
      analisis_ia: analisis as Record<string, { titulo: string; contenido: string; fecha: string }>,
      ime_score: ime || null, ivee_score: ivee || null, idf_score: idf || null, cof_score: cof || null,
    };
    const { error } = await supabase.from("side_sesiones").update(payload as never).eq("id", sesionInicial.id);
    if (error) { if (!silent) toast.error(error.message); return; }
    dirtyRef.current = false;
    setSavedAt(new Date());
    if (!silent) toast.success("Sesión guardada");
    onUpdate({ ...sesionInicial, ...payload } as Sesion);
  };

  // Autoguardado cada 30s
  useEffect(() => {
    const t = setInterval(() => { if (dirtyRef.current) guardar(true); }, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, financiero, analisis]);

  const setScore = (id: string, v: number) => setScores((prev) => ({ ...prev, [id]: v }));

  return (
    <div>
      <div className="a360-card p-4 mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Sesión activa</div>
          <div className="font-display text-lg text-navy">{sesionInicial.nombre_sesion}</div>
          <div className="text-xs text-muted-foreground">{cliente.nombre_empresa} · {cliente.ciudad ?? ""} {cliente.pais ?? ""}</div>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-[11px] text-muted-foreground">Guardado {savedAt.toLocaleTimeString("es-EC")}</span>}
          <Button onClick={() => guardar(false)} variant="outline" size="sm"><Save className="w-3.5 h-3.5 mr-1.5" />Guardar</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="dimensiones">Dimensiones</TabsTrigger>
          <TabsTrigger value="indices">Índices</TabsTrigger>
          <TabsTrigger value="financiero">Financiero</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
          <TabsTrigger value="ia">Análisis IA</TabsTrigger>
        </TabsList>

        <TabsContent value="dimensiones" className="mt-5">
          <DimensionesAccordion dimensiones={DIMENSIONES} scores={scores} setScore={setScore} dimScores={dimScores} />
        </TabsContent>

        <TabsContent value="indices" className="mt-5 space-y-5">
          <IndiceBlock titulo="IVEE — Viabilidad y Escalabilidad" descripcion="16 preguntas · escala 1-5" preguntas={IVEE_PREGUNTAS} scores={scores} setScore={setScore} score={ivee} color="#1a5fa0" />
          <IndiceBlock titulo="IDF — Dependencia del Fundador" descripcion="12 preguntas · escala 1-5 · ALTO = mayor dependencia" preguntas={IDF_PREGUNTAS} scores={scores} setScore={setScore} score={idf} color="#c0392b" inverso />
          <IndiceBlock titulo="COF — Coherencia Organizacional" descripcion="12 preguntas · escala 1-5" preguntas={COF_PREGUNTAS} scores={scores} setScore={setScore} score={cof} color="#1e7e50" />
        </TabsContent>

        <TabsContent value="financiero" className="mt-5">
          <FinancieroBlock financiero={financiero} setFinanciero={setFinanciero} calc={calcFin} />
        </TabsContent>

        <TabsContent value="resultados" className="mt-5">
          <Resultados
            ime={ime} ivee={ivee} idf={idf} cof={cof} dimScores={dimScores}
            historial={historial} sesionId={sesionInicial.id} cliente={cliente}
            iniciativasIA={(analisis as any)?._iniciativas?.items ?? []}
            iniciativasFecha={(analisis as any)?._iniciativas?.fecha ?? null}
            onIniciativas={(items: IniciativaIA[]) => {
              const nuevo = { ...analisis, _iniciativas: { items, fecha: new Date().toISOString() } } as Record<string, unknown> as typeof analisis;
              setAnalisis(nuevo);
              setTimeout(() => guardar(true), 100);
            }}
          />
        </TabsContent>

        <TabsContent value="ia" className="mt-5">
          <AnalisisIA
            cliente={cliente} ime={ime} ivee={ivee} idf={idf} cof={cof}
            dimScores={dimScores} financiero={{ ...financiero, ...calcFin }}
            analisis={analisis} setAnalisis={setAnalisis} onSave={() => guardar(true)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── DIMENSIONES (accordion) ─────────────────────────────────────────
function DimensionesAccordion({
  dimensiones, scores, setScore, dimScores,
}: {
  dimensiones: Dimension[]; scores: ScoreMap;
  setScore: (id: string, v: number) => void;
  dimScores: { key: string; nombre: string; score: number }[];
}) {
  const total = dimensiones.reduce((acc, d) => acc + d.preguntas.length, 0);
  const respondidas = Object.values(scores).filter((v) => v > 0).length;

  return (
    <div className="a360-card a360-card-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg text-navy">12 Dimensiones SIDE</h3>
          <p className="text-xs text-muted-foreground">{respondidas} / {total} preguntas respondidas</p>
        </div>
        <div className="w-48 h-2 bg-cream rounded-full overflow-hidden">
          <div className="h-full bg-gold transition-all" style={{ width: `${(respondidas / total) * 100}%` }} />
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {dimensiones.map((d) => {
          const ds = dimScores.find((x) => x.key === d.key)!;
          const nivel = interpretarIME(ds.score);
          return (
            <AccordionItem key={d.key} value={d.key} className="border border-border rounded-md px-4 bg-white">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-3">
                  <span className="font-display text-base text-navy">{d.nombre}</span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold font-mono" style={{ color: nivel.color, background: nivel.bg }}>
                    {ds.score > 0 ? ds.score.toFixed(2) : "—"}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {d.preguntas.map((p) => (
                    <PreguntaRow key={p.id} id={p.id} texto={p.texto} value={scores[p.id]} onChange={(v) => setScore(p.id, v)} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function PreguntaRow({ id, texto, value, onChange }: { id: string; texto: string; value?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded hover:bg-cream/40">
      <span className="text-[10px] font-mono text-muted-foreground w-12">{id}</span>
      <span className="flex-1 text-sm text-navy">{texto}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(n)} title={ESCALA_LABELS[n]}
            className={`w-8 h-8 rounded text-xs font-semibold transition ${
              value === n ? "bg-navy text-primary-foreground" : "bg-cream text-navy hover:bg-gold/30"
            }`}>{n}</button>
        ))}
      </div>
    </div>
  );
}

// ── ÍNDICES (IVEE, IDF, COF) ────────────────────────────────────────
function IndiceBlock({
  titulo, descripcion, preguntas, scores, setScore, score, color, inverso,
}: {
  titulo: string; descripcion: string;
  preguntas: { id: string; texto: string }[]; scores: ScoreMap;
  setScore: (id: string, v: number) => void; score: number; color: string; inverso?: boolean;
}) {
  return (
    <div className="a360-card a360-card-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-lg text-navy">{titulo}</h3>
          <p className="text-xs text-muted-foreground">{descripcion}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-semibold" style={{ color }}>{score > 0 ? score.toFixed(2) : "—"}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{inverso ? "Mayor = peor" : "Mayor = mejor"}</div>
        </div>
      </div>
      <div className="space-y-2">
        {preguntas.map((p) => (
          <PreguntaRow key={p.id} id={p.id} texto={p.texto} value={scores[p.id]} onChange={(v) => setScore(p.id, v)} />
        ))}
      </div>
    </div>
  );
}

// ── FINANCIERO ──────────────────────────────────────────────────────
function FinancieroBlock({ financiero, setFinanciero, calc }: {
  financiero: DatosFinancieros; setFinanciero: (d: DatosFinancieros) => void;
  calc: ReturnType<typeof calcFinanciero>;
}) {
  const f = (k: keyof DatosFinancieros, label: string, suffix?: string) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input type="number" value={financiero[k] ?? ""} onChange={(e) => setFinanciero({ ...financiero, [k]: e.target.value === "" ? undefined : Number(e.target.value) })} className="font-mono" />
        {suffix && <span className="absolute right-3 top-2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
  const fmt = (n: number) => n ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="a360-card a360-card-lg p-6">
        <h3 className="font-display text-lg text-navy mb-1">Datos financieros</h3>
        <p className="text-xs text-muted-foreground mb-5">Información para análisis de valoración.</p>
        <div className="grid grid-cols-2 gap-4">
          {f("ingresos_anuales", "Ingresos anuales", "USD")}
          {f("margen_neto", "Margen neto", "%")}
          {f("margen_ebitda", "Margen EBITDA", "%")}
          {f("multiplo_actual", "Múltiplo valoración actual", "x")}
          {f("multiplo_objetivo", "Múltiplo objetivo", "x")}
        </div>
      </div>

      <div className="a360-card a360-card-lg p-6">
        <h3 className="font-display text-lg text-navy mb-5">Cálculos automáticos</h3>
        <div className="space-y-3">
          <FinRow label="EBITDA estimado" value={fmt(calc.ebitda)} />
          <FinRow label="Valor empresa actual" value={fmt(calc.valActual)} />
          <FinRow label="Valor empresa potencial" value={fmt(calc.valObjetivo)} accent />
          <FinRow label="Gap de valoración" value={fmt(calc.gap)} accent />
          <FinRow label="Potencial desbloqueado" value={`${calc.potencial.toFixed(0)}%`} accent />
        </div>
      </div>
    </div>
  );
}

function FinRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between items-center p-3 rounded-md ${accent ? "bg-gold/10 border border-gold/30" : "bg-cream"}`}>
      <span className="text-sm text-navy">{label}</span>
      <span className={`font-mono font-semibold ${accent ? "text-gold" : "text-navy"}`}>{value}</span>
    </div>
  );
}

// ── RESULTADOS ──────────────────────────────────────────────────────
function Resultados({
  ime, ivee, idf, cof, dimScores, historial, sesionId, cliente,
  iniciativasIA, iniciativasFecha, onIniciativas,
}: {
  ime: number; ivee: number; idf: number; cof: number;
  dimScores: { key: string; nombre: string; score: number; iniciativa: string }[];
  historial: Sesion[]; sesionId: string; cliente: Cliente;
  iniciativasIA: IniciativaIA[]; iniciativasFecha: string | null;
  onIniciativas: (items: IniciativaIA[]) => void;
}) {
  const { session } = useAuth();
  const [genIA, setGenIA] = useState(false);
  const nivel = interpretarIME(ime);
  const fortalezas = [...dimScores].filter((d) => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  const brechas = [...dimScores].filter((d) => d.score > 0).sort((a, b) => a.score - b.score).slice(0, 3);
  const radarData = dimScores.map((d) => ({ dimension: d.nombre, score: Number(d.score.toFixed(2)) }));
  const evolucion = [...historial].filter((h) => h.ime_score).reverse().map((h) => ({
    fecha: new Date(h.created_at).toLocaleDateString("es-EC", { month: "short", day: "numeric" }),
    IME: Number(h.ime_score),
  }));
  const [compararConId, setCompararConId] = useState<string>("");
  const compararCon = historial.find((h) => h.id === compararConId);
  const radarComparado = compararCon ? DIMENSIONES.map((d) => {
    const ids = d.preguntas.map((p) => p.id);
    const sc = promedio(ids, compararCon.scores);
    return { dimension: d.nombre, actual: Number(dimScores.find((x) => x.key === d.key)!.score.toFixed(2)), comparado: Number(sc.toFixed(2)) };
  }) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <IndiceCard label="IME" value={ime} subtitle={nivel.label} color={nivel.color} bg={nivel.bg} primary />
        <IndiceCard label="IVEE" value={ivee} subtitle="Viabilidad" color="#1a5fa0" />
        <IndiceCard label="IDF" value={idf} subtitle="Dependencia" color="#c0392b" inverso />
        <IndiceCard label="COF" value={cof} subtitle="Coherencia" color="#1e7e50" />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <div className="a360-card a360-card-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-navy">Radar de las 12 dimensiones</h3>
            {historial.length > 0 && (
              <Select value={compararConId} onValueChange={setCompararConId}>
                <SelectTrigger className="w-56 h-8 text-xs"><SelectValue placeholder="Comparar con…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin comparar</SelectItem>
                  {historial.filter((h) => h.id !== sesionId && h.ime_score).map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.nombre_sesion} ({(h.ime_score ?? 0).toFixed(1)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={radarComparado ?? radarData}>
              <PolarGrid stroke="rgba(26,43,90,0.15)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "#1a2b5a" }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} />
              {radarComparado ? (
                <>
                  <Radar name="Actual" dataKey="actual" stroke="#c9a84c" fill="#c9a84c" fillOpacity={0.4} animationDuration={700} />
                  <Radar name="Anterior" dataKey="comparado" stroke="#1a2b5a" fill="#1a2b5a" fillOpacity={0.15} animationDuration={700} />
                </>
              ) : (
                <Radar name="Score" dataKey="score" stroke="#1a2b5a" fill="#c9a84c" fillOpacity={0.5} animationDuration={700} />
              )}
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-5">
          <div className="a360-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" style={{ color: "#1e7e50" }} />
              <h3 className="font-display text-base text-navy">Top 3 fortalezas</h3>
            </div>
            <div className="space-y-2">
              {fortalezas.length === 0 && <p className="text-xs text-muted-foreground">Aún sin datos suficientes.</p>}
              {fortalezas.map((f) => (
                <div key={f.key} className="flex justify-between items-center p-2.5 rounded bg-[oklch(0.62_0.14_150/0.08)] border border-[oklch(0.62_0.14_150/0.2)]">
                  <span className="text-sm text-navy font-medium">{f.nombre}</span>
                  <span className="font-mono font-semibold text-sm" style={{ color: "#1e7e50" }}>{f.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="a360-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="font-display text-base text-navy">Top 3 brechas críticas</h3>
            </div>
            <div className="space-y-2">
              {brechas.length === 0 && <p className="text-xs text-muted-foreground">Aún sin datos suficientes.</p>}
              {brechas.map((b) => (
                <div key={b.key} className="flex justify-between items-center p-2.5 rounded bg-destructive/8 border border-destructive/20">
                  <span className="text-sm text-navy font-medium">{b.nombre}</span>
                  <span className="font-mono font-semibold text-sm text-destructive">{b.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="a360-card a360-card-lg p-6">
        <h3 className="font-display text-lg text-navy mb-4">Iniciativas recomendadas por dimensión</h3>
        <div className="grid md:grid-cols-2 gap-2">
          {[...dimScores].sort((a, b) => a.score - b.score).map((d) => {
            const n = interpretarIME(d.score || 1);
            return (
              <div key={d.key} className="flex items-center justify-between p-3 rounded border border-border">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{d.nombre}</div>
                  <div className="text-sm text-navy font-medium truncate">{d.iniciativa}</div>
                </div>
                <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-semibold font-mono whitespace-nowrap" style={{ color: n.color, background: n.bg }}>
                  {d.score > 0 ? d.score.toFixed(1) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {evolucion.length > 1 && (
        <div className="a360-card a360-card-lg p-6">
          <h3 className="font-display text-lg text-navy mb-4">Evolución del IME</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={evolucion}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,43,90,0.1)" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="IME" stroke="#c9a84c" strokeWidth={2.5} dot={{ fill: "#1a2b5a", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function IndiceCard({ label, value, subtitle, color, bg, primary, inverso }: {
  label: string; value: number; subtitle: string; color: string; bg?: string; primary?: boolean; inverso?: boolean;
}) {
  return (
    <div className={`a360-card p-5 ${primary ? "ring-2 ring-gold/40" : ""}`} style={primary ? { background: bg } : undefined}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold" style={{ color }}>{label}</span>
        {inverso && <span className="text-[9px] text-muted-foreground">↓ mejor</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-mono font-semibold" style={{ color }}>{value > 0 ? value.toFixed(2) : "—"}</span>
        <span className="text-xs text-muted-foreground">/5.0</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}

// ── ANÁLISIS IA ─────────────────────────────────────────────────────
const TIPOS_ANALISIS = [
  { id: "ejecutivo", label: "① Análisis ejecutivo estratégico" },
  { id: "brechas", label: "② Análisis de brechas críticas" },
  { id: "roadmap", label: "③ Roadmap estratégico de transformación" },
  { id: "propuesta", label: "④ Propuesta de consultoría A360SGP" },
  { id: "financiero", label: "⑤ Análisis de impacto financiero" },
] as const;

function AnalisisIA({
  cliente, ime, ivee, idf, cof, dimScores, financiero, analisis, setAnalisis, onSave,
}: {
  cliente: Cliente; ime: number; ivee: number; idf: number; cof: number;
  dimScores: { nombre: string; score: number }[];
  financiero: DatosFinancieros & ReturnType<typeof calcFinanciero>;
  analisis: Record<string, { titulo: string; contenido: string; fecha: string }>;
  setAnalisis: (a: Record<string, { titulo: string; contenido: string; fecha: string }>) => void;
  onSave: () => void;
}) {
  const { session } = useAuth();
  const [tipo, setTipo] = useState<typeof TIPOS_ANALISIS[number]["id"]>("ejecutivo");
  const [loading, setLoading] = useState(false);

  const generar = async () => {
    if (ime === 0) { toast.error("Completa primero al menos algunas dimensiones"); return; }
    if (!session?.access_token) { toast.error("Tu sesión expiró. Vuelve a iniciar sesión."); return; }
    setLoading(true);
    try {
      const fortalezas = [...dimScores].filter((d) => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
      const brechas = [...dimScores].filter((d) => d.score > 0).sort((a, b) => a.score - b.score).slice(0, 3);
      const res = await generarAnalisisSide({
        data: {
          accessToken: session.access_token,
          tipo,
          empresa: { nombre: cliente.nombre_empresa, sector: cliente.sector, tamano: cliente.tamano, pais: cliente.pais },
          ime, ivee, idf, cof,
          dimensiones: dimScores,
          fortalezas, brechas,
          financiero,
        },
      });
      if ((res as any).error || !res.contenido) {
        toast.error((res as any).error || "La IA no devolvió contenido");
        return;
      }
      const nuevo = { ...analisis, [tipo]: { titulo: res.titulo, contenido: res.contenido, fecha: new Date().toISOString() } };
      setAnalisis(nuevo);
      setTimeout(onSave, 100);
      toast.success("Análisis generado");
      setTipo(tipo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar análisis");
    } finally { setLoading(false); }
  };

  const actual = analisis[tipo];

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-5">
      <div className="a360-card p-5 space-y-2 h-fit">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <h3 className="font-display text-base text-navy">Tipos de análisis</h3>
        </div>
        {TIPOS_ANALISIS.map((t) => (
          <button key={t.id} onClick={() => setTipo(t.id)}
            className={`w-full text-left p-2.5 rounded text-sm border ${tipo === t.id ? "border-gold bg-gold/10 text-navy font-medium" : "border-border hover:bg-cream/50"}`}>
            {t.label}
            {analisis[t.id] && <span className="ml-2 text-[10px] text-success">✓</span>}
          </button>
        ))}
        <Button onClick={generar} disabled={loading} className="w-full bg-navy text-primary-foreground hover:bg-navy/90 mt-3">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {actual ? "Regenerar" : "Generar análisis"}
        </Button>
      </div>

      <div className="a360-card a360-card-lg p-7 min-h-[500px]">
        {!actual && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Selecciona un tipo de análisis y genéralo con IA.</p>
          </div>
        )}
        {loading && (
          <div className="h-full flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Generando análisis con IA…</p>
          </div>
        )}
        {actual && !loading && (
          <article>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border gap-3">
              <h2 className="font-display text-2xl text-navy">{actual.titulo}</h2>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-muted-foreground">{new Date(actual.fecha).toLocaleString("es-EC")}</span>
                <Button
                  size="sm" variant="outline"
                  onClick={() => {
                    const blob = new Blob([`# ${actual.titulo}\n\n_${cliente.nombre_empresa} — ${new Date(actual.fecha).toLocaleString("es-EC")}_\n\n${actual.contenido}`], { type: "text/markdown;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `SIDE_${cliente.nombre_empresa.replace(/\s+/g, "_")}_${tipo}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Markdown
                </Button>
                <Button
                  size="sm" variant="outline"
                  onClick={() => {
                    const w = window.open("", "_blank");
                    if (!w) return;
                    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${actual.titulo}</title>
<style>body{font-family:Georgia,serif;max-width:780px;margin:40px auto;padding:0 24px;color:#1a2332;line-height:1.6}h1{border-bottom:2px solid #c9a961;padding-bottom:8px}h2{color:#1a5fa0;margin-top:24px}.meta{color:#666;font-size:12px;margin-bottom:24px}pre{white-space:pre-wrap;font-family:inherit}@media print{body{margin:0}}</style>
</head><body><h1>${actual.titulo}</h1><div class="meta">${cliente.nombre_empresa} — ${new Date(actual.fecha).toLocaleString("es-EC")}</div><pre>${(actual.contenido ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!))}</pre><script>window.onload=()=>window.print()</script></body></html>`);
                    w.document.close();
                  }}
                >
                  <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                </Button>
              </div>
            </div>
            <div className="prose prose-sm max-w-none text-navy whitespace-pre-wrap leading-relaxed">{actual.contenido}</div>
          </article>
        )}
      </div>
    </div>
  );
}
