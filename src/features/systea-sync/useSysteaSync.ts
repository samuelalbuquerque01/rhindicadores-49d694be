import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SysteaSyncSummary {
  mode: "dry-run" | "sync";
  fetched: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  errors: number;
  startedAt: string;
  finishedAt: string;
  runId?: string;
}

export interface SysteaSyncRun {
  id: string;
  mode: "dry-run" | "sync";
  status: "completed" | "failed";
  started_at: string;
  finished_at: string | null;
  fetched: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  errors: number;
  error_summary: string | null;
}

async function invokeSysteaSync<T>(mode: "dry-run" | "sync" | "last-run"): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("systea-employee-sync", { body: { mode } });
  if (error) throw error;
  return data;
}

export function useSysteaLastRun() {
  return useQuery({
    queryKey: ["systea-sync-last-run"],
    queryFn: async () => (await invokeSysteaSync<{ run: SysteaSyncRun | null }>("last-run")).run,
    retry: false,
  });
}

export function useSysteaSync() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (mode: "dry-run" | "sync") => invokeSysteaSync<SysteaSyncSummary>(mode),
    onSuccess: (_result, mode) => {
      queryClient.invalidateQueries({ queryKey: ["systea-sync-last-run"] });
      if (mode === "sync") {
        queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
        queryClient.invalidateQueries({ queryKey: ["colaboradores-paginados"] });
        queryClient.invalidateQueries({ queryKey: ["colaboradores-stats"] });
      }
    },
  });

  return {
    dryRun: () => mutation.mutateAsync("dry-run"),
    sync: () => mutation.mutateAsync("sync"),
    isPending: mutation.isPending,
  };
}