import { useMemo, useState } from "react";
import { Building2, UserMinus, Percent, Clock3, Edit2, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { RankingList } from "@/components/dashboard/RankingList";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import type { RankingItemData } from "@/components/dashboard/RankingItem";
import { DesligamentoForm } from "@/components/forms/DesligamentoForm";
import { EditDesligamentoModal } from "@/components/dashboard/EditDesligamentoModal";
import { useTurnoverAnalytics, useSetoresDisponiveis, type DesligamentoCompleto } from "@/hooks/useTurnoverAnalytics";
import { useDeleteDesligamento } from "@/hooks/useDesligamentos";
import { useColaboradores } from "@/hooks/useColaboradores";
import { buildTurnoverAnalytics } from "@/lib/analytics/turnover";

interface TurnoverModuleProps {
  filialId?: string;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatTenure(days: number | null): string {
  if (days === null || days <= 0) return "Indisponivel";
  if (days < 30) return `${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(months / 12);
  const restMonths = months % 12;
  return restMonths > 0 ? `${years}a ${restMonths}m` : `${years} ${years === 1 ? "ano" : "anos"}`;
}

function metricTrend(variation: number): "up" | "down" | "stable" {
  if (variation > 0) return "up";
  if (variation < 0) return "down";
  return "stable";
}

export function TurnoverModule({ filialId }: TurnoverModuleProps) {
  const [mesFilter, setMesFilter] = useState<string>("all");
  const [setorFilter, setSetorFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [editingDesligamento, setEditingDesligamento] = useState<DesligamentoCompleto | null>(null);
  const [deletingDesligamento, setDeletingDesligamento] = useState<DesligamentoCompleto | null>(null);
  const [editedReasons, setEditedReasons] = useState<Record<string, RankingItemData>>({});
  const [hiddenReasonIds, setHiddenReasonIds] = useState<string[]>([]);
  const [editingReason, setEditingReason] = useState<RankingItemData | null>(null);
  const [reasonLabelDraft, setReasonLabelDraft] = useState("");
  const [reasonValueDraft, setReasonValueDraft] = useState("");
  const [deletingReason, setDeletingReason] = useState<RankingItemData | null>(null);

  const effectiveFilialId = filialId === "all" ? undefined : filialId;

  const { data, isLoading, error } = useTurnoverAnalytics({
    filialId: effectiveFilialId,
    mes: mesFilter === "all" ? undefined : mesFilter,
    setor: setorFilter,
    tipoDesligamento: tipoFilter,
  });
  const { data: setores = [] } = useSetoresDisponiveis();
  const { data: colaboradoresAtivos = [] } = useColaboradores({
    filialId: effectiveFilialId,
    status: "Ativo",
  });
  const deleteDesligamento = useDeleteDesligamento();

  const desligamentos = data?.desligamentos ?? [];
  const analytics = useMemo(
    () =>
      buildTurnoverAnalytics(
        desligamentos.map((desligamento) => ({
          id: desligamento.id,
          reason: desligamento.motivo,
          terminationDate: desligamento.data_desligamento,
          hireDate: desligamento.data_admissao,
          sectorName: desligamento.departamento,
        })),
        colaboradoresAtivos.length || undefined,
      ),
    [colaboradoresAtivos.length, desligamentos],
  );

  const currentMonth = analytics.monthlyTerminations[analytics.monthlyTerminations.length - 1]?.terminations ?? 0;
  const previousMonth = analytics.monthlyTerminations[analytics.monthlyTerminations.length - 2]?.terminations ?? 0;
  const monthVariation = previousMonth === 0 ? (currentMonth > 0 ? 100 : 0) : ((currentMonth - previousMonth) / previousMonth) * 100;
  const roundedVariation = Math.round(monthVariation * 10) / 10;

  const rankingReasons = useMemo<RankingItemData[]>(
    () =>
      analytics.reasons
        .map((reason) => ({
          id: reason.id,
          label: reason.label,
          value: reason.count,
          unit: reason.count === 1 ? "desligamento" : "desligamentos",
        }))
        .filter((item) => !hiddenReasonIds.includes(item.id))
        .map((item) => editedReasons[item.id] || item),
    [analytics.reasons, editedReasons, hiddenReasonIds],
  );

  const mesesOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - index);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        return {
          value,
          label: label.charAt(0).toUpperCase() + label.slice(1),
        };
      }),
    [],
  );

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

  const handleDeleteDesligamento = async () => {
    if (!deletingDesligamento) return;
    await deleteDesligamento.mutateAsync(deletingDesligamento.id);
    setDeletingDesligamento(null);
  };

  if (isLoading) {
    return <div className="rounded-lg border p-8 text-sm text-muted-foreground">Carregando dados de turnover...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-sm text-destructive">
        Erro ao carregar dados de turnover.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Desligamentos no periodo"
          value={analytics.terminationsCount}
          icon={<UserMinus className="h-5 w-5" />}
          variationPercent={roundedVariation}
          trend={metricTrend(roundedVariation)}
          isPositive={false}
          tooltip="Total de desligamentos no intervalo filtrado."
        />
        <MetricCard
          title="Taxa de turnover"
          value={analytics.turnoverRate === null ? "Indisponivel" : `${analytics.turnoverRate}%`}
          icon={<Percent className="h-5 w-5" />}
          variationPercent={roundedVariation}
          trend={metricTrend(roundedVariation)}
          isPositive={false}
          tooltip="Desligamentos divididos pela base de colaboradores ativos."
        />
        <MetricCard
          title="Setor com maior turnover"
          value={analytics.topSector}
          icon={<Building2 className="h-5 w-5" />}
          variationPercent={0}
          trend="stable"
          tooltip="Setor com maior volume de desligamentos no periodo."
        />
        <MetricCard
          title="Tempo medio de permanencia"
          value={formatTenure(analytics.avgTenureDays)}
          icon={<Clock3 className="h-5 w-5" />}
          variationPercent={roundedVariation}
          trend={metricTrend(-roundedVariation)}
          tooltip="Media de dias entre admissao e desligamento."
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Desligamentos por mes"
          subtitle="Evolucao mensal do volume de saidas"
          isEmpty={analytics.monthlyTerminations.every((item) => item.terminations === 0)}
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyTerminations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="terminations" name="Desligamentos" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Desligamentos por setor"
          subtitle="Setores com maior concentracao de saidas"
          isEmpty={analytics.sectorTerminations.length === 0}
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.sectorTerminations.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="terminations" name="Desligamentos" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RankingList
          title="Ranking de motivos de saida"
          items={rankingReasons}
          emptyMessage="Sem motivos de desligamento para os filtros selecionados."
          onEdit={(item) => {
            setEditingReason(item);
            setReasonLabelDraft(item.label);
            setReasonValueDraft(String(item.value));
          }}
          onDelete={setDeletingReason}
        />
        <InsightsPanel insights={analytics.insights.slice(0, 3)} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-base">Registros de desligamento</CardTitle>
            <DesligamentoForm />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={mesFilter} onValueChange={setMesFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[250px]">
                <SelectItem value="all">Todos os meses</SelectItem>
                {mesesOptions.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={setorFilter} onValueChange={setSetorFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[250px]">
                <SelectItem value="all">Todos os setores</SelectItem>
                {setores.map((setor) => (
                  <SelectItem key={setor} value={setor}>
                    {setor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Motivo" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">Todos os motivos</SelectItem>
                <SelectItem value="Pedido de demissão">Pedido de demissão</SelectItem>
                <SelectItem value="Iniciativa da empresa">Iniciativa da empresa</SelectItem>
                <SelectItem value="Término de contrato">Término de contrato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {desligamentos.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum desligamento encontrado para o periodo selecionado.
            </div>
          ) : (
            <>
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Admissao</TableHead>
                      <TableHead>Desligamento</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {desligamentos.map((desligamento) => (
                      <TableRow key={desligamento.id}>
                        <TableCell className="font-medium">{desligamento.nome}</TableCell>
                        <TableCell>{desligamento.departamento || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{desligamento.motivo}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(desligamento.data_admissao)}</TableCell>
                        <TableCell>{formatDate(desligamento.data_desligamento)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditingDesligamento(desligamento)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingDesligamento(desligamento)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {desligamentos.map((desligamento) => (
                  <article key={desligamento.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{desligamento.nome}</p>
                      <Badge variant="outline" className="text-xs">
                        {desligamento.motivo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{desligamento.departamento || "Sem setor"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(desligamento.data_admissao)} {"->"} {formatDate(desligamento.data_desligamento)}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => setEditingDesligamento(desligamento)}>
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeletingDesligamento(desligamento)}>
                        Apagar
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <EditDesligamentoModal
        desligamento={editingDesligamento}
        open={Boolean(editingDesligamento)}
        onOpenChange={(open) => {
          if (!open) setEditingDesligamento(null);
        }}
      />

      <Modal
        open={Boolean(editingReason)}
        onOpenChange={(open) => {
          if (!open) setEditingReason(null);
        }}
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
            TODO: persistir alteracoes de ranking agregado em tabela dedicada no backend.
          </p>
          <div className="flex justify-end">
            <Button type="button" onClick={saveReasonEdit}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingReason)}
        onOpenChange={(open) => {
          if (!open) setDeletingReason(null);
        }}
        title="Apagar motivo do ranking?"
        description="Essa acao remove o item apenas da visualizacao local."
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={confirmDeleteReason}
      />

      <ConfirmDialog
        open={Boolean(deletingDesligamento)}
        onOpenChange={(open) => {
          if (!open) setDeletingDesligamento(null);
        }}
        title="Excluir desligamento?"
        description="Esta acao nao pode ser desfeita e remove o registro permanentemente."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteDesligamento}
      />
    </div>
  );
}
