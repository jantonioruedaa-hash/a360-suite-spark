import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plus, Pencil, Trash2, Eye, Check, X,
  ClipboardList, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type {
  Competencia,
  CompetenciaEvaluada, AccionDesarrollo, Evaluacion, EvaluacionFormData,
} from "@/types/manual-funciones";
import { EVAL_BLANK } from "@/types/manual-funciones";

export const Route = createFileRoute("/app/manual-funciones/$clienteId_/evaluaciones")({
  component: EvaluacionesPage,
});

// ── Types locales ──────────────────────────────────────────────────────────────
type CargoLight = {
  id: string;
  cargo: string;
  area: string;
  competencias_blandas: Competencia[];
  competencias_tecnicas: Competencia[];
};

// ── Style constants ────────────────────────────────────────────────────────────
const LABEL: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#64748B",
  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px",
};
const INPUT: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: "14px",
  border: "1.5px solid #E2E8F0", borderRadius: "8px",
  background: "white", color: "#0C4A6E", outline: "none", boxSizing: "border-box",
};

// ── Semaforo ───────────────────────────────────────────────────────────────────
const SEMAFORO_CFG = {
  verde:    { bg: "#D1FAE5", color: "#065F46", label: "Favorable" },
  amarillo: { bg: "#FEF3C7", color: "#92400E", label: "En desarrollo" },
  rojo:     { bg: "#FEE2E2", color: "#991B1B", label: "Crítico" },
};

function SemaforoBadge({ s }: { s: string | null }) {
  const cfg = SEMAFORO_CFG[s as keyof typeof SEMAFORO_CFG] ?? { bg: "#F1F5F9", color: "#64748B", label: "—" };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: "11px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px", whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}

// ── Puntaje badge ──────────────────────────────────────────────────────────────
const PUNTAJE_BG   = ["", "#FEE2E2", "#FECACA", "#FEF3C7", "#D1FAE5", "#A7F3D0"];
const PUNTAJE_TEXT = ["", "#991B1B", "#B91C1C", "#92400E", "#065F46", "#047857"];

function PuntajeBadge({ p }: { p: number }) {
  return (
    <span style={{ background: PUNTAJE_BG[p] ?? "#F1F5F9", color: PUNTAJE_TEXT[p] ?? "#64748B", fontSize: "12px", fontWeight: 800, padding: "3px 10px", borderRadius: "6px", minWidth: "36px", textAlign: "center", display: "inline-block" }}>
      {p}/5
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function calcular(competencias: CompetenciaEvaluada[]): { indice: number; semaforo: "verde" | "amarillo" | "rojo" } {
  if (!competencias.length) return { indice: 0, semaforo: "rojo" };
  const avg = competencias.reduce((s, c) => s + c.puntaje, 0) / competencias.length;
  const indice = Math.round((avg / 5) * 100);
  return { indice, semaforo: indice >= 80 ? "verde" : indice >= 60 ? "amarillo" : "rojo" };
}

function parseEval(row: Record<string, unknown>): Evaluacion {
  function parseJ<T>(val: unknown, fb: T[]): T[] {
    if (!val) return fb;
    if (Array.isArray(val)) return val as T[];
    try { const p = JSON.parse(val as string); return Array.isArray(p) ? p : fb; }
    catch { return fb; }
  }
  return {
    id: row.id as string,
    cargo_id: row.cargo_id as string,
    consultor_id: (row.consultor_id as string) ?? null,
    nombre_evaluado: (row.nombre_evaluado as string) ?? null,
    fecha_evaluacion: (row.fecha_evaluacion as string) ?? null,
    competencias_evaluadas: parseJ<CompetenciaEvaluada>(row.competencias_evaluadas, []),
    indice_global: row.indice_global != null ? Number(row.indice_global) : null,
    semaforo: (row.semaforo as "verde" | "amarillo" | "rojo") ?? null,
    plan_desarrollo: parseJ<AccionDesarrollo>(row.plan_desarrollo, []),
    created_at: row.created_at as string,
  };
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return iso; }
}

// ── Plan de desarrollo — fila dinámica ────────────────────────────────────────
const ESTADOS_PD = ["pendiente", "en_progreso", "completado"] as const;
const ESTADO_CFG: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:   { bg: "#F1F5F9", color: "#64748B", label: "Pendiente" },
  en_progreso: { bg: "#DBEAFE", color: "#1D4ED8", label: "En progreso" },
  completado:  { bg: "#D1FAE5", color: "#065F46", label: "Completado" },
};

