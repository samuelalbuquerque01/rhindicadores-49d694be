import { differenceInCalendarDays, format, parseISO, startOfMonth, subMonths } from "date-fns";
import type { InsightItem } from "@/lib/analytics/insights";

export interface TurnoverRecordInput {
  id: string;
  reason: string;
  terminationDate: string;
  hireDate?: string | null;
  sectorName?: string | null;
}

export interface TurnoverReasonPoint {
  id: string;
  label: string;
  count: number;
}

export interface TurnoverMonthPoint {
  monthKey: string;
  monthLabel: string;
  terminations: number;
}

export interface TurnoverSectorPoint {
  sector: string;
  terminations: number;
}

export interface TurnoverAnalyticsResult {
  terminationsCount: number;
  turnoverRate: number | null;
  topSector: string;
  avgTenureDays: number | null;
  reasons: TurnoverReasonPoint[];
  monthlyTerminations: TurnoverMonthPoint[];
  sectorTerminations: TurnoverSectorPoint[];
  insights: InsightItem[];
}

function normalizeSectorName(value?: string | null): string {
  return value?.trim() || "Sem setor";
}

function toValidDate(value: string): Date | null {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function buildLastMonths(months: number): TurnoverMonthPoint[] {
  const currentMonthStart = startOfMonth(new Date());
  const buckets: TurnoverMonthPoint[] = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = subMonths(currentMonthStart, index);
    buckets.push({
      monthKey: format(date, "yyyy-MM"),
      monthLabel: format(date, "MMM/yy"),
      terminations: 0,
    });
  }

  return buckets;
}

function calcVariationPercent(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function buildTurnoverInsights(
  topSector: string,
  topSectorValue: number,
  reasons: TurnoverReasonPoint[],
  monthly: TurnoverMonthPoint[],
): InsightItem[] {
  const items: InsightItem[] = [];

  items.push({
    id: "turnover-top-sector",
    title: "Setor com maior turnover",
    description:
      topSectorValue > 0
        ? `${topSector} concentrou ${topSectorValue} desligamento(s) no periodo.`
        : "Nenhum setor registrou desligamentos no periodo.",
    tone: topSectorValue > 0 ? "warning" : "neutral",
  });

  const current = monthly[monthly.length - 1]?.terminations ?? 0;
  const previous = monthly[monthly.length - 2]?.terminations ?? 0;
  const variation = calcVariationPercent(current, previous);

  items.push({
    id: "turnover-month-variation",
    title: "Variacao mensal de desligamentos",
    description:
      variation > 0
        ? `Alta de ${variation.toFixed(1)}% no ultimo mes comparado ao mes anterior.`
        : variation < 0
          ? `Reducao de ${Math.abs(variation).toFixed(1)}% no ultimo mes comparado ao mes anterior.`
          : "Volume de desligamentos estavel entre os dois ultimos meses.",
    tone: variation > 0 ? "warning" : variation < 0 ? "positive" : "neutral",
  });

  const topReason = reasons[0];
  items.push({
    id: "turnover-main-reason",
    title: "Motivo de saida predominante",
    description: topReason
      ? `${topReason.label} apareceu em ${topReason.count} desligamento(s), sendo o principal motivo.`
      : "Sem motivos de saida suficientes para analise.",
    tone: topReason ? "neutral" : "neutral",
  });

  return items;
}

export function buildTurnoverAnalytics(
  records: TurnoverRecordInput[],
  workforceSize?: number,
  monthsBack = 12,
): TurnoverAnalyticsResult {
  const safeMonths = Math.max(1, monthsBack);
  const monthBuckets = buildLastMonths(safeMonths);
  const monthLookup = new Map(monthBuckets.map((item) => [item.monthKey, item]));

  const reasonMap = new Map<string, number>();
  const sectorMap = new Map<string, number>();
  const tenureDays: number[] = [];

  records.forEach((record) => {
    const terminationDate = toValidDate(record.terminationDate);
    if (!terminationDate) return;

    const monthKey = format(terminationDate, "yyyy-MM");
    const monthBucket = monthLookup.get(monthKey);
    if (monthBucket) {
      monthBucket.terminations += 1;
    }

    const reason = record.reason.trim() || "Nao informado";
    reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);

    const sector = normalizeSectorName(record.sectorName);
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + 1);

    if (record.hireDate) {
      const hire = toValidDate(record.hireDate);
      if (hire) {
        const tenure = Math.max(0, differenceInCalendarDays(terminationDate, hire));
        tenureDays.push(tenure);
      }
    }
  });

  const reasons = [...reasonMap.entries()]
    .map(([label, count]) => ({ id: label.toLowerCase().replace(/\s+/g, "-"), label, count }))
    .sort((left, right) => right.count - left.count);

  const sectorTerminations = [...sectorMap.entries()]
    .map(([sector, terminations]) => ({ sector, terminations }))
    .sort((left, right) => right.terminations - left.terminations);

  const topSector = sectorTerminations[0]?.sector ?? "Indisponivel";
  const topSectorValue = sectorTerminations[0]?.terminations ?? 0;
  const avgTenureDays =
    tenureDays.length > 0
      ? Math.round(tenureDays.reduce((total, value) => total + value, 0) / tenureDays.length)
      : null;

  const turnoverRate =
    workforceSize && workforceSize > 0
      ? Math.round((records.length / workforceSize) * 1000) / 10
      : null;

  return {
    terminationsCount: records.length,
    turnoverRate,
    topSector,
    avgTenureDays,
    reasons,
    monthlyTerminations: monthBuckets,
    sectorTerminations,
    insights: buildTurnoverInsights(topSector, topSectorValue, reasons, monthBuckets),
  };
}
