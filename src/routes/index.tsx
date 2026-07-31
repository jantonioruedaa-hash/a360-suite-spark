import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { A360Logo } from "@/components/A360Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import {
  ScanSearch, Compass, HeartHandshake, GraduationCap,
  TrendingUp, Megaphone, ClipboardList, CheckCircle2,
  ArrowRight, Check, Menu, X, ChevronRight,
  Globe, BookOpen, BarChart2,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: LandingPage });

// ── CSS Keyframes ─────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @keyframes float-y {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-10px); }
      }
      @keyframes pulse-green {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.35; transform: scale(0.75); }
      }
      @keyframes fade-slide-up {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  );
}

// ── Animated counter ──────────────────────────────────────────────────────────
function useCounter(target: number, duration = 1400, startDelay = 500) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tid = setTimeout(() => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        setVal(Math.round(p * target));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, startDelay);
    return () => { clearTimeout(tid); cancelAnimationFrame(raf); };
  }, [target, duration, startDelay]);
  return val;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ModuloConfig {
  slug: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  route: string;
  color: string;
  planBadge: string;
  previewType: "radar" | "bsc" | "timeline" | "progress" | "kpis" | "funnel" | "orgchart";
}

// ── Data ──────────────────────────────────────────────────────────────────────
const MODULOS: ModuloConfig[] = [
  { slug: "side",      icon: ScanSearch,     label: "Diagnóstico SIDE",    desc: "Evalúa el estado real de tu empresa en 12 dimensiones clave.",            route: "/app/side",        color: "#0C4A6E", planBadge: "ESENCIAL",    previewType: "radar"    },
  { slug: "plan",      icon: Compass,        label: "Plan Estratégico",     desc: "Mapa de ruta empresarial con BSC integrado y objetivos medibles.",         route: "/app/plan",        color: "#1E3A8A", planBadge: "ESENCIAL",    previewType: "bsc"      },
  { slug: "coaching",  icon: HeartHandshake, label: "Coaching A360",        desc: "Acompañamiento ejecutivo para líderes y equipos de alto rendimiento.",     route: "/app/coaching",    color: "#065F46", planBadge: "PROFESIONAL", previewType: "timeline" },
  { slug: "lee",       icon: GraduationCap,  label: "Programa LEE",         desc: "Liderazgo Empresarial Evolutivo: formación continua para directivos.",     route: "/app/lee",         color: "#92400E", planBadge: "PROFESIONAL", previewType: "progress" },
  { slug: "kpis",      icon: TrendingUp,     label: "Seguimiento KPIs",     desc: "Tablero de indicadores en tiempo real para medir tu estrategia.",          route: "/app/kpis",        color: "#0369A1", planBadge: "PROFESIONAL", previewType: "kpis"     },
  { slug: "marketing", icon: Megaphone,      label: "Marketing Digital",    desc: "Estrategia de crecimiento digital adaptada al mercado latinoamericano.",   route: "/app/crecimiento", color: "#7C3AED", planBadge: "ENTERPRISE",  previewType: "funnel"   },
  { slug: "manual",    icon: ClipboardList,  label: "Manual de Funciones",  desc: "Documenta roles, competencias y responsabilidades de tu organización.",    route: "/app/dashboard",   color: "#374151", planBadge: "ENTERPRISE",  previewType: "orgchart" },
];

const PROBLEMAS = [
  { emoji: "😟", titulo: "No sé cómo está mi empresa realmente",    desc: "Tomas decisiones sin datos claros ni diagnóstico actualizado de tu negocio.",              border: "#EF4444" },
  { emoji: "🗺️", titulo: "Tengo visión pero no sé cómo ejecutarla", desc: "Las estrategias se quedan en el papel y el equipo no está alineado.",                       border: "#F59E0B" },
  { emoji: "📉", titulo: "Mis indicadores no me dicen nada útil",    desc: "Mides muchas cosas pero no sabes qué mueve realmente el negocio.",                          border: "#8B5CF6" },
  { emoji: "👥", titulo: "Mi equipo depende demasiado de mí",        desc: "Eres el cuello de botella de tu propia empresa. No puedes delegar con confianza.",          border: "#0EA5E9" },
  { emoji: "💸", titulo: "Vendo pero no sé si gano",                 desc: "Los números no cuadran y no entiendes por qué la rentabilidad no mejora.",                  border: "#10B981" },
  { emoji: "🔄", titulo: "Cada mes empezamos de cero",               desc: "No hay procesos, no hay sistema. Todo depende de quién esté ese día.",                     border: "#F97316" },
];

