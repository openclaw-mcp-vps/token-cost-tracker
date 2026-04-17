"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type CostChartPoint = {
  date: string;
  costUsd: number;
};

export function CostChart({ data }: { data: CostChartPoint[] }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="text-lg font-semibold text-slate-100">Daily Spend Trend</h2>
      <p className="mt-1 text-sm text-slate-400">Monitor yesterday-to-today cost slope to catch runaway burn.</p>
      <div className="mt-5 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${Number(value).toFixed(0)}`} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "10px" }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
            />
            <Line type="monotone" dataKey="costUsd" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
