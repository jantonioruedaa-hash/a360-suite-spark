-- ============================================================
-- SIDE: backfill de sesiones completadas antes de la migración
-- ============================================================
-- Las sesiones con completada = true creadas antes de que existiera
-- el campo estado_revision tienen DEFAULT 'borrador' (del ALTER TABLE
-- de la migración anterior). Semánticamente son sesiones revisadas:
-- el consultor las completó con el flujo antiguo, el cliente ya las vio.
--
-- Este UPDATE las lleva a 'revisado' para que el estado_revision sea
-- coherente con la realidad y el frontend no necesite cruzar
-- completada + estado_revision para determinar la editabilidad.
-- ============================================================

UPDATE public.side_sesiones
SET estado_revision = 'revisado'
WHERE completada = true
  AND estado_revision = 'borrador';
