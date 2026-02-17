import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartCard } from "./ChartCard";

const data = [
  { name: "Tecnologia", value: 85, color: "hsl(217, 91%, 50%)" },
  { name: "Comercial", value: 62, color: "hsl(142, 76%, 36%)" },
  { name: "Financeiro", value: 45, color: "hsl(38, 92%, 50%)" },
  { name: "RH", value: 28, color: "hsl(280, 65%, 60%)" },
  { name: "Operações", value: 72, color: "hsl(199, 89%, 48%)" },
  { name: "Marketing", value: 38, color: "hsl(0, 84%, 60%)" },
];

export function DepartmentChart() {
  return (
    <ChartCard
      title="Colaboradores por Departamento"
      subtitle="Distribuição atual do quadro de funcionários"
    >
      <div className="h-[250px] sm:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(214, 32%, 91%)"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }}
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 32%, 91%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number) => [`${value} colaboradores`, "Total"]}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
