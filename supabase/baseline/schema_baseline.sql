-- ============================================================
-- a360-suite-spark — BASELINE SCHEMA SNAPSHOT
-- Extracted from production (hmdwaubkuvkvtsvwtifh) on 2026-08-12
-- Source of truth: DDL queried directly from pg_catalog / information_schema.
--
-- USE: Apply this file to initialize a new Supabase dev branch.
-- DO NOT place this inside supabase/migrations/ — it must NOT be
-- re-applied as an incremental migration.
-- ============================================================

-- ── 0. EXTENSIONS ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto       WITH SCHEMA extensions;

-- ── 1. CUSTOM TYPES ──────────────────────────────────────────
CREATE TYPE public.app_role AS ENUM ('admin', 'consultor', 'cliente', 'participante');
CREATE TYPE public.plan_nivel AS ENUM ('esencial', 'avanzado', 'corporativo');

-- ── 2. TABLES (columns + PKs; FKs added later) ───────────────

CREATE TABLE public.profiles (
  id          UUID        NOT NULL PRIMARY KEY,
  email       TEXT        NOT NULL,
  name        TEXT,
  company     TEXT,
  specialty   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email)
);

CREATE TABLE public.user_roles (
  id         UUID       NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID       NOT NULL,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.clientes (
  id                    UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_empresa        TEXT        NOT NULL,
  sector                TEXT,
  tamano                TEXT,
  pais                  TEXT,
  ciudad                TEXT,
  web                   TEXT,
  consultor_id          UUID,
  cliente_user_id       UUID,
  plan_licencia         TEXT        NOT NULL DEFAULT 'esencial'::text,
  activo                BOOLEAN     NOT NULL DEFAULT true,
  nombre_comercial      TEXT,
  subsector             TEXT,
  num_empleados         INTEGER,
  facturacion_anual     NUMERIC,
  moneda                TEXT        DEFAULT 'USD'::text,
  direccion             TEXT,
  codigo_postal         TEXT,
  linkedin_empresa      TEXT,
  descripcion           TEXT,
  logo_url              TEXT,
  estado                TEXT        DEFAULT 'activo'::text,
  fecha_inicio_relacion DATE,
  origen                TEXT,
  notas_internas        TEXT,
  creditos_ia_usados    INTEGER     NOT NULL DEFAULT 0,
  creditos_ia_reset_fecha DATE      NOT NULL DEFAULT (date_trunc('month', now()))::date,
  creditos_ia_extra     INTEGER     NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT clientes_estado_check CHECK (estado = ANY (ARRAY['prospecto','activo','en_pausa','completado','inactivo']))
);

CREATE TABLE public.planes (
  id          UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  precio      NUMERIC,
  descripcion TEXT,
  activo      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.plan_modulos (
  plan_id     UUID    NOT NULL,
  modulo_slug TEXT    NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (plan_id, modulo_slug)
);

CREATE TABLE public.empresa_plan (
  id          UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL,
  plan_id     UUID        NOT NULL,
  fecha_inicio DATE,
  fecha_fin    DATE,
  activo      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.planes_estrategicos (
  id                      UUID              NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id              UUID              NOT NULL,
  consultor_id            UUID,
  nivel                   public.plan_nivel NOT NULL DEFAULT 'esencial'::plan_nivel,
  sec01                   JSONB,
  sec02                   JSONB,
  sec03                   JSONB,
  sec04                   JSONB,
  sec05                   JSONB,
  sec06                   JSONB,
  sec07                   JSONB,
  sec08                   JSONB,
  sec09                   JSONB,
  sec10_esg               JSONB,
  sec11_alianzas          JSONB,
  sec12_innovacion        JSONB,
  sec13                   JSONB,
  sec14                   JSONB,
  sec15                   JSONB,
  sec16                   JSONB,
  sec17_cmi               JSONB,
  sec18_ejecucion         JSONB,
  herramientas_avanzadas  JSONB,
  herramientas_corporativas JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.side_sesiones (
  id              UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      UUID        NOT NULL,
  consultor_id    UUID,
  nombre_sesion   TEXT,
  scores          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  ivee_scores     JSONB,
  idf_scores      JSONB,
  cof_scores      JSONB,
  datos_financieros JSONB,
  ime_score       NUMERIC,
  ivee_score      NUMERIC,
  idf_score       NUMERIC,
  cof_score       NUMERIC,
  analisis_ia     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  completada      BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.coaching_sesiones (
  id           UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   UUID        NOT NULL,
  consultor_id UUID,
  herramienta_id TEXT,
  etapa        TEXT,
  datos        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  completada   BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lee_programas (
  id                      UUID     NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id              UUID     NOT NULL,
  facilitador_id          UUID,
  capitulos_desbloqueados INTEGER[] NOT NULL DEFAULT '{1}'::integer[],
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lee_workbooks (
  id              UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id     UUID        NOT NULL,
  participante_id UUID,
  capitulo_numero INTEGER     NOT NULL,
  sesion_numero   INTEGER     NOT NULL,
  respuestas      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  completado      BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lee_workbook_html (
  id              UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id     UUID        NOT NULL,
  capitulo_numero INTEGER     NOT NULL,
  respuestas      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  completado      BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lee_workbook_html_capitulo_check CHECK (capitulo_numero >= 1 AND capitulo_numero <= 10),
  UNIQUE (programa_id, capitulo_numero)
);

CREATE TABLE public.cliente_contactos (
  id                    UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id            UUID        NOT NULL,
  nombre                TEXT        NOT NULL,
  apellido              TEXT        NOT NULL,
  area                  TEXT,
  cargo                 TEXT,
  es_contacto_principal BOOLEAN     NOT NULL DEFAULT false,
  es_decisor            BOOLEAN     NOT NULL DEFAULT false,
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
  activo                BOOLEAN     NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cliente_actividades (
  id                    UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id            UUID        NOT NULL,
  contacto_id           UUID,
  consultor_id          UUID,
  tipo                  TEXT        NOT NULL,
  titulo                TEXT        NOT NULL,
  descripcion           TEXT,
  fecha                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  duracion_minutos      INTEGER,
  resultado             TEXT,
  proxima_accion        TEXT,
  fecha_proxima_accion  DATE,
  adjunto_url           TEXT,
  es_sesion_consultoria BOOLEAN     NOT NULL DEFAULT false,
  numero_sesion         INTEGER,
  modalidad             TEXT,
  hora_inicio           TEXT,
  hora_fin              TEXT,
  programa              TEXT,
  etapa_programa        TEXT,
  objetivo              TEXT,
  participantes         JSONB       DEFAULT '[]'::jsonb,
  temas                 JSONB       DEFAULT '[]'::jsonb,
  herramientas          JSONB       DEFAULT '[]'::jsonb,
  logros                JSONB       DEFAULT '[]'::jsonb,
  semaforo              TEXT,
  justificacion_semaforo TEXT,
  proxima_fecha         TIMESTAMPTZ,
  proxima_temas         JSONB       DEFAULT '[]'::jsonb,
  mensaje_cliente       TEXT,
  reporte_pdf_url       TEXT,
  analisis_ia           TEXT,
  analisis_ia_fecha     TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cliente_actividades_tipo_check CHECK (tipo = ANY (ARRAY[
    'llamada','reunion','email','propuesta','contrato','pago','nota',
    'seguimiento','diagnostico','sesion_coaching','sesion_lee','entrega','otro'
  ]))
);

CREATE TABLE public.cliente_cotizaciones (
  id                    UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id            UUID        NOT NULL,
  contacto_id           UUID,
  consultor_id          UUID,
  numero_cotizacion     TEXT        UNIQUE,
  titulo                TEXT        NOT NULL,
  descripcion           TEXT,
  plan                  TEXT,
  servicios             JSONB       NOT NULL DEFAULT '[]'::jsonb,
  subtotal              NUMERIC     NOT NULL DEFAULT 0,
  descuento_porcentaje  NUMERIC     NOT NULL DEFAULT 0,
  descuento_valor       NUMERIC     NOT NULL DEFAULT 0,
  total                 NUMERIC     NOT NULL DEFAULT 0,
  moneda                TEXT        NOT NULL DEFAULT 'USD'::text,
  estado                TEXT        NOT NULL DEFAULT 'borrador'::text,
  validez_dias          INTEGER     NOT NULL DEFAULT 30,
  fecha_emision         DATE        DEFAULT CURRENT_DATE,
  fecha_vencimiento     DATE,
  notas                 TEXT,
  condiciones           TEXT,
  ime_estimado          TEXT,
  justificacion_programa TEXT,
  entregables           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  diagnostico_resumen   TEXT,
  objetivos_propuesta   JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cliente_cotizaciones_plan_check CHECK (plan = ANY (ARRAY[
    'diagnostico','estrategico','transformacion','coaching_ejecutivo','programa_integral','corporativo'
  ])),
  CONSTRAINT cliente_cotizaciones_estado_check CHECK (estado = ANY (ARRAY[
    'borrador','enviada','en_negociacion','aprobada','rechazada','vencida'
  ]))
);

CREATE TABLE public.cliente_onboarding (
  id                 UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id         UUID        NOT NULL,
  consultor_id       UUID,
  paso1_empresa      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  paso2_lider        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  paso3_contexto     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  paso4_expectativas JSONB       NOT NULL DEFAULT '{}'::jsonb,
  paso5_acuerdo      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  analisis_ia        TEXT,
  completado         BOOLEAN     NOT NULL DEFAULT false,
  fecha_completado   TIMESTAMPTZ,
  paso_actual        INTEGER     NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cliente_id)
);

CREATE TABLE public.cliente_kpis (
  id             UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id     UUID        NOT NULL,
  actividad_id   UUID,
  categoria      TEXT        NOT NULL,
  nombre         TEXT        NOT NULL,
  formula        TEXT,
  valor_meta     NUMERIC,
  valor_actual   NUMERIC,
  unidad         TEXT,
  semaforo       TEXT        NOT NULL DEFAULT 'verde'::text,
  observacion    TEXT,
  fecha_medicion DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cliente_compromisos (
  id            UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID        NOT NULL,
  actividad_id  UUID,
  origen        TEXT        NOT NULL DEFAULT 'cliente'::text,
  descripcion   TEXT        NOT NULL,
  responsable   TEXT,
  fecha_limite  DATE,
  estado        TEXT        NOT NULL DEFAULT 'pendiente'::text,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cliente_compartidos (
  id                      UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id              UUID        NOT NULL,
  consultor_id            UUID,
  tipo_contenido          TEXT        NOT NULL,
  contenido_id            UUID,
  contenido_ids           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  titulo                  TEXT        NOT NULL,
  mensaje                 TEXT,
  destinatarios           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  canales                 JSONB       NOT NULL DEFAULT '[]'::jsonb,
  incluir_pdf             BOOLEAN     NOT NULL DEFAULT true,
  incluir_kpis            BOOLEAN     NOT NULL DEFAULT false,
  incluir_compromisos     BOOLEAN     NOT NULL DEFAULT false,
  pdf_url                 TEXT,
  share_token             TEXT        UNIQUE,
  expira_en               TIMESTAMPTZ,
  vistas                  INTEGER     NOT NULL DEFAULT 0,
  primera_vista           TIMESTAMPTZ,
  ultima_vista            TIMESTAMPTZ,
  ip_ultima_vista         TEXT,
  estado                  TEXT        NOT NULL DEFAULT 'enviado'::text,
  crear_compromiso_lectura BOOLEAN    NOT NULL DEFAULT false,
  compromiso_id           UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cliente_compartidos_tipo_contenido_check CHECK (tipo_contenido = ANY (ARRAY[
    'actividad','reporte_sesion','cotizacion','compromisos','onboarding','side','plan'
  ])),
  CONSTRAINT cliente_compartidos_estado_check CHECK (estado = ANY (ARRAY[
    'borrador','enviado','leido','revocado'
  ]))
);

CREATE TABLE public.app_settings (
  id              TEXT        NOT NULL PRIMARY KEY DEFAULT 'global'::text,
  company_name    TEXT        NOT NULL DEFAULT 'Aceleradora 360'::text,
  app_name        TEXT        NOT NULL DEFAULT 'A360SGP Suite'::text,
  logo_url        TEXT,
  primary_color   TEXT        NOT NULL DEFAULT '#1a2b5a'::text,
  accent_color    TEXT        NOT NULL DEFAULT '#c9a84c'::text,
  font_family     TEXT        NOT NULL DEFAULT 'DM Sans'::text,
  content_strings JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = 'global'::text)
);

CREATE TABLE public.empresa_usuarios (
  id           UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   UUID        NOT NULL,
  user_id      UUID        NOT NULL,
  rol_empresa  TEXT        NOT NULL,
  invitado_por UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, user_id),
  CONSTRAINT empresa_usuarios_rol_empresa_check CHECK (rol_empresa = ANY (ARRAY['dueño','colaborador']))
);

CREATE TABLE public.empresa_invitaciones (
  id           UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   UUID        NOT NULL,
  email        TEXT        NOT NULL,
  rol_empresa  TEXT        NOT NULL,
  invitado_por UUID,
  removido_por UUID,
  removido_at  TIMESTAMPTZ,
  token        UUID        NOT NULL DEFAULT gen_random_uuid(),
  estado       TEXT        NOT NULL DEFAULT 'pendiente'::text,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  CONSTRAINT empresa_invitaciones_estado_check CHECK (estado = ANY (ARRAY['pendiente','aceptada','expirada','revocada'])),
  CONSTRAINT empresa_invitaciones_rol_empresa_check CHECK (rol_empresa = ANY (ARRAY['dueño','colaborador']))
);

CREATE TABLE public.empresa_usuario_modulos (
  cliente_id  UUID NOT NULL,
  user_id     UUID NOT NULL,
  modulo_slug TEXT NOT NULL,
  PRIMARY KEY (cliente_id, user_id, modulo_slug)
);

CREATE TABLE public.manual_areas (
  id         UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID        NOT NULL,
  nombre     TEXT        NOT NULL,
  orden      INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.manual_funciones_cargos (
  id                   UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id           UUID        NOT NULL,
  consultor_id         UUID,
  cargo                TEXT        NOT NULL,
  area                 TEXT        NOT NULL,
  jefe_inmediato       TEXT,
  codigo               TEXT,
  version              TEXT        DEFAULT '1.0'::text,
  fecha_elaboracion    DATE,
  fecha_revision       DATE,
  elaborado_por        TEXT,
  aprobado_por         TEXT,
  vacante              BOOLEAN     DEFAULT false,
  estado               TEXT        DEFAULT 'vigente'::text,
  objetivo             TEXT,
  supervisa_a          JSONB       DEFAULT '[]'::jsonb,
  requisitos           JSONB       DEFAULT '{}'::jsonb,
  funciones            JSONB       DEFAULT '[]'::jsonb,
  competencias_blandas JSONB       DEFAULT '[]'::jsonb,
  competencias_tecnicas JSONB      DEFAULT '[]'::jsonb,
  kpis                 JSONB       DEFAULT '[]'::jsonb,
  relaciones_internas  JSONB       DEFAULT '[]'::jsonb,
  relaciones_externas  JSONB       DEFAULT '[]'::jsonb,
  condiciones          JSONB       DEFAULT '{}'::jsonb,
  plan_carrera         TEXT,
  logo_url             TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.manual_funciones_evaluaciones (
  id                    UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id              UUID        NOT NULL,
  consultor_id          UUID,
  nombre_evaluado       TEXT,
  fecha_evaluacion      DATE        DEFAULT CURRENT_DATE,
  competencias_evaluadas JSONB      DEFAULT '[]'::jsonb,
  indice_global         NUMERIC,
  semaforo              TEXT,
  plan_desarrollo       JSONB       DEFAULT '[]'::jsonb,
  created_at            TIMESTAMPTZ DEFAULT now(),
  evaluador             TEXT,
  proxima_revision      DATE,
  observacion_general   TEXT,
  requisitos_evaluados  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  firmas                JSONB       NOT NULL DEFAULT '{}'::jsonb,
  cargo_data_hash       TEXT
);

CREATE TABLE public.manual_funciones_evaluaciones_desempeno (
  id                   UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id             UUID        NOT NULL,
  consultor_id         UUID,
  nombre_evaluado      TEXT,
  evaluador            TEXT,
  fecha_evaluacion     DATE        NOT NULL DEFAULT CURRENT_DATE,
  periodo              TEXT,
  kpi_scores           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  comp_scores          JSONB       NOT NULL DEFAULT '[]'::jsonb,
  cond_scores          JSONB       NOT NULL DEFAULT '[]'::jsonb,
  objetivos            JSONB       NOT NULL DEFAULT '[]'::jsonb,
  observacion_evaluado TEXT,
  observacion_evaluador TEXT,
  observacion_rrhh     TEXT,
  plan_mejora          JSONB       NOT NULL DEFAULT '[]'::jsonb,
  firma_rrhh           TEXT,
  fecha_firma          DATE,
  score_total          NUMERIC,
  semaforo             TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_sesiones (
  id              UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      UUID,
  consultor_id    UUID,
  nombre_sesion   TEXT        NOT NULL DEFAULT 'Nueva sesión'::text,
  empresa         JSONB       DEFAULT '{}'::jsonb,
  modulos         JSONB       DEFAULT '{}'::jsonb,
  reporte_config  JSONB       DEFAULT '{}'::jsonb,
  score_total     INTEGER     DEFAULT 0,
  completada      BOOLEAN     DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 3. FOREIGN KEY CONSTRAINTS ────────────────────────────────

-- profiles → auth.users
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_roles → auth.users
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- clientes → auth.users
ALTER TABLE public.clientes
  ADD CONSTRAINT clientes_consultor_id_fkey     FOREIGN KEY (consultor_id)    REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT clientes_cliente_user_id_fkey  FOREIGN KEY (cliente_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- plan_modulos → planes
ALTER TABLE public.plan_modulos
  ADD CONSTRAINT plan_modulos_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.planes(id) ON DELETE CASCADE;

-- empresa_plan → clientes, planes
ALTER TABLE public.empresa_plan
  ADD CONSTRAINT empresa_plan_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.clientes(id) ON DELETE CASCADE,
  ADD CONSTRAINT empresa_plan_plan_id_fkey    FOREIGN KEY (plan_id)    REFERENCES public.planes(id)   ON DELETE RESTRICT;

-- planes_estrategicos → clientes, auth.users
ALTER TABLE public.planes_estrategicos
  ADD CONSTRAINT planes_estrategicos_cliente_id_fkey   FOREIGN KEY (cliente_id)   REFERENCES public.clientes(id)  ON DELETE CASCADE,
  ADD CONSTRAINT planes_estrategicos_consultor_id_fkey FOREIGN KEY (consultor_id) REFERENCES auth.users(id)        ON DELETE SET NULL;

-- side_sesiones → clientes, auth.users
ALTER TABLE public.side_sesiones
  ADD CONSTRAINT side_sesiones_cliente_id_fkey   FOREIGN KEY (cliente_id)   REFERENCES public.clientes(id) ON DELETE CASCADE,
  ADD CONSTRAINT side_sesiones_consultor_id_fkey FOREIGN KEY (consultor_id) REFERENCES auth.users(id)       ON DELETE SET NULL;

-- coaching_sesiones → clientes, auth.users
ALTER TABLE public.coaching_sesiones
  ADD CONSTRAINT coaching_sesiones_cliente_id_fkey   FOREIGN KEY (cliente_id)   REFERENCES public.clientes(id) ON DELETE CASCADE,
  ADD CONSTRAINT coaching_sesiones_consultor_id_fkey FOREIGN KEY (consultor_id) REFERENCES auth.users(id)       ON DELETE SET NULL;

-- lee_programas → clientes, auth.users
ALTER TABLE public.lee_programas
  ADD CONSTRAINT lee_programas_cliente_id_fkey    FOREIGN KEY (cliente_id)   REFERENCES public.clientes(id) ON DELETE CASCADE,
  ADD CONSTRAINT lee_programas_facilitador_id_fkey FOREIGN KEY (facilitador_id) REFERENCES auth.users(id)   ON DELETE SET NULL;

-- lee_workbooks → lee_programas, auth.users
ALTER TABLE public.lee_workbooks
  ADD CONSTRAINT lee_workbooks_programa_id_fkey     FOREIGN KEY (programa_id)     REFERENCES public.lee_programas(id) ON DELETE CASCADE,
  ADD CONSTRAINT lee_workbooks_participante_id_fkey FOREIGN KEY (participante_id) REFERENCES auth.users(id)           ON DELETE SET NULL;

-- lee_workbook_html → lee_programas
ALTER TABLE public.lee_workbook_html
  ADD CONSTRAINT lee_workbook_html_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.lee_programas(id) ON DELETE CASCADE;

-- cliente_contactos → clientes
ALTER TABLE public.cliente_contactos
  ADD CONSTRAINT cliente_contactos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;

-- cliente_actividades → clientes, cliente_contactos
ALTER TABLE public.cliente_actividades
  ADD CONSTRAINT cliente_actividades_cliente_id_fkey  FOREIGN KEY (cliente_id)  REFERENCES public.clientes(id)          ON DELETE CASCADE,
  ADD CONSTRAINT cliente_actividades_contacto_id_fkey FOREIGN KEY (contacto_id) REFERENCES public.cliente_contactos(id) ON DELETE SET NULL;

-- cliente_cotizaciones → clientes, cliente_contactos
ALTER TABLE public.cliente_cotizaciones
  ADD CONSTRAINT cliente_cotizaciones_cliente_id_fkey  FOREIGN KEY (cliente_id)  REFERENCES public.clientes(id)          ON DELETE CASCADE,
  ADD CONSTRAINT cliente_cotizaciones_contacto_id_fkey FOREIGN KEY (contacto_id) REFERENCES public.cliente_contactos(id) ON DELETE SET NULL;

-- cliente_kpis → clientes, cliente_actividades
ALTER TABLE public.cliente_kpis
  ADD CONSTRAINT cliente_kpis_cliente_id_fkey   FOREIGN KEY (cliente_id)   REFERENCES public.clientes(id)           ON DELETE CASCADE,
  ADD CONSTRAINT cliente_kpis_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.cliente_actividades(id) ON DELETE SET NULL;

-- cliente_compromisos → clientes, cliente_actividades
ALTER TABLE public.cliente_compromisos
  ADD CONSTRAINT cliente_compromisos_cliente_id_fkey   FOREIGN KEY (cliente_id)   REFERENCES public.clientes(id)           ON DELETE CASCADE,
  ADD CONSTRAINT cliente_compromisos_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.cliente_actividades(id) ON DELETE SET NULL;

-- cliente_compartidos → clientes
ALTER TABLE public.cliente_compartidos
  ADD CONSTRAINT cliente_compartidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;

-- empresa_usuarios → clientes, auth.users
ALTER TABLE public.empresa_usuarios
  ADD CONSTRAINT empresa_usuarios_cliente_id_fkey   FOREIGN KEY (cliente_id)   REFERENCES public.clientes(id) ON DELETE CASCADE,
  ADD CONSTRAINT empresa_usuarios_user_id_fkey      FOREIGN KEY (user_id)      REFERENCES auth.users(id)       ON DELETE CASCADE,
  ADD CONSTRAINT empresa_usuarios_invitado_por_fkey FOREIGN KEY (invitado_por) REFERENCES auth.users(id)       ON DELETE NO ACTION;

-- empresa_invitaciones → clientes, auth.users
ALTER TABLE public.empresa_invitaciones
  ADD CONSTRAINT empresa_invitaciones_cliente_id_fkey   FOREIGN KEY (cliente_id)   REFERENCES public.clientes(id) ON DELETE CASCADE,
  ADD CONSTRAINT empresa_invitaciones_invitado_por_fkey FOREIGN KEY (invitado_por) REFERENCES auth.users(id)       ON DELETE NO ACTION,
  ADD CONSTRAINT empresa_invitaciones_removido_por_fkey FOREIGN KEY (removido_por) REFERENCES auth.users(id)       ON DELETE NO ACTION;

-- empresa_usuario_modulos → clientes, auth.users
ALTER TABLE public.empresa_usuario_modulos
  ADD CONSTRAINT empresa_usuario_modulos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE,
  ADD CONSTRAINT empresa_usuario_modulos_user_id_fkey    FOREIGN KEY (user_id)    REFERENCES auth.users(id)       ON DELETE CASCADE;

-- manual_areas → clientes
ALTER TABLE public.manual_areas
  ADD CONSTRAINT manual_areas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;

-- manual_funciones_cargos → clientes, profiles
ALTER TABLE public.manual_funciones_cargos
  ADD CONSTRAINT manual_funciones_cargos_cliente_id_fkey    FOREIGN KEY (cliente_id)   REFERENCES public.clientes(id)  ON DELETE NO ACTION,
  ADD CONSTRAINT manual_funciones_cargos_consultor_id_fkey  FOREIGN KEY (consultor_id) REFERENCES public.profiles(id)  ON DELETE NO ACTION;

-- manual_funciones_evaluaciones → manual_funciones_cargos, profiles
ALTER TABLE public.manual_funciones_evaluaciones
  ADD CONSTRAINT manual_funciones_evaluaciones_cargo_id_fkey    FOREIGN KEY (cargo_id)     REFERENCES public.manual_funciones_cargos(id) ON DELETE CASCADE,
  ADD CONSTRAINT manual_funciones_evaluaciones_consultor_id_fkey FOREIGN KEY (consultor_id) REFERENCES public.profiles(id)               ON DELETE NO ACTION;

-- manual_funciones_evaluaciones_desempeno → manual_funciones_cargos, profiles
ALTER TABLE public.manual_funciones_evaluaciones_desempeno
  ADD CONSTRAINT manual_funciones_evaluaciones_desempeno_cargo_id_fkey    FOREIGN KEY (cargo_id)     REFERENCES public.manual_funciones_cargos(id) ON DELETE CASCADE,
  ADD CONSTRAINT manual_funciones_evaluaciones_desempeno_consultor_id_fkey FOREIGN KEY (consultor_id) REFERENCES public.profiles(id)               ON DELETE NO ACTION;

-- marketing_sesiones → clientes, profiles
ALTER TABLE public.marketing_sesiones
  ADD CONSTRAINT marketing_sesiones_cliente_id_fkey   FOREIGN KEY (cliente_id)   REFERENCES public.clientes(id) ON DELETE NO ACTION,
  ADD CONSTRAINT marketing_sesiones_consultor_id_fkey FOREIGN KEY (consultor_id) REFERENCES public.profiles(id) ON DELETE NO ACTION;

-- ── 4. NON-PRIMARY INDEXES ────────────────────────────────────

CREATE INDEX idx_cliente_actividades_cliente   ON public.cliente_actividades(cliente_id, fecha);
CREATE INDEX idx_compartidos_cliente           ON public.cliente_compartidos(cliente_id);
CREATE INDEX idx_compartidos_token             ON public.cliente_compartidos(share_token);
CREATE INDEX idx_compromisos_cliente           ON public.cliente_compromisos(cliente_id);
CREATE INDEX idx_cliente_contactos_cliente     ON public.cliente_contactos(cliente_id);
CREATE INDEX idx_cliente_cotizaciones_cliente  ON public.cliente_cotizaciones(cliente_id, created_at DESC);
CREATE INDEX idx_kpis_cliente                  ON public.cliente_kpis(cliente_id);
CREATE INDEX idx_kpis_actividad                ON public.cliente_kpis(actividad_id);
CREATE INDEX idx_onboarding_cliente            ON public.cliente_onboarding(cliente_id);
CREATE INDEX idx_lee_workbook_html_programa    ON public.lee_workbook_html(programa_id);
CREATE INDEX idx_marketing_sesiones_cliente    ON public.marketing_sesiones(cliente_id);
CREATE INDEX idx_marketing_sesiones_consultor  ON public.marketing_sesiones(consultor_id);

-- ── 5. FUNCTIONS ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' SET row_security TO 'off' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_cliente(_cliente_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' SET row_security TO 'off' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = _cliente_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR (c.consultor_id = auth.uid() AND public.has_role(auth.uid(), 'consultor'))
        OR EXISTS (
          SELECT 1 FROM public.empresa_usuarios eu
          WHERE eu.cliente_id = _cliente_id AND eu.user_id = auth.uid()
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_dueno_de_cliente(_cliente_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' SET row_security TO 'off' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresa_usuarios eu
    WHERE eu.cliente_id = _cliente_id
      AND eu.user_id    = auth.uid()
      AND eu.rol_empresa = 'dueño'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'consultor' THEN 2 WHEN 'cliente' THEN 3 ELSE 4 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente');
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generar_numero_cotizacion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_year   TEXT;
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
END; $$;

CREATE OR REPLACE FUNCTION public.set_cotizacion_vencimiento()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.fecha_emision IS NOT NULL AND NEW.fecha_vencimiento IS NULL THEN
    NEW.fecha_vencimiento := NEW.fecha_emision + (COALESCE(NEW.validez_dias, 30) || ' days')::interval;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.check_ultimo_dueno()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' SET row_security TO 'off' AS $$
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.rol_empresa = 'dueño') OR
     (TG_OP = 'UPDATE' AND OLD.rol_empresa = 'dueño' AND NEW.rol_empresa != 'dueño') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.empresa_usuarios
      WHERE cliente_id  = OLD.cliente_id
        AND rol_empresa  = 'dueño'
        AND id          != OLD.id
    ) THEN
      RAISE EXCEPTION 'La empresa debe tener al menos un dueño. Operación cancelada.';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END; $$;

CREATE OR REPLACE FUNCTION public.registrar_vista_compartido(_token TEXT, _ip TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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
END; $$;

CREATE OR REPLACE FUNCTION public.get_compartido_by_token(_token TEXT)
RETURNS TABLE(
  id UUID, cliente_id UUID, tipo_contenido TEXT, contenido_id UUID,
  titulo TEXT, mensaje TEXT, pdf_url TEXT, destinatarios_nombres JSONB,
  vistas INTEGER, expira_en TIMESTAMPTZ, estado TEXT, created_at TIMESTAMPTZ,
  incluir_kpis BOOLEAN, incluir_compromisos BOOLEAN, nombre_empresa TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
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

-- Trigger on auth.users for new user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 6. TRIGGERS ON PUBLIC TABLES ─────────────────────────────

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_clientes_updated
  BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_planes_updated
  BEFORE UPDATE ON public.planes_estrategicos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_side_updated
  BEFORE UPDATE ON public.side_sesiones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_workbooks_updated
  BEFORE UPDATE ON public.lee_workbooks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_lee_workbook_html_updated_at
  BEFORE UPDATE ON public.lee_workbook_html FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_cliente_contactos_updated_at
  BEFORE UPDATE ON public.cliente_contactos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_cliente_cotizaciones_updated_at
  BEFORE UPDATE ON public.cliente_cotizaciones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_generar_numero_cotizacion
  BEFORE INSERT ON public.cliente_cotizaciones FOR EACH ROW EXECUTE FUNCTION public.generar_numero_cotizacion();

CREATE TRIGGER trg_set_cotizacion_vencimiento
  BEFORE INSERT OR UPDATE ON public.cliente_cotizaciones FOR EACH ROW EXECUTE FUNCTION public.set_cotizacion_vencimiento();

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

CREATE TRIGGER trg_check_ultimo_dueno
  BEFORE UPDATE OR DELETE ON public.empresa_usuarios FOR EACH ROW EXECUTE FUNCTION public.check_ultimo_dueno();

CREATE TRIGGER marketing_sesiones_set_updated_at
  BEFORE UPDATE ON public.marketing_sesiones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 7. ROW LEVEL SECURITY ─────────────────────────────────────

ALTER TABLE public.profiles                            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes                            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes                              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_modulos                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_plan                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_estrategicos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.side_sesiones                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_sesiones                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lee_programas                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lee_workbooks                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lee_workbook_html                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_contactos                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_actividades                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_cotizaciones                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_onboarding                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_kpis                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_compromisos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_compartidos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_usuarios                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_invitaciones                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_usuario_modulos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_areas                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_funciones_cargos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_funciones_evaluaciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_funciones_evaluaciones_desempeno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_sesiones                  ENABLE ROW LEVEL SECURITY;

-- ── 8. RLS POLICIES ───────────────────────────────────────────

-- profiles
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
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
CREATE POLICY "clientes_empresa_select" ON public.clientes FOR SELECT
  USING (public.can_access_cliente(id));

-- planes
CREATE POLICY "planes_select" ON public.planes FOR SELECT TO authenticated USING (true);
CREATE POLICY "planes_admin_write" ON public.planes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- plan_modulos
CREATE POLICY "plan_modulos_select" ON public.plan_modulos FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_modulos_admin_write" ON public.plan_modulos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- empresa_plan
CREATE POLICY "empresa_plan_select" ON public.empresa_plan FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.can_access_cliente(empresa_id));
CREATE POLICY "empresa_plan_admin_write" ON public.empresa_plan FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- planes_estrategicos
CREATE POLICY "planes_access" ON public.planes_estrategicos FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id)) WITH CHECK (public.can_access_cliente(cliente_id));

-- side_sesiones
CREATE POLICY "side_access" ON public.side_sesiones FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id)) WITH CHECK (public.can_access_cliente(cliente_id));

-- coaching_sesiones
CREATE POLICY "coaching_access" ON public.coaching_sesiones FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id)) WITH CHECK (public.can_access_cliente(cliente_id));

-- lee_programas
CREATE POLICY "lee_prog_access" ON public.lee_programas FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id) OR facilitador_id = auth.uid())
  WITH CHECK (public.can_access_cliente(cliente_id) OR facilitador_id = auth.uid());

-- lee_workbooks
CREATE POLICY "workbooks_participante_self" ON public.lee_workbooks FOR ALL TO authenticated
  USING (
    participante_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.lee_programas p
               WHERE p.id = programa_id
                 AND (p.facilitador_id = auth.uid() OR public.can_access_cliente(p.cliente_id)))
  )
  WITH CHECK (
    participante_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.lee_programas p
               WHERE p.id = programa_id
                 AND (p.facilitador_id = auth.uid() OR public.can_access_cliente(p.cliente_id)))
  );

-- lee_workbook_html
CREATE POLICY "lee_wb_html_access" ON public.lee_workbook_html FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.lee_programas p
               WHERE p.id = programa_id
                 AND (p.facilitador_id = auth.uid() OR public.can_access_cliente(p.cliente_id)))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.lee_programas p
               WHERE p.id = programa_id
                 AND (p.facilitador_id = auth.uid() OR public.can_access_cliente(p.cliente_id)))
  );

-- cliente_contactos
CREATE POLICY "contactos_access" ON public.cliente_contactos FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id)) WITH CHECK (public.can_access_cliente(cliente_id));

