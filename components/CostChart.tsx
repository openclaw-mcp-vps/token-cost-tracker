'use client';

import { format, parseISO } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { DailyCostPoint } from '@/lib/types';

export function CostChart({ data }: { data: DailyCostPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => format(parseISO(value), 'MMM d')}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            axisLine={false}
            tickLine={false}
            width={85}
          />
          <Tooltip
            cursor={{ stroke: '#334155' }}
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 10 }}
            formatter={(value: number, name: string) => {
              if (name === 'cost') {
                return [`$${value.toFixed(4)}`, 'Cost'];
              }
              return [value.toLocaleString(), 'Tokens'];
            }}
            labelFormatter={(label) => format(parseISO(label), 'EEE, MMM d')}
          />
          <Area type="monotone" dataKey="cost" stroke="#34d399" strokeWidth={2} fill="url(#costGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
