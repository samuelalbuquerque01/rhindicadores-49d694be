export const SYSTEA_MAX_PAGES = 100;

export type EmploymentType = "CLT Administrativo" | "CLT Corpo Clínico" | "PJ" | "Estagiário";
export type EmployeeStatus = "Ativo" | "Inativo" | "Em desligamento" | "Pendente";

export interface SysteaSector {
  label: string;
  value: number;
}

export interface SysteaAdminRecord {
  id?: number | string | null;
  sector_id?: number | string | null;
  area_operation_id?: number | string | null;
  laborite_regime?: string | null;
  admission_date?: string | null;
  first_day_work_date?: string | null;
  contracted_position?: string | null;
  workplace?: string | null;
  weekly_workload_attendances?: number | string | null;
  weekly_workload_total?: number | string | null;
  area?: { name?: string | null; type?: string | null } | null;
}

export interface SysteaEmployeeRecord {
  id?: number | string | null;
  name?: string | null;
  name_social?: string | null;
  email?: string | null;
  status?: string | null;
  is_shutdown?: number | boolean | string | null;
  updated_at?: string | null;
  admin?: SysteaAdminRecord | null;
}

export interface SysteaEmployeePage {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  data: SysteaEmployeeRecord[];
}

export interface NormalizedSysteaEmployee {
  systea_user_id: number;
  systea_admin_id: number;
  systea_sector_id: number | null;
  systea_area_operation_id: number | null;
  systea_status: string | null;
  systea_is_shutdown?: boolean;
  systea_updated_at: string | null;
  systea_regime_contratacao: string | null;
  systea_area_name: string | null;
  systea_area_type: string | null;
  nome?: string;
  email?: string;
  cargo?: string;
  departamento: string;
  data_admissao?: string;
  systea_primeiro_dia_trabalho?: string;
  systea_local_trabalho?: string;
  systea_carga_horaria_semanal_total?: number;
  systea_carga_horaria_atendimentos?: number;
  status: EmployeeStatus;
  tipo_colaborador?: EmploymentType;
}

export type ClassificationResult =
  | { kind: "classified"; value: EmploymentType }
  | { kind: "requires_manual_classification"; reason: "unknown_employment_type" };

export type NormalizationResult =
  | { kind: "normalized"; data: NormalizedSysteaEmployee }
  | { kind: "skipped"; reason: "requires_manual_classification" | "missing_integration_identifier" | "missing_required_create_fields" };

