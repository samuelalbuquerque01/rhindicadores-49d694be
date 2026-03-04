import { useEffect } from "react";
import { Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { useSmartNotifications } from "@/hooks/useSmartNotifications";
import { useOverviewAnalytics } from "@/features/overview";
import { persistSmartNotifications } from "@/lib/analytics/notificationStore";

export function Header() {
  const { data: overviewData } = useOverviewAnalytics({ preset: "30d", customRange: null });
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearRead } = useSmartNotifications();

  useEffect(() => {
    if (overviewData) {
      persistSmartNotifications(overviewData.notifications);
    }
  }, [overviewData]);

  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">RH</span>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:block">Analytics</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar colaboradores, relatorios..."
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearRead={clearRead}
            />
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
