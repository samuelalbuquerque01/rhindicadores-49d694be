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
import { useTreinamentosParticipacoesDetalhadas } from "@/hooks/useTreinamentos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TreinamentosParticipacaoTableProps {
  filialId?: string;
}

type ParticipacaoDetalhada = {
  id: string;
  participou: boolean;
  colaborador?: {
    id: string;
    nome: string;
    departamento?: string | null;
  } | null;
  treinamento?: {
    id: string;
    nome: string;
    data_realizacao: string;
    carga_horaria?: number | null;
    finalizado?: boolean | null;
  } | null;
};

export function TreinamentosParticipacaoTable({ filialId }: TreinamentosParticipacaoTableProps) {
  const [mesFiltro, setMesFiltro] = useState<string>("all");
  const [setorFiltro, setSetorFiltro] = useState<string>("all");
  const [statusFiltro, setStatusFiltro] = useState<string>("all");

  const { data } = useTreinamentosParticipacoesDetalhadas(
    filialId === "all" ? undefined : filialId
  );

  const participacoes = (data || []) as ParticipacaoDetalhada[];

  const mesOptions = useMemo(() => {
    const set = new Set<string>();
    participacoes.forEach((p) => {
      if (p.treinamento?.data_realizacao) {
        set.add(format(new Date(p.treinamento.data_realizacao), "yyyy-MM"));
      }
    });
    return Array.from(set).sort().reverse();
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
    if (p.participou) return "Concluido";
    if (p.treinamento?.finalizado) return "Nao iniciou";
    return "Em andamento";
  };

  const filtered = useMemo(() => {
    return participacoes.filter((p) => {
      const mes = p.treinamento?.data_realizacao
        ? format(new Date(p.treinamento.data_realizacao), "yyyy-MM")
        : "";
      const setor = p.colaborador?.departamento || "";
      const status = getStatus(p);

      if (mesFiltro !== "all" && mes !== mesFiltro) return false;
      if (setorFiltro !== "all" && setor !== setorFiltro) return false;
      if (statusFiltro !== "all" && status !== statusFiltro) return false;
      return true;
    });
  }, [participacoes, mesFiltro, setorFiltro, statusFiltro]);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="gap-3">
        <CardTitle>Participacao em Treinamentos</CardTitle>
        <div className="grid grid-cols-1 gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select value={mesFiltro} onValueChange={setMesFiltro}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Filtrar por mes" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Todos os meses</SelectItem>
              {mesOptions.map((mes) => (
                <SelectItem key={mes} value={mes}>
                  {format(new Date(`${mes}-01`), "MMM yyyy", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={setorFiltro} onValueChange={setSetorFiltro}>
            <SelectTrigger className="w-full bg-background">
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
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Concluido">Concluido</SelectItem>
              <SelectItem value="Em andamento">Em andamento</SelectItem>
              <SelectItem value="Nao iniciou">Nao iniciou</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma participacao encontrada
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Nome do colaborador</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Treinamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Carga horaria</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.colaborador?.nome || "-"}
                        </TableCell>
                        <TableCell>{p.colaborador?.departamento || "-"}</TableCell>
                        <TableCell>{p.treinamento?.nome || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-muted">
                            {getStatus(p)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.treinamento?.data_realizacao
                            ? format(new Date(p.treinamento.data_realizacao), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>{p.treinamento?.carga_horaria || 0}h</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="md:hidden space-y-3">
              {filtered.map((p) => (
                <div key={p.id} className="rounded-lg border border-border/60 bg-card p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{p.colaborador?.nome || "-"}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.colaborador?.departamento || "-"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-muted">
                      {getStatus(p)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground">{p.treinamento?.nome || "-"}</p>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>
                        {p.treinamento?.data_realizacao
                          ? format(new Date(p.treinamento.data_realizacao), "dd/MM/yyyy")
                          : "-"}
                      </span>
                      <span>{p.treinamento?.carga_horaria || 0}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
