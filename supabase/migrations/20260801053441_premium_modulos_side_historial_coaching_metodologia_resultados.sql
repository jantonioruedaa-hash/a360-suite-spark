-- Migración aplicada a producción el 01/08/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Crea el plan Premium y agrega sus módulos, incluyendo side_historial,
-- coaching_metodologia y coaching_resultados como exclusivos Premium.

INSERT INTO public.planes (id, nombre, precio, descripcion, activo)
VALUES ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'Premium', 1000.00, NULL, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.plan_modulos (plan_id, modulo_slug, activo)
VALUES
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'side',                 true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'side_historial',       true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'plan_estrategico',     true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'coaching',             true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'coaching_metodologia', true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'coaching_resultados',  true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'lee',                  true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'kpis',                 true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'manual_funciones',     true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'marketing_digital',    true)
ON CONFLICT (plan_id, modulo_slug) DO NOTHING;
