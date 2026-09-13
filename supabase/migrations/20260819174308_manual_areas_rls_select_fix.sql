-- Migración aplicada a producción el 19/08/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Corrige la política SELECT de manual_areas: cambia USING(true) por
-- USING(can_access_cliente(cliente_id)) para restringir por cliente asignado.

DROP POLICY IF EXISTS "manual_areas_select" ON public.manual_areas;

CREATE POLICY "manual_areas_select" ON public.manual_areas
  FOR SELECT TO authenticated
  USING (can_access_cliente(cliente_id));
