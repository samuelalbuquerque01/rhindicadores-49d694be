import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  buildColaboradorFiliaisMap,
  type ColaboradorFilialAssignment,
} from "@/lib/employeeFiliais";

export function useColaboradorFiliais(colaboradorIds: string[]) {
  return useQuery({
    queryKey: ["colaborador-filiais", colaboradorIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaborador_filiais")
        .select("colaborador_id, filial_id, is_primary, filial:filiais!colaborador_filiais_filial_id_fkey(id, nome)")
        .in("colaborador_id", colaboradorIds);

      if (error) throw error;

      return buildColaboradorFiliaisMap((data ?? []) as ColaboradorFilialAssignment[]);
    },
    enabled: colaboradorIds.length > 0,
  });
}