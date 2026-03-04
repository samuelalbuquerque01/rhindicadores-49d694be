import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";

export type PeriodPreset = "30d" | "3m" | "6m" | "12m" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface MonthBucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

export function resolvePresetRange(
  preset: Exclude<PeriodPreset, "custom">,
  now: Date = new Date(),
): DateRange {
  const end = endOfDay(now);

  if (preset === "30d") {
    return {
      start: startOfDay(subDays(end, 29)),
      end,
    };
  }

  const monthCount = preset === "3m" ? 3 : preset === "6m" ? 6 : 12;
  const firstMonthStart = startOfMonth(end);
  const shifted = new Date(firstMonthStart);
  shifted.setMonth(shifted.getMonth() - (monthCount - 1));

  return {
    start: startOfDay(startOfMonth(shifted)),
    end,
  };
}

export function normalizeCustomRange(start: Date, end: Date): DateRange {
  if (start <= end) {
    return { start: startOfDay(start), end: endOfDay(end) };
  }

  return { start: startOfDay(end), end: endOfDay(start) };
}

export function buildPreviousRange(range: DateRange): DateRange {
  const days = differenceInCalendarDays(range.end, range.start) + 1;
  const previousEnd = endOfDay(subDays(range.start, 1));
  const previousStart = startOfDay(subDays(previousEnd, days - 1));

  return {
    start: previousStart,
    end: previousEnd,
  };
}

export function isDateWithinRange(date: Date, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

export function buildMonthBuckets(range: DateRange): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const cursor = new Date(startOfMonth(range.start));

  while (cursor <= range.end) {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);

    buckets.push({
      key: format(monthStart, "yyyy-MM"),
      label: format(monthStart, "MMM/yy"),
      start: monthStart,
      end: monthEnd,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets;
}

export function rangeDays(range: DateRange): number {
  return differenceInCalendarDays(range.end, range.start) + 1;
}

export function rangeMonthsApprox(range: DateRange): number {
  return Math.max(1, Math.round(rangeDays(range) / 30));
}

export function addMonthsToRangeEnd(range: DateRange, months: number): Date[] {
  const out: Date[] = [];
  const base = startOfMonth(addDays(range.end, 1));

  for (let index = 0; index < months; index += 1) {
    const date = new Date(base);
    date.setMonth(base.getMonth() + index);
    out.push(date);
  }

  return out;
}
