import { describe, expect, it, vi } from "vitest";
import {
  classifyEmploymentType,
  fetchAllSysteaEmployees,
  fetchSysteaUserClinics,
  normalizeStatus,
  normalizeSysteaEmployee,
  planSyncChange,
  resolveSectorName,
} from "../../../supabase/functions/_shared/systea-sync.ts";

describe("normalizeStatus", () => {
  it("prioriza is_shutdown sobre o status recebido", () => {
    expect(normalizeStatus("active", 1)).toBe("Em desligamento");
  });

  it.each([
    ["active", 0, "Ativo"],
    ["inactive", 0, "Inativo"],
    ["shutdown", 0, "Em desligamento"],
    ["pending", 0, "Pendente"],
    ["new", 0, "Pendente"],
  ])("classifica %s", (status, isShutdown, expected) => {
    expect(normalizeStatus(status, isShutdown)).toBe(expected);
  });
});

describe("classifyEmploymentType", () => {
  it("classifica PJ ignorando maiúsculas e espaços", () => {
    expect(classifyEmploymentType("  pJ  ", undefined)).toEqual({ kind: "classified", value: "PJ" });
  });

  it("classifica CLT de atendimento como corpo clínico", () => {
    expect(classifyEmploymentType("clt", " ATTENDANCE ")).toEqual({
      kind: "classified",
      value: "CLT Corpo Clínico",
    });
  });

  it("classifica CLT geral como administrativo", () => {
    expect(classifyEmploymentType("CLT", "general")).toEqual({
      kind: "classified",
      value: "CLT Administrativo",
    });
  });

  it("classifica estágio explicitamente informado", () => {
    expect(classifyEmploymentType(" Estágio ", "attendance")).toEqual({
      kind: "classified",
      value: "Estagiário",
    });
  });

  it("exige classificação manual para regime desconhecido", () => {
    expect(classifyEmploymentType("temporário", "general")).toEqual({
      kind: "requires_manual_classification",
      reason: "unknown_employment_type",
    });
  });
});

describe("normalização de colaborador Systea", () => {
  const sectors = new Map([[34, "Tecnologia - TI"]]);

  const employee = {
    id: 22,
    name: "Nome legal",
    name_social: "Nome social",
    email: "pessoa@example.com",
    status: "active",
    is_shutdown: 0,
    updated_at: "2026-10-06T10:00:00Z",
    registration_token: "must-not-be-imported",
    admin: {
      id: 100,
      sector_id: 34,
      area_operation_id: 2,
      laborite_regime: "CLT",
      admission_date: "2026-01-10",
      first_day_work_date: "2026-01-11",
      contracted_position: "Analista de Sistemas",
      workplace: "Matriz",
      weekly_workload_total: 44,
      weekly_workload_attendances: 20,
      area: { name: "Tecnologia", type: "general" },
      cpf: "00000000000",
    },
  };

  it("mapeia somente campos permitidos e resolve o setor", () => {
    expect(normalizeSysteaEmployee(employee, sectors)).toMatchObject({
      kind: "normalized",
      data: {
        systea_user_id: 22,
        systea_admin_id: 100,
        nome: "Nome social",
        email: "pessoa@example.com",
        cargo: "Analista de Sistemas",
        departamento: "Tecnologia - TI",
        systea_regime_contratacao: "CLT",
        systea_area_operation_id: 2,
        systea_area_type: "general",
        tipo_colaborador: "CLT Administrativo",
      },
    });
    expect(JSON.stringify(normalizeSysteaEmployee(employee, sectors))).not.toContain("registration_token");
    expect(JSON.stringify(normalizeSysteaEmployee(employee, sectors))).not.toContain("00000000000");
  });

  it("usa Sem setor cadastrado quando sector_id é nulo", () => {
    const withoutSector = structuredClone(employee);
    withoutSector.admin.sector_id = null;

    expect(normalizeSysteaEmployee(withoutSector, sectors)).toMatchObject({
      kind: "normalized",
      data: { departamento: "Sem setor cadastrado" },
    });
  });

  it("não sobrescreve a categoria local válida", () => {
    expect(normalizeSysteaEmployee(employee, sectors, { tipo_colaborador: "PJ" })).toMatchObject({
      kind: "normalized",
      data: { tipo_colaborador: undefined },
    });
  });

  it("ignora registros sem classificação determinística", () => {
    const unknown = structuredClone(employee);
    unknown.admin.laborite_regime = "temporário";

    expect(normalizeSysteaEmployee(unknown, sectors)).toEqual({
      kind: "skipped",
      reason: "requires_manual_classification",
    });
  });

  it("ignora regime desconhecido mesmo para colaborador local já classificado", () => {
    const unknown = structuredClone(employee);
    unknown.admin.laborite_regime = "temporário";

    expect(normalizeSysteaEmployee(unknown, sectors, { tipo_colaborador: "PJ" })).toEqual({
      kind: "skipped",
      reason: "requires_manual_classification",
    });
  });
});

