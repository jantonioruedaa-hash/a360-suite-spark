import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowRight, Plus, FileText,
  AlertTriangle, CheckCircle2, BarChart3, Target, Rocket, Users,
} from "lucide-react";

export const Route = createFileRoute("/app/manual-funciones/")({
  component: ManualFuncionesPanel,
});

type Cliente = { id: string; nombre_empresa: string };
type CargoSummary = { cliente_id: string; estado: string | null; area: string | null };

// ── Style constants ────────────────────────────────────────────────────────────
const SL: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#0EA5E9",
  textTransform: "uppercase", letterSpacing: "0.14em",
  display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px",
};
const STRIPE: React.CSSProperties = {
  display: "inline-block", width: "28px", height: "3px",
  background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px",
};

// ── Static content ─────────────────────────────────────────────────────────────
const PAIN = [
  {
    title: "Duplicidad de funciones y conflictos",
    desc: "Dos personas creen que el mismo trabajo es del otro, o lo hacen en paralelo sin coordinación.",
  },
  {
    title: "Sin KPIs claros por cargo",
    desc: "Imposible evaluar el desempeño con criterios objetivos. Cada jefe mide diferente.",
  },
  {
    title: "Nadie sabe a quién reportar",
    desc: "La estructura de autoridad es verbal e informal. Los conflictos escalan sin control.",
  },
];

const OUTCOMES = [
  {
    icon: Users,
    title: "Claridad organizacional total",
    desc: "Cada persona sabe exactamente qué hace, a quién reporta y con quién se relaciona.",
  },
  {
    icon: BarChart3,
    title: "KPIs definidos por cargo",
    desc: "Metas concretas y medibles para cada posición. Evaluaciones objetivas y justas.",
  },
  {
    icon: Target,
    title: "Evaluaciones objetivas",
    desc: "El desempeño se mide con estándares claros, no con percepciones subjetivas del jefe.",
  },
  {
    icon: Rocket,
    title: "Rutas de carrera motivadoras",
    desc: "Cada colaborador visualiza su próximo paso y trabaja hacia él con propósito claro.",
  },
];

