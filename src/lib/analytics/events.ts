import { endOfDay, isWithinInterval, parseISO, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export const RH_EVENT_TYPES = [
  "Afastamento",
  "Férias",
  "Desligamento",
  "Admissão",
  "Advertência",
  "Promoção/Movimentação",
  "Treinamento",
  "Outros",
] as const;

export type RHEventType = (typeof RH_EVENT_TYPES)[number];

export interface HREventRecord {
  id: string;
  type: RHEventType;
  employeeId: string | null;
  employeeName: string;
  sectorId: string | null;
  sectorName: string;
  startDate: string;
  endDate: string | null;
  reason: string;
  notes: string;
  attachmentUrl: string | null;
  createdAt: string;
}

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  type?: RHEventType | "all";
  sector?: string;
  employeeId?: string;
  search?: string;
}

const STORAGE_KEY = "rh-people-events-registry";

function safeParseDate(value: string): Date | null {
  try {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeEvent(input: Partial<HREventRecord>): HREventRecord | null {
  if (!input.id || !input.type || !input.startDate || !input.createdAt) {
    return null;
  }

  if (!RH_EVENT_TYPES.includes(input.type)) {
    return null;
  }

  return {
    id: input.id,
    type: input.type,
    employeeId: input.employeeId ?? null,
    employeeName: input.employeeName?.trim() || "Nao informado",
    sectorId: input.sectorId ?? null,
    sectorName: input.sectorName?.trim() || "Nao informado",
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    reason: input.reason?.trim() || "Nao informado",
    notes: input.notes?.trim() || "",
    attachmentUrl: input.attachmentUrl ?? null,
    createdAt: input.createdAt,
  };
}

export function sortEventsByDateDesc(events: HREventRecord[]): HREventRecord[] {
  return [...events].sort((left, right) => {
    const leftDate = safeParseDate(left.startDate)?.getTime() ?? 0;
    const rightDate = safeParseDate(right.startDate)?.getTime() ?? 0;
    if (rightDate !== leftDate) {
      return rightDate - leftDate;
    }
    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function readHREvents(): HREventRecord[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Partial<HREventRecord>[];
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map((item) => normalizeEvent(item))
      .filter((item): item is HREventRecord => item !== null);

    return sortEventsByDateDesc(normalized);
  } catch {
    return [];
  }
}

export function persistHREvents(events: HREventRecord[]): void {
  if (typeof window === "undefined") return;
  const sorted = sortEventsByDateDesc(events);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  void syncHREventsToBackend(sorted);
}

export function createEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function upsertHREvent(events: HREventRecord[], nextEvent: HREventRecord): HREventRecord[] {
  const next = [...events];
  const index = next.findIndex((item) => item.id === nextEvent.id);

  if (index >= 0) {
    next[index] = nextEvent;
  } else {
    next.push(nextEvent);
  }

  return sortEventsByDateDesc(next);
}

export function removeHREvent(events: HREventRecord[], eventId: string): HREventRecord[] {
  return events.filter((item) => item.id !== eventId);
}

export function filterHREvents(events: HREventRecord[], filters: EventFilters): HREventRecord[] {
  const { startDate, endDate, employeeId, sector, search, type } = filters;
  const normalizedSearch = search?.trim().toLowerCase() ?? "";

  const start = startDate ? safeParseDate(startDate) : null;
  const end = endDate ? safeParseDate(endDate) : null;

  return events.filter((event) => {
    if (type && type !== "all" && event.type !== type) {
      return false;
    }

    if (employeeId && employeeId !== "all" && event.employeeId !== employeeId) {
      return false;
    }

    if (sector && sector !== "all" && event.sectorName !== sector) {
      return false;
    }

    if (start || end) {
      const eventDate = safeParseDate(event.startDate);
      if (!eventDate) return false;

      if (start && end) {
        const inRange = isWithinInterval(eventDate, {
          start: startOfDay(start),
          end: endOfDay(end),
        });
        if (!inRange) return false;
      } else if (start && eventDate < startOfDay(start)) {
        return false;
      } else if (end && eventDate > endOfDay(end)) {
        return false;
      }
    }

    if (!normalizedSearch) {
      return true;
    }

    const bucket = [
      event.employeeName,
      event.sectorName,
      event.reason,
      event.notes,
      event.type,
    ]
      .join(" ")
      .toLowerCase();

    return bucket.includes(normalizedSearch);
  });
}

export function summarizeEventsByType(events: HREventRecord[]): Array<{ type: RHEventType; total: number }> {
  const counts = new Map<RHEventType, number>();

  RH_EVENT_TYPES.forEach((type) => counts.set(type, 0));
  events.forEach((event) => counts.set(event.type, (counts.get(event.type) ?? 0) + 1));

  return RH_EVENT_TYPES.map((type) => ({
    type,
    total: counts.get(type) ?? 0,
  }));
}

export function getEventTypeLabel(type: RHEventType): string {
  return type;
}

export function countDaysBetween(startDate: string, endDate?: string | null): number {
  const start = safeParseDate(startDate);
  if (!start) return 0;
  const end = endDate ? safeParseDate(endDate) : start;
  if (!end) return 0;

  const diff = Math.floor((endOfDay(end).getTime() - startOfDay(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
}

function toRemotePayload(event: HREventRecord) {
  return {
    id: event.id,
    type: event.type,
    employee_id: event.employeeId,
    employee_name: event.employeeName,
    sector_id: event.sectorId,
    sector_name: event.sectorName,
    start_date: event.startDate,
    end_date: event.endDate,
    reason: event.reason,
    notes: event.notes,
    attachment_url: event.attachmentUrl,
    created_at: event.createdAt,
  };
}

function fromRemoteRow(row: any): HREventRecord | null {
  return normalizeEvent({
    id: row.id,
    type: row.type,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    sectorId: row.sector_id,
    sectorName: row.sector_name,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    notes: row.notes,
    attachmentUrl: row.attachment_url,
    createdAt: row.created_at,
  });
}

async function syncHREventsToBackend(events: HREventRecord[]): Promise<void> {
  try {
    if (events.length === 0) return;
    const payloads = events.map(toRemotePayload);
    await supabase.from("hr_events").upsert(payloads as any, { onConflict: "id" });
  } catch {
    // silent fallback
  }
}

export async function fetchHREventsFromBackend(): Promise<HREventRecord[] | null> {
  try {
    const { data, error } = await supabase
      .from("hr_events")
      .select("*")
      .order("start_date", { ascending: false });

    if (error || !data) return null;

    return data
      .map((row: any) => fromRemoteRow(row))
      .filter((item): item is HREventRecord => item !== null);
  } catch {
    return null;
  }
}

export async function saveHREventToBackend(event: HREventRecord): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("hr_events")
      .upsert(toRemotePayload(event) as any, { onConflict: "id" });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteHREventFromBackend(eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("hr_events")
      .delete()
      .eq("id", eventId);
    return !error;
  } catch {
    return false;
  }
}
