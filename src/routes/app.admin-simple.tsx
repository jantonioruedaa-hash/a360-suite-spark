// @ts-nocheck
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  adminCreateUser, adminInviteUser, adminUpdateProfile,
  adminResetPassword, adminDeleteUser, adminListUsersExtra, adminToggleBan,
  adminGetLicenseStatus,
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
  CreditCard, Plus, Layers, ScanSearch, Compass, HeartHandshake,
  GraduationCap, TrendingUp, Megaphone, ClipboardList, History, BookOpen, Network,
} from "lucide-react";
import { MODULOS_PERMISO } from "@/routes/app.configuracion";
import {
  adminListPosiciones, adminCreatePosicion, adminUpdatePosicionModulos,
  adminDeletePosicion, adminAplicarPosicion,
} from "@/lib/posiciones.functions";
import type { LucideIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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
  plan_licencia: string;
  activo: boolean;
  created_at: string;
}

interface ConsultorOpt {
  id: string;
  email: string;
  name: string | null;
}

interface PlanRow {
  id: string;
  nombre: string;
  precio: number | null;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  modulos: string[];
  empresas_count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES: AppRole[] = ["admin", "consultor", "cliente", "participante"];
const PRIORITY: AppRole[] = ["admin", "consultor", "cliente", "participante"];

const PLANES_LICENCIA = [
  { value: "esencial",      label: "Esencial"      },
  { value: "profesional",   label: "Profesional"   },
  { value: "corporativo",   label: "Corporativo"   },
  { value: "premium",       label: "Premium"       },
  { value: "personalizado", label: "Personalizado" },
] as const;

// IMPORTANTE: al agregar un modulo_slug nuevo a plan_modulos en Supabase,
// añadirlo también aquí para que sea visible y toggleable en el Panel Admin.
const MODULOS: {
  slug: string;
  label: string;
  descripcion: string;
  icon: LucideIcon;
}[] = [
  { slug: "side",                 label: "Diagnóstico SIDE",    descripcion: "Diagnóstico integral empresarial",          icon: ScanSearch      },
  { slug: "side_historial",       label: "Historial SIDE",      descripcion: "Historial completo de diagnósticos SIDE",   icon: History         },
  { slug: "plan_estrategico",     label: "Plan Estratégico",    descripcion: "Planeación estratégica con BSC",            icon: Compass         },
  { slug: "coaching",             label: "Coaching A360",       descripcion: "Acompañamiento ejecutivo",                  icon: HeartHandshake  },
  { slug: "coaching_metodologia", label: "Metodología Coaching",descripcion: "Acceso a la metodología del programa",      icon: BookOpen        },
  { slug: "coaching_resultados",  label: "Resultados Coaching", descripcion: "Delta Radar + progreso por etapa",          icon: TrendingUp      },
  { slug: "lee",                  label: "Programa LEE",        descripcion: "Liderazgo Empresarial Evolutivo",           icon: GraduationCap   },
  { slug: "kpis",                 label: "Seguimiento KPIs",    descripcion: "Tablero de indicadores y BSC",              icon: TrendingUp      },
  { slug: "marketing_digital",    label: "Marketing Digital",   descripcion: "Estrategia de crecimiento digital",         icon: Megaphone       },
  { slug: "manual_funciones",     label: "Manual de Funciones", descripcion: "Descripción de cargos y competencias",      icon: ClipboardList   },
];

type ModuloSlug = string;

function moduloLabel(slug: string): string {
  return MODULOS.find((m) => m.slug === slug)?.label ?? slug;
}

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
  { id: "resumen",    label: "Resumen",    icon: BarChart3 },
  { id: "usuarios",  label: "Usuarios",   icon: Users     },
  { id: "clientes",  label: "Clientes",   icon: Briefcase },
  { id: "planes",    label: "Planes",     icon: CreditCard},
  { id: "modulos",   label: "Módulos",    icon: Layers    },
  { id: "posiciones",label: "Posiciones", icon: Network   },
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
      {/* ── Aurora V2 Header ─────────────────────────────────────────────────── */}
      <div
        className="rounded-xl px-6 py-5 mb-6 flex items-center gap-4 shadow-md"
        style={{ background: "linear-gradient(135deg, var(--h-from), var(--h-to))" }}
      >
        <ShieldCheck className="w-7 h-7 shrink-0" style={{ color: "rgba(255,255,255,0.85)" }} />
        <div>
          <h1 className="font-display text-2xl text-white font-semibold">Panel de Administración</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
            A360SP — Gestión completa de usuarios y plataforma
          </p>
        </div>
      </div>

