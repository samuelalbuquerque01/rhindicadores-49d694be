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

export const SYSTEA_FORBIDDEN_MESSAGE = "Você não possui permissão para sincronizar dados do Systea.";
export const SYSTEA_UNAUTHENTICATED_MESSAGE = "Faça login para sincronizar dados do Systea.";

export class SysteaSyncError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export interface ClinicReconciliationBatch {
  mode: "reconcile-clinics";
  total: number;
  offset: number;
  nextOffset: number;
  done: boolean;
  analyzed: number;
  corrected: number;
  withClinics: number;
  withoutClinics: number;
  mappingFailures: number;
  persistenceFailures: number;
  fetchFailures: number;
  manualReview: { systea_admin_id: number | null; reason: string }[];
}

async function invokeSysteaSync<T>(mode: "dry-run" | "sync" | "last-run" | "reconcile-clinics", offset?: number): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new SysteaSyncError(SYSTEA_UNAUTHENTICATED_MESSAGE, 401);
  const { data, error } = await supabase.functions.invoke<T>("systea-employee-sync", { body: { mode, ...(offset === undefined ? {} : { offset }) } });
  if (error) {
    const status = (error as { context?: Response }).context?.status;
    if (status === 401) throw new SysteaSyncError(SYSTEA_UNAUTHENTICATED_MESSAGE, 401);
    if (status === 403) throw new SysteaSyncError(SYSTEA_FORBIDDEN_MESSAGE, 403);
    let message = "Não foi possível comunicar com o Systea.";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = String(body.error);
    } catch { /* ignore */ }
    throw new SysteaSyncError(message, status);
  }
  return data as T;
}

export function useSysteaLastRun(enabled = true) {
  return useQuery({
    queryKey: ["systea-sync-last-run"],
    queryFn: async () => (await invokeSysteaSync<{ run: SysteaSyncRun | null }>("last-run")).run,
    retry: false,
    enabled,
  });
}

export function useSysteaSync() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (mode: "dry-run" | "sync") => invokeSysteaSync<SysteaSyncSummary>(mode),
    onSettled: (_result, _error, mode) => {
      queryClient.invalidateQueries({ queryKey: ["systea-sync-last-run"] });
      if (mode === "sync") {
        queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
        queryClient.invalidateQueries({ queryKey: ["colaboradores-paginados"] });
        queryClient.invalidateQueries({ queryKey: ["colaboradores-stats"] });
        queryClient.invalidateQueries({ queryKey: ["colaborador-filiais"] });
        queryClient.invalidateQueries({ queryKey: ["colaborador-detail"] });
      }
    },
  });

  return {
    dryRun: () => mutation.mutateAsync("dry-run"),
    sync: () => mutation.mutateAsync("sync"),
    isPending: mutation.isPending,
  };
}

export function useSysteaClinicReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (onBatch: (batch: ClinicReconciliationBatch) => void) => {
      let offset = 0;
      for (;;) {
        const batch = await invokeSysteaSync<ClinicReconciliationBatch>("reconcile-clinics", offset);
        if (!Number.isSafeInteger(batch.nextOffset) || (!batch.done && batch.nextOffset <= offset)) {
          throw new Error("A recuperação não avançou. Execute novamente para tentar os registros pendentes.");
        }
        onBatch(batch);
        if (batch.done) return;
        offset = batch.nextOffset;
      }
    },
    onSettled: async () => {
      await Promise.all(["colaboradores", "colaboradores-paginados", "colaboradores-stats", "colaborador-filiais", "colaborador-detail"]
        .map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });
}
