import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, requireUserClient, unauthenticated } from "../helpers";

export default defineTool({
  name: "list_desligamentos",
  title: "Listar desligamentos",
  description:
    "List employee terminations (desligamentos) in a date range, including reason, date and severance cost. Useful for turnover analysis.",
  inputSchema: {
    data_inicio: z.string().optional().describe("Start of the range as YYYY-MM-DD."),
    data_fim: z.string().optional().describe("End of the range as YYYY-MM-DD."),
    motivo: z.string().optional().describe("Filter by termination reason."),
    limit: z.number().int().optional().describe("Maximum rows to return (default 50, max 200)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ data_inicio, data_fim, motivo, limit }, ctx) => {
    const supabase = requireUserClient(ctx);
    if (!supabase) return unauthenticated();

    let query = supabase
      .from("desligamentos")
      .select("id, data_desligamento, motivo, custo_rescisao, observacoes, colaboradores(nome, cargo, departamento)")
      .order("data_desligamento", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 50, 1), 200));

    if (data_inicio) query = query.gte("data_desligamento", data_inicio);
    if (data_fim) query = query.lte("data_desligamento", data_fim);
    if (motivo) query = query.eq("motivo", motivo);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult({ count: data?.length ?? 0, desligamentos: data ?? [] });
  },
});
