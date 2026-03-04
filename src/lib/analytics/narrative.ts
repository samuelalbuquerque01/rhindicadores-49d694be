export interface NarrativeSeriesPoint {
  label: string;
  value: number;
}

export interface NarrativeOptions {
  metricLabel: string;
  driverLabel?: string;
  topDrivers?: Array<{ label: string; value: number }>;
}

function percentChange(previous: number, current: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function resolveTrend(values: number[]): "up" | "down" | "stable" {
  if (values.length < 2) {
    return "stable";
  }

  const start = values[0];
  const end = values[values.length - 1];
  const delta = end - start;

  if (Math.abs(delta) < 0.01) return "stable";
  return delta > 0 ? "up" : "down";
}

export function generateChartNarrative(
  series: NarrativeSeriesPoint[],
  options: NarrativeOptions,
): string[] {
  if (series.length === 0) {
    return [
      `No data for ${options.metricLabel.toLowerCase()} in the selected period.`,
      "Keep collecting data to unlock automatic trend explanations.",
    ];
  }

  const values = series.map((point) => point.value);
  const trend = resolveTrend(values);
  const start = values[0];
  const end = values[values.length - 1];
  const variation = percentChange(start, end);

  const trendText =
    trend === "up"
      ? `${options.metricLabel} is trending up (${variation.toFixed(1)}% vs period start).`
      : trend === "down"
        ? `${options.metricLabel} is trending down (${Math.abs(variation).toFixed(1)}% vs period start).`
        : `${options.metricLabel} is stable across the selected period.`;

  let largestJumpText = "No significant month-to-month jumps were detected.";

  if (series.length >= 2) {
    let maxDelta = 0;
    let maxIndex = 1;

    for (let index = 1; index < series.length; index += 1) {
      const delta = Math.abs(series[index].value - series[index - 1].value);
      if (delta > maxDelta) {
        maxDelta = delta;
        maxIndex = index;
      }
    }

    const from = series[maxIndex - 1];
    const to = series[maxIndex];
    largestJumpText = `Largest change happened from ${from.label} to ${to.label} (${from.value.toFixed(1)} to ${to.value.toFixed(1)}).`;
  }

  const driverText = options.topDrivers && options.topDrivers.length > 0
    ? `${options.driverLabel ?? "Main drivers"}: ${options.topDrivers
        .slice(0, 2)
        .map((driver) => `${driver.label} (${driver.value.toFixed(1)})`)
        .join(", ")}.`
    : "No sector concentration identified from available data.";

  const recommendation =
    trend === "up"
      ? `Recommendation: investigate the latest spike and validate mitigation actions by sector.`
      : trend === "down"
        ? `Recommendation: sustain current practices and monitor for rebound in the next cycle.`
        : `Recommendation: monitor outliers and focus on departments above average.`;

  return [trendText, largestJumpText, driverText, recommendation];
}
