-- Permite a usuarios con rol "cliente" leer y editar cargos de su empresa.
-- INSERT y DELETE permanecen exclusivos de consultor/admin.

DROP POLICY mf_cargos_select ON manual_funciones_cargos;

CREATE POLICY mf_cargos_select ON manual_funciones_cargos
  FOR SELECT USING (
    (consultor_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM empresa_usuarios eu
      WHERE eu.cliente_id = manual_funciones_cargos.cliente_id
        AND eu.user_id = auth.uid()
    )
  );

DROP POLICY mf_cargos_update ON manual_funciones_cargos;

CREATE POLICY mf_cargos_update ON manual_funciones_cargos
  FOR UPDATE USING (
    (consultor_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM empresa_usuarios eu
      WHERE eu.cliente_id = manual_funciones_cargos.cliente_id
        AND eu.user_id = auth.uid()
    )
  );
