-- 1. app_settings: write access admin-only
DROP POLICY IF EXISTS app_settings_write_admin_consultor ON public.app_settings;
CREATE POLICY app_settings_write_admin ON public.app_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. cliente_compartidos: remove broad public anon SELECT
DROP POLICY IF EXISTS compartidos_public_by_token ON public.cliente_compartidos;

-- Safe RPC for the public share page; returns only non-PII columns
CREATE OR REPLACE FUNCTION public.get_compartido_by_token(_token text)
RETURNS TABLE(
  id uuid, cliente_id uuid, tipo_contenido text, contenido_id uuid,
  titulo text, mensaje text, pdf_url text, destinatarios_nombres jsonb,
  vistas integer, expira_en timestamptz, estado text, created_at timestamptz,
  incluir_kpis boolean, incluir_compromisos boolean,
  nombre_empresa text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.cliente_id, c.tipo_contenido, c.contenido_id,
         c.titulo, c.mensaje, c.pdf_url,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object('nombre', d->>'nombre'))
             FROM jsonb_array_elements(c.destinatarios) d
         ), '[]'::jsonb) AS destinatarios_nombres,
         c.vistas, c.expira_en, c.estado, c.created_at,
         c.incluir_kpis, c.incluir_compromisos,
         cl.nombre_empresa
    FROM public.cliente_compartidos c
    LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
   WHERE c.share_token = _token
     AND c.estado <> 'revocado'
     AND (c.expira_en IS NULL OR c.expira_en > now());
$$;

REVOKE ALL ON FUNCTION public.get_compartido_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_compartido_by_token(text) TO anon, authenticated;

-- 3. Storage policies for reportes-compartidos: ownership check via path prefix (cliente_id/...)
DROP POLICY IF EXISTS compartidos_storage_read ON storage.objects;
DROP POLICY IF EXISTS compartidos_storage_write ON storage.objects;
DROP POLICY IF EXISTS compartidos_storage_update ON storage.objects;
DROP POLICY IF EXISTS compartidos_storage_delete ON storage.objects;

CREATE POLICY compartidos_storage_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'reportes-compartidos'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY compartidos_storage_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'reportes-compartidos'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY compartidos_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'reportes-compartidos'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY compartidos_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'reportes-compartidos'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );

-- 4. branding bucket: restrict listing via RLS to authenticated; public URLs still work
DROP POLICY IF EXISTS branding_public_read ON storage.objects;
CREATE POLICY branding_auth_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'branding');