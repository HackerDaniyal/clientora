-- ==========================================
-- Features §10.6 - §10.9: Template Library, Quick Notes, Client Tags, Deadline Reminders
-- Run this in Supabase SQL Editor
-- ==========================================

-- §10.6 — document_templates table already exists from 20260602_templates_and_actions.sql
-- (No additional DB work needed for templates)

-- §10.7 — Quick Notes (sticky notes per client)
CREATE TABLE IF NOT EXISTS quick_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  freelancer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Freelancers manage own notes" ON quick_notes;
CREATE POLICY "Freelancers manage own notes"
  ON quick_notes FOR ALL
  USING (auth.uid() = freelancer_id)
  WITH CHECK (auth.uid() = freelancer_id);

CREATE UNIQUE INDEX IF NOT EXISTS quick_notes_freelancer_client_unique 
  ON quick_notes(freelancer_id, client_id);

-- §10.8 — Client Tags
CREATE TABLE IF NOT EXISTS client_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  freelancer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(freelancer_id, client_id, tag)
);

ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Freelancers manage own client tags" ON client_tags;
CREATE POLICY "Freelancers manage own client tags"
  ON client_tags FOR ALL
  USING (auth.uid() = freelancer_id)
  WITH CHECK (auth.uid() = freelancer_id);

-- §10.9 — Deadline Reminders (track if 24h/1h notifications have been sent)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent_24h boolean DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent_1h boolean DEFAULT false;

-- Index for efficient reminder queries (find tasks with due dates in the future that haven't been notified)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_reminders 
  ON tasks(due_date, reminder_sent_24h, reminder_sent_1h) 
  WHERE due_date IS NOT NULL;
