import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AfastamentoAtivo {
  id: string;
  colaborador_id: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  dias_afastados: number;
  observacoes?: string;
}

// Get active afastamento for a specific collaborator
export function useAfastamentoAtivoByColaborador(colaboradorId?: string) {
  return useQuery({
    queryKey: ["afastamento-ativo", colaboradorId],
    queryFn: async () => {
      if (!colaboradorId) return null;

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("afastamentos")
        .select("*")
        .eq("colaborador_id", colaboradorId)
        .lte("data_inicio", today)
        .gte("data_fim", today)
        .order("data_inicio", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AfastamentoAtivo | null;
    },
    enabled: !!colaboradorId,
  });
}

// Get all active afastamentos (used for badges in list)
export function useAfastamentosAtivos(filialId?: string) {
  return useQuery({
    queryKey: ["afastamentos-ativos", filialId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      let query = supabase
        .from("afastamentos")
        .select("*, colaborador:colaboradores(id, nome, filial_id)")
        .lte("data_inicio", today)
        .gte("data_fim", today);

      const { data, error } = await query;
      if (error) throw error;

      let afastamentos = data || [];

      // Filter by filial if needed
      if (filialId) {
        afastamentos = afastamentos.filter(
          (a) => (a.colaborador as any)?.filial_id === filialId
        );
      }

      // Create a map of colaborador_id -> array of afastamentos (supports multiple per person)
      const afastamentoMap = new Map<string, AfastamentoAtivo[]>();
      afastamentos.forEach((a) => {
        if (a.colaborador_id) {
          const entry: AfastamentoAtivo = {
            id: a.id,
            colaborador_id: a.colaborador_id,
            tipo: a.tipo,
            data_inicio: a.data_inicio,
            data_fim: a.data_fim,
            dias_afastados: a.dias_afastados || 0,
            observacoes: a.observacoes || undefined,
          };
          const existing = afastamentoMap.get(a.colaborador_id) || [];
          existing.push(entry);
          afastamentoMap.set(a.colaborador_id, existing);
        }
      });

      return afastamentoMap;
    },
  });
}

// Get ALL afastamentos filtered by type for Turnover tab (not just active)
export function useAfastamentosPorTipo(tipo?: string, filialId?: string) {
  return useQuery({
    queryKey: ["afastamentos-por-tipo", tipo, filialId],
    queryFn: async () => {
      let query = supabase
        .from("afastamentos")
        .select("*, colaborador:colaboradores(*, filial:filiais!colaboradores_filial_id_fkey(*))")
        .order("data_inicio", { ascending: false });

      if (tipo && tipo !== "todos") {
        query = query.eq("tipo", tipo);
      }

      const { data, error } = await query;
      if (error) throw error;

      let afastamentos = data || [];

      // Filter by filial if needed
      if (filialId) {
        afastamentos = afastamentos.filter(
          (a) => (a.colaborador as any)?.filial_id === filialId
        );
      }

      return afastamentos;
    },
  });
}
