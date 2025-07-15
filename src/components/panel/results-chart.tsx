
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Duel } from '@/lib/types';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';

interface ResultsChartProps {
  duel: Duel;
}

const getChartColors = (theme: string | undefined) => {
  if (theme === 'dark') {
    return ['hsl(197 75% 52%)', 'hsl(31 87% 55%)'];
  }
  return ['hsl(197 75% 52%)', 'hsl(31 87% 55%)'];
};

export default function ResultsChart({ duel }: ResultsChartProps) {
  const { theme } = useTheme();
  const colors = useMemo(() => getChartColors(theme), [theme]);

  const data = duel.options.map(option => ({
    name: option.title,
    value: option.votes
  }));
  
  const totalVotes = data.reduce((acc, curr) => acc + curr.value, 0);
  if (totalVotes === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full text-xs text-muted-foreground">
        Sin votos
      </div>
    );
  }

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
          outerRadius="90%"
          innerRadius="60%"
          fill="#8884d8"
          dataKey="value"
          stroke="hsl(var(--background))"
          strokeWidth={4}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
