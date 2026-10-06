import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import Index from "./Index";

vi.mock("@/hooks/useColaboradores", () => ({
  useColaboradoresStats: () => ({ data: { total: 0, porTipo: { administrativo: 0, corpoClinico: 0 } } }),
}));
vi.mock("@/hooks/useDesligamentos", () => ({ useTurnoverStats: () => ({ data: undefined }) }));
vi.mock("@/hooks/useAfastamentos", () => ({ useAbsenteismoStats: () => ({ data: undefined }) }));
vi.mock("@/hooks/useContratacoes", () => ({ useContratacaoStats: () => ({ data: undefined }) }));
vi.mock("@/hooks/useTreinamentos", () => ({ useTreinamentosStats: () => ({ data: undefined }) }));

vi.mock("@/components/dashboard/Header", () => ({ Header: () => <header /> }));
vi.mock("@/components/dashboard/StatCard", () => ({ StatCard: () => <div /> }));
vi.mock("@/components/dashboard/TreinamentoChart", () => ({ TreinamentoChart: () => <div /> }));
vi.mock("@/components/dashboard/TurnoverModule", () => ({ TurnoverModule: () => <div /> }));
vi.mock("@/components/dashboard/AbsenteismoModule", () => ({ AbsenteismoModule: () => <div /> }));
vi.mock("@/components/dashboard/FilialSelector", () => ({ FilialSelector: () => <div /> }));
vi.mock("@/components/forms/FilialForm", () => ({ FilialForm: () => <div /> }));
vi.mock("@/components/forms/ColaboradorForm", () => ({ ColaboradorForm: () => <div /> }));
vi.mock("@/components/dashboard/ColaboradoresList", () => ({ ColaboradoresList: () => <div /> }));
vi.mock("@/components/dashboard/TreinamentosList", () => ({ TreinamentosList: () => <div /> }));
vi.mock("@/components/dashboard/TreinamentosParticipacaoTable", () => ({ TreinamentosParticipacaoTable: () => <div /> }));
vi.mock("@/components/dashboard/TreinamentosInsightsCard", () => ({ TreinamentosInsightsCard: () => <div /> }));
vi.mock("@/components/dashboard/ParticipacaoColaboradorChart", () => ({ ParticipacaoColaboradorChart: () => <div /> }));
vi.mock("@/components/dashboard/VisaoGeralPanel", () => ({ VisaoGeralPanel: () => <div /> }));
vi.mock("@/features/timeline", () => ({ TimelinePanel: () => <div /> }));
vi.mock("@/features/events", () => ({ EventsPage: () => <div /> }));

it("keeps the dashboard tab strip on one horizontally scrollable row", () => {
  render(
    <BrowserRouter>
      <Index />
    </BrowserRouter>,
  );

  const tabList = screen.getByRole("tablist");
  expect(tabList).toHaveClass("flex-nowrap", "min-w-max");
  expect(tabList.parentElement).toHaveClass("overflow-x-auto");
  expect(tabList).not.toHaveClass("flex-wrap");
});