import {
  AuditTrailData,
  SYSTEM_USER,
  buildAuditChanges,
  buildInitialAuditTrail,
  mergeAuditTrail,
} from "@/lib/analytics/audit";
import { endOfDay, isWithinInterval, parseISO, startOfDay } from "date-fns";
import { readLocalStorage, writeLocalStorage } from "@/lib/storage/localStorage";

export const INSTITUTIONAL_EVENT_TYPES = [
  "Confraternizacao",
  "Palestra",
  "Campanha interna",
  "Reuniao geral",
  "Workshop",
  "Comunicacao interna",
  "Acao social",
  "Outro",
] as const;

export type InstitutionalEventType = (typeof INSTITUTIONAL_EVENT_TYPES)[number];

export interface LocalAttachment {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface EventRecord {
  id: string;
  title: string;
  type: InstitutionalEventType;
  date: string;
  location: string;
  organizer: string;
  sectors: string[];
  estimatedParticipants: number | null;
  description: string;
  tags: string[];
  attachments: LocalAttachment[];
  auditTrail: AuditTrailData;
}

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  type?: InstitutionalEventType | "all";
  sector?: string;
  search?: string;
}

interface SerializedEventRecord extends Omit<EventRecord, "estimatedParticipants"> {
  estimatedParticipants: number | null;
}

const STORAGE_KEY = "rh-events-institutional-v2";

const AUDIT_LABELS: Partial<Record<keyof EventRecord, string>> = {
  title: "titulo",
  type: "tipo",
  date: "data",
  location: "local",
  organizer: "organizador",
  sectors: "setores",
  estimatedParticipants: "participantes estimados",
  description: "descricao",
  tags: "tags",
  attachments: "anexos",
};

function normalizeType(value: unknown): InstitutionalEventType {
  if (typeof value !== "string") return "Outro";

  const found = INSTITUTIONAL_EVENT_TYPES.find((item) => item === value);
  return found ?? "Outro";
}

function safeDate(value: string): Date | null {
  try {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function normalizeAttachments(value: unknown): LocalAttachment[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const typed = item as Partial<LocalAttachment>;
      if (!typed.id || !typed.name || !typed.url || !typed.uploadedAt) return null;

      return {
        id: String(typed.id),
        name: String(typed.name),
        url: String(typed.url),
        uploadedAt: String(typed.uploadedAt),
      };
    })
    .filter((item): item is LocalAttachment => item !== null);
}

function normalizeAudit(value: unknown, fallbackIso: string): AuditTrailData {
  if (!value || typeof value !== "object") {
    return buildInitialAuditTrail(fallbackIso);
  }

  const typed = value as Partial<AuditTrailData>;
  return {
    createdAt: typed.createdAt || fallbackIso,
    createdBy: typed.createdBy || SYSTEM_USER,
    updatedAt: typed.updatedAt || fallbackIso,
    updatedBy: typed.updatedBy || SYSTEM_USER,
    changes: Array.isArray(typed.changes) ? typed.changes : [],
  };
}

function normalizeRecord(value: Partial<SerializedEventRecord>): EventRecord | null {
  if (!value.id || !value.title || !value.date) return null;
  const nowIso = new Date().toISOString();

  return {
    id: String(value.id),
    title: String(value.title).trim(),
    type: normalizeType(value.type),
    date: String(value.date),
    location: typeof value.location === "string" ? value.location.trim() : "",
    organizer: typeof value.organizer === "string" ? value.organizer.trim() : "",
    sectors: normalizeStringArray(value.sectors),
    estimatedParticipants:
      typeof value.estimatedParticipants === "number" && value.estimatedParticipants >= 0
        ? value.estimatedParticipants
        : null,
    description: typeof value.description === "string" ? value.description.trim() : "",
    tags: normalizeStringArray(value.tags),
    attachments: normalizeAttachments(value.attachments),
    auditTrail: normalizeAudit(value.auditTrail, nowIso),
  };
}

