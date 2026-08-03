import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, requireUserClient, unauthenticated } from "../helpers";

export default defineTool({
  name: "list_treinamentos_eventos",
  title: "Listar treinamentos e eventos",
  description:
    "List trainings (treinamentos) and institutional events (eventos) in a date range, with workload, capacity and completion status.",
  inputSchema: {
    data_inicio: z.string().optional().describe("Start of the range as YYYY-MM-DD."),
    data_fim: z.string().optional().describe("End of the range as YYYY-MM-DD."),
    limit: z.number().int().optional().describe("Maximum rows per collection (default 50, max 200)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ data_inicio, data_fim, limit }, ctx) => {
    const supabase = requireUserClient(ctx);
    if (!supabase) return unauthenticated();
    const max = Math.min(Math.max(limit ?? 50, 1), 200);

    let trainings = supabase
      .from("treinamentos")
      .select("id, nome, descricao, data_realizacao, carga_horaria, tipo, vagas_totais, finalizado")
      .order("data_realizacao", { ascending: false })
      .limit(max);
    let events = supabase
      .from("eventos")
      .select("id, nome, descricao, data_evento, tipo, capacidade, finalizado")
      .order("data_evento", { ascending: false })
      .limit(max);

    if (data_inicio) {
      trainings = trainings.gte("data_realizacao", data_inicio);
      events = events.gte("data_evento", data_inicio);
    }
    if (data_fim) {
      trainings = trainings.lte("data_realizacao", data_fim);
      events = events.lte("data_evento", data_fim);
    }

    const [trainingsResult, eventsResult] = await Promise.all([trainings, events]);
    if (trainingsResult.error) return errorResult(trainingsResult.error.message);
    if (eventsResult.error) return errorResult(eventsResult.error.message);

    return jsonResult({
      treinamentos: trainingsResult.data ?? [],
      eventos: eventsResult.data ?? [],
    });
  },
});
