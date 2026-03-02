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
      return data as (Evento & { finalizado?: boolean })[];
    },
  });
}

export function useFinalizarEvento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("eventos")
        .update({ finalizado: true })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["eventos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["participacao-anual"] });
      toast.success("Evento finalizado!");
    },
    onError: (error) => {
      toast.error("Erro ao finalizar evento: " + error.message);
    },
  });
}

export function useReabrirEvento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("eventos")
        .update({ finalizado: false })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["eventos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["participacao-anual"] });
      toast.success("Evento reaberto!");
    },
    onError: (error) => {
      toast.error("Erro ao reabrir evento: " + error.message);
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
        .select("*, evento:eventos(*), colaborador:colaboradores(departamento)");
      if (participacoesError) throw participacoesError;

      const eventosList = (eventos || []) as Evento[];
      const participacoesList = (participacoes || []) as (EventoParticipacao & {
        evento?: Evento;
        colaborador?: { departamento?: string | null };
      })[];

      // Filter participations by filial if needed
      const filteredParticipacoes = filialId
        ? participacoesList.filter(p => (p.evento as any)?.filial_id === filialId)
        : participacoesList;

      const totalEventos = eventosList.length;
      const totalConfirmados = filteredParticipacoes.filter(p => p.confirmou_presenca).length;
      const totalCompareceram = filteredParticipacoes.filter(p => p.compareceu).length;
      const totalParticipantes = totalCompareceram;
      const faltaram = Math.max(totalConfirmados - totalCompareceram, 0);
      const taxaComparecimento = totalConfirmados > 0 ? (totalCompareceram / totalConfirmados) * 100 : 0;
      const mediaParticipacao = totalEventos > 0 ? totalParticipantes / totalEventos : 0;

      const setorStats = new Map<string, number>();
      filteredParticipacoes.forEach((p) => {
        if (!p.compareceu) return;
        const setor = p.colaborador?.departamento || "Sem setor";
        setorStats.set(setor, (setorStats.get(setor) || 0) + 1);
      });
      const setorMaisEngajado = Array.from(setorStats.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

      const eventoCounts = new Map<string, { nome: string; total: number }>();
      filteredParticipacoes.forEach((p) => {
        if (!p.evento) return;
        const key = p.evento.id;
        const current = eventoCounts.get(key) || { nome: p.evento.nome, total: 0 };
        if (p.compareceu) current.total += 1;
        eventoCounts.set(key, current);
      });

      const topEventos = Array.from(eventoCounts.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

      return {
        totalEventos,
        totalParticipantes,
        totalConfirmados,
        totalCompareceram,
        faltaram,
        taxaComparecimento: Math.round(taxaComparecimento * 10) / 10,
        mediaParticipacao: Math.round(mediaParticipacao * 10) / 10,
        setorMaisEngajado,
        topEventos,
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
      queryClient.invalidateQueries({ queryKey: ["evento-participacoes-detalhadas"] });
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
        .select("*, colaborador:colaboradores(id, nome, departamento), evento:eventos(*)");
      
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

export function useEventosParticipacoesDetalhadas(filialId?: string) {
  return useQuery({
    queryKey: ["evento-participacoes-detalhadas", filialId],
    queryFn: async () => {
      let query = supabase
        .from("evento_participacoes")
        .select(
          "*, colaborador:colaboradores(id, nome, departamento), evento:eventos(id, nome, data_evento, setor_alvo, filial_id)"
        );

      if (filialId) {
        query = query.eq("evento.filial_id", filialId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
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
      queryClient.invalidateQueries({ queryKey: ["evento-participacoes-detalhadas"] });
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
      queryClient.invalidateQueries({ queryKey: ["evento-participacoes-detalhadas"] });
      toast.success("Participação removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover participação: " + error.message);
    },
  });
}

export function useUpdateEvento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Evento>) => {
      const { error } = await supabase
        .from("eventos")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["eventos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["evento-participacoes-detalhadas"] });
      toast.success("Evento atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar evento: " + error.message);
    },
  });
}

export function useDeleteEvento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First delete all participations
      const { error: participacoesError } = await supabase
        .from("evento_participacoes")
        .delete()
        .eq("evento_id", id);
      
      if (participacoesError) throw participacoesError;
      
      // Then delete the evento
      const { error } = await supabase
        .from("eventos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["eventos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["participacao-anual"] });
      toast.success("Evento excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir evento: " + error.message);
    },
  });
}
