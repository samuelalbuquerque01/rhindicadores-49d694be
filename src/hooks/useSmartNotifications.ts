import { useEffect, useState } from "react";
import {
  readSmartNotifications,
  SMART_NOTIFICATIONS_EVENT,
} from "@/lib/analytics/notificationStore";
import { SmartNotification } from "@/lib/analytics/notifications";

export function useSmartNotifications() {
  const [notifications, setNotifications] = useState<SmartNotification[]>(() => readSmartNotifications());

  useEffect(() => {
    const sync = () => setNotifications(readSmartNotifications());

    window.addEventListener("storage", sync);
    window.addEventListener(SMART_NOTIFICATIONS_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SMART_NOTIFICATIONS_EVENT, sync);
    };
  }, []);

  return notifications;
}
