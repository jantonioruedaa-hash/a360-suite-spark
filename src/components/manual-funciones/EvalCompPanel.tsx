import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Plus, Printer, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type {
  Cargo, CompEval, EvalCompForm, FirmasEval, PlanDevRow, ReqRow,
} from "@/types/manual-funciones";
import { EVAL_COMP_BLANK, NIVEL_NUM, NIVEL_SCORE, NIVELES } from "@/types/manual-funciones";
import {
  BTN_ADD, BTN_REMOVE, Field, FormSection, INPUT, LABEL, TEXTAREA,
  ScoreCard, SEMAFORO_COMP,
} from "./eval-shared";

// ── Safe index helpers ─────────────────────────────────────────────────────

const nivNum   = (s: string): number | undefined => (NIVEL_NUM   as Record<string, number>)[s];
const nivScore = (s: string): number | undefined => (NIVEL_SCORE as Record<string, number>)[s];

// ── Init helpers ───────────────────────────────────────────────────────────

function initFromCargo(cargo: Cargo): CompEval[] {
  // nivel_actual: "" deliberado — calcIndice solo promedia competencias con nivel ya
  // asignado, evitando arrastrar el índice antes de que el evaluador las califique.
  return [
    ...cargo.competencias_blandas.map((c) => ({
      nombre: c.nombre, tipo: "blanda" as const,
      nivel_requerido: c.nivel, nivel_actual: "", observacion: "",
    })),
    ...cargo.competencias_tecnicas.map((c) => ({
      nombre: c.nombre, tipo: "tecnica" as const,
      nivel_requerido: c.nivel, nivel_actual: "", observacion: "",
    })),
  ];
}

function initRequisitos(cargo: Cargo): ReqRow[] {
  if (!cargo.requisitos) return [];
  return Object.entries(cargo.requisitos).map(([dim, req]) => ({
    dim, req, act: "", cum: "—",
  }));
}

// ── Calc / parse helpers ───────────────────────────────────────────────────

function calcIndice(f: EvalCompForm): number {
  const rated = f.competencias_evaluadas.filter(
    (c) => nivScore(c.nivel_actual) !== undefined && nivScore(c.nivel_requerido) !== undefined,
  );
  if (!rated.length) return 0;
  return rated.reduce((s, c) => {
    const act = nivScore(c.nivel_actual)!;
    const req = nivScore(c.nivel_requerido)!;
    return s + Math.min((act / req) * 100, 100);
  }, 0) / rated.length;
}

function genPdiFromBrechas(f: EvalCompForm): PlanDevRow[] {
  return f.competencias_evaluadas
    .filter((c) => {
      const r = nivNum(c.nivel_requerido);
      const a = nivNum(c.nivel_actual);
      return r !== undefined && a !== undefined && a < r;
    })
    .map((c) => {
      const gap = nivNum(c.nivel_requerido)! - nivNum(c.nivel_actual)!;
      return {
        prioridad: gap >= 2 ? "Alta" : "Media",
        brecha: c.nombre,
        modalidad: "",   // el evaluador elige — no asumimos modalidad óptima
        detalle: "", proveedor: "", responsable: "",
        fecha_inicio: "", fecha_vencimiento: "",
        avance_pct: 0, evidencia: "",
      };
    });
}

function parseRow(row: Record<string, unknown>): EvalCompForm {
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const frs = row.firmas as FirmasEval | null;
  return {
    nombre_evaluado:        (row.nombre_evaluado     as string) ?? "",
    evaluador:              (row.evaluador           as string) ?? "",
    fecha_evaluacion:       (row.fecha_evaluacion    as string) ?? "",
    proxima_revision:       (row.proxima_revision    as string) ?? "",
    observacion_general:    (row.observacion_general as string) ?? "",
    requisitos_evaluados:   arr<ReqRow>(row.requisitos_evaluados),
    competencias_evaluadas: arr<CompEval>(row.competencias_evaluadas),
    plan_desarrollo:        arr<PlanDevRow>(row.plan_desarrollo),
    firmas: {
      n0: frs?.n0 ?? "", c0: frs?.c0 ?? "", f0: frs?.f0 ?? "",
      n1: frs?.n1 ?? "", c1: frs?.c1 ?? "", f1: frs?.f1 ?? "",
      n2: frs?.n2 ?? "", c2: frs?.c2 ?? "", f2: frs?.f2 ?? "",
    },
    cargo_data_hash: (row.cargo_data_hash as string | undefined),
  };
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

// ── CompRadar — N-axis parametric ──────────────────────────────────────────

function CompRadar({ labels, values }: { labels: string[]; values: number[] }) {
  const N = labels.length;
  if (N < 3 || values.every((v) => v === 0)) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0", color: "#94A3B8", fontSize: "12px" }}>
        {N < 3
          ? "Agrega al menos 3 competencias al cargo para ver el gráfico"
          : "Completa los niveles actuales para ver el gráfico"}
      </div>
    );
  }

  const W = 600, H = 500, cx = 300, cy = 250, R = 150;
  const a0   = -Math.PI / 2;
  const step = (2 * Math.PI) / N;
  const px = (pct: number, i: number) => cx + (pct / 100) * R * Math.cos(a0 + i * step);
  const py = (pct: number, i: number) => cy + (pct / 100) * R * Math.sin(a0 + i * step);

  const gridPolygons = [20, 40, 60, 80, 100].map((g) => (
    <polygon
      key={g}
      points={Array.from({ length: N }, (_, k) =>
        `${px(g, k).toFixed(1)},${py(g, k).toFixed(1)}`
      ).join(" ")}
      fill="none"
      stroke={g === 100 ? "#ccc" : "#eee"}
      strokeWidth={g === 100 ? 1.5 : 1}
    />
  ));

  const axes = Array.from({ length: N }, (_, ai) => (
    <line
      key={ai}
      x1={cx} y1={cy}
      x2={px(100, ai).toFixed(1)} y2={py(100, ai).toFixed(1)}
      stroke="#ddd" strokeWidth={1}
    />
  ));

  const lvls = [20, 40, 60, 80, 100].map((g) => (
    <text
      key={g}
      x={(cx + (g / 100) * R * Math.cos(a0) - 20).toFixed(1)}
      y={(cy + (g / 100) * R * Math.sin(a0) - 4).toFixed(1)}
      fontSize={8} fill="#bbb"
    >
      {g}%
    </text>
  ));

  const actPts = values
    .map((v, i) => `${px(v, i).toFixed(1)},${py(v, i).toFixed(1)}`)
    .join(" ");

  const labelNodes = labels.map((name, li) => {
    const angle  = a0 + li * step;
    const lx     = (cx + (R + 42) * Math.cos(angle)).toFixed(1);
    const ly     = (cy + (R + 42) * Math.sin(angle)).toFixed(1);
    const cosA   = Math.cos(angle);
    const anchor = Math.abs(cosA) < 0.15 ? "middle" : cosA > 0 ? "start" : "end";
    const levelName = NIVELES.find((n) => NIVEL_SCORE[n] === values[li]);
    return (
      <g key={li}>
        <text
          x={lx} y={ly}
          textAnchor={anchor} dominantBaseline="middle"
          fontSize={11} fill="#333" fontFamily="system-ui" fontWeight={700}
        >
          {name.length > 18 ? `${name.slice(0, 16)}…` : name}
        </text>
        <text
          x={lx} y={(parseFloat(ly) + 15).toFixed(1)}
          textAnchor={anchor} dominantBaseline="middle"
          fontSize={12} fill="#0C4A6E" fontFamily="system-ui" fontWeight={900}
        >
          {levelName ?? "—"}
        </text>
      </g>
    );
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxHeight: "280px" }}>
      {gridPolygons}
      {axes}
      {lvls}
      <polygon points={actPts} fill="rgba(29,78,137,0.18)" stroke="#0C4A6E" strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={3} fill="#ccc" />
      {labelNodes}
    </svg>
  );
}

