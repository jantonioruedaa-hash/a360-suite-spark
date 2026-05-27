import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, ArrowRight, TrendingUp, AlertTriangle, CheckCircle2, Activity, RefreshCw, Minus } from "lucide-react";
import { computeCumplimiento, syncKpisCliente, syncKpisVariosClientes } from "@/lib/kpis-sync";

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

function moduloFromCategoria(cat: string): string {
  if (cat.startsWith("Plan — ")) return "Plan Estratégico";
  if (cat.startsWith("SIDE — ")) return "SIDE";
  return "Coaching/Manual";
}

function KpisPanel() {
  const [kpis, setKpis] = useState<KPIRow[]>([]);
  const [clientes, setClientes] = useState<Record<string, string>>({});
  const [filtroCliente, setFiltroCliente] = useState<string>("__all");
  const [filtroCat, setFiltroCat] = useState<string>("__all");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    const [{ data: ks }, { data: cs }] = await Promise.all([
      supabase.from("cliente_kpis").select("*").order("fecha_medicion", { ascending: false }),
      supabase.from("clientes").select("id,nombre_empresa").eq("activo", true),
    ]);
    setKpis((ks ?? []) as KPIRow[]);
    const map: Record<string, string> = {};
    (cs ?? []).forEach((c: ClienteRow) => { map[c.id] = c.nombre_empresa; });
    setClientes(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const categorias = useMemo(
    () => Array.from(new Set(kpis.map((k) => k.categoria))).sort(),
    [kpis],
  );

  const filtrados = useMemo(() => kpis.filter((k) => {
    if (filtroCliente !== "__all" && k.cliente_id !== filtroCliente) return false;
    if (filtroCat !== "__all" && k.categoria !== filtroCat) return false;
    return true;
  }), [kpis, filtroCliente, filtroCat]);

  // Recalcula semáforo/pct on the fly según meta vs actual (no toca DB hasta que el usuario edite)
  const filtradosCalc = useMemo(() => filtrados.map((k) => {
    const c = computeCumplimiento(k.valor_meta, k.valor_actual);
    return { ...k, _pct: c.pct, _gap: c.gap, _sem: c.semaforo };
  }), [filtrados]);

  const stats = useMemo(() => {
    let verde = 0, amarillo = 0, rojo = 0, sinMedir = 0, sumPct = 0, conPct = 0;
    for (const k of filtradosCalc) {
      if (k.valor_actual == null) { sinMedir++; continue; }
      if (k._sem === "verde") verde++;
      else if (k._sem === "amarillo") amarillo++;
      else rojo++;
      if (k._pct != null) { sumPct += Math.min(k._pct, 150); conPct++; }
    }
    return { verde, amarillo, rojo, sinMedir, promedioCumpl: conPct ? Math.round(sumPct / conPct) : 0 };
  }, [filtradosCalc]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const ids = filtroCliente !== "__all" ? [filtroCliente] : Object.keys(clientes);
      if (ids.length === 0) { toast.error("No hay clientes para sincronizar"); return; }
      const total = filtroCliente !== "__all"
        ? await syncKpisCliente(filtroCliente)
        : await syncKpisVariosClientes(ids);
      toast.success(`Sincronización completa · ${total} indicadores actualizados`);
      await load();
    } catch (e) {
      toast.error("Error al sincronizar: " + (e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateActual = async (id: string, raw: string) => {
    const v = raw.trim() === "" ? null : Number(raw.replace(",", "."));
    if (v != null && !Number.isFinite(v)) { toast.error("Valor inválido"); return; }
    const row = kpis.find((k) => k.id === id);
    if (!row) return;
    const { semaforo } = computeCumplimiento(row.valor_meta, v);
    const { error } = await supabase
      .from("cliente_kpis")
      .update({ valor_actual: v, semaforo, fecha_medicion: new Date().toISOString().slice(0, 10) })
      .eq("id", id);
    if (error) { toast.error("No se pudo guardar"); return; }
    setKpis((prev) => prev.map((k) => k.id === id ? { ...k, valor_actual: v, semaforo, fecha_medicion: new Date().toISOString().slice(0, 10) } : k));
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-navy">Seguimiento de KPIs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Indicadores agregados de Plan Estratégico, SIDE y KPIs manuales. Edita el valor real para calcular cumplimiento, GAP y semáforo.
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm" className="border-navy/30">
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando…" : "Re-sincronizar desde Plan/SIDE"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total indicadores" value={filtradosCalc.length} icon={LineChart} />
        <Stat label="🟢 En meta (≥90%)" value={stats.verde} icon={CheckCircle2} tone="emerald" />
        <Stat label="🟡 En riesgo (70-89%)" value={stats.amarillo} icon={AlertTriangle} tone="amber" />
        <Stat label="🔴 Crítico (<70%)" value={stats.rojo} icon={AlertTriangle} tone="red" />
        <Stat label="Avance promedio" value={`${stats.promedioCumpl}%`} icon={TrendingUp} />
      </div>

      {stats.sinMedir > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 border rounded px-3 py-2">
          <Minus className="w-3 h-3 inline mr-1" />
          {stats.sinMedir} indicador(es) sin valor real registrado — no entran al conteo del semáforo.
        </div>
      )}

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" /> Indicadores
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <select value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}
              className="text-xs border rounded px-2 py-1 bg-white">
              <option value="__all">Todos los clientes</option>
              {Object.entries(clientes).map(([id, n]) => <option key={id} value={id}>{n}</option>)}
            </select>
            <select value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)}
              className="text-xs border rounded px-2 py-1 bg-white">
              <option value="__all">Todos los módulos</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : filtradosCalc.length === 0 ? (
            <div className="text-center py-8">
              <LineChart className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Aún no hay indicadores. Pulsa <strong>Re-sincronizar desde Plan/SIDE</strong> para importarlos automáticamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3">Indicador</th>
                    <th className="py-2 pr-3">Módulo</th>
                    <th className="py-2 pr-3 text-right">Meta</th>
                    <th className="py-2 pr-3 text-right">Valor real</th>
                    <th className="py-2 pr-3 text-right">GAP</th>
                    <th className="py-2 pr-3 text-right">% Cumpl.</th>
                    <th className="py-2 pr-3 text-center">Semáforo</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtradosCalc.slice(0, 300).map((k) => (
                    <tr key={k.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 pr-3 text-navy font-medium">{clientes[k.cliente_id] ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <div>{k.nombre}</div>
                        {k.observacion && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[260px]" title={k.observacion}>
                            {k.observacion}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className="text-[10px]">{moduloFromCategoria(k.categoria)}</Badge>
                      </td>
                      <td className="py-2 pr-3 text-right font-mono">
                        {k.valor_meta ?? "—"}{k.unidad ? ` ${k.unidad}` : ""}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <Input
                          type="number"
                          defaultValue={k.valor_actual ?? ""}
                          step="any"
                          className="h-7 w-24 text-right font-mono text-xs ml-auto"
                          onBlur={(e) => {
                            const v = e.target.value;
                            const current = k.valor_actual == null ? "" : String(k.valor_actual);
                            if (v !== current) handleUpdateActual(k.id, v);
                          }}
                        />
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-muted-foreground">
                        {k._gap == null ? "—" : `${k._gap > 0 ? "+" : ""}${k._gap.toFixed(2)}`}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono">
                        {k._pct == null ? "—" : `${Math.round(k._pct)}%`}
                      </td>
                      <td className="py-2 pr-3 text-center">
                        <SemaforoBadge value={k.valor_actual == null ? "sin" : k._sem} />
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

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof LineChart; tone?: "emerald" | "amber" | "red" }) {
  const color = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : tone === "red" ? "text-red-600" : "text-navy";
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
    verde: { label: "🟢 En meta", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    amarillo: { label: "🟡 Riesgo", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    rojo: { label: "🔴 Crítico", cls: "bg-red-100 text-red-700 border-red-200" },
    sin: { label: "— Sin medir", cls: "bg-muted text-muted-foreground border" },
  };
  const c = cfg[value] ?? cfg.sin;
  return <Badge variant="outline" className={c.cls + " text-[10px] whitespace-nowrap"}>{c.label}</Badge>;
}
