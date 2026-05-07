import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TIPOS_ACTIVIDAD } from "@/lib/clientes-helpers";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/clientes/$clienteId/actividades")({ component: Actividades });

interface Actividad {
  id: string;
  cliente_id: string;
  contacto_id: string | null;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  duracion_minutos: number | null;
  resultado: string | null;
  proxima_accion: string | null;
  fecha_proxima_accion: string | null;
}

interface ContactoLite { id: string; nombre: string; apellido: string }

const EMPTY = {
  tipo: "reunion",
  titulo: "",
  descripcion: "",
  fecha: new Date().toISOString().slice(0, 16),
  contacto_id: "",
  duracion_minutos: "",
  resultado: "",
  proxima_accion: "",
  fecha_proxima_accion: "",
};

function Actividades() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/actividades" });
  const { user } = useAuth();
  const [list, setList] = useState<Actividad[]>([]);
  const [contactos, setContactos] = useState<ContactoLite[]>([]);
  const [filtro, setFiltro] = useState("__all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const reload = async () => {
    const [{ data: a }, { data: c }] = await Promise.all([
      supabase.from("cliente_actividades").select("*").eq("cliente_id", clienteId).order("fecha", { ascending: false }),
      supabase.from("cliente_contactos").select("id,nombre,apellido").eq("cliente_id", clienteId).eq("activo", true),
    ]);
    setList((a ?? []) as Actividad[]);
    setContactos((c ?? []) as ContactoLite[]);
  };

  useEffect(() => { reload(); }, [clienteId]);

  const filtered = useMemo(() => filtro === "__all" ? list : list.filter((a) => a.tipo === filtro), [list, filtro]);

  const save = async () => {
    if (!form.titulo.trim()) { toast.error("Falta el título"); return; }
    const payload = {
      cliente_id: clienteId,
      consultor_id: user?.id ?? null,
      contacto_id: form.contacto_id || null,
      tipo: form.tipo,
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      fecha: new Date(form.fecha).toISOString(),
      duracion_minutos: form.duracion_minutos ? parseInt(form.duracion_minutos) : null,
      resultado: form.resultado || null,
      proxima_accion: form.proxima_accion || null,
      fecha_proxima_accion: form.fecha_proxima_accion || null,
    };
    const { error } = await supabase.from("cliente_actividades").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Actividad registrada");
    setOpen(false);
    setForm(EMPTY);
    reload();
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl text-navy">Actividades y seguimiento</h2>
        <Button onClick={() => setOpen(true)} className="bg-navy hover:bg-navy/90">
          <Plus className="w-4 h-4 mr-1" /> Registrar actividad
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltro("__all")} className={`px-3 py-1 rounded-full text-xs ${filtro === "__all" ? "bg-navy text-white" : "bg-cream text-navy"}`}>Todas ({list.length})</button>
        {TIPOS_ACTIVIDAD.map((t) => {
          const n = list.filter((a) => a.tipo === t.value).length;
          if (!n) return null;
          return <button key={t.value} onClick={() => setFiltro(t.value)} className={`px-3 py-1 rounded-full text-xs ${filtro === t.value ? "bg-navy text-white" : "bg-cream text-navy"}`}>{t.label} ({n})</button>;
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="a360-card a360-card-lg p-12 text-center text-muted-foreground">Sin actividades registradas.</div>
      ) : (
        <div className="a360-card a360-card-lg p-5">
          <ol className="relative border-l-2 border-cream space-y-6 ml-3">
            {filtered.map((a) => {
              const tipo = TIPOS_ACTIVIDAD.find((t) => t.value === a.tipo);
              const ct = contactos.find((c) => c.id === a.contacto_id);
              return (
                <li key={a.id} className="ml-6">
                  <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-gold border-2 border-white" />
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs uppercase tracking-wider text-gold font-semibold">{tipo?.label ?? a.tipo}</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.fecha).toLocaleString()}</span>
                    {ct && <span className="text-xs text-muted-foreground">· con {ct.nombre} {ct.apellido}</span>}
                    {a.duracion_minutos && <span className="text-xs text-muted-foreground">· {a.duracion_minutos} min</span>}
                  </div>
                  <h4 className="text-navy font-semibold mt-1">{a.titulo}</h4>
                  {a.descripcion && <p className="text-sm text-muted-foreground mt-1">{a.descripcion}</p>}
                  {a.resultado && <p className="text-sm mt-2"><strong className="text-navy">Resultado:</strong> {a.resultado}</p>}
                  {a.proxima_accion && (
                    <div className="mt-2 p-2 bg-cream rounded text-xs">
                      <strong className="text-navy">Próxima acción:</strong> {a.proxima_accion}
                      {a.fecha_proxima_accion && <span className="text-gold ml-2">· {new Date(a.fecha_proxima_accion).toLocaleDateString()}</span>}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva actividad</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_ACTIVIDAD.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fecha y hora *</Label><Input type="datetime-local" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></div>
            <div className="col-span-2"><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            <div className="col-span-2"><Label>Descripción</Label><Textarea rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
            <div><Label>Contacto</Label>
              <Select value={form.contacto_id} onValueChange={(v) => setForm({ ...form, contacto_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {contactos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre} {c.apellido}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Duración (minutos)</Label><Input type="number" value={form.duracion_minutos} onChange={(e) => setForm({ ...form, duracion_minutos: e.target.value })} /></div>
            <div className="col-span-2"><Label>Resultado</Label><Textarea rows={2} value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })} /></div>
            <div><Label>Próxima acción</Label><Input value={form.proxima_accion} onChange={(e) => setForm({ ...form, proxima_accion: e.target.value })} /></div>
            <div><Label>Fecha próxima acción</Label><Input type="date" value={form.fecha_proxima_accion} onChange={(e) => setForm({ ...form, fecha_proxima_accion: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-gold text-navy hover:bg-gold/90">Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
