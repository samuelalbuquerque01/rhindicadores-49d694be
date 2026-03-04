import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  TrendingDown,
  Clock,
  DollarSign,
  AlertTriangle,
  Building,
  BarChart3,
  Edit2,
  Paperclip,
  Trash2,
  Download,
  ExternalLink,
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { AbsenteismoDetailChart } from "./AbsenteismoDetailChart";
import { AfastamentoForm } from "@/components/forms/AfastamentoForm";
import { useAbsenteismoAnalytics, AfastamentoCompleto } from "@/hooks/useAbsenteismoAnalytics";
import { useDeleteAfastamento } from "@/hooks/useAfastamentos";
import { useSetoresDisponiveis } from "@/hooks/useTurnoverAnalytics";
import { EditAfastamentoModal } from "./EditAfastamentoModal";
import { RankingMotivosCard } from "./RankingMotivosCard";
import { RankingList } from "./RankingList";
import type { RankingItemData } from "./RankingItem";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  createAfastamentoSignedUrl,
  downloadAfastamentoAnexo,
  isHttpUrl,
} from "@/lib/afastamentosStorage";
import { toast } from "sonner";

interface AbsenteismoModuleProps {
  filialId?: string;
}

export function AbsenteismoModule({ filialId }: AbsenteismoModuleProps) {
  const navigate = useNavigate();
  const [mesFilter, setMesFilter] = useState<string>("all");
  const [setorFilter, setSetorFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AfastamentoCompleto | null>(null);
  const [editingAfastamento, setEditingAfastamento] = useState<any>(null);
  const [deleting, setDeleting] = useState<{ id: string; anexo_url?: string | null } | null>(null);
  const [editedReasons, setEditedReasons] = useState<Record<string, RankingItemData>>({});
  const [hiddenReasonIds, setHiddenReasonIds] = useState<string[]>([]);
  const [editingReason, setEditingReason] = useState<RankingItemData | null>(null);
  const [reasonLabelDraft, setReasonLabelDraft] = useState("");
  const [reasonValueDraft, setReasonValueDraft] = useState("");
  const [deletingReason, setDeletingReason] = useState<RankingItemData | null>(null);

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
  const deleteAfastamento = useDeleteAfastamento();

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDate = (d: string) => {
    if (!d) return "â€”";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const handleViewAnexo = async (anexoUrl?: string | null) => {
    if (!anexoUrl) return;
    try {
      if (isHttpUrl(anexoUrl)) {
        window.open(anexoUrl, "_blank", "noopener,noreferrer");
        return;
      }
      const signedUrl = await createAfastamentoSignedUrl(anexoUrl);
      if (signedUrl) window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(`Erro ao visualizar anexo: ${error.message}`);
    }
  };

  const handleDownloadAnexo = async (anexoUrl?: string | null) => {
    if (!anexoUrl) return;
    try {
      if (isHttpUrl(anexoUrl)) {
        window.open(anexoUrl, "_blank", "noopener,noreferrer");
        return;
      }
      const blob = await downloadAfastamentoAnexo(anexoUrl);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = anexoUrl.split("/").pop() || "anexo";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(`Erro ao baixar anexo: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (deleting) {
      await deleteAfastamento.mutateAsync(deleting);
      setDeleting(null);
    }
  };

  const mesesOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  const tiposAfastamento = [
    "Atestado mÃ©dico", "Banco de horas", "FÃ©rias",
    "LicenÃ§a maternidade", "LicenÃ§a paternidade", "Outro",
  ];

  const rankingReasons = useMemo<RankingItemData[]>(() => {
    const base = (data?.topMotivos || []).map((motivo) => ({
      id: motivo.tipo.toLowerCase().replace(/\s+/g, "-"),
      label: motivo.tipo,
      value: motivo.dias,
      unit: motivo.dias !== 1 ? "dias" : "dia",
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
            label="Taxa de AbsenteÃ­smo"
            value={`${data?.taxaAbsenteismo || 0}%`}
            color="text-warning"
          />
          <KpiCard
            icon={<BarChart3 className="h-5 w-5" />}
            label="MÃ©dia Dias/Colaborador"
            value={data?.mediaDiasPorColab || 0}
            color="text-primary"
          />
          <KpiCard
            icon={<Building className="h-5 w-5" />}
            label="Setor Maior AbsenteÃ­smo"
            value={data?.setorMaiorAbsenteismo || "â€”"}
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
        <RankingMotivosCard
          title="Principais Motivos de Afastamento"
          items={data!.topMotivos.map((m) => ({
            label: m.tipo,
            value: m.dias,
            unit: m.dias !== 1 ? "dias" : "dia",
          }))}
          setorDestaque={data?.setorMaiorAbsenteismo}
          setorLabel="Setor com maior impacto"
        />
      )}

      <RankingList
        title="Ranking de motivos (editavel)"
        items={rankingReasons}
        emptyMessage="Sem dados para ranking de motivos no periodo selecionado."
        onEdit={startEditReason}
        onDelete={setDeletingReason}
      />

      {/* Filters + Action + Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">Afastamentos do PerÃ­odo</CardTitle>
            <AfastamentoForm />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select value={mesFilter} onValueChange={setMesFilter}>
              <SelectTrigger className="w-full sm:w-52 bg-background">
                <SelectValue placeholder="MÃªs" />
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
                      <TableHead>InÃ­cio</TableHead>
                      <TableHead>Retorno</TableHead>
                      <TableHead className="text-right">Dias</TableHead>
                      <TableHead>Anexo</TableHead>
                      <TableHead className="text-right">AÃ§Ãµes</TableHead>
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
                        <TableCell className="text-center">
                          {a.anexo_url ? (
                            <Paperclip className="h-4 w-4 text-muted-foreground inline" />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(event) => {
                                event.stopPropagation();
                                setEditingAfastamento(a);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleting({ id: a.id, anexo_url: a.anexo_url });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
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
                    <p className="text-sm text-muted-foreground">{a.cargo} â€” {a.departamento}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(a.data_inicio)} â†’ {formatDate(a.data_fim)}</span>
                      <span className="font-semibold text-foreground">{a.dias_afastados} dias</span>
                    </div>
                    {a.anexo_url && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        Documento anexado
                      </div>
                    )}
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
                <Info label="Data InÃ­cio" value={formatDate(selected.data_inicio)} />
                <Info label="Data Retorno" value={formatDate(selected.data_fim)} />
                <Info label="Total de Dias" value={`${selected.dias_afastados} dias`} />
              </div>
              {selected.observacoes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ObservaÃ§Ãµes</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">{selected.observacoes}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Documento anexado</p>
                {selected.anexo_url ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewAnexo(selected.anexo_url)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadAnexo(selected.anexo_url)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
                )}
              </div>
              {selected.colaborador_id && (
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    setSelected(null);
                    navigate(`/employee/${selected.colaborador_id}`);
                  }}
                >
                  Ver perfil completo â†’
                </button>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingAfastamento(selected);
                    setSelected(null);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeleting({ id: selected.id, anexo_url: selected.anexo_url });
                    setSelected(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditAfastamentoModal
        afastamento={editingAfastamento}
        open={!!editingAfastamento}
        onOpenChange={(open) => !open && setEditingAfastamento(null)}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir afastamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta aÃ§Ã£o nÃ£o pode ser desfeita. O registro serÃ¡ removido permanentemente.
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
            <p className="text-xs text-muted-foreground">Dias</p>
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

