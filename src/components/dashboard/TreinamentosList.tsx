import { useMemo, useState } from "react";
import {
  GraduationCap,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  X,
  CheckCircle2,
  RotateCcw,
  Flame,
  Star,
  Paperclip,
} from "lucide-react";
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
  useTreinamentos,
  useTreinamentosParticipacoesDetalhadas,
  useCreateParticipacao,
  useUpdateParticipacao,
  useFinalizarTreinamento,
  useReabrirTreinamento,
} from "@/hooks/useTreinamentos";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useParticipacaoAnual } from "@/hooks/useParticipacaoAnual";
import { TreinamentoForm } from "@/components/forms/TreinamentoForm";
import { Colaborador, Treinamento } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getTrainingStats, type TrainingParticipantLike } from "@/lib/analytics/training";
import { useTrainingsExtra } from "@/hooks/useTrainingExtras";
import { AuditTrail } from "@/components/ui/AuditTrail";
import { buildInitialAuditTrail } from "@/lib/analytics/audit";
import { TrainingExtraData } from "@/lib/storage/trainingsStorage";

interface TreinamentosListProps {
  filialId?: string;
}

type ParticipacaoDetalhada = {
  id: string;
  colaborador_id: string | null;
  participou: boolean | null;
  colaborador?: {
    id: string;
    nome: string;
    departamento?: string | null;
  } | null;
  treinamento?: {
    id: string;
  } | null;
};

interface ParticipacaoAnualStats {
  treinamentos_percentual?: number;
}

