import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserMinus, TrendingDown, TrendingUp, Clock, DollarSign, AlertTriangle, Building,
  Edit2, Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { TurnoverChart } from "./TurnoverChart";
import { DesligamentoForm } from "@/components/forms/DesligamentoForm";
import { RankingMotivosCard } from "./RankingMotivosCard";
import { RankingList } from "./RankingList";
import type { RankingItemData } from "./RankingItem";
import { EditDesligamentoModal } from "./EditDesligamentoModal";
import { useTurnoverAnalytics, useSetoresDisponiveis, DesligamentoCompleto } from "@/hooks/useTurnoverAnalytics";
import { useDeleteDesligamento } from "@/hooks/useDesligamentos";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface TurnoverModuleProps {
  filialId?: string;
}

export function TurnoverModule({ filialId }: TurnoverModuleProps) {
  const navigate = useNavigate();
  const [mesFilter, setMesFilter] = useState<string>("all");
  const [setorFilter, setSetorFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [selectedDesligamento, setSelectedDesligamento] = useState<DesligamentoCompleto | null>(null);
  const [editingDesligamento, setEditingDesligamento] = useState<DesligamentoCompleto | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editedReasons, setEditedReasons] = useState<Record<string, RankingItemData>>({});
  const [hiddenReasonIds, setHiddenReasonIds] = useState<string[]>([]);
  const [editingReason, setEditingReason] = useState<RankingItemData | null>(null);
  const [reasonLabelDraft, setReasonLabelDraft] = useState("");
  const [reasonValueDraft, setReasonValueDraft] = useState("");
  const [deletingReason, setDeletingReason] = useState<RankingItemData | null>(null);

  const deleteDesligamento = useDeleteDesligamento();
  const effectiveFilialId = filialId === "all" ? undefined : filialId;

  const { data, isLoading } = useTurnoverAnalytics({
    filialId: effectiveFilialId,
    mes: mesFilter === "all" ? undefined : mesFilter,
    setor: setorFilter,
    tipoDesligamento: tipoFilter,
  });

  const { data: setores } = useSetoresDisponiveis();

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDate = (d: string) => {
    if (!d) return "â€”";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const formatTempo = (dias: number) => {
    if (dias < 30) return `${dias} dias`;
    const meses = Math.floor(dias / 30);
    if (meses < 12) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
    const anos = Math.floor(meses / 12);
    const rest = meses % 12;
    return rest > 0 ? `${anos}a ${rest}m` : `${anos} ${anos === 1 ? "ano" : "anos"}`;
  };

  // Generate last 12 months options
  const mesesOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  const rankingReasons = useMemo<RankingItemData[]>(() => {
    const base = (data?.topMotivos || []).map((motivo) => ({
      id: motivo.motivo.toLowerCase().replace(/\s+/g, "-"),
      label: motivo.motivo,
      value: motivo.count,
      unit: motivo.count !== 1 ? "desligamentos" : "desligamento",
    }));

    return base
      .filter((item) => !hiddenReasonIds.includes(item.id))
      .map((item) => editedReasons[item.id] || item);
  }, [data?.topMotivos, editedReasons, hiddenReasonIds]);

  const startEditReason = (item: RankingItemData) => {
    setEditingReason(item);
    setReasonLabelDraft(item.label);
    setReasonValueDraft(String(item.value));
  };

  const saveReasonEdit = () => {
    if (!editingReason) return;

    const parsedValue = Number(reasonValueDraft);
    if (!reasonLabelDraft.trim() || Number.isNaN(parsedValue) || parsedValue < 0) {
      return;
    }

    setEditedReasons((current) => ({
      ...current,
      [editingReason.id]: {
        ...editingReason,
        label: reasonLabelDraft.trim(),
        value: parsedValue,
      },
    }));
    setEditingReason(null);
  };

  const confirmDeleteReason = () => {
    if (!deletingReason) return;
    setHiddenReasonIds((current) => Array.from(new Set([...current, deletingReason.id])));
    setDeletingReason(null);
  };

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Chart + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TurnoverChart filialId={filialId || "all"} />
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KpiCard
            icon={<UserMinus className="h-5 w-5" />}
            label="Total de Desligamentos"
            value={data?.totalDesligamentos || 0}
            color="text-destructive"
          />
          <KpiCard
            icon={<TrendingDown className="h-5 w-5" />}
            label="Turnover Voluntario"
            value={`${data?.turnoverVoluntario || 0}%`}
            color="text-warning"
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Turnover Involuntario"
            value={`${data?.turnoverInvoluntario || 0}%`}
            color="text-destructive"
          />
          <KpiCard
            icon={<Clock className="h-5 w-5" />}
            label="Tempo Medio Permanencia"
            value={formatTempo(data?.tempoMedioPermanencia || 0)}
            color="text-primary"
          />
          <KpiCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Custo Total Turnover"
            value={formatCurrency(data?.custoTotal || 0)}
            color="text-destructive"
          />
          <KpiCard
            icon={<Building className="h-5 w-5" />}
            label="Setor Maior Turnover"
            value={data?.setorMaiorTurnover || "â€”"}
            color="text-muted-foreground"
          />
        </div>
      </div>

      {/* Strategic card: top motivos */}
      {(data?.topMotivos?.length || 0) > 0 && (
        <RankingMotivosCard
          title="Principais Motivos de Saida"
          items={data!.topMotivos.map((m) => ({
            label: m.motivo,
            value: m.count,
            unit: m.count !== 1 ? "desligamentos" : "desligamento",
          }))}
          setorDestaque={data?.setorMaiorTurnover}
          setorLabel="Setor com maior turnover"
        />
      )}

      <RankingList
        title="Ranking de motivos (editavel)"
        items={rankingReasons}
        emptyMessage="Sem dados para ranking de motivos no periodo selecionado."
        onEdit={startEditReason}
        onDelete={setDeletingReason}
      />

      {/* Filters + Action */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">Desligamentos do Periodo</CardTitle>
            <DesligamentoForm />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select value={mesFilter} onValueChange={setMesFilter}>
              <SelectTrigger className="w-full sm:w-52 bg-background">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[250px]">
                <SelectItem value="all">Todos os meses</SelectItem>
                {mesesOptions.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={setorFilter} onValueChange={setSetorFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-background">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[250px]">
                <SelectItem value="all">Todos os setores</SelectItem>
                {setores?.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-52 bg-background">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value={"Pedido de demiss\u00e3o"}>{"Pedido de demiss\u00e3o"}</SelectItem>
                <SelectItem value="Iniciativa da empresa">Iniciativa da empresa</SelectItem>
                <SelectItem value={"T\u00e9rmino de contrato"}>{"T\u00e9rmino de contrato"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table - desktop */}
          {!data?.desligamentos?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum desligamento encontrado para os filtros selecionados.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Admissao</TableHead>
                      <TableHead>Desligamento</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-center w-[100px]">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.desligamentos.map(d => (
                      <TableRow
                        key={d.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedDesligamento(d)}
                      >
                        <TableCell className="font-medium">{d.nome}</TableCell>
                        <TableCell>{d.cargo}</TableCell>
                        <TableCell>{d.departamento}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap">{d.motivo}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(d.data_admissao)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(d.data_desligamento)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatTempo(d.tempo_empresa)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {d.custo_rescisao ? formatCurrency(d.custo_rescisao) : "â€”"}
                        </TableCell>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <TooltipProvider delayDuration={200}>
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    onClick={() => setEditingDesligamento(d)}
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
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleting(d.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Apagar</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden space-y-3">
                {data.desligamentos.map(d => (
                  <div
                    key={d.id}
                    className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedDesligamento(d)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{d.nome}</p>
                      <Badge variant="outline" className="text-xs">{d.motivo}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{d.cargo} â€” {d.departamento}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Desligamento: {formatDate(d.data_desligamento)}</span>
                      <span>{formatTempo(d.tempo_empresa)}</span>
                    </div>
                    {d.custo_rescisao && (
                      <p className="text-sm font-medium text-destructive">{formatCurrency(d.custo_rescisao)}</p>
                    )}
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={() => setEditingDesligamento(d)}
                      >
                        <Edit2 className="h-3 w-3" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleting(d.id)}
                      >
                        <Trash2 className="h-3 w-3" /> Apagar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedDesligamento} onOpenChange={open => !open && setSelectedDesligamento(null)}>
        <DialogContent className="sm:max-w-[500px] bg-background">
          <DialogHeader>
            <DialogTitle>Detalhes do Desligamento</DialogTitle>
          </DialogHeader>
          {selectedDesligamento && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Info label="Nome" value={selectedDesligamento.nome} />
                <Info label="Cargo" value={selectedDesligamento.cargo} />
                <Info label="Setor" value={selectedDesligamento.departamento} />
                <Info label="Motivo" value={selectedDesligamento.motivo} />
                <Info label="Data Admissao" value={formatDate(selectedDesligamento.data_admissao)} />
                <Info label="Data Desligamento" value={formatDate(selectedDesligamento.data_desligamento)} />
                <Info label="Tempo de Empresa" value={formatTempo(selectedDesligamento.tempo_empresa)} />
                <Info
                  label="Custo Rescisao"
                  value={selectedDesligamento.custo_rescisao ? formatCurrency(selectedDesligamento.custo_rescisao) : "â€”"}
                />
              </div>
              {selectedDesligamento.observacoes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observacoes</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{selectedDesligamento.observacoes}</p>
                </div>
              )}
              {selectedDesligamento.colaborador_id && (
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    setSelectedDesligamento(null);
                    navigate(`/employee/${selectedDesligamento.colaborador_id}`);
                  }}
                >
                  Ver perfil completo â†’
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <EditDesligamentoModal
        desligamento={editingDesligamento}
        open={!!editingDesligamento}
        onOpenChange={(open) => !open && setEditingDesligamento(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de desligamento? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleting) {
                  await deleteDesligamento.mutateAsync(deleting);
                  setDeleting(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Modal
        open={!!editingReason}
        onOpenChange={(open) => !open && setEditingReason(null)}
        title="Editar motivo do ranking"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Motivo</p>
            <Input value={reasonLabelDraft} onChange={(event) => setReasonLabelDraft(event.target.value)} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Total</p>
            <Input
              type="number"
              min={0}
              value={reasonValueDraft}
              onChange={(event) => setReasonValueDraft(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            TODO: persistir alteracoes de ranking agregado em tabela dedicada no Supabase.
          </p>
          <div className="flex justify-end">
            <Button type="button" onClick={saveReasonEdit}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deletingReason}
        onOpenChange={(open) => !open && setDeletingReason(null)}
        title="Apagar motivo do ranking?"
        description="Essa acao remove o item apenas da visao atual (dados agregados)."
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={confirmDeleteReason}
      />
    </div>
  );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
        <div className={color}>{icon}</div>
        <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

