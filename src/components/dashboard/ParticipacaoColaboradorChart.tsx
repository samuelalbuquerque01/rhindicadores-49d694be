import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface ParticipacaoColaboradorChartProps {
  filialId?: string;
}

export function ParticipacaoColaboradorChart({ filialId }: ParticipacaoColaboradorChartProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [expandedColaborador, setExpandedColaborador] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"chart" | "details">("chart");

  const { data: colaboradores } = useColaboradores({ status: "Ativo" });

  // Fetch all participation data
  const { data: participationData } = useQuery({
    queryKey: ["participacao-detalhada", selectedYear, filialId],
    queryFn: async () => {
      const year = parseInt(selectedYear);
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;

      // Fetch training participations with training info
      const { data: treinamentoParticipacoes } = await supabase
        .from("treinamento_participacoes")
        .select(`
          colaborador_id,
          participou,
          treinamento:treinamentos(id, nome, data_realizacao, filial_id)
        `)
        .not("colaborador_id", "is", null);

      // Fetch event participations with event info
      const { data: eventoParticipacoes } = await supabase
        .from("evento_participacoes")
        .select(`
          colaborador_id,
          compareceu,
          confirmou_presenca,
          evento:eventos(id, nome, data_evento, filial_id)
        `)
        .not("colaborador_id", "is", null);

      // Filter by year and optionally by filial
      const treinamentosDoAno = treinamentoParticipacoes?.filter((p: any) => {
        const data = p.treinamento?.data_realizacao;
        const matchesYear = data && data >= startOfYear && data <= endOfYear;
        const matchesFilial = !filialId || filialId === "all" || p.treinamento?.filial_id === filialId;
        return matchesYear && matchesFilial;
      }) || [];

      const eventosDoAno = eventoParticipacoes?.filter((p: any) => {
        const data = p.evento?.data_evento;
        const matchesYear = data && data >= startOfYear && data <= endOfYear;
        const matchesFilial = !filialId || filialId === "all" || p.evento?.filial_id === filialId;
        return matchesYear && matchesFilial;
      }) || [];

      return { treinamentos: treinamentosDoAno, eventos: eventosDoAno };
    },
  });

  // Process data for charts
  const chartData = useMemo(() => {
    if (!colaboradores || !participationData) return [];

    return colaboradores.map((colab) => {
      const treinamentosColab = participationData.treinamentos.filter(
        (p: any) => p.colaborador_id === colab.id
      );
      const eventosColab = participationData.eventos.filter(
        (p: any) => p.colaborador_id === colab.id
      );

      const treinamentosTotal = treinamentosColab.length;
      const treinamentosParticipou = treinamentosColab.filter((p: any) => p.participou).length;
      const eventosTotal = eventosColab.length;
      const eventosCompareceu = eventosColab.filter((p: any) => p.compareceu).length;

      return {
        id: colab.id,
        nome: colab.nome.split(" ").slice(0, 2).join(" "), // First 2 names for display
        nomeCompleto: colab.nome,
        treinamentosPercent: treinamentosTotal > 0 ? Math.round((treinamentosParticipou / treinamentosTotal) * 100) : 0,
        eventosPercent: eventosTotal > 0 ? Math.round((eventosCompareceu / eventosTotal) * 100) : 0,
        treinamentosTotal,
        treinamentosParticipou,
        eventosTotal,
        eventosCompareceu,
        treinamentosDetalhes: treinamentosColab,
        eventosDetalhes: eventosColab,
      };
    }).filter(c => c.treinamentosTotal > 0 || c.eventosTotal > 0);
  }, [colaboradores, participationData]);

  // Monthly breakdown data
  const monthlyData = useMemo(() => {
    if (!participationData) return [];

    return MONTHS.map((month, index) => {
      const monthNum = (index + 1).toString().padStart(2, "0");
      const monthStart = `${selectedYear}-${monthNum}-01`;
      const monthEnd = `${selectedYear}-${monthNum}-31`;

      const treinamentosDoMes = participationData.treinamentos.filter((p: any) => {
        const data = p.treinamento?.data_realizacao;
        return data && data >= monthStart && data <= monthEnd;
      });

      const eventosDoMes = participationData.eventos.filter((p: any) => {
        const data = p.evento?.data_evento;
        return data && data >= monthStart && data <= monthEnd;
      });

      const treinamentosParticiparam = treinamentosDoMes.filter((p: any) => p.participou).length;
      const eventosCompareceram = eventosDoMes.filter((p: any) => p.compareceu).length;

      return {
        month: month.slice(0, 3),
        monthFull: month,
        treinamentos: treinamentosParticiparam,
        eventos: eventosCompareceram,
        totalTreinamentos: treinamentosDoMes.length,
        totalEventos: eventosDoMes.length,
      };
    });
  }, [participationData, selectedYear]);

  // Get detailed participation info for a collaborator
  const getColabDetails = (colabId: string) => {
    const colab = chartData.find(c => c.id === colabId);
    if (!colab) return null;

    const monthlyBreakdown: Record<string, { treinamentos: any[], eventos: any[] }> = {};
    
    MONTHS.forEach((month, index) => {
      monthlyBreakdown[month] = { treinamentos: [], eventos: [] };
    });

    colab.treinamentosDetalhes.forEach((p: any) => {
      const date = new Date(p.treinamento?.data_realizacao);
      const monthName = MONTHS[date.getMonth()];
      monthlyBreakdown[monthName].treinamentos.push({
        nome: p.treinamento?.nome,
        data: p.treinamento?.data_realizacao,
        participou: p.participou,
      });
    });

    colab.eventosDetalhes.forEach((p: any) => {
      const date = new Date(p.evento?.data_evento);
      const monthName = MONTHS[date.getMonth()];
      monthlyBreakdown[monthName].eventos.push({
        nome: p.evento?.nome,
        data: p.evento?.data_evento,
        compareceu: p.compareceu,
      });
    });

    return monthlyBreakdown;
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participação por Colaborador
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="anual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="anual">Visão Anual</TabsTrigger>
            <TabsTrigger value="mensal">Por Mês</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          </TabsList>

          {/* Annual View - Bar Chart by Collaborator */}
          <TabsContent value="anual" className="space-y-4">
            {chartData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma participação registrada em {selectedYear}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 50)}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis dataKey="nome" type="category" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border rounded-lg p-3 shadow-lg">
                            <p className="font-medium mb-2">{data.nomeCompleto}</p>
                            <div className="space-y-1 text-sm">
                              <p className="text-primary">
                                Treinamentos: {data.treinamentosPercent}% ({data.treinamentosParticipou}/{data.treinamentosTotal})
                              </p>
                              <p className="text-[hsl(var(--chart-2))]">
                                Eventos: {data.eventosPercent}% ({data.eventosCompareceu}/{data.eventosTotal})
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="treinamentosPercent" name="Treinamentos %" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="eventosPercent" name="Eventos %" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          {/* Monthly View - Bar Chart by Month */}
          <TabsContent value="mensal" className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg">
                          <p className="font-medium mb-2">{data.monthFull}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-primary">
                              Treinamentos: {data.treinamentos} participações (de {data.totalTreinamentos})
                            </p>
                            <p className="text-[hsl(var(--chart-2))]">
                              Eventos: {data.eventos} presenças (de {data.totalEventos})
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="treinamentos" name="Participações Treinamentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="eventos" name="Presenças Eventos" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Detailed View - Expandable list */}
          <TabsContent value="detalhes" className="space-y-3">
            {chartData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma participação registrada em {selectedYear}
              </div>
            ) : (
              chartData.map((colab) => (
                <Collapsible
                  key={colab.id}
                  open={expandedColaborador === colab.id}
                  onOpenChange={() => setExpandedColaborador(expandedColaborador === colab.id ? null : colab.id)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{colab.nomeCompleto}</h4>
                            <div className="flex gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Treinamentos:</span>
                                <Progress value={colab.treinamentosPercent} className="w-20 h-2" />
                                <span className="text-sm font-medium">{colab.treinamentosPercent}%</span>
                                <span className="text-xs text-muted-foreground">({colab.treinamentosParticipou}/{colab.treinamentosTotal})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Eventos:</span>
                                <Progress value={colab.eventosPercent} className="w-20 h-2" />
                                <span className="text-sm font-medium">{colab.eventosPercent}%</span>
                                <span className="text-xs text-muted-foreground">({colab.eventosCompareceu}/{colab.eventosTotal})</span>
                              </div>
                            </div>
                          </div>
                          {expandedColaborador === colab.id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t p-4 space-y-4">
                        {(() => {
                          const details = getColabDetails(colab.id);
                          if (!details) return null;

                          return MONTHS.map((month) => {
                            const monthData = details[month];
                            if (monthData.treinamentos.length === 0 && monthData.eventos.length === 0) {
                              return null;
                            }

                            return (
                              <div key={month} className="space-y-2">
                                <h5 className="font-medium text-sm">{month}</h5>
                                <div className="grid gap-2 pl-4">
                                  {monthData.treinamentos.map((t: any, idx: number) => (
                                    <div key={`t-${idx}`} className="flex items-center gap-2 text-sm">
                                      <Badge variant={t.participou ? "default" : "secondary"} className="text-xs">
                                        Treinamento
                                      </Badge>
                                      <span>{t.nome}</span>
                                      <span className="text-muted-foreground">
                                        ({format(new Date(t.data), "dd/MM", { locale: ptBR })})
                                      </span>
                                      <Badge variant={t.participou ? "default" : "outline"} className="ml-auto">
                                        {t.participou ? "Participou" : "Não participou"}
                                      </Badge>
                                    </div>
                                  ))}
                                  {monthData.eventos.map((e: any, idx: number) => (
                                    <div key={`e-${idx}`} className="flex items-center gap-2 text-sm">
                                      <Badge variant="secondary" className="text-xs bg-[hsl(var(--chart-2))]/20 text-[hsl(var(--chart-2))]">
                                        Evento
                                      </Badge>
                                      <span>{e.nome}</span>
                                      <span className="text-muted-foreground">
                                        ({format(new Date(e.data), "dd/MM", { locale: ptBR })})
                                      </span>
                                      <Badge variant={e.compareceu ? "default" : "outline"} className="ml-auto">
                                        {e.compareceu ? "Compareceu" : "Não compareceu"}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }).filter(Boolean);
                        })()}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
