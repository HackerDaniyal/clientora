export type MessageReadReceipt = {
  user_id: string;
  delivered_at: string | null;
  read_at: string | null;
};

export type OutgoingMessageStatus = "sending" | "sent" | "delivered" | "read";

/** WhatsApp-style status for messages you sent */
export function getOutgoingMessageStatus(
  messageId: string,
  senderId: string,
  reads: MessageReadReceipt[] | undefined,
  participantIds: string[]
): OutgoingMessageStatus {
  if (messageId.startsWith("temp-")) return "sending";

  const others = participantIds.filter((id) => id !== senderId);
  if (others.length === 0) return "sent";

  const receipts = reads ?? [];

  const hasDelivered = (userId: string) =>
    receipts.some((r) => r.user_id === userId && r.delivered_at);

  const hasRead = (userId: string) =>
    receipts.some((r) => r.user_id === userId && r.read_at);

  const allRead = others.every(hasRead);
  if (allRead) return "read";

  const allDelivered = others.every(hasDelivered);
  if (allDelivered) return "delivered";

  return "sent";
}

export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMessageDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