// ── RequisitosTable ────────────────────────────────────────────────────────

function RequisitosTable({
  rows, onChange,
}: {
  rows: ReqRow[];
  onChange: (r: ReqRow[]) => void;
}) {
  if (rows.length === 0) {
    return (
      <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
        Este cargo no tiene requisitos definidos. Agrégalos desde el formulario del cargo.
      </p>
    );
  }

  const update = (i: number, field: keyof ReqRow, val: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [field]: val } : r)));

  return (
    <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #E2E8F0" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr 1fr 100px",
        background: "#0C4A6E", padding: "8px 12px", gap: "10px",
      }}>
        {["Dimensión", "Requisito del cargo", "Situación actual", "Cumple"].map((h) => (
          <span key={h} style={{
            fontSize: "10px", fontWeight: 800,
            color: "rgba(255,255,255,0.7)",
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            {h}
          </span>
        ))}
      </div>
      {rows.map((r, i) => {
        const bgCum =
          r.cum === "Sí"        ? "#D1FAE5"
          : r.cum === "No"      ? "#FEE2E2"
          : r.cum === "Parcial" ? "#FEF3C7"
          : "transparent";
        const fgCum =
          r.cum === "Sí"        ? "#065F46"
          : r.cum === "No"      ? "#991B1B"
          : r.cum === "Parcial" ? "#92400E"
          : "#94A3B8";
        return (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr 1fr 100px",
            gap: "10px", padding: "8px 12px", alignItems: "center",
            background: i % 2 === 0 ? "white" : "#F8FAFF",
            borderTop: "1px solid #E2E8F0",
          }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0C4A6E" }}>
              {r.dim}
            </span>
            <span style={{ fontSize: "12px", color: "#334155" }}>
              {r.req}
            </span>
            <input
              value={r.act}
              onChange={(e) => update(i, "act", e.target.value)}
              style={{ ...INPUT, fontSize: "12px" }}
              placeholder="Perfil real del colaborador…"
            />
            <select
              value={r.cum}
              onChange={(e) => update(i, "cum", e.target.value)}
              style={{ ...INPUT, fontSize: "12px", background: bgCum, color: fgCum, fontWeight: 700 }}
            >
              {["—", "Sí", "No", "Parcial"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        );
      })}
    </div>
  );
}

// ── CompGapRow ─────────────────────────────────────────────────────────────

const GAP_STYLES = {
  ok:      { bg: "#D1FAE5", color: "#065F46", label: "Sin brecha"    },
  medio:   { bg: "#FEF3C7", color: "#92400E", label: "Brecha 1 niv." },
  critico: { bg: "#FEE2E2", color: "#991B1B", label: "Brecha ≥2"     },
  nd:      { bg: "#F1F5F9", color: "#94A3B8", label: "—"             },
};

function CompGapRow({
  comp, idx, onChange,
}: {
  comp: CompEval;
  idx: number;
  onChange: (c: CompEval) => void;
}) {
  const reqN = nivNum(comp.nivel_requerido);
  const actN = nivNum(comp.nivel_actual);
  const diff = reqN !== undefined && actN !== undefined ? reqN - actN : undefined;
  const gapStyle =
    diff === undefined ? GAP_STYLES.nd
    : diff <= 0        ? GAP_STYLES.ok
    : diff === 1       ? GAP_STYLES.medio
    :                    GAP_STYLES.critico;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 80px 130px 130px 100px 1fr",
      gap: "8px", alignItems: "center",
      padding: "8px 10px",
      background: idx % 2 === 0 ? "white" : "#F8FAFF",
      borderRadius: "8px", border: "1px solid #E2E8F0",
    }}>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C4A6E" }}>
        {comp.nombre}
      </span>
      <span style={{
        display: "inline-block", fontSize: "10px", fontWeight: 700,
        padding: "2px 7px", borderRadius: "99px", textAlign: "center",
        background: comp.tipo === "blanda" ? "#D1FAE5" : "#EDE9FE",
        color:      comp.tipo === "blanda" ? "#065F46" : "#5B21B6",
      }}>
        {comp.tipo === "blanda" ? "Blanda" : "Técnica"}
      </span>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
        {comp.nivel_requerido || "—"}
      </span>
      <select
        value={comp.nivel_actual}
        onChange={(e) => onChange({ ...comp, nivel_actual: e.target.value })}
        style={{ ...INPUT, fontSize: "13px" }}
      >
        <option value="">— seleccionar —</option>
        {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <div style={{
        background: gapStyle.bg, color: gapStyle.color,
        fontSize: "10px", fontWeight: 700,
        padding: "3px 8px", borderRadius: "99px", textAlign: "center",
        border: `1px solid ${gapStyle.color}40`,
      }}>
        {gapStyle.label}
      </div>
      <input
        value={comp.observacion}
        onChange={(e) => onChange({ ...comp, observacion: e.target.value })}
        style={{ ...INPUT, fontSize: "12px" }}
        placeholder="Observación…"
      />
    </div>
  );
}

// ── PdiList — 2 filas por entrada ─────────────────────────────────────────

const PDI_PRIORIDADES = ["Alta", "Media", "Baja"];
const PDI_MODALIDADES = ["Curso", "Coaching", "Mentoring", "Práctica", "Capacitación externa", "Lectura", "Workshop", "Otro"];

const PDI_BLANK: PlanDevRow = {
  prioridad: "Media", brecha: "", modalidad: "",
  detalle: "", proveedor: "", responsable: "",
  fecha_inicio: "", fecha_vencimiento: "", avance_pct: 0, evidencia: "",
};

