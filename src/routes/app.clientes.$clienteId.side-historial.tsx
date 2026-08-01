import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { interpretarIME } from "@/lib/side-data";
import { History, Search, FileText, ArrowUpDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/clientes/$clienteId/side-historial")({
  component: SideHistorialClientePage,
});

interface SesionRow {
  id: string;
  cliente_id: string;
  consultor_id: string | null;
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

type SortKey = "updated_at" | "created_at" | "ime_score" | "completado" | "nombre_sesion";
type SortDir = "asc" | "desc";

function SideHistorialClientePage() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/side-historial" });
  const { user } = useAuth();
  const [sesiones, setSesiones] = useState<SesionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("side_sesiones")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setSesiones((data ?? []) as unknown as SesionRow[]);
        setLoading(false);
      });
  }, [user, clienteId]);

  const pctCompletado = (s: SesionRow) => {
    const total = 180 + 16 + 12 + 12;
    const respondidas = Object.values(s.scores ?? {}).filter((v) => typeof v === "number" && v > 0).length;
    return Math.round((respondidas / total) * 100);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtradas = useMemo(() => {
    const list = sesiones.filter((s) => {
      if (q) return (s.nombre_sesion ?? "").toLowerCase().includes(q.toLowerCase());
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0;
      switch (sortKey) {
        case "updated_at": av = a.updated_at; bv = b.updated_at; break;
        case "created_at": av = a.created_at; bv = b.created_at; break;
        case "ime_score": av = a.ime_score ?? 0; bv = b.ime_score ?? 0; break;
        case "completado": av = pctCompletado(a); bv = pctCompletado(b); break;
        case "nombre_sesion": av = a.nombre_sesion ?? ""; bv = b.nombre_sesion ?? ""; break;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return list;
  }, [sesiones, q, sortKey, sortDir]);

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-navy">
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-gold" : "opacity-40"}`} />
    </button>
  );

  return (
    <div className="max-w-[1200px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-navy flex items-center gap-2">
            <History className="w-7 h-7 text-gold" /> Historial SIDE
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tus diagnósticos estratégicos registrados.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/app/clientes/$clienteId/side" params={{ clienteId }}>
            Ver resumen SIDE
          </Link>
        </Button>
      </div>

      <div className="a360-card a360-card-lg p-5 mb-5 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre de sesión…"
            className="pl-9"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filtradas.length} sesión{filtradas.length === 1 ? "" : "es"}
        </div>
      </div>

      <div className="a360-card a360-card-lg overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Cargando…</div>
        ) : filtradas.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {q ? "Sin resultados para esa búsqueda." : "No hay sesiones registradas."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream/60 border-b border-border">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3"><SortBtn k="nombre_sesion" label="Sesión" /></th>
                <th className="px-4 py-3"><SortBtn k="created_at" label="Fecha" /></th>
                <th className="px-4 py-3"><SortBtn k="completado" label="% Completado" /></th>
                <th className="px-4 py-3"><SortBtn k="ime_score" label="IME" /></th>
                <th className="px-4 py-3">IVEE / IDF / COF</th>
                <th className="px-4 py-3">Análisis IA</th>
                <th className="px-4 py-3 text-right">Ver</th>
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
                      <div className="font-medium text-navy">
                        {s.nombre_sesion ?? "Sin nombre"}
                      </div>
                      {s.completada && (
                        <span className="text-[10px] uppercase tracking-wider text-green-700 font-semibold">
                          Completada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("es-EC")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: nivel.color, background: nivel.bg }}
                      >
                        {(s.ime_score ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {(s.ivee_score ?? 0).toFixed(1)} / {(s.idf_score ?? 0).toFixed(1)} / {(s.cof_score ?? 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {ias > 0
                        ? <span className="text-gold font-medium">{ias} análisis</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="Ver SIDE">
                        <Link to="/app/clientes/$clienteId/side" params={{ clienteId }}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
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
