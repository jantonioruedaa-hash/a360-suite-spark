import { createFileRoute } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Save, Users, UserCog, UserPlus, Pencil, KeyRound, Trash2, Mail } from "lucide-react";
import { adminCreateUser, adminUpdateProfile, adminResetPassword, adminDeleteUser } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/app/configuracion")({ component: Config });

const ROLES: AppRole[] = ["admin", "consultor", "cliente", "participante"];

function Config() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  return (
    <div className="max-w-4xl space-y-6">
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

type UsuarioRow = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: AppRole | null;
};

function UsuariosAdmin() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioRow | null>(null);
  const [resetting, setResetting] = useState<UsuarioRow | null>(null);
  const [deleting, setDeleting] = useState<UsuarioRow | null>(null);

  const createFn = useServerFn(adminCreateUser);
  const updateFn = useServerFn(adminUpdateProfile);
  const resetFn = useServerFn(adminResetPassword);
  const deleteFn = useServerFn(adminDeleteUser);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id,email,name,company").order("email"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const priority: AppRole[] = ["admin", "consultor", "cliente", "participante"];
    const rolesByUser = new Map<string, AppRole>();
    (roles ?? []).forEach((r) => {
      const cur = rolesByUser.get(r.user_id);
      const next = r.role as AppRole;
      if (!cur || priority.indexOf(next) < priority.indexOf(cur)) rolesByUser.set(r.user_id, next);
    });
    setRows((profiles ?? []).map((p) => ({ ...p, role: rolesByUser.get(p.id) ?? null })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cambiarRol = async (userId: string, nuevo: AppRole) => {
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) { toast.error(delErr.message); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: nuevo });
    if (error) toast.error(error.message);
    else { toast.success("Rol actualizado"); setRows((r) => r.map((x) => x.id === userId ? { ...x, role: nuevo } : x)); }
  };

  const filtered = rows.filter((r) =>
    !filter || r.email.toLowerCase().includes(filter.toLowerCase()) || (r.name ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="a360-card a360-card-lg p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input placeholder="Buscar por nombre o correo…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{filtered.length} usuario(s)</span>
          <Button size="sm" className="bg-navy hover:bg-navy/90 text-primary-foreground" onClick={() => setCreateOpen(true)}>
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
                <th className="text-left py-2 px-2">Empresa</th>
                <th className="text-left py-2 px-2 w-44">Rol</th>
                <th className="text-right py-2 px-2 w-44">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b hover:bg-muted/30">
                  <td className="py-2 px-2">
                    <div className="font-medium text-navy">{u.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">{u.company ?? "—"}</td>
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
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Editar" onClick={() => setEditing(u)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Restablecer contraseña" onClick={() => setResetting(u)}>
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" title="Eliminar" disabled={u.id === me?.id} onClick={() => setDeleting(u)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Cambiar el rol afecta los permisos del usuario inmediatamente. Los administradores pueden gestionar todos los clientes; los consultores solo los suyos.
      </p>

      <CrearUsuarioDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async (input) => {
          try {
            await createFn({ data: input });
            toast.success("Usuario creado");
            setCreateOpen(false);
            await load();
          } catch (e) { toast.error(e instanceof Error ? e.message : "Error al crear"); }
        }}
      />

      <EditarUsuarioDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSave={async (input) => {
          try {
            await updateFn({ data: input });
            toast.success("Usuario actualizado");
            setEditing(null);
            await load();
          } catch (e) { toast.error(e instanceof Error ? e.message : "Error al actualizar"); }
        }}
      />

      <ResetPasswordDialog
        user={resetting}
        onClose={() => setResetting(null)}
        onSubmit={async (input) => {
          try {
            const res = await resetFn({ data: input });
            toast.success(res.mode === "email" ? "Correo de restablecimiento enviado" : "Contraseña actualizada");
            setResetting(null);
          } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la cuenta de <strong>{deleting?.email}</strong> y sus datos asociados. No se puede deshacer.
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

function CrearUsuarioDialog({ open, onOpenChange, onCreate }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (input: { email: string; password: string; name?: string; company?: string; specialty?: string; role: AppRole }) => Promise<void>;
}) {
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "", specialty: "", role: "cliente" as AppRole });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ email: "", password: "", name: "", company: "", specialty: "", role: "cliente" });
  }, [open]);

  const submit = async () => {
    if (!form.email || form.password.length < 6) { toast.error("Correo y contraseña (mínimo 6) son obligatorios"); return; }
    setSaving(true);
    await onCreate({
      email: form.email,
      password: form.password,
      name: form.name || undefined,
      company: form.company || undefined,
      specialty: form.specialty || undefined,
      role: form.role,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nuevo usuario</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Correo *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="text-xs">Contraseña inicial *</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Empresa</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Especialidad</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
          <div>
            <Label className="text-xs">Rol</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-gold hover:bg-gold/90 text-navy" onClick={submit} disabled={saving}>
            {saving ? "Creando…" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditarUsuarioDialog({ user, onClose, onSave }: {
  user: UsuarioRow | null;
  onClose: () => void;
  onSave: (input: { userId: string; name?: string | null; company?: string | null; specialty?: string | null; email?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", company: "", specialty: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      // Fetch latest specialty
      supabase.from("profiles").select("name,company,specialty,email").eq("id", user.id).maybeSingle()
        .then(({ data }) => setForm({
          name: data?.name ?? "",
          company: data?.company ?? "",
          specialty: data?.specialty ?? "",
          email: data?.email ?? user.email,
        }));
    }
  }, [user]);

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Correo</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="text-xs">Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">Empresa</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div><Label className="text-xs">Especialidad</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button className="bg-gold hover:bg-gold/90 text-navy" disabled={saving} onClick={async () => {
            setSaving(true);
            await onSave({
              userId: user.id,
              name: form.name || null,
              company: form.company || null,
              specialty: form.specialty || null,
              ...(form.email && form.email !== user.email ? { email: form.email } : {}),
            });
            setSaving(false);
          }}>{saving ? "Guardando…" : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
            disabled={saving || (mode === "set" && pwd.length < 6)}
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
