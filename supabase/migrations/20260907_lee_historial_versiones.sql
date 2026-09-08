-- ── lee_historial_versiones ──────────────────────────────────────────────────
-- Tabla append-only de snapshots de versiones del workbook HTML por capítulo/sesión LEE.
-- Una fila por snapshot; nunca se actualiza. Retención gestionada en capa de aplicación:
--   origen 'auto_nav' / 'auto_exit' → máximo 5 por (programa_id, capitulo_numero, sesion_id)
--   origen 'manual'                 → sin límite automático; el usuario borra manualmente.

CREATE TABLE public.lee_historial_versiones (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id     uuid        NOT NULL REFERENCES public.lee_programas(id) ON DELETE CASCADE,
  capitulo_numero integer     NOT NULL CHECK (capitulo_numero BETWEEN 1 AND 10),
  sesion_id       text,                           -- 'in' | 's1'..'s8' | 'ci' | NULL
  snapshot        jsonb       NOT NULL DEFAULT '{}',
  origen          text        NOT NULL CHECK (origen IN ('auto_nav', 'auto_exit', 'manual')),
  etiqueta        text,                           -- solo para origen = 'manual'
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índice principal: listar todas las versiones de un capítulo ordenadas por fecha
CREATE INDEX lee_historial_prog_cap_idx
  ON public.lee_historial_versiones (programa_id, capitulo_numero, created_at DESC);

-- Índice secundario: filtrar por sesión (para la vista por sesión individual)
CREATE INDEX lee_historial_prog_cap_ses_idx
  ON public.lee_historial_versiones (programa_id, capitulo_numero, sesion_id, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.lee_historial_versiones ENABLE ROW LEVEL SECURITY;

-- Réplica exacta del patrón de lee_workbook_html:
-- admin OR (facilitador propio del programa OR acceso al cliente vía can_access_cliente).
CREATE POLICY lee_historial_access
  ON public.lee_historial_versiones
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.lee_programas p
      WHERE p.id = lee_historial_versiones.programa_id
        AND (p.facilitador_id = auth.uid() OR can_access_cliente(p.cliente_id))
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.lee_programas p
      WHERE p.id = lee_historial_versiones.programa_id
        AND (p.facilitador_id = auth.uid() OR can_access_cliente(p.cliente_id))
    )
  );
