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
  /** Classes extras aplicadas ao container. Sobrescrevem as padrões via tailwind-merge. */
  className?: string;
}

/**
 * Opção A: card branco com borda sutil. A cor da variante é aplicada apenas
 * no ícone (fundo suave + glifo colorido) e numa barra fina de acento no topo,
 * preservando o contraste do número e da label sobre a superfície do card.
 */
const variantStyles = {
  default: { accent: "bg-border", icon: "bg-muted text-muted-foreground" },
  primary: { accent: "bg-primary", icon: "bg-primary-soft text-primary-fg" },
  success: { accent: "bg-success", icon: "bg-success-soft text-success-fg" },
  warning: { accent: "bg-warning", icon: "bg-warning-soft text-warning-fg" },
  info: { accent: "bg-info", icon: "bg-info-soft text-info-fg" },
} as const;

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const { accent, icon: iconStyles } = variantStyles[variant];

  return (
    <div
      className={cn(
        "stat-card relative overflow-hidden rounded-xl bg-card p-6 animate-fade-in",
        className,
      )}
    >
      {/* Barra fina de acento que identifica a categoria do indicador. */}
      <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-[3px]", accent)} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-2.5 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
        </div>
        <div className={cn("shrink-0 rounded-xl p-2.5", iconStyles)}>
          {icon}
        </div>
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
      )}

      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend.value > 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : trend.value < 0 ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : (
            <Minus className="h-3.5 w-3.5" />
          )}
          <span
            className={cn(
              "text-sm font-medium tabular-nums",
              trend.isPositive !== undefined
                ? trend.isPositive
                  ? "text-success"
                  : "text-destructive"
                : trend.value > 0
                  ? "text-success"
                  : trend.value < 0
                    ? "text-destructive"
                    : "text-muted-foreground",
            )}
          >
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">vs mês anterior</span>
        </div>
      )}
    </div>
  );
}
