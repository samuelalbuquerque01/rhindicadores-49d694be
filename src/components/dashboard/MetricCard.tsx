import { Info, TrendingDown, TrendingUp } from "lucide-react";
import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    ? "text-slate-500"
    : isPositive
      ? "text-emerald-600"
      : "text-red-600";

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition p-6 min-h-[152px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{title}</span>
            {tooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[220px] text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
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
