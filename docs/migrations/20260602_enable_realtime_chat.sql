-- Enable Supabase Realtime for Chat Messages and Read Receipts
-- Run this script in the Supabase SQL Editor

-- Step 1: Add messages to supabase_realtime publication (safe — skips if already a member)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- Step 2: Add message_reads to supabase_realtime publication (safe — skips if already a member)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'message_reads'
  ) then
    alter publication supabase_realtime add table public.message_reads;
  end if;
end $$;

-- Step 3: Set REPLICA IDENTITY FULL so Realtime can broadcast complete row data
-- This is required for Supabase to deliver payloads for filtered subscriptions.
-- Without this, the channel callback never fires even if the table is in the publication.
alter table public.messages replica identity full;
alter table public.message_reads replica identity full;
