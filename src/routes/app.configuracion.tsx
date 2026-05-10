import { createFileRoute } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Users, UserCog } from "lucide-react";

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
        <span className="text-xs text-muted-foreground">{filtered.length} usuario(s)</span>
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
                <th className="text-left py-2 px-2 w-48">Rol</th>
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
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Cambiar el rol afecta los permisos del usuario inmediatamente. Los administradores pueden gestionar todos los clientes; los consultores solo los suyos.
      </p>
    </div>
  );
}
