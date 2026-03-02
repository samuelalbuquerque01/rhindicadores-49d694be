import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
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
    {
      name: "Confirmados",
      value: stats?.totalConfirmados || 0,
      fill: "hsl(var(--chart-1))",
    },
    {
      name: "Compareceram",
      value: stats?.totalCompareceram || 0,
      fill: "hsl(var(--chart-2))",
    },
    {
      name: "Faltaram",
      value: stats?.faltaram || 0,
      fill: "hsl(var(--chart-3))",
    },
  ];

  const chartConfig = {
    value: { label: "Participantes" },
  };

  if (isLoading) {
    return (
      <ChartCard title="Engajamento em Eventos" subtitle="Confirmacoes x Presencas">
        <Skeleton className="h-[250px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Engajamento em Eventos"
      subtitle={`${stats?.totalEventos || 0} eventos | Taxa: ${stats?.taxaComparecimento || 0}%`}
      action={<EventoForm />}
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
            <p className="text-xs text-muted-foreground">Total de eventos</p>
            <p className="text-lg font-semibold">{stats?.totalEventos || 0}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 bg-background/70">
            <p className="text-xs text-muted-foreground">Taxa de comparecimento</p>
            <p className="text-lg font-semibold">{stats?.taxaComparecimento || 0}%</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 bg-background/70">
            <p className="text-xs text-muted-foreground">Total de participantes</p>
            <p className="text-lg font-semibold">{stats?.totalParticipantes || 0}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 bg-background/70 col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Setor mais engajado</p>
            <p className="text-sm font-semibold truncate">{stats?.setorMaisEngajado || "-"}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 bg-background/70">
            <p className="text-xs text-muted-foreground">Media por evento</p>
            <p className="text-lg font-semibold">{stats?.mediaParticipacao || 0}</p>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
