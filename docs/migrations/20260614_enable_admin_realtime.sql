-- =======================================================================================
-- Enable Realtime for Admin Dashboard
-- =======================================================================================

-- Supabase Realtime is powered by Postgres logical replication.
-- We must explicitly add tables to the "supabase_realtime" publication 
-- for the client to receive INSERT/UPDATE/DELETE events.

alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table workspaces;
alter publication supabase_realtime add table project_requests;
