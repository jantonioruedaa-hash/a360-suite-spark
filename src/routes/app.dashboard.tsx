import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Briefcase, Activity, Users2, BookOpen, ArrowUpRight, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

interface Cliente {
  id: string;
  nombre_empresa: string;
  sector: string | null;
  tamano: string | null;
  pais: string | null;
  ciudad: string | null;
  updated_at: string;
}

function Dashboard() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sideCount, setSideCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clientes")
      .select("id,nombre_empresa,sector,tamano,pais,ciudad,updated_at")
      .eq("activo", true)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setClientes((data ?? []) as Cliente[]));

    const since = new Date();
    since.setDate(1);
    supabase
      .from("side_sesiones")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since.toISOString())
      .then(({ count }) => setSideCount(count ?? 0));
  }, [user]);

  const metrics = [
    { label: "Clientes activos", value: clientes.length, delta: "", icon: Briefcase },
    { label: "Diagnósticos este mes", value: sideCount, delta: "", icon: Activity },
    { label: "Sesiones coaching", value: 0, delta: "", icon: Users2 },
    { label: "Capítulos LEE en progreso", value: 0, delta: "", icon: BookOpen },
  ];

  return (
    <div className="space-y-8 max-w-[1400px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-navy">Dashboard del consultor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visión general de tu cartera y avance por módulo.
          </p>
        </div>
        <Button asChild className="bg-navy text-primary-foreground hover:bg-navy/90">
          <Link to="/app/side"><Plus className="w-4 h-4 mr-2" /> Nuevo diagnóstico</Link>
        </Button>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m) => (
          <div key={m.label} className="a360-card p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gold/10" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{m.label}</p>
                <p className="font-mono-num text-4xl text-navy mt-2 font-semibold">{m.value}</p>
                {m.delta && <p className="text-xs text-gold mt-1.5 font-medium">{m.delta}</p>}
              </div>
              <div className="w-10 h-10 rounded-md bg-navy text-gold flex items-center justify-center">
                <m.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl text-navy">Cartera de clientes</h2>
          <Link to="/app/clientes" className="text-sm text-gold font-medium hover:underline inline-flex items-center gap-1">
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {clientes.length === 0 ? (
          <div className="a360-card p-8 text-center text-sm text-muted-foreground">
            Aún no tienes clientes. Crea uno desde el módulo SIDE.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {clientes.map((c) => (
              <article key={c.id} className="a360-card a360-card-lg p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg text-navy leading-tight truncate">{c.nombre_empresa}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[c.sector, c.tamano].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {(c.ciudad || c.pais) && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {[c.ciudad, c.pais].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-auto">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(c.updated_at).toLocaleDateString()}
                  </span>
                  <Button asChild size="sm" className="h-8 text-xs bg-gold text-navy hover:bg-gold/90">
                    <Link to="/app/side">Diagnóstico</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
