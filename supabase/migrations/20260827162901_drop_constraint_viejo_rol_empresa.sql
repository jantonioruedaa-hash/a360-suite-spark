-- Migración aplicada a producción el 27/08/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Elimina el check constraint antiguo de rol_empresa (que no incluía
-- jefe_area ni colaborador) y agrega los constraints definitivos junto
-- con las FKs compuestas de area_id en empresa_usuarios.

-- 1. Eliminar constraint viejo (nombre auto-generado por Postgres al crear la tabla)
ALTER TABLE public.empresa_usuarios
  DROP CONSTRAINT IF EXISTS empresa_usuarios_rol_empresa_check;

-- 2. Agregar check con los roles vigentes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'eu_rol_empresa_check'
      AND conrelid = 'empresa_usuarios'::regclass
  ) THEN
    ALTER TABLE public.empresa_usuarios
      ADD CONSTRAINT eu_rol_empresa_check
        CHECK (rol_empresa = ANY (ARRAY['dueño'::text, 'jefe_area'::text, 'colaborador'::text]));
  END IF;
END $$;

-- 3. jefe_area requiere area_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'eu_jefe_area_requires_area'
      AND conrelid = 'empresa_usuarios'::regclass
  ) THEN
    ALTER TABLE public.empresa_usuarios
      ADD CONSTRAINT eu_jefe_area_requires_area
        CHECK (rol_empresa <> 'jefe_area' OR area_id IS NOT NULL);
  END IF;
END $$;

-- 4. FK simple area_id → manual_areas(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'eu_area_id_fkey'
      AND conrelid = 'empresa_usuarios'::regclass
  ) THEN
    ALTER TABLE public.empresa_usuarios
      ADD CONSTRAINT eu_area_id_fkey
        FOREIGN KEY (area_id) REFERENCES public.manual_areas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. FK compuesta (cliente_id, area_id) → manual_areas(cliente_id, id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'eu_area_cliente_fk'
      AND conrelid = 'empresa_usuarios'::regclass
  ) THEN
    ALTER TABLE public.empresa_usuarios
      ADD CONSTRAINT eu_area_cliente_fk
        FOREIGN KEY (cliente_id, area_id)
        REFERENCES public.manual_areas(cliente_id, id) ON DELETE SET NULL;
  END IF;
END $$;
