import { Edit2, Trash2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/PaginationControls";
import type { HREventRecord } from "@/lib/analytics/events";

interface EventsTableProps {
  events: HREventRecord[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  isLoading?: boolean;
  errorMessage?: string | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (event: HREventRecord) => void;
  onDelete: (event: HREventRecord) => void;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function EventsTable({
  events,
  page,
  pageSize,
  totalItems,
  totalPages,
  isLoading = false,
  errorMessage,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: EventsTableProps) {
  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Carregando eventos...</div>;
  }

  if (errorMessage) {
    return <div className="py-12 text-center text-sm text-destructive">{errorMessage}</div>;
  }

  if (totalItems === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Nenhum evento encontrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-center">Anexo</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <Badge variant="outline">{event.type}</Badge>
                </TableCell>
                <TableCell className="font-medium">{event.employeeName}</TableCell>
                <TableCell>{event.sectorName || "-"}</TableCell>
                <TableCell>{formatDate(event.startDate)}</TableCell>
                <TableCell>{formatDate(event.endDate)}</TableCell>
                <TableCell className="max-w-[280px] truncate">{event.reason}</TableCell>
                <TableCell className="text-center">
                  {event.attachmentUrl ? (
                    <a
                      href={event.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-primary hover:underline"
                    >
                      <Link2 className="h-4 w-4" />
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(event)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(event)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {events.map((event) => (
          <article key={event.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline">{event.type}</Badge>
              <span className="text-xs text-muted-foreground">{formatDate(event.startDate)}</span>
            </div>
            <div>
              <p className="font-medium text-foreground">{event.employeeName}</p>
              <p className="text-xs text-muted-foreground">{event.sectorName || "Sem setor"}</p>
            </div>
            <p className="text-sm text-foreground">{event.reason}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Fim: {formatDate(event.endDate)}</span>
              {event.attachmentUrl ? (
                <a href={event.attachmentUrl} target="_blank" rel="noreferrer" className="text-primary">
                  Ver anexo
                </a>
              ) : (
                <span>Sem anexo</span>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(event)}>
                <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" />
                Apagar
              </Button>
            </div>
          </article>
        ))}
      </div>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
