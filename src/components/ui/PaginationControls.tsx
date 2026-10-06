import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  totalPages,
  pageSizeOptions = [10, 25, 50],
  isLoading,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-md border border-border bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="text-center text-sm text-muted-foreground sm:text-left" aria-live="polite">
        Mostrando {start}–{end} de {totalItems}
        {isLoading && <span className="ml-2">Carregando...</span>}
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-full bg-background sm:w-[132px]">
            <SelectValue placeholder="Itens" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} / página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            Anterior
          </Button>
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
