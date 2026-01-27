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
      return data as Treinamento[];
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
        .select("*, treinamento:treinamentos(*)");
      if (participacoesError) throw participacoesError;

      const treinamentosList = treinamentos as Treinamento[];
      const participacoesList = participacoes as TreinamentoParticipacao[];

      // Filter participations by filial if needed
      const filteredParticipacoes = filialId
        ? participacoesList.filter(p => (p.treinamento as any)?.filial_id === filialId)
        : participacoesList;

      const totalTreinamentos = treinamentosList.length;
      const totalVagas = treinamentosList.reduce((sum, t) => sum + (t.vagas_totais || 0), 0);
      const totalParticipantes = filteredParticipacoes.filter(p => p.participou).length;
      const taxaParticipacao = totalVagas > 0 ? (totalParticipantes / totalVagas) * 100 : 0;

      return {
        totalTreinamentos,
        totalVagas,
        totalParticipantes,
        taxaParticipacao: Math.round(taxaParticipacao * 10) / 10,
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
