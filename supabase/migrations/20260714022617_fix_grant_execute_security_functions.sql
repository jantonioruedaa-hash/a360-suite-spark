-- Grant EXECUTE on security-definer helper functions to authenticated role.
-- These were revoked from PUBLIC without a corresponding grant to authenticated,
-- causing all RLS policies that call has_role() / can_access_cliente() to fail
-- silently for authenticated users → role resolved as null → wrong panel shown.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_cliente(uuid) TO authenticated;
