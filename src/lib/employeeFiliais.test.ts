import { describe, expect, it } from "vitest";
import {
  buildColaboradorFiliaisMap,
  formatColaboradorFiliais,
  type ColaboradorFilialAssignment,
} from "./employeeFiliais";

const assignments: ColaboradorFilialAssignment[] = [
  {
    colaborador_id: "employee-1",
    filial_id: "sul",
    is_primary: false,
    filial: { id: "sul", nome: "Unidade Sul" },
  },
  {
    colaborador_id: "employee-1",
    filial_id: "matriz",
    is_primary: true,
    filial: { id: "matriz", nome: "Matriz" },
  },
  {
    colaborador_id: "employee-1",
    filial_id: "life",
    is_primary: false,
    filial: { id: "life", nome: "Unidade Life" },
  },
];

describe("filiais exibidas do colaborador", () => {
  it("agrupa atribuições pelo colaborador", () => {
    const map = buildColaboradorFiliaisMap(assignments);

    expect(map.get("employee-1")).toHaveLength(3);
  });

  it("exibe a filial principal primeiro e ordena as demais por nome", () => {
    const map = buildColaboradorFiliaisMap(assignments);

    expect(formatColaboradorFiliais("employee-1", map, "Administrativa")).toBe(
      "Matriz, Unidade Life, Unidade Sul",
    );
  });

  it("usa a filial administrativa quando não existem atribuições sincronizadas", () => {
    expect(formatColaboradorFiliais("employee-2", new Map(), "Parquelândia")).toBe("Parquelândia");
  });

  it("exibe hífen quando não existe atribuição nem filial administrativa", () => {
    expect(formatColaboradorFiliais("employee-3", new Map(), undefined)).toBe("-");
  });
});