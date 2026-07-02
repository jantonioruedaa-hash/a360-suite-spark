CREATE TABLE IF NOT EXISTS public.manual_funciones_cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) NOT NULL,
  consultor_id UUID REFERENCES public.profiles(id),
  cargo TEXT NOT NULL,
  area TEXT NOT NULL,
  jefe_inmediato TEXT,
  codigo TEXT,
  version TEXT DEFAULT '1.0',
  fecha_elaboracion DATE,
  fecha_revision DATE,
  elaborado_por TEXT,
  aprobado_por TEXT,
  vacante BOOLEAN DEFAULT FALSE,
  estado TEXT DEFAULT 'vigente',
  objetivo TEXT,
  supervisa_a JSONB DEFAULT '[]',
  requisitos JSONB DEFAULT '{}',
  funciones JSONB DEFAULT '[]',
  competencias_blandas JSONB DEFAULT '[]',
  competencias_tecnicas JSONB DEFAULT '[]',
  kpis JSONB DEFAULT '[]',
  relaciones_internas JSONB DEFAULT '[]',
  relaciones_externas JSONB DEFAULT '[]',
  condiciones JSONB DEFAULT '{}',
  plan_carrera TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.manual_funciones_evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id UUID REFERENCES public.manual_funciones_cargos(id)
    ON DELETE CASCADE NOT NULL,
  consultor_id UUID REFERENCES public.profiles(id),
  nombre_evaluado TEXT,
  fecha_evaluacion DATE DEFAULT CURRENT_DATE,
  competencias_evaluadas JSONB DEFAULT '[]',
  indice_global NUMERIC(5,2),
  semaforo TEXT,
  plan_desarrollo JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.manual_funciones_cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_funciones_evaluaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mf_cargos_select" ON public.manual_funciones_cargos
  FOR SELECT TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mf_cargos_insert" ON public.manual_funciones_cargos
  FOR INSERT TO authenticated
  WITH CHECK (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mf_cargos_update" ON public.manual_funciones_cargos
  FOR UPDATE TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mf_cargos_delete" ON public.manual_funciones_cargos
  FOR DELETE TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mf_eval_select" ON public.manual_funciones_evaluaciones
  FOR SELECT TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mf_eval_insert" ON public.manual_funciones_evaluaciones
  FOR INSERT TO authenticated
  WITH CHECK (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mf_eval_update" ON public.manual_funciones_evaluaciones
  FOR UPDATE TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mf_eval_delete" ON public.manual_funciones_evaluaciones
  FOR DELETE TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
