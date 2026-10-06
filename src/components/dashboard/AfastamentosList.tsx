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
  ChevronDown,
  ChevronUp,
  Paperclip,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  X,
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
import { createAfastamentoSignedUrl, downloadAfastamentoAnexo, isHttpUrl } from "@/lib/afastamentosStorage";
import { AfastamentoBadge } from "./AfastamentoBadge";
import { EditAfastamentoModal } from "./EditAfastamentoModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const [deleting, setDeleting] = useState<{ id: string; anexo_url?: string | null } | null>(null);
  const [expandedObs, setExpandedObs] = useState<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
          <Badge className="gap-1 bg-success-soft text-success-fg">
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
          <Badge className="gap-1 bg-info-soft text-info-fg">
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
    if (deleting) {
      await deleteAfastamento.mutateAsync(deleting);
      setDeleting(null);
    }
  };

  const isImageFile = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);

  const handlePreview = async (anexoUrl: string) => {
    try {
      if (isHttpUrl(anexoUrl)) {
        setPreviewUrl(anexoUrl);
      } else {
        const signedUrl = await createAfastamentoSignedUrl(anexoUrl);
        if (signedUrl) setPreviewUrl(signedUrl);
        else toast.error("Não foi possível gerar a URL do anexo.");
      }
    } catch {
      toast.error("Erro ao abrir preview do anexo.");
    }
  };

  const handleDownload = async (anexoUrl: string, colaboradorNome?: string) => {
    try {
      if (isHttpUrl(anexoUrl)) {
        window.open(anexoUrl, "_blank");
        return;
      }
      const blob = await downloadAfastamentoAnexo(anexoUrl);
      if (!blob) { toast.error("Arquivo não encontrado."); return; }
      const ext = anexoUrl.split(".").pop() || "pdf";
      const fileName = `atestado-${colaboradorNome?.replace(/\s+/g, "_") || "anexo"}.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar anexo.");
    }
  };

  return (
    <>
    <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Afastamentos
          </CardTitle>
        </CardHeader>
      <CardContent className="pt-0">
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
                  <Table className="min-w-[1100px]">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Filial</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead>Anexo</TableHead>
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
                          <TableCell className="max-w-[300px]">
                            {afastamento.observacoes ? (
                              afastamento.observacoes.length > 60 ? (
                                <div>
                                  <span className="whitespace-pre-wrap break-words text-sm">
                                    {expandedObs.has(afastamento.id)
                                      ? afastamento.observacoes
                                      : afastamento.observacoes.slice(0, 60) + "..."}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 ml-1 text-xs text-primary hover:text-primary/80"
                                    onClick={() => {
                                      setExpandedObs((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(afastamento.id)) {
                                          next.delete(afastamento.id);
                                        } else {
                                          next.add(afastamento.id);
                                        }
                                        return next;
                                      });
                                    }}
                                  >
                                    {expandedObs.has(afastamento.id) ? (
                                      <><ChevronUp className="h-3 w-3 inline" /> ver menos</>
                                    ) : (
                                      <><ChevronDown className="h-3 w-3 inline" /> ver mais</>
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <span className="whitespace-pre-wrap break-words text-sm">
                                  {afastamento.observacoes}
                                </span>
                              )
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {afastamento.anexo_url ? (
                              <TooltipProvider>
                                <div className="flex items-center gap-1">
                                  {isImageFile(afastamento.anexo_url) ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-primary hover:text-primary/80"
                                          aria-label="Visualizar imagem do anexo"
                                          onClick={() => handlePreview(afastamento.anexo_url)}
                                        >
                                          <ImageIcon className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Visualizar imagem</TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-primary hover:text-primary/80"
                                          aria-label="Visualizar anexo"
                                          onClick={() => handlePreview(afastamento.anexo_url)}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Visualizar anexo</TooltipContent>
                                    </Tooltip>
                                  )}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        aria-label="Baixar anexo"
                                        onClick={() => handleDownload(afastamento.anexo_url, afastamento.colaborador?.nome)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Baixar anexo</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label={`Editar afastamento de ${afastamento.colaborador?.nome ?? "colaborador"}`}
                                    onClick={() => setEditingAfastamento(afastamento)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Editar</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    aria-label={`Excluir afastamento de ${afastamento.colaborador?.nome ?? "colaborador"}`}
                                    onClick={() => setDeleting({ id: afastamento.id, anexo_url: afastamento.anexo_url })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Excluir</TooltipContent>
                              </Tooltip>
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

      {/* Image/PDF Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden bg-background">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm rounded-full"
              aria-label="Fechar visualização"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {previewUrl && isImageFile(previewUrl) ? (
              <img
                src={previewUrl}
                alt="Preview do atestado"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                title="Preview do anexo"
                className="w-full h-[85vh] border-0"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <EditAfastamentoModal
        afastamento={editingAfastamento}
        open={!!editingAfastamento}
        onOpenChange={(open) => !open && setEditingAfastamento(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
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
