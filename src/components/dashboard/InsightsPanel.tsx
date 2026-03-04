import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { InsightItem } from "@/lib/analytics/insights";
import { cn } from "@/lib/utils";

interface InsightsPanelProps {
  insights: InsightItem[];
  title?: string;
  emptyHint?: string;
}

export function InsightsPanel({
  insights,
  title = "Insights de RH",
  emptyHint = "Sem insights para este periodo. Tente ampliar o intervalo.",
}: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {emptyHint}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">Analise automatica baseada nos dados do periodo</p>
      </div>
      <div className="space-y-3">
        {insights.map((insight) => (
          <article
            key={insight.id}
            className={cn(
              "rounded-lg border p-3",
              insight.tone === "positive" && "border-emerald-200 bg-emerald-50",
              insight.tone === "warning" && "border-red-200 bg-red-50",
              insight.tone === "neutral" && "border-slate-200 bg-slate-50",
            )}
          >
            <div className="flex items-center gap-2">
              {insight.tone === "positive" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              ) : insight.tone === "warning" ? (
                <AlertTriangle className="h-4 w-4 text-red-700" />
              ) : (
                <Lightbulb className="h-4 w-4 text-slate-700" />
              )}
              <h4 className="text-sm font-semibold text-foreground">{insight.title}</h4>
            </div>
            <p className="mt-2 text-sm text-slate-700">{insight.description}</p>
            {insight.suggestedAction ? (
              <div className="mt-2 rounded-md border border-dashed bg-white/50 px-2.5 py-2">
                <p className="text-xs font-semibold text-foreground">Acao sugerida</p>
                <p className="text-xs text-slate-700 mt-0.5">{insight.suggestedAction}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
