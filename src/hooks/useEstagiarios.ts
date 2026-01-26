import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Colaborador, Afastamento } from "@/types/database";

export function useEstagiariosStats(filialId?: string) {
  return useQuery({
    queryKey: ["estagiarios-stats", filialId],
    queryFn: async () => {
      // Get all interns
      let colaboradoresQuery = supabase
        .from("colaboradores")
        .select("*")
        .eq("tipo_colaborador", "Estagiário")
        .eq("status", "Ativo");
      
      if (filialId) {
        colaboradoresQuery = colaboradoresQuery.eq("filial_id", filialId);
      }
      
      const { data: colaboradores, error: colaboradoresError } = await colaboradoresQuery;
      if (colaboradoresError) throw colaboradoresError;

      const estagiarios = colaboradores as Colaborador[];
      const estagiariosIds = estagiarios.map(e => e.id);

      // Get absences for interns in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let afastamentosQuery = supabase
        .from("afastamentos")
        .select("*")
        .gte("data_inicio", thirtyDaysAgo.toISOString().split("T")[0]);
      
      if (estagiariosIds.length > 0) {
        afastamentosQuery = afastamentosQuery.in("colaborador_id", estagiariosIds);
      }
      
      const { data: afastamentos, error: afastamentosError } = await afastamentosQuery;
      if (afastamentosError) throw afastamentosError;

      const afastamentosList = (afastamentos || []) as Afastamento[];

      const totalEstagiarios = estagiarios.length;
      const custoTotal = estagiarios.reduce((sum, e) => sum + (e.custo_mensal || e.salario_base || 0), 0);
      const diasAfastados = afastamentosList.reduce((sum, a) => sum + (a.dias_afastados || 0), 0);
      const diasTrabalhoPossivel = totalEstagiarios * 22;
      const taxaAbsenteismo = diasTrabalhoPossivel > 0 
        ? (diasAfastados / diasTrabalhoPossivel) * 100 
        : 0;

      return {
        total: totalEstagiarios,
        custoTotal,
        custoMedio: totalEstagiarios > 0 ? custoTotal / totalEstagiarios : 0,
        diasAfastados,
        taxaAbsenteismo: Math.round(taxaAbsenteismo * 10) / 10,
      };
    },
  });
}
