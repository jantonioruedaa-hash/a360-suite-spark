-- Migración aplicada a producción el 17/08/2026.
-- Archivo documental retroactivo creado el 19/08/2026 — el SQL original no quedó en el repo.
-- Actualiza las políticas INSERT/UPDATE/DELETE de manual_areas para permitir
-- al rol 'dueño' gestionar áreas de su propia empresa.
-- Nota: la política SELECT tenía USING(true) aquí — fue corregida por la
-- migración 20260819174308_manual_areas_rls_select_fix.

DROP POLICY IF EXISTS "manual_areas_insert" ON public.manual_areas;
DROP POLICY IF EXISTS "manual_areas_update" ON public.manual_areas;
DROP POLICY IF EXISTS "manual_areas_delete" ON public.manual_areas;

CREATE POLICY "manual_areas_insert" ON public.manual_areas
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'consultor'::app_role)
    OR is_dueno_de_cliente(cliente_id)
  );

CREATE POLICY "manual_areas_update" ON public.manual_areas
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'consultor'::app_role)
    OR is_dueno_de_cliente(cliente_id)
  );

CREATE POLICY "manual_areas_delete" ON public.manual_areas
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'consultor'::app_role)
    OR is_dueno_de_cliente(cliente_id)
  );
