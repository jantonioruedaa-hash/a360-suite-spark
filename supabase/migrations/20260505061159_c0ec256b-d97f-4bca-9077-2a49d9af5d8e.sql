
-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('admin', 'consultor', 'cliente', 'participante');
CREATE TYPE public.plan_nivel AS ENUM ('esencial', 'avanzado', 'corporativo');

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  specialty TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== USER ROLES =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ===== ROLE HELPERS =====
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() ORDER BY
    CASE role WHEN 'admin' THEN 1 WHEN 'consultor' THEN 2 WHEN 'cliente' THEN 3 ELSE 4 END
  LIMIT 1;
$$;

-- ===== CLIENTES =====
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_empresa TEXT NOT NULL,
  sector TEXT,
  tamano TEXT,
  pais TEXT,
  ciudad TEXT,
  web TEXT,
  consultor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cliente_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_licencia TEXT NOT NULL DEFAULT 'esencial',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- ===== SIDE SESIONES =====
CREATE TABLE public.side_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  consultor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_sesion TEXT,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  ivee_scores JSONB,
  idf_scores JSONB,
  cof_scores JSONB,
  datos_financieros JSONB,
  ime_score NUMERIC,
  ivee_score NUMERIC,
  idf_score NUMERIC,
  cof_score NUMERIC,
  analisis_ia JSONB NOT NULL DEFAULT '{}'::jsonb,
  completada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.side_sesiones ENABLE ROW LEVEL SECURITY;

-- ===== PLANES ESTRATEGICOS =====
CREATE TABLE public.planes_estrategicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  consultor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nivel public.plan_nivel NOT NULL DEFAULT 'esencial',
  sec01 JSONB, sec02 JSONB, sec03 JSONB, sec04 JSONB, sec05 JSONB,
  sec06 JSONB, sec07 JSONB, sec08 JSONB, sec09 JSONB,
  sec10_esg JSONB, sec11_alianzas JSONB, sec12_innovacion JSONB,
  sec13 JSONB, sec14 JSONB, sec15 JSONB, sec16 JSONB,
  sec17_cmi JSONB, sec18_ejecucion JSONB,
  herramientas_avanzadas JSONB,
  herramientas_corporativas JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planes_estrategicos ENABLE ROW LEVEL SECURITY;

-- ===== COACHING SESIONES =====
CREATE TABLE public.coaching_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  consultor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  herramienta_id TEXT,
  etapa TEXT,
  datos JSONB NOT NULL DEFAULT '{}'::jsonb,
  completada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coaching_sesiones ENABLE ROW LEVEL SECURITY;

-- ===== LEE PROGRAMAS =====
CREATE TABLE public.lee_programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  facilitador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  capitulos_desbloqueados INTEGER[] NOT NULL DEFAULT '{1}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lee_programas ENABLE ROW LEVEL SECURITY;

-- ===== LEE WORKBOOKS =====
CREATE TABLE public.lee_workbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id UUID NOT NULL REFERENCES public.lee_programas(id) ON DELETE CASCADE,
  participante_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  capitulo_numero INTEGER NOT NULL,
  sesion_numero INTEGER NOT NULL,
  respuestas JSONB NOT NULL DEFAULT '{}'::jsonb,
  completado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lee_workbooks ENABLE ROW LEVEL SECURITY;

-- ===== TRIGGERS: updated_at =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_side_updated BEFORE UPDATE ON public.side_sesiones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_planes_updated BEFORE UPDATE ON public.planes_estrategicos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_workbooks_updated BEFORE UPDATE ON public.lee_workbooks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== TRIGGER: auto-create profile on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  -- Default role: cliente (admins promote later)
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================================
-- RLS POLICIES
-- ===========================================================

-- profiles
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles (only admins manage; users can read their own)
CREATE POLICY "roles_select_self_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- clientes
CREATE POLICY "clientes_admin_all" ON public.clientes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "clientes_consultor_own" ON public.clientes FOR ALL TO authenticated
  USING (consultor_id = auth.uid() AND public.has_role(auth.uid(), 'consultor'))
  WITH CHECK (consultor_id = auth.uid() AND public.has_role(auth.uid(), 'consultor'));
CREATE POLICY "clientes_cliente_self" ON public.clientes FOR SELECT TO authenticated
  USING (cliente_user_id = auth.uid());

-- helper: user can access cliente?
CREATE OR REPLACE FUNCTION public.can_access_cliente(_cliente_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = _cliente_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR (c.consultor_id = auth.uid() AND public.has_role(auth.uid(), 'consultor'))
        OR (c.cliente_user_id = auth.uid())
      )
  );
$$;

-- side_sesiones
CREATE POLICY "side_access" ON public.side_sesiones FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- planes_estrategicos
CREATE POLICY "planes_access" ON public.planes_estrategicos FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- coaching_sesiones
CREATE POLICY "coaching_access" ON public.coaching_sesiones FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- lee_programas
CREATE POLICY "lee_prog_access" ON public.lee_programas FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id) OR facilitador_id = auth.uid())
  WITH CHECK (public.can_access_cliente(cliente_id) OR facilitador_id = auth.uid());

-- lee_workbooks
CREATE POLICY "workbooks_participante_self" ON public.lee_workbooks FOR ALL TO authenticated
  USING (
    participante_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.lee_programas p WHERE p.id = programa_id
               AND (p.facilitador_id = auth.uid() OR public.can_access_cliente(p.cliente_id)))
  )
  WITH CHECK (
    participante_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.lee_programas p WHERE p.id = programa_id
               AND (p.facilitador_id = auth.uid() OR public.can_access_cliente(p.cliente_id)))
  );
