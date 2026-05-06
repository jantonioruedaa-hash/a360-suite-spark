import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { interpretarIME } from "@/lib/side-data";
import { toast } from "sonner";
import { History, Trash2, ExternalLink, Search, FileText, Pencil, Copy, CheckCircle2, RotateCcw, Download, ArrowUpDown, Check, X } from "lucide-react";

export const Route = createFileRoute("/app/side_/historial")({ component: HistorialPage });

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
  ivee_scores: Record<string, number> | null;
  idf_scores: Record<string, number> | null;
  cof_scores: Record<string, number> | null;
  datos_financieros: Record<string, unknown> | null;
  analisis_ia: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface Cliente { id: string; nombre_empresa: string }

type SortKey = "updated_at" | "created_at" | "ime_score" | "completado" | "cliente" | "nombre_sesion";
type SortDir = "asc" | "desc";

function HistorialPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sesiones, setSesiones] = useState<SesionRow[]>([]);
  const [clientes, setClientes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filtroCliente, setFiltroCliente] = useState<string>("__all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; open: boolean }>({ ids: [], open: false });

  const cargar = async () => {
    setLoading(true);
    const [{ data: ses }, { data: cli }] = await Promise.all([
      supabase.from("side_sesiones").select("*").order("updated_at", { ascending: false }),
      supabase.from("clientes").select("id,nombre_empresa"),
    ]);
    setSesiones((ses ?? []) as unknown as SesionRow[]);
    const map: Record<string, string> = {};
    (cli ?? []).forEach((c: Cliente) => { map[c.id] = c.nombre_empresa; });
    setClientes(map);
    setLoading(false);
  };

  useEffect(() => { if (user) cargar(); }, [user]);

  const pctCompletado = (s: SesionRow) => {
    const total = 180 + 16 + 12 + 12;
    const respondidas = Object.values(s.scores ?? {}).filter((v) => typeof v === "number" && v > 0).length;
    return Math.round((respondidas / total) * 100);
  };

  const askDelete = (ids: string[]) => setConfirmDelete({ ids, open: true });

  const doDelete = async () => {
    const ids = confirmDelete.ids;
    setConfirmDelete({ ids: [], open: false });
    if (!ids.length) return;
    const { error } = await supabase.from("side_sesiones").delete().in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} sesión${ids.length === 1 ? "" : "es"} eliminada${ids.length === 1 ? "" : "s"}`);
    setSesiones((prev) => prev.filter((s) => !ids.includes(s.id)));
    setSelected(new Set());
  };

  const abrir = (id: string) => navigate({ to: "/app/side", search: { sesion: id } });

  const startRename = (s: SesionRow) => { setEditingId(s.id); setEditingName(s.nombre_sesion ?? ""); };
  const saveRename = async () => {
    if (!editingId) return;
    const { error } = await supabase.from("side_sesiones").update({ nombre_sesion: editingName || null }).eq("id", editingId);
    if (error) { toast.error(error.message); return; }
    setSesiones((prev) => prev.map((s) => s.id === editingId ? { ...s, nombre_sesion: editingName || null } : s));
    toast.success("Nombre actualizado");
    setEditingId(null);
  };

  const duplicar = async (s: SesionRow) => {
    const insert = {
      cliente_id: s.cliente_id,
      consultor_id: s.consultor_id ?? user?.id ?? null,
      nombre_sesion: `${s.nombre_sesion ?? "Sin nombre"} (copia)`,
      scores: s.scores ?? {},
      ivee_scores: s.ivee_scores ?? {},
      idf_scores: s.idf_scores ?? {},
      cof_scores: s.cof_scores ?? {},
      datos_financieros: s.datos_financieros ?? null,
      analisis_ia: s.analisis_ia ?? {},
      ime_score: s.ime_score,
      ivee_score: s.ivee_score,
      idf_score: s.idf_score,
      cof_score: s.cof_score,
      completada: false,
    };
    const { data, error } = await supabase.from("side_sesiones").insert(insert).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success("Sesión duplicada");
    setSesiones((prev) => [data as unknown as SesionRow, ...prev]);
  };

  const toggleCompletada = async (s: SesionRow) => {
    const nuevo = !s.completada;
    const { error } = await supabase.from("side_sesiones").update({ completada: nuevo }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    setSesiones((prev) => prev.map((x) => x.id === s.id ? { ...x, completada: nuevo } : x));
    toast.success(nuevo ? "Marcada como completada" : "Sesión reabierta");
  };

  const exportar = (s: SesionRow) => {
    const payload = { ...s, cliente_nombre: clientes[s.cliente_id] ?? null, exportado_en: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `side-${(s.nombre_sesion ?? "sesion").replace(/[^a-z0-9]+/gi, "_")}-${s.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSel = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const clientesUnicos = useMemo(() => {
    const ids = Array.from(new Set(sesiones.map((s) => s.cliente_id)));
    return ids.map((id) => ({ id, nombre: clientes[id] ?? "—" }));
  }, [sesiones, clientes]);

  const filtradas = useMemo(() => {
    const list = sesiones.filter((s) => {
      if (filtroCliente !== "__all" && s.cliente_id !== filtroCliente) return false;
      if (q) {
        const text = `${s.nombre_sesion ?? ""} ${clientes[s.cliente_id] ?? ""}`.toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }
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
        case "cliente": av = clientes[a.cliente_id] ?? ""; bv = clientes[b.cliente_id] ?? ""; break;
        case "nombre_sesion": av = a.nombre_sesion ?? ""; bv = b.nombre_sesion ?? ""; break;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return list;
  }, [sesiones, filtroCliente, q, clientes, sortKey, sortDir]);

  const allVisibleSelected = filtradas.length > 0 && filtradas.every((s) => selected.has(s.id));
  const toggleAll = () => {
    if (allVisibleSelected) setSelected(new Set());
    else setSelected(new Set(filtradas.map((s) => s.id)));
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-navy">
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-gold" : "opacity-40"}`} />
    </button>
  );

  return (
    <div className="max-w-[1500px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-navy flex items-center gap-2"><History className="w-7 h-7 text-gold" />Historial SIDE</h1>
          <p className="text-sm text-muted-foreground mt-1">Administra tus sesiones diagnósticas: renombrar, duplicar, exportar, completar/reabrir y eliminar.</p>
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
        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selected.size} seleccionada{selected.size === 1 ? "" : "s"}</span>
            <Button size="sm" variant="destructive" onClick={() => askDelete(Array.from(selected))}>
              <Trash2 className="w-4 h-4 mr-1" />Eliminar selección
            </Button>
          </div>
        )}
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
                <th className="px-3 py-3 w-8"><Checkbox checked={allVisibleSelected} onCheckedChange={toggleAll} /></th>
                <th className="px-4 py-3"><SortBtn k="nombre_sesion" label="Sesión" /></th>
                <th className="px-4 py-3"><SortBtn k="cliente" label="Cliente" /></th>
                <th className="px-4 py-3"><SortBtn k="created_at" label="Fecha" /></th>
                <th className="px-4 py-3"><SortBtn k="completado" label="% Completado" /></th>
                <th className="px-4 py-3"><SortBtn k="ime_score" label="IME" /></th>
                <th className="px-4 py-3">IVEE / IDF / COF</th>
                <th className="px-4 py-3">Análisis IA</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((s) => {
                const nivel = interpretarIME(s.ime_score ?? 0);
                const pct = pctCompletado(s);
                const ias = Object.keys(s.analisis_ia ?? {}).length;
                const isEditing = editingId === s.id;
                return (
                  <tr key={s.id} className="border-b border-border/60 hover:bg-cream/30">
                    <td className="px-3 py-3"><Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleSel(s.id)} /></td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus className="h-7 text-sm" onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setEditingId(null); }} />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveRename}><Check className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => abrir(s.id)} className="font-medium text-navy hover:text-gold text-left">
                            {s.nombre_sesion ?? "Sin nombre"}
                          </button>
                          {s.completada && <span className="text-[10px] uppercase tracking-wider text-green-700 font-semibold">Completada</span>}
                        </div>
                      )}
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
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => abrir(s.id)} title="Abrir"><ExternalLink className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startRename(s)} title="Renombrar"><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => duplicar(s)} title="Duplicar"><Copy className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleCompletada(s)} title={s.completada ? "Reabrir" : "Marcar completada"}>
                          {s.completada ? <RotateCcw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exportar(s)} title="Exportar JSON"><Download className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => askDelete([s.id])} title="Eliminar"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AlertDialog open={confirmDelete.open} onOpenChange={(o) => setConfirmDelete((p) => ({ ...p, open: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {confirmDelete.ids.length === 1 ? "esta sesión" : `${confirmDelete.ids.length} sesiones`}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente las respuestas, índices y análisis IA asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
