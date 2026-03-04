import type { AnomalyPoint } from "@/lib/analytics/anomaly";

export interface InsightItem {
  id: string;
  title: string;
  description: string;
  tone: "positive" | "neutral" | "warning";
  suggestedAction?: string;
  area?: "overview" | "absenteeism" | "turnover" | "training";
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
    title: "Tendencia de absenteismo",
    description:
      absVariation >= 0
        ? `O absenteismo aumentou ${absVariation.toFixed(1)}% em relacao ao periodo anterior.`
        : `O absenteismo caiu ${Math.abs(absVariation).toFixed(1)}% em relacao ao periodo anterior.`,
    tone: absVariation > 0 ? "warning" : "positive",
    suggestedAction:
      absVariation > 0
        ? "Revisar escala, ergonomia e acompanhamento de saude ocupacional no setor mais impactado."
        : "Manter rotinas preventivas aplicadas no periodo.",
    area: "absenteeism",
  });

  const turnoverVariation = variationPercent(input.turnoverRate, input.turnoverRatePrevious);
  insights.push({
    id: "turnover-rate",
    title: "Movimento de turnover",
    description:
      turnoverVariation >= 0
        ? `O turnover aumentou ${turnoverVariation.toFixed(1)}% em relacao ao periodo anterior.`
        : `O turnover reduziu ${Math.abs(turnoverVariation).toFixed(1)}% em relacao ao periodo anterior.`,
    tone: turnoverVariation > 0 ? "warning" : "positive",
    suggestedAction:
      turnoverVariation > 0
        ? "Validar clima, lideranca e pacote de retencao nas areas com maior concentracao de saidas."
        : "Consolidar as praticas que reduziram desligamentos.",
    area: "turnover",
  });

  if (input.topTurnoverSector) {
    insights.push({
      id: "turnover-sector",
      title: "Setor com maior turnover",
      description: `${input.topTurnoverSector.sector} lidera com taxa de ${input.topTurnoverSector.rate.toFixed(1)}%.`,
      tone: "warning",
      suggestedAction: `Executar pesquisa de clima e plano de permanencia para ${input.topTurnoverSector.sector}.`,
      area: "turnover",
    });
  }

  if (input.topAbsenteeismSector) {
    insights.push({
      id: "abs-sector",
      title: "Setor com maior absenteismo",
      description: `${input.topAbsenteeismSector.sector} acumulou ${input.topAbsenteeismSector.days.toFixed(0)} dias perdidos.`,
      tone: "warning",
      suggestedAction: `Investigar causas recorrentes em ${input.topAbsenteeismSector.sector} e reforcar plano preventivo.`,
      area: "absenteeism",
    });
  }

  if (input.topAbsenceReason) {
    insights.push({
      id: "reason",
      title: "Motivo de afastamento mais comum",
      description: `${input.topAbsenceReason.reason} foi o principal motivo com ${input.topAbsenceReason.days.toFixed(0)} dias.`,
      tone: "neutral",
      suggestedAction: "Criar acao educativa e acompanhamento focado no motivo de maior incidencia.",
      area: "absenteeism",
    });
  }

  if (input.criticalMonth) {
    insights.push({
      id: "critical-month",
      title: "Mes mais critico",
      description: `${input.criticalMonth.label} foi o mes mais critico para ${input.criticalMonth.metric} (${input.criticalMonth.value.toFixed(1)}).`,
      tone: "warning",
      suggestedAction: "Investigar fatores operacionais e contexto deste pico no mes critico.",
      area: "overview",
    });
  }

  if (input.anomalies.length > 0) {
    const highest = input.anomalies.reduce((prev, current) =>
      current.score > prev.score ? current : prev,
    );

    insights.push({
      id: "anomaly",
      title: "Anomalia detectada",
      description: `Foi detectado um pico relevante em ${highest.label} (${highest.value.toFixed(1)}).`,
      tone: "warning",
      suggestedAction: "Abrir analise de causa raiz para o periodo e setor relacionados ao pico.",
      area: "overview",
    });
  }

  insights.push({
    id: "volume-summary",
    title: "Resumo de volume",
    description: `${input.dismissals} desligamentos e ${input.absences} afastamentos foram registrados no periodo selecionado.`,
    tone: "neutral",
    area: "overview",
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
      title: "Cobertura de dados",
      description: "Ainda nao ha historico suficiente para gerar insights mais profundos neste periodo.",
      tone: "neutral",
      suggestedAction: "Registre mais eventos operacionais e treinamentos para aumentar a assertividade analitica.",
      area: "overview",
    });
  }

  return result.slice(0, Math.max(5, result.length));
}
