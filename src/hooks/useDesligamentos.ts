import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Desligamento } from "@/types/database";
import { toast } from "sonner";

export function useDesligamentos(filialId?: string) {
  return useQuery({
    queryKey: ["desligamentos", filialId],
    queryFn: async () => {
      let query = supabase
        .from("desligamentos")
        .select("*, colaborador:colaboradores(*, filial:filiais(*))")
        .order("data_desligamento", { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      
      let desligamentos = data as Desligamento[];
      
      // Filter by filial if needed
      if (filialId) {
        desligamentos = desligamentos.filter(d => 
          (d.colaborador as any)?.filial_id === filialId
        );
      }
      
      return desligamentos;
    },
  });
}

export function useTurnoverStats(filialId?: string) {
  return useQuery({
    queryKey: ["turnover-stats", filialId],
    queryFn: async () => {
      // Get all active employees
      let colaboradoresQuery = supabase
        .from("colaboradores")
        .select("*")
        .eq("status", "Ativo");
      
      if (filialId) {
        colaboradoresQuery = colaboradoresQuery.eq("filial_id", filialId);
      }
      
      const { data: colaboradores, error: colaboradoresError } = await colaboradoresQuery;
      if (colaboradoresError) throw colaboradoresError;

      // Get terminations from last 12 months
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      let desligamentosQuery = supabase
        .from("desligamentos")
        .select("*, colaborador:colaboradores(filial_id)")
        .gte("data_desligamento", oneYearAgo.toISOString().split("T")[0]);
      
      const { data: desligamentos, error: desligamentosError } = await desligamentosQuery;
      if (desligamentosError) throw desligamentosError;

      let filteredDesligamentos = desligamentos as Desligamento[];
      if (filialId) {
        filteredDesligamentos = filteredDesligamentos.filter(d =>
          (d.colaborador as any)?.filial_id === filialId
        );
      }

      const totalColaboradores = colaboradores.length;
      const totalDesligamentos = filteredDesligamentos.length;
      const turnoverPercentual = totalColaboradores > 0 
        ? (totalDesligamentos / totalColaboradores) * 100 
        : 0;
      
      const custoTotal = filteredDesligamentos.reduce(
        (sum, d) => sum + (d.custo_rescisao || 0), 
        0
      );

      // Group by reason
      const porMotivo = {
        pedido: filteredDesligamentos.filter(d => d.motivo === "Pedido de demissão").length,
        empresa: filteredDesligamentos.filter(d => d.motivo === "Iniciativa da empresa").length,
        contrato: filteredDesligamentos.filter(d => d.motivo === "Término de contrato").length,
      };

      return {
        totalDesligamentos,
        turnoverPercentual: Math.round(turnoverPercentual * 10) / 10,
        custoTotal,
        porMotivo,
      };
    },
  });
}

export function useCreateDesligamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (desligamento: Omit<Desligamento, "id" | "created_at" | "colaborador">) => {
      // First, insert the termination
      const { data, error } = await supabase
        .from("desligamentos")
        .insert(desligamento)
        .select()
        .single();
      
      if (error) throw error;

      // Then, update the employee status
      const { error: updateError } = await supabase
        .from("colaboradores")
        .update({ 
          status: "Inativo", 
          data_desligamento: desligamento.data_desligamento 
        })
        .eq("id", desligamento.colaborador_id);
      
      if (updateError) throw updateError;

      return data as Desligamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desligamentos"] });
      queryClient.invalidateQueries({ queryKey: ["turnover-stats"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-stats"] });
      toast.success("Desligamento registrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar desligamento: " + error.message);
    },
  });
}

export function useUpdateDesligamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      data_desligamento?: string;
      motivo?: string;
      custo_rescisao?: number | null;
      observacoes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("desligamentos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desligamentos"] });
      queryClient.invalidateQueries({ queryKey: ["turnover-stats"] });
      queryClient.invalidateQueries({ queryKey: ["turnover-analytics"] });
      toast.success("Desligamento atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar desligamento: " + error.message);
    },
  });
}

export function useDeleteDesligamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("desligamentos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desligamentos"] });
      queryClient.invalidateQueries({ queryKey: ["turnover-stats"] });
      queryClient.invalidateQueries({ queryKey: ["turnover-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Desligamento excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir desligamento: " + error.message);
    },
  });
}
