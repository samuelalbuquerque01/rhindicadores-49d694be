import {
  AuditTrailData,
  SYSTEM_USER,
  buildAuditChanges,
  buildInitialAuditTrail,
  mergeAuditTrail,
} from "@/lib/analytics/audit";
import { readLocalStorage, writeLocalStorage } from "@/lib/storage/localStorage";
import type { LocalAttachment } from "@/lib/storage/eventsStorage";

const STORAGE_KEY = "rh-trainings-extra-v2";
const STORAGE_EVENT = "rh-trainings-extra-updated";

export interface TrainingExtraData {
  trainingId: string;
  tags: string[];
  attachments: LocalAttachment[];
  auditTrail: AuditTrailData;
  snapshot: {
    nome: string;
    data_realizacao: string;
    setor_alvo: string;
    responsavel: string;
    carga_horaria: number;
    vagas_totais: number;
  } | null;
}

type SerializedTrainingExtraData = TrainingExtraData;

const AUDIT_LABELS: Partial<Record<keyof TrainingExtraData, string>> = {
  tags: "tags",
  attachments: "anexos",
  snapshot: "dados do treinamento",
};

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function normalizeAttachments(input: unknown): LocalAttachment[] {
  if (!Array.isArray(input)) return [];

  return input
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

function normalizeAudit(input: unknown, nowIso: string): AuditTrailData {
  if (!input || typeof input !== "object") {
    return buildInitialAuditTrail(nowIso);
  }

  const typed = input as Partial<AuditTrailData>;
  return {
    createdAt: typed.createdAt || nowIso,
    createdBy: typed.createdBy || SYSTEM_USER,
    updatedAt: typed.updatedAt || nowIso,
    updatedBy: typed.updatedBy || SYSTEM_USER,
    changes: Array.isArray(typed.changes) ? typed.changes : [],
  };
}

function normalizeTrainingExtra(input: Partial<SerializedTrainingExtraData>): TrainingExtraData | null {
  if (!input.trainingId) return null;
  const nowIso = new Date().toISOString();

  return {
    trainingId: String(input.trainingId),
    tags: normalizeTags(input.tags),
    attachments: normalizeAttachments(input.attachments),
    auditTrail: normalizeAudit(input.auditTrail, nowIso),
    snapshot:
      input.snapshot && typeof input.snapshot === "object"
        ? {
            nome: String((input.snapshot as Record<string, unknown>).nome || ""),
            data_realizacao: String((input.snapshot as Record<string, unknown>).data_realizacao || ""),
            setor_alvo: String((input.snapshot as Record<string, unknown>).setor_alvo || ""),
            responsavel: String((input.snapshot as Record<string, unknown>).responsavel || ""),
            carga_horaria: Number((input.snapshot as Record<string, unknown>).carga_horaria || 0),
            vagas_totais: Number((input.snapshot as Record<string, unknown>).vagas_totais || 0),
          }
        : null,
  };
}

export function createFallbackAttachmentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tr-att-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readTrainingsExtra(): TrainingExtraData[] {
  const raw = readLocalStorage<Partial<SerializedTrainingExtraData>[]>(STORAGE_KEY, []);
  return raw
    .map((item) => normalizeTrainingExtra(item))
    .filter((item): item is TrainingExtraData => item !== null);
}

export function readTrainingExtraById(trainingId: string): TrainingExtraData | null {
  return readTrainingsExtra().find((item) => item.trainingId === trainingId) ?? null;
}

export function persistTrainingsExtra(items: TrainingExtraData[]): void {
  writeLocalStorage(STORAGE_KEY, items);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

export function upsertTrainingExtra(
  trainingId: string,
  updates: Pick<TrainingExtraData, "tags" | "attachments"> & {
    snapshot?: TrainingExtraData["snapshot"];
  },
): TrainingExtraData {
  const nowIso = new Date().toISOString();
  const all = readTrainingsExtra();
  const previous = all.find((item) => item.trainingId === trainingId);

  if (!previous) {
    const created: TrainingExtraData = {
      trainingId,
      tags: updates.tags,
      attachments: updates.attachments,
      auditTrail: buildInitialAuditTrail(nowIso),
      snapshot: updates.snapshot || null,
    };
    persistTrainingsExtra([...all, created]);
    return created;
  }

  const next: TrainingExtraData = {
    ...previous,
    tags: updates.tags,
    attachments: updates.attachments,
    snapshot: updates.snapshot ?? previous.snapshot,
  };

  const changes = buildAuditChanges(previous, next, AUDIT_LABELS, nowIso);

  const updated: TrainingExtraData = {
    ...next,
    auditTrail: mergeAuditTrail(previous.auditTrail, changes, nowIso),
  };

  persistTrainingsExtra(all.map((item) => (item.trainingId === trainingId ? updated : item)));
  return updated;
}

export const TRAININGS_EXTRA_EVENT = STORAGE_EVENT;
