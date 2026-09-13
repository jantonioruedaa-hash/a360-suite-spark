-- Migración aplicada a producción el 17/08/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Agrega índice único compuesto (cliente_id, id) en manual_areas.
-- Requerido por las FK compuestas de empresa_usuarios y manual_funciones_cargos
-- que referencian (cliente_id, area_id) → (cliente_id, id).

CREATE UNIQUE INDEX IF NOT EXISTS manual_areas_cliente_id_id_key
  ON public.manual_areas (cliente_id, id);
