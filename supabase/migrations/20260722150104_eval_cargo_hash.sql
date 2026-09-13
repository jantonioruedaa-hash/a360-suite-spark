-- Migración aplicada a producción el 22/07/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Agrega cargo_data_hash a manual_funciones_evaluaciones para detectar
-- si el cargo cambió desde la última evaluación de competencias.

ALTER TABLE public.manual_funciones_evaluaciones
  ADD COLUMN IF NOT EXISTS cargo_data_hash text;
