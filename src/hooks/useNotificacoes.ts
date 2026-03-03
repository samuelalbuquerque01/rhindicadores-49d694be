import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useColaboradores } from "./useColaboradores";
import { useAfastamentos } from "./useAfastamentos";
import { useTreinamentos } from "./useTreinamentos";
import { useEventos } from "./useEventos";
import { useEffect } from "react";
import { differenceInDays, parseISO, isToday, format } from "date-fns";

export interface Notificacao {
  id: string;
  tipo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  prioridade: 'baixa' | 'media' | 'alta';
  colaborador_id?: string;
  created_at: string;
}

export function useNotificacoes() {
  const queryClient = useQueryClient();
  const { data: colaboradores } = useColaboradores();
  const { data: afastamentos } = useAfastamentos();
  const { data: treinamentos } = useTreinamentos();
  const { data: eventos } = useEventos();

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ["notificacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .order("data", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notificacao[];
    },
  });

  const marcarComoLida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  const marcarTodasComoLidas = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("lida", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  // Generate notifications based on rules
  useEffect(() => {
    if (!colaboradores?.length) return;

    const generateNotifications = async () => {
      const hoje = new Date();
      const novas: Omit<Notificacao, "id" | "created_at">[] = [];

      // Get existing notification messages to avoid duplicates (today only)
      const todayStr = format(hoje, "yyyy-MM-dd");
      const { data: existingToday } = await supabase
        .from("notificacoes")
        .select("mensagem")
        .gte("created_at", `${todayStr}T00:00:00`)
        .lte("created_at", `${todayStr}T23:59:59`);

      const existingMessages = new Set((existingToday || []).map((n: any) => n.mensagem));

      const ativos = colaboradores.filter((c) => c.status === "Ativo");

      for (const col of ativos) {
        // 1. Birthday
        if (col.data_nascimento) {
          const nasc = parseISO(col.data_nascimento);
          const anivHoje = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate());
          if (isToday(anivHoje)) {
            const msg = `🎂 Hoje é aniversário de ${col.nome}!`;
            if (!existingMessages.has(msg)) {
              novas.push({ tipo: "aniversario", mensagem: msg, data: hoje.toISOString(), lida: false, prioridade: "baixa", colaborador_id: col.id });
            }
          }
        }

        // 2. Experience period (90 days)
        const admissao = parseISO(col.data_admissao);
        const diasDesdeAdmissao = differenceInDays(hoje, admissao);
        if (diasDesdeAdmissao >= 80 && diasDesdeAdmissao <= 90) {
          const msg = `⏳ ${col.nome} está no fim do período de experiência (${diasDesdeAdmissao} dias).`;
          if (!existingMessages.has(msg)) {
            novas.push({ tipo: "experiencia", mensagem: msg, data: hoje.toISOString(), lida: false, prioridade: "alta", colaborador_id: col.id });
          }
        }
      }

      // 3. Upcoming vacations (afastamentos tipo Férias within 30 days)
      if (afastamentos?.length) {
        for (const af of afastamentos) {
          if (af.tipo === "Férias") {
            const inicio = parseISO(af.data_inicio);
            const diasAte = differenceInDays(inicio, hoje);
            if (diasAte > 0 && diasAte <= 30) {
              const colName = af.colaborador?.nome || "Colaborador";
              const msg = `🏖️ Férias de ${colName} começam em ${diasAte} dias.`;
              if (!existingMessages.has(msg)) {
                novas.push({ tipo: "ferias", mensagem: msg, data: hoje.toISOString(), lida: false, prioridade: diasAte <= 7 ? "alta" : "media", colaborador_id: af.colaborador_id });
              }
            }
          }
        }
      }

      // 4. Upcoming events (3 days)
      if (eventos?.length) {
        for (const ev of eventos) {
          if (!ev.finalizado) {
            const dataEvento = parseISO(ev.data_evento);
            const diasAte = differenceInDays(dataEvento, hoje);
            if (diasAte >= 0 && diasAte <= 3) {
              const msg = `📅 Evento "${ev.nome}" acontece em ${diasAte === 0 ? "hoje" : `${diasAte} dia(s)`}.`;
              if (!existingMessages.has(msg)) {
                novas.push({ tipo: "evento", mensagem: msg, data: hoje.toISOString(), lida: false, prioridade: diasAte === 0 ? "alta" : "media" });
              }
            }
          }
        }
      }

      // 5. Pending trainings (not finalized)
      if (treinamentos?.length) {
        const pendentes = treinamentos.filter((t) => !t.finalizado);
        for (const tr of pendentes) {
          const dataTr = parseISO(tr.data_realizacao);
          const diasAte = differenceInDays(dataTr, hoje);
          if (diasAte >= 0 && diasAte <= 7) {
            const msg = `📚 Treinamento "${tr.nome}" ${diasAte === 0 ? "é hoje" : `em ${diasAte} dia(s)`}.`;
            if (!existingMessages.has(msg)) {
              novas.push({ tipo: "treinamento", mensagem: msg, data: hoje.toISOString(), lida: false, prioridade: diasAte <= 1 ? "alta" : "media" });
            }
          }
        }
      }

      // 6. High absenteeism (>5 active absences this month)
      if (afastamentos?.length) {
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        const afastMes = afastamentos.filter((a) => {
          const d = parseISO(a.data_inicio);
          return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        });
        if (afastMes.length > 5) {
          const msg = `⚠️ Alto absenteísmo este mês: ${afastMes.length} afastamentos registrados.`;
          if (!existingMessages.has(msg)) {
            novas.push({ tipo: "absenteismo", mensagem: msg, data: hoje.toISOString(), lida: false, prioridade: "alta" });
          }
        }
      }

      // Insert new notifications
      if (novas.length > 0) {
        await supabase.from("notificacoes").insert(novas);
        queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
      }
    };

    generateNotifications();
  }, [colaboradores, afastamentos, treinamentos, eventos, queryClient]);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return {
    notificacoes,
    naoLidas,
    isLoading,
    marcarComoLida: marcarComoLida.mutate,
    marcarTodasComoLidas: marcarTodasComoLidas.mutate,
  };
}
