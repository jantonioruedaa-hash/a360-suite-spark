import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HERRAMIENTAS_A360 } from "@/lib/coaching-catalogo";
import { listarSesionesGlobal, type SesionCoaching } from "@/lib/coaching-helpers";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Users } from "lucide-react";
import { PreviewGate } from "@/components/PreviewGate";

export const Route = createFileRoute("/app/coaching/")({
  component: CoachingHome,
});

type Cliente = { id: string; nombre_empresa: string };

async function listarClientes(): Promise<Cliente[]> {
  const { data } = await supabase
    .from("clientes")
    .select("id,nombre_empresa")
    .order("nombre_empresa");
  return (data ?? []) as Cliente[];
}

const ETAPA_COLORS = ["#7F77DD", "#1D9E75", "#BA7517", "#D85A30"];

function progressColor(pct: number): string {
  if (pct === 0) return "#CBD5E1";
  if (pct < 34) return ETAPA_COLORS[0];
  if (pct < 67) return ETAPA_COLORS[1];
  if (pct < 100) return ETAPA_COLORS[2];
  return ETAPA_COLORS[3];
}

function CoachingPanel() {
  const [sesiones, setSesiones] = useState<SesionCoaching[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listarSesionesGlobal(), listarClientes()])
      .then(([s, c]) => { setSesiones(s); setClientes(c); })
      .finally(() => setLoading(false));
  }, []);

  const clienteData = useMemo(() => {
    const byCliente = new Map<string, SesionCoaching[]>();
    sesiones.forEach((s) => {
      const arr = byCliente.get(s.cliente_id) ?? [];
      arr.push(s);
      byCliente.set(s.cliente_id, arr);
    });

    return clientes
      .filter((c) => byCliente.has(c.id))
      .map((c) => {
        const sess = (byCliente.get(c.id) ?? []).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const completadas = sess.filter((s) => s.completada).length;
        const pct = Math.round((completadas / HERRAMIENTAS_A360.length) * 100);
        const ultima = sess[0];
        const diasDesdeUltima = ultima
          ? Math.round((Date.now() - new Date(ultima.created_at).getTime()) / 86400000)
          : null;
        const estado: "Por iniciar" | "En progreso" | "Completado" =
          completadas === 0 ? "Por iniciar"
          : completadas >= HERRAMIENTAS_A360.length ? "Completado"
          : "En progreso";
        return { cliente: c, completadas, pct, diasDesdeUltima, estado };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [clientes, sesiones]);

  const totalCompletadas = sesiones.filter((s) => s.completada).length;
  const avgPct =
    clienteData.length > 0
      ? Math.round(clienteData.reduce((acc, c) => acc + c.pct, 0) / clienteData.length)
      : 0;

  const estadoStyle: Record<string, { bg: string; color: string }> = {
    "Por iniciar":  { bg: "#F1F5F9", color: "#64748B" },
    "En progreso":  { bg: "#EFF6FF", color: "#0369A1" },
    "Completado":   { bg: "#F0FDF4", color: "#059669" },
  };

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8" style={{ background: "#F5F7FF", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 50%, #312E81 100%)",
        padding: "48px 64px 56px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(14,165,233,0.15), transparent 60%)" }} />
        <div style={{ position: "absolute", right: "-40px", bottom: "-60px", fontSize: "240px", fontWeight: 900, color: "rgba(255,255,255,0.03)", letterSpacing: "-0.06em", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>COACH</div>

        <div style={{ position: "relative", zIndex: 2, maxWidth: "680px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "5px 14px 5px 10px", fontSize: "12px", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px" }}>
            <span className="animate-pulse" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#0EA5E9", display: "inline-block" }} />
            Coaching Ejecutivo A360
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "10px" }}>
            Coaching A360
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: "460px", marginBottom: "0" }}>
            Selecciona una empresa para iniciar o continuar el programa de transformación ejecutiva.
          </p>

          {!loading && clienteData.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0", paddingTop: "32px", marginTop: "32px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              {[
                { val: clienteData.length,  lbl: "Empresas activas" },
                { val: totalCompletadas,    lbl: "Herramientas completadas" },
                { val: `${avgPct}%`,        lbl: "Progreso promedio" },
                { val: HERRAMIENTAS_A360.length, lbl: "Herramientas por programa" },
              ].map((s, i) => (
                <div key={i} style={{ paddingRight: "36px", marginRight: "36px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "48px 64px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
            <p style={{ fontSize: "15px", color: "#64748B" }}>Cargando programas…</p>
          </div>
        ) : clienteData.length === 0 ? (
          <div style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1.5px solid #C7D2FE", borderRadius: "20px", padding: "72px 64px", textAlign: "center", maxWidth: "560px", margin: "0 auto" }}>
            <div style={{ fontSize: "56px", marginBottom: "20px" }}>✨</div>
            <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em", marginBottom: "12px" }}>
              Aún no hay programas activos
            </h2>
            <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.8, maxWidth: "380px", margin: "0 auto 28px" }}>
              Abre la ficha de cualquier cliente y ve a la pestaña <strong>Coaching</strong> para iniciar su programa A360.
            </p>
            <Link
              to="/app/clientes"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", borderRadius: "10px", background: "linear-gradient(135deg, #0EA5E9, #6366F1)", color: "white", fontSize: "15px", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(14,165,233,0.3)" }}
            >
              Ir a Mis clientes <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "28px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "6px" }}>Programa en curso</p>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em" }}>
                Empresas en{" "}
                <span style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  coaching activo
                </span>
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
              {clienteData.map(({ cliente, completadas, pct, diasDesdeUltima, estado }) => {
                const color = progressColor(pct);
                const es = estadoStyle[estado];
                const ctaLabel = estado === "Por iniciar" ? "Iniciar programa" : estado === "Completado" ? "Ver resumen" : "Continuar programa";

                return (
                  <Link
                    key={cliente.id}
                    to="/app/clientes/$clienteId/coaching"
                    params={{ clienteId: cliente.id }}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#BAE6FD"; el.style.boxShadow = "0 8px 28px rgba(14,165,233,0.12)"; el.style.transform = "translateY(-3px)"; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#E0E7FF"; el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; el.style.transform = "none"; }}
                    >
                      {/* Stage color stripe */}
                      <div style={{ height: "4px", background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

                      <div style={{ padding: "24px 28px" }}>
                        {/* Avatar + name */}
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
                          <div style={{ width: "52px", height: "52px", borderRadius: "14px", flexShrink: 0, background: `linear-gradient(135deg, ${color}, ${color}aa)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 900, color: "white" }}>
                            {cliente.nombre_empresa[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "17px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em", marginBottom: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {cliente.nombre_empresa}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: es.bg, color: es.color }}>
                                {estado}
                              </span>
                              {diasDesdeUltima !== null && (
                                <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                                  {diasDesdeUltima === 0 ? "Actividad hoy" : `Hace ${diasDesdeUltima}d`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: "right" }}>
                            <div style={{ fontSize: "26px", fontWeight: 900, color: pct >= 100 ? "#059669" : "#0C4A6E", letterSpacing: "-0.02em", lineHeight: 1 }}>{pct}%</div>
                            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>avance</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginBottom: "18px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94A3B8", marginBottom: "7px" }}>
                            <span>{completadas} de {HERRAMIENTAS_A360.length} herramientas</span>
                            <span style={{ color, fontWeight: 700 }}>{HERRAMIENTAS_A360.length - completadas} restantes</span>
                          </div>
                          <div style={{ height: "8px", background: "#E0E7FF", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: "999px", background: pct >= 100 ? "linear-gradient(90deg, #059669, #10B981)" : `linear-gradient(90deg, ${color}, ${color}88)`, width: `${pct}%`, transition: "width 0.5s ease" }} />
                          </div>
                        </div>

                        {/* CTA */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "#0EA5E9", display: "flex", alignItems: "center", gap: "4px" }}>
                            {ctaLabel} <ArrowRight size={14} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div style={{ marginTop: "32px", textAlign: "center" }}>
              <Link to="/app/clientes" style={{ fontSize: "14px", fontWeight: 600, color: "#94A3B8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Users size={14} /> Ver todos mis clientes
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CoachingPreview() {
  return (
    <div style={{ background: "#F5F7FF", padding: "48px 64px" }}>
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#0EA5E9", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "8px" }}>Coaching Ejecutivo</p>
        <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em" }}>Coaching A360</h2>
        <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.7, marginTop: "8px", maxWidth: "420px" }}>
          Acompañamiento ejecutivo con metodología probada en más de 200 empresas de LatAm.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px", maxWidth: "380px" }}>
        {[
          { icon: "⏱", val: "90 min", lbl: "por sesión" },
          { icon: "🛠️", val: "12", lbl: "herramientas" },
          { icon: "📈", val: "4", lbl: "etapas" },
          { icon: "✅", val: "200+", lbl: "empresas LatAm" },
        ].map((s) => (
          <div key={s.lbl} style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "14px", padding: "18px", textAlign: "center" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>{s.icon}</div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.02em" }}>{s.val}</div>
            <div style={{ fontSize: "10px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "3px" }}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachingHome() {
  return (
    <PreviewGate
      moduleName="Coaching A360"
      moduleDescription="Acompañamiento ejecutivo personalizado para líderes que quieren desarrollar equipos de alto rendimiento y transformar su organización con metodología probada en más de 200 empresas de LATAM."
      moduleIcon={<span style={{ fontSize: "1.6rem" }}>🤝</span>}
      previewContent={<CoachingPreview />}
    >
      <CoachingPanel />
    </PreviewGate>
  );
}
