import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AfastamentoCompleto {
  id: string;
  colaborador_id: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  dias_afastados: number;
  observacoes: string | null;
  created_at: string;
  nome: string;
  cargo: string;
  departamento: string;
}

interface AbsenteismoAnalytics {
  totalDias: number;
  taxaAbsenteismo: number;
  mediaDiasPorColab: number;
  setorMaiorAbsenteismo: string;
  custoEstimado: number;
  topMotivos: { tipo: string; dias: number }[];
  afastamentos: AfastamentoCompleto[];
}

interface Filters {
  filialId?: string;
  mes?: string;
  setor?: string;
  tipoAfastamento?: string;
}

export function useAbsenteismoAnalytics(filters: Filters) {
  return useQuery({
    queryKey: ["absenteismo-analytics", filters],
    queryFn: async (): Promise<AbsenteismoAnalytics> => {
      const { data: raw, error } = await supabase
        .from("afastamentos")
        .select("*, colaborador:colaboradores(nome, cargo, departamento, filial_id, salario_base)")
        .order("data_inicio", { ascending: false });

      if (error) throw error;

      let items = (raw || []).map((a: any) => {
        const dInicio = new Date(a.data_inicio);
        const dFim = new Date(a.data_fim);
        const dias = a.dias_afastados || Math.max(0, Math.round((dFim.getTime() - dInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        return {
          id: a.id,
          colaborador_id: a.colaborador_id,
          tipo: a.tipo,
          data_inicio: a.data_inicio,
          data_fim: a.data_fim,
          dias_afastados: dias,
          observacoes: a.observacoes,
          created_at: a.created_at,
          nome: a.colaborador?.nome || "—",
          cargo: a.colaborador?.cargo || "—",
          departamento: a.colaborador?.departamento || "—",
          filial_id: a.colaborador?.filial_id,
          salario_base: a.colaborador?.salario_base || 0,
        };
      });

      // Apply filters
      if (filters.filialId) {
        items = items.filter((i: any) => i.filial_id === filters.filialId);
      }
      if (filters.mes) {
        items = items.filter((i: any) => i.data_inicio?.startsWith(filters.mes));
      }
      if (filters.setor && filters.setor !== "all") {
        items = items.filter((i: any) => i.departamento === filters.setor);
      }
      if (filters.tipoAfastamento && filters.tipoAfastamento !== "all") {
        items = items.filter((i: any) => i.tipo === filters.tipoAfastamento);
      }

      const totalDias = items.reduce((s: number, i: any) => s + i.dias_afastados, 0);
      const colabsUnicos = new Set(items.map((i: any) => i.colaborador_id)).size;
      const mediaDias = colabsUnicos > 0 ? Math.round((totalDias / colabsUnicos) * 10) / 10 : 0;

      // Get active employee count for rate
      let colabQuery = supabase.from("colaboradores").select("id", { count: "exact" }).eq("status", "Ativo");
      if (filters.filialId) colabQuery = colabQuery.eq("filial_id", filters.filialId);
      const { count: totalColab } = await colabQuery;
      const diasTrabalho = (totalColab || 1) * 22;
      const taxa = Math.round((totalDias / diasTrabalho) * 1000) / 10;

      // Custo estimado: (salario_base / 30) * dias_afastados
      const custoEstimado = items.reduce((s: number, i: any) => {
        const dailyCost = (i.salario_base || 0) / 30;
        return s + dailyCost * i.dias_afastados;
      }, 0);

      // Por tipo
      const porTipo: Record<string, number> = {};
      items.forEach((i: any) => {
        porTipo[i.tipo] = (porTipo[i.tipo] || 0) + i.dias_afastados;
      });
      const topMotivos = Object.entries(porTipo)
        .map(([tipo, dias]) => ({ tipo, dias }))
        .sort((a, b) => b.dias - a.dias)
        .slice(0, 3);

      // Setor com maior absenteísmo
      const porSetor: Record<string, number> = {};
      items.forEach((i: any) => {
        porSetor[i.departamento] = (porSetor[i.departamento] || 0) + i.dias_afastados;
      });
      const setorMaior = Object.entries(porSetor).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

      const afastamentos: AfastamentoCompleto[] = items.map(({ filial_id, salario_base, ...rest }: any) => rest);

      return {
        totalDias,
        taxaAbsenteismo: taxa,
        mediaDiasPorColab: mediaDias,
        setorMaiorAbsenteismo: setorMaior,
        custoEstimado: Math.round(custoEstimado * 100) / 100,
        topMotivos,
        afastamentos,
      };
    },
  });
}
