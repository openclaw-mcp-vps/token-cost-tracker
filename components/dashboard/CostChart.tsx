"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CostChartProps {
  daily: Array<{ day: string; costUsd: number; tokens: number }>;
  providerBreakdown: Array<{ provider: string; costUsd: number }>;
}

export function CostChart({ daily, providerBreakdown }: CostChartProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Daily Spend</CardTitle>
          <CardDescription>USD burn across all providers over the selected period.</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2ea043" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2ea043" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="#8b949e" />
              <YAxis stroke="#8b949e" />
              <Tooltip
                contentStyle={{
                  background: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 8
                }}
              />
              <Area type="monotone" dataKey="costUsd" stroke="#3fb950" fill="url(#costGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider Mix</CardTitle>
          <CardDescription>Current period spend by provider.</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={providerBreakdown}>
              <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
              <XAxis dataKey="provider" stroke="#8b949e" />
              <YAxis stroke="#8b949e" />
              <Tooltip
                contentStyle={{
                  background: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 8
                }}
              />
              <Legend />
              <Bar dataKey="costUsd" fill="#58a6ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
