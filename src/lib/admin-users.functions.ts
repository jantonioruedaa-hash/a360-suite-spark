import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RoleEnum = z.enum(["admin", "consultor", "cliente", "participante"]);

async function ensureAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Solo administradores pueden ejecutar esta acción");
}

// Translate common Supabase auth errors to Spanish
function tr(msg: string): string {
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

function thrown(e: unknown): never {
  const m = e instanceof Error ? e.message : String(e);
  throw new Error(tr(m));
}

export const adminListUsersExtra = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await ensureAdmin(context.userId);
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) {
        console.error("adminListUsersExtra listUsers error:", error);
        return [] as Array<{ id: string; banned_until: string | null; last_sign_in_at: string | null }>;
      }
      return data.users.map((u) => ({
        id: u.id,
        banned_until: (u as { banned_until?: string | null }).banned_until ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
      }));
    } catch (e) {
      console.error("adminListUsersExtra failed:", e);
      return [] as Array<{ id: string; banned_until: string | null; last_sign_in_at: string | null }>;
    }
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      email: z.string().email("Correo electrónico inválido"),
      password: z.string().min(6, "Mínimo 6 caracteres"),
      name: z.string().optional(),
      company: z.string().optional(),
      specialty: z.string().optional(),
      role: RoleEnum,
      clienteId: z.string().uuid().optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context.userId);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name ?? null },
    });
    if (error) thrown(error);
    const uid = created.user!.id;
    await supabaseAdmin.from("profiles").update({
      name: data.name ?? null,
      company: data.company ?? null,
      specialty: data.specialty ?? null,
    }).eq("id", uid);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role });
    if (rErr) thrown(rErr);
    if (data.clienteId) await linkUserToCliente(uid, data.role, data.clienteId);
    return { id: uid };
  });

export const adminInviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      email: z.string().email("Correo electrónico inválido"),
      name: z.string().optional(),
      company: z.string().optional(),
      specialty: z.string().optional(),
      role: RoleEnum,
      clienteId: z.string().uuid().optional(),
      redirectTo: z.string().url().optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context.userId);
    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: data.redirectTo,
      data: { name: data.name ?? null },
    });
    if (error) thrown(error);
    const uid = invited.user!.id;
    await supabaseAdmin.from("profiles").update({
      name: data.name ?? null,
      company: data.company ?? null,
      specialty: data.specialty ?? null,
    }).eq("id", uid);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role });
    if (rErr) thrown(rErr);
    if (data.clienteId) await linkUserToCliente(uid, data.role, data.clienteId);
    return { id: uid };
  });

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      userId: z.string().uuid(),
      name: z.string().nullable().optional(),
      company: z.string().nullable().optional(),
      specialty: z.string().nullable().optional(),
      email: z.string().email("Correo electrónico inválido").optional(),
      role: RoleEnum.optional(),
      clienteId: z.string().uuid().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context.userId);
    const { error: pErr } = await supabaseAdmin.from("profiles").update({
      name: data.name ?? null,
      company: data.company ?? null,
      specialty: data.specialty ?? null,
      ...(data.email ? { email: data.email } : {}),
    }).eq("id", data.userId);
    if (pErr) thrown(pErr);
    if (data.email) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email: data.email });
      if (error) thrown(error);
    }
    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
      if (error) thrown(error);
    }
    if (data.clienteId !== undefined) {
      // Determine current role to know which column to update
      const { data: roleRow } = await supabaseAdmin
        .from("user_roles").select("role").eq("user_id", data.userId).maybeSingle();
      const r = (data.role ?? roleRow?.role) as z.infer<typeof RoleEnum> | undefined;
      if (r) await linkUserToCliente(data.userId, r, data.clienteId);
    }
    return { ok: true };
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      userId: z.string().uuid(),
      newPassword: z.string().min(6, "Mínimo 6 caracteres").optional(),
      sendEmail: z.boolean().optional(),
      email: z.string().email().optional(),
      redirectTo: z.string().url().optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context.userId);
    if (data.newPassword) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.newPassword });
      if (error) thrown(error);
      return { ok: true, mode: "set" as const };
    }
    if (data.sendEmail && data.email) {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(data.email, {
        redirectTo: data.redirectTo,
      });
      if (error) thrown(error);
      return { ok: true, mode: "email" as const };
    }
    throw new Error("Indica una nueva contraseña o envía correo de restablecimiento");
  });

export const adminToggleBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    block: z.boolean(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context.userId);
    if (data.block && data.userId === context.userId) throw new Error("No puedes bloquear tu propio usuario");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      // 100 years effectively = permanent block; 'none' clears it
      ban_duration: data.block ? "876000h" : "none",
    } as { ban_duration: string });
    if (error) thrown(error);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("No puedes eliminar tu propio usuario");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) thrown(error);
    return { ok: true };
  });

async function linkUserToCliente(userId: string, role: z.infer<typeof RoleEnum>, clienteId: string | null) {
  if (role === "cliente" || role === "participante") {
    // Clear any prior link, then set the new one
    await supabaseAdmin.from("clientes").update({ cliente_user_id: null }).eq("cliente_user_id", userId);
    if (clienteId) {
      const { error } = await supabaseAdmin.from("clientes").update({ cliente_user_id: userId }).eq("id", clienteId);
      if (error) thrown(error);
    }
  } else if (role === "consultor") {
    if (clienteId) {
      const { error } = await supabaseAdmin.from("clientes").update({ consultor_id: userId }).eq("id", clienteId);
      if (error) thrown(error);
    }
  }
}
