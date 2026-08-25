/**
 * Primitivos compartidos entre EvalCompPanel y EvalDesempPanel.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

// ── Paleta MF (formaliza colores en uso; no introduce tonos nuevos) ──────────

export const MF = {
  navy:    "#0C4A6E",
  sky:     "#0EA5E9",
  slate:   "#64748B",
  muted:   "#94A3B8",
  surface: "#F8FAFC",
  border:  "#E8EDF2",
  bg:      "#F1F5F9",
} as const;

// ── Constantes de estilo ───────────────────────────────────────────────────────

export const LABEL: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#64748B",
  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px",
};

export const INPUT: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: "14px",
  border: "1.5px solid #E2E8F0", borderRadius: "8px",
  background: "white", color: "#0C4A6E", outline: "none", boxSizing: "border-box",
};

export const TEXTAREA: React.CSSProperties = {
  ...INPUT, resize: "vertical" as const,
};

export const BTN_ADD: React.CSSProperties = {
  alignSelf: "flex-start",
  display: "inline-flex", alignItems: "center", gap: "5px",
  fontSize: "12px", fontWeight: 700,
  color: "#0EA5E9", background: "#F0F9FF",
  border: "1.5px solid #BAE6FD", borderRadius: "8px",
  padding: "6px 12px", cursor: "pointer",
};

export const BTN_REMOVE: React.CSSProperties = {
  padding: "8px", borderRadius: "8px",
  border: "1.5px solid #FEE2E2", background: "#FFF5F5",
  color: "#DC2626", cursor: "pointer", flexShrink: 0,
};

// ── Semáforos ──────────────────────────────────────────────────────────────────

export const SEMAFORO_COMP = (score: number) =>
  score >= 80 ? { label: "Logrado",       bg: "#D1FAE5", color: "#065F46" }
  : score >= 60 ? { label: "En desarrollo", bg: "#FEF3C7", color: "#92400E" }
  :               { label: "Crítico",       bg: "#FEE2E2", color: "#991B1B" };

export const SEMAFORO_DESEMP = (score: number) =>
  score >= 90 ? { label: "Excelente",   bg: "#D1FAE5", color: "#065F46" }
  : score >= 80 ? { label: "Muy Bueno",  bg: "#DCFCE7", color: "#166534" }
  : score >= 70 ? { label: "Bueno",      bg: "#FEF9C3", color: "#854D0E" }
  : score >= 60 ? { label: "Regular",    bg: "#FEF3C7", color: "#92400E" }
  :               { label: "Deficiente", bg: "#FEE2E2", color: "#991B1B" };

// ── FormSection ────────────────────────────────────────────────────────────────

export function FormSection({
  title, children, defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1.5px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ height: "3px", background: "#0C4A6E" }} />
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: "#F8FAFF", border: "none", cursor: "pointer",
          fontSize: "13px", fontWeight: 700, color: "#0C4A6E",
        }}
      >
        {title}
        {open
          ? <ChevronUp  style={{ width: "14px", height: "14px" }} />
          : <ChevronDown style={{ width: "14px", height: "14px" }} />}
      </button>
      {open && (
        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────────

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={LABEL}>{label}</div>
      {children}
    </div>
  );
}

// ── DynList<T> ─────────────────────────────────────────────────────────────────

export type DynLabelDef<T> = {
  field: keyof T;
  label: string;
  type?: "number" | "select" | "textarea";
  options?: string[];
  flex?: number;
  minWidth?: string;
  min?: number;
  max?: number;
};

function DynRow<T extends Record<string, unknown>>({
  row, labels, onCommit, onRemove,
}: {
  row: T;
  labels: DynLabelDef<T>[];
  onCommit: (row: T) => void;
  onRemove: () => void;
}) {
  const [local, setLocal] = useState<T>(row);

  const update = (key: keyof T, val: unknown, immediate: boolean) => {
    const next = { ...local, [key]: val } as T;
    setLocal(next);
    if (immediate) onCommit(next);
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }}>
      {labels.map((l) => (
        <div
          key={String(l.field)}
          style={{
            flex: l.type === "number" ? "0 0 90px" : (l.flex ?? 1),
            minWidth: l.minWidth ?? "120px",
          }}
        >
          <div style={LABEL}>{l.label}</div>
          {l.type === "select" ? (
            <select
              value={String(local[l.field] ?? "")}
              onChange={(e) => update(l.field, e.target.value, true)}
              style={INPUT}
            >
              {(l.options ?? []).map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : l.type === "number" ? (
            <input
              type="number"
              min={l.min}
              max={l.max}
              value={String(local[l.field] ?? "")}
              onChange={(e) => update(l.field, Number(e.target.value), true)}
              style={INPUT}
            />
          ) : l.type === "textarea" ? (
            <textarea
              value={String(local[l.field] ?? "")}
              rows={2}
              onChange={(e) => update(l.field, e.target.value, false)}
              onBlur={() => onCommit(local)}
              style={TEXTAREA}
            />
          ) : (
            <input
              type="text"
              value={String(local[l.field] ?? "")}
              onChange={(e) => update(l.field, e.target.value, false)}
              onBlur={() => onCommit(local)}
              style={INPUT}
            />
          )}
        </div>
      ))}
      <button onClick={onRemove} style={BTN_REMOVE}>
        <Trash2 style={{ width: "13px", height: "13px" }} />
      </button>
    </div>
  );
}

export function DynList<T extends Record<string, unknown>>({
  items, onChange, schema, labels, addLabel = "Agregar",
}: {
  items: T[];
  onChange: (v: T[]) => void;
  schema: T;
  labels: DynLabelDef<T>[];
  addLabel?: string;
}) {
  const [ids, setIds] = useState<string[]>(() => items.map(() => `_${Math.random()}`));

  const add = () => {
    onChange([...items, { ...schema }]);
    setIds((prev) => [...prev, `_new_${Date.now()}`]);
  };
  const remove = (i: number) => {
    onChange(items.filter((_, j) => j !== i));
    setIds((prev) => prev.filter((_, j) => j !== i));
  };
  const commit = (i: number, row: T) =>
    onChange(items.map((r, j) => (j === i ? row : r)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((row, i) => (
        <DynRow<T>
          key={ids[i] ?? i}
          row={row}
          labels={labels}
          onCommit={(newRow) => commit(i, newRow)}
          onRemove={() => remove(i)}
        />
      ))}
      <button onClick={add} style={BTN_ADD}>
        <Plus style={{ width: "12px", height: "12px" }} /> {addLabel}
      </button>
    </div>
  );
}

// ── ScoreCard ──────────────────────────────────────────────────────────────────

export function ScoreCard({
  score, semaforo, label = "Índice",
}: {
  score: number;
  semaforo: { label: string; bg: string; color: string };
  label?: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "16px",
      background: semaforo.bg, border: `1.5px solid ${semaforo.color}30`,
      borderRadius: "12px", padding: "14px 20px",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: semaforo.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
          {label}
        </div>
        <div style={{ height: "8px", background: "rgba(0,0,0,0.08)", borderRadius: "99px", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${Math.min(score, 100)}%`,
            background: semaforo.color, borderRadius: "99px",
            transition: "width 0.4s",
          }} />
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "28px", fontWeight: 900, color: semaforo.color, lineHeight: 1 }}>
          {Math.round(score)}%
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, color: semaforo.color, marginTop: "2px" }}>
          {semaforo.label}
        </div>
      </div>
    </div>
  );
}
