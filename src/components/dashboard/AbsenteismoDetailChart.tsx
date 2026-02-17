import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useAbsenteismoStats } from "@/hooks/useAfastamentos";
import { AfastamentoForm } from "@/components/forms/AfastamentoForm";
import { Skeleton } from "@/components/ui/skeleton";

interface AbsenteismoDetailChartProps {
  filialId?: string;
}

export function AbsenteismoDetailChart({ filialId }: AbsenteismoDetailChartProps) {
  const { data: stats, isLoading } = useAbsenteismoStats(
    filialId === "all" ? undefined : filialId
  );

  const chartData = [
    { name: "Atestado", dias: stats?.porTipo.atestado || 0, fill: "hsl(var(--chart-1))" },
    { name: "Banco Horas", dias: stats?.porTipo.bancoHoras || 0, fill: "hsl(var(--chart-2))" },
    { name: "Férias", dias: stats?.porTipo.ferias || 0, fill: "hsl(var(--chart-3))" },
    { name: "Lic. Mat.", dias: stats?.porTipo.licencaMaternidade || 0, fill: "hsl(var(--chart-4))" },
    { name: "Lic. Pat.", dias: stats?.porTipo.licencaPaternidade || 0, fill: "hsl(var(--chart-5))" },
    { name: "Outro", dias: stats?.porTipo.outro || 0, fill: "hsl(var(--chart-6))" },
  ];

  const chartConfig = {
    dias: { label: "Dias" },
  };

  if (isLoading) {
    return (
      <ChartCard title="Absenteísmo Detalhado" subtitle="Por tipo de afastamento">
        <Skeleton className="h-[250px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Absenteísmo Detalhado"
      subtitle={`Taxa: ${stats?.taxaAbsenteismo || 0}% | Total: ${stats?.totalDiasAfastados || 0} dias`}
      action={<AfastamentoForm />}
    >
      <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
        <BarChart data={chartData}>
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="dias" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
