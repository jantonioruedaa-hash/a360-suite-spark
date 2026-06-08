import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ETAPAS_A360, HERRAMIENTAS_A360 } from "@/lib/coaching-catalogo";
import { listarSesionesGlobal, type SesionCoaching } from "@/lib/coaching-helpers";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, BookOpen, TrendingUp } from "lucide-react";

type Cliente = { id: string; nombre_empresa: string };

async function listarClientes(): Promise<Cliente[]> {
  const { data } = await supabase.from("clientes").select("id,nombre_empresa").order("nombre_empresa");
  return (data ?? []) as Cliente[];
}

export const Route = createFileRoute("/app/coaching/")({
  component: CoachingHome,
});

// ── Constantes visuales ───────────────────────────────────────────────────────
const GRADIENT_TEXT: React.CSSProperties = {
  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "8px",
  padding: "14px 28px", borderRadius: "10px",
  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
  color: "white", fontSize: "14px", fontWeight: 700,
  border: "none", cursor: "pointer",
  boxShadow: "0 4px 20px rgba(14,165,233,0.35)",
  textDecoration: "none", transition: "all 0.2s",
};

const BTN_GHOST: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "8px",
  padding: "14px 24px", borderRadius: "10px",
  background: "rgba(255,255,255,0.1)", color: "white",
  fontSize: "14px", fontWeight: 600,
  border: "1.5px solid rgba(255,255,255,0.3)", cursor: "pointer",
  textDecoration: "none",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#0EA5E9",
  textTransform: "uppercase", letterSpacing: "0.15em",
  display: "flex", alignItems: "center", gap: "10px",
  marginBottom: "14px",
};

const LABEL_LINE: React.CSSProperties = {
  display: "inline-block", width: "28px", height: "3px",
  background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px",
};

const TRANSFORM_ITEMS = [
  { icon: "😰", before: "Apagando incendios todo el día", after: "Líder que diseña el sistema y delega con confianza" },
  { icon: "🌫️", before: "Decisiones bajo presión sin claridad", after: "Marco de decisión claro y criterios definidos" },
  { icon: "🔄", before: "Reuniones sin resultados concretos", after: "Compromisos medibles que se cumplen sesión a sesión" },
];

const METODOLOGIA_STEPS = [
  { num: "01", icon: "🎯", title: "Enfoque del tema", desc: "Cada herramienta aborda un aspecto estratégico del liderazgo con materiales y contexto profesional previo." },
  { num: "02", icon: "💬", title: "Diálogo profundo", desc: "Sesiones estructuradas con preguntas poderosas que revelan insights que el día a día no permite ver." },
  { num: "03", icon: "🤖", title: "Análisis con IA", desc: "Claude analiza los datos, genera un resumen ejecutivo e identifica patrones y áreas de atención prioritaria." },
  { num: "04", icon: "📋", title: "Plan de acción", desc: "Cada sesión cierra con compromisos concretos, medibles y con fecha — revisados en el siguiente encuentro." },
];

