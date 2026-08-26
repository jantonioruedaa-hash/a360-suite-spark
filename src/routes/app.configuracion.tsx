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
import { Save, Users, UserCog, UserPlus, Pencil, KeyRound, Trash2, Mail, Send, Lock, Unlock, Palette, FileText, Upload, ShieldCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCreateUser, adminUpdateProfile, adminResetPassword, adminDeleteUser,
  adminListUsersExtra, adminInviteUser, adminToggleBan,
} from "@/lib/admin-users.functions";
import { useAppSettings, EDITABLE_TEXTS } from "@/lib/app-settings";

export const Route = createFileRoute("/app/configuracion")({ component: Config });

const ROLES: AppRole[] = ["admin", "consultor", "cliente", "participante"];

function Config() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const canBranding = role === "admin" || role === "consultor";
  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-display text-3xl text-navy">Configuración</h1>
      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil"><UserCog className="w-4 h-4 mr-2" />Mi perfil</TabsTrigger>
          {isAdmin && <TabsTrigger value="usuarios"><Users className="w-4 h-4 mr-2" />Usuarios</TabsTrigger>}
          {isAdmin && <TabsTrigger value="permisos"><ShieldCheck className="w-4 h-4 mr-2" />Permisos</TabsTrigger>}
          {canBranding && <TabsTrigger value="branding"><Palette className="w-4 h-4 mr-2" />Branding</TabsTrigger>}
          {canBranding && <TabsTrigger value="contenido"><FileText className="w-4 h-4 mr-2" />Contenido</TabsTrigger>}
        </TabsList>
        <TabsContent value="perfil" className="mt-6"><PerfilForm /></TabsContent>
        {isAdmin && <TabsContent value="usuarios" className="mt-6"><UsuariosAdmin /></TabsContent>}
        {isAdmin && <TabsContent value="permisos" className="mt-6"><PermisosModuloAdmin /></TabsContent>}
        {canBranding && <TabsContent value="branding" className="mt-6"><BrandingForm /></TabsContent>}
        {canBranding && <TabsContent value="contenido" className="mt-6"><ContenidoEditor /></TabsContent>}
      </Tabs>
    </div>
  );
}

