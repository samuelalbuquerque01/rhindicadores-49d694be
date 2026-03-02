import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTreinamentosStats } from "@/hooks/useTreinamentos";

interface TreinamentosInsightsCardProps {
  filialId?: string;
}

export function TreinamentosInsightsCard({ filialId }: TreinamentosInsightsCardProps) {
  const { data: stats, isLoading } = useTreinamentosStats(
    filialId === "all" ? undefined : filialId
  );

  const topTreinamentos = stats?.topTreinamentos || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treinamentos mais realizados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : topTreinamentos.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sem dados suficientes</div>
        ) : (
          <div className="space-y-2">
            {topTreinamentos.map((treinamento, index) => (
              <div
                key={`${treinamento.nome}-${index}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{treinamento.nome}</span>
                <span className="text-muted-foreground">{treinamento.total} participacoes</span>
              </div>
            ))}
          </div>
        )}
        <div className="pt-3 border-t border-border/60 text-sm flex items-center justify-between">
          <span className="text-muted-foreground">Setor com maior engajamento</span>
          <span className="font-medium">{stats?.setorMaiorEngajamento || "-"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
