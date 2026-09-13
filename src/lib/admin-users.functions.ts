import { createServerFn } from "@tanstack/react-start";
import {
  CreateUserSchema,
  DeleteUserSchema,
  GetLicenseStatusSchema,
  InviteUserSchema,
  ListUsersExtraSchema,
  ResetPasswordSchema,
  ToggleBanSchema,
  UpdateProfileSchema,
} from "./admin-users.schemas";

export const adminListUsersExtra = createServerFn({ method: "POST" })
  .inputValidator((data) => ListUsersExtraSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { listAdminUsersExtra, ensureAdminFromToken } = await import("./admin-users.server");
    const adminUserId = await ensureAdminFromToken(data.accessToken);
    return listAdminUsersExtra(adminUserId);
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .inputValidator((data) => CreateUserSchema.parse(data))
  .handler(async ({ data }) => {
    const { createAdminUser, ensureAdminFromToken } = await import("./admin-users.server");
    const adminUserId = await ensureAdminFromToken(data.accessToken);
    return createAdminUser(data, adminUserId);
  });

export const adminInviteUser = createServerFn({ method: "POST" })
  .inputValidator((data) => InviteUserSchema.parse(data))
  .handler(async ({ data }) => {
    const { inviteAdminUser, ensureAdminFromToken } = await import("./admin-users.server");
    const adminUserId = await ensureAdminFromToken(data.accessToken);
    return inviteAdminUser(data, adminUserId);
  });

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .inputValidator((data) => UpdateProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const { updateAdminProfile, ensureAdminFromToken } = await import("./admin-users.server");
    const adminUserId = await ensureAdminFromToken(data.accessToken);
    return updateAdminProfile(data, adminUserId);
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .inputValidator((data) => ResetPasswordSchema.parse(data))
  .handler(async ({ data }) => {
    const { resetAdminPassword, ensureAdminFromToken } = await import("./admin-users.server");
    const adminUserId = await ensureAdminFromToken(data.accessToken);
    return resetAdminPassword(data, adminUserId);
  });

export const adminToggleBan = createServerFn({ method: "POST" })
  .inputValidator((data) => ToggleBanSchema.parse(data))
  .handler(async ({ data }) => {
    const { toggleAdminBan, ensureAdminFromToken } = await import("./admin-users.server");
    const adminUserId = await ensureAdminFromToken(data.accessToken);
    return toggleAdminBan(data, adminUserId);
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .inputValidator((data) => DeleteUserSchema.parse(data))
  .handler(async ({ data }) => {
    const { deleteAdminUser, ensureAdminFromToken } = await import("./admin-users.server");
    const adminUserId = await ensureAdminFromToken(data.accessToken);
    return deleteAdminUser(data, adminUserId);
  });

export const adminGetLicenseStatus = createServerFn({ method: "POST" })
  .inputValidator((data) => GetLicenseStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const { getLicenseStatus, ensureAdminFromToken } = await import("./admin-users.server");
    await ensureAdminFromToken(data.accessToken);
    return getLicenseStatus(data.clienteId);
  });
