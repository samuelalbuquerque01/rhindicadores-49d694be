import { SmartNotification } from "@/lib/analytics/notifications";

const STORAGE_KEY = "rh-smart-notifications";
const EVENT_NAME = "rh-smart-notifications-updated";

export function persistSmartNotifications(notifications: SmartNotification[]): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function readSmartNotifications(): SmartNotification[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SmartNotification[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export const SMART_NOTIFICATIONS_EVENT = EVENT_NAME;
