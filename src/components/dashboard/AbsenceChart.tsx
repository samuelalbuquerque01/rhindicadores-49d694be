import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";

const data = [
  { month: "Jan", taxa: 3.2 },
  { month: "Fev", taxa: 2.8 },
  { month: "Mar", taxa: 4.1 },
  { month: "Abr", taxa: 3.5 },
  { month: "Mai", taxa: 2.9 },
  { month: "Jun", taxa: 3.8 },
  { month: "Jul", taxa: 4.5 },
  { month: "Ago", taxa: 3.2 },
  { month: "Set", taxa: 2.6 },
  { month: "Out", taxa: 3.0 },
  { month: "Nov", taxa: 2.4 },
  { month: "Dez", taxa: 3.8 },
];

export function AbsenceChart() {
  return (
    <ChartCard
      title="Taxa de Absenteísmo"
      subtitle="Percentual mensal de ausências"
    >
      <div className="h-[180px] sm:h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 32%, 91%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number) => [`${value}%`, "Taxa"]}
            />
            <Line
              type="monotone"
              dataKey="taxa"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2.5}
              dot={{ fill: "hsl(38, 92%, 50%)", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(38, 92%, 50%)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
