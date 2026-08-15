-- coaching_sesiones: separar SELECT (clientes pueden leer) de escritura (solo admin o consultor asignado)
-- La política anterior "coaching_access" (ALL) permitía a clientes insertar/modificar/eliminar sesiones via API directa.

DROP POLICY IF EXISTS coaching_access ON coaching_sesiones;

-- Lectura: cualquier usuario autenticado con acceso al cliente (clientes, consultores asignados, admins)
CREATE POLICY coaching_select ON coaching_sesiones
  FOR SELECT TO authenticated
  USING (can_access_cliente(cliente_id));

-- Escritura: solo admin, o el consultor específicamente asignado a ese cliente
CREATE POLICY coaching_write ON coaching_sesiones
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (can_access_cliente(cliente_id) AND has_role(auth.uid(), 'consultor'))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR (can_access_cliente(cliente_id) AND has_role(auth.uid(), 'consultor'))
  );
