import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarRange,
  UserMinus,
  Users,
  UserX,
  Hospital,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ChartNarrative } from "@/components/dashboard/ChartNarrative";
import { HeatmapChart } from "@/components/dashboard/HeatmapChart";
import { PredictionCard } from "@/components/dashboard/PredictionCard";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { SectorComparisonTable } from "@/components/dashboard/SectorComparisonTable";
import { persistSmartNotifications } from "@/lib/analytics/notificationStore";
import { PeriodPreset } from "@/lib/analytics/period";
import { useOverviewAnalytics } from "@/features/overview/useOverviewAnalytics";

interface OverviewDashboardProps {
  filialId?: string;
}

const PRESET_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: "30d", label: "30 days" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "custom", label: "Custom" },
];

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function priorDateString(days: number): string {
  const base = new Date();
  base.setDate(base.getDate() - days);
  return base.toISOString().split("T")[0];
}

function iconForMetric(id: string) {
  if (id === "employees") return <Users className="h-5 w-5" />;
  if (id === "absenteeism-rate") return <Activity className="h-5 w-5" />;
  if (id === "turnover-rate") return <UserMinus className="h-5 w-5" />;
  if (id === "dismissals") return <UserX className="h-5 w-5" />;
  return <Hospital className="h-5 w-5" />;
}

export function OverviewDashboard({ filialId }: OverviewDashboardProps) {
  const [preset, setPreset] = useState<PeriodPreset>("6m");
  const [customStart, setCustomStart] = useState<string>(priorDateString(90));
  const [customEnd, setCustomEnd] = useState<string>(todayString());

  const customRange = useMemo(() => {
    if (preset !== "custom") {
      return null;
    }

    return {
      start: new Date(`${customStart}T00:00:00`),
      end: new Date(`${customEnd}T00:00:00`),
    };
  }, [customEnd, customStart, preset]);

  const { data, isLoading, error } = useOverviewAnalytics({
    filialId,
    preset,
    customRange,
  });

  useEffect(() => {
    if (data) {
      persistSmartNotifications(data.notifications);
    }
  }, [data]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load analytics data. Check Supabase connection and try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Overview BI Panel</h2>
            <p className="text-sm text-muted-foreground">
              Period controls affect metrics, charts, insights, anomalies and forecasts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Period</label>
              <Select value={preset} onValueChange={(value) => setPreset(value as PeriodPreset)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Choose period" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {preset === "custom" ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Start</label>
                  <Input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">End</label>
                  <Input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
                </div>
              </>
            ) : null}
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
              <span>
                {data
                  ? `${data.range.start.toLocaleDateString("en-US")} - ${data.range.end.toLocaleDateString("en-US")}`
                  : "Loading range"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={`metric-skeleton-${index}`} className="h-[152px] w-full rounded-xl" />
            ))
          : (data?.metrics ?? []).map((metric) => {
              const isPositive = metric.direction === "higher-better"
                ? metric.comparison.variationPercent >= 0
                : metric.comparison.variationPercent <= 0;

              return (
                <MetricCard
                  key={metric.id}
                  title={metric.label}
                  value={metric.value}
                  icon={iconForMetric(metric.id)}
                  variationPercent={metric.comparison.variationPercent}
                  trend={metric.comparison.trend}
                  isPositive={isPositive}
                  tooltip={metric.tooltip}
                />
              );
            })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Absenteeism by month" subtitle="Lost days per month" loading={isLoading} isEmpty={(data?.absenteeismMonthly.length ?? 0) === 0}>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.absenteeismMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number | string) => `${Number(value).toFixed(1)} days`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0f766e"
                  strokeWidth={2.2}
                  name="Absenteeism"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {(data?.absenteeismMonthly ?? [])
              .filter((point) => point.anomaly)
              .map((point) => (
                <span key={point.key} className="text-xs rounded-full bg-red-100 text-red-700 px-2 py-1">
                  Anomaly: {point.label}
                </span>
              ))}
          </div>
          <ChartNarrative lines={data?.chartNarratives.absenteeism ?? []} />
        </ChartCard>

        <ChartCard title="Turnover by month" subtitle="Dismissals per month" loading={isLoading} isEmpty={(data?.turnoverMonthly.length ?? 0) === 0}>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.turnoverMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number | string) => `${Number(value).toFixed(0)} dismissals`} />
                <Legend />
                <Bar dataKey="value" name="Turnover">
                  {(data?.turnoverMonthly ?? []).map((point) => (
                    <Cell key={point.key} fill={point.anomaly ? "#dc2626" : "#2563eb"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {(data?.turnoverMonthly ?? [])
              .filter((point) => point.anomaly)
              .map((point) => (
                <span key={point.key} className="text-xs rounded-full bg-red-100 text-red-700 px-2 py-1">
                  Anomaly: {point.label}
                </span>
              ))}
          </div>
          <ChartNarrative lines={data?.chartNarratives.turnover ?? []} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Dismissals by sector" subtitle="Current period" loading={isLoading} isEmpty={(data?.dismissalsBySector.length ?? 0) === 0}>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dismissalsBySector} layout="vertical" margin={{ left: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="sector" type="category" width={130} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number | string) => `${Number(value).toFixed(0)} dismissals`} />
                <Bar dataKey="value" fill="#0f766e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartNarrative lines={data?.chartNarratives.dismissalsBySector ?? []} />
        </ChartCard>

        <ChartCard title="Absences by sector" subtitle="Lost days by sector" loading={isLoading} isEmpty={(data?.absencesBySector.length ?? 0) === 0}>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.absencesBySector} layout="vertical" margin={{ left: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="sector" type="category" width={130} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number | string) => `${Number(value).toFixed(1)} days`} />
                <Bar dataKey="value" fill="#d97706" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartNarrative lines={data?.chartNarratives.absencesBySector ?? []} />
        </ChartCard>
      </div>

      <ChartCard
        title="Absenteeism heatmap (Sector x Month)"
        subtitle="Cell intensity represents lost days"
        loading={isLoading}
        isEmpty={(data?.heatmap.cells.length ?? 0) === 0}
      >
        <HeatmapChart data={data?.heatmap ?? { months: [], sectors: [], cells: [], maxValue: 0 }} />
      </ChartCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PredictionCard
          title="Turnover forecast"
          trend={data?.predictions.turnover.trend ?? "stable"}
          projectedTotal={data?.predictions.turnover.projectedTotal ?? 0}
          confidence={data?.predictions.turnover.confidence ?? 0}
          riskSector={data?.predictions.turnover.riskSector ?? "No data"}
          points={data?.predictions.turnover.points ?? []}
        />
        <PredictionCard
          title="Absenteeism forecast"
          trend={data?.predictions.absenteeism.trend ?? "stable"}
          projectedTotal={data?.predictions.absenteeism.projectedTotal ?? 0}
          confidence={data?.predictions.absenteeism.confidence ?? 0}
          riskSector={data?.predictions.absenteeism.riskSector ?? "No data"}
          points={data?.predictions.absenteeism.points ?? []}
        />
      </div>

      <InsightsPanel insights={data?.insights ?? []} />

      <SectorComparisonTable rows={data?.sectorRows ?? []} />
    </div>
  );
}
