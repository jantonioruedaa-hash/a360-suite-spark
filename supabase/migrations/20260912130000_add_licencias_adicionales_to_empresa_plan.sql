-- Fase 3 Planes: licencias adicionales por suscripción (top-up sobre el plan base)

ALTER TABLE empresa_plan
  ADD COLUMN IF NOT EXISTS licencias_adicionales integer NOT NULL DEFAULT 0;
