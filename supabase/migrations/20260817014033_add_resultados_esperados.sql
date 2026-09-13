-- Migración aplicada a producción el 17/08/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Agrega columna resultados_esperados a manual_funciones_cargos
-- y a manual_plantilla_cargos.

ALTER TABLE public.manual_funciones_cargos
  ADD COLUMN IF NOT EXISTS resultados_esperados jsonb NOT NULL DEFAULT '[]';

ALTER TABLE public.manual_plantilla_cargos
  ADD COLUMN IF NOT EXISTS resultados_esperados jsonb NOT NULL DEFAULT '[]';
