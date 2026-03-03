import { Bell, Check, CheckCheck, Calendar, GraduationCap, Cake, Clock, AlertTriangle, PartyPopper, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

const tipoIcons: Record<string, React.ReactNode> = {
  aniversario: <Cake className="h-4 w-4" />,
  experiencia: <Clock className="h-4 w-4" />,
  ferias: <PartyPopper className="h-4 w-4" />,
  evento: <Calendar className="h-4 w-4" />,
  treinamento: <GraduationCap className="h-4 w-4" />,
  absenteismo: <AlertTriangle className="h-4 w-4" />,
};

const prioridadeCores: Record<string, string> = {
  alta: "bg-destructive/15 text-destructive border-destructive/30",
  media: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  baixa: "bg-primary/10 text-primary border-primary/20",
};

const prioridadeBadge: Record<string, string> = {
  alta: "bg-destructive text-destructive-foreground",
  media: "bg-amber-500 text-white",
  baixa: "bg-muted text-muted-foreground",
};

export function NotificacoesDropdown() {
  const { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas } = useNotificacoes();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="font-semibold text-foreground text-sm">Notificações</h4>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1 text-muted-foreground"
              onClick={() => marcarTodasComoLidas()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notificacoes.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors",
                    !n.lida && "bg-accent/30"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center border",
                    prioridadeCores[n.prioridade] || prioridadeCores.baixa
                  )}>
                    {tipoIcons[n.tipo] || <Bell className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-snug",
                      !n.lida ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {n.mensagem}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(n.data), { addSuffix: true, locale: ptBR })}
                      </span>
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", prioridadeBadge[n.prioridade])}>
                        {n.prioridade}
                      </Badge>
                    </div>
                  </div>
                  {!n.lida && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 self-center"
                      onClick={() => marcarComoLida(n.id)}
                      title="Marcar como lida"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
