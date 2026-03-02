import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { useTreinamentosStats } from "@/hooks/useTreinamentos";
import { TreinamentoForm } from "@/components/forms/TreinamentoForm";
import { Skeleton } from "@/components/ui/skeleton";

interface TreinamentoChartProps {
  filialId?: string;
}

export function TreinamentoChart({ filialId }: TreinamentoChartProps) {
  const { data: stats, isLoading } = useTreinamentosStats(
    filialId === "all" ? undefined : filialId
  );

  const chartData = [
    {
      name: "Vagas Oferecidas",
      value: stats?.totalVagas || 0,
      fill: "hsl(var(--chart-1))",
    },
    {
      name: "Participacoes",
      value: stats?.totalParticipantes || 0,
      fill: "hsl(var(--chart-2))",
    },
  ];

  const chartConfig = {
    value: {
      label: "Quantidade",
    },
  };

  if (isLoading) {
    return (
      <ChartCard title="Treinamentos" subtitle="Vagas x Participacao">
        <Skeleton className="h-[250px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Treinamentos"
      subtitle={`${stats?.totalTreinamentos || 0} treinamentos | Taxa: ${stats?.taxaParticipacao || 0}%`}
      action={<TreinamentoForm />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4 items-center">
        <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 text-sm">
          <div className="rounded-lg border border-border/60 p-3 bg-background/70">
            <p className="text-xs text-muted-foreground">Total realizados</p>
            <p className="text-lg font-semibold">{stats?.totalTreinamentos || 0}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 bg-background/70">
            <p className="text-xs text-muted-foreground">Taxa de conclusao</p>
            <p className="text-lg font-semibold">{stats?.taxaConclusao || 0}%</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 bg-background/70">
            <p className="text-xs text-muted-foreground">Media de participacao</p>
            <p className="text-lg font-semibold">{stats?.mediaParticipacao || 0}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 bg-background/70 col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Setor mais treinado</p>
            <p className="text-sm font-semibold truncate">{stats?.setorMaisTreinado || "-"}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 bg-background/70">
            <p className="text-xs text-muted-foreground">Horas totais</p>
            <p className="text-lg font-semibold">{stats?.horasTotais || 0}h</p>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
