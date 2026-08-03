import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, requireUserClient, unauthenticated } from "../helpers";

export default defineTool({
  name: "list_afastamentos",
  title: "Listar afastamentos",
  description:
    "List employee leaves/absences (afastamentos) in a date range, including type, start and end date and days absent.",
  inputSchema: {
    data_inicio: z.string().optional().describe("Start of the range as YYYY-MM-DD (filters on data_inicio)."),
    data_fim: z.string().optional().describe("End of the range as YYYY-MM-DD (filters on data_inicio)."),
    tipo: z.string().optional().describe("Filter by leave type."),
    limit: z.number().int().optional().describe("Maximum rows to return (default 50, max 200)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ data_inicio, data_fim, tipo, limit }, ctx) => {
    const supabase = requireUserClient(ctx);
    if (!supabase) return unauthenticated();

    let query = supabase
      .from("afastamentos")
      .select("id, tipo, data_inicio, data_fim, dias_afastados, observacoes, colaboradores(nome, departamento)")
      .order("data_inicio", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 50, 1), 200));

    if (data_inicio) query = query.gte("data_inicio", data_inicio);
    if (data_fim) query = query.lte("data_inicio", data_fim);
    if (tipo) query = query.eq("tipo", tipo);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult({ count: data?.length ?? 0, afastamentos: data ?? [] });
  },
});
