import { useState } from "react";
import { 
  Clock, 
  Stethoscope, 
  Palmtree, 
  Baby, 
  HelpCircle,
  Users,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useAfastamentosPorTipo } from "@/hooks/useAfastamentoAtivo";
import { useFiliais } from "@/hooks/useFiliais";
import { useDeleteAfastamento } from "@/hooks/useAfastamentos";
import { AfastamentoBadge } from "./AfastamentoBadge";
import { EditAfastamentoModal } from "./EditAfastamentoModal";

interface AfastamentosListProps {
  filialId?: string;
}

const TIPOS_AFASTAMENTO = [
  { value: "todos", label: "Todos", icon: Users },
  { value: "Atestado médico", label: "Atestado", icon: Stethoscope },
  { value: "Banco de horas", label: "Banco de horas", icon: Clock },
  { value: "Férias", label: "Férias", icon: Palmtree },
  { value: "Licença maternidade", label: "Lic. Maternidade", icon: Baby },
  { value: "Licença paternidade", label: "Lic. Paternidade", icon: Baby },
  { value: "Outro", label: "Outros", icon: HelpCircle },
];

export function AfastamentosList({ filialId }: AfastamentosListProps) {
  const [tipoSelecionado, setTipoSelecionado] = useState("todos");
  const [editingAfastamento, setEditingAfastamento] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: afastamentos, isLoading } = useAfastamentosPorTipo(
    tipoSelecionado,
    filialId === "all" ? undefined : filialId
  );
  const { data: filiais } = useFiliais();
  const deleteAfastamento = useDeleteAfastamento();

  const getFilialNome = (filialId?: string) => {
    if (!filialId) return "-";
    return filiais?.find((f) => f.id === filialId)?.nome || "-";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  const getStatus = (dataInicio: string, dataFim: string) => {
    const today = new Date().toISOString().split("T")[0];
    if (today < dataInicio) return "futuro";
    if (today > dataFim) return "encerrado";
    return "ativo";
  };

  const getStatusBadge = (dataInicio: string, dataFim: string) => {
    const status = getStatus(dataInicio, dataFim);
    switch (status) {
      case "ativo":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 gap-1">
            <AlertCircle className="h-3 w-3" /> Ativo
          </Badge>
        );
      case "encerrado":
        return (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle className="h-3 w-3" /> Encerrado
          </Badge>
        );
      case "futuro":
        return (
          <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300 gap-1">
            <Clock className="h-3 w-3" /> Futuro
          </Badge>
        );
    }
  };

  const getContagem = (tipo: string) => {
    if (!afastamentos) return 0;
    if (tipo === "todos") return afastamentos.length;
    return afastamentos.filter((a: any) => a.tipo === tipo).length;
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteAfastamento.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Afastamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tipoSelecionado} onValueChange={setTipoSelecionado}>
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              {TIPOS_AFASTAMENTO.map((tipo) => {
                const Icon = tipo.icon;
                const count = tipo.value === tipoSelecionado ? undefined : getContagem(tipo.value);
                return (
                  <TabsTrigger 
                    key={tipo.value} 
                    value={tipo.value}
                    className="flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tipo.label}</span>
                    <span className="sm:hidden">{tipo.label.split(" ")[0]}</span>
                    {count !== undefined && count > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={tipoSelecionado} className="mt-0">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : !afastamentos?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum afastamento encontrado{" "}
                  {tipoSelecionado !== "todos" && `do tipo "${tipoSelecionado}"`}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Filial</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {afastamentos.map((afastamento: any) => (
                        <TableRow key={afastamento.id}>
                          <TableCell className="font-medium">
                            {afastamento.colaborador?.nome || "-"}
                          </TableCell>
                          <TableCell>
                            <AfastamentoBadge 
                              afastamento={{
                                id: afastamento.id,
                                colaborador_id: afastamento.colaborador_id,
                                tipo: afastamento.tipo,
                                data_inicio: afastamento.data_inicio,
                                data_fim: afastamento.data_fim,
                                dias_afastados: afastamento.dias_afastados || 0,
                                observacoes: afastamento.observacoes,
                              }} 
                            />
                          </TableCell>
                          <TableCell>
                            {formatDate(afastamento.data_inicio)} -{" "}
                            {formatDate(afastamento.data_fim)}
                          </TableCell>
                          <TableCell>
                            {afastamento.dias_afastados || "-"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(afastamento.data_inicio, afastamento.data_fim)}
                          </TableCell>
                          <TableCell>
                            {getFilialNome(afastamento.colaborador?.filial_id)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {afastamento.observacoes || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingAfastamento(afastamento)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingId(afastamento.id)}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditAfastamentoModal
        afastamento={editingAfastamento}
        open={!!editingAfastamento}
        onOpenChange={(open) => !open && setEditingAfastamento(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir afastamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
