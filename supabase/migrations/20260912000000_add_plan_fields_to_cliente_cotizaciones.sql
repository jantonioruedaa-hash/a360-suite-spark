-- Decisión 3: agregar plan_plataforma_id y nivel_acompanamiento a cliente_cotizaciones

CREATE TYPE nivel_acompanamiento_enum AS ENUM (
  'autogestionado',
  'guiado',
  'acompanado',
  'advisory'
);

ALTER TABLE cliente_cotizaciones
  ADD COLUMN plan_plataforma_id uuid
    REFERENCES planes(id) ON DELETE SET NULL,
  ADD COLUMN nivel_acompanamiento nivel_acompanamiento_enum;
