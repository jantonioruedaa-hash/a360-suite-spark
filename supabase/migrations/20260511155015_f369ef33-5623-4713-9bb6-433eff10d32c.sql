ALTER TABLE public.cliente_actividades
  ADD COLUMN IF NOT EXISTS analisis_ia text,
  ADD COLUMN IF NOT EXISTS analisis_ia_fecha timestamptz;