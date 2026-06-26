-- ============================================================
-- A360 Suite - Schema Completo Consolidado
-- Generado desde todas las migraciones en supabase/migrations/
-- Compatible con un proyecto Supabase vacío (ejecutar en orden)
-- ============================================================

-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('admin', 'consultor', 'cliente', 'participante');
CREATE TYPE public.plan_nivel AS ENUM ('esencial', 'avanzado', 'corporativo');

-- ===== FUNCIÓN: updated_at (debe existir antes de los triggers) =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============================================================
-- TABLAS NÚCLEO
-- ============================================================

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  company     TEXT,
  specialty   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== USER ROLES =====
CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ===== FUNCIONES DE ROL (dependen de user_roles) =====
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'consultor' THEN 2 WHEN 'cliente' THEN 3 ELSE 4 END
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;

-- ===== CLIENTES =====
-- Incluye todas las columnas añadidas en migraciones posteriores
CREATE TABLE public.clientes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_empresa           TEXT NOT NULL,
  sector                   TEXT,
  tamano                   TEXT,
  pais                     TEXT,
  ciudad                   TEXT,
  web                      TEXT,
  consultor_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cliente_user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_licencia            TEXT NOT NULL DEFAULT 'esencial',
  activo                   BOOLEAN NOT NULL DEFAULT true,
  -- CRM extendido
  nombre_comercial         TEXT,
  subsector                TEXT,
  num_empleados            INTEGER,
  facturacion_anual        NUMERIC,
  moneda                   TEXT DEFAULT 'USD',
  direccion                TEXT,
  codigo_postal            TEXT,
  linkedin_empresa         TEXT,
  descripcion              TEXT,
  logo_url                 TEXT,
  estado                   TEXT DEFAULT 'activo',
  fecha_inicio_relacion    DATE,
  origen                   TEXT,
  notas_internas           TEXT,
  -- Créditos IA
  creditos_ia_usados       INTEGER NOT NULL DEFAULT 0,
  creditos_ia_reset_fecha  DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  creditos_ia_extra        INTEGER NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT clientes_estado_check
    CHECK (estado IN ('prospecto','activo','en_pausa','completado','inactivo'))
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- ===== HELPER: can_access_cliente (depende de clientes + has_role) =====
CREATE OR REPLACE FUNCTION public.can_access_cliente(_cliente_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = _cliente_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR (c.consultor_id = auth.uid() AND public.has_role(auth.uid(), 'consultor'))
        OR  c.cliente_user_id = auth.uid()
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_cliente(uuid) FROM PUBLIC, anon;

-- ============================================================
-- MÓDULOS PRINCIPALES
-- ============================================================

-- ===== SIDE SESIONES =====
CREATE TABLE public.side_sesiones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  consultor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_sesion   TEXT,
  scores          JSONB NOT NULL DEFAULT '{}'::jsonb,
  ivee_scores     JSONB,
  idf_scores      JSONB,
  cof_scores      JSONB,
  datos_financieros JSONB,
  ime_score       NUMERIC,
  ivee_score      NUMERIC,
  idf_score       NUMERIC,
  cof_score       NUMERIC,
  analisis_ia     JSONB NOT NULL DEFAULT '{}'::jsonb,
  completada      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.side_sesiones ENABLE ROW LEVEL SECURITY;

-- ===== PLANES ESTRATEGICOS =====
CREATE TABLE public.planes_estrategicos (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id              UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  consultor_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nivel                   public.plan_nivel NOT NULL DEFAULT 'esencial',
  sec01 JSONB, sec02 JSONB, sec03 JSONB, sec04 JSONB, sec05 JSONB,
  sec06 JSONB, sec07 JSONB, sec08 JSONB, sec09 JSONB,
  sec10_esg JSONB, sec11_alianzas JSONB, sec12_innovacion JSONB,
  sec13 JSONB, sec14 JSONB, sec15 JSONB, sec16 JSONB,
  sec17_cmi JSONB, sec18_ejecucion JSONB,
  herramientas_avanzadas  JSONB,
  herramientas_corporativas JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planes_estrategicos ENABLE ROW LEVEL SECURITY;

-- ===== COACHING SESIONES =====
CREATE TABLE public.coaching_sesiones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  consultor_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  herramienta_id TEXT,
  etapa         TEXT,
  datos         JSONB NOT NULL DEFAULT '{}'::jsonb,
  completada    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coaching_sesiones ENABLE ROW LEVEL SECURITY;

-- ===== LEE PROGRAMAS =====
CREATE TABLE public.lee_programas (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id               UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  facilitador_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  capitulos_desbloqueados  INTEGER[] NOT NULL DEFAULT '{1}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lee_programas ENABLE ROW LEVEL SECURITY;

-- ===== LEE WORKBOOKS =====
CREATE TABLE public.lee_workbooks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id      UUID NOT NULL REFERENCES public.lee_programas(id) ON DELETE CASCADE,
  participante_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  capitulo_numero  INTEGER NOT NULL,
  sesion_numero    INTEGER NOT NULL,
  respuestas       JSONB NOT NULL DEFAULT '{}'::jsonb,
  completado       BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lee_workbooks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CRM
-- ============================================================

-- ===== CLIENTE CONTACTOS =====
CREATE TABLE public.cliente_contactos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id            UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre                TEXT NOT NULL,
  apellido              TEXT NOT NULL,
  area                  TEXT,
  cargo                 TEXT,
  es_contacto_principal BOOLEAN NOT NULL DEFAULT false,
  es_decisor            BOOLEAN NOT NULL DEFAULT false,
  email                 TEXT,
  email_secundario      TEXT,
  celular               TEXT,
  telefono_oficina      TEXT,
  extension             TEXT,
  direccion             TEXT,
  ciudad                TEXT,
  linkedin_url          TEXT,
  foto_url              TEXT,
  fecha_nacimiento      DATE,
  notas                 TEXT,
  activo                BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cliente_contactos_cliente ON public.cliente_contactos(cliente_id);
ALTER TABLE public.cliente_contactos ENABLE ROW LEVEL SECURITY;

-- ===== CLIENTE ACTIVIDADES =====
-- Incluye campos de reporte de sesión y análisis IA
CREATE TABLE public.cliente_actividades (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id             UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  contacto_id            UUID REFERENCES public.cliente_contactos(id) ON DELETE SET NULL,
  consultor_id           UUID,
  tipo                   TEXT NOT NULL CHECK (tipo IN (
                           'llamada','reunion','email','propuesta','contrato','pago','nota',
                           'seguimiento','diagnostico','sesion_coaching','sesion_lee','entrega','otro'
                         )),
  titulo                 TEXT NOT NULL,
  descripcion            TEXT,
  fecha                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  duracion_minutos       INTEGER,
  resultado              TEXT,
  proxima_accion         TEXT,
  fecha_proxima_accion   DATE,
  adjunto_url            TEXT,
  -- Reporte de sesión de consultoría
  es_sesion_consultoria  BOOLEAN NOT NULL DEFAULT false,
  numero_sesion          INTEGER,
  modalidad              TEXT,
  hora_inicio            TEXT,
  hora_fin               TEXT,
  programa               TEXT,
  etapa_programa         TEXT,
  objetivo               TEXT,
  participantes          JSONB DEFAULT '[]'::jsonb,
  temas                  JSONB DEFAULT '[]'::jsonb,
  herramientas           JSONB DEFAULT '[]'::jsonb,
  logros                 JSONB DEFAULT '[]'::jsonb,
  semaforo               TEXT,
  justificacion_semaforo TEXT,
  proxima_fecha          TIMESTAMPTZ,
  proxima_temas          JSONB DEFAULT '[]'::jsonb,
  mensaje_cliente        TEXT,
  reporte_pdf_url        TEXT,
  -- Análisis IA
  analisis_ia            TEXT,
  analisis_ia_fecha      TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cliente_actividades_cliente ON public.cliente_actividades(cliente_id, fecha DESC);
ALTER TABLE public.cliente_actividades ENABLE ROW LEVEL SECURITY;

-- ===== CLIENTE COTIZACIONES =====
-- Incluye propuesta extendida
CREATE TABLE public.cliente_cotizaciones (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id            UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  contacto_id           UUID REFERENCES public.cliente_contactos(id) ON DELETE SET NULL,
  consultor_id          UUID,
  numero_cotizacion     TEXT UNIQUE,
  titulo                TEXT NOT NULL,
  descripcion           TEXT,
  plan                  TEXT CHECK (plan IN (
                          'diagnostico','estrategico','transformacion',
                          'coaching_ejecutivo','programa_integral','corporativo'
                        )),
  servicios             JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal              NUMERIC NOT NULL DEFAULT 0,
  descuento_porcentaje  NUMERIC NOT NULL DEFAULT 0,
  descuento_valor       NUMERIC NOT NULL DEFAULT 0,
  total                 NUMERIC NOT NULL DEFAULT 0,
  moneda                TEXT NOT NULL DEFAULT 'USD',
  estado                TEXT NOT NULL DEFAULT 'borrador'
                          CHECK (estado IN ('borrador','enviada','en_negociacion','aprobada','rechazada','vencida')),
  validez_dias          INTEGER NOT NULL DEFAULT 30,
  fecha_emision         DATE DEFAULT CURRENT_DATE,
  fecha_vencimiento     DATE,
  notas                 TEXT,
  condiciones           TEXT,
  -- Propuesta extendida
  ime_estimado          TEXT,
  justificacion_programa TEXT,
  entregables           JSONB NOT NULL DEFAULT '[]'::jsonb,
  diagnostico_resumen   TEXT,
  objetivos_propuesta   JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cliente_cotizaciones_cliente ON public.cliente_cotizaciones(cliente_id, created_at DESC);
ALTER TABLE public.cliente_cotizaciones ENABLE ROW LEVEL SECURITY;

-- ===== CLIENTE ONBOARDING =====
CREATE TABLE public.cliente_onboarding (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id        UUID NOT NULL UNIQUE,
  consultor_id      UUID,
  paso1_empresa     JSONB NOT NULL DEFAULT '{}'::jsonb,
  paso2_lider       JSONB NOT NULL DEFAULT '{}'::jsonb,
  paso3_contexto    JSONB NOT NULL DEFAULT '{}'::jsonb,
  paso4_expectativas JSONB NOT NULL DEFAULT '{}'::jsonb,
  paso5_acuerdo     JSONB NOT NULL DEFAULT '{}'::jsonb,
  analisis_ia       TEXT,
  completado        BOOLEAN NOT NULL DEFAULT false,
  fecha_completado  TIMESTAMPTZ,
  paso_actual       INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_onboarding_cliente ON public.cliente_onboarding(cliente_id);
ALTER TABLE public.cliente_onboarding ENABLE ROW LEVEL SECURITY;

-- ===== CLIENTE KPIS =====
CREATE TABLE public.cliente_kpis (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id       UUID NOT NULL,
  actividad_id     UUID,
  categoria        TEXT NOT NULL,
  nombre           TEXT NOT NULL,
  formula          TEXT,
  valor_meta       NUMERIC,
  valor_actual     NUMERIC,
  unidad           TEXT,
  semaforo         TEXT NOT NULL DEFAULT 'verde',
  observacion      TEXT,
  fecha_medicion   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kpis_cliente ON public.cliente_kpis(cliente_id);
CREATE INDEX idx_kpis_actividad ON public.cliente_kpis(actividad_id);
ALTER TABLE public.cliente_kpis ENABLE ROW LEVEL SECURITY;

-- ===== CLIENTE COMPROMISOS =====
CREATE TABLE public.cliente_compromisos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   UUID NOT NULL,
  actividad_id UUID,
  origen       TEXT NOT NULL DEFAULT 'cliente',
  descripcion  TEXT NOT NULL,
  responsable  TEXT,
  fecha_limite DATE,
  estado       TEXT NOT NULL DEFAULT 'pendiente',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_compromisos_cliente ON public.cliente_compromisos(cliente_id);
ALTER TABLE public.cliente_compromisos ENABLE ROW LEVEL SECURITY;

-- ===== CLIENTE COMPARTIDOS =====
CREATE TABLE public.cliente_compartidos (
  id                      UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id              UUID NOT NULL,
  consultor_id            UUID,
  tipo_contenido          TEXT NOT NULL CHECK (tipo_contenido IN (
                            'actividad','reporte_sesion','cotizacion','compromisos',
                            'onboarding','side','plan'
                          )),
  contenido_id            UUID,
  contenido_ids           JSONB NOT NULL DEFAULT '[]'::jsonb,
  titulo                  TEXT NOT NULL,
  mensaje                 TEXT,
  destinatarios           JSONB NOT NULL DEFAULT '[]'::jsonb,
  canales                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  incluir_pdf             BOOLEAN NOT NULL DEFAULT true,
  incluir_kpis            BOOLEAN NOT NULL DEFAULT false,
  incluir_compromisos     BOOLEAN NOT NULL DEFAULT false,
  pdf_url                 TEXT,
  share_token             TEXT UNIQUE,
  expira_en               TIMESTAMPTZ,
  vistas                  INTEGER NOT NULL DEFAULT 0,
  primera_vista           TIMESTAMPTZ,
  ultima_vista            TIMESTAMPTZ,
  ip_ultima_vista         TEXT,
  estado                  TEXT NOT NULL DEFAULT 'enviado'
                            CHECK (estado IN ('borrador','enviado','leido','revocado')),
  crear_compromiso_lectura BOOLEAN NOT NULL DEFAULT false,
  compromiso_id           UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_compartidos_cliente ON public.cliente_compartidos(cliente_id);
CREATE INDEX idx_compartidos_token ON public.cliente_compartidos(share_token) WHERE share_token IS NOT NULL;
ALTER TABLE public.cliente_compartidos ENABLE ROW LEVEL SECURITY;

-- ===== APP SETTINGS (singleton) =====
CREATE TABLE public.app_settings (
  id              TEXT PRIMARY KEY DEFAULT 'global',
  company_name    TEXT NOT NULL DEFAULT 'Aceleradora 360',
  app_name        TEXT NOT NULL DEFAULT 'A360SGP Suite',
  logo_url        TEXT,
  primary_color   TEXT NOT NULL DEFAULT '#1a2b5a',
  accent_color    TEXT NOT NULL DEFAULT '#c9a84c',
  font_family     TEXT NOT NULL DEFAULT 'DM Sans',
  content_strings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = 'global')
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_clientes_updated
  BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_side_updated
  BEFORE UPDATE ON public.side_sesiones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_planes_updated
  BEFORE UPDATE ON public.planes_estrategicos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_workbooks_updated
  BEFORE UPDATE ON public.lee_workbooks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cliente_contactos_updated_at
  BEFORE UPDATE ON public.cliente_contactos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cliente_cotizaciones_updated_at
  BEFORE UPDATE ON public.cliente_cotizaciones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_onboarding_updated
  BEFORE UPDATE ON public.cliente_onboarding FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_kpis_updated
  BEFORE UPDATE ON public.cliente_kpis FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_compromisos_updated
  BEFORE UPDATE ON public.cliente_compromisos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_compartidos_updated
  BEFORE UPDATE ON public.cliente_compartidos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TRIGGER: auto-crear perfil al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCIONES ADICIONALES
-- ============================================================

-- Auto-generar número de cotizacion (COT-YYYY-NNN)
CREATE OR REPLACE FUNCTION public.generar_numero_cotizacion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_year  TEXT;
  v_consec INTEGER;
BEGIN
  IF NEW.numero_cotizacion IS NOT NULL AND NEW.numero_cotizacion <> '' THEN
    RETURN NEW;
  END IF;
  v_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(split_part(numero_cotizacion, '-', 3) AS INTEGER)), 0) + 1
    INTO v_consec
    FROM public.cliente_cotizaciones
   WHERE numero_cotizacion LIKE 'COT-' || v_year || '-%';
  NEW.numero_cotizacion := 'COT-' || v_year || '-' || lpad(v_consec::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generar_numero_cotizacion
  BEFORE INSERT ON public.cliente_cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_cotizacion();

-- Auto-calcular fecha_vencimiento desde fecha_emision + validez_dias
CREATE OR REPLACE FUNCTION public.set_cotizacion_vencimiento()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.fecha_emision IS NOT NULL AND NEW.fecha_vencimiento IS NULL THEN
    NEW.fecha_vencimiento := NEW.fecha_emision + (COALESCE(NEW.validez_dias, 30) || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_cotizacion_vencimiento
  BEFORE INSERT OR UPDATE ON public.cliente_cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.set_cotizacion_vencimiento();

-- Registrar visita a un compartido por token (accesible sin auth)
CREATE OR REPLACE FUNCTION public.registrar_vista_compartido(_token TEXT, _ip TEXT DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.cliente_compartidos
  SET vistas          = vistas + 1,
      primera_vista   = COALESCE(primera_vista, now()),
      ultima_vista    = now(),
      ip_ultima_vista = _ip,
      estado          = CASE WHEN estado = 'enviado' THEN 'leido' ELSE estado END
  WHERE share_token = _token
    AND estado <> 'revocado'
    AND (expira_en IS NULL OR expira_en > now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_vista_compartido(TEXT, TEXT) TO anon, authenticated;

-- Devuelve datos no-PII de un compartido por token (para páginas públicas)
CREATE OR REPLACE FUNCTION public.get_compartido_by_token(_token TEXT)
RETURNS TABLE (
  id                  UUID,
  cliente_id          UUID,
  tipo_contenido      TEXT,
  contenido_id        UUID,
  titulo              TEXT,
  mensaje             TEXT,
  pdf_url             TEXT,
  destinatarios_nombres JSONB,
  vistas              INTEGER,
  expira_en           TIMESTAMPTZ,
  estado              TEXT,
  created_at          TIMESTAMPTZ,
  incluir_kpis        BOOLEAN,
  incluir_compromisos BOOLEAN,
  nombre_empresa      TEXT
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.cliente_id, c.tipo_contenido, c.contenido_id,
         c.titulo, c.mensaje, c.pdf_url,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object('nombre', d->>'nombre'))
             FROM jsonb_array_elements(c.destinatarios) d
         ), '[]'::jsonb) AS destinatarios_nombres,
         c.vistas, c.expira_en, c.estado, c.created_at,
         c.incluir_kpis, c.incluir_compromisos,
         cl.nombre_empresa
    FROM public.cliente_compartidos c
    LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
   WHERE c.share_token = _token
     AND c.estado <> 'revocado'
     AND (c.expira_en IS NULL OR c.expira_en > now());
$$;

REVOKE ALL ON FUNCTION public.get_compartido_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_compartido_by_token(TEXT) TO anon, authenticated;

-- ============================================================
-- POLÍTICAS RLS
-- ============================================================

-- profiles
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));

CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "roles_select_self_or_admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "roles_admin_all" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- clientes
CREATE POLICY "clientes_admin_all" ON public.clientes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "clientes_consultor_own" ON public.clientes
  FOR ALL TO authenticated
  USING (consultor_id = auth.uid() AND public.has_role(auth.uid(), 'consultor'))
  WITH CHECK (consultor_id = auth.uid() AND public.has_role(auth.uid(), 'consultor'));

CREATE POLICY "clientes_cliente_self" ON public.clientes
  FOR SELECT TO authenticated
  USING (cliente_user_id = auth.uid());

-- side_sesiones
CREATE POLICY "side_access" ON public.side_sesiones
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- planes_estrategicos
CREATE POLICY "planes_access" ON public.planes_estrategicos
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- coaching_sesiones
CREATE POLICY "coaching_access" ON public.coaching_sesiones
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- lee_programas
CREATE POLICY "lee_prog_access" ON public.lee_programas
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id) OR facilitador_id = auth.uid())
  WITH CHECK (public.can_access_cliente(cliente_id) OR facilitador_id = auth.uid());

-- lee_workbooks
CREATE POLICY "workbooks_participante_self" ON public.lee_workbooks
  FOR ALL TO authenticated
  USING (
    participante_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.lee_programas p
      WHERE p.id = programa_id
        AND (p.facilitador_id = auth.uid() OR public.can_access_cliente(p.cliente_id))
    )
  )
  WITH CHECK (
    participante_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.lee_programas p
      WHERE p.id = programa_id
        AND (p.facilitador_id = auth.uid() OR public.can_access_cliente(p.cliente_id))
    )
  );

-- cliente_contactos
CREATE POLICY "contactos_access" ON public.cliente_contactos
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- cliente_actividades
CREATE POLICY "actividades_access" ON public.cliente_actividades
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- cliente_cotizaciones (solo admin y consultor asignado, no el cliente final)
CREATE POLICY "cotizaciones_admin" ON public.cliente_cotizaciones
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "cotizaciones_consultor" ON public.cliente_cotizaciones
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'consultor')
    AND EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.consultor_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'consultor')
    AND EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.consultor_id = auth.uid())
  );

