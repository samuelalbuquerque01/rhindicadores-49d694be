import { InsightItem } from "@/lib/analytics/insights";

function variationPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function toInsightId(prefix: string, suffix: string): string {
  return `${prefix}-${suffix.toLowerCase().replace(/\s+/g, "-")}`;
}

export function buildAbsenteeismActionInsights(input: {
  currentRate: number;
  previousRate: number;
  topSector?: { sector: string; currentDays: number; previousDays: number };
  topReason?: { label: string; percent: number };
  criticalMonth?: { label: string; lostDays: number };
}): InsightItem[] {
  const insights: InsightItem[] = [];
  const variation = variationPercent(input.currentRate, input.previousRate);

  insights.push({
    id: "abs-rate-variation",
    area: "absenteeism",
    title: "Evolucao da taxa de absenteismo",
    description:
      variation > 0
        ? `Absenteismo subiu ${variation.toFixed(1)}% versus periodo anterior.`
        : variation < 0
          ? `Absenteismo caiu ${Math.abs(variation).toFixed(1)}% versus periodo anterior.`
          : "Absenteismo permaneceu estavel comparado ao periodo anterior.",
    tone: variation > 0 ? "warning" : variation < 0 ? "positive" : "neutral",
    suggestedAction:
      variation > 0
        ? "Revisar escala, ergonomia e acompanhamento medico ocupacional."
        : "Manter rotina preventiva e monitorar sazonalidade.",
  });

  if (input.topSector) {
    const sectorVariation = variationPercent(input.topSector.currentDays, input.topSector.previousDays);
    insights.push({
      id: toInsightId("abs-sector", input.topSector.sector),
      area: "absenteeism",
      title: "Setor com pior variacao",
      description: `${input.topSector.sector} variou ${sectorVariation.toFixed(1)}% em dias perdidos.`,
      tone: sectorVariation > 0 ? "warning" : "neutral",
      suggestedAction: `Investigar causas no setor ${input.topSector.sector} e ajustar escala do time.`,
    });
  }

  if (input.topReason) {
    insights.push({
      id: toInsightId("abs-reason", input.topReason.label),
      area: "absenteeism",
      title: "Motivo dominante",
      description: `${input.topReason.label} representa ${input.topReason.percent.toFixed(1)}% dos dias perdidos.`,
      tone: input.topReason.percent >= 40 ? "warning" : "neutral",
      suggestedAction: "Criar plano preventivo focado no motivo com maior impacto.",
    });
  }

  if (input.criticalMonth) {
    insights.push({
      id: toInsightId("abs-critical-month", input.criticalMonth.label),
      area: "absenteeism",
      title: "Pico no periodo",
      description: `${input.criticalMonth.label} concentrou ${input.criticalMonth.lostDays.toFixed(1)} dias perdidos.`,
      tone: "warning",
      suggestedAction: "Investigar mudancas operacionais e sobrecarga no mes de pico.",
    });
  }

  return insights;
}

