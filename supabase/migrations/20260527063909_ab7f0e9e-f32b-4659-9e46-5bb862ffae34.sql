ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS creditos_ia_usados integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS creditos_ia_reset_fecha date NOT NULL DEFAULT date_trunc('month', now())::date;