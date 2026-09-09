import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type {
  Cargo, CompScore, EvalDesempForm, KpiScore, ObjetivoRow, PlanMejoraRow,
} from "@/types/manual-funciones";
import { CONDUCTUALES_FIJAS, EVAL_DESEMP_BLANK } from "@/types/manual-funciones";
import {
  BTN_ADD, DynList, Field, FormSection, INPUT, LABEL, TEXTAREA,
  ScoreCard, SEMAFORO_DESEMP,
  type DynLabelDef,
} from "./eval-shared";

// ── Constants ──────────────────────────────────────────────────────────────────

const OBJ_LABELS: DynLabelDef<ObjetivoRow>[] = [
  { field: "objetivo",     label: "Objetivo",    flex: 3 },
  { field: "peso",         label: "Peso %",       type: "number", min: 0, max: 100, minWidth: "72px" },
  { field: "resultado",    label: "Resultado",    flex: 2 },
  { field: "calificacion", label: "Cal. (1-5)",   type: "number", min: 1, max: 5, minWidth: "80px" },
  { field: "observacion",  label: "Observación",  flex: 2 },
];

const MEJORA_LABELS: DynLabelDef<PlanMejoraRow>[] = [
  { field: "area",        label: "Área" },
  { field: "accion",      label: "Acción",      flex: 2 },
  { field: "recurso",     label: "Recurso" },
  { field: "plazo",       label: "Plazo",       minWidth: "110px" },
  { field: "responsable", label: "Responsable" },
];

