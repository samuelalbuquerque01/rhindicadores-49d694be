import type { AnomalyPoint } from "@/lib/analytics/anomaly";

export interface InsightItem {
  id: string;
  title: string;
  description: string;
  tone: "positive" | "neutral" | "warning";
}

interface InsightsInput {
  absenteeismRate: number;
  absenteeismRatePrevious: number;
  turnoverRate: number;
  turnoverRatePrevious: number;
  topTurnoverSector?: { sector: string; rate: number };
  topAbsenteeismSector?: { sector: string; days: number };
  topAbsenceReason?: { reason: string; days: number };
  criticalMonth?: { label: string; value: number; metric: string };
  anomalies: AnomalyPoint[];
  dismissals: number;
  absences: number;
}

function variationPercent(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

export function generateInsights(input: InsightsInput): InsightItem[] {
  const insights: InsightItem[] = [];

  const absVariation = variationPercent(input.absenteeismRate, input.absenteeismRatePrevious);
  insights.push({
    id: "abs-rate",
    title: "Absenteeism trend",
    description:
      absVariation >= 0
        ? `Absenteeism increased ${absVariation.toFixed(1)}% compared to the previous period.`
        : `Absenteeism dropped ${Math.abs(absVariation).toFixed(1)}% compared to the previous period.`,
    tone: absVariation > 0 ? "warning" : "positive",
  });

  const turnoverVariation = variationPercent(input.turnoverRate, input.turnoverRatePrevious);
  insights.push({
    id: "turnover-rate",
    title: "Turnover movement",
    description:
      turnoverVariation >= 0
        ? `Turnover increased ${turnoverVariation.toFixed(1)}% versus the previous period.`
        : `Turnover decreased ${Math.abs(turnoverVariation).toFixed(1)}% versus the previous period.`,
    tone: turnoverVariation > 0 ? "warning" : "positive",
  });

  if (input.topTurnoverSector) {
    insights.push({
      id: "turnover-sector",
      title: "Highest turnover sector",
      description: `${input.topTurnoverSector.sector} leads turnover with ${input.topTurnoverSector.rate.toFixed(1)}%.`,
      tone: "warning",
    });
  }

  if (input.topAbsenteeismSector) {
    insights.push({
      id: "abs-sector",
      title: "Highest absenteeism sector",
      description: `${input.topAbsenteeismSector.sector} accumulated ${input.topAbsenteeismSector.days.toFixed(0)} lost days.`,
      tone: "warning",
    });
  }

  if (input.topAbsenceReason) {
    insights.push({
      id: "reason",
      title: "Most common absence reason",
      description: `${input.topAbsenceReason.reason} is the top reason with ${input.topAbsenceReason.days.toFixed(0)} days.`,
      tone: "neutral",
    });
  }

  if (input.criticalMonth) {
    insights.push({
      id: "critical-month",
      title: "Critical month",
      description: `${input.criticalMonth.label} was the most critical month for ${input.criticalMonth.metric} (${input.criticalMonth.value.toFixed(1)}).`,
      tone: "warning",
    });
  }

  if (input.anomalies.length > 0) {
    const highest = input.anomalies.reduce((prev, current) =>
      current.score > prev.score ? current : prev,
    );

    insights.push({
      id: "anomaly",
      title: "Anomaly detected",
      description: `A significant spike was detected in ${highest.label} (${highest.value.toFixed(1)}).`,
      tone: "warning",
    });
  }

  insights.push({
    id: "volume-summary",
    title: "Volume summary",
    description: `${input.dismissals} dismissals and ${input.absences} absences were registered in the selected period.`,
    tone: "neutral",
  });

  const unique = new Map<string, InsightItem>();
  insights.forEach((insight) => {
    if (!unique.has(insight.id)) {
      unique.set(insight.id, insight);
    }
  });

  const result = Array.from(unique.values());

  if (result.length < 5) {
    result.push({
      id: "fallback-1",
      title: "Data coverage",
      description: "There is not enough historical data to generate deeper insights for this period.",
      tone: "neutral",
    });
  }

  return result.slice(0, Math.max(5, result.length));
}
