import { useState } from "react";
import { GraduationCap, Users, ChevronDown, ChevronUp, Plus, Trash2, Check, X, CheckCircle2, RotateCcw } from "lucide-react";
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
import { useTreinamentos, useTreinamentoParticipacoes, useCreateParticipacao, useUpdateParticipacao, useDeleteParticipacao, useFinalizarTreinamento, useReabrirTreinamento } from "@/hooks/useTreinamentos";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useParticipacaoAnual } from "@/hooks/useParticipacaoAnual";
import { TreinamentoForm } from "@/components/forms/TreinamentoForm";
import { Treinamento } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TreinamentosListProps {
  filialId?: string;
}

export function TreinamentosList({ filialId }: TreinamentosListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedColaborador, setSelectedColaborador] = useState<string>("");

  const { data: treinamentos, isLoading } = useTreinamentos(
    filialId === "all" ? undefined : filialId
  );
  const { data: colaboradores } = useColaboradores({ status: "Ativo" });
  const { data: participacaoAnual } = useParticipacaoAnual();
  const createParticipacao = useCreateParticipacao();
  const updateParticipacao = useUpdateParticipacao();
  const deleteParticipacao = useDeleteParticipacao();
  const finalizarTreinamento = useFinalizarTreinamento();
  const reabrirTreinamento = useReabrirTreinamento();

  const handleAddParticipante = async (treinamentoId: string) => {
    if (!selectedColaborador) return;
    
    await createParticipacao.mutateAsync({
      treinamento_id: treinamentoId,
      colaborador_id: selectedColaborador,
      participou: false,
      certificado_emitido: false,
    });
    setSelectedColaborador("");
  };

  const handleToggleParticipou = async (id: string, participou: boolean) => {
    await updateParticipacao.mutateAsync({ id, participou: !participou });
  };

  const handleRemoveParticipante = async (id: string) => {
    await deleteParticipacao.mutateAsync(id);
  };

  const handleFinalizar = async (id: string) => {
    await finalizarTreinamento.mutateAsync(id);
  };

  const handleReabrir = async (id: string) => {
    await reabrirTreinamento.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Treinamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Treinamentos
        </CardTitle>
        <TreinamentoForm />
      </CardHeader>
      <CardContent className="space-y-4">
        {!treinamentos?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum treinamento cadastrado
          </div>
        ) : (
          treinamentos.map((treinamento) => (
            <TreinamentoItem
              key={treinamento.id}
              treinamento={treinamento}
              isExpanded={expandedId === treinamento.id}
              onToggle={() => setExpandedId(expandedId === treinamento.id ? null : treinamento.id)}
              colaboradores={colaboradores || []}
              selectedColaborador={selectedColaborador}
              onSelectColaborador={setSelectedColaborador}
              onAddParticipante={handleAddParticipante}
              onToggleParticipou={handleToggleParticipou}
              onRemoveParticipante={handleRemoveParticipante}
              onFinalizar={handleFinalizar}
              onReabrir={handleReabrir}
              participacaoAnual={participacaoAnual || {}}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface TreinamentoItemProps {
  treinamento: Treinamento & { finalizado?: boolean };
  isExpanded: boolean;
  onToggle: () => void;
  colaboradores: any[];
  selectedColaborador: string;
  onSelectColaborador: (id: string) => void;
  onAddParticipante: (treinamentoId: string) => void;
  onToggleParticipou: (id: string, participou: boolean) => void;
  onRemoveParticipante: (id: string) => void;
  onFinalizar: (id: string) => void;
  onReabrir: (id: string) => void;
  participacaoAnual: Record<string, any>;
}

function TreinamentoItem({
  treinamento,
  isExpanded,
  onToggle,
  colaboradores,
  selectedColaborador,
  onSelectColaborador,
  onAddParticipante,
  onToggleParticipou,
  onRemoveParticipante,
  onFinalizar,
  onReabrir,
  participacaoAnual,
}: TreinamentoItemProps) {
  const { data: participacoes } = useTreinamentoParticipacoes(
    isExpanded ? treinamento.id : undefined
  );

  const totalParticipantes = participacoes?.length || 0;
  const participaram = participacoes?.filter(p => p.participou).length || 0;
  const taxaAssiduidade = totalParticipantes > 0 
    ? Math.round((participaram / totalParticipantes) * 100) 
    : 0;

  // Filter colaboradores that are not already added
  const availableColaboradores = colaboradores.filter(
    c => !participacoes?.some(p => p.colaborador_id === c.id)
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={`border rounded-lg ${treinamento.finalizado ? 'border-green-500/50 bg-green-50/30 dark:bg-green-950/20' : ''}`}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{treinamento.nome}</h4>
                      {treinamento.finalizado && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Finalizado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(treinamento.data_realizacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {treinamento.carga_horaria && ` • ${treinamento.carga_horaria}h`}
                    </p>
                  </div>
                </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{participaram}/{totalParticipantes}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={taxaAssiduidade} className="w-20 h-2" />
                    <span className="text-xs text-muted-foreground">{taxaAssiduidade}%</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4 space-y-4">
            {/* Finalize button */}
            <div className="flex justify-end gap-2">
              {treinamento.finalizado ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReabrir(treinamento.id);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reabrir Treinamento
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFinalizar(treinamento.id);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finalizar Treinamento
                </Button>
              )}
            </div>

            {/* Add participant */}
            {!treinamento.finalizado && (
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
                  onClick={() => onAddParticipante(treinamento.id)}
                  disabled={!selectedColaborador}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            )}

            {/* Participants table */}
            {participacoes && participacoes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="text-center">Participou</TableHead>
                    <TableHead className="text-center">% Anual Treinamentos</TableHead>
                    <TableHead className="text-center">% Anual Eventos</TableHead>
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
                            variant={p.participou ? "default" : "outline"}
                            size="sm"
                            onClick={() => onToggleParticipou(p.id, p.participou)}
                            disabled={treinamento.finalizado}
                          >
                            {p.participou ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Sim
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Não
                              </>
                            )}
                          </Button>
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
                        <TableCell className="text-right">
                          {!treinamento.finalizado && (
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
