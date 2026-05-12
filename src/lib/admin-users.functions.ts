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

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().optional(),
      company: z.string().optional(),
      specialty: z.string().optional(),
      role: RoleEnum,
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
    if (error) throw new Error(error.message);
    const uid = created.user!.id;
    // Profile row is auto-created by trigger; update extras
    await supabaseAdmin.from("profiles").update({
      name: data.name ?? null,
      company: data.company ?? null,
      specialty: data.specialty ?? null,
    }).eq("id", uid);
    // Replace default role
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role });
    if (rErr) throw new Error(rErr.message);
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
      email: z.string().email().optional(),
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
    if (pErr) throw new Error(pErr.message);
    if (data.email) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email: data.email });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      userId: z.string().uuid(),
      newPassword: z.string().min(6).optional(),
      sendEmail: z.boolean().optional(),
      email: z.string().email().optional(),
      redirectTo: z.string().url().optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context.userId);
    if (data.newPassword) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.newPassword });
      if (error) throw new Error(error.message);
      return { ok: true, mode: "set" as const };
    }
    if (data.sendEmail && data.email) {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(data.email, {
        redirectTo: data.redirectTo,
      });
      if (error) throw new Error(error.message);
      return { ok: true, mode: "email" as const };
    }
    throw new Error("Indica una nueva contraseña o envía correo de restablecimiento");
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("No puedes eliminar tu propio usuario");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
