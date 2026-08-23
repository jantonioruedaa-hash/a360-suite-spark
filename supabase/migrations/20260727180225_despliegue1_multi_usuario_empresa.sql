-- Migración aplicada a producción el 27/07/2026.
-- Archivo documental retroactivo creado el 19/08/2026 — el SQL original no quedó en el repo.
-- Contiene (entre otras cosas) la actualización de can_access_cliente() para incluir
-- membresía vía empresa_usuarios, además de la creación inicial de empresa_usuarios.
-- Solo se documenta aquí la función auditada; el resto del deployment puede haber
-- incluido DDL adicional no capturado en este archivo.

CREATE OR REPLACE FUNCTION public.can_access_cliente(_cliente_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = _cliente_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR (c.consultor_id = auth.uid() AND public.has_role(auth.uid(), 'consultor'))
        OR EXISTS (
          SELECT 1 FROM public.empresa_usuarios eu
          WHERE eu.cliente_id = _cliente_id
            AND eu.user_id    = auth.uid()
        )
      )
  );
$$;
