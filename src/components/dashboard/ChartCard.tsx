import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  loading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  action,
  loading = false,
  isEmpty = false,
  emptyMessage = "Sem dados para este grafico no periodo selecionado.",
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "stat-card rounded-xl bg-card p-4 sm:p-6 animate-fade-in min-w-0 overflow-hidden",
        className,
      )}
    >
      <div className="flex items-start justify-between mb-4 sm:mb-6 gap-2">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{subtitle}</p>
          )}
        </div>
        <div className="shrink-0">{action}</div>
      </div>
      <div className="w-full min-w-0">
        {loading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : isEmpty ? (
          <div className="h-[240px] w-full rounded-lg border border-dashed border-border flex items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
