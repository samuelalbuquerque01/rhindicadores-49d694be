import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, TrendingDown, Clock, DollarSign, AlertTriangle, Building, BarChart3,
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
import { AbsenteismoDetailChart } from "./AbsenteismoDetailChart";
import { AfastamentoForm } from "@/components/forms/AfastamentoForm";
import { useAbsenteismoAnalytics, AfastamentoCompleto } from "@/hooks/useAbsenteismoAnalytics";
import { useSetoresDisponiveis } from "@/hooks/useTurnoverAnalytics";

interface AbsenteismoModuleProps {
  filialId?: string;
}

export function AbsenteismoModule({ filialId }: AbsenteismoModuleProps) {
  const navigate = useNavigate();
  const [mesFilter, setMesFilter] = useState<string>("all");
  const [setorFilter, setSetorFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AfastamentoCompleto | null>(null);

  const effectiveFilialId = filialId === "all" ? undefined : filialId;

  const { data, isLoading } = useAbsenteismoAnalytics({
    filialId: effectiveFilialId,
    mes: mesFilter === "all" ? undefined : mesFilter,
    setor: setorFilter,
    tipoAfastamento: tipoFilter,
  });

  const afastamentos = data?.afastamentos || [];

  const impactoPorSetor = Object.entries(
    afastamentos.reduce((acc: Record<string, number>, a) => {
      const setor = a.departamento || "-";
      acc[setor] = (acc[setor] || 0) + (a.dias_afastados || 0);
      return acc;
    }, {})
  )
    .map(([setor, dias]) => ({ setor, dias }))
    .sort((a, b) => b.dias - a.dias);

  const { data: setores } = useSetoresDisponiveis();

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDate = (d: string) => {
    if (!d) return "—";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const mesesOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  const tiposAfastamento = [
    "Atestado médico", "Banco de horas", "Férias",
    "Licença maternidade", "Licença paternidade", "Outro",
  ];

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Chart + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AbsenteismoDetailChart
          afastamentos={afastamentos}
          taxaAbsenteismo={data?.taxaAbsenteismo || 0}
          totalDias={data?.totalDias || 0}
          topSetores={impactoPorSetor}
          isLoading={isLoading}
        />
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KpiCard
            icon={<Calendar className="h-5 w-5" />}
            label="Total de Dias Afastados"
            value={data?.totalDias || 0}
            color="text-destructive"
          />
          <KpiCard
            icon={<TrendingDown className="h-5 w-5" />}
            label="Taxa de Absenteísmo"
            value={`${data?.taxaAbsenteismo || 0}%`}
            color="text-warning"
          />
          <KpiCard
            icon={<BarChart3 className="h-5 w-5" />}
            label="Média Dias/Colaborador"
            value={data?.mediaDiasPorColab || 0}
            color="text-primary"
          />
          <KpiCard
            icon={<Building className="h-5 w-5" />}
            label="Setor Maior Absenteísmo"
            value={data?.setorMaiorAbsenteismo || "—"}
            color="text-muted-foreground"
          />
          <KpiCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Custo Estimado"
            value={formatCurrency(data?.custoEstimado || 0)}
            color="text-destructive"
          />
          <KpiCard
            icon={<Clock className="h-5 w-5" />}
            label="Total de Afastamentos"
            value={data?.afastamentos.length || 0}
            color="text-primary"
          />
        </div>
      </div>

      {/* Strategic card: top motivos */}
      {(data?.topMotivos?.length || 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Principais Motivos de Afastamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data!.topMotivos.map((m, i) => (
                <div key={m.tipo} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="text-2xl font-bold text-muted-foreground">#{i + 1}</span>
                  <div>
                    <p className="font-medium text-sm text-foreground">{m.tipo}</p>
                    <p className="text-xs text-muted-foreground">{m.dias} dia{m.dias !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Setor com maior impacto: <span className="font-semibold text-foreground">{data?.setorMaiorAbsenteismo}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters + Action + Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">Afastamentos do Período</CardTitle>
            <AfastamentoForm />
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
                {tiposAfastamento.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!data?.afastamentos?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum afastamento encontrado para os filtros selecionados.
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
                      <TableHead>Início</TableHead>
                      <TableHead>Retorno</TableHead>
                      <TableHead className="text-right">Dias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.afastamentos.map(a => (
                      <TableRow
                        key={a.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelected(a)}
                      >
                        <TableCell className="font-medium">{a.nome}</TableCell>
                        <TableCell>{a.cargo}</TableCell>
                        <TableCell>{a.departamento}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap">{a.tipo}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(a.data_inicio)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(a.data_fim)}</TableCell>
                        <TableCell className="text-right">{a.dias_afastados}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden space-y-3">
                {data.afastamentos.map(a => (
                  <div
                    key={a.id}
                    className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelected(a)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{a.nome}</p>
                      <Badge variant="outline" className="text-xs">{a.tipo}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{a.cargo} — {a.departamento}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(a.data_inicio)} → {formatDate(a.data_fim)}</span>
                      <span className="font-semibold text-foreground">{a.dias_afastados} dias</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-[500px] bg-background">
          <DialogHeader>
            <DialogTitle>Detalhes do Afastamento</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Info label="Nome" value={selected.nome} />
                <Info label="Cargo" value={selected.cargo} />
                <Info label="Setor" value={selected.departamento} />
                <Info label="Tipo" value={selected.tipo} />
                <Info label="Data Início" value={formatDate(selected.data_inicio)} />
                <Info label="Data Retorno" value={formatDate(selected.data_fim)} />
                <Info label="Total de Dias" value={`${selected.dias_afastados} dias`} />
              </div>
              {selected.observacoes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">{selected.observacoes}</p>
                </div>
              )}
              {selected.colaborador_id && (
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    setSelected(null);
                    navigate(`/employee/${selected.colaborador_id}`);
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
