-- =============================================================================
-- Migración: permisos_usuario_modulo + has_modulo_permission + RLS evaluaciones
-- Aplicada en producción (hmdwaubkuvkvtsvwtifh): 2026-08-22
-- Documentada retroactivamente: 2026-08-23
--
-- Esta migración:
--   1. Crea la tabla permisos_usuario_modulo con sus constraints e índices
--   2. Crea las 4 políticas RLS de permisos_usuario_modulo
--   3. Crea la función SECURITY DEFINER has_modulo_permission()
--   4. Reemplaza las 4 políticas de manual_funciones_evaluaciones
--      (previamente definidas en 20260819_mf_evaluaciones_rls_jefe_area)
--      para añadir la cláusula OR has_modulo_permission(...)
--   5. Reemplaza las 4 políticas de manual_funciones_evaluaciones_desempeno
--      con el mismo patrón
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla permisos_usuario_modulo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permisos_usuario_modulo (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id      uuid        NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  modulo          text        NOT NULL,
  alcance_tipo    text        NOT NULL,
  alcance_area_id uuid        REFERENCES public.manual_areas(id) ON DELETE CASCADE,
  puede_ver       boolean     NOT NULL DEFAULT false,
  puede_editar    boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT permisos_usuario_modulo_alcance_tipo_check
    CHECK (alcance_tipo = ANY (ARRAY['area'::text, 'todas'::text])),

  CONSTRAINT pum_alcance_consistente
    CHECK (
      ((alcance_tipo = 'area'  AND alcance_area_id IS NOT NULL))
      OR
      ((alcance_tipo = 'todas' AND alcance_area_id IS NULL))
    ),

  CONSTRAINT pum_editar_implica_ver
    CHECK ((puede_ver = true) OR (puede_editar = false))
);

-- Índice de búsqueda general
CREATE INDEX IF NOT EXISTS pum_lookup
  ON public.permisos_usuario_modulo USING btree (user_id, cliente_id, modulo, alcance_tipo);

-- Unicidad: un permiso 'todas' por (usuario, cliente, módulo)
CREATE UNIQUE INDEX IF NOT EXISTS pum_unique_todas
  ON public.permisos_usuario_modulo USING btree (user_id, cliente_id, modulo)
  WHERE (alcance_tipo = 'todas');

-- Unicidad: un permiso 'area' por (usuario, cliente, módulo, área)
CREATE UNIQUE INDEX IF NOT EXISTS pum_unique_area
  ON public.permisos_usuario_modulo USING btree (user_id, cliente_id, modulo, alcance_area_id)
  WHERE (alcance_tipo = 'area');

-- ----------------------------------------------------------------------------
-- 2. RLS en permisos_usuario_modulo
-- ----------------------------------------------------------------------------
ALTER TABLE public.permisos_usuario_modulo ENABLE ROW LEVEL SECURITY;

CREATE POLICY pum_select ON public.permisos_usuario_modulo
  FOR SELECT TO authenticated
  USING (
    (user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = permisos_usuario_modulo.cliente_id
        AND c.consultor_id = auth.uid()
    ))
  );

CREATE POLICY pum_insert ON public.permisos_usuario_modulo
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY pum_update ON public.permisos_usuario_modulo
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY pum_delete ON public.permisos_usuario_modulo
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ----------------------------------------------------------------------------
-- 3. Función has_modulo_permission (SECURITY DEFINER)
--    Verifica si el usuario tiene permiso sobre el módulo indicado para el cargo dado.
--    SET row_security = off para evitar recursión de RLS dentro de la función.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_modulo_permission(
  _cargo_id        uuid,
  _modulo          text,
  _necesita_editar boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.permisos_usuario_modulo pum
    JOIN public.manual_funciones_cargos c ON c.id = _cargo_id
    WHERE pum.user_id    = auth.uid()
      AND pum.cliente_id = c.cliente_id
      AND pum.modulo     = _modulo
      AND (CASE WHEN _necesita_editar THEN pum.puede_editar ELSE pum.puede_ver END) = true
      AND (
        pum.alcance_tipo = 'todas'
        OR (pum.alcance_tipo = 'area' AND pum.alcance_area_id = c.area_id)
      )
  )
