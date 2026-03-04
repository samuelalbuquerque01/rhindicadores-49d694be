import { format } from "date-fns";

export interface ForecastResult {
  method: "moving-average" | "linear-regression" | "exponential-smoothing";
  predictions: number[];
  confidence: number;
  mae: number;
  trend: "up" | "down" | "stable";
}

export interface ProjectionPoint {
  key: string;
  label: string;
  historical: number | null;
  projected: number | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function movingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0;
  const slice = values.slice(Math.max(0, values.length - window));
  return avg(slice);
}

function calculateLinearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;

  if (n === 0) {
    return { slope: 0, intercept: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let index = 0; index < n; index += 1) {
    const x = index;
    const y = values[index];

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX ** 2;

  if (denominator === 0) {
    return { slope: 0, intercept: avg(values) };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export function movingAverageForecast(
  series: number[],
  horizon: number,
  window = 3,
): number[] {
  const values = [...series];
  const output: number[] = [];

  for (let index = 0; index < horizon; index += 1) {
    const next = movingAverage(values, window);
    const rounded = Math.max(0, Math.round(next * 100) / 100);
    output.push(rounded);
    values.push(rounded);
  }

  return output;
}

export function linearRegressionForecast(series: number[], horizon: number): number[] {
  if (series.length === 0) {
    return Array.from({ length: horizon }, () => 0);
  }

  const { slope, intercept } = calculateLinearRegression(series);
  const output: number[] = [];

  for (let index = 0; index < horizon; index += 1) {
    const x = series.length + index;
    const predicted = intercept + slope * x;
    output.push(Math.max(0, Math.round(predicted * 100) / 100));
  }

  return output;
}

export function exponentialSmoothingForecast(
  series: number[],
  horizon: number,
  alpha = 0.4,
): number[] {
  if (series.length === 0) {
    return Array.from({ length: horizon }, () => 0);
  }

  let smoothed = series[0];

  for (let index = 1; index < series.length; index += 1) {
    smoothed = alpha * series[index] + (1 - alpha) * smoothed;
  }

  return Array.from({ length: horizon }, () => Math.max(0, Math.round(smoothed * 100) / 100));
}

export function meanAbsoluteError(actual: number[], predicted: number[]): number {
  if (actual.length === 0 || actual.length !== predicted.length) {
    return 0;
  }

  const total = actual.reduce((sum, value, index) => sum + Math.abs(value - predicted[index]), 0);
  return total / actual.length;
}

function backtestMae(
  series: number[],
  method: "moving-average" | "linear-regression" | "exponential-smoothing",
): number {
  const testSize = Math.min(3, Math.floor(series.length / 3));

  if (series.length < 5 || testSize === 0) {
    return avg(series) * 0.3;
  }

  const train = series.slice(0, series.length - testSize);
  const actual = series.slice(series.length - testSize);

  let predicted: number[];

  if (method === "linear-regression") {
    predicted = linearRegressionForecast(train, testSize);
  } else if (method === "moving-average") {
    predicted = movingAverageForecast(train, testSize, 3);
  } else {
    predicted = exponentialSmoothingForecast(train, testSize, 0.4);
  }

  return meanAbsoluteError(actual, predicted);
}

function resolveTrend(values: number[]): "up" | "down" | "stable" {
  if (values.length < 2) {
    return "stable";
  }

  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;

  if (Math.abs(delta) < 0.5) return "stable";
  return delta > 0 ? "up" : "down";
}

function confidenceFromMae(mae: number, baseline: number): number {
  if (baseline <= 0) return 50;
  const normalizedError = mae / baseline;
  const score = 100 - normalizedError * 100;
  return Math.round(clamp(score, 20, 95));
}

export function forecastSeries(
  series: number[],
  horizon = 3,
  options?: {
    movingAverageWindow?: number;
    includeSmoothing?: boolean;
  },
): ForecastResult {
  const sanitized = series.map((value) => (Number.isFinite(value) ? value : 0));

  if (sanitized.length === 0) {
    return {
      method: "moving-average",
      predictions: Array.from({ length: horizon }, () => 0),
      confidence: 20,
      mae: 0,
      trend: "stable",
    };
  }

  const canUseRegression = sanitized.length >= 5;
  const method: ForecastResult["method"] = canUseRegression
    ? "linear-regression"
    : "moving-average";

  const predictions =
    method === "linear-regression"
      ? linearRegressionForecast(sanitized, horizon)
      : movingAverageForecast(sanitized, horizon, options?.movingAverageWindow ?? 3);

  const mae = backtestMae(sanitized, method);
  const baseline = Math.max(1, avg(sanitized));
  const confidence = confidenceFromMae(mae, baseline);

  return {
    method,
    predictions,
    confidence,
    mae: Math.round(mae * 100) / 100,
    trend: resolveTrend([...sanitized, ...predictions]),
  };
}

export function buildProjectionSeries(
  historical: Array<{ key: string; value: number; date: Date }>,
  forecast: number[],
): ProjectionPoint[] {
  const historyPoints: ProjectionPoint[] = historical.map((point) => ({
    key: point.key,
    label: format(point.date, "MMM/yy"),
    historical: point.value,
    projected: null,
  }));

  const lastDate = historical[historical.length - 1]?.date ?? new Date();

  const forecastPoints = forecast.map((value, index) => {
    const projectedDate = new Date(lastDate);
    projectedDate.setMonth(projectedDate.getMonth() + index + 1);

    return {
      key: format(projectedDate, "yyyy-MM"),
      label: format(projectedDate, "MMM/yy"),
      historical: null,
      projected: value,
    };
  });

  return [...historyPoints, ...forecastPoints];
}
