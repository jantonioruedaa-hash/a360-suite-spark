import { createFileRoute, Link } from "@tanstack/react-router";
import { demoClientes, imeColor, imeLabel } from "@/lib/demo-data";
import { Briefcase, Activity, Users2, BookOpen, ArrowUpRight, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

const metrics = [
  { label: "Clientes activos", value: 12, delta: "+2 este mes", icon: Briefcase },
  { label: "Diagnósticos este mes", value: 7, delta: "+3 vs anterior", icon: Activity },
  { label: "Sesiones coaching", value: 23, delta: "5 esta semana", icon: Users2 },
  { label: "Capítulos LEE en progreso", value: 9, delta: "4 facilitadores", icon: BookOpen },
];

function Dashboard() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-navy">Dashboard del consultor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visión general de tu cartera y avance por módulo.
          </p>
        </div>
        <Button className="bg-navy text-primary-foreground hover:bg-navy/90">
          <Plus className="w-4 h-4 mr-2" /> Nuevo diagnóstico
        </Button>
      </header>

      {/* Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m) => (
          <div key={m.label} className="a360-card p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gold/10" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{m.label}</p>
                <p className="font-mono-num text-4xl text-navy mt-2 font-semibold">{m.value}</p>
                <p className="text-xs text-gold mt-1.5 font-medium">{m.delta}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-navy text-gold flex items-center justify-center">
                <m.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Clients grid */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl text-navy">Cartera de clientes</h2>
          <Link to="/app/clientes" className="text-sm text-gold font-medium hover:underline inline-flex items-center gap-1">
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {demoClientes.map((c) => (
            <article key={c.id} className="a360-card a360-card-lg p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-lg text-navy leading-tight truncate">{c.nombre_empresa}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.sector} · {c.tamano}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {c.ciudad}, {c.pais}
                  </p>
                </div>
                <div className={`px-2.5 py-1 rounded-md text-xs font-semibold ${imeColor(c.ime_estado)}`}>
                  <div className="font-mono-num text-base leading-none">{c.ime.toFixed(1)}</div>
                  <div className="text-[9px] uppercase tracking-wider mt-0.5">{imeLabel(c.ime_estado)}</div>
                </div>
              </div>

              <div className="space-y-2">
                {(["side", "plan", "coach", "lee"] as const).map((k) => (
                  <div key={k}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="uppercase tracking-wider text-muted-foreground font-medium">{k}</span>
                      <span className="font-mono-num text-navy">{c.progreso[k]}%</span>
                    </div>
                    <Progress value={c.progreso[k]} className="h-1.5 [&>div]:bg-gold" />
                  </div>
                ))}
              </div>

              {c.brechas.length > 0 && (
                <div className="text-xs">
                  <div className="text-muted-foreground mb-1">Brechas críticas:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.brechas.map((b) => (
                      <span key={b.nombre} className="px-2 py-0.5 rounded bg-cream border border-border text-navy">
                        {b.nombre} <span className="font-mono-num text-destructive">{b.score}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground">{c.ultima_actividad}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs border-navy/20 text-navy hover:bg-navy hover:text-primary-foreground">
                    Ver detalle
                  </Button>
                  <Button size="sm" className="h-8 text-xs bg-gold text-navy hover:bg-gold/90">
                    Diagnóstico
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