function PdiRow({
  row, onCommit, onRemove,
}: {
  row: PlanDevRow;
  onCommit: (r: PlanDevRow) => void;
  onRemove: () => void;
}) {
  // No useEffect([row]) deliberado: resetearía local mientras el usuario escribe,
  // porque cada setF en el padre crea nuevas referencias de objeto. La integridad
  // se garantiza en PdiList via keys estables (ver useEffect de ids).
  const [local, setLocal] = useState<PlanDevRow>(row);
  const set = (k: keyof PlanDevRow, v: string | number, immediate = false) => {
    const next = { ...local, [k]: v } as PlanDevRow;
    setLocal(next);
    if (immediate) onCommit(next);
  };
  const blur = () => onCommit(local);

  const prioBg    = local.prioridad === "Alta" ? "#FEE2E2" : local.prioridad === "Baja" ? "#D1FAE5" : "#FEF3C7";
  const prioColor = local.prioridad === "Alta" ? "#991B1B" : local.prioridad === "Baja" ? "#065F46" : "#92400E";

  return (
    <div style={{ border: "1.5px solid #E2E8F0", borderRadius: "10px", overflow: "hidden", background: "white" }}>

      {/* ── Fila 1: brecha · prioridad · modalidad · [trash] ── */}
      <div style={{
        display: "flex", gap: "8px", alignItems: "flex-end",
        padding: "10px 12px",
        background: "#F8FAFF", borderBottom: "1px solid #E2E8F0",
      }}>
        <div style={{ flex: 3 }}>
          <div style={LABEL}>Brecha / Competencia</div>
          <input
            value={local.brecha}
            onChange={(e) => set("brecha", e.target.value)}
            onBlur={blur}
            style={INPUT}
            placeholder="Competencia o habilidad a desarrollar…"
          />
        </div>
        <div style={{ flex: "0 0 110px" }}>
          <div style={LABEL}>Prioridad</div>
          <select
            value={local.prioridad}
            onChange={(e) => set("prioridad", e.target.value, true)}
            style={{ ...INPUT, background: prioBg, color: prioColor, fontWeight: 700 }}
          >
            {PDI_PRIORIDADES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ flex: "0 0 190px" }}>
          <div style={LABEL}>Modalidad</div>
          <select
            value={local.modalidad}
            onChange={(e) => set("modalidad", e.target.value, true)}
            style={INPUT}
          >
            <option value="">— seleccionar —</option>
            {PDI_MODALIDADES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button onClick={onRemove} style={{ ...BTN_REMOVE, flexShrink: 0 }}>
          <Trash2 style={{ width: "13px", height: "13px" }} />
        </button>
      </div>

      {/* ── Fila 2: detalle · proveedor · responsable · fechas · avance · evidencia ── */}
      <div style={{
        display: "flex", gap: "8px", alignItems: "flex-end",
        padding: "10px 12px", flexWrap: "wrap",
      }}>
        <div style={{ flex: 3, minWidth: "200px" }}>
          <div style={LABEL}>Acción / Detalle</div>
          <input
            value={local.detalle}
            onChange={(e) => set("detalle", e.target.value)}
            onBlur={blur}
            style={INPUT}
            placeholder="Descripción de la acción…"
          />
        </div>
        <div style={{ flex: 1.5, minWidth: "120px" }}>
          <div style={LABEL}>Proveedor</div>
          <input
            value={local.proveedor}
            onChange={(e) => set("proveedor", e.target.value)}
            onBlur={blur}
            style={INPUT}
            placeholder="Institución…"
          />
        </div>
        <div style={{ flex: 1.5, minWidth: "120px" }}>
          <div style={LABEL}>Responsable</div>
          <input
            value={local.responsable}
            onChange={(e) => set("responsable", e.target.value)}
            onBlur={blur}
            style={INPUT}
            placeholder="Nombre…"
          />
        </div>
        <div style={{ flex: "0 0 130px" }}>
          <div style={LABEL}>Fecha inicio</div>
          <input
            type="date"
            value={local.fecha_inicio}
            onChange={(e) => set("fecha_inicio", e.target.value, true)}
            style={INPUT}
          />
        </div>
        <div style={{ flex: "0 0 130px" }}>
          <div style={LABEL}>Fecha vencimiento</div>
          <input
            type="date"
            value={local.fecha_vencimiento}
            onChange={(e) => set("fecha_vencimiento", e.target.value, true)}
            style={INPUT}
          />
        </div>
        <div style={{ flex: "0 0 80px" }}>
          <div style={LABEL}>Avance %</div>
          <input
            type="number" min={0} max={100}
            value={local.avance_pct}
            onChange={(e) => set("avance_pct", Number(e.target.value), true)}
            style={INPUT}
          />
        </div>
        <div style={{ flex: 2, minWidth: "140px" }}>
          <div style={LABEL}>Evidencia</div>
          <input
            value={local.evidencia}
            onChange={(e) => set("evidencia", e.target.value)}
            onBlur={blur}
            style={INPUT}
            placeholder="Link o descripción…"
          />
        </div>
      </div>
    </div>
  );
}

function PdiList({
  items, onChange,
}: {
  items: PlanDevRow[];
  onChange: (v: PlanDevRow[]) => void;
}) {
  const [ids, setIds] = useState<string[]>(() => items.map(() => `_${Math.random()}`));

  // Sincroniza ids cuando items crece o decrece desde fuera (ej: genPdiFromBrechas
  // hace setF con un array más largo — sin esto las filas nuevas caerían a key=index).
  useEffect(() => {
    setIds((prev) => {
      if (prev.length === items.length) return prev;
      if (items.length > prev.length) {
        const extra = Array.from(
          { length: items.length - prev.length },
          () => `_${Math.random()}`,
        );
        return [...prev, ...extra];
      }
      return prev.slice(0, items.length);
    });
  }, [items.length]);

  const add = () => {
    onChange([...items, { ...PDI_BLANK }]);
    setIds((p) => [...p, `_${Date.now()}`]);
  };
  const remove = (i: number) => {
    onChange(items.filter((_, j) => j !== i));
    setIds((p) => p.filter((_, j) => j !== i));
  };
  const commit = (i: number, r: PlanDevRow) =>
    onChange(items.map((x, j) => (j === i ? r : x)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((row, i) => (
        <PdiRow
          key={ids[i] ?? i}
          row={row}
          onCommit={(r) => commit(i, r)}
          onRemove={() => remove(i)}
        />
      ))}
      <button onClick={add} style={BTN_ADD}>
        <Plus style={{ width: "12px", height: "12px" }} /> Agregar acción de desarrollo
      </button>
    </div>
  );
}

// ── FirmasPanel ────────────────────────────────────────────────────────────

