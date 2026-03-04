import type { SmartNotification, SmartNotificationState } from "@/lib/analytics/notifications";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "rh-smart-notifications";
const HIDDEN_STORAGE_KEY = "rh-smart-notifications-hidden";
const READ_STORAGE_KEY = "rh-smart-notifications-read";
const EVENT_NAME = "rh-smart-notifications-updated";
const TOMBSTONE_LIMIT = 1200;
const READ_RETENTION_DAYS = 30;
const STATE_USER_KEY = "system";

function notificationSignature(notification: Pick<SmartNotificationState, "type" | "targetTab" | "title" | "message">): string {
  return [notification.type, notification.targetTab, notification.title, notification.message]
    .map((part) => part.trim().toLowerCase())
    .join("::");
}

function normalizeSemanticChunk(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ");
}

function notificationReadKey(notification: Pick<SmartNotificationState, "type" | "targetTab" | "title" | "message">): string {
  return [
    normalizeSemanticChunk(notification.type),
    normalizeSemanticChunk(notification.targetTab),
    normalizeSemanticChunk(notification.title),
    normalizeSemanticChunk(notification.message),
  ].join("::");
}

function dispatchNotificationUpdate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
}

function scheduleBackendSync(notifications: SmartNotificationState[]): void {
  void syncNotificationStateToBackend(notifications);
}

function writeSmartNotifications(notifications: SmartNotificationState[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  scheduleBackendSync(notifications);
  dispatchNotificationUpdate();
}

interface HiddenNotificationTombstone {
  id: string;
  signature: string;
  hiddenAt: string;
}

interface ReadNotificationTombstone {
  id: string;
  key: string;
  readAt: string;
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
      .slice(0, TOMBSTONE_LIMIT);
  } catch {
    return [];
  }
}

function writeHiddenTombstones(items: HiddenNotificationTombstone[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(items.slice(0, TOMBSTONE_LIMIT)));
}

function readReadTombstones(): ReadNotificationTombstone[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(READ_STORAGE_KEY);
  if (!raw) return [];

  const now = new Date();
  const minTs = now.getTime() - READ_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  try {
    const parsed = JSON.parse(raw) as Partial<ReadNotificationTombstone>[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item.id || !item.key) return null;
        const readAt = String(item.readAt || new Date().toISOString());
        const ts = new Date(readAt).getTime();
        if (Number.isNaN(ts) || ts < minTs) return null;

        return {
          id: String(item.id),
          key: String(item.key),
          readAt,
        };
      })
      .filter((item): item is ReadNotificationTombstone => item !== null)
      .slice(0, TOMBSTONE_LIMIT);
  } catch {
    return [];
  }
}

function writeReadTombstones(items: ReadNotificationTombstone[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(items.slice(0, TOMBSTONE_LIMIT)));
}

function upsertReadTombstones(
  base: ReadNotificationTombstone[],
  items: SmartNotificationState[],
  readAtIso: string,
): ReadNotificationTombstone[] {
  const byId = new Map(base.map((item) => [item.id, item]));
  const byKey = new Map(base.map((item) => [item.key, item]));

  items.forEach((item) => {
    const key = notificationReadKey(item);
    if (byId.has(item.id) || byKey.has(key)) return;

    const tombstone: ReadNotificationTombstone = {
      id: item.id,
      key,
      readAt: readAtIso,
    };
    byId.set(item.id, tombstone);
    byKey.set(key, tombstone);
  });

  return Array.from(byId.values()).sort((left, right) => right.readAt.localeCompare(left.readAt));
}

