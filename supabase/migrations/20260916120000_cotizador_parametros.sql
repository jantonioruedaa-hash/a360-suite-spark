CREATE TABLE public.cotizador_parametros (
  id text PRIMARY KEY DEFAULT 'global',
  tarifa_coaching numeric NOT NULL DEFAULT 125,
  tarifa_consultoria_estrategica numeric NOT NULL DEFAULT 165,
  factor_tamano_pequena numeric NOT NULL DEFAULT 0.6,
  factor_tamano_mediana numeric NOT NULL DEFAULT 1.0,
  factor_tamano_grande numeric NOT NULL DEFAULT 1.5,
  factor_segmento_esencial numeric NOT NULL DEFAULT 0.6,
  factor_segmento_profesional numeric NOT NULL DEFAULT 0.65,
  factor_segmento_corporativo numeric NOT NULL DEFAULT 1.0,
  factor_segmento_premium numeric NOT NULL DEFAULT 1.0,
  descuento_anual_plataforma_pct numeric NOT NULL DEFAULT 15,
  descuento_prepago_guiado_pct numeric NOT NULL DEFAULT 8,
  descuento_prepago_acompanado_pct numeric NOT NULL DEFAULT 12,
  descuento_prepago_advisory_pct numeric NOT NULL DEFAULT 15,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cotizador_parametros_singleton CHECK (id = 'global')
);

ALTER TABLE public.cotizador_parametros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotizador_parametros_read_authenticated"
  ON public.cotizador_parametros FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "cotizador_parametros_write_admin"
  ON public.cotizador_parametros FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.cotizador_parametros (id) VALUES ('global');
