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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SmartNotification } from "@/lib/analytics/notifications";
import { cn } from "@/lib/utils";

interface NotificationPanelProps {
  notifications: SmartNotification[];
}

export function NotificationPanel({ notifications }: NotificationPanelProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.length;

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

  const goToDetails = (tab: SmartNotification["targetTab"]) => {
    navigate(`/?tab=${tab}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="border-b border-border p-3">
          <h4 className="text-sm font-semibold text-foreground">Notificacoes inteligentes</h4>
          <p className="text-xs text-muted-foreground">Geradas automaticamente a partir dos dados de RH</p>
        </div>

        <ScrollArea className="max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhum alerta no momento.
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center",
                      notification.priority === "high" && "bg-red-100 text-red-700",
                      notification.priority === "medium" && "bg-yellow-100 text-yellow-700",
                      notification.priority === "low" && "bg-emerald-100 text-emerald-700",
                    )}>
                      {iconByType[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{notification.message}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(parseISO(notification.date), { addSuffix: true, locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {notification.priority === "high" ? "alta" : notification.priority === "medium" ? "media" : "baixa"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{notification.urgencyLabel}</span>
                    <Button size="sm" variant="outline" onClick={() => goToDetails(notification.targetTab)}>
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
