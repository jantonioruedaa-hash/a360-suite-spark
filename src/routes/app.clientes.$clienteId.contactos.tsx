import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AREAS_CONTACTO, getInitials } from "@/lib/clientes-helpers";
import { toast } from "sonner";
import { Plus, Mail, Phone, Linkedin, Copy, Star, Crown, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/clientes/$clienteId/contactos")({ component: Contactos });

interface Contacto {
  id: string;
  nombre: string;
  apellido: string;
  cargo: string | null;
  area: string | null;
  email: string | null;
  email_secundario: string | null;
  celular: string | null;
  telefono_oficina: string | null;
  extension: string | null;
  direccion: string | null;
  ciudad: string | null;
  linkedin_url: string | null;
  foto_url: string | null;
  fecha_nacimiento: string | null;
  notas: string | null;
  es_contacto_principal: boolean;
  es_decisor: boolean;
  activo: boolean;
}

const EMPTY: Partial<Contacto> = { nombre: "", apellido: "", activo: true, es_contacto_principal: false, es_decisor: false };

function Contactos() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/contactos" });
  const [list, setList] = useState<Contacto[]>([]);
  const [editing, setEditing] = useState<Partial<Contacto> | null>(null);
  const [deleting, setDeleting] = useState<Contacto | null>(null);

  const reload = async () => {
    const { data } = await supabase.from("cliente_contactos").select("*").eq("cliente_id", clienteId).order("es_contacto_principal", { ascending: false }).order("created_at");
    setList((data ?? []) as Contacto[]);
  };

  useEffect(() => { reload(); }, [clienteId]);

  const save = async () => {
    if (!editing) return;
    if (!editing.nombre?.trim() || !editing.apellido?.trim()) { toast.error("Nombre y apellido son obligatorios"); return; }

    if (editing.es_contacto_principal) {
      await supabase.from("cliente_contactos").update({ es_contacto_principal: false }).eq("cliente_id", clienteId).neq("id", editing.id ?? "00000000-0000-0000-0000-000000000000");
    }

    const payload = { ...editing, cliente_id: clienteId };
    const { error } = editing.id
      ? await supabase.from("cliente_contactos").update(payload).eq("id", editing.id)
      : await supabase.from("cliente_contactos").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Contacto guardado");
    setEditing(null);
    reload();
  };

  const togglePrincipal = async (c: Contacto) => {
    if (!c.es_contacto_principal) {
      await supabase.from("cliente_contactos").update({ es_contacto_principal: false }).eq("cliente_id", clienteId);
    }
    await supabase.from("cliente_contactos").update({ es_contacto_principal: !c.es_contacto_principal }).eq("id", c.id);
    reload();
  };

  const toggleDecisor = async (c: Contacto) => {
    await supabase.from("cliente_contactos").update({ es_decisor: !c.es_decisor }).eq("id", c.id);
    reload();
  };

  const eliminar = async () => {
    if (!deleting) return;
    await supabase.from("cliente_contactos").delete().eq("id", deleting.id);
    toast.success("Contacto eliminado");
    setDeleting(null);
    reload();
  };

  const copy = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-navy">Contactos</h2>
        <Button onClick={() => setEditing(EMPTY)} className="bg-navy hover:bg-navy/90">
          <Plus className="w-4 h-4 mr-1" /> Agregar contacto
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="a360-card a360-card-lg p-12 text-center text-muted-foreground">
          Sin contactos registrados. Agrega el primero.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => (
            <div key={c.id} className={`a360-card p-5 relative ${c.es_contacto_principal ? "ring-2 ring-gold/60" : ""}`}>
              <div className="flex items-start gap-3">
                {c.foto_url ? (
                  <img src={c.foto_url} alt="" className="w-12 h-12 rounded-full object-cover border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-semibold">
                    {getInitials(c.nombre, c.apellido)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy truncate">{c.nombre} {c.apellido}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.cargo ?? "—"}{c.area ? ` · ${c.area}` : ""}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {c.es_contacto_principal && <Badge className="bg-gold text-navy text-[10px]"><Star className="w-3 h-3 mr-1" />Principal</Badge>}
                {c.es_decisor && <Badge className="bg-navy text-white text-[10px]"><Crown className="w-3 h-3 mr-1" />Decisor</Badge>}
                {!c.activo && <Badge variant="outline" className="text-[10px]">Inactivo</Badge>}
              </div>

              <div className="space-y-1.5 mt-3 text-xs">
                {c.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span className="truncate flex-1">{c.email}</span>
                    <button onClick={() => copy(c.email)}><Copy className="w-3 h-3 hover:text-navy" /></button>
                  </div>
                )}
                {c.celular && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span className="truncate flex-1">{c.celular}</span>
                    <button onClick={() => copy(c.celular)}><Copy className="w-3 h-3 hover:text-navy" /></button>
                  </div>
                )}
                {c.linkedin_url && (
                  <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Linkedin className="w-3 h-3" /><span className="truncate">LinkedIn</span>
                  </a>
                )}
              </div>

              <div className="flex gap-1 mt-4 pt-3 border-t">
                <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => setEditing(c)}><Pencil className="w-3 h-3 mr-1" />Editar</Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => togglePrincipal(c)} title="Marcar principal"><Star className={`w-3 h-3 ${c.es_contacto_principal ? "fill-gold text-gold" : ""}`} /></Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => toggleDecisor(c)} title="Marcar decisor"><Crown className={`w-3 h-3 ${c.es_decisor ? "fill-navy text-navy" : ""}`} /></Button>
                <Button size="sm" variant="ghost" className="text-xs text-red-600" onClick={() => setDeleting(c)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing.id ? "Editar contacto" : "Nuevo contacto"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nombre *</Label><Input value={editing.nombre ?? ""} onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} /></div>
              <div><Label>Apellido *</Label><Input value={editing.apellido ?? ""} onChange={(e) => setEditing({ ...editing, apellido: e.target.value })} /></div>
              <div><Label>Cargo</Label><Input value={editing.cargo ?? ""} onChange={(e) => setEditing({ ...editing, cargo: e.target.value })} /></div>
              <div><Label>Área</Label>
                <Select value={editing.area ?? ""} onValueChange={(v) => setEditing({ ...editing, area: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{AREAS_CONTACTO.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Email</Label><Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>Email secundario</Label><Input type="email" value={editing.email_secundario ?? ""} onChange={(e) => setEditing({ ...editing, email_secundario: e.target.value })} /></div>
              <div><Label>Celular</Label><Input value={editing.celular ?? ""} onChange={(e) => setEditing({ ...editing, celular: e.target.value })} /></div>
              <div><Label>Teléfono oficina</Label><Input value={editing.telefono_oficina ?? ""} onChange={(e) => setEditing({ ...editing, telefono_oficina: e.target.value })} /></div>
              <div><Label>Extensión</Label><Input value={editing.extension ?? ""} onChange={(e) => setEditing({ ...editing, extension: e.target.value })} /></div>
              <div><Label>Ciudad</Label><Input value={editing.ciudad ?? ""} onChange={(e) => setEditing({ ...editing, ciudad: e.target.value })} /></div>
              <div className="col-span-2"><Label>Dirección</Label><Input value={editing.direccion ?? ""} onChange={(e) => setEditing({ ...editing, direccion: e.target.value })} /></div>
              <div className="col-span-2"><Label>LinkedIn</Label><Input value={editing.linkedin_url ?? ""} onChange={(e) => setEditing({ ...editing, linkedin_url: e.target.value })} /></div>
              <div className="col-span-2"><Label>Foto (URL)</Label><Input value={editing.foto_url ?? ""} onChange={(e) => setEditing({ ...editing, foto_url: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Fecha nacimiento</Label><Input type="date" value={editing.fecha_nacimiento ?? ""} onChange={(e) => setEditing({ ...editing, fecha_nacimiento: e.target.value })} /></div>
              <div className="col-span-2"><Label>Notas</Label><Textarea rows={2} value={editing.notas ?? ""} onChange={(e) => setEditing({ ...editing, notas: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.es_contacto_principal} onChange={(e) => setEditing({ ...editing, es_contacto_principal: e.target.checked })} /> Contacto principal</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.es_decisor} onChange={(e) => setEditing({ ...editing, es_decisor: e.target.checked })} /> Es decisor</label>
              <label className="flex items-center gap-2 text-sm col-span-2"><input type="checkbox" checked={editing.activo !== false} onChange={(e) => setEditing({ ...editing, activo: e.target.checked })} /> Activo</label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save} className="bg-gold text-navy hover:bg-gold/90">Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará a {deleting?.nombre} {deleting?.apellido} permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminar} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