// ── Component ──────────────────────────────────────────────────────────────────
function ManualFuncionesPanel() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargos, setCargos] = useState<CargoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Wait for auth session to be ready before querying — prevents JWT-stale race condition
    if (!user) return;

    setLoadError(false);
    Promise.allSettled([
      supabase.from("clientes").select("id,nombre_empresa").order("nombre_empresa"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("manual_funciones_cargos").select("cliente_id,estado,area"),
    ]).then(([clResult, caResult]) => {
      const cl = clResult.status === "fulfilled" ? clResult.value.data : null;
      const ca = caResult.status === "fulfilled" ? caResult.value.data : null;
      if (cl === null && ca === null) {
        setLoadError(true);
      } else {
        setClientes((cl ?? []) as Cliente[]);
        setCargos((ca ?? []) as CargoSummary[]);
      }
    }).finally(() => {
      setLoading(false);
    });

    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, [user]);

  const data = clientes.map((c) => {
    const myCargos = cargos.filter((x) => x.cliente_id === c.id);
    return {
      ...c,
      total: myCargos.length,
      vigentes: myCargos.filter((x) => x.estado === "vigente").length,
    };
  });

  const totalAreas = new Set(cargos.map((c) => c.area).filter(Boolean)).size;
  const conCargos = data.filter((d) => d.total > 0).sort((a, b) => b.total - a.total);
  const sinCargos = data.filter((d) => d.total === 0);

  return (
    <div className="max-w-5xl space-y-10">

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 55%, #312E81 100%)",
        borderRadius: "20px", padding: "56px 52px 52px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 70% at 90% 10%, rgba(14,165,233,0.18), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 40% 60% at 10% 90%, rgba(99,102,241,0.12), transparent)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>

          {/* ── Left column ── */}
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" }}>
              Módulo Organizacional · A360 Suite
            </div>
            <h1 style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 900, color: "white", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Manual de<br />Funciones
            </h1>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", margin: "0 0 32px", lineHeight: 1.75, maxWidth: "400px" }}>
              Estructura el talento de tu empresa con precisión. Define roles, competencias, KPIs y rutas de carrera para cada cargo.
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[
                { val: cargos.length, lbl: "Cargos documentados" },
                { val: totalAreas,    lbl: "Áreas activas" },
                { val: clientes.length, lbl: "Empresas" },
              ].map((s) => (
                <div key={s.lbl} style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "12px", padding: "12px 20px", minWidth: "90px" }}>
                  <div style={{ fontSize: "28px", fontWeight: 900, color: "white", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "5px" }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column — SVG diagram ── */}
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s",
          }}>
            <svg viewBox="0 0 340 210" style={{ width: "100%", maxWidth: "340px", display: "block", margin: "0 auto" }}>
              {/* EMPRESA */}
              <rect x="110" y="6" width="120" height="36" rx="9" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <text x="170" y="28" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="system-ui,sans-serif">EMPRESA</text>

              {/* Tree lines */}
              <line x1="170" y1="42" x2="170" y2="68" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <line x1="55"  y1="68" x2="285" y2="68" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <line x1="55"  y1="68" x2="55"  y2="84" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <line x1="170" y1="68" x2="170" y2="84" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <line x1="285" y1="68" x2="285" y2="84" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

              {/* Area: Comercial */}
              <rect x="10"  y="84" width="90" height="26" rx="7" fill="rgba(14,165,233,0.25)"  stroke="rgba(56,189,248,0.6)"  strokeWidth="1.2" />
              <text x="55"  y="101" textAnchor="middle" fill="#38BDF8" fontSize="9.5" fontWeight="bold" fontFamily="system-ui,sans-serif">Comercial</text>
              <line x1="55"  y1="110" x2="55"  y2="124" stroke="rgba(56,189,248,0.35)" strokeWidth="1" />
              <rect x="5"   y="124" width="100" height="20" rx="5" fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="55"  y="138" textAnchor="middle" fill="rgba(255,255,255,0.82)" fontSize="8" fontFamily="system-ui,sans-serif">Gerente de Ventas</text>
              <rect x="5"   y="148" width="100" height="20" rx="5" fill="rgba(255,255,255,0.06)" />
              <text x="55"  y="162" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="system-ui,sans-serif">Asesor Comercial</text>

              {/* Area: RRHH */}
              <rect x="125" y="84" width="90" height="26" rx="7" fill="rgba(99,102,241,0.25)" stroke="rgba(129,140,248,0.6)" strokeWidth="1.2" />
              <text x="170" y="101" textAnchor="middle" fill="#A5B4FC" fontSize="9.5" fontWeight="bold" fontFamily="system-ui,sans-serif">RRHH</text>
              <line x1="170" y1="110" x2="170" y2="124" stroke="rgba(129,140,248,0.35)" strokeWidth="1" />
              <rect x="120" y="124" width="100" height="20" rx="5" fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="170" y="138" textAnchor="middle" fill="rgba(255,255,255,0.82)" fontSize="8" fontFamily="system-ui,sans-serif">Dir. Talento Humano</text>
              <rect x="120" y="148" width="100" height="20" rx="5" fill="rgba(255,255,255,0.06)" />
              <text x="170" y="162" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="system-ui,sans-serif">Psicólogo Org.</text>

              {/* Area: Operaciones */}
              <rect x="240" y="84" width="90" height="26" rx="7" fill="rgba(16,185,129,0.22)" stroke="rgba(52,211,153,0.55)" strokeWidth="1.2" />
              <text x="285" y="101" textAnchor="middle" fill="#6EE7B7" fontSize="9.5" fontWeight="bold" fontFamily="system-ui,sans-serif">Operaciones</text>
              <line x1="285" y1="110" x2="285" y2="124" stroke="rgba(52,211,153,0.35)" strokeWidth="1" />
              <rect x="235" y="124" width="100" height="20" rx="5" fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="285" y="138" textAnchor="middle" fill="rgba(255,255,255,0.82)" fontSize="8" fontFamily="system-ui,sans-serif">Jefe de Producción</text>
              <rect x="235" y="148" width="100" height="20" rx="5" fill="rgba(255,255,255,0.06)" />
              <text x="285" y="162" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="system-ui,sans-serif">Operario Senior</text>

              <text x="170" y="200" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="7.5" fontFamily="system-ui,sans-serif" fontStyle="italic">
                funciones · KPIs · competencias · plan de carrera
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN DOLOR ── */}
      <div style={{ background: "#FFF9F5", border: "1.5px solid #FED7AA", borderRadius: "16px", padding: "36px 40px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#C2410C", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
          El problema
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0C4A6E", margin: "0 0 24px", letterSpacing: "-0.01em" }}>
          ¿Tu empresa opera sin roles claros?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {PAIN.map((p) => (
            <div key={p.title} style={{ background: "white", border: "1.5px solid #FEE2E2", borderRadius: "12px", padding: "18px 20px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                <AlertTriangle style={{ width: "16px", height: "16px", color: "#DC2626" }} />
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E", marginBottom: "6px", lineHeight: 1.4 }}>{p.title}</div>
              <div style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.6 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECCIÓN TRANSFORMACIÓN ── */}
      <div style={{ background: "white", border: "1.5px solid #E0F2FE", borderRadius: "16px", padding: "36px 40px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
          La solución
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0C4A6E", margin: "0 0 24px", letterSpacing: "-0.01em" }}>
          Con el Manual de Funciones logras:
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
          {OUTCOMES.map((o) => (
            <div key={o.title} style={{ display: "flex", gap: "14px", background: "#F8FAFF", border: "1px solid #E0E7FF", borderRadius: "12px", padding: "18px 20px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <o.icon style={{ width: "17px", height: "17px", color: "#059669" }} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0C4A6E", marginBottom: "4px" }}>{o.title}</div>
                <div style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.6 }}>{o.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── EMPRESAS ── */}
      {loading ? (
        <p style={{ color: "#64748B", fontSize: "14px" }}>Cargando empresas…</p>
      ) : loadError ? (
        <div style={{ background: "#FFF5F5", border: "1.5px solid #FCA5A5", borderRadius: "12px", padding: "24px 28px", display: "flex", alignItems: "center", gap: "14px" }}>
          <AlertTriangle style={{ width: "20px", height: "20px", color: "#DC2626", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#991B1B", marginBottom: "4px" }}>
              No se pudo cargar la lista de clientes
            </div>
            <div style={{ fontSize: "13px", color: "#64748B" }}>
              Error de conexión o sesión expirada. Recarga la página para intentar de nuevo.
            </div>
          </div>
        </div>
      ) : clientes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", background: "white", borderRadius: "16px", border: "1.5px dashed #E0E7FF" }}>
          <FileText style={{ width: "40px", height: "40px", color: "#CBD5E1", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0C4A6E", marginBottom: "8px" }}>Sin clientes registrados</h3>
          <p style={{ fontSize: "14px", color: "#94A3B8", marginBottom: "20px" }}>
            Primero agrega clientes para poder crear manuales de funciones.
          </p>
          <Link to="/app/clientes" style={{ fontSize: "14px", fontWeight: 700, color: "#0EA5E9", textDecoration: "none" }}>
            Ir a clientes →
          </Link>
        </div>
      ) : (
        <>
          {conCargos.length > 0 && (
            <section>
              <div style={SL}><span style={STRIPE} /> Empresas con manuales activos</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
                {conCargos.map((c) => (
                  <div
                    key={c.id}
                    style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "14px", padding: "22px", display: "flex", flexDirection: "column", gap: "14px", transition: "box-shadow 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(14,165,233,0.1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "linear-gradient(135deg, #0EA5E9, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", fontWeight: 900, color: "white", flexShrink: 0 }}>
                        {c.nombre_empresa[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0C4A6E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.nombre_empresa}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                          {c.total} cargo{c.total !== 1 ? "s" : ""} · {c.vigentes} vigente{c.vigentes !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div style={{ height: "4px", background: "#F0F4FF", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", width: `${c.total > 0 ? (c.vigentes / c.total) * 100 : 0}%`, transition: "width 0.4s" }} />
                    </div>
                    <Link
                      to="/app/manual-funciones/$clienteId"
                      params={{ clienteId: c.id }}
                      search={{}}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#0C4A6E", textDecoration: "none", padding: "8px 14px", borderRadius: "8px", border: "1.5px solid #E0E7FF", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#0EA5E9"; el.style.color = "#0EA5E9"; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#E0E7FF"; el.style.color = "#0C4A6E"; }}
                    >
                      Ver manuales <ArrowRight style={{ width: "13px", height: "13px" }} />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {sinCargos.length > 0 && (
            <section>
              <div style={{ ...SL, color: "#94A3B8" }}>
                <span style={{ ...STRIPE, background: "#E2E8F0" }} />
                Empresas sin cargos documentados
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sinCargos.map((c) => (
                  <div key={c.id} style={{ background: "white", border: "1px solid #F1F5F9", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#94A3B8" }}>
                        {c.nombre_empresa[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>{c.nombre_empresa}</span>
                    </div>
                    <Link
                      to="/app/manual-funciones/$clienteId"
                      params={{ clienteId: c.id }}
                      search={{}}
                      style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#0EA5E9", textDecoration: "none" }}
                    >
                      <Plus style={{ width: "12px", height: "12px" }} /> Crear primer cargo
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
