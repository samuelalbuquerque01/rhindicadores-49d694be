import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  CalendarRange,
  ListChecks,
  Siren,
  UserMinus,
  Users,
  UserX,
  Hospital,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/Modal";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ChartNarrative } from "@/components/dashboard/ChartNarrative";
import { HeatmapChart } from "@/components/dashboard/HeatmapChart";
import { PredictionCard } from "@/components/dashboard/PredictionCard";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { SectorComparisonTable } from "@/components/dashboard/SectorComparisonTable";
import { GoalsCard } from "@/components/dashboard/GoalsCard";
import { StatusTrafficLight } from "@/components/dashboard/StatusTrafficLight";
import { PeriodPreset } from "@/lib/analytics/period";
import { fetchGoalsFromBackend, persistGoals, persistGoalsToBackend, readGoals } from "@/lib/storage/goalsStorage";
import { useOverviewAnalytics } from "@/features/overview/useOverviewAnalytics";
import { useSmartNotifications } from "@/hooks/useSmartNotifications";
import { useNavigate } from "react-router-dom";

interface OverviewDashboardProps {
  filialId?: string;
}

const PRESET_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: "30d", label: "30 dias" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "12 meses" },
];

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function priorDateString(days: number): string {
  const base = new Date();
  base.setDate(base.getDate() - days);
  return base.toISOString().split("T")[0];
}

function iconForMetric(id: string) {
  if (id === "employees") return <Users className="h-5 w-5" />;
  if (id === "absenteeism-rate") return <Activity className="h-5 w-5" />;
  if (id === "turnover-rate") return <UserMinus className="h-5 w-5" />;
  if (id === "dismissals") return <UserX className="h-5 w-5" />;
  return <Hospital className="h-5 w-5" />;
}

interface PerformanceState {
  variation: number;
  trend: "up" | "down" | "stable";
  improved: boolean;
  label: string;
}

function buildLowerBetterPerformance(current: number, previous: number): PerformanceState {
  const variation = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Number(variation.toFixed(1));
  const trend = rounded > 0 ? "up" : rounded < 0 ? "down" : "stable";
  const improved = rounded <= 0;
  const label = rounded === 0 ? "estavel" : improved ? "melhorou" : "piorou";

  return {
    variation: rounded,
    trend,
    improved,
    label,
  };
}

function formatTargetTabLabel(targetTab: string): string {
  const map: Record<string, string> = {
    geral: "Visao Geral",
    absenteismo: "Absenteismo",
    turnover: "Turnover",
    timeline: "Timeline",
    treinamentos: "Treinamentos",
    eventos: "Eventos",
  };
  return map[targetTab] || targetTab;
}

