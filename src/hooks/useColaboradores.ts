import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Colaborador } from "@/types/database";
import type { Database } from "@/integrations/supabase/types";

type ColaboradorInsert = Database["public"]["Tables"]["colaboradores"]["Insert"];
import { toast } from "sonner";

interface ColaboradoresFilters {
  filialId?: string;
  tipoColaborador?: string;
  tipoColaboradorIn?: string[];
  status?: string;
  search?: string;
}

export function useColaboradores(filters?: ColaboradoresFilters) {
  return useQuery({
    queryKey: ["colaboradores", filters],
    queryFn: async () => {
      let query = supabase
        .from("colaboradores")
        .select("*, filial:filiais!colaboradores_filial_id_fkey(*)")
        .order("nome");
      
      if (filters?.filialId) {
        query = query.eq("filial_id", filters.filialId);
      }
      if (filters?.tipoColaboradorIn && filters.tipoColaboradorIn.length > 0) {
        query = query.in("tipo_colaborador", filters.tipoColaboradorIn);
      } else if (filters?.tipoColaborador) {
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
      return (data ?? []) as Colaborador[];
    },
  });
}

interface ColaboradoresPaginadosFilters extends ColaboradoresFilters {
  page: number;
  pageSize: number;
}

export function useColaboradoresPaginados(filters: ColaboradoresPaginadosFilters) {
  return useQuery({
    queryKey: ["colaboradores-paginados", filters],
    queryFn: async () => {
      let query = supabase
        .from("colaboradores")
        .select("*, filial:filiais!colaboradores_filial_id_fkey(*)", { count: "exact" })
        .order("nome");

      if (filters?.filialId) {
        query = query.eq("filial_id", filters.filialId);
      }
      if (filters?.tipoColaboradorIn && filters.tipoColaboradorIn.length > 0) {
        query = query.in("tipo_colaborador", filters.tipoColaboradorIn);
      } else if (filters?.tipoColaborador) {
        query = query.eq("tipo_colaborador", filters.tipoColaborador);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.search) {
        query = query.ilike("nome", `%${filters.search}%`);
      }

      const page = Math.max(filters.page, 1);
      const pageSize = Math.max(filters.pageSize, 1);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;
      return {
        data: (data ?? []) as Colaborador[],
        count: count ?? 0,
      };
    },
    placeholderData: (prev) => prev,
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

interface CreateColaboradorParams {
  colaborador: Omit<Colaborador, "id" | "created_at" | "updated_at" | "filial">;
  tipo_contratacao: "Nova contratação" | "Readmissão" | "Transferência";
}

export function useCreateColaborador() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ colaborador, tipo_contratacao }: CreateColaboradorParams) => {
      // Create the collaborator first
      const { data, error } = await supabase
        .from("colaboradores")
        .insert(colaborador as unknown as ColaboradorInsert)
        .select()
        .single();
      
      if (error) throw error;
      
      const newColaborador = data as Colaborador;
      
      // Register the hiring record with the selected type
      const { error: contratacaoError } = await supabase
        .from("contratacoes")
        .insert({
          colaborador_id: newColaborador.id,
          filial_id: newColaborador.filial_id,
          data_contratacao: newColaborador.data_admissao,
          tipo_contratacao: tipo_contratacao,
          salario_inicial: newColaborador.salario_base,
        });
      
      if (contratacaoError) {
        console.error("Erro ao registrar contratação:", contratacaoError);
      }
      
      return newColaborador;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-paginados"] });
      queryClient.invalidateQueries({ queryKey: ["colaborador-filiais"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-stats"] });
      queryClient.invalidateQueries({ queryKey: ["contratacoes"] });
      queryClient.invalidateQueries({ queryKey: ["contratacao-stats"] });
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
        .update(colaborador as never)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Colaborador;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-paginados"] });
      queryClient.invalidateQueries({ queryKey: ["colaborador-filiais"] });
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
      queryClient.invalidateQueries({ queryKey: ["colaboradores-paginados"] });
      queryClient.invalidateQueries({ queryKey: ["colaborador-filiais"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-stats"] });
      toast.success("Colaborador excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir colaborador: " + error.message);
    },
  });
}
