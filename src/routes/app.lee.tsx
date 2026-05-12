import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LEE_CAPITULOS, LEE_OVERVIEW } from "@/lib/lee-catalogo";
import { GraduationCap, ArrowRight, BookOpen, Award, Info } from "lucide-react";

export const Route = createFileRoute("/app/lee")({ component: LeePanel });

interface Fila {
  cliente_id: string;
  nombre_empresa: string;
  programa_id: string | null;
  capitulos_desbloqueados: number[];
  workbooks: number;
  workbooksCompletos: number;
}

function LeePanel() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: clientes }, { data: programas }, { data: workbooks }] = await Promise.all([
        supabase.from("clientes").select("id,nombre_empresa").eq("activo", true).order("nombre_empresa"),
        supabase.from("lee_programas").select("*"),
        supabase.from("lee_workbooks").select("programa_id,completado"),
      ]);
      const progByCliente = new Map<string, Record<string, unknown>>();
      (programas ?? []).forEach((p: Record<string, unknown>) => progByCliente.set(p.cliente_id as string, p));
      const wbByPrograma = new Map<string, { total: number; completos: number }>();
      (workbooks ?? []).forEach((w: Record<string, unknown>) => {
        const k = w.programa_id as string;
        const r = wbByPrograma.get(k) ?? { total: 0, completos: 0 };
        r.total++;
        if (w.completado) r.completos++;
        wbByPrograma.set(k, r);
      });

      const out: Fila[] = (clientes ?? []).map((c) => {
        const p = progByCliente.get(c.id);
        const wb = p ? wbByPrograma.get(p.id as string) : null;
        return {
          cliente_id: c.id,
          nombre_empresa: c.nombre_empresa,
          programa_id: (p?.id as string) ?? null,
          capitulos_desbloqueados: (p?.capitulos_desbloqueados as number[]) ?? [],
          workbooks: wb?.total ?? 0,
          workbooksCompletos: wb?.completos ?? 0,
        };
      });
      setFilas(out.sort((a, b) => (b.programa_id ? 1 : 0) - (a.programa_id ? 1 : 0)));
      setLoading(false);
    })();
  }, []);

  const conPrograma = filas.filter((f) => f.programa_id).length;

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-navy">Programa LEE — Panel de seguimiento</h1>
        <p className="text-sm text-muted-foreground mt-1">{LEE_OVERVIEW.proposito}</p>
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          <Badge variant="outline"><BookOpen className="w-3 h-3 mr-1" /> {LEE_CAPITULOS.length} capítulos</Badge>
          <Badge variant="outline">{LEE_OVERVIEW.duracionTotal}</Badge>
          <Badge variant="outline"><Award className="w-3 h-3 mr-1" /> {LEE_OVERVIEW.certificacion}</Badge>
        </div>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <strong>LEE migrará a una app independiente.</strong> Aquí mantendremos el panel de seguimiento del consultor (avance, capítulos desbloqueados, workbooks completos). El contenido completo del programa, workbooks por capítulo y certificación vivirán en{" "}
            <span className="font-mono">lee.a360.com</span>, conectado al mismo backend.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Clientes activos" value={filas.length} />
        <Stat label="Con LEE iniciado" value={conPrograma} />
        <Stat label="Workbooks completos" value={filas.reduce((a, f) => a + f.workbooksCompletos, 0)} />
        <Stat label="Capítulos del marco" value={LEE_CAPITULOS.length} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> Programas por cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : filas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay clientes activos.</p>
          ) : (
            <div className="space-y-1">
              {filas.map((f) => {
                const pct = Math.round((f.capitulos_desbloqueados.length / LEE_CAPITULOS.length) * 100);
                return (
                  <Link key={f.cliente_id} to="/app/clientes/$clienteId/lee" params={{ clienteId: f.cliente_id }}
                    className="flex items-center gap-3 p-2.5 rounded hover:bg-muted/50 group">
                    <div className="w-8 h-8 rounded bg-gold/15 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{f.nombre_empresa}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {f.programa_id ? `${f.capitulos_desbloqueados.length}/${LEE_CAPITULOS.length} capítulos · ${f.workbooksCompletos}/${f.workbooks} workbooks` : "Programa no iniciado"}
                      </div>
                    </div>
                    <div className="w-32 hidden md:block">
                      <Progress value={pct} className="h-1.5" />
                    </div>
                    <span className="text-xs font-semibold text-navy w-10 text-right">{pct}%</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-navy transition" />
                  </Link>
                );
              })}
            </div>
          )}
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
