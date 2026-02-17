import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
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
      name: "Participações",
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
      <ChartCard title="Treinamentos" subtitle="Vagas x Participação">
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
      <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
