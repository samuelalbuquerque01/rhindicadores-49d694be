import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, 
  Clock, 
  Palmtree, 
  Baby, 
  HelpCircle 
} from "lucide-react";
import { AfastamentoAtivo } from "@/hooks/useAfastamentoAtivo";

interface AfastamentoBadgeProps {
  afastamento: AfastamentoAtivo;
  showDates?: boolean;
}

const tipoConfig: Record<string, { 
  label: string; 
  icon: React.ElementType; 
  className: string;
}> = {
  "Atestado médico": {
    label: "Atestado",
    icon: Stethoscope,
    className: "bg-danger-soft text-danger-fg border-danger-border",
  },
  "Banco de horas": {
    label: "Banco de horas",
    icon: Clock,
    className: "bg-info-soft text-info-fg border-info-border",
  },
  "Férias": {
    label: "Férias",
    icon: Palmtree,
    className: "bg-success-soft text-success-fg border-success-border",
  },
  "Licença maternidade": {
    label: "Licença maternidade",
    icon: Baby,
    className: "bg-primary-soft text-primary-fg border-primary-border",
  },
  "Licença paternidade": {
    label: "Licença paternidade",
    icon: Baby,
    className: "bg-info-soft text-info-fg border-info-border",
  },
  "Outro": {
    label: "Outro",
    icon: HelpCircle,
    className: "bg-neutral-soft text-neutral-fg border-neutral-border",
  },
};

export function AfastamentoBadge({ afastamento, showDates = false }: AfastamentoBadgeProps) {
  const config = tipoConfig[afastamento.tipo] || tipoConfig["Outro"];
  const Icon = config.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} flex items-center gap-1 text-xs font-medium`}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
      {showDates && (
        <span className="opacity-75">
          ({formatDate(afastamento.data_inicio)} - {formatDate(afastamento.data_fim)})
        </span>
      )}
    </Badge>
  );
}
