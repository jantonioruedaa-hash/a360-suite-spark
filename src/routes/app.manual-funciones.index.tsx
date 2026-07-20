import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Plus, FileText } from "lucide-react";

export const Route = createFileRoute("/app/manual-funciones/")({
  component: ManualFuncionesPanel,
});

type Cliente = { id: string; nombre_empresa: string };
type CargoSummary = { cliente_id: string; estado: string | null };

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

// ── Component ──────────────────────────────────────────────────────────────────
function ManualFuncionesPanel() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargos, setCargos] = useState<CargoSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("clientes").select("id,nombre_empresa").order("nombre_empresa"),
      supabase.from("manual_funciones_cargos").select("cliente_id,estado"),
    ]).then(([{ data: cl }, { data: ca }]) => {
      setClientes((cl ?? []) as Cliente[]);
      setCargos((ca ?? []) as CargoSummary[]);
      setLoading(false);
    });
  }, []);

  const data = clientes.map((c) => {
    const myCargos = cargos.filter((x) => x.cliente_id === c.id);
    return {
      ...c,
      total: myCargos.length,
      vigentes: myCargos.filter((x) => x.estado === "vigente").length,
    };
  });

  const conCargos = data.filter((d) => d.total > 0).sort((a, b) => b.total - a.total);
  const sinCargos = data.filter((d) => d.total === 0);

  return (
    <div className="max-w-5xl space-y-8">

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 100%)",
        borderRadius: "16px", padding: "36px 40px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 80% at 80% 20%, rgba(14,165,233,0.15), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
            Módulo Organizacional · A360 Suite
          </div>
          <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, color: "white", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Manual de Funciones
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.6)", margin: "0 0 24px", lineHeight: 1.7, maxWidth: "540px" }}>
            Descripción de cargos, funciones, competencias y KPIs por empresa.
            Estructura el talento de tus clientes con precisión.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { val: conCargos.length, lbl: "Empresas activas" },
              { val: cargos.length,    lbl: "Cargos documentados" },
              { val: cargos.filter((c) => c.estado === "vigente").length, lbl: "Vigentes" },
            ].map((s) => (
              <div key={s.lbl} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "10px 18px" }}>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "white", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#64748B", fontSize: "14px" }}>Cargando…</p>
      ) : clientes.length === 0 ? (
        /* ── Empty state ── */
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
          {/* ── Empresas con cargos ── */}
          {conCargos.length > 0 && (
            <section>
              <div style={SL}><span style={STRIPE} /> Empresas con manuales activos</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
                {conCargos.map((c) => (
                  <div key={c.id} style={{ background: "white", border: "1px solid #E0E7FF", borderRadius: "14px", padding: "22px", display: "flex", flexDirection: "column", gap: "14px", transition: "box-shadow 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(14,165,233,0.1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                  >
                    {/* Avatar + info */}
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

                    {/* Progress */}
                    <div style={{ height: "4px", background: "#F0F4FF", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", width: `${c.total > 0 ? (c.vigentes / c.total) * 100 : 0}%`, transition: "width 0.4s" }} />
                    </div>

                    <Link
                      to="/app/manual-funciones/$clienteId"
                      params={{ clienteId: c.id }}
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

          {/* ── Empresas sin cargos ── */}
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
