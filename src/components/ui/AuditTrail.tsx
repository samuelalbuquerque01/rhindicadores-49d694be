import { History, UserCircle2 } from "lucide-react";
import { AuditTrailData } from "@/lib/analytics/audit";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditTrailProps {
  trail: AuditTrailData;
  maxItems?: number;
}

function formatRelative(isoDate: string): string {
  try {
    return formatDistanceToNow(parseISO(isoDate), { addSuffix: true, locale: ptBR });
  } catch {
    return isoDate;
  }
}

export function AuditTrail({ trail, maxItems = 8 }: AuditTrailProps) {
  return (
    <section className="space-y-3 rounded-md border bg-muted/20 p-3">
      <header className="flex items-center gap-2 text-sm font-medium">
        <History className="h-4 w-4" />
        Historico de alteracoes
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
        <p>
          Criado {formatRelative(trail.createdAt)} por {trail.createdBy}
        </p>
        <p>
          Atualizado {formatRelative(trail.updatedAt)} por {trail.updatedBy}
        </p>
      </div>

      {trail.changes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem alteracoes registradas ate o momento.</p>
      ) : (
        <ul className="space-y-2">
          {trail.changes.slice(0, maxItems).map((change, index) => (
            <li key={`${change.field}-${change.changedAt}-${index}`} className="rounded-md border bg-background p-2">
              <p className="text-xs font-medium text-foreground">{change.field}</p>
              <p className="text-xs text-muted-foreground">
                de "{change.fromValue}" para "{change.toValue}"
              </p>
              <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-1">
                <UserCircle2 className="h-3 w-3" />
                {change.changedBy} - {formatRelative(change.changedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
