-- Fase: consolidación de permisos_usuario_modulo
-- 1. Agregar columnas seccion y puede_eliminar
-- 2. Colapsar slugs manual_funciones_* → modulo='manual_funciones' + seccion
-- 3. Eliminar tabla empresa_usuario_modulos (sin referencias en src/ fuera de types.ts)

ALTER TABLE permisos_usuario_modulo
  ADD COLUMN seccion text,
  ADD COLUMN puede_eliminar boolean NOT NULL DEFAULT false;

UPDATE permisos_usuario_modulo
  SET modulo = 'manual_funciones', seccion = 'evaluaciones'
  WHERE modulo = 'manual_funciones_evaluaciones';

UPDATE permisos_usuario_modulo
  SET modulo = 'manual_funciones', seccion = 'cargos'
  WHERE modulo = 'manual_funciones_cargos';

DROP TABLE IF EXISTS empresa_usuario_modulos;
