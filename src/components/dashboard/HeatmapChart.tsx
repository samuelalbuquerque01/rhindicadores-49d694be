import { HeatmapData, getHeatmapCellClass } from "@/lib/analytics/heatmap";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatmapChartProps {
  title?: string;
  data: HeatmapData;
}

export function HeatmapChart({ title = "Absenteeism Heatmap", data }: HeatmapChartProps) {
  if (data.sectors.length === 0 || data.months.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
        No absenteeism data to build heatmap for this period.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-300" />Low</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-300" />Medium</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-300" />High</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `160px repeat(${data.months.length}, minmax(88px, 1fr))` }}
          >
            <div className="text-xs font-medium text-muted-foreground p-2">Sector</div>
            {data.months.map((month) => (
              <div key={month.key} className="text-xs font-medium text-muted-foreground p-2 text-center">
                {month.label}
              </div>
            ))}

            {data.sectors.map((sector) => (
              <HeatmapRow key={sector} sector={sector} data={data} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeatmapRow({ sector, data }: { sector: string; data: HeatmapData }) {
  return (
    <>
      <div className="p-2 text-sm font-medium text-foreground truncate">{sector}</div>
      {data.months.map((month) => {
        const cell = data.cells.find(
          (current) => current.sector === sector && current.monthKey === month.key,
        );
        const value = cell?.value ?? 0;
        const intensity = cell?.intensity ?? "low";

        return (
          <TooltipProvider key={`${sector}-${month.key}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`h-10 rounded border text-xs flex items-center justify-center font-medium ${getHeatmapCellClass(
                    intensity,
                  )}`}
                >
                  {value.toFixed(0)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {sector} | {month.label}: {value.toFixed(0)} day(s)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </>
  );
}