$function$;

-- ----------------------------------------------------------------------------
-- 4. Reemplazar políticas en manual_funciones_evaluaciones
--    (añade OR has_modulo_permission a las definidas en migración anterior)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS mf_eval_select ON public.manual_funciones_evaluaciones;
DROP POLICY IF EXISTS mf_eval_insert ON public.manual_funciones_evaluaciones;
DROP POLICY IF EXISTS mf_eval_update ON public.manual_funciones_evaluaciones;
DROP POLICY IF EXISTS mf_eval_delete ON public.manual_funciones_evaluaciones;

CREATE POLICY mf_eval_select ON public.manual_funciones_evaluaciones
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
        AND can_access_cliente(c.cliente_id)
    ))
    OR (EXISTS (
      SELECT 1
      FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id = c.cliente_id
       AND eu.area_id    = c.area_id
       AND eu.user_id    = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
    ))
    OR has_modulo_permission(cargo_id, 'manual_funciones_evaluaciones'::text, false)
  );

CREATE POLICY mf_eval_insert ON public.manual_funciones_evaluaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
    OR (EXISTS (
      SELECT 1
      FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id = c.cliente_id
       AND eu.area_id    = c.area_id
       AND eu.user_id    = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
    ))
    OR has_modulo_permission(cargo_id, 'manual_funciones_evaluaciones'::text, true)
  );

CREATE POLICY mf_eval_update ON public.manual_funciones_evaluaciones
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
        AND can_access_cliente(c.cliente_id)
    ))
    OR (EXISTS (
      SELECT 1
      FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id = c.cliente_id
       AND eu.area_id    = c.area_id
       AND eu.user_id    = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
    ))
    OR has_modulo_permission(cargo_id, 'manual_funciones_evaluaciones'::text, true)
  );

CREATE POLICY mf_eval_delete ON public.manual_funciones_evaluaciones
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 5. Reemplazar políticas en manual_funciones_evaluaciones_desempeno
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS mf_eval_desemp_select ON public.manual_funciones_evaluaciones_desempeno;
DROP POLICY IF EXISTS mf_eval_desemp_insert ON public.manual_funciones_evaluaciones_desempeno;
DROP POLICY IF EXISTS mf_eval_desemp_update ON public.manual_funciones_evaluaciones_desempeno;
DROP POLICY IF EXISTS mf_eval_desemp_delete ON public.manual_funciones_evaluaciones_desempeno;

CREATE POLICY mf_eval_desemp_select ON public.manual_funciones_evaluaciones_desempeno
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
        AND can_access_cliente(c.cliente_id)
    ))
    OR (EXISTS (
      SELECT 1
      FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id = c.cliente_id
       AND eu.area_id    = c.area_id
       AND eu.user_id    = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
    ))
    OR has_modulo_permission(cargo_id, 'manual_funciones_evaluaciones'::text, false)
  );

CREATE POLICY mf_eval_desemp_insert ON public.manual_funciones_evaluaciones_desempeno
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
    OR (EXISTS (
      SELECT 1
      FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id = c.cliente_id
       AND eu.area_id    = c.area_id
       AND eu.user_id    = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
    ))
    OR has_modulo_permission(cargo_id, 'manual_funciones_evaluaciones'::text, true)
  );

CREATE POLICY mf_eval_desemp_update ON public.manual_funciones_evaluaciones_desempeno
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
        AND can_access_cliente(c.cliente_id)
    ))
    OR (EXISTS (
      SELECT 1
      FROM public.manual_funciones_cargos c
      JOIN public.empresa_usuarios eu
        ON eu.cliente_id = c.cliente_id
       AND eu.area_id    = c.area_id
       AND eu.user_id    = auth.uid()
       AND eu.rol_empresa = 'jefe_area'
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
    ))
    OR has_modulo_permission(cargo_id, 'manual_funciones_evaluaciones'::text, true)
  );

CREATE POLICY mf_eval_desemp_delete ON public.manual_funciones_evaluaciones_desempeno
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
  );
