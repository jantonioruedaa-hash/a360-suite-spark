-- Migración aplicada a producción el 22/07/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Fase 2 de evaluaciones: crea manual_funciones_evaluaciones_desempeno
-- y agrega columnas de seguimiento a manual_funciones_evaluaciones.

-- 1. Columnas adicionales en manual_funciones_evaluaciones
ALTER TABLE public.manual_funciones_evaluaciones
  ADD COLUMN IF NOT EXISTS evaluador         text,
  ADD COLUMN IF NOT EXISTS proxima_revision  date,
  ADD COLUMN IF NOT EXISTS observacion_general text;

-- 2. Tabla de evaluaciones de desempeño (diferente de evaluaciones de competencias)
CREATE TABLE IF NOT EXISTS public.manual_funciones_evaluaciones_desempeno (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id             uuid        NOT NULL REFERENCES public.manual_funciones_cargos(id) ON DELETE CASCADE,
  consultor_id         uuid        REFERENCES public.profiles(id),
  nombre_evaluado      text,
  evaluador            text,
  fecha_evaluacion     date        NOT NULL DEFAULT CURRENT_DATE,
  periodo              text,
  kpi_scores           jsonb       NOT NULL DEFAULT '[]',
  comp_scores          jsonb       NOT NULL DEFAULT '[]',
  cond_scores          jsonb       NOT NULL DEFAULT '[]',
  objetivos            jsonb       NOT NULL DEFAULT '[]',
  observacion_evaluado text,
  observacion_evaluador text,
  observacion_rrhh     text,
  plan_mejora          jsonb       NOT NULL DEFAULT '[]',
  firma_rrhh           text,
  fecha_firma          date,
  score_total          numeric,
  semaforo             text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_funciones_evaluaciones_desempeno ENABLE ROW LEVEL SECURITY;

CREATE POLICY mf_eval_desemp_select ON public.manual_funciones_evaluaciones_desempeno
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.manual_funciones_cargos c
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
        AND can_access_cliente(c.cliente_id)
    )
  );

CREATE POLICY mf_eval_desemp_insert ON public.manual_funciones_evaluaciones_desempeno
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
  );

CREATE POLICY mf_eval_desemp_update ON public.manual_funciones_evaluaciones_desempeno
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
  );

CREATE POLICY mf_eval_desemp_delete ON public.manual_funciones_evaluaciones_desempeno
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
  );

GRANT ALL ON public.manual_funciones_evaluaciones_desempeno TO authenticated, service_role;
