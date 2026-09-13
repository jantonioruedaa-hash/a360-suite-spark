-- Migración aplicada a producción el 24/07/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Crea tabla lee_workbook_html para guardar respuestas de workbook por capítulo.

CREATE TABLE IF NOT EXISTS public.lee_workbook_html (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id      uuid        NOT NULL REFERENCES public.lee_programas(id) ON DELETE CASCADE,
  capitulo_numero  integer     NOT NULL CHECK (capitulo_numero >= 1 AND capitulo_numero <= 10),
  respuestas       jsonb       NOT NULL DEFAULT '{}',
  completado       boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT lee_workbook_html_programa_capitulo_unique UNIQUE (programa_id, capitulo_numero)
);

ALTER TABLE public.lee_workbook_html ENABLE ROW LEVEL SECURITY;

CREATE POLICY lee_wb_html_access ON public.lee_workbook_html
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.lee_programas p
      WHERE p.id = lee_workbook_html.programa_id
        AND (p.facilitador_id = auth.uid() OR can_access_cliente(p.cliente_id))
    )
  );

GRANT ALL ON public.lee_workbook_html TO authenticated, service_role;
