import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useColaboradoresStats } from "@/hooks/useColaboradores";
import { ColaboradorForm } from "@/components/forms/ColaboradorForm";
import { Skeleton } from "@/components/ui/skeleton";

interface ColaboradoresChartProps {
  filialId?: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ColaboradoresChart({ filialId }: ColaboradoresChartProps) {
  const { data: stats, isLoading } = useColaboradoresStats(
    filialId === "all" ? undefined : filialId
  );

  const chartData = [
    { name: "CLT Administrativo", value: stats?.porTipo.administrativo || 0 },
    { name: "CLT Corpo Clínico", value: stats?.porTipo.corpoClinico || 0 },
    { name: "PJ", value: stats?.porTipo.pj || 0 },
    { name: "Estagiário", value: stats?.porTipo.estagiarios || 0 },
  ].filter(item => item.value > 0);

  const chartConfig = {
    administrativo: { label: "CLT Administrativo", color: COLORS[0] },
    corpoClinico: { label: "CLT Corpo Clínico", color: COLORS[1] },
    pj: { label: "PJ", color: COLORS[2] },
    estagiarios: { label: "Estagiários", color: COLORS[3] },
  };

  if (isLoading) {
    return (
      <ChartCard title="Colaboradores por Tipo" subtitle="Distribuição">
        <Skeleton className="h-[250px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Colaboradores por Tipo"
      subtitle={`Total: ${stats?.ativos || 0} ativos`}
      action={<ColaboradorForm />}
    >
      {chartData.length > 0 ? (
        <>
          <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius="70%"
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
          Nenhum colaborador cadastrado
        </div>
      )}
    </ChartCard>
  );
}
