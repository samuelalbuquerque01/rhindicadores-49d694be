import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("consulta de atribuições multiunidade", () => {
  it("busca os vínculos da página em lote e usa a FK explícita da filial", () => {
    const source = readFileSync(resolve(process.cwd(), "src/hooks/useColaboradorFiliais.ts"), "utf8");

    expect(source).toContain('queryKey: ["colaborador-filiais", colaboradorIds]');
    expect(source).toContain('.from("colaborador_filiais")');
    expect(source).toContain('filial:filiais!colaborador_filiais_filial_id_fkey(id, nome)');
    expect(source).toContain('.in("colaborador_id", colaboradorIds)');
    expect(source).toContain("enabled: colaboradorIds.length > 0");
  });

  it("conecta a lista ao mapa de unidades sincronizadas", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/dashboard/ColaboradoresList.tsx"), "utf8");

    expect(source).toContain('import { useColaboradorFiliais } from "@/hooks/useColaboradorFiliais";');
    expect(source).toContain('import { formatColaboradorFiliais } from "@/lib/employeeFiliais";');
    expect(source).toContain("useColaboradorFiliais(colaboradorIds)");
    expect(source).toContain("formatColaboradorFiliais(");
    expect(source).toContain("getFilialNome(colaborador)");
  });
});