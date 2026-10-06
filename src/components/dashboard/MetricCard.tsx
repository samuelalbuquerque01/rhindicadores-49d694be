import { Info, TrendingDown, TrendingUp } from "lucide-react";
import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variationPercent: number;
  trend: "up" | "down" | "stable";
  isPositive?: boolean;
  tooltip?: string;
}

function formatVariation(variationPercent: number): string {
  const absValue = Math.abs(variationPercent);
  return `${variationPercent >= 0 ? "+" : "-"}${absValue.toFixed(1)}%`;
}

export function MetricCard({
  title,
  value,
  icon,
  variationPercent,
  trend,
  isPositive = true,
  tooltip,
}: MetricCardProps) {
  const trendUp = trend === "up";
  const trendDown = trend === "down";

  const colorClass = trend === "stable"
    ? "text-muted-foreground"
    : isPositive
      ? "text-success"
      : "text-destructive";

  return (
    <div className="stat-card bg-card p-6 rounded-xl min-h-[152px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{title}</span>
            {tooltip ? (
              <Tooltip>
                <TooltipTrigger aria-label={`Mais informações sobre ${title}`}>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[220px] text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground">
          {icon}
        </div>
      </div>
      <div className={cn("mt-4 flex items-center gap-2 text-sm font-medium", colorClass)}>
        {trendUp ? <TrendingUp className="h-4 w-4" /> : null}
        {trendDown ? <TrendingDown className="h-4 w-4" /> : null}
        {trend === "stable" ? <span>~</span> : null}
        <span>{formatVariation(variationPercent)}</span>
        <span className="text-xs font-normal text-muted-foreground">vs periodo anterior</span>
      </div>
    </div>
  );
}
