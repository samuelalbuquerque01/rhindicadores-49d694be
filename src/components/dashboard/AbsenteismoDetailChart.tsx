import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { AfastamentoForm } from "@/components/forms/AfastamentoForm";
import { Skeleton } from "@/components/ui/skeleton";
import type { AfastamentoCompleto } from "@/hooks/useAbsenteismoAnalytics";

interface AbsenteismoDetailChartProps {
  afastamentos: AfastamentoCompleto[];
  taxaAbsenteismo: number;
  totalDias: number;
  topSetores: { setor: string; dias: number }[];
  isLoading?: boolean;
}

const tipoLabelMap: Record<string, string> = {
  "Atestado médico": "Atestado",
  "Banco de horas": "Banco Horas",
  "Férias": "Ferias",
  "Licença maternidade": "Lic. Mat.",
  "Licença paternidade": "Lic. Pat.",
  Outro: "Outro",
};

export function AbsenteismoDetailChart({
  afastamentos,
  taxaAbsenteismo,
  totalDias,
  topSetores,
  isLoading,
}: AbsenteismoDetailChartProps) {
  if (isLoading) {
    return (
      <ChartCard title="Absenteismo Detalhado" subtitle="Por tipo de afastamento">
        <Skeleton className="h-[250px] w-full" />
      </ChartCard>
    );
  }

  const porTipo = new Map<string, { dias: number; ocorrencias: number }>();
  afastamentos.forEach((a) => {
    const current = porTipo.get(a.tipo) || { dias: 0, ocorrencias: 0 };
    current.dias += a.dias_afastados || 0;
    current.ocorrencias += 1;
    porTipo.set(a.tipo, current);
  });

  const chartData = Array.from(porTipo.entries()).map(([tipo, stats], index) => ({
    name: tipoLabelMap[tipo] || tipo,
    dias: stats.dias,
    ocorrencias: stats.ocorrencias,
    fill: `hsl(var(--chart-${(index % 6) + 1}))`,
  }));

  const chartConfig = {
    dias: { label: "Dias" },
    ocorrencias: { label: "Ocorrencias" },
  };

  return (
    <ChartCard
      title="Absenteismo Detalhado"
      subtitle={`Taxa: ${taxaAbsenteismo || 0}% | Total: ${totalDias || 0} dias`}
      action={<AfastamentoForm />}
    >
      <div className="space-y-4">
        <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
          <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="dias" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ocorrencias" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-5))" />
          </BarChart>
        </ChartContainer>
        {topSetores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {topSetores.slice(0, 3).map((setor) => (
              <div key={setor.setor} className="rounded-lg border border-border/60 p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground">Impacto por setor</p>
                <p className="font-medium">{setor.setor}</p>
                <p className="text-xs text-muted-foreground">{setor.dias} dias</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ChartCard>
  );
}
