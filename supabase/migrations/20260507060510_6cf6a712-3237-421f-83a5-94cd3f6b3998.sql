
-- =============================================================
-- ONBOARDING DEL CLIENTE
-- =============================================================
CREATE TABLE public.cliente_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL UNIQUE,
  consultor_id uuid,
  -- Paso 1: empresa (datos extendidos no presentes en clientes)
  paso1_empresa jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Paso 2: líder
  paso2_lider jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Paso 3: contexto estratégico (FODA preliminar + dimensiones urgentes)
  paso3_contexto jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Paso 4: expectativas y prioridades por dimensión
  paso4_expectativas jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Paso 5: acuerdo de trabajo
  paso5_acuerdo jsonb NOT NULL DEFAULT '{}'::jsonb,
  analisis_ia text,
  completado boolean NOT NULL DEFAULT false,
  fecha_completado timestamptz,
  paso_actual integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cliente_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_access ON public.cliente_onboarding
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

CREATE TRIGGER trg_onboarding_updated
  BEFORE UPDATE ON public.cliente_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_onboarding_cliente ON public.cliente_onboarding(cliente_id);

-- =============================================================
-- KPIs por sesión / cliente
-- =============================================================
CREATE TABLE public.cliente_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  actividad_id uuid,
  categoria text NOT NULL,
  nombre text NOT NULL,
  formula text,
  valor_meta numeric,
  valor_actual numeric,
  unidad text,
  semaforo text NOT NULL DEFAULT 'verde',
  observacion text,
  fecha_medicion date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cliente_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY kpis_access ON public.cliente_kpis
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

CREATE TRIGGER trg_kpis_updated
  BEFORE UPDATE ON public.cliente_kpis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_kpis_cliente ON public.cliente_kpis(cliente_id);
CREATE INDEX idx_kpis_actividad ON public.cliente_kpis(actividad_id);

-- =============================================================
-- COMPROMISOS (cliente y consultor)
-- =============================================================
CREATE TABLE public.cliente_compromisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  actividad_id uuid,
  origen text NOT NULL DEFAULT 'cliente', -- 'cliente' | 'consultor'
  descripcion text NOT NULL,
  responsable text,
  fecha_limite date,
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente | en_progreso | completado | vencido
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cliente_compromisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY compromisos_access ON public.cliente_compromisos
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

CREATE TRIGGER trg_compromisos_updated
  BEFORE UPDATE ON public.cliente_compromisos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_compromisos_cliente ON public.cliente_compromisos(cliente_id);

-- =============================================================
-- Extender cliente_actividades para REPORTE DE SESIÓN
-- =============================================================
ALTER TABLE public.cliente_actividades
  ADD COLUMN IF NOT EXISTS es_sesion_consultoria boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS numero_sesion integer,
  ADD COLUMN IF NOT EXISTS modalidad text,
  ADD COLUMN IF NOT EXISTS hora_inicio text,
  ADD COLUMN IF NOT EXISTS hora_fin text,
  ADD COLUMN IF NOT EXISTS programa text,
  ADD COLUMN IF NOT EXISTS etapa_programa text,
  ADD COLUMN IF NOT EXISTS objetivo text,
  ADD COLUMN IF NOT EXISTS participantes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS temas jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS herramientas jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS logros jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS semaforo text,
  ADD COLUMN IF NOT EXISTS justificacion_semaforo text,
  ADD COLUMN IF NOT EXISTS proxima_fecha timestamptz,
  ADD COLUMN IF NOT EXISTS proxima_temas jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mensaje_cliente text,
  ADD COLUMN IF NOT EXISTS reporte_pdf_url text;

-- =============================================================
-- Extender cliente_cotizaciones (IME estimado + justificación)
-- =============================================================
ALTER TABLE public.cliente_cotizaciones
  ADD COLUMN IF NOT EXISTS ime_estimado text,
  ADD COLUMN IF NOT EXISTS justificacion_programa text;
