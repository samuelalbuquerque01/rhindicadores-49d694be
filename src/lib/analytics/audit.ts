export interface AuditChange {
  field: string;
  fromValue: string;
  toValue: string;
  changedAt: string;
  changedBy: string;
}

export interface AuditTrailData {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  changes: AuditChange[];
}

export const SYSTEM_USER = "Usuario do sistema";

export function buildInitialAuditTrail(nowIso: string, user = SYSTEM_USER): AuditTrailData {
  return {
    createdAt: nowIso,
    createdBy: user,
    updatedAt: nowIso,
    updatedBy: user,
    changes: [],
  };
}

function toReadableValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(vazio)";
  if (Array.isArray(value)) return value.join(", ") || "(vazio)";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function buildAuditChanges<T extends Record<string, unknown>>(
  previous: T,
  next: T,
  labels: Partial<Record<keyof T, string>>,
  changedAt: string,
  changedBy = SYSTEM_USER,
): AuditChange[] {
  const changes: AuditChange[] = [];

  (Object.keys(labels) as Array<keyof T>).forEach((key) => {
    const oldValue = toReadableValue(previous[key]);
    const newValue = toReadableValue(next[key]);
    if (oldValue === newValue) return;

    changes.push({
      field: labels[key] || String(key),
      fromValue: oldValue,
      toValue: newValue,
      changedAt,
      changedBy,
    });
  });

  return changes;
}

export function mergeAuditTrail(
  trail: AuditTrailData,
  changes: AuditChange[],
  changedAt: string,
  changedBy = SYSTEM_USER,
): AuditTrailData {
  if (changes.length === 0) {
    return {
      ...trail,
      updatedAt: changedAt,
      updatedBy: changedBy,
    };
  }

  return {
    ...trail,
    updatedAt: changedAt,
    updatedBy: changedBy,
    changes: [changes[0], ...changes.slice(1), ...trail.changes].slice(0, 80),
  };
}
