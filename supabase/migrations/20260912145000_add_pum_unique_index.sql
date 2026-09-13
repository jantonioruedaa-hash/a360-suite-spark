CREATE UNIQUE INDEX pum_unique ON permisos_usuario_modulo
  (user_id, cliente_id, modulo, COALESCE(seccion, ''));
