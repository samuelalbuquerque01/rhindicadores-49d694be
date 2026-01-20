import { ChartCard } from "./ChartCard";
import { DollarSign, TrendingUp, Users, Briefcase } from "lucide-react";

const payrollData = [
  {
    label: "Folha Total",
    value: "R$ 2.450.000",
    change: "+5.2%",
    icon: DollarSign,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Média Salarial",
    value: "R$ 7.424",
    change: "+3.1%",
    icon: TrendingUp,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    label: "Benefícios",
    value: "R$ 485.000",
    change: "+2.8%",
    icon: Briefcase,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    label: "Horas Extras",
    value: "R$ 125.000",
    change: "-1.5%",
    icon: Users,
    color: "text-info",
    bgColor: "bg-info/10",
  },
];

export function PayrollSummary() {
  return (
    <ChartCard
      title="Resumo da Folha de Pagamento"
      subtitle="Visão geral dos custos com pessoal"
    >
      <div className="grid grid-cols-2 gap-4">
        {payrollData.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{item.value}</p>
            <p
              className={`text-sm mt-1 ${
                item.change.startsWith("+") ? "text-success" : "text-destructive"
              }`}
            >
              {item.change} vs mês anterior
            </p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
