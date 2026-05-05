
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_cliente(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
