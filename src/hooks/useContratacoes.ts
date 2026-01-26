import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Contratacao } from "@/types/database";
import { toast } from "sonner";

export function useContratacoes(filialId?: string) {
  return useQuery({
    queryKey: ["contratacoes", filialId],
    queryFn: async () => {
      let query = supabase
        .from("contratacoes")
        .select("*, colaborador:colaboradores(*), filial:filiais(*)")
        .order("data_contratacao", { ascending: false });
      
      if (filialId) {
        query = query.eq("filial_id", filialId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Contratacao[];
    },
  });
}

export function useContratacaoStats(filialId?: string) {
  return useQuery({
    queryKey: ["contratacao-stats", filialId],
    queryFn: async () => {
      // Get hires from current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      
      let query = supabase
        .from("contratacoes")
        .select("*")
        .gte("data_contratacao", startOfMonth.toISOString().split("T")[0]);
      
      if (filialId) {
        query = query.eq("filial_id", filialId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const contratacoes = data as Contratacao[];
      
      return {
        totalMes: contratacoes.length,
        novasContratacoes: contratacoes.filter(c => c.tipo_contratacao === "Nova contratação").length,
        readmissoes: contratacoes.filter(c => c.tipo_contratacao === "Readmissão").length,
        transferencias: contratacoes.filter(c => c.tipo_contratacao === "Transferência").length,
      };
    },
  });
}

export function useCreateContratacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contratacao: Omit<Contratacao, "id" | "created_at" | "colaborador" | "filial">) => {
      const { data, error } = await supabase
        .from("contratacoes")
        .insert(contratacao)
        .select()
        .single();
      
      if (error) throw error;
      return data as Contratacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratacoes"] });
      queryClient.invalidateQueries({ queryKey: ["contratacao-stats"] });
      toast.success("Contratação registrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar contratação: " + error.message);
    },
  });
}