export function OverviewDashboard({ filialId }: OverviewDashboardProps) {
  const navigate = useNavigate();
  const [preset, setPreset] = useState<PeriodPreset>("6m");
  const [customStart, setCustomStart] = useState<string>(priorDateString(90));
  const [customEnd, setCustomEnd] = useState<string>(todayString());
  const [goals, setGoals] = useState(() => readGoals());
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [goalAbsDraft, setGoalAbsDraft] = useState(goals.absenteeismTarget.toString());
  const [goalTurnDraft, setGoalTurnDraft] = useState(goals.turnoverTarget.toString());
  const [alertsFilter, setAlertsFilter] = useState<"all" | "unread" | "high">("high");
  const { notifications, markAsRead } = useSmartNotifications();

  const customRange = useMemo(() => {
    if (preset !== "custom") {
      return null;
    }

    return {
      start: new Date(`${customStart}T00:00:00`),
      end: new Date(`${customEnd}T00:00:00`),
    };
  }, [customEnd, customStart, preset]);

  const { data, isLoading, error } = useOverviewAnalytics({
    filialId,
    preset,
    customRange,
  });

  useEffect(() => {
    if (goalsModalOpen) {
      setGoalAbsDraft(goals.absenteeismTarget.toString());
      setGoalTurnDraft(goals.turnoverTarget.toString());
    }
  }, [goals, goalsModalOpen]);

  useEffect(() => {
    let active = true;

    const loadGoals = async () => {
      const remoteGoals = await fetchGoalsFromBackend();
      if (!active || !remoteGoals) return;
      setGoals(remoteGoals);
    };

    void loadGoals();

    return () => {
      active = false;
    };
  }, []);

  const alertsOfTheDay = useMemo(() => {
    if (alertsFilter === "unread") {
      return notifications.filter((item) => !item.read).slice(0, 5);
    }
    if (alertsFilter === "high") {
      return notifications.filter((item) => item.priority === "high" && !item.read).slice(0, 5);
    }
    return notifications.slice(0, 5);
  }, [alertsFilter, notifications]);

  const absPerformance = useMemo(() => {
    if (!data?.highlights) {
      return buildLowerBetterPerformance(0, 0);
    }

    return buildLowerBetterPerformance(
      data.highlights.absenteeismRateCurrent,
      data.highlights.absenteeismRatePrevious,
    );
  }, [data?.highlights]);

  const turnoverPerformance = useMemo(() => {
    if (!data?.highlights) {
      return buildLowerBetterPerformance(0, 0);
    }

    return buildLowerBetterPerformance(data.highlights.turnoverRateCurrent, data.highlights.turnoverRatePrevious);
  }, [data?.highlights]);

  const saveGoals = () => {
    const abs = Number(goalAbsDraft.replace(",", "."));
    const turn = Number(goalTurnDraft.replace(",", "."));
    if (Number.isNaN(abs) || Number.isNaN(turn) || abs < 0 || turn < 0) {
      return;
    }

    const nextGoals = {
      absenteeismTarget: Number(abs.toFixed(2)),
      turnoverTarget: Number(turn.toFixed(2)),
      updatedAt: new Date().toISOString(),
    };
    setGoals(nextGoals);
    persistGoals(nextGoals);
    void persistGoalsToBackend(nextGoals);
    setGoalsModalOpen(false);
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Falha ao carregar os dados analiticos. Verifique a conexao com o Supabase e tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Painel BI - Visao Geral</h2>
            <p className="text-sm text-muted-foreground">
              O filtro de periodo afeta metricas, graficos, insights, anomalias e previsoes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Periodo</label>
              <Select value={preset} onValueChange={(value) => setPreset(value as PeriodPreset)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Escolha o periodo" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {preset === "custom" ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Inicio</label>
                  <Input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Fim</label>
                  <Input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
                </div>
              </>
            ) : null}
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
              <span>
                {data
                  ? `${data.range.start.toLocaleDateString("pt-BR")} - ${data.range.end.toLocaleDateString("pt-BR")}`
                  : "Carregando periodo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={`metric-skeleton-${index}`} className="h-[152px] w-full rounded-xl" />
            ))
          : (data?.metrics ?? []).map((metric) => {
              const isPositive = metric.direction === "higher-better"
                ? metric.comparison.variationPercent >= 0
                : metric.comparison.variationPercent <= 0;

              return (
                <MetricCard
                  key={metric.id}
                  title={metric.label}
                  value={metric.value}
                  icon={iconForMetric(metric.id)}
                  variationPercent={metric.comparison.variationPercent}
                  trend={metric.comparison.trend}
                  isPositive={isPositive}
                  tooltip={metric.tooltip}
                />
              );
            })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GoalsCard goals={goals} onEdit={() => setGoalsModalOpen(true)} />

        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status RH</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <StatusTrafficLight
                label="Absenteismo"
                value={data?.highlights.absenteeismRateCurrent ?? 0}
                target={goals.absenteeismTarget}
              />
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                {absPerformance.trend === "up" ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-red-600" />
                ) : absPerformance.trend === "down" ? (
                  <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
                ) : null}
                Absenteismo {absPerformance.label} ({Math.abs(absPerformance.variation).toFixed(1)}%).
              </p>
            </div>
            <div className="space-y-2">
              <StatusTrafficLight
                label="Turnover"
                value={data?.highlights.turnoverRateCurrent ?? 0}
                target={goals.turnoverTarget}
              />
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                {turnoverPerformance.trend === "up" ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-red-600" />
                ) : turnoverPerformance.trend === "down" ? (
                  <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
                ) : null}
                Turnover {turnoverPerformance.label} ({Math.abs(turnoverPerformance.variation).toFixed(1)}%).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">O que mudou desde o periodo anterior</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={`change-${index}`} className="h-4 w-full" />
                ))}
              </div>
            ) : (data?.highlights.changes.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda nao ha dados suficientes para comparar periodos.
              </p>
            ) : (
              <ul className="space-y-2">
                {(data?.highlights.changes ?? []).slice(0, 5).map((line, index) => (
                  <li key={`change-line-${index}`} className="text-sm text-foreground inline-flex items-start gap-2">
                    <ListChecks className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Setores em atencao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.highlights.sectorsAttention.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Sem setores com piora relevante no periodo.</p>
            ) : (
              (data?.highlights.sectorsAttention ?? []).map((sector) => (
                <div key={sector.sector} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{sector.sector}</p>
                    <Badge className={sector.status === "critical" ? "bg-red-600" : "bg-amber-600"}>
                      {sector.status === "critical" ? "Critico" : "Atencao"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Absenteismo: {sector.absenteeismVariation.toFixed(1)}% | Turnover: {sector.turnoverVariation.toFixed(1)}%
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top 3 motivos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Afastamento</p>
              {(data?.highlights.topAbsenceReasons.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados</p>
              ) : (
                (data?.highlights.topAbsenceReasons ?? []).map((item) => (
                  <div key={item.reason} className="text-sm flex items-center justify-between gap-2">
                    <span>{item.reason}</span>
                    <Badge variant="outline">{item.contributionPercent.toFixed(1)}%</Badge>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Saidas</p>
              {(data?.highlights.topTurnoverReasons.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados</p>
              ) : (
                (data?.highlights.topTurnoverReasons ?? []).map((item) => (
                  <div key={item.reason} className="text-sm flex items-center justify-between gap-2">
                    <span>{item.reason}</span>
                    <Badge variant="outline">{item.contributionPercent.toFixed(1)}%</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base inline-flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                Alertas do dia
              </CardTitle>
              <Select value={alertsFilter} onValueChange={(value) => setAlertsFilter(value as "all" | "unread" | "high")}>
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unread">Nao lidas</SelectItem>
                  <SelectItem value="high">Alta prioridade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertsOfTheDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta para o filtro selecionado.</p>
            ) : (
              alertsOfTheDay.map((alert) => (
                <article key={alert.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <Badge
                      variant="outline"
                      className={alert.priority === "high" ? "border-red-300 text-red-700" : ""}
                    >
                      {alert.priority === "high" ? "Alta" : alert.priority === "medium" ? "Media" : "Baixa"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigate(`/?tab=${alert.targetTab}`);
                        markAsRead(alert.id);
                      }}
                    >
                      Ir para {formatTargetTabLabel(alert.targetTab)}
                    </Button>
                    {!alert.read ? (
                      <Button size="sm" variant="ghost" onClick={() => markAsRead(alert.id)}>
                        Marcar lida
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Absenteismo por mes" subtitle="Dias perdidos por mes" loading={isLoading} isEmpty={(data?.absenteeismMonthly.length ?? 0) === 0}>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.absenteeismMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number | string) => `${Number(value).toFixed(1)} dias`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0f766e"
                  strokeWidth={2.2}
                  name="Absenteismo"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {(data?.absenteeismMonthly ?? [])
              .filter((point) => point.anomaly)
              .map((point) => (
                <span key={point.key} className="text-xs rounded-full bg-red-100 text-red-700 px-2 py-1">
                  Anomalia: {point.label}
                </span>
              ))}
          </div>
          <ChartNarrative lines={data?.chartNarratives.absenteeism ?? []} />
        </ChartCard>

        <ChartCard title="Turnover por mes" subtitle="Desligamentos por mes" loading={isLoading} isEmpty={(data?.turnoverMonthly.length ?? 0) === 0}>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.turnoverMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number | string) => `${Number(value).toFixed(0)} desligamentos`} />
                <Legend />
                <Bar dataKey="value" name="Turnover">
                  {(data?.turnoverMonthly ?? []).map((point) => (
                    <Cell key={point.key} fill={point.anomaly ? "#dc2626" : "#2563eb"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {(data?.turnoverMonthly ?? [])
              .filter((point) => point.anomaly)
              .map((point) => (
                <span key={point.key} className="text-xs rounded-full bg-red-100 text-red-700 px-2 py-1">
                  Anomalia: {point.label}
                </span>
              ))}
          </div>
          <ChartNarrative lines={data?.chartNarratives.turnover ?? []} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Desligamentos por setor" subtitle="Periodo atual" loading={isLoading} isEmpty={(data?.dismissalsBySector.length ?? 0) === 0}>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dismissalsBySector} layout="vertical" margin={{ left: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="sector" type="category" width={130} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number | string) => `${Number(value).toFixed(0)} desligamentos`} />
                <Bar dataKey="value" fill="#0f766e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartNarrative lines={data?.chartNarratives.dismissalsBySector ?? []} />
        </ChartCard>

        <ChartCard title="Afastamentos por setor" subtitle="Dias perdidos por setor" loading={isLoading} isEmpty={(data?.absencesBySector.length ?? 0) === 0}>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.absencesBySector} layout="vertical" margin={{ left: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="sector" type="category" width={130} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number | string) => `${Number(value).toFixed(1)} dias`} />
                <Bar dataKey="value" fill="#d97706" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartNarrative lines={data?.chartNarratives.absencesBySector ?? []} />
        </ChartCard>
      </div>

      <ChartCard
        title="Heatmap de Absenteismo (Setor x Mes)"
        subtitle="A intensidade da celula representa os dias perdidos"
        loading={isLoading}
        isEmpty={(data?.heatmap.cells.length ?? 0) === 0}
      >
        <HeatmapChart data={data?.heatmap ?? { months: [], sectors: [], cells: [], maxValue: 0 }} />
      </ChartCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PredictionCard
          title="Previsao de Turnover"
          trend={data?.predictions.turnover.trend ?? "stable"}
          projectedTotal={data?.predictions.turnover.projectedTotal ?? 0}
          confidence={data?.predictions.turnover.confidence ?? 0}
          riskSector={data?.predictions.turnover.riskSector ?? "Sem dados"}
          points={data?.predictions.turnover.points ?? []}
        />
        <PredictionCard
          title="Previsao de Absenteismo"
          trend={data?.predictions.absenteeism.trend ?? "stable"}
          projectedTotal={data?.predictions.absenteeism.projectedTotal ?? 0}
          confidence={data?.predictions.absenteeism.confidence ?? 0}
          riskSector={data?.predictions.absenteeism.riskSector ?? "Sem dados"}
          points={data?.predictions.absenteeism.points ?? []}
        />
      </div>

      <InsightsPanel insights={data?.insights ?? []} />

      <SectorComparisonTable rows={data?.sectorRows ?? []} />

      <Modal open={goalsModalOpen} onOpenChange={setGoalsModalOpen} title="Editar metas do mes">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Meta de Absenteismo (%)</p>
            <Input
              type="number"
              min={0}
              step="0.1"
              value={goalAbsDraft}
              onChange={(event) => setGoalAbsDraft(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Meta de Turnover (%)</p>
            <Input
              type="number"
              min={0}
              step="0.1"
              value={goalTurnDraft}
              onChange={(event) => setGoalTurnDraft(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Metas sincronizadas no Supabase em escopo global. TODO: evoluir para metas por filial e por usuario.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setGoalsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveGoals}>
              Salvar metas
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

