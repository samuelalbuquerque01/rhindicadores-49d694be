import type { SmartNotification, SmartNotificationState } from "@/lib/analytics/notifications";

const STORAGE_KEY = "rh-smart-notifications";
const HIDDEN_STORAGE_KEY = "rh-smart-notifications-hidden";
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

interface HiddenNotificationTombstone {
  id: string;
  signature: string;
  hiddenAt: string;
}

function readHiddenTombstones(): HiddenNotificationTombstone[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Partial<HiddenNotificationTombstone>[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item.id || !item.signature) return null;
        return {
          id: String(item.id),
          signature: String(item.signature),
          hiddenAt: String(item.hiddenAt || new Date().toISOString()),
        };
      })
      .filter((item): item is HiddenNotificationTombstone => item !== null)
      .slice(0, 800);
  } catch {
    return [];
  }
}

function writeHiddenTombstones(items: HiddenNotificationTombstone[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(items.slice(0, 800)));
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
  const hiddenTombstones = readHiddenTombstones();
  const previousById = new Map(previous.map((item) => [item.id, item]));
  const previousBySignature = new Map(previous.map((item) => [notificationSignature(item), item]));
  const hiddenIds = new Set(hiddenTombstones.map((item) => item.id));
  const hiddenSignatures = new Set(hiddenTombstones.map((item) => item.signature));

  const merged = notifications.map<SmartNotificationState>((item) => {
    const signature = notificationSignature(item);
    const existing = previousById.get(item.id) ?? previousBySignature.get(signature);
    return {
      ...item,
      read: existing?.read ?? false,
      readAt: existing?.readAt ?? null,
      hidden: existing?.hidden ?? (hiddenIds.has(item.id) || hiddenSignatures.has(signature)),
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
  const current = readSmartNotifications();
  const currentHidden = readHiddenTombstones();
  const hiddenMap = new Map(currentHidden.map((item) => [item.id, item]));
  const hiddenSignatureMap = new Map(currentHidden.map((item) => [item.signature, item]));
  const nowIso = new Date().toISOString();

  const next = current.map((item) => ({
    ...item,
    hidden: true,
  }));

  next
    .filter((item) => item.hidden)
    .forEach((item) => {
      const signature = notificationSignature(item);
      if (!hiddenMap.has(item.id) && !hiddenSignatureMap.has(signature)) {
        const tombstone: HiddenNotificationTombstone = {
          id: item.id,
          signature,
          hiddenAt: nowIso,
        };
        hiddenMap.set(item.id, tombstone);
        hiddenSignatureMap.set(signature, tombstone);
      }
    });

  writeHiddenTombstones(
    Array.from(hiddenMap.values()).sort((left, right) => right.hiddenAt.localeCompare(left.hiddenAt)),
  );
  writeSmartNotifications(next);
}

export const SMART_NOTIFICATIONS_EVENT = EVENT_NAME;
