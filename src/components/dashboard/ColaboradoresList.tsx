import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useColaboradoresPaginados, useDeleteColaborador } from "@/hooks/useColaboradores";
import { useFiliais } from "@/hooks/useFiliais";
import { useAfastamentosAtivos } from "@/hooks/useAfastamentoAtivo";
import { usePagination } from "@/hooks/usePagination";
import { supabase } from "@/integrations/supabase/client";
import { Colaborador } from "@/types/database";
import { EditColaboradorModal } from "./EditColaboradorModal";
import { AfastamentoBadge } from "./AfastamentoBadge";
import { PaginationControls } from "@/components/ui/PaginationControls";

interface ColaboradoresListProps {
  filialId?: string;
  tipoFilter?: "CLT" | "Estagiário" | "PJ";
}

export function ColaboradoresList({ filialId, tipoFilter: propTipoFilter }: ColaboradoresListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [subTipoFilter, setSubTipoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Determine which tipos to filter based on prop
  const getTipoColaboradorFilter = () => {
    if (propTipoFilter === "CLT") {
      return subTipoFilter === "all" ? undefined : subTipoFilter;
    }
    if (propTipoFilter === "Estagiário") {
      return "Estagiário";
    }
    if (propTipoFilter === "PJ") {
      return "PJ";
    }
    return subTipoFilter === "all" ? undefined : subTipoFilter;
  };

  const tipoColaboradorFilter = getTipoColaboradorFilter();
  const tipoColaboradorIn =
    propTipoFilter === "CLT" && subTipoFilter === "all"
      ? ["CLT Administrativo", "CLT Corpo Clínico"]
      : undefined;

  const {
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    setTotalCount,
  } = usePagination();

  const {
    data: colaboradoresResponse,
    isLoading,
    isFetching,
  } = useColaboradoresPaginados({
    filialId: filialId === "all" ? undefined : filialId,
    tipoColaborador: tipoColaboradorIn ? undefined : tipoColaboradorFilter,
    tipoColaboradorIn,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
    page,
    pageSize,
  });

  const colaboradores = colaboradoresResponse?.data ?? [];
  const totalCount = colaboradoresResponse?.count ?? 0;
  const { data: filiais } = useFiliais();
  const { data: afastamentosAtivos } = useAfastamentosAtivos(filialId === "all" ? undefined : filialId);
  const deleteColaborador = useDeleteColaborador();

  useEffect(() => {
    setTotalCount(totalCount);
  }, [setTotalCount, totalCount]);

  useEffect(() => {
    setPage(1);
  }, [search, subTipoFilter, statusFilter, filialId, propTipoFilter, setPage, pageSize]);

  // Fetch contratacoes to show tipo_contratacao
  const { data: contratacoes } = useQuery({
    queryKey: ["contratacoes-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratacoes")
        .select("colaborador_id, tipo_contratacao")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Create a map with the latest contratacao for each colaborador
      const map = new Map<string, string>();
      data?.forEach((c) => {
        if (c.colaborador_id && c.tipo_contratacao && !map.has(c.colaborador_id)) {
          map.set(c.colaborador_id, c.tipo_contratacao);
        }
      });
      return map;
    },
  });

  const isNovaContratacao = (dataAdmissao: string) => {
    const admissao = new Date(dataAdmissao + "T00:00:00");
    const hoje = new Date();
    const diffMs = hoje.getTime() - admissao.getTime();
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    return diffDias <= 30;
  };

  const getTipoContratacaoBadge = (colaborador: Colaborador) => {
    // Auto-show "Nova contratação" if hired within 30 days
    if (isNovaContratacao(colaborador.data_admissao)) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
          Nova contratação
        </span>
      );
    }

    const tipo = contratacoes?.get(colaborador.id);
    if (!tipo) return <span className="text-muted-foreground text-sm">-</span>;
    
    const colors: Record<string, string> = {
      "Nova contratação": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
      "Readmissão": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
      "Transferência": "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tipo] || ""}`}>
        {tipo}
      </span>
    );
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteColaborador.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Ativo: "default",
      Inativo: "destructive",
      Afastado: "secondary",
      Férias: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      "CLT Administrativo": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "CLT Corpo Clínico": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "PJ": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "Estagiário": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tipo] || ""}`}>
        {tipo}
      </span>
    );
  };

  const getFilialNome = (filialId?: string) => {
    if (!filialId) return "-";
    return filiais?.find(f => f.id === filialId)?.nome || "-";
  };

  const getTitle = () => {
    if (propTipoFilter === "CLT") return "Colaboradores CLT";
    if (propTipoFilter === "Estagiário") return "Estagiários";
    if (propTipoFilter === "PJ") return "Colaboradores PJ";
    return "Colaboradores Cadastrados";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {getTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {propTipoFilter === "CLT" && (
            <Select value={subTipoFilter} onValueChange={setSubTipoFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-background">
                <SelectValue placeholder="Tipo CLT" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Todos CLT</SelectItem>
                <SelectItem value="CLT Administrativo">CLT Administrativo</SelectItem>
                <SelectItem value="CLT Corpo Clínico">CLT Corpo Clínico</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : !colaboradores?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum colaborador encontrado
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead>Contratação</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Afastamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.map((colaborador) => {
                  const afastamento = afastamentosAtivos?.get(colaborador.id);
                  return (
                    <TableRow key={colaborador.id}>
                      <TableCell>
                        <button
                          className="font-medium text-primary hover:underline text-left"
                          onClick={() => navigate(`/employee/${colaborador.id}`)}
                        >
                          {colaborador.nome}
                        </button>
                      </TableCell>
                      <TableCell>{colaborador.cargo}</TableCell>
                      <TableCell>{colaborador.departamento}</TableCell>
                      <TableCell>{getTipoBadge(colaborador.tipo_colaborador)}</TableCell>
                      <TableCell>{getTipoContratacaoBadge(colaborador)}</TableCell>
                      <TableCell>{getFilialNome(colaborador.filial_id)}</TableCell>
                      <TableCell>{getStatusBadge(colaborador.status)}</TableCell>
                      <TableCell>
                        {afastamento && afastamento.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {afastamento.map((a) => (
                              <AfastamentoBadge key={a.id} afastamento={a} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingColaborador(colaborador)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(colaborador.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalItems={totalCount}
          totalPages={totalPages}
          isLoading={isFetching}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />

        {/* Edit Modal */}
        <EditColaboradorModal
          colaborador={editingColaborador}
          open={!!editingColaborador}
          onOpenChange={(open) => !open && setEditingColaborador(null)}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
