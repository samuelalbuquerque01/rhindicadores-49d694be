import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  action,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "stat-card p-4 sm:p-6 rounded-xl animate-fade-in min-w-0 overflow-hidden",
        className
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
      <div className="w-full min-w-0">{children}</div>
    </div>
  );
}
