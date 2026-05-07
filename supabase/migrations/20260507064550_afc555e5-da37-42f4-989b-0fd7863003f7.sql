
-- Tabla principal de envíos compartidos
CREATE TABLE public.cliente_compartidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL,
  consultor_id UUID,
  tipo_contenido TEXT NOT NULL CHECK (tipo_contenido IN ('actividad','reporte_sesion','cotizacion','compromisos','onboarding','side','plan')),
  contenido_id UUID,
  contenido_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  titulo TEXT NOT NULL,
  mensaje TEXT,
  destinatarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  canales JSONB NOT NULL DEFAULT '[]'::jsonb,
  incluir_pdf BOOLEAN NOT NULL DEFAULT true,
  incluir_kpis BOOLEAN NOT NULL DEFAULT false,
  incluir_compromisos BOOLEAN NOT NULL DEFAULT false,
  pdf_url TEXT,
  share_token TEXT UNIQUE,
  expira_en TIMESTAMPTZ,
  vistas INTEGER NOT NULL DEFAULT 0,
  primera_vista TIMESTAMPTZ,
  ultima_vista TIMESTAMPTZ,
  ip_ultima_vista TEXT,
  estado TEXT NOT NULL DEFAULT 'enviado' CHECK (estado IN ('borrador','enviado','leido','revocado')),
  crear_compromiso_lectura BOOLEAN NOT NULL DEFAULT false,
  compromiso_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compartidos_cliente ON public.cliente_compartidos(cliente_id);
CREATE INDEX idx_compartidos_token ON public.cliente_compartidos(share_token) WHERE share_token IS NOT NULL;

ALTER TABLE public.cliente_compartidos ENABLE ROW LEVEL SECURITY;

-- Acceso interno (consultor/admin/cliente del registro)
CREATE POLICY compartidos_access ON public.cliente_compartidos
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- Acceso público por token (vista de solo lectura)
CREATE POLICY compartidos_public_by_token ON public.cliente_compartidos
  FOR SELECT TO anon, authenticated
  USING (
    share_token IS NOT NULL
    AND estado <> 'revocado'
    AND (expira_en IS NULL OR expira_en > now())
  );

CREATE TRIGGER trg_compartidos_updated
BEFORE UPDATE ON public.cliente_compartidos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bucket privado para PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('reportes-compartidos', 'reportes-compartidos', false)
ON CONFLICT (id) DO NOTHING;

-- Solo usuarios autenticados con acceso al cliente pueden subir/leer
CREATE POLICY "compartidos_storage_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'reportes-compartidos');

CREATE POLICY "compartidos_storage_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reportes-compartidos');

CREATE POLICY "compartidos_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'reportes-compartidos');

CREATE POLICY "compartidos_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'reportes-compartidos');

-- Función pública para registrar visita (incrementar contador) sin RLS
CREATE OR REPLACE FUNCTION public.registrar_vista_compartido(_token TEXT, _ip TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.cliente_compartidos
  SET vistas = vistas + 1,
      primera_vista = COALESCE(primera_vista, now()),
      ultima_vista = now(),
      ip_ultima_vista = _ip,
      estado = CASE WHEN estado = 'enviado' THEN 'leido' ELSE estado END
  WHERE share_token = _token
    AND estado <> 'revocado'
    AND (expira_en IS NULL OR expira_en > now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_vista_compartido(TEXT, TEXT) TO anon, authenticated;
