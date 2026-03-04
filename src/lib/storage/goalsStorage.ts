import { readLocalStorage, writeLocalStorage } from "@/lib/storage/localStorage";
import { supabase } from "@/integrations/supabase/client";

export interface RHGoals {
  absenteeismTarget: number;
  turnoverTarget: number;
  updatedAt: string;
}

const STORAGE_KEY = "rh-dashboard-goals";
const GOALS_SCOPE_KEY = "global";

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

export async function fetchGoalsFromBackend(): Promise<RHGoals | null> {
  try {
    const { data, error } = await supabase
      .from("rh_goals")
      .select("absenteeism_target, turnover_target, updated_at")
      .eq("scope_key", GOALS_SCOPE_KEY)
      .maybeSingle();

    if (error || !data) return null;

    const goals: RHGoals = {
      absenteeismTarget: normalizeGoalValue(data.absenteeism_target, DEFAULT_RH_GOALS.absenteeismTarget),
      turnoverTarget: normalizeGoalValue(data.turnover_target, DEFAULT_RH_GOALS.turnoverTarget),
      updatedAt: data.updated_at || new Date().toISOString(),
    };

    persistGoals(goals);
    return goals;
  } catch {
    return null;
  }
}

export async function persistGoalsToBackend(goals: RHGoals): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("rh_goals")
      .upsert(
        {
          scope_key: GOALS_SCOPE_KEY,
          absenteeism_target: normalizeGoalValue(goals.absenteeismTarget, DEFAULT_RH_GOALS.absenteeismTarget),
          turnover_target: normalizeGoalValue(goals.turnoverTarget, DEFAULT_RH_GOALS.turnoverTarget),
          updated_by: "Usuario do sistema",
          updated_at: goals.updatedAt || new Date().toISOString(),
        },
        { onConflict: "scope_key" },
      );

    return !error;
  } catch {
    return false;
  }
}