type PDRowEntry = AccionDesarrollo & { _id: string };

function PDRow({ entry, onChange, onRemove }: {
  entry: PDRowEntry;
  onChange: (updated: PDRowEntry) => void;
  onRemove: () => void;
}) {
  const [local, setLocal] = useState(entry);

  function update<K extends keyof PDRowEntry>(key: K, val: PDRowEntry[K], immediate = false) {
    const next = { ...local, [key]: val };
    setLocal(next);
    if (immediate) onChange(next);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 140px auto", gap: "8px", alignItems: "center", padding: "10px 12px", background: "white", border: "1px solid #E2E8F0", borderRadius: "10px" }}>
      <input value={local.area} onChange={(e) => update("area", e.target.value)} onBlur={() => onChange(local)} style={{ ...INPUT, fontSize: "13px", padding: "6px 10px" }} placeholder="Área" />
      <input value={local.accion} onChange={(e) => update("accion", e.target.value)} onBlur={() => onChange(local)} style={{ ...INPUT, fontSize: "13px", padding: "6px 10px" }} placeholder="Acción de mejora" />
      <input value={local.plazo} onChange={(e) => update("plazo", e.target.value)} onBlur={() => onChange(local)} style={{ ...INPUT, fontSize: "13px", padding: "6px 10px" }} placeholder="Ej: 3 meses" />
      <select value={local.estado} onChange={(e) => update("estado", e.target.value as AccionDesarrollo["estado"], true)} style={{ ...INPUT, fontSize: "13px", padding: "6px 10px" }}>
        {ESTADOS_PD.map((s) => <option key={s} value={s}>{ESTADO_CFG[s].label}</option>)}
      </select>
      <button onClick={onRemove} style={{ padding: "7px", borderRadius: "7px", border: "1.5px solid #FEE2E2", background: "#FFF5F5", color: "#DC2626", cursor: "pointer" }}>
        <Trash2 style={{ width: "12px", height: "12px" }} />
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
function EvaluacionesPage() {
  const { clienteId } = Route.useParams();

  const [clienteNombre, setClienteNombre] = useState("");
  const [cargos, setCargos]               = useState<CargoLight[]>([]);
  const [evaluaciones, setEvaluaciones]   = useState<Evaluacion[]>([]);
  const [loading, setLoading]             = useState(true);

  const [vista, setVista]               = useState<"lista" | "form" | "detalle">("lista");
  const [evalEditando, setEvalEditando] = useState<Evaluacion | null>(null);
  const [evalDetalle, setEvalDetalle]   = useState<Evaluacion | null>(null);
  const [form, setForm]                 = useState<EvaluacionFormData>({ ...EVAL_BLANK });
  const [saving, setSaving]             = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [pdEntries, setPdEntries]       = useState<PDRowEntry[]>([]);

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [{ data: cl }, { data: ca }] = await Promise.all([
        supabase.from("clientes").select("nombre_empresa").eq("id", clienteId).single(),
        (supabase as any).from("manual_funciones_cargos")
          .select("id,cargo,area,competencias_blandas,competencias_tecnicas")
          .eq("cliente_id", clienteId).order("cargo"),
      ]);

      setClienteNombre((cl as any)?.nombre_empresa ?? "");
      const cargosData = (ca ?? []) as unknown as CargoLight[];
      setCargos(cargosData);

      if (cargosData.length > 0) {
        const ids = cargosData.map((c) => c.id);
        const { data: ev } = await (supabase as any)
          .from("manual_funciones_evaluaciones")
          .select("*")
          .in("cargo_id", ids)
          .order("fecha_evaluacion", { ascending: false });
        setEvaluaciones(((ev ?? []) as Record<string, unknown>[]).map(parseEval));
      }
      setLoading(false);
    }
    load();
  }, [clienteId]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function onCargoChange(cargoId: string) {
    const cargo = cargos.find((c) => c.id === cargoId);
    if (!cargo) { setForm((p) => ({ ...p, cargo_id: cargoId, competencias_evaluadas: [] })); return; }

    const blandas: CompetenciaEvaluada[] = cargo.competencias_blandas.map((c) => ({
      categoria: "blanda" as const, nombre: c.nombre, nivel_requerido: c.nivel, puntaje: 3, comentario: "",
    }));
    const tecnicas: CompetenciaEvaluada[] = cargo.competencias_tecnicas.map((c) => ({
      categoria: "tecnica" as const, nombre: c.nombre, nivel_requerido: c.nivel, puntaje: 3, comentario: "",
    }));

    setForm((p) => ({ ...p, cargo_id: cargoId, competencias_evaluadas: [...blandas, ...tecnicas] }));
  }

  function abrirNueva() {
    setEvalEditando(null);
    setForm({ ...EVAL_BLANK, fecha_evaluacion: new Date().toISOString().split("T")[0] });
    setPdEntries([]);
    setVista("form");
  }

  function abrirEdicion(ev: Evaluacion) {
    setEvalEditando(ev);
    setForm({
      cargo_id: ev.cargo_id,
      nombre_evaluado: ev.nombre_evaluado ?? "",
      fecha_evaluacion: ev.fecha_evaluacion ?? new Date().toISOString().split("T")[0],
      competencias_evaluadas: ev.competencias_evaluadas,
      plan_desarrollo: ev.plan_desarrollo,
    });
    setPdEntries(ev.plan_desarrollo.map((a) => ({ ...a, _id: `_${Math.random()}` })));
    setVista("form");
  }

  function abrirDetalle(ev: Evaluacion) {
    setEvalDetalle(ev);
    setVista("detalle");
  }

  function updateComp(idx: number, field: keyof CompetenciaEvaluada, val: string | number) {
    setForm((p) => ({
      ...p,
      competencias_evaluadas: p.competencias_evaluadas.map((c, i) =>
        i === idx ? { ...c, [field]: val } : c
      ),
    }));
  }

  function addPD() {
    setPdEntries((p) => [...p, { _id: `_${Date.now()}`, area: "", accion: "", plazo: "", estado: "pendiente" }]);
  }
  function removePD(id: string) { setPdEntries((p) => p.filter((e) => e._id !== id)); }
  function updatePD(updated: PDRowEntry) { setPdEntries((p) => p.map((e) => e._id === updated._id ? updated : e)); }

  async function guardar() {
    if (!form.cargo_id) { toast.error("Selecciona un cargo"); return; }
    if (!form.nombre_evaluado.trim()) { toast.error("El nombre del evaluado es obligatorio"); return; }
    if (!form.competencias_evaluadas.length) { toast.error("El cargo seleccionado no tiene competencias definidas"); return; }

    setSaving(true);
    const planFinal: AccionDesarrollo[] = pdEntries
      .filter((e) => e.area.trim() || e.accion.trim())
      .map(({ _id: _ignored, ...rest }) => rest);

    const { indice, semaforo } = calcular(form.competencias_evaluadas);

    const payload = {
      cargo_id: form.cargo_id,
      nombre_evaluado: form.nombre_evaluado.trim(),
      fecha_evaluacion: form.fecha_evaluacion || null,
      competencias_evaluadas: form.competencias_evaluadas,
      indice_global: indice,
      semaforo,
      plan_desarrollo: planFinal,
    };

    if (evalEditando) {
      const { data, error } = await (supabase as any)
        .from("manual_funciones_evaluaciones").update(payload).eq("id", evalEditando.id).select().single();
      if (error) { toast.error("Error al guardar"); setSaving(false); return; }
      const updated = parseEval(data as Record<string, unknown>);
      setEvaluaciones((p) => p.map((e) => e.id === evalEditando.id ? updated : e));
      if (evalDetalle?.id === evalEditando.id) setEvalDetalle(updated);
      toast.success("Evaluación actualizada");
    } else {
      const { data, error } = await (supabase as any)
        .from("manual_funciones_evaluaciones").insert(payload).select().single();
      if (error) { toast.error("Error al guardar"); setSaving(false); return; }
      setEvaluaciones((p) => [parseEval(data as Record<string, unknown>), ...p]);
      toast.success("Evaluación guardada");
    }
    setSaving(false);
    setVista("lista");
  }

  async function eliminar(id: string) {
    const { error } = await (supabase as any).from("manual_funciones_evaluaciones").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar"); return; }
    setEvaluaciones((p) => p.filter((e) => e.id !== id));
    setDeletingId(null);
    if (vista === "detalle") setVista("lista");
    toast.success("Evaluación eliminada");
  }

  // ── Breadcrumb ─────────────────────────────────────────────────────────────
  const Breadcrumb = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
      <Link to="/app/manual-funciones" style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 600, color: "#0EA5E9", textDecoration: "none" }}>
        <ArrowLeft style={{ width: "14px", height: "14px" }} /> Manual de Funciones
      </Link>
      <span style={{ color: "#CBD5E1" }}>/</span>
      <Link to="/app/manual-funciones/$clienteId" params={{ clienteId }} style={{ fontSize: "13px", fontWeight: 600, color: "#0EA5E9", textDecoration: "none" }}>
        {clienteNombre || "…"}
      </Link>
      <span style={{ color: "#CBD5E1" }}>/</span>
      <span style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E" }}>Evaluaciones</span>
    </div>
  );

  // ── RENDER: DETALLE ────────────────────────────────────────────────────────
  if (vista === "detalle" && evalDetalle) {
    const cargo = cargos.find((c) => c.id === evalDetalle.cargo_id);
    const blandas = evalDetalle.competencias_evaluadas.filter((c) => c.categoria === "blanda");
    const tecnicas = evalDetalle.competencias_evaluadas.filter((c) => c.categoria === "tecnica");

    return (
      <div style={{ maxWidth: "860px" }}>
        <Breadcrumb />

        {/* Header evaluación */}
        <div style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", borderRadius: "16px", padding: "24px 28px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
              {cargo?.cargo ?? "—"} · {fmtDate(evalDetalle.fecha_evaluacion)}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "white" }}>{evalDetalle.nombre_evaluado ?? "—"}</div>
            {cargo?.area && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "3px" }}>{cargo.area}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", fontWeight: 900, color: "white", lineHeight: 1 }}>{evalDetalle.indice_global ?? 0}%</div>
              <div style={{ marginTop: "6px" }}><SemaforoBadge s={evalDetalle.semaforo} /></div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => abrirEdicion(evalDetalle)} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "8px 14px", borderRadius: "8px", border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                <Pencil style={{ width: "13px", height: "13px" }} /> Editar
              </button>
              <button onClick={() => setVista("lista")} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "8px 14px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.95)", color: "#0C4A6E", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                <X style={{ width: "13px", height: "13px" }} /> Cerrar
              </button>
            </div>
          </div>
        </div>

        {/* Competencias */}
        {[
          { label: "Competencias Blandas",  items: blandas,  hBg: "#F0FDF4", hBorder: "#BBF7D0", hColor: "#065F46" },
          { label: "Competencias Técnicas", items: tecnicas, hBg: "#EFF6FF", hBorder: "#BFDBFE", hColor: "#1D4ED8" },
        ].filter((g) => g.items.length > 0).map((g) => (
          <div key={g.label} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", marginBottom: "14px" }}>
            <div style={{ background: g.hBg, borderBottom: `1.5px solid ${g.hBorder}`, padding: "12px 18px", fontSize: "11px", fontWeight: 800, color: g.hColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {g.label}
            </div>
            {g.items.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 18px", borderBottom: i < g.items.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0C4A6E" }}>{c.nombre}</div>
                  <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "1px" }}>Nivel requerido: {c.nivel_requerido}</div>
                  {c.comentario && <div style={{ fontSize: "11px", color: "#64748B", marginTop: "3px", fontStyle: "italic" }}>{c.comentario}</div>}
                </div>
                <div style={{ width: "140px", flexShrink: 0 }}>
                  <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "999px", overflow: "hidden", marginBottom: "4px" }}>
                    <div style={{ height: "100%", width: `${(c.puntaje / 5) * 100}%`, background: c.puntaje >= 4 ? "#10B981" : c.puntaje >= 3 ? "#F59E0B" : "#EF4444", borderRadius: "999px" }} />
                  </div>
                </div>
                <PuntajeBadge p={c.puntaje} />
              </div>
            ))}
          </div>
        ))}

        {/* Plan de desarrollo */}
        {evalDetalle.plan_desarrollo.length > 0 && (
          <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ background: "#F8FAFF", borderBottom: "1px solid #E2E8F0", padding: "12px 18px", fontSize: "11px", fontWeight: 800, color: "#0C4A6E", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Plan de Desarrollo
            </div>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {evalDetalle.plan_desarrollo.map((a, i) => {
                const cfg = ESTADO_CFG[a.estado] ?? ESTADO_CFG.pendiente;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 14px", background: "#F8FAFF", borderRadius: "8px", border: "1px solid #E8EEF8" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E" }}>{a.accion}</div>
                      <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                        {a.area}{a.plazo ? ` · Plazo: ${a.plazo}` : ""}
                      </div>
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.color, fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "99px", whiteSpace: "nowrap" }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER: FORM ───────────────────────────────────────────────────────────
  if (vista === "form") {
    const blandas = form.competencias_evaluadas.filter((c) => c.categoria === "blanda");
    const tecnicas = form.competencias_evaluadas.filter((c) => c.categoria === "tecnica");
    const { indice, semaforo } = calcular(form.competencias_evaluadas);

    const CompRow = ({ c, globalIdx }: { c: CompetenciaEvaluada; globalIdx: number }) => (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 150px auto", gap: "10px", alignItems: "start", padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#0C4A6E", marginBottom: "4px" }}>{c.nombre}</div>
          <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "6px" }}>Nivel requerido: {c.nivel_requerido}</div>
          <input
            value={c.comentario ?? ""}
            onChange={(e) => updateComp(globalIdx, "comentario", e.target.value)}
            style={{ ...INPUT, fontSize: "12px", padding: "5px 10px" }}
            placeholder="Comentario (opcional)"
          />
        </div>
        <div>
          <div style={LABEL}>Puntaje</div>
          <select
            value={c.puntaje}
            onChange={(e) => updateComp(globalIdx, "puntaje", Number(e.target.value))}
            style={INPUT}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} — {["", "Insuficiente", "Regular", "Aceptable", "Bueno", "Excelente"][n]}</option>
            ))}
          </select>
        </div>
        <div style={{ paddingTop: "20px" }}>
          <PuntajeBadge p={c.puntaje} />
        </div>
      </div>
    );

    return (
      <div style={{ maxWidth: "860px" }}>
        <Breadcrumb />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0C4A6E", margin: 0 }}>
              {evalEditando ? "Editar Evaluación" : "Nueva Evaluación"}
            </h2>
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: "3px 0 0" }}>{clienteNombre}</p>
          </div>
          <button onClick={() => setVista("lista")} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 600, color: "#64748B", background: "#F1F5F9", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer" }}>
            <X style={{ width: "13px", height: "13px" }} /> Cancelar
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Identificación */}
          <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "18px" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#0C4A6E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>
              Identificación
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <div style={LABEL}>Cargo *</div>
                <select value={form.cargo_id} onChange={(e) => onCargoChange(e.target.value)} style={INPUT}>
                  <option value="">— Seleccionar —</option>
                  {cargos.map((c) => <option key={c.id} value={c.id}>{c.cargo} ({c.area})</option>)}
                </select>
              </div>
              <div>
                <div style={LABEL}>Nombre del evaluado *</div>
                <input
                  value={form.nombre_evaluado}
                  onChange={(e) => setForm((p) => ({ ...p, nombre_evaluado: e.target.value }))}
                  style={INPUT}
                  placeholder="Ej: Juan García"
                />
              </div>
              <div>
                <div style={LABEL}>Fecha de evaluación</div>
                <input
                  type="date"
                  value={form.fecha_evaluacion}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_evaluacion: e.target.value }))}
                  style={INPUT}
                />
              </div>
            </div>
          </div>

          {/* Competencias blandas */}
          {blandas.length > 0 && (
            <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ background: "#F0FDF4", borderBottom: "1.5px solid #BBF7D0", padding: "12px 18px", fontSize: "11px", fontWeight: 800, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Competencias Blandas
              </div>
              <div style={{ padding: "0 18px" }}>
                {blandas.map((c) => {
                  const gi = form.competencias_evaluadas.indexOf(c);
                  return <CompRow key={gi} c={c} globalIdx={gi} />;
                })}
              </div>
            </div>
          )}

          {/* Competencias técnicas */}
          {tecnicas.length > 0 && (
            <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ background: "#EFF6FF", borderBottom: "1.5px solid #BFDBFE", padding: "12px 18px", fontSize: "11px", fontWeight: 800, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Competencias Técnicas
              </div>
              <div style={{ padding: "0 18px" }}>
                {tecnicas.map((c) => {
                  const gi = form.competencias_evaluadas.indexOf(c);
                  return <CompRow key={gi} c={c} globalIdx={gi} />;
                })}
              </div>
            </div>
          )}

          {/* Sin competencias aviso */}
          {form.cargo_id && form.competencias_evaluadas.length === 0 && (
            <div style={{ background: "#FFF9F5", border: "1.5px solid #FED7AA", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertCircle style={{ width: "16px", height: "16px", color: "#F59E0B", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "#92400E" }}>
                El cargo seleccionado no tiene competencias definidas. Agrégalas primero en el Manual de Funciones.
              </span>
            </div>
          )}

          {/* Índice preview */}
          {form.competencias_evaluadas.length > 0 && (
            <div style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ flex: 1, fontSize: "13px", color: "rgba(255,255,255,0.65)" }}>Índice calculado (vista previa)</div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "white" }}>{indice}%</div>
              <SemaforoBadge s={semaforo} />
            </div>
          )}

          {/* Plan de desarrollo */}
          <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ background: "#F8FAFF", borderBottom: "1.5px solid #E2E8F0", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#0C4A6E", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Plan de Desarrollo
              </span>
              <button onClick={addPD} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px", borderRadius: "7px", border: "1px solid #E0E7FF", background: "white", color: "#0C4A6E", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                <Plus style={{ width: "11px", height: "11px" }} /> Agregar acción
              </button>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {pdEntries.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#94A3B8", textAlign: "center", padding: "16px 0", margin: 0 }}>
                  Sin acciones. Agrega compromisos de mejora para el evaluado.
                </p>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 140px auto", gap: "8px", padding: "0 12px 4px" }}>
                    {["Área", "Acción de mejora", "Plazo", "Estado", ""].map((h) => (
                      <div key={h} style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
                    ))}
                  </div>
                  {pdEntries.map((e) => <PDRow key={e._id} entry={e} onChange={updatePD} onRemove={() => removePD(e._id)} />)}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={() => setVista("lista")} style={{ padding: "10px 20px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "white", fontSize: "14px", fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={guardar} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 24px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", color: "white", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            <Check style={{ width: "14px", height: "14px" }} />
            {saving ? "Guardando…" : evalEditando ? "Actualizar" : "Guardar evaluación"}
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: LISTA ──────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "900px" }}>
      <Breadcrumb />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#0C4A6E", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Evaluaciones de Competencias
          </h1>
          <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
            {clienteNombre} · {evaluaciones.length} evaluación{evaluaciones.length !== 1 ? "es" : ""}
          </p>
        </div>
        <button onClick={abrirNueva} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
          <Plus style={{ width: "13px", height: "13px" }} /> Nueva evaluación
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#64748B", fontSize: "14px" }}>Cargando…</p>
      ) : evaluaciones.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", background: "white", borderRadius: "16px", border: "1.5px dashed #E0E7FF" }}>
          <ClipboardList style={{ width: "36px", height: "36px", color: "#CBD5E1", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0C4A6E", marginBottom: "6px" }}>Sin evaluaciones</h3>
          <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "16px" }}>
            Evalúa las competencias del equipo basándote en los cargos definidos.
          </p>
          <button onClick={abrirNueva} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            <Plus style={{ width: "13px", height: "13px" }} /> Primera evaluación
          </button>
        </div>
      ) : (
        <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden" }}>
          {/* Header tabla */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 90px 110px 160px", gap: "12px", padding: "12px 18px", background: "#F8FAFF", borderBottom: "1px solid #E2E8F0" }}>
            {["Evaluado", "Cargo", "Fecha", "Índice", "Resultado", "Acciones"].map((h) => (
              <div key={h} style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
            ))}
          </div>
          {/* Filas */}
          {evaluaciones.map((ev, i) => {
            const cargo = cargos.find((c) => c.id === ev.cargo_id);
            return (
              <div
                key={ev.id}
                style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 90px 110px 160px", gap: "12px", padding: "13px 18px", borderBottom: i < evaluaciones.length - 1 ? "1px solid #F1F5F9" : "none", alignItems: "center" }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E" }}>{ev.nombre_evaluado ?? "—"}</div>
                <div>
                  <div style={{ fontSize: "13px", color: "#334155" }}>{cargo?.cargo ?? "—"}</div>
                  {cargo?.area && <div style={{ fontSize: "11px", color: "#94A3B8" }}>{cargo.area}</div>}
                </div>
                <div style={{ fontSize: "12px", color: "#64748B" }}>{fmtDate(ev.fecha_evaluacion)}</div>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#0C4A6E" }}>
                  {ev.indice_global != null ? `${ev.indice_global}%` : "—"}
                </div>
                <SemaforoBadge s={ev.semaforo} />
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => abrirDetalle(ev)} style={{ padding: "5px 9px", borderRadius: "7px", border: "1.5px solid #E0E7FF", background: "#F0F4FF", color: "#6366F1", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 600 }}>
                    <Eye style={{ width: "11px", height: "11px" }} /> Ver
                  </button>
                  <button onClick={() => abrirEdicion(ev)} style={{ padding: "5px 9px", borderRadius: "7px", border: "1.5px solid #E2E8F0", background: "white", color: "#0C4A6E", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 600 }}>
                    <Pencil style={{ width: "11px", height: "11px" }} /> Editar
                  </button>
                  {deletingId === ev.id ? (
                    <div style={{ display: "flex", gap: "3px" }}>
                      <button onClick={() => eliminar(ev.id)} style={{ padding: "5px 8px", borderRadius: "7px", border: "none", background: "#DC2626", color: "white", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>OK</button>
                      <button onClick={() => setDeletingId(null)} style={{ padding: "5px 8px", borderRadius: "7px", border: "1.5px solid #E2E8F0", background: "white", color: "#64748B", cursor: "pointer", fontSize: "11px" }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(ev.id)} style={{ padding: "5px 7px", borderRadius: "7px", border: "1.5px solid #FEE2E2", background: "#FFF5F5", color: "#DC2626", cursor: "pointer" }}>
                      <Trash2 style={{ width: "11px", height: "11px" }} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
