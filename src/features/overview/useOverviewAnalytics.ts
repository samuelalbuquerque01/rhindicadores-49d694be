import { useMemo } from "react";
import { isWithinInterval, parseISO, differenceInCalendarDays, format } from "date-fns";
import { useAfastamentos } from "@/hooks/useAfastamentos";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useDesligamentos } from "@/hooks/useDesligamentos";
import {
  DateRange,
  PeriodPreset,
  buildMonthBuckets,
  buildPreviousRange,
  normalizeCustomRange,
  rangeMonthsApprox,
  resolvePresetRange,
} from "@/lib/analytics/period";
import { buildHeatmapData } from "@/lib/analytics/heatmap";
import { buildSectorComparison, SectorComparisonRow } from "@/lib/analytics/sector";
import { detectCombinedAnomalies, TimeSeriesPoint } from "@/lib/analytics/anomaly";
import { buildProjectionSeries, forecastSeries } from "@/lib/analytics/forecast";
import { generateInsights } from "@/lib/analytics/insights";
import { generateChartNarrative } from "@/lib/analytics/narrative";
import { generateSmartNotifications } from "@/lib/analytics/notifications";
import type { Afastamento, Colaborador, Desligamento } from "@/types/database";

interface UseOverviewAnalyticsParams {
  filialId?: string;
  preset: PeriodPreset;
  customRange?: { start: Date; end: Date } | null;
}

interface MetricComparison {
  current: number;
  previous: number;
  variationPercent: number;
  trend: "up" | "down" | "stable";
}

interface OverviewMetric {
  id: string;
  label: string;
  value: string;
  comparison: MetricComparison;
  direction: "higher-better" | "lower-better";
  tooltip: string;
}

interface OverviewData {
  range: DateRange;
  previousRange: DateRange;
  metrics: OverviewMetric[];
  absenteeismMonthly: Array<{ key: string; label: string; value: number; anomaly: boolean }>;
  turnoverMonthly: Array<{ key: string; label: string; value: number; anomaly: boolean }>;
  dismissalsBySector: Array<{ sector: string; value: number }>;
  absencesBySector: Array<{ sector: string; value: number }>;
  heatmap: ReturnType<typeof buildHeatmapData>;
  sectorRows: SectorComparisonRow[];
  insights: ReturnType<typeof generateInsights>;
  chartNarratives: {
    absenteeism: string[];
    turnover: string[];
    dismissalsBySector: string[];
    absencesBySector: string[];
  };
  predictions: {
    turnover: {
      trend: "up" | "down" | "stable";
      projectedTotal: number;
      confidence: number;
      riskSector: string;
      points: ReturnType<typeof buildProjectionSeries>;
    };
    absenteeism: {
      trend: "up" | "down" | "stable";
      projectedTotal: number;
      confidence: number;
      riskSector: string;
      points: ReturnType<typeof buildProjectionSeries>;
    };
  };
  notifications: ReturnType<typeof generateSmartNotifications>;
  highlights: {
    changes: string[];
    sectorsAttention: Array<{
      sector: string;
      absenteeismVariation: number;
      turnoverVariation: number;
      status: "attention" | "critical";
    }>;
    topAbsenceReasons: Array<{ reason: string; value: number; contributionPercent: number }>;
    topTurnoverReasons: Array<{ reason: string; value: number; contributionPercent: number }>;
    absenteeismRateCurrent: number;
    absenteeismRatePrevious: number;
    turnoverRateCurrent: number;
    turnoverRatePrevious: number;
  };
}

function toDate(value?: string): Date | null {
  if (!value) return null;

  try {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function inRange(date: Date | null, range: DateRange): boolean {
  if (!date) return false;
  return isWithinInterval(date, { start: range.start, end: range.end });
}

function variationPercent(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function toComparison(current: number, previous: number): MetricComparison {
  const variation = variationPercent(current, previous);
  const trend = Math.abs(variation) < 0.01 ? "stable" : variation > 0 ? "up" : "down";

  return {
    current,
    previous,
    variationPercent: Number(variation.toFixed(1)),
    trend,
  };
}

function mapByMonth(range: DateRange): Array<{ key: string; label: string; start: Date; end: Date }> {
  return buildMonthBuckets(range).map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    start: bucket.start,
    end: bucket.end,
  }));
}

