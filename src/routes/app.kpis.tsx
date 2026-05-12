import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, ArrowRight, TrendingUp, AlertTriangle, CheckCircle2, Activity } from "lucide-react";

export const Route = createFileRoute("/app/kpis")({ component: KpisPanel });

interface KPIRow {
  id: string;
  cliente_id: string;
  nombre: string;
  categoria: string;
  unidad: string | null;
  valor_actual: number | null;
  valor_meta: number | null;
  semaforo: string;
  fecha_medicion: string;
  observacion: string | null;
}

interface ClienteRow { id: string; nombre_empresa: string }

function KpisPanel() {
  const [kpis, setKpis] = useState<KPIRow[]>([]);
  const [clientes, setClientes] = useState<Record<string, string>>({});
  const [filtroCliente, setFiltroCliente] = useState<string>("__all");
  const [filtroCat, setFiltroCat] = useState<string>("__all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ks }, { data: cs }] = await Promise.all([
        supabase.from("cliente_kpis").select("*").order("fecha_medicion", { ascending: false }),
        supabase.from("clientes").select("id,nombre_empresa").eq("activo", true),
      ]);
      setKpis((ks ?? []) as KPIRow[]);
      const map: Record<string, string> = {};
      (cs ?? []).forEach((c: ClienteRow) => { map[c.id] = c.nombre_empresa; });
      setClientes(map);
      setLoading(false);
    })();
  }, []);

  const categorias = useMemo(
    () => Array.from(new Set(kpis.map((k) => k.categoria))).sort(),
    [kpis],
  );

  const filtrados = useMemo(() => kpis.filter((k) => {
    if (filtroCliente !== "__all" && k.cliente_id !== filtroCliente) return false;
    if (filtroCat !== "__all" && k.categoria !== filtroCat) return false;
    return true;
  }), [kpis, filtroCliente, filtroCat]);

  const stats = useMemo(() => {
    const verde = filtrados.filter((k) => k.semaforo === "verde").length;
    const amarillo = filtrados.filter((k) => k.semaforo === "amarillo").length;
    const rojo = filtrados.filter((k) => k.semaforo === "rojo").length;
    const conMeta = filtrados.filter((k) => k.valor_meta != null && k.valor_actual != null);
    const promedioCumpl = conMeta.length
      ? Math.round(conMeta.reduce((a, k) => {
        const pct = k.valor_meta ? (k.valor_actual! / k.valor_meta) * 100 : 0;
        return a + Math.min(pct, 150);
      }, 0) / conMeta.length)
      : 0;
    return { verde, amarillo, rojo, promedioCumpl };
  }, [filtrados]);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-navy">Seguimiento de KPIs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Indicadores definidos por cliente desde su Plan Estratégico y sesiones de coaching. Captura el avance real vs. la meta.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="KPIs medidos" value={filtrados.length} icon={LineChart} />
        <Stat label="En verde" value={stats.verde} icon={CheckCircle2} tone="emerald" />
        <Stat label="En amarillo / rojo" value={stats.amarillo + stats.rojo} icon={AlertTriangle} tone="amber" />
        <Stat label="Avance promedio" value={`${stats.promedioCumpl}%`} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" /> Mediciones recientes
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <select value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}
              className="text-xs border rounded px-2 py-1 bg-white">
              <option value="__all">Todos los clientes</option>
              {Object.entries(clientes).map(([id, n]) => <option key={id} value={id}>{n}</option>)}
            </select>
            <select value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)}
              className="text-xs border rounded px-2 py-1 bg-white">
              <option value="__all">Todas las categorías</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-8">
              <LineChart className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Aún no hay KPIs registrados. Defínelos desde el Plan Estratégico de cada cliente.
              </p>
              <Button asChild size="sm" className="mt-3 bg-navy hover:bg-navy/90">
                <Link to="/app/plan">Ir a planes</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3">KPI</th>
                    <th className="py-2 pr-3">Categoría</th>
                    <th className="py-2 pr-3 text-right">Actual</th>
                    <th className="py-2 pr-3 text-right">Meta</th>
                    <th className="py-2 pr-3 text-center">Semáforo</th>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.slice(0, 100).map((k) => (
                    <tr key={k.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 pr-3 text-navy font-medium">{clientes[k.cliente_id] ?? "—"}</td>
                      <td className="py-2 pr-3">{k.nombre}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{k.categoria}</td>
                      <td className="py-2 pr-3 text-right font-mono">
                        {k.valor_actual ?? "—"}{k.unidad ? ` ${k.unidad}` : ""}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-muted-foreground">
                        {k.valor_meta ?? "—"}{k.unidad ? ` ${k.unidad}` : ""}
                      </td>
                      <td className="py-2 pr-3 text-center">
                        <SemaforoBadge value={k.semaforo} />
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {new Date(k.fecha_medicion).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-right">
                        <Link to="/app/clientes/$clienteId/plan" params={{ clienteId: k.cliente_id }}
                          className="text-gold text-xs hover:underline inline-flex items-center gap-1">
                          Plan <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof LineChart; tone?: "emerald" | "amber" }) {
  const color = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-navy";
  return (
    <Card><CardContent className="p-4 flex items-start justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`font-display text-2xl mt-1 ${color}`}>{value}</div>
      </div>
      <Icon className={`w-5 h-5 ${color} opacity-60`} />
    </CardContent></Card>
  );
}

function SemaforoBadge({ value }: { value: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    verde: { label: "Verde", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    amarillo: { label: "Amarillo", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    rojo: { label: "Rojo", cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const c = cfg[value] ?? cfg.verde;
  return <Badge variant="outline" className={c.cls + " text-[10px]"}>{c.label}</Badge>;
}
