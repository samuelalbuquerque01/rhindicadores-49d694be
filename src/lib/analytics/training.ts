export interface TrainingParticipantLike {
  participou?: boolean | null;
  colaborador?: {
    departamento?: string | null;
  } | null;
}

export interface GetTrainingStatsInput {
  capacity?: number | null;
  participants: TrainingParticipantLike[];
}

export interface TrainingStats {
  totalVagas: number;
  totalParticipantes: number;
  totalConcluidos: number;
  occupancyRate: number;
  completionRate: number;
  mostActiveSector: string;
  secondarySector?: string;
  engagementLevel: "Alto" | "Medio" | "Baixo";
}

function roundPercentage(value: number): number {
  return Math.round(value);
}

export function getTrainingStats(input: GetTrainingStatsInput): TrainingStats {
  const totalParticipantes = input.participants.length;
  const totalConcluidos = input.participants.filter((participant) => Boolean(participant.participou)).length;
  const totalVagas = input.capacity && input.capacity > 0 ? input.capacity : totalParticipantes;

  const occupancyRate =
    totalVagas > 0 ? roundPercentage((totalParticipantes / totalVagas) * 100) : 0;
  const completionRate =
    totalParticipantes > 0 ? roundPercentage((totalConcluidos / totalParticipantes) * 100) : 0;

  const sectorCounts = new Map<string, number>();
  input.participants.forEach((participant) => {
    const setor = participant.colaborador?.departamento || "Sem setor";
    sectorCounts.set(setor, (sectorCounts.get(setor) ?? 0) + 1);
  });

  const orderedSectors = [...sectorCounts.entries()].sort((left, right) => right[1] - left[1]);
  const mostActiveSector = orderedSectors[0]?.[0] ?? "-";
  const secondarySector = orderedSectors[1]?.[0];

  const engagementLevel =
    occupancyRate >= 80 && completionRate >= 70
      ? "Alto"
      : occupancyRate >= 50 && completionRate >= 50
        ? "Medio"
        : "Baixo";

  return {
    totalVagas,
    totalParticipantes,
    totalConcluidos,
    occupancyRate,
    completionRate,
    mostActiveSector,
    secondarySector,
    engagementLevel,
  };
}
