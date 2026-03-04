import { useMemo, useState } from "react";
import { Activity, CalendarDays, Building2, AlertCircle, Edit2, Trash2 } from "lucide-react";
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
import { AfastamentoForm } from "@/components/forms/AfastamentoForm";
import { EditAfastamentoModal } from "@/components/dashboard/EditAfastamentoModal";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RankingList } from "@/components/dashboard/RankingList";
import type { RankingItemData } from "@/components/dashboard/RankingItem";
import { useAbsenteismoAnalytics, type AfastamentoCompleto } from "@/hooks/useAbsenteismoAnalytics";
import { useDeleteAfastamento } from "@/hooks/useAfastamentos";
import { useSetoresDisponiveis } from "@/hooks/useTurnoverAnalytics";
import { useColaboradores } from "@/hooks/useColaboradores";
import {
  buildAbsenteeismAnalytics,
  deriveMonthVariation,
} from "@/lib/analytics/absenteeism";

interface AbsenteismoModuleProps {
  filialId?: string;
}

function metricTrend(variation: number): "up" | "down" | "stable" {
  if (variation > 0) return "up";
  if (variation < 0) return "down";
  return "stable";
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function AbsenteismoModule({ filialId }: AbsenteismoModuleProps) {
  const [mesFilter, setMesFilter] = useState<string>("all");
  const [setorFilter, setSetorFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [editingAfastamento, setEditingAfastamento] = useState<AfastamentoCompleto | null>(null);
  const [deletingAfastamento, setDeletingAfastamento] = useState<AfastamentoCompleto | null>(null);
  const [editedReasons, setEditedReasons] = useState<Record<string, RankingItemData>>({});
  const [hiddenReasonIds, setHiddenReasonIds] = useState<string[]>([]);
  const [editingReason, setEditingReason] = useState<RankingItemData | null>(null);
  const [reasonLabelDraft, setReasonLabelDraft] = useState("");
  const [reasonValueDraft, setReasonValueDraft] = useState("");
  const [deletingReason, setDeletingReason] = useState<RankingItemData | null>(null);

  const effectiveFilialId = filialId === "all" ? undefined : filialId;

  const { data, isLoading, error } = useAbsenteismoAnalytics({
    filialId: effectiveFilialId,
    mes: mesFilter === "all" ? undefined : mesFilter,
    setor: setorFilter,
    tipoAfastamento: tipoFilter,
  });

  const { data: setores = [] } = useSetoresDisponiveis();
  const { data: colaboradoresAtivos = [] } = useColaboradores({
    filialId: effectiveFilialId,
    status: "Ativo",
  });
  const deleteAfastamento = useDeleteAfastamento();

  const afastamentos = data?.afastamentos ?? [];
  const analytics = useMemo(
    () =>
      buildAbsenteeismAnalytics(
        afastamentos.map((afastamento) => ({
          id: afastamento.id,
          type: afastamento.tipo,
          startDate: afastamento.data_inicio,
          endDate: afastamento.data_fim,
          sectorName: afastamento.departamento,
        })),
        colaboradoresAtivos.length || undefined,
      ),
    [afastamentos, colaboradoresAtivos.length],
  );

  const monthlyVariation = deriveMonthVariation(analytics.monthlyLostDays);
  const monthlyTrend = metricTrend(monthlyVariation);

  const rankingReasons = useMemo<RankingItemData[]>(
    () =>
      analytics.reasons
        .map((reason) => ({
          id: reason.id,
          label: reason.label,
          value: reason.days,
          unit: reason.days === 1 ? "dia" : "dias",
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

  const tiposAfastamento = [
    "Atestado médico",
    "Banco de horas",
    "Férias",
    "Licença maternidade",
    "Licença paternidade",
    "Outro",
  ];

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

  const handleDeleteAfastamento = async () => {
    if (!deletingAfastamento) return;
    await deleteAfastamento.mutateAsync({
      id: deletingAfastamento.id,
      anexo_url: deletingAfastamento.anexo_url ?? null,
    });
    setDeletingAfastamento(null);
  };

  if (isLoading) {
    return <div className="rounded-lg border p-8 text-sm text-muted-foreground">Carregando dados de absenteismo...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-sm text-destructive">
        Erro ao carregar dados de absenteismo.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Dias perdidos"
          value={analytics.lostDays}
          icon={<CalendarDays className="h-5 w-5" />}
          variationPercent={monthlyVariation}
          trend={monthlyTrend}
          isPositive={false}
          tooltip="Soma dos dias entre data inicial e final dos afastamentos no periodo."
        />
        <MetricCard
          title="Afastamentos no periodo"
          value={analytics.absencesCount}
          icon={<Activity className="h-5 w-5" />}
          variationPercent={monthlyVariation}
          trend={monthlyTrend}
          isPositive={false}
          tooltip="Quantidade total de registros de afastamento filtrados."
        />
        <MetricCard
          title="Taxa de absenteismo"
          value={analytics.absenteeismRate === null ? "Indisponivel" : `${analytics.absenteeismRate}%`}
          icon={<AlertCircle className="h-5 w-5" />}
          variationPercent={monthlyVariation}
          trend={monthlyTrend}
          isPositive={false}
          tooltip="Calculado por dias perdidos dividido por colaboradores ativos x 22 dias uteis."
        />
        <MetricCard
          title="Setor mais impactado"
          value={analytics.mostImpactedSector}
          icon={<Building2 className="h-5 w-5" />}
          variationPercent={0}
          trend="stable"
          tooltip="Setor com maior soma de dias perdidos no periodo filtrado."
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Dias perdidos por mes"
          subtitle="Distribuicao mensal de absenteismo"
          isEmpty={analytics.monthlyLostDays.every((item) => item.lostDays === 0)}
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyLostDays}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="lostDays" name="Dias perdidos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Impacto por setor"
          subtitle="Dias perdidos acumulados por area"
          isEmpty={analytics.sectorLostDays.length === 0}
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.sectorLostDays.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="lostDays" name="Dias perdidos" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <RankingList
        title="Ranking de motivos de afastamento"
        items={rankingReasons}
        emptyMessage="Sem motivos registrados para os filtros selecionados."
        onEdit={(item) => {
          setEditingReason(item);
          setReasonLabelDraft(item.label);
          setReasonValueDraft(String(item.value));
        }}
        onDelete={setDeletingReason}
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-base">Registros de afastamento</CardTitle>
            <AfastamentoForm />
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
                <SelectValue placeholder="Tipo de afastamento" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tiposAfastamento.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {afastamentos.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum afastamento encontrado para o periodo selecionado.
            </div>
          ) : (
            <>
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Inicio</TableHead>
                      <TableHead>Retorno</TableHead>
                      <TableHead className="text-right">Dias</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {afastamentos.map((afastamento) => (
                      <TableRow key={afastamento.id}>
                        <TableCell className="font-medium">{afastamento.nome}</TableCell>
                        <TableCell>{afastamento.departamento || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{afastamento.tipo}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(afastamento.data_inicio)}</TableCell>
                        <TableCell>{formatDate(afastamento.data_fim)}</TableCell>
                        <TableCell className="text-right">{afastamento.dias_afastados}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditingAfastamento(afastamento)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingAfastamento(afastamento)}>
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
                {afastamentos.map((afastamento) => (
                  <article key={afastamento.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{afastamento.nome}</p>
                      <Badge variant="outline" className="text-xs">
                        {afastamento.tipo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{afastamento.departamento || "Sem setor"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(afastamento.data_inicio)} ate {formatDate(afastamento.data_fim)}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-semibold">{afastamento.dias_afastados} dias</span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingAfastamento(afastamento)}>
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeletingAfastamento(afastamento)}>
                          Apagar
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <EditAfastamentoModal
        afastamento={editingAfastamento}
        open={Boolean(editingAfastamento)}
        onOpenChange={(open) => {
          if (!open) setEditingAfastamento(null);
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
            <p className="text-xs text-muted-foreground">Dias</p>
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
        open={Boolean(deletingAfastamento)}
        onOpenChange={(open) => {
          if (!open) setDeletingAfastamento(null);
        }}
        title="Excluir afastamento?"
        description="Esta acao nao pode ser desfeita e remove o registro permanentemente."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteAfastamento}
      />
    </div>
  );
}
