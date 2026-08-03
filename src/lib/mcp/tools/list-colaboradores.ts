import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, requireUserClient, unauthenticated } from "../helpers";

export default defineTool({
  name: "list_colaboradores",
  title: "Listar colaboradores",
  description:
    "List employees (colaboradores) with optional filters by status, department and name search. Returns role, department, hire date and status.",
  inputSchema: {
    status: z.string().optional().describe("Filter by status, e.g. 'Ativo' or 'Desligado'."),
    departamento: z.string().optional().describe("Filter by department name (exact match)."),
    search: z.string().optional().describe("Case-insensitive partial match on the employee name."),
    limit: z.number().int().optional().describe("Maximum rows to return (default 50, max 200)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, departamento, search, limit }, ctx) => {
    const supabase = requireUserClient(ctx);
    if (!supabase) return unauthenticated();

    let query = supabase
      .from("colaboradores")
      .select(
        "id, nome, cargo, departamento, tipo_colaborador, status, is_lider, data_admissao, data_desligamento, filial_id",
      )
      .order("nome")
      .limit(Math.min(Math.max(limit ?? 50, 1), 200));

    if (status) query = query.eq("status", status);
    if (departamento) query = query.eq("departamento", departamento);
    if (search) query = query.ilike("nome", `%${search}%`);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult({ count: data?.length ?? 0, colaboradores: data ?? [] });
  },
});
