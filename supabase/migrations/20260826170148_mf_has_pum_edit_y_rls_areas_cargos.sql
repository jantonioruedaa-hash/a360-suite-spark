-- Migración aplicada a producción el 26/08/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Crea has_pum_edit() y actualiza RLS de manual_areas y manual_funciones_cargos
-- para permitir acceso mediante permisos_usuario_modulo.

-- 1. Función has_pum_edit: verifica permiso de edición por módulo y área
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
      AND pum.modulo       = _modulo
      AND pum.puede_editar = true
      AND (
        pum.alcance_tipo = 'todas'
        OR (pum.alcance_tipo = 'area' AND pum.alcance_area_id = _area_id)
      )
  )
$function$;

GRANT EXECUTE ON FUNCTION public.has_pum_edit(uuid, uuid, text) TO authenticated;

-- 2. Actualizar políticas de manual_areas (agrega has_pum_edit a write)
DROP POLICY IF EXISTS "manual_areas_insert" ON public.manual_areas;
DROP POLICY IF EXISTS "manual_areas_update" ON public.manual_areas;
DROP POLICY IF EXISTS "manual_areas_delete" ON public.manual_areas;

CREATE POLICY "manual_areas_insert" ON public.manual_areas
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'consultor'::app_role)
    OR is_dueno_de_cliente(cliente_id)
    OR has_pum_edit(cliente_id, NULL::uuid, 'manual_funciones_cargos'::text)
  );

CREATE POLICY "manual_areas_update" ON public.manual_areas
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'consultor'::app_role)
    OR is_dueno_de_cliente(cliente_id)
    OR has_pum_edit(cliente_id, NULL::uuid, 'manual_funciones_cargos'::text)
  );

CREATE POLICY "manual_areas_delete" ON public.manual_areas
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'consultor'::app_role)
    OR is_dueno_de_cliente(cliente_id)
    OR has_pum_edit(cliente_id, NULL::uuid, 'manual_funciones_cargos'::text)
  );

-- 3. Actualizar políticas de manual_funciones_cargos (agrega has_pum_edit a write+delete)
DROP POLICY IF EXISTS mf_cargos_insert ON public.manual_funciones_cargos;
DROP POLICY IF EXISTS mf_cargos_update ON public.manual_funciones_cargos;
DROP POLICY IF EXISTS mf_cargos_delete ON public.manual_funciones_cargos;

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
    OR has_pum_edit(cliente_id, area_id, 'manual_funciones_cargos'::text)
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
    OR has_pum_edit(cliente_id, area_id, 'manual_funciones_cargos'::text)
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
    OR has_pum_edit(cliente_id, area_id, 'manual_funciones_cargos'::text)
  );
