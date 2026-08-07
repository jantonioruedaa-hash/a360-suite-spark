import { createFileRoute, useParams, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { z } from "zod";
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
import { Lock, ChevronLeft, ChevronRight } from "lucide-react";

const INDIGO = "#4338CA";
const DARK   = "#1E1B4B";

const searchSchema = z.object({ s: z.string().optional() });

export const Route = createFileRoute("/app/clientes/$clienteId/plan")({
  component: PlanPage,
  validateSearch: searchSchema,
});

function PlanPage() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/plan" });
  const { s: seccionKeyParam } = useSearch({ from: "/app/clientes/$clienteId/plan" });
  const [cliente, setCliente] = useState<ClienteCtx | null>(null);
  const [plan, setPlan]       = useState<PlanRow | null>(null);
  const [loading, setLoading] = useState(true);

  const seccionKey       = seccionKeyParam ?? "01";
  const seccion          = seccionPorKey(seccionKey) ?? SECCIONES_PLAN[0];
  const nivel: NivelPlan = normalizarNivel(cliente?.plan_licencia);
  const seccionesVisibles = useMemo(() => seccionesParaNivel(nivel), [nivel]);
  const sectorKey        = detectSector(cliente?.sector);
  const tamano           = detectTamano(cliente?.num_empleados);

  useEffect(() => {
    cargarPlan(clienteId).then(({ cliente, plan }) => {
      setCliente(cliente);
      setPlan(plan);
      setLoading(false);
    });
  }, [clienteId]);

  if (loading || !cliente) {
    return (
      <div style={{ padding: "64px", textAlign: "center", color: "#94A3B8", fontSize: 15, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        Cargando plan estratégico…
      </div>
    );
  }

  const seccionData = (plan?.[seccion.columna] as SeccionData | null) ?? { data: {}, analisis_ia: null };
  const datos       = (seccionData.data ?? {}) as Record<string, unknown>;
  const accesoOk    = seccion.niveles.includes(nivel);
  const pct         = completitudPlan(plan, nivel);

  // Índice navegación
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
            {cliente.nombre_empresa}
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
      {/* Outer wrapper is sticky+positioned so the absolute fade is correctly anchored */}
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
        {/* Right-edge fade — matches the nav's actual right-side gradient tone (#312E81) */}
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

// ─────────────────────────────────────────────────────────
// Editor de sección — wrapper con autosave + IA
// ─────────────────────────────────────────────────────────
function SeccionEditor({ clienteId, cliente, sectorKey, seccion, datos, analisis, analisisFecha }: {
  clienteId: string;
  cliente: ClienteCtx;
  sectorKey: ReturnType<typeof detectSector>;
  seccion: typeof SECCIONES_PLAN[number];
  datos: Record<string, unknown>;
  analisis: string | null;
  analisisFecha: string | null;
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
      <div style={{ marginBottom: 16 }}>
        <MarcoSeccionBanner seccion={seccion} clienteId={clienteId} />
      </div>
      {renderSeccion()}
      {seccion.numero <= 18 && (
        <AnalisisIABox
          clienteId={clienteId}
          columna={seccion.columna}
          seccionTitulo={seccion.titulo}
          contextoEmpresa={contexto}
          datosSeccion={data}
          analisisActual={iaTexto}
          analisisFecha={iaFecha}
          onAnalisisGenerado={(t, f) => { setIaTexto(t); setIaFecha(f); }}
        />
      )}
    </div>
  );
}
