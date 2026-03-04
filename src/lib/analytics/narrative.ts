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
      `Sem dados de ${options.metricLabel.toLowerCase()} no periodo selecionado.`,
      "Continue registrando dados para gerar explicacoes automaticas mais completas.",
    ];
  }

  const values = series.map((point) => point.value);
  const trend = resolveTrend(values);
  const start = values[0];
  const end = values[values.length - 1];
  const variation = percentChange(start, end);

  const trendText =
    trend === "up"
      ? `${options.metricLabel} esta em alta (${variation.toFixed(1)}% desde o inicio do periodo).`
      : trend === "down"
        ? `${options.metricLabel} esta em queda (${Math.abs(variation).toFixed(1)}% desde o inicio do periodo).`
        : `${options.metricLabel} permaneceu estavel no periodo selecionado.`;

  let largestJumpText = "Nao houve saltos relevantes entre meses consecutivos.";

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
    largestJumpText = `Maior variacao de ${from.label} para ${to.label} (${from.value.toFixed(1)} para ${to.value.toFixed(1)}).`;
  }

  const driverText = options.topDrivers && options.topDrivers.length > 0
    ? `${options.driverLabel ?? "Principais vetores"}: ${options.topDrivers
        .slice(0, 2)
        .map((driver) => `${driver.label} (${driver.value.toFixed(1)})`)
        .join(", ")}.`
    : "Nao houve concentracao setorial relevante com os dados disponiveis.";

  const recommendation =
    trend === "up"
      ? "Recomendacao: investigar o pico mais recente e validar plano de acao por setor."
      : trend === "down"
        ? "Recomendacao: manter as praticas atuais e monitorar possivel retomada no proximo ciclo."
        : "Recomendacao: acompanhar outliers e focar nos setores acima da media.";

  return [trendText, largestJumpText, driverText, recommendation];
}
