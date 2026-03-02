import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Treinamento, TreinamentoParticipacao } from "@/types/database";
import { toast } from "sonner";

export function useTreinamentos(filialId?: string) {
  return useQuery({
    queryKey: ["treinamentos", filialId],
    queryFn: async () => {
      let query = supabase
        .from("treinamentos")
        .select("*, filial:filiais(*)")
        .order("data_realizacao", { ascending: false });
      
      if (filialId) {
        query = query.eq("filial_id", filialId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as (Treinamento & { finalizado?: boolean })[];
    },
  });
}

export function useFinalizarTreinamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("treinamentos")
        .update({ finalizado: true })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos"] });
      queryClient.invalidateQueries({ queryKey: ["treinamentos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["participacao-anual"] });
      toast.success("Treinamento finalizado!");
    },
    onError: (error) => {
      toast.error("Erro ao finalizar treinamento: " + error.message);
    },
  });
}

export function useReabrirTreinamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("treinamentos")
        .update({ finalizado: false })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos"] });
      queryClient.invalidateQueries({ queryKey: ["treinamentos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["participacao-anual"] });
      toast.success("Treinamento reaberto!");
    },
    onError: (error) => {
      toast.error("Erro ao reabrir treinamento: " + error.message);
    },
  });
}

export function useTreinamentosStats(filialId?: string) {
  return useQuery({
    queryKey: ["treinamentos-stats", filialId],
    queryFn: async () => {
      // Get all trainings
      let treinamentosQuery = supabase.from("treinamentos").select("*");
      if (filialId) {
        treinamentosQuery = treinamentosQuery.eq("filial_id", filialId);
      }
      const { data: treinamentos, error: treinamentosError } = await treinamentosQuery;
      if (treinamentosError) throw treinamentosError;

      // Get all participations
      const { data: participacoes, error: participacoesError } = await supabase
        .from("treinamento_participacoes")
        .select("*, treinamento:treinamentos(*), colaborador:colaboradores(departamento)");
      if (participacoesError) throw participacoesError;

      const treinamentosList = (treinamentos || []) as Treinamento[];
      const participacoesList = (participacoes || []) as (TreinamentoParticipacao & {
        treinamento?: Treinamento;
        colaborador?: { departamento?: string | null };
      })[];

      // Filter participations by filial if needed
      const filteredParticipacoes = filialId
        ? participacoesList.filter(p => (p.treinamento as any)?.filial_id === filialId)
        : participacoesList;

      const totalTreinamentos = treinamentosList.length;
      const totalVagas = treinamentosList.reduce((sum, t) => sum + (t.vagas_totais || 0), 0);
      const totalParticipacoes = filteredParticipacoes.length;
      const totalParticipantes = filteredParticipacoes.filter(p => p.participou).length;
      const taxaParticipacao = totalVagas > 0 ? (totalParticipantes / totalVagas) * 100 : 0;
      const taxaConclusao = totalParticipacoes > 0 ? (totalParticipantes / totalParticipacoes) * 100 : 0;
      const mediaParticipacao = totalTreinamentos > 0 ? totalParticipacoes / totalTreinamentos : 0;
      const horasTotais = filteredParticipacoes.reduce((sum, p) => {
        if (!p.participou) return sum;
        return sum + (p.treinamento?.carga_horaria || 0);
      }, 0);

      const setorStats = new Map<string, { participou: number; total: number }>();
      filteredParticipacoes.forEach((p) => {
        const setor = p.colaborador?.departamento || "Sem setor";
        const current = setorStats.get(setor) || { participou: 0, total: 0 };
        current.total += 1;
        if (p.participou) current.participou += 1;
        setorStats.set(setor, current);
      });

      let setorMaisTreinado = "-";
      let maiorTreinado = -1;
      let setorMaiorEngajamento = "-";
      let maiorEngajamento = -1;
      setorStats.forEach((stats, setor) => {
        if (stats.participou > maiorTreinado) {
          maiorTreinado = stats.participou;
          setorMaisTreinado = setor;
        }
        const taxa = stats.total > 0 ? stats.participou / stats.total : 0;
        if (taxa > maiorEngajamento) {
          maiorEngajamento = taxa;
          setorMaiorEngajamento = setor;
        }
      });

      const treinamentoCounts = new Map<string, { nome: string; total: number }>();
      filteredParticipacoes.forEach((p) => {
        if (!p.treinamento) return;
        const key = p.treinamento.id;
        const current = treinamentoCounts.get(key) || {
          nome: p.treinamento.nome,
          total: 0,
        };
        if (p.participou) current.total += 1;
        treinamentoCounts.set(key, current);
      });

      const topTreinamentos = Array.from(treinamentoCounts.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

      return {
        totalTreinamentos,
        totalVagas,
        totalParticipantes,
        taxaParticipacao: Math.round(taxaParticipacao * 10) / 10,
        taxaConclusao: Math.round(taxaConclusao * 10) / 10,
        mediaParticipacao: Math.round(mediaParticipacao * 10) / 10,
        setorMaisTreinado,
        setorMaiorEngajamento,
        horasTotais,
        topTreinamentos,
      };
    },
  });
}

export function useCreateTreinamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (treinamento: Omit<Treinamento, "id" | "created_at" | "filial">) => {
      const { data, error } = await supabase
        .from("treinamentos")
        .insert(treinamento)
        .select()
        .single();
      
      if (error) throw error;
      return data as Treinamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos"] });
      queryClient.invalidateQueries({ queryKey: ["treinamentos-stats"] });
      toast.success("Treinamento cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar treinamento: " + error.message);
    },
  });
}

