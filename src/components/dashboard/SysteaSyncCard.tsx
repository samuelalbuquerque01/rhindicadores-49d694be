import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SYSTEA_FORBIDDEN_MESSAGE, type SysteaSyncError, type SysteaSyncSummary, useSysteaLastRun, useSysteaSync } from "@/features/systea-sync/useSysteaSync";

function readableDate(value: string | null | undefined): string {
  if (!value) return "Nenhuma sincronização concluída";
  return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

interface SummaryProps {
  summary: SysteaSyncSummary;
  title: string;
}

function Summary({ summary, title }: SummaryProps) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
      <p className="mb-2 font-medium">{title}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Encontrados</dt><dd>{summary.fetched}</dd></div>
        <div><dt className="text-muted-foreground">Novos</dt><dd>{summary.created}</dd></div>
        <div><dt className="text-muted-foreground">Atualizados</dt><dd>{summary.updated}</dd></div>
        <div><dt className="text-muted-foreground">Inalterados</dt><dd>{summary.unchanged}</dd></div>
        <div><dt className="text-muted-foreground">Ignorados</dt><dd>{summary.skipped}</dd></div>
        <div><dt className="text-muted-foreground">Erros</dt><dd>{summary.errors}</dd></div>
      </dl>
    </div>
  );
}

export function SysteaSyncCard() {
  const [dryRunSummary, setDryRunSummary] = useState<SysteaSyncSummary | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: lastRun, error: lastRunError } = useSysteaLastRun(!!session);
  const { dryRun, sync, isPending } = useSysteaSync();
  const forbidden = (lastRunError as SysteaSyncError | null)?.status === 403;

  if (session === null) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5" />Integração Systea</CardTitle>
          <CardDescription>Faça login para sincronizar dados do Systea.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild><Link to="/login?next=/">Entrar</Link></Button>
        </CardContent>
      </Card>
    );
  }

  if (forbidden) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5" />Integração Systea</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{SYSTEA_FORBIDDEN_MESSAGE}</p>
        </CardContent>
      </Card>
    );
  }

  const handleDryRun = async () => {
    try {
      const summary = await dryRun();
      setDryRunSummary(summary);
      toast.success("Prévia da sincronização concluída. Nenhum dado foi alterado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível executar a prévia do Systea.");
    }
  };

  const handleSync = async () => {
    try {
      const summary = await sync();
      setDryRunSummary(summary);
      setConfirmationOpen(false);
      toast.success("Sincronização com Systea concluída.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível sincronizar com o Systea.");
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5" />
          Integração Systea
        </CardTitle>
        <CardDescription>
          Última sincronização: {readableDate(lastRun?.finished_at)}{lastRun ? ` (${lastRun.status})` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastRun && (
          <div className="text-sm text-muted-foreground">
            Última execução: {lastRun.fetched} encontrados, {lastRun.created} novos, {lastRun.updated} atualizados e {lastRun.errors} erros.
          </div>
        )}
        {dryRunSummary && <Summary summary={dryRunSummary} title={dryRunSummary.mode === "dry-run" ? "Resultado da prévia" : "Resultado da sincronização"} />}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleDryRun} disabled={isPending}>
            <RefreshCw className="h-4 w-4" />
            {isPending ? "Processando..." : "Executar dry-run"}
          </Button>
          <Button onClick={() => setConfirmationOpen(true)} disabled={isPending}>
            <RefreshCw className="h-4 w-4" />
            Sincronizar com Systea
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Registros sem classificação determinística de vínculo são ignorados e exigem revisão manual.
        </p>
      </CardContent>

      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar sincronização com Systea</AlertDialogTitle>
            <AlertDialogDescription>
              Os dados profissionais controlados pelo Systea serão atualizados. Dados locais e colaboradores ausentes na API serão preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSync} disabled={isPending}>
              Confirmar sincronização
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}