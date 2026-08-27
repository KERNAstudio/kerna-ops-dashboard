"use client";

import { useActionState, useState } from "react";
import { markNotificationRead, markAllNotificationsRead, type NotificationFormState } from "@/app/notifications/actions";

const initialState: NotificationFormState = { error: null };

type Notification = {
  id: string;
  type: string;
  message: string;
  severity: string | null;
  read: boolean;
  created_at: string;
};

// §7 top bar: "notifications, 🔴 action-required indicator". No dedicated notifications
// page exists yet — this dropdown is the inbox for now.
export function NotificationsBell({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [, markAllAction] = useActionState(markAllNotificationsRead, initialState);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-text-secondary hover:border-border-default hover:bg-bg-card hover:text-text-primary"
        aria-label="Notifications"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full border border-bg-main bg-error" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-80 rounded-[var(--radius-default)] border border-border-default bg-bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border-default p-3">
            <span className="text-sm font-bold">Notifications</span>
            {unreadCount > 0 && (
              <form action={markAllAction}>
                <button type="submit" className="text-xs text-accent-primary">
                  Mark all read
                </button>
              </form>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
            {notifications.length === 0 && (
              <div className="p-6 text-center text-xs text-text-secondary">No notifications.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const [, action] = useActionState(markNotificationRead, initialState);

  return (
    <form
      action={action}
      className={`flex items-start gap-2 border-t border-border-default px-3 py-2.5 text-xs first:border-t-0 ${
        !notification.read ? "bg-accent-soft/40" : ""
      }`}
    >
      <input type="hidden" name="notification_id" value={notification.id} />
      <span
        className={`mt-1 h-1.5 w-1.5 flex-none rounded-full ${
          notification.severity === "high" ? "bg-error" : notification.severity === "medium" ? "bg-warning" : "bg-text-secondary"
        }`}
      />
      <span className="flex-1">{notification.message}</span>
      {!notification.read && (
        <button type="submit" className="flex-none text-[10px] text-accent-primary">
          Mark read
        </button>
      )}
    </form>
  );
}
