import { ChartCard } from "./ChartCard";
import { useEstagiariosStats } from "@/hooks/useEstagiarios";
import { ColaboradorForm } from "@/components/forms/ColaboradorForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, Clock } from "lucide-react";

interface EstagiariosCardProps {
  filialId?: string;
}

export function EstagiariosCard({ filialId }: EstagiariosCardProps) {
  const { data: stats, isLoading } = useEstagiariosStats(
    filialId === "all" ? undefined : filialId
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <ChartCard title="Estagiários" subtitle="Métricas específicas">
        <Skeleton className="h-[200px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Estagiários"
      subtitle="Métricas específicas de estagiários"
      action={<ColaboradorForm defaultTipo="Estagiário" />}
    >
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
          <p className="text-sm text-muted-foreground">Quantidade</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <DollarSign className="h-8 w-8 mx-auto mb-2 text-success" />
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(stats?.custoTotal || 0)}
          </p>
          <p className="text-sm text-muted-foreground">Custo Total</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
          <p className="text-2xl font-bold text-foreground">{stats?.taxaAbsenteismo || 0}%</p>
          <p className="text-sm text-muted-foreground">Absenteísmo</p>
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Custo médio por estagiário: {formatCurrency(stats?.custoMedio || 0)}
      </div>
    </ChartCard>
  );
}
