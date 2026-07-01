-- Drop the overly permissive policy
DROP POLICY IF EXISTS profiles_select_self_or_admin ON public.profiles;

-- Self access
CREATE POLICY profiles_select_self
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admin full read
CREATE POLICY profiles_select_admin
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Consultor: only profiles related to clients they own
CREATE POLICY profiles_select_consultor_related
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'consultor')
  AND EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.consultor_id = auth.uid()
      AND (c.cliente_user_id = profiles.id)
  )
);