-- Fix: has_modulo_permission y has_pum_edit traducen slugs legacy
-- antes de consultar permisos_usuario_modulo.
--
-- Tras 20260912140000_consolidar_permisos_usuario_modulo los slugs compuestos
-- 'manual_funciones_evaluaciones' y 'manual_funciones_cargos' fueron colapsados
-- a modulo='manual_funciones' + seccion='evaluaciones'/'cargos'.
-- Las 11 policies existentes siguen llamando con los slugs viejos — se traduce
-- DENTRO de la función para no tocar ninguna policy.

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
      AND (
        CASE _modulo
          WHEN 'manual_funciones_evaluaciones'
            THEN pum.modulo = 'manual_funciones' AND pum.seccion = 'evaluaciones'
          WHEN 'manual_funciones_cargos'
            THEN pum.modulo = 'manual_funciones' AND pum.seccion = 'cargos'
          ELSE
            pum.modulo = _modulo
        END
      )
      AND (CASE WHEN _necesita_editar THEN pum.puede_editar ELSE pum.puede_ver END) = true
      AND (
        pum.alcance_tipo = 'todas'
        OR (pum.alcance_tipo = 'area' AND pum.alcance_area_id = c.area_id)
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.has_pum_edit(
  _cliente_id uuid,
  _area_id    uuid,
  _modulo     text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.permisos_usuario_modulo pum
    WHERE pum.user_id      = auth.uid()
      AND pum.cliente_id   = _cliente_id
      AND (
        CASE _modulo
          WHEN 'manual_funciones_evaluaciones'
            THEN pum.modulo = 'manual_funciones' AND pum.seccion = 'evaluaciones'
          WHEN 'manual_funciones_cargos'
            THEN pum.modulo = 'manual_funciones' AND pum.seccion = 'cargos'
          ELSE
            pum.modulo = _modulo
        END
      )
      AND pum.puede_editar = true
      AND (
        pum.alcance_tipo = 'todas'
        OR (pum.alcance_tipo = 'area' AND pum.alcance_area_id = _area_id)
      )
  )
$function$;
