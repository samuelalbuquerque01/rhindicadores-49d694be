import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { countDaysBetween } from "@/lib/analytics/events";

export interface AbsenceRecordInput {
  id: string;
  type: string;
  startDate: string;
  endDate?: string | null;
  sectorName?: string | null;
}

export interface AbsenteeismReasonPoint {
  id: string;
  label: string;
  days: number;
  occurrences: number;
}

export interface AbsenteeismMonthPoint {
  monthKey: string;
  monthLabel: string;
  lostDays: number;
}

export interface AbsenteeismSectorPoint {
  sector: string;
  lostDays: number;
}

export interface AbsenteeismHeatmapPoint {
  sector: string;
  monthKey: string;
  monthLabel: string;
  lostDays: number;
}

export interface AbsenteeismAnalyticsResult {
  lostDays: number;
  absencesCount: number;
  absenteeismRate: number | null;
  mostImpactedSector: string;
  reasons: AbsenteeismReasonPoint[];
  monthlyLostDays: AbsenteeismMonthPoint[];
  sectorLostDays: AbsenteeismSectorPoint[];
  heatmap: AbsenteeismHeatmapPoint[];
}

function normalizeSectorName(value?: string | null): string {
  return value?.trim() || "Sem setor";
}

function toValidDate(value: string): Date | null {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function buildLastMonths(months: number): AbsenteeismMonthPoint[] {
  const currentMonthStart = startOfMonth(new Date());
  const buckets: AbsenteeismMonthPoint[] = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = subMonths(currentMonthStart, index);
    buckets.push({
      monthKey: format(date, "yyyy-MM"),
      monthLabel: format(date, "MMM/yy"),
      lostDays: 0,
    });
  }

  return buckets;
}

export function buildAbsenteeismAnalytics(
  records: AbsenceRecordInput[],
  workforceSize?: number,
  monthsBack = 12,
): AbsenteeismAnalyticsResult {
  const safeMonths = Math.max(1, monthsBack);
  const monthBuckets = buildLastMonths(safeMonths);
  const monthLookup = new Map(monthBuckets.map((item) => [item.monthKey, item]));

  const reasonMap = new Map<string, AbsenteeismReasonPoint>();
  const sectorMap = new Map<string, number>();
  const heatmapMap = new Map<string, AbsenteeismHeatmapPoint>();

  let lostDays = 0;

  records.forEach((record) => {
    const duration = countDaysBetween(record.startDate, record.endDate);
    lostDays += duration;

    const startDate = toValidDate(record.startDate);
    if (!startDate) return;

    const monthKey = format(startDate, "yyyy-MM");
    const monthLabel = format(startDate, "MMM/yy");
    const sectorName = normalizeSectorName(record.sectorName);

    const monthBucket = monthLookup.get(monthKey);
    if (monthBucket) {
      monthBucket.lostDays += duration;
    }

    const reasonKey = record.type.trim() || "Nao informado";
    const reasonItem = reasonMap.get(reasonKey);
    if (reasonItem) {
      reasonItem.days += duration;
      reasonItem.occurrences += 1;
    } else {
      reasonMap.set(reasonKey, {
        id: reasonKey.toLowerCase().replace(/\s+/g, "-"),
        label: reasonKey,
        days: duration,
        occurrences: 1,
      });
    }

    sectorMap.set(sectorName, (sectorMap.get(sectorName) ?? 0) + duration);

    const heatmapKey = `${sectorName}__${monthKey}`;
    const currentHeatmap = heatmapMap.get(heatmapKey);
    if (currentHeatmap) {
      currentHeatmap.lostDays += duration;
    } else {
      heatmapMap.set(heatmapKey, {
        sector: sectorName,
        monthKey,
        monthLabel,
        lostDays: duration,
      });
    }
  });

  const reasons = [...reasonMap.values()].sort((left, right) => right.days - left.days);
  const sectorLostDays = [...sectorMap.entries()]
    .map(([sector, total]) => ({ sector, lostDays: total }))
    .sort((left, right) => right.lostDays - left.lostDays);

  const mostImpactedSector = sectorLostDays[0]?.sector ?? "Indisponivel";
  const absenteeismRate =
    workforceSize && workforceSize > 0
      ? Math.round((lostDays / (workforceSize * 22)) * 1000) / 10
      : null;

  return {
    lostDays,
    absencesCount: records.length,
    absenteeismRate,
    mostImpactedSector,
    reasons,
    monthlyLostDays: monthBuckets,
    sectorLostDays,
    heatmap: [...heatmapMap.values()].sort((left, right) => left.monthKey.localeCompare(right.monthKey)),
  };
}

export function deriveMonthVariation(points: Array<{ lostDays: number }>): number {
  if (points.length < 2) return 0;
  const last = points[points.length - 1]?.lostDays ?? 0;
  const previous = points[points.length - 2]?.lostDays ?? 0;
  if (previous === 0) {
    return last > 0 ? 100 : 0;
  }
  return Math.round(((last - previous) / previous) * 1000) / 10;
}
