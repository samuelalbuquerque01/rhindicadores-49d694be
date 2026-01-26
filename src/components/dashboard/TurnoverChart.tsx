import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { useTurnoverStats } from "@/hooks/useDesligamentos";
import { DesligamentoForm } from "@/components/forms/DesligamentoForm";
import { Skeleton } from "@/components/ui/skeleton";

interface TurnoverChartProps {
  filialId?: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-3))",
];

export function TurnoverChart({ filialId }: TurnoverChartProps) {
  const { data: stats, isLoading } = useTurnoverStats(
    filialId === "all" ? undefined : filialId
  );

  const chartData = [
    { name: "Pedido de demissão", value: stats?.porMotivo.pedido || 0 },
    { name: "Iniciativa da empresa", value: stats?.porMotivo.empresa || 0 },
    { name: "Término de contrato", value: stats?.porMotivo.contrato || 0 },
  ].filter(item => item.value > 0);

  const chartConfig = {
    pedido: { label: "Pedido de demissão", color: COLORS[0] },
    empresa: { label: "Iniciativa da empresa", color: COLORS[1] },
    contrato: { label: "Término de contrato", color: COLORS[2] },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <ChartCard title="Turnover" subtitle="Motivos de desligamento">
        <Skeleton className="h-[250px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Turnover"
      subtitle={`${stats?.turnoverPercentual || 0}% | Custo: ${formatCurrency(stats?.custoTotal || 0)}`}
      action={<DesligamentoForm />}
    >
      {chartData.length > 0 ? (
        <ChartContainer config={chartConfig} className="h-[250px]">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      ) : (
        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
          Nenhum desligamento registrado
        </div>
      )}
    </ChartCard>
  );
}
