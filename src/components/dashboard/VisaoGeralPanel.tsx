import { OverviewDashboard } from "@/features/overview";

interface VisaoGeralPanelProps {
  filialId?: string;
}

export function VisaoGeralPanel({ filialId }: VisaoGeralPanelProps) {
  const resolvedFilialId = filialId === "all" ? undefined : filialId;

  return <OverviewDashboard filialId={resolvedFilialId} />;
}
