import { useMemo } from "react";
import { Users, GraduationCap, CalendarDays, UserMinus, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { useColaboradores } from "@/hooks/useColaboradores";
import {
  useTreinamentos,
  useTreinamentosParticipacoesDetalhadas,
} from "@/hooks/useTreinamentos";
import { useEventos, useEventosParticipacoesDetalhadas } from "@/hooks/useEventos";
import { useAfastamentos } from "@/hooks/useAfastamentos";
import { useTurnoverStats } from "@/hooks/useDesligamentos";

interface VisaoGeralPanelProps {
  filialId?: string;
}

type TreinamentoParticipacaoDetalhada = {
  participou: boolean;
  treinamento?: {
    carga_horaria?: number | null;
  } | null;
};

type EventoParticipacaoDetalhada = {
  confirmou_presenca: boolean;
  compareceu: boolean;
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

export function VisaoGeralPanel({ filialId }: VisaoGeralPanelProps) {
  const resolvedFilialId = filialId === "all" ? undefined : filialId;

  const { data: colaboradoresData, isLoading: colaboradoresLoading } = useColaboradores({
    filialId: resolvedFilialId,
    status: "Ativo",
  });
  const { data: treinamentosData, isLoading: treinamentosLoading } =
    useTreinamentos(resolvedFilialId);
  const { data: treinamentosParticipacoesData, isLoading: treinamentosParticipacoesLoading } =
    useTreinamentosParticipacoesDetalhadas(resolvedFilialId);
  const { data: eventosData, isLoading: eventosLoading } = useEventos(resolvedFilialId);
  const { data: eventosParticipacoesData, isLoading: eventosParticipacoesLoading } =
    useEventosParticipacoesDetalhadas(resolvedFilialId);
  const { data: afastamentosData, isLoading: afastamentosLoading } =
    useAfastamentos(resolvedFilialId);
  const { data: turnoverStats, isLoading: turnoverLoading } =
    useTurnoverStats(resolvedFilialId);

  const colaboradores = colaboradoresData ?? [];
  const treinamentos = treinamentosData ?? [];
  const treinamentosParticipacoes =
    (treinamentosParticipacoesData ?? []) as TreinamentoParticipacaoDetalhada[];
  const eventos = eventosData ?? [];
  const eventosParticipacoes =
    (eventosParticipacoesData ?? []) as EventoParticipacaoDetalhada[];
  const afastamentos = afastamentosData ?? [];

  const colaboradoresResumo = useMemo(() => {
    const total = colaboradores.length;
    const clt = colaboradores.filter((c) => String(c.tipo_colaborador || "").startsWith("CLT")).length;
    const pj = colaboradores.filter((c) => c.tipo_colaborador === "PJ").length;
    const estagio = colaboradores.filter((c) => String(c.tipo_colaborador || "").includes("Estagi")).length;

    const chartData = [
      { name: "CLT", value: clt, fill: CHART_COLORS[0] },
      { name: "PJ", value: pj, fill: CHART_COLORS[1] },
      { name: "Estagio", value: estagio, fill: CHART_COLORS[2] },
    ].filter((item) => item.value > 0);

    return {
      total,
      clt,
      pj,
      estagio,
      chartData,
    };
  }, [colaboradores]);

  const treinamentosResumo = useMemo(() => {
    const totalTreinamentos = treinamentos.length;
    const totalVagas = treinamentos.reduce((sum, t) => sum + (t.vagas_totais || 0), 0);
    const totalParticipacoes = treinamentosParticipacoes.length;
    const totalParticipantes = treinamentosParticipacoes.filter((p) => p.participou).length;
    const taxaConclusao =
      totalParticipacoes > 0 ? (totalParticipantes / totalParticipacoes) * 100 : 0;
    const horasTotais = treinamentosParticipacoes.reduce((sum, p) => {
      if (!p.participou) return sum;
      return sum + (p.treinamento?.carga_horaria || 0);
    }, 0);

    return {
      totalTreinamentos,
      totalVagas,
      totalParticipantes,
      taxaConclusao: Math.round(taxaConclusao * 10) / 10,
      horasTotais,
      chartData: [
        { name: "Vagas", value: totalVagas, fill: CHART_COLORS[0] },
        { name: "Participaram", value: totalParticipantes, fill: CHART_COLORS[3] },
      ],
    };
  }, [treinamentos, treinamentosParticipacoes]);

  const eventosResumo = useMemo(() => {
    const totalEventos = eventos.length;
    const totalConfirmados = eventosParticipacoes.filter((p) => p.confirmou_presenca).length;
    const totalPresentes = eventosParticipacoes.filter((p) => p.compareceu).length;
    const taxaComparecimento =
      totalConfirmados > 0 ? (totalPresentes / totalConfirmados) * 100 : 0;

    return {
      totalEventos,
      totalConfirmados,
      totalPresentes,
      taxaComparecimento: Math.round(taxaComparecimento * 10) / 10,
      chartData: [
        { name: "Confirmados", value: totalConfirmados, fill: CHART_COLORS[0] },
        { name: "Presentes", value: totalPresentes, fill: CHART_COLORS[4] },
      ],
    };
  }, [eventos, eventosParticipacoes]);

  const absenteismoResumo = useMemo(() => {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 30);

    const recentes = afastamentos.filter((a) => {
      if (!a.data_inicio) return false;
      const data = new Date(`${a.data_inicio}T00:00:00`);
      return data >= inicio;
    });

    const totalDias = recentes.reduce((sum, a) => sum + (a.dias_afastados || 0), 0);
    const totalColaboradores = colaboradores.length;
    const diasTrabalhoPossivel = totalColaboradores * 22;
    const taxaAbsenteismo =
      diasTrabalhoPossivel > 0 ? (totalDias / diasTrabalhoPossivel) * 100 : 0;

    const porTipoMap = new Map<string, number>();
    recentes.forEach((a) => {
      const key = a.tipo || "Outro";
      porTipoMap.set(key, (porTipoMap.get(key) || 0) + (a.dias_afastados || 0));
    });

    const chartData = Array.from(porTipoMap.entries())
      .map(([tipo, dias], index) => ({
        name: tipo,
        dias,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.dias - a.dias)
      .slice(0, 5);

    return {
      totalDias,
      taxaAbsenteismo: Math.round(taxaAbsenteismo * 10) / 10,
      chartData,
    };
  }, [afastamentos, colaboradores]);

  const turnoverResumo = useMemo(() => {
    const totalDesligamentos = turnoverStats?.totalDesligamentos || 0;
    const taxa = turnoverStats?.turnoverPercentual || 0;
    const porMotivo = turnoverStats?.porMotivo || { pedido: 0, empresa: 0, contrato: 0 };

    const chartData = [
      { name: "Pedido", value: porMotivo.pedido || 0, fill: CHART_COLORS[0] },
      { name: "Empresa", value: porMotivo.empresa || 0, fill: CHART_COLORS[1] },
      { name: "Contrato", value: porMotivo.contrato || 0, fill: CHART_COLORS[2] },
    ].filter((item) => item.value > 0);

    return {
      totalDesligamentos,
      taxa,
      chartData,
    };
  }, [turnoverStats]);

  const isTreinamentosLoading = treinamentosLoading || treinamentosParticipacoesLoading;
  const isEventosLoading = eventosLoading || eventosParticipacoesLoading;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Colaboradores"
          value={colaboradoresResumo.total}
          subtitle="Ativos"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Treinamentos"
          value={`${treinamentosResumo.taxaConclusao}%`}
          subtitle={`Total: ${treinamentosResumo.totalTreinamentos}`}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          title="Eventos"
          value={`${eventosResumo.taxaComparecimento}%`}
          subtitle={`Presentes: ${eventosResumo.totalPresentes}`}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          title="Turnover"
          value={`${turnoverResumo.taxa}%`}
          subtitle={`Desligamentos: ${turnoverResumo.totalDesligamentos}`}
          icon={<UserMinus className="h-5 w-5" />}
        />
        <StatCard
          title="Absenteismo"
          value={`${absenteismoResumo.taxaAbsenteismo}%`}
          subtitle={`Dias: ${absenteismoResumo.totalDias}`}
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Colaboradores" subtitle="Distribuicao por tipo">
          {colaboradoresLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : colaboradoresResumo.chartData.length > 0 ? (
            <>
              <ChartContainer
                config={{ value: { label: "Quantidade" } }}
                className="h-[180px] sm:h-[200px] w-full"
              >
                <PieChart>
                  <Pie
                    data={colaboradoresResumo.chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    dataKey="value"
                  >
                    {colaboradoresResumo.chartData.map((item, index) => (
                      <Cell key={`${item.name}-${index}`} fill={item.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                {colaboradoresResumo.chartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span>
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Sem dados
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Turnover"
          subtitle={`Taxa: ${turnoverResumo.taxa}% | Desligamentos: ${turnoverResumo.totalDesligamentos}`}
        >
          {turnoverLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : turnoverResumo.chartData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: "Quantidade" } }}
              className="h-[180px] sm:h-[200px] w-full"
            >
              <BarChart data={turnoverResumo.chartData} margin={{ left: 12, right: 8 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={90} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Sem dados
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Treinamentos"
          subtitle={`Total: ${treinamentosResumo.totalTreinamentos} | Taxa: ${treinamentosResumo.taxaConclusao}%`}
        >
          {isTreinamentosLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4 items-center">
              <ChartContainer
                config={{ value: { label: "Quantidade" } }}
                className="h-[180px] sm:h-[200px] w-full"
              >
                <BarChart data={treinamentosResumo.chartData} margin={{ left: 12, right: 8 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={90} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 text-sm">
                <div className="rounded-lg border border-border/60 p-3 bg-background/70">
                  <p className="text-xs text-muted-foreground">Total realizados</p>
                  <p className="text-lg font-semibold">{treinamentosResumo.totalTreinamentos}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3 bg-background/70">
                  <p className="text-xs text-muted-foreground">Taxa de conclusao</p>
                  <p className="text-lg font-semibold">{treinamentosResumo.taxaConclusao}%</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3 bg-background/70">
                  <p className="text-xs text-muted-foreground">Horas de capacitacao</p>
                  <p className="text-lg font-semibold">{treinamentosResumo.horasTotais}h</p>
                </div>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Absenteismo"
          subtitle={`Taxa: ${absenteismoResumo.taxaAbsenteismo}% | Dias: ${absenteismoResumo.totalDias}`}
        >
          {afastamentosLoading || colaboradoresLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : absenteismoResumo.chartData.length > 0 ? (
            <ChartContainer
              config={{ dias: { label: "Dias" } }}
              className="h-[180px] sm:h-[200px] w-full"
            >
              <BarChart data={absenteismoResumo.chartData} margin={{ left: 12, right: 8 }}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="dias" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Sem dados
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ChartCard
          title="Eventos"
          subtitle={`Taxa: ${eventosResumo.taxaComparecimento}% | Presentes: ${eventosResumo.totalPresentes}`}
        >
          {isEventosLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4 items-center">
              <ChartContainer
                config={{ value: { label: "Quantidade" } }}
                className="h-[180px] sm:h-[200px] w-full"
              >
                <BarChart data={eventosResumo.chartData} margin={{ left: 12, right: 8 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={90} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 text-sm">
                <div className="rounded-lg border border-border/60 p-3 bg-background/70">
                  <p className="text-xs text-muted-foreground">Total eventos</p>
                  <p className="text-lg font-semibold">{eventosResumo.totalEventos}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3 bg-background/70">
                  <p className="text-xs text-muted-foreground">Confirmados</p>
                  <p className="text-lg font-semibold">{eventosResumo.totalConfirmados}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3 bg-background/70">
                  <p className="text-xs text-muted-foreground">Presentes</p>
                  <p className="text-lg font-semibold">{eventosResumo.totalPresentes}</p>
                </div>
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
