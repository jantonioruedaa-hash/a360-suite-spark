import { z } from "zod";

const AccessTokenSchema = z.string().min(10).optional().nullable();

export const ModuloDefaultInput = z.object({
  modulo: z.string(),
  seccion: z.string().nullable().optional(),
  puede_ver: z.boolean().default(true),
  puede_editar: z.boolean().default(false),
  puede_eliminar: z.boolean().default(false),
});

export const ListPosicionesSchema = z.object({
  accessToken: AccessTokenSchema,
  clienteId: z.string().uuid(),
});

export const CreatePosicionSchema = z.object({
  accessToken: AccessTokenSchema,
  clienteId: z.string().uuid(),
  nombre: z.string().min(1),
  modulosDefault: z.array(ModuloDefaultInput).default([]),
});

export const UpdatePosicionModulosSchema = z.object({
  accessToken: AccessTokenSchema,
  posicionId: z.string().uuid(),
  modulosDefault: z.array(ModuloDefaultInput),
});

export const DeletePosicionSchema = z.object({
  accessToken: AccessTokenSchema,
  posicionId: z.string().uuid(),
});

export const AplicarPosicionSchema = z.object({
  accessToken: AccessTokenSchema,
  userId: z.string().uuid(),
  clienteId: z.string().uuid(),
  posicionId: z.string().uuid(),
});
