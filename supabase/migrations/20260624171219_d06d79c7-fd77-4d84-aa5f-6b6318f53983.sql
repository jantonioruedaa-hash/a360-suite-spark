DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '0fdef0e6-a99b-4cc5-8a63-5f805b865627') THEN
    INSERT INTO public.user_roles (user_id, role)
      VALUES ('0fdef0e6-a99b-4cc5-8a63-5f805b865627', 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;