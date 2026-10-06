import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ProjectionPoint } from "@/lib/analytics/forecast";

interface PredictionCardProps {
  title: string;
  trend: "up" | "down" | "stable";
  projectedTotal: number;
  confidence: number;
  riskSector: string;
  points: ProjectionPoint[];
}

export function PredictionCard({
  title,
  trend,
  projectedTotal,
  confidence,
  riskSector,
  points,
}: PredictionCardProps) {
  const trendIcon = trend === "up"
    ? <TrendingUp className="h-4 w-4" />
    : trend === "down"
      ? <TrendingDown className="h-4 w-4" />
      : <Minus className="h-4 w-4" />;

  const trendLabel = trend === "up" ? "Em alta" : trend === "down" ? "Em queda" : "Estavel";

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">Projecao para os proximos 3 meses</p>
        </div>
        <div className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          {trendIcon}
          <span>{trendLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <InfoTile label="Projecao" value={projectedTotal.toFixed(1)} />
        <InfoTile label="Confianca" value={`${confidence}%`} />
        <InfoTile label="Setor de maior risco" value={riskSector} />
      </div>

      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value: number | string) => Number(value).toFixed(1)} />
            <Line
              type="monotone"
              dataKey="historical"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Historico"
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 3 }}
              name="Projetado"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground truncate">{value}</p>
    </div>
  );
}
