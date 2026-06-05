-- Enable Supabase Realtime for Workspace Asset Updates
-- Run this script in the Supabase SQL Editor

-- Step 1: Add workspaces to supabase_realtime publication (safe — skips if already a member)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'workspaces'
  ) then
    alter publication supabase_realtime add table public.workspaces;
  end if;
end $$;

-- Step 2: Set REPLICA IDENTITY FULL so Realtime can broadcast complete row data
-- Required for filtered subscriptions to deliver payloads correctly.
alter table public.workspaces replica identity full;
