-- Igualar bloque de firmas en Evaluación de Desempeño con Evaluación de Competencias.
-- Añade columna firmas jsonb (3 firmantes: Colaborador / Evaluador·Jefe / RRHH).
-- Las columnas legacy firma_rrhh y fecha_firma se mantienen para backward compat.
ALTER TABLE manual_funciones_evaluaciones_desempeno
  ADD COLUMN IF NOT EXISTS firmas jsonb;
