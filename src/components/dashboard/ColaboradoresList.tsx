import { useState } from "react";
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
import { useColaboradores, useDeleteColaborador } from "@/hooks/useColaboradores";
import { useFiliais } from "@/hooks/useFiliais";
import { Colaborador } from "@/types/database";
import { EditColaboradorModal } from "./EditColaboradorModal";

interface ColaboradoresListProps {
  filialId?: string;
}

export function ColaboradoresList({ filialId }: ColaboradoresListProps) {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: colaboradores, isLoading } = useColaboradores({
    filialId: filialId === "all" ? undefined : filialId,
    tipoColaborador: tipoFilter === "all" ? undefined : tipoFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
  });
  const { data: filiais } = useFiliais();
  const deleteColaborador = useDeleteColaborador();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Colaboradores Cadastrados
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
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-background">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="CLT Administrativo">CLT Administrativo</SelectItem>
              <SelectItem value="CLT Corpo Clínico">CLT Corpo Clínico</SelectItem>
              <SelectItem value="PJ">PJ</SelectItem>
              <SelectItem value="Estagiário">Estagiário</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
              <SelectItem value="Afastado">Afastado</SelectItem>
              <SelectItem value="Férias">Férias</SelectItem>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.map((colaborador) => (
                  <TableRow key={colaborador.id}>
                    <TableCell className="font-medium">{colaborador.nome}</TableCell>
                    <TableCell>{colaborador.cargo}</TableCell>
                    <TableCell>{colaborador.departamento}</TableCell>
                    <TableCell>{getTipoBadge(colaborador.tipo_colaborador)}</TableCell>
                    <TableCell>{getFilialNome(colaborador.filial_id)}</TableCell>
                    <TableCell>{getStatusBadge(colaborador.status)}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}

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
