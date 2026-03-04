import type { Afastamento, Colaborador, Desligamento } from "@/types/database";
import type { DateRange } from "@/lib/analytics/period";

export interface SectorComparisonRow {
  sector: string;
  activeEmployees: number;
  absenteeismDays: number;
  absenteeismRate: number;
  turnoverRate: number;
  dismissals: number;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function inRange(date: Date | null, range: DateRange): boolean {
  if (!date) return false;
  return date >= range.start && date <= range.end;
}

export function buildSectorComparison(
  colaboradores: Colaborador[],
  afastamentos: Afastamento[],
  desligamentos: Desligamento[],
  range: DateRange,
): SectorComparisonRow[] {
  const sectorMap = new Map<string, SectorComparisonRow>();

  colaboradores
    .filter((colaborador) => colaborador.status === "Ativo")
    .forEach((colaborador) => {
      const sector = colaborador.departamento || "Unassigned";
      const previous = sectorMap.get(sector) ?? {
        sector,
        activeEmployees: 0,
        absenteeismDays: 0,
        absenteeismRate: 0,
        turnoverRate: 0,
        dismissals: 0,
      };

      previous.activeEmployees += 1;
      sectorMap.set(sector, previous);
    });

  afastamentos.forEach((afastamento) => {
    const dataInicio = parseDate(afastamento.data_inicio);
    if (!inRange(dataInicio, range)) {
      return;
    }

    const sector = afastamento.colaborador?.departamento || "Unassigned";
    const previous = sectorMap.get(sector) ?? {
      sector,
      activeEmployees: 0,
      absenteeismDays: 0,
      absenteeismRate: 0,
      turnoverRate: 0,
      dismissals: 0,
    };

    previous.absenteeismDays += afastamento.dias_afastados || 0;
    sectorMap.set(sector, previous);
  });

  desligamentos.forEach((desligamento) => {
    const dataDesligamento = parseDate(desligamento.data_desligamento);
    if (!inRange(dataDesligamento, range)) {
      return;
    }

    const sector = desligamento.colaborador?.departamento || "Unassigned";
    const previous = sectorMap.get(sector) ?? {
      sector,
      activeEmployees: 0,
      absenteeismDays: 0,
      absenteeismRate: 0,
      turnoverRate: 0,
      dismissals: 0,
    };

    previous.dismissals += 1;
    sectorMap.set(sector, previous);
  });

  return Array.from(sectorMap.values())
    .map((row) => {
      const availableDays = Math.max(1, row.activeEmployees * 22);
      return {
        ...row,
        absenteeismRate: Number(((row.absenteeismDays / availableDays) * 100).toFixed(2)),
        turnoverRate: Number(
          ((row.dismissals / Math.max(1, row.activeEmployees + row.dismissals)) * 100).toFixed(2),
        ),
      };
    })
    .sort((a, b) => b.absenteeismDays - a.absenteeismDays);
}
