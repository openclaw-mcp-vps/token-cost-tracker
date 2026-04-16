"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CostChartProps {
  data: Array<{ date: string; cost: number }>;
}

export function CostChart({ data }: CostChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>14-Day Cost Trend</CardTitle>
        <CardDescription>Watch token spend spikes before they become monthly surprises.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="cost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f81f7" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#2f81f7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="date" stroke="#9da7b3" />
              <YAxis stroke="#9da7b3" />
              <Tooltip
                contentStyle={{
                  background: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 8,
                  color: "#e6edf3",
                }}
                formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Cost"]}
              />
              <Area type="monotone" dataKey="cost" stroke="#2f81f7" fill="url(#cost)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
