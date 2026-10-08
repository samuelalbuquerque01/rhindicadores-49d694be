import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildColaboradorFiliaisMap } from "@/lib/employeeFiliais";
const mocks = vi.hoisted(() => ({ assignments: vi.fn(), setCount: vi.fn(), setPage: vi.fn() }));
vi.mock("@/hooks/useColaboradores", () => ({
  useColaboradoresPaginados: () => ({ data: { data: [{ id: "employee-1", nome: "Adriana Teste", cargo: "Analista", departamento: "RH", tipo_colaborador: "PJ", status: "Ativo", data_admissao: "2020-01-01", filial: { nome: "Administrativa" } }], count: 1 } }),
  useDeleteColaborador: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/hooks/useColaboradorFiliais", () => ({ useColaboradorFiliais: mocks.assignments }));
vi.mock("@/hooks/useFiliais", () => ({ useFiliais: () => ({ data: [] }) }));
vi.mock("@/hooks/useAfastamentoAtivo", () => ({ useAfastamentosAtivos: () => ({ data: new Map() }) }));
vi.mock("@/hooks/usePagination", () => ({ usePagination: () => ({ page: 1, pageSize: 20, totalPages: 1, setPage: mocks.setPage, setPageSize: vi.fn(), setTotalCount: mocks.setCount }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ select: () => ({ order: async () => ({ data: [], error: null }) }) }) } }));
vi.mock("./EditColaboradorModal", () => ({ EditColaboradorModal: () => null }));
vi.mock("./SysteaSyncCard", () => ({ SysteaSyncCard: () => null }));
import { ColaboradoresList } from "./ColaboradoresList";
import { TooltipProvider } from "@/components/ui/tooltip";

function renderList() {
  return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><TooltipProvider><ColaboradoresList /></TooltipProvider></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => mocks.assignments.mockReturnValue({ data: new Map() }));
describe("coluna Filial na listagem", () => {
  it("mostra todas as unidades sincronizadas", () => {
    mocks.assignments.mockReturnValue({ data: buildColaboradorFiliaisMap([
      { colaborador_id: "employee-1", filial_id: "1", is_primary: true, filial: { id: "1", nome: "Matriz" } },
      { colaborador_id: "employee-1", filial_id: "4", is_primary: false, filial: { id: "4", nome: "Unidade Sul" } },
    ]) });
    renderList();
    expect(screen.getByText("Matriz, Unidade Sul")).toBeInTheDocument();
  });
  it("preserva fallback administrativo sem vínculos", () => {
    renderList();
    expect(screen.getByText("Administrativa")).toBeInTheDocument();
  });
  it("não apresenta erro de consulta como ausência de unidades", () => {
    mocks.assignments.mockReturnValue({ error: new Error("consulta falhou") });
    renderList();
    expect(screen.getByText("Erro ao consultar filiais")).toBeInTheDocument();
    expect(screen.queryByText("Administrativa")).not.toBeInTheDocument();
  });
});
