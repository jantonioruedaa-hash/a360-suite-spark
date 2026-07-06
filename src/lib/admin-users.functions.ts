import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CreateUserSchema,
  DeleteUserSchema,
  InviteUserSchema,
  ListUsersExtraSchema,
  ResetPasswordSchema,
  ToggleBanSchema,
  UpdateProfileSchema,
} from "./admin-users.schemas";

export const adminListUsersExtra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => ListUsersExtraSchema.parse(data ?? {}))
  .handler(async ({ context }) => {
    const { listAdminUsersExtra } = await import("./admin-users.server");
    return listAdminUsersExtra(context.userId);
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => CreateUserSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { createAdminUser } = await import("./admin-users.server");
    return createAdminUser(data, context.userId);
  });

export const adminInviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => InviteUserSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { inviteAdminUser } = await import("./admin-users.server");
    return inviteAdminUser(data, context.userId);
  });

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => UpdateProfileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { updateAdminProfile } = await import("./admin-users.server");
    return updateAdminProfile(data, context.userId);
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => ResetPasswordSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { resetAdminPassword } = await import("./admin-users.server");
    return resetAdminPassword(data, context.userId);
  });

export const adminToggleBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => ToggleBanSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { toggleAdminBan } = await import("./admin-users.server");
    return toggleAdminBan(data, context.userId);
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => DeleteUserSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { deleteAdminUser } = await import("./admin-users.server");
    return deleteAdminUser(data, context.userId);
  });
