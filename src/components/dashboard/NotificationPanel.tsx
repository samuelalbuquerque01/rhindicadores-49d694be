import { useMemo, useState } from "react";
import {
  Bell,
  AlertTriangle,
  CalendarClock,
  Briefcase,
  Activity,
  TrendingUp,
  Stethoscope,
  Signal,
  Check,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SmartNotificationState } from "@/lib/analytics/notifications";
import { cn } from "@/lib/utils";

interface NotificationPanelProps {
  notifications: SmartNotificationState[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearRead: () => void;
}

export function NotificationPanel({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearRead,
}: NotificationPanelProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const iconByType = useMemo(
    () => ({
      contract: <Briefcase className="h-4 w-4" />,
      vacation: <CalendarClock className="h-4 w-4" />,
      medical: <Stethoscope className="h-4 w-4" />,
      absenteeism: <Activity className="h-4 w-4" />,
      turnover: <TrendingUp className="h-4 w-4" />,
      anomaly: <AlertTriangle className="h-4 w-4" />,
      forecast: <Signal className="h-4 w-4" />,
    }),
    [],
  );

  const goToDetails = (targetTab: SmartNotificationState["targetTab"]) => {
    navigate(`/?tab=${targetTab}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[calc(100vw-1.5rem)] sm:w-[380px] p-0">
        <div className="max-h-[420px] overflow-y-auto">
          <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-3 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Notificacoes</h4>
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nao lida(s)
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={onMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Marcar todas como lidas
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={onClearRead}
                disabled={notifications.length === 0}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Limpar lidas
              </Button>
            </div>
          </header>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma notificacao no momento.
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={cn(
                    "p-3 space-y-2 transition-colors",
                    notification.read ? "bg-muted/20" : "bg-background",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center",
                        notification.priority === "high" && "bg-red-100 text-red-700",
                        notification.priority === "medium" && "bg-yellow-100 text-yellow-700",
                        notification.priority === "low" && "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {iconByType[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="text-sm text-muted-foreground leading-snug">{notification.message}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(parseISO(notification.date), { addSuffix: true, locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {notification.priority === "high"
                            ? "alta"
                            : notification.priority === "medium"
                              ? "media"
                              : "baixa"}
                        </Badge>
                        {notification.read ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Lida
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{notification.urgencyLabel}</span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => goToDetails(notification.targetTab)}>
                        Ver detalhes
                      </Button>
                      <Button
                        size="sm"
                        variant={notification.read ? "secondary" : "ghost"}
                        className="h-8 px-2"
                        onClick={() => onMarkAsRead(notification.id)}
                        disabled={notification.read}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Lida
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
