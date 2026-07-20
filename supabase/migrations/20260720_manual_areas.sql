-- Tabla de áreas organizacionales por cliente
-- Complementa manual_funciones_cargos que usa area TEXT
CREATE TABLE IF NOT EXISTS public.manual_areas (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID         NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre     TEXT         NOT NULL,
  orden      INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.manual_areas ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier usuario autenticado (la seguridad real está en cargos)
CREATE POLICY "manual_areas_select" ON public.manual_areas
  FOR SELECT TO authenticated USING (true);

-- Escritura: admin o consultor
CREATE POLICY "manual_areas_insert" ON public.manual_areas
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));

CREATE POLICY "manual_areas_update" ON public.manual_areas
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));

CREATE POLICY "manual_areas_delete" ON public.manual_areas
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));

-- Los grants globales de la migración 20260714030000 ya cubren tablas nuevas
-- via ALTER DEFAULT PRIVILEGES, pero los añadimos explícitamente por claridad
GRANT ALL ON public.manual_areas TO authenticated;
GRANT ALL ON public.manual_areas TO service_role;
