import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This route is designed to be called by a cron job or a client-side poller.
// It checks tasks with due dates within the next 24 hours and 1 hour,
// and creates notifications for them if not already sent.
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    return NextResponse.json({ error: "Service role key not configured." }, { status: 500 });
  }

  // Use service role to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const notifsSent: string[] = [];

  // Find tasks due within 24h where 24h reminder hasn't been sent
  const { data: tasks24h } = await supabase
    .from("tasks")
    .select("id, title, due_date, assigned_to, created_by, workspace_id")
    .lte("due_date", in24h.toISOString())
    .gte("due_date", now.toISOString())
    .eq("reminder_sent_24h", false)
    .neq("status", "completed");

  for (const task of tasks24h ?? []) {
    const hoursLeft = Math.round((new Date(task.due_date).getTime() - now.getTime()) / (1000 * 60 * 60));
    const recipients = Array.from(new Set([task.assigned_to, task.created_by].filter(Boolean)));
    
    for (const userId of recipients) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "deadline_reminder",
        title: "⏰ Milestone Due Soon",
        body: `Task "${task.title}" is due in ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}.`,
        data: { task_id: task.id, workspace_id: task.workspace_id },
      });
    }
    
    // Mark 24h reminder as sent
    await supabase.from("tasks").update({ reminder_sent_24h: true }).eq("id", task.id);
    notifsSent.push(`24h: ${task.id}`);
  }

  // Find tasks due within 1h where 1h reminder hasn't been sent
  const { data: tasks1h } = await supabase
    .from("tasks")
    .select("id, title, due_date, assigned_to, created_by, workspace_id")
    .lte("due_date", in1h.toISOString())
    .gte("due_date", now.toISOString())
    .eq("reminder_sent_1h", false)
    .neq("status", "completed");

  for (const task of tasks1h ?? []) {
    const minutesLeft = Math.round((new Date(task.due_date).getTime() - now.getTime()) / (1000 * 60));
    const recipients = Array.from(new Set([task.assigned_to, task.created_by].filter(Boolean)));
    
    for (const userId of recipients) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "deadline_reminder",
        title: "🚨 Milestone Overdue Soon",
        body: `Task "${task.title}" is due in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}!`,
        data: { task_id: task.id, workspace_id: task.workspace_id },
      });
    }
    
    // Mark 1h reminder as sent
    await supabase.from("tasks").update({ reminder_sent_1h: true }).eq("id", task.id);
    notifsSent.push(`1h: ${task.id}`);
  }

  return NextResponse.json({
    ok: true,
    checked_at: now.toISOString(),
    notifications_sent: notifsSent.length,
    details: notifsSent,
  });
}
