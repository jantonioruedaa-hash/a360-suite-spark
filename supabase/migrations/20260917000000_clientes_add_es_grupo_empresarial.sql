ALTER TABLE clientes ADD COLUMN IF NOT EXISTS
  es_grupo_empresarial boolean NOT NULL DEFAULT false;
