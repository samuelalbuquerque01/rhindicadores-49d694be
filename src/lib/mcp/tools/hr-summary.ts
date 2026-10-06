import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, requireUserClient, unauthenticated } from "../helpers";

export default defineTool({
  name: "hr_summary",
  title: "Resumo de indicadores de RH",
  description:
    "Return headcount, hires, terminations, turnover rate and absence days for a period, broken down by department.",
  inputSchema: {
    data_inicio: z.string().describe("Period start as YYYY-MM-DD."),
    data_fim: z.string().describe("Period end as YYYY-MM-DD."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ data_inicio, data_fim }, ctx) => {
    const supabase = requireUserClient(ctx);
    if (!supabase) return unauthenticated();

    const [employees, hires, terminations, leaves] = await Promise.all([
      supabase.from("colaboradores").select("departamento, status, is_lider, tipo_colaborador"),
      supabase
        .from("contratacoes")
        .select("id, data_contratacao")
        .gte("data_contratacao", data_inicio)
        .lte("data_contratacao", data_fim),
      supabase
        .from("desligamentos")
        .select("id, motivo, data_desligamento")
        .gte("data_desligamento", data_inicio)
        .lte("data_desligamento", data_fim),
      supabase
        .from("afastamentos")
        .select("id, tipo, dias_afastados, data_inicio")
        .gte("data_inicio", data_inicio)
        .lte("data_inicio", data_fim),
    ]);

    const failure = [employees, hires, terminations, leaves].find((result) => result.error);
    if (failure?.error) return errorResult(failure.error.message);

    const rows = employees.data ?? [];
    const active = rows.filter((row) => row.status === "Ativo");
    const byDepartmentMap = new Map<string, number>();
    for (const row of active) {
      const key = row.departamento || "Nao informado";
      byDepartmentMap.set(key, (byDepartmentMap.get(key) ?? 0) + 1);
    }
    const byDepartment = Object.fromEntries(byDepartmentMap);

    const hiresCount = hires.data?.length ?? 0;
    const terminationsCount = terminations.data?.length ?? 0;
    const headcount = active.length;
    const turnoverRate = headcount > 0 ? ((hiresCount + terminationsCount) / 2 / headcount) * 100 : 0;
    const absenceDays = (leaves.data ?? []).reduce((total, row) => total + (row.dias_afastados ?? 0), 0);

    const reasonsMap = new Map<string, number>();
    for (const row of terminations.data ?? []) {
      const key = row.motivo || "Nao informado";
      reasonsMap.set(key, (reasonsMap.get(key) ?? 0) + 1);
    }
    const reasons = Object.fromEntries(reasonsMap);

    return jsonResult({
      periodo: { data_inicio, data_fim },
      headcount_ativo: headcount,
      total_cadastrados: rows.length,
      lideres: active.filter((row) => row.is_lider).length,
      contratacoes: hiresCount,
      desligamentos: terminationsCount,
      turnover_percentual: Number(turnoverRate.toFixed(2)),
      dias_afastamento: absenceDays,
      afastamentos: leaves.data?.length ?? 0,
      headcount_por_departamento: byDepartment,
      motivos_desligamento: reasons,
    });
  },
});
