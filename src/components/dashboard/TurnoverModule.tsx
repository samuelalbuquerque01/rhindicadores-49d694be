import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserMinus, TrendingDown, TrendingUp, Clock, DollarSign, AlertTriangle, Building,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TurnoverChart } from "./TurnoverChart";
import { DesligamentoForm } from "@/components/forms/DesligamentoForm";
import { useTurnoverAnalytics, useSetoresDisponiveis, DesligamentoCompleto } from "@/hooks/useTurnoverAnalytics";

interface TurnoverModuleProps {
  filialId?: string;
}

export function TurnoverModule({ filialId }: TurnoverModuleProps) {
  const navigate = useNavigate();
  const [mesFilter, setMesFilter] = useState<string>("all");
  const [setorFilter, setSetorFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [selectedDesligamento, setSelectedDesligamento] = useState<DesligamentoCompleto | null>(null);

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
    if (!d) return "—";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const formatTempo = (dias: number) => {
    if (dias < 30) return `${dias} dias`;
    const meses = Math.floor(dias / 30);
    if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
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
            label="Turnover Voluntário"
            value={`${data?.turnoverVoluntario || 0}%`}
            color="text-warning"
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Turnover Involuntário"
            value={`${data?.turnoverInvoluntario || 0}%`}
            color="text-destructive"
          />
          <KpiCard
            icon={<Clock className="h-5 w-5" />}
            label="Tempo Médio Permanência"
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
            value={data?.setorMaiorTurnover || "—"}
            color="text-muted-foreground"
          />
        </div>
      </div>

      {/* Strategic card: top motivos */}
      {(data?.topMotivos?.length || 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Principais Motivos de Saída
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data!.topMotivos.map((m, i) => (
                <div key={m.motivo} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="text-2xl font-bold text-muted-foreground">#{i + 1}</span>
                  <div>
                    <p className="font-medium text-sm text-foreground">{m.motivo}</p>
                    <p className="text-xs text-muted-foreground">{m.count} desligamento{m.count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Setor com maior turnover: <span className="font-semibold text-foreground">{data?.setorMaiorTurnover}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters + Action */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">Desligamentos do Período</CardTitle>
            <DesligamentoForm />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select value={mesFilter} onValueChange={setMesFilter}>
              <SelectTrigger className="w-full sm:w-52 bg-background">
                <SelectValue placeholder="Mês" />
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
                <SelectItem value="Pedido de demissão">Pedido de demissão</SelectItem>
                <SelectItem value="Iniciativa da empresa">Iniciativa da empresa</SelectItem>
                <SelectItem value="Término de contrato">Término de contrato</SelectItem>
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
                      <TableHead>Admissão</TableHead>
                      <TableHead>Desligamento</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
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
                          {d.custo_rescisao ? formatCurrency(d.custo_rescisao) : "—"}
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
                    <p className="text-sm text-muted-foreground">{d.cargo} — {d.departamento}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Desligamento: {formatDate(d.data_desligamento)}</span>
                      <span>{formatTempo(d.tempo_empresa)}</span>
                    </div>
                    {d.custo_rescisao && (
                      <p className="text-sm font-medium text-destructive">{formatCurrency(d.custo_rescisao)}</p>
                    )}
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
                <Info label="Data Admissão" value={formatDate(selectedDesligamento.data_admissao)} />
                <Info label="Data Desligamento" value={formatDate(selectedDesligamento.data_desligamento)} />
                <Info label="Tempo de Empresa" value={formatTempo(selectedDesligamento.tempo_empresa)} />
                <Info
                  label="Custo Rescisão"
                  value={selectedDesligamento.custo_rescisao ? formatCurrency(selectedDesligamento.custo_rescisao) : "—"}
                />
              </div>
              {selectedDesligamento.observacoes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
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
                  Ver perfil completo →
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
