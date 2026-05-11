import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listarSesionesGlobal, type SesionCoaching, progresoPorEtapa } from "@/lib/coaching-helpers";
import { RADAR_DIMENSIONES, ETAPAS_A360 } from "@/lib/coaching-catalogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ArrowRight, Activity } from "lucide-react";

export const Route = createFileRoute("/app/coaching/resultados")({
  component: ResultadosPage,
});

type Cliente = { id: string; nombre_empresa: string };

function ResultadosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sesiones, setSesiones] = useState<SesionCoaching[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("clientes").select("id,nombre_empresa").then((r) => (r.data ?? []) as Cliente[]),
      listarSesionesGlobal(),
    ])
      .then(([c, s]) => { setClientes(c); setSesiones(s); })
      .finally(() => setLoading(false));
  }, []);

  const porCliente = new Map<string, SesionCoaching[]>();
  sesiones.forEach((s) => {
    const arr = porCliente.get(s.cliente_id) ?? [];
    arr.push(s);
    porCliente.set(s.cliente_id, arr);
  });

  const filas = clientes
    .filter((c) => porCliente.has(c.id))
    .map((c) => {
      const ses = porCliente.get(c.id)!;
      const radarInicial = ses.filter((s) => s.herramienta_id === "radar-lider" && s.completada)
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))[0];
      const radarCierre = ses.filter((s) => s.herramienta_id === "radar-cierre" && s.completada)
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0];
      const prog = progresoPorEtapa(ses);
      return { cliente: c, sesiones: ses, radarInicial, radarCierre, prog };
    });

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-navy">Resultados de transformación</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Delta Radar inicial vs cierre, progreso por etapa, evidencia agregada por cliente.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : filas.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aún no hay clientes con sesiones de coaching registradas.
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {filas.map(({ cliente, sesiones, radarInicial, radarCierre, prog }) => (
            <Card key={cliente.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{cliente.nombre_empresa}</span>
                  <Link
                    to="/app/clientes/$clienteId/coaching"
                    params={{ clienteId: cliente.id }}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Abrir workspace <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Progreso por etapa */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {prog.map((p) => (
                    <div key={p.etapa.id} className="text-xs">
                      <div className="flex justify-between mb-0.5">
                        <span style={{ color: p.etapa.color }} className="font-medium">{p.etapa.id}</span>
                        <span className="text-muted-foreground">{p.completadas}/{p.total}</span>
                      </div>
                      <Progress value={p.pct} className="h-1.5" />
                    </div>
                  ))}
                </div>

                {/* Delta radar */}
                <div>
                  <div className="text-xs font-semibold text-navy uppercase tracking-wider mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Delta de transformación (Radar)
                  </div>
                  {!radarInicial ? (
                    <p className="text-xs text-muted-foreground italic">
                      Sin Radar inicial. Aplica la herramienta "Radar del líder" en Diagnóstico.
                    </p>
                  ) : (
                    <DeltaRadar inicial={radarInicial.datos?.respuestas ?? {}} cierre={radarCierre?.datos?.respuestas ?? null} />
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                  <Activity className="w-3 h-3" />
                  Total registros: {sesiones.length} · Última actividad: {new Date(sesiones[0].created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DeltaRadar({ inicial, cierre }: { inicial: Record<string, number>; cierre: Record<string, number> | null }) {
  return (
    <div className="space-y-1">
      {RADAR_DIMENSIONES.map((d) => {
        const ini = Number(inicial[d.id]) || 0;
        const cie = cierre ? Number(cierre[d.id]) || 0 : null;
        const delta = cie !== null ? cie - ini : null;
        return (
          <div key={d.id} className="grid grid-cols-12 gap-2 items-center text-xs">
            <div className="col-span-4 font-medium">{d.nombre}</div>
            <div className="col-span-2 text-center">
              <span className="text-muted-foreground">Inicio:</span> <b>{ini}</b>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-muted-foreground">Cierre:</span> <b>{cie ?? "—"}</b>
            </div>
            <div className="col-span-4">
              {delta !== null && (
                <Badge variant="outline" className={
                  delta > 0 ? "border-emerald-300 text-emerald-700" :
                  delta < 0 ? "border-amber-300 text-amber-700" :
                  "border-muted text-muted-foreground"
                }>
                  Δ {delta > 0 ? "+" : ""}{delta}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
      {!cierre && (
        <p className="text-[11px] text-muted-foreground italic mt-2">
          Aplica "Radar de cierre" al final del programa para ver el delta completo.
        </p>
      )}
    </div>
  );
}
