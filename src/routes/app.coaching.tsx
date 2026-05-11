import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ETAPAS_A360, HERRAMIENTAS_A360 } from "@/lib/coaching-catalogo";
import { listarSesionesGlobal, type SesionCoaching } from "@/lib/coaching-helpers";
import { listarClientes, type Cliente } from "@/lib/clientes-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/coaching")({
  component: CoachingHome,
});

function CoachingHome() {
  const [sesiones, setSesiones] = useState<SesionCoaching[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listarSesionesGlobal(), listarClientes()])
      .then(([s, c]) => {
        setSesiones(s);
        setClientes(c);
      })
      .finally(() => setLoading(false));
  }, []);

  // Agrupa sesiones por cliente para mostrar quién tiene coaching activo
  const porCliente = new Map<string, SesionCoaching[]>();
  sesiones.forEach((s) => {
    const arr = porCliente.get(s.cliente_id) ?? [];
    arr.push(s);
    porCliente.set(s.cliente_id, arr);
  });

  const clientesConCoaching = clientes
    .filter((c) => porCliente.has(c.id))
    .map((c) => ({ cliente: c, sesiones: porCliente.get(c.id)! }));

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-navy">Coaching Platform</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Metodología A360 — 4 etapas, 12 herramientas
        </p>
      </div>

      {/* Mapa metodológico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Etapas de la transformación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {ETAPAS_A360.map((et) => {
              const herrs = HERRAMIENTAS_A360.filter((h) => h.etapa === et.id);
              return (
                <div
                  key={et.id}
                  className="rounded-lg border-l-4 p-3 bg-muted/30"
                  style={{ borderLeftColor: et.color }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm" style={{ color: et.color }}>
                      {et.id}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      {herrs.length} herram.
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{et.descripcion}</p>
                  <ul className="mt-2 space-y-0.5">
                    {herrs.map((h) => (
                      <li key={h.id} className="text-[11px] text-foreground/80">
                        • {h.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Clientes en coaching */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users2 className="w-4 h-4" /> Clientes en coaching activo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : clientesConCoaching.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Aún no has iniciado coaching con ningún cliente.
              </p>
              <Button asChild className="mt-3 bg-navy hover:bg-navy/90" size="sm">
                <Link to="/app/clientes">Ir a Mis clientes</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {clientesConCoaching.map(({ cliente, sesiones }) => {
                const completadas = sesiones.filter((s) => s.completada).length;
                return (
                  <Link
                    key={cliente.id}
                    to="/app/clientes/$clienteId/coaching"
                    params={{ clienteId: cliente.id }}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">{cliente.nombre_empresa}</div>
                      <div className="text-xs text-muted-foreground">
                        {sesiones.length} sesión{sesiones.length !== 1 ? "es" : ""} ·{" "}
                        {completadas} completada{completadas !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
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
