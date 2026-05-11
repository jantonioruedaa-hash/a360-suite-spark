import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ETAPAS_A360, HERRAMIENTAS_A360 } from "@/lib/coaching-catalogo";
import { listarSesionesGlobal, type SesionCoaching } from "@/lib/coaching-helpers";
import { supabase } from "@/integrations/supabase/client";

type Cliente = { id: string; nombre_empresa: string };
async function listarClientes(): Promise<Cliente[]> {
  const { data } = await supabase.from("clientes").select("id,nombre_empresa").order("nombre_empresa");
  return (data ?? []) as Cliente[];
}
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users2, Sparkles, BookOpen, TrendingUp, Quote } from "lucide-react";

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
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-navy">Coaching A360</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plataforma de consultoría en coaching ejecutivo · 4 etapas, 12 herramientas, 90 días post-programa
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/app/coaching/metodologia">
              <BookOpen className="w-3 h-3 mr-1" /> Metodología
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/coaching/resultados">
              <TrendingUp className="w-3 h-3 mr-1" /> Resultados
            </Link>
          </Button>
        </div>
      </div>

      {/* Manifiesto */}
      <Card className="bg-gradient-to-br from-navy to-navy/90 text-white border-navy">
        <CardContent className="p-5 flex items-start gap-3">
          <Quote className="w-5 h-5 text-gold shrink-0 mt-1" />
          <div>
            <p className="font-display text-base leading-relaxed">
              "El cambio profundo en un líder no se mide por lo que aprende, sino por lo que decide distinto bajo presión."
            </p>
            <p className="text-xs text-white/60 mt-1">— Principio rector A360 ·{" "}
              <Link to="/app/coaching/metodologia" className="underline hover:text-gold">Ver metodología completa</Link>
            </p>
          </div>
        </CardContent>
      </Card>

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
