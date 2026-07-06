import { z } from "zod";

export const RoleEnum = z.enum(["admin", "consultor", "cliente", "participante"]);
export const AccessTokenSchema = z.string().min(10).optional().nullable();

export const ListUsersExtraSchema = z.object({ accessToken: z.string().optional() });

export const CreateUserSchema = z.object({
  accessToken: AccessTokenSchema,
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  name: z.string().optional(),
  company: z.string().optional(),
  specialty: z.string().optional(),
  role: RoleEnum,
  clienteId: z.string().uuid().optional(),
});

export const InviteUserSchema = z.object({
  accessToken: AccessTokenSchema,
  email: z.string().email("Correo electrónico inválido"),
  name: z.string().optional(),
  company: z.string().optional(),
  specialty: z.string().optional(),
  role: RoleEnum,
  clienteId: z.string().uuid().optional(),
  redirectTo: z.string().url().optional(),
});

export const UpdateProfileSchema = z.object({
  accessToken: AccessTokenSchema,
  userId: z.string().uuid(),
  name: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  specialty: z.string().nullable().optional(),
  email: z.string().email("Correo electrónico inválido").optional(),
  role: RoleEnum.optional(),
  clienteId: z.string().uuid().nullable().optional(),
});

export const ResetPasswordSchema = z.object({
  accessToken: AccessTokenSchema,
  userId: z.string().uuid(),
  newPassword: z.string().min(6, "Mínimo 6 caracteres").optional(),
  sendEmail: z.boolean().optional(),
  email: z.string().email().optional(),
  redirectTo: z.string().url().optional(),
});

export const ToggleBanSchema = z.object({
  accessToken: AccessTokenSchema,
  userId: z.string().uuid(),
  block: z.boolean(),
});

export const DeleteUserSchema = z.object({
  accessToken: AccessTokenSchema,
  userId: z.string().uuid(),
});
