import { useEffect } from "react";
import { LogOut, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/AuthProvider";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { useSmartNotifications } from "@/hooks/useSmartNotifications";
import { useOverviewAnalytics } from "@/features/overview";
import { persistSmartNotifications } from "@/lib/analytics/notificationStore";

export function Header() {
  const { data: overviewData } = useOverviewAnalytics({ preset: "30d", customRange: null });
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearRead } = useSmartNotifications();
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (overviewData) {
      persistSmartNotifications(overviewData.notifications);
    }
  }, [overviewData]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/85 backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          {/* Marca */}
          <div className="flex shrink-0 items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-[var(--shadow-card)]"
              aria-hidden="true"
            >
              <span className="text-sm font-bold leading-none text-primary-foreground">RH</span>
            </div>
            <span className="hidden text-[15px] font-semibold leading-tight tracking-tight text-foreground sm:block">
              Analytics
            </span>
          </div>

          {/* Busca decorativa: sem handler por decisão de produto (pendência).
              readOnly evita aceitar digitação que não teria efeito. */}
          <div className="hidden min-w-0 flex-1 md:flex md:justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative w-full max-w-md">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="text"
                    readOnly
                    disabled
                    aria-label="Buscar colaboradores e relatórios (indisponível)"
                    placeholder="Buscar colaboradores, relatorios..."
                    className="h-9 cursor-not-allowed border-input bg-muted/40 pl-9 text-sm text-muted-foreground shadow-none"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>Busca em desenvolvimento</TooltipContent>
            </Tooltip>
          </div>

          {/* Ações */}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearRead={clearRead}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu da conta">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {session?.user.email ?? "Conta"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
