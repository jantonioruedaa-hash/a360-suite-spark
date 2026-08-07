import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SECCIONES_PLAN, completitudPlan, normalizarNivel, type NivelPlan } from "@/lib/plan-helpers";
import { MarcoSeccionCard } from "@/components/plan/MarcoSeccionCard";
import { Target, ArrowRight, Briefcase } from "lucide-react";

export const Route = createFileRoute("/app/plan")({ component: PlanPanel });

type TabId = "resumen" | "marco";

interface Fila {
  cliente_id: string;
  nombre_empresa: string;
  plan_licencia: NivelPlan;
  sector: string | null;
  pct: number;
  ultimaActualizacion: string | null;
  hasPlan: boolean;
}

const INDIGO = "#4338CA";
const DARK   = "#1E1B4B";

const SL = {
  fontSize: 12, fontWeight: 700, color: INDIGO,
  textTransform: "uppercase" as const, letterSpacing: "0.15em",
  display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
};
const SLL = {
  display: "inline-block", width: 28, height: 3,
  background: `linear-gradient(90deg, ${INDIGO}, #818CF8)`, borderRadius: 2,
};

const TABS: { id: TabId; label: string }[] = [
  { id: "resumen", label: "🗂️ Resumen" },
  { id: "marco",   label: "📐 Marco metodológico" },
];