-- cliente_actividades
CREATE POLICY "actividades_access" ON public.cliente_actividades FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id)) WITH CHECK (public.can_access_cliente(cliente_id));

-- cliente_cotizaciones (solo admin y consultor asignado, NO el cliente final)
CREATE POLICY "cotizaciones_admin" ON public.cliente_cotizaciones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "cotizaciones_consultor" ON public.cliente_cotizaciones FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'consultor')
    AND EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.consultor_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'consultor')
    AND EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.consultor_id = auth.uid())
  );

-- cliente_onboarding
CREATE POLICY "onboarding_access" ON public.cliente_onboarding FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id)) WITH CHECK (public.can_access_cliente(cliente_id));

-- cliente_kpis
CREATE POLICY "kpis_access" ON public.cliente_kpis FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id)) WITH CHECK (public.can_access_cliente(cliente_id));

-- cliente_compromisos
CREATE POLICY "compromisos_access" ON public.cliente_compromisos FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id)) WITH CHECK (public.can_access_cliente(cliente_id));

-- cliente_compartidos
CREATE POLICY "compartidos_access" ON public.cliente_compartidos FOR ALL TO authenticated
  USING (public.can_access_cliente(cliente_id)) WITH CHECK (public.can_access_cliente(cliente_id));

-- app_settings
CREATE POLICY "app_settings_read_all" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "app_settings_write_admin" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- empresa_usuarios
CREATE POLICY "eu_select" ON public.empresa_usuarios FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'consultor')
        AND EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.consultor_id = auth.uid()))
  );
