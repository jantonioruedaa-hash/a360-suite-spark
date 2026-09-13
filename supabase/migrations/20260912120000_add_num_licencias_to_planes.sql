-- Fase 3 Planes: agregar num_licencias para control de licencias por plan

ALTER TABLE planes
  ADD COLUMN IF NOT EXISTS num_licencias integer NOT NULL DEFAULT 1;
