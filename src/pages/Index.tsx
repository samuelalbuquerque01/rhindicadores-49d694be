import { Users, UserMinus, Clock, DollarSign, TrendingUp, Briefcase } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmployeeChart } from "@/components/dashboard/EmployeeChart";
import { DepartmentChart } from "@/components/dashboard/DepartmentChart";
import { GenderChart } from "@/components/dashboard/GenderChart";
import { AbsenceChart } from "@/components/dashboard/AbsenceChart";
import { RecentHires } from "@/components/dashboard/RecentHires";
import { PayrollSummary } from "@/components/dashboard/PayrollSummary";
import { AddEmployeeModal } from "@/components/dashboard/AddEmployeeModal";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard de RH
            </h1>
            <p className="text-muted-foreground mt-1">
              Indicadores e métricas do Departamento Pessoal
            </p>
          </div>
          <AddEmployeeModal />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Colaboradores"
            value="330"
            subtitle="Ativos na empresa"
            icon={<Users className="h-6 w-6" />}
            trend={{ value: 4.2, isPositive: true }}
            variant="primary"
          />
          <StatCard
            title="Taxa de Turnover"
            value="2.8%"
            subtitle="Rotatividade mensal"
            icon={<UserMinus className="h-6 w-6" />}
            trend={{ value: -0.5, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="Absenteísmo"
            value="3.2%"
            subtitle="Taxa de ausências"
            icon={<Clock className="h-6 w-6" />}
            trend={{ value: 0.8, isPositive: false }}
            variant="warning"
          />
          <StatCard
            title="Custo por Colaborador"
            value="R$ 8.2k"
            subtitle="Média mensal"
            icon={<DollarSign className="h-6 w-6" />}
            trend={{ value: 2.1 }}
            variant="info"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Novas Contratações"
            value="25"
            subtitle="Este mês"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Desligamentos"
            value="10"
            subtitle="Este mês"
            icon={<UserMinus className="h-5 w-5" />}
            trend={{ value: -8.3, isPositive: true }}
          />
          <StatCard
            title="Vagas Abertas"
            value="18"
            subtitle="Em processo seletivo"
            icon={<Briefcase className="h-5 w-5" />}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <EmployeeChart />
          <DepartmentChart />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <GenderChart />
          <div className="lg:col-span-2">
            <AbsenceChart />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentHires />
          <PayrollSummary />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 RH Analytics. Todos os dados são ilustrativos.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
