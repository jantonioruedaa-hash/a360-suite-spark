-- ============================================================
-- SIDE: campos de revisión + trigger de seguridad (INSERT + UPDATE)
-- ============================================================
-- Agrega 4 campos a side_sesiones para soportar el flujo de
-- auto-diagnóstico del cliente con revisión/desbloqueo del consultor.
--
-- RIESGO CONOCIDO: scores (ime_score, ivee_score, idf_score, cof_score, scores JSONB)
-- son técnicamente legibles por el cliente via API directa incluso en estado
-- 'pendiente_revision'. No se ocultan a nivel de BD sin refactor a vista enmascarada.
-- El campo comentario_consultor (el único dato nuevo) está protegido naturalmente
-- (NULL hasta que el consultor lo escribe; trigger impide que cliente lo escriba).
-- El lock en UI es producto, no seguridad de datos.
-- ============================================================

-- 1. Nuevos campos
ALTER TABLE public.side_sesiones
  ADD COLUMN IF NOT EXISTS estado_revision TEXT NOT NULL DEFAULT 'borrador'
    CONSTRAINT side_sesiones_estado_revision_check
      CHECK (estado_revision IN ('borrador', 'pendiente_revision', 'revisado')),
  ADD COLUMN IF NOT EXISTS revisado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revisado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS comentario_consultor TEXT;

-- 2. Función del trigger — cubre INSERT y UPDATE
CREATE OR REPLACE FUNCTION public.side_sesiones_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role := public.current_user_role();
BEGIN
  IF _role = 'cliente' THEN

    IF TG_OP = 'INSERT' THEN
      -- No puede crear una sesión ya marcada como revisada
      IF NEW.estado_revision = 'revisado' THEN
        RAISE EXCEPTION 'El rol cliente no puede crear sesiones en estado revisado';
      END IF;
      -- Campos de revisión deben ser NULL en el momento de creación
      IF NEW.revisado_por IS NOT NULL
      OR NEW.revisado_en IS NOT NULL
      OR NEW.comentario_consultor IS NOT NULL THEN
        RAISE EXCEPTION 'Campos de revisión (revisado_por, revisado_en, comentario_consultor) deben ser NULL al crear una sesión';
      END IF;

    ELSIF TG_OP = 'UPDATE' THEN
      -- Solo permite la transición borrador → pendiente_revision
      IF NEW.estado_revision IS DISTINCT FROM OLD.estado_revision THEN
        IF NOT (OLD.estado_revision = 'borrador' AND NEW.estado_revision = 'pendiente_revision') THEN
          RAISE EXCEPTION 'Transición de estado no permitida para rol cliente (solo borrador → pendiente_revision)';
        END IF;
      END IF;
      -- Bloquea escritura en campos de revisión
      IF NEW.revisado_por IS DISTINCT FROM OLD.revisado_por
      OR NEW.revisado_en IS DISTINCT FROM OLD.revisado_en
      OR NEW.comentario_consultor IS DISTINCT FROM OLD.comentario_consultor THEN
        RAISE EXCEPTION 'Campos de revisión (revisado_por, revisado_en, comentario_consultor) son de escritura exclusiva para consultor/admin';
      END IF;
      -- Una vez enviado, no se puede reeditar ningún campo
      IF OLD.estado_revision = 'pendiente_revision' THEN
        RAISE EXCEPTION 'El diagnóstico ya fue enviado para revisión y no puede modificarse';
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.side_sesiones_guard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.side_sesiones_guard() TO authenticated;

-- 3. Trigger — BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS side_sesiones_guard_trigger ON public.side_sesiones;
DROP TRIGGER IF EXISTS side_sesiones_update_guard_trigger ON public.side_sesiones;
CREATE TRIGGER side_sesiones_guard_trigger
  BEFORE INSERT OR UPDATE ON public.side_sesiones
  FOR EACH ROW EXECUTE FUNCTION public.side_sesiones_guard();
