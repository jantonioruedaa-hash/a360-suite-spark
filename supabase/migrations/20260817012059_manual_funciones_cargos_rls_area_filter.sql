-- Migración aplicada a producción el 17/08/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Actualiza las 4 políticas RLS de manual_funciones_cargos para filtrar
-- por area_id cuando el usuario tiene rol empresa y pertenece a un área.
-- Requiere empresa_usuarios.area_id (20260817010840).

DROP POLICY IF EXISTS mf_cargos_select ON public.manual_funciones_cargos;
DROP POLICY IF EXISTS "mf_cargos_select" ON public.manual_funciones_cargos;
DROP POLICY IF EXISTS mf_cargos_insert ON public.manual_funciones_cargos;
DROP POLICY IF EXISTS "mf_cargos_insert" ON public.manual_funciones_cargos;
DROP POLICY IF EXISTS mf_cargos_update ON public.manual_funciones_cargos;
DROP POLICY IF EXISTS "mf_cargos_update" ON public.manual_funciones_cargos;
DROP POLICY IF EXISTS mf_cargos_delete ON public.manual_funciones_cargos;
DROP POLICY IF EXISTS "mf_cargos_delete" ON public.manual_funciones_cargos;

CREATE POLICY mf_cargos_select ON public.manual_funciones_cargos
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      has_role(auth.uid(), 'consultor'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = manual_funciones_cargos.cliente_id
          AND c.consultor_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.empresa_usuarios eu
      WHERE eu.cliente_id = manual_funciones_cargos.cliente_id
        AND eu.user_id    = auth.uid()
        AND (eu.area_id IS NULL OR eu.area_id = manual_funciones_cargos.area_id)
    )
  );

CREATE POLICY mf_cargos_insert ON public.manual_funciones_cargos
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      has_role(auth.uid(), 'consultor'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = manual_funciones_cargos.cliente_id
          AND c.consultor_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.empresa_usuarios eu
      WHERE eu.cliente_id = manual_funciones_cargos.cliente_id
        AND eu.user_id    = auth.uid()
        AND (eu.area_id IS NULL OR eu.area_id = manual_funciones_cargos.area_id)
    )
  );

CREATE POLICY mf_cargos_update ON public.manual_funciones_cargos
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      has_role(auth.uid(), 'consultor'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = manual_funciones_cargos.cliente_id
          AND c.consultor_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.empresa_usuarios eu
      WHERE eu.cliente_id = manual_funciones_cargos.cliente_id
        AND eu.user_id    = auth.uid()
        AND (eu.area_id IS NULL OR eu.area_id = manual_funciones_cargos.area_id)
    )
  );

CREATE POLICY mf_cargos_delete ON public.manual_funciones_cargos
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      has_role(auth.uid(), 'consultor'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = manual_funciones_cargos.cliente_id
          AND c.consultor_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.empresa_usuarios eu
      WHERE eu.cliente_id = manual_funciones_cargos.cliente_id
        AND eu.user_id    = auth.uid()
        AND (eu.area_id IS NULL OR eu.area_id = manual_funciones_cargos.area_id)
    )
  );
