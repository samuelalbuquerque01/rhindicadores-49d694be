import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal } from "@/components/ui/Modal";

export interface EmployeeTimelineEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  sector: string;
  date: string;
  type: "hire" | "absence" | "vacation" | "promotion" | "termination";
  title: string;
  description?: string;
  durationDays?: number;
}

interface EmployeeTimelineProps {
  events: EmployeeTimelineEvent[];
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return format(parsed, "dd/MM/yyyy");
}

function parseDate(date: string): Date | null {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function typeLabel(type: EmployeeTimelineEvent["type"]): string {
  if (type === "hire") return "Contratacao";
  if (type === "absence") return "Afastamento";
  if (type === "vacation") return "Ferias";
  if (type === "promotion") return "Promocao";
  return "Desligamento";
}

export function EmployeeTimeline({ events }: EmployeeTimelineProps) {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("12m");
  const [selectedEvent, setSelectedEvent] = useState<EmployeeTimelineEvent | null>(null);

  const sectors = useMemo(
    () => Array.from(new Set(events.map((event) => event.sector).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [events],
  );

  const filtered = useMemo(() => {
    const now = new Date();
    const start = new Date(now);

    if (periodFilter === "30d") {
      start.setDate(now.getDate() - 30);
    } else if (periodFilter === "3m") {
      start.setMonth(now.getMonth() - 3);
    } else if (periodFilter === "6m") {
      start.setMonth(now.getMonth() - 6);
    } else {
      start.setMonth(now.getMonth() - 12);
    }

    return events
      .filter((event) => {
        if (search.trim().length > 0) {
          const term = search.trim().toLowerCase();
          const nameMatch = event.employeeName.toLowerCase().includes(term);
          const titleMatch = event.title.toLowerCase().includes(term);
          if (!nameMatch && !titleMatch) return false;
        }

        if (sectorFilter !== "all" && event.sector !== sectorFilter) {
          return false;
        }

        const date = parseDate(event.date);
        if (!date) return false;

        return date >= start && date <= now;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [events, periodFilter, search, sectorFilter]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Filtros da timeline</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Buscar colaborador ou evento"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {sectors.map((sector) => (
                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="12m">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <h3 className="text-base font-semibold text-foreground">Timeline de colaboradores</h3>
        {filtered.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum evento encontrado para este filtro.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {filtered.map((event) => (
              <button
                key={event.id}
                type="button"
                className="w-full text-left rounded-lg border border-border p-4 hover:bg-slate-50 transition"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{event.employeeName}</p>
                    <p className="text-sm text-slate-700">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(event.date)} | {event.sector} | {typeLabel(event.type)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
        title={selectedEvent ? `${selectedEvent.employeeName} - ${selectedEvent.title}` : "Detalhe do evento"}
      >
        {selectedEvent ? (
          <div className="space-y-3">
            <InfoRow label="Data" value={formatDate(selectedEvent.date)} />
            <InfoRow label="Setor" value={selectedEvent.sector} />
            <InfoRow label="Tipo" value={typeLabel(selectedEvent.type)} />
            {selectedEvent.durationDays ? (
              <InfoRow label="Duracao" value={`${selectedEvent.durationDays} dia(s)`} />
            ) : null}
            <div>
              <p className="text-xs text-muted-foreground">Descricao</p>
              <p className="text-sm text-foreground mt-1">
                {selectedEvent.description ?? "Sem detalhes disponiveis para este evento."}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
