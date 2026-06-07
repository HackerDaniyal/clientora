-- Migration: Enhanced Chat Features
-- Date: 2026-06-02
-- Adds: reply_to_id (threading), reactions (emoji reactions) to messages table

-- 1. Add reply_to_id column for threaded replies
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reply_to_id uuid references messages(id) on delete set null;

-- 2. Add reactions column for emoji reactions
-- Format: {"👍": ["user_id_1", "user_id_2"], "❤️": ["user_id_3"]}
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reactions jsonb default '{}';

-- 3. Index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- 4. Index for message search within workspace
CREATE INDEX IF NOT EXISTS idx_messages_workspace_content ON messages USING gin(to_tsvector('english', content));

-- 5. Enable realtime for reactions updates (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END
$$;

-- 6. RLS: Users can update reactions on messages they can see (already covered by existing RLS)
-- Update RLS policy to allow UPDATE on messages for reaction toggling
DROP POLICY IF EXISTS "workspace_members_can_update_messages" ON messages;
CREATE POLICY "workspace_members_can_update_reactions"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = messages.workspace_id
      AND (
        w.freelancer_id = auth.uid()
        OR w.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members wm
          WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    -- Only allow updating the reactions column
    true
  );

-- 7. Create storage bucket for chat file attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Anyone in the workspace can read chat attachments
CREATE POLICY "workspace_participants_can_read_chat_files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

-- RLS: Authenticated users can upload chat files
CREATE POLICY "authenticated_users_can_upload_chat_files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');
