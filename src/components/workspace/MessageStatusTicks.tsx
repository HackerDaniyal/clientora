"use client";

import React from "react";
import { IconCheck } from "@tabler/icons-react";
import type { OutgoingMessageStatus } from "@/lib/chat/message-status";

const STATUS_LABEL: Record<OutgoingMessageStatus, string> = {
  sending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  read: "Seen",
};

type MessageStatusTicksProps = {
  status: OutgoingMessageStatus;
  className?: string;
};

export default function MessageStatusTicks({ status, className = "" }: MessageStatusTicksProps) {
  const label = STATUS_LABEL[status];
  const isRead = status === "read";
  const isDelivered = status === "delivered" || isRead;
  const isDouble = isDelivered;
  const color = isRead
    ? "text-sky-300"
    : status === "sending"
      ? "text-white/50"
      : "text-white/75";

  return (
    <span
      className={`inline-flex items-center ${className}`}
      title={label}
      aria-label={label}
    >
      <IconCheck size={14} stroke={2.5} className={color} />
      {isDouble && (
        <IconCheck size={14} stroke={2.5} className={`-ml-2.5 ${color}`} aria-hidden />
      )}
    </span>
  );
}
