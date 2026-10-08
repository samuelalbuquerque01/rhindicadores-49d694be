import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
const mocks = vi.hoisted(() => ({ invoke: vi.fn(), getSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: mocks.getSession }, functions: { invoke: mocks.invoke } },
}));
import { useSysteaSync, useSysteaClinicReconciliation } from "./useSysteaSync";

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const keys = ["colaboradores-paginados", "colaborador-filiais", "colaborador-detail"];
  keys.forEach((key) => client.setQueryData([key], []));
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, keys, wrapper };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: "test-only" } } });
});

describe("sincronização e recuperação no frontend", () => {
  it("invalida os vínculos, a página e os detalhes após sincronização", async () => {
    mocks.invoke.mockResolvedValue({ data: { mode: "sync" }, error: null });
    const { client, keys, wrapper } = setup();
    const { result } = renderHook(useSysteaSync, { wrapper });
    await act(async () => { await result.current.sync(); });
    await waitFor(() => keys.forEach((key) => expect(client.getQueryState([key])?.isInvalidated).toBe(true)));
  });

  it("processa todos os lotes e entrega as pendências de cada lote", async () => {
    const batches = [
      { nextOffset: 5, done: false, manualReview: [{ systea_admin_id: 1, reason: "no_clinics_in_systea" }] },
      { nextOffset: 8, done: true, manualReview: [] },
    ];
    batches.forEach((batch) => mocks.invoke.mockResolvedValueOnce({ data: batch, error: null }));
    const { client, keys, wrapper } = setup();
    const { result } = renderHook(useSysteaClinicReconciliation, { wrapper });
    const onBatch = vi.fn();
    await act(async () => { await result.current.mutateAsync(onBatch); });
    expect(mocks.invoke.mock.calls.map(([, options]) => options.body)).toEqual([
      { mode: "reconcile-clinics", offset: 0 }, { mode: "reconcile-clinics", offset: 5 },
    ]);
    expect(onBatch.mock.calls.map(([batch]) => batch)).toEqual(batches);
    keys.forEach((key) => expect(client.getQueryState([key])?.isInvalidated).toBe(true));
  });

  it("atualiza os caches mesmo quando um lote posterior falha", async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { nextOffset: 5, done: false }, error: null });
    mocks.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify({ error: "Systea unavailable" }), { status: 502 }) } });
    const { client, keys, wrapper } = setup();
    const { result } = renderHook(useSysteaClinicReconciliation, { wrapper });
    const onBatch = vi.fn();
    await act(async () => { await expect(result.current.mutateAsync(onBatch)).rejects.toThrow("Systea unavailable"); });
    expect(onBatch).toHaveBeenCalledTimes(1);
    keys.forEach((key) => expect(client.getQueryState([key])?.isInvalidated).toBe(true));
  });

  it("interrompe paginação sem avanço", async () => {
    mocks.invoke.mockResolvedValue({ data: { nextOffset: 0, done: false }, error: null });
    const { wrapper } = setup();
    const { result } = renderHook(useSysteaClinicReconciliation, { wrapper });
    await act(async () => { await expect(result.current.mutateAsync(vi.fn())).rejects.toThrow("não avançou"); });
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
  });
});
