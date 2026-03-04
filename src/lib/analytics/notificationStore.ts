import type { SmartNotification, SmartNotificationState } from "@/lib/analytics/notifications";

const STORAGE_KEY = "rh-smart-notifications";
const EVENT_NAME = "rh-smart-notifications-updated";

function notificationSignature(notification: Pick<SmartNotificationState, "type" | "targetTab" | "title" | "message">): string {
  return [notification.type, notification.targetTab, notification.title, notification.message]
    .map((part) => part.trim().toLowerCase())
    .join("::");
}

function dispatchNotificationUpdate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
}

function writeSmartNotifications(notifications: SmartNotificationState[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  dispatchNotificationUpdate();
}

function normalizeStoredItem(item: Partial<SmartNotificationState>): SmartNotificationState | null {
  if (!item.id || !item.type || !item.message || !item.date || !item.priority || !item.targetTab) {
    return null;
  }

  return {
    id: item.id,
    type: item.type,
    title: item.title?.trim() || "Notificacao",
    message: item.message,
    date: item.date,
    urgencyLabel: item.urgencyLabel ?? "",
    priority: item.priority,
    targetTab: item.targetTab,
    read: Boolean(item.read),
    readAt: item.readAt ?? null,
    hidden: Boolean(item.hidden),
  };
}

export function readSmartNotifications(): SmartNotificationState[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Partial<SmartNotificationState>[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => normalizeStoredItem(item))
      .filter((item): item is SmartNotificationState => item !== null)
      .sort((left, right) => right.date.localeCompare(left.date));
  } catch {
    return [];
  }
}

export function persistSmartNotifications(notifications: SmartNotification[]): void {
  const previous = readSmartNotifications();
  const previousById = new Map(previous.map((item) => [item.id, item]));
  const previousBySignature = new Map(previous.map((item) => [notificationSignature(item), item]));

  const merged = notifications.map<SmartNotificationState>((item) => {
    const existing = previousById.get(item.id) ?? previousBySignature.get(notificationSignature(item));
    return {
      ...item,
      read: existing?.read ?? false,
      readAt: existing?.readAt ?? null,
      hidden: existing?.hidden ?? false,
    };
  });

  writeSmartNotifications(
    merged.sort((left, right) => right.date.localeCompare(left.date)),
  );
}

export function markSmartNotificationAsRead(notificationId: string): void {
  const next = readSmartNotifications().map((item) =>
    item.id === notificationId
      ? {
          ...item,
          read: true,
          readAt: item.readAt ?? new Date().toISOString(),
        }
      : item,
  );

  writeSmartNotifications(next);
}

export function markAllSmartNotificationsAsRead(): void {
  const nowIso = new Date().toISOString();
  const next = readSmartNotifications().map((item) => ({
    ...item,
    read: true,
    readAt: item.readAt ?? nowIso,
  }));

  writeSmartNotifications(next);
}

export function clearReadSmartNotifications(): void {
  const next = readSmartNotifications().map((item) =>
    item.read
      ? {
          ...item,
          hidden: true,
        }
      : item,
  );
  writeSmartNotifications(next);
}

export const SMART_NOTIFICATIONS_EVENT = EVENT_NAME;
