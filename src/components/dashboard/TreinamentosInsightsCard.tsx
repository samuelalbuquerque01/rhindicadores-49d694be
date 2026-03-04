import { useMemo } from "react";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { useTreinamentos, useTreinamentosParticipacoesDetalhadas } from "@/hooks/useTreinamentos";
import { buildTrainingActionInsights } from "@/lib/analytics/insightActions";
import { InsightItem } from "@/lib/analytics/insights";

interface TreinamentosInsightsCardProps {
  filialId?: string;
}

interface ParticipacaoDetalhada {
  participou: boolean | null;
  colaborador?: {
    departamento?: string | null;
  } | null;
  treinamento?: {
    id: string;
    nome: string;
    vagas_totais?: number | null;
    setor_alvo?: string | null;
  } | null;
}

function withFallbackInsights(insights: InsightItem[], hasData: boolean): InsightItem[] {
  if (!hasData) return [];

  const next = [...insights];
  while (next.length < 3) {
    next.push({
      id: `training-fallback-${next.length}`,
      area: "training",
      title: "Cobertura analitica",
      description: "Dados insuficientes para aprofundar mais padroes de adesao neste periodo.",
      tone: "neutral",
      suggestedAction: "Continue registrando presenca e conclusao por treinamento.",
    });
  }

  return next.slice(0, 4);
}

export function TreinamentosInsightsCard({ filialId }: TreinamentosInsightsCardProps) {
  const effectiveFilialId = filialId === "all" ? undefined : filialId;
  const { data: treinamentos = [] } = useTreinamentos(effectiveFilialId);
  const { data: participacoesDetalhadas = [] } = useTreinamentosParticipacoesDetalhadas(effectiveFilialId);

  const insights = useMemo(() => {
    const typed = participacoesDetalhadas as ParticipacaoDetalhada[];
    const hasData = treinamentos.length > 0 || typed.length > 0;
    if (!hasData) return [];

    const trainingStats = new Map<
      string,
      { name: string; capacity: number; attended: number; registered: number; targetSector: string }
    >();

    typed.forEach((item) => {
      const training = item.treinamento;
      if (!training?.id) return;
      const current = trainingStats.get(training.id) || {
        name: training.nome || "Treinamento",
        capacity: training.vagas_totais || 0,
        attended: 0,
        registered: 0,
        targetSector: training.setor_alvo || "",
      };
      current.registered += 1;
      if (item.participou) current.attended += 1;
      trainingStats.set(training.id, current);
    });

    const lowAttendance = Array.from(trainingStats.values())
      .filter((item) => item.capacity > 0)
      .sort((left, right) => {
        const leftRatio = left.capacity > 0 ? left.attended / left.capacity : 1;
        const rightRatio = right.capacity > 0 ? right.attended / right.capacity : 1;
        return leftRatio - rightRatio;
      })[0];

    const sectorParticipants = new Map<string, number>();
    const sectorRegistrations = new Map<string, number>();
    typed.forEach((item) => {
      const sector = item.colaborador?.departamento || "Sem setor";
      sectorRegistrations.set(sector, (sectorRegistrations.get(sector) ?? 0) + 1);
      if (item.participou) {
        sectorParticipants.set(sector, (sectorParticipants.get(sector) ?? 0) + 1);
      }
    });

    const topSector = Array.from(sectorParticipants.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([sector, participants]) => ({ sector, participants }))[0];

    const lowSector = Array.from(sectorRegistrations.entries())
      .map(([sector, expected]) => ({
        sector,
        expected,
        attended: sectorParticipants.get(sector) ?? 0,
        rate: expected > 0 ? (sectorParticipants.get(sector) ?? 0) / expected : 0,
      }))
      .sort((left, right) => left.rate - right.rate)[0];

    const totalRegistered = typed.length;
    const totalAttended = typed.filter((item) => item.participou).length;
    const completionRate = totalRegistered > 0 ? (totalAttended / totalRegistered) * 100 : 0;

    const generated = buildTrainingActionInsights({
      hasData,
      lowAttendance: lowAttendance
        ? {
            trainingName: lowAttendance.name,
            attended: lowAttendance.attended,
            capacity: lowAttendance.capacity,
          }
        : undefined,
      topSector: topSector
        ? {
            sector: topSector.sector,
            participants: topSector.participants,
          }
        : undefined,
      lowSector: lowSector
        ? {
            sector: lowSector.sector,
            expected: lowSector.expected,
            attended: lowSector.attended,
          }
        : undefined,
      completionRate,
    });

    return withFallbackInsights(generated, hasData);
  }, [participacoesDetalhadas, treinamentos.length]);

  return (
    <InsightsPanel
      title="Insights e Acoes - Treinamentos"
      insights={insights}
      emptyHint="Sem dados de treinamentos ainda. Cadastre treinamentos, participantes e presenca para liberar insights."
    />
  );
}
