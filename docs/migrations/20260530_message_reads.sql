-- Message read receipts (delivered + seen) for workspace chat
-- Run in Supabase SQL Editor

create table if not exists message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now(),
  unique (message_id, user_id)
);

create index if not exists idx_message_reads_message_id on message_reads(message_id);
create index if not exists idx_message_reads_user_id on message_reads(user_id);

alter table message_reads enable row level security;

drop policy if exists "Users can view message reads in their workspaces" on message_reads;
drop policy if exists "Users can upsert own message reads" on message_reads;

create policy "Users can view message reads in their workspaces"
  on message_reads for select
  using (
    exists (
      select 1 from messages m
      join workspaces w on w.id = m.workspace_id
      where m.id = message_reads.message_id
        and (
          w.client_id = auth.uid()
          or w.freelancer_id = auth.uid()
          or exists (
            select 1 from workspace_members wm
            where wm.workspace_id = w.id and wm.user_id = auth.uid()
          )
        )
    )
  );

create policy "Users can upsert own message reads"
  on message_reads for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from messages m
      join workspaces w on w.id = m.workspace_id
      where m.id = message_reads.message_id
        and (
          w.client_id = auth.uid()
          or w.freelancer_id = auth.uid()
          or exists (
            select 1 from workspace_members wm
            where wm.workspace_id = w.id and wm.user_id = auth.uid()
          )
        )
    )
  );
