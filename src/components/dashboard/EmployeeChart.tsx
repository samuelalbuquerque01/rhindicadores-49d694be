import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";

const data = [
  { month: "Jan", contratações: 12, desligamentos: 5 },
  { month: "Fev", contratações: 8, desligamentos: 7 },
  { month: "Mar", contratações: 15, desligamentos: 4 },
  { month: "Abr", contratações: 10, desligamentos: 6 },
  { month: "Mai", contratações: 18, desligamentos: 3 },
  { month: "Jun", contratações: 14, desligamentos: 8 },
  { month: "Jul", contratações: 20, desligamentos: 5 },
  { month: "Ago", contratações: 16, desligamentos: 9 },
  { month: "Set", contratações: 22, desligamentos: 6 },
  { month: "Out", contratações: 11, desligamentos: 7 },
  { month: "Nov", contratações: 19, desligamentos: 4 },
  { month: "Dez", contratações: 25, desligamentos: 10 },
];

export function EmployeeChart() {
  return (
    <ChartCard
      title="Movimentação de Pessoal"
      subtitle="Contratações e desligamentos ao longo do ano"
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorContratacoes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDesligamentos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 32%, 91%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="contratações"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorContratacoes)"
            />
            <Area
              type="monotone"
              dataKey="desligamentos"
              stroke="hsl(0, 84%, 60%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDesligamentos)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Contratações</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span className="text-sm text-muted-foreground">Desligamentos</span>
        </div>
      </div>
    </ChartCard>
  );
}
