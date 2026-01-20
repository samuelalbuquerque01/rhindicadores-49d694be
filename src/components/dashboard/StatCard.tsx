import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "info";
}

const variantStyles = {
  default: "bg-card",
  primary: "gradient-primary text-primary-foreground",
  success: "gradient-success text-success-foreground",
  warning: "gradient-warning text-warning-foreground",
  info: "gradient-info text-info-foreground",
};

const iconContainerStyles = {
  default: "bg-primary/10 text-primary",
  primary: "bg-primary-foreground/20 text-primary-foreground",
  success: "bg-success-foreground/20 text-success-foreground",
  warning: "bg-warning-foreground/20 text-warning-foreground",
  info: "bg-info-foreground/20 text-info-foreground",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const isGradient = variant !== "default";

  return (
    <div
      className={cn(
        "stat-card p-6 rounded-xl animate-fade-in",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              "text-sm font-medium",
              isGradient ? "text-current/80" : "text-muted-foreground"
            )}
          >
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p
              className={cn(
                "text-sm",
                isGradient ? "text-current/70" : "text-muted-foreground"
              )}
            >
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 pt-1">
              {trend.value > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : trend.value < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  !isGradient &&
                    (trend.isPositive !== undefined
                      ? trend.isPositive
                        ? "text-success"
                        : "text-destructive"
                      : trend.value > 0
                      ? "text-success"
                      : trend.value < 0
                      ? "text-destructive"
                      : "text-muted-foreground")
                )}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span
                className={cn(
                  "text-sm",
                  isGradient ? "text-current/70" : "text-muted-foreground"
                )}
              >
                vs mês anterior
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-xl",
            iconContainerStyles[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
