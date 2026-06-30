"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DATA = [
  { dia: 1,  valor: 72 }, { dia: 2,  valor: 68 }, { dia: 3,  valor: 75 },
  { dia: 4,  valor: 82 }, { dia: 5,  valor: 78 }, { dia: 6,  valor: 85 },
  { dia: 7,  valor: 80 }, { dia: 8,  valor: 77 }, { dia: 9,  valor: 83 },
  { dia: 10, valor: 79 }, { dia: 11, valor: 86 }, { dia: 12, valor: 82 },
  { dia: 13, valor: 88 }, { dia: 14, valor: 82 },
];

export default function MiniGrafico() {
  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={DATA} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="dia" hide />
          <YAxis hide domain={[55, 95]} />
          <Tooltip
            contentStyle={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e5e7eb" }}
            formatter={(value) => [`${value}%`, "Humedad"]}
            labelFormatter={(label) => `Día ${label}`}
          />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="#2E7D32"
            strokeWidth={2}
            dot={{ fill: "#2E7D32", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#2E7D32" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
