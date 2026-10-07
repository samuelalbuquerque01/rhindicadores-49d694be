import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LiderFormado } from "@/types/database";
import { toast } from "sonner";

export function useLideresFormados(filialId?: string) {
  return useQuery({
    queryKey: ["lideres-formados", filialId],
    queryFn: async () => {
      let query = supabase
        .from("lideres_formados")
        .select("*, colaborador:colaboradores(*, filial:filiais!colaboradores_filial_id_fkey(*))")
        .order("data_formacao", { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      
      let lideres = data as LiderFormado[];
      
      // Filter by filial if needed
      if (filialId) {
        lideres = lideres.filter(l => 
          (l.colaborador as any)?.filial_id === filialId
        );
      }
      
      return lideres;
    },
  });
}

export function useLideresStats(filialId?: string) {
  return useQuery({
    queryKey: ["lideres-stats", filialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lideres_formados")
        .select("*, colaborador:colaboradores(filial_id)");
      
      if (error) throw error;
      
      let lideres = data as LiderFormado[];
      
      if (filialId) {
        lideres = lideres.filter(l =>
          (l.colaborador as any)?.filial_id === filialId
        );
      }

      // Group by level
      const porNivel = {
        supervisor: lideres.filter(l => l.nivel === "Supervisor").length,
        coordenador: lideres.filter(l => l.nivel === "Coordenador").length,
        gerente: lideres.filter(l => l.nivel === "Gerente").length,
        diretor: lideres.filter(l => l.nivel === "Diretor").length,
      };

      // Get leaders formed this year
      const thisYear = new Date().getFullYear();
      const formadosEsteAno = lideres.filter(l => 
        new Date(l.data_formacao).getFullYear() === thisYear
      ).length;

      return {
        total: lideres.length,
        formadosEsteAno,
        porNivel,
      };
    },
  });
}

export function useCreateLiderFormado() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lider: Omit<LiderFormado, "id" | "created_at" | "colaborador">) => {
      // Insert the leader record
      const { data, error } = await supabase
        .from("lideres_formados")
        .insert(lider)
        .select()
        .single();
      
      if (error) throw error;

      // Update the employee's is_lider flag
      const { error: updateError } = await supabase
        .from("colaboradores")
        .update({ is_lider: true })
        .eq("id", lider.colaborador_id);
      
      if (updateError) throw updateError;

      return data as LiderFormado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lideres-formados"] });
      queryClient.invalidateQueries({ queryKey: ["lideres-stats"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-stats"] });
      toast.success("Líder formado registrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar líder: " + error.message);
    },
  });
}
