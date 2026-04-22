"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toCurrency, formatInt } from "@/lib/utils";

interface CostPoint {
  date: string;
  costUsd: number;
  totalTokens: number;
  requests: number;
}

interface ProviderPoint {
  provider: string;
  costUsd: number;
  totalTokens: number;
}

interface CostChartProps {
  daily: CostPoint[];
  providers: ProviderPoint[];
}

export function CostChart({ daily, providers }: CostChartProps): React.JSX.Element {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Daily Spend Curve</CardTitle>
          <CardDescription>Track spikes before they become month-end surprises.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid stroke="#213046" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  background: "#0b1624",
                  border: "1px solid #223247",
                  borderRadius: 10,
                  color: "#e2e8f0",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "costUsd") {
                    return [toCurrency(value), "Cost"];
                  }
                  if (name === "totalTokens") {
                    return [formatInt(value), "Tokens"];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="costUsd"
                name="Daily Cost"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="totalTokens"
                name="Daily Tokens"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                yAxisId={1}
              />
              <YAxis yAxisId={1} hide />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider Mix</CardTitle>
          <CardDescription>Compare where your spend is concentrated.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={providers} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="#213046" strokeDasharray="3 3" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}`} />
              <YAxis
                type="category"
                dataKey="provider"
                stroke="#94a3b8"
                fontSize={12}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  background: "#0b1624",
                  border: "1px solid #223247",
                  borderRadius: 10,
                  color: "#e2e8f0",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "costUsd") {
                    return [toCurrency(value), "Cost"];
                  }
                  return [formatInt(value), "Tokens"];
                }}
              />
              <Bar dataKey="costUsd" name="Cost" fill="#f97316" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
