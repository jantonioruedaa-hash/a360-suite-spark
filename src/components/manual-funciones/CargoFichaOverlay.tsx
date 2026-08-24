import { useCallback, useEffect, useRef, useState } from "react";
import { X, Loader2, Plus, Trash2, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Cargo, Funcion, Competencia } from "@/types/manual-funciones";
import { NIVELES } from "@/types/manual-funciones";
import { getAreaColor, getAreaIcon } from "./area-palette";
import { EvalDesempPanel } from "./EvalDesempPanel";
import { EvalCompPanel } from "./EvalCompPanel";


// KPI type extended with optional formula (not in base Cargo KPI type)
type KpiRow = { nombre: string; meta: string; frecuencia: string; formula: string };

// ── Display helpers ────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  return m && y ? `${m}/${y}` : iso;
}

function parseMmYyyy(s: string): string | null {
  const [m, y] = s.split("/");
  if (!m || !y || y.length !== 4) return null;
  return `${y}-${m.padStart(2, "0")}-01`;
}

const NIVEL_COLORS: Record<string, { bg: string; color: string }> = {
  "Básico":     { bg: "#F1F5F9", color: "#475569" },
  "Intermedio": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Avanzado":   { bg: "#DCFCE7", color: "#15803D" },
  "Experto":    { bg: "#EDE9FE", color: "#7C3AED" },
};

const CONDICIONES_LABELS: Record<string, string> = {
  horario:   "Horario",
  modalidad: "Modalidad de trabajo",
  viajes:    "Viajes",
  esfuerzo:  "Esfuerzo / Demanda",
};

const CONDICIONES_ORDER = ["horario", "modalidad", "viajes", "esfuerzo"] as const;

// ── Shared edit-input styles ───────────────────────────────────────────────────

const INPUT_BASE: React.CSSProperties = {
  fontSize: "13px", color: "#1E293B", background: "transparent",
  border: "none", outline: "none", fontFamily: "inherit",
  borderBottom: "1px dashed #CBD5E1", width: "100%", padding: "2px 0",
};

const TEXTAREA_BASE: React.CSSProperties = {
  ...INPUT_BASE,
  fontSize: "14px", lineHeight: 1.8, resize: "none" as const,
  borderBottom: "none", border: "1px dashed #CBD5E1",
  borderRadius: "6px", padding: "8px", display: "block",
};

// ── Small shared atoms ─────────────────────────────────────────────────────────

function SectionEmpty({ label }: { label: string }) {
  return <p style={{ color: "#CBD5E1", fontSize: "13px", fontStyle: "italic", margin: 0 }}>{label}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>
      {children}
    </h3>
  );
}

function SecBlock({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: accent, flexShrink: 0 }} />
        <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.14em", margin: 0 }}>
          {title}
        </h3>
        <div style={{ flex: 1, height: "1px", background: "#F1F5F9" }} />
      </div>
      {children}
    </section>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        fontSize: "12px", fontWeight: 600, color: "#64748B",
        background: "#F8FAFC", border: "1px dashed #CBD5E1",
        borderRadius: "8px", padding: "5px 12px", cursor: "pointer",
        marginTop: "8px",
      }}
    >
      <Plus style={{ width: "12px", height: "12px" }} /> {label}
    </button>
  );
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "24px", height: "24px", borderRadius: "6px", flexShrink: 0,
        background: "none", border: "none", cursor: "pointer", color: "#CBD5E1",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#CBD5E1"; }}
    >
      <Trash2 style={{ width: "14px", height: "14px" }} />
    </button>
  );
}

// ── Section renderers ──────────────────────────────────────────────────────────

type SecProps = { cargo: Cargo; onChange: (u: Partial<Cargo>) => void };

