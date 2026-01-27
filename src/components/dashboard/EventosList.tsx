import { useState } from "react";
import { Calendar, Users, ChevronDown, ChevronUp, Plus, Trash2, Check, X } from "lucide-react";
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
import { useEventos, useEventoParticipacoes, useCreateEventoParticipacao, useUpdateEventoParticipacao, useDeleteEventoParticipacao } from "@/hooks/useEventos";
import { useColaboradores } from "@/hooks/useColaboradores";
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
  const createParticipacao = useCreateEventoParticipacao();
  const updateParticipacao = useUpdateEventoParticipacao();
  const deleteParticipacao = useDeleteEventoParticipacao();

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Eventos
        </CardTitle>
        <EventoForm />
      </CardHeader>
      <CardContent className="space-y-4">
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
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface EventoItemProps {
  evento: Evento;
  isExpanded: boolean;
  onToggle: () => void;
  colaboradores: any[];
  selectedColaborador: string;
  onSelectColaborador: (id: string) => void;
  onAddParticipante: (eventoId: string) => void;
  onToggleConfirmou: (id: string, confirmou: boolean) => void;
  onToggleCompareceu: (id: string, compareceu: boolean) => void;
  onRemoveParticipante: (id: string) => void;
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
      "Confraternização": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      "Palestra": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "Workshop": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "Integração": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "Outro": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return tipo ? (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[tipo] || colors["Outro"]}`}>
        {tipo}
      </span>
    ) : null;
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="border rounded-lg">
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{evento.nome}</h4>
                    {getTipoBadge(evento.tipo)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(evento.data_evento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
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
            {/* Add participant */}
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

            {/* Participants table */}
            {participacoes && participacoes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="text-center">Confirmou</TableHead>
                    <TableHead className="text-center">Compareceu</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participacoes.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.colaborador?.nome || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={p.confirmou_presenca ? "default" : "outline"}
                          size="sm"
                          onClick={() => onToggleConfirmou(p.id, p.confirmou_presenca)}
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
                        >
                          {p.compareceu ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveParticipante(p.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
