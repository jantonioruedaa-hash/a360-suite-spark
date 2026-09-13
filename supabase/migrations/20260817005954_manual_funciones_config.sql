-- Migración aplicada a producción el 17/08/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Crea tabla manual_funciones_config para guardar logo y nombre personalizado
-- del manual de funciones por cliente.

CREATE TABLE IF NOT EXISTS public.manual_funciones_config (
  cliente_id    uuid        PRIMARY KEY REFERENCES public.clientes(id) ON DELETE CASCADE,
  logo_url      text,
  nombre_empresa text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.manual_funciones_config TO authenticated, service_role;
