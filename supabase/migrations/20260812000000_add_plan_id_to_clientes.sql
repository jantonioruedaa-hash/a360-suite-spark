-- Decision 1: Add plan_id FK to clientes, backfill from plan_licencia text.
-- Target branch: feat-plan-fields-unification (wvkoqhtjvneqfilaomut)
-- DO NOT apply to production (hmdwaubkuvkvtsvwtifh) without explicit approval.

-- ── Reporte ANTES (columna aún no existe) ────────────────────
DO $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.clientes;
  RAISE NOTICE 'ANTES backfill — total clientes: %, plan_id: columna aún no existe', v_total;
END $$;

-- ── Agregar columna (idempotente) ─────────────────────────────
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.planes(id) ON DELETE SET NULL;

-- ── Backfill idempotente ──────────────────────────────────────
-- Solo toca filas sin plan_id. Usa LOWER() para tolerar variaciones de casing.
UPDATE public.clientes
SET plan_id = CASE LOWER(plan_licencia)
  WHEN 'esencial'    THEN 'a1000000-0000-0000-0000-000000000001'::uuid
  WHEN 'profesional' THEN 'a1000000-0000-0000-0000-000000000002'::uuid
  WHEN 'corporativo' THEN 'a1000000-0000-0000-0000-000000000003'::uuid
  WHEN 'premium'     THEN '0bfe4eec-ce75-4c50-906d-d7f6284fd533'::uuid
  ELSE NULL
END
WHERE plan_id IS NULL;

-- ── Reporte DESPUÉS ───────────────────────────────────────────
DO $$
DECLARE
  v_total       INTEGER;
  v_con_plan_id INTEGER;
  v_sin_plan_id INTEGER;
BEGIN
  SELECT COUNT(*)                      INTO v_total       FROM public.clientes;
  SELECT COUNT(*) FILTER (WHERE plan_id IS NOT NULL) INTO v_con_plan_id FROM public.clientes;
  SELECT COUNT(*) FILTER (WHERE plan_id IS NULL)     INTO v_sin_plan_id FROM public.clientes;
  RAISE NOTICE 'DESPUÉS backfill — total: %, con plan_id: %, sin plan_id: %',
    v_total, v_con_plan_id, v_sin_plan_id;
END $$;
