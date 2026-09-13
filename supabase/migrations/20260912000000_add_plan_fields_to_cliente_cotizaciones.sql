-- Decisión 3: agregar plan_plataforma_id y nivel_acompanamiento a cliente_cotizaciones

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nivel_acompanamiento_enum') THEN
    CREATE TYPE nivel_acompanamiento_enum AS ENUM (
      'autogestionado',
      'guiado',
      'acompanado',
      'advisory'
    );
  END IF;
END $$;

ALTER TABLE cliente_cotizaciones
  ADD COLUMN IF NOT EXISTS plan_plataforma_id uuid
    REFERENCES planes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nivel_acompanamiento nivel_acompanamiento_enum;
