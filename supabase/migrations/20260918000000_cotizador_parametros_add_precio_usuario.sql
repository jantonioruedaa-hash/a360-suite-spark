ALTER TABLE cotizador_parametros ADD COLUMN IF NOT EXISTS precio_usuario_adicional_esencial numeric NOT NULL DEFAULT 10;
ALTER TABLE cotizador_parametros ADD COLUMN IF NOT EXISTS precio_usuario_adicional_profesional numeric NOT NULL DEFAULT 10;
ALTER TABLE cotizador_parametros ADD COLUMN IF NOT EXISTS precio_usuario_adicional_corporativo numeric NOT NULL DEFAULT 8;
ALTER TABLE cotizador_parametros ADD COLUMN IF NOT EXISTS precio_usuario_adicional_premium numeric NOT NULL DEFAULT 8;
