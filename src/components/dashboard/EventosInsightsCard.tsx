import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEventosStats } from "@/hooks/useEventos";

interface EventosInsightsCardProps {
  filialId?: string;
}

export function EventosInsightsCard({ filialId }: EventosInsightsCardProps) {
  const { data: stats, isLoading } = useEventosStats(
    filialId === "all" ? undefined : filialId
  );

  const topEventos = stats?.topEventos || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos com maior engajamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : topEventos.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sem dados suficientes</div>
        ) : (
          <div className="space-y-2">
            {topEventos.map((evento, index) => (
              <div
                key={`${evento.nome}-${index}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{evento.nome}</span>
                <span className="text-muted-foreground">{evento.total} presencas</span>
              </div>
            ))}
          </div>
        )}
        <div className="pt-3 border-t border-border/60 text-sm flex items-center justify-between">
          <span className="text-muted-foreground">Setor mais presente</span>
          <span className="font-medium">{stats?.setorMaisEngajado || "-"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
