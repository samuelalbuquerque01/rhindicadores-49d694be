import { readLocalStorage, writeLocalStorage } from "@/lib/storage/localStorage";

export interface RHGoals {
  absenteeismTarget: number;
  turnoverTarget: number;
  updatedAt: string;
}

const STORAGE_KEY = "rh-dashboard-goals";

export const DEFAULT_RH_GOALS: RHGoals = {
  absenteeismTarget: 2.5,
  turnoverTarget: 3,
  updatedAt: "",
};

function normalizeGoalValue(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return fallback;
  }

  return Number(value.toFixed(2));
}

export function readGoals(): RHGoals {
  const parsed = readLocalStorage<Partial<RHGoals>>(STORAGE_KEY, {});

  return {
    absenteeismTarget: normalizeGoalValue(parsed.absenteeismTarget, DEFAULT_RH_GOALS.absenteeismTarget),
    turnoverTarget: normalizeGoalValue(parsed.turnoverTarget, DEFAULT_RH_GOALS.turnoverTarget),
    updatedAt: parsed.updatedAt && typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
  };
}

export function persistGoals(goals: RHGoals): void {
  writeLocalStorage<RHGoals>(STORAGE_KEY, {
    ...goals,
    absenteeismTarget: normalizeGoalValue(goals.absenteeismTarget, DEFAULT_RH_GOALS.absenteeismTarget),
    turnoverTarget: normalizeGoalValue(goals.turnoverTarget, DEFAULT_RH_GOALS.turnoverTarget),
    updatedAt: goals.updatedAt || new Date().toISOString(),
  });
}
