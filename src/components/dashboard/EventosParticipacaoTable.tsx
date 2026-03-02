import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEventosParticipacoesDetalhadas } from "@/hooks/useEventos";

interface EventosParticipacaoTableProps {
  filialId?: string;
}

type ParticipacaoDetalhada = {
  id: string;
  confirmou_presenca: boolean;
  compareceu: boolean;
  colaborador?: {
    id: string;
    nome: string;
    departamento?: string | null;
  } | null;
  evento?: {
    id: string;
    nome: string;
    data_evento: string;
    setor_alvo?: string | null;
  } | null;
};

export function EventosParticipacaoTable({ filialId }: EventosParticipacaoTableProps) {
  const [eventoFiltro, setEventoFiltro] = useState<string>("all");
  const [setorFiltro, setSetorFiltro] = useState<string>("all");
  const [statusFiltro, setStatusFiltro] = useState<string>("all");

  const { data } = useEventosParticipacoesDetalhadas(
    filialId === "all" ? undefined : filialId
  );

  const participacoes = (data || []) as ParticipacaoDetalhada[];

  const eventoOptions = useMemo(() => {
    const map = new Map<string, string>();
    participacoes.forEach((p) => {
      if (p.evento?.id && p.evento?.nome) {
        map.set(p.evento.id, p.evento.nome);
      }
    });
    return Array.from(map.entries());
  }, [participacoes]);

  const setorOptions = useMemo(() => {
    const set = new Set<string>();
    participacoes.forEach((p) => {
      if (p.colaborador?.departamento) {
        set.add(p.colaborador.departamento);
      }
    });
    return Array.from(set).sort();
  }, [participacoes]);

  const getStatus = (p: ParticipacaoDetalhada) => {
    if (p.compareceu) return "Presente";
    if (p.confirmou_presenca) return "Confirmado";
    return "Ausente";
  };

  const filtered = useMemo(() => {
    return participacoes.filter((p) => {
      const eventoId = p.evento?.id || "";
      const setor = p.colaborador?.departamento || "";
      const status = getStatus(p);

      if (eventoFiltro !== "all" && eventoId !== eventoFiltro) return false;
      if (setorFiltro !== "all" && setor !== setorFiltro) return false;
      if (statusFiltro !== "all" && status !== statusFiltro) return false;
      return true;
    });
  }, [participacoes, eventoFiltro, setorFiltro, statusFiltro]);

  const statusBadge = (status: string) => {
    if (status === "Presente") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
    if (status === "Confirmado") {
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    }
    return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
  };

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>Participacao em Eventos</CardTitle>
        <div className="flex flex-wrap gap-3">
          <Select value={eventoFiltro} onValueChange={setEventoFiltro}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Filtrar por evento" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Todos os eventos</SelectItem>
              {eventoOptions.map(([id, nome]) => (
                <SelectItem key={id} value={id}>
                  {nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={setorFiltro} onValueChange={setSetorFiltro}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Filtrar por setor" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Todos os setores</SelectItem>
              {setorOptions.map((setor) => (
                <SelectItem key={setor} value={setor}>
                  {setor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Confirmado">Confirmado</SelectItem>
              <SelectItem value="Presente">Presente</SelectItem>
              <SelectItem value="Ausente">Ausente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma participacao encontrada
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do colaborador</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Confirmado</TableHead>
                      <TableHead>Compareceu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => {
                      const status = getStatus(p);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.colaborador?.nome || "-"}
                          </TableCell>
                          <TableCell>{p.evento?.nome || "-"}</TableCell>
                          <TableCell>{p.colaborador?.departamento || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={statusBadge(p.confirmou_presenca ? "Confirmado" : "Ausente")}>
                              {p.confirmou_presenca ? "Sim" : "Nao"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={statusBadge(p.compareceu ? "Presente" : "Ausente")}>
                              {p.compareceu ? "Sim" : "Nao"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="md:hidden space-y-3">
              {filtered.map((p) => {
                const status = getStatus(p);
                return (
                  <div key={p.id} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{p.colaborador?.nome || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.colaborador?.departamento || "-"}
                        </p>
                      </div>
                      <Badge variant="secondary" className={statusBadge(status)}>
                        {status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm">
                      <p className="text-muted-foreground">{p.evento?.nome || "-"}</p>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Confirmado: {p.confirmou_presenca ? "Sim" : "Nao"}</span>
                        <span>Compareceu: {p.compareceu ? "Sim" : "Nao"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
