-- Corrige políticas UPDATE de evaluaciones:
-- - Elimina can_access_cliente() (criterio de solo lectura, no debería dar acceso de escritura)
-- - Agrega consultor del cliente (clientes.consultor_id) para mantener edición de evals legacy con consultor_id = NULL
-- DELETE sin cambios — ya tenía el criterio correcto (admin OR consultor_id)

-- manual_funciones_evaluaciones
DROP POLICY IF EXISTS mf_eval_update ON manual_funciones_evaluaciones;

CREATE POLICY mf_eval_update ON manual_funciones_evaluaciones
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM manual_funciones_cargos c
      JOIN clientes cl ON cl.id = c.cliente_id
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
        AND cl.consultor_id = auth.uid()
        AND has_role(auth.uid(), 'consultor'::app_role)
    )
    OR EXISTS (
      SELECT 1
      FROM manual_funciones_cargos c
      JOIN empresa_usuarios eu ON (
        eu.cliente_id = c.cliente_id
        AND eu.area_id = c.area_id
        AND eu.user_id = auth.uid()
        AND eu.rol_empresa = 'jefe_area'
      )
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
    )
    OR has_modulo_permission(cargo_id, 'manual_funciones_evaluaciones'::text, true)
  );

-- manual_funciones_evaluaciones_desempeno
DROP POLICY IF EXISTS mf_eval_desemp_update ON manual_funciones_evaluaciones_desempeno;

CREATE POLICY mf_eval_desemp_update ON manual_funciones_evaluaciones_desempeno
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM manual_funciones_cargos c
      JOIN clientes cl ON cl.id = c.cliente_id
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
        AND cl.consultor_id = auth.uid()
        AND has_role(auth.uid(), 'consultor'::app_role)
    )
    OR EXISTS (
      SELECT 1
      FROM manual_funciones_cargos c
      JOIN empresa_usuarios eu ON (
        eu.cliente_id = c.cliente_id
        AND eu.area_id = c.area_id
        AND eu.user_id = auth.uid()
        AND eu.rol_empresa = 'jefe_area'
      )
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
    )
    OR has_modulo_permission(cargo_id, 'manual_funciones_evaluaciones'::text, true)
  );
