import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Afastamento } from "@/types/database";
import { toast } from "sonner";

export function useAfastamentos(filialId?: string) {
  return useQuery({
    queryKey: ["afastamentos", filialId],
    queryFn: async () => {
      let query = supabase
        .from("afastamentos")
        .select("*, colaborador:colaboradores(*, filial:filiais(*))")
        .order("data_inicio", { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      
      let afastamentos = data as Afastamento[];
      
      // Filter by filial if needed
      if (filialId) {
        afastamentos = afastamentos.filter(a => 
          (a.colaborador as any)?.filial_id === filialId
        );
      }
      
      return afastamentos;
    },
  });
}

export function useAbsenteismoStats(filialId?: string) {
  return useQuery({
    queryKey: ["absenteismo-stats", filialId],
    queryFn: async () => {
      // Get active employees
      let colaboradoresQuery = supabase
        .from("colaboradores")
        .select("*")
        .eq("status", "Ativo");
      
      if (filialId) {
        colaboradoresQuery = colaboradoresQuery.eq("filial_id", filialId);
      }
      
      const { data: colaboradores, error: colaboradoresError } = await colaboradoresQuery;
      if (colaboradoresError) throw colaboradoresError;

      // Get absences from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let afastamentosQuery = supabase
        .from("afastamentos")
        .select("*, colaborador:colaboradores(filial_id)")
        .gte("data_inicio", thirtyDaysAgo.toISOString().split("T")[0]);
      
      const { data: afastamentos, error: afastamentosError } = await afastamentosQuery;
      if (afastamentosError) throw afastamentosError;

      let filteredAfastamentos = afastamentos as Afastamento[];
      if (filialId) {
        filteredAfastamentos = filteredAfastamentos.filter(a =>
          (a.colaborador as any)?.filial_id === filialId
        );
      }

      const totalColaboradores = colaboradores.length;
      const diasTrabalhoPossivel = totalColaboradores * 22; // 22 dias úteis
      const diasAfastados = filteredAfastamentos.reduce(
        (sum, a) => sum + (a.dias_afastados || 0), 
        0
      );
      
      const taxaAbsenteismo = diasTrabalhoPossivel > 0 
        ? (diasAfastados / diasTrabalhoPossivel) * 100 
        : 0;

      // Group by type
      const porTipo = {
        atestado: filteredAfastamentos.filter(a => a.tipo === "Atestado médico").reduce((sum, a) => sum + (a.dias_afastados || 0), 0),
        bancoHoras: filteredAfastamentos.filter(a => a.tipo === "Banco de horas").reduce((sum, a) => sum + (a.dias_afastados || 0), 0),
        ferias: filteredAfastamentos.filter(a => a.tipo === "Férias").reduce((sum, a) => sum + (a.dias_afastados || 0), 0),
        licencaMaternidade: filteredAfastamentos.filter(a => a.tipo === "Licença maternidade").reduce((sum, a) => sum + (a.dias_afastados || 0), 0),
        licencaPaternidade: filteredAfastamentos.filter(a => a.tipo === "Licença paternidade").reduce((sum, a) => sum + (a.dias_afastados || 0), 0),
        outro: filteredAfastamentos.filter(a => a.tipo === "Outro").reduce((sum, a) => sum + (a.dias_afastados || 0), 0),
      };

      return {
        totalDiasAfastados: diasAfastados,
        taxaAbsenteismo: Math.round(taxaAbsenteismo * 10) / 10,
        totalAfastamentos: filteredAfastamentos.length,
        porTipo,
      };
    },
  });
}

export function useCreateAfastamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (afastamento: Omit<Afastamento, "id" | "created_at" | "dias_afastados" | "colaborador">) => {
      const { data, error } = await supabase
        .from("afastamentos")
        .insert(afastamento)
        .select()
        .single();
      
      if (error) throw error;
      return data as Afastamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["afastamentos"] });
      queryClient.invalidateQueries({ queryKey: ["absenteismo-stats"] });
      toast.success("Afastamento registrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar afastamento: " + error.message);
    },
  });
}
