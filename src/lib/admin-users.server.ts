import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AdminRole = "admin" | "consultor" | "cliente" | "participante";
export type AdminUserExtra = { id: string; banned_until: string | null; last_sign_in_at: string | null };

export async function ensureAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Solo administradores pueden ejecutar esta acción");
}

export async function ensureAdminFromToken(accessToken?: string | null) {
  if (!accessToken) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    console.error("[ensureAdminFromToken] supabaseAdmin.auth.getUser failed:", error);
    throw new Error("Sesión inválida o expirada. Vuelve a iniciar sesión.");
  }
  await ensureAdmin(data.user.id);
  return data.user.id;
}

export function translateAdminError(msg: string): string {
  const m = (msg ?? "").toLowerCase();
  if (m.includes("user already registered") || m.includes("already been registered") || m.includes("already exists")) return "Ya existe un usuario con ese correo";
  if (m.includes("invalid email")) return "Correo electrónico inválido";
  if (m.includes("password should be at least")) return "La contraseña debe tener al menos 6 caracteres";
  if (m.includes("weak password") || m.includes("password is too weak")) return "Contraseña demasiado débil. Usa mayúsculas, números y símbolos";
  if (m.includes("rate limit")) return "Demasiados intentos. Espera unos minutos antes de reintentar";
  if (m.includes("user not found")) return "Usuario no encontrado";
  if (m.includes("email not confirmed")) return "Correo no confirmado";
  return msg;
}

export function throwAdminError(e: unknown): never {
  const m = e instanceof Error ? e.message : String(e);
  throw new Error(translateAdminError(m));
}

export async function listAdminUsersExtra(adminUserId: string): Promise<AdminUserExtra[]> {
  try {
    await ensureAdmin(adminUserId);
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) {
      console.error("adminListUsersExtra listUsers error:", error);
      return [];
    }
    return data.users.map((u) => ({
      id: u.id,
      banned_until: (u as { banned_until?: string | null }).banned_until ?? null,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }));
  } catch (e) {
    console.error("adminListUsersExtra failed:", e);
    return [];
  }
}

export async function createAdminUser(data: {
  accessToken?: string | null;
  email: string;
  password: string;
  name?: string;
  company?: string;
  specialty?: string;
  role: AdminRole;
  clienteId?: string;
}, adminUserId: string) {
  await ensureAdmin(adminUserId);
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { name: data.name ?? null },
  });
  if (error) throwAdminError(error);
  const uid = created.user!.id;
  await supabaseAdmin.from("profiles").update({
    name: data.name ?? null,
    company: data.company ?? null,
    specialty: data.specialty ?? null,
  }).eq("id", uid);
  await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
  const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role });
  if (rErr) throwAdminError(rErr);
  if (data.clienteId) await linkUserToCliente(uid, data.role, data.clienteId);
  return { id: uid };
}

export async function inviteAdminUser(data: {
  accessToken?: string | null;
  email: string;
  name?: string;
  company?: string;
  specialty?: string;
  role: AdminRole;
  clienteId?: string;
  redirectTo?: string;
}, adminUserId: string) {
  await ensureAdmin(adminUserId);
  const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
    redirectTo: data.redirectTo,
    data: { name: data.name ?? null },
  });
  if (error) throwAdminError(error);
  const uid = invited.user!.id;
  await supabaseAdmin.from("profiles").update({
    name: data.name ?? null,
    company: data.company ?? null,
    specialty: data.specialty ?? null,
  }).eq("id", uid);
  await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
  const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role });
  if (rErr) throwAdminError(rErr);
  if (data.clienteId) await linkUserToCliente(uid, data.role, data.clienteId);
  return { id: uid };
}

export async function updateAdminProfile(data: {
  accessToken?: string | null;
  userId: string;
  name?: string | null;
  company?: string | null;
  specialty?: string | null;
  email?: string;
  role?: AdminRole;
  clienteId?: string | null;
}, adminUserId: string) {
  await ensureAdmin(adminUserId);
  const { error: pErr } = await supabaseAdmin.from("profiles").update({
    name: data.name ?? null,
    company: data.company ?? null,
    specialty: data.specialty ?? null,
    ...(data.email ? { email: data.email } : {}),
  }).eq("id", data.userId);
  if (pErr) throwAdminError(pErr);
  if (data.email) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email: data.email });
    if (error) throwAdminError(error);
  }
  if (data.role) {
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throwAdminError(error);
  }
  if (data.clienteId !== undefined) {
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", data.userId).maybeSingle();
    const role = (data.role ?? roleRow?.role) as AdminRole | undefined;
    if (role) await linkUserToCliente(data.userId, role, data.clienteId);
  }
  return { ok: true };
}

export async function resetAdminPassword(data: {
  accessToken?: string | null;
  userId: string;
  newPassword?: string;
  sendEmail?: boolean;
  email?: string;
  redirectTo?: string;
}, adminUserId: string) {
  await ensureAdmin(adminUserId);
  if (data.newPassword) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.newPassword });
    if (error) throwAdminError(error);
    return { ok: true, mode: "set" as const };
  }
  if (data.sendEmail && data.email) {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(data.email, {
      redirectTo: data.redirectTo,
    });
    if (error) throwAdminError(error);
    return { ok: true, mode: "email" as const };
  }
  throw new Error("Indica una nueva contraseña o envía correo de restablecimiento");
}

export async function toggleAdminBan(data: { accessToken?: string | null; userId: string; block: boolean }, adminUserId: string) {
  await ensureAdmin(adminUserId);
  if (data.block && data.userId === adminUserId) throw new Error("No puedes bloquear tu propio usuario");
  const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
    ban_duration: data.block ? "876000h" : "none",
  } as { ban_duration: string });
  if (error) throwAdminError(error);
  return { ok: true };
}

export async function deleteAdminUser(data: { accessToken?: string | null; userId: string }, adminUserId: string) {
  await ensureAdmin(adminUserId);
  if (data.userId === adminUserId) throw new Error("No puedes eliminar tu propio usuario");
  const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
  if (error) throwAdminError(error);
  return { ok: true };
}

async function linkUserToCliente(userId: string, role: AdminRole, clienteId: string | null) {
  if (role === "cliente" || role === "participante") {
    const { error: delErr } = await supabaseAdmin.from("empresa_usuarios").delete().eq("user_id", userId);
    if (delErr) throwAdminError(delErr);
    if (clienteId) {
      const { error } = await supabaseAdmin
        .from("empresa_usuarios")
        .insert({ user_id: userId, cliente_id: clienteId, rol_empresa: "dueño" });
      if (error) throwAdminError(error);
    }
  } else if (role === "consultor" && clienteId) {
    const { error } = await supabaseAdmin.from("clientes").update({ consultor_id: userId }).eq("id", clienteId);
    if (error) throwAdminError(error);
  }
}
