import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Filial } from "@/types/database";
import { toast } from "sonner";

export function useFiliais() {
  return useQuery({
    queryKey: ["filiais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filiais")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      return data as Filial[];
    },
  });
}

export function useCreateFilial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (filial: Omit<Filial, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("filiais")
        .insert(filial)
        .select()
        .single();
      
      if (error) throw error;
      return data as Filial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filiais"] });
      toast.success("Filial cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar filial: " + error.message);
    },
  });
}
