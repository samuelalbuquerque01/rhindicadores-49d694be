import { useMemo } from "react";
import { EmployeeTimeline, EmployeeTimelineEvent } from "@/components/dashboard/EmployeeTimeline";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useAfastamentos } from "@/hooks/useAfastamentos";
import { useDesligamentos } from "@/hooks/useDesligamentos";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelinePanelProps {
  filialId?: string;
}

export function TimelinePanel({ filialId }: TimelinePanelProps) {
  const { data: colaboradores = [], isLoading: loadingColaboradores } = useColaboradores({ filialId });
  const { data: afastamentos = [], isLoading: loadingAfastamentos } = useAfastamentos(filialId);
  const { data: desligamentos = [], isLoading: loadingDesligamentos } = useDesligamentos(filialId);

  const events = useMemo<EmployeeTimelineEvent[]>(() => {
    const output: EmployeeTimelineEvent[] = [];

    colaboradores.forEach((colaborador) => {
      output.push({
        id: `hire-${colaborador.id}`,
        employeeId: colaborador.id,
        employeeName: colaborador.nome,
        sector: colaborador.departamento || "Sem setor",
        date: colaborador.data_admissao,
        type: "hire",
        title: "Contratacao",
        description: `${colaborador.nome} entrou como ${colaborador.cargo}.`,
      });

      if (colaborador.data_desligamento) {
        output.push({
          id: `termination-${colaborador.id}-${colaborador.data_desligamento}`,
          employeeId: colaborador.id,
          employeeName: colaborador.nome,
          sector: colaborador.departamento || "Sem setor",
          date: colaborador.data_desligamento,
          type: "termination",
          title: "Data de desligamento",
          description: "Desligamento registrado na base de RH.",
        });
      }
    });

    afastamentos.forEach((afastamento) => {
      const employeeName = afastamento.colaborador?.nome || "Colaborador";
      const sector = afastamento.colaborador?.departamento || "Sem setor";
      const isVacation = (afastamento.tipo || "").toLowerCase().includes("fer");

      output.push({
        id: `absence-${afastamento.id}`,
        employeeId: afastamento.colaborador_id,
        employeeName,
        sector,
        date: afastamento.data_inicio,
        type: isVacation ? "vacation" : "absence",
        title: isVacation ? "Inicio de ferias" : `Afastamento: ${afastamento.tipo}`,
        description: afastamento.observacoes || "Sem detalhes adicionais.",
        durationDays: afastamento.dias_afastados || undefined,
      });
    });

    desligamentos.forEach((desligamento) => {
      output.push({
        id: `dismissal-${desligamento.id}`,
        employeeId: desligamento.colaborador_id,
        employeeName: desligamento.colaborador?.nome || "Colaborador",
        sector: desligamento.colaborador?.departamento || "Sem setor",
        date: desligamento.data_desligamento,
        type: "termination",
        title: `Desligamento: ${desligamento.motivo}`,
        description: desligamento.observacoes || "Sem detalhes adicionais.",
      });
    });

    return output;
  }, [afastamentos, colaboradores, desligamentos]);

  if (loadingColaboradores || loadingAfastamentos || loadingDesligamentos) {
    return <Skeleton className="h-[480px] w-full" />;
  }

  return <EmployeeTimeline events={events} />;
}
