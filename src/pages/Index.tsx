import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, UserMinus, Clock, TrendingUp, Briefcase, Building, GraduationCap } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { TreinamentoChart } from "@/components/dashboard/TreinamentoChart";
import { TurnoverModule } from "@/components/dashboard/TurnoverModule";
import { AbsenteismoModule } from "@/components/dashboard/AbsenteismoModule";
import { FilialSelector } from "@/components/dashboard/FilialSelector";
import { FilialForm } from "@/components/forms/FilialForm";
import { ColaboradorForm } from "@/components/forms/ColaboradorForm";
import { ColaboradoresList } from "@/components/dashboard/ColaboradoresList";
import { TreinamentosList } from "@/components/dashboard/TreinamentosList";
import { TreinamentosParticipacaoTable } from "@/components/dashboard/TreinamentosParticipacaoTable";
import { TreinamentosInsightsCard } from "@/components/dashboard/TreinamentosInsightsCard";
import { ParticipacaoColaboradorChart } from "@/components/dashboard/ParticipacaoColaboradorChart";
import { VisaoGeralPanel } from "@/components/dashboard/VisaoGeralPanel";
import { useColaboradoresStats } from "@/hooks/useColaboradores";
import { useTurnoverStats } from "@/hooks/useDesligamentos";
import { useAbsenteismoStats } from "@/hooks/useAfastamentos";
import { useContratacaoStats } from "@/hooks/useContratacoes";
import { useTreinamentosStats } from "@/hooks/useTreinamentos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelinePanel } from "@/features/timeline";
import { EventsPage } from "@/features/events";

const TAB_VALUES = [
  "colaboradores",
  "estagiarios",
  "pj",
  "participacao",
  "geral",
  "treinamentos",
  "eventos",
  "turnover",
  "absenteismo",
  "timeline",
] as const;

type TabValue = (typeof TAB_VALUES)[number];

function isValidTab(value: string | null): value is TabValue {
  if (!value) return false;
  return TAB_VALUES.includes(value as TabValue);
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFilial, setSelectedFilial] = useState<string>("all");

  const initialQueryTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabValue>(
    isValidTab(initialQueryTab) ? initialQueryTab : "colaboradores",
  );

  const filialId = selectedFilial === "all" ? undefined : selectedFilial;

  const { data: colaboradoresStats } = useColaboradoresStats(filialId);
  const { data: turnoverStats } = useTurnoverStats(filialId);
  const { data: absenteismoStats } = useAbsenteismoStats(filialId);
  const { data: contratacaoStats } = useContratacaoStats(filialId);
  const { data: treinamentosStats } = useTreinamentosStats(filialId);

  useEffect(() => {
    const queryTab = searchParams.get("tab");
    if (isValidTab(queryTab) && queryTab !== activeTab) {
      setActiveTab(queryTab);
    }
  }, [activeTab, searchParams]);

  const handleTabChange = (value: string) => {
    if (!isValidTab(value)) return;

    setActiveTab(value);

    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo principal
      </a>
      <Header />

      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="container mx-auto px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
              Dashboard de RH
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Indicadores e metricas do Departamento Pessoal
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <FilialSelector value={selectedFilial} onValueChange={setSelectedFilial} />
            <FilialForm />
            <ColaboradorForm />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total de Colaboradores"
            value={colaboradoresStats?.ativos || 0}
            subtitle="Ativos na empresa"
            icon={<Users className="h-6 w-6" />}
            variant="primary"
          />
          <StatCard
            title="Taxa de Turnover"
            value={`${turnoverStats?.turnoverPercentual || 0}%`}
            subtitle="Ultimos 12 meses"
            icon={<UserMinus className="h-6 w-6" />}
            variant="success"
          />
          <StatCard
            title="Absenteismo"
            value={`${absenteismoStats?.taxaAbsenteismo || 0}%`}
            subtitle="Taxa de ausencias (30 dias)"
            icon={<Clock className="h-6 w-6" />}
            variant="warning"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Treinamentos"
            value={treinamentosStats?.totalTreinamentos || 0}
            subtitle={`Taxa: ${treinamentosStats?.taxaParticipacao || 0}%`}
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <StatCard
            title="Novas Contratacoes"
            value={contratacaoStats?.novasContratacoes || 0}
            subtitle="Este mes"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="Lideres"
            value={colaboradoresStats?.lideres || 0}
            subtitle="Formados pela empresa"
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatCard
            title="CLT Proprios"
            value={(colaboradoresStats?.porTipo.administrativo || 0) + (colaboradoresStats?.porTipo.corpoClinico || 0)}
            subtitle="Admin + Corpo Clinico"
            icon={<Building className="h-5 w-5" />}
          />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="mb-6 overflow-x-auto">
            <TabsList className="h-auto min-w-max flex-nowrap gap-1">
              <TabsTrigger value="colaboradores">CLT</TabsTrigger>
              <TabsTrigger value="estagiarios">Estagiarios</TabsTrigger>
              <TabsTrigger value="pj">PJ</TabsTrigger>
              <TabsTrigger value="participacao">Participacao</TabsTrigger>
              <TabsTrigger value="geral">Visao Geral</TabsTrigger>
              <TabsTrigger value="treinamentos">Treinamentos</TabsTrigger>
              <TabsTrigger value="eventos">Eventos</TabsTrigger>
              <TabsTrigger value="turnover">Turnover</TabsTrigger>
              <TabsTrigger value="absenteismo">Absenteismo</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="colaboradores" className="space-y-6">
            <ColaboradoresList filialId={selectedFilial} tipoFilter="CLT" showSysteaSync />
          </TabsContent>

          <TabsContent value="estagiarios" className="space-y-6">
            <ColaboradoresList filialId={selectedFilial} tipoFilter="Estagiário" />
          </TabsContent>

          <TabsContent value="pj" className="space-y-6">
            <ColaboradoresList filialId={selectedFilial} tipoFilter="PJ" />
          </TabsContent>

          <TabsContent value="participacao" className="space-y-6">
            <ParticipacaoColaboradorChart filialId={selectedFilial} />
          </TabsContent>

          <TabsContent value="geral" className="space-y-6">
            <VisaoGeralPanel filialId={selectedFilial} />
          </TabsContent>

          <TabsContent value="treinamentos" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <TreinamentoChart filialId={selectedFilial} />
                <TreinamentosParticipacaoTable filialId={selectedFilial} />
              </div>
              <div className="space-y-6">
                <TreinamentosInsightsCard filialId={selectedFilial} />
                <TreinamentosList filialId={selectedFilial} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="eventos" className="space-y-6">
            <EventsPage filialId={selectedFilial} />
          </TabsContent>

          <TabsContent value="turnover" className="space-y-6">
            <TurnoverModule filialId={selectedFilial} />
          </TabsContent>

          <TabsContent value="absenteismo" className="space-y-6">
            <AbsenteismoModule filialId={selectedFilial} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <TimelinePanel filialId={filialId} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-12 border-t border-border">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            © 2024 RH Analytics. Sistema de Gestao de Recursos Humanos.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
