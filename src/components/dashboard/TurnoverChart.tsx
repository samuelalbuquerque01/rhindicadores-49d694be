import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
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
        <>
          <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="70%"
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
          Nenhum desligamento registrado
        </div>
      )}
    </ChartCard>
  );
}
