import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { interpretarIME } from "@/lib/side-data";
import { toast } from "sonner";
import { History, Trash2, ExternalLink, Search, FileText } from "lucide-react";

export const Route = createFileRoute("/app/side_/historial")({ component: HistorialPage });

interface SesionRow {
  id: string;
  cliente_id: string;
  nombre_sesion: string | null;
  ime_score: number | null;
  ivee_score: number | null;
  idf_score: number | null;
  cof_score: number | null;
  completada: boolean;
  scores: Record<string, number> | null;
  analisis_ia: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface Cliente { id: string; nombre_empresa: string }

function HistorialPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sesiones, setSesiones] = useState<SesionRow[]>([]);
  const [clientes, setClientes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filtroCliente, setFiltroCliente] = useState<string>("__all");
  const [q, setQ] = useState("");

  const cargar = async () => {
    setLoading(true);
    const [{ data: ses }, { data: cli }] = await Promise.all([
      supabase.from("side_sesiones").select("id,cliente_id,nombre_sesion,ime_score,ivee_score,idf_score,cof_score,completada,scores,analisis_ia,created_at,updated_at").order("updated_at", { ascending: false }),
      supabase.from("clientes").select("id,nombre_empresa"),
    ]);
    setSesiones((ses ?? []) as unknown as SesionRow[]);
    const map: Record<string, string> = {};
    (cli ?? []).forEach((c: Cliente) => { map[c.id] = c.nombre_empresa; });
    setClientes(map);
    setLoading(false);
  };

  useEffect(() => { if (user) cargar(); }, [user]);

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta sesión? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("side_sesiones").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Sesión eliminada");
    setSesiones((prev) => prev.filter((s) => s.id !== id));
  };

  const abrir = (id: string) => navigate({ to: "/app/side", search: { sesion: id } });

  const clientesUnicos = useMemo(() => {
    const ids = Array.from(new Set(sesiones.map((s) => s.cliente_id)));
    return ids.map((id) => ({ id, nombre: clientes[id] ?? "—" }));
  }, [sesiones, clientes]);

  const filtradas = useMemo(() => {
    return sesiones.filter((s) => {
      if (filtroCliente !== "__all" && s.cliente_id !== filtroCliente) return false;
      if (q) {
        const text = `${s.nombre_sesion ?? ""} ${clientes[s.cliente_id] ?? ""}`.toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [sesiones, filtroCliente, q, clientes]);

  const pctCompletado = (s: SesionRow) => {
    const total = 180 + 16 + 12 + 12; // dimensiones + IVEE + IDF + COF
    const respondidas = Object.values(s.scores ?? {}).filter((v) => typeof v === "number" && v > 0).length;
    return Math.round((respondidas / total) * 100);
  };

  return (
    <div className="max-w-[1500px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-navy flex items-center gap-2"><History className="w-7 h-7 text-gold" />Historial SIDE</h1>
          <p className="text-sm text-muted-foreground mt-1">Sesiones diagnósticas guardadas. Abre cualquiera para revisar respuestas, índices y análisis IA.</p>
        </div>
        <Link to="/app/side"><Button variant="outline">Nueva sesión</Button></Link>
      </div>

      <div className="a360-card a360-card-lg p-5 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre de sesión o cliente…" className="pl-9" />
        </div>
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos los clientes</SelectItem>
            {clientesUnicos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">{filtradas.length} sesión{filtradas.length === 1 ? "" : "es"}</div>
      </div>

      <div className="a360-card a360-card-lg overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Cargando…</div>
        ) : filtradas.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No hay sesiones guardadas.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream/60 border-b border-border">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Sesión</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">% Completado</th>
                <th className="px-4 py-3">IME</th>
                <th className="px-4 py-3">IVEE / IDF / COF</th>
                <th className="px-4 py-3">Análisis IA</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((s) => {
                const nivel = interpretarIME(s.ime_score ?? 0);
                const pct = pctCompletado(s);
                const ias = Object.keys(s.analisis_ia ?? {}).length;
                return (
                  <tr key={s.id} className="border-b border-border/60 hover:bg-cream/30">
                    <td className="px-4 py-3">
                      <button onClick={() => abrir(s.id)} className="font-medium text-navy hover:text-gold text-left">
                        {s.nombre_sesion ?? "Sin nombre"}
                      </button>
                      {s.completada && <span className="ml-2 text-[10px] uppercase tracking-wider text-green-700 font-semibold">Completada</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{clientes[s.cliente_id] ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("es-EC")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: nivel.color, background: nivel.bg }}>
                        {(s.ime_score ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {(s.ivee_score ?? 0).toFixed(1)} / {(s.idf_score ?? 0).toFixed(1)} / {(s.cof_score ?? 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-xs">{ias > 0 ? <span className="text-gold font-medium">{ias} análisis</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => abrir(s.id)} title="Abrir"><ExternalLink className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => eliminar(s.id)} title="Eliminar" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
