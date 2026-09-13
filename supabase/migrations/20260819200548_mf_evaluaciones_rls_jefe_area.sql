-- Migración C: RLS de evaluaciones scoped por área para jefe_area
-- D1=B: lectura + escritura para jefe_area, DELETE solo consultor/admin
-- Requiere can_access_cliente() con empresa_usuarios (20260727180225)
-- y is_dueno_de_cliente() (20260817010840) como funciones base.

-- =============================================
-- manual_funciones_evaluaciones (Competencias)
-- =============================================
DROP POLICY IF EXISTS mf_eval_select ON public.manual_funciones_evaluaciones;
DROP POLICY IF EXISTS mf_eval_insert ON public.manual_funciones_evaluaciones;
DROP POLICY IF EXISTS mf_eval_update ON public.manual_funciones_evaluaciones;
DROP POLICY IF EXISTS mf_eval_delete ON public.manual_funciones_evaluaciones;

CREATE POLICY mf_eval_select ON public.manual_funciones_evaluaciones
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR consultor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
        AND public.can_access_cliente(c.cliente_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id  = c.cliente_id
       AND eu.area_id     = c.area_id
       AND eu.user_id     = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
    )
  );

CREATE POLICY mf_eval_insert ON public.manual_funciones_evaluaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR consultor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id  = c.cliente_id
       AND eu.area_id     = c.area_id
       AND eu.user_id     = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
    )
  );

CREATE POLICY mf_eval_update ON public.manual_funciones_evaluaciones
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR consultor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
        AND public.can_access_cliente(c.cliente_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id  = c.cliente_id
       AND eu.area_id     = c.area_id
       AND eu.user_id     = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
    )
  );

CREATE POLICY mf_eval_delete ON public.manual_funciones_evaluaciones
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR consultor_id = auth.uid()
  );

-- =====================================================
-- manual_funciones_evaluaciones_desempeno (Desempeño)
-- =====================================================
DROP POLICY IF EXISTS mf_eval_desemp_select ON public.manual_funciones_evaluaciones_desempeno;
DROP POLICY IF EXISTS mf_eval_desemp_insert ON public.manual_funciones_evaluaciones_desempeno;
DROP POLICY IF EXISTS mf_eval_desemp_update ON public.manual_funciones_evaluaciones_desempeno;
DROP POLICY IF EXISTS mf_eval_desemp_delete ON public.manual_funciones_evaluaciones_desempeno;

CREATE POLICY mf_eval_desemp_select ON public.manual_funciones_evaluaciones_desempeno
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR consultor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
        AND public.can_access_cliente(c.cliente_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id  = c.cliente_id
       AND eu.area_id     = c.area_id
       AND eu.user_id     = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
    )
  );

CREATE POLICY mf_eval_desemp_insert ON public.manual_funciones_evaluaciones_desempeno
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR consultor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id  = c.cliente_id
       AND eu.area_id     = c.area_id
       AND eu.user_id     = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
    )
  );

CREATE POLICY mf_eval_desemp_update ON public.manual_funciones_evaluaciones_desempeno
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR consultor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
        AND public.can_access_cliente(c.cliente_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id  = c.cliente_id
       AND eu.area_id     = c.area_id
       AND eu.user_id     = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
    )
  );

CREATE POLICY mf_eval_desemp_delete ON public.manual_funciones_evaluaciones_desempeno
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR consultor_id = auth.uid()
  );
