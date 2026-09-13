import { createServerFn } from "@tanstack/react-start";
import {
  ListPosicionesSchema,
  CreatePosicionSchema,
  UpdatePosicionModulosSchema,
  DeletePosicionSchema,
  AplicarPosicionSchema,
} from "./posiciones.schemas";

export const adminListPosiciones = createServerFn({ method: "POST" })
  .inputValidator((data) => ListPosicionesSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureAdminFromToken } = await import("./admin-users.server");
    const { listPosiciones } = await import("./posiciones.server");
    await ensureAdminFromToken(data.accessToken);
    return listPosiciones(data.clienteId);
  });

export const adminCreatePosicion = createServerFn({ method: "POST" })
  .inputValidator((data) => CreatePosicionSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureAdminFromToken } = await import("./admin-users.server");
    const { createPosicion } = await import("./posiciones.server");
    await ensureAdminFromToken(data.accessToken);
    return createPosicion(data.clienteId, data.nombre, data.modulosDefault);
  });

export const adminUpdatePosicionModulos = createServerFn({ method: "POST" })
  .inputValidator((data) => UpdatePosicionModulosSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureAdminFromToken } = await import("./admin-users.server");
    const { updatePosicionModulos } = await import("./posiciones.server");
    await ensureAdminFromToken(data.accessToken);
    return updatePosicionModulos(data.posicionId, data.modulosDefault);
  });

export const adminDeletePosicion = createServerFn({ method: "POST" })
  .inputValidator((data) => DeletePosicionSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureAdminFromToken } = await import("./admin-users.server");
    const { deletePosicion } = await import("./posiciones.server");
    await ensureAdminFromToken(data.accessToken);
    return deletePosicion(data.posicionId);
  });

export const adminAplicarPosicion = createServerFn({ method: "POST" })
  .inputValidator((data) => AplicarPosicionSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureAdminFromToken } = await import("./admin-users.server");
    const { aplicarPosicionAUsuario } = await import("./posiciones.server");
    await ensureAdminFromToken(data.accessToken);
    return aplicarPosicionAUsuario(data.userId, data.clienteId, data.posicionId);
  });