export function buildTurnoverActionInsights(input: {
  currentRate: number;
  previousRate: number;
  topSector?: { sector: string; sectorRate: number; restRate: number };
  resignationVariationPercent?: number;
  topReason?: { label: string; percent: number };
}): InsightItem[] {
  const insights: InsightItem[] = [];
  const variation = variationPercent(input.currentRate, input.previousRate);

  insights.push({
    id: "turnover-rate-variation",
    area: "turnover",
    title: "Evolucao da taxa de turnover",
    description:
      variation > 0
        ? `Turnover subiu ${variation.toFixed(1)}% vs periodo anterior.`
        : variation < 0
          ? `Turnover caiu ${Math.abs(variation).toFixed(1)}% vs periodo anterior.`
          : "Turnover estavel na comparacao de periodo.",
    tone: variation > 0 ? "warning" : variation < 0 ? "positive" : "neutral",
    suggestedAction:
      variation > 0
        ? "Priorizar plano de retencao e revisao de lideranca."
        : "Consolidar a estrategia de permanencia que vem funcionando.",
  });

  if (input.topSector) {
    const factor = input.topSector.restRate > 0 ? input.topSector.sectorRate / input.topSector.restRate : 0;
    insights.push({
      id: toInsightId("turnover-sector", input.topSector.sector),
      area: "turnover",
      title: "Setor acima da media",
      description: `${input.topSector.sector} esta ${factor.toFixed(1)}x acima do restante da empresa.`,
      tone: factor >= 1.5 ? "warning" : "neutral",
      suggestedAction: `Rodar pesquisa de clima no setor ${input.topSector.sector}.`,
    });
  }

  if (typeof input.resignationVariationPercent === "number") {
    insights.push({
      id: "turnover-resignation-variation",
      area: "turnover",
      title: "Pedidos de demissao",
      description:
        input.resignationVariationPercent > 0
          ? `Pedidos de demissao aumentaram ${input.resignationVariationPercent.toFixed(1)}%.`
          : `Pedidos de demissao reduziram ${Math.abs(input.resignationVariationPercent).toFixed(1)}%.`,
      tone: input.resignationVariationPercent > 0 ? "warning" : "positive",
      suggestedAction:
        input.resignationVariationPercent > 0
          ? "Revisar remuneracao e maturidade de gestao nos times com mais saídas."
          : "Manter plano de retencao e acompanhamento do onboarding.",
    });
  }

  if (input.topReason) {
    insights.push({
      id: toInsightId("turnover-reason", input.topReason.label),
      area: "turnover",
      title: "Motivo principal de saida",
      description: `${input.topReason.label} representa ${input.topReason.percent.toFixed(1)}% dos desligamentos.`,
      tone: "neutral",
      suggestedAction: "Validar contramedidas especificas para o motivo mais recorrente.",
    });
  }

  return insights;
}

export function buildTrainingActionInsights(input: {
  lowAttendance?: { trainingName: string; attended: number; capacity: number };
  topSector?: { sector: string; participants: number };
  lowSector?: { sector: string; expected: number; attended: number };
  completionRate?: number;
  hasData: boolean;
}): InsightItem[] {
  if (!input.hasData) return [];

  const insights: InsightItem[] = [];

  if (input.lowAttendance) {
    insights.push({
      id: toInsightId("training-low-attendance", input.lowAttendance.trainingName),
      area: "training",
      title: "Baixa adesao em treinamento",
      description: `${input.lowAttendance.attended}/${input.lowAttendance.capacity} participantes compareceram em ${input.lowAttendance.trainingName}.`,
      tone: "warning",
      suggestedAction: "Criar turma extra e ajustar agenda para aumentar presenca.",
    });
  }

  if (input.topSector) {
    insights.push({
      id: toInsightId("training-top-sector", input.topSector.sector),
      area: "training",
      title: "Setor com maior participacao",
      description: `${input.topSector.sector} lidera com ${input.topSector.participants} participantes.`,
      tone: "positive",
      suggestedAction: `Replicar as praticas de comunicacao de ${input.topSector.sector} em outros setores.`,
    });
  }

  if (input.lowSector) {
    const gap = Math.max(0, input.lowSector.expected - input.lowSector.attended);
    insights.push({
      id: toInsightId("training-low-sector", input.lowSector.sector),
      area: "training",
      title: "Setor com baixa adesao",
      description: `${input.lowSector.sector} teve lacuna de ${gap} participante(s) em relacao ao esperado.`,
      tone: "warning",
      suggestedAction: "Reforcar comunicacao e alinhar horarios com a lideranca do setor.",
    });
  }

  if (typeof input.completionRate === "number") {
    insights.push({
      id: "training-completion-rate",
      area: "training",
      title: "Taxa de conclusao geral",
      description: `Conclusao media de ${input.completionRate.toFixed(1)}% no periodo.`,
      tone: input.completionRate >= 70 ? "positive" : "warning",
      suggestedAction:
        input.completionRate >= 70
          ? "Manter ritmo atual e elevar trilhas avancadas."
          : "Revisar formato e acompanhamento de presenca por turma.",
    });
  }

  return insights;
}
