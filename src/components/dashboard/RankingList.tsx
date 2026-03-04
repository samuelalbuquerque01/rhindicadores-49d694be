import { RankingItem, RankingItemData } from "@/components/dashboard/RankingItem";

interface RankingListProps {
  title: string;
  items: RankingItemData[];
  emptyMessage?: string;
  onEdit?: (item: RankingItemData) => void;
  onDelete?: (item: RankingItemData) => void;
}

export function RankingList({
  title,
  items,
  emptyMessage = "No ranking data available.",
  onEdit,
  onDelete,
}: RankingListProps) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <RankingItem
              key={item.id}
              rank={index + 1}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
