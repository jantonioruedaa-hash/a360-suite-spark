-- Add acceso_interpretacion flag to clientes
-- Controls whether a client can see AI interpretation cards in SIDE
-- without needing estado_revision = 'revisado'.
-- Only admin/consultor can set this (clientes_cliente_self is SELECT-only for role 'cliente').

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS acceso_interpretacion BOOLEAN NOT NULL DEFAULT false;
