import { renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useOverviewAnalytics } from "./useOverviewAnalytics";

vi.mock("@/hooks/useColaboradores", () => ({
  useColaboradores: () => ({ data: undefined, isLoading: true, error: null }),
}));

vi.mock("@/hooks/useAfastamentos", () => ({
  useAfastamentos: () => ({ data: undefined, isLoading: true, error: null }),
}));

vi.mock("@/hooks/useDesligamentos", () => ({
  useDesligamentos: () => ({ data: undefined, isLoading: true, error: null }),
}));

it("keeps analytics data stable while notification source queries are pending", () => {
  const { result, rerender } = renderHook(() =>
    useOverviewAnalytics({ preset: "30d", customRange: null }),
  );
  const firstData = result.current.data;

  rerender();

  expect(result.current.data).toBe(firstData);
});