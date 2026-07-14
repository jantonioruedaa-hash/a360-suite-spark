import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  adminCreateUser, adminInviteUser, adminUpdateProfile,
  adminResetPassword, adminDeleteUser, adminListUsersExtra, adminToggleBan,
} from "@/lib/admin-users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, ShieldCheck, RefreshCw, UserPlus, Send,
  Pencil, KeyRound, Lock, Unlock, Trash2, Users, BarChart3, Briefcase, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsuarioRow {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: AppRole | null;
  banned: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  clienteId: string | null;
  clienteNombre: string | null;
}

interface ClienteRow {
  id: string;
  nombre_empresa: string;
  sector: string | null;
  tamano: string | null;
  pais: string | null;
  ciudad: string | null;
  web: string | null;
  consultor_id: string | null;
  cliente_user_id: string | null;
  plan_licencia: string;
  activo: boolean;
  created_at: string;
}

interface ConsultorOpt {
  id: string;
  email: string;
  name: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES: AppRole[] = ["admin", "consultor", "cliente", "participante"];
const PRIORITY: AppRole[] = ["admin", "consultor", "cliente", "participante"];

const PLANES_LICENCIA = [
  { value: "esencial",      label: "Esencial"      },
  { value: "profesional",   label: "Profesional"   },
  { value: "enterprise",    label: "Enterprise"    },
  { value: "personalizado", label: "Personalizado" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function evaluarPassword(pwd: string) {
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

function validarEmail(email: string): string | null {
  if (!email.trim()) return "El correo es requerido";
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) return "Correo inválido";
  return null;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/admin-simple")({
  component: AdminPage,
});

const TABS = [
  { id: "resumen",  label: "Resumen",  icon: BarChart3  },
  { id: "usuarios", label: "Usuarios", icon: Users      },
  { id: "clientes", label: "Clientes", icon: Briefcase  },
] as const;
type TabId = (typeof TABS)[number]["id"];

function AdminPage() {
  const { role: myRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("resumen");

  useEffect(() => {
    if (!authLoading && myRole !== "admin") void navigate({ to: "/app/dashboard" });
  }, [authLoading, myRole, navigate]);

  if (authLoading || myRole !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-navy" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-6 h-6 text-gold" />
        <div>
          <h1 className="font-display text-2xl text-navy">Panel Admin</h1>
          <p className="text-xs text-muted-foreground mt-0.5">A360SP — Gestión completa de usuarios y plataforma</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? "border-gold text-navy" : "border-transparent text-muted-foreground hover:text-navy"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen"  && <TabResumen />}
      {tab === "usuarios" && <TabUsuarios />}
      {tab === "clientes" && <TabClientes />}
    </div>
  );
}

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────

function TabResumen() {
  const [stats, setStats] = useState<{ total: number; byRole: Record<string, number>; clientes: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, { data: roles }, { data: cs }] = await Promise.all([
        supabase.from("profiles").select("id"),
        supabase.from("user_roles").select("role"),
        supabase.from("clientes").select("id").eq("activo", true),
      ]);
      const byRole: Record<string, number> = {};
      (roles ?? []).forEach((r) => { byRole[r.role] = (byRole[r.role] ?? 0) + 1; });
      setStats({ total: profiles?.length ?? 0, byRole, clientes: cs?.length ?? 0 });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-navy" /></div>;
  if (!stats) return null;

  const cards = [
    { label: "Usuarios totales",   value: stats.total,                    accent: "text-navy"        },
    { label: "Administradores",    value: stats.byRole.admin ?? 0,        accent: "text-gold"        },
    { label: "Consultores",        value: stats.byRole.consultor ?? 0,    accent: "text-blue-600"    },
    { label: "Clientes (portal)",  value: stats.byRole.cliente ?? 0,      accent: "text-emerald-600" },
    { label: "Participantes",      value: stats.byRole.participante ?? 0, accent: "text-purple-600"  },
    { label: "Empresas activas",   value: stats.clientes,                 accent: "text-orange-500"  },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">{c.label}</p>
          <p className={`text-4xl font-bold font-display leading-none ${c.accent}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Usuarios ────────────────────────────────────────────────────────────

function TabUsuarios() {
  const { user: me, session } = useAuth();
  const [rows, setRows]         = useState<UsuarioRow[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nombre_empresa: string }[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "">("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"create" | "invite">("create");
  const [editing, setEditing]       = useState<UsuarioRow | null>(null);
  const [resetting, setResetting]   = useState<UsuarioRow | null>(null);
  const [deleting, setDeleting]     = useState<UsuarioRow | null>(null);

  const createFn     = useServerFn(adminCreateUser);
  const inviteFn     = useServerFn(adminInviteUser);
  const updateFn     = useServerFn(adminUpdateProfile);
  const resetFn      = useServerFn(adminResetPassword);
  const deleteFn     = useServerFn(adminDeleteUser);
  const listExtrasFn = useServerFn(adminListUsersExtra);
  const banFn        = useServerFn(adminToggleBan);

  const token = useCallback(() => session?.access_token ?? undefined, [session?.access_token]);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: cs }, extras] = await Promise.all([
      supabase.from("profiles").select("id,email,name,company,created_at").order("email"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("clientes").select("id,nombre_empresa,cliente_user_id,consultor_id").order("nombre_empresa"),
      listExtrasFn({ data: {} }).catch(() => [] as { id: string; banned_until: string | null; last_sign_in_at: string | null }[]),
    ]);

    const extrasArr = Array.isArray(extras) ? extras : [];
    const roleMap = new Map<string, AppRole>();
    (roles ?? []).forEach((r) => {
      const cur = roleMap.get(r.user_id);
      const next = r.role as AppRole;
      if (!cur || PRIORITY.indexOf(next) < PRIORITY.indexOf(cur)) roleMap.set(r.user_id, next);
    });
    const banMap = new Map<string, boolean>();
    const lastMap = new Map<string, string | null>();
    extrasArr.forEach((e) => {
      banMap.set(e.id, !!(e.banned_until && new Date(e.banned_until).getTime() > Date.now()));
      lastMap.set(e.id, e.last_sign_in_at);
    });

    const allCs = (cs ?? []) as Array<{ id: string; nombre_empresa: string; cliente_user_id: string | null; consultor_id: string | null }>;
    setClientes(allCs.map((c) => ({ id: c.id, nombre_empresa: c.nombre_empresa })));

    setRows((profiles ?? []).map((p) => {
      const role = roleMap.get(p.id) ?? null;
      const link = allCs.find((c) =>
        role === "cliente" || role === "participante" ? c.cliente_user_id === p.id :
        role === "consultor" ? c.consultor_id === p.id : false,
      );
      return {
        id: p.id, email: p.email, name: p.name ?? null, company: p.company ?? null,
        role, banned: banMap.get(p.id) ?? false,
        last_sign_in_at: lastMap.get(p.id) ?? null,
        created_at: p.created_at,
        clienteId: link?.id ?? null, clienteNombre: link?.nombre_empresa ?? null,
      };
    }));
    setLoading(false);
  }, [listExtrasFn]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() =>
    rows.filter((r) => {
      if (roleFilter && r.role !== roleFilter) return false;
      if (!filter) return true;
      const q = filter.toLowerCase();
      return r.email.toLowerCase().includes(q) || (r.name ?? "").toLowerCase().includes(q);
    }),
  [rows, filter, roleFilter]);

  const cambiarRol = async (userId: string, nuevo: AppRole) => {
    try {
      await updateFn({ data: { accessToken: token(), userId, role: nuevo } });
      toast.success("Rol actualizado");
      setRows((r) => r.map((x) => x.id === userId ? { ...x, role: nuevo } : x));
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar por nombre o email…"
          className="max-w-xs"
        />
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as AppRole | "")}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Todos los roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-1">
          {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={load} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setCreateMode("invite"); setCreateOpen(true); }}>
            <Send className="w-3.5 h-3.5 mr-1.5" />Invitar
          </Button>
          <Button size="sm" className="bg-navy hover:bg-navy/90 text-white" onClick={() => { setCreateMode("create"); setCreateOpen(true); }}>
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />Nuevo usuario
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-navy" /></div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {["Usuario", "Empresa", "Rol", "Último acceso", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {filter || roleFilter ? "Sin resultados para esa búsqueda" : "No hay usuarios registrados"}
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy text-sm">
                      {u.name ?? <span className="text-muted-foreground italic">Sin nombre</span>}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {u.clienteNombre ?? <span className="italic text-xs">Sin vincular</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.role ?? ""}
                      onValueChange={(v) => cambiarRol(u.id, v as AppRole)}
                      disabled={u.id === me?.id}
                    >
                      <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize text-xs">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {u.id === me?.id && <div className="text-[10px] text-muted-foreground mt-1">Tu cuenta</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(u.last_sign_in_at)}
                  </td>
                  <td className="px-4 py-3">
                    {u.banned
                      ? <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>
                      : <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">Activo</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Editar" onClick={() => setEditing(u)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Restablecer contraseña" onClick={() => setResetting(u)}>
                        <KeyRound className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7"
                        title={u.banned ? "Reactivar" : "Bloquear"}
                        disabled={u.id === me?.id}
                        onClick={async () => {
                          try {
                            await banFn({ data: { accessToken: token(), userId: u.id, block: !u.banned } });
                            toast.success(u.banned ? "Usuario reactivado" : "Usuario bloqueado");
                            setRows((r) => r.map((x) => x.id === u.id ? { ...x, banned: !u.banned } : x));
                          } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
                        }}
                      >
                        {u.banned
                          ? <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          : <Lock className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title="Eliminar usuario"
                        disabled={u.id === me?.id}
                        onClick={() => setDeleting(u)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <strong>Bloquear</strong> impide el acceso sin borrar datos.{" "}
        <strong>Eliminar</strong> es permanente y desvincula clientes y sesiones.
      </p>

      {/* ── Dialogs ───────────────────────────────────────────────────────────── */}

      <CrearOInvitarDialog
        open={createOpen}
        mode={createMode}
        clientes={clientes}
        onOpenChange={setCreateOpen}
        onSubmit={async (input) => {
          if (createMode === "invite") {
            await inviteFn({ data: { ...input, accessToken: token(), redirectTo: `${window.location.origin}/login` } });
            toast.success("Invitación enviada");
          } else {
            await createFn({ data: { ...input, accessToken: token(), password: input.password ?? "" } });
            toast.success("Usuario creado");
          }
          setCreateOpen(false);
          await load();
        }}
      />

      <EditarDialog
        user={editing}
        clientes={clientes}
        onClose={() => setEditing(null)}
        onSave={async (input) => {
          await updateFn({ data: { ...input, accessToken: token() } });
          toast.success("Cambios guardados");
          setEditing(null);
          await load();
        }}
      />

      <ResetPasswordDialog
        user={resetting}
        onClose={() => setResetting(null)}
        onSubmit={async (input) => {
          const res = await resetFn({ data: { ...input, accessToken: token() } });
          toast.success(res.mode === "email" ? "Correo de restablecimiento enviado" : "Contraseña actualizada");
          setResetting(null);
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la cuenta de{" "}
              <strong>{deleting?.email}</strong> de forma permanente y desvinculará sus clientes y sesiones.
              Considera <strong>bloquear</strong> en su lugar para preservar el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteFn({ data: { accessToken: token(), userId: deleting.id } });
                  toast.success("Usuario eliminado");
                  setDeleting(null);
                  await load();
                } catch (e) { toast.error(e instanceof Error ? e.message : "Error al eliminar"); }
              }}
            >
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Dialog: Crear / Invitar ──────────────────────────────────────────────────

const EMPTY_FORM = {
  email: "", password: "", name: "", company: "", specialty: "",
  role: "cliente" as AppRole, clienteId: "",
};

function CrearOInvitarDialog({ open, mode, clientes, onOpenChange, onSubmit }: {
  open: boolean;
  mode: "create" | "invite";
  clientes: { id: string; nombre_empresa: string }[];
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: {
    email: string; password?: string; name?: string; company?: string;
    specialty?: string; role: AppRole; clienteId?: string;
  }) => Promise<void>;
}) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) { setForm(EMPTY_FORM); setTouched(false); }
  }, [open]);

  const emailErr = touched ? validarEmail(form.email) : null;
  const pwd = evaluarPassword(form.password);
  const isInvite = mode === "invite";
  const canSubmit = !validarEmail(form.email) && (isInvite || pwd.ok);

  const submit = async () => {
    setTouched(true);
    if (!canSubmit) { toast.error("Revisa los campos marcados"); return; }
    setSaving(true);
    try {
      await onSubmit({
        email: form.email.trim(),
        ...(isInvite ? {} : { password: form.password }),
        name: form.name || undefined,
        company: form.company || undefined,
        specialty: form.specialty || undefined,
        role: form.role,
        clienteId: form.clienteId || undefined,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isInvite ? "Invitar usuario por correo" : "Crear nuevo usuario"}</DialogTitle>
          {isInvite && (
            <p className="text-xs text-muted-foreground">
              El usuario recibirá un enlace para establecer su contraseña.
            </p>
          )}
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Correo *</Label>
            <Input
              type="email"
              value={form.email}
              onBlur={() => setTouched(true)}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              aria-invalid={!!emailErr}
            />
            {emailErr && <p className="text-xs text-destructive mt-1">{emailErr}</p>}
          </div>

          {!isInvite && (
            <div>
              <Label className="text-xs">Contraseña inicial *</Label>
              <Input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
              {form.password && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded ${i < pwd.score ? pwd.color : "bg-muted"}`} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Fortaleza: <strong>{pwd.label}</strong> · usa mayúsculas, números y símbolos
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Empresa</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Especialidad</Label>
            <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Rol</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as AppRole, clienteId: "" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Empresa asignada</Label>
              <Select value={form.clienteId} onValueChange={(v) => setForm({ ...form, clienteId: v })}>
                <SelectTrigger><SelectValue placeholder="— Sin vincular —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Sin vincular —</SelectItem>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={saving || !canSubmit}
            className="bg-navy hover:bg-navy/90 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isInvite ? "Enviar invitación" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: Editar ───────────────────────────────────────────────────────────

function EditarDialog({ user, clientes, onClose, onSave }: {
  user: UsuarioRow | null;
  clientes: { id: string; nombre_empresa: string }[];
  onClose: () => void;
  onSave: (input: {
    userId: string; name?: string | null; company?: string | null;
    role?: AppRole; clienteId?: string | null;
  }) => Promise<void>;
}) {
  const [form, setForm]     = useState({ name: "", company: "", role: "cliente" as AppRole, clienteId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        company: user.company ?? "",
        role: user.role ?? "cliente",
        clienteId: user.clienteId ?? "",
      });
    }
  }, [user]);

  if (!user) return null;

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        userId: user.id,
        name: form.name || null,
        company: form.company || null,
        role: form.role,
        clienteId: form.clienteId || null,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nombre completo</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Empresa</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Empresa asignada</Label>
              <Select value={form.clienteId} onValueChange={(v) => setForm({ ...form, clienteId: v })}>
                <SelectTrigger><SelectValue placeholder="— Sin vincular —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Sin vincular —</SelectItem>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-navy hover:bg-navy/90 text-white">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: Restablecer contraseña ──────────────────────────────────────────

function ResetPasswordDialog({ user, onClose, onSubmit }: {
  user: UsuarioRow | null;
  onClose: () => void;
  onSubmit: (input: {
    userId: string; newPassword?: string; sendEmail?: boolean; email?: string;
  }) => Promise<void>;
}) {
  const [mode, setMode]         = useState<"set" | "email">("set");
  const [password, setPassword] = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (user) { setPassword(""); setMode("set"); }
  }, [user]);

  if (!user) return null;

  const pwd = evaluarPassword(password);

  const submit = async () => {
    setSaving(true);
    try {
      if (mode === "set") {
        if (password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); setSaving(false); return; }
        await onSubmit({ userId: user.id, newPassword: password });
      } else {
        await onSubmit({ userId: user.id, sendEmail: true, email: user.email });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restablecer contraseña</DialogTitle>
          <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {([
              { id: "set" as const, label: "Establecer contraseña" },
              { id: "email" as const, label: "Enviar por correo" },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === id ? "bg-navy text-white" : "text-muted-foreground hover:text-navy"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "set" ? (
            <div>
              <Label className="text-xs">Nueva contraseña</Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              {password && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded ${i < pwd.score ? pwd.color : "bg-muted"}`} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Fortaleza: <strong>{pwd.label}</strong></p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
              Se enviará un correo a <strong>{user.email}</strong> con un enlace para restablecer la contraseña.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="bg-navy hover:bg-navy/90 text-white">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "set" ? "Actualizar contraseña" : "Enviar correo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: Clientes ────────────────────────────────────────────────────────────

function TabClientes() {
  const [clientes, setClientes]       = useState<ClienteRow[]>([]);
  const [consultores, setConsultores] = useState<ConsultorOpt[]>([]);
  const [profileMap, setProfileMap]   = useState<Map<string, { name: string | null; email: string }>>(new Map());
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "activo" | "inactivo">("");
  const [editing, setEditing]         = useState<ClienteRow | null>(null);
  const [expanded, setExpanded]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: clientesData }, { data: consultorRoles }] = await Promise.all([
      supabase.from("clientes").select("*").order("nombre_empresa"),
      supabase.from("user_roles").select("user_id").in("role", ["consultor", "admin"]),
    ]);

    const allIds = new Set<string>();
    (consultorRoles ?? []).forEach((r) => allIds.add(r.user_id as string));
    (clientesData ?? []).forEach((c) => { if (c.cliente_user_id) allIds.add(c.cliente_user_id as string); });

    const profiles = allIds.size > 0
      ? ((await supabase.from("profiles").select("id,email,name").in("id", [...allIds])).data ?? [])
      : [];

    const pMap = new Map<string, { name: string | null; email: string }>();
    profiles.forEach((p) => pMap.set(p.id, { name: p.name, email: p.email }));

    const consultorIds = new Set((consultorRoles ?? []).map((r) => r.user_id as string));
    setClientes((clientesData ?? []) as ClienteRow[]);
    setConsultores(profiles.filter((p) => consultorIds.has(p.id)) as ConsultorOpt[]);
    setProfileMap(pMap);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(
    () => clientes.filter((c) => {
      if (statusFilter === "activo"   && !c.activo) return false;
      if (statusFilter === "inactivo" &&  c.activo) return false;
      if (search && !c.nombre_empresa.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [clientes, search, statusFilter],
  );

  const toggleActivo = async (c: ClienteRow) => {
    const { error } = await supabase.from("clientes").update({ activo: !c.activo }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success(c.activo ? "Empresa desactivada" : "Empresa activada");
    void load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-navy" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar empresa…"
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "" | "activo" | "inactivo")}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} empresa{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button size="sm" variant="ghost" onClick={load} className="ml-auto gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search || statusFilter ? "Sin resultados para esa búsqueda" : "No hay empresas registradas"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {["Empresa", "Plan", "Consultor", "Usuario portal", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const consultor  = c.consultor_id    ? profileMap.get(c.consultor_id)    : null;
                const portalUser = c.cliente_user_id ? profileMap.get(c.cliente_user_id) : null;
                const planLabel  = PLANES_LICENCIA.find((p) => p.value === c.plan_licencia)?.label ?? c.plan_licencia;
                const isOpen     = expanded === c.id;

                return (
                  <Fragment key={c.id}>
                    <tr className={`border-b border-border hover:bg-muted/10 transition-colors ${!c.activo ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-navy">{c.nombre_empresa}</div>
                        {c.sector && <div className="text-xs text-muted-foreground">{c.sector}</div>}
                        {(c.ciudad || c.pais) && (
                          <div className="text-xs text-muted-foreground">
                            {[c.ciudad, c.pais].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-medium capitalize">
                          {planLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {consultor
                          ? <span className="text-navy">{consultor.name ?? consultor.email}</span>
                          : <span className="italic text-xs text-muted-foreground">Sin asignar</span>}
                      </td>
                      <td className="px-4 py-3">
                        {portalUser ? (
                          <div>
                            <div className="text-xs text-navy">{portalUser.name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground font-mono">{portalUser.email}</div>
                          </div>
                        ) : (
                          <span className="italic text-xs text-muted-foreground">Sin vincular</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.activo
                          ? <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">Activo</Badge>
                          : <Badge variant="destructive" className="text-[10px]">Inactivo</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Editar" onClick={() => setEditing(c)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            title={c.activo ? "Desactivar" : "Activar"}
                            onClick={() => toggleActivo(c)}
                          >
                            {c.activo
                              ? <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                              : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            title="Ver detalles"
                            onClick={() => setExpanded(isOpen ? null : c.id)}
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-border bg-muted/5">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-xs">
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Sector</p>
                              <p className="text-navy">{c.sector ?? "—"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Tamaño</p>
                              <p className="text-navy capitalize">{c.tamano ?? "—"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Ciudad / País</p>
                              <p className="text-navy">{[c.ciudad, c.pais].filter(Boolean).join(", ") || "—"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Sitio web</p>
                              {c.web
                                ? <a href={c.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">{c.web}</a>
                                : <p className="text-navy">—</p>}
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Miembro desde</p>
                              <p className="text-navy">{fmtDate(c.created_at)}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EditarClienteDialog
        cliente={editing}
        consultores={consultores}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          const { error } = await supabase.from("clientes").update(data).eq("id", editing!.id);
          if (error) throw new Error(error.message);
          toast.success("Empresa actualizada");
          setEditing(null);
          void load();
        }}
      />
    </div>
  );
}

// ─── Dialog: Editar cliente ───────────────────────────────────────────────────

type ClienteUpdateData = {
  nombre_empresa: string;
  sector: string | null;
  tamano: string | null;
  ciudad: string | null;
  pais: string | null;
  web: string | null;
  plan_licencia: string;
  consultor_id: string | null;
  activo: boolean;
};

function EditarClienteDialog({ cliente, consultores, onClose, onSave }: {
  cliente: ClienteRow | null;
  consultores: ConsultorOpt[];
  onClose: () => void;
  onSave: (data: ClienteUpdateData) => Promise<void>;
}) {
  const EMPTY = { nombre_empresa: "", sector: "", tamano: "", ciudad: "", pais: "", web: "", plan_licencia: "esencial", consultor_id: "", activo: true };
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre_empresa: cliente.nombre_empresa,
        sector:         cliente.sector         ?? "",
        tamano:         cliente.tamano         ?? "",
        ciudad:         cliente.ciudad         ?? "",
        pais:           cliente.pais           ?? "",
        web:            cliente.web            ?? "",
        plan_licencia:  cliente.plan_licencia,
        consultor_id:   cliente.consultor_id   ?? "",
        activo:         cliente.activo,
      });
    }
  }, [cliente]);

  if (!cliente) return null;

  const f = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.nombre_empresa.trim()) { toast.error("El nombre de empresa es requerido"); return; }
    setSaving(true);
    try {
      await onSave({
        nombre_empresa: form.nombre_empresa.trim(),
        sector:         form.sector        || null,
        tamano:         form.tamano        || null,
        ciudad:         form.ciudad        || null,
        pais:           form.pais          || null,
        web:            form.web           || null,
        plan_licencia:  form.plan_licencia,
        consultor_id:   form.consultor_id  || null,
        activo:         form.activo,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!cliente} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar empresa</DialogTitle>
          <p className="text-xs text-muted-foreground">{cliente.nombre_empresa}</p>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <Label className="text-xs">Nombre de empresa *</Label>
            <Input value={form.nombre_empresa} onChange={(e) => f("nombre_empresa", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Sector</Label>
              <Input value={form.sector} onChange={(e) => f("sector", e.target.value)} placeholder="Ej: Manufactura" />
            </div>
            <div>
              <Label className="text-xs">Tamaño</Label>
              <Select value={form.tamano} onValueChange={(v) => f("tamano", v)}>
                <SelectTrigger><SelectValue placeholder="— Seleccionar —" /></SelectTrigger>
                <SelectContent>
                  {["micro", "pequeña", "mediana", "grande"].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Ciudad</Label>
              <Input value={form.ciudad} onChange={(e) => f("ciudad", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">País</Label>
              <Input value={form.pais} onChange={(e) => f("pais", e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Sitio web</Label>
            <Input value={form.web} onChange={(e) => f("web", e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Plan</Label>
              <Select value={form.plan_licencia} onValueChange={(v) => f("plan_licencia", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANES_LICENCIA.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Consultor asignado</Label>
              <Select value={form.consultor_id} onValueChange={(v) => f("consultor_id", v)}>
                <SelectTrigger><SelectValue placeholder="— Sin asignar —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Sin asignar —</SelectItem>
                  {consultores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name ?? c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="empresa-activa"
              checked={form.activo}
              onChange={(e) => f("activo", e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="empresa-activa" className="text-xs cursor-pointer">Empresa activa</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            onClick={save}
            disabled={saving || !form.nombre_empresa.trim()}
            className="bg-navy hover:bg-navy/90 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