const STATS_RESULTADOS = [
  { emoji: "📊", stat: "2.5×", desc: "Las empresas con plan estratégico documentado crecen 2.5× más rápido que las que operan sin dirección clara.", source: "Harvard Business Review" },
  { emoji: "🎯", stat: "67%",  desc: "El 67% de las estrategias bien formuladas fracasan por falta de ejecución estructurada y seguimiento de indicadores.", source: "Gartner Research" },
  { emoji: "📈", stat: "+36%", desc: "Las empresas con KPIs bien definidos y revisados periódicamente mejoran su rentabilidad un 36% en promedio.", source: "McKinsey Global Institute" },
];

const PLANES_DATA = [
  {
    nombre: "Esencial",    precio: 99,  popular: false,
    desc: "Para empresas que están comenzando su transformación estratégica.",
    features: ["Diagnóstico SIDE", "Plan Estratégico", "Hasta 5 clientes", "Soporte por email"],
    ctaLabel: "Comenzar →", ctaHref: "/login", isMailto: false,
  },
  {
    nombre: "Profesional", precio: 199, popular: true,
    desc: "La solución completa para PyMEs en crecimiento acelerado.",
    features: ["Todo lo de Esencial", "Coaching A360", "Programa LEE", "Seguimiento KPIs", "Hasta 15 clientes", "Soporte prioritario"],
    ctaLabel: "Comenzar →", ctaHref: "/login", isMailto: false,
  },
  {
    nombre: "Corporativo", precio: 349, popular: false,
    desc: "Acceso total para organizaciones que quieren escalar sin límites.",
    features: ["Todos los módulos", "Marketing Digital", "Manual de Funciones", "Clientes ilimitados", "Soporte dedicado", "Capacitación incluida"],
    ctaLabel: "Contactar →", ctaHref: "mailto:info@a360sp.com", isMailto: true,
  },
];

const PASOS = [
  { n: 1, icon: ScanSearch,  titulo: "Diagnostica", sub: "SIDE en 45 minutos",          desc: "Obtén un mapa completo del estado de tu empresa en 12 dimensiones.",            resultado: "Reporte con brechas y prioridades claras" },
  { n: 2, icon: Compass,     titulo: "Diseña",      sub: "Plan estratégico con BSC",     desc: "Co-crea con tu consultor un plan con objetivos, iniciativas y métricas.",        resultado: "Mapa estratégico listo para ejecutar" },
  { n: 3, icon: TrendingUp,  titulo: "Ejecuta",     sub: "Acompañamiento con métricas",  desc: "Implementa con coaching, seguimiento de KPIs y acceso completo a la suite.",    resultado: "Resultados medibles en 90 días" },
];

// ── Module preview components ─────────────────────────────────────────────────
function RadarPreview({ color }: { color: string }) {
  const cx = 56, cy = 56, r = 42;
  const vals = [0.85, 0.62, 0.78, 0.55, 0.91, 0.72];
  const labels = ["Fin.", "Cli.", "Proc.", "RRHH", "Mkt.", "TI"];
  const n = 6;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pts = vals.map((v, i) => `${cx + r * v * Math.cos(angle(i))},${cy + r * v * Math.sin(angle(i))}`).join(" ");
  const gridPts = (scale: number) =>
    Array.from({ length: n }, (_, i) => `${cx + r * scale * Math.cos(angle(i))},${cy + r * scale * Math.sin(angle(i))}`).join(" ");
  return (
    <svg width="112" height="112" viewBox="0 0 112 112">
      {[0.33, 0.66, 1].map((s) => <polygon key={s} points={gridPts(s)} fill="none" stroke={`${color}25`} strokeWidth="1" />)}
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))} stroke={`${color}25`} strokeWidth="1" />
          <text x={cx + (r + 11) * Math.cos(angle(i))} y={cy + (r + 11) * Math.sin(angle(i))} fontSize="7" fill={color} textAnchor="middle" dominantBaseline="middle">{labels[i]}</text>
        </g>
      ))}
      <polygon points={pts} fill={`${color}22`} stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function BSCPreview({ color }: { color: string }) {
  const items = [
    { label: "Financiero",   pct: 72, bg: "#DBEAFE" },
    { label: "Clientes",     pct: 85, bg: "#D1FAE5" },
    { label: "Procesos",     pct: 60, bg: "#FEF3C7" },
    { label: "Aprendizaje",  pct: 78, bg: "#EDE9FE" },
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg p-2" style={{ background: it.bg }}>
          <div className="text-[9px] font-semibold mb-1.5 truncate" style={{ color }}>{it.label}</div>
          <div className="h-1 rounded-full" style={{ background: `${color}20` }}>
            <div className="h-full rounded-full" style={{ width: `${it.pct}%`, background: color }} />
          </div>
          <div className="text-[9px] mt-1 font-bold" style={{ color }}>{it.pct}%</div>
        </div>
      ))}
    </div>
  );
}

