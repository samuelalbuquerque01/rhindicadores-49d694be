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
import { useColaboradores } from "@/hooks/useColaboradores";
import { useSetoresDisponiveis } from "@/hooks/useTurnoverAnalytics";
import {
  filterHREvents,
  persistHREvents,
  readHREvents,
  removeHREvent,
  RH_EVENT_TYPES,
  summarizeEventsByType,
  type HREventRecord,
  type RHEventType,
  upsertHREvent,
} from "@/lib/analytics/events";
import { EventFormModal, type EventEmployeeOption } from "@/features/events/components/EventFormModal";
import { EventsTable } from "@/features/events/components/EventsTable";

interface EventsPageProps {
  filialId?: string;
}

export function EventsPage({ filialId }: EventsPageProps) {
  const effectiveFilialId = filialId === "all" ? undefined : filialId;
  const [events, setEvents] = useState<HREventRecord[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const [search, setSearch] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HREventRecord | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<HREventRecord | null>(null);

  const { data: colaboradores = [], isLoading: loadingColaboradores, error: colaboradoresError } = useColaboradores({
    filialId: effectiveFilialId,
  });
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
    setEvents(readHREvents());
    setIsLoadingLocal(false);
  }, []);

  const employeeOptions = useMemo<EventEmployeeOption[]>(
    () =>
      colaboradores.map((colaborador) => ({
        id: colaborador.id,
        name: colaborador.nome,
        sectorName: colaborador.departamento,
      })),
    [colaboradores],
  );

  const sectorOptions = useMemo(() => {
    const dynamicFromEmployees = colaboradores.map((colaborador) => colaborador.departamento).filter(Boolean) as string[];
    return [...new Set([...dynamicFromEmployees, ...setores])].sort((left, right) => left.localeCompare(right));
  }, [colaboradores, setores]);

  const filteredEvents = useMemo(
    () =>
      filterHREvents(events, {
        startDate: periodStart || undefined,
        endDate: periodEnd || undefined,
        type: typeFilter === "all" ? "all" : (typeFilter as RHEventType),
        sector: sectorFilter,
        employeeId: employeeFilter,
        search,
      }),
    [employeeFilter, events, periodEnd, periodStart, search, sectorFilter, typeFilter],
  );

  const summaryByType = useMemo(() => summarizeEventsByType(filteredEvents), [filteredEvents]);

  useEffect(() => {
    setTotalCount(filteredEvents.length);
  }, [filteredEvents.length, setTotalCount]);

  const pagedEvents = useMemo(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return filteredEvents.slice(from, to);
  }, [filteredEvents, page, pageSize]);

  const hasError = Boolean(colaboradoresError || setoresError);
  const errorMessage = hasError
    ? "Falha ao carregar dados auxiliares (colaboradores/setores)."
    : null;

  const saveEvents = (nextEvents: HREventRecord[]) => {
    setEvents(nextEvents);
    persistHREvents(nextEvents);
  };

  const handleSaveEvent = (nextEvent: HREventRecord) => {
    const next = upsertHREvent(events, nextEvent);
    saveEvents(next);
    setEditingEvent(null);
  };

  const handleDeleteEvent = () => {
    if (!deletingEvent) return;
    const next = removeHREvent(events, deletingEvent.id);
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
                Registro de ocorrencias de RH
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Fonte de verdade para eventos de pessoas.
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
            TODO: conectar este registro de eventos a uma tabela dedicada no backend para auditoria centralizada.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <div className="xl:col-span-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por colaborador, setor, motivo ou observacao"
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
                {RH_EVENT_TYPES.map((type) => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Colaborador" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[280px]">
                <SelectItem value="all">Todos os colaboradores</SelectItem>
                {employeeOptions.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            isLoading={isLoadingLocal || loadingColaboradores || loadingSetores}
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
        employees={employeeOptions}
        sectors={sectorOptions}
        initialEvent={editingEvent}
        onSave={handleSaveEvent}
      />

      <ConfirmDialog
        open={Boolean(deletingEvent)}
        onOpenChange={(open) => {
          if (!open) setDeletingEvent(null);
        }}
        title="Apagar evento de RH?"
        description="Essa acao remove definitivamente o registro da lista de ocorrencias."
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteEvent}
      />
    </div>
  );
}
