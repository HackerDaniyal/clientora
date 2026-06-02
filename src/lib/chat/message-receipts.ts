import type { SupabaseClient } from "@supabase/supabase-js";

export async function upsertMessageReceipts(
  supabase: SupabaseClient,
  messageIds: string[],
  userId: string,
  kind: "delivered" | "read"
) {
  if (messageIds.length === 0) return { error: null };

  const now = new Date().toISOString();

  if (kind === "read") {
    const { error } = await supabase.from("message_reads").upsert(
      messageIds.map((message_id) => ({
        message_id,
        user_id: userId,
        delivered_at: now,
        read_at: now,
      })),
      { onConflict: "message_id,user_id" }
    );
    if (error?.code === "42P01") {
      console.warn("message_reads table missing — run docs/migrations/20260530_message_reads.sql");
    }
    return { error };
  }

  for (const message_id of messageIds) {
    const { data: existing } = await supabase
      .from("message_reads")
      .select("read_at")
      .eq("message_id", message_id)
      .eq("user_id", userId)
      .maybeSingle();

    const { error } = await supabase.from("message_reads").upsert(
      {
        message_id,
        user_id: userId,
        delivered_at: now,
        read_at: existing?.read_at ?? null,
      },
      { onConflict: "message_id,user_id" }
    );

    if (error) {
      if (error.code === "42P01") {
        console.warn("message_reads table missing — run docs/migrations/20260530_message_reads.sql");
      }
      return { error };
    }
  }

  return { error: null };
}
