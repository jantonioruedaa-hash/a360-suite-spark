-- ============================================================
-- Tablas: planes, plan_modulos, empresa_plan
-- ============================================================

-- ── 1. planes ────────────────────────────────────────────────
CREATE TABLE public.planes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  precio      DECIMAL(10,2),
  descripcion TEXT,
  activo      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;

-- ── 2. plan_modulos ──────────────────────────────────────────
-- modulo_slug: side | plan_estrategico | coaching | lee |
--              marketing_digital | manual_funciones | kpis
CREATE TABLE public.plan_modulos (
  plan_id     UUID    NOT NULL REFERENCES public.planes(id) ON DELETE CASCADE,
  modulo_slug TEXT    NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (plan_id, modulo_slug)
);
ALTER TABLE public.plan_modulos ENABLE ROW LEVEL SECURITY;

-- ── 3. empresa_plan ──────────────────────────────────────────
CREATE TABLE public.empresa_plan (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  plan_id     UUID        NOT NULL REFERENCES public.planes(id)   ON DELETE RESTRICT,
  fecha_inicio DATE,
  fecha_fin    DATE,
  activo      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.empresa_plan ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- GRANTS
-- ============================================================
GRANT ALL ON public.planes       TO authenticated, service_role;
GRANT ALL ON public.plan_modulos TO authenticated, service_role;
GRANT ALL ON public.empresa_plan TO authenticated, service_role;
GRANT SELECT ON public.planes       TO anon;
GRANT SELECT ON public.plan_modulos TO anon;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- planes: todos los autenticados leen; solo admin escribe
CREATE POLICY "planes_select" ON public.planes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "planes_admin_write" ON public.planes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- plan_modulos: todos los autenticados leen; solo admin escribe
CREATE POLICY "plan_modulos_select" ON public.plan_modulos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_modulos_admin_write" ON public.plan_modulos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- empresa_plan: admin gestiona todo; consultores y clientes leen las suyas
CREATE POLICY "empresa_plan_select" ON public.empresa_plan
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.can_access_cliente(empresa_id)
  );
CREATE POLICY "empresa_plan_admin_write" ON public.empresa_plan
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- DATOS INICIALES
-- UUIDs fijos para poder referenciarlos en migraciones futuras
-- ============================================================
INSERT INTO public.planes (id, nombre, precio, descripcion) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Esencial',    99.00,  'Diagnóstico SIDE y Plan Estratégico'),
  ('a1000000-0000-0000-0000-000000000002', 'Profesional', 199.00, 'SIDE, Plan Estratégico, Coaching, LEE y KPIs'),
  ('a1000000-0000-0000-0000-000000000003', 'Enterprise',  349.00, 'Acceso completo a todos los módulos de la plataforma')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.plan_modulos (plan_id, modulo_slug) VALUES
  -- Esencial
  ('a1000000-0000-0000-0000-000000000001', 'side'),
  ('a1000000-0000-0000-0000-000000000001', 'plan_estrategico'),
  -- Profesional
  ('a1000000-0000-0000-0000-000000000002', 'side'),
  ('a1000000-0000-0000-0000-000000000002', 'plan_estrategico'),
  ('a1000000-0000-0000-0000-000000000002', 'coaching'),
  ('a1000000-0000-0000-0000-000000000002', 'lee'),
  ('a1000000-0000-0000-0000-000000000002', 'kpis'),
  -- Enterprise
  ('a1000000-0000-0000-0000-000000000003', 'side'),
  ('a1000000-0000-0000-0000-000000000003', 'plan_estrategico'),
  ('a1000000-0000-0000-0000-000000000003', 'coaching'),
  ('a1000000-0000-0000-0000-000000000003', 'lee'),
  ('a1000000-0000-0000-0000-000000000003', 'marketing_digital'),
  ('a1000000-0000-0000-0000-000000000003', 'manual_funciones'),
  ('a1000000-0000-0000-0000-000000000003', 'kpis')
ON CONFLICT (plan_id, modulo_slug) DO NOTHING;
