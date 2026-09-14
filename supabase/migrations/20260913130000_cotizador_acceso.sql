-- 1. Agregar "cotizador" al catálogo de módulos por plan
INSERT INTO plan_modulos (plan_id, modulo_slug, activo)
SELECT id, 'cotizador', true FROM planes
ON CONFLICT DO NOTHING;

-- 2. Función genérica de permisos por verbo
CREATE OR REPLACE FUNCTION public.has_pum_access(
  _cliente_id uuid,
  _modulo     text,
  _campo      text  -- 'puede_ver' | 'puede_editar' | 'puede_eliminar'
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
    WHERE pum.user_id    = auth.uid()
      AND pum.cliente_id = _cliente_id
      AND pum.modulo     = _modulo
      AND (CASE _campo
             WHEN 'puede_editar'   THEN pum.puede_editar
             WHEN 'puede_eliminar' THEN pum.puede_eliminar
             ELSE pum.puede_ver
           END) = true
  )
$function$;

GRANT EXECUTE ON FUNCTION public.has_pum_access(uuid, text, text) TO authenticated;

-- 3. Nuevas policies para roles cliente/participante
--    (admin/consultor ya tienen acceso total vía policies existentes)
CREATE POLICY cotizaciones_cliente_select ON cliente_cotizaciones
  FOR SELECT TO authenticated
  USING (has_pum_access(cliente_id, 'cotizador', 'puede_ver'));

CREATE POLICY cotizaciones_cliente_insert ON cliente_cotizaciones
  FOR INSERT TO authenticated
  WITH CHECK (has_pum_access(cliente_id, 'cotizador', 'puede_editar'));

CREATE POLICY cotizaciones_cliente_update ON cliente_cotizaciones
  FOR UPDATE TO authenticated
  USING (has_pum_access(cliente_id, 'cotizador', 'puede_editar'))
  WITH CHECK (has_pum_access(cliente_id, 'cotizador', 'puede_editar'));

CREATE POLICY cotizaciones_cliente_delete ON cliente_cotizaciones
  FOR DELETE TO authenticated
  USING (has_pum_access(cliente_id, 'cotizador', 'puede_eliminar'));
