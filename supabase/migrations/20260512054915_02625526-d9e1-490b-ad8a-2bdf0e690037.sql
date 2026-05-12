
-- Tabla singleton de configuración global
CREATE TABLE public.app_settings (
  id text PRIMARY KEY DEFAULT 'global',
  company_name text NOT NULL DEFAULT 'Aceleradora 360',
  app_name text NOT NULL DEFAULT 'A360SGP Suite',
  logo_url text,
  primary_color text NOT NULL DEFAULT '#1a2b5a',
  accent_color text NOT NULL DEFAULT '#c9a84c',
  font_family text NOT NULL DEFAULT 'DM Sans',
  content_strings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = 'global')
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Lectura pública (necesaria para que el branding cargue en login y SSR)
CREATE POLICY "app_settings_read_all"
  ON public.app_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Sólo admin y consultor escriben
CREATE POLICY "app_settings_write_admin_consultor"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Fila inicial
INSERT INTO public.app_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- Bucket público para logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública
CREATE POLICY "branding_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding');

-- Subida/actualización/borrado para admin y consultor
CREATE POLICY "branding_admin_consultor_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'branding' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor')));

CREATE POLICY "branding_admin_consultor_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'branding' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor')));

CREATE POLICY "branding_admin_consultor_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'branding' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor')));
