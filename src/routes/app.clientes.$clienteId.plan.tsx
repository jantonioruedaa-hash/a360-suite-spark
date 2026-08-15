import { createFileRoute, useParams, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  SECCIONES_PLAN, seccionesParaNivel, seccionPorKey,
  normalizarNivel, completitudPlan,
  type NivelPlan, type SeccionData,
} from "@/lib/plan-helpers";
import { cargarPlan } from "@/lib/plan-service";
import type { ClienteCtx, PlanRow } from "@/types/plan";
import { detectSector, detectTamano } from "@/lib/plan-catalogo";
import { AnalisisIABox } from "@/components/plan/AnalisisIABox";
import { MarcoSeccionBanner } from "@/components/plan/MarcoSeccionCard";
import { usePlanSeccionAutosave, AutosaveBadge } from "@/components/plan/usePlanAutosave";
import { Sec01, Sec02, Sec03, Sec04, Sec05, type Sec01Data, type Sec02Data, type Sec03Data, type Sec04Data, type Sec05Data } from "@/components/plan/secciones-1-5";
import { Sec06, Sec07, Sec08, Sec09, type Sec06Data, type Sec07Data, type Sec08Data, type Sec09Data } from "@/components/plan/secciones-6-9";
import { Sec10, Sec11, Sec12, Sec13, type Sec10Data, type Sec11Data, type Sec12Data, type Sec13Data } from "@/components/plan/secciones-10-13";
import { Sec14, Sec15, Sec16, Sec17, Sec18, type Sec14Data, type Sec15Data, type Sec16Data, type Sec17Data, type Sec18Data } from "@/components/plan/secciones-14-18";
import { Lock, ChevronLeft, ChevronRight, Check, ArrowRight } from "lucide-react";

const INDIGO = "#4338CA";
const DARK   = "#1E1B4B";

const searchSchema = z.object({ s: z.string().optional() });

export const Route = createFileRoute("/app/clientes/$clienteId/plan")({
  component: PlanPage,
  validateSearch: searchSchema,
});

// ── Premium gate (mismo patrón que SIDE) ─────────────────────────────────────
function PlanPremiumGate() {
  return (
    <div style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE", borderRadius: 12, padding: "24px 28px", marginTop: 16 }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: DARK, marginBottom: 8 }}>
        Marco metodológico y análisis con IA
      </div>
      <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.75, marginBottom: 16 }}>
        Desbloquea el marco metodológico estratégico y el análisis con IA de cada sección con el acompañamiento Advisory Premium de A360SGP.
      </p>
      <div style={{ background: INDIGO, borderRadius: 8, padding: "10px 16px", display: "inline-block" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>
          Habla con tu consultor para activar este módulo.
        </span>
      </div>
    </div>
  );
}

