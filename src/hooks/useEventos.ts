import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Evento, EventoParticipacao } from "@/types/database";
import { toast } from "sonner";

export function useEventos(filialId?: string) {
  return useQuery({
    queryKey: ["eventos", filialId],
    queryFn: async () => {
      let query = supabase
        .from("eventos")
        .select("*, filial:filiais(*)")
        .order("data_evento", { ascending: false });
      
      if (filialId) {
        query = query.eq("filial_id", filialId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Evento[];
    },
  });
}

export function useEventosStats(filialId?: string) {
  return useQuery({
    queryKey: ["eventos-stats", filialId],
    queryFn: async () => {
      // Get all events
      let eventosQuery = supabase.from("eventos").select("*");
      if (filialId) {
        eventosQuery = eventosQuery.eq("filial_id", filialId);
      }
      const { data: eventos, error: eventosError } = await eventosQuery;
      if (eventosError) throw eventosError;

      // Get all participations
      const { data: participacoes, error: participacoesError } = await supabase
        .from("evento_participacoes")
        .select("*, evento:eventos(*)");
      if (participacoesError) throw participacoesError;

      const eventosList = eventos as Evento[];
      const participacoesList = participacoes as EventoParticipacao[];

      // Filter participations by filial if needed
      const filteredParticipacoes = filialId
        ? participacoesList.filter(p => (p.evento as any)?.filial_id === filialId)
        : participacoesList;

      const totalEventos = eventosList.length;
      const totalConfirmados = filteredParticipacoes.filter(p => p.confirmou_presenca).length;
      const totalCompareceram = filteredParticipacoes.filter(p => p.compareceu).length;
      const taxaEngajamento = totalConfirmados > 0 ? (totalCompareceram / totalConfirmados) * 100 : 0;

      return {
        totalEventos,
        totalConfirmados,
        totalCompareceram,
        taxaEngajamento: Math.round(taxaEngajamento * 10) / 10,
      };
    },
  });
}

export function useCreateEvento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (evento: Omit<Evento, "id" | "created_at" | "filial">) => {
      const { data, error } = await supabase
        .from("eventos")
        .insert(evento)
        .select()
        .single();
      
      if (error) throw error;
      return data as Evento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["eventos-stats"] });
      toast.success("Evento cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar evento: " + error.message);
    },
  });
}

export function useCreateEventoParticipacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (participacao: Omit<EventoParticipacao, "id" | "created_at" | "evento" | "colaborador">) => {
      const { data, error } = await supabase
        .from("evento_participacoes")
        .insert(participacao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["evento-participacoes"] });
      toast.success("Participação registrada!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar participação: " + error.message);
    },
  });
}

export function useEventoParticipacoes(eventoId?: string) {
  return useQuery({
    queryKey: ["evento-participacoes", eventoId],
    queryFn: async () => {
      let query = supabase
        .from("evento_participacoes")
        .select("*, colaborador:colaboradores(id, nome), evento:eventos(*)");
      
      if (eventoId) {
        query = query.eq("evento_id", eventoId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!eventoId,
  });
}

export function useUpdateEventoParticipacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; confirmou_presenca?: boolean; compareceu?: boolean }) => {
      const { error } = await supabase
        .from("evento_participacoes")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["evento-participacoes"] });
      toast.success("Participação atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar participação: " + error.message);
    },
  });
}

export function useDeleteEventoParticipacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("evento_participacoes")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["evento-participacoes"] });
      toast.success("Participação removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover participação: " + error.message);
    },
  });
}
