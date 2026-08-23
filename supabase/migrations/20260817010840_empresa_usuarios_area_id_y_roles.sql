-- Migración aplicada a producción el 17/08/2026.
-- Archivo documental retroactivo creado el 19/08/2026 — el SQL original no quedó en el repo.
-- Contenido auditado: is_dueno_de_cliente(), area_id en empresa_usuarios,
-- y las políticas RLS de empresa_usuarios.

-- Columna area_id en empresa_usuarios (nullable, FK a manual_areas)
ALTER TABLE public.empresa_usuarios
  ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.manual_areas(id) ON DELETE SET NULL;

-- Función helper: ¿es el usuario actual el dueño de este cliente?
CREATE OR REPLACE FUNCTION public.is_dueno_de_cliente(_cliente_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresa_usuarios eu
    WHERE eu.cliente_id = _cliente_id
      AND eu.user_id    = auth.uid()
      AND eu.rol_empresa = 'dueño'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_dueno_de_cliente(uuid) TO authenticated;

-- Políticas RLS de empresa_usuarios
DROP POLICY IF EXISTS eu_select ON public.empresa_usuarios;
DROP POLICY IF EXISTS eu_insert ON public.empresa_usuarios;
DROP POLICY IF EXISTS eu_update ON public.empresa_usuarios;
DROP POLICY IF EXISTS eu_delete ON public.empresa_usuarios;

CREATE POLICY eu_select ON public.empresa_usuarios
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR (
      has_role(auth.uid(), 'consultor')
      AND EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = empresa_usuarios.cliente_id
          AND c.consultor_id = auth.uid()
      )
    )
  );

CREATE POLICY eu_insert ON public.empresa_usuarios
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR is_dueno_de_cliente(cliente_id)
  );

CREATE POLICY eu_update ON public.empresa_usuarios
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR is_dueno_de_cliente(cliente_id)
  );

CREATE POLICY eu_delete ON public.empresa_usuarios
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (is_dueno_de_cliente(cliente_id) AND user_id <> auth.uid())
  );
