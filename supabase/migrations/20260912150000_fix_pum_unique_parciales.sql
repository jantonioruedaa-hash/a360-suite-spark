DROP INDEX IF EXISTS public.pum_unique;

CREATE UNIQUE INDEX pum_unique_todas ON permisos_usuario_modulo
  (user_id, cliente_id, modulo, COALESCE(seccion, ''))
  WHERE alcance_tipo = 'todas';

CREATE UNIQUE INDEX pum_unique_area ON permisos_usuario_modulo
  (user_id, cliente_id, modulo, COALESCE(seccion, ''), alcance_area_id)
  WHERE alcance_tipo = 'area';
