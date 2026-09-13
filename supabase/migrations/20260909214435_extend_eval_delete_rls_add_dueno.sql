-- Ampliar DELETE de evaluaciones: añadir Dueño del cliente
-- Admin y Consultor-creador ya existían; se agrega is_dueno_de_cliente

-- manual_funciones_evaluaciones
DROP POLICY IF EXISTS mf_eval_delete ON manual_funciones_evaluaciones;

CREATE POLICY mf_eval_delete ON manual_funciones_evaluaciones
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM manual_funciones_cargos c
      WHERE c.id = manual_funciones_evaluaciones.cargo_id
        AND is_dueno_de_cliente(c.cliente_id)
    )
  );

-- manual_funciones_evaluaciones_desempeno
DROP POLICY IF EXISTS mf_eval_desemp_delete ON manual_funciones_evaluaciones_desempeno;

CREATE POLICY mf_eval_desemp_delete ON manual_funciones_evaluaciones_desempeno
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (consultor_id = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM manual_funciones_cargos c
      WHERE c.id = manual_funciones_evaluaciones_desempeno.cargo_id
        AND is_dueno_de_cliente(c.cliente_id)
    )
  );
