import { useNavigate } from "react-router-dom";
import { ChartCard } from "./ChartCard";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const recentHires = [
  {
    id: "1",
    name: "Ana Carolina Silva",
    role: "Desenvolvedora Frontend",
    department: "Tecnologia",
    date: "15 Jan 2024",
    initials: "AS",
  },
  {
    id: "2",
    name: "Pedro Henrique Lima",
    role: "Analista Financeiro",
    department: "Financeiro",
    date: "12 Jan 2024",
    initials: "PL",
  },
  {
    id: "3",
    name: "Mariana Costa",
    role: "Designer UX/UI",
    department: "Marketing",
    date: "10 Jan 2024",
    initials: "MC",
  },
  {
    id: "4",
    name: "Lucas Oliveira",
    role: "Vendedor Sênior",
    department: "Comercial",
    date: "08 Jan 2024",
    initials: "LO",
  },
  {
    id: "5",
    name: "Juliana Fernandes",
    role: "Analista de RH",
    department: "RH",
    date: "05 Jan 2024",
    initials: "JF",
  },
];

const departmentColors: Record<string, string> = {
  Tecnologia: "bg-primary/10 text-primary",
  Financeiro: "bg-warning/10 text-warning",
  Marketing: "bg-destructive/10 text-destructive",
  Comercial: "bg-success/10 text-success",
  RH: "bg-chart-4/10 text-chart-4",
  Operações: "bg-info/10 text-info",
};

export function RecentHires() {
  const navigate = useNavigate();

  return (
    <ChartCard
      title="Contratações Recentes"
      subtitle="Últimos colaboradores que entraram na empresa"
    >
      <div className="space-y-4">
        {recentHires.map((hire, index) => (
          <div
            key={index}
            onClick={() => navigate(`/employee/${hire.id}`)}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {hire.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-foreground">{hire.name}</p>
                <p className="text-xs text-muted-foreground">{hire.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className={departmentColors[hire.department]}
              >
                {hire.department}
              </Badge>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {hire.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
