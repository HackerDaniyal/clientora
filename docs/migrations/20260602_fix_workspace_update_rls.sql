-- Fix: Allow clients to update workspace form_data (for asset uploads)
-- Previously only freelancers could UPDATE workspaces, causing client
-- asset uploads to fail silently (RLS blocked the UPDATE).

drop policy if exists "Freelancers can update their workspaces" on workspaces;
drop policy if exists "Participants can update their workspaces" on workspaces;

create policy "Participants can update their workspaces"
  on workspaces for update
  using (auth.uid() = freelancer_id or auth.uid() = client_id);