const SECTION_WEIGHTS = [
  { label: "KPIs",         key: "kpi"  as const, peso: "30%" },
  { label: "Competencias", key: "comp" as const, peso: "25%" },
  { label: "Conductuales", key: "cond" as const, peso: "30%" },
  { label: "Objetivos",    key: "obj"  as const, peso: "15%" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function initKpiScores(cargo: Cargo): KpiScore[] {
  return cargo.kpis.map((k) => ({ nombre: k.nombre, resultado: "", calificacion: 0, observacion: "" }));
}

function initCompScores(cargo: Cargo): CompScore[] {
  return [
    ...cargo.competencias_blandas.map((c) => ({ nombre: c.nombre, calificacion: 0, observacion: "" })),
    ...cargo.competencias_tecnicas.map((c) => ({ nombre: c.nombre, calificacion: 0, observacion: "" })),
  ];
}

function initCondScores(): CompScore[] {
  return CONDUCTUALES_FIJAS.map((nombre) => ({ nombre, calificacion: 0, observacion: "" }));
}

function calcDesemp(f: EvalDesempForm) {
  const pct = (scores: { calificacion: number }[], fixedN?: number) => {
    const len = fixedN ?? scores.length;
    if (!len) return 0;
    return (scores.reduce((s, x) => s + x.calificacion, 0) / (len * 5)) * 100;
  };
  const kpi  = pct(f.kpi_scores);
  const comp = pct(f.comp_scores);
  const cond = pct(f.cond_scores, CONDUCTUALES_FIJAS.length);
  const obj  = pct(f.objetivos);
  return {
    total: kpi * 0.30 + comp * 0.25 + cond * 0.30 + obj * 0.15,
    kpi, comp, cond, obj,
  };
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function parseRow(row: Record<string, unknown>): EvalDesempForm {
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    nombre_evaluado:       (row.nombre_evaluado as string)       ?? "",
    evaluador:             (row.evaluador as string)             ?? "",
    fecha_evaluacion:      (row.fecha_evaluacion as string)      ?? "",
    periodo:               (row.periodo as string)               ?? "",
    kpi_scores:            arr<KpiScore>(row.kpi_scores),
    comp_scores:           arr<CompScore>(row.comp_scores),
    cond_scores:           arr<CompScore>(row.cond_scores),
    objetivos:             arr<ObjetivoRow>(row.objetivos),
    observacion_evaluado:  (row.observacion_evaluado as string)  ?? "",
    observacion_evaluador: (row.observacion_evaluador as string) ?? "",
    observacion_rrhh:      (row.observacion_rrhh as string)      ?? "",
    plan_mejora:           arr<PlanMejoraRow>(row.plan_mejora),
    firma_rrhh:            (row.firma_rrhh as string)            ?? "",
    fecha_firma:           (row.fecha_firma as string)           ?? "",
  };
}

// ── DesempRadar ────────────────────────────────────────────────────────────────
// SVG radar de 4 ejes basado en drawEvdRadar() del HTML original.
// Pesos: KPIs 30% · Competencias 25% · Conductuales 30% · Objetivos 15%

function DesempRadar({ kpi, comp, cond, obj }: {
  kpi: number;
  comp: number;
  cond: number;
  obj: number;
}) {
  const vals = [kpi, comp, cond, obj];
  if (vals.every((v) => v === 0)) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0", color: "#94A3B8", fontSize: "12px" }}>
        Completa las secciones para ver el gráfico
      </div>
    );
  }

  const N = 4, W = 600, H = 500, cx = 300, cy = 250, R = 170;
  const a0 = -Math.PI / 2;
  const step = (2 * Math.PI) / N;
  const px = (pct: number, i: number) => cx + (pct / 100) * R * Math.cos(a0 + i * step);
  const py = (pct: number, i: number) => cy + (pct / 100) * R * Math.sin(a0 + i * step);

  const gridPolygons = [20, 40, 60, 80, 100].map((g) => {
    const pts = Array.from({ length: N }, (_, k) =>
      `${px(g, k).toFixed(1)},${py(g, k).toFixed(1)}`
    ).join(" ");
    return (
      <polygon key={g} points={pts} fill="none"
        stroke={g === 100 ? "#ccc" : "#eee"}
        strokeWidth={g === 100 ? 1.5 : 1} />
    );
  });

  const axes = Array.from({ length: N }, (_, ai) => (
    <line key={ai}
      x1={cx} y1={cy}
      x2={px(100, ai).toFixed(1)} y2={py(100, ai).toFixed(1)}
      stroke="#ddd" strokeWidth={1} />
  ));

  const lvls = [20, 40, 60, 80, 100].map((g) => (
    <text key={g}
      x={(cx + (g / 100) * R * Math.cos(a0) - 22).toFixed(1)}
      y={(cy + (g / 100) * R * Math.sin(a0) - 4).toFixed(1)}
      fontSize={8} fill="#bbb">{g}%</text>
  ));

  const actPts = vals
    .map((v, i) => `${px(v, i).toFixed(1)},${py(v, i).toFixed(1)}`)
    .join(" ");

  const AXIS_LABELS = [
    "KPIs (30%)",
    "Competencias (25%)",
    "Conductuales (30%)",
    "Objetivos (15%)",
  ];

  const labelNodes = AXIS_LABELS.map((name, li) => {
    const angle = a0 + li * step;
    const lx = (cx + (R + 40) * Math.cos(angle)).toFixed(1);
    const ly = (cy + (R + 40) * Math.sin(angle)).toFixed(1);
    const cosA = Math.cos(angle);
    const anchor = Math.abs(cosA) < 0.15 ? "middle" : cosA > 0 ? "start" : "end";
    const vTxt = `${Math.round(vals[li])}%`;
    return (
      <g key={li}>
        <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
          fontSize={12} fill="#333" fontFamily="system-ui" fontWeight={700}>
          {name}
        </text>
        <text x={lx} y={(parseFloat(ly) + 16).toFixed(1)} textAnchor={anchor}
          dominantBaseline="middle" fontSize={13} fill="#0C4A6E"
          fontFamily="system-ui" fontWeight={900}>
          {vTxt}
        </text>
      </g>
    );
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxHeight: "280px" }}>
      {gridPolygons}
      {axes}
      {lvls}
      <polygon points={actPts} fill="rgba(29,78,137,0.18)"
        stroke="#0C4A6E" strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={3} fill="#ccc" />
      {labelNodes}
    </svg>
  );
}

// ── CalSelect ─────────────────────────────────────────────────────────────────

function CalSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ ...INPUT, fontSize: "13px", padding: "6px 8px" }}
    >
      <option value={0}>—</option>
      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
  );
}

// ── FixedScoreRow ─────────────────────────────────────────────────────────────

function FixedScoreRow({ nombre, calificacion, observacion, tipo, onCalChange, onObsChange, idx }: {
  nombre: string;
  calificacion: number;
  observacion: string;
  tipo?: "blanda" | "tecnica";
  onCalChange: (v: number) => void;
  onObsChange: (v: string) => void;
  idx: number;
}) {
  const bg = idx % 2 === 0 ? "white" : "#F8FAFF";
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: tipo != null ? "1fr 80px 110px 1fr" : "1fr 110px 1fr",
      gap: "8px", alignItems: "center",
      padding: "8px 10px", background: bg,
      borderRadius: "8px", border: "1px solid #E2E8F0",
    }}>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C4A6E" }}>{nombre}</span>
      {tipo != null && (
        <span style={{
          display: "inline-block",
          fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px",
          background: tipo === "blanda" ? "#D1FAE5" : "#EDE9FE",
          color:      tipo === "blanda" ? "#065F46" : "#5B21B6",
        }}>
          {tipo === "blanda" ? "Blanda" : "Técnica"}
        </span>
      )}
      <CalSelect value={calificacion} onChange={onCalChange} />
      <input
        value={observacion}
        onChange={(e) => onObsChange(e.target.value)}
        style={{ ...INPUT, fontSize: "13px" }}
        placeholder="Observación…"
      />
    </div>
  );
}

