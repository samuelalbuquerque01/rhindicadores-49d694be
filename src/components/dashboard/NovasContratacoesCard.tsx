import { ChartCard } from "./ChartCard";
import { useContratacaoStats } from "@/hooks/useContratacoes";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, RefreshCw, ArrowRightLeft } from "lucide-react";

interface NovasContratacoesCardProps {
  filialId?: string;
}

export function NovasContratacoesCard({ filialId }: NovasContratacoesCardProps) {
  const { data: stats, isLoading } = useContratacaoStats(
    filialId === "all" ? undefined : filialId
  );

  if (isLoading) {
    return (
      <ChartCard title="Novas Contratações" subtitle="Este mês">
        <Skeleton className="h-[150px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Novas Contratações"
      subtitle="Este mês"
    >
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <UserPlus className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold text-foreground">{stats?.novasContratacoes || 0}</p>
          <p className="text-sm text-muted-foreground">Novas</p>
        </div>
        <div className="bg-info/10 rounded-lg p-4 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 text-info" />
          <p className="text-2xl font-bold text-foreground">{stats?.readmissoes || 0}</p>
          <p className="text-sm text-muted-foreground">Readmissões</p>
        </div>
        <div className="bg-warning/10 rounded-lg p-4 text-center">
          <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 text-warning" />
          <p className="text-2xl font-bold text-foreground">{stats?.transferencias || 0}</p>
          <p className="text-sm text-muted-foreground">Transferências</p>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-3xl font-bold text-primary">{stats?.totalMes || 0}</p>
        <p className="text-sm text-muted-foreground">Total de movimentações</p>
      </div>
    </ChartCard>
  );
}
