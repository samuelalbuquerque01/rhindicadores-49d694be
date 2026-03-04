import { Target, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RHGoals } from "@/lib/storage/goalsStorage";

interface GoalsCardProps {
  goals: RHGoals;
  onEdit: () => void;
}

export function GoalsCard({ goals, onEdit }: GoalsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base inline-flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas do mes
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <PencilLine className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="flex items-center justify-between">
          <span>Absenteismo</span>
          <strong>&lt;= {goals.absenteeismTarget.toFixed(2)}%</strong>
        </p>
        <p className="flex items-center justify-between">
          <span>Turnover</span>
          <strong>&lt;= {goals.turnoverTarget.toFixed(2)}%</strong>
        </p>
        <p className="text-xs text-muted-foreground pt-1">
          {goals.updatedAt ? `Atualizado em ${new Date(goals.updatedAt).toLocaleDateString("pt-BR")}` : "Sem atualizacao manual"}
        </p>
      </CardContent>
    </Card>
  );
}