// ── Componente principal ───────────────────────────────────────────────────────
function CoachingHome() {
  const [sesiones, setSesiones] = useState<SesionCoaching[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listarSesionesGlobal(), listarClientes()])
      .then(([s, c]) => { setSesiones(s); setClientes(c); })
      .finally(() => setLoading(false));
  }, []);

  // Agrupa sesiones por cliente
  const porCliente = useMemo(() => {
    const map = new Map<string, SesionCoaching[]>();
    sesiones.forEach((s) => {
      const arr = map.get(s.cliente_id) ?? [];
      arr.push(s);
      map.set(s.cliente_id, arr);
    });
    return map;
  }, [sesiones]);

  const clientesConCoaching = useMemo(
    () =>
      clientes
        .filter((c) => porCliente.has(c.id))
        .map((c) => {
          const sess = porCliente.get(c.id)!;
          const completadas = sess.filter((s) => s.completada).length;
          const pct = Math.round((completadas / HERRAMIENTAS_A360.length) * 100);
          const herramientasUsadas = new Set(sess.map((s) => s.herramienta_id));
          const proxima = HERRAMIENTAS_A360.find((h) => !herramientasUsadas.has(h.id));
          const ultima = [...sess].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          return { cliente: c, sesiones: sess, completadas, pct, proxima, ultima };
        }),
    [clientes, porCliente]
  );

  const globalCompletadas = useMemo(() => sesiones.filter((s) => s.completada).length, [sesiones]);

  const heroStats = [
    { val: loading ? "—" : clientesConCoaching.length, lbl: "Clientes en programa" },
    { val: loading ? "—" : globalCompletadas, lbl: "Herramientas completadas" },
    { val: HERRAMIENTAS_A360.length, lbl: "Herramientas del programa" },
    { val: ETAPAS_A360.length, lbl: "Etapas de transformación" },
  ];

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 bg-[#F5F7FF]">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 lg:px-16 pt-16 pb-20"
        style={{ background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 50%, #312E81 100%)" }}
      >
        {/* Radial overlays */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(14,165,233,0.15), transparent 60%), radial-gradient(ellipse 40% 60% at 10% 80%, rgba(99,102,241,0.12), transparent 60%)",
        }} />
        {/* Watermark */}
        <div className="absolute pointer-events-none select-none hidden lg:block" style={{
          right: "-40px", bottom: "-60px",
          fontSize: "260px", fontWeight: 900,
          color: "rgba(255,255,255,0.03)",
          letterSpacing: "-0.06em", lineHeight: 1,
        }}>COACH</div>

        <div className="relative z-10 max-w-[680px]">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full mb-5" style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "5px 14px 5px 10px",
            fontSize: "12px", fontWeight: 700, color: "#38BDF8",
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            <span className="w-[7px] h-[7px] rounded-full animate-pulse" style={{ background: "#0EA5E9" }} />
            Plataforma · Coaching Ejecutivo A360
          </div>

          {/* Title */}
          <h1 className="mb-[18px]" style={{
            fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "white",
            letterSpacing: "-0.04em", lineHeight: 1.05,
          }}>
            Acompañamiento para el líder<br />
            que sabe que solo<br />
            <span style={{
              background: "linear-gradient(135deg, #38BDF8, #A5B4FC)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              no puede llegar más lejos.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-9" style={{
            fontSize: "17px", color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7, maxWidth: "520px",
          }}>
            Metodología probada en más de 200 empresas latinoamericanas. 4 etapas, {HERRAMIENTAS_A360.length} herramientas y análisis con inteligencia artificial incluido en cada sesión.
          </p>

          {/* Actions */}
          <div className="flex gap-3.5 flex-wrap mb-12">
            <Link to="/app/clientes" style={BTN_PRIMARY}>
              <span>Ver mis clientes</span>
            </Link>
            <Link to="/app/coaching/metodologia" style={BTN_GHOST}>
              <BookOpen style={{ width: "16px", height: "16px" }} />
              Metodología completa
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-0 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {heroStats.map((s, i) => (
              <div
                key={i}
                className="pr-8 mr-8"
                style={i < heroStats.length - 1 ? { borderRight: "1px solid rgba(255,255,255,0.1)" } : {}}
              >
                <div style={{ fontSize: "36px", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {s.val}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ───────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-7 px-6 lg:px-16 py-11 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)" }}
      >
        <div className="absolute left-8 -top-3 pointer-events-none select-none" style={{
          fontSize: "140px", color: "rgba(255,255,255,0.08)", lineHeight: 1, fontWeight: 900,
        }}>"</div>
        <div style={{ fontSize: "52px", flexShrink: 0, position: "relative", zIndex: 2 }}>💡</div>
        <div className="relative z-10">
          <p style={{ fontSize: "20px", fontWeight: 700, color: "white", lineHeight: 1.5 }}>
            "El cambio profundo en un líder no se mide por lo que aprende, sino por lo que decide distinto bajo presión."
          </p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "8px", fontStyle: "italic" }}>
            — Principio rector A360SGP ·{" "}
            <Link to="/app/coaching/metodologia" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "underline" }}>
              Ver metodología completa
            </Link>
          </p>
        </div>
      </div>

      {/* ── TRANSFORMACIÓN ──────────────────────────────────────────────────── */}
      <div className="bg-white px-6 lg:px-16 py-16">
        <div style={SECTION_LABEL}><span style={LABEL_LINE} />Lo que logra el programa</div>
        <h2 className="mb-3.5" style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          De líder reactivo a <span style={GRADIENT_TEXT}>arquitecto estratégico</span>
        </h2>
        <p className="mb-12" style={{ fontSize: "17px", color: "#64748B", lineHeight: 1.75, maxWidth: "560px" }}>
          El coaching A360 está diseñado para producir una transformación real y medible en la forma en que liderás, decidís y construís tu empresa.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TRANSFORM_ITEMS.map((item, i) => (
            <div
              key={i}
              className="text-center rounded-[18px] transition-all"
              style={{ background: "#F5F7FF", border: "1px solid #E0E7FF", padding: "32px 28px", cursor: "default" }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = "white"; el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 12px 32px rgba(14,165,233,0.1)"; el.style.borderColor = "#BAE6FD";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = "#F5F7FF"; el.style.transform = "none";
                el.style.boxShadow = "none"; el.style.borderColor = "#E0E7FF";
              }}
            >
              <div style={{ fontSize: "44px", marginBottom: "14px", opacity: 0.7 }}>{item.icon}</div>
              <div style={{ fontSize: "14px", color: "#94A3B8", marginBottom: "12px" }}>Antes: {item.before}</div>
              <div style={{ fontSize: "22px", fontWeight: 900, ...GRADIENT_TEXT, marginBottom: "12px" }}>↓</div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em" }}>{item.after}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── METODOLOGÍA ─────────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-16 py-16" style={{ background: "#F5F7FF" }}>
        <div style={SECTION_LABEL}><span style={LABEL_LINE} />Cómo funciona cada sesión</div>
        <h2 className="mb-3.5" style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Una estructura probada<br /><span style={GRADIENT_TEXT}>que produce resultados</span>
        </h2>
        <p className="mb-12" style={{ fontSize: "17px", color: "#64748B", lineHeight: 1.75, maxWidth: "560px" }}>
          Cada sesión sigue una metodología rigurosa que convierte la conversación en acción concreta.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {METODOLOGIA_STEPS.map((step) => (
            <div
              key={step.num}
              className="relative overflow-hidden rounded-2xl transition-all"
              style={{ background: "white", border: "1px solid #E0E7FF", padding: "28px 24px" }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = "0 8px 24px rgba(14,165,233,0.1)";
                el.style.transform = "translateY(-3px)"; el.style.borderColor = "#BAE6FD";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = "none"; el.style.transform = "none"; el.style.borderColor = "#E0E7FF";
              }}
            >
              <div className="absolute" style={{ top: "-10px", right: "10px", fontSize: "72px", fontWeight: 900, color: "#EEF2FF", lineHeight: 1 }}>
                {step.num}
              </div>
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>{step.icon}</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E", marginBottom: "10px", letterSpacing: "-0.01em" }}>
                {step.title}
              </div>
              <div style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.7 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ETAPAS DEL PROGRAMA ─────────────────────────────────────────────── */}
      <div className="bg-white px-6 lg:px-16 py-14">
        <div style={SECTION_LABEL}><span style={LABEL_LINE} />Las 4 etapas</div>
        <h2 className="mb-10" style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em" }}>
          El mapa de la <span style={GRADIENT_TEXT}>transformación</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ETAPAS_A360.map((et, i) => {
            const herrs = HERRAMIENTAS_A360.filter((h) => h.etapa === et.id);
            return (
              <div
                key={et.id}
                className="rounded-2xl relative overflow-hidden"
                style={{ border: `2px solid ${et.color}20`, background: "white", padding: "24px" }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: et.color }} />
                <div className="mb-3 mt-2">
                  <span style={{
                    fontSize: "11px", fontWeight: 700, color: et.color,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    Etapa {i + 1}
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E", marginTop: "4px", letterSpacing: "-0.01em" }}>
                    {et.id}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{et.descripcion}</div>
                </div>
                <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "8px", fontWeight: 600 }}>
                  {herrs.length} herramienta{herrs.length !== 1 ? "s" : ""}
                </div>
                <ul className="space-y-1">
                  {herrs.map((h) => (
                    <li key={h.id} style={{ fontSize: "12px", color: "#475569", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                      <span style={{ color: et.color, flexShrink: 0, marginTop: "2px" }}>›</span>
                      {h.nombre}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CLIENTES EN COACHING ────────────────────────────────────────────── */}
      <div className="px-6 lg:px-16 py-14" style={{ background: "#F5F7FF" }}>
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div style={SECTION_LABEL}><span style={LABEL_LINE} />Estado actual del programa</div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "#0C4A6E", letterSpacing: "-0.03em" }}>
              Clientes en <span style={GRADIENT_TEXT}>coaching activo</span>
            </h2>
          </div>
          <Link to="/app/coaching/resultados" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "14px", fontWeight: 600, color: "#0EA5E9", textDecoration: "none",
          }}>
            <TrendingUp style={{ width: "16px", height: "16px" }} /> Ver resultados globales
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div style={{
              background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)",
              border: "1.5px solid #C7D2FE", borderRadius: "18px",
              padding: "48px", textAlign: "center", maxWidth: "360px",
            }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
              <p style={{ fontSize: "15px", color: "#64748B" }}>Cargando clientes…</p>
            </div>
          </div>
        ) : clientesConCoaching.length === 0 ? (
          <div style={{
            background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)",
            border: "1.5px solid #C7D2FE", borderRadius: "18px",
            padding: "64px", textAlign: "center",
          }}>
            <div style={{ fontSize: "56px", marginBottom: "20px" }}>✨</div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0C4A6E", marginBottom: "10px" }}>
              Aún no hay sesiones registradas
            </h3>
            <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.75, maxWidth: "400px", margin: "0 auto 28px" }}>
              Abre la ficha de cualquier cliente y ve a la pestaña "Coaching" para registrar la primera sesión.
            </p>
            <Link to="/app/clientes" style={BTN_PRIMARY}>
              Ir a Mis clientes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {clientesConCoaching.map(({ cliente, sesiones: sess, completadas, pct, proxima, ultima }) => (
              <Link
                key={cliente.id}
                to="/app/clientes/$clienteId/coaching"
                params={{ clienteId: cliente.id }}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{ background: "white", border: "1px solid #E0E7FF", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "#BAE6FD";
                    el.style.boxShadow = "0 8px 28px rgba(14,165,233,0.1)";
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "#E0E7FF";
                    el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                    el.style.transform = "none";
                  }}
                >
                  {/* Card header */}
                  <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #E0E7FF" }}>
                    <div className="flex items-center gap-3 mb-3">
                      {/* Avatar */}
                      <div
                        className="flex items-center justify-center rounded-xl shrink-0"
                        style={{
                          width: "44px", height: "44px",
                          background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                          fontSize: "18px", fontWeight: 900, color: "white",
                        }}
                      >
                        {cliente.nombre_empresa[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#0C4A6E", letterSpacing: "-0.01em" }}>
                          {cliente.nombre_empresa}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                          {sess.length} registro{sess.length !== 1 ? "s" : ""} · {completadas} completada{completadas !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1" style={{ fontSize: "22px", fontWeight: 900, color: pct >= 80 ? "#059669" : "#0C4A6E" }}>
                        {pct}
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#94A3B8", marginTop: "6px" }}>%</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: "6px", background: "#E0E7FF", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: "999px",
                        background: pct >= 80
                          ? "linear-gradient(90deg, #059669, #10B981)"
                          : "linear-gradient(90deg, #0EA5E9, #6366F1)",
                        width: `${pct}%`, transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>

                  {/* Card footer */}
                  <div style={{ padding: "14px 24px" }} className="flex items-center justify-between">
                    <div>
                      {proxima ? (
                        <div>
                          <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>
                            Próxima herramienta
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#0369A1" }}>{proxima.nombre}</div>
                        </div>
                      ) : ultima ? (
                        <div>
                          <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>
                            Última sesión
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#059669" }}>
                            {new Date(ultima.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1" style={{ fontSize: "13px", fontWeight: 600, color: "#0EA5E9" }}>
                      Abrir workspace <ArrowRight style={{ width: "14px", height: "14px" }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA FINAL ───────────────────────────────────────────────────────── */}
      <div
        className="px-6 lg:px-16 py-[72px] relative overflow-hidden flex items-center justify-between gap-12 flex-wrap"
        style={{ background: "linear-gradient(135deg, #0C4A6E, #1E3A8A, #312E81)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 50% 80% at 20% 50%, rgba(14,165,233,0.12), transparent)",
        }} />
        <div className="relative z-10">
          <div style={{ width: "48px", height: "4px", background: "linear-gradient(90deg, #0EA5E9, #6366F1)", borderRadius: "2px", marginBottom: "18px" }} />
          <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            El siguiente nivel<br />
            <span style={{ background: "linear-gradient(135deg, #38BDF8, #A5B4FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              te está esperando.
            </span>
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", marginTop: "10px", lineHeight: 1.65 }}>
            Cada sesión de coaching es un punto de inflexión. El momento de actuar es ahora.
          </p>
        </div>
        <div className="relative z-10 shrink-0 flex flex-col gap-3 items-start">
          <Link to="/app/clientes" style={{ ...BTN_PRIMARY, fontSize: "15px", padding: "16px 36px" }}>
            Ir a mis clientes →
          </Link>
          <Link to="/app/coaching/resultados" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "13px", color: "rgba(255,255,255,0.5)",
            textDecoration: "none", fontWeight: 600,
          }}>
            <TrendingUp style={{ width: "14px", height: "14px" }} /> Ver resultados globales
          </Link>
        </div>
      </div>

    </div>
  );
}