// ── PDF export ─────────────────────────────────────────────────────────────────

function buildRadarSVG(kpi: number, comp: number, cond: number, obj: number): string {
  const vals = [kpi, comp, cond, obj];
  const N = 4, W = 600, H = 500, cx = 300, cy = 250, R = 170;
  const a0 = -Math.PI / 2;
  const step = (2 * Math.PI) / N;
  const px = (pct: number, i: number) => cx + (pct / 100) * R * Math.cos(a0 + i * step);
  const py = (pct: number, i: number) => cy + (pct / 100) * R * Math.sin(a0 + i * step);

  const gridPolygons = [20, 40, 60, 80, 100].map((g) => {
    const pts = Array.from({ length: N }, (_, k) =>
      `${px(g, k).toFixed(1)},${py(g, k).toFixed(1)}`
    ).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="${g === 100 ? "#ccc" : "#eee"}" stroke-width="${g === 100 ? 1.5 : 1}"/>`;
  }).join("");

  const axes = Array.from({ length: N }, (_, ai) =>
    `<line x1="${cx}" y1="${cy}" x2="${px(100, ai).toFixed(1)}" y2="${py(100, ai).toFixed(1)}" stroke="#ddd" stroke-width="1"/>`
  ).join("");

  const lvls = [20, 40, 60, 80, 100].map((g) =>
    `<text x="${(cx + (g / 100) * R * Math.cos(a0) - 22).toFixed(1)}" y="${(cy + (g / 100) * R * Math.sin(a0) - 4).toFixed(1)}" font-size="8" fill="#bbb">${g}%</text>`
  ).join("");

  const actPts = vals.map((v, i) => `${px(v, i).toFixed(1)},${py(v, i).toFixed(1)}`).join(" ");

  const AXIS_LABELS = ["KPIs (30%)", "Competencias (25%)", "Conductuales (30%)", "Objetivos (15%)"];
  const labelNodes = AXIS_LABELS.map((name, li) => {
    const angle = a0 + li * step;
    const lx = (cx + (R + 40) * Math.cos(angle)).toFixed(1);
    const ly = (cy + (R + 40) * Math.sin(angle)).toFixed(1);
    const anchor = Math.abs(Math.cos(angle)) < 0.15 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
    return `<g>
      <text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-size="12" fill="#333" font-family="system-ui" font-weight="700">${name}</text>
      <text x="${lx}" y="${(parseFloat(ly) + 16).toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="13" fill="#0C4A6E" font-family="system-ui" font-weight="900">${Math.round(vals[li])}%</text>
    </g>`;
  }).join("");

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:280px">
    ${gridPolygons}${axes}${lvls}
    <polygon points="${actPts}" fill="rgba(29,78,137,0.18)" stroke="#0C4A6E" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="3" fill="#ccc"/>
    ${labelNodes}
  </svg>`;
}

function buildEvalDesempHTML(
  cargo: Cargo,
  form: EvalDesempForm,
  scores: { total: number; kpi: number; comp: number; cond: number; obj: number },
  empresaNombre: string,
): string {
  const esc = (s: string | null | undefined) =>
    (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

  const fmtD = (iso: string | null | undefined) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return iso; }
  };

  const sem = SEMAFORO_DESEMP(scores.total);

  const sec = (title: string, body: string) =>
    `<div class="sec"><div class="sec-head">${title}</div><div class="sec-body">${body}</div></div>`;

  const pair = (label: string, val: string) =>
    `<div class="pair"><div class="pl">${label}</div><div class="pv">${esc(val) || "—"}</div></div>`;

  // 1. Datos de la evaluación
  const datos = `<div class="grid2">
    ${pair("Colaborador evaluado", form.nombre_evaluado)}
    ${pair("Evaluador", form.evaluador)}
    ${pair("Fecha de evaluación", fmtD(form.fecha_evaluacion))}
    ${pair("Período evaluado", form.periodo)}
    ${pair("Cargo", cargo.cargo)}
    ${pair("Área", cargo.area)}
  </div>`;

  // 2. KPIs del cargo (30%)
  const kpis = !form.kpi_scores.length
    ? `<p class="empty">Sin KPIs definidos para este cargo.</p>`
    : `<table class="ktable">
        <thead><tr><th>KPI</th><th>Resultado obtenido</th><th>Cal. (1–5)</th><th>Observación</th></tr></thead>
        <tbody>${form.kpi_scores.map((k) =>
          `<tr>
            <td>${esc(k.nombre)}</td>
            <td>${esc(k.resultado) || "—"}</td>
            <td style="text-align:center;font-weight:700;color:#0C4A6E">${k.calificacion || "—"}</td>
            <td>${esc(k.observacion) || "—"}</td>
          </tr>`
        ).join("")}</tbody>
      </table>`;

  // 3. Competencias del cargo (25%) — blandas primero por índice
  const nBlandas = cargo.competencias_blandas.length;
  const comps = !form.comp_scores.length
    ? `<p class="empty">Sin competencias definidas para este cargo.</p>`
    : `<table class="ktable">
        <thead><tr><th>Competencia</th><th>Tipo</th><th>Cal. (1–5)</th><th>Observación</th></tr></thead>
        <tbody>${form.comp_scores.map((c, i) => {
          const badge = i < nBlandas
            ? `<span style="background:#D1FAE5;color:#065F46;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">Blanda</span>`
            : `<span style="background:#EDE9FE;color:#5B21B6;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">Técnica</span>`;
          return `<tr>
            <td>${esc(c.nombre)}</td>
            <td>${badge}</td>
            <td style="text-align:center;font-weight:700;color:#0C4A6E">${c.calificacion || "—"}</td>
            <td>${esc(c.observacion) || "—"}</td>
          </tr>`;
        }).join("")}</tbody>
      </table>`;

  // 4. Conductuales organizacionales (30%)
  const conds = `<table class="ktable">
    <thead><tr><th>Conductual</th><th>Cal. (1–5)</th><th>Observación</th></tr></thead>
    <tbody>${form.cond_scores.map((c) =>
      `<tr>
        <td>${esc(c.nombre)}</td>
        <td style="text-align:center;font-weight:700;color:#0C4A6E">${c.calificacion || "—"}</td>
        <td>${esc(c.observacion) || "—"}</td>
      </tr>`
    ).join("")}</tbody>
  </table>`;

  // 5. Objetivos del período (15%)
  const objs = !form.objetivos.length
    ? `<p class="empty">Sin objetivos definidos.</p>`
    : `<table class="ktable">
        <thead><tr><th>Objetivo</th><th>Peso %</th><th>Resultado</th><th>Cal. (1–5)</th><th>Observación</th></tr></thead>
        <tbody>${form.objetivos.map((o) =>
          `<tr>
            <td>${esc(o.objetivo) || "—"}</td>
            <td style="text-align:center">${o.peso ?? "—"}</td>
            <td>${esc(o.resultado) || "—"}</td>
            <td style="text-align:center;font-weight:700;color:#0C4A6E">${o.calificacion || "—"}</td>
            <td>${esc(o.observacion) || "—"}</td>
          </tr>`
        ).join("")}</tbody>
      </table>`;

  // 6. Resultados (score + desglose + radar) — solo si total > 0
  const hasScore = scores.total > 0;
  const desgloseItems = [
    { label: "KPIs",         peso: "30%", val: scores.kpi  },
    { label: "Competencias", peso: "25%", val: scores.comp },
    { label: "Conductuales", peso: "30%", val: scores.cond },
    { label: "Objetivos",    peso: "15%", val: scores.obj  },
  ];
  const resultadosBlock = hasScore
    ? `<div style="display:flex;align-items:center;gap:16px;background:${sem.bg};border:1px solid ${sem.color}40;border-radius:10px;padding:14px 20px;margin-bottom:14px">
        <div style="font-size:40px;font-weight:900;color:${sem.color}">${Math.round(scores.total)}%</div>
        <div>
          <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.1em">Score Total de Desempeño</div>
          <div style="font-size:18px;font-weight:800;color:${sem.color}">${sem.label}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
        ${desgloseItems.map(({ label, peso, val }) =>
          `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px">
            <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">${label} · ${peso}</div>
            <div style="font-size:20px;font-weight:900;color:#0C4A6E">${Math.round(val)}%</div>
          </div>`
        ).join("")}
      </div>
      <div style="border:1.5px solid #E2E8F0;border-radius:10px;padding:14px 18px;background:white">
        <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Perfil de Desempeño</div>
        ${buildRadarSVG(scores.kpi, scores.comp, scores.cond, scores.obj)}
      </div>`
    : "";

  // 7. Observaciones
  const obsBlock = (form.observacion_evaluado || form.observacion_evaluador || form.observacion_rrhh)
    ? `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
        ${([ ["Colaborador", form.observacion_evaluado],
              ["Evaluador",   form.observacion_evaluador],
              ["RRHH",        form.observacion_rrhh],
        ] as [string, string][]).map(([label, val]) =>
          `<div>
            <div style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">${label}</div>
            <div style="font-size:13px;color:#334155;line-height:1.7;white-space:pre-wrap;background:#F8FAFC;border-radius:7px;padding:10px 12px;border:1px solid #E2E8F0">${esc(val) || "<em style='color:#CBD5E1'>Sin comentarios</em>"}</div>
          </div>`
        ).join("")}
      </div>`
    : `<p class="empty">Sin observaciones registradas.</p>`;

  // 8. Plan de mejora
  const planBlock = !form.plan_mejora.length
    ? `<p class="empty">Sin plan de mejora registrado.</p>`
    : `<table class="ktable">
        <thead><tr><th>Área</th><th>Acción</th><th>Recurso</th><th>Plazo</th><th>Responsable</th></tr></thead>
        <tbody>${form.plan_mejora.map((p) =>
          `<tr>
            <td>${esc(p.area) || "—"}</td>
            <td>${esc(p.accion) || "—"}</td>
            <td>${esc(p.recurso) || "—"}</td>
            <td>${esc(p.plazo) || "—"}</td>
            <td>${esc(p.responsable) || "—"}</td>
          </tr>`
        ).join("")}</tbody>
      </table>`;

  // 9. Firma RRHH
  const firmaBlock = `<div style="display:grid;grid-template-columns:1fr 200px;gap:20px;align-items:end">
    <div style="text-align:center">
      <div style="height:48px;border-bottom:2px solid #0C4A6E;margin-bottom:7px"></div>
      <div style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Firma RRHH</div>
      ${form.firma_rrhh ? `<div style="font-size:12px;font-weight:700;color:#0C4A6E;margin-top:3px">${esc(form.firma_rrhh)}</div>` : ""}
    </div>
    ${form.fecha_firma
      ? `<div class="pair"><div class="pl">Fecha de firma</div><div class="pv">${fmtD(form.fecha_firma)}</div></div>`
      : ""}
  </div>`;

  const n = hasScore; // afecta numeración de secciones 6-9
  const fecha = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });

  const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#F8FAFC;color:#1E293B;font-size:13px;line-height:1.6}
.topbar{position:sticky;top:0;background:white;border-bottom:1px solid #E2E8F0;padding:10px 24px;display:flex;align-items:center;justify-content:space-between}
.topbar button{padding:8px 20px;background:#0C4A6E;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer}
.topbar button:hover{background:#0A3D5C}
.doc{max-width:820px;margin:0 auto;padding:32px 24px 60px}
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
.ktable{width:100%;border-collapse:collapse;font-size:12px}
.ktable th{background:#0C4A6E;color:white;padding:7px 10px;font-size:9px;font-weight:800;text-transform:uppercase;text-align:left}
.ktable td{padding:7px 10px;border-bottom:1px solid #E2E8F0;color:#334155;vertical-align:top;break-inside:avoid;page-break-inside:avoid}
.ktable tr:last-child td{border-bottom:none}
.footer{margin-top:28px;font-size:10px;color:#94A3B8;text-align:center}
@page{size:A4;margin:14mm}
@media print{
  .topbar{display:none!important}
  body{background:white}
  .doc{padding:0 0 8px;max-width:100%}
  .footer{margin-top:10px}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
}`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>Evaluación de Desempeño — ${esc(form.nombre_evaluado)} — ${esc(cargo.cargo)}</title>
<style>${css}</style></head>
<body>
<div class="topbar">
  <span style="font-size:14px;font-weight:800;color:#0C4A6E">Evaluación de Desempeño — ${esc(cargo.cargo)}</span>
  <button onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
</div>
<div class="doc">
  <div class="dh">
    ${empresaNombre ? `<div class="empresa">${esc(empresaNombre)}</div>` : ""}
    <div class="ctitle-main">${esc(cargo.cargo)}</div>
    <div class="cmeta">Evaluación de Desempeño${form.periodo ? ` · ${esc(form.periodo)}` : ""}${form.nombre_evaluado ? ` · ${esc(form.nombre_evaluado)}` : ""}</div>
    ${hasScore ? `<div style="margin-top:10px;display:inline-block;background:${sem.bg};border:1px solid ${sem.color}40;border-radius:8px;padding:4px 18px;font-size:14px;font-weight:800;color:${sem.color}">${Math.round(scores.total)}% · ${sem.label}</div>` : ""}
  </div>
  ${sec("1. Datos de la evaluación", datos)}
  ${sec("2. KPIs del cargo (30%)", kpis)}
  ${sec("3. Competencias del cargo (25%)", comps)}
  ${sec("4. Conductuales organizacionales (30%)", conds)}
  ${sec("5. Objetivos del período (15%)", objs)}
  ${n ? sec("6. Resultados", resultadosBlock) : ""}
  ${sec(`${n ? "7" : "6"}. Observaciones`, obsBlock)}
  ${sec(`${n ? "8" : "7"}. Plan de mejora`, planBlock)}
  ${sec(`${n ? "9" : "8"}. Firma RRHH`, firmaBlock)}
  <div class="footer">Generado el ${fecha}${empresaNombre ? ` · ${esc(empresaNombre)}` : ""}</div>
</div>
</body></html>`;
}

// ── Main component ─────────────────────────────────────────────────────────────

type EvalRec = Record<string, unknown> & { id: string };

export function EvalDesempPanel({ cargo, userRolEmpresa, onClose, empresaNombre = "" }: {
  cargo: Cargo;
  userRolEmpresa: string | null;
  onClose: () => void;
  empresaNombre?: string;
}) {
  const [evals, setEvals]               = useState<EvalRec[]>([]);
  const [loadingEvals, setLoadingEvals] = useState(true);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [form, setForm]                 = useState<EvalDesempForm>({
    ...EVAL_DESEMP_BLANK,
    fecha_evaluacion: new Date().toISOString().slice(0, 10),
    kpi_scores:  initKpiScores(cargo),
    comp_scores: initCompScores(cargo),
    cond_scores: initCondScores(),
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string; fecha: string } | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const { role } = useAuth();
  const canDelete = role === "admin" || role === "consultor" || userRolEmpresa === "dueño";

  const setF = <K extends keyof EvalDesempForm>(k: K, v: EvalDesempForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    (supabase as any)
      .from("manual_funciones_evaluaciones_desempeno")
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
      ...EVAL_DESEMP_BLANK,
      fecha_evaluacion: new Date().toISOString().slice(0, 10),
      kpi_scores:  initKpiScores(cargo),
      comp_scores: initCompScores(cargo),
      cond_scores: initCondScores(),
    });
  }

  function cargarEval(row: EvalRec) {
    setEditingId(row.id);
    setForm(parseRow(row));
  }

  async function eliminarEval(id: string) {
    setDeleting(true);
    const { data: deleted, error } = await (supabase as any)
      .from("manual_funciones_evaluaciones_desempeno")
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
    const scores = calcDesemp(form);
    const sem    = SEMAFORO_DESEMP(scores.total);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      cargo_id:              cargo.id,
      consultor_id:          userRolEmpresa === "consultor" ? (user?.id ?? null) : null,
      nombre_evaluado:       form.nombre_evaluado,
      evaluador:             form.evaluador              || null,
      fecha_evaluacion:      form.fecha_evaluacion       || null,
      periodo:               form.periodo                || null,
      kpi_scores:            form.kpi_scores,
      comp_scores:           form.comp_scores,
      cond_scores:           form.cond_scores,
      objetivos:             form.objetivos,
      observacion_evaluado:  form.observacion_evaluado  || null,
      observacion_evaluador: form.observacion_evaluador || null,
      observacion_rrhh:      form.observacion_rrhh      || null,
      plan_mejora:           form.plan_mejora,
      firma_rrhh:            form.firma_rrhh            || null,
      fecha_firma:           form.fecha_firma           || null,
      score_total:           Math.round(scores.total * 100) / 100,
      semaforo:              sem.label,
    };

    if (editingId) {
      const { data, error } = await (supabase as any)
        .from("manual_funciones_evaluaciones_desempeno")
        .update(payload).eq("id", editingId).select().single();
      if (error) { toast.error("Error al actualizar"); setSaving(false); return; }
      setEvals((prev) => prev.map((e) => (e.id === editingId ? data as EvalRec : e)));
      toast.success("Evaluación actualizada");
    } else {
      const { data, error } = await (supabase as any)
        .from("manual_funciones_evaluaciones_desempeno")
        .insert(payload).select().single();
      if (error) { toast.error("Error al guardar"); setSaving(false); return; }
      const saved = data as EvalRec;
      setEvals((prev) => [saved, ...prev]);
      setEditingId(saved.id);
      toast.success("Evaluación de desempeño guardada");
    }
    setSaving(false);
  }

  const scores = calcDesemp(form);
  const sem    = SEMAFORO_DESEMP(scores.total);
  const f      = form;

  function handlePrint() {
    const html = buildEvalDesempHTML(cargo, f, scores, empresaNombre);
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `eval-desempeno-${f.nombre_evaluado.replace(/\s+/g, "-")}-${cargo.cargo.replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const updateKpi  = (i: number, field: keyof KpiScore,  val: string | number) =>
    setF("kpi_scores",  f.kpi_scores.map((r, j) => j === i ? { ...r, [field]: val } : r));
  const updateComp = (i: number, field: keyof CompScore, val: string | number) =>
    setF("comp_scores", f.comp_scores.map((r, j) => j === i ? { ...r, [field]: val } : r));
  const updateCond = (i: number, field: keyof CompScore, val: string | number) =>
    setF("cond_scores", f.cond_scores.map((r, j) => j === i ? { ...r, [field]: val } : r));

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
            Evaluación de Desempeño
          </div>
        </div>

        {scores.total > 0 && (
          <div style={{
            background: sem.bg, border: `1px solid ${sem.color}40`,
            borderRadius: "8px", padding: "4px 12px",
            fontSize: "13px", fontWeight: 800, color: sem.color, flexShrink: 0,
          }}>
            {Math.round(scores.total)}% · {sem.label}
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
      <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Historial */}
        <FormSection title={`Historial de evaluaciones (${loadingEvals ? "…" : evals.length})`} defaultOpen>
          {loadingEvals ? (
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>Cargando…</p>
          ) : evals.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>Sin evaluaciones previas para este cargo.</p>
          ) : (
            <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr 90px 120px", background: "#0C4A6E", padding: "8px 12px", gap: "10px" }}>
                {["Fecha", "Colaborador", "Periodo", "Score", ""].map((h) => (
                  <span key={h} style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
                ))}
              </div>
              {evals.map((e, i) => {
                const isActive = e.id === editingId;
                const esem = SEMAFORO_DESEMP(Number(e.score_total ?? 0));
                return (
                  <div
                    key={e.id}
                    style={{
                      display: "grid", gridTemplateColumns: "130px 1fr 1fr 90px 120px",
                      gap: "10px", padding: "9px 12px", alignItems: "center",
                      background: isActive ? "#EFF6FF" : i % 2 === 0 ? "white" : "#F8FAFF",
                      borderTop: "1px solid #E2E8F0",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#0C4A6E", fontWeight: 600 }}>{fmtDate(e.fecha_evaluacion as string)}</span>
                    <span style={{ fontSize: "13px", color: "#334155" }}>{(e.nombre_evaluado as string) || "—"}</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>{(e.periodo as string) || "—"}</span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: esem.color }}>
                      {e.score_total != null ? `${Math.round(Number(e.score_total))}%` : "—"}
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
              <input value={f.nombre_evaluado} onChange={(e) => setF("nombre_evaluado", e.target.value)} style={INPUT} placeholder="Nombre completo" />
            </Field>
            <Field label="Evaluador">
              <input value={f.evaluador} onChange={(e) => setF("evaluador", e.target.value)} style={INPUT} placeholder="Nombre del evaluador" />
            </Field>
            <Field label="Fecha de evaluación">
              <input type="date" value={f.fecha_evaluacion} onChange={(e) => setF("fecha_evaluacion", e.target.value)} style={INPUT} />
            </Field>
            <Field label="Periodo evaluado">
              <input value={f.periodo} onChange={(e) => setF("periodo", e.target.value)} style={INPUT} placeholder="Ej: Q2 2026 / Semestre 1 2026" />
            </Field>
          </div>
        </FormSection>

        {/* KPIs del cargo */}
        <FormSection title="KPIs del cargo (30%)">
          {f.kpi_scores.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
              Este cargo no tiene KPIs definidos. Agrégalos desde el formulario del cargo.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 110px 1fr", gap: "8px", padding: "6px 10px" }}>
                {["KPI", "Resultado obtenido", "Cal. (1-5)", "Observación"].map((h) => (
                  <div key={h} style={{ ...LABEL, marginBottom: 0 }}>{h}</div>
                ))}
              </div>
              {f.kpi_scores.map((kpi, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 110px 1fr",
                    gap: "8px", alignItems: "center", padding: "8px 10px",
                    background: i % 2 === 0 ? "white" : "#F8FAFF",
                    borderRadius: "8px", border: "1px solid #E2E8F0",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C4A6E" }}>{kpi.nombre}</span>
                  <input
                    value={kpi.resultado}
                    onChange={(e) => updateKpi(i, "resultado", e.target.value)}
                    style={{ ...INPUT, fontSize: "13px" }}
                    placeholder="Resultado real…"
                  />
                  <CalSelect value={kpi.calificacion} onChange={(v) => updateKpi(i, "calificacion", v)} />
                  <input
                    value={kpi.observacion}
                    onChange={(e) => updateKpi(i, "observacion", e.target.value)}
                    style={{ ...INPUT, fontSize: "13px" }}
                    placeholder="Observación…"
                  />
                </div>
              ))}
            </div>
          )}
        </FormSection>

        {/* Competencias del cargo */}
        <FormSection title="Competencias del cargo (25%)" defaultOpen={false}>
          {f.comp_scores.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
              Este cargo no tiene competencias definidas. Agrégalas desde el formulario del cargo.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 1fr", gap: "8px", padding: "6px 10px" }}>
                {["Competencia", "Tipo", "Cal. (1-5)", "Observación"].map((h) => (
                  <div key={h} style={{ ...LABEL, marginBottom: 0 }}>{h}</div>
                ))}
              </div>
              {f.comp_scores.map((comp, i) => {
                const cargo_comp = [
                  ...cargo.competencias_blandas.map((c) => ({ ...c, tipo: "blanda" as const })),
                  ...cargo.competencias_tecnicas.map((c) => ({ ...c, tipo: "tecnica" as const })),
                ][i];
                return (
                  <FixedScoreRow
                    key={i} idx={i}
                    nombre={comp.nombre}
                    calificacion={comp.calificacion}
                    observacion={comp.observacion}
                    tipo={cargo_comp?.tipo}
                    onCalChange={(v) => updateComp(i, "calificacion", v)}
                    onObsChange={(v) => updateComp(i, "observacion", v)}
                  />
                );
              })}
            </div>
          )}
        </FormSection>

        {/* Conductuales fijas */}
        <FormSection title="Conductuales organizacionales (30%)" defaultOpen={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 1fr", gap: "8px", padding: "6px 10px" }}>
              {["Conductual", "Cal. (1-5)", "Observación"].map((h) => (
                <div key={h} style={{ ...LABEL, marginBottom: 0 }}>{h}</div>
              ))}
            </div>
            {f.cond_scores.map((cond, i) => (
              <FixedScoreRow
                key={i} idx={i}
                nombre={cond.nombre}
                calificacion={cond.calificacion}
                observacion={cond.observacion}
                onCalChange={(v) => updateCond(i, "calificacion", v)}
                onObsChange={(v) => updateCond(i, "observacion", v)}
              />
            ))}
          </div>
        </FormSection>

        {/* Objetivos del periodo */}
        <FormSection title="Objetivos del periodo (15%)" defaultOpen={false}>
          <DynList<ObjetivoRow>
            items={f.objetivos}
            onChange={(v) => setF("objetivos", v)}
            schema={{ objetivo: "", peso: 0, resultado: "", calificacion: 3, observacion: "" }}
            labels={OBJ_LABELS}
            addLabel="Agregar objetivo"
          />
        </FormSection>

        {/* Score total + radar + desglose */}
        {scores.total > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <ScoreCard score={scores.total} semaforo={sem} label="Score Total de Desempeño" />

            {/* Radar de 4 ejes */}
            <div style={{
              background: "white", border: "1.5px solid #E2E8F0",
              borderRadius: "12px", padding: "16px 20px",
            }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                Perfil de Desempeño
              </div>
              <DesempRadar
                kpi={scores.kpi}
                comp={scores.comp}
                cond={scores.cond}
                obj={scores.obj}
              />
            </div>

            {/* Desglose por sección */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {SECTION_WEIGHTS.map(({ label, key, peso }) => (
                <div
                  key={key}
                  style={{
                    background: "white", border: "1px solid #E2E8F0",
                    borderRadius: "8px", padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                    {label} · {peso}
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#0C4A6E" }}>
                    {Math.round(scores[key])}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observaciones */}
        <FormSection title="Observaciones" defaultOpen={false}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <Field label="Observación del colaborador">
              <textarea value={f.observacion_evaluado} onChange={(e) => setF("observacion_evaluado", e.target.value)} rows={4} style={TEXTAREA} placeholder="Comentarios del colaborador…" />
            </Field>
            <Field label="Observación del evaluador">
              <textarea value={f.observacion_evaluador} onChange={(e) => setF("observacion_evaluador", e.target.value)} rows={4} style={TEXTAREA} placeholder="Apreciación del evaluador…" />
            </Field>
            <Field label="Observación RRHH">
              <textarea value={f.observacion_rrhh} onChange={(e) => setF("observacion_rrhh", e.target.value)} rows={4} style={TEXTAREA} placeholder="Comentarios de RRHH…" />
            </Field>
          </div>
        </FormSection>

        {/* Plan de mejora */}
        <FormSection title="Plan de mejora" defaultOpen={false}>
          <DynList<PlanMejoraRow>
            items={f.plan_mejora}
            onChange={(v) => setF("plan_mejora", v)}
            schema={{ area: "", accion: "", recurso: "", plazo: "", responsable: "" }}
            labels={MEJORA_LABELS}
            addLabel="Agregar acción"
          />
        </FormSection>

        {/* Firma RRHH */}
        <FormSection title="Firma RRHH" defaultOpen={false}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "12px" }}>
            <Field label="Nombre / Firma RRHH">
              <input value={f.firma_rrhh} onChange={(e) => setF("firma_rrhh", e.target.value)} style={INPUT} placeholder="Nombre completo" />
            </Field>
            <Field label="Fecha de firma">
              <input type="date" value={f.fecha_firma} onChange={(e) => setF("fecha_firma", e.target.value)} style={INPUT} />
            </Field>
          </div>
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
