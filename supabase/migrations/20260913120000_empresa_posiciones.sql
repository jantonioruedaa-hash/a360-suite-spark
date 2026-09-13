-- Posiciones/Roles de empresa: plantillas de permisos reutilizables por cliente
-- empresa_posiciones: lista de posiciones por cliente
-- posicion_modulos_default: módulos y permisos por defecto de cada posición
-- empresa_usuarios.posicion_id: FK opcional al posición asignada al usuario

CREATE TABLE public.empresa_posiciones (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid        NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, nombre)
);

ALTER TABLE public.empresa_posiciones ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.empresa_posiciones TO authenticated, service_role;

CREATE POLICY ep_all ON public.empresa_posiciones
  FOR ALL TO authenticated
  USING  (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.posicion_modulos_default (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  posicion_id    uuid    NOT NULL REFERENCES public.empresa_posiciones(id) ON DELETE CASCADE,
  modulo         text    NOT NULL,
  seccion        text,
  puede_ver      boolean NOT NULL DEFAULT true,
  puede_editar   boolean NOT NULL DEFAULT false,
  puede_eliminar boolean NOT NULL DEFAULT false
);

ALTER TABLE public.posicion_modulos_default ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.posicion_modulos_default TO authenticated, service_role;

CREATE POLICY pmd_all ON public.posicion_modulos_default
  FOR ALL TO authenticated
  USING  (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.empresa_usuarios
  ADD COLUMN IF NOT EXISTS posicion_id uuid
    REFERENCES public.empresa_posiciones(id) ON DELETE SET NULL;
