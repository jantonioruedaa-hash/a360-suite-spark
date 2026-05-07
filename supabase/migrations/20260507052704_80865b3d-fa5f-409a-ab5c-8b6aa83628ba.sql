-- ============================================
-- 1. AMPLIAR TABLA clientes
-- ============================================
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS nombre_comercial text,
  ADD COLUMN IF NOT EXISTS subsector text,
  ADD COLUMN IF NOT EXISTS num_empleados integer,
  ADD COLUMN IF NOT EXISTS facturacion_anual numeric,
  ADD COLUMN IF NOT EXISTS moneda text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS codigo_postal text,
  ADD COLUMN IF NOT EXISTS linkedin_empresa text,
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS fecha_inicio_relacion date,
  ADD COLUMN IF NOT EXISTS origen text,
  ADD COLUMN IF NOT EXISTS notas_internas text;

-- Backfill estado y fecha_inicio_relacion para registros existentes
UPDATE public.clientes
   SET estado = COALESCE(estado, 'activo'),
       fecha_inicio_relacion = COALESCE(fecha_inicio_relacion, created_at::date);

-- CHECK constraint para estado
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_estado_check') THEN
    ALTER TABLE public.clientes
      ADD CONSTRAINT clientes_estado_check
      CHECK (estado IN ('prospecto','activo','en_pausa','completado','inactivo'));
  END IF;
END $$;

-- ============================================
-- 2. TABLA cliente_contactos
-- ============================================
CREATE TABLE IF NOT EXISTS public.cliente_contactos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  apellido text NOT NULL,
  area text,
  cargo text,
  es_contacto_principal boolean NOT NULL DEFAULT false,
  es_decisor boolean NOT NULL DEFAULT false,
  email text,
  email_secundario text,
  celular text,
  telefono_oficina text,
  extension text,
  direccion text,
  ciudad text,
  linkedin_url text,
  foto_url text,
  fecha_nacimiento date,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cliente_contactos_cliente ON public.cliente_contactos(cliente_id);

ALTER TABLE public.cliente_contactos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contactos_access ON public.cliente_contactos;
CREATE POLICY contactos_access ON public.cliente_contactos
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

CREATE TRIGGER trg_cliente_contactos_updated_at
  BEFORE UPDATE ON public.cliente_contactos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 3. TABLA cliente_actividades
-- ============================================
CREATE TABLE IF NOT EXISTS public.cliente_actividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  contacto_id uuid REFERENCES public.cliente_contactos(id) ON DELETE SET NULL,
  consultor_id uuid,
  tipo text NOT NULL CHECK (tipo IN (
    'llamada','reunion','email','propuesta','contrato','pago','nota',
    'seguimiento','diagnostico','sesion_coaching','sesion_lee','entrega','otro'
  )),
  titulo text NOT NULL,
  descripcion text,
  fecha timestamptz NOT NULL DEFAULT now(),
  duracion_minutos integer,
  resultado text,
  proxima_accion text,
  fecha_proxima_accion date,
  adjunto_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cliente_actividades_cliente ON public.cliente_actividades(cliente_id, fecha DESC);

ALTER TABLE public.cliente_actividades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS actividades_access ON public.cliente_actividades;
CREATE POLICY actividades_access ON public.cliente_actividades
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- ============================================
-- 4. TABLA cliente_cotizaciones
-- ============================================
CREATE TABLE IF NOT EXISTS public.cliente_cotizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  contacto_id uuid REFERENCES public.cliente_contactos(id) ON DELETE SET NULL,
  consultor_id uuid,
  numero_cotizacion text UNIQUE,
  titulo text NOT NULL,
  descripcion text,
  plan text CHECK (plan IN ('diagnostico','estrategico','transformacion','coaching_ejecutivo','programa_integral','corporativo')),
  servicios jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  descuento_porcentaje numeric NOT NULL DEFAULT 0,
  descuento_valor numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  moneda text NOT NULL DEFAULT 'USD',
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviada','en_negociacion','aprobada','rechazada','vencida')),
  validez_dias integer NOT NULL DEFAULT 30,
  fecha_emision date DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  notas text,
  condiciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cliente_cotizaciones_cliente ON public.cliente_cotizaciones(cliente_id, created_at DESC);

ALTER TABLE public.cliente_cotizaciones ENABLE ROW LEVEL SECURITY;

-- Cotizaciones: solo admin y consultor asignado (NO el cliente final)
DROP POLICY IF EXISTS cotizaciones_admin ON public.cliente_cotizaciones;
CREATE POLICY cotizaciones_admin ON public.cliente_cotizaciones
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS cotizaciones_consultor ON public.cliente_cotizaciones;
CREATE POLICY cotizaciones_consultor ON public.cliente_cotizaciones
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'consultor')
    AND EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.consultor_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'consultor')
    AND EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.consultor_id = auth.uid())
  );

CREATE TRIGGER trg_cliente_cotizaciones_updated_at
  BEFORE UPDATE ON public.cliente_cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 5. AUTO-GENERAR numero_cotizacion
-- ============================================
CREATE OR REPLACE FUNCTION public.generar_numero_cotizacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text;
  v_consec integer;
BEGIN
  IF NEW.numero_cotizacion IS NOT NULL AND NEW.numero_cotizacion <> '' THEN
    RETURN NEW;
  END IF;
  v_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(split_part(numero_cotizacion, '-', 3) AS integer)), 0) + 1
    INTO v_consec
    FROM public.cliente_cotizaciones
   WHERE numero_cotizacion LIKE 'COT-' || v_year || '-%';
  NEW.numero_cotizacion := 'COT-' || v_year || '-' || lpad(v_consec::text, 3, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generar_numero_cotizacion ON public.cliente_cotizaciones;
CREATE TRIGGER trg_generar_numero_cotizacion
  BEFORE INSERT ON public.cliente_cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_cotizacion();

-- ============================================
-- 6. Trigger para fecha_vencimiento auto
-- ============================================
CREATE OR REPLACE FUNCTION public.set_cotizacion_vencimiento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.fecha_emision IS NOT NULL AND NEW.fecha_vencimiento IS NULL THEN
    NEW.fecha_vencimiento := NEW.fecha_emision + (COALESCE(NEW.validez_dias, 30) || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_cotizacion_vencimiento ON public.cliente_cotizaciones;
CREATE TRIGGER trg_set_cotizacion_vencimiento
  BEFORE INSERT OR UPDATE ON public.cliente_cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.set_cotizacion_vencimiento();