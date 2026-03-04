import { useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectorComparisonRow } from "@/lib/analytics/sector";

type SortColumn =
  | "sector"
  | "absenteeismDays"
  | "absenteeismRate"
  | "turnoverRate"
  | "dismissals";

interface SectorComparisonTableProps {
  rows: SectorComparisonRow[];
}

export function SectorComparisonTable({ rows }: SectorComparisonTableProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortColumn>("absenteeismDays");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const base = normalizedSearch.length === 0
      ? rows
      : rows.filter((row) => row.sector.toLowerCase().includes(normalizedSearch));

    const sorted = [...base].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [rows, search, sortBy, sortDirection]);

  const toggleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(column);
    setSortDirection(column === "sector" ? "asc" : "desc");
  };

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Comparacao entre setores</h3>
          <p className="text-sm text-muted-foreground">Comparativo de absenteismo, turnover e desligamentos</p>
        </div>
        <Input
          placeholder="Filtrar por setor"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:w-64"
        />
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
          Nenhum setor encontrado para este filtro.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <SortableHeader label="Setor" active={sortBy === "sector"} onClick={() => toggleSort("sector")} />
                <SortableHeader
                  label="Dias de afastamento"
                  active={sortBy === "absenteeismDays"}
                  onClick={() => toggleSort("absenteeismDays")}
                />
                <SortableHeader
                  label="Taxa de absenteismo"
                  active={sortBy === "absenteeismRate"}
                  onClick={() => toggleSort("absenteeismRate")}
                />
                <SortableHeader
                  label="Taxa de turnover"
                  active={sortBy === "turnoverRate"}
                  onClick={() => toggleSort("turnoverRate")}
                />
                <SortableHeader
                  label="Desligamentos"
                  active={sortBy === "dismissals"}
                  onClick={() => toggleSort("dismissals")}
                />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.sector} className="border-b border-border/60 hover:bg-slate-50">
                  <td className="py-3 pr-4 font-medium text-foreground">{row.sector}</td>
                  <td className="py-3 pr-4">{row.absenteeismDays.toFixed(0)}</td>
                  <td className="py-3 pr-4">{row.absenteeismRate.toFixed(2)}%</td>
                  <td className="py-3 pr-4">{row.turnoverRate.toFixed(2)}%</td>
                  <td className="py-3 pr-4">{row.dismissals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <th className="py-2 pr-4 text-left">
      <Button variant="ghost" size="sm" className="h-7 px-1 text-xs" onClick={onClick}>
        {label}
        {active ? <ArrowDownAZ className="h-3.5 w-3.5 ml-1" /> : <ArrowUpAZ className="h-3.5 w-3.5 ml-1" />}
      </Button>
    </th>
  );
}
