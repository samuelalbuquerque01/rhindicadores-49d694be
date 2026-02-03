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
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  "Banco de horas": {
    label: "Banco de horas",
    icon: Clock,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  "Férias": {
    label: "Férias",
    icon: Palmtree,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800",
  },
  "Licença maternidade": {
    label: "Licença maternidade",
    icon: Baby,
    className: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  },
  "Licença paternidade": {
    label: "Licença paternidade",
    icon: Baby,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  "Outro": {
    label: "Outro",
    icon: HelpCircle,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
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