function employeeNameMap(colaboradores: Colaborador[]): Map<string, string> {
  return new Map(colaboradores.map((colaborador) => [colaborador.id, colaborador.nome]));
}

export function useOverviewAnalytics({ filialId, preset, customRange }: UseOverviewAnalyticsParams) {
  const { data: colaboradores = [], isLoading: loadingColaboradores, error: colaboradoresError } =
    useColaboradores({ filialId });
  const { data: afastamentos = [], isLoading: loadingAfastamentos, error: afastamentosError } =
    useAfastamentos(filialId);
  const { data: desligamentos = [], isLoading: loadingDesligamentos, error: desligamentosError } =
    useDesligamentos(filialId);

  const isLoading = loadingColaboradores || loadingAfastamentos || loadingDesligamentos;
  const error = colaboradoresError ?? afastamentosError ?? desligamentosError;

  const analytics = useMemo<OverviewData>(() => {
    const now = new Date();
    const range =
      preset === "custom" && customRange
        ? normalizeCustomRange(customRange.start, customRange.end)
        : resolvePresetRange(preset === "custom" ? "30d" : preset, now);
    const previousRange = buildPreviousRange(range);

    const monthBuckets = mapByMonth(range);
    const monthLabelMap = Object.fromEntries(monthBuckets.map((bucket) => [bucket.key, bucket.label]));

    const activeEmployees = colaboradores.filter((colaborador) => colaborador.status === "Ativo");

    const absCurrent = afastamentos.filter((afastamento) => inRange(toDate(afastamento.data_inicio), range));
    const absPrevious = afastamentos.filter((afastamento) => inRange(toDate(afastamento.data_inicio), previousRange));

    const dismissalsCurrent = desligamentos.filter((desligamento) =>
      inRange(toDate(desligamento.data_desligamento), range),
    );
    const dismissalsPrevious = desligamentos.filter((desligamento) =>
      inRange(toDate(desligamento.data_desligamento), previousRange),
    );

    const totalAbsenceDaysCurrent = absCurrent.reduce(
      (sum, afastamento) => sum + (afastamento.dias_afastados || 0),
      0,
    );
    const totalAbsenceDaysPrevious = absPrevious.reduce(
      (sum, afastamento) => sum + (afastamento.dias_afastados || 0),
      0,
    );

    const periodMonths = rangeMonthsApprox(range);
    const absenteeismCapacity = Math.max(1, activeEmployees.length * 22 * periodMonths);
    const previousCapacity = Math.max(1, activeEmployees.length * 22 * Math.max(1, rangeMonthsApprox(previousRange)));

    const absenteeismRateCurrent = (totalAbsenceDaysCurrent / absenteeismCapacity) * 100;
    const absenteeismRatePrevious = (totalAbsenceDaysPrevious / previousCapacity) * 100;

    const dismissalCountCurrent = dismissalsCurrent.length;
    const dismissalCountPrevious = dismissalsPrevious.length;

    const baseEmployees = Math.max(1, activeEmployees.length + dismissalCountCurrent);
    const previousBaseEmployees = Math.max(1, activeEmployees.length + dismissalCountPrevious);

    const turnoverRateCurrent = (dismissalCountCurrent / baseEmployees) * 100;
    const turnoverRatePrevious = (dismissalCountPrevious / previousBaseEmployees) * 100;

    const metrics: OverviewMetric[] = [
      {
        id: "employees",
        label: "Total de colaboradores",
        value: activeEmployees.length.toLocaleString("pt-BR"),
        comparison: toComparison(activeEmployees.length, Math.max(1, activeEmployees.length - dismissalCountPrevious)),
        direction: "higher-better",
        tooltip: "Total de colaboradores ativos na filial selecionada.",
      },
      {
        id: "absenteeism-rate",
        label: "Taxa de absenteismo",
        value: `${absenteeismRateCurrent.toFixed(2)}%`,
        comparison: toComparison(absenteeismRateCurrent, absenteeismRatePrevious),
        direction: "lower-better",
        tooltip: "Dias de afastamento divididos pelos dias uteis disponiveis (22 dias/mes por colaborador ativo).",
      },
      {
        id: "turnover-rate",
        label: "Taxa de turnover",
        value: `${turnoverRateCurrent.toFixed(2)}%`,
        comparison: toComparison(turnoverRateCurrent, turnoverRatePrevious),
        direction: "lower-better",
        tooltip: "Desligamentos sobre base ativa aproximada no periodo selecionado.",
      },
      {
        id: "dismissals",
        label: "Total de desligamentos",
        value: dismissalCountCurrent.toLocaleString("pt-BR"),
        comparison: toComparison(dismissalCountCurrent, dismissalCountPrevious),
        direction: "lower-better",
        tooltip: "Numero de desligamentos registrados no periodo selecionado.",
      },
      {
        id: "absences",
        label: "Total de afastamentos",
        value: absCurrent.length.toLocaleString("pt-BR"),
        comparison: toComparison(absCurrent.length, absPrevious.length),
        direction: "lower-better",
        tooltip: "Quantidade de registros de afastamento no periodo selecionado.",
      },
    ];

    const absenteeismMonthly = monthBuckets.map((month) => {
      const monthValue = absCurrent
        .filter((afastamento) => inRange(toDate(afastamento.data_inicio), { start: month.start, end: month.end }))
        .reduce((sum, afastamento) => sum + (afastamento.dias_afastados || 0), 0);

      return {
        key: month.key,
        label: month.label,
        value: Number(monthValue.toFixed(2)),
      };
    });

    const turnoverMonthly = monthBuckets.map((month) => {
      const monthValue = dismissalsCurrent.filter((desligamento) =>
        inRange(toDate(desligamento.data_desligamento), { start: month.start, end: month.end }),
      ).length;

      return {
        key: month.key,
        label: month.label,
        value: monthValue,
      };
    });

    const absenteeismAnomalies = detectCombinedAnomalies(
      absenteeismMonthly.map((point) => ({
        key: point.key,
        label: point.label,
        value: point.value,
      })),
    );

    const turnoverAnomalies = detectCombinedAnomalies(
      turnoverMonthly.map((point) => ({
        key: point.key,
        label: point.label,
        value: point.value,
      })),
    );

    const combinedAnomalies: TimeSeriesPoint[] = [...absenteeismAnomalies, ...turnoverAnomalies];

    const absenteeismMonthlyWithAnomaly = absenteeismMonthly.map((point) => ({
      ...point,
      anomaly: absenteeismAnomalies.some((anomaly) => anomaly.key === point.key),
    }));

    const turnoverMonthlyWithAnomaly = turnoverMonthly.map((point) => ({
      ...point,
      anomaly: turnoverAnomalies.some((anomaly) => anomaly.key === point.key),
    }));

    const absBySectorMap = new Map<string, number>();
    absCurrent.forEach((afastamento) => {
      const sector = afastamento.colaborador?.departamento || "Sem setor";
      absBySectorMap.set(sector, (absBySectorMap.get(sector) ?? 0) + (afastamento.dias_afastados || 0));
    });

    const dismissalsBySectorMap = new Map<string, number>();
    dismissalsCurrent.forEach((desligamento) => {
      const sector = desligamento.colaborador?.departamento || "Sem setor";
      dismissalsBySectorMap.set(sector, (dismissalsBySectorMap.get(sector) ?? 0) + 1);
    });

    const absencesBySector = Array.from(absBySectorMap.entries())
      .map(([sector, value]) => ({ sector, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const dismissalsBySector = Array.from(dismissalsBySectorMap.entries())
      .map(([sector, value]) => ({ sector, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const sectors = Array.from(
      new Set(activeEmployees.map((employee) => employee.departamento || "Sem setor")),
    ).sort((a, b) => a.localeCompare(b));

    const heatmap = buildHeatmapData(
      absCurrent.map((afastamento) => ({
        sector: afastamento.colaborador?.departamento || "Sem setor",
        date: toDate(afastamento.data_inicio) ?? new Date(),
        days: afastamento.dias_afastados || 0,
      })),
      monthBuckets.map((month) => month.key),
      monthLabelMap,
      sectors,
    );

    const sectorRows = buildSectorComparison(
      colaboradores,
      afastamentos as Afastamento[],
      desligamentos as Desligamento[],
      range,
    );

    const topAbsenceReasonMap = new Map<string, number>();
    absCurrent.forEach((afastamento) => {
      const reason = afastamento.tipo || "Outro";
      topAbsenceReasonMap.set(reason, (topAbsenceReasonMap.get(reason) ?? 0) + (afastamento.dias_afastados || 0));
    });

    const topAbsenceReasons = Array.from(topAbsenceReasonMap.entries())
      .map(([reason, value]) => ({
        reason,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((item) => ({
        ...item,
        contributionPercent:
          totalAbsenceDaysCurrent > 0 ? Number(((item.value / totalAbsenceDaysCurrent) * 100).toFixed(1)) : 0,
      }));

    const turnoverReasonMap = new Map<string, number>();
    dismissalsCurrent.forEach((dismissal) => {
      const reason = dismissal.motivo || "Outro";
      turnoverReasonMap.set(reason, (turnoverReasonMap.get(reason) ?? 0) + 1);
    });

    const topTurnoverReasons = Array.from(turnoverReasonMap.entries())
      .map(([reason, value]) => ({
        reason,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((item) => ({
        ...item,
        contributionPercent:
          dismissalCountCurrent > 0 ? Number(((item.value / dismissalCountCurrent) * 100).toFixed(1)) : 0,
      }));

    const topAbsenceReason = Array.from(topAbsenceReasonMap.entries())
      .map(([reason, days]) => ({ reason, days }))
      .sort((a, b) => b.days - a.days)[0];

    const topTurnoverSector = sectorRows
      .slice()
      .sort((a, b) => b.turnoverRate - a.turnoverRate)[0];
    const topAbsenteeismSector = sectorRows
      .slice()
      .sort((a, b) => b.absenteeismDays - a.absenteeismDays)[0];

    const criticalAbsMonth = absenteeismMonthly
      .slice()
      .sort((a, b) => b.value - a.value)[0];

    const insights = generateInsights({
      absenteeismRate: absenteeismRateCurrent,
      absenteeismRatePrevious,
      turnoverRate: turnoverRateCurrent,
      turnoverRatePrevious,
      topTurnoverSector: topTurnoverSector
        ? { sector: topTurnoverSector.sector, rate: topTurnoverSector.turnoverRate }
        : undefined,
      topAbsenteeismSector: topAbsenteeismSector
        ? { sector: topAbsenteeismSector.sector, days: topAbsenteeismSector.absenteeismDays }
        : undefined,
      topAbsenceReason,
      criticalMonth: criticalAbsMonth
        ? { label: criticalAbsMonth.label, value: criticalAbsMonth.value, metric: "absenteeism" }
        : undefined,
      anomalies: [...absenteeismAnomalies, ...turnoverAnomalies],
      dismissals: dismissalCountCurrent,
      absences: absCurrent.length,
    });

    const absenteeismForecast = forecastSeries(absenteeismMonthly.map((point) => point.value), 3, {
      movingAverageWindow: 3,
    });

    const turnoverForecast = forecastSeries(turnoverMonthly.map((point) => point.value), 3, {
      movingAverageWindow: 3,
    });

    const turnoverProjectionPoints = buildProjectionSeries(
      turnoverMonthly.map((point) => ({
        key: point.key,
        date: parseISO(`${point.key}-01`),
        value: point.value,
      })),
      turnoverForecast.predictions,
    );

    const absenteeismProjectionPoints = buildProjectionSeries(
      absenteeismMonthly.map((point) => ({
        key: point.key,
        date: parseISO(`${point.key}-01`),
        value: point.value,
      })),
      absenteeismForecast.predictions,
    );

    const sectorCurrentAbs = new Map<string, number>();
    absCurrent.forEach((item) => {
      const sector = item.colaborador?.departamento || "Sem setor";
      sectorCurrentAbs.set(sector, (sectorCurrentAbs.get(sector) ?? 0) + (item.dias_afastados || 0));
    });

    const sectorPreviousAbs = new Map<string, number>();
    absPrevious.forEach((item) => {
      const sector = item.colaborador?.departamento || "Sem setor";
      sectorPreviousAbs.set(sector, (sectorPreviousAbs.get(sector) ?? 0) + (item.dias_afastados || 0));
    });

    const allSectors = new Set<string>([
      ...Array.from(sectorCurrentAbs.keys()),
      ...Array.from(sectorPreviousAbs.keys()),
    ]);

    const sectorAbsIncrease = Array.from(sectorCurrentAbs.entries())
      .map(([sector, current]) => {
        const previous = sectorPreviousAbs.get(sector) ?? 0;
        return {
          sector,
          variation: variationPercent(current, previous),
        };
      })
      .filter((item) => item.variation > 0)
      .sort((a, b) => b.variation - a.variation)
      .slice(0, 2);

    const sectorCurrentTurn = new Map<string, number>();
    dismissalsCurrent.forEach((item) => {
      const sector = item.colaborador?.departamento || "Sem setor";
      sectorCurrentTurn.set(sector, (sectorCurrentTurn.get(sector) ?? 0) + 1);
    });

    const sectorPreviousTurn = new Map<string, number>();
    dismissalsPrevious.forEach((item) => {
      const sector = item.colaborador?.departamento || "Sem setor";
      sectorPreviousTurn.set(sector, (sectorPreviousTurn.get(sector) ?? 0) + 1);
    });

    sectorCurrentTurn.forEach((_value, sector) => allSectors.add(sector));
    sectorPreviousTurn.forEach((_value, sector) => allSectors.add(sector));

    const sectorTurnIncrease = Array.from(sectorCurrentTurn.entries())
      .map(([sector, current]) => ({
        sector,
        variation: variationPercent(current, sectorPreviousTurn.get(sector) ?? 0),
      }))
      .filter((item) => item.variation > 0)
      .sort((a, b) => b.variation - a.variation)
      .slice(0, 2);

    const sectorsAttention = Array.from(allSectors)
      .map((sector) => {
        const absVariation = variationPercent(sectorCurrentAbs.get(sector) ?? 0, sectorPreviousAbs.get(sector) ?? 0);
        const turnoverVariation = variationPercent(
          sectorCurrentTurn.get(sector) ?? 0,
          sectorPreviousTurn.get(sector) ?? 0,
        );
        const worstVariation = Math.max(absVariation, turnoverVariation);

        return {
          sector,
          absenteeismVariation: Number(absVariation.toFixed(1)),
          turnoverVariation: Number(turnoverVariation.toFixed(1)),
          status: (worstVariation > 20 ? "critical" : "attention") as "critical" | "attention",
          worstVariation,
        };
      })
      .filter((item) => item.worstVariation > 0)
      .sort((a, b) => b.worstVariation - a.worstVariation)
      .slice(0, 3)
      .map(({ worstVariation: _worstVariation, ...item }) => item);

    const contractsEndingSoon = colaboradores
      .filter((colaborador) => colaborador.status === "Ativo")
      .map((colaborador) => ({
        employeeName: colaborador.nome,
        endDate: toDate(colaborador.data_desligamento),
      }))
      .filter((item) => item.endDate)
      .map((item) => ({
        employeeName: item.employeeName,
        daysLeft: differenceInCalendarDays(item.endDate as Date, now),
      }))
      .filter((item) => item.daysLeft >= 0 && item.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);

    const experienceEndingSoon = colaboradores
      .filter((colaborador) => colaborador.status === "Ativo")
      .map((colaborador) => ({
        employeeName: colaborador.nome,
        admissionDate: toDate(colaborador.data_admissao),
      }))
      .filter((item) => item.admissionDate)
      .map((item) => {
        const daysInExperience = differenceInCalendarDays(now, item.admissionDate as Date);
        return {
          employeeName: item.employeeName,
          daysInExperience,
          daysLeft: Math.max(0, 90 - daysInExperience),
        };
      })
      .filter((item) => item.daysInExperience >= 80 && item.daysInExperience <= 90)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 8);

    const vacationsSoon = afastamentos
      .filter((afastamento) => (afastamento.tipo || "").toLowerCase().includes("fer"))
      .map((afastamento) => ({
        employeeName: afastamento.colaborador?.nome || "Colaborador",
        startDate: toDate(afastamento.data_inicio),
      }))
      .filter((item) => item.startDate)
      .map((item) => ({
        employeeName: item.employeeName,
        daysLeft: differenceInCalendarDays(item.startDate as Date, now),
      }))
      .filter((item) => item.daysLeft >= 0 && item.daysLeft <= 30)
      .slice(0, 5);

    const employeeNames = employeeNameMap(colaboradores);
    const currentMonth = format(now, "yyyy-MM");

    const medicalCountByColaborador = new Map<string, number>();
    afastamentos
      .filter((afastamento) => {
        const date = toDate(afastamento.data_inicio);
        if (!date) return false;
        return format(date, "yyyy-MM") === currentMonth;
      })
      .filter((afastamento) => (afastamento.tipo || "").toLowerCase().includes("atestado"))
      .forEach((afastamento) => {
        const employeeId = afastamento.colaborador_id || "unknown";
        medicalCountByColaborador.set(employeeId, (medicalCountByColaborador.get(employeeId) ?? 0) + 1);
      });

    const medicalCertificates = Array.from(medicalCountByColaborador.entries())
      .map(([employeeId, certificates]) => ({
        employeeName: employeeNames.get(employeeId) ?? "Colaborador",
        certificates,
      }))
      .filter((item) => item.certificates >= 3);

    const notifications = generateSmartNotifications({
      contractsEndingSoon,
      experienceEndingSoon,
      vacationsSoon,
      medicalCertificates,
      absenteeismSectorIncrease: sectorAbsIncrease,
      turnoverSectorIncrease: sectorTurnIncrease,
      anomalies: [...absenteeismAnomalies, ...turnoverAnomalies],
      turnoverRiskHigh: topTurnoverSector
        ? { sector: topTurnoverSector.sector, projected: turnoverForecast.predictions.reduce((sum, value) => sum + value, 0) }
        : undefined,
      absenteeismRiskHigh: topAbsenteeismSector
        ? {
            sector: topAbsenteeismSector.sector,
            projected: absenteeismForecast.predictions.reduce((sum, value) => sum + value, 0),
          }
        : undefined,
      now,
    });

    const chartNarratives = {
      absenteeism: generateChartNarrative(
        absenteeismMonthly.map((point) => ({ label: point.label, value: point.value })),
        {
          metricLabel: "Absenteismo",
          driverLabel: "Setores com mais dias perdidos",
          topDrivers: absencesBySector.slice(0, 2).map((item) => ({ label: item.sector, value: item.value })),
        },
      ),
      turnover: generateChartNarrative(
        turnoverMonthly.map((point) => ({ label: point.label, value: point.value })),
        {
          metricLabel: "Turnover",
          driverLabel: "Setores com mais desligamentos",
          topDrivers: dismissalsBySector.slice(0, 2).map((item) => ({ label: item.sector, value: item.value })),
        },
      ),
      dismissalsBySector: generateChartNarrative(
        dismissalsBySector.map((point) => ({ label: point.sector, value: point.value })),
        {
          metricLabel: "Desligamentos por setor",
        },
      ),
      absencesBySector: generateChartNarrative(
        absencesBySector.map((point) => ({ label: point.sector, value: point.value })),
        {
          metricLabel: "Afastamentos por setor",
        },
      ),
    };

    const changes: string[] = [];
    const absRateVariation = variationPercent(absenteeismRateCurrent, absenteeismRatePrevious);
    const turnRateVariation = variationPercent(turnoverRateCurrent, turnoverRatePrevious);

    changes.push(
      absRateVariation > 0
        ? `Absenteismo subiu ${absRateVariation.toFixed(1)}% vs periodo anterior.`
        : absRateVariation < 0
          ? `Absenteismo caiu ${Math.abs(absRateVariation).toFixed(1)}% e apresentou melhora.`
          : "Absenteismo permaneceu estavel na comparacao de periodo.",
    );

    changes.push(
      turnRateVariation > 0
        ? `Turnover aumentou ${turnRateVariation.toFixed(1)}% e requer atencao.`
        : turnRateVariation < 0
          ? `Turnover reduziu ${Math.abs(turnRateVariation).toFixed(1)}% no periodo.`
          : "Turnover estavel em relacao ao periodo anterior.",
    );

    if (sectorsAttention[0]) {
      const topSector = sectorsAttention[0];
      changes.push(
        `Setor ${topSector.sector} entrou em ${topSector.status === "critical" ? "estado critico" : "atencao"} (${Math.max(
          topSector.absenteeismVariation,
          topSector.turnoverVariation,
        ).toFixed(1)}% de piora).`,
      );
    }

    if (topAbsenceReasons[0]) {
      changes.push(
        `${topAbsenceReasons[0].reason} representa ${topAbsenceReasons[0].contributionPercent.toFixed(1)}% dos dias perdidos.`,
      );
    }

    if (topTurnoverReasons[0]) {
      changes.push(
        `${topTurnoverReasons[0].reason} representa ${topTurnoverReasons[0].contributionPercent.toFixed(1)}% das saidas.`,
      );
    }

    return {
      range,
      previousRange,
      metrics,
      absenteeismMonthly: absenteeismMonthlyWithAnomaly,
      turnoverMonthly: turnoverMonthlyWithAnomaly,
      dismissalsBySector,
      absencesBySector,
      heatmap,
      sectorRows,
      insights,
      chartNarratives,
      predictions: {
        turnover: {
          trend: turnoverForecast.trend,
          projectedTotal: Number(
            turnoverForecast.predictions.reduce((sum, value) => sum + value, 0).toFixed(1),
          ),
          confidence: turnoverForecast.confidence,
          riskSector: topTurnoverSector?.sector ?? "Sem dados",
          points: turnoverProjectionPoints,
        },
        absenteeism: {
          trend: absenteeismForecast.trend,
          projectedTotal: Number(
            absenteeismForecast.predictions.reduce((sum, value) => sum + value, 0).toFixed(1),
          ),
          confidence: absenteeismForecast.confidence,
          riskSector: topAbsenteeismSector?.sector ?? "Sem dados",
          points: absenteeismProjectionPoints,
        },
      },
      notifications,
      highlights: {
        changes: changes.slice(0, 5),
        sectorsAttention,
        topAbsenceReasons,
        topTurnoverReasons,
        absenteeismRateCurrent: Number(absenteeismRateCurrent.toFixed(2)),
        absenteeismRatePrevious: Number(absenteeismRatePrevious.toFixed(2)),
        turnoverRateCurrent: Number(turnoverRateCurrent.toFixed(2)),
        turnoverRatePrevious: Number(turnoverRatePrevious.toFixed(2)),
      },
    };
  }, [afastamentos, colaboradores, customRange, desligamentos, preset]);

  return {
    data: analytics,
    isLoading,
    error,
  };
}

