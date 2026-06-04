import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clientes/$clienteId/side")({
  component: SideClientePage,
});

interface Sesion {
  id: string;
  nombre_sesion: string | null;
  ime_score: number | null;
  ivee_score: number | null;
  idf_score: number | null;
  cof_score: number | null;
  completada: boolean;
  created_at: string;
  updated_at: string;
}

function nivelIME(ime: number | null) {
  const v = ime ?? 0;
  if (v >= 4.5) return { label: "Excelente", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (v >= 3.5) return { label: "Bueno", color: "bg-blue-100 text-blue-700 border-blue-200" };
  if (v >= 2.5) return { label: "Regular", color: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: "Crítico", color: "bg-red-100 text-red-700 border-red-200" };
}

function SideClientePage() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/side" });
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("side_sesiones")
      .select("id,nombre_sesion,ime_score,ivee_score,idf_score,cof_score,completada,created_at,updated_at")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    setSesiones((data ?? []) as Sesion[]);
    setLoading(false);
  };
  useEffect(() => { cargar(); }, [clienteId]);

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este diagnóstico?")) return;
    const { error } = await supabase.from("side_sesiones").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Diagnóstico eliminado");
    cargar();
  };

  const ultimas = sesiones.slice(0, 6);
  const completadas = sesiones.filter((s) => s.completada);
  const ultimaCompletada = completadas[0];
  const previaCompletada = completadas[1];
  const delta = ultimaCompletada && previaCompletada && ultimaCompletada.ime_score != null && previaCompletada.ime_score != null
    ? +(ultimaCompletada.ime_score - previaCompletada.ime_score).toFixed(2)
    : null;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl text-navy">Diagnósticos SIDE</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Historial completo, evolución del IME y exportables del cliente.
          </p>
        </div>
        <Button asChild className="bg-navy hover:bg-navy/90">
          <Link to="/app/side" search={{ sesion: undefined }}><Plus className="w-4 h-4 mr-1" /> Nuevo SIDE</Link>
        </Button>
      </div>

      {/* KPIs cabecera */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Diagnósticos</div>
          <div className="font-display text-2xl text-navy">{sesiones.length}</div>
          <div className="text-xs text-muted-foreground">{completadas.length} completados</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">IME actual</div>
          <div className="font-display text-2xl text-navy">{ultimaCompletada?.ime_score?.toFixed(2) ?? "—"}</div>
          {ultimaCompletada && (
            <Badge variant="outline" className={nivelIME(ultimaCompletada.ime_score).color}>
              {nivelIME(ultimaCompletada.ime_score).label}
            </Badge>
          )}
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Δ vs anterior</div>
          <div className={`font-display text-2xl ${delta == null ? "text-muted-foreground" : delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
          </div>
          <div className="text-xs text-muted-foreground">Movimiento del IME</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Subíndices (último)</div>
          <div className="text-xs space-y-0.5 mt-1">
            <div>IVEE: <b>{ultimaCompletada?.ivee_score?.toFixed(2) ?? "—"}</b></div>
            <div>IDF: <b>{ultimaCompletada?.idf_score?.toFixed(2) ?? "—"}</b></div>
            <div>COF: <b>{ultimaCompletada?.cof_score?.toFixed(2) ?? "—"}</b></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Listado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Historial completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : sesiones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">Este cliente aún no tiene diagnósticos SIDE.</p>
              <Button asChild className="bg-navy hover:bg-navy/90">
                <Link to="/app/side" search={{ sesion: undefined }}>Iniciar primer diagnóstico <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase tracking-wider">
                  <tr className="border-b">
                    <th className="text-left py-2">Sesión</th>
                    <th className="text-center py-2">IME</th>
                    <th className="text-center py-2">IVEE</th>
                    <th className="text-center py-2">IDF</th>
                    <th className="text-center py-2">COF</th>
                    <th className="text-center py-2">Estado</th>
                    <th className="text-right py-2">Fecha</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sesiones.map((s) => {
                    const n = nivelIME(s.ime_score);
                    return (
                      <tr key={s.id} className="border-b hover:bg-muted/30">
                        <td className="py-2">
                          <Link to="/app/side" search={{ sesion: undefined }} className="text-blue-600 hover:underline">
                            {s.nombre_sesion ?? "Diagnóstico SIDE"}
                          </Link>
                        </td>
                        <td className="text-center font-semibold">
                          <Badge variant="outline" className={n.color}>{(s.ime_score ?? 0).toFixed(2)}</Badge>
                        </td>
                        <td className="text-center">{s.ivee_score?.toFixed(2) ?? "—"}</td>
                        <td className="text-center">{s.idf_score?.toFixed(2) ?? "—"}</td>
                        <td className="text-center">{s.cof_score?.toFixed(2) ?? "—"}</td>
                        <td className="text-center">
                          {s.completada
                            ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">Completado</Badge>
                            : <Badge variant="outline">En curso</Badge>}
                        </td>
                        <td className="text-right text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => eliminar(s.id)} className="text-red-600 h-7 px-2">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evolución mini-line */}
      {ultimas.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolución IME (últimos {ultimas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-24">
              {[...ultimas].reverse().map((s) => {
                const v = s.ime_score ?? 0;
                const h = Math.max(6, Math.round((v / 5) * 96));
                const n = nivelIME(s.ime_score);
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t" style={{ height: h, background: "hsl(var(--primary))", opacity: 0.85 }} title={`${v.toFixed(2)}`} />
                    <div className="text-[9px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                    <div className="text-[10px] font-semibold">{v.toFixed(1)}</div>
                    <Badge variant="outline" className={`${n.color} text-[9px] px-1`}>{n.label}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