function SecIdentificacion({ cargo, onChange }: SecProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "18px 24px" }}>
      {/* Cargo name */}
      <div style={{ gridColumn: "1 / -1" }}>
        <Label>Nombre del cargo</Label>
        <input style={INPUT_BASE} value={cargo.cargo} onChange={(e) => onChange({ cargo: e.target.value })} />
      </div>
      <Pair label="Código">
        <input style={INPUT_BASE} value={cargo.codigo ?? ""} onChange={(e) => onChange({ codigo: e.target.value || null })} />
      </Pair>
      <Pair label="Versión">
        <input style={INPUT_BASE} value={cargo.version ?? ""} onChange={(e) => onChange({ version: e.target.value || null })} />
      </Pair>
      <Pair label="Estado">
        <select
          style={{ ...INPUT_BASE, cursor: "pointer" }}
          value={cargo.estado ?? "vigente"}
          onChange={(e) => onChange({ estado: e.target.value })}
        >
          <option value="vigente">Vigente</option>
          <option value="inactivo">Inactivo</option>
          <option value="en_revision">En revisión</option>
        </select>
      </Pair>
      <Pair label="Vacante">
        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "#1E293B" }}>
          <input
            type="checkbox"
            checked={cargo.vacante ?? false}
            onChange={(e) => onChange({ vacante: e.target.checked })}
            style={{ width: "14px", height: "14px" }}
          />
          {cargo.vacante ? "Sí" : "No"}
        </label>
      </Pair>
      <Pair label="Jefe inmediato">
        <input style={INPUT_BASE} value={cargo.jefe_inmediato ?? ""} onChange={(e) => onChange({ jefe_inmediato: e.target.value || null })} />
      </Pair>
      <Pair label="Fecha elaboración (MM/AAAA)">
        <input
          style={INPUT_BASE}
          placeholder="05/2026"
          value={fmtDate(cargo.fecha_elaboracion)}
          onChange={(e) => onChange({ fecha_elaboracion: parseMmYyyy(e.target.value) })}
        />
      </Pair>
      <Pair label="Fecha revisión (MM/AAAA)">
        <input
          style={INPUT_BASE}
          placeholder="05/2026"
          value={fmtDate(cargo.fecha_revision)}
          onChange={(e) => onChange({ fecha_revision: parseMmYyyy(e.target.value) })}
        />
      </Pair>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
      {children}
    </div>
  );
}

function Pair({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SecObjetivo({ cargo, onChange }: SecProps) {
  return (
    <textarea
      style={{ ...TEXTAREA_BASE, minHeight: "120px", width: "100%", boxSizing: "border-box" }}
      value={cargo.objetivo ?? ""}
      placeholder="Describe el objetivo principal del cargo…"
      onChange={(e) => onChange({ objetivo: e.target.value || null })}
    />
  );
}

function SecFunciones({ cargo, onChange }: SecProps) {
  const funciones = cargo.funciones ?? [];

  const update = (i: number, patch: Partial<Funcion>) => {
    onChange({ funciones: funciones.map((f, idx) => idx === i ? { ...f, ...patch } : f) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {funciones.length === 0 && <SectionEmpty label="Sin funciones — agrega la primera." />}
      {funciones.map((f, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 12px", background: "#F8FAFC",
          borderRadius: "8px", border: "1px solid #E2E8F0",
        }}>
          <span style={{ fontSize: "13px", color: "#94A3B8", flexShrink: 0, minWidth: "20px" }}>{i + 1}.</span>
          <input
            style={{ ...INPUT_BASE, flex: 1 }}
            value={f.descripcion}
            placeholder="Descripción de la función…"
            onChange={(e) => update(i, { descripcion: e.target.value })}
          />
          <input
            type="number"
            min={0} max={100}
            style={{ ...INPUT_BASE, width: "50px", textAlign: "right" }}
            value={f.porcentaje_tiempo || ""}
            placeholder="%"
            onChange={(e) => update(i, { porcentaje_tiempo: Number(e.target.value) })}
          />
          <span style={{ fontSize: "11px", color: "#94A3B8", flexShrink: 0 }}>%</span>
          <DelBtn onClick={() => onChange({ funciones: funciones.filter((_, idx) => idx !== i) })} />
        </div>
      ))}
      <AddBtn label="Agregar función" onClick={() => onChange({ funciones: [...funciones, { descripcion: "", porcentaje_tiempo: 0 }] })} />
    </div>
  );
}

function SecCompetencias({ cargo, onChange }: SecProps) {
  const blandas  = cargo.competencias_blandas ?? [];
  const tecnicas = cargo.competencias_tecnicas ?? [];

  const CompList = ({
    items, title, field,
  }: {
    items: Competencia[];
    title: string;
    field: "competencias_blandas" | "competencias_tecnicas";
  }) => (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {items.map((c, i) => {
          const { bg } = NIVEL_COLORS[c.nivel] ?? { bg: "#F1F5F9" };
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "6px 12px", background: "#F8FAFC",
              borderRadius: "8px", border: "1px solid #E2E8F0",
            }}>
              <input
                style={{ ...INPUT_BASE, flex: 1 }}
                value={c.nombre}
                placeholder="Nombre de competencia…"
                onChange={(e) => {
                  const updated = items.map((x, idx) => idx === i ? { ...x, nombre: e.target.value } : x);
                  onChange({ [field]: updated });
                }}
              />
              <select
                style={{ fontSize: "11px", fontWeight: 700, background: bg, border: "none", borderRadius: "20px", padding: "2px 8px", cursor: "pointer", flexShrink: 0 }}
                value={c.nivel}
                onChange={(e) => {
                  const updated = items.map((x, idx) => idx === i ? { ...x, nivel: e.target.value } : x);
                  onChange({ [field]: updated });
                }}
              >
                {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <DelBtn onClick={() => onChange({ [field]: items.filter((_, idx) => idx !== i) })} />
            </div>
          );
        })}
        <AddBtn label="Agregar" onClick={() => onChange({ [field]: [...items, { nombre: "", nivel: "Básico" }] })} />
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <CompList items={blandas}  title="Competencias blandas"   field="competencias_blandas" />
      <CompList items={tecnicas} title="Competencias técnicas"  field="competencias_tecnicas" />
    </div>
  );
}