CREATE POLICY "eu_insert" ON public.empresa_usuarios FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_dueno_de_cliente(cliente_id));
CREATE POLICY "eu_update" ON public.empresa_usuarios FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.is_dueno_de_cliente(cliente_id));
CREATE POLICY "eu_delete" ON public.empresa_usuarios FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR (public.is_dueno_de_cliente(cliente_id) AND user_id <> auth.uid()));

-- empresa_invitaciones
CREATE POLICY "einv_select" ON public.empresa_invitaciones FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_dueno_de_cliente(cliente_id)
    OR email = (auth.jwt() ->> 'email')
  );
CREATE POLICY "einv_insert" ON public.empresa_invitaciones FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_dueno_de_cliente(cliente_id));
CREATE POLICY "einv_update" ON public.empresa_invitaciones FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.is_dueno_de_cliente(cliente_id));
CREATE POLICY "einv_delete" ON public.empresa_invitaciones FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- empresa_usuario_modulos
CREATE POLICY "eum_select" ON public.empresa_usuario_modulos FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_dueno_de_cliente(cliente_id)
    OR (public.has_role(auth.uid(), 'consultor')
        AND EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.consultor_id = auth.uid()))
  );
CREATE POLICY "eum_insert" ON public.empresa_usuario_modulos FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_dueno_de_cliente(cliente_id));
CREATE POLICY "eum_update" ON public.empresa_usuario_modulos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.is_dueno_de_cliente(cliente_id));
CREATE POLICY "eum_delete" ON public.empresa_usuario_modulos FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR public.is_dueno_de_cliente(cliente_id));

