-- Migración aplicada a producción el 27/07/2026.
-- Archivo documental retroactivo creado el 19/08/2026 — el SQL original no quedó en el repo.
-- Contiene la creación inicial de empresa_usuarios y la actualización de
-- can_access_cliente() para incluir membresía vía empresa_usuarios.

-- ── empresa_usuarios ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.empresa_usuarios (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   uuid        NOT NULL REFERENCES public.clientes(id)   ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  rol_empresa  text        NOT NULL,
  invitado_por uuid                 REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, user_id)
);

ALTER TABLE public.empresa_usuarios ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.empresa_usuarios TO authenticated, service_role;

-- ── can_access_cliente (actualizada para incluir empresa_usuarios) ────────────
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
