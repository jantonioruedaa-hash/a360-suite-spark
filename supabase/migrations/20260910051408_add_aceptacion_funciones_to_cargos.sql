-- Sección "Aceptación de Funciones": 4 columnas nullable en manual_funciones_cargos
ALTER TABLE manual_funciones_cargos
  ADD COLUMN IF NOT EXISTS aceptacion_texto  text,
  ADD COLUMN IF NOT EXISTS aceptacion_nombre text,
  ADD COLUMN IF NOT EXISTS aceptacion_cargo  text,
  ADD COLUMN IF NOT EXISTS aceptacion_fecha  text;