-- manual_areas
CREATE POLICY "manual_areas_select" ON public.manual_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "manual_areas_insert" ON public.manual_areas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));
CREATE POLICY "manual_areas_update" ON public.manual_areas FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));
CREATE POLICY "manual_areas_delete" ON public.manual_areas FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));

-- manual_funciones_cargos
CREATE POLICY "mf_cargos_select" ON public.manual_funciones_cargos FOR SELECT
  USING (
    consultor_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.empresa_usuarios eu
               WHERE eu.cliente_id = cliente_id AND eu.user_id = auth.uid())
  );
CREATE POLICY "mf_cargos_insert" ON public.manual_funciones_cargos FOR INSERT TO authenticated
  WITH CHECK (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mf_cargos_update" ON public.manual_funciones_cargos FOR UPDATE
  USING (
    consultor_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.empresa_usuarios eu
               WHERE eu.cliente_id = cliente_id AND eu.user_id = auth.uid())
  );
CREATE POLICY "mf_cargos_delete" ON public.manual_funciones_cargos FOR DELETE TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- manual_funciones_evaluaciones
CREATE POLICY "mf_eval_select" ON public.manual_funciones_evaluaciones FOR SELECT TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mf_eval_insert" ON public.manual_funciones_evaluaciones FOR INSERT TO authenticated
  WITH CHECK (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mf_eval_update" ON public.manual_funciones_evaluaciones FOR UPDATE TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mf_eval_delete" ON public.manual_funciones_evaluaciones FOR DELETE TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- manual_funciones_evaluaciones_desempeno
CREATE POLICY "mf_eval_desemp_select" ON public.manual_funciones_evaluaciones_desempeno FOR SELECT TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mf_eval_desemp_insert" ON public.manual_funciones_evaluaciones_desempeno FOR INSERT TO authenticated
  WITH CHECK (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mf_eval_desemp_update" ON public.manual_funciones_evaluaciones_desempeno FOR UPDATE TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mf_eval_desemp_delete" ON public.manual_funciones_evaluaciones_desempeno FOR DELETE TO authenticated
  USING (consultor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- marketing_sesiones
CREATE POLICY "marketing_sesiones_select" ON public.marketing_sesiones FOR SELECT
  USING (auth.uid() = consultor_id OR auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));
CREATE POLICY "marketing_sesiones_insert" ON public.marketing_sesiones FOR INSERT
  WITH CHECK (auth.uid() = consultor_id);
CREATE POLICY "marketing_sesiones_update" ON public.marketing_sesiones FOR UPDATE
  USING (auth.uid() = consultor_id);
CREATE POLICY "marketing_sesiones_delete" ON public.marketing_sesiones FOR DELETE
  USING (auth.uid() = consultor_id OR public.has_role(auth.uid(), 'admin'));

-- ── 9. GRANTS ─────────────────────────────────────────────────

GRANT ALL ON public.profiles                              TO authenticated, service_role;
GRANT ALL ON public.user_roles                            TO authenticated, service_role;
GRANT ALL ON public.clientes                              TO authenticated, service_role;
GRANT ALL ON public.planes                                TO authenticated, service_role;
GRANT ALL ON public.plan_modulos                          TO authenticated, service_role;
GRANT ALL ON public.empresa_plan                          TO authenticated, service_role;
GRANT ALL ON public.planes_estrategicos                   TO authenticated, service_role;
GRANT ALL ON public.side_sesiones                         TO authenticated, service_role;
GRANT ALL ON public.coaching_sesiones                     TO authenticated, service_role;
GRANT ALL ON public.lee_programas                         TO authenticated, service_role;
GRANT ALL ON public.lee_workbooks                         TO authenticated, service_role;
GRANT ALL ON public.lee_workbook_html                     TO authenticated, service_role;
GRANT ALL ON public.cliente_contactos                     TO authenticated, service_role;
GRANT ALL ON public.cliente_actividades                   TO authenticated, service_role;
GRANT ALL ON public.cliente_cotizaciones                  TO authenticated, service_role;
GRANT ALL ON public.cliente_onboarding                    TO authenticated, service_role;
GRANT ALL ON public.cliente_kpis                          TO authenticated, service_role;
GRANT ALL ON public.cliente_compromisos                   TO authenticated, service_role;
GRANT ALL ON public.cliente_compartidos                   TO authenticated, service_role;
GRANT ALL ON public.app_settings                          TO authenticated, service_role;
GRANT ALL ON public.empresa_usuarios                      TO authenticated, service_role;
GRANT ALL ON public.empresa_invitaciones                  TO authenticated, service_role;
GRANT ALL ON public.empresa_usuario_modulos               TO authenticated, service_role;
GRANT ALL ON public.manual_areas                          TO authenticated, service_role;
GRANT ALL ON public.manual_funciones_cargos               TO authenticated, service_role;
GRANT ALL ON public.manual_funciones_evaluaciones         TO authenticated, service_role;
GRANT ALL ON public.manual_funciones_evaluaciones_desempeno TO authenticated, service_role;
GRANT ALL ON public.marketing_sesiones                    TO authenticated, service_role;

GRANT SELECT ON public.planes      TO anon;
GRANT SELECT ON public.plan_modulos TO anon;
GRANT SELECT ON public.app_settings TO anon;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role)       TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_cliente(UUID)              TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_dueno_de_cliente(UUID)             TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role()                   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_vista_compartido(TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_compartido_by_token(TEXT)         TO authenticated, anon, service_role;

-- ── 10. SEED DATA (referential, not user data) ────────────────

INSERT INTO public.planes (id, nombre, precio, descripcion, activo) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Esencial',    99.00,   'Diagnóstico SIDE y Plan Estratégico',                  true),
  ('a1000000-0000-0000-0000-000000000002', 'Profesional', 199.00,  'SIDE, Plan Estratégico, Coaching, LEE y KPIs',         true),
  ('a1000000-0000-0000-0000-000000000003', 'Corporativo', 349.00,  'Acceso completo a todos los módulos de la plataforma', true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'Premium',     1000.00, NULL,                                                   true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.plan_modulos (plan_id, modulo_slug, activo) VALUES
  -- Esencial
  ('a1000000-0000-0000-0000-000000000001', 'side',            true),
  ('a1000000-0000-0000-0000-000000000001', 'plan_estrategico', true),
  -- Profesional
  ('a1000000-0000-0000-0000-000000000002', 'side',            true),
  ('a1000000-0000-0000-0000-000000000002', 'plan_estrategico', true),
  ('a1000000-0000-0000-0000-000000000002', 'coaching',        true),
  ('a1000000-0000-0000-0000-000000000002', 'lee',             true),
  ('a1000000-0000-0000-0000-000000000002', 'kpis',            true),
  ('a1000000-0000-0000-0000-000000000002', 'manual_funciones', true),
  -- Corporativo
  ('a1000000-0000-0000-0000-000000000003', 'side',            true),
  ('a1000000-0000-0000-0000-000000000003', 'plan_estrategico', true),
  ('a1000000-0000-0000-0000-000000000003', 'lee',             true),
  ('a1000000-0000-0000-0000-000000000003', 'marketing_digital', true),
  ('a1000000-0000-0000-0000-000000000003', 'kpis',            true),
  ('a1000000-0000-0000-0000-000000000003', 'manual_funciones', true),
  -- Premium
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'side',                true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'side_historial',      true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'plan_estrategico',    true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'coaching',            true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'coaching_metodologia', true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'coaching_resultados',  true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'lee',                 true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'marketing_digital',   true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'kpis',                true),
  ('0bfe4eec-ce75-4c50-906d-d7f6284fd533', 'manual_funciones',    true)
ON CONFLICT (plan_id, modulo_slug) DO NOTHING;

INSERT INTO public.app_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;
