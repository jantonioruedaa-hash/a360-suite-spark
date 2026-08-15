-- Fix manual_funciones_cargos INSERT and DELETE so empresa_usuarios members
-- (clients) can manage their own company's cargos without depending on
-- setting consultor_id to themselves (semantically incorrect).

-- INSERT: any authenticated member of the empresa can insert cargos
DROP POLICY IF EXISTS mf_cargos_insert ON manual_funciones_cargos;

CREATE POLICY mf_cargos_insert ON manual_funciones_cargos
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR can_access_cliente(cliente_id)
  );

-- DELETE: any authenticated member of the empresa can delete cargos
-- (app-level safeguard in MF_SAVE bridge still applies: ≥50% drop blocked)
DROP POLICY IF EXISTS mf_cargos_delete ON manual_funciones_cargos;

CREATE POLICY mf_cargos_delete ON manual_funciones_cargos
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR can_access_cliente(cliente_id)
  );