// ── Portada / landing del módulo ──────────────────────────────────────────────
function PlanPortada({
  cliente, plan, nivel, clienteId, pct, esCliente,
}: {
  cliente: ClienteCtx;
  plan: PlanRow | null;
  nivel: NivelPlan;
  clienteId: string;
  pct: number;
  esCliente: boolean;
}) {
  const sectorKey = detectSector(cliente.sector);
  const tamano    = detectTamano(cliente.num_empleados);
  const seccionesVisibles = seccionesParaNivel(nivel);

  return (
    <div style={{ margin: "-24px -24px 0", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK}, #312E81)`,
        padding: "20px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>
            Plan Estratégico
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "white", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {esCliente ? "Mi plan estratégico" : cliente.nombre_empresa}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ background: "rgba(165,180,252,0.18)", color: "#A5B4FC", padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "capitalize", border: "1px solid rgba(165,180,252,0.2)" }}>
              {nivel}
            </span>
            <span>{sectorKey}</span>
            {tamano && <><span style={{ color: "rgba(255,255,255,0.25)" }}>·</span><span>{tamano}</span></>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7, minWidth: 180 }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "baseline" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>Completitud</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#A5B4FC", letterSpacing: "-0.02em" }}>{pct}%</span>
          </div>
          <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${INDIGO}, #818CF8)`, borderRadius: 999, transition: "width 0.6s ease" }} />
          </div>
        </div>
      </div>

      {/* ── Grid de secciones ── */}
      <div style={{ background: "#F5F7FF", padding: "32px 48px 64px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: INDIGO, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-block", width: 28, height: 3, background: `linear-gradient(90deg, ${INDIGO}, #818CF8)`, borderRadius: 2 }} />
          {seccionesVisibles.length} secciones · Selecciona una para comenzar
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {SECCIONES_PLAN.map((s) => {
            const enabled   = s.niveles.includes(nivel);
            const secData   = (plan?.[s.columna] as SeccionData | null);
            const tieneData = secData?.data != null && Object.keys(secData.data as Record<string, unknown>).length > 0;
            const tieneIA   = !!secData?.analisis_ia;
            const Icon      = s.icon;
            return (
              <Link
                key={s.key}
                to="/app/clientes/$clienteId/plan"
                params={{ clienteId }}
                search={{ s: s.key }}
                onClick={(e) => { if (!enabled) e.preventDefault(); }}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: tieneData ? "white" : "#FAFBFF",
                    border: `1px solid ${tieneData ? "#C7D2FE" : "#E0E7FF"}`,
                    borderRadius: 12,
                    padding: "16px 18px",
                    opacity: enabled ? 1 : 0.45,
                    cursor: enabled ? "pointer" : "not-allowed",
                    transition: "all 0.15s",
                    display: "flex", flexDirection: "column", gap: 8,
                    minHeight: 110,
                  }}
                  onMouseEnter={(e) => { if (enabled) { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 6px 18px rgba(67,56,202,0.12)"; el.style.borderColor = "#818CF8"; } }}
                  onMouseLeave={(e) => { if (enabled) { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "none"; el.style.borderColor = tieneData ? "#C7D2FE" : "#E0E7FF"; } }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: tieneData ? INDIGO : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {tieneData
                        ? <Check style={{ width: 14, height: 14, color: "white" }} />
                        : <Icon style={{ width: 14, height: 14, color: INDIGO }} />
                      }
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: "#818CF8", fontWeight: 700 }}>
                      {String(s.numero).padStart(2, "0")}
                    </span>
                    {!enabled && <Lock style={{ width: 11, height: 11, color: "#94A3B8", marginLeft: "auto" }} />}
                    {tieneIA && enabled && (
                      <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: "#EFF6FF", color: "#0369A1" }}>IA</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tieneData ? DARK : "#475569", lineHeight: 1.35 }}>
                    {s.titulo}
                  </div>
                  {enabled && (
                    <div style={{ fontSize: 11, color: tieneData ? INDIGO : "#94A3B8", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>
                      {tieneData ? "Editada" : "Sin completar"}
                      <ArrowRight style={{ width: 10, height: 10 }} />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
function PlanPage() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/plan" });
  const { s: seccionKeyParam } = useSearch({ from: "/app/clientes/$clienteId/plan" });
  const { role } = useAuth();
  const [cliente, setCliente] = useState<ClienteCtx | null>(null);
  const [plan, setPlan]       = useState<PlanRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [accesoInterpretacion, setAccesoInterpretacion] = useState(false);

  const esCliente = role === "cliente" || role === "participante";

  useEffect(() => {
    cargarPlan(clienteId).then(({ cliente, plan }) => {
      setCliente(cliente);
      setPlan(plan);
      setLoading(false);
    });
  }, [clienteId]);

  useEffect(() => {
    if (!esCliente) return;
    supabase
      .from("clientes")
      .select("acceso_interpretacion")
      .eq("id", clienteId)
      .maybeSingle()
      .then(({ data }) => setAccesoInterpretacion(data?.acceso_interpretacion ?? false));
  }, [clienteId, esCliente]);

  const puedeVerInterpretacion = !esCliente || accesoInterpretacion;

  if (loading || !cliente) {
    return (
      <div style={{ padding: "64px", textAlign: "center", color: "#94A3B8", fontSize: 15, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        Cargando plan estratégico…
      </div>
    );
  }

  const nivel: NivelPlan       = normalizarNivel(cliente.plan_licencia);
  const seccionesVisibles       = seccionesParaNivel(nivel);
  const pct                     = completitudPlan(plan, nivel);

  // Sin sección seleccionada → portada del módulo
  if (!seccionKeyParam) {
    return (
      <PlanPortada
        cliente={cliente}
        plan={plan}
        nivel={nivel}
        clienteId={clienteId}
        pct={pct}
        esCliente={esCliente}
      />
    );
  }

  const sectorKey  = detectSector(cliente.sector);
  const tamano     = detectTamano(cliente.num_empleados);
  const seccion    = seccionPorKey(seccionKeyParam) ?? SECCIONES_PLAN[0];
  const accesoOk   = seccion.niveles.includes(nivel);
  const seccionData = (plan?.[seccion.columna] as SeccionData | null) ?? { data: {}, analisis_ia: null };
  const datos       = (seccionData.data ?? {}) as Record<string, unknown>;

  const idx  = seccionesVisibles.findIndex((s) => s.key === seccion.key);
  const prev = idx > 0 ? seccionesVisibles[idx - 1] : null;
  const next = idx < seccionesVisibles.length - 1 ? seccionesVisibles[idx + 1] : null;

  return (
    <div style={{ margin: "-24px -24px 0", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Compact hero banner ── */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK}, #312E81)`,
        padding: "20px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>
            Plan Estratégico
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "white", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {esCliente ? "Mi plan estratégico" : cliente.nombre_empresa}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ background: "rgba(165,180,252,0.18)", color: "#A5B4FC", padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "capitalize", border: "1px solid rgba(165,180,252,0.2)" }}>
              {nivel}
            </span>
            <span>{sectorKey}</span>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
            <span>{tamano}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7, minWidth: 180 }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "baseline" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>Completitud</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#A5B4FC", letterSpacing: "-0.02em" }}>{pct}%</span>
          </div>
          <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${INDIGO}, #818CF8)`, borderRadius: 999, transition: "width 0.6s ease" }} />
          </div>
        </div>
      </div>

      {/* ── 18-tab nav ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: `linear-gradient(135deg, ${DARK}, #312E81)`, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ overflowX: "auto", overflowY: "hidden" }}>
          <div style={{ display: "flex", minWidth: "max-content", padding: "0 40px" }}>
            {SECCIONES_PLAN.map((s) => {
              const enabled = s.niveles.includes(nivel);
              const active  = s.key === seccion.key;
              const Icon    = s.icon;
              return (
                <Link
                  key={s.key}
                  to="/app/clientes/$clienteId/plan"
                  params={{ clienteId }}
                  search={{ s: s.key }}
                  disabled={!enabled}
                  onClick={(e) => { if (!enabled) e.preventDefault(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "14px 12px",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: !enabled ? "rgba(255,255,255,0.25)" : active ? "#A5B4FC" : "rgba(255,255,255,0.55)",
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                    borderTop: "3px solid transparent",
                    borderBottom: `3px solid ${active ? "#818CF8" : "transparent"}`,
                    cursor: !enabled ? "not-allowed" : "pointer",
                    transition: "color 0.15s, border-color 0.15s",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontFamily: "monospace", fontSize: 10, opacity: 0.5, letterSpacing: "0.02em" }}>
                    {String(s.numero).padStart(2, "0")}
                  </span>
                  <Icon style={{ width: 13, height: 13 }} />
                  <span>{s.corto}</span>
                  {!enabled && <Lock style={{ width: 11, height: 11, color: "rgba(255,255,255,0.25)", marginLeft: 1 }} />}
                </Link>
              );
            })}
          </div>
        </div>
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 72,
          background: "linear-gradient(to left, #312E81 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
      </div>

      {/* ── Main content ── */}
      <div style={{ background: "#F5F7FF", minHeight: "50vh", padding: "32px 48px 64px" }}>

        {!accesoOk ? (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E0E7FF", padding: "64px 48px", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <Lock style={{ width: 40, height: 40, color: "#C7D2FE", margin: "0 auto 16px", display: "block" }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: DARK, marginBottom: 10, letterSpacing: "-0.02em" }}>
              Sección no disponible en tu licencia
            </h3>
            <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.85, textAlign: "justify" }}>
              "{seccion.titulo}" requiere licencia{" "}
              <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{seccion.niveles.join(" / ")}</span>.
              Tu cliente tiene licencia{" "}
              <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{nivel}</span>.
            </p>
          </div>
        ) : (
          <SeccionEditor
            clienteId={clienteId}
            cliente={cliente}
            sectorKey={sectorKey}
            seccion={seccion}
            datos={datos}
            analisis={seccionData.analisis_ia ?? null}
            analisisFecha={seccionData.analisis_ia_fecha ?? null}
            puedeVerInterpretacion={puedeVerInterpretacion}
            esCliente={esCliente}
          />
        )}

        {/* ── Prev / Next navigation ── */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 32, marginTop: 32, borderTop: "1px solid #E0E7FF" }}>
          {prev ? (
            <Link
              to="/app/clientes/$clienteId/plan"
              params={{ clienteId }}
              search={{ s: prev.key }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: INDIGO, textDecoration: "none", padding: "8px 16px", borderRadius: 8, border: "1px solid #C7D2FE", background: "white", transition: "background 0.15s, border-color 0.15s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "#EEF2FF"; el.style.borderColor = INDIGO; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "white"; el.style.borderColor = "#C7D2FE"; }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
              {String(prev.numero).padStart(2, "0")} · {prev.corto}
            </Link>
          ) : <span />}

          {next ? (
            <Link
              to="/app/clientes/$clienteId/plan"
              params={{ clienteId }}
              search={{ s: next.key }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: INDIGO, textDecoration: "none", padding: "8px 16px", borderRadius: 8, border: "1px solid #C7D2FE", background: "white", transition: "background 0.15s, border-color 0.15s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "#EEF2FF"; el.style.borderColor = INDIGO; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "white"; el.style.borderColor = "#C7D2FE"; }}
            >
              {String(next.numero).padStart(2, "0")} · {next.corto}
              <ChevronRight style={{ width: 16, height: 16 }} />
            </Link>
          ) : <span />}
        </div>

      </div>
    </div>
  );
}

// ── Editor de sección ─────────────────────────────────────────────────────────
function SeccionEditor({ clienteId, cliente, sectorKey, seccion, datos, analisis, analisisFecha, puedeVerInterpretacion, esCliente }: {
  clienteId: string;
  cliente: ClienteCtx;
  sectorKey: ReturnType<typeof detectSector>;
  seccion: typeof SECCIONES_PLAN[number];
  datos: Record<string, unknown>;
  analisis: string | null;
  analisisFecha: string | null;
  puedeVerInterpretacion: boolean;
  esCliente: boolean;
}) {
  const [data, setData]       = useState<Record<string, unknown>>(datos);
  const [iaTexto, setIaTexto] = useState<string | null>(analisis);
  const [iaFecha, setIaFecha] = useState<string | null>(analisisFecha);

  const { estado, ultimoGuardado } = usePlanSeccionAutosave({
    clienteId, columna: seccion.columna, data, analisis_ia: iaTexto, analisis_ia_fecha: iaFecha,
  });

  const contexto = `Empresa: ${cliente.nombre_empresa} | Sector: ${cliente.sector || "—"} | País: ${cliente.pais || "—"} | Empleados: ${cliente.num_empleados || "—"} | Licencia: ${cliente.plan_licencia}`;

  const renderSeccion = () => {
    switch (seccion.numero) {
      case 1:  return <Sec01 data={data as Sec01Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 2:  return <Sec02 data={data as Sec02Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 3:  return <Sec03 data={data as Sec03Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 4:  return <Sec04 data={data as Sec04Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 5:  return <Sec05 data={data as Sec05Data} onChange={(d) => setData(d as Record<string, unknown>)} />;
      case 6:  return <Sec06 data={data as Sec06Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 7:  return <Sec07 data={data as Sec07Data} onChange={(d) => setData(d as Record<string, unknown>)} />;
      case 8:  return <Sec08 data={data as unknown as Sec08Data} onChange={(d) => setData(d as unknown as Record<string, unknown>)} />;
      case 9:  return <Sec09 data={data as Sec09Data} onChange={(d) => setData(d as Record<string, unknown>)} />;
      case 10: return <Sec10 data={data as Sec10Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 11: return <Sec11 data={data as Sec11Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 12: return <Sec12 data={data as Sec12Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 13: return <Sec13 data={data as Sec13Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 14: return <Sec14 data={data as Sec14Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 15: return <Sec15 data={data as Sec15Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 16: return <Sec16 data={data as Sec16Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 17: return <Sec17 data={data as Sec17Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      case 18: return <Sec18 data={data as Sec18Data} onChange={(d) => setData(d as Record<string, unknown>)} sector={sectorKey} />;
      default:
        return (
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #E0E7FF", padding: "48px", textAlign: "center", color: "#94A3B8", fontSize: 15 }}>
            Esta sección estará disponible próximamente.
          </div>
        );
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: DARK, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
          <span style={{ color: "#818CF8", fontWeight: 900 }}>{String(seccion.numero).padStart(2, "0")}.</span>
          {seccion.titulo}
        </h2>
        <AutosaveBadge estado={estado} ultimoGuardado={ultimoGuardado} />
      </div>

      {/* Marco metodológico — gateado para clientes sin acceso */}
      {puedeVerInterpretacion && (
        <div style={{ marginBottom: 16 }}>
          <MarcoSeccionBanner seccion={seccion} clienteId={clienteId} />
        </div>
      )}

      {renderSeccion()}

      {/* Análisis IA — gateado para clientes sin acceso */}
      {seccion.numero <= 18 && (
        puedeVerInterpretacion ? (
          <AnalisisIABox
            clienteId={clienteId}
            columna={seccion.columna}
            seccionTitulo={seccion.titulo}
            contextoEmpresa={contexto}
            datosSeccion={data}
            analisisActual={iaTexto}
            analisisFecha={iaFecha}
            onAnalisisGenerado={(t, f) => { setIaTexto(t); setIaFecha(f); }}
            readOnly={esCliente}
          />
        ) : (
          <PlanPremiumGate />
        )
      )}
    </div>
  );
}
