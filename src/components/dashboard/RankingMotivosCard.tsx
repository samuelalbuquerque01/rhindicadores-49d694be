import { AlertTriangle, Building, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface RankingItem {
  id?: string;
  label: string;
  value: number;
  unit: string;
}

interface RankingMotivosCardProps {
  title: string;
  items: RankingItem[];
  setorDestaque?: string;
  setorLabel?: string;
  onEdit?: (item: RankingItem, index: number) => void;
  onDelete?: (item: RankingItem, index: number) => void;
}

const medalColors: Record<number, string> = {
  0: "from-amber-400 to-yellow-500",
  1: "from-slate-300 to-slate-400",
  2: "from-orange-400 to-amber-600",
};

export function RankingMotivosCard({
  title,
  items,
  setorDestaque,
  setorLabel = "Setor com maior impacto",
  onEdit,
  onDelete,
}: RankingMotivosCardProps) {
  if (!items.length) return null;

  return (
    <Card className="overflow-hidden border shadow-md">
      <CardHeader className="pb-2 border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {items.map((item, i) => (
            <div
              key={item.label}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 group"
            >
              {/* Ranking badge */}
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-xl border bg-gradient-to-br ${
                  medalColors[i] || "from-muted to-muted-foreground/20"
                } text-white font-bold text-sm shadow-sm shrink-0`}
              >
                #{i + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {item.label}
                </p>
                <Badge
                  variant="secondary"
                  className="mt-1 text-xs font-semibold"
                >
                  {item.value} {item.unit}
                </Badge>
              </div>

              {/* Action buttons */}
              {(onEdit || onDelete) && (
                <TooltipProvider delayDuration={200}>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    {onEdit && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            aria-label={`Editar ${item.label}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(item, i);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Editar</TooltipContent>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Excluir ${item.label}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item, i);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Excluir</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>
              )}
            </div>
          ))}
        </div>

        {/* Setor destaque */}
        {setorDestaque && (
          <div className="px-5 py-3 border-t bg-muted/20 flex items-center gap-2">
            <Building className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              {setorLabel}:{" "}
              <span className="font-semibold text-foreground">
                {setorDestaque}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
