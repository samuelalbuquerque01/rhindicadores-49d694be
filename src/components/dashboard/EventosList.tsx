import { useState } from "react";
import { Calendar, Users, ChevronDown, ChevronUp, Plus, Trash2, Check, X, CheckCircle2, RotateCcw, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEventos, useEventoParticipacoes, useCreateEventoParticipacao, useUpdateEventoParticipacao, useDeleteEventoParticipacao, useFinalizarEvento, useReabrirEvento, useDeleteEvento } from "@/hooks/useEventos";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useParticipacaoAnual } from "@/hooks/useParticipacaoAnual";
import { EventoForm } from "@/components/forms/EventoForm";
import { Evento } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventosListProps {
  filialId?: string;
}

export function EventosList({ filialId }: EventosListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedColaborador, setSelectedColaborador] = useState<string>("");

  const { data: eventos, isLoading } = useEventos(
    filialId === "all" ? undefined : filialId
  );
  const { data: colaboradores } = useColaboradores({ status: "Ativo" });
  const { data: participacaoAnual } = useParticipacaoAnual();
  const createParticipacao = useCreateEventoParticipacao();
  const updateParticipacao = useUpdateEventoParticipacao();
  const deleteParticipacao = useDeleteEventoParticipacao();
  const finalizarEvento = useFinalizarEvento();
  const reabrirEvento = useReabrirEvento();
  const deleteEvento = useDeleteEvento();

  const handleAddParticipante = async (eventoId: string) => {
    if (!selectedColaborador) return;
    
    await createParticipacao.mutateAsync({
      evento_id: eventoId,
      colaborador_id: selectedColaborador,
      confirmou_presenca: false,
      compareceu: false,
    });
    setSelectedColaborador("");
  };

  const handleToggleConfirmou = async (id: string, confirmou: boolean) => {
    await updateParticipacao.mutateAsync({ id, confirmou_presenca: !confirmou });
  };

  const handleToggleCompareceu = async (id: string, compareceu: boolean) => {
    await updateParticipacao.mutateAsync({ id, compareceu: !compareceu });
  };

  const handleRemoveParticipante = async (id: string) => {
    await deleteParticipacao.mutateAsync(id);
  };

  const handleFinalizar = async (id: string) => {
    await finalizarEvento.mutateAsync(id);
  };

  const handleReabrir = async (id: string) => {
    await reabrirEvento.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    await deleteEvento.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Eventos
        </CardTitle>
        <EventoForm />
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {!eventos?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum evento cadastrado
          </div>
        ) : (
          eventos.map((evento) => (
            <EventoItem
              key={evento.id}
              evento={evento}
              isExpanded={expandedId === evento.id}
              onToggle={() => setExpandedId(expandedId === evento.id ? null : evento.id)}
              colaboradores={colaboradores || []}
              selectedColaborador={selectedColaborador}
              onSelectColaborador={setSelectedColaborador}
              onAddParticipante={handleAddParticipante}
              onToggleConfirmou={handleToggleConfirmou}
              onToggleCompareceu={handleToggleCompareceu}
              onRemoveParticipante={handleRemoveParticipante}
              onFinalizar={handleFinalizar}
              onReabrir={handleReabrir}
              onDelete={handleDelete}
              participacaoAnual={participacaoAnual || {}}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface EventoItemProps {
  evento: Evento & { finalizado?: boolean };
  isExpanded: boolean;
  onToggle: () => void;
  colaboradores: any[];
  selectedColaborador: string;
  onSelectColaborador: (id: string) => void;
  onAddParticipante: (eventoId: string) => void;
  onToggleConfirmou: (id: string, confirmou: boolean) => void;
  onToggleCompareceu: (id: string, compareceu: boolean) => void;
  onRemoveParticipante: (id: string) => void;
  onFinalizar: (id: string) => void;
  onReabrir: (id: string) => void;
  onDelete: (id: string) => void;
  participacaoAnual: Record<string, any>;
}

function EventoItem({
  evento,
  isExpanded,
  onToggle,
  colaboradores,
  selectedColaborador,
  onSelectColaborador,
  onAddParticipante,
  onToggleConfirmou,
  onToggleCompareceu,
  onRemoveParticipante,
  onFinalizar,
  onReabrir,
  onDelete,
  participacaoAnual,
}: EventoItemProps) {
  const { data: participacoes } = useEventoParticipacoes(
    isExpanded ? evento.id : undefined
  );

  const totalParticipantes = participacoes?.length || 0;
  const confirmaram = participacoes?.filter(p => p.confirmou_presenca).length || 0;
  const compareceram = participacoes?.filter(p => p.compareceu).length || 0;
  const taxaPresenca = confirmaram > 0 
    ? Math.round((compareceram / confirmaram) * 100) 
    : 0;

  // Filter colaboradores that are not already added
  const availableColaboradores = colaboradores.filter(
    c => !participacoes?.some(p => p.colaborador_id === c.id)
  );

  const getTipoBadge = (tipo?: string) => {
    const colors: Record<string, string> = {
      "Confraternização": "bg-primary-soft text-primary-fg",
      "Palestra": "bg-info-soft text-info-fg",
      "Workshop": "bg-success-soft text-success-fg",
      "Integração": "bg-primary-soft text-primary-fg",
      "Treinamento": "bg-warning-soft text-warning-fg",
      "Corporativo": "bg-neutral-soft text-neutral-fg",
      "Outro": "bg-neutral-soft text-neutral-fg",
    };
    return tipo ? (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[tipo] || colors["Outro"]}`}>
        {tipo}
      </span>
    ) : null;
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={`border rounded-lg ${evento.finalizado ? 'border-success-border bg-success-soft/30' : ''}`}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{evento.nome}</h4>
                      {getTipoBadge(evento.tipo)}
                      {evento.finalizado && (
                        <Badge variant="secondary" className="bg-success-soft text-success-fg">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Finalizado
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>{format(new Date(evento.data_evento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                      {evento.setor_alvo && <span>Setor: {evento.setor_alvo}</span>}
                      {evento.responsavel && <span>Resp.: {evento.responsavel}</span>}
                    </div>
                  </div>
                </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{compareceram}/{confirmaram}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={taxaPresenca} className="w-20 h-2" />
                    <span className="text-xs text-muted-foreground">{taxaPresenca}%</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4 space-y-4">
            {/* Action buttons */}
            <div className="flex justify-between">
              <div className="flex gap-2">
                <EventoForm 
                  evento={evento}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  }
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o evento "{evento.nome}"? 
                        Esta ação não pode ser desfeita e todas as participações serão removidas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(evento.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex gap-2">
                {evento.finalizado ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReabrir(evento.id);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reabrir Evento
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFinalizar(evento.id);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Finalizar Evento
                  </Button>
                )}
              </div>
            </div>

            {/* Add participant */}
            {!evento.finalizado && (
              <div className="flex gap-2">
                <Select value={selectedColaborador} onValueChange={onSelectColaborador}>
                  <SelectTrigger className="flex-1 bg-background">
                    <SelectValue placeholder="Selecionar colaborador..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {availableColaboradores.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  onClick={() => onAddParticipante(evento.id)}
                  disabled={!selectedColaborador}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            )}

            {/* Participants table */}
            {participacoes && participacoes.length > 0 ? (
              <Table className="min-w-[900px]">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="text-center">Confirmou</TableHead>
                    <TableHead className="text-center">Compareceu</TableHead>
                    <TableHead className="text-center">% Anual Eventos</TableHead>
                    <TableHead className="text-center">% Anual Treinamentos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participacoes.map((p: any) => {
                    const stats = participacaoAnual[p.colaborador_id];
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.colaborador?.nome || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant={p.confirmou_presenca ? "default" : "outline"}
                            size="sm"
                            onClick={() => onToggleConfirmou(p.id, p.confirmou_presenca)}
                            disabled={evento.finalizado}
                          >
                            {p.confirmou_presenca ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant={p.compareceu ? "default" : "outline"}
                            size="sm"
                            onClick={() => onToggleCompareceu(p.id, p.compareceu)}
                            disabled={evento.finalizado}
                          >
                            {p.compareceu ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress 
                              value={stats?.eventos_percentual || 0} 
                              className="w-16 h-2" 
                            />
                            <span className="text-sm font-medium min-w-[3rem]">
                              {stats?.eventos_percentual || 0}%
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({stats?.eventos_compareceu || 0}/{stats?.eventos_total || 0})
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress 
                              value={stats?.treinamentos_percentual || 0} 
                              className="w-16 h-2" 
                            />
                            <span className="text-sm font-medium min-w-[3rem]">
                              {stats?.treinamentos_percentual || 0}%
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({stats?.treinamentos_participou || 0}/{stats?.treinamentos_total || 0})
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {!evento.finalizado && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveParticipante(p.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum participante adicionado
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
