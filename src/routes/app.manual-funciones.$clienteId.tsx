import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronUp, FileText, X, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/manual-funciones/$clienteId")({
  component: ManualFuncionesWorkspace,
});

// ── Types ──────────────────────────────────────────────────────────────────────
type Area = { id: string; nombre: string; orden: number };

type Funcion     = { descripcion: string; porcentaje_tiempo: number };
type Competencia = { nombre: string; nivel: string };
type KPI         = { nombre: string; meta: string; frecuencia: string };

type Cargo = {
  id: string;
  cargo: string;
  area: string;
  jefe_inmediato: string | null;
  codigo: string | null;
  version: string | null;
  estado: string | null;
  vacante: boolean | null;
  objetivo: string | null;
  funciones: Funcion[];
  competencias_blandas: Competencia[];
  competencias_tecnicas: Competencia[];
  kpis: KPI[];
  elaborado_por: string | null;
  aprobado_por: string | null;
  fecha_elaboracion: string | null;
  fecha_revision: string | null;
  plan_carrera: string | null;
};

type FormDatos = Omit<Cargo, "id">;

const FORM_BLANK: FormDatos = {
  cargo: "", area: "", jefe_inmediato: "", codigo: "", version: "1.0",
  estado: "vigente", vacante: false, objetivo: "",
  funciones: [], competencias_blandas: [], competencias_tecnicas: [], kpis: [],
  elaborado_por: "", aprobado_por: "", fecha_elaboracion: "", fecha_revision: "",
  plan_carrera: "",
};

const ESTADOS = ["vigente", "en_revision", "obsoleto"];
const NIVELES = ["Básico", "Intermedio", "Avanzado", "Experto"];
const FRECUENCIAS = ["Diario", "Semanal", "Mensual", "Trimestral", "Anual"];

