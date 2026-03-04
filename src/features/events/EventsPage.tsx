import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePagination } from "@/hooks/usePagination";
import { useSetoresDisponiveis } from "@/hooks/useTurnoverAnalytics";
import {
  EventRecord,
  INSTITUTIONAL_EVENT_TYPES,
  InstitutionalEventType,
  filterInstitutionalEvents,
  persistInstitutionalEvents,
  readInstitutionalEvents,
  removeInstitutionalEvent,
  summarizeInstitutionalEventsByType,
  upsertInstitutionalEvent,
} from "@/lib/storage/eventsStorage";
import { EventFormModal } from "@/features/events/components/EventFormModal";
import { EventsTable } from "@/features/events/components/EventsTable";

interface EventsPageProps {
  filialId?: string;
}

export function EventsPage({ filialId: _filialId }: EventsPageProps) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const [search, setSearch] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<EventRecord | null>(null);

  const { data: setores = [], isLoading: loadingSetores, error: setoresError } = useSetoresDisponiveis();

  const {
    page,
    pageSize,
    totalCount,
    totalPages,
    setPage,
    setPageSize,
    setTotalCount,
  } = usePagination({ initialPage: 1, initialPageSize: 10 });

  useEffect(() => {
    setIsLoadingLocal(true);
    setEvents(readInstitutionalEvents());
    setIsLoadingLocal(false);
  }, []);

  const sectorOptions = useMemo(() => {
    const fromEvents = events.flatMap((event) => event.sectors);
    return [...new Set([...setores, ...fromEvents])].sort((left, right) => left.localeCompare(right));
  }, [events, setores]);

  const filteredEvents = useMemo(
    () =>
      filterInstitutionalEvents(events, {
        startDate: periodStart || undefined,
        endDate: periodEnd || undefined,
        type: typeFilter === "all" ? "all" : (typeFilter as InstitutionalEventType),
        sector: sectorFilter,
        search,
      }),
    [events, periodEnd, periodStart, search, sectorFilter, typeFilter],
  );

  const summaryByType = useMemo(() => summarizeInstitutionalEventsByType(filteredEvents), [filteredEvents]);

  useEffect(() => {
    setTotalCount(filteredEvents.length);
  }, [filteredEvents.length, setTotalCount]);

  const pagedEvents = useMemo(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return filteredEvents.slice(from, to);
  }, [filteredEvents, page, pageSize]);

  const errorMessage = setoresError ? "Falha ao carregar setores auxiliares." : null;

  const saveEvents = (nextEvents: EventRecord[]) => {
    setEvents(nextEvents);
    persistInstitutionalEvents(nextEvents);
  };

  const handleSaveEvent = (nextEvent: Omit<EventRecord, "auditTrail"> & { id?: string }) => {
    const next = upsertInstitutionalEvent(events, nextEvent);
    saveEvents(next);
    setEditingEvent(null);
  };

  const handleDeleteEvent = () => {
    if (!deletingEvent) return;
    const next = removeInstitutionalEvent(events, deletingEvent.id);
    saveEvents(next);
    setDeletingEvent(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CalendarClock className="h-5 w-5" />
                Eventos institucionais
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Registro oficial de acoes institucionais de RH.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo evento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            TODO: quando o backend de eventos institucionais estiver disponivel, migrar historico, tags e anexos do localStorage.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <div className="xl:col-span-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por titulo, tipo, local, organizador, tags..."
              />
            </div>

            <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[280px]">
                <SelectItem value="all">Todos os tipos</SelectItem>
                {INSTITUTIONAL_EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Filtros RH</span>
            </div>
          </div>

          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50 max-h-[280px]">
              <SelectItem value="all">Todos os setores</SelectItem>
              {sectorOptions.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {summaryByType.map((summary) => (
          <Card key={summary.type} className="bg-white">
            <CardContent className="p-3 text-center space-y-1">
              <p className="text-xs text-muted-foreground leading-tight">{summary.type}</p>
              <p className="text-xl font-semibold text-foreground">{summary.total}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historico de eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <EventsTable
            events={pagedEvents}
            page={page}
            pageSize={pageSize}
            totalItems={totalCount}
            totalPages={totalPages}
            isLoading={isLoadingLocal || loadingSetores}
            errorMessage={errorMessage}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onEdit={(event) => {
              setEditingEvent(event);
              setFormOpen(true);
            }}
            onDelete={(event) => setDeletingEvent(event)}
          />
        </CardContent>
      </Card>

      <EventFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        sectors={sectorOptions}
        initialEvent={editingEvent}
        onSave={handleSaveEvent}
      />

      <ConfirmDialog
        open={Boolean(deletingEvent)}
        onOpenChange={(open) => {
          if (!open) setDeletingEvent(null);
        }}
        title="Apagar evento?"
        description="Essa acao remove definitivamente o registro institucional."
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteEvent}
      />
    </div>
  );
}
