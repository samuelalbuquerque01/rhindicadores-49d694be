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
        sector: colaborador.departamento || "Unassigned",
        date: colaborador.data_admissao,
        type: "hire",
        title: "Hired",
        description: `${colaborador.nome} joined as ${colaborador.cargo}.`,
      });

      if (colaborador.data_desligamento) {
        output.push({
          id: `termination-${colaborador.id}-${colaborador.data_desligamento}`,
          employeeId: colaborador.id,
          employeeName: colaborador.nome,
          sector: colaborador.departamento || "Unassigned",
          date: colaborador.data_desligamento,
          type: "termination",
          title: "Termination date",
          description: "Employee termination recorded in HR base.",
        });
      }
    });

    afastamentos.forEach((afastamento) => {
      const employeeName = afastamento.colaborador?.nome || "Employee";
      const sector = afastamento.colaborador?.departamento || "Unassigned";
      const isVacation = (afastamento.tipo || "").toLowerCase().includes("fer");

      output.push({
        id: `absence-${afastamento.id}`,
        employeeId: afastamento.colaborador_id,
        employeeName,
        sector,
        date: afastamento.data_inicio,
        type: isVacation ? "vacation" : "absence",
        title: isVacation ? "Vacation start" : `Absence: ${afastamento.tipo}`,
        description: afastamento.observacoes || "No extra details.",
        durationDays: afastamento.dias_afastados || undefined,
      });
    });

    desligamentos.forEach((desligamento) => {
      output.push({
        id: `dismissal-${desligamento.id}`,
        employeeId: desligamento.colaborador_id,
        employeeName: desligamento.colaborador?.nome || "Employee",
        sector: desligamento.colaborador?.departamento || "Unassigned",
        date: desligamento.data_desligamento,
        type: "termination",
        title: `Dismissal: ${desligamento.motivo}`,
        description: desligamento.observacoes || "No extra details.",
      });
    });

    return output;
  }, [afastamentos, colaboradores, desligamentos]);

  if (loadingColaboradores || loadingAfastamentos || loadingDesligamentos) {
    return <Skeleton className="h-[480px] w-full" />;
  }

  return <EmployeeTimeline events={events} />;
}
