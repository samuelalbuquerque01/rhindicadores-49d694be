import { AlertTriangle, CheckCircle2, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TrafficLightStatus = "ok" | "attention" | "critical";

interface StatusTrafficLightProps {
  label: string;
  value: number;
  target: number;
  className?: string;
}

function resolveTrafficLightStatus(value: number, target: number): TrafficLightStatus {
  if (value <= target) return "ok";
  if (value <= target * 1.2) return "attention";
  return "critical";
}

function statusLabel(status: TrafficLightStatus): string {
  if (status === "ok") return "OK";
  if (status === "attention") return "Atencao";
  return "Critico";
}

export function StatusTrafficLight({ label, value, target, className }: StatusTrafficLightProps) {
  const status = resolveTrafficLightStatus(value, target);

  return (
    <div className={cn("rounded-lg border p-3 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Badge
          variant="secondary"
          className={cn(
            status === "ok" && "bg-emerald-100 text-emerald-700",
            status === "attention" && "bg-amber-100 text-amber-700",
            status === "critical" && "bg-red-100 text-red-700",
          )}
        >
          {status === "ok" ? (
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          ) : status === "attention" ? (
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
          ) : (
            <Siren className="h-3.5 w-3.5 mr-1" />
          )}
          {statusLabel(status)}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Atual: {value.toFixed(2)}% | Meta: {target.toFixed(2)}%
      </p>
    </div>
  );
}