function PlanPanel() {
  const [tab, setTab]     = useState<TabId>("resumen");
  const [filas, setFilas] = useState<Fila[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: clientes }, { data: planes }] = await Promise.all([
        supabase.from("clientes").select("id,nombre_empresa,plan_licencia,sector").eq("activo", true).order("nombre_empresa"),
        supabase.from("planes_estrategicos").select("*"),
      ]);
      const planByCliente = new Map<string, Record<string, unknown>>();
      (planes ?? []).forEach((p: Record<string, unknown>) => planByCliente.set(p.cliente_id as string, p));
      const out: Fila[] = (clientes ?? []).map((c) => {
        const p = planByCliente.get(c.id);
        const nivel = normalizarNivel(c.plan_licencia);
        return {
          cliente_id: c.id,
          nombre_empresa: c.nombre_empresa,
          plan_licencia: nivel,
          sector: c.sector ?? null,
          pct: completitudPlan(p ?? null, nivel),
          ultimaActualizacion: (p?.updated_at as string) ?? null,
          hasPlan: !!p,
        };
      });
      setFilas(out.sort((a, b) => (b.hasPlan ? 1 : 0) - (a.hasPlan ? 1 : 0) || b.pct - a.pct));
      setLoading(false);
    })();
  }, []);

  const conPlan  = filas.filter((f) => f.hasPlan).length;
  const promedio = filas.length ? Math.round(filas.reduce((a, f) => a + f.pct, 0) / filas.length) : 0;

  const HERO_STATS = [
    { val: loading ? "—" : String(filas.length), lbl: "Clientes activos" },
    { val: loading ? "—" : String(conPlan),       lbl: "Con plan iniciado" },
    { val: loading ? "—" : `${promedio}%`,         lbl: "Avance promedio" },
    { val: String(SECCIONES_PLAN.length),           lbl: "Secciones del marco" },
  ];

  return (
    <div style={{ margin: "-24px -24px 0", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Hero ── */}
      <div style={{ background: `linear-gradient(135deg, ${DARK} 0%, ${INDIGO} 100%)`, padding: "64px 64px 56px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 85% 30%, rgba(129,140,248,0.18), transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: -20, bottom: -55, fontSize: 220, fontWeight: 900, color: "rgba(255,255,255,0.025)", letterSpacing: "-0.05em", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>PE</div>

        <div style={{ position: "relative", zIndex: 2, maxWidth: 800 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "7px 18px 7px 12px", fontSize: 12, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 22 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#818CF8", display: "inline-block" }} />
            Suite · Plan Estratégico
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
            Marco estratégico de{" "}
            <span style={{ background: "linear-gradient(135deg, #A5B4FC, #C4B5FD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              18 secciones
            </span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", lineHeight: 1.85, maxWidth: 680, textAlign: "justify", marginBottom: 0 }}>
            Herramienta de planificación estructurada en tres niveles de profundidad — esencial, avanzado y corporativo. Cada cliente accede a las secciones según su licencia, desde los fundamentos de identidad hasta el cuadro de mando integral.
          </p>
          <div style={{ display: "flex", gap: 0, paddingTop: 32, marginTop: 32, borderTop: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap" }}>
            {HERO_STATS.map((s, i) => (
              <div key={i} style={{ paddingRight: 40, marginRight: 40, borderRight: i < HERO_STATS.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none", marginBottom: 8 }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Inner nav ── */}
      <div style={{ background: `linear-gradient(135deg, ${DARK}, #312E81)`, display: "flex", gap: 0, padding: "0 64px", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, zIndex: 40 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "17px 24px", fontSize: 14,
              fontWeight: tab === t.id ? 700 : 600,
              color: tab === t.id ? "#A5B4FC" : "rgba(255,255,255,0.55)",
              background: "transparent", border: "none",
              borderBottom: `3px solid ${tab === t.id ? "#818CF8" : "transparent"}`,
              cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Resumen ── */}
      {tab === "resumen" && (
        <>
          {/* Stat cards */}
          <div style={{ padding: "48px 64px 32px", background: "#F5F7FF" }}>
            <div style={SL}><span style={SLL} />Panorama del módulo</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
              {[
                { val: loading ? "—" : String(filas.length), lbl: "Clientes activos",   sub: "Con licencia activa" },
                { val: loading ? "—" : String(conPlan),       lbl: "Con plan iniciado",  sub: "Al menos una sección" },
                { val: loading ? "—" : `${promedio}%`,         lbl: "Avance promedio",    sub: "Completitud del grupo" },
                { val: String(SECCIONES_PLAN.length),           lbl: "Secciones del marco", sub: "3 niveles de profundidad" },
              ].map((s, i) => (
                <div key={i} style={{ background: `linear-gradient(135deg, ${DARK}, #312E81)`, borderRadius: 16, padding: 28, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(129,140,248,0.2), transparent)", pointerEvents: "none" }} />
                  <div style={{ fontSize: 40, fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1, position: "relative", zIndex: 2 }}>{s.val}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginTop: 6, position: "relative", zIndex: 2 }}>{s.lbl}</div>
                  <div style={{ fontSize: 12, color: "#A5B4FC", marginTop: 4, fontWeight: 600, position: "relative", zIndex: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Client list */}
          <div style={{ padding: "0 64px 64px", background: "#F5F7FF" }}>
            <div style={{ background: "white", borderRadius: 18, border: "1px solid #E0E7FF", overflow: "hidden" }}>
              <div style={{ padding: "22px 28px", borderBottom: "1px solid #E0E7FF", display: "flex", alignItems: "center", gap: 10 }}>
                <Target style={{ width: 18, height: 18, color: INDIGO }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: DARK }}>Planes por cliente</span>
              </div>
              {loading ? (
                <div style={{ padding: "48px", textAlign: "center", fontSize: 15, color: "#94A3B8" }}>Cargando…</div>
              ) : filas.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", fontSize: 15, color: "#94A3B8" }}>No hay clientes activos. Crea un cliente desde Mis clientes.</div>
              ) : (
                <div>
                  {filas.map((f, i) => (
                    <Link
                      key={f.cliente_id}
                      to="/app/clientes/$clienteId/plan"
                      params={{ clienteId: f.cliente_id }}
                      style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 16, padding: "14px 28px", borderBottom: i < filas.length - 1 ? "1px solid #F0F4FF" : "none", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F5F7FF")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${DARK}, ${INDIGO})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Briefcase style={{ width: 18, height: 18, color: "white" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>{f.nombre_empresa}</div>
                        <div style={{ fontSize: 12, color: "#94A3B8" }}>
                          {f.sector ?? "Sin sector"} · {f.ultimaActualizacion ? `Actualizado ${new Date(f.ultimaActualizacion).toLocaleDateString("es-EC")}` : "Sin actividad"}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "#EEF2FF", color: INDIGO, textTransform: "capitalize", flexShrink: 0 }}>
                        {f.plan_licencia}
                      </span>
                      <div style={{ width: 120, flexShrink: 0 }}>
                        <div style={{ height: 6, background: "#E0E7FF", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${f.pct}%`, background: `linear-gradient(90deg, ${INDIGO}, #818CF8)`, borderRadius: 999, transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: INDIGO, width: 36, textAlign: "right", flexShrink: 0 }}>{f.pct}%</span>
                      <ArrowRight style={{ width: 16, height: 16, color: "#C7D2FE", flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Marco metodológico ── */}
      {tab === "marco" && (
        <div style={{ padding: "48px 64px 64px", background: "#F5F7FF" }}>
          <div style={SL}><span style={SLL} />Marco metodológico completo</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: DARK, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>
            Las{" "}
            <span style={{ background: `linear-gradient(135deg, ${INDIGO}, #818CF8)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              18 secciones
            </span>
            {" "}del plan
          </h2>
          <p style={{ fontSize: 17, color: "#64748B", lineHeight: 1.85, maxWidth: 720, marginBottom: 40, textAlign: "justify" }}>
            Cada sección tiene un propósito metodológico definido, preguntas detonadoras, KPIs sugeridos y conexiones con otras partes del plan. Haz clic en cualquiera para explorar su marco completo.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {SECCIONES_PLAN.map((s) => (
              <MarcoSeccionCard key={s.key} seccion={s} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
