
CREATE TABLE IF NOT EXISTS public.marketing_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  consultor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nombre_sesion TEXT NOT NULL DEFAULT 'Nueva sesión',
  empresa JSONB NOT NULL DEFAULT '{}'::jsonb,
  modulos JSONB NOT NULL DEFAULT '{}'::jsonb,
  reporte_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  score_total INTEGER NOT NULL DEFAULT 0,
  completada BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_sesiones TO authenticated;
GRANT ALL ON public.marketing_sesiones TO service_role;

ALTER TABLE public.marketing_sesiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_sesiones_select" ON public.marketing_sesiones
  FOR SELECT TO authenticated USING (
    auth.uid() = consultor_id
    OR public.has_role(auth.uid(), 'admin')
    OR (cliente_id IS NOT NULL AND public.can_access_cliente(cliente_id))
  );

CREATE POLICY "marketing_sesiones_insert" ON public.marketing_sesiones
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = consultor_id OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "marketing_sesiones_update" ON public.marketing_sesiones
  FOR UPDATE TO authenticated USING (
    auth.uid() = consultor_id OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "marketing_sesiones_delete" ON public.marketing_sesiones
  FOR DELETE TO authenticated USING (
    auth.uid() = consultor_id OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_marketing_sesiones_cliente ON public.marketing_sesiones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_marketing_sesiones_consultor ON public.marketing_sesiones(consultor_id);

CREATE TRIGGER marketing_sesiones_set_updated_at
  BEFORE UPDATE ON public.marketing_sesiones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