function TimelinePreview({ color }: { color: string }) {
  const total = 6, done = 4;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="flex items-center gap-0.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                background: i < done ? color : "rgba(0,0,0,0.07)",
                color: i < done ? "#fff" : `${color}80`,
                border: `1.5px solid ${i < done ? color : color + "40"}`,
              }}
            >{i + 1}</div>
            {i < total - 1 && <div className="w-2.5 h-0.5 shrink-0" style={{ background: i < done - 1 ? color : `${color}25` }} />}
          </div>
        ))}
      </div>
      <div className="text-[10px] font-medium" style={{ color }}>{done}/{total} sesiones completadas</div>
    </div>
  );
}

function ProgressPreview({ color }: { color: string }) {
  const caps = [
    { n: "Cap. 1", pct: 100 }, { n: "Cap. 2", pct: 100 },
    { n: "Cap. 3", pct: 60  }, { n: "Cap. 4", pct: 0   }, { n: "Cap. 5", pct: 0 },
  ];
  return (
    <div className="space-y-1.5">
      {caps.map((c) => (
        <div key={c.n} className="flex items-center gap-2">
          <div className="text-[9px] text-muted-foreground w-10 shrink-0">{c.n}</div>
          <div className="flex-1 h-2 rounded-full" style={{ background: `${color}15` }}>
            <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: color }} />
          </div>
          <div className="text-[9px] font-semibold w-6 text-right" style={{ color }}>{c.pct}%</div>
        </div>
      ))}
    </div>
  );
}

function KPIsPreview({ color }: { color: string }) {
  const items = [
    { name: "Ventas Q3",     value: "94%", dot: "#10B981" },
    { name: "Rentabilidad",  value: "71%", dot: "#F59E0B" },
    { name: "EBITDA",        value: "88%", dot: "#10B981" },
  ];
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.dot }} />
          <span className="text-[10px] flex-1 text-muted-foreground truncate">{item.name}</span>
          <span className="text-[10px] font-bold shrink-0" style={{ color }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function FunnelPreview({ color }: { color: string }) {
  const stages = [
    { label: "Visitas",   val: "1,200", pct: 100 },
    { label: "Leads",     val: "380",   pct: 32  },
    { label: "Clientes",  val: "42",    pct: 12  },
  ];
  return (
    <div className="space-y-1.5">
      {stages.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <div className="text-[9px] text-muted-foreground w-12 shrink-0">{s.label}</div>
          <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: `${color}12` }}>
            <div className="h-full rounded-sm" style={{ width: `${s.pct}%`, background: color, opacity: 1 - i * 0.22 }} />
          </div>
          <div className="text-[9px] font-semibold w-9 text-right shrink-0" style={{ color }}>{s.val}</div>
        </div>
      ))}
    </div>
  );
}