export interface LocalEmployeeForSync {
  id?: string;
  systea_admin_id?: number | null;
  tipo_colaborador?: string | null;
  [key: string]: unknown;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type SyncChange =
  | { kind: "create"; payload: Record<string, unknown> }
  | { kind: "update"; id: string; payload: Record<string, unknown> }
  | { kind: "unchanged" };

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizedKey(value: unknown): string | undefined {
  return text(value)?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function numericId(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function decimal(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function dateOnly(value: unknown): string | undefined {
  const candidate = text(value);
  if (!candidate) return undefined;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(candidate);
  return match ? match[1] : undefined;
}

function validLocalEmploymentType(value: unknown): value is EmploymentType {
  return value === "CLT Administrativo" || value === "CLT Corpo Clínico" || value === "PJ" || value === "Estagiário";
}

export function normalizeStatus(status: unknown, isShutdown: unknown): EmployeeStatus {
  const shutdown = shutdownValue(isShutdown) === true;
  if (shutdown || normalizedKey(status) === "shutdown") return "Em desligamento";
  if (normalizedKey(status) === "inactive") return "Inativo";
  if (normalizedKey(status) === "active") return "Ativo";
  return "Pendente";
}

function shutdownValue(value: unknown): boolean | undefined {
  if (value === 1 || value === true || text(value)?.toLowerCase() === "1") return true;
  if (value === 0 || value === false || text(value)?.toLowerCase() === "0") return false;
  return undefined;
}

export function classifyEmploymentType(regime: unknown, areaType: unknown): ClassificationResult {
  const regimeKey = normalizedKey(regime);
  const areaTypeKey = normalizedKey(areaType);

  if (regimeKey === "pj") return { kind: "classified", value: "PJ" };
  if (regimeKey === "estagio" || regimeKey === "estagiario") {
    return { kind: "classified", value: "Estagiário" };
  }
  if (regimeKey === "clt" && areaTypeKey === "attendance") {
    return { kind: "classified", value: "CLT Corpo Clínico" };
  }
  if (regimeKey === "clt" && areaTypeKey === "general") {
    return { kind: "classified", value: "CLT Administrativo" };
  }
  return { kind: "requires_manual_classification", reason: "unknown_employment_type" };
}

export function resolveSectorName(sectorId: unknown, sectors: ReadonlyMap<number, string>): string {
  const id = numericId(sectorId);
  if (id === null) return "Sem setor cadastrado";
  return sectors.get(id) ?? "Setor não encontrado";
}

export function sectorMap(sectors: readonly SysteaSector[]): Map<number, string> {
  const result = new Map<number, string>();
  for (const sector of sectors) {
    const id = numericId(sector.value);
    const label = text(sector.label);
    if (id !== null && label) result.set(id, label);
  }
  return result;
}

export function normalizeSysteaEmployee(
  employee: SysteaEmployeeRecord,
  sectors: ReadonlyMap<number, string>,
  local?: LocalEmployeeForSync,
): NormalizationResult {
  const admin = employee.admin;
  const systeaUserId = numericId(employee.id);
  const systeaAdminId = numericId(admin?.id);
  if (systeaUserId === null || systeaAdminId === null) {
    return { kind: "skipped", reason: "missing_integration_identifier" };
  }

  const classification = classifyEmploymentType(admin?.laborite_regime, admin?.area?.type);
  const localTypeIsValid = validLocalEmploymentType(local?.tipo_colaborador);
  if (classification.kind === "requires_manual_classification") {
    return { kind: "skipped", reason: "requires_manual_classification" };
  }

  const nome = text(employee.name_social) ?? text(employee.name);
  const cargo = text(admin?.contracted_position);
  const dataAdmissao = dateOnly(admin?.admission_date);
  if (!local && (!nome || !cargo || !dataAdmissao)) {
    return { kind: "skipped", reason: "missing_required_create_fields" };
  }

  const shutdown = shutdownValue(employee.is_shutdown);
  return {
    kind: "normalized",
    data: {
      systea_user_id: systeaUserId,
      systea_admin_id: systeaAdminId,
      systea_sector_id: numericId(admin?.sector_id),
      systea_area_operation_id: numericId(admin?.area_operation_id),
      systea_status: text(employee.status) ?? null,
      systea_is_shutdown: shutdown,
      systea_updated_at: text(employee.updated_at) ?? null,
      systea_regime_contratacao: text(admin?.laborite_regime) ?? null,
      systea_area_name: text(admin?.area?.name) ?? null,
      systea_area_type: text(admin?.area?.type) ?? null,
      nome,
      email: text(employee.email),
      cargo,
      departamento: resolveSectorName(admin?.sector_id, sectors),
      data_admissao: dataAdmissao,
      systea_primeiro_dia_trabalho: dateOnly(admin?.first_day_work_date),
      systea_local_trabalho: text(admin?.workplace),
      systea_carga_horaria_semanal_total: decimal(admin?.weekly_workload_total),
      systea_carga_horaria_atendimentos: decimal(admin?.weekly_workload_attendances),
      status: normalizeStatus(employee.status, employee.is_shutdown),
      tipo_colaborador: localTypeIsValid ? undefined : classification.kind === "classified" ? classification.value : undefined,
    },
  };
}

async function readPage(response: Response): Promise<SysteaEmployeePage> {
  if (!response.ok) throw new Error(`Systea request failed with HTTP ${response.status}`);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Systea returned invalid JSON");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Systea returned an invalid pagination payload");
  const page = payload as Partial<SysteaEmployeePage>;
  if (
    !Number.isInteger(page.current_page) || !Number.isInteger(page.last_page) ||
    !Number.isInteger(page.total) || !Number.isInteger(page.per_page) || !Array.isArray(page.data)
  ) throw new Error("Systea returned an invalid pagination payload");
  return page as SysteaEmployeePage;
}

export async function fetchAllSysteaEmployees(fetcher: FetchLike, baseUrl: string, bearerToken: string): Promise<SysteaEmployeeRecord[]> {
  const safeBaseUrl = baseUrl.replace(/\/+$/, "");
  const records: SysteaEmployeeRecord[] = [];
  let expectedPage = 1;
  let lastPage: number | undefined;
  const seenPages = new Set<number>();

  while (lastPage === undefined || expectedPage <= lastPage) {
    if (expectedPage > SYSTEA_MAX_PAGES || seenPages.has(expectedPage)) {
      throw new Error("Systea pagination exceeded the defensive page limit");
    }
    const response = await fetcher(`${safeBaseUrl}/api/system/rh/admin?page=${expectedPage}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${bearerToken}` },
    });
    const page = await readPage(response);
    if (page.current_page !== expectedPage || page.last_page < page.current_page || page.last_page > SYSTEA_MAX_PAGES) {
      throw new Error("Systea returned a repeated or unexpected page");
    }
    if (lastPage !== undefined && page.last_page !== lastPage) throw new Error("Systea returned inconsistent pagination metadata");
    seenPages.add(page.current_page);
    lastPage = page.last_page;
    records.push(...page.data);
    expectedPage += 1;
  }
  return records;
}

export async function fetchSysteaSectors(fetcher: FetchLike, baseUrl: string, bearerToken: string): Promise<Map<number, string>> {
  const response = await fetcher(`${baseUrl.replace(/\/+$/, "")}/api/system/rh/sectors`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${bearerToken}` },
  });
  if (!response.ok) throw new Error(`Systea sectors request failed with HTTP ${response.status}`);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Systea sectors returned invalid JSON");
  }
  if (!Array.isArray(payload)) throw new Error("Systea sectors returned an invalid payload");
  return sectorMap(payload.filter((item): item is SysteaSector => Boolean(item) && typeof item === "object") as SysteaSector[]);
}

export function stableSyncPayload(data: NormalizedSysteaEmployee): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function sameValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || left === undefined || right === undefined) return false;
  return String(left) === String(right);
}

export function planSyncChange(
  normalized: NormalizedSysteaEmployee,
  existing?: LocalEmployeeForSync,
  syncedAt = new Date().toISOString(),
): SyncChange {
  const payload = stableSyncPayload(normalized);
  if (!existing) return { kind: "create", payload: { ...payload, systea_synced_at: syncedAt } };
  if (!existing.id) throw new Error("Existing Systea employee is missing its local identifier");

  const changedPayload = Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => !sameValue(existing[key], value)),
  );
  if (!Object.keys(changedPayload).length) return { kind: "unchanged" };
  return { kind: "update", id: existing.id, payload: { ...changedPayload, systea_synced_at: syncedAt } };
}