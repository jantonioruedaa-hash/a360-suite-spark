import { createServerFn } from "@tanstack/react-start";
import {
  CreateUserSchema,
  DeleteUserSchema,
  InviteUserSchema,
  ListUsersExtraSchema,
  ResetPasswordSchema,
  ToggleBanSchema,
  UpdateProfileSchema,
} from "./admin-users.schemas";
import {
  createAdminUser,
  deleteAdminUser,
  inviteAdminUser,
  listAdminUsersExtra,
  resetAdminPassword,
  toggleAdminBan,
  updateAdminProfile,
} from "./admin-users.server";

export const adminListUsersExtra = createServerFn({ method: "POST" })
  .inputValidator((data) => ListUsersExtraSchema.parse(data ?? {}))
  .handler(async ({ data }) => listAdminUsersExtra(data.accessToken));

export const adminCreateUser = createServerFn({ method: "POST" })
  .inputValidator((data) => CreateUserSchema.parse(data))
  .handler(async ({ data }) => createAdminUser(data));

export const adminInviteUser = createServerFn({ method: "POST" })
  .inputValidator((data) => InviteUserSchema.parse(data))
  .handler(async ({ data }) => inviteAdminUser(data));

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .inputValidator((data) => UpdateProfileSchema.parse(data))
  .handler(async ({ data }) => updateAdminProfile(data));

export const adminResetPassword = createServerFn({ method: "POST" })
  .inputValidator((data) => ResetPasswordSchema.parse(data))
  .handler(async ({ data }) => resetAdminPassword(data));

export const adminToggleBan = createServerFn({ method: "POST" })
  .inputValidator((data) => ToggleBanSchema.parse(data))
  .handler(async ({ data }) => toggleAdminBan(data));

export const adminDeleteUser = createServerFn({ method: "POST" })
  .inputValidator((data) => DeleteUserSchema.parse(data))
  .handler(async ({ data }) => deleteAdminUser(data));