      {/* ── Aurora V2 Tabs ────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all rounded-t-lg border-b-[3px] -mb-px ${
              tab === t.id
                ? "text-white"
                : "border-transparent text-muted-foreground hover:bg-[var(--acc2)] hover:text-navy"
            }`}
            style={
              tab === t.id
                ? { background: "var(--h-from)", borderBottomColor: "var(--h-acc)" }
                : undefined
            }
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen"    && <TabResumen />}
      {tab === "usuarios"  && <TabUsuarios />}
      {tab === "clientes"  && <TabClientes />}
      {tab === "planes"    && <TabPlanes />}
      {tab === "modulos"   && <TabModulos />}
      {tab === "posiciones"&& <TabPosiciones />}
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
        <div
          key={c.label}
          className="rounded-xl border border-border bg-background p-5 shadow-sm transition-shadow hover:shadow-md"
          style={{ borderLeft: "4px solid var(--h-acc)" }}
        >
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">{c.label}</p>
          <p className="text-4xl font-bold font-display leading-none" style={{ color: "var(--h-from)" }}>
            {c.value}
          </p>
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

  const createFn        = useServerFn(adminCreateUser);
  const inviteFn        = useServerFn(adminInviteUser);
  const updateFn        = useServerFn(adminUpdateProfile);
  const resetFn         = useServerFn(adminResetPassword);
  const deleteFn        = useServerFn(adminDeleteUser);
  const listExtrasFn    = useServerFn(adminListUsersExtra);
  const banFn           = useServerFn(adminToggleBan);
  const aplicarPosFn    = useServerFn(adminAplicarPosicion);

  const token = useCallback(() => session?.access_token ?? undefined, [session?.access_token]);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: cs }, { data: eu }, extras] = await Promise.all([
      supabase.from("profiles").select("id,email,name,company,created_at").order("email"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("clientes").select("id,nombre_empresa,consultor_id").order("nombre_empresa"),
      supabase.from("empresa_usuarios").select("user_id,cliente_id"),
      listExtrasFn({ data: { accessToken: token() } }).catch(() => [] as { id: string; banned_until: string | null; last_sign_in_at: string | null }[]),
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

    const allCs = (cs ?? []) as Array<{ id: string; nombre_empresa: string; consultor_id: string | null }>;
    setClientes(allCs.map((c) => ({ id: c.id, nombre_empresa: c.nombre_empresa })));

    const clienteByUser = new Map<string, string>(
      (eu ?? []).map((e) => [e.user_id, e.cliente_id]),
    );

    setRows((profiles ?? []).map((p) => {
      const role = roleMap.get(p.id) ?? null;
      const link = allCs.find((c) =>
        role === "cliente" || role === "participante" ? clienteByUser.get(p.id) === c.id :
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
        <Select value={roleFilter || "__none__"} onValueChange={(v) => setRoleFilter(v === "__none__" ? "" : v as AppRole)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Todos los roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Todos</SelectItem>
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setCreateMode("invite"); setCreateOpen(true); }}
            style={{ borderColor: "var(--h-acc)", color: "var(--h-from)" }}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />Invitar
          </Button>
          <Button
            size="sm"
            className="text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--h-from)" }}
            onClick={() => { setCreateMode("create"); setCreateOpen(true); }}
          >
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
            <thead>
              <tr style={{ background: "var(--h-from)" }}>
                {["Usuario", "Empresa", "Rol", "Último acceso", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "rgba(255,255,255,0.85)" }}>
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
              {filtered.map((u, idx) => (
                <tr
                  key={u.id}
                  className="border-b border-border transition-colors"
                  style={{ background: idx % 2 === 1 ? "var(--acc2)" : undefined }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--acc2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? "var(--acc2)" : ""; }}
                >
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
        accessToken={token()}
        onOpenChange={setCreateOpen}
        onSubmit={async (input) => {
          let userId;
          if (createMode === "invite") {
            const res = await inviteFn({ data: { ...input, accessToken: token(), redirectTo: `${window.location.origin}/login` } });
            userId = res?.id;
            toast.success("Invitación enviada");
          } else {
            const res = await createFn({ data: { ...input, accessToken: token(), password: input.password ?? "" } });
            userId = res?.id;
            toast.success("Usuario creado");
          }
          if (userId && input.clienteId && input.posicionId) {
            try {
              await aplicarPosFn({ data: { accessToken: token(), userId, clienteId: input.clienteId, posicionId: input.posicionId } });
            } catch (e) {
              toast.error("Usuario creado, pero falló la asignación de posición: " + (e instanceof Error ? e.message : "Error"));
            }
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
  role: "cliente" as AppRole, clienteId: "", posicionId: "",
  rolEmpresa: "colaborador", areaId: "",
};

function CrearOInvitarDialog({ open, mode, clientes, accessToken, onOpenChange, onSubmit }: {
  open: boolean;
  mode: "create" | "invite";
  clientes: { id: string; nombre_empresa: string }[];
  accessToken?: string;
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: {
    email: string; password?: string; name?: string; company?: string;
    specialty?: string; role: AppRole; clienteId?: string; posicionId?: string;
    rolEmpresa?: string; areaId?: string;
  }) => Promise<void>;
}) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [posiciones, setPosiciones] = useState([]);
  const [areas, setAreas] = useState([]);
  const listPosFn = useServerFn(adminListPosiciones);

  useEffect(() => {
    if (open) { setForm(EMPTY_FORM); setTouched(false); setPosiciones([]); setAreas([]); }
  }, [open]);

  useEffect(() => {
    if (!form.clienteId || form.role !== "cliente") { setPosiciones([]); return; }
    listPosFn({ data: { accessToken, clienteId: form.clienteId } })
      .then((data) => setPosiciones(data ?? []))
      .catch(() => setPosiciones([]));
  }, [form.clienteId, form.role, accessToken]);

  useEffect(() => {
    if (!form.clienteId || form.role !== "cliente") { setAreas([]); return; }
    supabase.from("manual_areas").select("id, nombre").eq("cliente_id", form.clienteId)
      .then(({ data }) => setAreas(data ?? []))
      .catch(() => setAreas([]));
  }, [form.clienteId, form.role]);

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
        posicionId: form.posicionId || undefined,
        rolEmpresa: (form.role === "cliente" && form.clienteId) ? form.rolEmpresa || undefined : undefined,
        areaId: (form.rolEmpresa === "jefe_area" && form.areaId) ? form.areaId : undefined,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden">
        <DialogHeader
          className="-mx-6 -mt-6 px-6 py-4 mb-2"
          style={{ background: "linear-gradient(135deg, var(--h-from), var(--h-to))" }}
        >
          <DialogTitle className="text-white">{isInvite ? "Invitar usuario por correo" : "Crear nuevo usuario"}</DialogTitle>
          {isInvite && (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
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
                onValueChange={(v) => setForm({ ...form, role: v as AppRole, clienteId: "", posicionId: "", rolEmpresa: "colaborador", areaId: "" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Empresa asignada</Label>
              <Select value={form.clienteId || "__none__"} onValueChange={(v) => setForm({ ...form, clienteId: v === "__none__" ? "" : v, posicionId: "", areaId: "" })}>
                <SelectTrigger><SelectValue placeholder="— Sin vincular —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sin vincular —</SelectItem>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.role === "cliente" && form.clienteId && posiciones.length > 0 && (
            <div>
              <Label className="text-xs">Posición (opcional)</Label>
              <Select value={form.posicionId || "__none__"} onValueChange={(v) => setForm({ ...form, posicionId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="— Sin posición —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sin posición —</SelectItem>
                  {posiciones.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.role === "cliente" && form.clienteId && (
            <div>
              <Label className="text-xs">Rol en la empresa</Label>
              <Select
                value={form.rolEmpresa}
                onValueChange={(v) => setForm({ ...form, rolEmpresa: v, areaId: v !== "jefe_area" ? "" : form.areaId })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                  <SelectItem value="jefe_area">Jefe de área</SelectItem>
                  <SelectItem value="dueño">Dueño</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {form.role === "cliente" && form.clienteId && form.rolEmpresa === "jefe_area" && (
            <div>
              <Label className="text-xs">Área asignada</Label>
              <Select value={form.areaId || "__none__"} onValueChange={(v) => setForm({ ...form, areaId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="— Seleccionar área —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Seleccionar área —</SelectItem>
                  {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={saving || !canSubmit}
            className="text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--h-from)" }}
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
      <DialogContent className="overflow-hidden">
        <DialogHeader
          className="-mx-6 -mt-6 px-6 py-4 mb-2"
          style={{ background: "linear-gradient(135deg, var(--h-from), var(--h-to))" }}
        >
          <DialogTitle className="text-white">Editar usuario</DialogTitle>
          <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.75)" }}>{user.email}</p>
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
              <Select value={form.clienteId || "__none__"} onValueChange={(v) => setForm({ ...form, clienteId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="— Sin vincular —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sin vincular —</SelectItem>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            onClick={save}
            disabled={saving}
            className="text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--h-from)" }}
          >
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
      <DialogContent className="overflow-hidden">
        <DialogHeader
          className="-mx-6 -mt-6 px-6 py-4 mb-2"
          style={{ background: "linear-gradient(135deg, var(--h-from), var(--h-to))" }}
        >
          <DialogTitle className="text-white">Restablecer contraseña</DialogTitle>
          <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.75)" }}>{user.email}</p>
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
                  mode === id ? "text-white" : "text-muted-foreground hover:bg-[var(--acc2)]"
                }`}
                style={mode === id ? { background: "var(--h-from)" } : undefined}
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
          <Button
            onClick={submit}
            disabled={saving}
            className="text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--h-from)" }}
          >
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
  const { session } = useAuth();
  const licenseStatusFn = useServerFn(adminGetLicenseStatus);

  const [clientes, setClientes]       = useState<ClienteRow[]>([]);
  const [consultores, setConsultores] = useState<ConsultorOpt[]>([]);
  const [profileMap, setProfileMap]   = useState<Map<string, { name: string | null; email: string }>>(new Map());
  const [companyMembersMap, setCompanyMembersMap] = useState<Map<string, { duenos: number; colaboradores: number }>>(new Map());
  const [licenseMap, setLicenseMap]   = useState<Map<string, { disponibles: number; usadas: number; total: number } | null>>(new Map());
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "activo" | "inactivo">("");
  const [editing, setEditing]         = useState<ClienteRow | null>(null);
  const [expanded, setExpanded]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: clientesData }, { data: consultorRoles }, { data: euData }] = await Promise.all([
      supabase.from("clientes").select("*").order("nombre_empresa"),
      supabase.from("user_roles").select("user_id").in("role", ["consultor", "admin"]),
      supabase.from("empresa_usuarios").select("cliente_id,rol_empresa"),
    ]);

    const allIds = new Set<string>();
    (consultorRoles ?? []).forEach((r) => allIds.add(r.user_id as string));

    const profiles = allIds.size > 0
      ? ((await supabase.from("profiles").select("id,email,name").in("id", [...allIds])).data ?? [])
      : [];

    const pMap = new Map<string, { name: string | null; email: string }>();
    profiles.forEach((p) => pMap.set(p.id, { name: p.name, email: p.email }));

    const membersMap = new Map<string, { duenos: number; colaboradores: number }>();
    (euData ?? []).forEach((eu) => {
      const cur = membersMap.get(eu.cliente_id) ?? { duenos: 0, colaboradores: 0 };
      if (eu.rol_empresa === "dueño") cur.duenos++;
      else cur.colaboradores++;
      membersMap.set(eu.cliente_id, cur);
    });

    const consultorIds = new Set((consultorRoles ?? []).map((r) => r.user_id as string));
    setClientes((clientesData ?? []) as ClienteRow[]);
    setConsultores(profiles.filter((p) => consultorIds.has(p.id)) as ConsultorOpt[]);
    setProfileMap(pMap);
    setCompanyMembersMap(membersMap);
    setLoading(false);

    // Load license statuses via server function (uses supabaseAdmin, not client)
    const token = session?.access_token;
    if (token && (clientesData ?? []).length > 0) {
      const results = await Promise.allSettled(
        (clientesData ?? []).map((c) =>
          licenseStatusFn({ data: { clienteId: c.id, accessToken: token } })
            .then((s) => [c.id, s] as const)
        )
      );
      const lMap = new Map<string, { disponibles: number; usadas: number; total: number } | null>();
      results.forEach((r) => {
        if (r.status === "fulfilled") lMap.set(r.value[0], r.value[1]);
        // rejected: key absent, badge simply won't render
      });
      setLicenseMap(lMap);
    }
  }, [session?.access_token, licenseStatusFn]);

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
        <Select value={statusFilter || "__none__"} onValueChange={(v) => setStatusFilter(v === "__none__" ? "" : v as "activo" | "inactivo")}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Todos</SelectItem>
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
            <thead>
              <tr style={{ background: "var(--h-from)" }}>
                {["Empresa", "Plan", "Consultor", "Usuario portal", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "rgba(255,255,255,0.85)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => {
                const consultor = c.consultor_id ? profileMap.get(c.consultor_id) : null;
                const members   = companyMembersMap.get(c.id);
                const planLabel = PLANES_LICENCIA.find((p) => p.value === c.plan_licencia)?.label ?? c.plan_licencia;
                const isOpen     = expanded === c.id;
                const lic        = licenseMap.get(c.id) ?? null;
                const licColor   = !lic ? "" : lic.disponibles > 2
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : lic.disponibles > 0
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-red-50 text-red-700 border-red-200";

                return (
                  <Fragment key={c.id}>
                    <tr
                      className={`border-b border-border transition-colors ${!c.activo ? "opacity-60" : ""}`}
                      style={{ background: idx % 2 === 1 ? "var(--acc2)" : undefined }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--acc2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? "var(--acc2)" : ""; }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-navy">{c.nombre_empresa}</div>
                        {lic && (
                          <span className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${licColor}`}>
                            {lic.usadas}/{lic.total} licencias
                          </span>
                        )}
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
                        {members && (members.duenos + members.colaboradores) > 0 ? (
                          <div className="text-xs text-navy">
                            {members.duenos} dueño{members.duenos !== 1 ? "s" : ""}{" · "}{members.colaboradores} colaborador{members.colaboradores !== 1 ? "es" : ""}
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

// ─── Tab: Planes ─────────────────────────────────────────────────────────────

function TabPlanes() {
  const [planes, setPlanes]     = useState<PlanRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]   = useState<PlanRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: planesData }, { data: modulosData }, { data: epData }] = await Promise.all([
      supabase.from("planes").select("*").order("precio"),
      supabase.from("plan_modulos").select("plan_id,modulo_slug"),
      supabase.from("empresa_plan").select("plan_id").eq("activo", true),
    ]);

    const modulosMap = new Map<string, string[]>();
    (modulosData ?? []).forEach(({ plan_id, modulo_slug }: { plan_id: string; modulo_slug: string }) => {
      if (!modulosMap.has(plan_id)) modulosMap.set(plan_id, []);
      modulosMap.get(plan_id)!.push(modulo_slug);
    });

    const empresasCount = new Map<string, number>();
    (epData ?? []).forEach(({ plan_id }: { plan_id: string }) => {
      empresasCount.set(plan_id, (empresasCount.get(plan_id) ?? 0) + 1);
    });

    setPlanes((planesData ?? []).map((p) => ({
      id:             p.id,
      nombre:         p.nombre,
      precio:         p.precio,
      descripcion:    p.descripcion,
      activo:         p.activo,
      created_at:     p.created_at,
      modulos:        modulosMap.get(p.id) ?? [],
      empresas_count: empresasCount.get(p.id) ?? 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleActivo = async (p: PlanRow) => {
    const { error } = await supabase.from("planes").update({ activo: !p.activo }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success(p.activo ? "Plan desactivado" : "Plan activado");
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground flex-1">
          {planes.length} plan{planes.length !== 1 ? "es" : ""}
        </span>
        <Button size="sm" variant="ghost" onClick={load} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </Button>
        <Button
          size="sm"
          className="text-white hover:opacity-90 transition-opacity"
          style={{ background: "var(--h-from)" }}
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Nuevo plan
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-navy" /></div>
      ) : planes.length === 0 ? (
        <div className="rounded-lg border border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No hay planes configurados</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {planes.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border border-border bg-background p-5 shadow-sm flex flex-col gap-3 ${!p.activo ? "opacity-60" : ""}`}
              style={{ borderTop: "4px solid var(--h-acc)" }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-semibold truncate" style={{ color: "var(--h-from)" }}>{p.nombre}</h3>
                    {p.activo
                      ? <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 shrink-0">Activo</Badge>
                      : <Badge variant="destructive" className="text-[10px] shrink-0">Inactivo</Badge>}
                  </div>
                  {p.descripcion && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.descripcion}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {p.precio !== null ? (
                    <>
                      <span
                        className="text-xl font-bold font-display"
                        style={{ background: "linear-gradient(to right, var(--h-from), var(--h-to))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                      >
                        ${p.precio}
                      </span>
                      <span className="text-xs text-muted-foreground">/mes</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Sin precio</span>
                  )}
                </div>
              </div>

              {/* Módulos */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Módulos incluidos
                </p>
                {p.modulos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sin módulos asignados</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {p.modulos.map((slug) => (
                      <Badge
                        key={slug}
                        className="text-[10px] font-normal border-0"
                        style={{ background: "var(--acc2)", color: "var(--h-from)" }}
                      >
                        {moduloLabel(slug)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/60">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Briefcase className="w-3 h-3" />
                  <span>{p.empresas_count} empresa{p.empresas_count !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7" title="Editar plan"
                    onClick={() => { setEditing(p); setDialogOpen(true); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7"
                    title={p.activo ? "Desactivar plan" : "Activar plan"}
                    onClick={() => toggleActivo(p)}
                  >
                    {p.activo
                      ? <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanDialog
        open={dialogOpen}
        plan={editing}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}
        onSave={async () => { setDialogOpen(false); setEditing(null); await load(); }}
      />
    </div>
  );
}

// ─── Dialog: Crear / Editar plan ──────────────────────────────────────────────

const EMPTY_PLAN = {
  nombre: "",
  precio: "",
  descripcion: "",
  modulos: [] as ModuloSlug[],
  activo: true,
};

function PlanDialog({ open, plan, onOpenChange, onSave }: {
  open: boolean;
  plan: PlanRow | null;
  onOpenChange: (v: boolean) => void;
  onSave: () => Promise<void>;
}) {
  const isEdit = !!plan;
  const [form, setForm]     = useState(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (plan) {
        setForm({
          nombre:      plan.nombre,
          precio:      plan.precio !== null ? String(plan.precio) : "",
          descripcion: plan.descripcion ?? "",
          modulos:     plan.modulos as ModuloSlug[],
          activo:      plan.activo,
        });
      } else {
        setForm(EMPTY_PLAN);
      }
    }
  }, [open, plan]);

  const toggleModulo = (slug: ModuloSlug) => {
    setForm((prev) => ({
      ...prev,
      modulos: prev.modulos.includes(slug)
        ? prev.modulos.filter((s) => s !== slug)
        : [...prev.modulos, slug],
    }));
  };

  const save = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre del plan es requerido"); return; }
    setSaving(true);
    try {
      const payload = {
        nombre:      form.nombre.trim(),
        precio:      form.precio !== "" ? Number(form.precio) : null,
        descripcion: form.descripcion.trim() || null,
        activo:      form.activo,
      };

      if (isEdit) {
        const { error } = await supabase.from("planes").update(payload).eq("id", plan!.id);
        if (error) throw new Error(error.message);

        const { error: delErr } = await supabase.from("plan_modulos").delete().eq("plan_id", plan!.id);
        if (delErr) throw new Error(delErr.message);

        if (form.modulos.length > 0) {
          const { error: insErr } = await supabase.from("plan_modulos").insert(
            form.modulos.map((slug) => ({ plan_id: plan!.id, modulo_slug: slug })),
          );
          if (insErr) throw new Error(insErr.message);
        }
        toast.success("Plan actualizado");
      } else {
        const { data: created, error } = await supabase.from("planes").insert(payload).select("id").single();
        if (error || !created) throw new Error(error?.message ?? "Error al crear plan");

        if (form.modulos.length > 0) {
          const { error: insErr } = await supabase.from("plan_modulos").insert(
            form.modulos.map((slug) => ({ plan_id: created.id, modulo_slug: slug })),
          );
          if (insErr) throw new Error(insErr.message);
        }
        toast.success("Plan creado");
      }

      await onSave();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden">
        <DialogHeader
          className="-mx-6 -mt-6 px-6 py-4 mb-2"
          style={{ background: "linear-gradient(135deg, var(--h-from), var(--h-to))" }}
        >
          <DialogTitle className="text-white">{isEdit ? "Editar plan" : "Nuevo plan"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <Label className="text-xs">Nombre del plan *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Enterprise"
              />
            </div>
            <div>
              <Label className="text-xs">Precio mensual (USD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={(e) => setForm((p) => ({ ...p, precio: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Descripción</Label>
            <Textarea
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripción breve del plan…"
              rows={2}
              className="resize-none"
            />
          </div>

          <div>
            <Label className="text-xs block mb-2">Módulos incluidos</Label>
            <div className="grid grid-cols-1 gap-2">
              {MODULOS.map(({ slug, label }) => (
                <div key={slug} className="flex items-center gap-2.5">
                  <Checkbox
                    id={`mod-${slug}`}
                    checked={form.modulos.includes(slug as ModuloSlug)}
                    onCheckedChange={() => toggleModulo(slug as ModuloSlug)}
                  />
                  <label htmlFor={`mod-${slug}`} className="text-sm cursor-pointer select-none">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-border/60">
            <Checkbox
              id="plan-activo"
              checked={form.activo}
              onCheckedChange={(v) => setForm((p) => ({ ...p, activo: !!v }))}
            />
            <label htmlFor="plan-activo" className="text-xs cursor-pointer select-none">Plan activo</label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button
            onClick={save}
            disabled={saving || !form.nombre.trim()}
            className="text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--h-from)" }}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: Módulos ────────────────────────────────────────────────────────────

type ModuloConPlanes = {
  slug: string;
  label: string;
  descripcion: string;
  icon: LucideIcon;
  planes: { id: string; nombre: string; incluido: boolean; activo: boolean }[];
};

function TabModulos() {
  const [modulos, setModulos]   = useState<ModuloConPlanes[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState<string | null>(null); // "slug:plan_id"

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: planesData }, { data: modulosData }] = await Promise.all([
      supabase.from("planes").select("id,nombre,activo").order("precio"),
      supabase.from("plan_modulos").select("plan_id,modulo_slug"),
    ]);

    const incluidoSet = new Set<string>(
      (modulosData ?? []).map(({ plan_id, modulo_slug }: { plan_id: string; modulo_slug: string }) =>
        `${modulo_slug}:${plan_id}`,
      ),
    );

    const allPlanes = (planesData ?? []) as { id: string; nombre: string; activo: boolean }[];

    setModulos(
      MODULOS.map((m) => ({
        slug:       m.slug,
        label:      m.label,
        descripcion: m.descripcion,
        icon:       m.icon,
        planes:     allPlanes.map((p) => ({
          id:       p.id,
          nombre:   p.nombre,
          activo:   p.activo,
          incluido: incluidoSet.has(`${m.slug}:${p.id}`),
        })),
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (slug: string, planId: string, actualmente: boolean) => {
    const key = `${slug}:${planId}`;
    setToggling(key);
    try {
      if (actualmente) {
        const { error } = await supabase
          .from("plan_modulos")
          .delete()
          .eq("plan_id", planId)
          .eq("modulo_slug", slug);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("plan_modulos")
          .insert({ plan_id: planId, modulo_slug: slug });
        if (error) throw new Error(error.message);
      }
      setModulos((prev) =>
        prev.map((m) =>
          m.slug !== slug ? m : {
            ...m,
            planes: m.planes.map((p) =>
              p.id !== planId ? p : { ...p, incluido: !actualmente },
            ),
          },
        ),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar módulo");
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-navy" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground flex-1">
          {MODULOS.length} módulos disponibles en la plataforma
        </p>
        <Button size="sm" variant="ghost" onClick={load} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {modulos.map((m) => {
          const Icon = m.icon;
          const planesCount = m.planes.filter((p) => p.incluido).length;

          return (
            <div key={m.slug} className="rounded-xl border border-border bg-background p-5 shadow-sm flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--acc2)" }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: "var(--h-acc)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm" style={{ color: "var(--h-from)" }}>{m.label}</h3>
                    <Badge
                      className="text-[10px] font-normal border-0"
                      style={{ background: "var(--acc2)", color: "var(--h-from)" }}
                    >
                      {planesCount} plan{planesCount !== 1 ? "es" : ""}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.descripcion}</p>
                </div>
              </div>

              {/* Plan toggles */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Incluido en
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {m.planes.map((p) => {
                    const key = `${m.slug}:${p.id}`;
                    const isToggling = toggling === key;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <span className={`text-xs ${!p.activo ? "text-muted-foreground" : "text-navy"}`}>
                          {p.nombre}
                          {!p.activo && <span className="ml-1 text-[10px] italic">(inactivo)</span>}
                        </span>
                        <button
                          onClick={() => toggle(m.slug, p.id, p.incluido)}
                          disabled={isToggling}
                          title={p.incluido ? "Quitar de este plan" : "Agregar a este plan"}
                          className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{
                            background: p.incluido ? "var(--h-from)" : "rgba(0,0,0,0.15)",
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            ["--tw-ring-color" as any]: "var(--h-acc)",
                          }}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3 h-3 animate-spin text-white mx-auto" />
                          ) : (
                            <span
                              className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                                p.incluido ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
      <DialogContent className="max-w-lg overflow-hidden">
        <DialogHeader
          className="-mx-6 -mt-6 px-6 py-4 mb-2"
          style={{ background: "linear-gradient(135deg, var(--h-from), var(--h-to))" }}
        >
          <DialogTitle className="text-white">Editar empresa</DialogTitle>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>{cliente.nombre_empresa}</p>
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
              <Select value={form.consultor_id || "__none__"} onValueChange={(v) => f("consultor_id", v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="— Sin asignar —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sin asignar —</SelectItem>
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
            className="text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--h-from)" }}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: Posiciones ──────────────────────────────────────────────────────────

function TabPosiciones() {
  const { session } = useAuth();
  const token = useCallback(() => session?.access_token ?? undefined, [session?.access_token]);

  const [clientes, setClientes]          = useState([]);
  const [selectedClienteId, setSelected] = useState("");
  const [posiciones, setPosiciones]      = useState([]);
  const [loading, setLoading]            = useState(false);
  const [createOpen, setCreateOpen]      = useState(false);
  const [editingPos, setEditingPos]      = useState(null);
  const [deletingPos, setDeletingPos]    = useState(null);

  const listFn   = useServerFn(adminListPosiciones);
  const createFn = useServerFn(adminCreatePosicion);
  const updateFn = useServerFn(adminUpdatePosicionModulos);
  const deleteFn = useServerFn(adminDeletePosicion);

  useEffect(() => {
    supabase.from("clientes").select("id,nombre_empresa").order("nombre_empresa")
      .then(({ data }) => setClientes(data ?? []));
  }, []);

  const loadPosiciones = useCallback(async () => {
    if (!selectedClienteId) { setPosiciones([]); return; }
    setLoading(true);
    try {
      const data = await listFn({ data: { accessToken: token(), clienteId: selectedClienteId } });
      setPosiciones(data ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar posiciones");
    } finally {
      setLoading(false);
    }
  }, [selectedClienteId, listFn, token]);

  useEffect(() => { void loadPosiciones(); }, [loadPosiciones]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-sm font-medium whitespace-nowrap">Empresa:</Label>
        <Select
          value={selectedClienteId || "__none__"}
          onValueChange={(v) => setSelected(v === "__none__" ? "" : v)}
        >
          <SelectTrigger className="w-64"><SelectValue placeholder="Seleccionar empresa…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Seleccionar —</SelectItem>
            {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre_empresa}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedClienteId && (
          <Button
            size="sm"
            className="text-white hover:opacity-90 transition-opacity ml-auto"
            style={{ background: "var(--h-from)" }}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Nueva posición
          </Button>
        )}
      </div>

      {!selectedClienteId ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          Selecciona una empresa para ver y gestionar sus posiciones.
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-navy" />
        </div>
      ) : posiciones.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No hay posiciones configuradas para esta empresa.{" "}
          <button className="text-navy underline" onClick={() => setCreateOpen(true)}>
            Crear la primera
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {posiciones.map((pos) => (
            <div
              key={pos.id}
              className="rounded-lg border border-border p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-navy">{pos.nombre}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {pos.posicion_modulos_default?.length ?? 0}{" "}
                  módulo{(pos.posicion_modulos_default?.length ?? 0) !== 1 ? "s" : ""} configurado{(pos.posicion_modulos_default?.length ?? 0) !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setEditingPos(pos)}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar módulos
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeletingPos(pos)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CrearPosicionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (nombre) => {
          await createFn({ data: { accessToken: token(), clienteId: selectedClienteId, nombre, modulosDefault: [] } });
          toast.success("Posición creada");
          setCreateOpen(false);
          await loadPosiciones();
        }}
      />

      {editingPos && (
        <EditModulosDialog
          posicion={editingPos}
          onClose={() => setEditingPos(null)}
          onSave={async (modulosDefault) => {
            await updateFn({ data: { accessToken: token(), posicionId: editingPos.id, modulosDefault } });
            toast.success("Módulos actualizados");
            setEditingPos(null);
            await loadPosiciones();
          }}
        />
      )}

      <AlertDialog open={!!deletingPos} onOpenChange={(o) => !o && setDeletingPos(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar posición</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar <strong>{deletingPos?.nombre}</strong>? Los usuarios vinculados
              quedarán sin posición asignada pero conservarán sus permisos individuales.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deletingPos) return;
                try {
                  await deleteFn({ data: { accessToken: token(), posicionId: deletingPos.id } });
                  toast.success("Posición eliminada");
                  setDeletingPos(null);
                  await loadPosiciones();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Error al eliminar");
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Dialog: Crear Posición ───────────────────────────────────────────────────

function CrearPosicionDialog({ open, onOpenChange, onSubmit }) {
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setNombre(""); }, [open]);

  const submit = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    try { await onSubmit(nombre.trim()); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden">
        <DialogHeader
          className="-mx-6 -mt-6 px-6 py-4 mb-2"
          style={{ background: "linear-gradient(135deg, var(--h-from), var(--h-to))" }}
        >
          <DialogTitle className="text-white">Nueva posición</DialogTitle>
        </DialogHeader>
        <div>
          <Label className="text-xs">Nombre *</Label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Director General, Analista, Gerente…"
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={saving || !nombre.trim()}
            className="text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--h-from)" }}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear posición
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: Editar Módulos de Posición ───────────────────────────────────────

function EditModulosDialog({ posicion, onClose, onSave }) {
  const [estado, setEstado] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = {};
    MODULOS_PERMISO.forEach((m) => {
      const existing = (posicion.posicion_modulos_default ?? []).find(
        (x) => x.modulo === m.modulo && !x.seccion,
      );
      init[m.modulo] = existing
        ? { activo: true, puede_ver: existing.puede_ver, puede_editar: existing.puede_editar, puede_eliminar: existing.puede_eliminar }
        : { activo: false, puede_ver: true, puede_editar: false, puede_eliminar: false };
    });
    setEstado(init);
  }, [posicion]);

  const toggle = (modulo, key, value) =>
    setEstado((prev) => ({ ...prev, [modulo]: { ...prev[modulo], [key]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      const modulosDefault = Object.entries(estado)
        .filter(([, s]) => s.activo)
        .map(([modulo, s]) => ({
          modulo,
          seccion: null,
          puede_ver: s.puede_ver,
          puede_editar: s.puede_editar,
          puede_eliminar: s.puede_eliminar,
        }));
      await onSave(modulosDefault);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!posicion} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden">
        <DialogHeader
          className="-mx-6 -mt-6 px-6 py-4 mb-2"
          style={{ background: "linear-gradient(135deg, var(--h-from), var(--h-to))" }}
        >
          <DialogTitle className="text-white">Módulos — {posicion?.nombre}</DialogTitle>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
            Define qué puede hacer un usuario con esta posición al asignársela.
          </p>
        </DialogHeader>
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {MODULOS_PERMISO.map((m) => {
            const s = estado[m.modulo] ?? { activo: false, puede_ver: true, puede_editar: false, puede_eliminar: false };
            return (
              <div
                key={m.modulo}
                className={`rounded-lg border p-3 transition-colors ${s.activo ? "border-navy/30 bg-navy/5" : "border-border"}`}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={s.activo}
                    onCheckedChange={(v) => toggle(m.modulo, "activo", !!v)}
                  />
                  <span className="text-sm font-medium">{m.moduloLabel}</span>
                </label>
                {s.activo && (
                  <div className="ml-6 mt-2 flex gap-5 text-xs text-muted-foreground">
                    {[
                      { key: "puede_ver",      label: "Ver"      },
                      { key: "puede_editar",   label: "Editar"   },
                      { key: "puede_eliminar", label: "Eliminar" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
                        <Checkbox
                          checked={!!s[key]}
                          onCheckedChange={(v) => toggle(m.modulo, key, !!v)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            onClick={save}
            disabled={saving}
            className="text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--h-from)" }}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