function OrgPreview({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <div className="px-3 py-1.5 rounded-lg text-[9px] font-bold text-white shadow-sm" style={{ background: color }}>
        Director General
      </div>
      <div className="w-px h-3" style={{ background: `${color}50` }} />
      <div className="flex gap-2 relative">
        {["Operaciones", "Comercial", "Finanzas"].map((d) => (
          <div key={d} className="px-2 py-1 rounded text-[9px] text-center font-medium" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModuloPreview({ type, color }: { type: string; color: string }) {
  switch (type) {
    case "radar":    return <RadarPreview color={color} />;
    case "bsc":      return <BSCPreview color={color} />;
    case "timeline": return <TimelinePreview color={color} />;
    case "progress": return <ProgressPreview color={color} />;
    case "kpis":     return <KPIsPreview color={color} />;
    case "funnel":   return <FunnelPreview color={color} />;
    case "orgchart": return <OrgPreview color={color} />;
    default:         return null;
  }
}

// ── Dashboard Mockup ──────────────────────────────────────────────────────────
function DashboardMockup() {
  const [mounted, setMounted] = useState(false);
  const sideVal      = useCounter(73,  1600, 500);
  const objetivosVal = useCounter(8,   1200, 650);
  const sesionesVal  = useCounter(24,  1400, 700);
  const kpisVal      = useCounter(18,  1300, 750);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 350);
    return () => clearTimeout(t);
  }, []);

  const bars = [
    { m: "Feb", px: 14 }, { m: "Mar", px: 22 }, { m: "Abr", px: 30 },
    { m: "May", px: 38 }, { m: "Jun", px: 46 }, { m: "Jul", px: 54 },
  ];

  return (
    <div className="relative" style={{ paddingTop: "20px", paddingRight: "8px", paddingBottom: "20px", paddingLeft: "8px" }}>

      {/* Float card 1 — top right */}
      <div className="absolute z-20 hidden lg:block" style={{ top: "-4px", right: "-8px", animation: "float-y 3s ease-in-out infinite" }}>
        <div className="bg-white rounded-xl shadow-xl px-3.5 py-2.5 flex items-center gap-2.5 border" style={{ borderColor: "rgba(12,74,110,0.12)", minWidth: "195px" }}>
          <span className="text-sm">📊</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-navy leading-tight">SIDE completado</div>
            <div className="text-[10px] text-muted-foreground">ALNUSAN S.A.</div>
          </div>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#10B981" }} />
        </div>
      </div>

      {/* Float card 2 — middle right */}
      <div className="absolute z-20 hidden lg:block" style={{ top: "42%", right: "-16px", animation: "float-y 4.2s ease-in-out infinite 0.5s" }}>
        <div className="bg-white rounded-xl shadow-xl px-3.5 py-2.5 flex items-center gap-2.5 border" style={{ borderColor: "rgba(12,74,110,0.12)", minWidth: "185px" }}>
          <span className="text-sm">🎯</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-navy leading-tight">KPI Ventas</div>
            <div className="text-[10px] font-semibold" style={{ color: "#10B981" }}>94% cumplimiento</div>
          </div>
        </div>
      </div>

      {/* Float card 3 — bottom left */}
      <div className="absolute z-20 hidden lg:block" style={{ bottom: "4px", left: "-12px", animation: "float-y 3.7s ease-in-out infinite 1s" }}>
        <div className="bg-white rounded-xl shadow-xl px-3.5 py-2.5 flex items-center gap-2.5 border" style={{ borderColor: "rgba(12,74,110,0.12)", minWidth: "190px" }}>
          <span className="text-sm">✅</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-navy leading-tight">Plan Estratégico</div>
            <div className="text-[10px] text-muted-foreground">Q3 aprobado</div>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.09)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div>
            <div className="text-white font-semibold text-sm">Panel A360SGP</div>
            <div className="text-white/50 text-[11px]">Aceleradora 360</div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#34D399", animation: "pulse-green 2s ease-in-out infinite" }} />
            <span className="text-[10px] text-white/55">En vivo</span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {/* Metrics 2×2 */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.10)" }}>
              <div className="text-white/55 text-[10px] uppercase tracking-wider mb-2">Índice SIDE</div>
              <div className="font-display text-[1.6rem] font-bold text-white mb-2">{sideVal}%</div>
              <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${sideVal}%`, background: "linear-gradient(to right, #38BDF8, #818CF8)" }} />
              </div>
            </div>

            <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.10)" }}>
              <div className="text-white/55 text-[10px] uppercase tracking-wider mb-2">Objetivos</div>
              <div className="font-display text-[1.6rem] font-bold text-white">
                {objetivosVal}<span className="text-sm text-white/45 font-normal">/12</span>
              </div>
              <div className="text-[10px] text-white/40 mt-1">cumplidos este Q</div>
            </div>

            <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.10)" }}>
              <div className="text-white/55 text-[10px] uppercase tracking-wider mb-2">Sesiones coaching</div>
              <div className="font-display text-[1.6rem] font-bold text-white">{sesionesVal}</div>
              <div className="text-[10px] text-white/40 mt-1">sesiones totales</div>
            </div>

            <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.10)" }}>
              <div className="text-white/55 text-[10px] uppercase tracking-wider mb-2">KPIs en verde</div>
              <div className="font-display text-[1.6rem] font-bold text-white">
                {kpisVal}<span className="text-sm text-white/45 font-normal">/24</span>
              </div>
              <div className="text-[10px] mt-1 font-semibold" style={{ color: "#34D399" }}>75% en objetivo</div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.10)" }}>
            <div className="text-white/55 text-[10px] uppercase tracking-wider mb-3">
              Progreso estratégico — Últimos 6 meses
            </div>
            <div className="flex items-end gap-1.5" style={{ height: "58px" }}>
              {bars.map((bar, i) => (
                <div key={bar.m} className="flex-1">
                  <div
                    className="w-full rounded-t-sm transition-all duration-700"
                    style={{
                      height: `${mounted ? bar.px : 2}px`,
                      background: "linear-gradient(to top, #38BDF8, #818CF8)",
                      transitionDelay: `${i * 90}ms`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {bars.map((bar) => (
                <div key={bar.m} className="flex-1 text-center text-[9px] text-white/40">{bar.m}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const navLinks = [
    { label: "Plataforma",    href: "#plataforma"   },
    { label: "Módulos",       href: "#modulos"       },
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Precios",       href: "#precios"       },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "shadow-lg" : ""}`}
      style={{
        background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.06)",
        backdropFilter: "blur(14px)",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        <a href="/" className="shrink-0">
          <A360Logo size={34} withText />
        </a>

        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                scrolled ? "text-navy hover:bg-[var(--acc2)]" : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >{l.label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {!loading && (
            user ? (
              <Button
                size="sm"
                className="text-white hover:opacity-90 transition-opacity"
                style={{ background: "var(--h-from)" }}
                onClick={() => void navigate({ to: "/app/dashboard" })}
              >
                Mi cuenta <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <>
                <Button
                  size="sm" variant="outline"
                  className={scrolled ? "" : "border-white/40 text-white hover:bg-white/10 hover:text-white bg-transparent"}
                  onClick={() => void navigate({ to: "/login" })}
                >
                  Iniciar sesión
                </Button>
                <Button
                  size="sm"
                  className="text-white hover:opacity-90 transition-opacity"
                  style={{ background: "var(--h-from)" }}
                  onClick={() => void navigate({ to: "/login" })}
                >
                  Comenzar gratis
                </Button>
              </>
            )
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-lg"
          style={{ color: scrolled ? "var(--h-from)" : "white" }}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menú"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t" style={{ background: "rgba(255,255,255,0.98)", borderColor: "var(--border)" }}>
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                 className="block px-3 py-2.5 text-sm font-medium text-navy rounded-lg hover:bg-[var(--acc2)]">
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
              {!loading && !user && (
                <Button variant="outline" className="w-full" onClick={() => void navigate({ to: "/login" })}>
                  Iniciar sesión
                </Button>
              )}
              <Button
                className="w-full text-white hover:opacity-90"
                style={{ background: "var(--h-from)" }}
                onClick={() => void navigate({ to: user ? "/app/dashboard" : "/login" })}
              >
                {user ? "Mi cuenta" : "Comenzar gratis"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate();
  return (
    <section
      id="plataforma"
      className="relative overflow-hidden pt-16"
      style={{ background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 55%, #312E81 100%)", minHeight: "100vh" }}
    >
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
      {/* Blobs */}
      <div className="absolute top-1/4 -left-16 w-[480px] h-[480px] rounded-full opacity-[0.18] blur-[90px] pointer-events-none" style={{ background: "radial-gradient(circle, #38BDF8, transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-0 w-[380px] h-[380px] rounded-full opacity-[0.14] blur-[80px] pointer-events-none" style={{ background: "radial-gradient(circle, #818CF8, transparent 70%)" }} />
      <div className="absolute top-3/4 left-1/2 w-[300px] h-[300px] rounded-full opacity-[0.12] blur-[70px] pointer-events-none" style={{ background: "radial-gradient(circle, #6EE7B7, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[58%_42%] gap-10 lg:gap-6 items-center">

          {/* ── Left column ── */}
          <div style={{ animation: "fade-slide-up 0.7s ease-out both" }}>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide mb-7 text-white/80"
                 style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" style={{ animation: "pulse-green 2s ease-in-out infinite" }} />
              🚀 Metodología estratégica para LATAM
            </div>

            {/* Headline */}
            <h1 className="font-display text-white leading-[1.1] mb-5" style={{ fontSize: "clamp(2.2rem, 5vw, 3.25rem)", fontWeight: 900 }}>
              Transforma empresas con
              <br />
              <span style={{ background: "linear-gradient(90deg, #38BDF8 0%, #818CF8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                estrategia, datos y método
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-white/70 leading-relaxed mb-8 max-w-xl" style={{ fontSize: "clamp(1rem, 1.8vw, 1.15rem)" }}>
              Suite integrada de herramientas estratégicas para consultores y PyMEs que quieren crecer con claridad, foco y resultados medibles.
            </p>

            {/* Bullets */}
            <ul className="space-y-2.5 mb-9">
              {[
                "Diagnóstico empresarial en minutos",
                "Plan estratégico con BSC integrado",
                "Acompañamiento con IA y metodología probada",
              ].map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-white/85">
                  <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center" style={{ background: "rgba(56,189,248,0.25)", border: "1.5px solid #38BDF8" }}>
                    <Check className="w-3 h-3" style={{ color: "#38BDF8" }} />
                  </div>
                  {b}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Button
                size="lg"
                className="text-navy font-bold px-8 hover:opacity-90 transition-opacity shadow-lg"
                style={{ background: "linear-gradient(135deg, #38BDF8, #818CF8)", color: "#0C4A6E" }}
                onClick={() => void navigate({ to: "/app/dashboard" })}
              >
                Explorar plataforma <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg" variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:text-white bg-transparent font-medium px-8"
                onClick={() => { document.getElementById("precios")?.scrollIntoView({ behavior: "smooth" }); }}
              >
                Ver planes y precios
              </Button>
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap gap-6 items-center">
              {[
                { icon: BookOpen, value: "12",  label: "Módulos"             },
                { icon: Globe,    value: "6",   label: "Países"              },
                { icon: BarChart2,value: "35+", label: "Años de experiencia" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.10)" }}>
                    <s.icon className="w-4.5 h-4.5 text-white/65" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white font-display leading-none">{s.value}</div>
                    <div className="text-[11px] text-white/50 mt-0.5">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column: Dashboard mockup ── */}
          <div className="hidden lg:block" style={{ animation: "fade-slide-up 0.9s ease-out 0.2s both" }}>
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section 2 — Problemas ─────────────────────────────────────────────────────
function ProblemasSection() {
  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: "white" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--h-acc)" }}>
            ¿TE SUENA FAMILIAR?
          </div>
          <h2 className="font-display mb-4" style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 800, color: "var(--h-from)" }}>
            Los 6 problemas que frenan
            <br />
            el crecimiento de tu empresa
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            La mayoría de las PyMEs en Latinoamérica operan sin sistemas claros de gestión. ¿Reconoces alguno?
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROBLEMAS.map(({ emoji, titulo, desc, border }) => (
            <div
              key={titulo}
              className="rounded-xl p-5 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{ borderColor: "var(--border)", background: "var(--card)", borderLeft: `4px solid ${border}` }}
            >
              <div className="text-3xl mb-3">{emoji}</div>
              <h3 className="font-semibold text-sm leading-snug mb-2" style={{ color: "var(--h-from)" }}>{titulo}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Module card ───────────────────────────────────────────────────────────────
function ModuloCard({ m }: { m: ModuloConfig }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  return (
    <div
      className="rounded-xl border flex flex-col overflow-hidden"
      style={{
        borderColor: hovered ? m.color : "var(--border)",
        background: "white",
        borderTop: `4px solid ${m.color}`,
        boxShadow: hovered ? `0 16px 40px ${m.color}22` : "0 2px 8px rgba(12,74,110,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.25s ease",
        cursor: "default",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="p-5 flex-1">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${m.color}16` }}>
          <m.icon className="w-5 h-5" style={{ color: m.color }} />
        </div>
        <h3 className="font-semibold text-sm mb-1.5" style={{ color: "var(--h-from)" }}>{m.label}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{m.desc}</p>
        <span
          className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ background: `${m.color}13`, color: m.color }}
        >
          INCLUIDO EN {m.planBadge}
        </span>
      </div>

      {/* Expandable preview */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: hovered ? "170px" : "0", borderTop: hovered ? `1px solid ${m.color}20` : "none" }}
      >
        <div className="px-5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: m.color }}>
            Preview del módulo
          </div>
          <ModuloPreview type={m.previewType} color={m.color} />
        </div>
      </div>

      <div className="px-5 pb-4 pt-2">
        <button
          onClick={() => void navigate({ to: m.route as "/" })}
          className="flex items-center gap-1 text-xs font-semibold hover:opacity-75 transition-opacity"
          style={{ color: m.color }}
        >
          Ver preview <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Section 3 — Módulos ───────────────────────────────────────────────────────
function ModulosSection() {
  return (
    <section id="modulos" className="py-24 px-4 sm:px-6" style={{ background: "#F5F7FF" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--h-from)" }}>
            LA SUITE COMPLETA
          </div>
          <h2 className="font-display mb-4" style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 800, color: "var(--h-from)" }}>
            7 módulos integrados.
            <br />
            Un solo sistema.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base">
            Pasa el mouse sobre cada tarjeta para ver un preview del módulo.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MODULOS.map((m) => <ModuloCard key={m.slug} m={m} />)}
        </div>
      </div>
    </section>
  );
}

// ── Section 4 — Cómo funciona ─────────────────────────────────────────────────
function ComoFuncionaSection() {
  return (
    <section id="como-funciona" className="py-24 px-4 sm:px-6" style={{ background: "white" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--h-acc)" }}>
            CÓMO FUNCIONA
          </div>
          <h2 className="font-display mb-4" style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 800, color: "var(--h-from)" }}>
            De la confusión a la claridad
            <br />
            en 3 pasos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px" style={{ background: `linear-gradient(to right, var(--h-acc), var(--h-to))`, opacity: 0.4 }} />

          {PASOS.map(({ n, icon: Icon, titulo, sub, desc, resultado }) => (
            <div key={n} className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, var(--h-from), var(--h-to))" }}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shadow-md" style={{ background: "var(--h-acc)" }}>
                  {n}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <h3 className="font-display text-xl font-bold" style={{ color: "var(--h-from)" }}>{titulo}</h3>
                  <p className="text-sm font-semibold" style={{ color: "var(--h-acc)" }}>{sub}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--acc2)", color: "var(--h-from)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> {resultado}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section 5 — Resultados ────────────────────────────────────────────────────
function ResultadosSection() {
  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: "#F5F7FF" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--h-from)" }}>
            RESULTADOS COMPROBADOS
          </div>
          <h2 className="font-display mb-4" style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 800, color: "var(--h-from)" }}>
            Lo que la metodología estratégica
            <br />
            logra en empresas reales
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATS_RESULTADOS.map((s) => (
            <div
              key={s.stat}
              className="bg-white rounded-2xl border p-8 flex flex-col gap-4 transition-shadow hover:shadow-lg"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="text-4xl">{s.emoji}</div>
              <div className="font-display font-black leading-none" style={{ fontSize: "3.5rem", color: "var(--h-from)" }}>
                {s.stat}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{s.desc}</p>
              <div className="text-[11px] font-bold uppercase tracking-wider pt-4 border-t" style={{ color: "var(--h-acc)", borderColor: "var(--border)" }}>
                — {s.source}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section 6 — Precios ───────────────────────────────────────────────────────
function PreciosSection() {
  const navigate = useNavigate();
  return (
    <section id="precios" className="py-24 px-4 sm:px-6" style={{ background: "white" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--h-acc)" }}>
            PRECIOS
          </div>
          <h2 className="font-display mb-4" style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 800, color: "var(--h-from)" }}>
            Planes para cada etapa de tu empresa
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-base">
            Sin contratos de largo plazo. Cancela cuando quieras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANES_DATA.map((plan) => (
            <div
              key={plan.nombre}
              className="rounded-2xl border flex flex-col overflow-hidden"
              style={{
                borderColor: plan.popular ? "var(--h-acc)" : "var(--border)",
                borderWidth: plan.popular ? "2px" : "1px",
                background: "white",
                boxShadow: plan.popular ? "0 12px 40px rgba(56,189,248,0.18)" : "0 2px 8px rgba(12,74,110,0.06)",
              }}
            >
              {plan.popular && (
                <div className="py-2 text-center text-[11px] font-black uppercase tracking-widest text-white" style={{ background: "linear-gradient(90deg, var(--h-from), var(--h-to))" }}>
                  MÁS POPULAR
                </div>
              )}
              <div className="p-7 flex-1 flex flex-col gap-5">
                <div>
                  <h3 className="font-display text-lg font-bold mb-1" style={{ color: "var(--h-from)" }}>{plan.nombre}</h3>
                  <p className="text-xs text-muted-foreground leading-snug">{plan.desc}</p>
                </div>

                <div className="flex items-end gap-1">
                  <span
                    className="font-display font-black leading-none"
                    style={{ fontSize: "2.8rem", background: "linear-gradient(to right, var(--h-from), var(--h-to))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                  >
                    ${plan.precio}
                  </span>
                  <span className="text-muted-foreground text-sm mb-1.5">/mes</span>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check className="w-4 h-4 shrink-0" style={{ color: "var(--h-acc)" }} />
                      <span style={{ color: "var(--h-from)" }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.isMailto ? (
                  <a
                    href={plan.ctaHref}
                    className="w-full mt-2 py-2.5 rounded-lg text-sm font-bold text-center block text-white hover:opacity-90 transition-opacity"
                    style={{ background: "var(--h-from)" }}
                  >
                    {plan.ctaLabel}
                  </a>
                ) : (
                  <Button
                    className="w-full mt-2 text-white hover:opacity-90 transition-opacity font-bold"
                    style={{ background: plan.popular ? "linear-gradient(135deg, var(--h-from), var(--h-to))" : "var(--h-from)" }}
                    onClick={() => void navigate({ to: "/login" })}
                  >
                    {plan.ctaLabel}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section 7 — CTA Final ─────────────────────────────────────────────────────
function CTAFinalSection() {
  const navigate = useNavigate();
  return (
    <section
      id="nosotros"
      className="relative py-24 px-4 sm:px-6 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 55%, #312E81 100%)" }}
    >
      <div className="absolute inset-0 opacity-[0.10]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[80px] pointer-events-none" style={{ background: "radial-gradient(circle, #38BDF8, transparent 70%)" }} />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="font-display text-white font-bold mb-5" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)" }}>
          ¿Listo para transformar
          <br />tu empresa?
        </h2>
        <p className="text-white/70 mb-6 text-base leading-relaxed max-w-2xl mx-auto">
          Las empresas que implementan metodologías estratégicas estructuradas logran en promedio:
        </p>
        <ul className="text-left inline-flex flex-col gap-2 mb-8 text-white/80 text-sm">
          {[
            "30% más claridad en la toma de decisiones",
            "2× más velocidad en la ejecución estratégica",
            "Reducción del 40% en tiempo perdido por falta de procesos claros",
          ].map((b) => (
            <li key={b} className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#38BDF8" }} />
              {b}
            </li>
          ))}
        </ul>
        <p className="text-white/40 text-xs mb-10">
          Fuente: McKinsey Global Institute · Deloitte Business Strategy Report
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="font-bold px-10 hover:opacity-90 transition-opacity shadow-lg"
            style={{ background: "linear-gradient(135deg, #38BDF8, #818CF8)", color: "#0C4A6E" }}
            onClick={() => void navigate({ to: "/login" })}
          >
            Comenzar ahora <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <a
            href="mailto:info@a360sp.com"
            className="inline-flex items-center justify-center gap-2 rounded-md border px-8 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.35)" }}
          >
            Hablar con un consultor
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: "#0C4A6E" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <A360Logo size={34} withText />
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Suite integrada de gestión estratégica para consultores y PyMEs en Latinoamérica.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4 text-white/90">Plataforma</p>
            <ul className="space-y-2.5">
              {[
                { label: "Módulos",  href: "#modulos"         },
                { label: "Precios",  href: "#precios"         },
                { label: "Demo",     href: "/app/dashboard"   },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4 text-white/90">Empresa</p>
            <ul className="space-y-2.5">
              {[
                { label: "Nosotros",    href: "#nosotros"            },
                { label: "Metodología", href: "#como-funciona"       },
                { label: "Contacto",    href: "mailto:info@a360sp.com" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4 text-white/90">Legal</p>
            <ul className="space-y-2.5">
              {[
                { label: "Términos",    href: "#" },
                { label: "Privacidad",  href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            © 2026 Aceleradora 360 · a360sp.com
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Hecho con ♥ para PyMEs latinoamericanas
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function LandingPage() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = ""; };
  }, []);

  return (
    <div className="min-h-screen">
      <GlobalStyles />
      <Navbar />
      <Hero />
      <ProblemasSection />
      <ModulosSection />
      <ComoFuncionaSection />
      <ResultadosSection />
      <PreciosSection />
      <CTAFinalSection />
      <Footer />
    </div>
  );
}
