-- Permite al Dueño de empresa crear solicitudes de sesión en Coaching.
--
-- Diseño deliberado:
--   - No modificamos coaching_write (FOR ALL, admin/consultor) para no
--     alterar UPDATE ni DELETE.
--   - Añadimos una policy INSERT-only independiente: PostgreSQL la combina
--     con coaching_write con OR solo para INSERT.
--   - La cláusula (datos->>'solicitud_cliente') IS NOT NULL impide que el
--     dueño cree sesiones "completas" sin la marca — incluso si llama a la
--     API directamente saltando la UI.

CREATE POLICY coaching_insert_dueno ON public.coaching_sesiones
  FOR INSERT TO authenticated
  WITH CHECK (
    is_dueno_de_cliente(cliente_id)
    AND (datos->>'solicitud_cliente') IS NOT NULL
  );
