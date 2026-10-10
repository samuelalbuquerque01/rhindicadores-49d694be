export interface ColaboradorFilialAssignment {
  colaborador_id: string;
  filial_id: string;
  is_primary: boolean;
  filial: {
    id: string;
    nome: string;
  } | null;
}

export function buildColaboradorFiliaisMap(
  assignments: ColaboradorFilialAssignment[],
): Map<string, ColaboradorFilialAssignment[]> {
  const assignmentsByColaborador = new Map<string, ColaboradorFilialAssignment[]>();

  assignments.forEach((assignment) => {
    const current = assignmentsByColaborador.get(assignment.colaborador_id) ?? [];
    current.push(assignment);
    assignmentsByColaborador.set(assignment.colaborador_id, current);
  });

  return assignmentsByColaborador;
}

export function getColaboradorFilialNames(
  colaboradorId: string,
  assignmentsByColaborador: Map<string, ColaboradorFilialAssignment[]>,
): string[] {
  return (assignmentsByColaborador.get(colaboradorId) ?? [])
    .filter((assignment) => assignment.filial?.nome)
    .sort((left, right) => {
      if (left.is_primary !== right.is_primary) return left.is_primary ? -1 : 1;
      return left.filial!.nome.localeCompare(right.filial!.nome, "pt-BR");
    })
    .map((assignment) => assignment.filial!.nome);
}

export function formatColaboradorFiliais(
  colaboradorId: string,
  assignmentsByColaborador: Map<string, ColaboradorFilialAssignment[]>,
  administrativeFilialName?: string,
): string {
  const assignments = assignmentsByColaborador.get(colaboradorId) ?? [];
  const branchNames = assignments
    .filter((assignment) => assignment.filial?.nome)
    .sort((left, right) => {
      if (left.is_primary !== right.is_primary) return left.is_primary ? -1 : 1;

      return left.filial!.nome.localeCompare(right.filial!.nome, "pt-BR");
    })
    .map((assignment) => assignment.filial!.nome);

  return branchNames.join(", ") || administrativeFilialName || "-";
}