describe("resolveSectorName", () => {
  it("resolve o setor obtido da API sem tabela hardcoded", () => {
    expect(resolveSectorName(34, new Map([[34, "Tecnologia - TI"]]))).toBe("Tecnologia - TI");
  });
});

describe("planSyncChange", () => {
  const normalized = {
    systea_user_id: 22,
    systea_admin_id: 100,
    systea_sector_id: 34,
    systea_area_operation_id: 2,
    systea_status: "active",
    systea_is_shutdown: false,
    systea_updated_at: "2026-10-06T10:00:00Z",
    systea_regime_contratacao: "PJ",
    systea_area_name: "Tecnologia",
    systea_area_type: "general",
    nome: "Pessoa",
    email: "pessoa@example.com",
    cargo: "Analista",
    departamento: "Tecnologia - TI",
    data_admissao: "2026-01-10",
    status: "Ativo" as const,
    tipo_colaborador: "PJ" as const,
  };

  it("é idempotente quando os dados sincronizados já são iguais", () => {
    expect(planSyncChange(normalized, { id: "local-id", ...normalized }, "2026-10-06T12:00:00Z")).toEqual({
      kind: "unchanged",
    });
  });

  it("preserva tipo local válido mesmo quando o Systea classificaria diferente", () => {
    const result = normalizeSysteaEmployee({
      id: 22,
      name: "Pessoa",
      status: "active",
      admin: { id: 100, laborite_regime: "CLT", area: { type: "general" } },
    }, new Map(), { tipo_colaborador: "PJ" });

    expect(result).toMatchObject({ kind: "normalized", data: { tipo_colaborador: undefined } });
  });
});

describe("fetchAllSysteaEmployees", () => {
  it("constrói páginas manualmente e não segue next_page_url HTTP", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        current_page: 1,
        last_page: 2,
        total: 2,
        per_page: 1,
        data: [{ id: 1 }],
        next_page_url: "http://npc.systea.com.br/api/system/rh/admin?page=2",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        current_page: 2,
        last_page: 2,
        total: 2,
        per_page: 1,
        data: [{ id: 2 }],
      }), { status: 200 }));

    await expect(fetchAllSysteaEmployees(fetcher, "https://npc.systea.com.br", "token")).resolves.toEqual([
      { id: 1 },
      { id: 2 },
    ]);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "https://npc.systea.com.br/api/system/rh/admin?page=1",
      "https://npc.systea.com.br/api/system/rh/admin?page=2",
    ]);
  });

  it("interrompe quando a API repete uma página", async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      current_page: 1,
      last_page: 2,
      total: 2,
      per_page: 1,
      data: [{ id: 1 }],
    }), { status: 200 })));

    await expect(fetchAllSysteaEmployees(fetcher, "https://npc.systea.com.br", "token")).rejects.toThrow(
      "Systea returned a repeated or unexpected page",
    );
  });

  it("interrompe ao exceder o limite defensivo de páginas", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      current_page: 1,
      last_page: 101,
      total: 101,
      per_page: 1,
      data: [{ id: 1 }],
    }), { status: 200 }));

    await expect(fetchAllSysteaEmployees(fetcher, "https://npc.systea.com.br", "token")).rejects.toThrow(
      "Systea returned a repeated or unexpected page",
    );
  });

  it("interrompe antes de sincronizar diante de resposta parcial com erro", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("indisponível", { status: 503 }));

    await expect(fetchAllSysteaEmployees(fetcher, "https://npc.systea.com.br", "token")).rejects.toThrow(
      "Systea request failed with HTTP 503",
    );
  });
});

describe("fetchSysteaUserClinics", () => {
  it("busca as clínicas detalhadas do usuário, normaliza IDs e remove duplicados", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      user: { clinics: [1, "3", 1] },
    }), { status: 200 }));

    await expect(fetchSysteaUserClinics(fetcher, "https://npc.systea.com.br/", "token", 22)).resolves.toEqual([1, 3]);
    expect(fetcher).toHaveBeenCalledWith(
      "https://npc.systea.com.br/api/system/user/22",
      { headers: { Accept: "application/json", Authorization: "Bearer token" } },
    );
  });

  it("interrompe a sincronização quando a resposta detalhada não contém clinics válida", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: { clinics: [1, 0, "x"] } }), { status: 200 }));

    await expect(fetchSysteaUserClinics(fetcher, "https://npc.systea.com.br", "token", 22)).rejects.toThrow(
      "Systea user returned an invalid clinics payload",
    );
  });
});