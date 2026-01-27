import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Colaborador } from "@/types/database";
import { toast } from "sonner";

interface ColaboradoresFilters {
  filialId?: string;
  tipoColaborador?: string;
  status?: string;
  search?: string;
}

export function useColaboradores(filters?: ColaboradoresFilters) {
  return useQuery({
    queryKey: ["colaboradores", filters],
    queryFn: async () => {
      let query = supabase
        .from("colaboradores")
        .select("*, filial:filiais(*)")
        .order("nome");
      
      if (filters?.filialId) {
        query = query.eq("filial_id", filters.filialId);
      }
      if (filters?.tipoColaborador) {
        query = query.eq("tipo_colaborador", filters.tipoColaborador);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.search) {
        query = query.ilike("nome", `%${filters.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Colaborador[];
    },
  });
}

export function useColaboradoresStats(filialId?: string) {
  return useQuery({
    queryKey: ["colaboradores-stats", filialId],
    queryFn: async () => {
      let query = supabase.from("colaboradores").select("*");
      
      if (filialId) {
        query = query.eq("filial_id", filialId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const colaboradores = data as Colaborador[];
      const ativos = colaboradores.filter(c => c.status === "Ativo");
      
      return {
        total: colaboradores.length,
        ativos: ativos.length,
        porTipo: {
          administrativo: ativos.filter(c => c.tipo_colaborador === "CLT Administrativo").length,
          corpoClinico: ativos.filter(c => c.tipo_colaborador === "CLT Corpo Clínico").length,
          pj: ativos.filter(c => c.tipo_colaborador === "PJ").length,
          estagiarios: ativos.filter(c => c.tipo_colaborador === "Estagiário").length,
        },
        custoTotal: ativos.reduce((sum, c) => sum + (c.custo_mensal || c.salario_base || 0), 0),
        lideres: ativos.filter(c => c.is_lider).length,
      };
    },
  });
}

export function useCreateColaborador() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (colaborador: Omit<Colaborador, "id" | "created_at" | "updated_at" | "filial">) => {
      const { data, error } = await supabase
        .from("colaboradores")
        .insert(colaborador)
        .select()
        .single();
      
      if (error) throw error;
      return data as Colaborador;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-stats"] });
      toast.success("Colaborador cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar colaborador: " + error.message);
    },
  });
}

export function useUpdateColaborador() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...colaborador }: Partial<Colaborador> & { id: string }) => {
      const { data, error } = await supabase
        .from("colaboradores")
        .update(colaborador)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Colaborador;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-stats"] });
      toast.success("Colaborador atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar colaborador: " + error.message);
    },
  });
}

export function useDeleteColaborador() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("colaboradores")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-stats"] });
      toast.success("Colaborador excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir colaborador: " + error.message);
    },
  });
}
