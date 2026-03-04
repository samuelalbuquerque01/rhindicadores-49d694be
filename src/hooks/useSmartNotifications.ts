import { useEffect, useMemo, useState } from "react";
import {
  clearReadSmartNotifications,
  hydrateNotificationStateFromBackend,
  markAllSmartNotificationsAsRead,
  markSmartNotificationAsRead,
  readSmartNotifications,
  SMART_NOTIFICATIONS_EVENT,
} from "@/lib/analytics/notificationStore";
import type { SmartNotificationState } from "@/lib/analytics/notifications";

export function useSmartNotifications() {
  const [allNotifications, setAllNotifications] = useState<SmartNotificationState[]>(() => readSmartNotifications());

  useEffect(() => {
    const sync = () => setAllNotifications(readSmartNotifications());

    window.addEventListener("storage", sync);
    window.addEventListener(SMART_NOTIFICATIONS_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SMART_NOTIFICATIONS_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    void hydrateNotificationStateFromBackend();
  }, []);

  const notifications = useMemo(
    () => allNotifications.filter((notification) => !notification.hidden),
    [allNotifications],
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    markAsRead: (notificationId: string) => markSmartNotificationAsRead(notificationId),
    markAllAsRead: () => markAllSmartNotificationsAsRead(),
    clearRead: () => clearReadSmartNotifications(),
  };
}