export async function hydrateNotificationStateFromBackend(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("smart_notification_state")
      .select("notification_id, semantic_key, read, read_at, hidden, hidden_at")
      .eq("user_key", STATE_USER_KEY);

    if (error || !data || data.length === 0) return;

    const nowIso = new Date().toISOString();
    const existingReadTombstones = readReadTombstones();

    const readById = new Map(existingReadTombstones.map((item) => [item.id, item]));
    const readByKey = new Map(existingReadTombstones.map((item) => [item.key, item]));
    data
      .filter((item) => item.read)
      .forEach((item) => {
        const tombstone: ReadNotificationTombstone = {
          id: item.notification_id,
          key: item.semantic_key,
          readAt: item.read_at || nowIso,
        };
        if (!readById.has(tombstone.id) && !readByKey.has(tombstone.key)) {
          readById.set(tombstone.id, tombstone);
          readByKey.set(tombstone.key, tombstone);
        }
      });
    writeReadTombstones(
      Array.from(readById.values()).sort((left, right) => right.readAt.localeCompare(left.readAt)),
    );

    const hiddenById = new Map(readHiddenTombstones().map((item) => [item.id, item]));
    data
      .filter((item) => item.hidden)
      .forEach((item) => {
        if (hiddenById.has(item.notification_id)) return;
        hiddenById.set(item.notification_id, {
          id: item.notification_id,
          signature: item.notification_id,
          hiddenAt: item.hidden_at || nowIso,
        });
      });
    writeHiddenTombstones(
      Array.from(hiddenById.values()).sort((left, right) => right.hiddenAt.localeCompare(left.hiddenAt)),
    );

    const local = readSmartNotifications();
    if (local.length === 0) return;

    const byId = new Map(data.map((item) => [item.notification_id, item]));
    const bySemantic = new Map(data.map((item) => [item.semantic_key, item]));

    const merged = local.map((item) => {
      const semanticKey = notificationReadKey(item);
      const remote = byId.get(item.id) ?? bySemantic.get(semanticKey);
      if (!remote) return item;

      return {
        ...item,
        read: item.read || remote.read || readById.has(item.id) || readByKey.has(semanticKey),
        readAt: item.readAt ?? remote.read_at ?? readById.get(item.id)?.readAt ?? readByKey.get(semanticKey)?.readAt ?? null,
        hidden: item.hidden || remote.hidden || hiddenById.has(item.id),
      };
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    dispatchNotificationUpdate();
  } catch {
    // silent fallback to localStorage
  }
}

async function syncNotificationStateToBackend(notifications: SmartNotificationState[]): Promise<void> {
  try {
    if (notifications.length === 0) return;

    const rowsBySemantic = new Map<
      string,
      {
        user_key: string;
        notification_id: string;
        semantic_key: string;
        read: boolean;
        read_at: string | null;
        hidden: boolean;
        hidden_at: string | null;
        updated_at: string;
      }
    >();

    notifications.forEach((item) => {
      const semanticKey = notificationReadKey(item);
      const current = rowsBySemantic.get(semanticKey);
      const candidate = {
        user_key: STATE_USER_KEY,
        notification_id: item.id,
        semantic_key: semanticKey,
        read: item.read,
        read_at: item.readAt,
        hidden: item.hidden,
        hidden_at: item.hidden ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (!current) {
        rowsBySemantic.set(semanticKey, candidate);
        return;
      }

      rowsBySemantic.set(semanticKey, {
        ...candidate,
        notification_id: current.notification_id,
        read: current.read || candidate.read,
        read_at: current.read_at ?? candidate.read_at,
        hidden: current.hidden || candidate.hidden,
        hidden_at: current.hidden_at ?? candidate.hidden_at,
      });
    });

    await supabase
      .from("smart_notification_state")
      .upsert(Array.from(rowsBySemantic.values()), { onConflict: "user_key,semantic_key" });
  } catch {
    // silent fallback to localStorage
  }
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
  const readTombstones = readReadTombstones();
  const previousById = new Map(previous.map((item) => [item.id, item]));
  const previousBySignature = new Map(previous.map((item) => [notificationSignature(item), item]));
  const hiddenIds = new Set(hiddenTombstones.map((item) => item.id));
  const hiddenSignatures = new Set(hiddenTombstones.map((item) => item.signature));
  const readIds = new Set(readTombstones.map((item) => item.id));
  const readKeys = new Set(readTombstones.map((item) => item.key));
  const readAtById = new Map(readTombstones.map((item) => [item.id, item.readAt]));
  const readAtByKey = new Map(readTombstones.map((item) => [item.key, item.readAt]));

  const merged = notifications.map<SmartNotificationState>((item) => {
    const signature = notificationSignature(item);
    const readKey = notificationReadKey(item);
    const existing = previousById.get(item.id) ?? previousBySignature.get(signature);
    const restoredRead = Boolean(existing?.read || readIds.has(item.id) || readKeys.has(readKey));
    const restoredHidden = Boolean(existing?.hidden || hiddenIds.has(item.id) || hiddenSignatures.has(signature));

    return {
      ...item,
      read: restoredRead,
      readAt:
        existing?.readAt
        ?? readAtById.get(item.id)
        ?? readAtByKey.get(readKey)
        ?? null,
      hidden: restoredHidden,
    };
  });

  writeSmartNotifications(
    merged.sort((left, right) => right.date.localeCompare(left.date)),
  );
}

export function markSmartNotificationAsRead(notificationId: string): void {
  const nowIso = new Date().toISOString();
  const next = readSmartNotifications().map((item) =>
    item.id === notificationId
      ? {
          ...item,
          read: true,
          readAt: item.readAt ?? nowIso,
        }
      : item,
  );

  const readItems = next.filter((item) => item.id === notificationId && item.read);
  const readTombstones = upsertReadTombstones(readReadTombstones(), readItems, nowIso);
  writeReadTombstones(readTombstones);
  writeSmartNotifications(next);
}

export function markAllSmartNotificationsAsRead(): void {
  const nowIso = new Date().toISOString();
  const next = readSmartNotifications().map((item) => ({
    ...item,
    read: true,
    readAt: item.readAt ?? nowIso,
  }));

  const readTombstones = upsertReadTombstones(readReadTombstones(), next.filter((item) => item.read), nowIso);
  writeReadTombstones(readTombstones);
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
