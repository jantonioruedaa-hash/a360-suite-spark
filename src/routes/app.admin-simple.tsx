import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, Check, RefreshCw, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/app/admin-simple")({
  component: AdminSimplePage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: AppRole | null;
  created_at: string;
}

interface ClienteRow {
  id: string;
  nombre_empresa: string;
  consultor_id: string | null;
}

interface ConsultorOption {
  id: string;
  email: string;
  name: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY: AppRole[] = ["admin", "consultor", "cliente", "participante"];

const ROLE_BADGE: Record<string, string> = {
  admin:        "bg-gold/20 text-gold",
  consultor:    "bg-blue-100 text-blue-700",
  cliente:      "bg-green-100 text-green-700",
  participante: "bg-purple-100 text-purple-700",
};

function generatePassword(): string {
  const upper   = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower   = "abcdefghjkmnpqrstuvwxyz";
  const digits  = "23456789";
  const special = "!@#$%&*";
  const all     = upper + lower + digits + special;
  const rand    = (s: string) => s[Math.floor(Math.random() * s.length)];
  const pool    = [rand(upper), rand(lower), rand(digits), rand(special)];
  for (let i = 0; i < 8; i++) pool.push(rand(all));
  return pool.sort(() => Math.random() - 0.5).join("");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdminSimplePage() {
  const { role: myRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"usuarios" | "nuevo" | "clientes">("usuarios");

  useEffect(() => {
    if (!authLoading && myRole !== "admin") navigate({ to: "/app/dashboard" });
  }, [authLoading, myRole, navigate]);

  if (authLoading || myRole !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-navy" />
      </div>
    );
  }

  const TABS = [
    { id: "usuarios",  label: "Usuarios" },
    { id: "nuevo",     label: "Nuevo usuario" },
    { id: "clientes",  label: "Clientes" },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-6 h-6 text-gold" />
        <div>
          <h1 className="font-display text-2xl text-navy">Panel Admin</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gestión de usuarios y clientes</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? "border-gold text-navy"
                : "border-transparent text-muted-foreground hover:text-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "usuarios" && <TabUsuarios />}
      {tab === "nuevo"    && <TabNuevoUsuario />}
      {tab === "clientes" && <TabClientes />}
    </div>
  );
}

// ─── Tab: Usuarios ────────────────────────────────────────────────────────────

function TabUsuarios() {
  const [users, setUsers]           = useState<UserRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [pendingRoles, setPending]  = useState<Record<string, AppRole>>({});
  const [saving, setSaving]         = useState<Record<string, boolean>>({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id,email,name,created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const rows: UserRow[] = (profiles ?? []).map((p) => {
      const userRoles = (roles ?? [])
        .filter((r) => r.user_id === p.id)
        .map((r) => r.role as AppRole);
      return { ...p, role: PRIORITY.find((x) => userRoles.includes(x)) ?? null };
    });
    setUsers(rows);
    setLoading(false);
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const handleSaveRole = async (userId: string) => {
    const newRole = pendingRoles[userId];
    if (!newRole) return;
    setSaving((s) => ({ ...s, [userId]: true }));
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) {
      toast.error(delErr.message);
      setSaving((s) => ({ ...s, [userId]: false }));
      return;
    }
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (insErr) {
      toast.error(insErr.message);
      setSaving((s) => ({ ...s, [userId]: false }));
      return;
    }
    toast.success("Rol actualizado");
    setPending((p) => { const n = { ...p }; delete n[userId]; return n; });
    setSaving((s) => ({ ...s, [userId]: false }));
    void loadUsers();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-navy" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{users.length} usuario{users.length !== 1 ? "s" : ""}</p>
        <button onClick={loadUsers} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-navy transition-colors">
          <RefreshCw className="w-3 h-3" /> Actualizar
        </button>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {["Email", "Nombre", "Rol actual", "Cambiar a", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-navy/70">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Sin usuarios registrados</td></tr>
            )}
            {users.map((u) => {
              const pending  = pendingRoles[u.id];
              const isDirty  = !!pending && pending !== u.role;
              const isSaving = saving[u.id];
              return (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-sm">{u.name ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                      {u.role ?? "Sin rol"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={pending ?? u.role ?? "cliente"}
                      onChange={(e) => setPending((p) => ({ ...p, [u.id]: e.target.value as AppRole }))}
                      className="text-xs rounded border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold/50"
                    >
                      <option value="admin">admin</option>
                      <option value="consultor">consultor</option>
                      <option value="cliente">cliente</option>
                      <option value="participante">participante</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSaveRole(u.id)}
                      disabled={!isDirty || isSaving}
                      className="text-xs px-3 py-1.5 rounded bg-navy text-white disabled:opacity-30 hover:bg-navy/80 transition-colors inline-flex items-center gap-1.5"
                    >
                      {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                      Guardar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Nuevo Usuario ───────────────────────────────────────────────────────

function TabNuevoUsuario() {
  const [email,    setEmail]    = useState("");
  const [name,     setName]     = useState("");
  const [role,     setRole]     = useState<AppRole>("consultor");
  const [creating, setCreating] = useState(false);
  const [result,   setResult]   = useState<{ email: string; password: string } | null>(null);
  const [copied,   setCopied]   = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("El email es requerido"); return; }
    const password = generatePassword();
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim(), name: name.trim(), role, password }),
        },
      );
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResult({ email: email.trim(), password });
      setEmail(""); setName("");
      toast.success("Usuario creado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear usuario");
    } finally {
      setCreating(false);
    }
  };

  const copyPassword = () => {
    if (!result) return;
    void navigator.clipboard.writeText(result.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-md">
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            required
            className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Nombre completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: María García"
            className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AppRole)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <option value="admin">admin — Acceso completo</option>
            <option value="consultor">consultor — Gestiona clientes propios</option>
            <option value="cliente">cliente — Ve solo su portal</option>
            <option value="participante">participante — Solo programa LEE</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
          Se generará una contraseña temporal de 12 caracteres. El usuario puede cambiarla desde Configuración.
        </p>
        <button
          type="submit"
          disabled={creating}
          className="w-full py-2.5 rounded-md bg-navy text-white text-sm font-semibold disabled:opacity-50 hover:bg-navy/90 transition-colors inline-flex items-center justify-center gap-2"
        >
          {creating && <Loader2 className="w-4 h-4 animate-spin" />}
          Crear usuario
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800 mb-3">✓ Usuario creado correctamente</p>
          <div className="space-y-1 mb-3">
            <p className="text-xs text-green-700"><span className="font-medium">Email:</span> {result.email}</p>
            <p className="text-xs text-green-700"><span className="font-medium">Rol:</span> {role}</p>
          </div>
          <label className="block text-xs font-medium text-green-800 mb-1.5">Contraseña temporal</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm bg-white border border-green-200 rounded px-3 py-2 text-green-900 select-all">
              {result.password}
            </code>
            <button
              type="button"
              onClick={copyPassword}
              title="Copiar contraseña"
              className="shrink-0 p-2 rounded border border-green-200 bg-white text-green-700 hover:bg-green-50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-green-600 mt-2">
            Comparte esta contraseña con el usuario. El acceso es inmediato (email ya verificado).
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Clientes ────────────────────────────────────────────────────────────

function TabClientes() {
  const [clientes,    setClientes]    = useState<ClienteRow[]>([]);
  const [consultores, setConsultores] = useState<ConsultorOption[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<Record<string, string>>({});
  const [saving,      setSaving]      = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: clientesData }, { data: consultorRoles }] = await Promise.all([
      supabase.from("clientes").select("id,nombre_empresa,consultor_id").eq("activo", true).order("nombre_empresa"),
      supabase.from("user_roles").select("user_id").in("role", ["consultor", "admin"]),
    ]);
    const ids = (consultorRoles ?? []).map((r) => r.user_id as string);
    const consultorProfiles = ids.length > 0
      ? ((await supabase.from("profiles").select("id,email,name").in("id", ids)).data ?? [])
      : [];

    setClientes(clientesData ?? []);
    setConsultores(consultorProfiles as ConsultorOption[]);
    const init: Record<string, string> = {};
    (clientesData ?? []).forEach((c) => { init[c.id] = c.consultor_id ?? ""; });
    setSelected(init);
    setLoading(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleAssign = async (clienteId: string) => {
    const consultorId = selected[clienteId] || null;
    setSaving((s) => ({ ...s, [clienteId]: true }));
    const { error } = await supabase
      .from("clientes")
      .update({ consultor_id: consultorId })
      .eq("id", clienteId);
    setSaving((s) => ({ ...s, [clienteId]: false }));
    if (error) { toast.error(error.message); return; }
    toast.success("Consultor asignado");
    void loadData();
  };

  const consultorLabel = (id: string | null) => {
    if (!id) return <span className="text-muted-foreground italic text-xs">Sin asignar</span>;
    const c = consultores.find((x) => x.id === id);
    return <span className="text-xs">{c?.name ?? c?.email ?? id}</span>;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-navy" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{clientes.length} cliente{clientes.length !== 1 ? "s" : ""} activo{clientes.length !== 1 ? "s" : ""}</p>
        <button onClick={loadData} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-navy transition-colors">
          <RefreshCw className="w-3 h-3" /> Actualizar
        </button>
      </div>

      {clientes.length === 0 ? (
        <div className="rounded-lg border border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No hay clientes activos.</p>
          <p className="text-xs text-muted-foreground mt-1">Crea uno desde Mis clientes → Nuevo cliente.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {["Empresa", "Consultor actual", "Asignar consultor", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-navy/70">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientes.map((c) => {
                const isDirty  = selected[c.id] !== (c.consultor_id ?? "");
                const isSaving = saving[c.id];
                return (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.nombre_empresa}</td>
                    <td className="px-4 py-3">{consultorLabel(c.consultor_id)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={selected[c.id] ?? ""}
                        onChange={(e) => setSelected((s) => ({ ...s, [c.id]: e.target.value }))}
                        className="text-xs rounded border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold/50"
                      >
                        <option value="">— Sin consultor —</option>
                        {consultores.map((con) => (
                          <option key={con.id} value={con.id}>
                            {con.name ?? con.email}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleAssign(c.id)}
                        disabled={!isDirty || isSaving}
                        className="text-xs px-3 py-1.5 rounded bg-navy text-white disabled:opacity-30 hover:bg-navy/80 transition-colors inline-flex items-center gap-1.5"
                      >
                        {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                        Guardar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