export function TreinamentosList({ filialId }: TreinamentosListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedColaborador, setSelectedColaborador] = useState<string>("");

  const { data: treinamentos, isLoading } = useTreinamentos(
    filialId === "all" ? undefined : filialId
  );
  const { data: participacoesDetalhadas, isLoading: isLoadingParticipacoes } =
    useTreinamentosParticipacoesDetalhadas(filialId === "all" ? undefined : filialId);
  const { data: colaboradores } = useColaboradores({ status: "Ativo" });
  const { data: participacaoAnual } = useParticipacaoAnual();
  const { byTrainingId } = useTrainingsExtra();
  const createParticipacao = useCreateParticipacao();
  const updateParticipacao = useUpdateParticipacao();
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

  const handleFinalizar = async (id: string) => {
    await finalizarTreinamento.mutateAsync(id);
  };

  const handleReabrir = async (id: string) => {
    await reabrirTreinamento.mutateAsync(id);
  };

  const sortedTreinamentos = useMemo(() => {
    return (treinamentos || []).slice().sort((a, b) => {
      const aFinalizado = !!a.finalizado;
      const bFinalizado = !!b.finalizado;
      if (aFinalizado !== bFinalizado) return aFinalizado ? 1 : -1;
      return new Date(b.data_realizacao).getTime() - new Date(a.data_realizacao).getTime();
    });
  }, [treinamentos]);

  const participacoesPorTreinamento = useMemo(() => {
    const map = new Map<string, ParticipacaoDetalhada[]>();
    (participacoesDetalhadas || []).forEach((participacao) => {
      const typedParticipacao = participacao as ParticipacaoDetalhada;
      const treinamentoId = typedParticipacao.treinamento?.id;
      if (!treinamentoId) return;

      const current = map.get(treinamentoId) || [];
      current.push(typedParticipacao);
      map.set(treinamentoId, current);
    });

    return map;
  }, [participacoesDetalhadas]);

  if (isLoading || isLoadingParticipacoes) {
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
          Painel de Treinamentos
        </CardTitle>
        <TreinamentoForm />
      </CardHeader>
      <CardContent className="space-y-4">
        {!sortedTreinamentos.length ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum treinamento cadastrado
          </div>
        ) : (
          sortedTreinamentos.map((treinamento) => (
            <TreinamentoItem
              key={treinamento.id}
              treinamento={treinamento}
              isExpanded={expandedId === treinamento.id}
              onToggle={() => setExpandedId(expandedId === treinamento.id ? null : treinamento.id)}
              colaboradores={(colaboradores || []) as Colaborador[]}
              participacoes={participacoesPorTreinamento.get(treinamento.id) || []}
              selectedColaborador={selectedColaborador}
              onSelectColaborador={setSelectedColaborador}
              onAddParticipante={handleAddParticipante}
              onToggleParticipou={handleToggleParticipou}
              onFinalizar={handleFinalizar}
              onReabrir={handleReabrir}
              participacaoAnual={(participacaoAnual || {}) as Record<string, ParticipacaoAnualStats>}
              extra={byTrainingId.get(treinamento.id)}
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
  colaboradores: Colaborador[];
  participacoes: ParticipacaoDetalhada[];
  selectedColaborador: string;
  onSelectColaborador: (id: string) => void;
  onAddParticipante: (treinamentoId: string) => void;
  onToggleParticipou: (id: string, participou: boolean) => void;
  onFinalizar: (id: string) => void;
  onReabrir: (id: string) => void;
  participacaoAnual: Record<string, ParticipacaoAnualStats>;
  extra?: TrainingExtraData;
}

function TreinamentoItem({
  treinamento,
  isExpanded,
  onToggle,
  colaboradores,
  participacoes,
  selectedColaborador,
  onSelectColaborador,
  onAddParticipante,
  onToggleParticipou,
  onFinalizar,
  onReabrir,
  participacaoAnual,
  extra,
}: TreinamentoItemProps) {
  const trainingStats = useMemo(
    () =>
      getTrainingStats({
        capacity: treinamento.vagas_totais,
        participants: participacoes as TrainingParticipantLike[],
      }),
    [participacoes, treinamento.vagas_totais],
  );

  const isDestaque = trainingStats.completionRate > 80;
  const auditTrail = extra?.auditTrail || buildInitialAuditTrail(treinamento.created_at || new Date().toISOString());

  // Filter colaboradores that are not already added
  const availableColaboradores = colaboradores.filter(
    (colaborador) => !participacoes.some((participacao) => participacao.colaborador_id === colaborador.id)
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div
        className={`border rounded-lg ${
          treinamento.finalizado
            ? "border-border/60 bg-muted/20"
            : "border-primary/30 bg-primary/5"
        }`}
      >
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium truncate">{treinamento.nome}</h4>
                  {treinamento.finalizado ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Finalizado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      Em andamento
                    </Badge>
                  )}
                  {isDestaque && (
                    <Badge className="bg-yellow-400/20 text-yellow-700 dark:text-yellow-300">
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span>
                    {format(new Date(treinamento.data_realizacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  {treinamento.carga_horaria && <span>{treinamento.carga_horaria}h</span>}
                  {treinamento.setor_alvo && <span>Setor: {treinamento.setor_alvo}</span>}
                  {treinamento.responsavel && <span>Resp.: {treinamento.responsavel}</span>}
                </div>
                {extra?.tags && extra.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {extra.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {trainingStats.totalParticipantes}/{trainingStats.totalVagas}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {trainingStats.totalParticipantes > 0
                      ? `${trainingStats.totalConcluidos}/${trainingStats.totalParticipantes} concluidos`
                      : "Sem participantes"}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Ocupacao de vagas</span>
                <span>
                  Participantes: {trainingStats.totalParticipantes} / {trainingStats.totalVagas}
                </span>
              </div>
              <Progress value={trainingStats.occupancyRate} className="h-2" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border/60 p-2 bg-background/60">
                <p className="text-xs text-muted-foreground">Setor mais participante</p>
                <p className="font-medium">{trainingStats.mostActiveSector}</p>
                {trainingStats.secondarySector && (
                  <p className="text-xs text-muted-foreground">{trainingStats.secondarySector}</p>
                )}
              </div>
              <div className="rounded-md border border-border/60 p-2 bg-background/60">
                <p className="text-xs text-muted-foreground">Nivel de Engajamento</p>
                <p className="font-medium flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {trainingStats.engagementLevel}
                </p>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onToggle}>
                Ver detalhes
              </Button>
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
                  Reabrir
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
                  Encerrar treinamento
                </Button>
              )}
            </div>

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

            {participacoes && participacoes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participante</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">% Concluido</TableHead>
                    <TableHead className="text-right">Acao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participacoes.map((p) => {
                    const participantId = p.colaborador_id || "";
                    const stats = participantId ? participacaoAnual[participantId] : undefined;
                    const concluiu = Boolean(p.participou);
                    const status = concluiu
                      ? "Concluido"
                      : treinamento.finalizado
                      ? "Nao iniciou"
                      : "Em andamento";
                    const statusClass =
                      status === "Concluido"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : status === "Em andamento"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.colaborador?.nome || "-"}
                        </TableCell>
                        <TableCell>{p.colaborador?.departamento || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusClass}>
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {stats?.treinamentos_percentual || 0}%
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={concluiu ? "default" : "outline"}
                            size="sm"
                            onClick={() => onToggleParticipou(p.id, concluiu)}
                            disabled={treinamento.finalizado}
                          >
                            {concluiu ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Concluiu
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Marcar
                              </>
                            )}
                          </Button>
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

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Anexos</p>
              {extra?.attachments && extra.attachments.length > 0 ? (
                <div className="space-y-1">
                  {extra.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Paperclip className="h-4 w-4" />
                      {attachment.name}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem anexos vinculados.</p>
              )}
            </div>

            <AuditTrail trail={auditTrail} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