function BrandingForm() {
  const { settings, update, refresh } = useAppSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("branding").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("branding").getPublicUrl(path);
    setForm({ ...form, logo_url: data.publicUrl });
    setUploading(false);
    toast.success("Logo subido. No olvides guardar.");
  };

  const save = async () => {
    setSaving(true);
    const { error } = await update({
      company_name: form.company_name,
      app_name: form.app_name,
      logo_url: form.logo_url,
      primary_color: form.primary_color,
      accent_color: form.accent_color,
      font_family: form.font_family,
    });
    if (error) toast.error(error); else { toast.success("Branding actualizado"); await refresh(); }
    setSaving(false);
  };

  const FONTS = ["DM Sans", "Inter", "Roboto", "Poppins", "Montserrat", "Open Sans", "Lato", "Work Sans", "Nunito", "Source Sans 3"];

  return (
    <div className="a360-card a360-card-lg p-6 space-y-5">
      <div>
        <h2 className="font-display text-xl text-navy">Identidad visual</h2>
        <p className="text-sm text-muted-foreground">Estos cambios se aplican a todos los usuarios de la plataforma.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Nombre de la empresa</Label>
          <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Nombre de la aplicación</Label>
          <Input value={form.app_name} onChange={(e) => setForm({ ...form, app_name: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <Label className="text-xs">Logotipo</Label>
          <div className="flex items-center gap-3 mt-1">
            <input
              id="logo-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleLogoUpload(f); }}
            />
            <Button variant="outline" disabled={uploading} onClick={() => document.getElementById("logo-file")?.click()}>
              <Upload className="w-4 h-4 mr-1" />{uploading ? "Subiendo…" : "Subir logo"}
            </Button>
            <Input
              placeholder="o pega una URL pública"
              value={form.logo_url ?? ""}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value || null })}
            />
          </div>
        </div>
        <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[88px]">
          {form.logo_url
            ? <img src={form.logo_url} alt="preview" className="max-h-16 object-contain" />
            : <span className="text-xs text-muted-foreground">Sin logo</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs">Color primario</Label>
          <div className="flex gap-2 mt-1">
            <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-14 rounded border border-input cursor-pointer" />
            <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Color de acento</Label>
          <div className="flex gap-2 mt-1">
            <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="h-10 w-14 rounded border border-input cursor-pointer" />
            <Input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Tipografía</Label>
          <Select value={form.font_family} onValueChange={(v) => setForm({ ...form, font_family: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gold hover:bg-gold/90 text-navy">
          <Save className="w-4 h-4 mr-1" />{saving ? "Guardando…" : "Guardar branding"}
        </Button>
      </div>
    </div>
  );
}

function ContenidoEditor() {
  const { settings, update, refresh } = useAppSettings();
  const [draft, setDraft] = useState<Record<string, string>>(settings.content_strings ?? {});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(settings.content_strings ?? {}); }, [settings]);

  const save = async () => {
    setSaving(true);
    const { error } = await update({ content_strings: draft });
    if (error) toast.error(error); else { toast.success("Contenido actualizado"); await refresh(); }
    setSaving(false);
  };

  return (
    <div className="a360-card a360-card-lg p-6 space-y-5">
      <div>
        <h2 className="font-display text-xl text-navy">Textos editables</h2>
        <p className="text-sm text-muted-foreground">Modifica los textos clave que aparecen en la plataforma. Si dejas un campo vacío se usa el texto por defecto.</p>
      </div>
      <div className="space-y-4">
        {EDITABLE_TEXTS.map((t) => (
          <div key={t.key}>
            <Label className="text-xs">{t.label} <span className="text-muted-foreground">· {t.key}</span></Label>
            {t.multiline ? (
              <Textarea
                rows={3}
                value={draft[t.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [t.key]: e.target.value })}
                placeholder={t.defaultValue}
              />
            ) : (
              <Input
                value={draft[t.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [t.key]: e.target.value })}
                placeholder={t.defaultValue}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gold hover:bg-gold/90 text-navy">
          <Save className="w-4 h-4 mr-1" />{saving ? "Guardando…" : "Guardar contenido"}
        </Button>
      </div>
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
type AreaOpt = { id: string; nombre: string };
type RolEmpresa = "dueño" | "jefe_area" | "colaborador";
type UsuarioRow = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: AppRole | null;
  banned: boolean;
  clienteId: string | null;
  clienteNombre: string | null;
  rolEmpresa: string | null;
  areaId: string | null;
};

type PermisoRow = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  modulo: string;
  alcance_tipo: "area" | "todas";
  alcance_area_id: string | null;
  alcance_area_nombre: string | null;
  puede_ver: boolean;
  puede_editar: boolean;
};

type EmpresaUsuarioOpt = {
  user_id: string;
  email: string;
  name: string | null;
  rol_empresa: string;
};

const MODULOS_PERMISO = [
  { value: "manual_funciones_evaluaciones", label: "Evaluaciones (Manual de Funciones)" },
  { value: "manual_funciones_cargos",       label: "Cargos y Áreas (Manual de Funciones)" },
] as const;

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
  const { user: me, session } = useAuth();
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

  const getAccessToken = () => {
    return session?.access_token ?? undefined;
  };

  const load = async () => {
    setLoading(true);
    const accessToken = session?.access_token;
    const [{ data: profiles }, { data: roles }, { data: cs }, { data: eu }, extras] = await Promise.all([
      supabase.from("profiles").select("id,email,name,company").order("email"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("clientes").select("id,nombre_empresa,consultor_id").order("nombre_empresa"),
      supabase.from("empresa_usuarios").select("user_id,cliente_id,rol_empresa,area_id"),
      listExtrasFn({ data: {} }).catch((err) => { console.error("adminListUsersExtra failed:", err); return []; }),
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
    const allClientes = (cs ?? []) as Array<{ id: string; nombre_empresa: string; consultor_id: string | null }>;
    setClientes(allClientes.map((c) => ({ id: c.id, nombre_empresa: c.nombre_empresa })));
    // TODO(multi-empresa): si un usuario pertenece a >1 empresa, este map solo retiene la última.
    const euByUser = new Map(
      (eu ?? []).map((e) => [e.user_id, e]),
    );

    setRows((profiles ?? []).map((p) => {
      const role = rolesByUser.get(p.id) ?? null;
      const euRow = euByUser.get(p.id);
      const link = allClientes.find((c) =>
        (role === "cliente" || role === "participante") ? euRow?.cliente_id === c.id :
        role === "consultor" ? c.consultor_id === p.id : false,
      );
      return {
        id: p.id, email: p.email, name: p.name, company: p.company,
        role, banned: banByUser.get(p.id) ?? false,
        clienteId: link?.id ?? null, clienteNombre: link?.nombre_empresa ?? null,
        rolEmpresa: euRow?.rol_empresa ?? null,
        areaId: euRow?.area_id ?? null,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, [session?.access_token]);

  const cambiarRol = async (userId: string, nuevo: AppRole) => {
    const accessToken = getAccessToken();
    try {
      await updateFn({ data: { accessToken, userId, role: nuevo } });
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
                    {u.clienteNombre
                      ? <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{u.clienteNombre}</span>
                          {u.rolEmpresa && u.rolEmpresa !== "dueño" && (
                            <Badge variant="outline" className="text-[10px] capitalize">{u.rolEmpresa.replace("_", " ")}</Badge>
                          )}
                        </div>
                      : <span className="text-xs italic">— sin vincular</span>}
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
                            const accessToken = getAccessToken();
                            await banFn({ data: { accessToken, userId: u.id, block: !u.banned } });
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
              const accessToken = getAccessToken();
              await inviteFn({ data: { ...input, accessToken, redirectTo: `${window.location.origin}/login` } });
              toast.success("Invitación enviada");
            } else {
              const accessToken = getAccessToken();
              await createFn({ data: { ...input, accessToken, password: input.password ?? "" } });
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
            const accessToken = getAccessToken();
            await updateFn({ data: { ...input, accessToken } });
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
            const accessToken = getAccessToken();
            const res = await resetFn({ data: { ...input, accessToken } });
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
                  const accessToken = getAccessToken();
                  await deleteFn({ data: { accessToken, userId: deleting.id } });
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
    role: AppRole; clienteId?: string; rolEmpresa?: RolEmpresa; areaId?: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "", specialty: "", role: "cliente" as AppRole, clienteId: "", rolEmpresa: "" as RolEmpresa | "", areaId: "" });
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [areas, setAreas] = useState<AreaOpt[]>([]);

  useEffect(() => {
    if (open) { setForm({ email: "", password: "", name: "", company: "", specialty: "", role: "cliente", clienteId: "", rolEmpresa: "", areaId: "" }); setTouched(false); setAreas([]); }
  }, [open]);

  const isInvite = mode === "invite";
  const showCliente = form.role === "cliente" || form.role === "participante" || form.role === "consultor";
  const showRolEmpresa = (form.role === "cliente" || form.role === "participante") && !!form.clienteId;
  const showArea = showRolEmpresa && form.rolEmpresa === "jefe_area";
  const areaErr = showArea && !form.areaId ? "El área es obligatoria para Jefe de Área" : null;

  useEffect(() => {
    if (!form.clienteId || !(form.role === "cliente" || form.role === "participante")) { setAreas([]); return; }
    supabase.from("manual_areas").select("id,nombre").eq("cliente_id", form.clienteId).order("orden")
      .then(({ data }) => setAreas(data ?? []));
  }, [form.clienteId, form.role]);

  const emailErr = touched ? validarEmail(form.email) : null;
  const pwd = evaluarPassword(form.password);
  const canSubmit = !validarEmail(form.email) && (isInvite || pwd.ok) && !areaErr;

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
      ...(showRolEmpresa && form.rolEmpresa ? { rolEmpresa: form.rolEmpresa as RolEmpresa } : {}),
      ...(showArea && form.areaId ? { areaId: form.areaId } : {}),
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
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole, clienteId: "", rolEmpresa: "", areaId: "" })}>
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
                <Select value={form.clienteId} onValueChange={(v) => setForm({ ...form, clienteId: v, rolEmpresa: "", areaId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Sin vincular" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {showRolEmpresa && (
            <div>
              <Label className="text-xs">Rol en empresa</Label>
              <Select value={form.rolEmpresa || "__none__"} onValueChange={(v) => setForm({ ...form, rolEmpresa: v === "__none__" ? "" : v as RolEmpresa, areaId: "" })}>
                <SelectTrigger><SelectValue placeholder="— dueño por defecto —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueño">Dueño / RRHH</SelectItem>
                  <SelectItem value="jefe_area">Jefe de Área</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {showArea && (
            <div>
              <Label className="text-xs">Área *</Label>
              <Select value={form.areaId || "__none__"} onValueChange={(v) => setForm({ ...form, areaId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona un área…" /></SelectTrigger>
                <SelectContent>
                  {areas.length === 0
                    ? <SelectItem value="__none__" disabled>Sin áreas disponibles</SelectItem>
                    : areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              {touched && areaErr && <p className="text-xs text-destructive mt-1">{areaErr}</p>}
            </div>
          )}
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
    email?: string; clienteId?: string | null; rolEmpresa?: RolEmpresa; areaId?: string | null;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", company: "", specialty: "", email: "", clienteId: "", rolEmpresa: "" as RolEmpresa | "", areaId: "" });
  const [saving, setSaving] = useState(false);
  const [areas, setAreas] = useState<AreaOpt[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("name,company,specialty,email").eq("id", user.id).maybeSingle(),
      supabase.from("empresa_usuarios").select("rol_empresa,area_id").eq("user_id", user.id).maybeSingle(),
    ]).then(([{ data: prof }, { data: eu }]) => setForm({
      name: prof?.name ?? "",
      company: prof?.company ?? "",
      specialty: prof?.specialty ?? "",
      email: prof?.email ?? (user?.email ?? ""),
      clienteId: user?.clienteId ?? "",
      rolEmpresa: (eu?.rol_empresa as RolEmpresa | null) ?? "",
      areaId: eu?.area_id ?? "",
    }));
  }, [user]);

  const emailErr = user ? validarEmail(form.email) : null;
  const showCliente = user?.role === "cliente" || user?.role === "participante" || user?.role === "consultor";
  const showRolEmpresa = (user?.role === "cliente" || user?.role === "participante") && !!form.clienteId;
  const showArea = showRolEmpresa && form.rolEmpresa === "jefe_area";

  useEffect(() => {
    if (!showRolEmpresa || !form.clienteId) { setAreas([]); return; }
    supabase.from("manual_areas").select("id,nombre").eq("cliente_id", form.clienteId).order("orden")
      .then(({ data }) => setAreas(data ?? []));
  }, [showRolEmpresa, form.clienteId]);

  if (!user) return null;

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
              <Select value={form.clienteId || "__none__"} onValueChange={(v) => setForm({ ...form, clienteId: v === "__none__" ? "" : v, rolEmpresa: "", areaId: "" })}>
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
          {showRolEmpresa && (
            <div>
              <Label className="text-xs">Rol en empresa</Label>
              <Select value={form.rolEmpresa || "__none__"} onValueChange={(v) => setForm({ ...form, rolEmpresa: v === "__none__" ? "" : v as RolEmpresa, areaId: "" })}>
                <SelectTrigger><SelectValue placeholder="— sin especificar —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueño">Dueño / RRHH</SelectItem>
                  <SelectItem value="jefe_area">Jefe de Área</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {showArea && (
            <div>
              <Label className="text-xs">Área *</Label>
              <Select value={form.areaId || "__none__"} onValueChange={(v) => setForm({ ...form, areaId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona un área…" /></SelectTrigger>
                <SelectContent>
                  {areas.length === 0
                    ? <SelectItem value="__none__" disabled>Sin áreas disponibles</SelectItem>
                    : areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-gold hover:bg-gold/90 text-navy"
            disabled={saving || !!emailErr || (showArea && !form.areaId)}
            onClick={async () => {
              setSaving(true);
              await onSave({
                userId: user.id,
                name: form.name || null,
                company: form.company || null,
                specialty: form.specialty || null,
                ...(form.email && form.email !== user.email ? { email: form.email } : {}),
                ...(showCliente ? {
                  clienteId: form.clienteId || null,
                  ...(showRolEmpresa && form.rolEmpresa ? { rolEmpresa: form.rolEmpresa as RolEmpresa } : {}),
                  ...(showArea && form.areaId ? { areaId: form.areaId } : {}),
                } : {}),
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

// ─── Permisos por módulo ──────────────────────────────────────────────────────
function PermisosModuloAdmin() {
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [clientes, setClientes]     = useState<ClienteOpt[]>([]);
  const [permisos, setPermisos]     = useState<PermisoRow[]>([]);
  const [euOpts, setEuOpts]         = useState<EmpresaUsuarioOpt[]>([]);
  const [areas, setAreas]           = useState<AreaOpt[]>([]);
  const [loading, setLoading]       = useState(false);
  const [addOpen, setAddOpen]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("clientes").select("id,nombre_empresa").order("nombre_empresa")
      .then(({ data }) => setClientes(data ?? []));
  }, []);

  useEffect(() => {
    if (!selectedClienteId) { setPermisos([]); setEuOpts([]); setAreas([]); return; }
    setLoading(true);
    void (async () => {
      const { data: eu } = await (supabase as any)
        .from("empresa_usuarios").select("user_id,rol_empresa")
        .eq("cliente_id", selectedClienteId);

      const { data: permsData } = await (supabase as any)
        .from("permisos_usuario_modulo")
        .select("id,user_id,modulo,alcance_tipo,alcance_area_id,puede_ver,puede_editar")
        .eq("cliente_id", selectedClienteId);

      const { data: areasData } = await supabase
        .from("manual_areas").select("id,nombre")
        .eq("cliente_id", selectedClienteId).order("orden");

      const allIds = [...new Set([
        ...(eu ?? []).map((e: any) => e.user_id as string),
        ...(permsData ?? []).map((p: any) => p.user_id as string),
      ])];
      const { data: profs } = allIds.length
        ? await supabase.from("profiles").select("id,email,name").in("id", allIds)
        : { data: [] as { id: string; email: string; name: string | null }[] };

      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      const areaMap = new Map((areasData ?? []).map((a) => [a.id, a.nombre]));

      setEuOpts((eu ?? []).map((e: any) => {
        const prof = profMap.get(e.user_id);
        return { user_id: e.user_id, email: prof?.email ?? "", name: prof?.name ?? null, rol_empresa: e.rol_empresa };
      }));

      setPermisos((permsData ?? []).map((p: any) => {
        const prof = profMap.get(p.user_id);
        return {
          ...p,
          user_email: prof?.email ?? "—",
          user_name:  prof?.name  ?? null,
          alcance_area_nombre: p.alcance_area_id ? (areaMap.get(p.alcance_area_id) ?? "—") : null,
        };
      }));

      setAreas(areasData ?? []);
      setLoading(false);
    })();
  }, [selectedClienteId]);

  const eliminar = async () => {
    if (!deletingId) return;
    const { error } = await (supabase as any)
      .from("permisos_usuario_modulo").delete().eq("id", deletingId);
    if (error) { toast.error("Error al eliminar"); return; }
    setPermisos((prev) => prev.filter((p) => p.id !== deletingId));
    setDeletingId(null);
    toast.success("Permiso eliminado");
  };

  const moduloLabel = (val: string) =>
    MODULOS_PERMISO.find((m) => m.value === val)?.label ?? val;

  return (
    <div className="a360-card a360-card-lg p-6 space-y-5">
      <div>
        <h2 className="font-display text-xl text-navy">Permisos por módulo</h2>
        <p className="text-sm text-muted-foreground">
          Accesos horizontales (cross-área) limitados a funcionalidades específicas.
          Los permisos de jefe de área se gestionan en la pestaña Usuarios.
        </p>
      </div>

      <div className="max-w-xs">
        <Label className="text-xs">Empresa</Label>
        <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
          <SelectTrigger><SelectValue placeholder="Selecciona una empresa…" /></SelectTrigger>
          <SelectContent>
            {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedClienteId && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{permisos.length} permiso(s) asignado(s)</span>
            <Button size="sm" className="bg-navy hover:bg-navy/90 text-primary-foreground" onClick={() => setAddOpen(true)}>
              <UserPlus className="w-4 h-4 mr-1" />Agregar permiso
            </Button>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Cargando…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 px-2">Usuario</th>
                    <th className="text-left py-2 px-2">Módulo</th>
                    <th className="text-left py-2 px-2">Alcance</th>
                    <th className="text-center py-2 px-2 w-24">Puede ver</th>
                    <th className="text-center py-2 px-2 w-28">Puede editar</th>
                    <th className="text-right py-2 px-2 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {permisos.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-2">
                        <div className="font-medium text-navy">{p.user_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{p.user_email}</div>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{moduloLabel(p.modulo)}</td>
                      <td className="py-2 px-2">
                        {p.alcance_tipo === "todas"
                          ? <Badge variant="outline" className="text-[10px]">Todas las áreas</Badge>
                          : <span className="text-xs">{p.alcance_area_nombre}</span>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.puede_ver
                          ? <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">Sí</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {p.puede_editar
                          ? <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">Sí</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Eliminar permiso" onClick={() => setDeletingId(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {permisos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                        Sin permisos asignados para esta empresa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <AgregarPermisoDialog
        open={addOpen}
        euOpts={euOpts}
        areas={areas}
        onOpenChange={setAddOpen}
        onSubmit={async (row) => {
          const { data, error } = await (supabase as any)
            .from("permisos_usuario_modulo")
            .insert({ ...row, cliente_id: selectedClienteId })
            .select().single();
          if (error) {
            toast.error(error.code === "23505" ? "Este permiso ya existe para ese usuario y módulo" : "Error al guardar");
            return;
          }
          const eu = euOpts.find((e) => e.user_id === row.user_id);
          const an = row.alcance_area_id ? (areas.find((a) => a.id === row.alcance_area_id)?.nombre ?? "—") : null;
          setPermisos((prev) => [...prev, {
            ...data,
            user_email: eu?.email ?? "—",
            user_name: eu?.name ?? null,
            alcance_area_nombre: an,
          }]);
          setAddOpen(false);
          toast.success("Permiso agregado");
        }}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar permiso</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción revoca el acceso al módulo inmediatamente. ¿Confirmar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={eliminar}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AgregarPermisoDialog({ open, euOpts, areas, onOpenChange, onSubmit }: {
  open: boolean;
  euOpts: EmpresaUsuarioOpt[];
  areas: AreaOpt[];
  onOpenChange: (v: boolean) => void;
  onSubmit: (row: {
    user_id: string; modulo: string;
    alcance_tipo: "area" | "todas"; alcance_area_id: string | null;
    puede_ver: boolean; puede_editar: boolean;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    user_id: "", modulo: "manual_funciones_evaluaciones",
    alcance_tipo: "todas" as "area" | "todas", alcance_area_id: "",
    puede_ver: true, puede_editar: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({
      user_id: "", modulo: "manual_funciones_evaluaciones",
      alcance_tipo: "todas", alcance_area_id: "",
      puede_ver: true, puede_editar: false,
    });
  }, [open]);

  const setPuedeVer    = (v: boolean) => setForm((f) => ({ ...f, puede_ver: v,    puede_editar: v ? f.puede_editar : false }));
  const setPuedeEditar = (v: boolean) => setForm((f) => ({ ...f, puede_editar: v, puede_ver: v ? true : f.puede_ver }));

  const canSubmit = !!form.user_id && (form.alcance_tipo === "todas" || !!form.alcance_area_id);

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    await onSubmit({
      user_id: form.user_id, modulo: form.modulo,
      alcance_tipo: form.alcance_tipo,
      alcance_area_id: form.alcance_tipo === "area" ? form.alcance_area_id || null : null,
      puede_ver: form.puede_ver, puede_editar: form.puede_editar,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Agregar permiso de módulo</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Usuario *</Label>
            <Select value={form.user_id} onValueChange={(v) => setForm((f) => ({ ...f, user_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecciona un usuario…" /></SelectTrigger>
              <SelectContent>
                {euOpts.map((eu) => (
                  <SelectItem key={eu.user_id} value={eu.user_id}>
                    {eu.name ? `${eu.name} · ${eu.rol_empresa} (${eu.email})` : `${eu.email} · ${eu.rol_empresa}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Módulo *</Label>
            <Select value={form.modulo} onValueChange={(v) => setForm((f) => ({ ...f, modulo: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODULOS_PERMISO.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Alcance *</Label>
            <div className="flex gap-4">
              {(["todas", "area"] as const).map((tipo) => (
                <label key={tipo} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio" checked={form.alcance_tipo === tipo}
                    onChange={() => setForm((f) => ({ ...f, alcance_tipo: tipo, alcance_area_id: "" }))}
                    className="accent-navy"
                  />
                  {tipo === "todas" ? "Todas las áreas" : "Área específica"}
                </label>
              ))}
            </div>
            {form.alcance_tipo === "area" && (
              <Select
                value={form.alcance_area_id || "__none__"}
                onValueChange={(v) => setForm((f) => ({ ...f, alcance_area_id: v === "__none__" ? "" : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona un área…" /></SelectTrigger>
                <SelectContent>
                  {areas.length === 0
                    ? <SelectItem value="__none__" disabled>Sin áreas disponibles</SelectItem>
                    : areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Capacidades</Label>
            <div className="rounded-lg border divide-y">
              {([
                { key: "puede_ver",    label: "Puede ver",    desc: "Lectura de evaluaciones",                            val: form.puede_ver,    set: setPuedeVer },
                { key: "puede_editar", label: "Puede editar", desc: "Crear y modificar evaluaciones (implica puede ver)", val: form.puede_editar, set: setPuedeEditar },
              ] as const).map((cap) => (
                <label key={cap.key} className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/30">
                  <div>
                    <div className="text-sm font-medium">{cap.label}</div>
                    <div className="text-xs text-muted-foreground">{cap.desc}</div>
                  </div>
                  <input
                    type="checkbox" checked={cap.val}
                    onChange={(e) => cap.set(e.target.checked)}
                    className="w-4 h-4 accent-navy"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-gold hover:bg-gold/90 text-navy" disabled={saving || !canSubmit} onClick={submit}>
            {saving ? "Guardando…" : "Agregar permiso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
