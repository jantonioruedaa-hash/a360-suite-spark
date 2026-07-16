import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { A360Logo } from "@/components/A360Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ScanSearch, Compass, HeartHandshake, GraduationCap,
  TrendingUp, Megaphone, ClipboardList,
  AlertTriangle, Target, BarChart2, Users, Rocket, UserMinus,
  ArrowRight, Check, Menu, X, ChevronRight,
  Building2, Globe, BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const MODULOS = [
  {
    slug: "side", icon: ScanSearch, label: "Diagnóstico SIDE",
    desc: "Evalúa el estado real de tu empresa en 12 dimensiones clave con un diagnóstico integral.",
    route: "/app/side",
    color: "#0C4A6E",
  },
  {
    slug: "plan", icon: Compass, label: "Plan Estratégico",
    desc: "Diseña tu mapa de ruta empresarial con objetivos, iniciativas y tablero BSC.",
    route: "/app/plan",
    color: "#1E3A8A",
  },
  {
    slug: "coaching", icon: HeartHandshake, label: "Coaching A360",
    desc: "Acompañamiento ejecutivo personalizado para desarrollar líderes y equipos de alto rendimiento.",
    route: "/app/coaching",
    color: "#312E81",
  },
  {
    slug: "lee", icon: GraduationCap, label: "Programa LEE",
    desc: "Liderazgo Empresarial Evolutivo: formación continua para directivos y sus equipos.",
    route: "/app/lee",
    color: "#4338CA",
  },
  {
    slug: "kpis", icon: TrendingUp, label: "Seguimiento KPIs",
    desc: "Tablero de indicadores en tiempo real para medir el avance de tu estrategia.",
    route: "/app/kpis",
    color: "#0369A1",
  },
  {
    slug: "crecimiento", icon: Megaphone, label: "Marketing Digital",
    desc: "Estrategia de crecimiento digital adaptada al mercado latinoamericano.",
    route: "/app/crecimiento",
    color: "#0E7490",
  },
  {
    slug: "manual", icon: ClipboardList, label: "Manual de Funciones",
    desc: "Documenta roles, competencias y responsabilidades de cada posición en tu organización.",
    route: "/app/dashboard",
    color: "#1E40AF",
  },
];

const PROBLEMAS = [
  { icon: AlertTriangle, text: "No tienes claridad sobre el estado real de tu empresa" },
  { icon: Target,        text: "Tus estrategias se diseñan pero nunca se ejecutan" },
  { icon: BarChart2,     text: "No tienes indicadores claros de desempeño" },
  { icon: Users,         text: "Tu equipo no está alineado con los objetivos" },
  { icon: Rocket,        text: "No sabes cómo crecer de forma sostenida" },
  { icon: UserMinus,     text: "Dependes demasiado de tu presencia para operar" },
];

const PLANES = [
  {
    nombre: "Esencial",
    precio: 99,
    desc: "Para empresas que están comenzando su transformación.",
    modulos: ["Diagnóstico SIDE", "Plan Estratégico"],
    popular: false,
  },
  {
    nombre: "Profesional",
    precio: 199,
    desc: "La solución completa para PyMEs en crecimiento.",
    modulos: ["Diagnóstico SIDE", "Plan Estratégico", "Coaching A360", "Programa LEE", "Seguimiento KPIs"],
    popular: true,
  },
  {
    nombre: "Enterprise",
    precio: 349,
    desc: "Acceso total para organizaciones que quieren escalar.",
    modulos: ["Diagnóstico SIDE", "Plan Estratégico", "Coaching A360", "Programa LEE", "Seguimiento KPIs", "Marketing Digital", "Manual de Funciones"],
    popular: false,
  },
];

