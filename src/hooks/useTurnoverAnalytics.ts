import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TurnoverAnalytics {
  totalDesligamentos: number;
  turnoverVoluntario: number;
  turnoverInvoluntario: number;
  tempoMedioPermanencia: number;
  custoTotal: number;
  porMotivo: Record<string, number>;
  topMotivos: { motivo: string; count: number }[];
  setorMaiorTurnover: string;
  desligamentos: DesligamentoCompleto[];
}

export interface DesligamentoCompleto {
  id: string;
  colaborador_id: string | null;
  data_desligamento: string;
  motivo: string;
  custo_rescisao: number | null;
  observacoes: string | null;
  created_at: string;
  nome: string;
  cargo: string;
  departamento: string;
  data_admissao: string;
  tempo_empresa: number; // in days
}

interface Filters {
  filialId?: string;
  mes?: string; // "YYYY-MM"
  setor?: string;
  tipoDesligamento?: string;
}

export function useTurnoverAnalytics(filters: Filters) {
  return useQuery({
    queryKey: ["turnover-analytics", filters],
    queryFn: async (): Promise<TurnoverAnalytics> => {
      // Fetch desligamentos with colaborador info
      const { data: desligamentosRaw, error: dErr } = await supabase
        .from("desligamentos")
        .select("*, colaborador:colaboradores(nome, cargo, departamento, data_admissao, filial_id)")
        .order("data_desligamento", { ascending: false });

      if (dErr) throw dErr;

      let items = (desligamentosRaw || []).map((d: any) => ({
        id: d.id,
        colaborador_id: d.colaborador_id,
        data_desligamento: d.data_desligamento,
        motivo: d.motivo,
        custo_rescisao: d.custo_rescisao,
        observacoes: d.observacoes,
        created_at: d.created_at,
        nome: d.colaborador?.nome || "—",
        cargo: d.colaborador?.cargo || "—",
        departamento: d.colaborador?.departamento || "—",
        data_admissao: d.colaborador?.data_admissao || "",
        filial_id: d.colaborador?.filial_id,
        tempo_empresa: 0,
      }));

      // Apply filters
      if (filters.filialId) {
        items = items.filter((i: any) => i.filial_id === filters.filialId);
      }
      if (filters.mes) {
        items = items.filter((i: any) => i.data_desligamento?.startsWith(filters.mes));
      }
      if (filters.setor && filters.setor !== "all") {
        items = items.filter((i: any) => i.departamento === filters.setor);
      }
      if (filters.tipoDesligamento && filters.tipoDesligamento !== "all") {
        items = items.filter((i: any) => i.motivo === filters.tipoDesligamento);
      }

      // Compute tempo_empresa
      items = items.map((i: any) => {
        if (i.data_admissao && i.data_desligamento) {
          const diff = new Date(i.data_desligamento).getTime() - new Date(i.data_admissao).getTime();
          i.tempo_empresa = Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
        }
        return i;
      });

      // Get total active employees for percentages
      let colabQuery = supabase.from("colaboradores").select("id", { count: "exact" });
      if (filters.filialId) colabQuery = colabQuery.eq("filial_id", filters.filialId);
      const { count: totalColab } = await colabQuery;
      const base = (totalColab || 0) + items.length; // approximate headcount

      const voluntarios = items.filter((i: any) => i.motivo === "Pedido de demissão").length;
      const involuntarios = items.filter((i: any) => i.motivo === "Iniciativa da empresa").length;

      const tempoTotal = items.reduce((sum: number, i: any) => sum + i.tempo_empresa, 0);
      const tempoMedio = items.length > 0 ? Math.round(tempoTotal / items.length) : 0;

      const custoTotal = items.reduce((sum: number, i: any) => sum + (i.custo_rescisao || 0), 0);

      // por motivo
      const porMotivo: Record<string, number> = {};
      items.forEach((i: any) => {
        porMotivo[i.motivo] = (porMotivo[i.motivo] || 0) + 1;
      });

      // top motivos
      const topMotivos = Object.entries(porMotivo)
        .map(([motivo, count]) => ({ motivo, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // setor com maior turnover
      const porSetor: Record<string, number> = {};
      items.forEach((i: any) => {
        porSetor[i.departamento] = (porSetor[i.departamento] || 0) + 1;
      });
      const setorMaiorTurnover = Object.entries(porSetor)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

      // Clean items for return
      const desligamentos: DesligamentoCompleto[] = items.map(({ filial_id, ...rest }: any) => rest);

      return {
        totalDesligamentos: items.length,
        turnoverVoluntario: base > 0 ? Math.round((voluntarios / base) * 1000) / 10 : 0,
        turnoverInvoluntario: base > 0 ? Math.round((involuntarios / base) * 1000) / 10 : 0,
        tempoMedioPermanencia: tempoMedio,
        custoTotal,
        porMotivo,
        topMotivos,
        setorMaiorTurnover,
        desligamentos,
      };
    },
  });
}

export function useSetoresDisponiveis() {
  return useQuery({
    queryKey: ["setores-disponiveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("departamento");
      if (error) throw error;
      const setores = [...new Set(data?.map(d => d.departamento).filter(Boolean))].sort();
      return setores as string[];
    },
  });
}
