import { useState } from "react";
import { Users, UserMinus, Clock, TrendingUp, Briefcase, Building, GraduationCap } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { TreinamentoChart } from "@/components/dashboard/TreinamentoChart";
import { TurnoverChart } from "@/components/dashboard/TurnoverChart";
import { TurnoverModule } from "@/components/dashboard/TurnoverModule";
import { AbsenteismoDetailChart } from "@/components/dashboard/AbsenteismoDetailChart";
import { AbsenteismoModule } from "@/components/dashboard/AbsenteismoModule";
import { ColaboradoresChart } from "@/components/dashboard/ColaboradoresChart";
import { LideresChart } from "@/components/dashboard/LideresChart";
import { EventosChart } from "@/components/dashboard/EventosChart";
import { NovasContratacoesCard } from "@/components/dashboard/NovasContratacoesCard";
import { FilialSelector } from "@/components/dashboard/FilialSelector";
import { FilialForm } from "@/components/forms/FilialForm";
import { ColaboradorForm } from "@/components/forms/ColaboradorForm";
import { ColaboradoresList } from "@/components/dashboard/ColaboradoresList";
import { AfastamentosList } from "@/components/dashboard/AfastamentosList";
import { TreinamentosList } from "@/components/dashboard/TreinamentosList";
import { EventosList } from "@/components/dashboard/EventosList";
import { ParticipacaoColaboradorChart } from "@/components/dashboard/ParticipacaoColaboradorChart";
import { useColaboradoresStats } from "@/hooks/useColaboradores";
import { useTurnoverStats } from "@/hooks/useDesligamentos";
import { useAbsenteismoStats } from "@/hooks/useAfastamentos";
import { useContratacaoStats } from "@/hooks/useContratacoes";
import { useTreinamentosStats } from "@/hooks/useTreinamentos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [selectedFilial, setSelectedFilial] = useState<string>("all");
  const filialId = selectedFilial === "all" ? undefined : selectedFilial;

  const { data: colaboradoresStats } = useColaboradoresStats(filialId);
  const { data: turnoverStats } = useTurnoverStats(filialId);
  const { data: absenteismoStats } = useAbsenteismoStats(filialId);
  const { data: contratacaoStats } = useContratacaoStats(filialId);
  const { data: treinamentosStats } = useTreinamentosStats(filialId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title with Filters */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard de RH
            </h1>
            <p className="text-muted-foreground mt-1">
              Indicadores e métricas do Departamento Pessoal
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <FilialSelector
              value={selectedFilial}
              onValueChange={setSelectedFilial}
            />
            <FilialForm />
            <ColaboradorForm />
          </div>
        </div>

        {/* KPI Cards */}
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
            subtitle="Últimos 12 meses"
            icon={<UserMinus className="h-6 w-6" />}
            variant="success"
          />
          <StatCard
            title="Absenteísmo"
            value={`${absenteismoStats?.taxaAbsenteismo || 0}%`}
            subtitle="Taxa de ausências (30 dias)"
            icon={<Clock className="h-6 w-6" />}
            variant="warning"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Treinamentos"
            value={treinamentosStats?.totalTreinamentos || 0}
            subtitle={`Taxa: ${treinamentosStats?.taxaParticipacao || 0}%`}
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <StatCard
            title="Novas Contratações"
            value={contratacaoStats?.novasContratacoes || 0}
            subtitle="Este mês"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="Líderes"
            value={colaboradoresStats?.lideres || 0}
            subtitle="Formados pela empresa"
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatCard
            title="CLT Próprios"
            value={(colaboradoresStats?.porTipo.administrativo || 0) + (colaboradoresStats?.porTipo.corpoClinico || 0)}
            subtitle="Admin + Corpo Clínico"
            icon={<Building className="h-5 w-5" />}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="colaboradores" className="w-full">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="colaboradores">CLT</TabsTrigger>
            <TabsTrigger value="estagiarios">Estagiários</TabsTrigger>
            <TabsTrigger value="pj">PJ</TabsTrigger>
            <TabsTrigger value="participacao">Participação</TabsTrigger>
            <TabsTrigger value="geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="treinamentos">Treinamentos</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
            <TabsTrigger value="turnover">Turnover</TabsTrigger>
            <TabsTrigger value="absenteismo">Absenteísmo</TabsTrigger>
          </TabsList>

          <TabsContent value="colaboradores" className="space-y-6">
            <ColaboradoresList filialId={selectedFilial} tipoFilter="CLT" />
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
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ColaboradoresChart filialId={selectedFilial} />
              <LideresChart filialId={selectedFilial} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TurnoverChart filialId={selectedFilial} />
              <div className="lg:col-span-2">
                <AbsenteismoDetailChart filialId={selectedFilial} />
              </div>
            </div>

            {/* Charts Row 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EventosChart filialId={selectedFilial} />
              <NovasContratacoesCard filialId={selectedFilial} />
            </div>
          </TabsContent>

          <TabsContent value="treinamentos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TreinamentoChart filialId={selectedFilial} />
              <div className="lg:col-span-2">
                <TreinamentosList filialId={selectedFilial} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="eventos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <EventosChart filialId={selectedFilial} />
              <div className="lg:col-span-2">
                <EventosList filialId={selectedFilial} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="turnover" className="space-y-6">
            <TurnoverModule filialId={selectedFilial} />
          </TabsContent>

          <TabsContent value="absenteismo" className="space-y-6">
            <AbsenteismoModule filialId={selectedFilial} />
          </TabsContent>

        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 RH Analytics. Sistema de Gestão de Recursos Humanos.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
