import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { SECCIONES_PLAN, completitudPlan, type NivelPlan } from "@/lib/plan-helpers";
import { Target, ArrowRight, Briefcase } from "lucide-react";

export const Route = createFileRoute("/app/plan")({ component: PlanPanel });

interface Fila {
  cliente_id: string;
  nombre_empresa: string;
  plan_licencia: NivelPlan;
  sector: string | null;
  pct: number;
  ultimaActualizacion: string | null;
  hasPlan: boolean;
}

function PlanPanel() {
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
        const nivel = (c.plan_licencia ?? "esencial") as NivelPlan;
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

  const conPlan = filas.filter((f) => f.hasPlan).length;
  const promedio = filas.length ? Math.round(filas.reduce((a, f) => a + f.pct, 0) / filas.length) : 0;

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-navy">Plan Estratégico</h1>
        <p className="text-sm text-muted-foreground mt-1">
          18 secciones por cliente · niveles esencial, avanzado y corporativo. Selecciona un cliente para abrir su plan completo.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Clientes activos" value={filas.length} />
        <Stat label="Con plan iniciado" value={conPlan} />
        <Stat label="Avance promedio" value={`${promedio}%`} />
        <Stat label="Secciones del marco" value={SECCIONES_PLAN.length} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" /> Planes por cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : filas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay clientes activos. Crea un cliente desde Mis clientes.</p>
          ) : (
            <div className="space-y-1">
              {filas.map((f) => (
                <Link
                  key={f.cliente_id}
                  to="/app/clientes/$clienteId/plan"
                  params={{ clienteId: f.cliente_id }}
                  className="flex items-center gap-3 p-2.5 rounded hover:bg-muted/50 group"
                >
                  <div className="w-8 h-8 rounded bg-navy/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{f.nombre_empresa}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {f.sector ?? "Sin sector"} · Última actualización: {f.ultimaActualizacion ? new Date(f.ultimaActualizacion).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">{f.plan_licencia}</Badge>
                  <div className="w-32 hidden md:block">
                    <Progress value={f.pct} className="h-1.5" />
                  </div>
                  <span className="text-xs font-semibold text-navy w-10 text-right">{f.pct}%</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-navy transition" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Marco metodológico — 18 secciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {SECCIONES_PLAN.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-2 p-2 rounded border bg-muted/20">
                  <Icon className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="text-[10px] font-mono text-muted-foreground">{String(s.numero).padStart(2, "0")}</span>
                  <span className="truncate">{s.titulo}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl text-navy mt-1">{value}</div>
    </CardContent></Card>
  );
}