export function useCreateParticipacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (participacao: Omit<TreinamentoParticipacao, "id" | "created_at" | "treinamento" | "colaborador">) => {
      const { data, error } = await supabase
        .from("treinamento_participacoes")
        .insert(participacao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["treinamento-participacoes"] });
      toast.success("Participação registrada!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar participação: " + error.message);
    },
  });
}

export function useTreinamentoParticipacoes(treinamentoId?: string) {
  return useQuery({
    queryKey: ["treinamento-participacoes", treinamentoId],
    queryFn: async () => {
      let query = supabase
        .from("treinamento_participacoes")
        .select("*, colaborador:colaboradores(id, nome), treinamento:treinamentos(*)");
      
      if (treinamentoId) {
        query = query.eq("treinamento_id", treinamentoId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!treinamentoId,
  });
}

export function useTreinamentosParticipacoesDetalhadas(filialId?: string) {
  return useQuery({
    queryKey: ["treinamento-participacoes-detalhadas", filialId],
    queryFn: async () => {
      let query = supabase
        .from("treinamento_participacoes")
        .select(
          "*, colaborador:colaboradores(id, nome, departamento), treinamento:treinamentos(id, nome, data_realizacao, carga_horaria, finalizado, setor_alvo, filial_id)"
        );

      if (filialId) {
        query = query.eq("treinamento.filial_id", filialId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateParticipacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; participou?: boolean; nota_avaliacao?: number }) => {
      const { error } = await supabase
        .from("treinamento_participacoes")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["treinamento-participacoes"] });
      toast.success("Participação atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar participação: " + error.message);
    },
  });
}

export function useDeleteParticipacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("treinamento_participacoes")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["treinamento-participacoes"] });
      toast.success("Participação removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover participação: " + error.message);
    },
  });
}

export function useUpdateTreinamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Treinamento>) => {
      const { error } = await supabase
        .from("treinamentos")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos"] });
      queryClient.invalidateQueries({ queryKey: ["treinamentos-stats"] });
      toast.success("Treinamento atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar treinamento: " + error.message);
    },
  });
}

export function useDeleteTreinamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First delete all participations
      const { error: participacoesError } = await supabase
        .from("treinamento_participacoes")
        .delete()
        .eq("treinamento_id", id);
      
      if (participacoesError) throw participacoesError;
      
      // Then delete the treinamento
      const { error } = await supabase
        .from("treinamentos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos"] });
      queryClient.invalidateQueries({ queryKey: ["treinamentos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["participacao-anual"] });
      toast.success("Treinamento excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir treinamento: " + error.message);
    },
  });
}
