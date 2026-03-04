interface ChartNarrativeProps {
  lines: string[];
}

export function ChartNarrative({ lines }: ChartNarrativeProps) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Automatic summary</p>
      <ul className="mt-2 space-y-1">
        {lines.map((line) => (
          <li key={line} className="text-sm text-slate-700">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
