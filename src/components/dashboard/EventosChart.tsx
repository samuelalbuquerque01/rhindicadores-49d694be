import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useEventosStats } from "@/hooks/useEventos";
import { EventoForm } from "@/components/forms/EventoForm";
import { Skeleton } from "@/components/ui/skeleton";

interface EventosChartProps {
  filialId?: string;
}

export function EventosChart({ filialId }: EventosChartProps) {
  const { data: stats, isLoading } = useEventosStats(
    filialId === "all" ? undefined : filialId
  );

  const chartData = [
    { name: "Confirmados", value: stats?.totalConfirmados || 0, fill: "hsl(var(--chart-1))" },
    { name: "Compareceram", value: stats?.totalCompareceram || 0, fill: "hsl(var(--chart-2))" },
  ];

  const chartConfig = {
    value: { label: "Participantes" },
  };

  if (isLoading) {
    return (
      <ChartCard title="Engajamento em Eventos" subtitle="Confirmações x Presenças">
        <Skeleton className="h-[200px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Engajamento em Eventos"
      subtitle={`${stats?.totalEventos || 0} eventos | Taxa: ${stats?.taxaEngajamento || 0}%`}
      action={<EventoForm />}
    >
      <ChartContainer config={chartConfig} className="h-[200px]">
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={100} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
