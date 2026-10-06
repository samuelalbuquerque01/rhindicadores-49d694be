interface ChartNarrativeProps {
  lines: string[];
}

export function ChartNarrative({ lines }: ChartNarrativeProps) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-neutral-border bg-neutral-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-fg">Resumo automatico</p>
      <ul className="mt-2 space-y-1">
        {lines.map((line) => (
          <li key={line} className="text-sm text-foreground">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