const PASOS = [
  {
    n: "01", icon: ScanSearch, titulo: "Diagnostica tu empresa",
    desc: "Aplica el diagnóstico SIDE y obtén un mapa completo del estado actual de tu organización en 12 dimensiones.",
  },
  {
    n: "02", icon: Compass, titulo: "Diseña tu plan estratégico",
    desc: "Con base en el diagnóstico, co-crea con tu consultor un plan de acción con objetivos claros y métricas de éxito.",
  },
  {
    n: "03", icon: HeartHandshake, titulo: "Ejecuta con acompañamiento",
    desc: "Implementa tu estrategia con sesiones de coaching, seguimiento de KPIs y acceso a toda la plataforma.",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function Navbar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: "Plataforma", href: "#plataforma" },
    { label: "Módulos",    href: "#modulos"    },
    { label: "Precios",    href: "#precios"    },
    { label: "Nosotros",   href: "#nosotros"   },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-lg" : ""
      }`}
      style={{
        background: scrolled
          ? "rgba(255,255,255,0.97)"
          : "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <a href="/" className="shrink-0">
          <A360Logo size={36} withText={true} />
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                scrolled
                  ? "text-navy hover:bg-[var(--acc2)]"
                  : "text-white/85 hover:text-white hover:bg-white/10"
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Auth buttons */}
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
                  size="sm"
                  variant="outline"
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

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg"
          style={{ color: scrolled ? "var(--h-from)" : "white" }}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menú"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t" style={{ background: "rgba(255,255,255,0.98)", borderColor: "var(--border)" }}>
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-navy rounded-lg hover:bg-[var(--acc2)]"
              >
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

function Hero() {
  const navigate = useNavigate();
  return (
    <section
      id="plataforma"
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{ background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 60%, #312E81 100%)" }}
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[80px] pointer-events-none"
           style={{ background: "radial-gradient(circle, #38BDF8, transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-[80px] pointer-events-none"
           style={{ background: "radial-gradient(circle, #818CF8, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-6 text-white/80"
             style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <BookOpen className="w-3.5 h-3.5" />
          Sistema de Gestión Empresarial
        </div>

        {/* Headline */}
        <h1 className="font-display text-white mb-6 leading-[1.1]"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900 }}>
          El sistema operativo
          <br />
          <span style={{ background: "linear-gradient(90deg, #38BDF8, #818CF8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            de tu empresa
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed"
           style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}>
          Suite integrada de herramientas estratégicas para consultores y PyMEs en Latinoamérica.
          Del diagnóstico a la ejecución, todo en un solo lugar.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Button
            size="lg"
            className="text-white font-semibold px-8 hover:opacity-90 transition-opacity shadow-lg"
            style={{ background: "linear-gradient(135deg, #0EA5E9, #6366F1)" }}
            onClick={() => void navigate({ to: "/app/dashboard" })}
          >
            Explorar plataforma <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/40 text-white hover:bg-white/10 hover:text-white bg-transparent font-medium px-8"
            onClick={() => { document.getElementById("precios")?.scrollIntoView({ behavior: "smooth" }); }}
          >
            Ver planes
          </Button>
        </div>

        {/* Stats */}
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
          {[
            { icon: Building2, value: "500+",  label: "Empresas" },
            { icon: Globe,     value: "6",     label: "Países"   },
            { icon: BookOpen,  value: "7",     label: "Módulos"  },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: "rgba(255,255,255,0.12)" }}>
                <s.icon className="w-5 h-5 text-white/70" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-white font-display leading-none">{s.value}</div>
                <div className="text-xs text-white/60 mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemasSection() {
  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <Badge className="mb-4 font-semibold text-xs uppercase tracking-wider"
                 style={{ background: "var(--acc2)", color: "var(--h-from)", border: "none" }}>
            El problema
          </Badge>
          <h2 className="font-display text-3xl mb-4" style={{ color: "var(--h-from)" }}>
            ¿Tu empresa enfrenta estos desafíos?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base">
            La mayoría de las PyMEs en Latinoamérica operan sin sistemas claros de gestión. Reconoce los síntomas.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROBLEMAS.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-start gap-4 rounded-xl p-5 border transition-shadow hover:shadow-md"
              style={{ borderColor: "var(--border)", background: "var(--card)", borderLeft: "4px solid var(--h-acc)" }}
            >
              <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                   style={{ background: "var(--acc2)" }}>
                <Icon className="w-4.5 h-4.5" style={{ color: "var(--h-acc)" }} />
              </div>
              <p className="text-sm font-medium leading-snug" style={{ color: "var(--h-from)" }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModulosSection() {
  const navigate = useNavigate();
  return (
    <section id="modulos" className="py-24 px-4 sm:px-6" style={{ background: "var(--acc2)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <Badge className="mb-4 font-semibold text-xs uppercase tracking-wider"
                 style={{ background: "var(--h-from)", color: "#fff", border: "none" }}>
            La solución
          </Badge>
          <h2 className="font-display text-3xl mb-4" style={{ color: "var(--h-from)" }}>
            Todo lo que necesitas en un solo lugar
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base">
            Siete módulos integrados que cubren el ciclo completo de transformación empresarial.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MODULOS.map(({ icon: Icon, label, desc, route, color }) => (
            <div
              key={label}
              className="rounded-xl border p-5 bg-white flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
              style={{ borderColor: "var(--border)", borderTop: `4px solid ${color}` }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--h-from)" }}>{label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
              <button
                onClick={() => void navigate({ to: route as "/" })}
                className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-75 mt-auto"
                style={{ color }}
              >
                Explorar módulo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComoFuncionaSection() {
  return (
    <section className="py-24 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <Badge className="mb-4 font-semibold text-xs uppercase tracking-wider"
                 style={{ background: "var(--acc2)", color: "var(--h-from)", border: "none" }}>
            Cómo funciona
          </Badge>
          <h2 className="font-display text-3xl mb-4" style={{ color: "var(--h-from)" }}>
            Tres pasos para transformar tu empresa
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px"
               style={{ background: "linear-gradient(to right, var(--h-acc), var(--h-to))" }} />
          {PASOS.map(({ n, icon: Icon, titulo, desc }) => (
            <div key={n} className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                     style={{ background: "linear-gradient(135deg, var(--h-from), var(--h-to))" }}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                     style={{ background: "var(--h-acc)" }}>
                  {n}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-base mb-2" style={{ color: "var(--h-from)" }}>{titulo}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PreciosSection() {
  const navigate = useNavigate();
  return (
    <section id="precios" className="py-24 px-4 sm:px-6" style={{ background: "var(--acc2)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <Badge className="mb-4 font-semibold text-xs uppercase tracking-wider"
                 style={{ background: "var(--h-from)", color: "#fff", border: "none" }}>
            Precios
          </Badge>
          <h2 className="font-display text-3xl mb-4" style={{ color: "var(--h-from)" }}>
            Planes para cada etapa de tu empresa
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-base">
            Sin contratos de largo plazo. Cancela cuando quieras.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANES.map((plan) => (
            <div
              key={plan.nombre}
              className="rounded-2xl border flex flex-col overflow-hidden"
              style={{
                borderColor: plan.popular ? "var(--h-acc)" : "var(--border)",
                background: "white",
                boxShadow: plan.popular ? "0 8px 32px rgba(56,189,248,0.20)" : "0 2px 8px rgba(12,74,110,0.06)",
                borderWidth: plan.popular ? "2px" : "1px",
              }}
            >
              {plan.popular && (
                <div className="py-2 text-center text-xs font-bold uppercase tracking-widest text-white"
                     style={{ background: "linear-gradient(90deg, var(--h-from), var(--h-to))" }}>
                  Más popular
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col gap-5">
                <div>
                  <h3 className="font-display text-lg font-bold mb-1" style={{ color: "var(--h-from)" }}>
                    {plan.nombre}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-snug">{plan.desc}</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="font-display font-bold leading-none"
                        style={{ fontSize: "2.5rem", background: "linear-gradient(to right, var(--h-from), var(--h-to))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    ${plan.precio}
                  </span>
                  <span className="text-muted-foreground text-sm mb-1">/mes</span>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.modulos.map((m) => (
                    <li key={m} className="flex items-center gap-2.5 text-sm">
                      <Check className="w-4 h-4 shrink-0" style={{ color: "var(--h-acc)" }} />
                      <span style={{ color: "var(--h-from)" }}>{m}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-2 text-white hover:opacity-90 transition-opacity font-semibold"
                  style={{ background: plan.popular ? "linear-gradient(135deg, var(--h-from), var(--h-to))" : "var(--h-from)" }}
                  onClick={() => void navigate({ to: "/login" })}
                >
                  Comenzar ahora <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTAFinalSection() {
  const navigate = useNavigate();
  return (
    <section
      className="relative py-24 px-4 sm:px-6 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0C4A6E 0%, #1E3A8A 100%)" }}
    >
      <div className="absolute inset-0 opacity-10"
           style={{
             backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
             backgroundSize: "24px 24px",
           }} />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl text-white font-bold mb-4" id="nosotros">
          ¿Listo para transformar tu empresa?
        </h2>
        <p className="text-white/70 mb-8 text-base max-w-xl mx-auto">
          Únete a más de 500 empresas latinoamericanas que ya gestionan su crecimiento con Aceleradora 360 SGP.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="font-semibold px-10 hover:opacity-90 transition-opacity shadow-lg"
            style={{ background: "linear-gradient(135deg, #38BDF8, #6366F1)", color: "white" }}
            onClick={() => void navigate({ to: "/login" })}
          >
            Comenzar hoy <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/40 text-white hover:bg-white/10 hover:text-white bg-transparent font-medium px-8"
            onClick={() => { document.getElementById("modulos")?.scrollIntoView({ behavior: "smooth" }); }}
          >
            Ver módulos
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 border-t" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <A360Logo size={36} withText={true} />
            <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Suite integrada de gestión estratégica para consultores y PyMEs en Latinoamérica.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--h-from)" }}>
              Plataforma
            </p>
            <ul className="space-y-2">
              {MODULOS.slice(0, 4).map((m) => (
                <li key={m.label}>
                  <a href={m.route} className="text-sm text-muted-foreground hover:text-navy transition-colors">
                    {m.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--h-from)" }}>
              Acceso rápido
            </p>
            <ul className="space-y-2">
              {[
                { label: "Módulos",        href: "#modulos"        },
                { label: "Precios",        href: "#precios"        },
                { label: "Iniciar sesión", href: "/login"          },
                { label: "Comenzar gratis", href: "/login"         },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-muted-foreground hover:text-navy transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2"
             style={{ borderColor: "var(--border)" }}>
          <p className="text-xs text-muted-foreground">
            © 2026 Aceleradora 360. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Hecho con ♥ para PyMEs latinoamericanas
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function LandingPage() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = ""; };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ProblemasSection />
      <ModulosSection />
      <ComoFuncionaSection />
      <PreciosSection />
      <CTAFinalSection />
      <Footer />
    </div>
  );
}
