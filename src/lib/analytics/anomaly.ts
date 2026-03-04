export interface TimeSeriesPoint {
  key: string;
  label: string;
  value: number;
  context?: string;
}

export interface AnomalyPoint extends TimeSeriesPoint {
  method: "zscore" | "moving-zscore";
  score: number;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function detectZScoreAnomalies(
  series: TimeSeriesPoint[],
  threshold = 2,
): AnomalyPoint[] {
  if (series.length < 3) {
    return [];
  }

  const values = series.map((point) => point.value);
  const avg = mean(values);
  const std = stdDeviation(values);

  if (std === 0) {
    return [];
  }

  return series
    .map((point) => {
      const score = (point.value - avg) / std;
      return {
        ...point,
        method: "zscore" as const,
        score,
      };
    })
    .filter((point) => point.score >= threshold);
}

export function detectMovingWindowAnomalies(
  series: TimeSeriesPoint[],
  windowSize = 3,
  threshold = 1.8,
): AnomalyPoint[] {
  if (series.length <= windowSize) {
    return [];
  }

  const output: AnomalyPoint[] = [];

  for (let index = windowSize; index < series.length; index += 1) {
    const current = series[index];
    const windowValues = series
      .slice(index - windowSize, index)
      .map((point) => point.value);

    const avg = mean(windowValues);
    const std = stdDeviation(windowValues);

    if (std === 0) {
      continue;
    }

    const score = (current.value - avg) / std;

    if (score >= threshold) {
      output.push({
        ...current,
        method: "moving-zscore",
        score,
      });
    }
  }

  return output;
}

export function detectCombinedAnomalies(
  series: TimeSeriesPoint[],
  options?: {
    globalThreshold?: number;
    movingThreshold?: number;
    windowSize?: number;
  },
): AnomalyPoint[] {
  const global = detectZScoreAnomalies(series, options?.globalThreshold ?? 2);
  const moving = detectMovingWindowAnomalies(
    series,
    options?.windowSize ?? 3,
    options?.movingThreshold ?? 1.8,
  );

  const map = new Map<string, AnomalyPoint>();

  [...global, ...moving].forEach((point) => {
    const existing = map.get(point.key);

    if (!existing || point.score > existing.score) {
      map.set(point.key, point);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}
