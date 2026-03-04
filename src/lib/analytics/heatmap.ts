import { format } from "date-fns";

export interface HeatmapInputItem {
  sector: string;
  date: Date;
  days: number;
}

export interface HeatmapCell {
  sector: string;
  monthKey: string;
  monthLabel: string;
  value: number;
  intensity: "low" | "medium" | "high";
}

export interface HeatmapData {
  months: { key: string; label: string }[];
  sectors: string[];
  cells: HeatmapCell[];
  maxValue: number;
}

function intensityFromValue(value: number, maxValue: number): "low" | "medium" | "high" {
  if (maxValue <= 0) {
    return "low";
  }

  const ratio = value / maxValue;

  if (ratio >= 0.66) return "high";
  if (ratio >= 0.33) return "medium";
  return "low";
}

export function buildHeatmapData(
  items: HeatmapInputItem[],
  monthKeys: string[],
  monthLabels: Record<string, string>,
  explicitSectors?: string[],
): HeatmapData {
  const sectorSet = new Set<string>();

  items.forEach((item) => {
    sectorSet.add(item.sector || "Unassigned");
  });

  (explicitSectors ?? []).forEach((sector) => {
    sectorSet.add(sector || "Unassigned");
  });

  const sectors = Array.from(sectorSet).sort((a, b) => a.localeCompare(b));
  const matrix = new Map<string, number>();

  items.forEach((item) => {
    const sector = item.sector || "Unassigned";
    const monthKey = format(item.date, "yyyy-MM");

    if (!monthKeys.includes(monthKey)) {
      return;
    }

    const key = `${sector}__${monthKey}`;
    matrix.set(key, (matrix.get(key) ?? 0) + item.days);
  });

  const values: number[] = [];

  sectors.forEach((sector) => {
    monthKeys.forEach((monthKey) => {
      values.push(matrix.get(`${sector}__${monthKey}`) ?? 0);
    });
  });

  const maxValue = values.length > 0 ? Math.max(...values) : 0;

  const cells: HeatmapCell[] = [];

  sectors.forEach((sector) => {
    monthKeys.forEach((monthKey) => {
      const value = matrix.get(`${sector}__${monthKey}`) ?? 0;
      cells.push({
        sector,
        monthKey,
        monthLabel: monthLabels[monthKey] ?? monthKey,
        value,
        intensity: intensityFromValue(value, maxValue),
      });
    });
  });

  return {
    months: monthKeys.map((monthKey) => ({
      key: monthKey,
      label: monthLabels[monthKey] ?? monthKey,
    })),
    sectors,
    cells,
    maxValue,
  };
}

export function getHeatmapCellClass(intensity: HeatmapCell["intensity"]): string {
  if (intensity === "high") {
    return "bg-red-100 text-red-800 border-red-200";
  }

  if (intensity === "medium") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}
