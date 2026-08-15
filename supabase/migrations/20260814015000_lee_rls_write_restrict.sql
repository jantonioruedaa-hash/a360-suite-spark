-- lee_programas: solo facilitador asignado o admin puede crear/modificar/eliminar
-- la política anterior (ALL) permitía a clientes insertar/modificar/eliminar programas via API directa.
DROP POLICY IF EXISTS lee_prog_access ON lee_programas;

CREATE POLICY lee_prog_select ON lee_programas
  FOR SELECT TO authenticated
  USING (can_access_cliente(cliente_id) OR (facilitador_id = auth.uid()));

CREATE POLICY lee_prog_write ON lee_programas
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR (facilitador_id = auth.uid() AND has_role(auth.uid(), 'consultor'))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR (facilitador_id = auth.uid() AND has_role(auth.uid(), 'consultor'))
  );

-- lee_workbooks: clientes solo pueden escribir sus propios workbooks (participante_id = uid).
-- La política anterior (ALL) incluía can_access_cliente en el EXISTS, permitiendo a cualquier
-- miembro de la empresa escribir workbooks de otros participantes del mismo programa.
DROP POLICY IF EXISTS workbooks_participante_self ON lee_workbooks;

CREATE POLICY lee_workbooks_select ON lee_workbooks
  FOR SELECT TO authenticated
  USING (
    (participante_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
    OR (EXISTS (
      SELECT 1 FROM lee_programas p
      WHERE p.id = lee_workbooks.programa_id
        AND (p.facilitador_id = auth.uid() OR can_access_cliente(p.cliente_id))
    ))
  );

CREATE POLICY lee_workbooks_write ON lee_workbooks
  FOR ALL TO authenticated
  USING (
    (participante_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
    OR (EXISTS (
      SELECT 1 FROM lee_programas p
      WHERE p.id = lee_workbooks.programa_id
        AND p.facilitador_id = auth.uid()
        AND has_role(auth.uid(), 'consultor')
    ))
  )
  WITH CHECK (
    (participante_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
    OR (EXISTS (
      SELECT 1 FROM lee_programas p
      WHERE p.id = lee_workbooks.programa_id
        AND p.facilitador_id = auth.uid()
        AND has_role(auth.uid(), 'consultor')
    ))
  );
