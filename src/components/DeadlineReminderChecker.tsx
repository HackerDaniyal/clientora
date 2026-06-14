"use client";

import { useEffect } from "react";

// Silently polls the reminder check API every 5 minutes to trigger
// deadline notifications without needing an external cron service.
export default function DeadlineReminderChecker() {
  const checkReminders = async () => {
    try {
      await fetch("/api/reminders/check");
    } catch (e) {
      // Silently fail – non-critical
    }
  };

  useEffect(() => {
    // Run immediately on mount
    checkReminders();
    // Then run every 5 minutes
    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null; // Renders nothing
}