function sortByDateDesc(items: EventRecord[]): EventRecord[] {
  return [...items].sort((left, right) => {
    const leftTs = safeDate(left.date)?.getTime() ?? 0;
    const rightTs = safeDate(right.date)?.getTime() ?? 0;
    if (rightTs !== leftTs) return rightTs - leftTs;

    return right.auditTrail.updatedAt.localeCompare(left.auditTrail.updatedAt);
  });
}

export function createEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createAttachmentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `att-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readInstitutionalEvents(): EventRecord[] {
  const raw = readLocalStorage<Partial<SerializedEventRecord>[]>(STORAGE_KEY, []);
  const normalized = raw
    .map((item) => normalizeRecord(item))
    .filter((item): item is EventRecord => item !== null);

  return sortByDateDesc(normalized);
}

export function persistInstitutionalEvents(events: EventRecord[]): void {
  writeLocalStorage(STORAGE_KEY, sortByDateDesc(events));
}

export function upsertInstitutionalEvent(
  existing: EventRecord[],
  candidate: Omit<EventRecord, "auditTrail"> & { id?: string; auditTrail?: AuditTrailData },
): EventRecord[] {
  const nowIso = new Date().toISOString();
  const eventId = candidate.id || createEventId();
  const found = existing.find((item) => item.id === eventId);

  if (!found) {
    const created: EventRecord = {
      ...candidate,
      id: eventId,
      auditTrail: candidate.auditTrail ?? buildInitialAuditTrail(nowIso),
    };
    return sortByDateDesc([...existing, created]);
  }

  const nextValue: EventRecord = {
    ...found,
    ...candidate,
    id: eventId,
  };

  const changes = buildAuditChanges(found, nextValue, AUDIT_LABELS, nowIso);

  const updated: EventRecord = {
    ...nextValue,
    auditTrail: mergeAuditTrail(found.auditTrail, changes, nowIso),
  };

  return sortByDateDesc(existing.map((item) => (item.id === eventId ? updated : item)));
}

export function removeInstitutionalEvent(events: EventRecord[], id: string): EventRecord[] {
  return events.filter((item) => item.id !== id);
}

export function filterInstitutionalEvents(events: EventRecord[], filters: EventFilters): EventRecord[] {
  const normalizedSearch = (filters.search || "").trim().toLowerCase();
  const start = filters.startDate ? safeDate(filters.startDate) : null;
  const end = filters.endDate ? safeDate(filters.endDate) : null;

  return events.filter((event) => {
    if (filters.type && filters.type !== "all" && event.type !== filters.type) return false;
    if (filters.sector && filters.sector !== "all" && !event.sectors.includes(filters.sector)) return false;

    const eventDate = safeDate(event.date);
    if (start || end) {
      if (!eventDate) return false;
      if (start && end) {
        if (
          !isWithinInterval(eventDate, {
            start: startOfDay(start),
            end: endOfDay(end),
          })
        ) {
          return false;
        }
      } else if (start && eventDate < startOfDay(start)) {
        return false;
      } else if (end && eventDate > endOfDay(end)) {
        return false;
      }
    }

    if (!normalizedSearch) return true;

    const bucket = [
      event.title,
      event.type,
      event.location,
      event.organizer,
      event.description,
      event.tags.join(" "),
      event.sectors.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return bucket.includes(normalizedSearch);
  });
}

export function summarizeInstitutionalEventsByType(events: EventRecord[]): Array<{ type: InstitutionalEventType; total: number }> {
  const counters = new Map<InstitutionalEventType, number>();
  INSTITUTIONAL_EVENT_TYPES.forEach((type) => counters.set(type, 0));
  events.forEach((event) => counters.set(event.type, (counters.get(event.type) ?? 0) + 1));

  return INSTITUTIONAL_EVENT_TYPES.map((type) => ({
    type,
    total: counters.get(type) ?? 0,
  }));
}