// ── Style helpers ──────────────────────────────────────────────────────────────
const LABEL: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#64748B",
  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px",
};
const INPUT: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: "14px",
  border: "1.5px solid #E2E8F0", borderRadius: "8px",
  background: "white", color: "#0C4A6E", outline: "none",
  boxSizing: "border-box",
};
const PILL = (estado: string | null) => {
  const m: Record<string, { bg: string; color: string }> = {
    vigente:     { bg: "#D1FAE5", color: "#065F46" },
    en_revision: { bg: "#FEF3C7", color: "#92400E" },
    obsoleto:    { bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = m[estado ?? ""] ?? { bg: "#F1F5F9", color: "#64748B" };
  return { ...s, fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "99px" };
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseJsonb<T>(val: unknown, fallback: T[]): T[] {
  if (!val) return fallback;
  if (Array.isArray(val)) return val as T[];
  try { const p = JSON.parse(val as string); return Array.isArray(p) ? p : fallback; }
  catch { return fallback; }
}

function parseCargo(row: Record<string, unknown>): Cargo {
  return {
    id: row.id as string,
    cargo: (row.cargo as string) ?? "",
    area: (row.area as string) ?? "",
    jefe_inmediato: (row.jefe_inmediato as string) ?? null,
    codigo: (row.codigo as string) ?? null,
    version: (row.version as string) ?? null,
    estado: (row.estado as string) ?? null,
    vacante: (row.vacante as boolean) ?? false,
    objetivo: (row.objetivo as string) ?? null,
    funciones: parseJsonb<Funcion>(row.funciones, []),
    competencias_blandas: parseJsonb<Competencia>(row.competencias_blandas, []),
    competencias_tecnicas: parseJsonb<Competencia>(row.competencias_tecnicas, []),
    kpis: parseJsonb<KPI>(row.kpis, []),
    elaborado_por: (row.elaborado_por as string) ?? null,
    aprobado_por: (row.aprobado_por as string) ?? null,
    fecha_elaboracion: (row.fecha_elaboracion as string) ?? null,
    fecha_revision: (row.fecha_revision as string) ?? null,
    plan_carrera: (row.plan_carrera as string) ?? null,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function DynList<T extends Record<string, unknown>>({
  items, onChange, schema, labels,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  schema: T;
  labels: { field: keyof T; label: string; type?: "number" | "select"; options?: string[] }[];
}) {
  const add = () => onChange([...items, { ...schema }]);
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const set = (i: number, key: keyof T, val: unknown) =>
    onChange(items.map((row, j) => (j === i ? { ...row, [key]: val } : row)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }}>
          {labels.map((l) => (
            <div key={String(l.field)} style={{ flex: l.type === "number" ? "0 0 90px" : 1, minWidth: "120px" }}>
              <div style={LABEL}>{l.label}</div>
              {l.type === "select" ? (
                <select
                  value={String(row[l.field] ?? "")}
                  onChange={(e) => set(i, l.field, e.target.value)}
                  style={INPUT}
                >
                  {(l.options ?? []).map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={l.type ?? "text"}
                  value={String(row[l.field] ?? "")}
                  onChange={(e) =>
                    set(i, l.field, l.type === "number" ? Number(e.target.value) : e.target.value)
                  }
                  style={INPUT}
                />
              )}
            </div>
          ))}
          <button
            onClick={() => remove(i)}
            style={{ padding: "8px", borderRadius: "8px", border: "1.5px solid #FEE2E2", background: "#FFF5F5", color: "#DC2626", cursor: "pointer", flexShrink: 0 }}
          >
            <Trash2 style={{ width: "13px", height: "13px" }} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#0EA5E9", background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}
      >
        <Plus style={{ width: "12px", height: "12px" }} /> Agregar
      </button>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1.5px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#F8FAFF", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#0C4A6E" }}
      >
        {title}
        {open ? <ChevronUp style={{ width: "14px", height: "14px" }} /> : <ChevronDown style={{ width: "14px", height: "14px" }} />}
      </button>
      {open && <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={LABEL}>{label}</div>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
function ManualFuncionesWorkspace() {
  const { clienteId } = Route.useParams();

  const [clienteNombre, setClienteNombre] = useState("");
  const [areas, setAreas]       = useState<Area[]>([]);
  const [cargos, setCargos]     = useState<Cargo[]>([]);
  const [loading, setLoading]   = useState(true);

  const [areaActiva, setAreaActiva] = useState<"todas" | string>("todas");
  const [vista, setVista]           = useState<"lista" | "form">("lista");
  const [cargoEditando, setCargoEditando] = useState<Cargo | null>(null);
  const [form, setForm]               = useState<FormDatos>({ ...FORM_BLANK });
  const [saving, setSaving]           = useState(false);

  // area modal
  const [modalArea, setModalArea]       = useState(false);
  const [nuevaAreaNombre, setNuevaAreaNombre] = useState("");
  const [savingArea, setSavingArea]     = useState(false);

  // delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toastShown = useRef(false);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      supabase.from("clientes").select("nombre_empresa").eq("id", clienteId).single(),
      (supabase as any).from("manual_areas").select("id,nombre,orden").eq("cliente_id", clienteId).order("orden"),
      supabase.from("manual_funciones_cargos").select("*").eq("cliente_id", clienteId).order("cargo"),
    ]).then(([{ data: cl }, { data: ar }, { data: ca }]) => {
      setClienteNombre((cl as any)?.nombre_empresa ?? "");
      setAreas((ar ?? []) as Area[]);
      setCargos(((ca ?? []) as Record<string, unknown>[]).map(parseCargo));
      setLoading(false);
      if (!toastShown.current) {
        toastShown.current = true;
        toast.success("Manual de Funciones cargado");
      }
    });
  }, [clienteId]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const cargosFiltrados = areaActiva === "todas"
    ? cargos
    : cargos.filter((c) => c.area === areas.find((a) => a.id === areaActiva)?.nombre);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function abrirNuevo() {
    const areaNombre = areaActiva === "todas" ? "" : (areas.find((a) => a.id === areaActiva)?.nombre ?? "");
    setCargoEditando(null);
    setForm({ ...FORM_BLANK, area: areaNombre });
    setVista("form");
  }

  function abrirEdicion(c: Cargo) {
    setCargoEditando(c);
    setForm({
      cargo: c.cargo, area: c.area, jefe_inmediato: c.jefe_inmediato ?? "",
      codigo: c.codigo ?? "", version: c.version ?? "1.0",
      estado: c.estado ?? "vigente", vacante: c.vacante ?? false,
      objetivo: c.objetivo ?? "",
      funciones: c.funciones, competencias_blandas: c.competencias_blandas,
      competencias_tecnicas: c.competencias_tecnicas, kpis: c.kpis,
      elaborado_por: c.elaborado_por ?? "", aprobado_por: c.aprobado_por ?? "",
      fecha_elaboracion: c.fecha_elaboracion ?? "", fecha_revision: c.fecha_revision ?? "",
      plan_carrera: c.plan_carrera ?? "",
    });
    setVista("form");
  }

  async function guardar() {
    if (!form.cargo.trim() || !form.area.trim()) {
      toast.error("Cargo y área son obligatorios");
      return;
    }
    setSaving(true);
    const payload = {
      cliente_id: clienteId,
      cargo: form.cargo.trim(),
      area: form.area.trim(),
      jefe_inmediato: form.jefe_inmediato || null,
      codigo: form.codigo || null,
      version: form.version || null,
      estado: form.estado,
      vacante: form.vacante,
      objetivo: form.objetivo || null,
      funciones: form.funciones,
      competencias_blandas: form.competencias_blandas,
      competencias_tecnicas: form.competencias_tecnicas,
      kpis: form.kpis,
      elaborado_por: form.elaborado_por || null,
      aprobado_por: form.aprobado_por || null,
      fecha_elaboracion: form.fecha_elaboracion || null,
      fecha_revision: form.fecha_revision || null,
      plan_carrera: form.plan_carrera || null,
    };

    if (cargoEditando) {
      const { data, error } = await supabase
        .from("manual_funciones_cargos")
        .update(payload)
        .eq("id", cargoEditando.id)
        .select()
        .single();
      if (error) { toast.error("Error al guardar"); setSaving(false); return; }
      setCargos((prev) => prev.map((c) => (c.id === cargoEditando.id ? parseCargo(data as Record<string, unknown>) : c)));
      toast.success("Cargo actualizado");
    } else {
      const { data, error } = await supabase
        .from("manual_funciones_cargos")
        .insert(payload)
        .select()
        .single();
      if (error) { toast.error("Error al guardar"); setSaving(false); return; }
      setCargos((prev) => [...prev, parseCargo(data as Record<string, unknown>)]);
      toast.success("Cargo creado");
    }

    setSaving(false);
    setVista("lista");
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from("manual_funciones_cargos").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar"); return; }
    setCargos((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
    toast.success("Cargo eliminado");
  }

  async function crearArea() {
    if (!nuevaAreaNombre.trim()) return;
    setSavingArea(true);
    const maxOrden = areas.reduce((m, a) => Math.max(m, a.orden), -1) + 1;
    const { data, error } = await (supabase as any)
      .from("manual_areas")
      .insert({ cliente_id: clienteId, nombre: nuevaAreaNombre.trim(), orden: maxOrden })
      .select()
      .single();
    if (error) { toast.error("Error al crear área"); setSavingArea(false); return; }
    setAreas((prev) => [...prev, data as Area]);
    setNuevaAreaNombre("");
    setSavingArea(false);
    setModalArea(false);
    toast.success("Área creada");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const f = form;
  const setF = <K extends keyof FormDatos>(k: K, v: FormDatos[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div style={{ maxWidth: "900px" }}>

      {/* ── Breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
        <Link
          to="/app/manual-funciones"
          style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 600, color: "#0EA5E9", textDecoration: "none" }}
        >
          <ArrowLeft style={{ width: "14px", height: "14px" }} /> Manual de Funciones
        </Link>
        <span style={{ color: "#CBD5E1" }}>/</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E" }}>{clienteNombre || "…"}</span>
      </div>

      {loading ? (
        <p style={{ color: "#64748B", fontSize: "14px" }}>Cargando…</p>
      ) : vista === "form" ? (
        /* ── FORM VIEW ── */
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0C4A6E", margin: 0 }}>
                {cargoEditando ? `Editar: ${cargoEditando.cargo}` : "Nuevo Cargo"}
              </h2>
              <p style={{ fontSize: "13px", color: "#94A3B8", margin: "3px 0 0" }}>{clienteNombre}</p>
            </div>
            <button
              onClick={() => setVista("lista")}
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 600, color: "#64748B", background: "#F1F5F9", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer" }}
            >
              <X style={{ width: "13px", height: "13px" }} /> Cancelar
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            <Section title="Identificación del Cargo">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label="Cargo *">
                  <input value={f.cargo} onChange={(e) => setF("cargo", e.target.value)} style={INPUT} placeholder="Ej: Gerente de Ventas" />
                </Field>
                <Field label="Área *">
                  {areas.length > 0 ? (
                    <select value={f.area} onChange={(e) => setF("area", e.target.value)} style={INPUT}>
                      <option value="">— Seleccionar —</option>
                      {areas.map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                    </select>
                  ) : (
                    <input value={f.area} onChange={(e) => setF("area", e.target.value)} style={INPUT} placeholder="Ej: Comercial" />
                  )}
                </Field>
                <Field label="Jefe Inmediato">
                  <input value={f.jefe_inmediato ?? ""} onChange={(e) => setF("jefe_inmediato", e.target.value)} style={INPUT} placeholder="Ej: Director Comercial" />
                </Field>
                <Field label="Código">
                  <input value={f.codigo ?? ""} onChange={(e) => setF("codigo", e.target.value)} style={INPUT} placeholder="Ej: GV-001" />
                </Field>
                <Field label="Versión">
                  <input value={f.version ?? ""} onChange={(e) => setF("version", e.target.value)} style={INPUT} placeholder="1.0" />
                </Field>
                <Field label="Estado">
                  <select value={f.estado ?? "vigente"} onChange={(e) => setF("estado", e.target.value)} style={INPUT}>
                    {ESTADOS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </Field>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#0C4A6E", cursor: "pointer" }}>
                <input type="checkbox" checked={f.vacante ?? false} onChange={(e) => setF("vacante", e.target.checked)} />
                Vacante
              </label>
            </Section>

            <Section title="Elaboración y Aprobación" defaultOpen={false}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label="Elaborado por">
                  <input value={f.elaborado_por ?? ""} onChange={(e) => setF("elaborado_por", e.target.value)} style={INPUT} />
                </Field>
                <Field label="Aprobado por">
                  <input value={f.aprobado_por ?? ""} onChange={(e) => setF("aprobado_por", e.target.value)} style={INPUT} />
                </Field>
                <Field label="Fecha Elaboración">
                  <input type="date" value={f.fecha_elaboracion ?? ""} onChange={(e) => setF("fecha_elaboracion", e.target.value)} style={INPUT} />
                </Field>
                <Field label="Fecha Revisión">
                  <input type="date" value={f.fecha_revision ?? ""} onChange={(e) => setF("fecha_revision", e.target.value)} style={INPUT} />
                </Field>
              </div>
            </Section>

            <Section title="Objetivo del Cargo">
              <textarea
                value={f.objetivo ?? ""}
                onChange={(e) => setF("objetivo", e.target.value)}
                rows={3}
                style={{ ...INPUT, resize: "vertical" }}
                placeholder="Describa el propósito principal del cargo…"
              />
            </Section>

            <Section title="Funciones Principales" defaultOpen={false}>
              <DynList<Funcion>
                items={f.funciones}
                onChange={(v) => setF("funciones", v)}
                schema={{ descripcion: "", porcentaje_tiempo: 0 }}
                labels={[
                  { field: "descripcion", label: "Descripción" },
                  { field: "porcentaje_tiempo", label: "% Tiempo", type: "number" },
                ]}
              />
            </Section>

            <Section title="Competencias Blandas" defaultOpen={false}>
              <DynList<Competencia>
                items={f.competencias_blandas}
                onChange={(v) => setF("competencias_blandas", v)}
                schema={{ nombre: "", nivel: "Básico" }}
                labels={[
                  { field: "nombre", label: "Competencia" },
                  { field: "nivel", label: "Nivel", type: "select", options: NIVELES },
                ]}
              />
            </Section>

            <Section title="Competencias Técnicas" defaultOpen={false}>
              <DynList<Competencia>
                items={f.competencias_tecnicas}
                onChange={(v) => setF("competencias_tecnicas", v)}
                schema={{ nombre: "", nivel: "Básico" }}
                labels={[
                  { field: "nombre", label: "Competencia" },
                  { field: "nivel", label: "Nivel", type: "select", options: NIVELES },
                ]}
              />
            </Section>

            <Section title="KPIs" defaultOpen={false}>
              <DynList<KPI>
                items={f.kpis}
                onChange={(v) => setF("kpis", v)}
                schema={{ nombre: "", meta: "", frecuencia: "Mensual" }}
                labels={[
                  { field: "nombre", label: "Indicador" },
                  { field: "meta", label: "Meta" },
                  { field: "frecuencia", label: "Frecuencia", type: "select", options: FRECUENCIAS },
                ]}
              />
            </Section>

            <Section title="Plan de Carrera" defaultOpen={false}>
              <textarea
                value={f.plan_carrera ?? ""}
                onChange={(e) => setF("plan_carrera", e.target.value)}
                rows={3}
                style={{ ...INPUT, resize: "vertical" }}
                placeholder="Posibles trayectorias de crecimiento para este cargo…"
              />
            </Section>

          </div>

          {/* ── Save bar ── */}
          <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setVista("lista")}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "white", fontSize: "14px", fontWeight: 600, color: "#64748B", cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 24px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", color: "white", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              <Check style={{ width: "14px", height: "14px" }} />
              {saving ? "Guardando…" : cargoEditando ? "Actualizar cargo" : "Crear cargo"}
            </button>
          </div>
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#0C4A6E", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                {clienteNombre}
              </h1>
              <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
                {cargos.length} cargo{cargos.length !== 1 ? "s" : ""} documentado{cargos.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <button
                onClick={() => setModalArea(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "8px 14px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "white", fontSize: "13px", fontWeight: 600, color: "#64748B", cursor: "pointer" }}
              >
                <Plus style={{ width: "13px", height: "13px" }} /> Nueva área
              </button>
              <button
                onClick={abrirNuevo}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                <Plus style={{ width: "13px", height: "13px" }} /> Nuevo cargo
              </button>
            </div>
          </div>

          {/* Area tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {(["todas", ...areas.map((a) => a.id)] as ("todas" | string)[]).map((key) => {
              const label = key === "todas" ? `Todas (${cargos.length})` : (areas.find((a) => a.id === key)?.nombre ?? "");
              const count = key === "todas" ? cargos.length : cargos.filter((c) => c.area === areas.find((a) => a.id === key)?.nombre).length;
              const active = areaActiva === key;
              return (
                <button
                  key={key}
                  onClick={() => setAreaActiva(key)}
                  style={{
                    padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "1.5px solid",
                    background: active ? "#0C4A6E" : "white",
                    color: active ? "white" : "#64748B",
                    borderColor: active ? "#0C4A6E" : "#E2E8F0",
                  }}
                >
                  {key === "todas" ? `Todas (${cargos.length})` : `${label} (${count})`}
                </button>
              );
            })}
          </div>

          {/* Cargo list */}
          {cargosFiltrados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 24px", background: "white", borderRadius: "16px", border: "1.5px dashed #E0E7FF" }}>
              <FileText style={{ width: "36px", height: "36px", color: "#CBD5E1", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0C4A6E", marginBottom: "6px" }}>Sin cargos</h3>
              <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "16px" }}>
                {areaActiva === "todas" ? "Crea el primer cargo para esta empresa." : "No hay cargos en esta área todavía."}
              </p>
              <button
                onClick={abrirNuevo}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                <Plus style={{ width: "13px", height: "13px" }} /> Nuevo cargo
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {cargosFiltrados.map((c) => (
                <div key={c.id}
                  style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}
                >
                  {/* Avatar */}
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #0EA5E9, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 900, color: "white", flexShrink: 0 }}>
                    {c.cargo[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E" }}>{c.cargo}</span>
                      <span style={PILL(c.estado)}>{c.estado ?? "—"}</span>
                      {c.vacante && <span style={{ ...PILL("en_revision"), background: "#EDE9FE", color: "#5B21B6" }}>Vacante</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                      {c.area}{c.jefe_inmediato ? ` · Reporta a: ${c.jefe_inmediato}` : ""}
                      {c.codigo ? ` · ${c.codigo}` : ""}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", gap: "16px", flexShrink: 0 }}>
                    {[
                      { val: c.funciones.length,       lbl: "func." },
                      { val: c.kpis.length,             lbl: "KPIs" },
                    ].map((s) => (
                      <div key={s.lbl} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "16px", fontWeight: 900, color: "#0C4A6E" }}>{s.val}</div>
                        <div style={{ fontSize: "10px", color: "#94A3B8" }}>{s.lbl}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button
                      onClick={() => abrirEdicion(c)}
                      style={{ padding: "7px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "white", color: "#0C4A6E", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600 }}
                    >
                      <Pencil style={{ width: "12px", height: "12px" }} /> Editar
                    </button>
                    {deletingId === c.id ? (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button onClick={() => eliminar(c.id)} style={{ padding: "7px 10px", borderRadius: "8px", border: "none", background: "#DC2626", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>
                          Confirmar
                        </button>
                        <button onClick={() => setDeletingId(null)} style={{ padding: "7px 10px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "white", color: "#64748B", cursor: "pointer", fontSize: "12px" }}>
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(c.id)}
                        style={{ padding: "7px", borderRadius: "8px", border: "1.5px solid #FEE2E2", background: "#FFF5F5", color: "#DC2626", cursor: "pointer" }}
                      >
                        <Trash2 style={{ width: "13px", height: "13px" }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── New area modal ── */}
      {modalArea && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "28px", width: "340px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E", margin: "0 0 16px" }}>Nueva Área</h3>
            <div style={LABEL}>Nombre del área</div>
            <input
              autoFocus
              value={nuevaAreaNombre}
              onChange={(e) => setNuevaAreaNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crearArea()}
              style={{ ...INPUT, marginBottom: "16px" }}
              placeholder="Ej: Recursos Humanos"
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => { setModalArea(false); setNuevaAreaNombre(""); }} style={{ padding: "8px 16px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "white", fontSize: "13px", fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={crearArea} disabled={savingArea || !nuevaAreaNombre.trim()} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#0C4A6E", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: savingArea ? 0.7 : 1 }}>
                {savingArea ? "Creando…" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
