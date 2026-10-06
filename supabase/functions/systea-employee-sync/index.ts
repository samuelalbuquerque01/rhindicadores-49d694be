import { createClient } from "npm:@supabase/supabase-js@2";
import {
  fetchAllSysteaEmployees,
  fetchSysteaSectors,
  normalizeSysteaEmployee,
  planSyncChange,
  type LocalEmployeeForSync,
} from "../_shared/systea-sync.ts";

type Mode = "dry-run" | "sync" | "last-run";

interface SyncSummary {
  fetched: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  errors: number;
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
    "Access-Control-Allow-Headers": "authorization, content-type",
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
  if (/HTTP (4\d\d|5\d\d)|timeout|invalid JSON|pagination/i.test(error.message)) {
    return "Systea data could not be retrieved safely. No employee changes were applied.";
  }
  return "Synchronization could not be completed safely.";
}

function isMode(value: unknown): value is Mode {
  return value === "dry-run" || value === "sync" || value === "last-run";
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

  let body: { mode?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, origin);
  }
  if (!isMode(body.mode)) return json({ error: "Invalid sync mode" }, 422, origin);

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
    const syncedAt = new Date().toISOString();

    for (const remoteEmployee of remoteEmployees) {
      const adminId = remoteEmployee.admin?.id;
      const existing = adminId === null || adminId === undefined ? undefined : existingByAdminId.get(String(adminId));
      const normalized = normalizeSysteaEmployee(remoteEmployee, sectors, existing);
      if (normalized.kind === "skipped") {
        summary.skipped += 1;
        continue;
      }
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
    console.error("Systea employee sync failed");
    return json({ error: errorMessage(error) }, 502, origin);
  }
});