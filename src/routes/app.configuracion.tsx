import { createFileRoute } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Save, Users, UserCog, UserPlus, Pencil, KeyRound, Trash2, Mail, Send, Lock, Unlock } from "lucide-react";
import {
  adminCreateUser, adminUpdateProfile, adminResetPassword, adminDeleteUser,
  adminListUsersExtra, adminInviteUser, adminToggleBan,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/app/configuracion")({ component: Config });

const ROLES: AppRole[] = ["admin", "consultor", "cliente", "participante"];

function Config() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-display text-3xl text-navy">Configuración</h1>
      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil"><UserCog className="w-4 h-4 mr-2" />Mi perfil</TabsTrigger>
          {isAdmin && <TabsTrigger value="usuarios"><Users className="w-4 h-4 mr-2" />Usuarios</TabsTrigger>}
        </TabsList>
        <TabsContent value="perfil" className="mt-6"><PerfilForm /></TabsContent>
        {isAdmin && <TabsContent value="usuarios" className="mt-6"><UsuariosAdmin /></TabsContent>}
      </Tabs>
    </div>
  );
}

function PerfilForm() {
  const { user, profile, refresh } = useAuth();
  const [form, setForm] = useState({ name: "", company: "", specialty: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({
      name: profile.name ?? "",
      company: profile.company ?? "",
      specialty: profile.specialty ?? "",
      avatar_url: profile.avatar_url ?? "",
    });
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: form.name || null,
      company: form.company || null,
      specialty: form.specialty || null,
      avatar_url: form.avatar_url || null,
    }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Perfil actualizado"); await refresh(); }
    setSaving(false);
  };

  return (
    <div className="a360-card a360-card-lg p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-xs">Correo</Label><Input value={user?.email ?? ""} disabled /></div>
        <div><Label className="text-xs">Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label className="text-xs">Empresa</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
        <div><Label className="text-xs">Especialidad</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
        <div className="md:col-span-2"><Label className="text-xs">URL de avatar</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." /></div>
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gold hover:bg-gold/90 text-navy">
          <Save className="w-4 h-4 mr-1" />{saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}

type ClienteOpt = { id: string; nombre_empresa: string };
type UsuarioRow = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: AppRole | null;
  banned: boolean;
  clienteId: string | null;
  clienteNombre: string | null;
};

// ─── Validation helpers ───────────────────────────────────────────────────────
function validarEmail(email: string): string | null {
  if (!email) return "El correo es obligatorio";
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return ok ? null : "Correo electrónico inválido";
}
function evaluarPassword(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string; ok: boolean } {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const score = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Muy débil", "Débil", "Aceptable", "Buena", "Excelente"];
  const colors = ["bg-destructive", "bg-destructive/80", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];
  return { score, label: labels[score], color: colors[score], ok: pwd.length >= 6 };
}

function UsuariosAdmin() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState<UsuarioRow[]>([]);
  const [clientes, setClientes] = useState<ClienteOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"create" | "invite">("create");
  const [editing, setEditing] = useState<UsuarioRow | null>(null);
  const [resetting, setResetting] = useState<UsuarioRow | null>(null);
  const [deleting, setDeleting] = useState<UsuarioRow | null>(null);

  const createFn = useServerFn(adminCreateUser);
  const inviteFn = useServerFn(adminInviteUser);
  const updateFn = useServerFn(adminUpdateProfile);
  const resetFn = useServerFn(adminResetPassword);
  const deleteFn = useServerFn(adminDeleteUser);
  const listExtrasFn = useServerFn(adminListUsersExtra);
  const banFn = useServerFn(adminToggleBan);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: cs }, extras] = await Promise.all([
      supabase.from("profiles").select("id,email,name,company").order("email"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("clientes").select("id,nombre_empresa,cliente_user_id,consultor_id").order("nombre_empresa"),
      listExtrasFn().catch((err) => { console.error("adminListUsersExtra failed:", err); return []; }),
    ]);
    const extrasArr = Array.isArray(extras) ? extras : [];
    const priority: AppRole[] = ["admin", "consultor", "cliente", "participante"];
    const rolesByUser = new Map<string, AppRole>();
    (roles ?? []).forEach((r) => {
      const cur = rolesByUser.get(r.user_id);
      const next = r.role as AppRole;
      if (!cur || priority.indexOf(next) < priority.indexOf(cur)) rolesByUser.set(r.user_id, next);
    });
    const banByUser = new Map<string, boolean>();
    extrasArr.forEach((e) => {
      const b = e.banned_until && new Date(e.banned_until).getTime() > Date.now();
      banByUser.set(e.id, !!b);
    });
    const allClientes = (cs ?? []) as Array<{ id: string; nombre_empresa: string; cliente_user_id: string | null; consultor_id: string | null }>;
    setClientes(allClientes.map((c) => ({ id: c.id, nombre_empresa: c.nombre_empresa })));

    setRows((profiles ?? []).map((p) => {
      const role = rolesByUser.get(p.id) ?? null;
      const link = allClientes.find((c) =>
        (role === "cliente" || role === "participante") ? c.cliente_user_id === p.id :
        role === "consultor" ? c.consultor_id === p.id : false,
      );
      return {
        id: p.id, email: p.email, name: p.name, company: p.company,
        role, banned: banByUser.get(p.id) ?? false,
        clienteId: link?.id ?? null, clienteNombre: link?.nombre_empresa ?? null,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cambiarRol = async (userId: string, nuevo: AppRole) => {
    try {
      await updateFn({ data: { userId, role: nuevo } });
      toast.success("Rol actualizado");
      setRows((r) => r.map((x) => x.id === userId ? { ...x, role: nuevo } : x));
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  };

  const filtered = useMemo(() =>
    rows.filter((r) =>
      !filter || r.email.toLowerCase().includes(filter.toLowerCase()) || (r.name ?? "").toLowerCase().includes(filter.toLowerCase()),
    ), [rows, filter]);

  const openCreate = (mode: "create" | "invite") => { setCreateMode(mode); setCreateOpen(true); };

  return (
    <div className="a360-card a360-card-lg p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Input placeholder="Buscar por nombre o correo…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{filtered.length} usuario(s)</span>
          <Button size="sm" variant="outline" onClick={() => openCreate("invite")}>
            <Send className="w-4 h-4 mr-1" />Invitar por correo
          </Button>
          <Button size="sm" className="bg-navy hover:bg-navy/90 text-primary-foreground" onClick={() => openCreate("create")}>
            <UserPlus className="w-4 h-4 mr-1" />Nuevo usuario
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Cargando…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2 px-2">Usuario</th>
                <th className="text-left py-2 px-2">Empresa vinculada</th>
                <th className="text-left py-2 px-2 w-44">Rol</th>
                <th className="text-left py-2 px-2 w-24">Estado</th>
                <th className="text-right py-2 px-2 w-52">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b hover:bg-muted/30">
                  <td className="py-2 px-2">
                    <div className="font-medium text-navy">{u.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {u.clienteNombre ?? <span className="text-xs italic">— sin vincular</span>}
                  </td>
                  <td className="py-2 px-2">
                    <Select value={u.role ?? ""} onValueChange={(v) => cambiarRol(u.id, v as AppRole)} disabled={u.id === me?.id}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {u.id === me?.id && <div className="text-[10px] text-muted-foreground mt-1">Tu propio usuario</div>}
                  </td>
                  <td className="py-2 px-2">
                    {u.banned
                      ? <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>
                      : <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">Activo</Badge>}
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Editar" onClick={() => setEditing(u)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Restablecer contraseña" onClick={() => setResetting(u)}>
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8"
                        title={u.banned ? "Reactivar" : "Bloquear"}
                        disabled={u.id === me?.id}
                        onClick={async () => {
                          try {
                            await banFn({ data: { userId: u.id, block: !u.banned } });
                            toast.success(u.banned ? "Usuario reactivado" : "Usuario bloqueado");
                            setRows((r) => r.map((x) => x.id === u.id ? { ...x, banned: !u.banned } : x));
                          } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
                        }}
                      >
                        {u.banned ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" title="Eliminar" disabled={u.id === me?.id} onClick={() => setDeleting(u)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        <strong>Bloquear</strong> impide el acceso sin borrar datos. <strong>Eliminar</strong> es permanente y desvincula clientes/sesiones del usuario.
      </p>

      <CrearOInvitarDialog
        open={createOpen}
        mode={createMode}
        clientes={clientes}
        onOpenChange={setCreateOpen}
        onSubmit={async (input) => {
          try {
            if (createMode === "invite") {
              await inviteFn({ data: { ...input, redirectTo: `${window.location.origin}/login` } });
              toast.success("Invitación enviada");
            } else {
              await createFn({ data: { ...input, password: input.password ?? "" } });
              toast.success("Usuario creado");
            }
            setCreateOpen(false);
            await load();
          } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
        }}
      />

      <EditarUsuarioDialog
        user={editing}
        clientes={clientes}
        onClose={() => setEditing(null)}
        onSave={async (input) => {
          try {
            await updateFn({ data: input });
            toast.success("Usuario actualizado");
            setEditing(null);
            await load();
          } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
        }}
      />

      <ResetPasswordDialog
        user={resetting}
        onClose={() => setResetting(null)}
        onSubmit={async (input) => {
          try {
            const res = await resetFn({ data: input });
            toast.success(res.mode === "email" ? "Correo enviado" : "Contraseña actualizada");
            setResetting(null);
          } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la cuenta de <strong>{deleting?.email}</strong>. Considera <strong>bloquear</strong> en su lugar para preservar el historial. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteFn({ data: { userId: deleting.id } });
                  toast.success("Usuario eliminado");
                  setDeleting(null);
                  await load();
                } catch (e) { toast.error(e instanceof Error ? e.message : "Error al eliminar"); }
              }}
            >Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Crear / Invitar dialog ───────────────────────────────────────────────────
function CrearOInvitarDialog({ open, mode, clientes, onOpenChange, onSubmit }: {
  open: boolean;
  mode: "create" | "invite";
  clientes: ClienteOpt[];
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: {
    email: string; password?: string; name?: string; company?: string; specialty?: string;
    role: AppRole; clienteId?: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "", specialty: "", role: "cliente" as AppRole, clienteId: "" });
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) { setForm({ email: "", password: "", name: "", company: "", specialty: "", role: "cliente", clienteId: "" }); setTouched(false); }
  }, [open]);

  const emailErr = touched ? validarEmail(form.email) : null;
  const pwd = evaluarPassword(form.password);
  const isInvite = mode === "invite";
  const showCliente = form.role === "cliente" || form.role === "participante" || form.role === "consultor";
  const canSubmit = !validarEmail(form.email) && (isInvite || pwd.ok);

  const submit = async () => {
    setTouched(true);
    if (!canSubmit) { toast.error("Revisa los campos marcados"); return; }
    setSaving(true);
    await onSubmit({
      email: form.email.trim(),
      ...(isInvite ? {} : { password: form.password }),
      name: form.name || undefined,
      company: form.company || undefined,
      specialty: form.specialty || undefined,
      role: form.role,
      clienteId: form.clienteId || undefined,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isInvite ? "Invitar usuario por correo" : "Nuevo usuario"}</DialogTitle>
          {isInvite && <p className="text-xs text-muted-foreground">El usuario recibirá un enlace para definir su contraseña.</p>}
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Correo *</Label>
            <Input type="email" value={form.email} onBlur={() => setTouched(true)} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!emailErr} />
            {emailErr && <p className="text-xs text-destructive mt-1">{emailErr}</p>}
          </div>
          {!isInvite && (
            <div>
              <Label className="text-xs">Contraseña inicial *</Label>
              <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
              {form.password && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded ${i < pwd.score ? pwd.color : "bg-muted"}`} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Fortaleza: <strong>{pwd.label}</strong> · usa mayúsculas, números y símbolos</p>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Empresa</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Especialidad</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole, clienteId: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {showCliente && (
              <div>
                <Label className="text-xs">
                  {form.role === "consultor" ? "Asignar como consultor de" : "Vincular a empresa"}
                </Label>
                <Select value={form.clienteId} onValueChange={(v) => setForm({ ...form, clienteId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sin vincular" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-gold hover:bg-gold/90 text-navy" onClick={submit} disabled={saving || !canSubmit}>
            {saving ? "Procesando…" : isInvite ? "Enviar invitación" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Editar usuario ───────────────────────────────────────────────────────────
function EditarUsuarioDialog({ user, clientes, onClose, onSave }: {
  user: UsuarioRow | null;
  clientes: ClienteOpt[];
  onClose: () => void;
  onSave: (input: {
    userId: string; name?: string | null; company?: string | null; specialty?: string | null;
    email?: string; clienteId?: string | null;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", company: "", specialty: "", email: "", clienteId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("name,company,specialty,email").eq("id", user.id).maybeSingle()
        .then(({ data }) => setForm({
          name: data?.name ?? "",
          company: data?.company ?? "",
          specialty: data?.specialty ?? "",
          email: data?.email ?? user.email,
          clienteId: user.clienteId ?? "",
        }));
    }
  }, [user]);

  if (!user) return null;
  const emailErr = validarEmail(form.email);
  const showCliente = user.role === "cliente" || user.role === "participante" || user.role === "consultor";

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Correo</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!emailErr} />
            {emailErr && <p className="text-xs text-destructive mt-1">{emailErr}</p>}
          </div>
          <div><Label className="text-xs">Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">Empresa</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div><Label className="text-xs">Especialidad</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
          {showCliente && (
            <div>
              <Label className="text-xs">
                {user.role === "consultor" ? "Asignar como consultor de" : "Empresa vinculada"}
              </Label>
              <Select value={form.clienteId || "__none__"} onValueChange={(v) => setForm({ ...form, clienteId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— sin vincular —</SelectItem>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                {user.role === "consultor"
                  ? "El consultor podrá gestionar esta empresa. (Para asignar varias, usa la ficha del cliente.)"
                  : "La empresa con la que el usuario verá su contenido."}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-gold hover:bg-gold/90 text-navy"
            disabled={saving || !!emailErr}
            onClick={async () => {
              setSaving(true);
              await onSave({
                userId: user.id,
                name: form.name || null,
                company: form.company || null,
                specialty: form.specialty || null,
                ...(form.email && form.email !== user.email ? { email: form.email } : {}),
                ...(showCliente ? { clienteId: form.clienteId || null } : {}),
              });
              setSaving(false);
            }}
          >{saving ? "Guardando…" : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reset password ───────────────────────────────────────────────────────────
function ResetPasswordDialog({ user, onClose, onSubmit }: {
  user: UsuarioRow | null;
  onClose: () => void;
  onSubmit: (input: { userId: string; newPassword?: string; sendEmail?: boolean; email?: string; redirectTo?: string }) => Promise<void>;
}) {
  const [mode, setMode] = useState<"set" | "email">("set");
  const [pwd, setPwd] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) { setMode("set"); setPwd(""); } }, [user]);

  if (!user) return null;
  const eval_ = evaluarPassword(pwd);

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Restablecer contraseña</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">Usuario: <strong className="text-navy">{user.email}</strong></div>
          <div className="flex gap-2">
            <Button size="sm" variant={mode === "set" ? "default" : "outline"} onClick={() => setMode("set")}>
              <KeyRound className="w-4 h-4 mr-1" />Definir nueva
            </Button>
            <Button size="sm" variant={mode === "email" ? "default" : "outline"} onClick={() => setMode("email")}>
              <Mail className="w-4 h-4 mr-1" />Enviar correo
            </Button>
          </div>
          {mode === "set" ? (
            <div>
              <Label className="text-xs">Nueva contraseña</Label>
              <Input type="text" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Mínimo 6 caracteres" />
              {pwd && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((i) => <div key={i} className={`h-1 flex-1 rounded ${i < eval_.score ? eval_.color : "bg-muted"}`} />)}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Fortaleza: <strong>{eval_.label}</strong></p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Se enviará un correo a {user.email} con un enlace para que el usuario establezca su nueva contraseña.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-gold hover:bg-gold/90 text-navy"
            disabled={saving || (mode === "set" && !eval_.ok)}
            onClick={async () => {
              setSaving(true);
              await onSubmit(mode === "set"
                ? { userId: user.id, newPassword: pwd }
                : { userId: user.id, sendEmail: true, email: user.email, redirectTo: `${window.location.origin}/login` });
              setSaving(false);
            }}
          >{saving ? "Procesando…" : mode === "set" ? "Actualizar" : "Enviar correo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