-- cliente_onboarding
CREATE POLICY "onboarding_access" ON public.cliente_onboarding
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- cliente_kpis
CREATE POLICY "kpis_access" ON public.cliente_kpis
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- cliente_compromisos
CREATE POLICY "compromisos_access" ON public.cliente_compromisos
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- cliente_compartidos (acceso interno; el acceso público se hace via RPC get_compartido_by_token)
CREATE POLICY "compartidos_access" ON public.cliente_compartidos
  FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id))
  WITH CHECK (public.can_access_cliente(cliente_id));

-- app_settings (lectura pública para branding en login/SSR; escritura solo admin)
CREATE POLICY "app_settings_read_all" ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "app_settings_write_admin" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- DATOS INICIALES
-- ============================================================
INSERT INTO public.app_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Bucket privado para PDFs compartidos
INSERT INTO storage.buckets (id, name, public)
VALUES ('reportes-compartidos', 'reportes-compartidos', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket público para logos y branding
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas storage: reportes-compartidos (acceso por can_access_cliente via prefijo cliente_id/)
CREATE POLICY "compartidos_storage_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'reportes-compartidos'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "compartidos_storage_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'reportes-compartidos'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "compartidos_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'reportes-compartidos'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "compartidos_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'reportes-compartidos'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );

-- Políticas storage: branding
CREATE POLICY "branding_auth_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'branding');

CREATE POLICY "branding_admin_consultor_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'branding'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'))
  );

CREATE POLICY "branding_admin_consultor_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'branding'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'))
  );

CREATE POLICY "branding_admin_consultor_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'branding'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'))
  );

-- ============================================================
-- GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
