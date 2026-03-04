import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp, Edit2, Trash2, Link2, Building2, User2 } from "lucide-react";
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
import { EventRecord } from "@/lib/storage/eventsStorage";
import { AuditTrail } from "@/components/ui/AuditTrail";

interface EventsTableProps {
  events: EventRecord[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  isLoading?: boolean;
  errorMessage?: string | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (event: EventRecord) => void;
  onDelete: (event: EventRecord) => void;
}

function formatDate(value: string): string {
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
              <TableHead className="w-[44px]" />
              <TableHead>Titulo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Setores</TableHead>
              <TableHead>Participantes</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const expanded = expandedId === event.id;
              return (
                <Fragment key={event.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedId(expanded ? null : event.id)}
                        aria-label={expanded ? "Ocultar detalhes" : "Expandir detalhes"}
                      >
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.type}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(event.date)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {event.sectors.slice(0, 2).map((sector) => (
                          <Badge key={sector} variant="secondary">
                            {sector}
                          </Badge>
                        ))}
                        {event.sectors.length > 2 ? <Badge variant="outline">+{event.sectors.length - 2}</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>{event.estimatedParticipants ?? "-"}</TableCell>
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
                  {expanded ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="rounded-md border bg-muted/20 p-3 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                Local e setores
                              </p>
                              <p className="text-sm">{event.location || "Nao informado"}</p>
                              <p className="text-xs text-muted-foreground">{event.sectors.join(", ") || "Sem setores"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                <User2 className="h-3.5 w-3.5" />
                                Organizador
                              </p>
                              <p className="text-sm">{event.organizer || "Nao informado"}</p>
                              <p className="text-xs text-muted-foreground">
                                Participantes estimados: {event.estimatedParticipants ?? "-"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Descricao</p>
                            <p className="text-sm">{event.description || "Sem descricao"}</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {event.tags.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sem tags</p>
                            ) : (
                              event.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  {tag}
                                </Badge>
                              ))
                            )}
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Anexos</p>
                            {event.attachments.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sem anexos</p>
                            ) : (
                              <div className="space-y-1">
                                {event.attachments.map((attachment) => (
                                  <a
                                    key={attachment.id}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
                                  >
                                    <Link2 className="h-3.5 w-3.5" />
                                    {attachment.name}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          <AuditTrail trail={event.auditTrail} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {events.map((event) => {
          const expanded = expandedId === event.id;
          return (
            <article key={event.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">{event.type}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(event.date)}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.location || "Sem local"}</p>
              </div>
              <p className="text-sm text-foreground line-clamp-2">{event.description || "Sem descricao"}</p>
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setExpandedId(expanded ? null : event.id)}>
                  {expanded ? "Ocultar detalhes" : "Ver detalhes"}
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete(event)}>
                    Apagar
                  </Button>
                </div>
              </div>
              {expanded ? (
                <div className="rounded-md border bg-muted/20 p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Setores: {event.sectors.join(", ") || "-"}</p>
                  <p className="text-xs text-muted-foreground">Organizador: {event.organizer || "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    Participantes estimados: {event.estimatedParticipants ?? "-"}
                  </p>
                  <AuditTrail trail={event.auditTrail} />
                </div>
              ) : null}
            </article>
          );
        })}
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
