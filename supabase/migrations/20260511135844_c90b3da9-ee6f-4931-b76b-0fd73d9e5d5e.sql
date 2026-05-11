ALTER TABLE public.cliente_cotizaciones
  ADD COLUMN IF NOT EXISTS entregables jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS diagnostico_resumen text,
  ADD COLUMN IF NOT EXISTS objetivos_propuesta jsonb NOT NULL DEFAULT '[]'::jsonb;