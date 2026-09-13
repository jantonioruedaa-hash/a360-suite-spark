import { supabaseAdmin } from "@/integrations/supabase/client.server";

type ModuloDefault = {
  modulo: string;
  seccion?: string | null;
  puede_ver?: boolean;
  puede_editar?: boolean;
  puede_eliminar?: boolean;
};

const db = supabaseAdmin as any;

export async function listPosiciones(clienteId: string) {
  const { data, error } = await db
    .from("empresa_posiciones")
    .select("id, nombre, created_at, posicion_modulos_default(id, modulo, seccion, puede_ver, puede_editar, puede_eliminar)")
    .eq("cliente_id", clienteId)
    .order("nombre");
  if (error) throw new Error(error.message);
  return (data ?? []) as PosicionRow[];
}

export async function createPosicion(clienteId: string, nombre: string, modulosDefault: ModuloDefault[]) {
  const { data: pos, error } = await db
    .from("empresa_posiciones")
    .insert({ cliente_id: clienteId, nombre })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (modulosDefault.length > 0) {
    const rows = modulosDefault.map((m) => ({
      posicion_id: pos.id,
      modulo: m.modulo,
      seccion: m.seccion ?? null,
      puede_ver: m.puede_ver ?? true,
      puede_editar: m.puede_editar ?? false,
      puede_eliminar: m.puede_eliminar ?? false,
    }));
    const { error: mErr } = await db.from("posicion_modulos_default").insert(rows);
    if (mErr) throw new Error(mErr.message);
  }
  return { id: pos.id as string };
}

export async function updatePosicionModulos(posicionId: string, modulosDefault: ModuloDefault[]) {
  const { error: delErr } = await db
    .from("posicion_modulos_default")
    .delete()
    .eq("posicion_id", posicionId);
  if (delErr) throw new Error(delErr.message);

  if (modulosDefault.length === 0) return;
  const rows = modulosDefault.map((m) => ({
    posicion_id: posicionId,
    modulo: m.modulo,
    seccion: m.seccion ?? null,
    puede_ver: m.puede_ver ?? true,
    puede_editar: m.puede_editar ?? false,
    puede_eliminar: m.puede_eliminar ?? false,
  }));
  const { error } = await db.from("posicion_modulos_default").insert(rows);
  if (error) throw new Error(error.message);
}

export async function deletePosicion(posicionId: string) {
  const { error } = await db
    .from("empresa_posiciones")
    .delete()
    .eq("id", posicionId);
  if (error) throw new Error(error.message);
}

export async function aplicarPosicionAUsuario(userId: string, clienteId: string, posicionId: string) {
  const { data: modulos, error: fetchErr } = await db
    .from("posicion_modulos_default")
    .select("modulo, seccion, puede_ver, puede_editar, puede_eliminar")
    .eq("posicion_id", posicionId);
  if (fetchErr) throw new Error(fetchErr.message);

  await db
    .from("empresa_usuarios")
    .update({ posicion_id: posicionId })
    .eq("user_id", userId)
    .eq("cliente_id", clienteId);

  if (!modulos || modulos.length === 0) return;

  const modulosList: string[] = [...new Set((modulos as ModuloRow[]).map((m) => m.modulo))];
  await db
    .from("permisos_usuario_modulo")
    .delete()
    .eq("user_id", userId)
    .eq("cliente_id", clienteId)
    .eq("alcance_tipo", "todas")
    .in("modulo", modulosList);

  const rows = (modulos as ModuloRow[]).map((m) => ({
    user_id: userId,
    cliente_id: clienteId,
    modulo: m.modulo,
    seccion: m.seccion ?? null,
    alcance_tipo: "todas",
    alcance_area_id: null,
    puede_ver: m.puede_ver,
    puede_editar: m.puede_editar,
    puede_eliminar: m.puede_eliminar,
  }));

  const { error: insErr } = await db.from("permisos_usuario_modulo").insert(rows);
  if (insErr) throw new Error(insErr.message);
}

type ModuloRow = {
  modulo: string;
  seccion: string | null;
  puede_ver: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
};

export type PosicionRow = {
  id: string;
  nombre: string;
  created_at: string;
  posicion_modulos_default: ModuloRow & { id: string }[];
};
