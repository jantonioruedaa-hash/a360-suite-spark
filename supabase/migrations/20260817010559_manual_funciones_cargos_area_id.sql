-- Migración aplicada a producción el 17/08/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Agrega area_id (FK a manual_areas) a manual_funciones_cargos y popula
-- desde el campo texto 'area'.

ALTER TABLE public.manual_funciones_cargos
  ADD COLUMN IF NOT EXISTS area_id uuid;

-- Popula area_id a partir del nombre de área guardado en el campo texto
UPDATE public.manual_funciones_cargos mfc
SET area_id = ma.id
FROM public.manual_areas ma
WHERE ma.cliente_id = mfc.cliente_id
  AND ma.nombre     = mfc.area
  AND mfc.area_id   IS NULL;

-- NOT NULL: todos los cargos deben tener área
ALTER TABLE public.manual_funciones_cargos
  ALTER COLUMN area_id SET NOT NULL;

-- FK simple a manual_areas(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mf_cargos_area_id_fkey'
      AND conrelid = 'manual_funciones_cargos'::regclass
  ) THEN
    ALTER TABLE public.manual_funciones_cargos
      ADD CONSTRAINT mf_cargos_area_id_fkey
        FOREIGN KEY (area_id) REFERENCES public.manual_areas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- FK compuesta (cliente_id, area_id) → manual_areas(cliente_id, id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mf_cargos_area_cliente_fk'
      AND conrelid = 'manual_funciones_cargos'::regclass
  ) THEN
    ALTER TABLE public.manual_funciones_cargos
      ADD CONSTRAINT mf_cargos_area_cliente_fk
        FOREIGN KEY (cliente_id, area_id)
        REFERENCES public.manual_areas(cliente_id, id) ON DELETE SET NULL;
  END IF;
END $$;
