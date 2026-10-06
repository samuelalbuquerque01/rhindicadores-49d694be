import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RankingItemData {
  id: string;
  label: string;
  value: number;
  unit?: string;
}

interface RankingItemProps {
  rank: number;
  item: RankingItemData;
  onEdit?: (item: RankingItemData) => void;
  onDelete?: (item: RankingItemData) => void;
}

export function RankingItem({ rank, item, onEdit, onDelete }: RankingItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 p-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="h-7 w-7 rounded-full bg-muted text-muted-foreground text-xs font-semibold tabular-nums inline-flex items-center justify-center">
          #{rank}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
          <span className="inline-flex items-center rounded-full bg-neutral-soft px-2 py-0.5 text-xs text-neutral-fg tabular-nums mt-1">
            {item.value.toFixed(0)} {item.unit ?? ""}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onEdit ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Editar ${item.label}`}
            onClick={() => onEdit(item)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            aria-label={`Excluir ${item.label}`}
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
