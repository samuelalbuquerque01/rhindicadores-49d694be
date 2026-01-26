import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useLideresStats } from "@/hooks/useLideres";
import { LiderForm } from "@/components/forms/LiderForm";
import { Skeleton } from "@/components/ui/skeleton";

interface LideresChartProps {
  filialId?: string;
}

export function LideresChart({ filialId }: LideresChartProps) {
  const { data: stats, isLoading } = useLideresStats(
    filialId === "all" ? undefined : filialId
  );

  const chartData = [
    { name: "Supervisor", value: stats?.porNivel.supervisor || 0, fill: "hsl(var(--chart-1))" },
    { name: "Coordenador", value: stats?.porNivel.coordenador || 0, fill: "hsl(var(--chart-2))" },
    { name: "Gerente", value: stats?.porNivel.gerente || 0, fill: "hsl(var(--chart-3))" },
    { name: "Diretor", value: stats?.porNivel.diretor || 0, fill: "hsl(var(--chart-4))" },
  ];

  const chartConfig = {
    value: { label: "Quantidade" },
  };

  if (isLoading) {
    return (
      <ChartCard title="Líderes Formados" subtitle="Por nível">
        <Skeleton className="h-[250px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Líderes Formados"
      subtitle={`Total: ${stats?.total || 0} | Este ano: ${stats?.formadosEsteAno || 0}`}
      action={<LiderForm />}
    >
      <ChartContainer config={chartConfig} className="h-[250px]">
        <BarChart data={chartData}>
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
