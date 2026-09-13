-- Migración aplicada a producción el 17/08/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Crea las tablas de plantilla de manual de funciones para clonar a nuevos clientes.

CREATE TABLE IF NOT EXISTS public.manual_plantilla_areas (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  orden      integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.manual_plantilla_cargos (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_area_id    uuid        NOT NULL REFERENCES public.manual_plantilla_areas(id) ON DELETE CASCADE,
  cargo                text        NOT NULL,
  jefe_inmediato       text,
  codigo               text,
  version              text        NOT NULL DEFAULT '1.0',
  fecha_elaboracion    date,
  fecha_revision       date,
  elaborado_por        text,
  aprobado_por         text,
  vacante              boolean     NOT NULL DEFAULT false,
  estado               text        NOT NULL DEFAULT 'vigente',
  objetivo             text,
  supervisa_a          jsonb       NOT NULL DEFAULT '[]',
  requisitos           jsonb       NOT NULL DEFAULT '{}',
  funciones            jsonb       NOT NULL DEFAULT '[]',
  competencias_blandas jsonb       NOT NULL DEFAULT '[]',
  competencias_tecnicas jsonb      NOT NULL DEFAULT '[]',
  kpis                 jsonb       NOT NULL DEFAULT '[]',
  relaciones_internas  jsonb       NOT NULL DEFAULT '[]',
  relaciones_externas  jsonb       NOT NULL DEFAULT '[]',
  condiciones          jsonb       NOT NULL DEFAULT '{}',
  plan_carrera         text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.manual_plantilla_areas  TO authenticated, service_role;
GRANT ALL ON public.manual_plantilla_cargos TO authenticated, service_role;
