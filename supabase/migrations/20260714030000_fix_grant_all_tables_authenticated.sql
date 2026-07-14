-- Grant table-level privileges to authenticated and anon.
-- The initial migrations only granted on 'clientes' and 'marketing_sesiones'.
-- All other tables had no grants, causing 403 on every query despite correct RLS policies.
-- In Supabase's standard pattern, table grants are broad and RLS controls row access.
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure future tables created in this schema also get the same defaults
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