function SecKpis({ cargo, onChange }: SecProps) {
  const kpis = (cargo.kpis ?? []) as KpiRow[];

  const update = (i: number, patch: Partial<KpiRow>) => {
    onChange({ kpis: kpis.map((k, idx) => idx === i ? { ...k, ...patch } : k) as typeof cargo.kpis });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {kpis.length === 0 && <SectionEmpty label="Sin KPIs — agrega el primero." />}
      {kpis.map((k, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
          alignItems: "center", gap: "8px",
          padding: "8px 12px", background: "#F8FAFC",
          borderRadius: "8px", border: "1px solid #E2E8F0",
        }}>
          <input style={INPUT_BASE} value={k.nombre} placeholder="Indicador…" onChange={(e) => update(i, { nombre: e.target.value })} />
          <input style={INPUT_BASE} value={k.meta}   placeholder="Meta…"      onChange={(e) => update(i, { meta: e.target.value })} />
          <input style={INPUT_BASE} value={k.frecuencia} placeholder="Frecuencia…" onChange={(e) => update(i, { frecuencia: e.target.value })} />
          <input style={INPUT_BASE} value={k.formula ?? ""} placeholder="Fórmula…" onChange={(e) => update(i, { formula: e.target.value })} />
          <DelBtn onClick={() => onChange({ kpis: kpis.filter((_, idx) => idx !== i) as typeof cargo.kpis })} />
        </div>
      ))}
      {kpis.length === 0 || (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", paddingLeft: "12px" }}>
          {["Indicador", "Meta", "Frecuencia", "Fórmula", ""].map((h) => (
            <span key={h} style={{ fontSize: "10px", fontWeight: 700, color: "#CBD5E1", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>
      )}
      <AddBtn label="Agregar KPI" onClick={() => onChange({ kpis: [...kpis, { nombre: "", meta: "", frecuencia: "", formula: "" }] as typeof cargo.kpis })} />
    </div>
  );
}

function TagListEditor({
  items, placeholder, onChange: onChangeItems,
}: {
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChangeItems([...items, v]);
    setDraft("");
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
        {items.map((item, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            fontSize: "12px", padding: "3px 10px 3px 10px",
            borderRadius: "20px", background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#334155",
          }}>
            {item}
            <button
              onClick={() => onChangeItems(items.filter((_, idx) => idx !== i))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#CBD5E1", lineHeight: 1, padding: 0 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#CBD5E1"; }}
            >×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <input
          style={{ ...INPUT_BASE, flex: 1 }}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { if (draft.trim()) add(); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button
          onClick={add}
          style={{
            display: "flex", alignItems: "center", fontSize: "11px", fontWeight: 600,
            color: "#64748B", background: "#F1F5F9", border: "none", borderRadius: "6px",
            padding: "3px 8px", cursor: "pointer",
          }}
        >
          <Plus style={{ width: "12px", height: "12px" }} />
        </button>
      </div>
    </div>
  );
}

function SecRelaciones({ cargo, onChange }: SecProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <SectionTitle>Supervisa a</SectionTitle>
        <TagListEditor items={cargo.supervisa_a ?? []} placeholder="Agregar cargo supervisado…" onChange={(v) => onChange({ supervisa_a: v })} />
      </div>
      <div>
        <SectionTitle>Relaciones internas</SectionTitle>
        <TagListEditor items={cargo.relaciones_internas ?? []} placeholder="Agregar relación interna…" onChange={(v) => onChange({ relaciones_internas: v })} />
      </div>
      <div>
        <SectionTitle>Relaciones externas</SectionTitle>
        <TagListEditor items={cargo.relaciones_externas ?? []} placeholder="Agregar relación externa…" onChange={(v) => onChange({ relaciones_externas: v })} />
      </div>
    </div>
  );
}

function SecCondiciones({ cargo, onChange }: SecProps) {
  const cond = cargo.condiciones ?? {};
  const extraEntries = Object.entries(cond).filter(
    ([k]) => !CONDICIONES_ORDER.includes(k as typeof CONDICIONES_ORDER[number]),
  );

  const set = (key: string, val: string) =>
    onChange({ condiciones: { ...cond, [key]: val } });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "18px 24px" }}>
      {CONDICIONES_ORDER.map((k) => (
        <Pair key={k} label={CONDICIONES_LABELS[k]}>
          <textarea
            style={{ ...TEXTAREA_BASE, minHeight: "72px" }}
            value={cond[k] ?? ""}
            placeholder={`${CONDICIONES_LABELS[k]}…`}
            onChange={(e) => set(k, e.target.value)}
          />
        </Pair>
      ))}
      {extraEntries.map(([k]) => (
        <Pair key={k} label={k}>
          <textarea
            style={{ ...TEXTAREA_BASE, minHeight: "72px" }}
            value={cond[k] ?? ""}
            onChange={(e) => set(k, e.target.value)}
          />
        </Pair>
      ))}
    </div>
  );
}

function SecPlanCarrera({ cargo, onChange }: SecProps) {
  return (
    <textarea
      style={{ ...TEXTAREA_BASE, minHeight: "140px", width: "100%", boxSizing: "border-box" }}
      value={cargo.plan_carrera ?? ""}
      placeholder="Describe las posibles rutas de carrera para este cargo…"
      onChange={(e) => onChange({ plan_carrera: e.target.value || null })}
    />
  );
}

function SecFirmas({ cargo, onChange }: SecProps) {
  const boxes = [
    {
      line: "Elaborado por",
      value: cargo.elaborado_por ?? "",
      onEdit: (v: string) => onChange({ elaborado_por: v || null }),
    },
    {
      // Hardcoded as in original HTML — no DB field for "revisado por RRHH"
      line: "Revisado por · RRHH",
      value: "Coordinador de RRHH",
      onEdit: undefined,
    },
    {
      line: "Aprobado por",
      value: cargo.aprobado_por ?? "",
      onEdit: (v: string) => onChange({ aprobado_por: v || null }),
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
      {boxes.map((b) => (
        <div key={b.line} style={{
          textAlign: "center", padding: "20px 16px",
          background: "white", borderRadius: "10px", border: "1px solid #E2E8F0",
        }}>
          <div style={{ height: "60px" }} />
          <div style={{
            borderTop: "2px solid #0C4A6E", paddingTop: "10px",
            fontSize: "10px", color: "#94A3B8", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            {b.line}
          </div>
          {b.onEdit ? (
            <input
              style={{
                ...INPUT_BASE,
                fontSize: "13px", fontWeight: 700, color: "#0C4A6E",
                textAlign: "center", marginTop: "5px",
              }}
              value={b.value}
              onChange={(e) => b.onEdit!(e.target.value)}
            />
          ) : (
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E", marginTop: "5px" }}>
              {b.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── CargoFichaOverlay ──────────────────────────────────────────────────────────

type Props = {
  clienteId: string;
  cargoId: string;
  areaName: string;
  colorIdx: number;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  iframeActive: boolean;
  userRolEmpresa: string | null;
  onClose: () => void;
  onEvalOpen: () => void;
};

export function CargoFichaOverlay({ clienteId, cargoId, areaName, colorIdx, iframeRef, iframeActive, userRolEmpresa, onClose, onEvalOpen }: Props) {
  const [localCargo, setLocalCargo] = useState<Cargo | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [lastSaved, setLastSaved]   = useState<Date | null>(null);
  const [closing, setClosing]       = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [showEvalDesemp, setShowEvalDesemp] = useState(false);
  const [showEvalComp,   setShowEvalComp]   = useState(false);

  const saveTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingEditsRef = useRef<Partial<Cargo>>({});

  const { dot, bg, border } = getAreaColor(colorIdx);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLocalCargo(null);
    pendingEditsRef.current = {};
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }

    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("manual_funciones_cargos")
        .select("*")
        .eq("id", cargoId)
        .single();
      if (cancelled) return;
      setLocalCargo(data as Cargo ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [cargoId]);

  // ── Save machinery ─────────────────────────────────────────────────────────

  const executeSave = useCallback(async (edits: Partial<Cargo>) => {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("manual_funciones_cargos")
        .update({ ...edits, updated_at: new Date().toISOString() })
        .eq("id", cargoId);
      if (error) throw error;
      setLastSaved(new Date());
    } catch (err) {
      toast.error("Error al guardar: " + (err instanceof Error ? err.message : String(err)));
      throw err;
    } finally {
      setSaving(false);
      setHasPending(false);
    }
  }, [cargoId]);

  const scheduleAutoSave = useCallback((edits: Partial<Cargo>) => {
    pendingEditsRef.current = { ...pendingEditsRef.current, ...edits };
    setHasPending(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const toSave = pendingEditsRef.current;
      pendingEditsRef.current = {};
      saveTimerRef.current = null;
      await executeSave(toSave);
    }, 800);
  }, [executeSave]);

  // Exposed so Part 3 (eval bridge) can call it before sending MF_OPEN_EVAL
  const flushAndGetFreshCargo = useCallback(async (): Promise<Cargo> => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    const pending = pendingEditsRef.current;
    const freshCargo: Cargo = { ...localCargo!, ...pending };
    if (Object.keys(pending).length > 0) {
      pendingEditsRef.current = {};
      await executeSave(pending);
    }
    return freshCargo;
  }, [localCargo, executeSave]);

  // Flush pending edits if overlay is closed while a timer is running
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        const toSave = pendingEditsRef.current;
        if (Object.keys(toSave).length > 0) {
          // Fire-and-forget: best-effort save on unmount
          executeSave(toSave).catch(() => { /* already toasted inside executeSave */ });
        }
      }
    };
  }, [executeSave]);

  // ── Field change handler ───────────────────────────────────────────────────

  const handleChange = useCallback((updates: Partial<Cargo>) => {
    setLocalCargo((prev) => prev ? { ...prev, ...updates } : prev);
    scheduleAutoSave(updates);
  }, [scheduleAutoSave]);

  // ── Safe close: flush pending edits, then unmount ─────────────────────────

  const handleClose = useCallback(async () => {
    setClosing(true);
    try {
      await flushAndGetFreshCargo();
    } catch {
      // executeSave already showed a toast; close anyway so user isn't trapped
    }
    onClose();
  }, [flushAndGetFreshCargo, onClose]);

  // ── Open HTML evaluation pane via iframe bridge ───────────────────────────

  const handleOpenEval = useCallback(async (evalType: "competencias" | "desempeno") => {
    try {
      const freshCargo = await flushAndGetFreshCargo();

      // renderCargoHTML in the HTML editor expects field names and types from
      // supabaseToHtml(), not the raw Supabase/Cargo shape. Convert inline:
      //   jefe_inmediato → jefe, elaborado_por → elaborado, aprobado_por → aprobado
      //   funciones: [{descripcion,porcentaje_tiempo}] → string[]  (% not shown in HTML)
      //   kpis: frecuencia → freq
      //   dates: ISO → MM/YYYY
      const htmlCargo = {
        ...freshCargo,
        jefe:      freshCargo.jefe_inmediato ?? "",
        elaborado: freshCargo.elaborado_por  ?? "",
        aprobado:  freshCargo.aprobado_por   ?? "",
        fecha_elaboracion: fmtDate(freshCargo.fecha_elaboracion),
        fecha_revision:    fmtDate(freshCargo.fecha_revision),
        funciones: (freshCargo.funciones ?? []).map((f) => f.descripcion),
        kpis: (freshCargo.kpis ?? []).map((k) => {
          const row = k as KpiRow;
          return { nombre: row.nombre, meta: row.meta, freq: row.frecuencia, formula: row.formula ?? "" };
        }),
      };

      iframeRef.current?.contentWindow?.postMessage(
        { type: "MF_OPEN_EVAL", clienteId, cargoId, evalType, cargoData: htmlCargo },
        { targetOrigin: window.location.origin },
      );
      onEvalOpen();
    } catch {
      // executeSave already showed a toast; do NOT open the iframe
    }
  }, [flushAndGetFreshCargo, iframeRef, clienteId, cargoId, onEvalOpen]);

  const handleOpenEvalDesemp = useCallback(async () => {
    try {
      await flushAndGetFreshCargo();
      setShowEvalDesemp(true);
    } catch {
      // executeSave already showed a toast
    }
  }, [flushAndGetFreshCargo]);

  const handleOpenEvalComp = useCallback(async () => {
    try {
      await flushAndGetFreshCargo();
      setShowEvalComp(true);
    } catch {
      // executeSave already showed a toast
    }
  }, [flushAndGetFreshCargo]);

  // ── Escape to close ────────────────────────────────────────────────────────

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && !iframeActive) { void handleClose(); }
  }, [handleClose, iframeActive]);

  useEffect(() => {
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const icon = getAreaIcon(areaName);

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, left: "16rem",
      zIndex: 40, background: "#F8FAFC",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>

      {showEvalComp && localCargo ? (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <EvalCompPanel
            cargo={localCargo}
            userRolEmpresa={userRolEmpresa}
            onClose={() => setShowEvalComp(false)}
          />
        </div>
      ) : showEvalDesemp && localCargo ? (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <EvalDesempPanel
            cargo={localCargo}
            userRolEmpresa={userRolEmpresa}
            onClose={() => setShowEvalDesemp(false)}
          />
        </div>
      ) : (<>

      {/* ── Sticky header ── */}
      <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", flexShrink: 0 }}>

        {/* Row 1: area pill + save status + close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px 0" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            fontSize: "12px", fontWeight: 600,
            background: bg, border: `1px solid ${border}`, borderRadius: "20px",
            padding: "3px 10px", color: dot,
          }}>
            {icon} {areaName}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {(saving || lastSaved) && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#94A3B8" }}>
                {saving
                  ? <><Save style={{ width: "12px", height: "12px" }} className="animate-spin" /> Guardando…</>
                  : <><Check style={{ width: "12px", height: "12px", color: "#22C55E" }} /> Guardado {lastSaved!.toLocaleTimeString()}</>
                }
              </span>
            )}
            <button
              onClick={() => { void flushAndGetFreshCargo(); }}
              disabled={!hasPending || saving}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                fontSize: "12px", fontWeight: 600,
                padding: "4px 12px", borderRadius: "6px", border: "none",
                cursor: hasPending && !saving ? "pointer" : "default",
                background: hasPending && !saving ? "#0C4A6E" : "#F1F5F9",
                color:      hasPending && !saving ? "white"   : "#94A3B8",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (hasPending && !saving) (e.currentTarget as HTMLButtonElement).style.background = "#0A3D5C"; }}
              onMouseLeave={(e) => { if (hasPending && !saving) (e.currentTarget as HTMLButtonElement).style.background = "#0C4A6E"; }}
            >
              <Save style={{ width: "12px", height: "12px" }} />
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              onClick={() => { void handleClose(); }}
              disabled={closing}
              aria-label="Cerrar ficha"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "30px", height: "30px", borderRadius: "8px",
                background: "#F1F5F9", border: "none",
                cursor: closing ? "default" : "pointer", color: "#64748B",
                opacity: closing ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { if (!closing) (e.currentTarget as HTMLButtonElement).style.background = "#E2E8F0"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9"; }}
            >
              {closing
                ? <Loader2 style={{ width: "15px", height: "15px" }} className="animate-spin" />
                : <X style={{ width: "16px", height: "16px" }} />
              }
            </button>
          </div>
        </div>

        {/* Row 2: cargo title + badges + eval buttons */}
        <div style={{ padding: "6px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#0C4A6E", margin: 0, letterSpacing: "-0.02em" }}>
              {loading ? "…" : (localCargo?.cargo ?? "—")}
            </h2>
            {!loading && localCargo?.vacante && (
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "#FEF9C3", color: "#854D0E" }}>
                Vacante
              </span>
            )}
            {!loading && localCargo?.estado && localCargo.estado !== "vigente" && (
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "#F1F5F9", color: "#64748B" }}>
                {localCargo.estado}
              </span>
            )}
          </div>
          {/* Eval buttons — visible once cargo is loaded; disabled while closing */}
          {!loading && localCargo && (
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button
                disabled={closing}
                onClick={() => { void handleOpenEvalComp(); }}
                style={{
                  fontSize: "11px", fontWeight: 700,
                  padding: "5px 12px", borderRadius: "8px", cursor: closing ? "default" : "pointer",
                  background: "#EDE9FE", color: "#7C3AED", border: "1px solid #DDD6FE",
                  opacity: closing ? 0.5 : 1, whiteSpace: "nowrap",
                }}
              >
                Evaluación Competencias / PDI
              </button>
              <button
                disabled={closing}
                onClick={() => { void handleOpenEvalDesemp(); }}
                style={{
                  fontSize: "11px", fontWeight: 700,
                  padding: "5px 12px", borderRadius: "8px", cursor: closing ? "default" : "pointer",
                  background: "#E0F2FE", color: "#0284C7", border: "1px solid #BAE6FD",
                  opacity: closing ? 0.5 : 1, whiteSpace: "nowrap",
                }}
              >
                Evaluación Desempeño
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
            <Loader2 style={{ width: "28px", height: "28px", color: "#94A3B8" }} className="animate-spin" />
          </div>
        ) : !localCargo ? (
          <p style={{ color: "#94A3B8", fontSize: "14px" }}>No se pudo cargar el cargo.</p>
        ) : (
          <>
            <SecBlock title="Identificación"        accent={dot}><SecIdentificacion cargo={localCargo} onChange={handleChange} /></SecBlock>
            <SecBlock title="Objetivo del cargo"    accent={dot}><SecObjetivo       cargo={localCargo} onChange={handleChange} /></SecBlock>
            <SecBlock title="Funciones"             accent={dot}><SecFunciones      cargo={localCargo} onChange={handleChange} /></SecBlock>
            <SecBlock title="Competencias"          accent={dot}><SecCompetencias   cargo={localCargo} onChange={handleChange} /></SecBlock>
            <SecBlock title="KPIs"                  accent={dot}><SecKpis           cargo={localCargo} onChange={handleChange} /></SecBlock>
            <SecBlock title="Relaciones"            accent={dot}><SecRelaciones     cargo={localCargo} onChange={handleChange} /></SecBlock>
            <SecBlock title="Condiciones laborales" accent={dot}><SecCondiciones    cargo={localCargo} onChange={handleChange} /></SecBlock>
            <SecBlock title="Plan de carrera"       accent={dot}><SecPlanCarrera    cargo={localCargo} onChange={handleChange} /></SecBlock>
            <SecBlock title="Firmas"                accent={dot}><SecFirmas         cargo={localCargo} onChange={handleChange} /></SecBlock>
          </>
        )}
      </div>

      </>)}
    </div>
  );
}
