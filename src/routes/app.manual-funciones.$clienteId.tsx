import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  FileText, X, Check, Eye, Printer, Target, ListChecks,
  Users, Cpu, BarChart3, Rocket, Network, Clock,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/manual-funciones/$clienteId")({
  component: ManualFuncionesWorkspace,
});

// ── Types ──────────────────────────────────────────────────────────────────────
type Area = { id: string; nombre: string; orden: number };

type Funcion     = { descripcion: string; porcentaje_tiempo: number };
type Competencia = { nombre: string; nivel: string };
type KPI         = { nombre: string; meta: string; frecuencia: string };
type Condiciones = Record<string, string>;

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
  supervisa_a: string[];
  condiciones: Condiciones | null;
  relaciones_internas: string[];
  relaciones_externas: string[];
  requisitos: Record<string, string> | null;
};

type FormDatos = Omit<Cargo, "id" | "supervisa_a" | "requisitos">;

const FORM_BLANK: FormDatos = {
  cargo: "", area: "", jefe_inmediato: "", codigo: "", version: "1.0",
  estado: "vigente", vacante: false, objetivo: "",
  funciones: [], competencias_blandas: [], competencias_tecnicas: [], kpis: [],
  elaborado_por: "", aprobado_por: "", fecha_elaboracion: "", fecha_revision: "",
  plan_carrera: "",
  relaciones_internas: [], relaciones_externas: [],
  condiciones: {},
};

const ESTADOS    = ["vigente", "en_revision", "obsoleto"];
const NIVELES    = ["Básico", "Intermedio", "Avanzado", "Experto"];
const FRECUENCIAS = ["Diario", "Semanal", "Mensual", "Trimestral", "Anual"];

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
const PILL = (estado: string | null) => {
  const m: Record<string, { bg: string; color: string }> = {
    vigente:     { bg: "#D1FAE5", color: "#065F46" },
    en_revision: { bg: "#FEF3C7", color: "#92400E" },
    obsoleto:    { bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = m[estado ?? ""] ?? { bg: "#F1F5F9", color: "#64748B" };
  return { ...s, fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "99px" };
};
const NIVEL_COLOR: Record<string, { bg: string; color: string }> = {
  "Básico":      { bg: "#F1F5F9", color: "#64748B" },
  "Intermedio":  { bg: "#DBEAFE", color: "#1D4ED8" },
  "Avanzado":    { bg: "#D1FAE5", color: "#065F46" },
  "Experto":     { bg: "#EDE9FE", color: "#5B21B6" },
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
    supervisa_a: parseJsonb<string>(row.supervisa_a, []),
    condiciones: (row.condiciones as Condiciones) ?? null,
    relaciones_internas: parseJsonb<string>(row.relaciones_internas, []),
    relaciones_externas: parseJsonb<string>(row.relaciones_externas, []),
    requisitos: (row.requisitos as Record<string, string>) ?? null,
  };
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return iso; }
}

