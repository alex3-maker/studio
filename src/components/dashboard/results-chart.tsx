'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Duel } from '@/lib/types';

interface ResultsChartProps {
  duel: Duel;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export default function ResultsChart({ duel }: ResultsChartProps) {
  const data = duel.options.map(option => ({
    name: option.title,
    value: option.votes
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
            color: 'hsl(var(--foreground))'
          }}
          cursor={{ fill: 'hsl(var(--muted))' }}
        />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius="80%"
          innerRadius="60%"
          fill="#8884d8"
          dataKey="value"
          stroke="hsl(var(--background))"
          strokeWidth={4}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