function FirmasPanel({
  firmas, onChange,
}: {
  firmas: FirmasEval;
  onChange: (f: FirmasEval) => void;
}) {
  const set = (k: keyof FirmasEval, v: string) => onChange({ ...firmas, [k]: v });
  const firmantes: Array<{
    label: string;
    n: keyof FirmasEval;
    c: keyof FirmasEval;
    f: keyof FirmasEval;
  }> = [
    { label: "Firmante 1 — Colaborador",      n: "n0", c: "c0", f: "f0" },
    { label: "Firmante 2 — Evaluador / Jefe", n: "n1", c: "c1", f: "f1" },
    { label: "Firmante 3 — RRHH",             n: "n2", c: "c2", f: "f2" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
      {firmantes.map(({ label, n, c, f }) => (
        <div key={String(n)} style={{
          display: "flex", flexDirection: "column", gap: "10px",
          padding: "14px",
          border: "1.5px solid #E2E8F0", borderRadius: "10px",
          background: "#FAFBFF",
        }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "#0C4A6E", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {label}
          </div>
          <Field label="Nombre completo">
            <input
              value={firmas[n]}
              onChange={(e) => set(n, e.target.value)}
              style={INPUT} placeholder="Nombre…"
            />
          </Field>
          <Field label="Cargo / Función">
            <input
              value={firmas[c]}
              onChange={(e) => set(c, e.target.value)}
              style={INPUT} placeholder="Cargo…"
            />
          </Field>
          <Field label="Fecha">
            <input
              type="date"
              value={firmas[f]}
              onChange={(e) => set(f, e.target.value)}
              style={INPUT}
            />
          </Field>
        </div>
      ))}
    </div>
  );
}

// ── PDF export ─────────────────────────────────────────────────────────────

function buildCompRadarSVG(labels: string[], values: number[]): string {
  const N = labels.length;
  if (N < 3) return `<p style="text-align:center;color:#94A3B8;font-size:12px;padding:16px 0">Se requieren al menos 3 competencias para mostrar el gráfico.</p>`;
  const SCORE_TO_NIVEL: Record<number, string> = { 25: "Básico", 50: "Intermedio", 75: "Avanzado", 100: "Experto" };
  const W = 600, H = 500, cx = 300, cy = 250, R = 150;
  const a0 = -Math.PI / 2;
  const step = (2 * Math.PI) / N;
  const px = (pct: number, i: number) => cx + (pct / 100) * R * Math.cos(a0 + i * step);
  const py = (pct: number, i: number) => cy + (pct / 100) * R * Math.sin(a0 + i * step);
  const gridPolygons = [20, 40, 60, 80, 100].map((g) => {
    const pts = Array.from({ length: N }, (_, k) => `${px(g, k).toFixed(1)},${py(g, k).toFixed(1)}`).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="${g === 100 ? "#ccc" : "#eee"}" stroke-width="${g === 100 ? 1.5 : 1}"/>`;
  }).join("");
  const axes = Array.from({ length: N }, (_, ai) =>
    `<line x1="${cx}" y1="${cy}" x2="${px(100, ai).toFixed(1)}" y2="${py(100, ai).toFixed(1)}" stroke="#ddd" stroke-width="1"/>`
  ).join("");
  const lvls = [20, 40, 60, 80, 100].map((g) =>
    `<text x="${(cx + (g / 100) * R * Math.cos(a0) - 20).toFixed(1)}" y="${(cy + (g / 100) * R * Math.sin(a0) - 4).toFixed(1)}" font-size="8" fill="#bbb">${g}%</text>`
  ).join("");
  const actPts = values.map((v, i) => `${px(v, i).toFixed(1)},${py(v, i).toFixed(1)}`).join(" ");
  const labelNodes = labels.map((name, li) => {
    const angle = a0 + li * step;
    const lx = (cx + (R + 42) * Math.cos(angle)).toFixed(1);
    const ly = (cy + (R + 42) * Math.sin(angle)).toFixed(1);
    const anchor = Math.abs(Math.cos(angle)) < 0.15 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
    const displayName = name.length > 16 ? `${name.slice(0, 16)}…` : name;
    const levelName = SCORE_TO_NIVEL[values[li]] ?? "—";
    return `<g>
      <text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-size="11" fill="#333" font-family="system-ui" font-weight="700">${displayName}</text>
      <text x="${lx}" y="${(parseFloat(ly) + 15).toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="12" fill="#0C4A6E" font-family="system-ui" font-weight="900">${levelName}</text>
    </g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:280px">
    ${gridPolygons}${axes}${lvls}
    <polygon points="${actPts}" fill="rgba(29,78,137,0.18)" stroke="#0C4A6E" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="3" fill="#ccc"/>
    ${labelNodes}
  </svg>`;
}

function buildEvalCompHTML(
  cargo: Cargo,
  form: EvalCompForm,
  indice: number,
  empresaNombre: string,
): string {
  const esc = (s: string | null | undefined) =>
    (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const fmtD = (iso: string | null | undefined) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return iso; }
  };
  const sem = SEMAFORO_COMP(indice);
  const sec = (title: string, body: string) =>
    `<div class="sec"><div class="sec-head">${title}</div><div class="sec-body">${body}</div></div>`;
  const pair = (label: string, val: string) =>
    `<div class="pair"><div class="pl">${label}</div><div class="pv">${esc(val) || "—"}</div></div>`;

  // 1. Datos de la evaluación
  const datos = `<div class="grid2">
    ${pair("Colaborador evaluado", form.nombre_evaluado)}
    ${pair("Evaluador", form.evaluador)}
    ${pair("Fecha de evaluación", fmtD(form.fecha_evaluacion))}
    ${pair("Próxima revisión", fmtD(form.proxima_revision))}
    ${pair("Cargo", cargo.cargo)}
    ${pair("Área", cargo.area)}
  </div>`;

  // 2. Requisitos del cargo
  const cumBadge = (cum: string) => {
    const s = cum === "Sí"      ? "background:#D1FAE5;color:#065F46"
      : cum === "No"            ? "background:#FEE2E2;color:#991B1B"
      : cum === "Parcial"       ? "background:#FEF3C7;color:#92400E"
      :                           "background:#F1F5F9;color:#94A3B8";
    return `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;${s}">${esc(cum) || "—"}</span>`;
  };
  const requisitos = !form.requisitos_evaluados.length
    ? `<p class="empty">Este cargo no tiene requisitos definidos.</p>`
    : `<table class="ktable">
        <thead><tr><th>Dimensión</th><th>Requisito del cargo</th><th>Situación actual</th><th style="text-align:center">Cumple</th></tr></thead>
        <tbody>${form.requisitos_evaluados.map((r) =>
          `<tr>
            <td style="font-weight:700;color:#0C4A6E">${esc(r.dim) || "—"}</td>
            <td>${esc(r.req) || "—"}</td>
            <td>${esc(r.act) || "—"}</td>
            <td style="text-align:center">${cumBadge(r.cum)}</td>
          </tr>`
        ).join("")}</tbody>
      </table>`;

  // 3. Análisis de competencias (GAP)
  const NLVL = NIVEL_NUM as Record<string, number>;
  const gapBadge = (c: CompEval) => {
    const diff = NLVL[c.nivel_requerido] !== undefined && NLVL[c.nivel_actual] !== undefined
      ? NLVL[c.nivel_requerido] - NLVL[c.nivel_actual] : undefined;
    const gs = diff === undefined ? { bg: "#F1F5F9", fg: "#94A3B8", lbl: "—" }
      : diff <= 0  ? { bg: "#D1FAE5", fg: "#065F46", lbl: "Sin brecha" }
      : diff === 1 ? { bg: "#FEF3C7", fg: "#92400E", lbl: "Brecha 1 niv." }
      :              { bg: "#FEE2E2", fg: "#991B1B", lbl: "Brecha ≥2" };
    return `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${gs.bg};color:${gs.fg};border:1px solid ${gs.fg}40">${gs.lbl}</span>`;
  };
  const competencias = !form.competencias_evaluadas.length
    ? `<p class="empty">Este cargo no tiene competencias definidas.</p>`
    : `<table class="ktable">
        <thead><tr><th>Competencia</th><th>Tipo</th><th>Nivel requerido</th><th>Nivel actual</th><th style="text-align:center">Brecha</th><th>Observación</th></tr></thead>
        <tbody>${form.competencias_evaluadas.map((c) => {
          const tipoBadge = c.tipo === "blanda"
            ? `<span style="background:#D1FAE5;color:#065F46;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">Blanda</span>`
            : `<span style="background:#EDE9FE;color:#5B21B6;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">Técnica</span>`;
          return `<tr>
            <td style="font-weight:600;color:#0C4A6E">${esc(c.nombre)}</td>
            <td>${tipoBadge}</td>
            <td style="color:#64748B">${esc(c.nivel_requerido) || "—"}</td>
            <td style="font-weight:700">${esc(c.nivel_actual) || "—"}</td>
            <td style="text-align:center">${gapBadge(c)}</td>
            <td>${esc(c.observacion) || "—"}</td>
          </tr>`;
        }).join("")}</tbody>
      </table>`;

  // 4. Resultados (índice, desglose, radar) — solo si indice > 0
  const hasScore = indice > 0;
  const NSCR = NIVEL_SCORE as Record<string, number>;
  const radarLabels = form.competencias_evaluadas.map((c) => c.nombre);
  const radarValues = form.competencias_evaluadas.map((c) => NSCR[c.nivel_actual] ?? 0);
  const calcAvg = (tipo: "blanda" | "tecnica") => {
    const subset = form.competencias_evaluadas.filter((c) => c.tipo === tipo);
    const rated  = subset.filter((c) => NSCR[c.nivel_actual] !== undefined && NSCR[c.nivel_requerido] !== undefined);
    return {
      count: subset.length,
      avg:   rated.length
        ? Math.round(rated.reduce((s, c) => s + Math.min((NSCR[c.nivel_actual] / NSCR[c.nivel_requerido]) * 100, 100), 0) / rated.length)
        : 0,
    };
  };
  const blandas  = calcAvg("blanda");
  const tecnicas = calcAvg("tecnica");
  const resultadosBlock = hasScore
    ? `<div style="display:flex;align-items:center;gap:16px;background:${sem.bg};border:1px solid ${sem.color}40;border-radius:10px;padding:14px 20px;margin-bottom:14px">
        <div style="font-size:40px;font-weight:900;color:${sem.color}">${Math.round(indice)}%</div>
        <div>
          <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.1em">Índice Global de Competencias</div>
          <div style="font-size:18px;font-weight:800;color:${sem.color}">${sem.label}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 14px">
          <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Blandas · ${blandas.count} competencias</div>
          <div style="font-size:20px;font-weight:900;color:#0C4A6E">${blandas.count ? `${blandas.avg}%` : "—"}</div>
        </div>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 14px">
          <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Técnicas · ${tecnicas.count} competencias</div>
          <div style="font-size:20px;font-weight:900;color:#0C4A6E">${tecnicas.count ? `${tecnicas.avg}%` : "—"}</div>
        </div>
      </div>
      <div style="border:1.5px solid #E2E8F0;border-radius:10px;padding:14px 18px;background:white">
        <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Perfil de Competencias</div>
        ${buildCompRadarSVG(radarLabels, radarValues)}
      </div>`
    : "";

  // 5. Observación general
  const obsBlock = form.observacion_general
    ? `<div style="font-size:13px;color:#334155;line-height:1.75;white-space:pre-wrap;background:#F8FAFC;border-radius:8px;padding:12px 14px;border:1px solid #E2E8F0">${esc(form.observacion_general)}</div>`
    : `<p class="empty">Sin observaciones registradas.</p>`;

  // 6. Plan de Desarrollo Individual (PDI)
  const prioBadge = (p: string) => {
    const s = p === "Alta" ? "background:#FEE2E2;color:#991B1B"
      : p === "Baja"       ? "background:#D1FAE5;color:#065F46"
      :                      "background:#FEF3C7;color:#92400E";
    return `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;${s}">${esc(p)}</span>`;
  };
  const pdiBlock = !form.plan_desarrollo.length
    ? `<p class="empty">Sin plan de desarrollo registrado.</p>`
    : `<table class="ktable">
        <thead><tr>
          <th>Prior.</th><th>Brecha</th><th>Modalidad</th><th>Acción</th>
          <th>Proveedor</th><th>Responsable</th><th>Inicio</th><th>Vence</th>
          <th style="text-align:center">Av.%</th><th>Evidencia</th>
        </tr></thead>
        <tbody>${form.plan_desarrollo.map((p) =>
          `<tr>
            <td>${prioBadge(p.prioridad)}</td>
            <td style="font-weight:600">${esc(p.brecha) || "—"}</td>
            <td>${esc(p.modalidad) || "—"}</td>
            <td>${esc(p.detalle) || "—"}</td>
            <td>${esc(p.proveedor) || "—"}</td>
            <td>${esc(p.responsable) || "—"}</td>
            <td>${fmtD(p.fecha_inicio)}</td>
            <td>${fmtD(p.fecha_vencimiento)}</td>
            <td style="text-align:center;font-weight:700;color:#0C4A6E">${p.avance_pct ?? 0}%</td>
            <td>${esc(p.evidencia) || "—"}</td>
          </tr>`
        ).join("")}</tbody>
      </table>`;

  // 7. Firmas
  const firmasBlock = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
    ${([
      { label: "Firmante 1 — Colaborador",      n: form.firmas.n0, c: form.firmas.c0, f: form.firmas.f0 },
      { label: "Firmante 2 — Evaluador / Jefe", n: form.firmas.n1, c: form.firmas.c1, f: form.firmas.f1 },
      { label: "Firmante 3 — RRHH",             n: form.firmas.n2, c: form.firmas.c2, f: form.firmas.f2 },
    ]).map(({ label, n, c, f }) =>
      `<div style="text-align:center;padding:14px;border:1.5px solid #E2E8F0;border-radius:10px;background:#FAFBFF">
        <div style="font-size:9px;font-weight:800;color:#0C4A6E;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px">${label}</div>
        <div style="height:44px;border-bottom:2px solid #0C4A6E;margin-bottom:7px"></div>
        <div style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Firma</div>
        ${n ? `<div style="font-size:12px;font-weight:700;color:#0C4A6E;margin-top:4px">${esc(n)}</div>` : ""}
        ${c ? `<div style="font-size:11px;color:#64748B;margin-top:2px">${esc(c)}</div>` : ""}
        ${f ? `<div style="font-size:11px;color:#94A3B8;margin-top:2px">${fmtD(f)}</div>` : ""}
      </div>`
    ).join("")}
  </div>`;

  const n = hasScore;
  const fecha = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
  const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#F8FAFC;color:#1E293B;font-size:13px;line-height:1.6}
.topbar{position:sticky;top:0;background:white;border-bottom:1px solid #E2E8F0;padding:10px 24px;display:flex;align-items:center;justify-content:space-between}
.topbar button{padding:8px 20px;background:#0C4A6E;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer}
.topbar button:hover{background:#0A3D5C}
.doc{max-width:900px;margin:0 auto;padding:32px 24px 60px}
.dh{text-align:center;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #0C4A6E}
.empresa{font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.12em;margin-bottom:5px}
.ctitle-main{font-size:26px;font-weight:900;color:#0C4A6E;letter-spacing:-.02em;margin-bottom:5px}
.cmeta{font-size:12px;color:#64748B}
.sec{margin-bottom:18px;border-radius:10px;border:1.5px solid #E8EDF2}
.sec-head{background:#0C4A6E;color:white;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;padding:7px 16px;break-after:avoid;page-break-after:avoid}
.sec-body{padding:16px;background:white;border-radius:0 0 10px 10px}
.grid2{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px 14px}
.pair{background:#F8FAFC;border-radius:7px;padding:8px 11px;border:1px solid #E8EDF2}
.pl{font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px}
.pv{font-size:13px;color:#1E293B}
.empty{color:#CBD5E1;font-size:13px;font-style:italic}
.ktable{width:100%;border-collapse:collapse;font-size:11px}
.ktable th{background:#0C4A6E;color:white;padding:6px 8px;font-size:9px;font-weight:800;text-transform:uppercase;text-align:left}
.ktable td{padding:6px 8px;border-bottom:1px solid #E2E8F0;color:#334155;vertical-align:top;break-inside:avoid;page-break-inside:avoid}
.ktable tr:last-child td{border-bottom:none}
.footer{margin-top:28px;font-size:10px;color:#94A3B8;text-align:center}
@page{size:A4 landscape;margin:12mm}
@media print{
  .topbar{display:none!important}
  body{background:white}
  .doc{padding:0 0 8px;max-width:100%}
  .footer{margin-top:10px}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
}`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>Evaluación de Competencias — ${esc(form.nombre_evaluado)} — ${esc(cargo.cargo)}</title>
<style>${css}</style></head>
<body>
<div class="topbar">
  <span style="font-size:14px;font-weight:800;color:#0C4A6E">Evaluación de Competencias — ${esc(cargo.cargo)}</span>
  <button onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
</div>
<div class="doc">
  <div class="dh">
    ${empresaNombre ? `<div class="empresa">${esc(empresaNombre)}</div>` : ""}
    <div class="ctitle-main">${esc(cargo.cargo)}</div>
    <div class="cmeta">Evaluación de Competencias y PDI${form.nombre_evaluado ? ` · ${esc(form.nombre_evaluado)}` : ""}${form.fecha_evaluacion ? ` · ${fmtD(form.fecha_evaluacion)}` : ""}</div>
    ${hasScore ? `<div style="margin-top:10px;display:inline-block;background:${sem.bg};border:1px solid ${sem.color}40;border-radius:8px;padding:4px 18px;font-size:14px;font-weight:800;color:${sem.color}">${Math.round(indice)}% · ${sem.label}</div>` : ""}
  </div>
  ${sec("1. Datos de la evaluación", datos)}
  ${sec("2. Requisitos del cargo", requisitos)}
  ${sec("3. Análisis de competencias", competencias)}
  ${n ? sec("4. Resultados", resultadosBlock) : ""}
  ${sec(`${n ? "5" : "4"}. Observación general`, obsBlock)}
  ${sec(`${n ? "6" : "5"}. Plan de Desarrollo Individual — PDI`, pdiBlock)}
  ${sec(`${n ? "7" : "6"}. Firmas`, firmasBlock)}
  <div class="footer">Generado el ${fecha}${empresaNombre ? ` · ${esc(empresaNombre)}` : ""}</div>
</div>
</body></html>`;
}

// ── Main component ─────────────────────────────────────────────────────────

type EvalRec = Record<string, unknown> & { id: string };

export function EvalCompPanel({
  cargo, userRolEmpresa, onClose, empresaNombre = "",
}: {
  cargo: Cargo;
  userRolEmpresa: string | null;
  onClose: () => void;
  empresaNombre?: string;
}) {
  const [evals, setEvals]               = useState<EvalRec[]>([]);
  const [loadingEvals, setLoadingEvals] = useState(true);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [form, setForm]                 = useState<EvalCompForm>({
    ...EVAL_COMP_BLANK,
    fecha_evaluacion:       new Date().toISOString().slice(0, 10),
    requisitos_evaluados:   initRequisitos(cargo),
    competencias_evaluadas: initFromCargo(cargo),
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string; fecha: string } | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const { role } = useAuth();
  const canDelete = role === "admin" || role === "consultor" || userRolEmpresa === "dueño";

  const setF = <K extends keyof EvalCompForm>(k: K, v: EvalCompForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    (supabase as any)
      .from("manual_funciones_evaluaciones")
      .select("*")
      .eq("cargo_id", cargo.id)
      .order("fecha_evaluacion", { ascending: false })
      .then(({ data }: { data: EvalRec[] | null }) => {
        setEvals(data ?? []);
        setLoadingEvals(false);
      });
  }, [cargo.id]);

  function nuevaEval() {
    setEditingId(null);
    setForm({
      ...EVAL_COMP_BLANK,
      fecha_evaluacion:       new Date().toISOString().slice(0, 10),
      requisitos_evaluados:   initRequisitos(cargo),
      competencias_evaluadas: initFromCargo(cargo),
    });
  }

  function cargarEval(row: EvalRec) {
    setEditingId(row.id);
    setForm(parseRow(row));
  }

  async function eliminarEval(id: string) {
    setDeleting(true);
    const { data: deleted, error } = await (supabase as any)
      .from("manual_funciones_evaluaciones")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) { toast.error("Error al eliminar la evaluación"); setDeleting(false); return; }
    if (!deleted || deleted.length === 0) {
      toast.error("No tienes permiso para eliminar esta evaluación");
      setDeleting(false);
      return;
    }
    setEvals((prev) => prev.filter((x) => x.id !== id));
    if (editingId === id) nuevaEval();
    setDeleteTarget(null);
    setDeleting(false);
    toast.success("Evaluación eliminada");
  }

  async function guardar() {
    if (!form.nombre_evaluado.trim()) {
      toast.error("El nombre del colaborador es obligatorio");
      return;
    }
    setSaving(true);
    const indice = calcIndice(form);
    const sem    = SEMAFORO_COMP(indice);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      cargo_id:               cargo.id,
      consultor_id:           userRolEmpresa === "consultor" ? (user?.id ?? null) : null,
      nombre_evaluado:        form.nombre_evaluado,
      evaluador:              form.evaluador           || null,
      fecha_evaluacion:       form.fecha_evaluacion    || null,
      proxima_revision:       form.proxima_revision    || null,
      observacion_general:    form.observacion_general || null,
      requisitos_evaluados:   form.requisitos_evaluados,
      competencias_evaluadas: form.competencias_evaluadas,
      plan_desarrollo:        form.plan_desarrollo,
      firmas:                 form.firmas,
      indice_global:          Math.round(indice * 100) / 100,
      semaforo:               sem.label,
      cargo_data_hash:        form.cargo_data_hash ?? null,
    };

    if (editingId) {
      const { data, error } = await (supabase as any)
        .from("manual_funciones_evaluaciones")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      if (error) { toast.error("Error al actualizar"); setSaving(false); return; }
      setEvals((prev) => prev.map((e) => (e.id === editingId ? data as EvalRec : e)));
      toast.success("Evaluación actualizada");
    } else {
      const { data, error } = await (supabase as any)
        .from("manual_funciones_evaluaciones")
        .insert(payload)
        .select()
        .single();
      if (error) { toast.error("Error al guardar"); setSaving(false); return; }
      const saved = data as EvalRec;
      setEvals((prev) => [saved, ...prev]);
      setEditingId(saved.id);
      toast.success("Evaluación de competencias guardada");
    }
    setSaving(false);
  }

  // ── Derived render values ──────────────────────────────────────────────

  const indice = calcIndice(form);
  const sem    = SEMAFORO_COMP(indice);
  const f      = form;

  function handlePrint() {
    const html = buildEvalCompHTML(cargo, f, indice, empresaNombre);
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `eval-competencias-${f.nombre_evaluado.replace(/\s+/g, "-")}-${cargo.cargo.replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const radarLabels = f.competencias_evaluadas.map((c) => c.nombre);
  const radarValues = f.competencias_evaluadas.map((c) => nivScore(c.nivel_actual) ?? 0);

  const desgloseCards = (["blanda", "tecnica"] as const).map((tipo) => {
    const subset = f.competencias_evaluadas.filter((c) => c.tipo === tipo);
    const rated  = subset.filter(
      (c) => nivScore(c.nivel_actual) !== undefined && nivScore(c.nivel_requerido) !== undefined,
    );
    const avg = rated.length
      ? rated.reduce((s, c) => {
          const act = nivScore(c.nivel_actual)!;
          const req = nivScore(c.nivel_requerido)!;
          return s + Math.min((act / req) * 100, 100);
        }, 0) / rated.length
      : 0;
    return {
      label: tipo === "blanda" ? "Blandas" : "Técnicas",
      avg:   Math.round(avg),
      count: subset.length,
    };
  });

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ background: "#F8FAFF", minHeight: "100%", display: "flex", flexDirection: "column" }}>

      {/* Sticky top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, background: "white",
        borderBottom: "1px solid #E2E8F0",
        display: "flex", alignItems: "center", gap: "12px", padding: "12px 24px",
      }}>
        <button
          onClick={onClose}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "13px", fontWeight: 600, color: "#64748B",
            background: "#F1F5F9", border: "none", borderRadius: "8px",
            padding: "7px 14px", cursor: "pointer", flexShrink: 0,
          }}
        >
          <ArrowLeft style={{ width: "13px", height: "13px" }} /> Volver al cargo
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {cargo.cargo}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#0C4A6E" }}>
            Evaluación de Competencias y PDI
          </div>
        </div>

        {indice > 0 && (
          <div style={{
            background: sem.bg, border: `1px solid ${sem.color}40`,
            borderRadius: "8px", padding: "4px 12px",
            fontSize: "13px", fontWeight: 800, color: sem.color, flexShrink: 0,
          }}>
            {Math.round(indice)}% · {sem.label}
          </div>
        )}

        <button
          onClick={handlePrint}
          disabled={!f.nombre_evaluado.trim()}
          title={!f.nombre_evaluado.trim() ? "Completa el nombre del colaborador para exportar" : "Descargar como HTML/PDF"}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", borderRadius: "8px", border: "none",
            background: f.nombre_evaluado.trim() ? "#DCFCE7" : "#F1F5F9",
            color:      f.nombre_evaluado.trim() ? "#16A34A" : "#CBD5E1",
            fontSize: "13px", fontWeight: 700,
            cursor: f.nombre_evaluado.trim() ? "pointer" : "not-allowed",
            flexShrink: 0,
          }}
        >
          <Printer style={{ width: "13px", height: "13px" }} />
          Imprimir
        </button>

        <button
          onClick={guardar}
          disabled={saving}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "8px 20px", borderRadius: "8px", border: "none",
            background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)",
            color: "white", fontSize: "13px", fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
            flexShrink: 0,
          }}
        >
          <Check style={{ width: "13px", height: "13px" }} />
          {saving ? "Guardando…" : editingId ? "Actualizar" : "Guardar evaluación"}
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "24px", maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Historial */}
        <FormSection title={`Historial de evaluaciones (${loadingEvals ? "…" : evals.length})`} defaultOpen>
          {loadingEvals ? (
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>Cargando…</p>
          ) : evals.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>Sin evaluaciones previas para este cargo.</p>
          ) : (
            <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #E2E8F0" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "130px 1fr 130px 90px 120px",
                background: "#0C4A6E", padding: "8px 12px", gap: "10px",
              }}>
                {["Fecha", "Colaborador", "Próx. revisión", "Índice", ""].map((h) => (
                  <span key={h} style={{
                    fontSize: "10px", fontWeight: 800,
                    color: "rgba(255,255,255,0.7)",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>{h}</span>
                ))}
              </div>
              {evals.map((e, i) => {
                const isActive = e.id === editingId;
                const esem     = SEMAFORO_COMP(Number(e.indice_global ?? 0));
                return (
                  <div key={e.id} style={{
                    display: "grid", gridTemplateColumns: "130px 1fr 130px 90px 120px",
                    gap: "10px", padding: "9px 12px", alignItems: "center",
                    background: isActive ? "#EFF6FF" : i % 2 === 0 ? "white" : "#F8FAFF",
                    borderTop: "1px solid #E2E8F0",
                  }}>
                    <span style={{ fontSize: "12px", color: "#0C4A6E", fontWeight: 600 }}>
                      {fmtDate(e.fecha_evaluacion as string)}
                    </span>
                    <span style={{ fontSize: "13px", color: "#334155" }}>
                      {(e.nombre_evaluado as string) || "—"}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      {fmtDate(e.proxima_revision as string | null)}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: esem.color }}>
                      {e.indice_global != null ? `${Math.round(Number(e.indice_global))}%` : "—"}
                    </span>
                    {isActive ? (
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#1D4ED8", background: "#DBEAFE", border: "1px solid #93C5FD", borderRadius: "6px", padding: "4px 10px" }}>
                        Activa
                      </span>
                    ) : (
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <button
                          onClick={() => cargarEval(e)}
                          style={{ fontSize: "12px", fontWeight: 700, color: "#0EA5E9", background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: "6px", padding: "4px 10px", cursor: "pointer" }}
                        >
                          Cargar
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget({ id: e.id, nombre: (e.nombre_evaluado as string) || "—", fecha: fmtDate(e.fecha_evaluacion as string) })}
                            title="Eliminar evaluación"
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "4px 6px", borderRadius: "6px", border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", cursor: "pointer" }}
                          >
                            <Trash2 style={{ width: "13px", height: "13px" }} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: "4px" }}>
            <button onClick={nuevaEval} style={BTN_ADD}>
              <Plus style={{ width: "12px", height: "12px" }} /> Nueva evaluación
            </button>
          </div>
        </FormSection>

        {/* Datos */}
        <FormSection title="Datos de la evaluación">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Colaborador evaluado *">
              <input
                value={f.nombre_evaluado}
                onChange={(e) => setF("nombre_evaluado", e.target.value)}
                style={INPUT} placeholder="Nombre completo"
              />
            </Field>
            <Field label="Evaluador">
              <input
                value={f.evaluador}
                onChange={(e) => setF("evaluador", e.target.value)}
                style={INPUT} placeholder="Nombre del evaluador"
              />
            </Field>
            <Field label="Fecha de evaluación">
              <input
                type="date" value={f.fecha_evaluacion}
                onChange={(e) => setF("fecha_evaluacion", e.target.value)}
                style={INPUT}
              />
            </Field>
            <Field label="Próxima revisión">
              <input
                type="date" value={f.proxima_revision}
                onChange={(e) => setF("proxima_revision", e.target.value)}
                style={INPUT}
              />
            </Field>
          </div>
        </FormSection>

        {/* Requisitos del cargo */}
        <FormSection title="Requisitos del cargo" defaultOpen={false}>
          <RequisitosTable
            rows={f.requisitos_evaluados}
            onChange={(rows) => setF("requisitos_evaluados", rows)}
          />
        </FormSection>

        {/* Análisis de competencias */}
        <FormSection title={`Análisis de competencias (${f.competencias_evaluadas.length})`}>
          {f.competencias_evaluadas.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
              Este cargo no tiene competencias definidas. Agrégalas desde el formulario del cargo.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 130px 130px 100px 1fr",
                gap: "8px", padding: "6px 10px",
              }}>
                {["Competencia", "Tipo", "Nivel requerido", "Nivel actual", "Brecha", "Observación"].map((h) => (
                  <div key={h} style={{ ...LABEL, marginBottom: 0 }}>{h}</div>
                ))}
              </div>
              {f.competencias_evaluadas.map((comp, i) => (
                <CompGapRow
                  key={i} idx={i} comp={comp}
                  onChange={(c) =>
                    setF("competencias_evaluadas",
                      f.competencias_evaluadas.map((r, j) => (j === i ? c : r)),
                    )
                  }
                />
              ))}
            </div>
          )}
        </FormSection>

        {/* Índice global + radar + desglose — solo si hay al menos una competencia evaluada */}
        {indice > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <ScoreCard
              score={indice}
              semaforo={sem}
              label="Índice Global de Competencias"
            />
            <div style={{
              background: "white", border: "1.5px solid #E2E8F0",
              borderRadius: "12px", padding: "16px 20px",
            }}>
              <div style={{
                fontSize: "11px", fontWeight: 700, color: "#94A3B8",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px",
              }}>
                Perfil de Competencias
              </div>
              <CompRadar labels={radarLabels} values={radarValues} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {desgloseCards.map(({ label, avg, count }) => (
                <div key={label} style={{
                  background: "white", border: "1px solid #E2E8F0",
                  borderRadius: "8px", padding: "10px 14px",
                }}>
                  <div style={{
                    fontSize: "10px", fontWeight: 700, color: "#94A3B8",
                    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px",
                  }}>
                    {label} · {count} {count === 1 ? "competencia" : "competencias"}
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#0C4A6E" }}>
                    {count ? `${avg}%` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observación general */}
        <FormSection title="Observación general" defaultOpen={false}>
          <Field label="Comentarios y apreciación del evaluador">
            <textarea
              value={f.observacion_general}
              onChange={(e) => setF("observacion_general", e.target.value)}
              rows={4} style={TEXTAREA}
              placeholder="Síntesis de la evaluación, fortalezas, oportunidades de mejora…"
            />
          </Field>
        </FormSection>

        {/* Plan de Desarrollo Individual */}
        <FormSection
          title={`Plan de Desarrollo Individual — PDI (${f.plan_desarrollo.length} acciones)`}
          defaultOpen={false}
        >
          <div style={{ marginBottom: "8px" }}>
            <button
              onClick={() => {
                const gen = genPdiFromBrechas(f);
                if (!gen.length) {
                  toast("Sin brechas detectadas — completa los niveles actuales primero");
                  return;
                }
                setF("plan_desarrollo", [...f.plan_desarrollo, ...gen]);
                toast.success(
                  `${gen.length} acción${gen.length > 1 ? "es" : ""} generada${gen.length > 1 ? "s" : ""} desde brechas`,
                );
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "12px", fontWeight: 700,
                color: "#7C3AED", background: "#F5F3FF",
                border: "1.5px solid #DDD6FE", borderRadius: "8px",
                padding: "6px 12px", cursor: "pointer",
              }}
            >
              <Sparkles style={{ width: "12px", height: "12px" }} /> Generar desde brechas
            </button>
          </div>
          <PdiList
            items={f.plan_desarrollo}
            onChange={(v) => setF("plan_desarrollo", v)}
          />
        </FormSection>

        {/* Firmas */}
        <FormSection title="Firmas" defaultOpen={false}>
          <FirmasPanel
            firmas={f.firmas}
            onChange={(frs) => setF("firmas", frs)}
          />
        </FormSection>

      </div>

      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: "14px", padding: "28px 32px", maxWidth: "420px", width: "100%", margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "#1E293B", marginBottom: "10px" }}>¿Eliminar evaluación?</div>
            <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px", lineHeight: 1.6 }}>
              <strong>{deleteTarget.nombre}</strong> — {deleteTarget.fecha}<br />
              Esta acción no se puede deshacer.
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "white", color: "#64748B", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={() => eliminarEval(deleteTarget.id)} disabled={deleting} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#DC2626", color: "white", fontSize: "13px", fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
