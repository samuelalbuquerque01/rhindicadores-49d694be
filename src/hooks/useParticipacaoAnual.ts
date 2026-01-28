import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ParticipacaoStats {
  colaborador_id: string;
  treinamentos_total: number;
  treinamentos_participou: number;
  treinamentos_percentual: number;
  eventos_total: number;
  eventos_compareceu: number;
  eventos_percentual: number;
}

export function useParticipacaoAnual(ano?: number) {
  const currentYear = ano || new Date().getFullYear();
  const startOfYear = `${currentYear}-01-01`;
  const endOfYear = `${currentYear}-12-31`;

  return useQuery({
    queryKey: ["participacao-anual", currentYear],
    queryFn: async () => {
      // Fetch all training participations for the year
      const { data: treinamentoParticipacoes, error: treinamentoError } = await supabase
        .from("treinamento_participacoes")
        .select(`
          colaborador_id,
          participou,
          treinamento:treinamentos(data_realizacao)
        `)
        .not("colaborador_id", "is", null);

      if (treinamentoError) throw treinamentoError;

      // Fetch all event participations for the year
      const { data: eventoParticipacoes, error: eventoError } = await supabase
        .from("evento_participacoes")
        .select(`
          colaborador_id,
          compareceu,
          confirmou_presenca,
          evento:eventos(data_evento)
        `)
        .not("colaborador_id", "is", null);

      if (eventoError) throw eventoError;

      // Filter by year and calculate stats
      const treinamentosDoAno = treinamentoParticipacoes?.filter((p: any) => {
        const data = p.treinamento?.data_realizacao;
        return data && data >= startOfYear && data <= endOfYear;
      }) || [];

      const eventosDoAno = eventoParticipacoes?.filter((p: any) => {
        const data = p.evento?.data_evento;
        return data && data >= startOfYear && data <= endOfYear;
      }) || [];

      // Group by colaborador
      const statsMap = new Map<string, ParticipacaoStats>();

      // Process trainings
      treinamentosDoAno.forEach((p: any) => {
        const id = p.colaborador_id;
        if (!statsMap.has(id)) {
          statsMap.set(id, {
            colaborador_id: id,
            treinamentos_total: 0,
            treinamentos_participou: 0,
            treinamentos_percentual: 0,
            eventos_total: 0,
            eventos_compareceu: 0,
            eventos_percentual: 0,
          });
        }
        const stats = statsMap.get(id)!;
        stats.treinamentos_total++;
        if (p.participou) stats.treinamentos_participou++;
      });

      // Process events
      eventosDoAno.forEach((p: any) => {
        const id = p.colaborador_id;
        if (!statsMap.has(id)) {
          statsMap.set(id, {
            colaborador_id: id,
            treinamentos_total: 0,
            treinamentos_participou: 0,
            treinamentos_percentual: 0,
            eventos_total: 0,
            eventos_compareceu: 0,
            eventos_percentual: 0,
          });
        }
        const stats = statsMap.get(id)!;
        stats.eventos_total++;
        if (p.compareceu) stats.eventos_compareceu++;
      });

      // Calculate percentages
      statsMap.forEach((stats) => {
        stats.treinamentos_percentual = stats.treinamentos_total > 0
          ? Math.round((stats.treinamentos_participou / stats.treinamentos_total) * 100)
          : 0;
        stats.eventos_percentual = stats.eventos_total > 0
          ? Math.round((stats.eventos_compareceu / stats.eventos_total) * 100)
          : 0;
      });

      return Object.fromEntries(statsMap);
    },
  });
}
