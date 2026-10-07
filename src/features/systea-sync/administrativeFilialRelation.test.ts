import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const filesUsingTheAdministrativeFilialRelation = [
  "src/hooks/useColaboradores.ts",
  "src/hooks/useAfastamentos.ts",
  "src/hooks/useAfastamentoAtivo.ts",
  "src/hooks/useDesligamentos.ts",
  "src/hooks/useLideres.ts",
  "src/pages/EmployeeDetails.tsx",
];

describe("relação da filial administrativa do colaborador", () => {
  it("seleciona explicitamente a FK administrativa após a inclusão de múltiplas filiais", () => {
    for (const file of filesUsingTheAdministrativeFilialRelation) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");

      expect(source).not.toContain("filial:filiais(*)");
      expect(source).toContain("filial:filiais!colaboradores_filial_id_fkey(*)");
    }
  });
});