// ── PreviewPanel ───────────────────────────────────────────────────────────────
function PreviewPanel({
  cargo, clienteNombre, onClose, onEdit,
}: {
  cargo: Cargo;
  clienteNombre: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  // Inject print CSS on mount
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "mf-preview-print-css";
    style.textContent = `
      @media print {
        @page {
          margin: 15mm;
          size: A4;
        }
        html, body {
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }
        body > * {
          display: none !important;
        }
        #preview-panel {
          display: block !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          z-index: 99999 !important;
        }
        #preview-panel * {
          visibility: visible !important;
        }
        .no-print {
          display: none !important;
        }
        .print-only {
          display: flex !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
      .print-only { display: none; }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("mf-preview-print-css")?.remove(); };
  }, []);

  const hasContent = (arr: unknown[]) => arr.length > 0;

  const SectionBlock = ({
    icon: Icon, title, color, children,
  }: { icon: React.ElementType; title: string; color: string; children: React.ReactNode }) => (
    <div className="preview-section" style={{ background: "white", borderRadius: "12px", border: "1.5px solid #E2E8F0", overflow: "hidden", marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", borderBottom: "1.5px solid #E2E8F0", background: `${color}08` }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${color}20`, border: `1.5px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon style={{ width: "15px", height: "15px", color }} />
        </div>
        <span style={{ fontSize: "13px", fontWeight: 800, color: "#0C4A6E", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
      </div>
      <div style={{ padding: "18px" }}>{children}</div>
    </div>
  );

  return (
    <div
      id="preview-panel"
      className="mf-preview"
      style={{
        background: "#F8FAFF", overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* ── Sticky action bar ── */}
      <div
        className="no-print"
        style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "white", borderBottom: "1px solid #E2E8F0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 24px", gap: "12px",
        }}
      >
        <button
          onClick={onClose}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#64748B", background: "#F1F5F9", border: "none", borderRadius: "8px", padding: "7px 14px", cursor: "pointer" }}
        >
          <ArrowLeft style={{ width: "13px", height: "13px" }} /> Volver a la lista
        </button>

        <span style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E", flex: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cargo.cargo}
        </span>

        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={onEdit}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#0C4A6E", background: "white", border: "1.5px solid #E2E8F0", borderRadius: "8px", padding: "7px 14px", cursor: "pointer" }}
          >
            <Pencil style={{ width: "13px", height: "13px" }} /> Editar
          </button>
          <button
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "white", background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", border: "none", borderRadius: "8px", padding: "7px 16px", cursor: "pointer" }}
          >
            <Printer style={{ width: "13px", height: "13px" }} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* ── Document body ── */}
      <div
        className="preview-body"
        style={{ width: "100%", padding: "28px 24px 60px" }}
      >

        {/* ── Hero header ── */}
        <div style={{
          background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 100%)",
          borderRadius: "16px", padding: "32px 36px", marginBottom: "14px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 70% at 90% 10%, rgba(14,165,233,0.18), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Company tag */}
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" }}>
              {clienteNombre} · Manual de Funciones
            </div>

            {/* Cargo name + avatar */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "18px", marginBottom: "18px" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 900, color: "white", flexShrink: 0 }}>
                {cargo.cargo[0]?.toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 900, color: "white", margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  {cargo.cargo}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)" }}>{cargo.area}</span>
                  {cargo.jefe_inmediato && (
                    <>
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>Reporta a: {cargo.jefe_inmediato}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Badges row */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ ...PILL(cargo.estado), fontSize: "12px" }}>
                {(cargo.estado ?? "—").replace("_", " ")}
              </span>
              {cargo.vacante && (
                <span style={{ background: "#EDE9FE", color: "#5B21B6", fontSize: "12px", fontWeight: 700, padding: "2px 9px", borderRadius: "99px" }}>
                  Vacante
                </span>
              )}
              {cargo.codigo && (
                <span style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", fontSize: "11px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.2)" }}>
                  {cargo.codigo}
                </span>
              )}
              {cargo.version && (
                <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.15)" }}>
                  v{cargo.version}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Elaboración meta row ── */}
        {(cargo.elaborado_por || cargo.aprobado_por || cargo.fecha_elaboracion || cargo.fecha_revision) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "14px" }}>
            {[
              { lbl: "Elaborado por",      val: cargo.elaborado_por },
              { lbl: "Aprobado por",       val: cargo.aprobado_por },
              { lbl: "Fecha elaboración",  val: fmtDate(cargo.fecha_elaboracion) },
              { lbl: "Fecha revisión",     val: fmtDate(cargo.fecha_revision) },
            ].filter((r) => r.val && r.val !== "—").map((r) => (
              <div key={r.lbl} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "10px 14px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>{r.lbl}</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0C4A6E" }}>{r.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Objetivo ── */}
        {cargo.objetivo && (
          <SectionBlock icon={Target} title="Objetivo del Cargo" color="#0EA5E9">
            <p style={{ fontSize: "14px", color: "#334155", lineHeight: 1.75, margin: 0 }}>{cargo.objetivo}</p>
          </SectionBlock>
        )}

        {/* ── Funciones ── */}
        {hasContent(cargo.funciones) && (
          <SectionBlock icon={ListChecks} title="Funciones Principales" color="#6366F1">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {cargo.funciones.map((fn, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#EEF2FF", border: "1.5px solid #C7D2FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#6366F1", flexShrink: 0, marginTop: "1px" }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", color: "#334155", margin: "0 0 6px", lineHeight: 1.6 }}>{fn.descripcion}</p>
                    {fn.porcentaje_tiempo > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "4px", background: "#EEF2FF", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(fn.porcentaje_tiempo, 100)}%`, background: "linear-gradient(90deg, #6366F1, #818CF8)", borderRadius: "99px" }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#6366F1", flexShrink: 0 }}>{fn.porcentaje_tiempo}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* ── Competencias ── */}
        {(hasContent(cargo.competencias_blandas) || hasContent(cargo.competencias_tecnicas)) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            {hasContent(cargo.competencias_blandas) && (
              <div style={{ background: "white", borderRadius: "12px", border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: "1.5px solid #E2E8F0", background: "#1D9E7508" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "#1D9E7520", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users style={{ width: "13px", height: "13px", color: "#1D9E75" }} />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#0C4A6E", textTransform: "uppercase", letterSpacing: "0.08em" }}>Comp. Blandas</span>
                </div>
                <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {cargo.competencias_blandas.map((c, i) => {
                    const nc = NIVEL_COLOR[c.nivel] ?? NIVEL_COLOR["Básico"];
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <span style={{ fontSize: "13px", color: "#334155", flex: 1 }}>{c.nombre}</span>
                        <span style={{ ...nc, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", flexShrink: 0 }}>{c.nivel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {hasContent(cargo.competencias_tecnicas) && (
              <div style={{ background: "white", borderRadius: "12px", border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: "1.5px solid #E2E8F0", background: "#7F77DD08" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "#7F77DD20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Cpu style={{ width: "13px", height: "13px", color: "#7F77DD" }} />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#0C4A6E", textTransform: "uppercase", letterSpacing: "0.08em" }}>Comp. Técnicas</span>
                </div>
                <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {cargo.competencias_tecnicas.map((c, i) => {
                    const nc = NIVEL_COLOR[c.nivel] ?? NIVEL_COLOR["Básico"];
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <span style={{ fontSize: "13px", color: "#334155", flex: 1 }}>{c.nombre}</span>
                        <span style={{ ...nc, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", flexShrink: 0 }}>{c.nivel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── KPIs ── */}
        {hasContent(cargo.kpis) && (
          <SectionBlock icon={BarChart3} title="KPIs" color="#BA7517">
            <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", background: "#0C4A6E", padding: "9px 14px", gap: "12px" }}>
                {["Indicador", "Meta", "Frecuencia"].map((h) => (
                  <span key={h} style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
                ))}
              </div>
              {cargo.kpis.map((k, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", padding: "10px 14px", background: i % 2 === 0 ? "white" : "#F8FAFF", borderTop: "1px solid #E2E8F0" }}>
                  <span style={{ fontSize: "13px", color: "#0C4A6E", fontWeight: 600 }}>{k.nombre}</span>
                  <span style={{ fontSize: "13px", color: "#334155" }}>{k.meta}</span>
                  <span style={{ fontSize: "12px", color: "#64748B", whiteSpace: "nowrap" }}>{k.frecuencia}</span>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* ── Relaciones de Trabajo ── */}
        {(hasContent(cargo.relaciones_internas) || hasContent(cargo.relaciones_externas)) && (
          <div className="preview-section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            {hasContent(cargo.relaciones_internas) && (
              <div style={{ background: "#F5F7FF", borderLeft: "4px solid #0C4A6E", borderRadius: "0 10px 10px 0", padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#0C4A6E", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Relaciones Internas</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {cargo.relaciones_internas.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <span style={{ color: "#0C4A6E", fontWeight: 900, fontSize: "10px", marginTop: "4px", flexShrink: 0 }}>◆</span>
                      <span style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasContent(cargo.relaciones_externas) && (
              <div style={{ background: "#F5F7FF", borderLeft: "4px solid #1E3A8A", borderRadius: "0 10px 10px 0", padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#1E3A8A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Relaciones Externas</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {cargo.relaciones_externas.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <span style={{ color: "#1E3A8A", fontWeight: 900, fontSize: "10px", marginTop: "4px", flexShrink: 0 }}>◆</span>
                      <span style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Supervisados Directos ── */}
        {hasContent(cargo.supervisa_a) && (
          <SectionBlock icon={Network} title="Supervisados Directos" color="#0EA5E9">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {cargo.supervisa_a.map((nombre, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: "8px", padding: "6px 12px" }}>
                  <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "linear-gradient(135deg, #0EA5E9, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 900, color: "white", flexShrink: 0 }}>
                    {nombre[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: "13px", color: "#0C4A6E", fontWeight: 500 }}>{nombre}</span>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* ── Condiciones de Trabajo ── */}
        {cargo.condiciones && Object.values(cargo.condiciones).some(Boolean) && (
          <SectionBlock icon={Clock} title="Condiciones de Trabajo" color="#7F77DD">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              {Object.entries(cargo.condiciones).filter(([, v]) => v).map(([key, val]) => (
                <div key={key} style={{ background: "#F5F3FF", border: "1.5px solid #DDD6FE", borderRadius: "10px", padding: "12px 14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#7F77DD", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}
                  </div>
                  <div style={{ fontSize: "13px", color: "#1E1B4B", lineHeight: 1.5 }}>{val}</div>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* ── Plan de Carrera ── */}
        {cargo.plan_carrera && (
          <SectionBlock icon={Rocket} title="Plan de Carrera" color="#D85A30">
            <p style={{ fontSize: "14px", color: "#334155", lineHeight: 1.75, margin: 0 }}>{cargo.plan_carrera}</p>
          </SectionBlock>
        )}

        {/* Empty state if absolutely nothing to show */}
        {!cargo.objetivo && !hasContent(cargo.funciones) && !hasContent(cargo.competencias_blandas) && !hasContent(cargo.competencias_tecnicas) && !hasContent(cargo.kpis) && !cargo.plan_carrera && !hasContent(cargo.supervisa_a) && !cargo.condiciones && (
          <div style={{ textAlign: "center", padding: "40px 24px", background: "white", borderRadius: "12px", border: "1.5px dashed #E0E7FF" }}>
            <FileText style={{ width: "32px", height: "32px", color: "#CBD5E1", margin: "0 auto 10px" }} />
            <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0 }}>Este cargo aún no tiene contenido detallado. Edítalo para agregar funciones, competencias y KPIs.</p>
          </div>
        )}

        {/* ── Sección de Firmas (solo impresión) ── */}
        <div className="print-only" style={{ marginTop: "40px", paddingTop: "24px", borderTop: "2px solid #E2E8F0", gap: "0", flexDirection: "column" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "32px", textAlign: "center" }}>
            Firmas de Aprobación
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
            {[
              { titulo: "Elaborado por", nombre: cargo.elaborado_por },
              { titulo: "Revisado por",  nombre: null },
              { titulo: "Aprobado por",  nombre: cargo.aprobado_por },
            ].map((f) => (
              <div key={f.titulo} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "100%", height: "1px", background: "#94A3B8", marginBottom: "4px" }} />
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#0C4A6E" }}>{f.nombre || "________________________"}</div>
                <div style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em" }}>{f.titulo}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer stamp ── */}
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>
            A360 Suite · Manual de Funciones
          </span>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>
            {clienteNombre} · {new Date().toLocaleDateString("es-CO")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Form sub-components ────────────────────────────────────────────────────────
function DynKVList({ value, onChange }: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const pairs = Object.entries(value);
  const addPair = () => {
    const key = `condicion_${Date.now()}`;
    onChange({ ...value, [key]: "" });
  };
  const removeKey = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };
  const renameKey = (oldKey: string, newKey: string) => {
    if (newKey === oldKey) return;
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  };
  const setValue = (key: string, val: string) => onChange({ ...value, [key]: val });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {pairs.map(([key, val]) => (
        <div key={key} style={{ border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px", background: "#FAFBFF" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              value={key.replace(/_/g, " ")}
              onChange={(e) => renameKey(key, e.target.value.trim().replace(/\s+/g, "_") || key)}
              style={{ ...INPUT, fontWeight: 700, fontSize: "12px", flex: 1 }}
              placeholder="Nombre de la condición"
            />
            <button onClick={() => removeKey(key)} style={{ padding: "7px", borderRadius: "7px", border: "1.5px solid #FEE2E2", background: "#FFF5F5", color: "#DC2626", cursor: "pointer", flexShrink: 0 }}>
              <Trash2 style={{ width: "13px", height: "13px" }} />
            </button>
          </div>
          <textarea
            value={val}
            onChange={(e) => setValue(key, e.target.value)}
            rows={2}
            style={{ ...INPUT, resize: "vertical" }}
            placeholder="Descripción…"
          />
        </div>
      ))}
      <button onClick={addPair} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#7F77DD", background: "#F5F3FF", border: "1.5px solid #DDD6FE", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}>
        <Plus style={{ width: "12px", height: "12px" }} /> Agregar condición
      </button>
    </div>
  );
}

function DynStringList({ items, onChange, placeholder }: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const add = () => onChange([...items, ""]);
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const set = (i: number, val: string) => onChange(items.map((v, j) => (j === i ? val : v)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((val, i) => (
        <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input value={val} onChange={(e) => set(i, e.target.value)} style={INPUT} placeholder={placeholder} />
          <button onClick={() => remove(i)} style={{ padding: "8px", borderRadius: "8px", border: "1.5px solid #FEE2E2", background: "#FFF5F5", color: "#DC2626", cursor: "pointer", flexShrink: 0 }}>
            <Trash2 style={{ width: "13px", height: "13px" }} />
          </button>
        </div>
      ))}
      <button onClick={add} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#0EA5E9", background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}>
        <Plus style={{ width: "12px", height: "12px" }} /> Agregar
      </button>
    </div>
  );
}

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
                <select value={String(row[l.field] ?? "")} onChange={(e) => set(i, l.field, e.target.value)} style={INPUT}>
                  {(l.options ?? []).map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={l.type ?? "text"}
                  value={String(row[l.field] ?? "")}
                  onChange={(e) => set(i, l.field, l.type === "number" ? Number(e.target.value) : e.target.value)}
                  style={INPUT}
                />
              )}
            </div>
          ))}
          <button onClick={() => remove(i)} style={{ padding: "8px", borderRadius: "8px", border: "1.5px solid #FEE2E2", background: "#FFF5F5", color: "#DC2626", cursor: "pointer", flexShrink: 0 }}>
            <Trash2 style={{ width: "13px", height: "13px" }} />
          </button>
        </div>
      ))}
      <button onClick={add} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#0EA5E9", background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}>
        <Plus style={{ width: "12px", height: "12px" }} /> Agregar
      </button>
    </div>
  );
}

function FormSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1.5px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#F8FAFF", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#0C4A6E" }}>
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
  const [areas, setAreas]   = useState<Area[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);

  const [areaActiva, setAreaActiva]       = useState<"todas" | string>("todas");
  const [vista, setVista]                 = useState<"lista" | "form" | "preview">("lista");
  const [cargoEditando, setCargoEditando] = useState<Cargo | null>(null);
  const [cargoPreview, setCargoPreview]   = useState<Cargo | null>(null);
  const [form, setForm]                   = useState<FormDatos>({ ...FORM_BLANK });
  const [saving, setSaving]               = useState(false);

  const [modalArea, setModalArea]               = useState(false);
  const [nuevaAreaNombre, setNuevaAreaNombre]   = useState("");
  const [savingArea, setSavingArea]             = useState(false);
  const [deletingId, setDeletingId]             = useState<string | null>(null);

  const toastShown = useRef(false);

  // ── Load ───────────────────────────────────────────────────────────────────
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
      relaciones_internas: c.relaciones_internas ?? [],
      relaciones_externas: c.relaciones_externas ?? [],
      condiciones: c.condiciones ?? {},
    });
    setVista("form");
  }

  function abrirPreview(c: Cargo) {
    setCargoPreview(c);
    setVista("preview");
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
      relaciones_internas: form.relaciones_internas.length ? form.relaciones_internas : null,
      relaciones_externas: form.relaciones_externas.length ? form.relaciones_externas : null,
      condiciones: Object.values(form.condiciones ?? {}).some(Boolean) ? form.condiciones : null,
    };

    if (cargoEditando) {
      const { data, error } = await supabase
        .from("manual_funciones_cargos").update(payload).eq("id", cargoEditando.id).select().single();
      if (error) { toast.error("Error al guardar"); setSaving(false); return; }
      const updated = parseCargo(data as Record<string, unknown>);
      setCargos((prev) => prev.map((c) => (c.id === cargoEditando.id ? updated : c)));
      if (cargoPreview?.id === cargoEditando.id) setCargoPreview(updated);
      toast.success("Cargo actualizado");
    } else {
      const { data, error } = await supabase
        .from("manual_funciones_cargos").insert(payload).select().single();
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
      .select().single();
    if (error) { toast.error("Error al crear área"); setSavingArea(false); return; }
    setAreas((prev) => [...prev, data as Area]);
    setNuevaAreaNombre("");
    setSavingArea(false);
    setModalArea(false);
    toast.success("Área creada");
  }

  // ── Render: preview (full-screen overlay) ──────────────────────────────────
  if (vista === "preview" && cargoPreview) {
    return (
      <PreviewPanel
        cargo={cargoPreview}
        clienteNombre={clienteNombre}
        onClose={() => setVista("lista")}
        onEdit={() => abrirEdicion(cargoPreview)}
      />
    );
  }

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
            <button onClick={() => setVista("lista")} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 600, color: "#64748B", background: "#F1F5F9", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer" }}>
              <X style={{ width: "13px", height: "13px" }} /> Cancelar
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <FormSection title="Identificación del Cargo">
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
            </FormSection>

            <FormSection title="Elaboración y Aprobación" defaultOpen={false}>
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
            </FormSection>

            <FormSection title="Objetivo del Cargo">
              <textarea value={f.objetivo ?? ""} onChange={(e) => setF("objetivo", e.target.value)} rows={3} style={{ ...INPUT, resize: "vertical" }} placeholder="Describa el propósito principal del cargo…" />
            </FormSection>

            <FormSection title="Funciones Principales" defaultOpen={false}>
              <DynList<Funcion>
                items={f.funciones} onChange={(v) => setF("funciones", v)}
                schema={{ descripcion: "", porcentaje_tiempo: 0 }}
                labels={[{ field: "descripcion", label: "Descripción" }, { field: "porcentaje_tiempo", label: "% Tiempo", type: "number" }]}
              />
            </FormSection>

            <FormSection title="Competencias Blandas" defaultOpen={false}>
              <DynList<Competencia>
                items={f.competencias_blandas} onChange={(v) => setF("competencias_blandas", v)}
                schema={{ nombre: "", nivel: "Básico" }}
                labels={[{ field: "nombre", label: "Competencia" }, { field: "nivel", label: "Nivel", type: "select", options: NIVELES }]}
              />
            </FormSection>

            <FormSection title="Competencias Técnicas" defaultOpen={false}>
              <DynList<Competencia>
                items={f.competencias_tecnicas} onChange={(v) => setF("competencias_tecnicas", v)}
                schema={{ nombre: "", nivel: "Básico" }}
                labels={[{ field: "nombre", label: "Competencia" }, { field: "nivel", label: "Nivel", type: "select", options: NIVELES }]}
              />
            </FormSection>

            <FormSection title="KPIs" defaultOpen={false}>
              <DynList<KPI>
                items={f.kpis} onChange={(v) => setF("kpis", v)}
                schema={{ nombre: "", meta: "", frecuencia: "Mensual" }}
                labels={[{ field: "nombre", label: "Indicador" }, { field: "meta", label: "Meta" }, { field: "frecuencia", label: "Frecuencia", type: "select", options: FRECUENCIAS }]}
              />
            </FormSection>

            <FormSection title="Plan de Carrera" defaultOpen={false}>
              <textarea value={f.plan_carrera ?? ""} onChange={(e) => setF("plan_carrera", e.target.value)} rows={3} style={{ ...INPUT, resize: "vertical" }} placeholder="Posibles trayectorias de crecimiento para este cargo…" />
            </FormSection>

            <FormSection title="Relaciones de Trabajo" defaultOpen={false}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <div style={LABEL}>Relaciones Internas</div>
                  <DynStringList
                    items={f.relaciones_internas}
                    onChange={(v) => setF("relaciones_internas", v)}
                    placeholder="Ej: Gerente Financiero — Para X propósito"
                  />
                </div>
                <div>
                  <div style={LABEL}>Relaciones Externas</div>
                  <DynStringList
                    items={f.relaciones_externas}
                    onChange={(v) => setF("relaciones_externas", v)}
                    placeholder="Ej: Proveedor XYZ — Para negociación de contratos"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Condiciones de Trabajo" defaultOpen={false}>
              <DynKVList
                key={cargoEditando?.id ?? "new"}
                value={f.condiciones ?? {}}
                onChange={(v) => setF("condiciones", v)}
              />
            </FormSection>
          </div>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={() => setVista("lista")} style={{ padding: "10px 20px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "white", fontSize: "14px", fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={guardar} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 24px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", color: "white", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              <Check style={{ width: "14px", height: "14px" }} />
              {saving ? "Guardando…" : cargoEditando ? "Actualizar cargo" : "Crear cargo"}
            </button>
          </div>
        </div>

      ) : (

        /* ── LIST VIEW ── */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#0C4A6E", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{clienteNombre}</h1>
              <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
                {cargos.length} cargo{cargos.length !== 1 ? "s" : ""} documentado{cargos.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <button onClick={() => setModalArea(true)} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "8px 14px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "white", fontSize: "13px", fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                <Plus style={{ width: "13px", height: "13px" }} /> Nueva área
              </button>
              <button onClick={abrirNuevo} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                <Plus style={{ width: "13px", height: "13px" }} /> Nuevo cargo
              </button>
            </div>
          </div>

          {/* Area tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {(["todas", ...areas.map((a) => a.id)] as ("todas" | string)[]).map((key) => {
              const areaNombre = key === "todas" ? "" : (areas.find((a) => a.id === key)?.nombre ?? "");
              const count = key === "todas" ? cargos.length : cargos.filter((c) => c.area === areaNombre).length;
              const active = areaActiva === key;
              return (
                <button key={key} onClick={() => setAreaActiva(key)} style={{ padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "1.5px solid", background: active ? "#0C4A6E" : "white", color: active ? "white" : "#64748B", borderColor: active ? "#0C4A6E" : "#E2E8F0" }}>
                  {key === "todas" ? `Todas (${cargos.length})` : `${areaNombre} (${count})`}
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
              <button onClick={abrirNuevo} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #0C4A6E, #1E3A8A)", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                <Plus style={{ width: "13px", height: "13px" }} /> Nuevo cargo
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {cargosFiltrados.map((c) => (
                <div key={c.id} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>

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
                      {c.area}{c.jefe_inmediato ? ` · Reporta a: ${c.jefe_inmediato}` : ""}{c.codigo ? ` · ${c.codigo}` : ""}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", gap: "16px", flexShrink: 0 }}>
                    {[{ val: c.funciones.length, lbl: "func." }, { val: c.kpis.length, lbl: "KPIs" }].map((s) => (
                      <div key={s.lbl} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "16px", fontWeight: 900, color: "#0C4A6E" }}>{s.val}</div>
                        <div style={{ fontSize: "10px", color: "#94A3B8" }}>{s.lbl}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button
                      onClick={() => abrirPreview(c)}
                      style={{ padding: "7px 12px", borderRadius: "8px", border: "1.5px solid #E0E7FF", background: "#F0F4FF", color: "#6366F1", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600 }}
                    >
                      <Eye style={{ width: "12px", height: "12px" }} /> Ver manual
                    </button>
                    <button
                      onClick={() => abrirEdicion(c)}
                      style={{ padding: "7px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "white", color: "#0C4A6E", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600 }}
                    >
                      <Pencil style={{ width: "12px", height: "12px" }} /> Editar
                    </button>
                    {deletingId === c.id ? (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button onClick={() => eliminar(c.id)} style={{ padding: "7px 10px", borderRadius: "8px", border: "none", background: "#DC2626", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>Confirmar</button>
                        <button onClick={() => setDeletingId(null)} style={{ padding: "7px 10px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "white", color: "#64748B", cursor: "pointer", fontSize: "12px" }}>No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingId(c.id)} style={{ padding: "7px", borderRadius: "8px", border: "1.5px solid #FEE2E2", background: "#FFF5F5", color: "#DC2626", cursor: "pointer" }}>
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
