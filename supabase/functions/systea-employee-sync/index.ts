import { createClient } from "npm:@supabase/supabase-js@2";
import {
  fetchAllSysteaEmployees,
  fetchSysteaSectors,
  fetchSysteaUserClinics,
  normalizeSysteaEmployee,
  planSyncChange,
  type LocalEmployeeForSync,
} from "../_shared/systea-sync.ts";

type Mode = "dry-run" | "sync" | "last-run" | "reconcile-clinics";
const RECONCILE_BATCH_SIZE = 5;

interface SyncSummary {
  fetched: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  errors: number;
}

interface ClinicSyncRequest {
  systeaAdminId: number;
  clinics: number[];
}

const REQUEST_TIMEOUT_MS = 15_000;
const BATCH_SIZE = 100;

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required server configuration: ${name}`);
  return value;
}

function allowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  const configured = Deno.env.get("RH_INSIGHTS_ALLOWED_ORIGIN")?.trim();
  if (!origin || !configured || origin !== configured) return null;
  return origin;
}

function responseHeaders(origin: string | null): HeadersInit {
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(payload: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(payload), { status, headers: responseHeaders(origin) });
}

function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Unexpected synchronization failure";
  if (error.message.includes("HTTP 401") || error.message.includes("HTTP 403")) {
    return "Systea authentication was rejected. Verify the integration credentials.";
  }
  if (error.message.includes("HTTP 429")) return "Systea rate limited the request. Try again later.";
  if (/HTTP (4\d\d|5\d\d)|timeout|invalid JSON|pagination|clinics|admin\.user_id/i.test(error.message)) {
    return "Systea data could not be retrieved safely. Review the completed batches before retrying.";
  }
  return "Synchronization could not be completed safely.";
}

function isMode(value: unknown): value is Mode {
  return value === "dry-run" || value === "sync" || value === "last-run" || value === "reconcile-clinics";
}

function timedFetch(input: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

Deno.serve(async (request) => {
  const origin = allowedOrigin(request);
  if (request.method === "OPTIONS") {
    return origin ? new Response(null, { status: 204, headers: responseHeaders(origin) }) : new Response(null, { status: 403 });
  }
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!origin) return json({ error: "Origin not allowed" }, 403, null);

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401, origin);

  let body: { mode?: unknown; offset?: unknown; limit?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, origin);
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || !isMode(body.mode)) return json({ error: "Invalid sync mode" }, 422, origin);
  if (body.mode === "reconcile-clinics" && body.offset !== undefined &&
    (!Number.isSafeInteger(body.offset) || (body.offset as number) < 0)) {
    return json({ error: "Invalid reconciliation offset" }, 422, origin);
  }

  let service;
  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const userClient = createClient(supabaseUrl, requiredEnv("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Authentication required" }, 401, origin);

    service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: admin, error: adminError } = await service
      .from("systea_sync_admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .eq("active", true)
      .maybeSingle();
    if (adminError || !admin) return json({ error: "Administrator authorization required" }, 403, origin);

    if (body.mode === "last-run") {
      const { data, error } = await service
        .from("systea_sync_runs")
        .select("id, mode, status, started_at, finished_at, fetched, created, updated, unchanged, skipped, errors, error_summary")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return json({ run: data ?? null }, 200, origin);
    }

    if (body.mode === "reconcile-clinics") {
      // Idempotent recovery: re-reads clinics from Systea for already-synced employees
      // (by systea_user_id), adding missing links without deleting valid data.
      const offset = Number.isSafeInteger(body.offset) && (body.offset as number) >= 0 ? body.offset as number : 0;
      const limit = Number.isSafeInteger(body.limit) && (body.limit as number) >= 1 && (body.limit as number) <= RECONCILE_BATCH_SIZE ? body.limit as number : RECONCILE_BATCH_SIZE;
      const baseUrl = requiredEnv("SYSTEA_BASE_URL");
      const token = requiredEnv("SYSTEA_BEARER_TOKEN");
      const { count: total, error: countError } = await service
        .from("colaboradores").select("id", { count: "exact", head: true }).not("systea_user_id", "is", null);
      if (countError) throw countError;
      const { data: employees, error: listError } = await service
        .from("colaboradores").select("id, systea_admin_id, systea_user_id")
        .not("systea_user_id", "is", null).order("id").range(offset, offset + limit - 1);
      if (listError) throw listError;
      const { data: mapping, error: mappingError } = await service.from("systea_clinic_filiais").select("systea_clinic_id");
      if (mappingError) throw mappingError;
      const mapped = new Set((mapping ?? []).map((row) => row.systea_clinic_id));

      const diag = { analyzed: 0, withClinics: 0, corrected: 0, withoutClinics: 0, mappingFailures: 0, persistenceFailures: 0, fetchFailures: 0 };
      const manualReview: { systea_admin_id: number | null; reason: string }[] = [];
      const assignments: { colaborador_id: string; systea_clinic_ids: number[]; systea_admin_id: number | null }[] = [];
      for (const employee of employees ?? []) {
        diag.analyzed += 1;
        let clinics: number[];
        try {
          clinics = await fetchSysteaUserClinics(timedFetch, baseUrl, token, Number(employee.systea_user_id));
        } catch (error) {
          if (error instanceof Error && /HTTP (401|403)/.test(error.message)) throw error;
          diag.fetchFailures += 1; // safe category or structure-only shape, never values
          const detail = error instanceof Error ? (error.message.match(/HTTP \d+|invalid JSON|invalid clinics payload( shape=.{0,400})?|abort/i)?.[0] ?? error.name) : "unknown";
          manualReview.push({ systea_admin_id: employee.systea_admin_id, reason: `fetch_failed: ${detail}` });
          continue;
        }
        if (clinics.length === 0) {
          diag.withoutClinics += 1;
          manualReview.push({ systea_admin_id: employee.systea_admin_id, reason: "no_clinics_in_systea" });
          continue;
        }
        if (clinics.some((id) => !mapped.has(id))) {
          diag.mappingFailures += 1;
          manualReview.push({ systea_admin_id: employee.systea_admin_id, reason: "unmapped_clinic" });
          continue;
        }
        assignments.push({ colaborador_id: employee.id, systea_clinic_ids: clinics, systea_admin_id: employee.systea_admin_id });
      }
      const syncedAt = new Date().toISOString();
      let linksInserted = 0;
      for (const assignment of assignments) {
        const { data: inserted, error } = await service.rpc("reconcile_systea_colaborador_filiais", {
          p_colaborador_id: assignment.colaborador_id,
          p_systea_clinic_ids: assignment.systea_clinic_ids,
          p_synced_at: syncedAt,
        });
        if (error) {
          diag.persistenceFailures += 1;
          manualReview.push({ systea_admin_id: assignment.systea_admin_id, reason: "persistence_failed" });
        } else {
          diag.withClinics += 1;
          if (Number(inserted) > 0) diag.corrected += 1;
          linksInserted += Number(inserted) || 0;
        }
      }
      const nextOffset = offset + (employees?.length ?? 0);
      return json({
        mode: "reconcile-clinics", total: total ?? 0, offset, nextOffset,
        done: nextOffset >= (total ?? 0) || (employees?.length ?? 0) === 0,
        ...diag, linksInserted, manualReview,
      }, 200, origin);
    }

    const startedAt = new Date().toISOString();
    const systeaBaseUrl = requiredEnv("SYSTEA_BASE_URL");
    const systeaBearerToken = requiredEnv("SYSTEA_BEARER_TOKEN");
    const sectors = await fetchSysteaSectors(timedFetch, systeaBaseUrl, systeaBearerToken);
    const remoteEmployees = await fetchAllSysteaEmployees(timedFetch, systeaBaseUrl, systeaBearerToken);
    const adminIds = [...new Set(remoteEmployees.map((employee) => employee.admin?.id).filter((id): id is number | string => id !== null && id !== undefined).map(String))];
    const existingByAdminId = new Map<string, LocalEmployeeForSync>();
    for (const ids of chunk(adminIds, BATCH_SIZE)) {
      const { data, error } = await service.from("colaboradores").select("*").in("systea_admin_id", ids);
      if (error) throw error;
      for (const employee of data ?? []) existingByAdminId.set(String(employee.systea_admin_id), employee as LocalEmployeeForSync);
    }

    const summary: SyncSummary = { fetched: remoteEmployees.length, created: 0, updated: 0, unchanged: 0, skipped: 0, errors: 0 };
    const writePayloads: Record<string, unknown>[] = [];
    const clinicSyncRequests: ClinicSyncRequest[] = [];
    const syncedAt = new Date().toISOString();

    for (const remoteEmployee of remoteEmployees) {
      const adminId = remoteEmployee.admin?.id;
      const existing = adminId === null || adminId === undefined ? undefined : existingByAdminId.get(String(adminId));
      const normalized = normalizeSysteaEmployee(remoteEmployee, sectors, existing);
      if (normalized.kind === "skipped") {
        summary.skipped += 1;
        continue;
      }

      const systeaUserId = normalized.data.systea_user_id;
      if (!Number.isSafeInteger(systeaUserId) || systeaUserId <= 0) {
        throw new Error("Systea employee is missing the admin.user_id required for clinic synchronization");
      }
      const clinics = await fetchSysteaUserClinics(timedFetch, systeaBaseUrl, systeaBearerToken, systeaUserId);
      clinicSyncRequests.push({
        systeaAdminId: normalized.data.systea_admin_id,
        clinics,
      });

      const change = planSyncChange(normalized.data, existing, syncedAt);
      if (change.kind === "create") {
        summary.created += 1;
        writePayloads.push(change.payload);
      } else if (change.kind === "update") {
        summary.updated += 1;
        writePayloads.push({
          nome: normalized.data.nome ?? existing?.nome,
          cargo: normalized.data.cargo ?? existing?.cargo,
          departamento: normalized.data.departamento ?? existing?.departamento,
          data_admissao: normalized.data.data_admissao ?? existing?.data_admissao,
          tipo_colaborador: normalized.data.tipo_colaborador ?? existing?.tipo_colaborador,
          status: normalized.data.status,
          systea_is_shutdown: normalized.data.systea_is_shutdown ?? existing?.systea_is_shutdown,
          ...change.payload,
          systea_admin_id: normalized.data.systea_admin_id,
        });
      } else {
        summary.unchanged += 1;
      }
    }

    const systeaClinicIds = [...new Set(clinicSyncRequests.flatMap((request) => request.clinics))];
    if (systeaClinicIds.length) {
      const { data: mappedClinics, error: mappedClinicsError } = await service
        .from("systea_clinic_filiais")
        .select("systea_clinic_id")
        .in("systea_clinic_id", systeaClinicIds);
      if (mappedClinicsError) throw mappedClinicsError;

      const mappedClinicIds = new Set((mappedClinics ?? []).map((clinic) => clinic.systea_clinic_id));
      if (systeaClinicIds.some((clinicId) => !mappedClinicIds.has(clinicId))) {
        throw new Error("Systea returned a clinic without a configured local filial mapping");
      }
    }

    if (body.mode === "dry-run") return json({ mode: body.mode, ...summary, startedAt, finishedAt: new Date().toISOString() }, 200, origin);

    const { data: run, error: runError } = await service.from("systea_sync_runs").insert({
      requested_by: userData.user.id,
      mode: "sync",
      status: "completed",
      started_at: startedAt,
      fetched: summary.fetched,
      created: summary.created,
      updated: summary.updated,
      unchanged: summary.unchanged,
      skipped: summary.skipped,
      errors: summary.errors,
    }).select("id").single();
    if (runError) throw runError;

    try {
      if (writePayloads.length) {
        const { error } = await service.rpc("apply_systea_colaboradores", { payloads: writePayloads });
        if (error) throw error;
      }

      const localEmployeesByAdminId = new Map<string, { id: string }>();
      for (const ids of chunk([...new Set(clinicSyncRequests.map((request) => request.systeaAdminId))], BATCH_SIZE)) {
        const { data, error } = await service.from("colaboradores").select("id, systea_admin_id").in("systea_admin_id", ids);
        if (error) throw error;
        for (const employee of data ?? []) localEmployeesByAdminId.set(String(employee.systea_admin_id), employee);
      }

      const clinicAssignments = clinicSyncRequests.map((request) => {
        const localEmployee = localEmployeesByAdminId.get(String(request.systeaAdminId));
        if (!localEmployee) throw new Error("Systea employee was not persisted before clinic synchronization");
        return { colaborador_id: localEmployee.id, systea_clinic_ids: request.clinics };
      });
      if (clinicAssignments.length) {
        const { error } = await service.rpc("sync_systea_colaborador_filiais_batch", {
          p_assignments: clinicAssignments,
          p_synced_at: syncedAt,
        });
        if (error) throw error;
      }
      const { error: finishError } = await service.from("systea_sync_runs").update({ finished_at: new Date().toISOString() }).eq("id", run.id);
      if (finishError) throw finishError;
    } catch (writeError) {
      await service.from("systea_sync_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        errors: 1,
        error_summary: "Database write failed; review function logs without sensitive request data.",
      }).eq("id", run.id);
      throw writeError;
    }

    return json({ mode: body.mode, ...summary, runId: run.id, startedAt, finishedAt: new Date().toISOString() }, 200, origin);
  } catch (error) {
    const safeName = error instanceof Error ? error.name : typeof error;
    console.error("Systea employee sync failed", safeName);
    return json({ error: errorMessage(error) }, 502, origin);
  }
});
