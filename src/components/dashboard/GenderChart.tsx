import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "./ChartCard";

const genderData = [
  { name: "Masculino", value: 185, color: "hsl(217, 91%, 50%)" },
  { name: "Feminino", value: 145, color: "hsl(280, 65%, 60%)" },
];

const ageData = [
  { name: "18-25", value: 45, color: "hsl(199, 89%, 48%)" },
  { name: "26-35", value: 125, color: "hsl(142, 76%, 36%)" },
  { name: "36-45", value: 98, color: "hsl(38, 92%, 50%)" },
  { name: "46-55", value: 42, color: "hsl(280, 65%, 60%)" },
  { name: "55+", value: 20, color: "hsl(0, 84%, 60%)" },
];

export function GenderChart() {
  const total = genderData.reduce((acc, item) => acc + item.value, 0);

  return (
    <ChartCard title="Diversidade" subtitle="Distribuição por gênero e faixa etária">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2 text-center">
            Por Gênero
          </p>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(214, 32%, 91%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [
                    `${value} (${((value / total) * 100).toFixed(1)}%)`,
                    "",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {genderData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2 text-center">
            Por Faixa Etária
          </p>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(214, 32%, 91%)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
            {ageData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
